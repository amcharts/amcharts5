import type { ITimeInterval } from "../../core/util/Time";
import type { Grid } from "../xy/axes/Grid";

import { Button } from "../../core/render/Button";
import { ConfirmButton } from "../../core/render/ConfirmButton";
import { Graphics } from "../../core/render/Graphics";
import { Percent, percent } from "../../core/util/Percent";
import { GanttDateAxis, IGanttDateAxisDataItem } from "./GanttDateAxis";
import { XYChart } from "../xy/XYChart";
import { GanttDefaultTheme } from "./GanttDefaultTheme";
import { GanttSeries } from "./GanttSeries";
import { color, Color, ColorSet, Container, DataItem, IContainerEvents, IContainerPrivate, IContainerSettings, Rectangle, Scrollbar, Tooltip } from "../../..";
import { GanttCategoryAxis, IGanttCategoryAxisDataItem } from "./GanttCategoryAxis";
import { GanttCategoryAxisRenderer } from "./GanttCategoryAxisRenderer";
import { GanttDateAxisRenderer } from "./GanttDateAxisRenderer";
import { XYCursor } from "../xy/XYCursor";
import { ColorPicker } from "../../plugins/colorPicker/ColorPicker";
import { ColorPickerButton } from "../../plugins/colorPicker/ColorPickerButton";
import { registry } from "../../core/Registry";

import * as $utils from "../../core/util/Utils";
import * as $array from "../../core/util/Array";
import * as $time from "../../core/util/Time";

export interface IGanttSettings extends IContainerSettings {

	/**
	 * Lets the user add, move, resize, link, recolor and delete tasks. When
	 * `false`, the toolbar's editing buttons, grips and bullets are hidden.
	 *
	 * @default true
	 */
	editable?: boolean;

	/**
	 * Time unit of task durations. It is also the base interval of the date
	 * axes and the unit bars snap to.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Duration_units} for more information
	 * @default "day"
	 */
	durationUnit?: "year" | "month" | "week" | "day" | "hour" | "minute" | "second";

	/**
	 * Days of the week that are not working days: `0` is Sunday, `6` Saturday.
	 * The lower date axis shades them when it shows days.
	 *
	 * @default [0, 6]
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Weekends_and_holidays} for more information
	 */
	weekends?: Array<number>;

	/**
	 * Dates that are not working days. Each covers the 24 hours from its time.
	 * Used only while `excludeWeekends` is on.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Weekends_and_holidays} for more information
	 */
	holidays?: Array<Date>;

	/**
	 * Task durations count working days only: a task that would start on one
	 * of the `weekends` days or on a `holidays` date starts on the next working
	 * day, and its duration skips them. Set to `false` to count every day.
	 *
	 * @default true
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Weekends_and_holidays} for more information
	 */
	excludeWeekends?: boolean;

	/**
	 * Width of the task list on the left, in pixels or as a percent of the
	 * chart's width. It is never narrower than the task axis's `minWidth`
	 * (100 pixels if not set).
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Category_axis_width} for more information
	 * @default 30%
	 */
	sidebarWidth?: number | Percent;

	/**
	 * Where within a time unit a dragged or resized bar edge snaps to the next
	 * unit: `0` is the unit's start, `1` its end. A bar's start snaps forward
	 * once past `snapThreshold`, its end once past `1 - snapThreshold`, so
	 * `0.5` snaps both to the nearest unit.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Snapping_behavior} for more information
	 * @default 0.5
	 */
	snapThreshold?: number;

	/**
	 * Colors for top-level tasks that have no `color` in data. Subtasks take
	 * their parent's color.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Series_colors} for more info
	 */
	colors?: ColorSet;

	/**
	 * Grid intervals of the lower date axis for each time unit of the upper
	 * axis's grid: while the upper axis shows weeks, the lower one picks from
	 * the `week` list, and so on.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Timeline_horizontal_axis} for more info
	 */
	gridIntervals?: { [index: string]: Array<ITimeInterval> };

	/**
	 * Links each newly added task to the previous task at the same level.
	 *
	 * @default true
	 */
	linkNewTasks?: boolean;
}

export interface IGanttPrivate extends IContainerPrivate { }

