import type { DateAxis } from "../../xy/axes/DateAxis";
import type { AxisRenderer } from "../../xy/axes/AxisRenderer";

import { Indicator, IIndicatorSettings, IIndicatorPrivate, IIndicatorEvents, IIndicatorEditableSetting } from "./Indicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IMovingAverageSettings extends IIndicatorSettings {

	/**
	 * Type of the moving average.
	 *
	 * @default "simple"
	 */
	type?: "simple" | "weighted" | "exponential" | "dema" | "tema";

	/**
	 * Offset.
	 * 
	 * @default 0
	 */
	offset?: number;

}

export interface IMovingAveragePrivate extends IIndicatorPrivate {
}

export interface IMovingAverageEvents extends IIndicatorEvents {
}

/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class MovingAverage extends Indicator {
	public static className: string = "MovingAverage";
	public static classNames: Array<string> = Indicator.classNames.concat([MovingAverage.className]);

	declare public _settings: IMovingAverageSettings;
	declare public _privateSettings: IMovingAveragePrivate;
	declare public _events: IMovingAverageEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Period"),
		type: "number"
	}, {
		key: "offset",
		name: this.root.language.translateAny("Offset"),
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
		key: "type",
		name: this.root.language.translateAny("Type"),
		type: "dropdown",
		options: ["simple", "weighted", "exponential", "dema", "tema"]
	}];

	public _prepareChildren() {

		if (this.isDirty("type") || this.isDirty("offset")) {
			this.markDataDirty();
			this.setCustomData("type", this.get("type"));
			this.setCustomData("offset", this.get("offset", 0));
		}

		super._prepareChildren();
	}

	protected _afterNew() {
		super._afterNew();

		const stockSeries = this.get("stockSeries");
		const chart = stockSeries.chart;

		if (chart) {
			const series = chart.series.push(LineSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "ma",
				groupDataDisabled: true,
				calculateAggregates: true,
				xAxis: stockSeries.get("xAxis"),
				yAxis: stockSeries.get("yAxis"),
				themeTags: ["indicator", "movingaverage"],
				name: "MA"
			}))

			series.setPrivate("baseValueSeries", stockSeries);
			this.series = series;

			this._handleLegend(series);
		}
	}


	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			let period = this.get("period", 50);
			const type = this.get("type");
			const stockSeries = this.get("stockSeries");
			const dataItems = stockSeries.dataItems;

			let data = this._getDataArray(dataItems);

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

			const offset = this.get("offset", 0);


			if (offset != 0) {
				let i = 0;
				const baseDuration = (this.series.get("xAxis") as DateAxis<AxisRenderer>).baseDuration();
				const len = dataItems.length;
				const firstTime = dataItems[0].get("valueX", 0);
				const lastTime = dataItems[len - 1].get("valueX", 0);

				$array.each(data, (dataItem) => {
					let newX: number = 0;

					if (i + offset >= len) {
						newX = lastTime + (offset - len + i + 1) * baseDuration;
					}
					else if (i + offset < 0) {
						newX = firstTime + (i + offset) * baseDuration;
					}
					else {
						newX = dataItems[i + offset].get("valueX", 0);
					}
					dataItem.valueX = newX;

					i++;
				})
			}

			this.series.data.setAll(data);
		}
	}
}