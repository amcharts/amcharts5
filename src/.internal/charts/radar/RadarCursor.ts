import type { IPoint } from "../../core/util/IPoint";
import type { RadarChart } from "./RadarChart"
import type { Percent } from "../../core/util/Percent";
import type { Tooltip } from "../../core/render/Tooltip";

import { XYCursor, IXYCursorSettings, IXYCursorPrivate, IXYCursorEvents } from "../xy/XYCursor";
import { p100 } from "../../core/util/Percent";
import { arc } from "d3-shape";

import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";


export interface IRadarCursorSettings extends IXYCursorSettings {

	/**
	 * Cursor's inner radius.
	 */
	innerRadius?: number | Percent;

	/**
	 * Cursor's inner radius.
	 */
	radius?: number | Percent;

	//xAxis?: Axis<AxisRendererCircular>;
	//yAxis?: Axis<AxisRendererRadial>;

	/**
	 * Cursor's position angle in degrees.
	 */
	startAngle?: number;

	/**
	 * Cursor's selection end angle in degrees.
	 */
	endAngle?: number;

}

export interface IRadarCursorPrivate extends IXYCursorPrivate {

	/**
	 * Actual radius of the cursor in pixels.
	 */
	radius: number;

	/**
	 * Actual inner radius of the cursor in pixels.
	 */
	innerRadius: number;

	/**
	 * Actual start angle of the cursor in degrees.
	 */
	startAngle: number;

	/**
	 * Actual end angle of the cursor in degrees.
	 */
	endAngle: number;

}

export interface IRadarCursorEvents extends IXYCursorEvents {
}

/**
 * Creates a cursor for a [[RadarChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/#Cursor} for more info
 */
export class RadarCursor extends XYCursor {
	public static className: string = "RadarCursor";
	public static classNames: Array<string> = XYCursor.classNames.concat([RadarCursor.className]);

	declare public _settings: IRadarCursorSettings;
	declare public _privateSettings: IRadarCursorPrivate;
	declare public _events: IRadarCursorEvents;

	/**
	 * A chart cursor is attached to.
	 */
	declare public chart: RadarChart | undefined;

