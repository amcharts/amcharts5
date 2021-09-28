import { RadarLineSeries, IRadarLineSeriesSettings, IRadarLineSeriesPrivate, IRadarLineSeriesDataItem } from "./RadarLineSeries";
import { curveCardinalClosed, CurveCardinalFactory, curveCardinal } from "d3-shape";

export interface ISmoothedRadarLineSeriesDataItem extends IRadarLineSeriesDataItem {
}

export interface ISmoothedRadarLineSeriesSettings extends IRadarLineSeriesSettings {

	/**
	 * Tension of curve.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/smoothed-series/#Line_tension} for more info
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
 * Draws a smoothed line series for use in a [[RadarChart]].
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

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("connectEnds")) {
			const connectEnds = this.get("connectEnds");
			if (connectEnds) {
				this.setRaw("curveFactory", curveCardinalClosed.tension(this.get("tension", 0)));
			}
			else {
				this.setRaw("curveFactory", curveCardinal.tension(this.get("tension", 0)));
			}
		}

		if (this.isDirty("tension")) {
			let cf = this.get("curveFactory")!;
			if (cf) {
				cf.tension(this.get("tension", 0));
			}
		}
	}

	protected _endLine(_points: Array<Array<number>>, _firstPoint: Array<number>) {

	}
}
