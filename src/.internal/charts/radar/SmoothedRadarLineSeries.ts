import { RadarLineSeries, IRadarLineSeriesSettings, IRadarLineSeriesPrivate, IRadarLineSeriesDataItem } from "./RadarLineSeries";
import { curveCardinalClosed, CurveCardinalFactory, curveCardinal } from "d3-shape";

export interface ISmoothedRadarLineSeriesDataItem extends IRadarLineSeriesDataItem {
}

export interface ISmoothedRadarLineSeriesSettings extends IRadarLineSeriesSettings {

	/**
	 * How tight the curve is, from `0` to `1`: `1` draws straight lines, a
	 * smaller value a rounder curve.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/series/smoothed-series/#line-tension} for more info
	 * @default 0.5
	 */
	tension?: number;

	/**
	 * @ignore
	 */
	curveFactory?: CurveCardinalFactory

}

export interface ISmoothedRadarLineSeriesPrivate extends IRadarLineSeriesPrivate {
}

/**
 * A line series for a [[RadarChart]] that draws a smooth curve through its
 * data points.
 *
 * @important
 */
export class SmoothedRadarLineSeries extends RadarLineSeries {
	public static className: string = "SmoothedRadarLineSeries";
	public static classNames: Array<string> = RadarLineSeries.classNames.concat([SmoothedRadarLineSeries.className]);

	declare public _settings: ISmoothedRadarLineSeriesSettings;
	declare public _privateSettings: ISmoothedRadarLineSeriesPrivate;
	declare public _dataItemSettings: ISmoothedRadarLineSeriesDataItem;

	protected _afterNew() {
		this._setDefault("curveFactory", curveCardinalClosed.tension(this.get("tension", 0)));
		super._afterNew();
	}

	// Here, not in _prepareChildren: setting a new factory there re-runs it endlessly
	public _updateChildren() {
		if (this.isDirty("connectEnds")) {
			const connectEnds = this.get("connectEnds");
			if (connectEnds) {
				this._setC("curveFactory", curveCardinalClosed.tension(this.get("tension", 0)));
			}
			else {
				this._setC("curveFactory", curveCardinal.tension(this.get("tension", 0)));
			}
		}

		if (this.isDirty("tension")) {
			let cf = this.get("curveFactory")!;
			if (cf) {
				this._setC("curveFactory", cf.tension(this.get("tension", 0)));
			}
		}

		super._updateChildren();
	}

	protected _endLine(_points: Array<Array<number>>, _firstPoint: Array<number>) {

	}
}
