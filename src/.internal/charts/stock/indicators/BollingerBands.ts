import type { IIndicatorEditableSetting } from "./Indicator";
import type { Color } from "../../../core/util/Color";

import { MovingAverage, IMovingAverageSettings, IMovingAveragePrivate, IMovingAverageEvents } from "./MovingAverage";
import { LineSeries } from "../../xy/series/LineSeries";


export interface IBollingerBandsSettings extends IMovingAverageSettings {

	/**
	 * How many standard deviations above and below the moving average the bands
	 * are.
	 *
	 * @default 2
	 */
	standardDeviations?: number;

	/**
	 * Color of the upper band and of the fill between the bands.
	 */
	upperColor?: Color;

	/**
	 * Color of the lower band.
	 */
	lowerColor?: Color;

}

export interface IBollingerBandsPrivate extends IMovingAveragePrivate {
}

export interface IBollingerBandsEvents extends IMovingAverageEvents {
}


/**
 * Bollinger Bands indicator: a moving average of `field` over `period`, with
 * bands `standardDeviations` standard deviations above and below it. Drawn
 * over the main series.
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
	 * Series of the upper band.
	 */
	public upperBandSeries!: LineSeries;

	/**
	 * Series of the lower band.
	 */
	public lowerBandSeries!: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Period"),
		type: "number",
		minValue: 5,
		maxValue: 100,
		step: 1
	}, {
		key: "standardDeviations",
		name: this.root.language.translateAny("Deviation"),
		type: "number",
		minValue: 1,
		maxValue: 4,
		step: 0.1
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
		key: "maType",
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

			// Rolling sum / sum of squares over the window, so the bands are O(n)
			// instead of O(n * period) and values are read once per bar.
			let sum = 0;
			let sumSq = 0;
			let count = 0;

			for (let i = 0, len = smaData.length; i < len; i++) {
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
					const mean = smaData[i].ma;
					const variance = (sumSq - 2 * mean * sum + count * mean * mean) / period;
					const std = Math.sqrt(variance < 0 ? 0 : variance);
					smaData[i].lower = mean - standardDeviations * std;
					smaData[i].upper = mean + standardDeviations * std;
				}
			}

			this.upperBandSeries.updateData(smaData);
			this.lowerBandSeries.updateData(smaData);
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