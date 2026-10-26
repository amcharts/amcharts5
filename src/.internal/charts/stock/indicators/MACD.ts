import type { IIndicatorEditableSetting } from "./Indicator";

import { color, Color } from "../../../core/util/Color";
import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";
import { ColumnSeries } from "../../xy/series/ColumnSeries";

import * as $array from "../../../core/util/Array";

export interface IMACDSettings extends IChartIndicatorSettings {

	/**
	 * Color of difference columns higher than the previous one.
	 */
	increasingColor?: Color;

	/**
	 * Color of difference columns lower than the previous one.
	 */
	decreasingColor?: Color;

	/**
	 * Color of the signal line.
	 */
	signalColor?: Color;

	/**
	 * Period of the fast exponential moving average.
	 *
	 * @default 12
	 */
	fastPeriod?: number;

	/**
	 * Period of the slow exponential moving average.
	 *
	 * @default 26
	 */
	slowPeriod?: number;

	/**
	 * Period of the signal line, an exponential moving average of the MACD
	 * line.
	 *
	 * @default 9
	 */
	signalPeriod?: number;

}

export interface IMACDPrivate extends IChartIndicatorPrivate {
}

export interface IMACDEvents extends IChartIndicatorEvents {
}

/**
 * MACD (Moving Average Convergence Divergence) indicator: the fast minus the
 * slow exponential moving average of `field`, with a signal line and columns
 * of the difference between the two. Drawn in a panel of its own.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/stock/indicators/} for more info
 */
export class MACD extends ChartIndicator {
	public static className: string = "MACD";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([MACD.className]);

	declare public _settings: IMACDSettings;
	declare public _privateSettings: IMACDPrivate;
	declare public _events: IMACDEvents;

	/**
	 * Series of the MACD line.
	 */
	declare public series: LineSeries;

	/**
	 * Series of the signal line.
	 */
	public signalSeries!: LineSeries;

	/**
	 * Columns of the difference between the MACD and signal lines.
	 */
	public differenceSeries!: ColumnSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "fastPeriod",
		name: this.root.language.translateAny("Fast MA period"),
		type: "number",
		minValue: 2,
		maxValue: 50,
		step: 1
	}, {
		key: "slowPeriod",
		name: this.root.language.translateAny("Slow MA period"),
		type: "number",
		minValue: 10,
		maxValue: 100,
		step: 1
	}, {
		key: "signalPeriod",
		name: this.root.language.translateAny("Signal period"),
		type: "number",
		minValue: 2,
		maxValue: 40,
		step: 1
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
		super._prepareChildren();
		if (this.isDirty("fastPeriod") || this.isDirty("slowPeriod") || this.isDirty("signalPeriod")) {
			this.markDataDirty();
			this.setCustomData("fastPeriod", this.get("fastPeriod"));
			this.setCustomData("slowPeriod", this.get("slowPeriod"));
			this.setCustomData("signalPeriod", this.get("signalPeriod"));
		}
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
			// The columns take the states only when they are laid out again
			this.differenceSeries.markDirtyValues();
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

			this.differenceSeries.updateData(data);
			this.signalSeries.updateData(data);
			this.series.updateData(data);
		}
	}
}