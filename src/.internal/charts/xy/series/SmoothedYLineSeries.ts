import { LineSeries, ILineSeriesSettings, ILineSeriesPrivate, ILineSeriesDataItem } from "./LineSeries";
import { curveMonotoneYTension } from "../../../core/render/MonotoneYTension";

export interface ISmoothedYLineSeriesDataItem extends ILineSeriesDataItem {
}

export interface ISmoothedYLineSeriesSettings extends ILineSeriesSettings {

	/**
	 * How tight the curve is, from `0` to `1`: `1` draws straight lines, a
	 * smaller value a rounder curve.
	 *
	 * @default 0.5
	 */
	tension?: number;

}

export interface ISmoothedYLineSeriesPrivate extends ILineSeriesPrivate {
}

/**
 * A line series drawn as a smooth curve, for data that runs along the Y
 * axis.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/series/smoothed-series/} for more info
 */
export class SmoothedYLineSeries extends LineSeries {
	public static className: string = "SmoothedYLineSeries";
	public static classNames: Array<string> = LineSeries.classNames.concat([SmoothedYLineSeries.className]);

	declare public _settings: ISmoothedYLineSeriesSettings;
	declare public _privateSettings: ISmoothedYLineSeriesPrivate;
	declare public _dataItemSettings: ISmoothedYLineSeriesDataItem;

	protected _afterNew() {
		this._setDefault("curveFactory", curveMonotoneYTension(this.get("tension", 0.5)) as any);
		super._afterNew();
	}

	public _updateChildren() {
		if (this.isDirty("tension")) {
			this.set("curveFactory", curveMonotoneYTension(this.get("tension", 0.5)) as any);
			this._valuesDirty = true;
		}

		super._updateChildren();
	}
}
