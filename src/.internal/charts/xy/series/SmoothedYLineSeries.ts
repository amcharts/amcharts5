import { LineSeries, ILineSeriesSettings, ILineSeriesPrivate, ILineSeriesDataItem } from "./LineSeries";
import type { Root } from "../../../core/Root";
import type { Template } from "../../../core/util/Template";
import { curveMonotoneYTension } from "../../../core/render/MonotoneYTension";

export interface ISmoothedYLineSeriesDataItem extends ILineSeriesDataItem {

}

export interface ISmoothedYLineSeriesSettings extends ILineSeriesSettings {

	/**
	 * A tension force for the smoothing (0-1). The smaller the value the more
	 * curvy the line will be.
	 * 
	 * @default 0.5
	 */
	tension?: number;

}

export interface ISmoothedYLineSeriesPrivate extends ILineSeriesPrivate {
}

/**
 * Smoothed line series suitable for vertical plots.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/series/smoothed-series/} for more info
 */
export class SmoothedYLineSeries extends LineSeries {
	public static className: string = "SmoothedYLineSeries";
	public static classNames: Array<string> = LineSeries.classNames.concat([SmoothedYLineSeries.className]);

	declare public _settings: ISmoothedYLineSeriesSettings;
	declare public _privateSettings: ISmoothedYLineSeriesPrivate;
	declare public _dataItemSettings: ISmoothedYLineSeriesDataItem;

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: LineSeries["_settings"], template?: Template<LineSeries>): SmoothedYLineSeries {
		const x = new SmoothedYLineSeries(root, settings, true, template);
		x._afterNew();
		return x;
	}

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
