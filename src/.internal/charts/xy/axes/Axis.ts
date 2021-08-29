import type { AxisRenderer } from "./AxisRenderer";
import type { AxisLabel } from "./AxisLabel";
import type { AxisTick } from "./AxisTick";
import type { Graphics } from "../../../core/render/Graphics";
import type { Grid } from "./Grid";
import type { AxisBullet } from "./AxisBullet";
import type { XYChart } from "../XYChart";
import type { XYSeries, IXYSeriesDataItem } from "../series/XYSeries";
import type { Animation } from "../../../core/util/Entity";
import type { Tooltip } from "../../../core/render/Tooltip";
import type { Root } from "../../../core/Root";

import { DataItem } from "../../../core/render/Component";
import { Component, IComponentSettings, IComponentPrivate, IComponentEvents } from "../../../core/render/Component";
import { Container } from "../../../core/render/Container";
import { p100 } from "../../../core/util/Percent";
import { List } from "../../../core/util/List";
import { Rectangle } from "../../../core/render/Rectangle";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";



export interface IAxisSettings<R extends AxisRenderer> extends IComponentSettings {
	/**
	 * A renderer object which is responsible of rendering visible axis elements.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/#Axis_renderer} for more info
	 */
	renderer: R;

	/**
	 * The initial relative zoom start position of the axis.
	 *
	 * E.g. stting it to `0.1` will pre-zoom axis to 10% from the start.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Pre_zooming_axes} for more info
	 */
	start?: number;

	/**
	 * The initial relative zoom end position of the axis.
	 *
	 * E.g. stting it to `0.9` will pre-zoom axis to 10% from the end.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Pre_zooming_axes} for more info
	 */
	end?: number;

	/**
	 * Maximum number of times the scope of the axis could auto-zoom-in.
	 *
	 * This is to prevent axis jumping too drastically when scrolling/zooming.
	 *
	 * @default 1000
	 */
	maxZoomFactor?: number;

	/**
	 * Maximum number of axis elements to show at a time.
	 *
	 * E.g. for a [[CategoryAxis]] that would be number of categories.
	 * For a [[DateAxis]] it would be number of `baseInterval`.
	 *
	 * The axis will not allow to be zoomed out beyond this number.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Limiting_zoom_scope} for more info
	 */
	maxZoomCount?: number;

	/**
	 * Minimum number of axis elements to show at a time.
	 *
	 * E.g. for a [[CategoryAxis]] that would be number of categories.
	 * For a [[DateAxis]] it would be number of `baseInterval`.
	 *
	 * The axis will not allow to be zoomed in beyond this number.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Limiting_zoom_scope} for more info
	 */
	minZoomCount?: number;

	/**
	 * Base value of the axis.
	 */
	baseValue?: number;

	/**
	 * If set to `false` the axis will be exempt when chart is panned
	 * horizontally, and will keep its current position.`
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Excluding_axes_from_pan_or_zoom} for more info
	 */
	panX?: boolean;

	/**
	 * If set to `false` the axis will be exempt when chart is panned
	 * vertically, and will keep its current position.`
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Excluding_axes_from_pan_or_zoom} for more info
	 */
	panY?: boolean;

	/**
	 * If set to `false` the axis will be exempt when chart is zoomed
	 * horizontally, and will keep its current zoom/position.`
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Excluding_axes_from_pan_or_zoom} for more info
	 */
	zoomX?: boolean;

	/**
	 * If set to `false` the axis will be exempt when chart is zoomed
	 * vertically, and will keep its current zoom/position.`
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Excluding_axes_from_pan_or_zoom} for more info
	 */
	zoomY?: boolean;

	/**
	 * A relative distance the axis is allowed to be zoomed/panned beyond its
	 * actual scope.
	 *
	 * @default 0.1
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Over_zooming} for more info
	 */
	maxDeviation?: number;

	/**
	 * [[Tooltip]] element to use for axis.
	 */
	tooltip?: Tooltip;

	/**
	 * If set to `true` tooltip will snap to the current cell. `tooltiLocation` indicates
	 * which relative place to snap to: `0` beginning, `0.5` - middle, `1` - end.
	 *
	 * @default 0.5
	 */
	tooltipLocation?: number;

