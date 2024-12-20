import type { Axis } from "./axes/Axis";
import type { XYCursor } from "./XYCursor";
import type { AxisRenderer } from "./axes/AxisRenderer";
import type { DataItem } from "../../core/render/Component";
import type { IDisposer } from "../../core/util/Disposer";
import type { XYSeries, IXYSeriesDataItem } from "./series/XYSeries";
import type { IPointerEvent } from "../../core/render/backend/Renderer";;
import type { Scrollbar } from "../../core/render/Scrollbar";
import type { Tooltip } from "../../core/render/Tooltip";
import type { IPoint } from "../../core/util/IPoint";
import type { ISpritePointerEvent } from "../../core/render/Sprite";
import type { Animation } from "../../core/util/Entity";
import type { CategoryAxis } from "./axes/CategoryAxis";
import type { DateAxis } from "./axes/DateAxis";

import { XYChartDefaultTheme } from "./XYChartDefaultTheme";
import { Container } from "../../core/render/Container";
import { Rectangle } from "../../core/render/Rectangle";
import { SerialChart, ISerialChartPrivate, ISerialChartSettings, ISerialChartEvents } from "../../core/render/SerialChart";
import { ListAutoDispose } from "../../core/util/List";
import { p100 } from "../../core/util/Percent";
import { Button } from "../../core/render/Button";
import { Graphics } from "../../core/render/Graphics";
import { Percent } from "../../core/util/Percent";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $order from "../../core/util/Order";
import * as $object from "../../core/util/Object";
import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";

export interface IXYChartSettings extends ISerialChartSettings {

	/**
	 * horizontal scrollbar.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/} for more info
	 */
	scrollbarX?: Scrollbar;

	/**
	 * Vertical scrollbar.
	 *
	 */
	scrollbarY?: Scrollbar;

	/**
	 * If this is set to `true`, users will be able to pan the chart horizontally
	 * by dragging plot area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Panning} for more info
	 */
	panX?: boolean;

	/**
	 * If this is set to `true`, users will be able to pan the chart vertically
	 * by dragging plot area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Panning} for more info
	 */
	panY?: boolean;

	/**
	 * Indicates what happens when mouse wheel is spinned horizontally while over
	 * plot area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Mouse_wheel_behavior} for more info
	 */
	wheelX?: "zoomX" | "zoomY" | "zoomXY" | "panX" | "panY" | "panXY" | "none";

	/**
	 * Indicates what happens when mouse wheel is spinned vertically while over
	 * plot area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Mouse_wheel_behavior} for more info
	 */
	wheelY?: "zoomX" | "zoomY" | "zoomXY" | "panX" | "panY" | "panXY" | "none";

	/**
	 * Indicates the relative "speed" of the mouse wheel.
	 *
	 * @default 0.25
	 */
	wheelStep?: number;

	/**
	 * Chart's cursor.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/} for more info
	 */
	cursor?: XYCursor;

	/**
	 * If not set (default), cursor will show tooltips for all data items in the
	 * same category/date.
	 *
	 * If set, cursor will select closest data item to pointer (mouse or touch) and
	 * show tooltip for it.
	 *
	 * It will also show tooltips for all data items that are within X pixels
	 * range (as set in `maxTooltipDistance`).
	 *
	 * Tooltips for data items farther then X pixels, will not be shown.
	 *
	 * NOTE: set it to `-1` to ensure only one tooltip is displayed, even if there
	 * are multiple data items in the same place.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/#tooltips} for more info
	 */
	maxTooltipDistance?: number;

	/**
	 * Indicates how the distance should be measured when assessing distance
	 * between tooltips as set in `maxTooltipDistance`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/#tooltips} for more info
	 * @since 5.2.6
	 */
	maxTooltipDistanceBy?: "xy" | "x" | "y";

	/**
	 * If set to `false` the chart will not check for overlapping of multiple
	 * tooltips, and will not arrange them to not overlap.
	 *
	 * Will work only if chart has an `XYCursor` enabled.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/#ooltips} for more info
	 * @default true
	 */
	arrangeTooltips?: boolean

	/**
	 * If set to `true`, using pinch gesture on the chart's plot area will zoom
	 * chart horizontally.
	 *
	 * NOTE: this setting is not supported in a [[RadarChart]].
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Pinch_zoom} for more info
	 * @since 5.1.8
	 * @default false
	 */
	pinchZoomX?: boolean;

	/**
	 * If set to `true`, using pinch gesture on the chart's plot area will zoom
	 * chart vertically.
	 *
	 * NOTE: this setting is not supported in a [[RadarChart]].
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Pinch_zoom} for more info
	 * @since 5.1.8
	 * @default false
	 */
	pinchZoomY?: boolean;

	/**
	 * If set, will use this relative position as a "center" for mouse wheel
	 * horizontal zooming instead of actual cursor position.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Mouse_wheel_behavior} for more info
	 * @since 5.2.11
	 */
	wheelZoomPositionX?: number;

	/**
	 * If set, will use this relative position as a "center" for mouse wheel
	 * vertical zooming instead of actual cursor position.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Mouse_wheel_behavior} for more info
	 * @since 5.2.11
	 */
	wheelZoomPositionY?: number;

}

export interface IXYChartPrivate extends ISerialChartPrivate {

	/**
	 * A list of [[Series]] that currently have their tooltip being displayed.
	 */
	tooltipSeries?: Array<XYSeries>

	/**
	 * Array of other [[XYChart]] objects that cursors should be synced with.
	 *
	 * Note: cursors will be synced across the vertically stacked charts only.
	 */
	otherCharts?: Array<XYChart>

}


export interface IXYChartEvents extends ISerialChartEvents {

	/**
	 * Invoked when panning starts.
	 *
	 * @since 5.0.4
	 */
	panstarted: {
		originalEvent: IPointerEvent
	};

	/**
	 * Invoked when panning ends.
	 *
	 * @since 5.0.4
	 */
	panended: {
		originalEvent: IPointerEvent
	};

	/**
	 * Invoked if pointer is pressed down on a chart and released without moving.
	 *
	 * `panended` event will still kick in after that.
	 *
	 * @since 5.2.19
	 */
	pancancelled: {
		originalEvent: IPointerEvent
	};

	/**
	 * Invoked when wheel caused zoom ends.
	 *
	 * @since 5.0.4
	 */
	wheelended: {};

}

/**
 * Creates an XY chart.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/} for more info
 * @important
 */
export class XYChart extends SerialChart {

	public static className: string = "XYChart";
	public static classNames: Array<string> = SerialChart.classNames.concat([XYChart.className]);

	declare public _settings: IXYChartSettings;
	declare public _privateSettings: IXYChartPrivate;
	declare public _seriesType: XYSeries;
	declare public _events: IXYChartEvents;

