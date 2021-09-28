import { LineSeries, ILineSeriesSettings, ILineSeriesPrivate, ILineSeriesDataItem } from "./LineSeries";
import type { AxisRenderer } from "../axes/AxisRenderer";
import type { Axis } from "../axes/Axis";
import { Percent, p100 } from "../../../core/util/Percent";
import type { DataItem } from "../../../core/render/Component";
import { curveStepAfter } from "d3-shape";

export interface IStepLineSeriesDataItem extends ILineSeriesDataItem {
}

export interface IStepLineSeriesSettings extends ILineSeriesSettings {

	/**
	 * Width of the step in percent relative to the cell width.
	 *
	 * NOTE: setting this to less than 100% makes sense only when risers are
	 * disabled: `noRisers: true`
	 *
	 * @default 100%
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/step-line-series/#Step_width} for more info
	 */
	stepWidth?: Percent;

	/**
	 * Disables vertical connecting lines for the steps.
	 *
	 * @default false
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/step-line-series/#Disabling_risers} for more info
	 */
	noRisers?: boolean;

}

export interface IStepLineSeriesPrivate extends ILineSeriesPrivate {
}

export class StepLineSeries extends LineSeries {
	public static className: string = "StepLineSeries";
	public static classNames: Array<string> = LineSeries.classNames.concat([StepLineSeries.className]);

	declare public _settings: IStepLineSeriesSettings;
	declare public _privateSettings: IStepLineSeriesPrivate;
	declare public _dataItemSettings: IStepLineSeriesDataItem;

	protected _afterNew() {
		this._setDefault("curveFactory", curveStepAfter);
		super._afterNew();
	}