	/**
	 * Should tooltip snap to the `tooltipLocation` (`true`) or follow cursor.
	 *
	 * @default true
	 */
	snapTooltip?: boolean;

	/**
	 * If set to `true` (default) the axis width will stay constant across all
	 * zooms, even if actual length of all visible labels changes.
	 *
	 * @default true
	 */
	fixAxisSize?: boolean;

	// @todo description
	bullet?: (root: Root, axis:Axis<AxisRenderer>, dataItem: DataItem<IAxisDataItem>) => AxisBullet;

}

export interface IAxisEvents extends IComponentEvents {
}

export interface IAxisPrivate extends IComponentPrivate {

	/**
	 * @ignore
	 */
	name?: "value" | "date" | "category";

	/**
	 * @ignore
	 */
	updateScrollbar?: boolean;

	maxZoomFactor?: number;

}

export interface IAxisDataItem {

	/**
	 * Axis label element.
	 */
	label?: AxisLabel;

	/**
	 * Tick element.
	 */
	tick?: AxisTick;

	/**
	 * Grid line element.
	 */
	grid?: Grid;

	/**
	 * Axis fill element.
	 */
	axisFill?: Graphics;

	/**
	 * Bullet element.
	 */
	bullet?: AxisBullet;

	/**
	 * Indicates if this data item represents an axis range.
	 */
	isRange?: boolean;

}

/**
 * A base class for all axes.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/#Adding_axes} for more info
 */
export abstract class Axis<R extends AxisRenderer> extends Component {
	public static className: string = "Axis";
	public static classNames: Array<string> = Component.classNames.concat([Axis.className]);

	declare public _settings: IAxisSettings<R>;
	declare public _privateSettings: IAxisPrivate;
	declare public _dataItemSettings: IAxisDataItem;
	declare public _events: IAxisEvents;

	declare public _seriesType: XYSeries;

	protected _series: Array<this["_seriesType"]> = [];

	/**
	 * A [[Container]] that holds all the axis label elements.
	 *
	 * @default Container.new()
	 */
	public readonly labelsContainer: Container = this.children.push(Container.new(this._root, {}));

	/**
	 * A [[Container]] that holds all the axis grid and fill elements.
	 * 
	 * @default Container.new()
	 */
	public readonly gridContainer: Container = Container.new(this._root, { width: p100, height: p100 });

	/**
	 * A [[Container]] that holds axis grid elements which goes above the series.
	 * 
	 * @default Container.new()
	 */
	public readonly topGridContainer: Container = Container.new(this._root, { width: p100, height: p100 });	

	/**
	 * A [[Container]] that holds all the axis bullet elements.
	 *
	 * @default new Container
	 */
	public readonly bulletsContainer: Container = Container.new(this._root, { isMeasured:false, width: p100, height: p100, position:"absolute" });

	/**
	 * A referenece to the the chart the axis belongs to.
	 */
	public chart: XYChart | undefined;

	protected _rangesDirty: Boolean = false;

	public _panStart: number = 0;
	public _panEnd: number = 1;

	protected _sAnimation?: Animation<this["_settings"]["start"]>;
	protected _eAnimation?: Animation<this["_settings"]["end"]>;

	/**
	 * A list of axis ranges.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-ranges/} for more info
	 * @default new List()
	 */
	public readonly axisRanges: List<DataItem<this["_dataItemSettings"]>> = new List();

	public _seriesAxisRanges: Array<DataItem<this["_dataItemSettings"]>> = [];

	/**
	 * A control label that is invisible but is used to keep width the width of
	 * the axis constant.
	 */
	public ghostLabel!: AxisLabel;

	protected _cursorPosition?: number;

	protected _snapToSeries?: Array<XYSeries>;

	/**
	 * A container above the axis that can be used to add additional stuff into
	 * it. For example a legend, label, or an icon.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-headers/} for more info
	 * @default new Container
	 */
	public axisHeader: Container = this.children.push(Container.new(this._root, {
		themeTags: ["axis", "header"],
		position: "absolute",
		background: Rectangle.new(this._root, {
			themeTags: ["header", "background"],
			fill: this._root.interfaceColors.get("background")
		})
	}));

