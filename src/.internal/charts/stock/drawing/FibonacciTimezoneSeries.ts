import type { DataItem } from "../../../core/render/Component";

import { FibonacciSeries, IFibonacciSeriesSettings, IFibonacciSeriesPrivate, IFibonacciSeriesDataItem } from "./FibonacciSeries";

export interface IFibonacciTimezoneSeriesDataItem extends IFibonacciSeriesDataItem {

}

export interface IFibonacciTimezoneSeriesSettings extends IFibonacciSeriesSettings {
	
}

export interface IFibonacciTimezoneSeriesPrivate extends IFibonacciSeriesPrivate {

}


export class FibonacciTimezoneSeries extends FibonacciSeries {
	public static className: string = "FibonacciTimezoneSeries";
	public static classNames: Array<string> = FibonacciSeries.classNames.concat([FibonacciTimezoneSeries.className]);

	declare public _settings: IFibonacciTimezoneSeriesSettings;
	declare public _privateSettings: IFibonacciTimezoneSeriesPrivate;
	declare public _dataItemSettings: IFibonacciTimezoneSeriesDataItem;

	protected _tag = "fibonaccitimezone";

	protected _updateSegmentReal(index: number) {
		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];

		const valueY1 = diP1.get("valueY", 0);

		diP2.set("valueY", valueY1)
		diP2.set("valueYWorking", valueY1)

		diP1.setRaw("locationX", 0)
		diP2.setRaw("locationX", 0)
	}

	protected _setXLocation(dataItem: DataItem<this["_dataItemSettings"]>, value: number) {
		this._setXLocationReal(dataItem, value);
	}

	public _updateChildrenReal() {
		const chart = this.chart;

		if (chart) {
			for (let i = 0; i < this._lines.length; i++) {
				const line = this._lines[i];
				if (line) {
					const diP1 = this._di[i]["p1"];
					const diP2 = this._di[i]["p2"];

					const p1 = diP1.get("point");
					const p2 = diP2.get("point");

					const open1 = diP1["open"];
					const open2 = diP2["open"];

					const xAxis = this.get("xAxis");

					if (open1 && open2) {
						const valueX1 = open1["valueX"]
						const valueX2 = open2["valueX"]
						const diff = valueX2 - valueX1;

						if (p1 && p2) {
							const sequence = this.get("sequence", []);
							const labels = this._labels[i];
							const fills = this._fills[i];
							const strokes = this._strokes[i];

							for (let i = 0; i < sequence.length; i++) {
								const value = sequence[i];
								const label = labels[i];
								const fill = fills[i];
								const stroke = strokes[i];

								this.mainContainer.children.moveValue(fill, 0);

								const endValue = valueX1 + diff * value;
								const x1 = p1.x;
								const x2 = xAxis.get("renderer").positionToCoordinate(xAxis.valueToPosition(endValue));

								const y1 = 0;
								const y2 = chart.plotContainer.height();

								fill.setPrivate("visible", true);
								stroke.setPrivate("visible", true);

								fill.set("draw", (display) => {
									display.moveTo(x1, y1);
									display.lineTo(x2, y1);
									display.lineTo(x2, y2);
									display.lineTo(x1, y2);
									display.lineTo(x1, y1);
								})

								stroke.set("draw", (display) => {
									display.moveTo(x2, y1);
									display.lineTo(x2, y2);
								})

								const dataItem = label.dataItem;
								if (dataItem) {
									dataItem.set("value" as any, value);
								}

								label.setAll({ x: x2, y: y2 });
								label.text.markDirtyText();
							}
						}
					}
				}
			}
		}
	}
}