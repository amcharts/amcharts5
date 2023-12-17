import type { IIndicatorEditableSetting } from "./Indicator";
import type { Color } from "../../../core/util/Color";

import { MovingAverage, IMovingAverageSettings, IMovingAveragePrivate, IMovingAverageEvents } from "./MovingAverage";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IBollingerBandsSettings extends IMovingAverageSettings {

	/**
	 * A value of standard deviations.
	 */
	standardDeviations?: number;

	/**
	 * A color for upper section.
	 */
	upperColor?: Color;

	/**
	 * A color for lower section.
	 */
	lowerColor?: Color;

}

export interface IBollingerBandsPrivate extends IMovingAveragePrivate {
}

export interface IBollingerBandsEvents extends IMovingAverageEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class BollingerBands extends MovingAverage {
	public static className: string = "BollingerBands";
	public static classNames: Array<string> = MovingAverage.classNames.concat([BollingerBands.className]);

	declare public _settings: IBollingerBandsSettings;
	declare public _privateSettings: IBollingerBandsPrivate;
	declare public _events: IBollingerBandsEvents;

	/**
	 * Indicator series for the upper band.
	 */
	public upperBandSeries!: LineSeries;

	/**
	 * Indicator series for the lower band.
	 */
	public lowerBandSeries!: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Period"),
		type: "number"
	}, {
		key: "standardDeviations",
		name: this.root.language.translateAny("Deviation"),
		type: "number"
	}, {
		key: "upperColor",
		name: this.root.language.translateAny("Upper"),
		type: "color"
	}, {
		key: "seriesColor",
		name: this.root.language.translateAny("Average"),
		type: "color"
	}, {
		key: "lowerColor",
		name: this.root.language.translateAny("Lower"),
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

	protected _afterNew() {

		const stockSeries = this.get("stockSeries");
		const chart = stockSeries.chart;

		if (chart) {
			const upperBandSeries = chart.series.push(LineSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "upper",
				openValueYField: "lower",
				calculateAggregates: true,
				xAxis: stockSeries.get("xAxis"),
				yAxis: stockSeries.get("yAxis"),
				groupDataDisabled: true,
				themeTags: ["indicator", "bollingerbands", "upper"]
			}))

			upperBandSeries.fills.template.set("visible", true);
			upperBandSeries.setPrivate("baseValueSeries", stockSeries);

			this.upperBandSeries = upperBandSeries;

			const lowerBandSeries = chart.series.push(LineSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "lower",
				calculateAggregates: true,
				xAxis: stockSeries.get("xAxis"),
				yAxis: stockSeries.get("yAxis"),
				groupDataDisabled: true,
				themeTags: ["indicator", "bollingerbands", "lower"]
			}))

			lowerBandSeries.setPrivate("baseValueSeries", stockSeries);
			this.lowerBandSeries = lowerBandSeries;
		}

		super._afterNew();
		this.series.addTag("bollingerbands");
		this.series._applyThemes();
	}

	public _prepareChildren() {

		if (this.isDirty("standardDeviations")) {
			this.markDataDirty();
		}

		super._prepareChildren();
	}

	public _updateChildren() {
		super._updateChildren();
		const upperColor = "upperColor";
		if (this.isDirty(upperColor)) {
			const color = this.get(upperColor);
			const upperBandSeries = this.upperBandSeries;
			upperBandSeries.set("stroke", color);
			upperBandSeries.set("fill", color);
			upperBandSeries.strokes.template.set("stroke", color);

			this._updateSeriesColor(upperBandSeries, color, upperColor);
		}

		const lowerColor = "lowerColor";
		if (this.isDirty(lowerColor)) {
			const color = this.get(lowerColor);
			const lowerBandSeries = this.lowerBandSeries;
			lowerBandSeries.set("stroke", color);
			lowerBandSeries.strokes.template.set("stroke", color);

			this._updateSeriesColor(lowerBandSeries, color, lowerColor);
		}

		this.setCustomData("standardDeviations", this.get("standardDeviations"));
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

			let standardDeviations = this.get("standardDeviations", 2);

			let smaData = this.series.data.values as any;

			let i = 0;

			$array.each(smaData, (dataItem: any) => {
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

					const lower = mean - standardDeviations * std;
					const upper = mean + standardDeviations * std;

					dataItem.upper = upper;
					dataItem.lower = lower;
				}
				i++;
			})

			this.upperBandSeries.data.setAll(smaData);
			this.lowerBandSeries.data.setAll(smaData);
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