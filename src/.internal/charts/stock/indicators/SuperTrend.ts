import { Indicator, IIndicatorSettings, IIndicatorPrivate, IIndicatorEvents, IIndicatorEditableSetting } from "./Indicator";
import { LineSeries } from "../../xy/series/LineSeries";

import type { Color } from "../../../core/util/Color";
import type { DataItem } from "../../../..";

import * as $array from "../../../core/util/Array";

export interface ISuperTrendSettings extends IIndicatorSettings {
	upperColor?: Color;
	lowerColor?: Color;
	multiplier?: number;
}

export interface ISuperTrendPrivate extends IIndicatorPrivate {
}

export interface ISuperTrendEvents extends IIndicatorEvents {
}

/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class SuperTrend extends Indicator {
	public static className: string = "SuperTrend";
	public static classNames: Array<string> = Indicator.classNames.concat([SuperTrend.className]);

	declare public _settings: ISuperTrendSettings;
	declare public _privateSettings: ISuperTrendPrivate;
	declare public _events: ISuperTrendEvents;

	/**
	 * Indicator series for the upper band.
	 */
	public upperBandSeries!: LineSeries;

	/**
	 * Indicator series for the lower band.
	 */
	public lowerBandSeries!: LineSeries;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Period"),
		type: "number"
	}, {
		key: "multiplier",
		name: this.root.language.translateAny("Multiplier"),
		type: "number"
	}, {
		key: "upperColor",
		name: this.root.language.translateAny("Upper"),
		type: "color"
	}, {
		key: "lowerColor",
		name: this.root.language.translateAny("Lower"),
		type: "color"
	}];


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
				themeTags: ["indicator", "supertrend"],
				name: "Super Trend",
			}))

			series.setPrivate("baseValueSeries", stockSeries);
			this.series = series;

			const upperBandSeries = chart.series.push(LineSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "upper",
				openValueYField: "value_close",
				xAxis: stockSeries.get("xAxis"),
				yAxis: stockSeries.get("yAxis"),
				groupDataDisabled: true,
				calculateAggregates: true,
				connect: false,
				autoGapCount: Infinity,
				themeTags: ["indicator", "supertrend", "upper"]
			}))

			upperBandSeries.fills.template.set("visible", true);
			upperBandSeries.setPrivate("baseValueSeries", stockSeries);

			this.upperBandSeries = upperBandSeries;

			const lowerBandSeries = chart.series.push(LineSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "lower",
				openValueYField: "value_close",
				xAxis: stockSeries.get("xAxis"),
				yAxis: stockSeries.get("yAxis"),
				groupDataDisabled: true,
				calculateAggregates: true,
				connect: false,
				autoGapCount: Infinity,
				themeTags: ["indicator", "supertrend", "lower"]
			}))

			lowerBandSeries.fills.template.set("visible", true);
			lowerBandSeries.setPrivate("baseValueSeries", stockSeries);
			this.lowerBandSeries = lowerBandSeries;

			this._handleLegend(this.series);
		}
	}

	public _updateChildren() {
		super._updateChildren();
		if (this.isDirty("upperColor")) {
			const color = this.get("upperColor");
			const upperBandSeries = this.upperBandSeries;
			upperBandSeries.set("stroke", color);
			upperBandSeries.set("fill", color);
			upperBandSeries.strokes.template.set("stroke", color);

			this._updateSeriesColor(upperBandSeries, color, "upperColor");
		}

		if (this.isDirty("lowerColor")) {
			const color = this.get("lowerColor");
			const lowerBandSeries = this.lowerBandSeries;
			lowerBandSeries.set("stroke", color);
			lowerBandSeries.set("fill", color);
			lowerBandSeries.strokes.template.set("stroke", color);

			this._updateSeriesColor(lowerBandSeries, color, "lowerColor");
		}

		if (this.isDirty("multiplier")) {
			this.markDataDirty();
			this.setCustomData("multiplier", this.get("multiplier"));
		}
	}

	protected _getDataArray(dataItems: Array<DataItem<any>>): Array<any> {
		const data: Array<any> = [];
		$array.each(dataItems, (dataItem) => {
			data.push({ valueX: dataItem.get("valueX"), value_close: dataItem.get("valueY"), value_high: dataItem.get("highValueY"), value_low: dataItem.get("lowValueY") });
		})
		return data;
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			let period = this.get("period", 10);
			const stockSeries = this.get("stockSeries");
			const dataItems = stockSeries.dataItems;

			let data = this._getDataArray(dataItems);

			let i = 0;
			let index = 0;
			let tr = 0;
			let prevClose: number | undefined;
			let prevATR: number | undefined;
			let multiplier = this.get("multiplier", 3);


			let atr: number | undefined;
			let trendDirection: boolean = false;
			let prevSuperTrend: number | undefined;
			let prevUpperBand: number | undefined;
			let prevLowerBand: number | undefined;
			let upperBand: number | undefined;
			let lowerBand: number | undefined;
			let superTrend: number | undefined;


			$array.each(data, (dataItem) => {

				let valueClose = dataItem.value_close;

				if (valueClose != null && prevClose != null) {
					i++;
					tr = Math.max(dataItem.value_high - dataItem.value_low, Math.abs(dataItem.value_high - prevClose), Math.abs(dataItem.value_low - prevClose));
					dataItem.tr = tr;

					if (i >= period) {
						if (i == period) {
							let sum = 0;
							let k = 0;
							for (let j = index; j >= 0; j--) {
								sum += data[j].tr;
								k++;
								if (k == period) {
									break;
								}
							}
							atr = sum / period;
						}
						else {
							if (prevATR != null) {
								atr = (prevATR * (period - 1) + tr) / period;
							}
						}

						prevATR = atr;

						let basicUpperBand = (dataItem.value_high + dataItem.value_low) / 2 + (multiplier * Number(atr));
						let basicLowerBand = (dataItem.value_high + dataItem.value_low) / 2 - (multiplier * Number(atr));

						// Adjusted bands
						if (i === period) {
							upperBand = basicUpperBand;
							lowerBand = basicLowerBand;
						} else {
							upperBand = basicUpperBand < Number(prevUpperBand) || prevClose > Number(prevUpperBand)
								? basicUpperBand
								: prevUpperBand;
							lowerBand = basicLowerBand > Number(prevLowerBand) || prevClose < Number(prevLowerBand)
								? basicLowerBand
								: prevLowerBand;
						}



						if (i === period) {
							superTrend = valueClose <= Number(upperBand) ? upperBand : lowerBand;
						} else {
							if (prevSuperTrend === prevUpperBand && valueClose <= Number(upperBand)) {
								superTrend = upperBand;
								trendDirection = false; // downtrend
							} else if (prevSuperTrend === prevUpperBand && valueClose > Number(upperBand)) {
								superTrend = lowerBand;
								trendDirection = true; // uptrend
							} else if (prevSuperTrend === prevLowerBand && valueClose >= Number(lowerBand)) {
								superTrend = lowerBand;
								trendDirection = true; // uptrend
							} else if (prevSuperTrend === prevLowerBand && valueClose < Number(lowerBand)) {
								superTrend = upperBand;
								trendDirection = false; // downtrend
							} else {
								superTrend = prevSuperTrend;
							}
						}

						if (trendDirection) {
							dataItem.lower = superTrend;
							dataItem.upper = undefined;
						}
						else {
							dataItem.upper = superTrend;
							dataItem.lower = undefined;
						}

						prevLowerBand = lowerBand;
						prevUpperBand = upperBand;
						prevSuperTrend = superTrend;
					}
				}

				index++;
				prevClose = valueClose;
			})

			this.upperBandSeries.data.setAll(data);
			this.lowerBandSeries.data.setAll(data);
		}
	}
	protected _dispose() {
		this.upperBandSeries.dispose();
		this.lowerBandSeries.dispose();
		super._dispose();
	}

	public async hide(duration?: number): Promise<any> {
		return Promise.all([
			super.hide(duration),
			this.upperBandSeries.hide(duration),
			this.lowerBandSeries.hide(duration)
		]);
	}

	public async show(duration?: number): Promise<any> {
		return Promise.all([
			super.show(duration),
			this.upperBandSeries.show(duration),
			this.lowerBandSeries.show(duration)
		]);
	}

}