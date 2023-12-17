import type { IIndicatorEditableSetting } from "./Indicator";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";
import type { Color } from "../../../core/util/Color";

export interface ITrixSettings extends IChartIndicatorSettings {
	/**
	 * Signal color.
	 */
	signalColor?: Color;

	/**
	 * A value for "signal" period.
	 */
	signalPeriod?: number;
}

export interface ITrixPrivate extends IChartIndicatorPrivate {
}

export interface ITrixEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class Trix extends ChartIndicator {
	public static className: string = "Trix";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([Trix.className]);

	declare public _settings: ITrixSettings;
	declare public _privateSettings: ITrixPrivate;
	declare public _events: ITrixEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	/**
	 * Indicator series for the signal.
	 */
	public signalSeries!: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Period"),
		type: "number"
	}, {
		key: "seriesColor",
		name: this.root.language.translateAny("Color"),
		type: "color"
	}, {
		key: "signalPeriod",
		name: this.root.language.translateAny("Signal period"),
		type: "number"
	}, {
		key: "signalColor",
		name: this.root.language.translateAny("Signal color"),
		type: "color"
	}];

	protected _themeTag: string = "trix";

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "trix",
			fill: undefined
		}))
	}

	protected _afterNew() {
		this._themeTags.push("trix");

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
		}
	}


	public _prepareChildren() {
		if (this.isDirty("signalPeriod")) {
			this.markDataDirty();
			this.setCustomData("signalPeriod", this.get("signalPeriod"));
		}
		super._prepareChildren();
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("signalColor")) {
			this._updateSeriesColor(this.signalSeries, this.get("signalColor"), "signalColor");
		}

		const dataItem = this.series.dataItem;
		if (dataItem) {
			const dataContext = dataItem.dataContext as any;
			if (dataContext) {
				dataContext.signalPeriod = this.get("signalPeriod");
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
		super.prepareData();

		if (this.series) {

			let period = this.get("period", 14);
			const stockSeries = this.get("stockSeries");
			const dataItems = stockSeries.dataItems;

			let data = this._getDataArray(dataItems);

			this._ema(data, period, "value_y", "ema");
			this._ema(data, period, "ema", "ema2");
			this._ema(data, period, "ema2", "ema3");

			let previousDataItem: any;
			let previousValue: number;
			$array.each(data, (dataItem) => {
				let value = dataItem.ema3;
				if (previousDataItem) {
					previousValue = previousDataItem.ema3;
				}

				if ($type.isNumber(value) && $type.isNumber(previousValue)) {
					dataItem.trix = 100 * (value - previousValue) / previousValue;
				}

				previousDataItem = dataItem;
			})


			this.series.data.setAll(data);


			period = this.get("signalPeriod", 9);
			this._sma(data, period, "trix", "signal");

			this.signalSeries.data.setAll(data);
		}
	}
}