export interface IGanttEvents extends IContainerEvents {
	/**
	 * A date was marked on the lower date axis, by a click or by `markDate()`.
	 */
	datemarked: { date: number | undefined, dataItem: DataItem<IGanttDateAxisDataItem> };
	/**
	 * A date mark was removed, by a click or by `unmarkDate()`.
	 */
	dateunmarked: { date: number | undefined, dataItem?: DataItem<IGanttDateAxisDataItem> };
	/**
	 * Task values were recalculated, such as after the user edited a task.
	 * Dispatched only while `editable` is on.
	 */
	valueschanged: {};
}

/**
 * A Gantt chart: a task list on the left and the tasks' bars, links and
 * progress on a timeline.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/} for more info
 * @important
 * @since 5.14.0
 */
export class Gantt extends Container {
	declare public _settings: IGanttSettings;
	declare public _privateSettings: IGanttPrivate;
	declare public _events: IGanttEvents;
	public static className: string = "Gantt";
	public static classNames: Array<string> = Container.classNames.concat([Gantt.className]);

	/**
	 * A scrollbar for horizontal scrolling.
	 */
	public scrollbarX: Scrollbar = Scrollbar.new(this._root, {
		orientation: "horizontal"
	})._markC("orientation");

	/**
	 * A scrollbar for vertical scrolling.
	 */
	public scrollbarY: Scrollbar = Scrollbar.new(this._root, {
		orientation: "vertical"
	})._markC("orientation");

	/**
	 * The [[XYChart]] inside the Gantt that holds the axes and the series.
	 */
	public xyChart!: XYChart;

	/**
	 * The [[GanttSeries]] that draws the task bars.
	 */
	public series!: GanttSeries;

	/**
	 * The upper date axis, with the larger time units. The series uses it.
	 */
	public xAxis!: GanttDateAxis<GanttDateAxisRenderer>;

	/**
	 * The lower date axis, with the finer time units. Clicking it marks a
	 * date.
	 */
	public xAxisMinor!: GanttDateAxis<GanttDateAxisRenderer>;

	/**
	 * The [[GanttCategoryAxis]] that lists the tasks on the left.
	 */
	public yAxis!: GanttCategoryAxis<GanttCategoryAxisRenderer>;

	/**
	 * Toolbar container with the add, color picker, expand, collapse, link,
	 * edit and clear buttons.
	 */
	public controls: Container = Container.new(this._root, {
		themeTags: ["controls"],
		layout: this._root.horizontalLayout,
	})

	/**
	 * Container with the fit and zoom-out buttons, at the top right of the
	 * plot area.
	 */
	public zoomControls: Container = Container.new(this._root, {
		themeTagsSelf: ["zoomcontrols"]
	});

	/**
	 * Button that adds a new task, as a subtask of the selected task if there
	 * is one.
	 */
	public readonly addButton: Button = this.controls.children.push(Button.new(this._root, {
		themeTags: ["add", "plus"],
		tooltip: this.root.systemTooltip,
		icon: Graphics.new(this._root, { themeTags: ["icon"] })
	}));

	/**
	 * Button that opens `colorPicker` to choose a task color.
	 */
	public readonly colorPickerButton: ColorPickerButton = this.controls.children.push(ColorPickerButton.new(this._root, {
		disableOpacity: true,
		tooltip: this.root.systemTooltip
	}));

