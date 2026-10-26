import type { PieSeries } from "./PieSeries";

import { Percent } from "../../core/util/Percent";
import { PercentChart, IPercentChartPrivate, IPercentChartSettings } from "../percent/PercentChart";
import { p50 } from "../../core/util/Percent";

import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";


export interface IPieChartSettings extends IPercentChartSettings {

	/**
	 * Outer radius of the pie, in pixels or percent. A percent is of the
	 * largest radius that fits the chart for its `startAngle` and `endAngle`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/#pie-radius} for more info
	 * @default 80%
	 */
	radius?: number | Percent;

	/**
	 * Inner radius of the pie, in pixels or percent of `radius`; any non-zero
	 * value makes a donut. A negative number is pixels in from the outer
	 * radius.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/#pie-radius} for more info
	 */
	innerRadius?: number | Percent;

	/**
	 * Angle where the pie starts, in degrees: `0` is at the right, `-90` at the
	 * top, and angles grow clockwise. The chart uses it to fit and center the
	 * pie; the series' own `startAngle` sets where its slices start, so set
	 * both.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/#startend-angles} for more info
	 * @default -90
	 */
	startAngle?: number;

	/**
	 * Angle where the pie ends, in degrees. Like `startAngle`, it fits and
	 * centers the pie; set the series' `endAngle` to match.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/#startend-angles} for more info
	 * @default 270
	 */
	endAngle?: number;

}

export interface IPieChartPrivate extends IPercentChartPrivate {

	/**
	 * @ignore
	 */
	irModifyer?: number;

}

/**
 * A pie or donut chart. Several [[PieSeries]] in one chart split the space
 * between `innerRadius` and `radius` into concentric rings, unless they set
 * their own radii.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/} for more info
 * @important
 */
export class PieChart extends PercentChart {

	public static className: string = "PieChart";
	public static classNames: Array<string> = PercentChart.classNames.concat([PieChart.className]);

	declare public _settings: IPieChartSettings;
	declare public _privateSettings: IPieChartPrivate;
	declare public _seriesType: PieSeries;

	public _maxRadius: number = 1;

	protected _afterNew() {
		super._afterNew();
		this.seriesContainer.setAll({ x: p50, y: p50 });
	}

	protected _processSeries(series: this["_seriesType"]) {
		super._processSeries(series);
		this.series.each((s) => {
			s._markDirtyKey("innerRadius");
		});
	}

	public _prepareChildren() {
		super._prepareChildren();

		const chartContainer = this.chartContainer;
		const w = chartContainer.innerWidth();
		const h = chartContainer.innerHeight();

		const startAngle = this.get("startAngle", 0);
		const endAngle = this.get("endAngle", 0);
		const innerRadius = this.get("innerRadius");

		let bounds = $math.getArcBounds(0, 0, startAngle, endAngle, 1);

		const wr = w / (bounds.right - bounds.left);
		const hr = h / (bounds.bottom - bounds.top);

		let innerBounds = { left: 0, right: 0, top: 0, bottom: 0 };

		// 0% has nothing to divide by: like a number, it is used as it is
		if (innerRadius instanceof Percent && innerRadius.value !== 0) {
			let value = innerRadius.value;
			let mr = Math.min(wr, hr);
			value = Math.max(mr * value, mr - Math.min(h, w)) / mr;
			innerBounds = $math.getArcBounds(0, 0, startAngle, endAngle, value);
			this.setPrivateRaw("irModifyer", value / innerRadius.value);
		}
		else {
			this.setPrivateRaw("irModifyer", 1);
		}

		bounds = $math.mergeBounds([bounds, innerBounds]);

		const prevRadius = this._maxRadius;
		this._maxRadius = Math.min(wr, hr);

		const radius = $utils.relativeToValue(this.get("radius", 0), this._maxRadius);
		this.seriesContainer.setAll({
			dy: -radius * (bounds.bottom + bounds.top) / 2, dx: -radius * (bounds.right + bounds.left) / 2
		})

		if (this.isDirty("startAngle") || this.isDirty("endAngle") || prevRadius != this._maxRadius) {
			this.series.each((series) => {
				series._markDirtyKey("startAngle");
			})
		}

		if(this.isDirty("innerRadius") || this.isDirty("radius")){
			this.series.each((series) => {
				series._markDirtyKey("innerRadius");
			})			
		}
	}

	/**
	 * Returns the outer radius in pixels, of the whole pie or of one series.
	 *
	 * @param   series  Series to get the radius of
	 * @return          Radius in pixels
	 */
	public radius(series?: PieSeries): number {

		let radius = $utils.relativeToValue(this.get("radius", 0), this._maxRadius);
		let innerRadius = $utils.relativeToValue(this.get("innerRadius", 0), radius);

		if (innerRadius < 0) {
			innerRadius = radius + innerRadius;
		}

		if (series) {
			let index = this.series.indexOf(series);
			let length = this.series.length;

			let seriesRadius = series.get("radius");
			if (seriesRadius != null) {
				return innerRadius + $utils.relativeToValue(seriesRadius, radius - innerRadius);
			}
			else {
				return innerRadius + (radius - innerRadius) / length * (index + 1);
			}
		}
		return radius;
	}

	/**
	 * Returns the inner radius in pixels, of the whole pie or of one series.
	 *
	 * @param   series  Series to get the inner radius of
	 * @return          Radius in pixels
	 */
	public innerRadius(series?: PieSeries): number {
		const radius = this.radius();
		let innerRadius = $utils.relativeToValue(this.get("innerRadius", 0), radius);

		if (innerRadius < 0) {
			innerRadius = radius + innerRadius;
		}

		if (series) {
			let index = this.series.indexOf(series);
			let length = this.series.length;

			let seriesInnerRadius = series.get("innerRadius");
			if (seriesInnerRadius != null) {
				return innerRadius + $utils.relativeToValue(seriesInnerRadius, radius - innerRadius);
			}
			else {
				return innerRadius + (radius - innerRadius) / length * index;
			}
		}
		return innerRadius;
	}

	public _updateSize() {
		super._updateSize();
		this.markDirtyKey("radius");
	}		
}
