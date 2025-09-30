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
	 * If set to `true`, the user will be able to edit the chart via UI.
	 *
	 * @default true
	 */
	editable?: boolean;

	/**
	 * A unit to be used for when calculating "duration" of Gantt items.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Duration_units} for more information
	 * @default "day"
	 */
	durationUnit?: "year" | "month" | "week" | "day" | "hour" | "minute" | "second";

	/**
	 * An array of weekend days, e.g. `[0, 6]` for Sunday and Saturday.
	 *
	 * @default [0, 6]
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Weekends_and_holidays} for more information
	 */
	weekends?: Array<number>;

	/**
	 * An array of dates to treat as a holiday.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Weekends_and_holidays} for more information
	 */
	holidays?: Array<Date>;

	/**
	 * If set to `true`, weekends will be excluded from the chart.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Weekends_and_holidays} for more information
	 */
	excludeWeekends?: boolean;

	/**
	 * An absolute or relative width of the left-side category column.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Category_axis_width} for more information
	 * @default 30%
	 */
	sidebarWidth?: number | Percent;

	/**
	 * A relative vertical cell position to treat as the threshold for snapping
	 * bars.
	 *
	 * Available range of values: `0` (left) to `1` (right).
	 *
	 * This will be used when resizing or dragging a bar. If the position is
	 * bigger than `snapThreshold` the bar will snap to the right, if it is
	 * smaller than `snapThreshold`, it will snap to the left.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Snapping_behavior} for more information
	 * @default 0.5
	 */
	snapThreshold?: number;

	/**
	 * A [[ColorSet]] to use when asigning colors for series.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Series_colors} for more info
	 */
	colors?: ColorSet;

	/**
	 * Grid intervals.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Timeline_horizontal_axis} for more info
	 */
	gridIntervals?: { [index: string]: Array<ITimeInterval> };

	/**
	 * If this is set to `true`, when a new task is added, it will be automatically linked to the previous task.
	 * 
	 * @default true
	 */
	linkNewTasks?: boolean;
}

export interface IGanttPrivate extends IContainerPrivate { }

export interface IGanttEvents extends IContainerEvents {
	datemarked: { date: number | undefined, dataItem: DataItem<IGanttDateAxisDataItem> };
	dateunmarked: { date: number | undefined, dataItem?: DataItem<IGanttDateAxisDataItem> };
	valueschanged: {};
}

