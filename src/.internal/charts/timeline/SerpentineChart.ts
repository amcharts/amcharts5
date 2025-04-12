import { CurveChart, ICurveChartPrivate, ICurveChartSettings } from "./CurveChart";
import { p50, Percent } from "../../core/util/Percent";

import type { CurveColumnSeries } from "./CurveColumnSeries";
import type { AxisRendererCurveY } from "./AxisRendererCurveY";
import type { IPoint } from "../../core/util/IPoint";
import type { AxisRendererCurveX } from "./AxisRendererCurveX";

import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";


export interface ISerpentineChartSettings extends ICurveChartSettings {

	/**
	 * Orientation of the serpatine.
	 *
	 * @default "vertical"
	 */
	orientation?: "horizontal" | "vertical";

	/**
	 * Number of levels in the chart.
	 *
	 * @default 3
	 */
	levelCount?: number;

	/**
	 * Radius of the Y-axis in `Percent`.
	 *
	 * @default 50%
	 */
	yAxisRadius?: Percent;

	/**
	 * Relative location (0-1) of the start postion.
	 *
	 * @defult 0
	 */
	startLocation?: number;

	/**
	 * Relative location (0-1) of the end position.
	 *
	 * @defult 1
	 */
	endLocation?: number;

}

export interface ISerpentineChartPrivate extends ICurveChartPrivate {
}

/**
 * A Serpentine chart.
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
export class SerpentineChart extends CurveChart {

	public static className: string = "SerpentineChart";
	public static classNames: Array<string> = CurveChart.classNames.concat([SerpentineChart.className]);

	declare public _settings: ISerpentineChartSettings;
	declare public _privateSettings: ISerpentineChartPrivate;

	declare public _seriesType: CurveColumnSeries;


	public _prepareChildren(): void {
		super._prepareChildren();

		if (this.isDirty("levelCount") || this.isDirty("orientation")) {
			this._updateMasks();
		}
	}

	public _updateMasks(): void {
		const levelCount = this.get("levelCount", 1) - 1;

		let w = this.plotContainer.innerWidth();
		let h = this.plotContainer.innerHeight();

		let points: IPoint[] = [];
		let radius: number;

		if (this.get("orientation") == "vertical") {

			radius = Math.min(h / (levelCount + 1) / 2, w / 2);
			h = Math.min(radius * (levelCount + 1) * 2, h);

			const startLocation = this.get("startLocation", 0);
			const endLocation = this.get("endLocation", 1);

			for (let i = 0; i <= levelCount; i++) {
				if (i % 2 === 0) {
					if (i === 0) {
						points.push({ x: -w / 2 + (w - radius * 2) * startLocation, y: -h / 2 + h / (levelCount + 1) * i })
					}
					else {
						points.push({ x: -w / 2 + radius, y: -h / 2 + h / (levelCount + 1) * i })
					}

					if (i === levelCount) {
						points.push({ x: w / 2 - radius - (w - radius * 2) * (1 - endLocation), y: -h / 2 + h / (levelCount + 1) * i })
					}
					else {
						points.push({ x: w / 2 - 2 * radius, y: -h / 2 + h / (levelCount + 1) * i })
					}

					let centerPoint = { x: w / 2 - 2 * radius, y: -h / 2 + h / (levelCount + 1) * (i + 0.5) }
					if (i < levelCount) {
						for (let i = 1; i < 50; i++) {
							let angle = -90 + i / 50 * 180;
							points.push({ x: centerPoint.x + radius * $math.cos(angle), y: centerPoint.y + radius * $math.sin(angle) });
						}
					}
				}
				else {
					points.push({ x: w / 2 - 2 * radius, y: -h / 2 + h / (levelCount + 1) * i })

					if (i === levelCount) {
						points.push({ x: -w / 2 + (w - radius * 2) * (1 - endLocation), y: -h / 2 + h / (levelCount + 1) * i })
					}
					else {
						points.push({ x: -w / 2 + radius, y: -h / 2 + h / (levelCount + 1) * i })
					}

					let centerPoint = { x: -w / 2 + radius, y: -h / 2 + h / (levelCount + 1) * (i + 0.5) }

					if (i < levelCount) {
						for (let i = 1; i < 50; i++) {
							let angle = -90 - i / 50 * 180;
							points.push({ x: centerPoint.x + radius * $math.cos(angle), y: centerPoint.y + radius * $math.sin(angle) });
						}
					}
				}
			}
		}
		else {
			radius = Math.min(w / (levelCount + 1) / 2, h / 2);
			w = Math.min(radius * (levelCount + 1) * 2, w);

			const startLocation = this.get("startLocation", 0);
			const endLocation = this.get("endLocation", 1);

			for (let i = 0; i <= levelCount; i++) {
				if (i % 2 === 0) {
					if (i === 0) {
						points.push({ y: -h / 2 + (h - radius * 2) * startLocation, x: -w / 2 + w / (levelCount + 1) * i })
					}
					else {
						points.push({ y: -h / 2 + radius, x: -w / 2 + w / (levelCount + 1) * i })
					}

					if (i === levelCount) {
						points.push({ y: h / 2 - radius - (h - radius * 2) * (1 - endLocation), x: -w / 2 + w / (levelCount + 1) * i })
					}
					else {
						points.push({ y: h / 2 - 2 * radius, x: -w / 2 + w / (levelCount + 1) * i })
					}

					let centerPoint = { y: h / 2 - 2 * radius, x: -w / 2 + w / (levelCount + 1) * (i + 0.5) }
					if (i < levelCount) {
						for (let i = 1; i < 50; i++) {
							let angle = -90 + i / 50 * 180;
							points.push({ y: centerPoint.y + radius * $math.cos(angle), x: centerPoint.x + radius * $math.sin(angle) });
						}
					}
				}
				else {
					points.push({ y: h / 2 - 2 * radius, x: -w / 2 + w / (levelCount + 1) * i })

					if (i === levelCount) {
						points.push({ y: -h / 2 + (h - radius * 2) * (1 - endLocation), x: -w / 2 + w / (levelCount + 1) * i })
					}
					else {
						points.push({ y: -h / 2 + radius, x: -w / 2 + w / (levelCount + 1) * i })
					}

					let centerPoint = { y: -h / 2 + radius, x: -w / 2 + w / (levelCount + 1) * (i + 0.5) }

					if (i < levelCount) {
						for (let i = 1; i < 50; i++) {
							let angle = -90 - i / 50 * 180;
							points.push({ y: centerPoint.y + radius * $math.cos(angle), x: centerPoint.x + radius * $math.sin(angle) });
						}
					}
				}
			}
		}


		this.yAxes.each((axis) => {
			const renderer = axis.get("renderer") as AxisRendererCurveY;
			renderer.set("axisLength", $utils.relativeToValue(this.get("yAxisRadius", p50), 2 * radius));
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
