import type { CurveColumnSeries } from "./CurveColumnSeries";
import type { AxisRendererCurveY } from "./AxisRendererCurveY";
import type { AxisRendererCurveX } from "./AxisRendererCurveX";

import { CurveChart, ICurveChartPrivate, ICurveChartSettings } from "./CurveChart";
import { p50, Percent } from "../../core/util/Percent";

import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";


export interface ISpiralChartSettings extends ICurveChartSettings {

	/**
	 * Number of turns the spiral makes from `innerRadius` to the outer edge.
	 *
	 * @default 3
	 */
	levelCount?: number;

	/**
	 * Length of the Y axis, as a percent of the distance between neighboring
	 * turns.
	 *
	 * @default 60%
	 */
	yAxisRadius?: Percent;

	/**
	 * Angle in degrees where the spiral starts, at its inner end: `0` points
	 * right, `-90` up.
	 *
	 * @default -90
	 */
	startAngle?: number;

	/**
	 * Angle in degrees where the spiral ends, at its outer edge.
	 *
	 * @default 0
	 */
	endAngle?: number;

	/**
	 * Radius where the spiral starts, as a percent of the chart's radius.
	 *
	 * @default 20%
	 */
	innerRadius?: Percent;

}

export interface ISpiralChartPrivate extends ICurveChartPrivate {
}

/**
 * A timeline that winds outward in a spiral, clockwise. It builds the X axis
 * line itself, so the X renderer needs no `points`.
 *
 * It is experimental and does not support everything an [[XYChart]] does.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/timeline/} for more info
 * @since 5.12.0
 * @important
 */
export class SpiralChart extends CurveChart {

	public static className: string = "SpiralChart";
	public static classNames: Array<string> = CurveChart.classNames.concat([SpiralChart.className]);

	declare public _settings: ISpiralChartSettings;
	declare public _privateSettings: ISpiralChartPrivate;

	declare public _seriesType: CurveColumnSeries;


	public _prepareChildren(): void {
		super._prepareChildren();

		if (this.isDirty("levelCount") || this.isDirty("yAxisRadius") || this.isDirty("startAngle") || this.isDirty("endAngle") || this.isDirty("innerRadius")) {
			this._updateMasks();
		}
	}

	public _updateMasks(): void {

		let w = this.plotContainer.innerWidth();
		let h = this.plotContainer.innerHeight();

		let radius: number = Math.min(w, h) / 2;
		let innerRadius = $utils.relativeToValue(this.get("innerRadius", 0), radius);
		let radiusStep = (radius - innerRadius) / this.get("levelCount", 1);
		let yAxisRadius: number = $utils.relativeToValue(this.get("yAxisRadius", p50), radiusStep);

		const points = $math.spiralPoints(0, 0, radius, radius, innerRadius, 20, radiusStep, this.get("startAngle", 0), this.get("endAngle", 360));

		this.yAxes.each((axis) => {
			const renderer = axis.get("renderer") as AxisRendererCurveY;
			renderer._setC("axisLength", yAxisRadius);
			axis.markDirtySize();
		})

		this.xAxes.each((axis) => {
			const renderer = axis.get("renderer") as AxisRendererCurveX;
			renderer.setPrivate("autoScale", false);
			renderer._setC("points", points);
		})
		super._updateMasks();
	}
}
