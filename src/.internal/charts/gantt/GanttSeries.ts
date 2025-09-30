import type { ValueAxis } from "../xy/axes/ValueAxis";
import type { AxisRendererX } from "../xy/axes/AxisRendererX";
import type { CategoryAxis } from "../xy/axes/CategoryAxis";
import type { AxisRendererY } from "../xy/axes/AxisRendererY";
import type { Gantt } from "./Gantt";
import type { DateAxis } from "../xy/axes/DateAxis";
import type { GanttCategoryAxis, IGanttCategoryAxisDataItem } from "./GanttCategoryAxis";
import type { GanttCategoryAxisRenderer } from "./GanttCategoryAxisRenderer";
import type { GanttDateAxis } from "./GanttDateAxis";
import type { GanttDateAxisRenderer } from "./GanttDateAxisRenderer";

import { ColumnSeries, IColumnSeriesPrivate, IColumnSeriesSettings, IColumnSeriesDataItem, IColumnSeriesAxisRange } from "../xy/series/ColumnSeries";
import { Container } from "../../core/render/Container";
import { Circle, color, DataItem, Graphics, IPoint, ISpritePointerEvent, Line, Link, ListTemplate, percent, Percent, Rectangle, RoundedRectangle, Template, Triangle } from "../../..";

import * as $array from "../../core/util/Array";
import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";
import * as $time from "../../core/util/Time";
import * as $object from "../../core/util/Object";
import * as $type from "../../core/util/Type";

export interface IGanttSeriesDataItem extends IColumnSeriesDataItem {

	/**
	 * [[Container]] that holds all the elements of the series item, except the column graphics itslef.
	 */
	container?: Container

	/**
	 * A [[Container]] that is masked and holds progress rectangle and progress grip.	
	 */
	maskedContainer?: Container;

	/**
	 * A [[RoundedRectangle]] that is used to mask the progress rectangle.
	 */
	mask?: RoundedRectangle;

	/**
	 * A [[Circle]] used as a bullet shown at the start of the task bar.
	 */
	startBullet?: Circle;

	/**
	 * A [[Circle]] used as a bullet shown at the end of the task bar.
	 */
	endBullet?: Circle;

	/**
	 * A [[Rectangle]] filled with line pattern which is used to resize task bar.
	 */
	startGrip?: Rectangle;

	/**
	 * A [[Rectangle]] filled with line pattern which is used to resize task bar.
	 */
	endGrip?: Rectangle;

	/**
	 * A [[Rectangle]] that is used to show progress of the task. It actually
	 * shows the remaining part of the task and is filled with diagonal line
	 * pattern.
	 */
	progressRectangle?: Rectangle;

	/**
	 * A [[RoundedRectangle]] rotated by 45 degrees and is shown instead of a
	 * column when the task has zero duration.
	 */
	zeroRectangle?: RoundedRectangle;

	/**
	 * A [[Triangle]] that is used to resize progress rectangle.
	 */
	progressGrip?: Triangle;

	/**
	 * A value that holds the progress value of the task.
	 */
	progress?: number;

	/**
	 * A value that holds previous progress value of the task, used when
	 * toggling progress using progress pie next to the y axis label.
	 */
	prevProgress?: number;

	/**
	 * Duration of the task, in units of the x axis.
	 */
	duration?: number;

	/**
	 * Array of IDs of tasks this task is linked to.
	 */
	linkTo?: Array<string>;

	/**
	 * Refferences to `Link` objects that are used to visually connect tasks.
	 */
	links?: { [index: string]: Link };

	/**
	 * A reference to a corresponding category axis data item.
	 */
	categoryAxisDataItem?: DataItem<IGanttCategoryAxisDataItem>;

	/**
	 * Array of children data items.
	 */
	children?: Array<DataItem<IGanttSeriesDataItem>>;

	/**
	 * A reference to a parent data item, if any.
	 */
	parent?: DataItem<IGanttSeriesDataItem>;

	/**
	 * Category name.
	 */
	name?: string;

}

export interface IGanttSeriesSettings extends IColumnSeriesSettings {

	/**
	 * A field in data that holds progress of the task.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Series_data} for more info
	 * @default "progress"
	 */
	progressField?: string;

	/**
	 * A field in data that holds duration of the task.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Series_data} for more info
	 * @default "duration"
	 */
	durationField?: string;

	/**
	 * A field in data that holds and ID of the task it is linked to.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Series_data} for more info
	 * @default "linkTo"
	 */
	linkToField?: string;

	/**
	 * A distance in pixels that link should be protracted from the edge of the
	 * task bars.
	 *
	 * @default 25
	 */
	linkHorizontalOffset?: number;

	/**
	 * When dragging/resizing a column, how many units should it snap to.
	 * @default 1
	 */
	snapCount?: number;

	/**
	 * A reference to the y-axis of the Gantt chart.
	 */
	yAxis: GanttCategoryAxis<GanttCategoryAxisRenderer>;

	/**
	 * A reference to the x-axis of the Gantt chart.
	 */
	xAxis: GanttDateAxis<GanttDateAxisRenderer>;

}

export interface IGanttSeriesPrivate extends IColumnSeriesPrivate {
}

export interface IGanttSeriesAxisRange extends IColumnSeriesAxisRange {
}

/**
 * A series used in [[Gantt]] chart to display tasks and their progress.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Gantt_series} for more info
 * @important
 * @since 5.14.0
 */
export class GanttSeries extends ColumnSeries {

	declare public _settings: IGanttSeriesSettings;
	declare public _privateSettings: IGanttSeriesPrivate;
	declare public _dataItemSettings: IGanttSeriesDataItem;
	declare public _axisRangeType: IGanttSeriesAxisRange;

	public static className: string = "GanttSeries";
	public static classNames: Array<string> = ColumnSeries.classNames.concat([GanttSeries.className]);

	protected _startBullet?: Circle;
	protected _endBullet?: Circle;

	/**
	 * A reference to the parent [[Gantt]] chart.
	 */
	public gantt!: Gantt;

	protected _columnDragStartX?: number;
	protected _columnDragStartY?: number;

	protected _hoveredDataItem?: DataItem<IGanttSeriesDataItem>;

	protected _xPan?: boolean = false;
	protected _yPan?: boolean = false;


	/**
	 * A container that holds all the links between tasks.
	 */
	public linksContainer: Container = this.children.push(Container.new(this._root, {}));

	/**
	 * A line which is shown while creating a connector between two tasks.
	 */
	public connectorLine: Line = this.children.push(Line.new(this._root, {
		themeTags: ["connectorline"],
		visible: false,
		forceInactive: true
	}));

	/**
	 * A triangle that is shown at the end of the connector line, while creating
	 * a connector.
	 */
	public connectorArrow: Triangle = this.children.push(Triangle.new(this._root, {
		themeTags: ["connectorarrow"],
		visible: false,
		forceInactive: true
	}));

