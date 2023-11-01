import type { IIndicatorEditableSetting } from "./Indicator";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IStandardDeviationSettings extends IChartIndicatorSettings {
}

export interface IStandardDeviationPrivate extends IChartIndicatorPrivate {
}

export interface IStandardDeviationEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class StandardDeviation extends ChartIndicator {
	public static className: string = "StandardDeviation";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([StandardDeviation.className]);

	declare public _settings: IStandardDeviationSettings;
	declare public _privateSettings: IStandardDeviationPrivate;
	declare public _events: IStandardDeviationEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Period"),
		type: "number"
	}, {
		key: "seriesColor",
		name: this.root.language.translateAny("Color"),
		type: "color"
	}, {
		key: "field",
		name: this.root.language.translateAny("Field"),
		type: "dropdown",
		options: ["open", "close", "low", "high", "hl/2", "hlc/3", "hlcc/4", "ohlc/4"]
	}];

	public _afterNew(){
		this._themeTags.push("standarddeviation");
		super._afterNew();
	}			

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "deviation",
			fill: undefined
		}))
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		super.prepareData();

		if (this.series) {

			let period = this.get("period", 20);
			const stockSeries = this.get("stockSeries");
			const dataItems = stockSeries.dataItems;

			let data = this._getDataArray(dataItems);

			this._sma(data, period, "value_y", "ma");

			let i = 0;

			$array.each(data, (dataItem: any) => {
				if (i >= period - 1) {
					let mean = dataItem.ma;

					let stdSum = 0;
					for (let j = i - period + 1; j <= i; j++) {
						let di = dataItems[j];
						let diValue = this._getValue(di);
						if (diValue != null) {
							stdSum += Math.pow(diValue - mean, 2);
						}
					}

					let std = Math.sqrt(stdSum / period);

					dataItem.deviation = std;
				}
				i++;
			})
			this.series.data.setAll(data);
		}
	}
}