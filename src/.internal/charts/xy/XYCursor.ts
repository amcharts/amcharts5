import type { IPoint } from "../../core/util/IPoint";
import type { XYChart } from "./XYChart"
import type { XYSeries } from "./series/XYSeries";
import type { ISpritePointerEvent } from "../../core/render/Sprite";
import type { Axis } from "./axes/Axis";
import type { AxisRenderer } from "./axes/AxisRenderer";
import type { Tooltip } from "../../core/render/Tooltip";
import type { IDisposer } from "../../core/util/Disposer";

import { Container, IContainerSettings, IContainerPrivate, IContainerEvents } from "../../core/render/Container";
import { p100 } from "../../core/util/Percent";
import { Graphics } from "../../core/render/Graphics";
import { Grid } from "./axes/Grid";
//import { Animations } from "../core/util/Animation";

import * as $type from "../../core/util/Type";
import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";
import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";
import type { IPointerEvent } from "../../core/render/backend/Renderer";

export interface IXYCursorSettings extends IContainerSettings {

	/**
	 * X axis for the vertical line to snap to. When that axis has a `tooltip`,
	 * the line follows it from cell to cell, such as from category to category.
	 */
	xAxis?: Axis<AxisRenderer>;

	/**
	 * Y axis for the horizontal line to snap to. When that axis has a
	 * `tooltip`, the line follows it from cell to cell.
	 */
	yAxis?: Axis<AxisRenderer>;

	/**
	 * What dragging across the plot area does: zoom or select along X, Y or
	 * both.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/cursor/#behavior} for more info
	 * @default "none"
	 */
	behavior?: "zoomX" | "zoomY" | "zoomXY" | "selectX" | "selectY" | "selectXY" | "none";

	/**
	 * Pins the cursor at this horizontal position in the plot area: `0` is the
	 * left edge, `1` the right. While set, the cursor ignores the pointer.
	 */
	positionX?: number;

	/**
	 * Pins the cursor at this vertical position in the plot area: `0` is the
	 * top edge, `1` the bottom. While set, the cursor ignores the pointer.
	 */
	positionY?: number;

	/**
	 * Keeps the cursor visible when the pointer leaves the plot area.
	 *
	 * @default false
	 */
	alwaysShow?: boolean;

	/**
	 * Series to snap to: the cursor jumps to the nearest data item among them.
	 */
	snapToSeries?: Array<XYSeries>;

	/**
	 * How `snapToSeries` measures "nearest": `"xy"` by straight distance,
	 * `"x"` or `"y"` along one direction only. `"x!"` and `"y!"` do the same,
	 * but only among the items under the pointer, one per series.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/cursor/#snapping-to-series} for more info
	 * @since 5.0.6
	 * @default "xy"
	 */
	snapToSeriesBy?: "xy" | "x" | "y" | "x!" | "y!";

	/**
	 * Cursors of other charts that move along with this one.
	 *
	 * They sync by position on the page, not by axis value, so vertical lines
	 * follow each other only between charts stacked one above another, and
	 * horizontal lines only between charts side by side.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/cursor/#syncing-cursors} for more info
	 * @since 5.1.4
	 */
	syncWith?: Array<XYCursor>;

	/**
	 * How far in pixels the pointer must move between press and release for
	 * a drag to zoom or select. A shorter move counts as a click.
	 *
	 * @since 5.2.20
	 * @default 1
	 */
	moveThreshold?: number

	/**
	 * How far in pixels outside the plot area a press may start and still begin
	 * a zoom or selection, which then starts at the plot area's edge. Makes it
	 * easier to select from the very edge.
	 *
	 * @since 5.20.0
	 * @default 0
	 */
	clickTolerance?: number

}


export interface IXYCursorPrivate extends IContainerPrivate {

	/**
	 * Current X/Y coordinates of the cursor.
	 */
	point?: IPoint;

	/**
	 * Current horizontal position relative to the plot area (0-1).
	 */
	positionX?: number;

	/**
	 * Current vertical position relative to the plot area (0-1).
	 */
	positionY?: number;

	/**
	 * Horizontal position (0-1) where the current selection started.
	 */
	downPositionX?: number;

	/**
	 * Vertical position (0-1) where the current selection started.
	 */
	downPositionY?: number;

	/**
	 * The last point the cursor moved to, relative to the root.
	 */
	lastPoint?: IPoint;
}

