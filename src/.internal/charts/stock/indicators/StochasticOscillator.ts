import type { Color } from "../../../core/util/Color";

import { OverboughtOversold, IOverboughtOversoldSettings, IOverboughtOversoldPrivate, IOverboughtOversoldEvents } from "./OverboughtOversold";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";

export interface IStochasticOscillatorSettings extends IOverboughtOversoldSettings {
	/**
	 * A color for "slow" section.
	 */
	slowColor?: Color;

	/**
	 * Smoothing "k" parameter.
	 */
	kSmoothing?: number;

	/**
	 * Smoothing "d" parameter.
	 */
	dSmoothing?: number;
}

export interface IStochasticOscillatorPrivate extends IOverboughtOversoldPrivate {
}

export interface IStochasticOscillatorEvents extends IOverboughtOversoldEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class StochasticOscillator extends OverboughtOversold {
	public static className: string = "StochasticOscillator";
	public static classNames: Array<string> = OverboughtOversold.classNames.concat([StochasticOscillator.className]);

	declare public _settings: IStochasticOscillatorSettings;
	declare public _privateSettings: IStochasticOscillatorPrivate;
	declare public _events: IStochasticOscillatorEvents;

	/**
	 * Indicator series.
	 */
	public slowSeries!: LineSeries;

	protected _afterNew() {
		this._themeTags.push("stochastic");

		super._afterNew();

		this._editableSettings.unshift(
			{
				key: "period",
				name: this.root.language.translateAny("Period"),
				type: "number"
			}, {
			key: "seriesColor",
			name: this.root.language.translateAny("Period"),
			type: "color"
		}, {
			key: "kSmoothing",
			name: this.root.language.translateAny("K period"),
			type: "number"
		},{
			key: "dSmoothing",
			name: this.root.language.translateAny("SMA period"),
			type: "number"
		},  {
			key: "slowColor",
			name: this.root.language.translateAny("SMA period"),
			type: "color"
		}
		)

		this.yAxis.setAll({ min: 0, max: 100, strictMinMax: true });

		const slowSeries = this.panel.series.push(LineSeries.new(this._root, {
			valueXField: "valueX",
			valueYField: "slow",
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			groupDataDisabled: true,
			themeTags: ["indicator", "slow"]
		}))

		this.slowSeries = slowSeries;
	}


	public _updateChildren() {
		if (this.isDirty("kSmoothing") || this.isDirty("dSmoothing")) {
			this.markDataDirty();
			this.setCustomData("dSmoothing", this.get("dSmoothing"));
			this.setCustomData("kSmoothing", this.get("kSmoothing"));
		}

		super._updateChildren();

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

				if (k == null || $type.isNaN(k)) {
					data.push({ valueX: valueX });
				}
				else {
					data.push({ valueX: valueX, value_y: k });
				}
				index++;
			})

			period = this.get("kSmoothing", 1);
			this._sma(data, period, "value_y", "valueS");

			period = this.get("dSmoothing", 3);
			this._sma(data, period, "valueS", "slow");

			this.series.data.setAll(data);
			this.slowSeries.data.setAll(data);
		}
	}
}