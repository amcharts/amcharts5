import type { Color } from "../../../core/util/Color";

import { OverboughtOversold, IOverboughtOversoldSettings, IOverboughtOversoldPrivate, IOverboughtOversoldEvents } from "./OverboughtOversold";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";

export interface IStochasticOscillatorSettings extends IOverboughtOversoldSettings {
	/**
	 * Color of the slow (%D) line.
	 */
	slowColor?: Color;

	/**
	 * Number of data items the main (%K) line is smoothed over, with a simple
	 * moving average. `1` means no smoothing.
	 *
	 * @default 1
	 */
	kSmoothing?: number;

	/**
	 * Number of data items the slow (%D) line averages the main line over.
	 *
	 * @default 3
	 */
	dSmoothing?: number;
}

export interface IStochasticOscillatorPrivate extends IOverboughtOversoldPrivate {
}

export interface IStochasticOscillatorEvents extends IOverboughtOversoldEvents {
}


/**
 * Stochastic Oscillator indicator: where the price is within the high-low
 * range of the last `period` data items, from `0` to `100`, with a slow line
 * averaging it. Drawn in a panel of its own.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/stock/indicators/} for more info
 */
export class StochasticOscillator extends OverboughtOversold {
	public static className: string = "StochasticOscillator";
	public static classNames: Array<string> = OverboughtOversold.classNames.concat([StochasticOscillator.className]);

	declare public _settings: IStochasticOscillatorSettings;
	declare public _privateSettings: IStochasticOscillatorPrivate;
	declare public _events: IStochasticOscillatorEvents;

	/**
	 * Series of the slow (%D) line.
	 */
	public slowSeries!: LineSeries;

	protected _afterNew() {
		this._themeTags.push("stochastic");

		super._afterNew();

		this._editableSettings.unshift(
			{
				key: "period",
				name: this.root.language.translateAny("Period"),
				type: "number",
				minValue: 2,
				maxValue: 50,
				step: 1
			}, {
			key: "seriesColor",
			name: this.root.language.translateAny("Period"),
			type: "color"
		}, {
			key: "kSmoothing",
			name: this.root.language.translateAny("K period"),
			type: "number",
			minValue: 1,
			maxValue: 20,
			step: 1
		},{
			key: "dSmoothing",
			name: this.root.language.translateAny("SMA period"),
			type: "number",
			minValue: 1,
			maxValue: 20,
			step: 1
		},  {
			key: "slowColor",
			name: this.root.language.translateAny("SMA period"),
			type: "color"
		}
		)

		this._setEditableSettingBounds("overBought", 70, 95, 1);
		this._setEditableSettingBounds("overSold", 5, 30, 1);

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

			this.series.updateData(data);
			this.slowSeries.updateData(data);
		}
	}
}