export interface IXYCursorEvents extends IContainerEvents {

	/**
	 * A drag across the plot area ended, zooming or selecting (`behavior` is
	 * set).
	 */
	selectended: {
		originalEvent: IPointerEvent,
		target: XYCursor
	};

	/**
	 * The pointer was pressed on the plot area, starting a zoom or selection
	 * (`behavior` is set).
	 */
	selectstarted: {
		originalEvent: IPointerEvent,
		target: XYCursor
	};

	/**
	 * The cursor moved over the plot area.
	 */
	cursormoved: {
		point: IPoint,
		target: XYCursor,
		originalEvent?: IPointerEvent
	};

	/**
	 * The cursor was hidden as the pointer left the plot area.
	 */
	cursorhidden: {
		target: XYCursor
	};

	/**
	 * A press on the plot area was released without moving past
	 * `moveThreshold`, so no zoom or selection happened (`behavior` is set).
	 *
	 * @since 5.4.7
	 */
	selectcancelled: {
		originalEvent: IPointerEvent,
		target: XYCursor
	};

}

/**
 * Crosshair lines over an [[XYChart]] that follow the pointer and show the
 * axis and series tooltips. Dragging can zoom or select (`behavior`).
 *
 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/cursor/} for more info
 * @important
 */
export class XYCursor extends Container {
	public static className: string = "XYCursor";
	public static classNames: Array<string> = Container.classNames.concat([XYCursor.className]);

	declare public _settings: IXYCursorSettings;
	declare public _privateSettings: IXYCursorPrivate;
	declare public _events: IXYCursorEvents;

	protected _alwaysShow: boolean = false;

	/**
	 * The crosshair's vertical line, which follows the pointer along X.
	 */
	public readonly lineX: Grid = this.children.push(Grid.new(this._root, {
		themeTags: ["x"]
	}));

	/**
	 * The crosshair's horizontal line, which follows the pointer along Y.
	 */
	public readonly lineY: Grid = this.children.push(Grid.new(this._root, {
		themeTags: ["y"]
	}));

	/**
	 * The shaded area drawn while dragging. With a select `behavior`, it stays
	 * after the release.
	 */
	public readonly selection: Graphics = this.children.push(Graphics.new(this._root, {
		themeTags: ["selection", "cursor"], layer: 30
	})._markC("themeTags", "layer"));

	protected _movePoint: IPoint | undefined;
	protected _lastPoint: IPoint = { x: 0, y: 0 };
	protected _lastPoint2: IPoint = { x: 0, y: 0 };

	protected _tooltipX: boolean = false;
	protected _tooltipY: boolean = false;

	/**
	 * The chart the cursor belongs to.
	 */
	public chart: XYChart | undefined;

	protected _toX?: number;
	protected _toY?: number;

