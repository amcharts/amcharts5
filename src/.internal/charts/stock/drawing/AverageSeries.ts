import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";
import * as $math from "../../../core/util/Math";

export interface IAverageSeriesDataItem extends ISimpleLineSeriesDataItem {

}

export interface IAverageSeriesSettings extends ISimpleLineSeriesSettings {
	/**
	 * @todo review
	 */	
	field: "open" | "value" | "low" | "high";
}

export interface IAverageSeriesPrivate extends ISimpleLineSeriesPrivate {

}

export class AverageSeries extends SimpleLineSeries {
	public static className: string = "AverageSeries";
	public static classNames: Array<string> = SimpleLineSeries.classNames.concat([AverageSeries.className]);

	declare public _settings: IAverageSeriesSettings;
	declare public _privateSettings: IAverageSeriesPrivate;
	declare public _dataItemSettings: IAverageSeriesDataItem;

	protected _tag = "average";

	protected _updateSegment(index: number) {
		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];

		const series = this.get("series");
		if (series) {

			const xAxis = this.get("xAxis");

			const min = xAxis.getPrivate("min", 0) + 1;
			const max = xAxis.getPrivate("max", 1) - 1;

			let x1 = $math.fitToRange(diP1.get("valueX" as any), min, max);
			let x2 = $math.fitToRange(diP2.get("valueX" as any), min, max);

			const di1 = xAxis.getSeriesItem(series, Math.max(0, xAxis.valueToPosition(x1)));
			const di2 = xAxis.getSeriesItem(series, Math.min(1, xAxis.valueToPosition(x2)));

			const field = this.get("field") + "Y";

			if (di1 && di2) {
				let i1 = series.dataItems.indexOf(di1);
				let i2 = series.dataItems.indexOf(di2);

				if (i1 > i2) {
					[i1, i2] = [i2, i1];
				}

				let sum = 0;
				let count = 0;

				for (var i = i1; i <= i2; i++) {
					const di = series.dataItems[i];
					const value = di.get(field as any);
					if (value != null) {
						sum += value;
						count++;
					}
				}

				const average = sum / count;

				diP1.set("valueX", x1);
				diP2.set("valueX", x2);

				diP1.set("valueY", average);
				diP1.set("valueYWorking", average);

				diP2.set("valueY", average);
				diP2.set("valueYWorking", average);

				this._positionBullets(diP1);
				this._positionBullets(diP2);
			}
		}
	}

	// need to override so that location would not be set
	protected _setXLocation() {

	}
}