import type { PieSeries } from "./PieSeries";

import { Percent } from "../../core/util/Percent";
import { PercentChart, IPercentChartPrivate, IPercentChartSettings } from "../percent/PercentChart";
import { p50 } from "../../core/util/Percent";

import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";


export interface IPieChartSettings extends IPercentChartSettings {

	/**
	 * Outer radius of the pie chart.
	 *
	 * Can be set in fixed pixel value, or relative to chart container size in
	 * percent.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/#Pie_radius} for more info
	 * @default 80%
	 */
	radius?: number | Percent;

	/**
	 * Inner radius of the pie chart. Setting to any non-zero value will result
	 * in a donut chart.
	 *
	 * Can be set in fixed pixel value, or relative to chart container size in
	 * percent.
	 *
	 * Setting to negative number will mean pixels from outer radius.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/#Pie_radius} for more info
	 */
	innerRadius?: number | Percent;

	/**
	 * A start angle of the chart in degrees.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/#Start_end_angles} for more info
	 * @default -90
	 */
	startAngle?: number;

	/**
	 * An end angle of the chart in degrees.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/#Start_end_angles} for more info
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
 * Creates a pie chart.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/} for more info
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

		if (innerRadius instanceof Percent) {
			let value = innerRadius.value;
			let mr = Math.min(wr, hr);
			value = Math.max(mr * value, mr - Math.min(h, w)) / mr;
			innerBounds = $math.getArcBounds(0, 0, startAngle, endAngle, value);
			this.setPrivateRaw("irModifyer", value / innerRadius.value);
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
	 * Returns outer radius in pixels.
	 *
	 * If optional series parameter is passed in, it will return outer radius
	 * of that particular series.
	 *
	 * @param   series  Series
	 * @return          Radius in pixels
	 */
	public radius(series?: PieSeries): number {

		let radius = $utils.relativeToValue(this.get("radius", 0), this._maxRadius);
		let innerRadius = $utils.relativeToValue(this.get("innerRadius", 0), radius);

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
	 * Returns inner radius in pixels.
	 *
	 * If optional series parameter is passed in, it will return inner radius
	 * of that particular series.
	 *
	 * @param   series  Series
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
