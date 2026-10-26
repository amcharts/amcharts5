import { Indicator, IIndicatorSettings, IIndicatorPrivate, IIndicatorEvents, IIndicatorEditableSetting } from "./Indicator";
import { LineSeries } from "../../xy/series/LineSeries";
import type { Color } from "../../../core/util/Color";


export interface IMACrossSettings extends IIndicatorSettings {
	/**
	 * Period of the fast moving average. `period` sets the slow one.
	 *
	 * @default 9
	 */
	fastPeriod?: number;

	/**
	 * Color of the fast moving average line.
	 */
	fastColor?: Color;
}

export interface IMACrossPrivate extends IIndicatorPrivate {
}

export interface IMACrossEvents extends IIndicatorEvents {
}

/**
 * Moving Average Cross indicator: a slow (`period`) and a fast (`fastPeriod`)
 * simple moving average of `field`, drawn over the main series.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/stock/indicators/} for more info
 */
export class MACross extends Indicator {
	public static className: string = "MACross";
	public static classNames: Array<string> = Indicator.classNames.concat([MACross.className]);

	declare public _settings: IMACrossSettings;
	declare public _privateSettings: IMACrossPrivate;
	declare public _events: IMACrossEvents;

	/**
	 * Series of the slow moving average.
	 */
	declare public series: LineSeries;

	/**
	 * Series of the fast moving average.
	 */
	declare public fastSeries: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Slow period"),
		type: "number",
		minValue: 5,
		maxValue: 500,
		step: 1
	}, {
		key: "seriesColor",
		name: this.root.language.translateAny("Slow period"),
		type: "color"
	}, {
		key: "fastPeriod",
		name: this.root.language.translateAny("Fast period"),
		type: "number",
		minValue: 2,
		maxValue: 100,
		step: 1
	}, {
		key: "fastColor",
		name: this.root.language.translateAny("Fast period"),
		type: "color"
	}];

	public _prepareChildren() {

		if (this.isDirty("period") || this.isDirty("fastPeriod")) {
			this.markDataDirty();
		}

		if (this.isDirty("fastColor")) {
			this._updateSeriesColor(this.fastSeries, this.get("fastColor"), "fastColor");
		}

		this.setCustomData("fastPeriod", this.get("fastPeriod"));
		super._prepareChildren();
	}

	protected _dispose() {
		this.fastSeries.dispose();
		super._dispose();
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
				themeTags: ["indicator", "macross"],
				name: "MA"
			}))

			series.setPrivate("baseValueSeries", stockSeries);
			this.series = series;

			const fastSeries = chart.series.push(LineSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "maf",
				groupDataDisabled: true,
				calculateAggregates: true,
				xAxis: stockSeries.get("xAxis"),
				yAxis: stockSeries.get("yAxis"),
				stroke: this.get("fastColor"),
				themeTags: ["indicator", "macross", "fast"]
			}))

			fastSeries.setPrivate("baseValueSeries", stockSeries);
			this.fastSeries = fastSeries;

			this._handleLegend(series);
		}
	}


	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			let period = this.get("period", 21);
			let fastPeriod = this.get("fastPeriod", 9);
			const stockSeries = this.get("stockSeries");
			const dataItems = stockSeries.dataItems;

			let data = this._getDataArray(dataItems);

			this._sma(data, period, "value_y", "ma");
			this._sma(data, fastPeriod, "value_y", "maf");

			this.series.updateData(data);
			this.fastSeries.updateData(data);
		}
	}
}