import type { IIndicatorEditableSetting } from "./Indicator";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";


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
		type: "number",
		minValue: 2,
		maxValue: 100,
		step: 1
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

			// Rolling sum / sum of squares over the window, so the standard deviation
			// is O(n) instead of O(n * period) and values are read once per bar.
			let sum = 0;
			let sumSq = 0;
			let count = 0;

			for (let i = 0, len = data.length; i < len; i++) {
				const v = this._getValue(dataItems[i]);
				if (v != null) {
					sum += v;
					sumSq += v * v;
					count++;
				}
				if (i >= period) {
					const ov = this._getValue(dataItems[i - period]);
					if (ov != null) {
						sum -= ov;
						sumSq -= ov * ov;
						count--;
					}
				}

				if (i >= period - 1) {
					// sum((x - m)^2) = sumSq - 2*m*sum + count*m^2, divided by period.
					const mean = data[i].ma;
					const variance = (sumSq - 2 * mean * sum + count * mean * mean) / period;
					data[i].deviation = Math.sqrt(variance < 0 ? 0 : variance);
				}
			}
			this.series.updateData(data);
		}
	}
}