	protected _afterNew() {
		super._afterNew();

		this._setPrivate("updateScrollbar", true);

		this._disposers.push(this.axisRanges.events.onAll((change) => {
			if (change.type === "clear") {
				this.axisRanges.each((dataItem) => {
					dataItem.dispose();
				});
			} else if (change.type === "push") {
				this._processAxisRange(change.newValue);
			} else if (change.type === "setIndex") {
				this._processAxisRange(change.newValue);
			} else if (change.type === "insertIndex") {
				this._processAxisRange(change.newValue);
			} else if (change.type === "removeIndex") {
				change.oldValue.dispose();
			} else {
				throw new Error("Unknown IStreamEvent type");
			}
		}))

		const renderer = this.get("renderer");
		if (renderer) {
			renderer.axis = this;
			renderer.processAxis();
		}
		this.children.push(renderer);
		this.ghostLabel = this.labelsContainer.children.push(renderer.makeLabel(new DataItem(this, undefined, {})));
		this.ghostLabel.set("opacity", 0);
	}

	/**
	 * Zooms the axis to relative locations.
	 *
	 * Both `start` and `end` are relative: 0 means start of the axis, 1 - end.
	 *
	 * @param   start     Relative start
	 * @param   end       Relative end
	 * @param   duration  Duration of the zoom animation in milliseconds
	 * @return            Zoom animation
	 */
	public zoom(start: number, end: number, duration?: number): Animation<this["_settings"]["start"]> | Animation<this["_settings"]["end"]> | undefined {

		if (this.get("start") !== start || this.get("end") != end) {

			let sAnimation = this._sAnimation;
			let eAnimation = this._eAnimation;

			let maxDeviation = this.get("maxDeviation", 0.5) * Math.min(1, (end - start));

			if (start < - maxDeviation) {
				start = -maxDeviation;
			}

			if (end > 1 + maxDeviation) {
				end = 1 + maxDeviation;
			}

			if (start > end) {
				[start, end] = [end, start];
			}

			if (!$type.isNumber(duration)) {
				duration = this.get("interpolationDuration", 0);
			}

			let priority: "start" | "end" = "end";
			let maxZoomFactor = this.getPrivate("maxZoomFactor", this.get("maxZoomFactor", 100));

			if (end === 1 && start !== 0) {
				if (start < this.get("start")) {
					priority = "start";
				}
				else {
					priority = "end";
				}
			}

			if (start === 0 && end !== 1) {
				if (end > this.get("end")) {
					priority = "end";
				}
				else {
					priority = "start";
				}
			}

			let minZoomCount = this.get("minZoomCount");
			let maxZoomCount = this.get("maxZoomCount");

			if ($type.isNumber(minZoomCount)) {
				maxZoomFactor = maxZoomFactor / minZoomCount;
			}

			let minZoomFactor: number = 1;

			if ($type.isNumber(maxZoomCount)) {
				minZoomFactor = maxZoomFactor / maxZoomCount;
			}

			// most likely we are dragging left scrollbar grip here, so we tend to modify end
			if (priority === "start") {
				if (maxZoomCount > 0) {
					// add to the end
					if (1 / (end - start) < minZoomFactor) {
						end = start + 1 / minZoomFactor;
					}
				}

				// add to the end
				if (1 / (end - start) > maxZoomFactor) {
					end = start + 1 / maxZoomFactor;
				}
				//unless end is > 0
				if (end > 1 && end - start < 1 / maxZoomFactor) {
					//end = 1;
					start = end - 1 / maxZoomFactor;
				}
			}
			// most likely we are dragging right, so we modify left
			else {
				if (maxZoomCount > 0) {
					// add to the end
					if (1 / (end - start) < minZoomFactor) {
						start = end - 1 / minZoomFactor;
					}
				}

				// remove from start
				if (1 / (end - start) > maxZoomFactor) {
					start = end - 1 / maxZoomFactor;
				}
				if (start < 0 && end - start < 1 / maxZoomFactor) {
					//start = 0;
					end = start + 1 / maxZoomFactor;
				}
			}

			if (1 / (end - start) > maxZoomFactor) {
				end = start + 1 / maxZoomFactor;
			}

			if (1 / (end - start) > maxZoomFactor) {
				start = end - 1 / maxZoomFactor;
			}

			if (((sAnimation && sAnimation.playing && sAnimation.to == start) || this.get("start") == start) && ((eAnimation && eAnimation.playing && eAnimation.to == end) || this.get("end") == end)) {
				return;
			}

			if (duration > 0) {

				let sAnimation = this.animate({ key: "start", to: start, duration: duration, easing: this.get("interpolationEasing") });
				let eAnimation = this.animate({ key: "end", to: end, duration: duration, easing: this.get("interpolationEasing") });

				this._sAnimation = sAnimation;
				this._eAnimation = eAnimation;

				if (sAnimation) {
					return sAnimation;
				}
				else if (eAnimation) {
					return eAnimation;
				}
			}
			else {
				this.set("start", start);
				this.set("end", end);
			}
		}
	}

