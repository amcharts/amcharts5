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
import { Component, IComponentSettings, IComponentPrivate, IComponentEvents, IComponentDataItem } from "../../../core/render/Component";
import { Container } from "../../../core/render/Container";
import { p100 } from "../../../core/util/Percent";
import { List } from "../../../core/util/List";
import { Rectangle } from "../../../core/render/Rectangle";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";
import * as $utils from "../../../core/util/Utils";



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
	maxZoomFactor?: number | null;

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
	 * Set this to `false` to prevent axis from being zoomed.
	 */
	zoomable?:boolean;

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
	 * `tooltipLocation` indicates
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

	/**
	 * A function that will be used to create bullets on each cell.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Axis_bullets} for more info
	 */
	bullet?: (root: Root, axis: Axis<AxisRenderer>, dataItem: DataItem<IAxisDataItem>) => AxisBullet;
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

	/**
	 * @ignore
	 */
	maxZoomFactor?: number | null;

	/**
	 * Saves position to which tooltip points.
	 */
	tooltipPosition?: number;

	/**
	 * Width in pixels between grid lines (read-only).
	 * 
	 * It might not be exact, as [[DateAxis]] can have grids at irregular
	 * intervals.
	 * 
	 * Could be used to detect when size changes and to adjust labels for them
	 * not to overlap.
	 */
	cellWidth?: number;

}

export interface IAxisDataItem extends IComponentDataItem {

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

	/**
	 * If set to `true`, the grid and axis fill of this data item will be drawn
	 * above series.
	 *
	 * NOTE: this needs to be set **before** crating an axis range. Updating this
	 * dynamically won't have any effect.
	 *
	 * NOTE: if you need all grid to be drawn above series, you can brig it to
	 * front with `chart.gridContainer.toFront();`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-ranges/#Grid_fill_above_series} for more info
	 * @default false
	 */
	above?: boolean

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

	public _isPanning: boolean = false;

	/**
	 * Array of minor data items.
	 */
	public  minorDataItems: Array<DataItem<this["_dataItemSettings"]>> = [];

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
	public readonly bulletsContainer: Container = this.children.push(Container.new(this._root, { isMeasured: false, width: p100, height: p100, position: "absolute" }));

	/**
	 * A referenece to the the chart the axis belongs to.
	 */
	public chart: XYChart | undefined;

	protected _rangesDirty: Boolean = false;

	public _panStart: number = 0;
	public _panEnd: number = 1;

	protected _sAnimation?: Animation<this["_settings"]["start"]>;
	protected _eAnimation?: Animation<this["_settings"]["end"]>;

	public _skipSync: boolean = false;

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
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/value-axis/#Ghost_label} for more info
	 */
	public ghostLabel!: AxisLabel;

	protected _cursorPosition: number = -1;

	protected _snapToSeries?: Array<XYSeries>;

	public _seriesValuesDirty = false;

	public _seriesAdded = false;

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

	public _bullets: { [index: string]: AxisBullet } = {};

	protected _dispose() {
		// these could be in other parents, so disposing just in case
		this.gridContainer.dispose();
		this.topGridContainer.dispose();
		this.bulletsContainer.dispose();
		this.labelsContainer.dispose();
		this.axisHeader.dispose();
		super._dispose();
	}

