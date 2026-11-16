import type { PieSeries } from "./PieSeries";
import type { IBounds } from "../../core/util/IBounds";

import { Percent } from "../../core/util/Percent";
import { PercentChart, IPercentChartPrivate, IPercentChartSettings } from "../percent/PercentChart";
import { p50 } from "../../core/util/Percent";

import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";
import * as $object from "../../core/util/Object";


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

	// What series with `autoLabels` ask of the pie, by series uid: the most its radius may be, and a move sideways
	protected _fits: { [uid: number]: { radius: number, dx: number } } = {};

	/**
	 * Caps the pie's radius and moves it sideways for a series' labels, or
	 * gives both back with no radius.
	 *
	 * @ignore
	 */
	public _fitPie(series: PieSeries, radius?: number, dx: number = 0) {
		const fits = this._fits;
		const before = fits[series.uid];
		if (radius == null) {
			if (!before) {
				return;
			}
			delete fits[series.uid];
		}
		else {
			// half a pixel either way is no change, so the pie settles
			if (before && Math.abs(before.radius - radius) < 0.5 && Math.abs(before.dx - dx) < 0.5) {
				return;
			}
			fits[series.uid] = { radius: radius, dx: dx };
		}
		this.markDirtyKey("radius");
	}

	/**
	 * The radius from the `radius` setting, before any cap.
	 *
	 * @ignore
	 */
	public _fullRadius(): number {
		return $utils.relativeToValue(this.get("radius", 0), this._maxRadius);
	}

	/**
	 * The box the pie's arc covers around its center, for a radius of 1: the
	 * pie is moved so that this box is centered.
	 *
	 * @ignore
	 */
	public _arcBounds: IBounds = { left: -1, right: 1, top: -1, bottom: 1 };

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
		this._arcBounds = bounds;

		const prevRadius = this._maxRadius;
		this._maxRadius = Math.min(wr, hr);

		const radius = this.radius();
		// the first series that moves the pie, in series order
		let shift = 0;
		this.series.each((series) => {
			const fit = this._fits[series.uid];
			if (fit && !shift) {
				shift = fit.dx;
			}
		});
		this.seriesContainer.setAll({
			dy: -radius * (bounds.bottom + bounds.top) / 2, dx: -radius * (bounds.right + bounds.left) / 2 + shift
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

		let radius = this._fullRadius();
		$object.each(this._fits, (_uid, fit) => {
			radius = Math.min(radius, fit.radius);
		});
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