	/**
	 * A list of series using this axis.
	 *
	 * @return Series
	 */
	public get series(): Array<this["_seriesType"]> {
		return this._series;
	}


	public _processAxisRange(dataItem: DataItem<this["_dataItemSettings"]>) {
		dataItem.set("isRange", true);
		this._createAssets(dataItem);
		this._rangesDirty = true;
		this._prepareDataItem(dataItem);

		const grid = dataItem.get("grid");
		if(grid){
			this.topGridContainer.children.push(grid);
		}

		const fill = dataItem.get("axisFill");
		if(fill){
			this.topGridContainer.children.push(fill);
		}		
	}

	public _prepareDataItem(_dataItem: DataItem<this["_dataItemSettings"]>, _index?: number) {

	}

	/**
	 * @ignore
	 */
	public abstract getX(_value: any, _location: number, baseValue?: any): number;

	/**
	 * @ignore
	 */
	public abstract getY(_value: any, _location: number, baseValue?: any): number;

	/**
	 * @ignore
	 */
	public abstract getDataItemCoordinateX(_dataItem: DataItem<IXYSeriesDataItem>, _field: string, _cellLocation?: number, _axisLocation?: number): number;

	/**
	 * @ignore
	 */
	public abstract getDataItemCoordinateY(_dataItem: DataItem<IXYSeriesDataItem>, _field: string, _cellLocation?: number, _axisLocation?: number): number;

	/**
	 * @ignore
	 */
	public abstract getDataItemPositionX(_dataItem: DataItem<IXYSeriesDataItem>, _field: string, _cellLocation?: number, _axisLocation?: number): number;

	/**
	 * @ignore
	 */
	public abstract getDataItemPositionY(_dataItem: DataItem<IXYSeriesDataItem>, _field: string, _cellLocation?: number, _axisLocation?: number): number;

	/**
	 * @ignore
	 */
	public markDirtyExtremes() {
	}

	/**
	 * @ignore
	 */
	public markDirtySelectionExtremes() {
	}

	public _calculateTotals() {
	}

	protected _updateAxisRanges() {
		this.axisRanges.each((axisRange) => {
			this._prepareDataItem(axisRange);
		})

		$array.each(this._seriesAxisRanges, (axisRange) => {
			this._prepareDataItem(axisRange);
		})
	}

	/**
	 * @ignore
	 */
	public abstract baseValue(): any;

	public _prepareChildren() {
		super._prepareChildren();
		if (this.isDirty("fixAxisSize")) {
			if (this.get("fixAxisSize")) {
				this.ghostLabel.set("visible", true);
			}
			else {
				this.ghostLabel.set("visible", false);
			}
		}

		if (this.isDirty("start") || this.isDirty("end")) {

			this.chart!._updateCursor();

			let start = this.get("start", 0);
			let end = this.get("end", 1);

			let maxDeviation = this.get("maxDeviation", 0.5) * Math.min(1, (end - start));

			if (start < -maxDeviation) {
				let delta = start + maxDeviation;
				start = -maxDeviation;
				this.setRaw("start", start);
				if (this.isDirty("end")) {
					this.setRaw("end", end - delta);
				}
			}
			if (end > 1 + maxDeviation) {
				let delta = end - 1 - maxDeviation;
				end = 1 + maxDeviation;
				this.setRaw("end", end);

				if (this.isDirty("start")) {
					this.setRaw("start", start - delta);
				}
			}
		}

		const renderer = this.get("renderer");
		renderer._start = this.get("start")!;
		renderer._end = this.get("end")!;
		renderer._inversed = renderer.get("inversed", false);
		renderer._axisLength = renderer.axisLength() / (renderer._end - renderer._start);
	}

