import type { IIndicatorEditableSetting } from "./Indicator";
import type { XYSeries } from "../../xy/series/XYSeries";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IAccumulationDistributionSettings extends IChartIndicatorSettings {

	/**
	 * Main volume series of the [[StockChart]].
	 */
	volumeSeries?: XYSeries;

	/**
	 * Use volume series (if set)?
	 */
	useVolume?: boolean;

}

export interface IAccumulationDistributionPrivate extends IChartIndicatorPrivate {

}

export interface IAccumulationDistributionEvents extends IChartIndicatorEvents {

}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class AccumulationDistribution extends ChartIndicator {
	public static className: string = "AccumulationDistribution";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([AccumulationDistribution.className]);

	declare public _settings: IAccumulationDistributionSettings;
	declare public _privateSettings: IAccumulationDistributionPrivate;
	declare public _events: IAccumulationDistributionEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "seriesColor",
		name: this.root.language.translateAny("Color"),
		type: "color"
	}, {
		key: "useVolume",
		name: this.root.language.translateAny("Use Volume"),
		type: "checkbox"
	}];

	protected _themeTag: string = "accumulationdistribution";

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "ad",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _prepareChildren() {
		if (this.isDirty("useVolume") || this.isDirty("volumeSeries")) {
			this._dataDirty = true;
			this.setCustomData("useVolume", this.get("useVolume") ? "Y" : "N");
		}
		super._prepareChildren();
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {

			const dataItems = this.get("stockSeries").dataItems;
			const volumeSeries = this.get("volumeSeries");
			this.setRaw("field", "close");

			let i = 0;
			let data: Array<any> = this._getDataArray(dataItems);
			let prevAD = 0;
			let useVolume = this.get("useVolume");

			$array.each(dataItems, (dataItem) => {
				let close = dataItem.get("valueY") as number;
				if (close != null) {
					let low = dataItem.get("lowValueY", close) as number;
					let high = dataItem.get("highValueY", close) as number;

					let volume = 1;
					if (volumeSeries && useVolume) {
						const volumeDI = volumeSeries.dataItems[i];
						if (volumeDI) {
							volume = volumeDI.get("valueY", 1);
						}
					}

					let mf = ((close - low) - (high - close)) / (high - low)
					if (high == low) {
						mf = 0;
					}

					let ad = prevAD + mf * volume;
					data[i].ad = ad;

					prevAD = ad
				}
				i++;
			})
			this.series.data.setAll(data);
		}
	}
}