	protected _getPoints(dataItem: DataItem<this["_dataItemSettings"]>, o: { points: Array<Array<number>>, segments: number[][][], stacked: boolean | undefined, getOpen: boolean, basePosX: number, basePosY: number, fillVisible: boolean | undefined, xField: string, yField: string, xOpenField: string, yOpenField: string, vcx: number, vcy: number, baseAxis: Axis<AxisRenderer>, xAxis: Axis<AxisRenderer>, yAxis: Axis<AxisRenderer>, locationX: number, locationY: number, openLocationX: number, openLocationY: number }) {
		let points = o.points;

		let width = this.get("stepWidth", p100).value / 2;

		let itemLocationX0 = dataItem.get("locationX", o.locationX);
		let itemLocationY0 = dataItem.get("locationY", o.locationY);
		let itemLocationX1 = itemLocationX0;
		let itemLocationY1 = itemLocationY0;

		if (o.baseAxis === o.xAxis) {
			itemLocationX0 -= width;
			itemLocationX1 += width;
		}
		else if (o.baseAxis === o.yAxis) {
			itemLocationY0 -= width;
			itemLocationY1 += width;
		}

		let xPos0 = o.xAxis.getDataItemPositionX(dataItem, o.xField, itemLocationX0, o.vcx);
		let yPos0 = o.yAxis.getDataItemPositionY(dataItem, o.yField, itemLocationY0, o.vcy);

		let xPos1 = o.xAxis.getDataItemPositionX(dataItem, o.xField, itemLocationX1, o.vcx);
		let yPos1 = o.yAxis.getDataItemPositionY(dataItem, o.yField, itemLocationY1, o.vcy);

		if (this._shouldInclude(xPos0)) {

			const iPoint0 = this.getPoint(xPos0, yPos0);
			const point0 = [iPoint0.x, iPoint0.y];

			const iPoint1 = this.getPoint(xPos1, yPos1);
			const point1 = [iPoint1.x, iPoint1.y];

			if (o.fillVisible) {
				let xOpenPos0: number = xPos0;
				let yOpenPos0: number = yPos0;
				let xOpenPos1: number = xPos1;
				let yOpenPos1: number = yPos1;

				if (o.baseAxis === o.xAxis) {
					yOpenPos0 = o.basePosY;
					yOpenPos1 = o.basePosY;
				}
				else if (o.baseAxis === o.yAxis) {
					xOpenPos0 = o.basePosX;
					xOpenPos1 = o.basePosX;
				}

				if (o.getOpen) {
					let valueX = dataItem.get(o.xOpenField as any);
					let valueY = dataItem.get(o.yOpenField as any);

					if (valueX != null && valueY != null) {
						itemLocationX0 = dataItem.get("openLocationX", o.openLocationX);
						itemLocationY0 = dataItem.get("openLocationY", o.openLocationY);

						itemLocationX1 = itemLocationX0;
						itemLocationY1 = itemLocationY0;

						if (o.baseAxis === o.xAxis) {
							itemLocationX0 -= width;
							itemLocationX1 += width;
						}
						else if (o.baseAxis === o.yAxis) {
							itemLocationY0 -= width;
							itemLocationY1 += width;
						}

						if (o.stacked) {
							let stackToItemX = dataItem.get("stackToItemX")!;
							let stackToItemY = dataItem.get("stackToItemY")!;

							if (stackToItemX) {
								xOpenPos0 = o.xAxis.getDataItemPositionX(stackToItemX, o.xField, itemLocationX0, (stackToItemX.component as StepLineSeries).get("vcx"));
								xOpenPos1 = o.xAxis.getDataItemPositionX(stackToItemX, o.xField, itemLocationX1, (stackToItemX.component as StepLineSeries).get("vcx"));
							}
							else {
								if (o.yAxis === o.baseAxis) {
									xOpenPos0 = o.basePosX;
									xOpenPos1 = o.basePosX;
								}
								else if (o.baseAxis === o.yAxis) {
									xOpenPos0 = o.xAxis.getDataItemPositionX(dataItem, o.xOpenField, itemLocationX0, o.vcx);
									xOpenPos1 = o.xAxis.getDataItemPositionX(dataItem, o.xOpenField, itemLocationX1, o.vcx);
								}
							}

							if (stackToItemY) {
								yOpenPos0 = o.yAxis.getDataItemPositionY(stackToItemY, o.yField, itemLocationY0, (stackToItemY.component as StepLineSeries).get("vcy"));
								yOpenPos1 = o.yAxis.getDataItemPositionY(stackToItemY, o.yField, itemLocationY1, (stackToItemY.component as StepLineSeries).get("vcy"));
							}
							else {
								if (o.xAxis === o.baseAxis) {
									yOpenPos0 = o.basePosY;
									yOpenPos1 = o.basePosY;
								}
								else if (o.baseAxis === o.yAxis) {
									yOpenPos0 = o.yAxis.getDataItemPositionY(dataItem, o.yOpenField, itemLocationY0, o.vcy);
									yOpenPos1 = o.yAxis.getDataItemPositionY(dataItem, o.yOpenField, itemLocationY1, o.vcy);
								}
							}
						}
						else {
							xOpenPos0 = o.xAxis.getDataItemPositionX(dataItem, o.xOpenField, itemLocationX0, o.vcx);
							yOpenPos0 = o.yAxis.getDataItemPositionY(dataItem, o.yOpenField, itemLocationY0, o.vcy);
							xOpenPos1 = o.xAxis.getDataItemPositionX(dataItem, o.xOpenField, itemLocationX1, o.vcx);
							yOpenPos1 = o.yAxis.getDataItemPositionY(dataItem, o.yOpenField, itemLocationY1, o.vcy);
						}
					}
				}

				let closeIPoint0 = this.getPoint(xOpenPos0, yOpenPos0);
				let closeIPoint1 = this.getPoint(xOpenPos1, yOpenPos1);

				point0[2] = closeIPoint0.x;
				point0[3] = closeIPoint0.y;

				point1[2] = closeIPoint1.x;
				point1[3] = closeIPoint1.y;
			}

			points.push(point0);
			points.push(point1);

			dataItem.set("point", {x:point0[0] + (point1[0] - point0[0]) / 2, y:point0[1] + (point1[1] - point0[1]) / 2 });
		}

		if (this.get("noRisers")) {
			o.points = [];
			o.segments.push(points);
		}
	}
}