	public _updatePosition() {
		super._updatePosition();
		this._updateTooltipBounds();
	}

	public _updateTooltipBounds() {
		const tooltip = this.get("tooltip")!;
		if (tooltip) {
			this.get("renderer").updateTooltipBounds(tooltip);
		}
	}

	public _updateBounds() {
		super._updateBounds();
		this._updateTooltipBounds();
	}

	/**
	 * @ignore
	 */
	public processChart(chart: XYChart) {
		this.chart = chart;
		const renderer = this.get("renderer");

		renderer.chart = chart;
		chart.gridContainer.children.push(this.gridContainer);
		chart.topGridContainer.children.push(this.topGridContainer);
		chart.bulletsContainer.children.push(this.bulletsContainer);

		chart.axisHeadersContainer.children.push(this.axisHeader);

		this.on("start", () => {
			chart._handleAxisSelection(this);
		});
		this.on("end", () => {
			chart._handleAxisSelection(this);
		});

		chart.plotContainer.onPrivate("width", ()=>{
			this.markDirtySize()
		});
		chart.plotContainer.onPrivate("height", ()=>{
			this.markDirtySize()
		});

		chart.processAxis(this);
	}

	/**
	 * @ignore
	 */
	public hideDataItem(dataItem: DataItem<IAxisDataItem>): Promise<void> {
		const promises = super.hideDataItem(dataItem);
		const label = dataItem.get("label");
		if (label) {
			label.setPrivate("visible", false);
		}
		const grid = dataItem.get("grid");
		if (grid) {
			grid.setPrivate("visible", false);
		}
		const tick = dataItem.get("tick");
		if (tick) {
			tick.setPrivate("visible", false);
		}
		const axisFill = dataItem.get("axisFill");
		if (axisFill) {
			axisFill.setPrivate("visible", false);
		}
		return promises;
	}

	/**
	 * @ignore
	 */
	public showDataItem(dataItem: DataItem<IAxisDataItem>): Promise<void> {
		const promises = super.showDataItem(dataItem);
		const label = dataItem.get("label");
		if (label) {
			label.setPrivate("visible", true);
		}
		const grid = dataItem.get("grid");
		if (grid) {
			grid.setPrivate("visible", true);
		}
		const tick = dataItem.get("tick");
		if (tick) {
			tick.setPrivate("visible", true);
		}
		const axisFill = dataItem.get("axisFill");
		if (axisFill) {
			axisFill.setPrivate("visible", true);
		}
		return promises;
	}

	/**
	 * @ignore
	 */
	public abstract basePosition(): number;

	public _createAssets(dataItem: DataItem<this["_dataItemSettings"]>) {
		const renderer = this.get("renderer");

		if (!dataItem.get("label")) {
			renderer.makeLabel(dataItem);
		}

		if (!dataItem.get("grid")) {
			renderer.makeGrid(dataItem);
		}

		if (!dataItem.get("tick")) {
			renderer.makeTick(dataItem);
		}

		if (!dataItem.get("axisFill")) {
			renderer.makeAxisFill(dataItem);
		}

		this._processBullet(dataItem);
	}

	protected _processBullet(dataItem: DataItem<this["_dataItemSettings"]>) {
		let bullet = dataItem.get("bullet");
		let axisBullet = this.get("bullet");

		if (!bullet && axisBullet) {
			bullet = axisBullet(this._root, this, dataItem);
		}

		if (bullet) {
			const sprite = bullet.get("sprite");

			if (sprite) {
				sprite._setDataItem(dataItem);
				dataItem.setRaw("bullet", bullet);
				if (!sprite.parent) {
					this.bulletsContainer.children.push(sprite);
				}
			}
		}
	}

	public _afterChanged() {
		super._afterChanged();

		const chart = this.chart;
		if (chart) {
			chart._updateChartLayout();
		}
		this.get("renderer")._updatePositions();
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const label = dataItem.get("label");
		if (label) {
			label.dispose();
		}
		const tick = dataItem.get("tick");
		if (tick) {
			tick.dispose();
		}
		const grid = dataItem.get("grid");
		if (grid) {
			grid.dispose();
		}
		const axisFill = dataItem.get("axisFill");
		if (axisFill) {
			axisFill.dispose();
		}
	}

