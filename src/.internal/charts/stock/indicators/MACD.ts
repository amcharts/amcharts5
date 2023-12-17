import type { IIndicatorEditableSetting } from "./Indicator";

import { color, Color } from "../../../core/util/Color";
import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";
import { ColumnSeries } from "../../xy/series/ColumnSeries";

import * as $array from "../../../core/util/Array";

export interface IMACDSettings extends IChartIndicatorSettings {

	/**
	 * Increasing color.
	 */
	increasingColor?: Color;

	/**
	 * Decreasing color.
	 */
	decreasingColor?: Color;

	/**
	 * Signal color.
	 */
	signalColor?: Color;

	/**
	 * A value for "fast" period.
	 */
	fastPeriod?: number;

	/**
	 * A value for "slow" period.
	 */
	slowPeriod?: number;

	/**
	 * A value for "signal" period.
	 */
	signalPeriod?: number;

}

export interface IMACDPrivate extends IChartIndicatorPrivate {
}

export interface IMACDEvents extends IChartIndicatorEvents {
}

/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class MACD extends ChartIndicator {
	public static className: string = "MACD";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([MACD.className]);

	declare public _settings: IMACDSettings;
	declare public _privateSettings: IMACDPrivate;
	declare public _events: IMACDEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	/**
	 * Indicator series for the signal.
	 */
	public signalSeries!: LineSeries;

	/**
	 * Indicator series for the difference.
	 */
	public differenceSeries!: ColumnSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "fastPeriod",
		name: this.root.language.translateAny("Fast MA period"),
		type: "number"
	}, {
		key: "slowPeriod",
		name: this.root.language.translateAny("Slow MA period"),
		type: "number"
	}, {
		key: "signalPeriod",
		name: this.root.language.translateAny("Signal period"),
		type: "number"
	}, {
		key: "seriesColor",
		name: this.root.language.translateAny("MACD"),
		type: "color"
	}, {
		key: "signalColor",
		name: this.root.language.translateAny("Signal"),
		type: "color"
	}, {
		key: "increasingColor",
		name: this.root.language.translateAny("Increasing"),
		type: "color"
	}, {
		key: "decreasingColor",
		name: this.root.language.translateAny("Decreasing"),
		type: "color"
	}];

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "macd",
			groupDataDisabled: true,
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	protected _afterNew() {
		this._themeTags.push("macd");

		super._afterNew();		

		const chart = this.panel;

		if (chart) {

			const signalSeries = chart.series.push(LineSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "signal",
				xAxis: this.xAxis,
				yAxis: this.yAxis,
				groupDataDisabled: true,
				themeTags: ["indicator", "signal"]
			}))

			this.signalSeries = signalSeries;

			const differenceSeries = chart.series.push(ColumnSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "difference",
				xAxis: this.xAxis,
				yAxis: this.yAxis,
				groupDataDisabled: true,
				themeTags: ["indicator", "difference"]
			}))

			this.differenceSeries = differenceSeries;
		}

	}

	public _prepareChildren() {
		if (this.isDirty("fastPeriod") || this.isDirty("slowPeriod") || this.isDirty("signalPeriod")) {
			this.markDataDirty();
			this.setCustomData("fastPeriod", this.get("fastPeriod"));
			this.setCustomData("slowPeriod", this.get("slowPeriod"));
			this.setCustomData("signalPeriod", this.get("signalPeriod"));
		}
		super._prepareChildren();
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("increasingColor") || this.isDirty("decreasingColor")) {
			const template = this.differenceSeries.columns.template;
			const increasing = this.get("increasingColor");
			const decreasing = this.get("decreasingColor");
			template.states.create("riseFromPrevious", { fill: increasing, stroke: increasing });
			template.states.create("dropFromPrevious", { fill: decreasing, stroke: decreasing });
			this._dataDirty = true;
		}

		if (this.isDirty("signalColor")) {
			this._updateSeriesColor(this.signalSeries, this.get("signalColor"), "signalColor");
		}

		const dataItem = this.series.dataItem;
		if (dataItem) {
			const dataContext = dataItem.dataContext as any;
			if (dataContext) {
				dataContext.fastPeriod = this.get("fastPeriod");
				dataContext.slowPeriod = this.get("slowPeriod");
				dataContext.signalPeriod = this.get("signalPeriod");

				const seriesColor = this.get("seriesColor");
				if (seriesColor) {
					dataContext.seriesColor = seriesColor.toCSSHex();
				}

				const signalColor = this.get("signalColor");
				if (signalColor) {
					dataContext.signalColor = signalColor.toCSSHex();
				}
			}
		}
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			const dataItems = this.get("stockSeries").dataItems;

			let data = this._getDataArray(dataItems);
			let period = this.get("fastPeriod", 12);

			this._ema(data, period, "value_y", "emaFast");

			period = this.get("slowPeriod", 26);
			this._ema(data, period, "value_y", "emaSlow");

			$array.each(data, (dataItem) => {
				let emaFast = dataItem.emaFast;
				let emaSlow = dataItem.emaSlow;

				if (emaFast != null && emaSlow != null) {
					dataItem.macd = emaFast - emaSlow;
				}
			})

			period = this.get("signalPeriod", 9);
			this._ema(data, period, "macd", "signal");

			const increasingColor = this.get("increasingColor", color(0x00ff00)).toCSSHex();
			const decreasingColor = this.get("decreasingColor", color(0xff0000)).toCSSHex();

			let p = -Infinity;
			$array.each(data, (dataItem) => {
				let macd = dataItem.macd
				let signal = dataItem.signal;
				if (macd != null && signal != null) {
					let difference = macd - signal;
					dataItem.difference = difference;

					let color = increasingColor;

					if (difference < p) {
						color = decreasingColor;
					}
					dataItem.differenceColor = color;
					p = difference;
				}
			})

			this.differenceSeries.data.setAll(data);
			this.signalSeries.data.setAll(data);
			this.series.data.setAll(data);
		}
	}
}