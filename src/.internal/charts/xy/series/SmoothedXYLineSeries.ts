import { LineSeries, ILineSeriesSettings, ILineSeriesPrivate, ILineSeriesDataItem } from "./LineSeries";
import { curveCardinal, CurveCardinalFactory } from "d3-shape";

export interface SmoothedXYLineSeriesDataItem extends ILineSeriesDataItem {

}

export interface ISmoothedXYLineSeriesDataItem extends ILineSeriesDataItem {

}

export interface SmoothedXYLineSeriesProperties extends ILineSeriesSettings {

	/**
	 * A tension force for the smoothing (0-1). The smaller the value the more
	 * curvy the line will be.
	 *
	 * @default 0.5
	 */
	tension?: number;

	/**
	 * @ignore
	*/
	curveFactory?: CurveCardinalFactory

}

export interface SmoothedXYLineSeriesPrivate extends ILineSeriesPrivate {
}

/**
 * Smoothed line series suitable for XY (scatter) charts
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/smoothed-series/} for more info
 */
export class SmoothedXYLineSeries extends LineSeries {
	public static className: string = "SmoothedXYLineSeries";
	public static classNames: Array<string> = LineSeries.classNames.concat([SmoothedXYLineSeries.className]);

	declare public _settings: SmoothedXYLineSeriesProperties;
	declare public _privateSettings: SmoothedXYLineSeriesPrivate;
	declare public _dataItemSettings: SmoothedXYLineSeriesDataItem;

	protected _afterNew() {
		this._setDefault("curveFactory", curveCardinal.tension(this.get("tension", 0.5)));
		super._afterNew();
	}

	public _updateChildren() {
		if (this.isDirty("tension")) {
			this.set("curveFactory", curveCardinal.tension(this.get("tension", 0.5)) as any);
			this._valuesDirty = true;
		}

		super._updateChildren();
	}
}