	protected _updateGhost() {
		const ghostLabel = this.ghostLabel;
		if (!ghostLabel.isHidden()) {
			const bounds = ghostLabel.localBounds();
			const gWidth = bounds.right - bounds.left;

			$array.each(this.dataItems, (dataItem) => {
				const label = dataItem.get("label");
				if (label && !label.isHidden()) {
					const bounds = label.localBounds();
					const w = bounds.right - bounds.left;

					if (w > gWidth) {
						ghostLabel.set("text", label.text._getText());
					}
				}
			})
		}
		let start = this.get("start", 0);
		let end = this.get("end", 1);
		this.get("renderer").updateLabel(this.ghostLabel, start + (end - start) * 0.5);
	}

	public _handleCursorPosition(position: number, snapToSeries?: Array<XYSeries>) {
		const renderer = this.get("renderer");
		position = renderer.toAxisPosition(position);

		this._cursorPosition = position;
		this._snapToSeries = snapToSeries;

		this.updateTooltip();
	}


	/**
	 * @todo needs description
	 * Can be called when axis zoom changes and you need to update tooltip position
	 */
	public updateTooltip() {
		const snapToSeries = this._snapToSeries;
		let position = this._cursorPosition;
		const tooltip = this.get("tooltip")!;
		const renderer = this.get("renderer");

		if ($type.isNumber(position)) {
			if (!snapToSeries) {
				$array.each(this.series, (series) => {
					if (series.get("baseAxis") === this) {
						series.showDataItemTooltip(this.getSeriesItem(series, position!));
					}
				})
			}

			if (tooltip) {
				if (this.get("snapTooltip")) {
					position = this.roundAxisPosition(position, this.get("tooltipLocation", 0.5));
				}

				tooltip.label.set("text", this.getTooltipText(position));
				renderer.positionTooltip(tooltip, position);
			}
		}
	}

	/**
	 * Returns text to be used in an axis tooltip for specific relative position.
	 *
	 * @param   position  Position
	 * @return            Tooltip text
	 */
	public abstract getTooltipText(position: number): string | undefined;

	/**
	 * @ignore
	 */
	public roundAxisPosition(position: number, _location: number): number {
		return position;
	}

	/**
	 * @ignore
	 */
	public handleCursorShow() {
		let tooltip = this.get("tooltip");
		if (tooltip) {
			tooltip.show();
		}
	}

	/**
	 * @ignore
	 */
	public handleCursorHide() {
		let tooltip = this.get("tooltip");
		if (tooltip) {
			tooltip.hide();
		}
	}

	/**
	 * @ignore
	 */
	public processSeriesDataItem(_dataItem: DataItem<IXYSeriesDataItem>, _fields: Array<string>) {

	}

	public _clearDirty() {
		super._clearDirty();
		this._sizeDirty = false;
		this._rangesDirty = false;
	}

	/**
	 * Converts pixel coordinate to a relative position on axis.
	 *
	 * @param   coordinate  Coordinate
	 * @return              Relative position
	 */
	public coordinateToPosition(coordinate: number): number {
		const renderer = this.get("renderer");
		return renderer.toAxisPosition(coordinate / renderer.axisLength());
	}

	/**
	 * @ignore
	 */
	public toAxisPosition(position: number) {
		return this.get("renderer").toAxisPosition(position);
	}

	/**
	 * @ignore
	 */
	public fixPosition(position: number): number {
		return this.get("renderer").fixPosition(position);
	}

	/**
	 * Returns a data item from series that is closest to the `position`.
	 *
	 * @param   series    Series
	 * @param   position  Relative position
	 * @return            Data item
	 */
	public abstract getSeriesItem(series: XYSeries, position: number): DataItem<IXYSeriesDataItem> | undefined

	/**
	 * @ignore
	 */
	public shouldGap(_dataItem: DataItem<IXYSeriesDataItem>, _nextItem: DataItem<IXYSeriesDataItem>, _autoGapCount: number, _fieldName: string): boolean {
		return false;
	}

	/**
	 * Creates and returns an axis range object.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-ranges/} for more info
	 * @param   axisDataItem  Axis data item
	 * @return                Axis range
	 */
	public createAxisRange(axisDataItem: DataItem<IAxisDataItem>): DataItem<this["_dataItemSettings"]> {
		return this.axisRanges.push(axisDataItem);
	}
}
