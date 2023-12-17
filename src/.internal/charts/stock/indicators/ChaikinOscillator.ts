import type { IIndicatorEditableSetting } from "./Indicator";
import type { XYSeries } from "../../xy/series/XYSeries";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IChaikinOscillatorSettings extends IChartIndicatorSettings {

	/**
	 * Main volume series of the [[StockChart]].
	 */
	volumeSeries: XYSeries;

	/**
	 * Slow period setting.
	 */
	slowPeriod?: number;

}

export interface IChaikinOscillatorPrivate extends IChartIndicatorPrivate {
}

export interface IChaikinOscillatorEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class ChaikinOscillator extends ChartIndicator {
	public static className: string = "ChaikinOscillator";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([ChaikinOscillator.className]);

	declare public _settings: IChaikinOscillatorSettings;
	declare public _privateSettings: IChaikinOscillatorPrivate;
	declare public _events: IChaikinOscillatorEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Fast period"),
		type: "number"
	}, {
		key: "slowPeriod",
		name: this.root.language.translateAny("Slow period"),
		type: "number"
	}, {
		key: "seriesColor",
		name: this.root.language.translateAny("Color"),
		type: "color"
	}];

	public _afterNew(){
		this._themeTags.push("chaikinoscillator");
		super._afterNew();
		this.yAxis.set("numberFormat", "#.###a");
	}

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "cmf",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _prepareChildren() {
		if (this.isDirty("slowPeriod")) {
			this.markDataDirty();
			this.setCustomData("slowPeriod", this.get("slowPeriod"));
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

			$array.each(dataItems, (dataItem) => {
				let close = dataItem.get("valueY") as number;
				if (close != null) {
					let low = dataItem.get("lowValueY", close) as number;
					let high = dataItem.get("highValueY", close) as number;

					let volume = 1;

					const volumeDI = volumeSeries.dataItems[i];
					if (volumeDI) {
						volume = volumeDI.get("valueY", 1);
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

			this._ema(data, this.get("slowPeriod", 10), "ad", "emaSlow");
			this._ema(data, this.get("period", 3), "ad", "emaFast");

			$array.each(data, (dataItem) => {
				const emaSlow = dataItem.emaSlow;
				const emaFast = dataItem.emaFast;
				if (emaSlow != null && emaFast != null) {
					dataItem.cmf = emaFast - emaSlow;
				}
			})

			this.series.data.setAll(data);
		}
	}
}