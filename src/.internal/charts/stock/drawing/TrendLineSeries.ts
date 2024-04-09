import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";

export interface ITrendLineSeriesDataItem extends ISimpleLineSeriesDataItem {
}

export interface ITrendLineSeriesSettings extends ISimpleLineSeriesSettings {
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

	protected _afterNew() {
		super._afterNew();
		this.setPrivate("allowChangeSnap", false);
		this.set("snapToData", true);
	}

	protected _updateSegment(index: number) {
		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];

		const series = this.get("series");
		if (series && diP1 && diP2) {

			const xAxis = this.get("xAxis");

			let x1 = this._getXValue(diP1.get("valueX" as any));
			let x2 = this._getXValue(diP2.get("valueX" as any));

			const di1 = xAxis.getSeriesItem(series, Math.max(0, xAxis.valueToPosition(x1)));
			const di2 = xAxis.getSeriesItem(series, Math.min(1, xAxis.valueToPosition(x2)));

			const field = this.get("field") + "Y";

			if (di1 && di2) {
				let y1 = di1.get(field as any);
				let y2 = di2.get(field as any);

				this._setContext(diP1, "valueY", y1, true);
				this._setContext(diP2, "valueY", y2, true);

				this._setContext(diP1, "valueX", x1);
				this._setContext(diP2, "valueX", x2);

				this._positionBullets(diP1);
				this._positionBullets(diP2);
			}
		}
	}
}