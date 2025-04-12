import { CurveChart, ICurveChartPrivate, ICurveChartSettings } from "./CurveChart";
import { p50, Percent } from "../../core/util/Percent";

import type { CurveColumnSeries } from "./CurveColumnSeries";
import type { AxisRendererCurveY } from "./AxisRendererCurveY";
import type { AxisRendererCurveX } from "./AxisRendererCurveX";

import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";


export interface ISpiralChartSettings extends ICurveChartSettings {

	/**
	 * Numer of spiral circles.
	 *
	 * @default 3
	 */
	levelCount?: number;

	/**
	 * y Axis radius in percent.
	 *
	 * @defgault 50%
	 */
	yAxisRadius?: Percent;

	/**
	 * Start angle of the spiral in degrees.
	 *
	 * @default -90
	 */
	startAngle?: number;

	/**
	 * End angle of the spiral in degrees.
	 *
	 * default 0
	 */
	endAngle?: number;

	/**
	 * Inner radius of the spiral in percent.
	 *
	 * @default 60%
	 */
	innerRadius?: Percent;

}

export interface ISpiralChartPrivate extends ICurveChartPrivate {
}

/**
 * A spiral chart.
 * 
 * For this chart to work, it needs curve points provided via renderer of
 * its X-axis.
 * 
 * Note: it is an experimental chart type and does not support all the
 * functionality of the [[XYChart]].
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

		if (this.isDirty("levelCount")) {
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
			renderer.set("axisLength", yAxisRadius);
			axis.markDirtySize();
		})

		this.xAxes.each((axis) => {
			const renderer = axis.get("renderer") as AxisRendererCurveX;
			renderer.setPrivate("autoScale", false);
			renderer.set("points", points);
		})
		super._updateMasks();
	}
}
