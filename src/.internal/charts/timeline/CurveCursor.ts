import type { IPoint } from "../../core/util/IPoint";
import type { Tooltip } from "../../core/render/Tooltip";
import type { CurveChart } from "./CurveChart";
import type { AxisRendererCurveX } from "./AxisRendererCurveX";
import type { AxisRendererCurveY } from "./AxisRendererCurveY";
import type { Axis } from "../xy/axes/Axis";

import { XYCursor, IXYCursorSettings, IXYCursorPrivate, IXYCursorEvents } from "../xy/XYCursor";

import * as $utils from "../../core/util/Utils";
import * as $array from "../../core/util/Array";

export interface ICurveCursorSettings extends IXYCursorSettings {

	/**
	 * A target X-axis.
	 * 
	 * Differently from the `XYChart`, this setting is required for cursor to work.
	 */
	xAxis: Axis<AxisRendererCurveX>;

	/**
	 * A target Y-axis.
	 * 
	 * Differently from the `XYChart`, this setting is required for cursor to work.
	 */
	yAxis: Axis<AxisRendererCurveY>;

}

export interface ICurveCursorPrivate extends IXYCursorPrivate {
}

export interface ICurveCursorEvents extends IXYCursorEvents {
}

/**
 * A chart cursor for use in a [[CurveChart]], [[SerpetineChart]], or
 * a [[SpiralChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/timeline/} for more info
 * @since 5.12.0
 * @important
 */
export class CurveCursor extends XYCursor {
	public static className: string = "CurveCursor";
	public static classNames: Array<string> = XYCursor.classNames.concat([CurveCursor.className]);

	declare public _settings: ICurveCursorSettings;
	declare public _privateSettings: ICurveCursorPrivate;
	declare public _events: ICurveCursorEvents;

	/**
	 * A chart cursor is attached to.
	 */
	declare public chart: CurveChart | undefined;

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["curve", "cursor"]);

		super._afterNew();
	}

	protected _handleXLine() {

	}

	protected _handleYLine() {

	}

	protected _getPosition(point: IPoint): IPoint {
		const xRenderer = this.get("xAxis").get("renderer") as AxisRendererCurveX;
		return xRenderer.pointToPosition(point);
	}

	protected _getPoint(positionX: number, positionY: number): IPoint {
		const xRenderer = this.get("xAxis").get("renderer") as AxisRendererCurveX;
		return xRenderer.positionToPoint(positionX, positionY);
	}

	/**
	 * @ignore
	 */
	public updateLayout() {

	}


	protected _updateLines(x: number, y: number) {
		if (!this._tooltipX) {
			this._drawXLine(x, y);
		}
		if (!this._tooltipY) {
			this._drawYLine(x, y);
		}
	}

	protected _drawXLine(_x: number, _y: number) {
		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");
		const renderer = xAxis.get("renderer");
		const position = renderer.toAxisPosition(this.getPrivate("positionX", 0));
		const p0 = renderer.positionToPoint(position, yAxis.get("start", 0));
		const p1 = renderer.positionToPoint(position, yAxis.get("end", 1));

		this.lineX.set("draw", (display) => {
			display.moveTo(p0.x, p0.y);
			display.lineTo(p1.x, p1.y);
		})

	}

	protected _drawYLine(_x: number, _y: number) {
		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");
		const renderer = yAxis.get("renderer");
		const position = 1 - renderer.toAxisPosition(this.getPrivate("positionY", 0));


		const points = renderer.getPoints(xAxis.get("start", 0), position, xAxis.get("end", 1), position);
		if (points) {
			if (position > yAxis.get("start", 0) && position < yAxis.get("end", 1)) {
				this.lineY.set("draw", (display) => {
					if (points.length > 0) {
						display.moveTo(points[0].x, points[0].y);
						$array.each(points, (point) => {
							display.lineTo(point.x, point.y);
						})
					}
				})
			}
			else {
				this.lineY.set("draw", (display) => {
					display.clear();
				})
			}
		}
	}

	protected _updateXLine(tooltip: Tooltip) {
		let point = tooltip.get("pointTo");
		if (point) {
			this._drawXLine(point.x, point.y);
		}
	}

	protected _updateYLine(tooltip: Tooltip) {
		let point = tooltip.get("pointTo")
		if (point) {
			this._drawYLine(point.x, point.y);
		}
	}

	protected _inPlot(): boolean {
		const chart = this.chart;

		if (chart) {

		}
		return true;
	}

	protected _updateSelection() {
		this.selection.set("draw", (display) => {
			const behavior = this.get("behavior");

			let xAxis = this.get("xAxis");
			let yAxis = this.get("yAxis");

			let downPositionX = xAxis.toAxisPosition(this.getPrivate("downPositionX", 0));
			let downPositionY = yAxis.toAxisPosition(this.getPrivate("downPositionY", 0));

			let positionX = xAxis.toAxisPosition(this.getPrivate("positionX", 0));
			let positionY = yAxis.toAxisPosition(this.getPrivate("positionY", 0));

			if (behavior == "zoomX" || behavior == "selectX") {
				downPositionY = yAxis.get("start", 0);
				positionY = yAxis.get("end", 1);
			}
			else if (behavior == "zoomY" || behavior == "selectY") {
				downPositionX = xAxis.get("start", 0);
				positionX = xAxis.get("end", 1);
			}

			const points = xAxis.get("renderer").getPoints(downPositionX, downPositionY, positionX, positionY);

			display.moveTo(points[0].x, points[0].y);
			$array.each(points, (point) => {
				display.lineTo(point.x, point.y);
			})
			display.closePath();
		})
	}
}