	/**
	 * A list of horizontal axes.
	 */
	public readonly xAxes: ListAutoDispose<Axis<AxisRenderer>> = new ListAutoDispose();

	/**
	 * A list of vertical axes.
	 */
	public readonly yAxes: ListAutoDispose<Axis<AxisRenderer>> = new ListAutoDispose();

	/**
	 * A [[Container]] located on top of the chart, used to store top horizontal
	 * axes.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly topAxesContainer: Container = this.chartContainer.children.push(Container.new(this._root, { width: p100, layout: this._root.verticalLayout }));

	/**
	 * A [[Container]] located in the middle the chart, used to store vertical axes
	 * and plot area container.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly yAxesAndPlotContainer: Container = this.chartContainer.children.push(Container.new(this._root, { width: p100, height: p100, layout: this._root.horizontalLayout }));

	/**
	 * A [[Container]] located on bottom of the chart, used to store bottom
	 * horizontal axes.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly bottomAxesContainer: Container = this.chartContainer.children.push(Container.new(this._root, { width: p100, layout: this._root.verticalLayout }));

	/**
	 * A [[Container]] located on left of the chart, used to store left-hand
	 * vertical axes.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly leftAxesContainer: Container = this.yAxesAndPlotContainer.children.push(Container.new(this._root, { height: p100, layout: this._root.horizontalLayout }));

	/**
	 * A [[Container]] located in the middle of the chart, used to store plotContainer and topPlotContainer
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly plotsContainer: Container = this.yAxesAndPlotContainer.children.push(Container.new(this._root, { width: p100, height: p100, maskContent: false }));

	/**
	 * A [[Container]] located in the middle of the chart, used to store actual
	 * plots (series).
	 *
	 * NOTE: `plotContainer` will automatically have its `background` preset. If
	 * you need to modify background or outline for chart's plot area, you can
	 * use `plotContainer.get("background")` for that.*
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly plotContainer: Container = this.plotsContainer.children.push(Container.new(this._root, { width: p100, height: p100 }));

	/**
	 * A [[Container]] used for any elements that need to be displayed over
	 * regular `plotContainer`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly topPlotContainer: Container = this.plotsContainer.children.push(Container.new(this._root, { width: p100, height: p100 }));

	/**
	 * A [[Container]] axis grid elements are stored in.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly gridContainer: Container = this.plotContainer.children.push(Container.new(this._root, { width: p100, height: p100, isMeasured: false }));

	/**
	 * A [[Container]] axis background grid elements are stored in.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly topGridContainer: Container = Container.new(this._root, { width: p100, height: p100, isMeasured: false });

	/**
	 * A [[Container]] located on right of the chart, used to store right-hand
	 * vertical axes.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/xy-chart-containers/} for more info
	 * @default Container.new()
	 */
	public readonly rightAxesContainer: Container = this.yAxesAndPlotContainer.children.push(Container.new(this._root, { height: p100, layout: this._root.horizontalLayout }));

	/**
	 * A [[Container]] axis headers are stored in.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-headers/} for more info
	 * @default Container.new()
	 */
	public readonly axisHeadersContainer: Container = this.plotContainer.children.push(Container.new(this._root, {}));

	/**
	 * A button that is shown when chart is not fully zoomed out.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/zoom-and-pan/#Zoom_out_button} for more info
	 * @default Button.new()
	 */
	public readonly zoomOutButton: Button = this.topPlotContainer.children.push(Button.new(this._root, {
		themeTags: ["zoom"],
		icon: Graphics.new(this._root, {
			themeTags: ["button", "icon"]
		})
	}));

	public _movePoint: IPoint = { x: 0, y: 0 };

	protected _wheelDp: IDisposer | undefined;

	public _otherCharts?: Array<XYChart>;

	protected _movePoints: { [index: number]: IPoint } = {};

	protected _downStartX?: number;
	protected _downEndX?: number;

	protected _downStartY?: number;
	protected _downEndY?: number;

