import type { IIndicatorEditableSetting } from "./Indicator";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IMedianPriceSettings extends IChartIndicatorSettings {
}

export interface IMedianPricePrivate extends IChartIndicatorPrivate {
}

export interface IMedianPriceEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class MedianPrice extends ChartIndicator {
	public static className: string = "MedianPrice";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([MedianPrice.className]);

	declare public _settings: IMedianPriceSettings;
	declare public _privateSettings: IMedianPricePrivate;
	declare public _events: IMedianPriceEvents;

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
	}];

	public _afterNew(){
		this._themeTags.push("medianprice");
		super._afterNew();
	}	

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "median",
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

			let i = 0;
			let index = 0;
			let median = 0;
			$array.each(data, (dataItem) => {
				let value = dataItem.value_y;
				if (value != null) {
					i++;
					median += value / period;

					if (i >= period) {
						if (i > period) {
							let valueToRemove = data[index - period].value_y;
							if (valueToRemove != null) {
								median -= valueToRemove / period;
							}
						}
						dataItem.median = median;
					}
				}
				index++;
			})

			this.series.data.setAll(data);
		}
	}
}