/**
 * Creates a [[Gantt]] chart.
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
	});

	/**
	 * A scrollbar for vertical scrolling.
	 */
	public scrollbarY: Scrollbar = Scrollbar.new(this._root, {
		orientation: "vertical"
	});

	/**
	 * A reference to the [[XYChart]] that holds the Gantt chart.
	 */
	public xyChart!: XYChart;

	/**
	 * A reference to the [[GanttSeries]] that shows the Gantt tasks bars.
	 */
	public series!: GanttSeries;

	/**
	 * A reference to the [[GanttDateAxis]] used as the main X-axis.
	 */
	public xAxis!: GanttDateAxis<GanttDateAxisRenderer>;

	/**
	 * A reference to the [[GanttDateAxis]] used as the secondary X-axis.
	 */
	public xAxisMinor!: GanttDateAxis<GanttDateAxisRenderer>;

	/**
	 * A reference to the [[GanttCategoryAxis]] used as the Y-axis.
	 */
	public yAxis!: GanttCategoryAxis<GanttCategoryAxisRenderer>;

	/**
	 * Controls (add, color picker, expand, collaps, clear buttons) container.
	 */
	public controls: Container = Container.new(this._root, {
		themeTags: ["controls"],
		layout: this._root.horizontalLayout,
	})

	public zoomControls: Container = Container.new(this._root, {
		themeTagsSelf: ["zoomcontrols"]
	});

	/**
	 * The [[Button]] element to add new tasks.
	 */
	public readonly addButton: Button = this.controls.children.push(Button.new(this._root, {
		themeTags: ["add", "plus"],
		tooltip: this.root.systemTooltip,
		icon: Graphics.new(this._root, { themeTags: ["icon"] })
	}));

	/**
	 * The [[ColorPickerButton]] element to select colors for tasks.
	 */
	public readonly colorPickerButton: ColorPickerButton = this.controls.children.push(ColorPickerButton.new(this._root, {
		disableOpacity: true,
		tooltip: this.root.systemTooltip
	}));

	/**
	 * The [[Button]] elements to expand and collapse all tasks.
	 */
	public readonly expandButton: Button = this.controls.children.push(Button.new(this._root, {
		themeTags: ["expand", "secondary", "fixedwidth"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * The [[Button]] elements to collapse all tasks.
	 */
	public readonly collapseButton: Button = this.controls.children.push(Button.new(this._root, {
		themeTags: ["collapse", "secondary", "fixedwidth"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * The [[Button]] element to toggle `linkNewTasks` setting.
	 */
	public readonly linkButton: Button = this.controls.children.push(Button.new(this._root, {
		themeTags: ["link", "secondary", "fixedwidth"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * The [[Button]] element to horizontally fit visible tasks into a view.
	 */
	public readonly fitButton: Button = this.zoomControls.children.push(Button.new(this._root, {
		themeTags: ["fit", "secondary", "zoombutton"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * The [[Button]] element to zoom out the X axis.
	 */
	public readonly zoomOutButton: Button = this.zoomControls.children.push(Button.new(this._root, {
		themeTags: ["zoomout", "secondary", "zoombutton"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip
	}));

	/**
	 * The [[Button]] element to clear all tasks.
	 */
	public readonly clearButton: ConfirmButton = this.controls.children.push(ConfirmButton.new(this._root, {
		themeTags: ["clear", "secondary", "confirm"],
		icon: Graphics.new(this._root, { themeTags: ["icon"] }),
		tooltip: this.root.systemTooltip,
		active: false
	}));

	/**
	 * The [[ColorPicker]] element to select colors for tasks.
	 */
	public readonly colorPicker: ColorPicker = this.children.push(ColorPicker.new(this._root, { visible: false }));

	protected _customColor: Color | undefined;



	protected _afterNew() {
		this.addTag("gantt");
		this._defaultThemes.push(GanttDefaultTheme.new(this._root));

		super._afterNew();

		const root = this._root;

		this.colorPickerButton.events.on("click", () => {
			this.yAxis.xButton.hide(0);
			this.colorPicker.setAll({
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

		chart.set("cursor", XYCursor.new(root, {
			xAxis: this.xAxis,
			yAxis: this.yAxis
		}));

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
			})
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
			})
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
			})
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
			xAxisMinor.set("start", value);
		});

		xAxis.on("end", (value) => {
			xAxisMinor.set("end", value);
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
				xAxisMinor.set("gridIntervals", gridIntervals[value.timeUnit]);
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
		}));

		series.gantt = this;

		// Add scrollbars
		this.scrollbarX = chart.set("scrollbarX", this.scrollbarX);
		this.scrollbarY = chart.set("scrollbarY", this.scrollbarY);
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
			this.set("linkNewTasks", active);
		})

		this.colorPicker.on("color", (c) => {
			this.yAxis.setDataItemColor(this.yAxis.get("selectedDataItem"), c);
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

		if (this._sizeDirty || this.isDirty("sidebarWidth")) {
			let width = $utils.relativeToValue(this.get("sidebarWidth", percent(20)), this.innerWidth());
			width = Math.max(width, this.yAxis.get("minWidth", 100));
			this.yAxis.labelsContainer.set("width", width);
			this._updateScrollbar();
		}

		if (this.isDirty("durationUnit")) {
			const durationUnit = this.get("durationUnit");
			if (durationUnit) {
				this.xAxis.set("baseInterval", { timeUnit: durationUnit, count: 1 });
				this.xAxisMinor.set("baseInterval", { timeUnit: durationUnit, count: 1 });
			}
		}

		if (this.colorPickerButton.getPrivate("color") === undefined) {
			this._nextColor();
		}
	}

	protected _updateScrollbar() {
		const point = this.xyChart.plotContainer.toGlobal({ x: 0, y: 0 });
		this.scrollbarX.setAll({
			x: point.x,
			width: this.xyChart.plotContainer.width()
		});
	}

	/**
	 * Adds a new task to the Gantt chart.
	 * 
	 * @param category        The category name for the task. If not provided, will be auto-generated.
	 * @param start           The start time of the task in milliseconds. If not provided, will be determined based on context.
	 * @param duration        The duration of the task. If not provided, defaults to 1.
	 * @param parentId        The parent category if this is a subtask.
	 * @param progress        The initial progress of the task (0-1). Defaults to 0.
	 * @param linkToPrevious  Should the task automatically link to the previous one?
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
			end: start + 1,
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
	 * Marks a date on the minor date axis.
	 * 
	 * @param date  Date to be marked
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
	 * Unmarks a date on the minor date axis.
	 * 
	 * @param date  Date to be unmarked
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

		this.addButton.set(forceHidden, !value);
		this.colorPickerButton.set(forceHidden, !value);
		this.clearButton.set(forceHidden, !value);
		this.linkButton.set(forceHidden, !value);

		const renderer = this.yAxis.get("renderer");
		renderer.labels.template.set(forceInactive, !value);

		renderer.grips.template.set(forceHidden, !value);
		renderer.containers.template.set(draggable, value);

		renderer.controlsContainers.template.set(forceInactive, !value);

		this.series.columns.template.set(draggable, value);
		this.series.startGrips.template.set(forceHidden, !value);
		this.series.endGrips.template.set(forceHidden, !value);
		this.series.progressGrips.template.set(forceHidden, !value);

		this.series.startBullets.template.set(forceHidden, !value);
		this.series.endBullets.template.set(forceHidden, !value);

		this.xAxisMinor.set(forceInactive, !value);
	}
}