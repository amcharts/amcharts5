import type { IIndicatorEditableSetting } from "./Indicator";
import type { IValueAxisDataItem } from "../../xy/axes/ValueAxis";
import type { DataItem } from "../../../core/render/Component";
import type { Color } from "../../../core/util/Color";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IStochasticOscillatorSettings extends IChartIndicatorSettings {

	/**
	 * A value for "overbought" threshold.
	 */
	overBought?: number;

	/**
	 * A value for "oversold" threshold.
	 */
	overSold?: number;

	/**
	 * A color for "slow" section.
	 */
	slowColor?: Color;

	/**
	 * @todo review
	 */
	kSmoothing?: number;

	/**
	 * @todo review
	 */
	dSmoothing?: number;

}

export interface IStochasticOscillatorPrivate extends IChartIndicatorPrivate {
}

export interface IStochasticOscillatorEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class StochasticOscillator extends ChartIndicator {
	public static className: string = "StochasticOscillator";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([StochasticOscillator.className]);

	declare public _settings: IStochasticOscillatorSettings;
	declare public _privateSettings: IStochasticOscillatorPrivate;
	declare public _events: IStochasticOscillatorEvents;

	public overBought!: DataItem<IValueAxisDataItem>;
	public overSold!: DataItem<IValueAxisDataItem>;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	/**
	 * Indicator series.
	 */
	public slowSeries!: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Period"),
		type: "number"
	}, {
		key: "kSmoothing",
		name: this.root.language.translateAny("%K Smoothing"),
		type: "number"
	}, {
		key: "dSmoothing",
		name: this.root.language.translateAny("%D Smoothing"),
		type: "number"
	}, {
		key: "overBought",
		name: this.root.language.translateAny("Overbought"),
		type: "number"
	}, {
		key: "overSold",
		name: this.root.language.translateAny("Oversold"),
		type: "number"
	}, {
		key: "seriesColor",
		name: this.root.language.translateAny("Fast"),
		type: "color"
	}, {
		key: "slowColor",
		name: this.root.language.translateAny("Slow"),
		type: "color"
	}];

	protected _themeTag: string = "stochastic";

	protected _afterNew() {
		super._afterNew();

		this.yAxis.setAll({ min: 0, max: 100, strictMinMax: true });

		// overbought range
		const overBought = this.yAxis.makeDataItem({});
		this.overBought = overBought;
		this.yAxis.createAxisRange(overBought);

		const overBoughtGrid = overBought.get("grid");
		if (overBoughtGrid) {
			overBoughtGrid.setAll({ themeTags: ["overbought"], visible: true });
			overBoughtGrid._applyThemes();
		}

		const overBoughtLabel = overBought.get("label");
		if (overBoughtLabel) {
			overBoughtLabel.setAll({ themeTags: ["overbought"], visible: true, location: 0 });
			overBoughtLabel._applyThemes();
		}

		const overSold = this.yAxis.makeDataItem({});
		this.overSold = overSold;
		this.yAxis.createAxisRange(overSold);

		const overSoldGrid = overSold.get("grid");
		if (overSoldGrid) {
			overSoldGrid.setAll({ themeTags: ["oversold"], visible: true });
			overSoldGrid._applyThemes();
		}

		const overSoldLabel = overSold.get("label");
		if (overSoldLabel) {
			overSoldLabel.setAll({ themeTags: ["oversold"], visible: true, location: 0 });
			overSoldLabel._applyThemes();
		}

		const slowSeries = this.panel.series.push(LineSeries.new(this._root, {
			valueXField: "valueX",
			valueYField: "slow",
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			groupDataDisabled: true,
			themeTags: ["slow"]
		}))

		this.slowSeries = slowSeries;
	}

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "fast",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _prepareChildren() {
		if (this.isDirty("kSmoothing") || this.isDirty("dSmoothing")) {
			this._dataDirty = true;
		}
		super._prepareChildren();
	}

	public _updateChildren() {

		super._updateChildren();

		const overSoldValue = this.get("overSold", 20);
		const overBoughtValue = this.get("overBought", 80);

		if (this.isDirty("overBought")) {
			this.overBought.set("value", overBoughtValue);

			const label = this.overBought.get("label");
			if (label) {
				label.set("text", this.getNumberFormatter().format(overBoughtValue));
			}
		}

		if (this.isDirty("overSold")) {
			this.overSold.set("value", overSoldValue);

			const label = this.overSold.get("label");
			if (label) {
				label.set("text", this.getNumberFormatter().format(overSoldValue));
			}
		}
		this.series.get("yAxis").set("baseValue", overSoldValue + (overBoughtValue - overSoldValue) / 2);

		if (this.isDirty("slowColor")) {
			this._updateSeriesColor(this.slowSeries, this.get("slowColor"), "slowColor")
		}
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			const dataItems = this.get("stockSeries").dataItems;
			let period = this.get("period", 14);
			let data: Array<any> = [];
			let index = 0;

			$array.each(dataItems, (dataItem) => {
				const valueX = dataItem.get("valueX");
				let k;
				if (index >= period - 1) {
					let value = this._getValue(dataItem);

					if (value != null) {
						let lp = Infinity;
						let hp = -lp;
						for (let j = index; j > index - period; j--) {
							let h = dataItems[j].get("highValueY");
							let l = dataItems[j].get("lowValueY");

							if (h != null && l != null) {
								if (l < lp) {
									lp = l;
								}
								if (h > hp) {
									hp = h;
								}
							}
						}
						k = (value - lp) / (hp - lp) * 100;
					}
				}

				if (k == null) {
					data.push({ valueX: valueX });
				}
				else {
					data.push({ valueX: valueX, value_y: k });
				}
				index++;
			})

			period = this.get("kSmoothing", 1);
			this._sma(data, period, "value_y", "fast");

			period = this.get("dSmoothing", 3);
			this._sma(data, period, "fast", "slow");

			this.series.data.setAll(data);
			this.slowSeries.data.setAll(data);
		}
	}
}