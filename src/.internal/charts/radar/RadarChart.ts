import type { AxisRendererCircular } from "./AxisRendererCircular";
import type { AxisRendererRadial } from "./AxisRendererRadial";
import type { Axis } from "../xy/axes/Axis";
import type { XYSeries } from "../xy/series/XYSeries";
import type { RadarCursor } from "./RadarCursor";
import type { RadarColumnSeries } from "./RadarColumnSeries";
import type { RadarLineSeries } from "./RadarLineSeries";
import type { IPoint } from "../../core/util/IPoint";

import { RadarDefaultTheme } from "./RadarDefaultTheme";
import { XYChart, IXYChartPrivate, IXYChartSettings } from "../xy/XYChart";
import { Percent, p50, percent } from "../../core/util/Percent";
import { Container } from "../../core/render/Container";
import { Graphics } from "../../core/render/Graphics";
import { arc } from "d3-shape";

import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";

export interface IRadarChartSettings extends IXYChartSettings {

	/**
	 * Outer radius of the chart. Can be set in pixels or percent, relative to
	 * available space.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/#Chart_radius} for more info
	 * @default 80%
	 */
	radius?: number | Percent;

	/**
	 * Inner radius of the chart. Can be set in pixels or percent, relative to
	 * outer radius.
	 *
	 * Setting to negative number will mean pixels from outer radius.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/#Chart_radius} for more info
	 */
	innerRadius?: number | Percent;

	/**
	 * Chart start angle in degress.
	 *
	 * @default -90
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/#Start_end_angles} for more info
	 */
	startAngle?: number;

	/**
	 * Chart end angle in degress.
	 *
	 * @default 270
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/#Start_end_angles} for more info
	 */
	endAngle?: number;

	/**
	 * [[RadarCursor]] instance.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/#Cursor} for more info
	 */
	cursor?: RadarCursor;

}

export interface IRadarChartPrivate extends IXYChartPrivate {

	/**
	 * Radius in pixels.
	 */
	radius?: number;

	/**
	 * Inner radius in pixels.
	 */
	innerRadius?: number;

	/**
	 * @ignore
	 */
	irModifyer?: number;

}

/**
 * Radar chart.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/} for more info
 * @important
 */
export class RadarChart extends XYChart {

	/**
	 * [[Container]] where radar-related elements go.
	 *
	 * @default Container.new()
	 */
	public readonly radarContainer = this.plotContainer.children.push(Container.new(this._root, { x: p50, y: p50 }));

	public static className: string = "RadarChart";
	public static classNames: Array<string> = XYChart.classNames.concat([RadarChart.className]);

	declare public _settings: IRadarChartSettings;
	declare public _privateSettings: IRadarChartPrivate;

	protected _arcGenerator = arc();
	declare public _seriesType: RadarColumnSeries | RadarLineSeries;

	protected _maxRadius: number = 1;

	protected _afterNew() {
		this._defaultThemes.push(RadarDefaultTheme.new(this._root));

		super._afterNew();

		const radarContainer = this.radarContainer;
		const gridContainer = this.gridContainer;
		const topGridContainer = this.topGridContainer;
		const seriesContainer = this.seriesContainer;
		const bulletsContainer = this.bulletsContainer;

		radarContainer.children.pushAll([gridContainer, seriesContainer, topGridContainer, bulletsContainer]);

		seriesContainer.set("mask", Graphics.new(this._root, {}));
		gridContainer.set("mask", Graphics.new(this._root, {}));

		this._disposers.push(this.plotContainer.events.on("boundschanged", () => {
			this._updateRadius();
		}));
	}

	protected _maskGrid(){
		
	}


	public _prepareChildren() {
		super._prepareChildren();

		if (this._sizeDirty || this.isDirty("radius") || this.isDirty("innerRadius") || this.isDirty("startAngle") || this.isDirty("endAngle")) {

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

			this._maxRadius = Math.max(0, Math.min(wr, hr));

			const radius = $utils.relativeToValue(this.get("radius", 0), this._maxRadius);
			this.radarContainer.setAll({
				dy: -radius * (bounds.bottom + bounds.top) / 2, dx: -radius * (bounds.right + bounds.left) / 2
			})

			this._updateRadius();
		}
	}

	protected _addCursor(cursor: RadarCursor) {
		this.radarContainer.children.push(cursor);
	}


	// do not delete
	public _updateRadius() {
		const radius = $utils.relativeToValue(this.get("radius", percent(80)), this._maxRadius);
		this.setPrivateRaw("radius", radius);

		let innerRadius = $utils.relativeToValue(this.get("innerRadius", 0), radius);

		if (innerRadius < 0) {
			innerRadius = radius + innerRadius;
		}

		this.setPrivateRaw("innerRadius", innerRadius);

		this.xAxes.each((axis) => {
			const renderer = axis.get("renderer") as AxisRendererCircular;
			renderer.updateLayout();
		})

		this.yAxes.each((axis) => {
			const renderer = axis.get("renderer") as AxisRendererRadial;
			renderer.updateLayout();
		})

		this._updateMask(this.seriesContainer, innerRadius, radius);
		this._updateMask(this.gridContainer, innerRadius, radius);

		this.series.each((series) => {
			if ((series as XYSeries).get("maskBullets")) {
				this._updateMask(series.bulletsContainer, innerRadius, radius);
			}
			else {
				series.bulletsContainer.remove("mask");
			}
		})

		const cursor = this.get("cursor");
		if (cursor) {
			cursor.updateLayout();
		}
	}

	/**
	 * @ignore
	 */
	public _updateMask(container: Container, innerRadius: number, radius: number) {
		const mask = container.get("mask");
		if (mask) {
			mask.set("draw", (display) => {
				this._arcGenerator.context(display as any);
				this._arcGenerator({ innerRadius: innerRadius, outerRadius: radius + .5, startAngle: (this.get("startAngle", 0) + 90) * $math.RADIANS, endAngle: (this.get("endAngle", 0) + 90) * $math.RADIANS });
			})
		}
	}

	/**
	 * @ignore
	 */
	public processAxis(axis: Axis<AxisRendererRadial | AxisRendererCircular>) {
		this.radarContainer.children.push(axis);
	}

	/**
	 * @ignore
	 */
	public inPlot(point: IPoint, radius?: number, innerRadius?: number): boolean {
		const r = Math.hypot(point.x, point.y);
		const angle = $math.normalizeAngle(Math.atan2(point.y, point.x) * $math.DEGREES);

		let startAngle = $math.normalizeAngle(this.get("startAngle", 0));
		let endAngle = $math.normalizeAngle(this.get("endAngle", 0));

		let inArc = false;
		if (startAngle < endAngle) {
			if (startAngle < angle && angle < endAngle) {
				inArc = true;
			}
		}

		if (startAngle > endAngle) {
			if (angle > startAngle) {
				inArc = true;
			}
			if (angle < endAngle) {
				inArc = true;
			}
		}

		if (startAngle == endAngle) {
			inArc = true;
		}

		if (!inArc) {
			return false;
		}

		if (radius == null) {
			radius = this.getPrivate("radius", 0);
		}

		if (innerRadius == null) {
			innerRadius = this.getPrivate("innerRadius", 0);
		}

		if (innerRadius > radius) {
			[innerRadius, radius] = [radius, innerRadius];
		}

		if (r <= radius + .5 && r >= innerRadius - .5) {
			return true;
		}
		return false;
	}

	protected _tooltipToLocal(point: IPoint): IPoint {
		return this.radarContainer._display.toLocal(point);
	}

	protected _handlePinch(){
		
	}
}
