import type { IIndicatorEditableSetting } from "./Indicator";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IDisparityIndexSettings extends IChartIndicatorSettings {

	/**
	 * Type of the moving average.
	 *
	 * @default "simple"
	 */
	movingAverageType?: "simple" | "weighted" | "exponential" | "dema" | "tema";

}

export interface IDisparityIndexPrivate extends IChartIndicatorPrivate {
}

export interface IDisparityIndexEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class DisparityIndex extends ChartIndicator {
	public static className: string = "DisparityIndex";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([DisparityIndex.className]);

	declare public _settings: IDisparityIndexSettings;
	declare public _privateSettings: IDisparityIndexPrivate;
	declare public _events: IDisparityIndexEvents;

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
	}, {
		key: "movingAverageType",
		name: this.root.language.translateAny("Moving Average Type"),
		type: "dropdown",
		options: ["simple", "weighted", "exponential", "dema", "tema"]
	}];

	public _afterNew(){
		this._themeTags.push("disparityindex");
		super._afterNew();
	}	

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "disparity",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _prepareChildren() {
		const movingAverageType = "movingAverageType";
		if (this.isDirty(movingAverageType)) {
			this.markDataDirty();
			this.setCustomData(movingAverageType, this.get(movingAverageType));
		}

		super._prepareChildren();
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {

			const dataItems = this.get("stockSeries").dataItems;
			const period = this.get("period", 14);
			const type = this.get("movingAverageType");

			let data: Array<any> = this._getDataArray(dataItems);

			switch (type) {
				case "simple":
					this._sma(data, period, "value_y", "ma");
					break;

				case "weighted":
					this._wma(data, period, "value_y", "ma");
					break;

				case "exponential":
					this._ema(data, period, "value_y", "ma");
					break;

				case "dema":
					this._dema(data, period, "value_y", "ma");
					break;

				case "tema":
					this._tema(data, period, "value_y", "ma");
					break;
			}

			$array.each(data, (dataItem) => {
				const ma = dataItem.ma;
				if (ma != null) {
					dataItem.disparity = 100 * (dataItem.value_y - ma) / ma
				}
			})
			this.series.data.setAll(data);
		}
	}
}