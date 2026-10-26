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
	 * The chart's cursor, a [[CurveCursor]].
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/timeline/#cursor} for more info
	 */
	cursor?: CurveCursor;

}

export interface ICurveChartPrivate extends IXYChartPrivate {

}

/**
 * A timeline chart along any curve: the X axis runs along the `points` of
 * its [[AxisRendererCurveX]], and the Y axis across it. Also the base of
 * [[SerpentineChart]] and [[SpiralChart]].
 *
 * It is experimental and does not support everything an [[XYChart]] does.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/timeline/} for more info
 * @since 5.12.0
 * @important
 */
export class CurveChart extends XYChart {

	/**
	 * Container at the center of the plot area with the axes, grid, series,
	 * bullets and cursor.
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

		// an axis added later has no curve to lay itself along until the masks are
		// rebuilt, which otherwise only happens on a resize
		const axisAdded = () => {
			if (!this.isDisposed()) {
				this._updateMasks();
			}
		};

		this._disposers.push(this.xAxes.events.onAll(axisAdded));
		this._disposers.push(this.yAxes.events.onAll(axisAdded));
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
				series.bulletsContainer._setC("mask", undefined);
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