	/**
	 * [[ListTemplate]] of [[Link]] that connect tasks.
	 */
	public readonly links: ListTemplate<Link> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Link._new(this._root, {
			themeTags: $utils.mergeTags(this.containers.template.get("themeTags", []), ["link"])
		}, [this.links.template])
	));

	/**
	 * [[ListTemplate]] of [[Container]]s that hold all the elements of series
	 * items, such as grips, bullets, etc.
	 */
	public readonly containers: ListTemplate<Container> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Container._new(this._root, {
			position: "absolute",
			themeTagsSelf: ["columncontainer"]
		}, [this.containers.template])
	));

	/**
	 * [[ListTemplate]] of [[Container]]s that are used to mask elements, such
	 * as progress rectangles.
	 */
	public readonly maskedContainers: ListTemplate<Container> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Container._new(this._root, {
			position: "absolute",
			themeTagsSelf: ["maskedcontainer"]
		}, [this.maskedContainers.template])
	));

	/**
	 * [[ListTemplate]] of [[Circle]]s that are used as start bullets.
	 */
	public readonly startBullets: ListTemplate<Circle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Circle._new(this._root, {
			x: - 1000,
			themeTagsSelf: ["connectorbullet", "start"],
		}, [this.startBullets.template])
	));

	/**
	 * [[ListTemplate]] of [[Circle]]s that are used as end bullets.
	 */
	public readonly endBullets: ListTemplate<Circle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Circle._new(this._root, {
			x: - 1000,
			themeTagsSelf: ["connectorbullet", "end"]
		}, [this.endBullets.template])
	));

	/**
	 * [[ListTemplate]] of [[Rectangle]]s that are used to resize task bars.
	 */
	public readonly startGrips: ListTemplate<Rectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Rectangle._new(this._root, {
			themeTagsSelf: ["resizegrip", "start"]
		}, [this.startGrips.template])
	));

	/**
	 * [[ListTemplate]] of [[Rectangle]]s that are used to resize task bars.
	 */
	public readonly endGrips: ListTemplate<Rectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Rectangle._new(this._root, {
			themeTagsSelf: ["resizegrip", "end"]
		}, [this.endGrips.template])
	));

	/**
	 * [[ListTemplate]] of [[RoundedRectangle]]s that are used to show
	 * zero-duration tasks.
	 */
	public readonly zeroRectangles: ListTemplate<RoundedRectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => RoundedRectangle._new(this._root, {
			themeTagsSelf: ["zerorectangle"],
		}, [this.zeroRectangles.template])
	));

	/**
	 * [[ListTemplate]] of [[Rectangle]]s that are used to show progress of the
	 * task. It is actually a remaining part of the task and is filled with
	 * diagonal line pattern.
	 */
	public readonly progressRectangles: ListTemplate<Rectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Rectangle._new(this._root, {
			themeTagsSelf: ["progressrectangle"]
		}, [this.progressRectangles.template])
	));

	/**
	 * [[ListTemplate]] of [[Triangle]]s that are used to resize progress
	 * rectangles.
	 */
	public readonly progressGrips: ListTemplate<Triangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Triangle._new(this._root, {
			themeTagsSelf: ["progressgrip"]
		}, [this.progressGrips.template])
	));

	protected _afterNew(): void {
		this.fields.push("linkTo", "categoryId");
		this.valueFields.push("progress", "duration");
		this.set("exactLocationX", true);

		super._afterNew();

		this._disposers.push(this.events.on("globalpointermove", (event) => {
			if (this.connectorLine.isVisible()) {
				const point = this.toLocal(event.point);
				this._updateConnector(point);
			}
		}));

		this.events.on("globalpointerup", (_event) => {
			if (this.connectorLine.isVisible()) {
				this._endConnector();
			}
		})

		this.columns.template.events.on("dragstart", (e) => {
			this._columnDragStartX = e.target.x();
			this._columnDragStartY = e.target.y();
		})

		this.columns.template.events.on("dragged", (e) => {
			this._handleColumnDragged(e);
		})

		this.columns.template.events.on("dragstop", (e) => {
			const xAxis = this.get("xAxis") as ValueAxis<AxisRendererX>;
			const dataItem = e.target.dataItem as DataItem<IGanttSeriesDataItem>;

			const openValueX = dataItem.get("openValueX", 0);
			let newOpenValueX = xAxis.positionToValue(xAxis.coordinateToPosition(e.target.x()));

			const valueX = dataItem.get("valueX", 0);

			let diff = newOpenValueX - openValueX;
			dataItem.set("openValueX", newOpenValueX);
			dataItem.set("valueX", valueX + diff);

			dataItem.set("openValueXWorking", newOpenValueX);
			dataItem.set("valueXWorking", valueX + diff);

			this._fixValues(dataItem, "duration");

			this._moveChildValues(dataItem, diff);
		})
	}


	/**
	 * @ignore
	 */
	protected roundValue(value: number, invertThreshold?: boolean): number {
		let threshold = this.gantt.get("snapThreshold", 0.8);
		if (invertThreshold) {
			threshold = 1 - threshold;
		}
		const snapCount = this.get("snapCount", 1);
		const xAxis = this.get("xAxis") as DateAxis<AxisRendererX>;
		const baseInterval = xAxis.get("baseInterval");
		return $time.roun(value + this.getUnitDuration() * threshold, baseInterval.timeUnit, baseInterval.count * snapCount, this._root);
	}

	/**
	 * @ignore
	 */
	public makeColumn(
		dataItem: DataItem<this["_dataItemSettings"]>,
		listTemplate: ListTemplate<RoundedRectangle>
	): RoundedRectangle {
		// Create the main column
		const column = super.makeColumn(dataItem, listTemplate);
		const yAxis = this.get("yAxis") as GanttCategoryAxis<GanttCategoryAxisRenderer>;
		column.events.on("click", () => {
			yAxis.selectDataItem(dataItem.get("categoryAxisDataItem") as DataItem<IGanttCategoryAxisDataItem>);
		})

		// --- Container setup ---
		const container = this.mainContainer.children.push(this.containers.make());
		container._setDataItem(dataItem);
		this.containers.push(container);

		const zeroRectangle = this.zeroRectangles.make();
		dataItem.set("zeroRectangle", zeroRectangle);
		this.zeroRectangles.push(zeroRectangle);
		container.children.unshift(zeroRectangle);
		if (dataItem.get("duration", 0) > 0) {
			zeroRectangle.hide(0);
		}

		let zy = 0;
		zeroRectangle.events.on("pointerdown", (e) => {
			zy = e.target.y();
			column.dragStart(e);
		})

		zeroRectangle.events.on("dragstart", (e) => {
			this._handleColumnDragged(e);
			e.target.setAll({
				x: 0,
				y: zy
			});
		});

		zeroRectangle.events.on("dragged", (e) => {
			this._handleColumnDragged(e);

			e.target.setAll({
				x: 0,
				y: zy
			});
		})

		zeroRectangle.events.on("dragstop", (e) => {
			column.dragStop(e);
		})

		zeroRectangle.events.on("pointerover", (e) => {
			this._handleColumnHover(e);
		})

		zeroRectangle.adapters.add("fillPattern", (fillPattern, target) => {
			const dataItem = target.dataItem as DataItem<IGanttSeriesDataItem>;
			if (dataItem.get("progress", 0) < 1) {
				return progressRectangle.get("fillPattern");
			}

			return fillPattern;
		});

		const maskedContainer = container.children.push(this.maskedContainers.make());
		dataItem.setRaw("maskedContainer", maskedContainer);

		const mask = container.children.push(RoundedRectangle.new(this._root, {
			fill: color(0xffffff),
			forceInactive: true,
			fillOpacity: 0
		}));
		dataItem.setRaw("mask", mask);
		maskedContainer.set("mask", mask);

		// --- Progress elements ---
		const progressRectangle = maskedContainer.children.push(this.progressRectangles.make());
		this.progressRectangles.push(progressRectangle);

		const progressGrip = this.progressGrips.make();
		this.progressGrips.push(progressGrip);
		maskedContainer.children.push(progressGrip);

		progressGrip.events.on("dragged", () => {
			let x = progressGrip.x();
			x = $math.fitToRange(x, 0, column.getPrivate("width", 0));
			progressGrip.setAll({ x: x, y: column.getPrivate("height", 0) });
			dataItem.set("progress", progressGrip.x() / column.getPrivate("width", 0));
		});

		// --- Grips (start/end) ---

		const startGrip = this.startGrips.make();
		this.startGrips.push(startGrip);
		container.children.push(startGrip);

		const endGrip = this.endGrips.make();
		this.endGrips.push(endGrip);
		container.children.push(endGrip);

		dataItem.setRaw("startGrip", startGrip);
		dataItem.setRaw("endGrip", endGrip);

		// --- Axis reference ---
		const xAxis = this.get("xAxis") as ValueAxis<AxisRendererX>;

		// --- Grip events ---
		let startX = 0;
		startGrip.events.on("dragstart", () => {
			startX = column.x();
			column.show();
			zeroRectangle.hide();
			maskedContainer.show();
		});
		startGrip.events.on("pointerover", () => {
			column.states.applyAnimate("hover");
		});
		startGrip.events.on("pointerout", () => {
			if (column.isVisible()) {
				column.states.applyAnimate("default");
			}
		});
		startGrip.events.on("dragged", () => {
			startGrip.set("y", 0);
			const x = startGrip.x() + startX;
			let openValueX = xAxis.positionToValue(xAxis.coordinateToPosition(x));
			let minStart = this._findMinStart(dataItem);

			openValueX = Math.max(openValueX, minStart);
			openValueX = Math.min(openValueX, dataItem.get("valueX", openValueX));

			dataItem.set("openValueX", openValueX);

			startGrip.set("x", 0);
		});

		startGrip.events.on("dragstop", () => {
			this._fixValues(dataItem, "end");
			this.markDirtyValues();
		});

		let endX = 0;
		endGrip.events.on("dragstart", () => {
			endX = column.x();
			column.show();
			zeroRectangle.hide();
			maskedContainer.show();
		});
		endGrip.events.on("pointerover", () => {
			column.states.applyAnimate("hover");
		});
		endGrip.events.on("pointerout", () => {
			if (column.isVisible()) {
				column.states.applyAnimate("default");
			}
		});
		endGrip.events.on("dragged", () => {
			endGrip.set("y", 0);
			const x = endGrip.x() + endX;
			let valueX = xAxis.positionToValue(xAxis.coordinateToPosition(x));
			valueX = Math.max(valueX, dataItem.get("openValueX", 0));
			dataItem.set("valueX", valueX);
			dataItem.set("valueXWorking", valueX);
			const column = dataItem.get("graphics") as RoundedRectangle;
			if (column) {
				endGrip.set("x", column.width());
			}
		});

		endGrip.events.on("dragstop", () => {
			this._fixValues(dataItem, "start");
			this.markDirtyValues();
		});

		// --- Bullets (start/end) ---
		const startBullet = this.startBullets.make();

		startBullet.events.on("pointerout", () => {
			if (column.isVisible()) {
				column.states.applyAnimate("default");
			}
		});
		this.startBullets.push(startBullet);
		container.children.push(startBullet);

		const endBullet = this.endBullets.make();
		this.endBullets.push(endBullet);
		container.children.push(endBullet);

		// --- Bullet events (connector logic) ---
		const bulletPointerDown = (bullet: Circle) => {
			this._startConnector(bullet);
		};

		startBullet.events.on("pointerdown", () => bulletPointerDown(startBullet));
		endBullet.events.on("pointerdown", () => bulletPointerDown(endBullet));

		column.events.on("pointerover", (e) => {
			this._handleColumnHover(e);
		})

		column.events.on("pointerout", () => {
			this._hoveredDataItem = undefined;
			if (this.connectorLine.isVisible()) {
				startBullet.hide();
			}
		})

		// --- Data item references ---
		dataItem.setRaw("container", container);
		dataItem.setRaw("startBullet", startBullet);
		dataItem.setRaw("endBullet", endBullet);
		dataItem.setRaw("progressRectangle", progressRectangle);
		dataItem.setRaw("progressGrip", progressGrip);

		// --- Sync container with column position ---
		const syncProp = (prop: any, target: any) => {
			column.on(prop, (val) => {
				target.set(prop, val);
			});
		};
		syncProp("x", container);
		syncProp("y", container);
		syncProp("dx", container);
		syncProp("dy", container);
		syncProp("cornerRadiusBL", mask);
		syncProp("cornerRadiusBR", mask);
		syncProp("cornerRadiusTL", mask);
		syncProp("cornerRadiusTR", mask);

		if (this.isCollapsed(dataItem)) {
			dataItem.hide(0);
			column.hide(0);
			maskedContainer.hide(0);
		}
		else {
			if (dataItem.get("duration", 0) > 0) {
				column.appear();
				maskedContainer.appear();
			}
		}


		return column;
	}

	protected _handleColumnDragged(e: ISpritePointerEvent) {
		const column = e.target as RoundedRectangle;
		const dataItem = column.dataItem as DataItem<IGanttSeriesDataItem>;

		// Maintain vertical position to prevent vertical dragging
		if (this._columnDragStartY !== undefined) {
			column.set("y", this._columnDragStartY);
		}

		// Calculate horizontal drag offset and apply to child elements
		if (dataItem && this._columnDragStartX !== undefined) {
			const dragOffset = column.x() - this._columnDragStartX;
			this._dragChildValues(dataItem, dragOffset);

			this._updateLinks();
		}
	}

	protected _handleColumnHover(e: ISpritePointerEvent) {
		// Only process hover if we're currently creating a connector
		if (!this.connectorLine.isVisible()) return;

		const column = e.target as RoundedRectangle;
		const dataItem = column.dataItem as DataItem<IGanttSeriesDataItem>;

		// Skip if no valid data item
		if (!dataItem) return;

		const startBullet = dataItem.get("startBullet");
		const sourceDataItem = this._startBullet?.dataItem as DataItem<IGanttSeriesDataItem>;

		// Show the start bullet only if:
		// 1. We have a valid start bullet
		// 2. We have a source data item for the connection
		// 3. Both items are at the same depth level
		// 4. We're not trying to connect to the same item
		if (startBullet &&
			sourceDataItem &&
			this.getDepth(sourceDataItem) === this.getDepth(dataItem) &&
			sourceDataItem !== dataItem) {

			startBullet.show();
			this._hoveredDataItem = dataItem;
		}
	}

	/**
	 * Checks if the task is collapsed.
	 *
	 * @param  dataItem  Data item
	 * @return           Collapsed?
	 */
	public isCollapsed(dataItem: DataItem<IGanttSeriesDataItem>): boolean {
		const categoryAxisDataItem = dataItem.get("categoryAxisDataItem") as DataItem<IGanttCategoryAxisDataItem>;
		if (categoryAxisDataItem) {
			const parent = categoryAxisDataItem.get("parent");
			if (parent) {
				if (parent.get("collapsed")) {
					return true;
				}
				return this.isCollapsed(parent);
			}
		}
		return false;
	}

	/**
	 * Updates the series, recalculating values and updating children.
	 *
	 * @ignore Exclude from docs
	 */
	public _updateChildren() {

		if (this._valuesDirty) {

			this.setPrivateRaw("minX", undefined);
			this.setPrivateRaw("maxX", undefined);

			const yAxis = this.get("yAxis") as GanttCategoryAxis<GanttCategoryAxisRenderer>;
			const yRenderer = yAxis.get("renderer") as GanttCategoryAxisRenderer;

			$array.each(this.dataItems, (dataItem) => {
				const dataContext = dataItem.dataContext as any;

				const categoryAxisDataItem = dataItem.get("categoryAxisDataItem") as DataItem<IGanttCategoryAxisDataItem>;
				if (categoryAxisDataItem) {

					const children = dataItem.get("children");
					if (children && children.length > 0) {
						dataItem.set("openValueX", undefined);
						dataItem.set("valueX", undefined);

						dataItem.set("openValueXWorking", undefined);
						dataItem.set("valueXWorking", undefined);


						delete (dataContext[this.get("openValueXField")]);
						delete (dataContext[this.get("durationField")]);
					}
					else {
						dataContext[this.get("openValueXField")] = dataItem.get("openValueX");
						dataContext[this.get("durationField")] = dataItem.get("duration");
						dataContext[this.get("progressField")] = dataItem.get("progress");
					}

					dataContext[this.get("linkToField")] = dataItem.get("linkTo");

					const category = dataItem.get("categoryY");
					const categoryYField = this.get("categoryYField", "category");

					dataContext[categoryYField] = category;

					const categoryDataContext = categoryAxisDataItem.dataContext as any;
					const categoryField = yAxis.get("categoryField", "category");
					const parent = categoryAxisDataItem.get("parent");

					categoryDataContext[categoryField] = category;
					if (parent) {
						categoryDataContext[yAxis.get("parentIdField", "parentId")] = parent.get("id");
						categoryDataContext[yAxis.get("collapsedField", "collapsed")] = categoryAxisDataItem.get("collapsed", false);
					}
				}
			});

			$array.each(this.dataItems, (dataItem) => {
				this._adjustParentValues(dataItem);

				const children = dataItem.get("children");
				const startGrip = dataItem.get("startGrip");
				const endGrip = dataItem.get("endGrip");
				const progressGrip = dataItem.get("progressGrip");

				let visible = true;
				if (children && children.length > 0) {
					visible = false;
				}

				if (startGrip) {
					startGrip.setPrivate("visible", visible);
				}
				if (endGrip) {
					endGrip.set("visible", visible);
				}
				if (progressGrip) {
					progressGrip.set("visible", visible);
				}

				const categoryAxisDataItem = dataItem.get("categoryAxisDataItem") as DataItem<IGanttCategoryAxisDataItem>;

				let index = 0;
				if (categoryAxisDataItem) {
					const durationStepper = categoryAxisDataItem.get("durationStepper");
					if (durationStepper) {
						durationStepper.set("disabled", !visible);
					}
					index = categoryAxisDataItem.get("index", 0);
				}

				const duration = dataItem.get("duration", 0);

				let zeroRectangle = dataItem.get("zeroRectangle");
				const column = dataItem.get("graphics") as RoundedRectangle;
				const maskedContainer = dataItem.get("maskedContainer");
				const fill = categoryAxisDataItem.get("customColor", categoryAxisDataItem.get("color"));

				if (zeroRectangle) {
					let height = 20;

					let y0 = yAxis.indexToPosition(index, 0);
					let y1 = yAxis.indexToPosition(index, 1);

					y0 = yRenderer.positionToCoordinate(y0);
					y1 = yRenderer.positionToCoordinate(y1);

					const columnHeight = column.get("height", 0);
					let r = 1;
					if (columnHeight instanceof Percent) {
						r *= columnHeight.value * $math.cos(45);
					}

					height = (y1 - y0) * r;

					zeroRectangle.setPrivate("height", height);
					zeroRectangle.setPrivate("width", height);
				}

				if (column && maskedContainer && !this.isCollapsed(dataItem)) {
					if (duration === 0 && zeroRectangle) {
						if (!column.isHidden() && !column.isHiding()) {
							zeroRectangle.setAll({
								fill: fill,
								stroke: fill
							})

							if (!startGrip?.isDragging() && !endGrip?.isDragging()) {
								column.hide();
								maskedContainer.hide();
								zeroRectangle.show();
							}
						}
					}
					else {
						if (zeroRectangle) {
							zeroRectangle.hide();
						}

						column.show();
						maskedContainer.show();
					}
				}
			});

			$array.each(this.dataItems, (dataItem) => {
				this._adjustLinkValues(dataItem);
			});

			$array.each(this.dataItems, (dataItem) => {
				this._adjustParentValues(dataItem);

				const categoryAxisDataItem = dataItem.get("categoryAxisDataItem") as DataItem<IGanttCategoryAxisDataItem>;
				if (categoryAxisDataItem) {
					categoryAxisDataItem.set("duration", dataItem.get("duration"));
					categoryAxisDataItem.set("progress", dataItem.get("progress"));
				}
			});

			// dispatch event
			const eventType = "valueschanged";
			if (this.events.isEnabled(eventType)) {
				this.events.dispatch(eventType, {
					type: eventType, target: this
				});
			}
		}

		super._updateChildren();

		if (this._columnsUpdated) {
			this._updateLinks();
		}
	}

	protected _getParentOpen(dataItem: DataItem<IGanttSeriesDataItem>): number {
		const parent = dataItem.get("parent");
		if (parent) {
			return this._getParentOpen(parent);
		}
		else {
			return dataItem.get("openValueX", -Infinity);
		}
	}

	protected _adjustLinkValues(dataItem: DataItem<IGanttSeriesDataItem>) {
		const linkTo = dataItem.get("linkTo");
		if (linkTo) {
			const valueX = dataItem.get("valueX", 0);
			$array.each(linkTo, (id) => {
				const linkDataItem = this.getDataItemById(id);

				if (linkDataItem && linkDataItem !== dataItem) {
					const linkOpenValueX = linkDataItem.get("openValueX", 0);
					if (linkOpenValueX !== undefined && linkOpenValueX < valueX) {
						linkDataItem.set("openValueX", valueX);
						this._fixValues(linkDataItem, "duration");
						this._adjustChildValues(linkDataItem);
					}
				}
			})
		}
	}

	protected _adjustChildValues(dataItem: DataItem<IGanttSeriesDataItem>) {
		const children = dataItem.get("children", []);
		if (children && children.length > 0) {
			let openValueX = dataItem.get("openValueX", 0);

			$array.each(children, (child) => {
				const childOpenValueX = child.get("openValueX", 0);
				if (childOpenValueX === undefined || childOpenValueX < openValueX) {
					child.set("openValueX", openValueX);
					this._fixValues(child, "duration");
				}
				this._adjustChildValues(child);
			});
		}
	}

	protected _dragChildValues(dataItem: DataItem<IGanttSeriesDataItem>, dx: number) {
		const children = dataItem.get("children");
		if (children && children.length > 0) {
			$array.each(children, (child) => {
				const column = child.get("graphics") as RoundedRectangle;
				if (column) {
					column.set("dx", dx);
				}

				this._dragChildValues(child, dx);
			});
		}
	}

	protected _moveChildValues(dataItem: DataItem<IGanttSeriesDataItem>, diff: number) {
		const children = dataItem.get("children");
		if (children && children.length > 0) {
			$array.each(children, (child) => {
				child.set("openValueX", child.get("openValueX", 0) + diff);
				child.set("valueX", child.get("valueX", 0) + diff);

				child.set("openValueXWorking", child.get("openValueX"));
				child.set("valueXWorking", child.get("openValueX"));


				const column = child.get("graphics") as RoundedRectangle;
				if (column) {
					column.set("dx", 0);
				}

				this._fixValues(child, "duration");
				this._moveChildValues(child, diff);
			});
		}
	}

	protected _findMinStart(dataItem: DataItem<IGanttSeriesDataItem>): number {
		// check if item has links from other items
		let maxValue: number = -Infinity;
		$array.each(this.dataItems, (item) => {
			const linkTo = item.get("linkTo");
			if (linkTo) {
				$array.each(linkTo, (id) => {
					if (id === dataItem.get("id")) {
						const itemValueX = item.get("valueX", 0);
						if (itemValueX > maxValue) {
							maxValue = itemValueX;
						}
					}
				})
			}
		})
		// if this is a child, check parent start
		const parent = dataItem.get("parent");
		if (parent) {
			maxValue = Math.max(maxValue, this._findMinStart(parent));
		}

		return maxValue;
	}

	protected _adjustParentValues(dataItem: DataItem<IGanttSeriesDataItem>) {
		const categoryAxisDataItem = dataItem.get("categoryAxisDataItem");
		if (categoryAxisDataItem) {
			const column = dataItem.get("graphics") as RoundedRectangle;
			let color = categoryAxisDataItem.get("customColor", categoryAxisDataItem.get("color"));
			if (column) {
				column.setAll({
					fill: color,
					stroke: color
				})
			}

			const zeroRectangle = dataItem.get("zeroRectangle");
			if (zeroRectangle) {
				zeroRectangle.setAll({
					fill: color,
					stroke: color,
				});
			}

			const children = dataItem.get("children");
			if (children && children.length > 0) {
				let progress = 0;
				$array.each(children, (child) => {
					const childProgress = child.get("progress", 0);
					if (childProgress !== undefined) {
						progress += childProgress;
					}
				});
				progress /= children.length;
				dataItem.set("progress", progress);
			}

			if (categoryAxisDataItem) {
				let valueX = dataItem.get("valueX");
				let openValueX = dataItem.get("openValueX");

				const duration = dataItem.get("duration", 0);
				if (valueX === undefined && openValueX !== undefined) {
					openValueX = this.getOpenValue(openValueX);
					valueX = this.getEndValue(openValueX, duration);

					dataItem.setRaw("openValueX", openValueX);
					dataItem.setRaw("valueX", valueX);

					//dataItem.setRaw("openValueXWorking", openValueX);
					//dataItem.setRaw("valueXWorking", valueX);					
				}

				let parent = dataItem.get("parent");
				if (openValueX !== undefined && valueX !== undefined && parent) {
					const parentOpenValueX = parent.get("openValueX");
					const parentValueX = parent.get("valueX");

					if (parentOpenValueX === undefined || parentOpenValueX > openValueX) {
						parent.set("openValueX", openValueX);
					}

					if (parentValueX === undefined || parentValueX < valueX) {
						parent.set("valueX", valueX);
						parent.set("valueXWorking", valueX);
					}

					parent.set("duration", this.getDataItemDuration(parent));
					this._adjustParentValues(parent);
				}
			}
		}
	}

	protected _startConnector(bullet: Circle) {
		this._startBullet = bullet;

		this.connectorLine.show();
		this.connectorArrow.show();

		this._xPan = this.chart?.get("panX");
		this._yPan = this.chart?.get("panY");

		this.chart?.set("panX", false);
		this.chart?.set("panY", false);

		const dataItem = bullet.dataItem as DataItem<IGanttSeriesDataItem>;

		// disable all columns of not the same depth
		const depth = this.getDepth(dataItem);
		const itemsToDisable: Array<DataItem<IGanttSeriesDataItem>> = [];
		$array.each(this.dataItems, (item) => {
			if (this.getDepth(item) != depth) {
				$array.move(itemsToDisable, item);
			}
			// also if already connected, disable
			const links = dataItem.get("links");
			if (links && links[item.get("id")!]) {
				$array.move(itemsToDisable, item);
			}

		})

		// if this item has parent, disable all items ecept items in the same branch
		const parent = dataItem.get("parent");
		if (parent) {
			$array.each(this.dataItems, (item) => {
				if (item.get("parent") !== parent) {
					$array.move(itemsToDisable, item);
				}
			})
		}

		// disable all columns of the same depth which are connected to start bullet data item
		const id = dataItem.get("id")!;
		const checkIfConnected = (id: string) => {
			$array.each(this.dataItems, (item) => {
				const links = item.get("links");
				if (links && links[id]) {
					itemsToDisable.push(item);
					checkIfConnected(item.get("id")!);
				}
			})
		}
		checkIfConnected(id);

		$array.each(itemsToDisable, (item) => {
			const column = item.get("graphics") as RoundedRectangle;
			if (column) {
				column.states.applyAnimate("disabled");
			}
			const container = item.get("container") as Container;
			if (container) {
				container.states.applyAnimate("disabled");
			}

			const zeroRectangle = item.get("zeroRectangle") as RoundedRectangle;
			if (zeroRectangle) {
				zeroRectangle.states.applyAnimate("disabled");
			}
		})
	}

	protected _updateConnector(point: IPoint) {

		let startPoint = this._startBullet?.toGlobal({ x: 0, y: 0 });
		if (startPoint) {

			startPoint = this.toLocal(startPoint);

			this.connectorLine.setAll({
				segments: [[[{ x: startPoint.x, y: startPoint.y }, { x: point.x, y: point.y }]]]
			});

			this.connectorArrow.setAll({
				x: point.x,
				y: point.y,
				rotation: $math.getAngle(startPoint, point) + 90,
			});
		}
	}

	protected _endConnector() {

		let startPoint = this._startBullet?.toGlobal({ x: 0, y: 0 });
		if (startPoint) {
			startPoint = this.toLocal(startPoint);

			this.connectorLine.hide();
			this.connectorArrow.hide();

			$array.each(this.dataItems, (item) => {
				const column = item.get("graphics") as RoundedRectangle;
				if (column && column.isVisible()) {
					column.states.applyAnimate("default");
				}

				const container = item.get("container") as Container;
				if (container && container.isVisible()) {
					container.states.applyAnimate("default");
				}

				const zeroRectangle = item.get("zeroRectangle") as RoundedRectangle;
				if (zeroRectangle && zeroRectangle.isVisible()) {
					zeroRectangle.states.applyAnimate("default");
				}
			})

			let dataItem = this._hoveredDataItem as DataItem<IGanttSeriesDataItem>;

			if (dataItem && dataItem !== this._startBullet?.dataItem) {
				const id = dataItem.get("id");

				if (id) {
					const startDataItem = this._startBullet?.dataItem as DataItem<IGanttSeriesDataItem>;

					if (startDataItem) {
						const linkTo: Array<string> = startDataItem.get("linkTo", []);
						if ($array.indexOf(linkTo, id) === -1) {
							linkTo.push(id);
							startDataItem.set("linkTo", linkTo);
							this.markDirtyValues();
						}
					}
				}
			}
			this._updateLinks();
		}

		this.endBullets.each((bullet) => {
			bullet.show();
		})

		this.startBullets.each((bullet) => {
			bullet.hide();
		})

		this.chart?.set("panX", this._xPan);
		this.chart?.set("panY", this._yPan);
	}

	/**
	 * Fixes values of a data item, adjusting start, end, or duration as needed.
	 */
	protected _fixValues(dataItem: DataItem<IGanttSeriesDataItem>, keep: "start" | "end" | "duration") {
		let valueX = dataItem.get("valueX");
		let openValueX = dataItem.get("openValueX");
		let duration = dataItem.get("duration", 0);

		if ($type.isNumber(valueX) && $type.isNumber(openValueX)) {
			if (keep === "start") {
				valueX = this.roundValue(valueX);
				duration = this.getDataItemDuration(dataItem);
				dataItem.set("duration", duration);
			}
			else if (keep === "end") {
				openValueX = this.roundValue(openValueX, true);
				duration = this.getDataItemDuration(dataItem);
				dataItem.set("duration", duration);
			}
			else if (keep === "duration") {
				openValueX = this.roundValue(openValueX, true);
				valueX = openValueX + duration * this.getUnitDuration();
			}

			openValueX = this.getOpenValue(openValueX);
			valueX = this.getEndValue(openValueX, duration);

			const animationDuration = this.get("interpolationDuration", 0);
			const animationEasing = this.get("interpolationEasing");
			const index = this.dataItems.indexOf(dataItem);

			if (index >= this.startIndex() && index <= this.endIndex()) {
				dataItem.animate({ key: "openValueXWorking", to: openValueX, duration: animationDuration, easing: animationEasing });
				dataItem.animate({ key: "valueXWorking", to: valueX, duration: animationDuration, easing: animationEasing });
				// animate not working also
				dataItem.animate({ key: "openValueX", to: openValueX, duration: animationDuration, easing: animationEasing });
				dataItem.animate({ key: "valueX", to: valueX, duration: animationDuration, easing: animationEasing });
			}
			else {
				dataItem.set("openValueXWorking", openValueX);
				dataItem.set("valueXWorking", valueX);
				dataItem.set("openValueX", openValueX);
				dataItem.set("valueX", valueX);
			}
		}
	}

	protected _toggleColumn(dataItem: DataItem<this["_dataItemSettings"]>, visible: boolean) {
		super._toggleColumn(dataItem, visible);
		const container = dataItem.get("container");
		if (container) {
			container.setPrivate("visible", visible);
		}
	}

	protected _afterDataChange(): void {
		const yAxis = this.get("yAxis") as GanttCategoryAxis<GanttCategoryAxisRenderer>;
		$array.each(this.dataItems, (dataItem) => {
			this._fixValues(dataItem, "duration");
			const category = dataItem.get("categoryY");

			if (category) {
				const categoryAxisDataItem = yAxis.dataItems.find((item) => item.get("category") === category);

				dataItem.set("categoryAxisDataItem", categoryAxisDataItem);
				if (categoryAxisDataItem) {
					categoryAxisDataItem.on("duration", () => {
						const duration = categoryAxisDataItem.get("duration");
						const children = dataItem.get("children");
						if (!children || children.length === 0) {
							if (duration !== undefined) {
								dataItem.set("duration", duration);
								this._fixValues(dataItem, "duration");
							}
						}
					})
				}
			}
		})

		this.get("yAxis").markDirtyTree();
		super._afterDataChange();
	}

	protected _updateLinks() {

		const xAxis = this.get("xAxis") as ValueAxis<AxisRendererX>;
		const yAxis = this.get("yAxis") as GanttCategoryAxis<GanttCategoryAxisRenderer>;
		const yRenderer = yAxis.get("renderer") as GanttCategoryAxisRenderer;
		let endRadius = 0;
		const endBullet = this.endBullets.getIndex(0);
		if (endBullet && endBullet.isVisible()) {
			endRadius = endBullet.get("radius", 0);
		}

		let columnHeight: number | Percent = percent(60);
		let column = this.columns.getIndex(0);
		if (column) {
			columnHeight = column.get("height", 0);
		}

		$array.each(this.dataItems, (dataItem) => {
			const linkTo = dataItem.get("linkTo");

			const categoryDataItem = dataItem.get("categoryAxisDataItem") as DataItem<IGanttCategoryAxisDataItem>;


			if (linkTo) {
				let links = dataItem.get("links");
				const linkHorizontalOffset = this.get("linkHorizontalOffset", 25);

				$array.each(linkTo, (dataItemId) => {
					if (!links) {
						links = dataItem.set("links", {});
					}

					let link = links[dataItemId];

					if (!link) {
						link = this.links.make();
						links[dataItemId] = link;
						this.links.push(link);
						this.linksContainer.children.push(link);
						link.appear();

						link.events.on("click", () => {
							if (link.get("active")) {
								this.links.removeValue(link);
								const links = dataItem.get("links");
								if (links) {
									delete links[dataItemId];
								}

								$array.remove(linkTo, dataItemId);
								this.markDirtyValues();
								link.dispose();
							}
						})

						link.events.on("globalpointerup", () => {
							if (link.get("active") && !link.isHover()) {
								link.set("active", false);
							}
						})
					}

					const points: Array<IPoint> = [];

					const positionX = xAxis.valueToPosition(dataItem.get("valueX", 0));
					const positionY = yAxis.categoryToPosition(dataItem.get("categoryY")!);

					const point = this.getPoint(positionX, positionY);

					let firstPoint = { x: point.x + endRadius, y: point.y };

					if (dataItem.get("duration", 0) === 0) {
						let y0 = yAxis.indexToPosition(categoryDataItem.get("index", 0), 0);
						let y1 = yAxis.indexToPosition(categoryDataItem.get("index", 0), 1);
						y0 = yRenderer.positionToCoordinate(y0);
						y1 = yRenderer.positionToCoordinate(y1);

						let h = (y1 - y0) / 2;
						if (columnHeight instanceof Percent) {
							h *= columnHeight.value;
						}

						firstPoint.x += h - endRadius;
					}

					points.push(firstPoint);
					points.push({ x: firstPoint.x + linkHorizontalOffset, y: firstPoint.y });

					const targetDataItem = this.getDataItemById(dataItemId) as DataItem<IGanttSeriesDataItem>;

					if (targetDataItem) {

						const positionX = xAxis.valueToPosition(targetDataItem.get("openValueX", 0));
						const positionY = yAxis.categoryToPosition(targetDataItem.get("categoryY")!);

						const point = this.getPoint(positionX, positionY);

						let x = point.x;
						let y = point.y;

						let lastPoint = { x: x, y: y };

						if (targetDataItem.get("duration", 0) === 0) {
							let targetCategoryDataItem = targetDataItem.get("categoryAxisDataItem") as DataItem<IGanttCategoryAxisDataItem>;
							if (targetCategoryDataItem) {
								let y0 = yAxis.indexToPosition(targetCategoryDataItem.get("index", 0), 0);
								let y1 = yAxis.indexToPosition(targetCategoryDataItem.get("index", 0), 1);
								y0 = yRenderer.positionToCoordinate(y0);
								y1 = yRenderer.positionToCoordinate(y1);

								let h = (y1 - y0) / 2;
								if (columnHeight instanceof Percent) {
									h *= columnHeight.value;
								}

								lastPoint.x -= h;
							}
						}

						if (lastPoint.x - linkHorizontalOffset < firstPoint.x + linkHorizontalOffset) {
							const category = dataItem.get("categoryY");
							const yAxis = this.get("yAxis") as CategoryAxis<AxisRendererY>;

							if (category) {
								let index = yAxis.categoryToIndex(category);

								const position0 = yAxis.indexToPosition(index);
								const position1 = yAxis.indexToPosition(index, 1);

								if (yAxis && category) {

									let sign = -1;
									if (lastPoint.y > firstPoint.y) {
										sign = 1;
									}

									let y = yAxis.get("renderer").positionToCoordinate(yAxis.categoryToPosition(category) + (position1 - position0) * sign);

									points.push({ x: firstPoint.x + linkHorizontalOffset, y: y });
								}
							}
						}

						points.push({ x: lastPoint.x - linkHorizontalOffset, y: lastPoint.y });
						points.push(lastPoint);

					}
					link.set("points", points);
				});
			}
		})
	}

	/**
	 * Updates series graphics.
	 */
	protected _updateSeriesGraphics(dataItem: DataItem<this["_dataItemSettings"]>, graphics: Graphics, l: number, r: number, t: number, b: number, _fitW: boolean, fitH: boolean) {
		super._updateSeriesGraphics(dataItem, graphics, l, r, t, b, false, fitH);
		let x = dataItem.get("left", 0);
		let y = dataItem.get("top", 0);
		let width = dataItem.get("right", 0) - x;
		let height = dataItem.get("bottom", 0) - y;

		// Update the container position and size
		const container = dataItem.get("container");
		const mask = dataItem.get("mask");
		const categoryAxisDataItem = dataItem.get("categoryAxisDataItem") as DataItem<IGanttCategoryAxisDataItem>;
		const fill = categoryAxisDataItem ? categoryAxisDataItem.get("customColor", categoryAxisDataItem.get("color")) : undefined;

		dataItem.setRaw("name", (categoryAxisDataItem.dataContext as any).name);

		const startBullet = dataItem.get("startBullet");
		startBullet?.setAll({
			x: 0,
			stroke: fill
		});

		const endBullet = dataItem.get("endBullet");
		endBullet?.setAll({
			stroke: fill,
			x: width
		});

		if (container) {
			container.setAll({
				x: x,
				y: y,
				width: width,
				height: height
			});
		}

		const maskedContainer = dataItem.get("maskedContainer");
		if (maskedContainer) {
			maskedContainer.setAll({
				x: 0,
				y: 0,
				width: width,
				height: height
			});
		}

		if (mask) {
			mask.setAll({
				x: 0,
				y: 0,
				width: width,
				height: height
			});
		}

		const startGrip = dataItem.get("startGrip");
		if (startGrip) {
			startGrip.setAll({
				height: height
			})
		}

		const endGrip = dataItem.get("endGrip");
		if (endGrip) {
			endGrip.setAll({
				x: width,
				height: height
			});
		}

		// update progress rectangle
		const progressRectangle = dataItem.get("progressRectangle");
		if (progressRectangle) {
			const progress = dataItem.get("progress", 0);
			const progressWidth = width - width * progress;

			progressRectangle.setAll({
				x: width - progressWidth,
				width: progressWidth,
				height: height
			});

			const progressGrip = dataItem.get("progressGrip");
			if (progressGrip) {
				progressGrip.setAll({
					x: width - progressWidth
				});
			}

			const zeroRectangle = dataItem.get("zeroRectangle");
			if (zeroRectangle) {
				zeroRectangle.markDirtyKey("fillPattern")
			}
		}
	}


	/**
	 * Hides series's data item.
	 * 
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.hideDataItem(dataItem, duration)];
		const container = dataItem.get("container");
		if (container) {
			promises.push(container.hide(duration));
		}

		// hide all links
		const links = dataItem.get("links", {});
		if (links) {
			$object.each(links, (_key, link: Link) => {
				link.hide(duration);
			});
		}

		// hide all links to this data item
		const id = dataItem.get("id")!;
		if (id) {
			$array.each(this.dataItems, (item) => {
				const linkTo = item.get("linkTo");
				if (linkTo && linkTo.includes(id)) {
					const links: { [index: string]: Link } | undefined = item.get("links");
					if (links && links[id]) {
						const link = links[id];
						link.hide(duration);
					}
				}
			})
		}

		await Promise.all(promises);
	}

	/**
	 * Shows series's data item.
	 * 
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.showDataItem(dataItem, duration)];
		const container = dataItem.get("container");
		if (container) {
			promises.push(container.show(duration));
		}

		// show all links
		const links = dataItem.get("links", {});
		if (links) {
			$object.each(links, (_key, link: Link) => {
				link.show(duration);
			});
		}

		// show all links to this data item
		const id = dataItem.get("id")!;
		if (id) {
			$array.each(this.dataItems, (item) => {
				const linkTo = item.get("linkTo");
				if (linkTo && linkTo.includes(id)) {
					const links: { [index: string]: Link } | undefined = item.get("links");
					if (links && links[id]) {
						const link = links[id];
						link.show(duration);
					}
				}
			})
		}

		await Promise.all(promises);
	}

	/**
	 * Disposes a data item and removes it from the series.
	 *
	 * @param dataItem  Data item
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);

		const container = dataItem.get("container");
		if (container) {
			this.containers.removeValue(container);
			container.dispose();
		}

		const startBullet = dataItem.get("startBullet");
		if (startBullet) {
			this.startBullets.removeValue(startBullet);
			startBullet.dispose();
		}

		const endBullet = dataItem.get("endBullet");
		if (endBullet) {
			this.endBullets.removeValue(endBullet);
			endBullet.dispose();
		}
		const startGrip = dataItem.get("startGrip");
		if (startGrip) {
			this.startGrips.removeValue(startGrip);
			startGrip.dispose();
		}
		const endGrip = dataItem.get("endGrip");
		if (endGrip) {
			this.endGrips.removeValue(endGrip);
			endGrip.dispose();
		}
		const progressRectangle = dataItem.get("progressRectangle");
		if (progressRectangle) {
			this.progressRectangles.removeValue(progressRectangle);
			progressRectangle.dispose();
		}
		const zeroRectangle = dataItem.get("zeroRectangle");
		if (zeroRectangle) {
			this.zeroRectangles.removeValue(zeroRectangle);
			zeroRectangle.dispose();
		}
		const progressGrip = dataItem.get("progressGrip");
		if (progressGrip) {
			this.progressGrips.removeValue(progressGrip);
			progressGrip.dispose();
		}

		this.disposeLinks(dataItem);
	}

	/**
	 * Disposes all links of a data item and removes them from the series.
	 *
	 * @param dataItem  Data item
	 */
	public disposeLinks(dataItem: DataItem<IGanttSeriesDataItem>) {
		const links = dataItem.get("links", {});
		if (links) {
			$object.each(links, (key, link: Link) => {
				link.dispose();
				delete links[key];
			});
			dataItem.set("linkTo", []);
		}

		const id = dataItem.get("id", "");

		if (id) {
			$array.each(this.dataItems, (item) => {
				const linkTo = item.get("linkTo");
				if (linkTo && linkTo.includes(id)) {
					$array.remove(linkTo, id);

					const links: { [index: string]: Link } | undefined = item.get("links");
					if (links && links[id]) {
						const link = links[id];
						this.links.removeValue(link);
						delete links[id];
						link.dispose();
					}
				}
			})
		}
	}

	/**
	 * Returns the duration of a data item in units.
	 *
	 * @param dataItem  Data item
	 * @return Duration in units
	 */
	public getDataItemDuration(dataItem: DataItem<IGanttSeriesDataItem>): number {
		const openValueX = dataItem.get("openValueX", 0);
		let valueX = dataItem.get("valueX", 0);

		// if valueX is within weekend or holiday, round it to the end of a previous work day
		return Math.round((valueX - openValueX) / this.getUnitDuration()) - this.getHolidayCount(openValueX, valueX);
	}

	/**
	 * Returns the depth of a data item in the hierarchy.
	 *
	 * @param dataItem  Data item
	 * @return Depth level
	 */
	public getDepth(dataItem: DataItem<IGanttSeriesDataItem>): number {
		let depth = 0;
		let parent = dataItem.get("parent");
		while (parent) {
			depth++;
			parent = parent.get("parent");
		}
		return depth;
	}

	/**
	 * Returns the end value of a data item, adjusting for holidays and weekends.
	 *
	 * @param openValue  Open value in milliseconds
	 * @param duration   Duration in units
	 * @return           Adjusted end value in milliseconds
	 */
	public getEndValue(openValue: number, duration: number): number {
		let adjustedDuration = duration;

		const unitDuration = this.getUnitDuration();

		if (this.gantt.get("excludeWeekends", true)) {
			for (let i = 0; i < adjustedDuration; i++) {
				if (this.isHoliday(openValue + i * unitDuration)) {
					adjustedDuration++;
				}
			}
		}
		return openValue + adjustedDuration * unitDuration;
	}

	/**
	 * Returns the open value of a data item, adjusting for holidays and weekends.
	 *
	 * @param openValue  Open value in milliseconds
	 * @return           Adjusted open value
	 */
	public getOpenValue(openValue: number): number {
		if (this.gantt.get("excludeWeekends", true)) {
			while (this.isHoliday(openValue)) {
				openValue += this.getUnitDuration();
			}
		}
		return openValue;
	}

	/**
	 * Returns the duration of a unit in milliseconds.
	 *
	 * @return Duration in milliseconds
	 */
	public getUnitDuration(): number {
		return $time.getDuration(this.gantt.get("durationUnit", "day"));
	}

	/**
	 * Returns the count of holidays between two dates.
	 *
	 * @param start  Start date in milliseconds
	 * @param end    End date in milliseconds
	 * @return       Count of holidays
	 */
	public getHolidayCount(start: number, end: number): number {
		let count = 0;
		let holiday = true;
		for (let i = end; i >= start; i -= this.getUnitDuration()) {
			if (!this.isHoliday(i)) {
				holiday = false;
			}
			else {
				if (!holiday && this.isHoliday(i)) {
					count++;
				}
			}
		}
		return count;
	}

	/**
		 * Checks if a given date is a holiday or weekend.
		 *
		 * @param value  Date value in milliseconds
		 * @return       `true` if the date is a holiday or weekend, otherwise `false`
		 */
	public isHoliday(value: number): boolean {
		if (this.gantt.get("excludeWeekends", true)) {
			const holidays = this.gantt.get("holidays", []);
			const weekends = this.gantt.get("weekends", [0, 6]);

			const date = new Date(value);

			if (weekends.includes(date.getDay())) {
				return true;
			}

			if (holidays && holidays.length > 0) {
				let isHoliday = false;
				$array.eachContinue(holidays, (holiday) => {
					if (holiday instanceof Date) {
						const start = holiday.getTime()
						const end = holiday.getTime() + $time.getDuration("day");
						if (value >= start && value < end) {
							isHoliday = true;
							return false;
						}
					}
					return true;
				})
				return isHoliday;
			}
		}
		return false;
	}
}