	protected _boundsTimeout?: IDisposer;

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["xy", "cursor"]);
		super._afterNew();
		this._setCAll({ "width": p100, height: p100, isMeasured: true, position: "absolute" });
		this.states._createC("hidden", { visible: true, opacity: 0 });
		this._drawLines();
		this.setPrivateRaw("visible", false);

		this._disposers.push(this.setTimeout(() => {
			this.setPrivate("visible", true)
		}, 500));

		this._disposers.push(this.lineX.events.on("positionchanged", () => {
			this._handleXLine();
		}));

		this._disposers.push(this.lineY.events.on("positionchanged", () => {
			this._handleYLine();
		}));

		this._disposers.push(this.lineX.events.on("focus", () => this._handleLineFocus()));
		this._disposers.push(this.lineX.events.on("blur", () => this._handleLineBlur()));

		this._disposers.push(this.lineY.events.on("focus", () => this._handleLineFocus()));
		this._disposers.push(this.lineY.events.on("blur", () => this._handleLineBlur()));

		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
				this._handleLineMove($utils.getEventKey(ev), ev.ctrlKey);
			}));
		}
	}

	protected _setUpTouch(): void {
		const chart = this.chart;
		if (chart) {
			chart.plotContainer._display.cancelTouch = this.get("behavior") != "none" ? true : false;
		}
	}

	protected _handleXLine() {
		let x = this.lineX.x();
		let visible = true;
		if (x < 0 || x > this.width()) {
			visible = false;
		}
		this.lineX.setPrivate("visible", visible);
	}

	protected _handleYLine() {
		let y = this.lineY.y();
		let visible = true;
		if (y < 0 || y > this.height()) {
			visible = false;
		}
		this.lineY.setPrivate("visible", visible);
	}

	protected _handleLineMove(key: string, ctrlKey?: boolean) {
		let dir: any = "";

		const chart = this.chart;

		let axis: Axis<AxisRenderer> | undefined;
		if (chart && chart.xAxes.length) {
			if (this._root.focused(this.lineX)) {
				dir = "positionX";
				axis = chart.xAxes.getIndex(0);
			}
			else if (this._root.focused(this.lineY)) {
				axis = chart.yAxes.getIndex(0);
				dir = "positionY";
			}

			let m = 1;
			if (ctrlKey) {
				m = 5;
			}

			if (axis) {
				let inversed = axis.get("renderer").get("inversed", false);
				let step;
				if (key == "ArrowRight" || key == "ArrowDown") {
					step = 1;
				}
				else if (key == "ArrowLeft" || key == "ArrowUp") {
					step = -1;
				}
				else if (key == "Tab") {
					step = 0;
				}

				if (step != null) {
					if (inversed) {
						step *= -1;
					}

					this.set(dir, axis.nextPosition(step * m));
				}
			}
		}
	}

	protected _handleLineFocus() {
		this._alwaysShow = this.get("alwaysShow", false);
		this.setAll({
			positionX: this.getPrivate("positionX", 0),
			positionY: this.getPrivate("positionY", 0),
			alwaysShow: true
		});

		this._handleLineMove("Tab");
	}

	protected _handleLineBlur() {
		if (this.lineX.isFocus() || this.lineY.isFocus()) {
			this.setAll({
				positionX: undefined,
				positionY: undefined,
				alwaysShow: this._alwaysShow
			});
		}
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("xAxis")) {
			this._tooltipX = false;
			const xAxis = this.get("xAxis");

			if (xAxis) {
				const tooltip = xAxis.get("tooltip");
				if (tooltip) {
					this._tooltipX = true;
					this._disposers.push(
						tooltip.on("pointTo", () => {
							this._updateXLine(tooltip);
						})
					)
				}
			}
		}

		if (this.isDirty("yAxis")) {
			this._tooltipY = false;
			const yAxis = this.get("yAxis");

			if (yAxis) {
				const tooltip = yAxis.get("tooltip");
				if (tooltip) {
					this._tooltipY = true;
					this._disposers.push(
						tooltip.on("pointTo", () => {
							this._updateYLine(tooltip);
						})
					)
				}
			}
		}
	}

	protected _handleSyncWith() {
		const chart = this.chart;
		if (chart) {
			const syncWith = this.get("syncWith");
			const otherCharts: Array<XYChart> = [];
			if (syncWith) {
				$array.each(syncWith, (cursor) => {
					const chart = cursor.chart;
					if (chart) {
						otherCharts.push(chart)
					}
				})
			}
			chart._otherCharts = otherCharts;
		}
	}

	public _updateChildren() {
		super._updateChildren();
		this._handleSyncWith();

		if (this.isDirty("positionX") || this.isDirty("positionY")) {
			const positionX = this.get("positionX");
			const positionY = this.get("positionY");

			if (positionX == null && positionY == null) {
				this.hide(0);
			}
			else {
				this._movePoint = this.toGlobal(this._getPoint(this.get("positionX", 0), this.get("positionY", 0)));
				this.handleMove();
			}
		}
	}

	protected _updateXLine(tooltip: Tooltip) {
		let x = $math.round(this._display.toLocal(tooltip.get("pointTo", { x: 0, y: 0 })).x, 3);
		if (this._toX != x) {
			this.lineX.animate({ key: "x", to: x, duration: tooltip.get("animationDuration", 0), easing: tooltip.get("animationEasing") });
			this._toX = x;
		}
	}

	protected _updateYLine(tooltip: Tooltip) {
		let y = $math.round(this._display.toLocal(tooltip.get("pointTo", { x: 0, y: 0 })).y, 3);
		if (this._toY != y) {
			this.lineY.animate({ key: "y", to: y, duration: tooltip.get("animationDuration", 0), easing: tooltip.get("animationEasing") });
			this._toY = y;
		}
	}

	protected _drawLines() {
		this.lineX.set("draw", (display) => {
			display.moveTo(0, 0);
			display.lineTo(0, this.height());
		})
		this.lineY.set("draw", (display) => {
			display.moveTo(0, 0);
			display.lineTo(this.width(), 0);
		})
	}

	/**
	 * Places the cursor again at its last point, after the chart under it has
	 * changed. A cursor with `alwaysShow` goes to `positionX` and `positionY`.
	 */
	public updateCursor() {
		if (this.get("alwaysShow")) {
			this._movePoint = this.toGlobal(this._getPoint(this.get("positionX", 0), this.get("positionY", 0)));
		}
		this.handleMove();
	}

	public _setChart(chart: XYChart): void {
		this.chart = chart;

		this._handleSyncWith();

		const plotContainer = chart.plotContainer;

		this.events.on("boundschanged", () => {
			if (this._boundsTimeout) {
				this._boundsTimeout.dispose();
			}
			this._boundsTimeout = this.setTimeout(() => {
				this.updateCursor();
			}, 50);
			this._disposers.push(this._boundsTimeout);
		})

		//this._display.interactive = true;
		if ($utils.supports("touchevents")) {
			this._disposers.push(plotContainer.events.on("click", (event) => {
				if ($utils.isTouchEvent(event.originalEvent)) {
					this._handleMove(event);
				}
			}));
			this._setUpTouch();
		}

		this._disposers.push(plotContainer.events.on("pointerdown", (event) => {
			this._handleCursorDown(event);
		}));

		this._disposers.push(plotContainer.events.on("globalpointerdown", (event) => {
			this._handleCursorDownGlobal(event);
		}));

		this._disposers.push(plotContainer.events.on("globalpointerup", (event) => {
			this._handleCursorUp(event);
			if (!event.native && !this.isHidden()) {
				this._handleMove(event);
			}
		}));

		this._disposers.push(plotContainer.events.on("globalpointermove", (event) => {
			if (!this.get("syncWith")) {
				// `_downPoint` counts as dragging too: a press outside the plot
				// area never populated `plotContainer._downPoints`.
				if ($object.keys(plotContainer._downPoints).length == 0 && !this._downPoint && !event.native && this.isHidden()) {
					// Ignore mouse movement if it originates on outside element and
					// we're not dragging.
					return;
				}
			}
			this._handleMove(event);

			if (Math.hypot(this._lastPoint2.x - event.point.x, this._lastPoint2.y - event.point.y) > 1) {
				this._handleLineBlur();
				this._lastPoint2 = event.point;
			}
		}));

		const parent = this.parent;
		if (parent) {
			parent.children.moveValue(this.selection);
		}
	}

	protected _inPlot(point: IPoint): boolean {
		const chart = this.chart;
		if (chart) {
			return chart.inPlot(point);
		}
		return false;
	}

	protected _handleCursorDown(event: ISpritePointerEvent) {
		if ((event.originalEvent as any).button == 2) {
			return;
		}

		const rootPoint = event.point;
		let local = this._display.toLocal(rootPoint);
		const chart = this.chart;

		this.selection.set("draw", () => { });

		if (chart && this._inPlot(local)) {
			this._startSelection(local, event);
		}
	}

	/**
	 * Handles a press outside the plot area but within `clickTolerance`: the
	 * press is clamped onto the plot edge and the selection starts there.
	 * In-plot presses are handled by `_handleCursorDown` instead.
	 */
	protected _handleCursorDownGlobal(event: ISpritePointerEvent) {
		const tolerance = this.get("clickTolerance", 0);
		if (tolerance <= 0 || this.get("behavior", "none") == "none") {
			return;
		}

		if ((event.originalEvent as any).button == 2) {
			return;
		}

		const chart = this.chart;
		if (!chart) {
			return;
		}

		const local = this._display.toLocal(event.point);

		// In-plot presses are handled by the plot container's own pointerdown.
		if (this._inPlot(local)) {
			return;
		}

		const w = this.width();
		const h = this.height();

		// How far outside the plot rectangle the press is, per axis.
		const dx = Math.max(0, -local.x, local.x - w);
		const dy = Math.max(0, -local.y, local.y - h);

		if (dx > tolerance || dy > tolerance) {
			return;
		}

		local.x = $math.fitToRange(local.x, 0, w);
		local.y = $math.fitToRange(local.y, 0, h);

		this.selection.set("draw", () => { });
		this._startSelection(local, event);
	}

	protected _startSelection(local: IPoint, event: ISpritePointerEvent) {
		this._downPoint = local;

		if (this.get("behavior") != "none") {
			this.selection.show();

			const type = "selectstarted";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, { type: type, target: this, originalEvent: event.originalEvent });
			}
		}

		let positionX = this._getPosition(local).x;
		let positionY = this._getPosition(local).y;

		this.setPrivate("downPositionX", positionX);
		this.setPrivate("downPositionY", positionY);
	}

	protected _handleCursorUp(event: ISpritePointerEvent) {
		// TODO: handle multitouch
		if (this._downPoint) {
			const behavior = this.get("behavior", "none");
			if (behavior != "none") {
				if (behavior.charAt(0) === "z") {
					this.selection.hide();
				}

				const rootPoint = event.point;
				let local = this._display.toLocal(rootPoint);

				// The press was clamped into the plot area, so clamp the release
				// point too - otherwise a click within `clickTolerance` measures
				// as a drag and dispatches "selectended".
				local.x = $math.fitToRange(local.x, 0, this.width());
				local.y = $math.fitToRange(local.y, 0, this.height());

				const downPoint = this._downPoint;
				const moveThreshold = this.get("moveThreshold", 1);
				if (local && downPoint) {
					let dispatch = false;
					if (behavior === "zoomX" || behavior === "zoomXY" || behavior === "selectX" || behavior === "selectXY") {
						if (Math.abs(local.x - downPoint.x) > moveThreshold) {
							dispatch = true;
						}
					}

					if (behavior === "zoomY" || behavior === "zoomXY" || behavior === "selectY" || behavior === "selectXY") {
						if (Math.abs(local.y - downPoint.y) > moveThreshold) {
							dispatch = true;
						}
					}

					if (dispatch) {
						const type = "selectended";
						if (this.events.isEnabled(type)) {
							this.events.dispatch(type, { type: type, target: this, originalEvent: event.originalEvent });
						}
					}
					else {
						const type = "selectcancelled";
						if (this.events.isEnabled(type)) {
							this.events.dispatch(type, { type: type, target: this, originalEvent: event.originalEvent });
						}
					}
				}
			}
		}
		this._downPoint = undefined;
	}

	protected _handleMove(event: ISpritePointerEvent) {
		if (this.getPrivate("visible")) {
			const chart = this.chart;
			if (chart && $object.keys(chart.plotContainer._downPoints).length > 1) {
				this._setC("forceHidden", true)
				return;
			}
			else {
				this._setC("forceHidden", false)
			}

			// TODO: handle multitouch
			const rootPoint = event.point;
			const lastPoint = this._lastPoint;

			if (Math.round(lastPoint.x) === Math.round(rootPoint.x) && Math.round(lastPoint.y) === Math.round(rootPoint.y)) {
				return;
			}

			this._lastPoint = rootPoint;
			this.setPrivate("lastPoint", rootPoint);

			this.handleMove({ x: rootPoint.x, y: rootPoint.y }, false, event.originalEvent);
		}
	}

	protected _getPosition(point: IPoint): IPoint {
		return { x: point.x / this.width(), y: point.y / this.height() };
	}

	/**
	 * Moves the cursor to a point, as if the pointer were there.
	 *
	 * @param  point          Point relative to the root; the last point if not given
	 * @param  skipEvent      Do not dispatch `"cursormoved"`
	 * @param  originalEvent  The pointer event behind the move, passed on with `"cursormoved"`
	 */
	public handleMove(point?: IPoint, skipEvent?: boolean, originalEvent?: IPointerEvent) {
		if (!point) {
			point = this._movePoint;
		}

		const alwaysShow = this.get("alwaysShow");

		if (!point) {
			this.hide(0);
			return;
		}

		this._movePoint = point;
		let local = this._display.toLocal(point);
		let chart = this.chart;

		if (chart && (this._inPlot(local) || this._downPoint)) {
			chart._movePoint = point;

			if (this.isHidden()) {
				this.show();

				const behavior = this.get("behavior", "");
				if (behavior.charAt(0) == "z") {
					this.selection.set("draw", () => { });
				}
			}

			let x = local.x;
			let y = local.y;

			let xyPos = this._getPosition(local);

			this.setPrivate("point", local);

			let snapToSeries = this.get("snapToSeries");

			if (this._downPoint) {
				snapToSeries = undefined;
			}

			let userPositionX = this.get("positionX");
			let positionX = xyPos.x;

			if ($type.isNumber(userPositionX)) {
				positionX = userPositionX;
			}

			let userPositionY = this.get("positionY");
			let positionY = xyPos.y;

			if ($type.isNumber(userPositionY)) {
				positionY = userPositionY;
			}

			this.setPrivate("positionX", positionX);
			this.setPrivate("positionY", positionY);

			const xy = this._getPoint(positionX, positionY);
			x = xy.x;
			y = xy.y;

			chart.xAxes.each((axis) => {
				axis._handleCursorPosition(positionX, snapToSeries);
				if (alwaysShow) {
					axis.handleCursorShow();
				}
			})
			chart.yAxes.each((axis) => {
				axis._handleCursorPosition(positionY, snapToSeries);
				if (alwaysShow) {
					axis.handleCursorShow();
				}
			})

			if (!skipEvent) {
				chart._handleCursorPosition();

				const type = "cursormoved";
				if (this.events.isEnabled(type)) {
					this.events.dispatch(type, { type: type, target: this, point: point, originalEvent: originalEvent });
				}
			}

			this._updateLines(x, y);

			chart.arrangeTooltips();
		}
		else if (!this._downPoint) {
			if (!alwaysShow) {
				this.hide(0);

				const type = "cursorhidden";
				if (this.events.isEnabled(type)) {
					this.events.dispatch(type, { type: type, target: this });
				}
			}
		}

		if (this._downPoint && this.get("behavior") != "none") {
			this._updateSelection(local)
		}
	}

	protected _getPoint(positionX: number, positionY: number): IPoint {
		return { x: this.width() * positionX, y: this.height() * positionY };
	}


	protected _updateLines(x: number, y: number) {
		if (!this._tooltipX) {
			this.lineX._setC("x", x);
		}
		if (!this._tooltipY) {
			this.lineY._setC("y", y);
		}

		this._drawLines();
	}

	protected _updateSelection(point: IPoint) {
		const selection = this.selection;
		const behavior = this.get("behavior");
		const w = this.width();
		const h = this.height();

		if (point.x < 0) {
			point.x = 0;
		}

		if (point.x > w) {
			point.x = w;
		}

		if (point.y < 0) {
			point.y = 0;
		}

		if (point.y > h) {
			point.y = h;
		}

		selection.set("draw", (display) => {
			const downPoint = this._downPoint;
			if (downPoint) {
				if (behavior === "zoomXY" || behavior === "selectXY") {
					display.moveTo(downPoint.x, downPoint.y);
					display.lineTo(downPoint.x, point.y);
					display.lineTo(point.x, point.y);
					display.lineTo(point.x, downPoint.y);
					display.lineTo(downPoint.x, downPoint.y);
				}
				else if (behavior === "zoomX" || behavior === "selectX") {
					display.moveTo(downPoint.x, 0);
					display.lineTo(downPoint.x, h);
					display.lineTo(point.x, h);
					display.lineTo(point.x, 0);
					display.lineTo(downPoint.x, 0);
				}
				else if (behavior === "zoomY" || behavior === "selectY") {
					display.moveTo(0, downPoint.y);
					display.lineTo(w, downPoint.y);
					display.lineTo(w, point.y);
					display.lineTo(0, point.y);
					display.lineTo(0, downPoint.y);
				}
			}
		})
	}

	protected _onHide() {
		if (this.isHidden()) {
			let chart = this.chart;
			if (chart) {

				chart.xAxes.each((axis) => {
					axis.handleCursorHide();
				})
				chart.yAxes.each((axis) => {
					axis.handleCursorHide();
				})
				chart.series.each((series) => {
					series.handleCursorHide();
				})
			}
		}
		super._onHide();
	}

	protected _onShow() {
		if (!this.isHidden()) {
			let chart = this.chart;
			if (chart) {
				chart.xAxes.each((axis) => {
					axis.handleCursorShow();
				})
				chart.yAxes.each((axis) => {
					axis.handleCursorShow();
				})
			}
		}
		super._onShow();
	}

	protected _dispose() {
		super._dispose();
		this.selection.dispose();
	}
}