	protected _afterNew() {
		this._defaultThemes.push(XYChartDefaultTheme.new(this._root));

		super._afterNew();

		this._disposers.push(this.xAxes);
		this._disposers.push(this.yAxes);

		const root = this._root;

		let verticalLayout = this._root.verticalLayout;

		const zoomOutButton = this.zoomOutButton;
		zoomOutButton.events.on("click", () => {
			this.zoomOut();
		})
		zoomOutButton.hide(0);
		zoomOutButton.states.lookup("default")!.set("opacity", 1);

		this.chartContainer.set("layout", verticalLayout);

		const plotContainer = this.plotContainer;
		plotContainer.children.push(this.seriesContainer);

		this._disposers.push(this._processAxis(this.xAxes, this.bottomAxesContainer));
		this._disposers.push(this._processAxis(this.yAxes, this.leftAxesContainer));


		plotContainer.children.push(this.topGridContainer);
		plotContainer.children.push(this.bulletsContainer);

		// Setting trasnparent background so that full body of the plot container
		// is interactive
		plotContainer.set("interactive", true);
		plotContainer.set("interactiveChildren", false);
		plotContainer.set("background", Rectangle.new(root, {
			themeTags: ["plotbackground", "xy", "background"]
		}));

		this._disposers.push(plotContainer.events.on("pointerdown", (event) => {
			this._handlePlotDown(event);
		}));

		this._disposers.push(plotContainer.events.on("globalpointerup", (event) => {
			this._handlePlotUp(event);
		}));

		this._disposers.push(plotContainer.events.on("globalpointermove", (event) => {
			this._handlePlotMove(event);
		}));

		this._maskGrid();
		this._setUpTouch();
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("pinchZoomX") || this.isDirty("pinchZoomY") || this.get("panX") || this.get("panY")) {
			this._setUpTouch();
		}

	}

	protected _setUpTouch(): void {
		if (!this.plotContainer._display.cancelTouch) {
			this.plotContainer._display.cancelTouch = (this.get("pinchZoomX") || this.get("pinchZoomY") || this.get("panX") || this.get("panY")) ? true : false;
		}
	}

	protected _maskGrid() {
		this.gridContainer.set("maskContent", true);
		this.topGridContainer.set("maskContent", true);
	}

	protected _removeSeries(series: this["_seriesType"]) {
		series._unstack();

		if (series._posXDp) {
			series._posXDp.dispose();
		}

		if (series._posYDp) {
			series._posYDp.dispose();
		}

		series.set("baseAxis", undefined);

		const xAxis = series.get("xAxis");
		if (xAxis) {
			$array.remove(xAxis.series, series);
			xAxis.markDirtyExtremes();
		}
		const yAxis = series.get("yAxis");
		if (yAxis) {
			$array.remove(yAxis.series, series);
			yAxis.markDirtyExtremes();
		}

		const cursor = this.get("cursor");
		if (cursor) {
			const snapToSeries = cursor.get("snapToSeries");
			if (snapToSeries) {
				$array.remove(snapToSeries, series);
			}
		}

		super._removeSeries(series);
	}

	/**
	 * This method is invoked when mouse wheel is used over chart's plot
	 * container, and handles zooming/pan.
	 *
	 * You can invoke this method manually, if you need to mimic chart's wheel
	 * behavior over other elements of the chart.
	 */
	public handleWheel(event: { originalEvent: WheelEvent, point: IPoint, target: Container }) {
		const wheelX = this.get("wheelX");
		const wheelY = this.get("wheelY");
		const plotContainer = this.plotContainer;

		const wheelEvent = event.originalEvent;

		// Ignore wheel event if it is happening on a non-chart element, e.g. if
		// some page element is over the chart.
		let prevent = false;
		if ($utils.isLocalEvent(wheelEvent, this)) {
			prevent = true;
		}
		else {
			return;
		}

		const plotPoint = plotContainer.toLocal(event.point);
		const wheelStep = this.get("wheelStep", 0.2);

		const shiftY = wheelEvent.deltaY / 100;
		const shiftX = wheelEvent.deltaX / 100;

		const wheelZoomPositionX = this.get("wheelZoomPositionX");
		const wheelZoomPositionY = this.get("wheelZoomPositionY");


		if ((wheelX === "zoomX" || wheelX === "zoomXY") && shiftX != 0) {
			this.xAxes.each((axis) => {
				if (axis.get("zoomX")) {
					let start = axis.get("start")!;
					let end = axis.get("end")!;

					let position = axis.fixPosition(plotPoint.x / plotContainer.width());

					if (wheelZoomPositionX != null) {
						position = wheelZoomPositionX;
					}

					let maxDeviation = axis.get("maxDeviation", 0);

					let newStart = Math.min(1 + maxDeviation, Math.max(-maxDeviation, start - wheelStep * (end - start) * shiftX * position));
					let newEnd = Math.max(-maxDeviation, Math.min(1 + maxDeviation, end + wheelStep * (end - start) * shiftX * (1 - position)));

					if (newStart == start && newEnd == end) {
						prevent = false;
					}

					if (1 / (newEnd - newStart) < axis.getPrivate("maxZoomFactor", Infinity) / axis.get("minZoomCount", 1)) {
						this._handleWheelAnimation(axis.zoom(newStart, newEnd));
					}
					else {
						prevent = false;
					}
				}
			})
		}

		if ((wheelY === "zoomX" || wheelY === "zoomXY") && shiftY != 0) {
			this.xAxes.each((axis) => {
				if (axis.get("zoomX")) {
					let start = axis.get("start")!;
					let end = axis.get("end")!;

					let position = axis.fixPosition(plotPoint.x / plotContainer.width());

					if (wheelZoomPositionX != null) {
						position = wheelZoomPositionX;
					}

					let maxDeviation = axis.get("maxDeviation", 0);

					let newStart = Math.min(1 + maxDeviation, Math.max(-maxDeviation, start - wheelStep * (end - start) * shiftY * position));
					let newEnd = Math.max(-maxDeviation, Math.min(1 + maxDeviation, end + wheelStep * (end - start) * shiftY * (1 - position)));

					if (newStart == start && newEnd == end) {
						prevent = false;
					}

					if (1 / (newEnd - newStart) < axis.getPrivate("maxZoomFactor", Infinity) / axis.get("minZoomCount", 1)) {
						this._handleWheelAnimation(axis.zoom(newStart, newEnd));
					}
					else {
						prevent = false;
					}
				}
			})
		}


		if ((wheelX === "zoomY" || wheelX === "zoomXY") && shiftX != 0) {
			this.yAxes.each((axis) => {
				if (axis.get("zoomY")) {
					let start = axis.get("start")!;
					let end = axis.get("end")!;

					let position = axis.fixPosition(plotPoint.y / plotContainer.height());

					if (wheelZoomPositionY != null) {
						position = wheelZoomPositionY;
					}

					let maxDeviation = axis.get("maxDeviation", 0);

					let newStart = Math.min(1 + maxDeviation, Math.max(-maxDeviation, start - wheelStep * (end - start) * shiftX * position));
					let newEnd = Math.max(-maxDeviation, Math.min(1 + maxDeviation, end + wheelStep * (end - start) * shiftX * (1 - position)));

					if (newStart == start && newEnd == end) {
						prevent = false;
					}

					if (1 / (newEnd - newStart) < axis.getPrivate("maxZoomFactor", Infinity) / axis.get("minZoomCount", 1)) {
						this._handleWheelAnimation(axis.zoom(newStart, newEnd));
					}
					else {
						prevent = false;
					}
				}
			})
		}

		if ((wheelY === "zoomY" || wheelY === "zoomXY") && shiftY != 0) {
			this.yAxes.each((axis) => {
				if (axis.get("zoomY")) {
					let start = axis.get("start")!;
					let end = axis.get("end")!;

					let position = axis.fixPosition(plotPoint.y / plotContainer.height());

					if (wheelZoomPositionY != null) {
						position = wheelZoomPositionY;
					}

					let maxDeviation = axis.get("maxDeviation", 0);

					let newStart = Math.min(1 + maxDeviation, Math.max(-maxDeviation, start - wheelStep * (end - start) * shiftY * position));
					let newEnd = Math.max(-maxDeviation, Math.min(1 + maxDeviation, end + wheelStep * (end - start) * shiftY * (1 - position)));

					if (newStart == start && newEnd == end) {
						prevent = false;
					}

					if (1 / (newEnd - newStart) < axis.getPrivate("maxZoomFactor", Infinity) / axis.get("minZoomCount", 1)) {
						this._handleWheelAnimation(axis.zoom(newStart, newEnd));
					}
					else {
						prevent = false;
					}
				}
			})
		}


		if ((wheelX === "panX" || wheelX === "panXY") && shiftX != 0) {
			this.xAxes.each((axis) => {
				if (axis.get("panX")) {
					let start = axis.get("start")!;
					let end = axis.get("end")!;

					let delta = this._getWheelSign(axis) * wheelStep * (end - start) * shiftX;
					let newStart = start + delta;
					let newEnd = end + delta;

					let se = this._fixWheel(newStart, newEnd);
					newStart = se[0];
					newEnd = se[1];

					if (newStart == start && newEnd == end) {
						prevent = false;
					}

					this._handleWheelAnimation(axis.zoom(newStart, newEnd));
				}
			})
		}

		if ((wheelY === "panX" || wheelY === "panXY") && shiftY != 0) {
			this.xAxes.each((axis) => {
				if (axis.get("panX")) {
					let start = axis.get("start")!;
					let end = axis.get("end")!;

					let delta = this._getWheelSign(axis) * wheelStep * (end - start) * shiftY;
					let newStart = start + delta;
					let newEnd = end + delta;

					let se = this._fixWheel(newStart, newEnd);
					newStart = se[0];
					newEnd = se[1];

					if (newStart == start && newEnd == end) {
						prevent = false;
					}

					this._handleWheelAnimation(axis.zoom(newStart, newEnd));
				}
			})
		}

		if ((wheelX === "panY" || wheelX === "panXY") && shiftX != 0) {
			this.yAxes.each((axis) => {
				if (axis.get("panY")) {
					let start = axis.get("start")!;
					let end = axis.get("end")!;

					let delta = this._getWheelSign(axis) * wheelStep * (end - start) * shiftX;
					let newStart = start + delta;
					let newEnd = end + delta;

					let se = this._fixWheel(newStart, newEnd);
					newStart = se[0];
					newEnd = se[1];

					if (newStart == start && newEnd == end) {
						prevent = false;
					}

					this._handleWheelAnimation(axis.zoom(newStart, newEnd));
				}
			})
		}

		if ((wheelY === "panY" || wheelY === "panXY") && shiftY != 0) {
			this.yAxes.each((axis) => {
				if (axis.get("panY")) {
					let start = axis.get("start")!;
					let end = axis.get("end")!;

					let delta = this._getWheelSign(axis) * wheelStep * (end - start) * shiftY;
					let newStart = start - delta;
					let newEnd = end - delta;

					let se = this._fixWheel(newStart, newEnd);
					newStart = se[0];
					newEnd = se[1];

					if (newStart == start && newEnd == end) {
						prevent = false;
					}

					this._handleWheelAnimation(axis.zoom(newStart, newEnd));
				}
			})
		}

		if (prevent) {
			wheelEvent.preventDefault();
		}
	}

	protected _handleSetWheel() {
		const wheelX = this.get("wheelX");
		const wheelY = this.get("wheelY");
		const plotContainer = this.plotContainer;

		if (wheelX !== "none" || wheelY !== "none") {
			this._wheelDp = plotContainer.events.on("wheel", (event) => {
				const wheelEvent = event.originalEvent;
				if ((wheelX !== "none" && Math.abs(wheelEvent.deltaX) != 0) || (wheelY !== "none" && Math.abs(wheelEvent.deltaY) != 0)) {
					this.handleWheel(event);
				}
			});

			this._disposers.push(this._wheelDp);
		}
		else {
			if (this._wheelDp) {
				this._wheelDp.dispose();
			}
		}
	}

	protected _getWheelSign(axis: Axis<AxisRenderer>) {
		let sign = 1;
		if (axis.get("renderer").get("inversed")) {
			sign = -1;
		}

		return sign
	}

	protected _fixWheel(start: number, end: number): [number, number] {
		const diff = end - start;
		if (start < 0) {
			start = 0;
			end = start + diff;
		}
		if (end > 1) {
			end = 1;
			start = end - diff;
		}

		return [start, end];
	}

	protected _handlePlotDown(event: ISpritePointerEvent) {
		const originalEvent = event.originalEvent as any;

		if (originalEvent.button == 2) {
			return;
		}
		const plotContainer = this.plotContainer;
		let local = plotContainer.toLocal(event.point);

		if (this.get("pinchZoomX") || this.get("pinchZoomY")) {
			const pointerId = originalEvent.pointerId;

			if (pointerId) {

				if ($object.keys(plotContainer._downPoints).length > 0) {
					const xAxis = this.xAxes.getIndex(0);
					const yAxis = this.yAxes.getIndex(0);


					if (xAxis) {
						this._downStartX = xAxis.get("start", 0);
						this._downEndX = xAxis.get("end", 1);
					}

					if (yAxis) {
						this._downStartY = yAxis.get("start", 0);
						this._downEndY = yAxis.get("end", 1);
					}
				}
			}
		}

		if (this.get("panX") || this.get("panY")) {

			if (local.x >= 0 && local.y >= 0 && local.x <= plotContainer.width() && local.y <= this.height()) {
				//this._downPoint = local;
				this._downPoint = { x: originalEvent.clientX, y: originalEvent.clientY };

				const panX = this.get("panX");
				const panY = this.get("panY");

				if (panX) {
					this.xAxes.each((axis) => {
						axis._panStart = axis.get("start")!;
						axis._panEnd = axis.get("end")!;
					})
				}
				if (panY) {
					this.yAxes.each((axis) => {
						axis._panStart = axis.get("start")!;
						axis._panEnd = axis.get("end")!;
					})
				}

				const eventType = "panstarted";
				if (this.events.isEnabled(eventType)) {
					this.events.dispatch(eventType, { type: eventType, target: this, originalEvent: event.originalEvent });
				}
			}
		}
	}

	protected _handleWheelAnimation(animation?: Animation<any>) {
		if (animation) {
			animation.events.on("stopped", () => {
				this._dispatchWheelAnimation();
			})
		}
		else {
			this._dispatchWheelAnimation();
		}
	}

	protected _dispatchWheelAnimation() {
		const eventType = "wheelended";
		if (this.events.isEnabled(eventType)) {
			this.events.dispatch(eventType, { type: eventType, target: this });
		}
	}

	protected _handlePlotUp(event: ISpritePointerEvent) {
		const downPoint = this._downPoint;
		if (downPoint) {
			if (this.get("panX") || this.get("panY")) {
				if (event.originalEvent.clientX == downPoint.x && event.originalEvent.clientY == downPoint.y) {
					const eventType = "pancancelled";
					if (this.events.isEnabled(eventType)) {
						this.events.dispatch(eventType, { type: eventType, target: this, originalEvent: event.originalEvent });
					}
				}

				const eventType = "panended";
				if (this.events.isEnabled(eventType)) {
					this.events.dispatch(eventType, { type: eventType, target: this, originalEvent: event.originalEvent });
				}
			}
		}

		// TODO: handle multitouch
		this._downPoint = undefined;
		this.xAxes.each((xAxis) => {
			xAxis._isPanning = false;
		})
		this.yAxes.each((yAxis) => {
			yAxis._isPanning = false;
		})
	}

	protected _handlePlotMove(event: ISpritePointerEvent) {
		const plotContainer = this.plotContainer;

		if (this.get("pinchZoomX") || this.get("pinchZoomY")) {
			const touchEvent = event.originalEvent as any;
			const pointerId = touchEvent.pointerId;

			if (pointerId) {
				this._movePoints[pointerId] = event.point;

				if ($object.keys(plotContainer._downPoints).length > 1) {
					this._handlePinch();
					return;
				}
			}
		}

		let downPoint = this._downPoint!;

		if (downPoint) {

			downPoint = plotContainer.toLocal(this._root.documentPointToRoot(downPoint));
			let local = plotContainer.toLocal(event.point);

			const panX = this.get("panX");
			const panY = this.get("panY");

			if (panX) {

				let scrollbarX = this.get("scrollbarX");
				if (scrollbarX) {
					scrollbarX.events.disableType("rangechanged");
				}

				this.xAxes.each((axis) => {
					if (axis.get("panX")) {
						axis._isPanning = true;
						//const maxDeviation = axis.get("maxDeviation", 0);
						let panStart = axis._panStart;
						let panEnd = axis._panEnd;
						let difference = (panEnd - panStart);
						let deltaX = difference * (downPoint.x - local.x) / plotContainer.width();

						if (axis.get("renderer").get("inversed")) {
							deltaX *= -1;
						}
						let start = panStart + deltaX;
						let end = panEnd + deltaX;

						if (end - start < 1 + axis.get("maxDeviation", 1) * 2) {
							axis.set("start", start);
							axis.set("end", end);
						}
					}
				})
				if (scrollbarX) {
					scrollbarX.events.enableType("rangechanged");
				}
			}
			if (panY) {

				let scrollbarY = this.get("scrollbarY");
				if (scrollbarY) {
					scrollbarY.events.disableType("rangechanged");
				}

				this.yAxes.each((axis) => {
					if (axis.get("panY")) {
						axis._isPanning = true;
						//const maxDeviation = axis.get("maxDeviation", 0);

						let panStart = axis._panStart;
						let panEnd = axis._panEnd;
						let difference = (panEnd - panStart);
						let deltaY = difference * (downPoint.y - local.y) / plotContainer.height();
						if (axis.get("renderer").get("inversed")) {
							deltaY *= -1;
						}
						let start = panStart - deltaY;
						let end = panEnd - deltaY;

						if (end - start < 1 + axis.get("maxDeviation", 1) * 2) {
							axis.set("start", start);
							axis.set("end", end);
						}
					}
				})

				if (scrollbarY) {
					scrollbarY.events.enableType("rangechanged");
				}
			}


		}
	}

	protected _handlePinch() {
		const plotContainer = this.plotContainer;
		let i = 0;
		let downPoints: Array<IPoint> = [];
		let movePoints: Array<IPoint> = [];

		$object.each(plotContainer._downPoints, (k, point) => {
			downPoints[i] = point;
			let movePoint = this._movePoints[k];
			if (movePoint) {
				movePoints[i] = movePoint;
			}
			i++;
		});

		if (downPoints.length > 1 && movePoints.length > 1) {
			const w = plotContainer.width();
			const h = plotContainer.height();

			let downPoint0 = downPoints[0];
			let downPoint1 = downPoints[1];

			let movePoint0 = movePoints[0];
			let movePoint1 = movePoints[1];

			if (downPoint0 && downPoint1 && movePoint0 && movePoint1) {

				movePoint0 = plotContainer.toLocal(movePoint0)
				movePoint1 = plotContainer.toLocal(movePoint1)

				downPoint0 = plotContainer.toLocal(downPoint0)
				downPoint1 = plotContainer.toLocal(downPoint1)

				if (this.get("pinchZoomX")) {
					const downStartX = this._downStartX;
					const downEndX = this._downEndX;

					if (downStartX != null && downEndX != null) {

						if (downPoint0.x > downPoint1.x) {
							[downPoint0, downPoint1] = [downPoint1, downPoint0];
							[movePoint0, movePoint1] = [movePoint1, movePoint0];
						}

						let downPos0 = downStartX + (downPoint0.x / w) * (downEndX - downStartX);
						let downPos1 = downStartX + (downPoint1.x / w) * (downEndX - downStartX);

						let movePos0 = downStartX + (movePoint0.x / w) * (downEndX - downStartX);
						let movePos1 = downStartX + (movePoint1.x / w) * (downEndX - downStartX);

						let initialDistance = Math.max(0.001, downPos1 - downPos0);
						let currentDistance = Math.max(0.001, movePos1 - movePos0);


						let d = initialDistance / currentDistance;

						let s = downStartX * d + downPos0 - movePos0 * d;
						let e = downEndX * d + downPos1 - movePos1 * d;

						this.xAxes.each((xAxis) => {
							let sa = xAxis.fixPosition(s);
							let ea = xAxis.fixPosition(e);

							xAxis.zoom(sa, ea, 0);
						})
					}
				}
				if (this.get("pinchZoomY")) {
					const downStartY = this._downStartY;
					const downEndY = this._downEndY;

					if (downStartY != null && downEndY != null) {

						if (downPoint0.y < downPoint1.y) {
							[downPoint0, downPoint1] = [downPoint1, downPoint0];
							[movePoint0, movePoint1] = [movePoint1, movePoint0];
						}

						let downPos0 = downStartY + (1 - downPoint0.y / h) * (downEndY - downStartY);
						let downPos1 = downStartY + (1 - downPoint1.y / h) * (downEndY - downStartY);

						let movePos0 = downStartY + (1 - movePoint0.y / h) * (downEndY - downStartY);
						let movePos1 = downStartY + (1 - movePoint1.y / h) * (downEndY - downStartY);

						let initialDistance = Math.max(0.001, downPos1 - downPos0);
						let currentDistance = Math.max(0.001, movePos1 - movePos0);

						let d = initialDistance / currentDistance;

						let s = downStartY * d + downPos0 - movePos0 * d;
						let e = downEndY * d + downPos1 - movePos1 * d;

						this.yAxes.each((yAxis) => {

							let sa = yAxis.fixPosition(s);
							let ea = yAxis.fixPosition(e);

							yAxis.zoom(sa, ea, 0);
						})
					}
				}
			}
		}
	}

	public _handleCursorPosition() {
		const cursor = this.get("cursor");
		if (cursor) {
			const cursorPoint = cursor.getPrivate("point");

			let snapToSeries = cursor.get("snapToSeries");

			if (cursor._downPoint) {
				snapToSeries = undefined;
			}

			if (snapToSeries && cursorPoint) {
				const snapToSeriesBy = cursor.get("snapToSeriesBy");
				const dataItems: Array<DataItem<IXYSeriesDataItem>> = [];
				$array.each(snapToSeries, (series) => {
					if (!series.isHidden() && !series.isHiding()) {
						if (snapToSeriesBy != "x!" && snapToSeriesBy != "y!") {
							const startIndex = series.startIndex();
							const endIndex = series.endIndex();
							for (let i = startIndex; i < endIndex; i++) {
								const dataItem = series.dataItems[i];
								if (dataItem && !dataItem.isHidden()) {
									dataItems.push(dataItem);
								}
							}
						}
						else {
							const tooltipDataItem = series.get("tooltipDataItem");
							if (tooltipDataItem) {
								dataItems.push(tooltipDataItem);
							}
						}
					}
				})

				let minDistance = Infinity;
				let closestItem: DataItem<IXYSeriesDataItem> | undefined;

				$array.each(dataItems, (dataItem) => {
					const point = dataItem.get("point");

					if (point) {
						let distance = 0;
						if (snapToSeriesBy == "x" || snapToSeriesBy == "x!") {
							distance = Math.abs(cursorPoint.x - point.x);
						}
						else if (snapToSeriesBy == "y" || snapToSeriesBy == "y!") {
							distance = Math.abs(cursorPoint.y - point.y);
						}
						else {
							distance = Math.hypot(cursorPoint.x - point.x, cursorPoint.y - point.y);
						}
						if (distance < minDistance) {
							minDistance = distance;
							closestItem = dataItem;
						}
					}
				})

				$array.each(snapToSeries, (series) => {
					const tooltip = series.get("tooltip");
					if (tooltip) {
						tooltip._setDataItem(undefined);
					}
				})

				if (closestItem) {
					let series = closestItem.component as XYSeries;
					series.showDataItemTooltip(closestItem);
					series.setRaw("tooltipDataItem", closestItem);

					const point = closestItem.get("point");
					if (point) {

						// removing x and y to solve #72225
						cursor.handleMove(series.toGlobal({ x: point.x - series.x(), y: point.y - series.y() }), true);
					}
				}
			}
		}
	}

	public _updateCursor() {
		let cursor = this.get("cursor");
		if (cursor) {
			cursor.updateCursor();
		}
	}

	protected _addCursor(cursor: XYCursor) {
		this.plotContainer.children.push(cursor);
	}

	public _prepareChildren() {
		super._prepareChildren();

		this.series.each((series) => {
			this._colorize(series);
		})

		if (this.isDirty("wheelX") || this.isDirty("wheelY")) {
			this._handleSetWheel();
		}

		if (this.isDirty("cursor")) {
			const previous = this._prevSettings.cursor;
			const cursor = this.get("cursor")!;
			if (cursor !== previous) {
				this._disposeProperty("cursor");
				if (previous) {
					previous.dispose();
				}
				if (cursor) {
					cursor._setChart(this);
					this._addCursor(cursor);

					this._pushPropertyDisposer("cursor", cursor.events.on("selectended", () => {
						this._handleCursorSelectEnd();
					}))
				}

				//this.setRaw("cursor", cursor) // to reset previous value
				this._prevSettings.cursor = cursor;
			}
		}

		if (this.isDirty("scrollbarX")) {
			const previous = this._prevSettings.scrollbarX;
			const scrollbarX = this.get("scrollbarX")!;
			if (scrollbarX !== previous) {
				this._disposeProperty("scrollbarX");
				if (previous) {
					previous.dispose();
				}
				if (scrollbarX) {
					if (!scrollbarX.parent) {
						this.topAxesContainer.children.push(scrollbarX);
					}

					this._pushPropertyDisposer("scrollbarX", scrollbarX.events.on("rangechanged", (e) => {
						this._handleScrollbar(this.xAxes, e.start, e.end, e.grip);
					}))

					this._pushPropertyDisposer("scrollbarX", scrollbarX.events.on("released", () => {
						this.xAxes.each((axis) => {
							if (axis.get("zoomable")) {
								this._handleAxisSelection(axis);
							}
						})
					}))

					// Used to populate `ariaLabel` with meaningful values
					scrollbarX.setPrivate("positionTextFunction", (position: number) => {
						const axis = this.xAxes.getIndex(0);
						return axis ? axis.getTooltipText(position, false) || "" : "";
					});

				}

				this._prevSettings.scrollbarX = scrollbarX;
			}
		}

		if (this.isDirty("scrollbarY")) {
			const previous = this._prevSettings.scrollbarY;
			const scrollbarY = this.get("scrollbarY")!;
			if (scrollbarY !== previous) {
				this._disposeProperty("scrollbarY");
				if (previous) {
					previous.dispose();
				}
				if (scrollbarY) {
					if (!scrollbarY.parent) {
						this.rightAxesContainer.children.push(scrollbarY);
					}

					this._pushPropertyDisposer("scrollbarY", scrollbarY.events.on("rangechanged", (e) => {
						this._handleScrollbar(this.yAxes, e.start, e.end, e.grip);
					}))

					this._pushPropertyDisposer("scrollbarY", scrollbarY.events.on("released", () => {
						this.yAxes.each((axis) => {
							if (axis.get("zoomable")) {
								this._handleAxisSelection(axis);
							}
						})
					}))

					// Used to populate `ariaLabel` with meaningful values
					scrollbarY.setPrivate("positionTextFunction", (position: number) => {
						const axis = this.yAxes.getIndex(0);
						return axis ? axis.getTooltipText(position, false) || "" : "";
					});

				}
				this._prevSettings.scrollbarY = scrollbarY;
			}
		}

		this._handleZoomOut();
	}

	protected _processSeries(series: this["_seriesType"]) {
		super._processSeries(series);

		const xAxis = series.get("xAxis");
		const yAxis = series.get("yAxis");

		$array.move(xAxis.series, series);
		$array.move(yAxis.series, series);

		series._posXDp = series.addDisposer(xAxis.events.on("positionchanged", () => {
			series._fixPosition();
		}))

		series._posXDp = series.addDisposer(yAxis.events.on("positionchanged", () => {
			series._fixPosition();
		}))

		if (!series.get("baseAxis")) {
			if (yAxis.isType<CategoryAxis<any>>("CategoryAxis") || yAxis.isType<DateAxis<any>>("DateAxis")) {
				series.set("baseAxis", yAxis);
			}
			else {
				series.set("baseAxis", xAxis);
			}
		}

		if (series.get("stacked")) {
			series._markDirtyKey("stacked");
			$array.each(series.dataItems, (dataItem) => {
				dataItem.set("stackToItemY", undefined);
				dataItem.set("stackToItemX", undefined);
			})
		}
		series._markDirtyAxes();
		yAxis.markDirtyExtremes();
		xAxis.markDirtyExtremes();
		xAxis._seriesAdded = true;
		yAxis._seriesAdded = true;

		this._colorize(series);
	}

	protected _colorize(series: this["_seriesType"]) {
		const colorSet = this.get("colors")!;
		if (colorSet) {
			if (series.get("fill") == null) {
				const color = colorSet.next();

				series._setSoft("stroke", color);
				series._setSoft("fill", color);
			}
		}
		const patternSet = this.get("patterns")!;
		if (patternSet) {
			if (series.get("fillPattern") == null) {
				const pattern = patternSet.next();

				series._setSoft("fillPattern", pattern);
			}
		}
	}

	protected _handleCursorSelectEnd() {
		const cursor = this.get("cursor")!;
		const behavior = cursor.get("behavior");

		const downPositionX = cursor.getPrivate("downPositionX", 0);
		const downPositionY = cursor.getPrivate("downPositionY", 0);

		const positionX = Math.min(1, Math.max(0, cursor.getPrivate("positionX", 0.5)));
		const positionY = Math.min(1, Math.max(0, cursor.getPrivate("positionY", 0.5)));

		this.xAxes.each((axis) => {
			if (behavior === "zoomX" || behavior === "zoomXY") {
				let position0 = axis.toAxisPosition(downPositionX);
				let position1 = axis.toAxisPosition(positionX);
				axis.zoom(position0, position1);
			}
			axis.setPrivate("updateScrollbar", true);
		})

		this.yAxes.each((axis) => {
			if (behavior === "zoomY" || behavior === "zoomXY") {
				let position0 = axis.toAxisPosition(downPositionY);
				let position1 = axis.toAxisPosition(positionY);
				axis.zoom(position0, position1);
			}
			axis.setPrivate("updateScrollbar", true);
		})
	}

	protected _handleScrollbar(axes: ListAutoDispose<Axis<any>>, start: number, end: number, priority?: "start" | "end") {

		axes.each((axis) => {

			let axisStart = axis.fixPosition(start);
			let axisEnd = axis.fixPosition(end);

			let zoomAnimation = axis.zoom(axisStart, axisEnd, undefined, priority);

			const updateScrollbar = "updateScrollbar";
			axis.setPrivateRaw(updateScrollbar, false);

			if (zoomAnimation) {
				zoomAnimation.events.on("stopped", () => {
					axis.setPrivateRaw(updateScrollbar, true);
				});
			}
			else {
				axis.setPrivateRaw(updateScrollbar, true);
			}
		})
	}


	protected _processAxis<R extends AxisRenderer>(axes: ListAutoDispose<Axis<R>>, container: Container): IDisposer {
		return axes.events.onAll((change) => {
			if (change.type === "clear") {
				$array.each(change.oldValues, (axis) => {
					this._removeAxis(axis);
				})
			} else if (change.type === "push") {
				container.children.push(change.newValue);
				change.newValue.processChart(this);
			} else if (change.type === "setIndex") {
				container.children.setIndex(change.index, change.newValue);
				change.newValue.processChart(this);
			} else if (change.type === "insertIndex") {
				container.children.insertIndex(change.index, change.newValue);
				change.newValue.processChart(this);
			} else if (change.type === "removeIndex") {
				this._removeAxis(change.oldValue);
			} else if (change.type === "moveIndex") {
				container.children.moveValue(change.value, change.newIndex);
				change.value.processChart(this);
			} else {
				throw new Error("Unknown IListEvent type");
			}
		});
	}

	protected _removeAxis(axis: Axis<AxisRenderer>) {
		if (!axis.isDisposed()) {
			const axisParent = axis.parent
			if (axisParent) {
				axisParent.children.removeValue(axis);
			}

			const gridContainer = axis.gridContainer;
			const gridParent = gridContainer.parent;
			if (gridParent) {
				gridParent.children.removeValue(gridContainer);
			}

			const topGridContainer = axis.topGridContainer;
			const topGridParent = topGridContainer.parent;
			if (topGridParent) {
				topGridParent.children.removeValue(topGridContainer);
			}
		}
	}

	public _updateChartLayout() {
		const left = this.leftAxesContainer.width();
		const right = this.rightAxesContainer.width();

		const bottomAxesContainer = this.bottomAxesContainer;
		bottomAxesContainer.set("paddingLeft", left);
		bottomAxesContainer.set("paddingRight", right);

		const topAxesContainer = this.topAxesContainer;
		topAxesContainer.set("paddingLeft", left);
		topAxesContainer.set("paddingRight", right);
	}

	/**
	 * @ignore
	 */
	public processAxis(axis: Axis<AxisRenderer>) {
		var cursor = this.get("cursor");
		if (cursor) {
			this.addDisposer(axis.on("start", () => {
				this._updateCursor();
			}))

			this.addDisposer(axis.on("end", () => {
				this._updateCursor();
			}))
		}
	}


	public _handleAxisSelection(axis: Axis<any>, force?: boolean) {

		let start = axis.fixPosition(axis.get("start", 0));
		let end = axis.fixPosition(axis.get("end", 1));

		if (start > end) {
			[start, end] = [end, start];
		}

		if (this.xAxes.indexOf(axis) != -1) {
			if (force || axis.getPrivate("updateScrollbar")) {
				let scrollbarX = this.get("scrollbarX");

				if (scrollbarX && (!scrollbarX.getPrivate("isBusy") || force)) {
					scrollbarX.setRaw("start", start);
					scrollbarX.setRaw("end", end);
					scrollbarX.updateGrips();
				}
			}
		}
		else if (this.yAxes.indexOf(axis) != -1) {
			if (force || axis.getPrivate("updateScrollbar")) {
				let scrollbarY = this.get("scrollbarY");

				if (scrollbarY && (!scrollbarY.getPrivate("isBusy") || force)) {
					scrollbarY.setRaw("start", start);
					scrollbarY.setRaw("end", end);
					scrollbarY.updateGrips();
				}
			}
		}

		this._handleZoomOut();
	}

	protected _handleZoomOut() {
		let zoomOutButton = this.zoomOutButton;
		if (zoomOutButton && zoomOutButton.parent) {
			let visible = false;
			this.xAxes.each((axis) => {
				if ($math.round(axis.get("start", 0), 6) != 0 || $math.round(axis.get("end", 1), 6) != 1) {
					visible = true;
				}
			})
			this.yAxes.each((axis) => {
				if ($math.round(axis.get("start", 0), 6) != 0 || $math.round(axis.get("end", 1), 6) != 1) {
					visible = true;
				}
			})

			if (visible) {
				if (zoomOutButton.isHidden()) {
					zoomOutButton.show();
				}
			}
			else {
				zoomOutButton.hide();
			}
		}
	}

	/**
	 * Checks if point is within plot area.
	 *
	 * @param   point  Reference point
	 * @return         Is within plot area?
	 */
	public inPlot(point: IPoint): boolean {
		const plotContainer = this.plotContainer;
		const otherCharts = this.getPrivate("otherCharts", this._otherCharts);
		const global = plotContainer.toGlobal(point);

		if (point.x >= -0.5 && point.y >= -0.5 && point.x <= plotContainer.width() + 0.5 && point.y <= plotContainer.height() + 0.5) {
			return true;
		}
		if (otherCharts) {

			for (let i = otherCharts.length - 1; i >= 0; i--) {
				const chart = otherCharts[i];

				if (chart != this) {
					const chartPlotContainer = chart.plotContainer;
					const documentPoint = this._root.rootPointToDocument(global);
					const chartRoot = chart._root.documentPointToRoot(documentPoint);
					const local = chartPlotContainer.toLocal(chartRoot);
					if (local.x >= -0.1 && local.y >= -0.1 && local.x <= chartPlotContainer.width() + 0.1 && local.y <= chartPlotContainer.height() + 0.1) {
						return true;
					}
				}
			}
		}

		return false;
	}

	/**
	 * @ignore
	 */
	public arrangeTooltips() {
		const plotContainer = this.plotContainer;

		const w = plotContainer.width();
		const h = plotContainer.height();

		let hh = this.height();

		const bounds = this._root.tooltipContainer.get("layerMargin");

		if (bounds) {
			if (bounds.bottom > hh) {
				hh = bounds.bottom;
			}
		}

		let plotT = plotContainer._display.toGlobal({ x: 0, y: 0 });
		let plotB = plotContainer._display.toGlobal({ x: w, y: h });

		const tooltips: Array<Tooltip> = [];
		let sum = 0;

		let minDistance = Infinity;
		let movePoint = this._movePoint;
		let maxTooltipDistance = this.get("maxTooltipDistance");
		let maxTooltipDistanceBy = this.get("maxTooltipDistanceBy", "xy");
		let closest: XYSeries;
		let closestPoint: IPoint;

		if ($type.isNumber(maxTooltipDistance)) {
			this.series.each((series) => {
				if (!series.isHidden()) {
					const tooltip = series.get("tooltip");
					if (tooltip) {
						let point = tooltip.get("pointTo")!;
						if (point) {
							let distance = Math.hypot(movePoint.x - point.x, movePoint.y - point.y);
							if (maxTooltipDistanceBy == "x") {
								distance = Math.abs(movePoint.x - point.x);
							}
							else if (maxTooltipDistanceBy == "y") {
								distance = Math.abs(movePoint.y - point.y);
							}

							if (distance < minDistance) {
								minDistance = distance;
								closest = series;
								closestPoint = point;
							}
						}
					}
				}
			})
		}
		const tooltipSeries: Array<XYSeries> = [];

		this.series.each((series) => {
			const tooltip = series.get("tooltip")!;

			if (tooltip && !tooltip.get("forceHidden")) {
				let hidden = false;
				let point = tooltip.get("pointTo")!;
				if (point) {
					if (maxTooltipDistance >= 0) {
						let point = tooltip.get("pointTo")!;
						if (point && closestPoint) {
							if (series != closest) {
								let distance = Math.hypot(closestPoint.x - point.x, closestPoint.y - point.y);
								if (maxTooltipDistanceBy == "x") {
									distance = Math.abs(closestPoint.x - point.x);
								}
								else if (maxTooltipDistanceBy == "y") {
									distance = Math.abs(closestPoint.y - point.y);
								}

								if (distance > maxTooltipDistance) {
									hidden = true;
								}
							}
						}
					}
					else if (maxTooltipDistance == -1) {
						if (series != closest) {
							hidden = true;
						}
					}

					if (!this.inPlot(this._tooltipToLocal(point)) || !tooltip.dataItem) {
						hidden = true;
					}
					else {
						if (!hidden) {
							sum += point.y;
						}
					}

					if (hidden || series.isHidden() || series.isHiding()) {
						tooltip.hide(0);
					}
					else {
						tooltip.show();
						tooltips.push(tooltip);

						tooltipSeries.push(series);
					}
				}
			}
		})

		this.setPrivate("tooltipSeries", tooltipSeries);

		if (this.get("arrangeTooltips")) {

			const tooltipContainer = this._root.tooltipContainer;

			const count = tooltips.length;
			const average = sum / count;

			if (average > h / 2 + plotT.y) {
				tooltips.sort((a, b) => $order.compareNumber(b.get("pointTo")!.y, a.get("pointTo")!.y));

				let prevY = plotB.y;

				$array.each(tooltips, (tooltip) => {
					let height = tooltip.height();
					let centerY = tooltip.get("centerY");
					if (centerY instanceof Percent) {
						height *= centerY.value;
					}
					height += tooltip.get("marginBottom", 0);

					tooltip.set("bounds", { left: plotT.x, top: plotT.y, right: plotB.x, bottom: prevY })
					tooltip.setPrivate("customData", { left: plotT.x, top: plotT.y, right: plotB.x, bottom: prevY })
					prevY = Math.min(prevY - height, tooltip._fy - height);
					if (tooltip.parent == tooltipContainer) {
						tooltipContainer.children.moveValue(tooltip, 0);
					}
				})
				if (prevY < 0) {
					tooltips.reverse();
					let prevBottom = prevY;

					$array.each(tooltips, (tooltip) => {
						let bounds = tooltip.get("bounds");
						if (bounds) {
							let top = bounds.top - prevY;
							let bottom = bounds.bottom - prevY;
							if (top < prevBottom) {
								top = prevBottom;
								bottom = top + tooltip.height();
							}
							tooltip.set("bounds", { left: bounds.left, top: top, right: bounds.right, bottom: bottom })
							prevBottom = bounds.bottom - prevY + tooltip.get("marginBottom", 0);
						}
					})
				}
			}
			else {
				tooltips.reverse();
				tooltips.sort((a, b) => $order.compareNumber(a.get("pointTo")!.y, b.get("pointTo")!.y));

				let prevY = 0;
				$array.each(tooltips, (tooltip) => {
					let height = tooltip.height();
					let centerY = tooltip.get("centerY");
					if (centerY instanceof Percent) {
						height *= centerY.value;
					}
					height += tooltip.get("marginBottom", 0);

					tooltip.set("bounds", { left: plotT.x, top: prevY, right: plotB.x, bottom: Math.max(plotT.y + hh, prevY + height) })
					if (tooltip.parent == tooltipContainer) {
						tooltipContainer.children.moveValue(tooltip, 0);
					}
					prevY = Math.max(prevY + height, tooltip._fy + height);
				})

				if (prevY > hh) {
					tooltips.reverse();
					let prevBottom = hh;

					$array.each(tooltips, (tooltip) => {
						let bounds = tooltip.get("bounds");
						if (bounds) {
							let top = bounds.top - (hh - prevY);
							let bottom = bounds.bottom - (hh - prevY);
							if (bottom > prevBottom) {
								bottom = prevBottom
								top = bottom - tooltip.height();
							}
							tooltip.set("bounds", { left: bounds.left, top: top, right: bounds.right, bottom: bottom })
							prevBottom = bottom - tooltip.height() - tooltip.get("marginBottom", 0);
						}
					})
				}
			}
		}
	}

	protected _tooltipToLocal(point: IPoint): IPoint {
		return this.plotContainer.toLocal(point);
	}

	/**
	 * Fully zooms out the chart.
	 */
	public zoomOut() {
		this.xAxes.each((axis) => {
			axis.setPrivate("updateScrollbar", true);
			axis.zoom(0, 1);
		})

		this.yAxes.each((axis) => {
			axis.setPrivate("updateScrollbar", true);
			axis.zoom(0, 1);
		})
	}

	protected _dispose() {
		super._dispose();

		// Explicitly disposing cursor to avoid memory leak of cursor adding
		// keyboard events after parent chart has been disposed
		const cursor = this.get("cursor");
		if (cursor) {
			cursor.dispose();
		}
	}

}
