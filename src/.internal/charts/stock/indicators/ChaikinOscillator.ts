import type { IIndicatorEditableSetting } from "./Indicator";
import type { XYSeries } from "../../xy/series/XYSeries";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IChaikinOscillatorSettings extends IChartIndicatorSettings {

	/**
	 * The volume series that weights the accumulation/distribution line.
	 * Required.
	 */
	volumeSeries: XYSeries;

	/**
	 * Period of the slow exponential moving average. `period` sets the fast
	 * one.
	 *
	 * @default 10
	 */
	slowPeriod?: number;

}

export interface IChaikinOscillatorPrivate extends IChartIndicatorPrivate {
}

export interface IChaikinOscillatorEvents extends IChartIndicatorEvents {
}


/**
 * Chaikin Oscillator indicator: the fast (`period`) minus the slow
 * (`slowPeriod`) exponential moving average of the accumulation/distribution
 * line. Drawn in a panel of its own.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/stock/indicators/} for more info
 */
export class ChaikinOscillator extends ChartIndicator {
	public static className: string = "ChaikinOscillator";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([ChaikinOscillator.className]);

	declare public _settings: IChaikinOscillatorSettings;
	declare public _privateSettings: IChaikinOscillatorPrivate;
	declare public _events: IChaikinOscillatorEvents;

	/**
	 * The indicator's series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Fast period"),
		type: "number",
		minValue: 2,
		maxValue: 15,
		step: 1
	}, {
		key: "slowPeriod",
		name: this.root.language.translateAny("Slow period"),
		type: "number",
		minValue: 5,
		maxValue: 40,
		step: 1
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
		super._prepareChildren();
		if (this.isDirty("slowPeriod")) {
			this.markDataDirty();
			this.setCustomData("slowPeriod", this.get("slowPeriod"));
		}
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

			this.series.updateData(data);
		}
	}
}