	/**
	 * Button that expands all tasks.
	 */
	public readonly expandButton: Button = this.controls.children.push(Button.new(this._root, {
		themeTags: ["expand", "secondary", "fixedwidth"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * Button that collapses all tasks.
	 */
	public readonly collapseButton: Button = this.controls.children.push(Button.new(this._root, {
		themeTags: ["collapse", "secondary", "fixedwidth"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * Toggle button for the `linkNewTasks` setting.
	 */
	public readonly linkButton: Button = this.controls.children.push(Button.new(this._root, {
		themeTags: ["link", "secondary", "fixedwidth"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * Button that zooms the date axis to fit the tasks currently in view.
	 */
	public readonly fitButton: Button = this.zoomControls.children.push(Button.new(this._root, {
		themeTags: ["fit", "secondary", "zoombutton"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * Button that zooms the date axis fully out.
	 */
	public readonly zoomOutButton: Button = this.zoomControls.children.push(Button.new(this._root, {
		themeTags: ["zoomout", "secondary", "zoombutton"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * Toggle button for the `editable` setting. Hidden by default.
	 *
	 * @since 5.14.1
	 */
	public readonly editButton: Button = this.controls.children.push(Button.new(this._root, {
		themeTags: ["edit", "secondary", "fixedwidth"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * Button that deletes all tasks, once the user confirms.
	 */
	public readonly clearButton: ConfirmButton = this.controls.children.push(ConfirmButton.new(this._root, {
		themeTags: ["clear", "secondary", "confirm"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip,
		active: false
	}));

	/**
	 * The color picker opened by `colorPickerButton`. It colors the selected
	 * task.
	 */
	public readonly colorPicker: ColorPicker = this.children.push(ColorPicker.new(this._root, { visible: false }));

	protected _customColor: Color | undefined;

	public _applyThemes(force: boolean = false): boolean {
		const colors = this.get("colors");
		if (colors) {
			colors.reset();
		}
		return super._applyThemes(force);		
	}

	protected _afterNew() {
		this.addTag("gantt");
		this._defaultThemes.push(GanttDefaultTheme.new(this._root));

		super._afterNew();

		const root = this._root;

		this.colorPickerButton.events.on("click", () => {
			this.yAxis.xButton.hide(0);
			this.colorPicker._setCAll({
				colorButton: this.colorPickerButton
			})
			this.children.moveValue(this.colorPicker, this.children.length - 1);
			this.yAxis._disposeXHideDP();
		})

		this.colorPicker.events.on("colorchanged", () => {
			this._customColor = this.colorPicker.get("color");
			this.yAxis.unselectDataItems();
		});

		this.addButton.events.on("click", () => {
			this.addNewTask();
		})

		const chart = this.children.push(XYChart.new(root, {}));

		chart.plotContainer.children.push(this.zoomControls);
		chart.zoomOutButton.set("forceHidden", true);

		chart.children.push(this.controls);

		chart._setC("cursor", XYCursor.new(root, {
			xAxis: this.xAxis,
			yAxis: this.yAxis
		})._markC("xAxis", "yAxis"));

		const yRenderer = GanttCategoryAxisRenderer.new(root, {});

		// to prevent moving horizontally while dragging
		yRenderer.containers.template.adapters.add("x", () => {
			return 0;
		})

		// can't set fields in theme, as data is set before theme is applied
		const yAxis = chart.yAxes.push(
			GanttCategoryAxis.new(root, {
				categoryField: "id",
				cellSizeField: "cellSize",
				collapsedField: "collapsed",
				parentIdField: "parentId",
				colorField: "color",
				idField: "id",
				nameField: "name",
				renderer: yRenderer
			})._markC("categoryField", "cellSizeField", "collapsedField", "parentIdField",
				"colorField", "idField", "nameField", "renderer")
		);

		yAxis.gantt = this;

		// update widht of scrollbar and controls container
		yAxis.events.on("boundschanged", () => {
			this._updateScrollbar();
		});

		chart.plotContainer.events.on("boundschanged", () => {
			this._updateScrollbar();
		});

		this.on("visible", () => {
			this.root.events.once("frameended", () => {
				this._updateScrollbar();
			});
		});

		// minor x axis
		const ganttAxisRenderrerMinor = GanttDateAxisRenderer.new(root, { themeTags: ["minor"] });

		// so that grid would be hidden if axis range is added
		ganttAxisRenderrerMinor.grid.template.adapters.add("forceHidden", (forceHidden, target) => {
			const dataItem = target.dataItem as DataItem<IGanttDateAxisDataItem>;
			if (dataItem && dataItem.get("active")) {
				return true;
			}
			return forceHidden;
		})

		const xAxisMinor = chart.xAxes.push(
			GanttDateAxis.new(root, {
				themeTags: ["minor"],
				baseInterval: { timeUnit: "day", count: 1 },
				renderer: ganttAxisRenderrerMinor,
				background: Rectangle.new(root, {
					fill: color(0xfff),
					fillOpacity: 0
				})
			})._markC("baseInterval", "renderer", "background")
		);

		xAxisMinor.gantt = this;

		// return default color for grid lines
		xAxisMinor.events.on("pointerout", () => {
			ganttAxisRenderrerMinor.grid.each((grid) => {
				grid.unhover();
			})
		})

		// add axis range on click
		xAxisMinor.events.on("click", () => {
			if (closestGrid) {
				const dataItem = closestGrid.dataItem as DataItem<IGanttDateAxisDataItem>;
				if (dataItem) {
					const value = dataItem.get("endValue");
					if (value !== undefined) {
						let found = false;
						xAxisMinor.axisRanges.each((axisRange) => {
							// remove axis range if already exists
							if (axisRange.get("value") === value) {
								this.unmarkDate(value);
								found = true;
							}
						})
						// add axis range if not exists
						if (!found) {
							dataItem.set("active", true);
							this.markDate(value);
						}
					}
				}
			}
		})

		// find closest grid line on hover
		let closestGrid: Grid | undefined;
		xAxisMinor.events.on("globalpointermove", (ev) => {
			if (xAxisMinor.isHover()) {
				// find most close grid line
				const point = xAxisMinor.toLocal({ x: ev.point.x, y: ev.point.y });
				let minX = Infinity;
				ganttAxisRenderrerMinor.grid.each((grid) => {
					if (grid.isVisible()) {
						const dataItem = grid.dataItem as DataItem<IGanttDateAxisDataItem>;
						if (dataItem) {
							if (!dataItem.get("isRange")) {
								let distance = Math.abs(grid.x() - point.x);

								if (!grid.get("active")) {
									grid.unhover();
								}

								if (distance < minX) {
									minX = distance;
									closestGrid = grid;
								}
							}
						}
					}
				})

				if (closestGrid) {
					closestGrid.hover();
				}
			}
		});

		const ganttAxisRenderrer = GanttDateAxisRenderer.new(root, {});
		const xAxis = chart.xAxes.push(
			GanttDateAxis.new(root, {
				baseInterval: { timeUnit: "day", count: 1 },
				renderer: ganttAxisRenderrer,
				tooltip: Tooltip.new(root, {})
			})._markC("baseInterval", "renderer", "tooltip")
		);

		xAxis.gantt = this;

		// sync minor x axis with main x axis
		xAxis.onPrivate("min", (value) => {
			xAxisMinor.setPrivate("min", value);
		});

		xAxis.onPrivate("max", (value) => {
			xAxisMinor.setPrivate("max", value);
		});

		// sync minor x axis with main x axis
		xAxis.on("start", (value) => {
			xAxisMinor._setC("start", value);
		});

		xAxis.on("end", (value) => {
			xAxisMinor._setC("end", value);
		});

		// set min max if not set
		const baseDuration = xAxis.baseDuration();
		if (xAxis.getPrivate("min") === undefined) {
			xAxis.setPrivate("min", new Date().getTime());
		}
		if (xAxis.getPrivate("max") === undefined) {
			xAxis.setPrivate("max", new Date().getTime() + baseDuration * 3);
		}

		// set grid interval
		xAxis.onPrivate("gridInterval", (value) => {
			const gridIntervals = this.get("gridIntervals");
			if (gridIntervals && gridIntervals[value.timeUnit]) {
				xAxisMinor._setC("gridIntervals", gridIntervals[value.timeUnit]);
			}
		});

		// Add series
		// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
		var series = chart.series.push(GanttSeries.new(root, {
			xAxis: xAxis,
			yAxis: yAxis,
			baseAxis: yAxis,
			openValueXField: "start",
			valueXField: "end",
			progressField: "progress",
			durationField: "duration",
			linkToField: "linkTo",
			categoryYField: "id",
			idField: "id"
		})._markC("xAxis", "yAxis", "baseAxis", "openValueXField", "valueXField", "progressField",
			"durationField", "linkToField", "categoryYField", "idField"));

		series.gantt = this;

		// Add scrollbars
		this.scrollbarX = chart._setC("scrollbarX", this.scrollbarX);
		this.scrollbarY = chart._setC("scrollbarY", this.scrollbarY);
		this.scrollbarY.startGrip.set("forceHidden", true);
		this.scrollbarY.endGrip.set("forceHidden", true);

		this.children.push(this.scrollbarX);

		this.xyChart = chart;
		this.series = series;
		this.xAxis = xAxis;
		this.yAxis = yAxis;
		this.xAxisMinor = xAxisMinor;

		const eventType = "valueschanged";
		this.series.events.on(eventType, () => {
			if (this.get("editable")) {
				if (this.events.isEnabled(eventType)) {
					this.events.dispatch(eventType, { type: eventType, target: this });
				}
			}
		})

		// ad dbehavior to buttons
		this.expandButton.events.on("click", () => {
			this.yAxis.expandAll();
		})

		this.collapseButton.events.on("click", () => {
			this.yAxis.collapseAll();
		})

		this.clearButton.events.on("confirmed", () => {
			this.clearAll();
		})

		this.linkButton.on("active", (active) => {
			// The button is synced from the setting, so only a click disagrees with it
			if (this.get("linkNewTasks", false) !== active) {
				this.set("linkNewTasks", active);
			}
		})

		this.colorPicker.on("color", (c) => {
			this.yAxis.setDataItemColor(this.yAxis.get("selectedDataItem"), c);
		});

		this.editButton.on("active", (active) => {
			// As above: syncing the button back into the setting is not configuration
			if (this.get("editable", true) !== active) {
				this.set("editable", active);
			}
		});

		this.fitButton.events.on("click", () => {

			let min = series.getPrivate("selectionMinX", 0);
			let max = series.getPrivate("selectionMaxX", 0);
			const extraMin = xAxis.get("extraMin", 0.1);
			const extraMax = xAxis.get("extraMax", 0.1);

			xAxis.zoomToValues(min - (max - min) * extraMin, max + (max - min) * extraMax);

			/*
			xAxis.setAll({
				"strictMinMax": false,
				"strictMinMaxSelection": false,
				"autoZoom": true,
			})

	
			else {
				xAxis.setAll({
					"strictMinMax": true,
					"strictMinMaxSelection": true,
					"autoZoom": false
				})

				xAxis.setPrivate("selectionMin", undefined);
				xAxis.setPrivate("selectionMax", undefined);
			}*/
		});

		this.zoomOutButton.events.on("click", () => {
			xAxis.zoom(0, 1);
		});

		let license = false;
		for (let i = 0; i < registry.licenses.length; i++) {
			if (registry.licenses[i].match(/^AM5G.{5,}/i)) {
				license = true;
			}
		}
		if (!license) {
			this._root._showBranding();
		}
		else {
			this._root._licenseApplied();
		}
	}
	// end _afterNew()

	public _prepareChildren(): void {
		super._prepareChildren();
		if (this.isDirty("editable")) {
			this._toggleEditable(this.get("editable", true));
		}
	}

	/**
	 * Deletes all tasks and date marks, restarts the colors and resets the
	 * timeline to start today.
	 */
	public clearAll() {
		this.yAxis.deleteAll();
		this._customColor = undefined;
		this.get("colors")?.reset();
		this.colorPickerButton.set("color", undefined);
		this._nextColor();

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		this.xAxis.setPrivate("min", today.getTime());
		this.xAxis.setPrivate("max", today.getTime() + this.xAxis.baseDuration() * 5);

		for (let i = this.xAxisMinor.axisRanges.length - 1; i >= 0; i--) {
			const axisRange = this.xAxisMinor.axisRanges.getIndex(i);
			if (axisRange) {
				this.unmarkDate(axisRange.get("value") as number);
			}
		};
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("linkNewTasks")) {
			this.linkButton.set("active", this.get("linkNewTasks", false));
		}

		if (this.isDirty("editable")) {
			this.editButton.set("active", this.get("editable", true));
		}

		if (this._sizeDirty || this.isDirty("sidebarWidth")) {
			let width = $utils.relativeToValue(this.get("sidebarWidth", percent(20)), this.innerWidth());
			width = Math.max(width, this.yAxis.get("minWidth", 100));
			this.yAxis.labelsContainer._setC("width", width);
			this._updateScrollbar();
		}

		if (this.isDirty("durationUnit")) {
			const durationUnit = this.get("durationUnit");
			if (durationUnit) {
				this.xAxis._setC("baseInterval", { timeUnit: durationUnit, count: 1 });
				this.xAxisMinor._setC("baseInterval", { timeUnit: durationUnit, count: 1 });
			}
		}

		if (this.colorPickerButton.getPrivate("color") === undefined) {
			this._nextColor();
		}
	}

	protected _updateScrollbar() {
		const point = this.xyChart.plotContainer.toGlobal({ x: 0, y: 0 });
		this.scrollbarX._setCAll({
			x: point.x,
			width: this.xyChart.plotContainer.width()
		});
	}

	/**
	 * Adds a new task, with an ID generated for it, and scrolls the task list
	 * to it.
	 *
	 * @param name            Task name; `"New Task"` if not given
	 * @param start           Start timestamp in milliseconds; if not given, the end of the parent or of the last task
	 * @param duration        Duration in `durationUnit` units
	 * @param parentId        ID of the parent task; the selected task if not given
	 * @param progress        Initial progress, `0` to `1`
	 * @param linkToPrevious  Link the previous task to this one; `linkNewTasks` if not given
	 */
	public addNewTask(name?: string, start?: number, duration: number = 1, parentId?: string, progress: number = 0, linkToPrevious?: boolean) {
		// Generate a unique ID for the new task
		let len = this.series.dataItems.length;
		let c = this.yAxis.dataItems.length;

		$array.each(this.yAxis.dataItems, (dataItem) => {
			if (dataItem.get("id") == "gantt_" + c) {
				c++;
			}
		})

		const uid = "gantt_" + c;

		if (!name) {
			name = "New Task";
		}

		if (linkToPrevious === undefined) {
			linkToPrevious = this.get("linkNewTasks", false);
		}

		let parentDataItem: DataItem<IGanttCategoryAxisDataItem> | undefined;
		// Find parent data item either by specified category or selected item
		if (parentId != undefined) {
			parentDataItem = this.yAxis.getDataItemById(parentId);
		}
		else {
			parentDataItem = this.yAxis.get("selectedDataItem");
		}

		let childCount = 0;
		// Handle parent-child relationship if a parent exists
		if (parentDataItem) {
			parentId = parentDataItem.get("id");
			if (parentId) {
				// If start time not specified, try to use parent's start time
				if (start === undefined) {
					const seriesDataItem = this.series.getDataItemById(parentId);
					if (seriesDataItem) {
						start = seriesDataItem.get("valueX", new Date().getTime());
					}
				}
			}
			// Initialize or get the children array for the parent
			let children = parentDataItem.get("children");
			if (!children) {
				children = parentDataItem.set("children", []);
			}
			childCount = children.length;
		}

		// Determine start time if not specified
		if (start === undefined) {
			start = $time.roun(this.xAxis.getPrivate("min", 0), this.get("durationUnit", "day"), 1, this.root);

			if (this.series.dataItems.length > 0) {
				start = this.series.dataItems[len - 1].get("valueX", new Date().getTime());
			}
		}

		const dataObject: any = {
			name: name,
			id: uid
		}
		if (parentId) {
			dataObject["parentId"] = parentId;
		}
		// Add the category data
		let index = 0;
		let previousDataItem: DataItem<IGanttCategoryAxisDataItem> | undefined;
		if (parentDataItem) {
			index = this.yAxis.dataItems.indexOf(parentDataItem) + 1 + childCount;
			const children = parentDataItem.get("children", []);
			let len = this.yAxis.dataItems.length;
			if (index >= len) {
				if (children.length > 0) {
					previousDataItem = children[children.length - 1];
				}
				this.yAxis.data.push(dataObject);
			}
			else {
				if (children.length > 0) {
					previousDataItem = this.yAxis.dataItems[index - 1];
				}
				this.yAxis.data.insertIndex(index, dataObject);
			}
			index++;
		}
		else {
			// go backwards and find the first item that has no parent
			for (let i = this.yAxis.dataItems.length - 1; i >= 0; i--) {
				const dataItem = this.yAxis.dataItems[i];
				if (!dataItem.get("parentId")) {
					previousDataItem = dataItem;
					break;
				}
			}
			this.yAxis.data.push(dataObject);
			index = this.yAxis.dataItems.length;
		}

		// Add the task data with slightly offset start time to avoid overlapping
		const baseDuration = this.xAxis.baseDuration();

		const seriesDataObject: any = {
			start: start,
			duration: duration,
			progress: progress,
			id: uid,
			name: name
		}

		// create link to previous task if needed
		if (linkToPrevious && previousDataItem) {
			const seriesDataItem = this.series.getDataItemById(previousDataItem.get("id")!);

			if (seriesDataItem) {
				const linkTo: Array<string> = seriesDataItem.get("linkTo", []);

				if (!linkTo.includes(uid)) {
					linkTo.push(uid);
					seriesDataItem.set("linkTo", linkTo);
				}
			}
		}

		this.series.data.moveValue(seriesDataObject, index - 1);

		const newSeriesDataItem = this.series.dataItems[index - 1];
		newSeriesDataItem.animate({ key: "valueX", to: start + baseDuration * duration, duration: this.series.get("interpolationDuration", 0), easing: this.series.get("interpolationEasing") });

		this.yAxis._disposeXHideDP();
		this.yAxis.xButton.hide(0);

		const maxZoomCount = this.yAxis.get("maxZoomCount", 20);
		let startIndex = Math.max(0, Math.round(index - maxZoomCount / 2));
		let endIndex = startIndex + maxZoomCount;

		len = this.yAxis.dataItems.length;
		if (endIndex > len) {
			endIndex = len;
			startIndex = Math.max(0, endIndex - maxZoomCount);
		}

		this.yAxis.zoomToIndexes(startIndex, endIndex);
		this.yAxis.adjustZoom();
	}


	// Get next color from the color set
	public _nextColor(): Color | undefined {
		if (this._customColor) {
			return this._customColor;
		}
		const fill = this.get("colors")?.next();
		this.colorPickerButton.setPrivate("color", fill);

		return fill;
	}

	/**
	 * Marks a date with a dashed line across the plot area, as a click on the
	 * lower date axis does.
	 *
	 * @param date  Timestamp in milliseconds
	 */
	public markDate(date: number) {

		const xAxisMinor = this.xAxisMinor;
		const dataItem = xAxisMinor.createAxisRange(xAxisMinor.makeDataItem({
			value: date
		}))

		const eventType = "datemarked";
		if (this.events.isEnabled(eventType)) {
			this.events.dispatch(eventType, { type: eventType, target: this, dataItem: dataItem, date: date });
		}
	}

	/**
	 * Removes the mark of a date set by `markDate()` or a click.
	 *
	 * @param date  Timestamp in milliseconds
	 */
	public unmarkDate(date: number) {
		const xAxisMinor = this.xAxisMinor;
		let dataItem = undefined;
		xAxisMinor.axisRanges.each((axisRange) => {
			// remove axis range if already exists
			if (axisRange && axisRange.get("value") === date) {
				xAxisMinor.axisRanges.removeValue(axisRange);
				dataItem = axisRange;
			}
		})
		const eventType = "dateunmarked";
		if (this.events.isEnabled(eventType)) {
			this.events.dispatch(eventType, { type: eventType, target: this, dataItem: dataItem, date: date });
		}
	}

	protected _toggleEditable(value: boolean) {
		const forceHidden = "forceHidden";
		const forceInactive = "forceInactive";
		const draggable = "draggable";

		this.series.markDirtyValues();

		// All of this follows from `editable`, so it is the Gantt's own doing
		this.addButton._setC(forceHidden, !value);
		this.colorPickerButton._setC(forceHidden, !value);
		this.clearButton._setC(forceHidden, !value);
		this.linkButton._setC(forceHidden, !value);

		const renderer = this.yAxis.get("renderer");
		renderer.labels.template._setC(forceInactive, !value);

		renderer.grips.template._setC(forceHidden, !value);
		renderer.containers.template._setC(draggable, value);

		renderer.controlsContainers.template._setC(forceInactive, !value);

		this.series.columns.template._setC(draggable, value);
		this.series.startGrips.template._setC(forceHidden, !value);
		this.series.endGrips.template._setC(forceHidden, !value);
		this.series.progressGrips.template._setC(forceHidden, !value);

		this.series.startBullets.template._setC(forceHidden, !value);
		this.series.endBullets.template._setC(forceHidden, !value);

		this.series.links.template._setC(forceInactive, !value);

		this.xAxisMinor._setC(forceInactive, !value);
	}
}