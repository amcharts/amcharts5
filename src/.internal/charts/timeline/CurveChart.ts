import type { AxisRendererCurveX } from "./AxisRendererCurveX";
import type { AxisRendererCurveY } from "./AxisRendererCurveY";
import type { Axis } from "../xy/axes/Axis";
import type { XYSeries } from "../xy/series/XYSeries";
import type { CurveCursor } from "./CurveCursor";
import type { CurveColumnSeries } from "./CurveColumnSeries";
import type { IPoint } from "../../core/util/IPoint";

import { CurveDefaultTheme } from "./CurveDefaultTheme";
import { XYChart, IXYChartPrivate, IXYChartSettings } from "../xy/XYChart";
import { p50 } from "../../core/util/Percent";
import { Container } from "../../core/render/Container";
import { Graphics } from "../../core/render/Graphics";


export interface ICurveChartSettings extends IXYChartSettings {

	/**
	 * [[CurveCursor]] instance.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/timeline-chart/#Cursor} for more info
	 */
	cursor?: CurveCursor;

}

export interface ICurveChartPrivate extends IXYChartPrivate {

}

/**
 * Base chart for a Timeline chart.
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
export class CurveChart extends XYChart {

	/**
	 * [[Container]] where chart elements go.
	 *
	 * @default Container.new()
	 */
	public readonly curveContainer = this.plotContainer.children.push(Container.new(this._root, { x: p50, y: p50 }));

	public static className: string = "CurveChart";
	public static classNames: Array<string> = XYChart.classNames.concat([CurveChart.className]);

	declare public _settings: ICurveChartSettings;
	declare public _privateSettings: ICurveChartPrivate;

	declare public _seriesType: CurveColumnSeries;


	protected _afterNew() {
		this._defaultThemes.push(CurveDefaultTheme.new(this._root));

		super._afterNew();

		const curveContainer = this.curveContainer;
		const gridContainer = this.gridContainer;
		const topGridContainer = this.topGridContainer;
		const seriesContainer = this.seriesContainer;
		const bulletsContainer = this.bulletsContainer;

		curveContainer.children.pushAll([gridContainer, seriesContainer, topGridContainer, bulletsContainer]);

		seriesContainer.set("mask", Graphics.new(this._root, {}));
		gridContainer.set("mask", Graphics.new(this._root, {}));

		this._disposers.push(this.plotContainer.events.on("boundschanged", () => {
			this._updateMasks();
		}));
	}

	protected _maskGrid() {

	}


	protected _addCursor(cursor: CurveCursor) {
		this.curveContainer.children.push(cursor);
	}


	// do not delete
	public _updateMasks() {

		this.xAxes.each((axis) => {
			const renderer = axis.get("renderer") as AxisRendererCurveX;
			renderer._updateLayout();
		})

		this._updateMask(this.seriesContainer);
		this._updateMask(this.gridContainer);

		this.series.each((series) => {
			if ((series as XYSeries).get("maskBullets")) {
				this._updateMask(series.bulletsContainer);
			}
			else {
				series.bulletsContainer.set("mask", undefined);
			}
		})

		this.yAxes.each((axis) => {
			axis.markDirtySize();
		})		
	}

	/**
	 * @ignore
	 */
	public _updateMask(container: Container) {

		const mask = container.get("mask");
		if (mask) {
			const xAxis = this.xAxes.getIndex(0);
			const yAxis = this.yAxes.getIndex(0);
			if (xAxis && yAxis) {
				const renderer = xAxis.get("renderer") as AxisRendererCurveX;
				const points = renderer.getPoints(xAxis.get("start", 0), yAxis.get("start", 0), xAxis.get("end", 1), yAxis.get("end", 1));

				mask.set("draw", (display) => {
					display.moveTo(points[0].x, points[0].y);
					for (let i = 1; i < points.length; i++) {
						display.lineTo(points[i].x, points[i].y);
					}
					display.closePath();
				})

				xAxis.markDirtySize();
			}
		}
	}

	/**
	 * @ignore
	 */
	public processAxis(axis: Axis<AxisRendererCurveY | AxisRendererCurveX>) {
		this.curveContainer.children.unshift(axis);
	}

	/**
	 * @ignore
	 */
	public inPlot(_point: IPoint): boolean {		
		return true;
	}

	protected _tooltipToLocal(point: IPoint): IPoint {
		return this.curveContainer._display.toLocal(point);
	}

	protected _handlePinch() {

	}
}
