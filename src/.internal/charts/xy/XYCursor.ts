import type { IPoint } from "../../core/util/IPoint";
import type { XYChart } from "./XYChart"
import type { XYSeries } from "./series/XYSeries";
import type { ISpritePointerEvent } from "../../core/render/Sprite";
import type { Axis } from "./axes/Axis";
import type { AxisRenderer } from "./axes/AxisRenderer";
import type { Tooltip } from "../../core/render/Tooltip";

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
	 * Cursor's X axis.
	 *
	 * If set, cursor will snap to that axis' cells.
	 */
	xAxis?: Axis<AxisRenderer>;

	/**
	 * Cursor's Y axis.
	 *
	 * If set, cursor will snap to that axis' cells.
	 */
	yAxis?: Axis<AxisRenderer>;

	/**
	 * What should cursor do when dragged across plot area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/#Behavior} for more info
	 * @default "none"
	 */
	behavior?: "zoomX" | "zoomY" | "zoomXY" | "selectX" | "selectY" | "selectXY" | "none";

	/**
	 * Cursor's horizontal position relative to plot area.
	 *
	 * If this setting is set, cursor will not react to mouse/touch and will just
	 * sit at specified position until `positionX` is reset to `undefined`.
	 *
	 * `0` - left, `1` - right.
	 */
	positionX?: number;

	/**
	 * Cursor's vertical position relative to plot area.
	 *
	 * If this setting is set, cursor will not react to mouse/touch and will just
	 * sit at specified position until `positionY` is reset to `undefined`.
	 *
	 * `0` - left, `1` - right.
	 */
	positionY?: number;

	/**
	 * If set to `true`, cursor will not be hidden when mouse cursor moves out
	 * of the plot area.
	 *
	 * @default false
	 */
	alwaysShow?: boolean;

	/**
	 * A list of series to snap cursor to.
	 *
	 * If set, the cursor will always snap to the closest data item of listed
	 * series.
	 */
	snapToSeries?: Array<XYSeries>;

	/**
	 * Defines in which direction to look when searching for the nearest data
	 * item to snap to.
	 *
	 * Possible values: `"xy"` (default), `"x"`, `"y"`, `"x!"`, `"y!"`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/#snapping-to-series} for more info
	 * @since 5.0.6
	 * @default "xy"
	 */
	snapToSeriesBy?: "xy" | "x" | "y" | "x!" | "y!";

	/**
	 * An array of other [[XYCursor]] objects to sync this cursor with.
	 *
	 * If set will automatically move synced cursors to the same position within
	 * their respective axes as the this cursor assumin same XY coordinates of
	 * the pointer.
	 *
	 * NOTE: Syncing is performed using actual X/Y coordinates of the point of
	 * mouse cursor's position or touch. It means that they will not sync by axis
	 * positions, but rather by screen coordinates. For example vertical lines
	 * will not sync across horizontally laid out charts, and vice versa.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/#syncing-cursors} for more info
	 * @since 5.1.4
	 */
	syncWith?: Array<XYCursor>;

	/**
	 * Minimum distance in pixels between down and up points.
	 *
	 * If a distance is less than the value of `moveThreshold`, the zoom or
	 * selection won't happen.
	 *
	 * @since 5.2.20
	 * @default 1
	 */
	moveThreshold?: number

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
	 * Horizontal cursor position on the moment when selection started.
	 */
	downPositionX?: number;

	/**
	 * Vertical cursor position on the moment when selection started.
	 */
	downPositionY?: number;

	/**
	 * Last global point to which cursor moved
	 */
	lastPoint?: IPoint;
}

export interface IXYCursorEvents extends IContainerEvents {

	/**
	 * Kicks in when cursor selection ends.
	 *
	 * Only when `behavior` is set.
	 */
	selectended: {
		originalEvent: IPointerEvent,
		target: XYCursor
	};

	/**
	 * Kicks in when cursor selection starts.
	 *
	 * Only when `behavior` is set.
	 */
	selectstarted: {
		originalEvent: IPointerEvent,
		target: XYCursor
	};

	/**
	 * Kicks in when cursor's position over plot area changes.
	 */
	cursormoved: {
		point: IPoint,
		target: XYCursor,
		originalEvent?: IPointerEvent
	};

	/**
	 * Kicks in when cursor's is hidden when user rolls-out of the plot area
	 */
	cursorhidden: {
		target: XYCursor
	};

	/**
	 * Invoked if pointer is pressed down on a plot area and released without
	 * moving (only when behavior is `"selectX"`).
	 *
	 * @since 5.4.7
	 */
	selectcancelled: {
		originalEvent: IPointerEvent,
		target: XYCursor
	};

}

/**
 * Creates a chart cursor for an [[XYChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/} for more info
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
	 * A [[Grid]] elment that used for horizontal line of the cursor crosshair.
	 *
	 * @default Grid.new()
	 */
	public readonly lineX: Grid = this.children.push(Grid.new(this._root, {
		themeTags: ["x"]
	}));

	/**
	 * A [[Grid]] elment that used for horizontal line of the cursor crosshair.
	 *
	 * @default Grid.new()
	 */
	public readonly lineY: Grid = this.children.push(Grid.new(this._root, {
		themeTags: ["y"]
	}));

	/**
	 * An element that represents current selection.
	 *
	 * @default Graphics.new()
	 */
	public readonly selection: Graphics = this.children.push(Graphics.new(this._root, {
		themeTags: ["selection", "cursor"], layer: 30
	}));

	protected _movePoint: IPoint | undefined;
	protected _lastPoint: IPoint = { x: 0, y: 0 };
	protected _lastPoint2: IPoint = { x: 0, y: 0 };

	protected _tooltipX: boolean = false;
	protected _tooltipY: boolean = false;

	/**
	 * A chart cursor is attached to.
	 */
	public chart: XYChart | undefined;

	protected _toX?: number;
	protected _toY?: number;

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["xy", "cursor"]);
		super._afterNew();
		this.setAll({ "width": p100, height: p100, isMeasured: true, position: "absolute" });
		this.states.create("hidden", { visible: true, opacity: 0 });
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
			this._disposers.push(this.setTimeout(() => {
				this.updateCursor();
			}, 50))
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

		this._disposers.push(plotContainer.events.on("globalpointerup", (event) => {
			this._handleCursorUp(event);
			if (!event.native && !this.isHidden()) {
				this._handleMove(event);
			}
		}));

		this._disposers.push(plotContainer.events.on("globalpointermove", (event) => {
			if (!this.get("syncWith")) {
				if ($object.keys(plotContainer._downPoints).length == 0 && !event.native && this.isHidden()) {
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
				this.set("forceHidden", true)
				return;
			}
			else {
				this.set("forceHidden", false)
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
	 * Moves the cursor to X/Y coordinates within chart container (`point`).
	 *
	 * If `skipEvent` parameter is set to `true`, the move will not invoke
	 * the `"cursormoved"` event.
	 *
	 * @param  point      X/Y to move cursor to
	 * @param  skipEvent  Do not fire "cursormoved" event
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
			this.lineX.set("x", x);
		}
		if (!this._tooltipY) {
			this.lineY.set("y", y);
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
