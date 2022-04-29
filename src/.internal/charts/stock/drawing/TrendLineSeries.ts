import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";

export interface ITrendLineSeriesDataItem extends ISimpleLineSeriesDataItem {
}

export interface ITrendLineSeriesSettings extends ISimpleLineSeriesSettings {
	/**
	 * @todo review
	 */	
	field: "open" | "value" | "low" | "high";
}

export interface ITrendLineSeriesPrivate extends ISimpleLineSeriesPrivate {
}

export class TrendLineSeries extends SimpleLineSeries {
	public static className: string = "TrendLineSeries";
	public static classNames: Array<string> = SimpleLineSeries.classNames.concat([TrendLineSeries.className]);

	declare public _settings: ITrendLineSeriesSettings;
	declare public _privateSettings: ITrendLineSeriesPrivate;
	declare public _dataItemSettings: ITrendLineSeriesDataItem;

	protected _tag = "trendline";

	protected _updateSegment(index: number) {
		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];

		const series = this.get("series");
		if (series) {

			const xAxis = this.get("xAxis");

			let x1 = this._getXValue(diP1.get("valueX" as any));
			let x2 = this._getXValue(diP2.get("valueX" as any));

			const di1 = xAxis.getSeriesItem(series, Math.max(0, xAxis.valueToPosition(x1)));
			const di2 = xAxis.getSeriesItem(series, Math.min(1, xAxis.valueToPosition(x2)));

			const field = this.get("field") + "Y";

			if (di1 && di2) {
				let y1 = di1.get(field as any);
				let y2 = di2.get(field as any);

				diP1.set("valueY", y1);
				diP1.set("valueYWorking", y1);

				diP2.set("valueY", y2);
				diP2.set("valueYWorking", y2);

				diP1.set("valueX", x1);
				diP2.set("valueX", x2);

				this._positionBullets(diP1);
				this._positionBullets(diP2);
			}
		}
	}

	// need to override so that location would not be set
	protected _setXLocation() {

	}
}