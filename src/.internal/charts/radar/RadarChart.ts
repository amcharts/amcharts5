import type { AxisRendererCircular } from "./AxisRendererCircular";
import type { AxisRendererRadial } from "./AxisRendererRadial";
import type { Axis } from "../xy/axes/Axis";
import type { RadarCursor } from "./RadarCursor";
import type { RadarColumnSeries } from "./RadarColumnSeries";
import type { RadarLineSeries } from "./RadarLineSeries";
import { XYChart, IXYChartPrivate, IXYChartSettings } from "../xy/XYChart";
import type { Root } from "../../core/Root";
import { Percent, p50, percent } from "../../core/util/Percent";
import * as $utils from "../../core/util/Utils";
import { Container } from "../../core/render/Container";
import { Graphics } from "../../core/render/Graphics";
import { arc } from "d3-shape";
import type { IPoint } from "../../core/util/IPoint";
import type { Template } from "../../core/util/Template";
import * as $math from "../../core/util/Math";

export interface IRadarChartSettings extends IXYChartSettings {
	radius?: number | Percent;
	innerRadius?: number | Percent;
	startAngle?: number;
	endAngle?: number;
	cursor?: RadarCursor;
}

export interface IRadarChartPrivate extends IXYChartPrivate {

	/**
	 * Radius in pixels.
	 */
	radius?: number;

	/**
	 * Inner radius in pixels.
	 * @type {[type]}
	 */
	innerRadius?: number;

	/**
	 * @ignore
	 */
	irModifyer?: number;

}

export class RadarChart extends XYChart {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: RadarChart["_settings"], template?: Template<RadarChart>): RadarChart {
		const x = new RadarChart(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public readonly radarContainer = this.plotContainer.children.push(Container.new(this._root, { x: p50, y: p50 }));

	public static className: string = "RadarChart";
	public static classNames: Array<string> = XYChart.classNames.concat([RadarChart.className]);

	declare public _settings: IRadarChartSettings;
	declare public _privateSettings: IRadarChartPrivate;

	protected _arcGenerator = arc();
	declare public _seriesType: RadarColumnSeries | RadarLineSeries;

	protected _maxRadius: number = 1;

	protected _afterNew() {
		super._afterNew();
		const radarContainer = this.radarContainer;
		const gridContainer = this.gridContainer;
		const seriesContainer = this.seriesContainer;
		const bulletsContainer = this.bulletsContainer;

		radarContainer.children.pushAll([gridContainer, seriesContainer, bulletsContainer]);

		seriesContainer.set("mask", Graphics.new(this._root, {}));
		bulletsContainer.set("mask", Graphics.new(this._root, {}));
		gridContainer.set("mask", Graphics.new(this._root, {}));

		this._disposers.push(this.plotContainer.events.on("boundschanged", () => {
			this._updateRadius();
		}));
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

			this._maxRadius = Math.min(wr, hr);

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

		const innerRadius = $utils.relativeToValue(this.get("innerRadius", 0), radius);
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
		this._updateMask(this.bulletsContainer, innerRadius, radius);
		this._updateMask(this.gridContainer, innerRadius, radius);

		const cursor = this.get("cursor");
		if (cursor) {
			cursor.updateLayout();
		}
	}

	protected _updateMask(container: Container, innerRadius: number, radius: number) {
		const mask = container.get("mask");
		if (mask) {
			mask.set("draw", (display) => {
				this._arcGenerator.context(display as any);
				this._arcGenerator({ innerRadius: innerRadius, outerRadius: radius, startAngle: (this.get("startAngle", 0) + 90) * $math.RADIANS, endAngle: (this.get("endAngle", 0) + 90) * $math.RADIANS });
			})
		}
	}

	public processAxis(axis: Axis<AxisRendererRadial | AxisRendererCircular>) {
		this.radarContainer.children.push(axis);
	}

	public inPlot(point: IPoint): boolean {
		const radius = Math.hypot(point.x, point.y);

		if (radius <= this.getPrivate("radius", 0) + .5 && radius >= this.getPrivate("innerRadius", 0) - .5) {
			return true
		}
		return false;
	}
}