	protected _fillGenerator = arc();

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["radar", "cursor"]);

		super._afterNew();
	}

	protected _handleXLine() {

	}

	protected _handleYLine() {

	}

	protected _getPosition(point: IPoint): IPoint {
		const radius = Math.hypot(point.x, point.y);
		let angle = $math.normalizeAngle(Math.atan2(point.y, point.x) * $math.DEGREES);

		const innerRadius = this.getPrivate("innerRadius");

		let startAngle = $math.normalizeAngle(this.getPrivate("startAngle"));
		let endAngle = $math.normalizeAngle(this.getPrivate("endAngle"));

		if (endAngle < startAngle || endAngle == startAngle) {
			if (angle < startAngle) {
				angle += 360
			}

			endAngle = endAngle + 360;
		}

		let xPos = (angle - startAngle) / (endAngle - startAngle);

		if (xPos < 0) {
			xPos = 1 + xPos;
		}

		if (xPos < 0.003) {
			xPos = 0;
		}

		if (xPos > 0.997) {
			xPos = 1;
		}

		return { x: xPos, y: (radius - innerRadius) / (this.getPrivate("radius") - innerRadius) };
	}

	protected _getPoint(positionX: number, positionY: number): IPoint {

		const innerRadius = this.getPrivate("innerRadius");
		const startAngle = this.getPrivate("startAngle");
		const endAngle = this.getPrivate("endAngle");
		const radius = this.getPrivate("radius");

		const angle = startAngle + positionX * (endAngle - startAngle);
		const r = innerRadius + (radius - innerRadius) * positionY;

		return { x: r * $math.cos(angle), y: r * $math.sin(angle) };
	}

	/**
	 * @ignore
	 */
	public updateLayout() {
		const chart = this.chart;
		if (chart) {
			const radius = chart.getPrivate("radius", 0);

			this.setPrivate("radius", $utils.relativeToValue(this.get("radius", p100), radius));

			let innerRadius = $utils.relativeToValue(this.get("innerRadius", chart.getPrivate("innerRadius", 0)), radius);
			if (innerRadius < 0) {
				innerRadius = radius + innerRadius;
			}

			this.setPrivate("innerRadius", innerRadius);

			let startAngle = this.get("startAngle", chart.get("startAngle", -90));
			let endAngle = this.get("endAngle", chart.get("endAngle", 270));

			this.setPrivate("startAngle", startAngle);
			this.setPrivate("endAngle", endAngle);
		}
	}

	protected _updateLines(x: number, y: number) {
		if (!this._tooltipX) {
			this._drawXLine(x, y);
		}
		if (!this._tooltipY) {
			this._drawYLine(x, y);
		}
	}

	protected _drawXLine(x: number, y: number) {
		const innerRadius = this.getPrivate("innerRadius");
		const radius = this.getPrivate("radius");
		const angle = Math.atan2(y, x);

		this.lineX.set("draw", (display) => {
			display.moveTo(innerRadius * Math.cos(angle), innerRadius * Math.sin(angle));
			display.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
		})
	}

	protected _drawYLine(x: number, y: number) {
		const positionRadius = Math.hypot(x, y);

		this.lineY.set("draw", (display) => {
			display.arc(0, 0, positionRadius, this.getPrivate("startAngle", 0) * $math.RADIANS, this.getPrivate("endAngle", 0) * $math.RADIANS);
		})
	}

	protected _updateXLine(tooltip: Tooltip) {
		let point = tooltip.get("pointTo");
		if (point) {
			point = this._display.toLocal(point);
			this._drawXLine(point.x, point.y);
		}
	}

	protected _updateYLine(tooltip: Tooltip) {
		let point = tooltip.get("pointTo")
		if (point) {
			point = this._display.toLocal(point);
			this._drawYLine(point.x, point.y);
		}
	}

	protected _inPlot(point: IPoint): boolean {
		const chart = this.chart;

		if (chart) {
			return chart.inPlot(point, this.getPrivate("radius"), this.getPrivate("innerRadius"));
		}
		return false;
	}

	protected _updateSelection(point: IPoint) {

		this.selection.set("draw", (display) => {
			const behavior = this.get("behavior");

			const downPoint = this._downPoint;
			const cursorStartAngle = this.getPrivate("startAngle");
			const cursorEndAngle = this.getPrivate("endAngle");
			let cursorRadius = this.getPrivate("radius");
			let cursorInnerRadius = this.getPrivate("innerRadius");

			if (cursorRadius < cursorInnerRadius) {
				[cursorRadius, cursorInnerRadius] = [cursorInnerRadius, cursorRadius];
			}

			let startAngle = cursorStartAngle;
			let endAngle = cursorEndAngle;
			let radius = cursorRadius;
			let innerRadius = cursorInnerRadius;

			if (downPoint) {
				if (behavior == "zoomXY" || behavior == "selectXY") {
					startAngle = Math.atan2(downPoint.y, downPoint.x) * $math.DEGREES;
					endAngle = Math.atan2(point.y, point.x) * $math.DEGREES;
					innerRadius = Math.hypot(downPoint.x, downPoint.y);
					radius = Math.hypot(point.x, point.y);
				}
				else if (behavior == "zoomX" || behavior == "selectX") {
					startAngle = Math.atan2(downPoint.y, downPoint.x) * $math.DEGREES;
					endAngle = Math.atan2(point.y, point.x) * $math.DEGREES;
				}
				else if (behavior == "zoomY" || behavior == "selectY") {
					innerRadius = Math.hypot(downPoint.x, downPoint.y);
					radius = Math.hypot(point.x, point.y);
				}
			}

			innerRadius = $math.fitToRange(innerRadius, cursorInnerRadius, cursorRadius);
			radius = $math.fitToRange(radius, cursorInnerRadius, cursorRadius);

			startAngle = $math.fitAngleToRange(startAngle, cursorStartAngle, cursorEndAngle);
			endAngle = $math.fitAngleToRange(endAngle, cursorStartAngle, cursorEndAngle);

			if (startAngle == endAngle) {
				endAngle = startAngle + 360;
			}

			startAngle *= $math.RADIANS;
			endAngle *= $math.RADIANS;

			this._fillGenerator.context(display as any);
			this._fillGenerator({ innerRadius: innerRadius, outerRadius: radius, startAngle: startAngle + Math.PI / 2, endAngle: endAngle + Math.PI / 2 });
		})
	}
}