	protected _afterNew() {
		super._afterNew();

		this.setPrivate("updateScrollbar", true);

		this._disposers.push(this.axisRanges.events.onAll((change) => {
			if (change.type === "clear") {
				$array.each(change.oldValues, (dataItem) => {
					this.disposeDataItem(dataItem);
				});
			} else if (change.type === "push") {
				this._processAxisRange(change.newValue, ["range"]);
			} else if (change.type === "setIndex") {
				this._processAxisRange(change.newValue, ["range"]);
			} else if (change.type === "insertIndex") {
				this._processAxisRange(change.newValue, ["range"]);
			} else if (change.type === "removeIndex") {
				this.disposeDataItem(change.oldValue);
			} else if (change.type === "moveIndex") {
				this._processAxisRange(change.value, ["range"]);
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
		this.ghostLabel = renderer.makeLabel(new DataItem(this, undefined, {}), []);
		this.ghostLabel.adapters.disable("text");
		this.ghostLabel.setAll({ opacity: 0, tooltipText: undefined, tooltipHTML: undefined, interactive: false });
		this.ghostLabel.events.disable();
	}

	protected _updateFinals(_start: number, _end: number) {

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
	public zoom(start: number, end: number, duration?: number, priority?: "start" | "end"): Animation<this["_settings"]["start"]> | Animation<this["_settings"]["end"]> | undefined {
		if(this.get("zoomable", true)){
			this._updateFinals(start, end);

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

				if (!priority) {
					priority = "end";
				}

				let maxZoomFactor = this.getPrivate("maxZoomFactor", this.get("maxZoomFactor", 100));
				let maxZoomFactorReal = maxZoomFactor;

				if (end === 1 && start !== 0) {
					if (start < this.get("start", 0)) {
						priority = "start";
					}
					else {
						priority = "end";
					}
				}

				if (start === 0 && end !== 1) {
					if (end > this.get("end", 1)) {
						priority = "end";
					}
					else {
						priority = "start";
					}
				}

				let minZoomCount = this.get("minZoomCount", 0);
				let maxZoomCount = this.get("maxZoomCount", Infinity);

				if ($type.isNumber(minZoomCount)) {
					maxZoomFactor = maxZoomFactorReal / minZoomCount;
				}

				let minZoomFactor: number = 1;

				if ($type.isNumber(maxZoomCount)) {
					minZoomFactor = maxZoomFactorReal / maxZoomCount;
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

				if (maxZoomCount != null && minZoomCount != null && (start == this.get("start") && end == this.get("end"))) {
					const chart = this.chart;
					if (chart) {
						chart._handleAxisSelection(this, true);
					}
				}

				if (((sAnimation && sAnimation.playing && sAnimation.to == start) || this.get("start") == start) && ((eAnimation && eAnimation.playing && eAnimation.to == end) || this.get("end") == end)) {
					return;
				}


				if (duration > 0) {
					let easing = this.get("interpolationEasing");
					let sAnimation, eAnimation;
					if (this.get("start") != start) {
						sAnimation = this.animate({ key: "start", to: start, duration: duration, easing: easing });
					}
					if (this.get("end") != end) {
						eAnimation = this.animate({ key: "end", to: end, duration: duration, easing: easing });
					}

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
			else {
				if (this._sAnimation) {
					this._sAnimation.stop();
				}
				if (this._eAnimation) {
					this._eAnimation.stop();
				}
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


	public _processAxisRange(dataItem: DataItem<this["_dataItemSettings"]>, themeTags: Array<string>) {
		dataItem.setRaw("isRange", true);
		this._createAssets(dataItem, themeTags);
		this._rangesDirty = true;
		this._prepareDataItem(dataItem);

		const above = dataItem.get("above");
		const container = this.topGridContainer;

		const grid = dataItem.get("grid");
		if (above && grid) {
			container.children.moveValue(grid);
		}

		const fill = dataItem.get("axisFill");
		if (above && fill) {
			container.children.moveValue(fill);
		}
	}

	public _prepareDataItem(_dataItem: DataItem<this["_dataItemSettings"]>, _index?: number) { }

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
		this._bullets = {};
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

		if (this.get("fixAxisSize")) {
			this.ghostLabel.set("visible", true);
		}
		else {
			this.ghostLabel.set("visible", false);
		}

		if (this.isDirty("start") || this.isDirty("end")) {
			const chart = this.chart;
			if (chart) {
				chart._updateCursor();
			}

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
		renderer._updateLC();

		if (this.isDirty("tooltip")) {
			const tooltip = this.get("tooltip");
			if (tooltip) {
				const rendererTags = renderer.get("themeTags");
				tooltip.addTag("axis");
				tooltip.addTag(this.className.toLowerCase());
				tooltip._applyThemes();

				if (rendererTags) {
					tooltip.set("themeTags", $utils.mergeTags(tooltip.get("themeTags"), rendererTags));
					tooltip.label._applyThemes();
				}
			}
		}
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

		chart.axisHeadersContainer.children.push(this.axisHeader);

		this.on("start", () => {
			chart._handleAxisSelection(this);
		});
		this.on("end", () => {
			chart._handleAxisSelection(this);
		});

		chart.plotContainer.onPrivate("width", () => {
			this.markDirtySize();
		});
		chart.plotContainer.onPrivate("height", () => {
			this.markDirtySize();
		});

		chart.processAxis(this);
	}

	/**
	 * @ignore
	 */
	public hideDataItem(dataItem: DataItem<IAxisDataItem>): Promise<void> {
		this._toggleFHDataItem(dataItem, true);
		return super.hideDataItem(dataItem);
	}

	/**
	 * @ignore
	 */
	public showDataItem(dataItem: DataItem<IAxisDataItem>): Promise<void> {
		this._toggleFHDataItem(dataItem, false);
		return super.showDataItem(dataItem);
	}

	public _toggleFHDataItem(dataItem: DataItem<IAxisDataItem>, forceHidden: boolean) {
		const fh = "forceHidden";
		const label = dataItem.get("label");
		if (label) {
			label.set(fh, forceHidden);
		}
		const grid = dataItem.get("grid");
		if (grid) {
			grid.set(fh, forceHidden);
		}
		const tick = dataItem.get("tick");
		if (tick) {
			tick.set(fh, forceHidden);
		}
		const axisFill = dataItem.get("axisFill");
		if (axisFill) {
			axisFill.set(fh, forceHidden);
		}

		const bullet = dataItem.get("bullet");
		if (bullet) {
			const sprite = bullet.get("sprite");
			if (sprite) {
				sprite.set(fh, forceHidden);
			}
		}
	}


	public _toggleDataItem(dataItem: DataItem<IAxisDataItem>, visible: boolean) {
		const label = dataItem.get("label");
		const v = "visible";
		if (label) {
			label.setPrivate(v, visible);
		}
		const grid = dataItem.get("grid");
		if (grid) {
			grid.setPrivate(v, visible);
		}
		const tick = dataItem.get("tick");
		if (tick) {
			tick.setPrivate(v, visible);
		}
		const axisFill = dataItem.get("axisFill");
		if (axisFill) {
			axisFill.setPrivate(v, visible);
		}

		const bullet = dataItem.get("bullet");
		if (bullet) {
			const sprite = bullet.get("sprite");
			if (sprite) {
				sprite.setPrivate(v, visible);
			}
		}
	}

	/**
	 * @ignore
	 */
	public abstract basePosition(): number;

	public _createAssets(dataItem: DataItem<this["_dataItemSettings"]>, tags: Array<string>, minor?: boolean) {
		const renderer = this.get("renderer");
		let m = "minor";

		const label = dataItem.get("label");
		if (!label) {
			renderer.makeLabel(dataItem, tags);
		}
		else {
			let themeTags = label.get("themeTags");
			let remove = false;
			if (minor) {
				if (themeTags?.indexOf(m) == -1) {
					remove = true;
				}
			}
			else {
				if (themeTags?.indexOf(m) != -1) {
					remove = true;
				}
			}

			if (remove) {
				label.parent?.children.removeValue(label);
				renderer.makeLabel(dataItem, tags);
				label.dispose();
				renderer.labels.removeValue(label);
			}
		}

		const grid = dataItem.get("grid");

		if (!grid) {
			renderer.makeGrid(dataItem, tags);
		}
		else {
			let themeTags = grid.get("themeTags");
			let remove = false;
			if (minor) {
				if (themeTags?.indexOf(m) == -1) {
					remove = true;
				}
			}
			else {
				if (themeTags?.indexOf(m) != -1) {
					remove = true;
				}
			}

			if (remove) {
				grid.parent?.children.removeValue(grid);
				renderer.makeGrid(dataItem, tags);
				grid.dispose();
				renderer.grid.removeValue(grid);
			}
		}

		const tick = dataItem.get("tick");
		if (!tick) {
			renderer.makeTick(dataItem, tags);
		}
		else {
			let remove = false;
			let themeTags = tick.get("themeTags");
			if (minor) {
				if (themeTags?.indexOf(m) == -1) {
					remove = true;
				}
			}
			else {
				if (themeTags?.indexOf(m) != -1) {
					remove = true;
				}
			}
			if (remove) {
				tick.parent?.children.removeValue(tick);
				renderer.makeTick(dataItem, tags);
				tick.dispose();
				renderer.ticks.removeValue(tick);
			}
		}

		if (!minor && !dataItem.get("axisFill")) {
			renderer.makeAxisFill(dataItem, tags);
		}

		this._processBullet(dataItem);
	}

	protected _processBullet(dataItem: DataItem<this["_dataItemSettings"]>) {
		let bullet = dataItem.get("bullet");
		let axisBullet = this.get("bullet");

		if (!bullet && axisBullet && !dataItem.get("isRange")) {
			bullet = axisBullet(this._root, this, dataItem);
		}

		if (bullet) {
			bullet.axis = this;
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
			chart.axisHeadersContainer.markDirtySize();
		}

		this.get("renderer")._updatePositions();

		this._seriesAdded = false;
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const renderer = this.get("renderer");
		const label = dataItem.get("label");
		if (label) {
			renderer.labels.removeValue(label);
			label.dispose();
		}
		const tick = dataItem.get("tick");
		if (tick) {
			renderer.ticks.removeValue(tick);
			tick.dispose();
		}
		const grid = dataItem.get("grid");
		if (grid) {
			renderer.grid.removeValue(grid);
			grid.dispose();
		}
		const axisFill = dataItem.get("axisFill");
		if (axisFill) {
			renderer.axisFills.removeValue(axisFill);
			axisFill.dispose();
		}
		const bullet = dataItem.get("bullet");

		if (bullet) {
			bullet.dispose();
		}
	}

	protected _updateGhost() {
		this.setPrivate("cellWidth", this.getCellWidthPosition() * this.get("renderer").axisLength());
		const ghostLabel = this.ghostLabel;
		if (!ghostLabel.isHidden()) {
			const bounds = ghostLabel.localBounds();
			const gWidth = Math.ceil(bounds.right - bounds.left);
			let text = ghostLabel.get("text");
			$array.each(this.dataItems, (dataItem) => {
				const label = dataItem.get("label");
				if (label && !label.isHidden()) {
					const bounds = label.localBounds();
					const w = Math.ceil(bounds.right - bounds.left);

					if (w > gWidth) {
						text = label.text._getText();
					}
				}
			})
			ghostLabel.set("text", text);
		}
		let start = this.get("start", 0);
		let end = this.get("end", 1);
		this.get("renderer").updateLabel(ghostLabel, start + (end - start) * 0.5);
	}

	public _handleCursorPosition(position: number, snapToSeries?: Array<XYSeries>) {
		const renderer = this.get("renderer");
		position = renderer.toAxisPosition(position);

		this._cursorPosition = position;
		this._snapToSeries = snapToSeries;

		this.updateTooltip();
	}

	/**
	 * Can be called when axis zoom changes and you need to update tooltip
	 * position.
	 */
	public updateTooltip() {
		const snapToSeries = this._snapToSeries;
		let position = this._cursorPosition;
		const tooltip = this.get("tooltip")!;
		const renderer = this.get("renderer");

		if ($type.isNumber(position)) {

			$array.each(this.series, (series) => {
				if (series.get("baseAxis") === this) {
					const dataItem = this.getSeriesItem(series, position!, this.get("tooltipLocation"));					
					
					if (snapToSeries && snapToSeries.indexOf(series) != -1) {
						series.updateLegendMarker(dataItem);
						series.updateLegendValue(dataItem);
						series._settings.tooltipDataItem = dataItem;
					}
					else {
						series.showDataItemTooltip(dataItem);
						series.setRaw("tooltipDataItem", dataItem);
					}										
				}
			})

			if (this.get("snapTooltip")) {
				position = this.roundAxisPosition(position, this.get("tooltipLocation", 0.5));
			}
			
			this.setPrivateRaw("tooltipPosition", position);

			if (tooltip) {
				renderer.updateTooltipBounds(tooltip);

				if (!$type.isNaN(position)) {					
					this._updateTooltipText(tooltip, position);
					renderer.positionTooltip(tooltip, position);

					if (position < this.get("start", 0) || position > this.get("end", 1)) {
						tooltip.hide(0);
					}
					else {
						tooltip.show(0);
					}
				}
				else {
					tooltip.hide(0);
				}
			}
		}
	}

	protected _updateTooltipText(tooltip: Tooltip, position: number) {
		tooltip.label.set("text", this.getTooltipText(position));
	}

	/**
	 * Returns text to be used in an axis tooltip for specific relative position.
	 *
	 * @param   position        Position
	 * @param   adjustPosition  Adjust position
	 * @return                  Tooltip text
	 */
	public abstract getTooltipText(position: number, adjustPosition?: boolean): string | undefined;

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
	 * Converts relative position of the plot area to relative position of the
	 * axis with zoom taken into account.
	 *
	 * @param position Position
	 * @return Relative position
	 */
	public toAxisPosition(position: number): number {
		return this.get("renderer").toAxisPosition(position);
	}

	/**
	 * Converts relative position of the axis to a global position taking current
	 * zoom into account (opposite to what `toAxisPosition` does).
	 *
	 * @since 5.4.2
	 * @param position Position
	 * @return Global position
	 */
	public toGlobalPosition(position: number): number {
		return this.get("renderer").toGlobalPosition(position);
	}

	/**
	 * Adjusts position with inversed taken into account.
	 *
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
	public abstract getSeriesItem(series: XYSeries, position: number, location?: number): DataItem<IXYSeriesDataItem> | undefined

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

	/**
	 * @ignore
	 */
	public _groupSeriesData(_series: XYSeries) { }

	/**
	 * Returns relative position between two grid lines of the axis.
	 *
	 * @return Position
	 */
	public getCellWidthPosition(): number {
		return 0.05;
	}

	/**
	 * @ignore
	 */
	public abstract nextPosition(_count?:number):number
}
