import type { Color } from "../../../core/util/Color";

import { OverboughtOversold, IOverboughtOversoldSettings, IOverboughtOversoldPrivate, IOverboughtOversoldEvents } from "./OverboughtOversold";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";

export interface IStochasticMomentumIndexSettings extends IOverboughtOversoldSettings {
	/**
	 * Color of the signal line.
	 */
	emaColor?: Color;

	/**
	 * Not used: the K period is set with `period`.
	 */
	kPeriod?: number;

	/**
	 * Period of the two exponential moving averages that smooth the index.
	 *
	 * @default 3
	 */
	dPeriod?: number;

	/**
	 * Period of the signal line, a moving average of the index.
	 *
	 * @default 3
	 */
	emaPeriod?: number;
}

export interface IStochasticMomentumIndexPrivate extends IOverboughtOversoldPrivate {
}

export interface IStochasticMomentumIndexEvents extends IOverboughtOversoldEvents {
}


/**
 * Stochastic Momentum Index indicator: where the price is relative to the
 * middle of the high-low range of the last `period` data items, smoothed and
 * scaled to `-100` to `100`. Drawn in a panel of its own.
 *
 * @since 5.5.3
 * @see {@link https://docs.amcharts.com/v5/charts/stock/indicators/} for more info
 */
export class StochasticMomentumIndex extends OverboughtOversold {
	public static className: string = "StochasticMomentumIndex";
	public static classNames: Array<string> = OverboughtOversold.classNames.concat([StochasticMomentumIndex.className]);

	declare public _settings: IStochasticMomentumIndexSettings;
	declare public _privateSettings: IStochasticMomentumIndexPrivate;
	declare public _events: IStochasticMomentumIndexEvents;

	/**
	 * Series of the signal line (`emaPeriod`).
	 */
	public emaSeries!: LineSeries;

	protected _afterNew() {
		this._themeTags.push("stochasticmomentum");

		super._afterNew();
		this._editableSettings.unshift(
			{
				key: "period",
				name: this.root.language.translateAny("K period"),
				type: "number",
				minValue: 2,
				maxValue: 30,
				step: 1
			}, {
			key: "seriesColor",
			name: this.root.language.translateAny("K period"),
			type: "color"
		}, {
			key: "dPeriod",
			name: this.root.language.translateAny("D period"),
			type: "number",
			minValue: 1,
			maxValue: 10,
			step: 1
		}, {
			key: "emaPeriod",
			name: this.root.language.translateAny("EMA period"),
			type: "number",
			minValue: 1,
			maxValue: 50,
			step: 1
		}, {
			key: "emaColor",
			name: this.root.language.translateAny("EMA period"),
			type: "color"
		}
		);

		this._setEditableSettingBounds("overBought", 30, 80, 1);
		this._setEditableSettingBounds("overSold", -80, -30, 1);

		const emaSeries = this.panel.series.push(LineSeries.new(this._root, {
			valueXField: "valueX",
			valueYField: "ema",
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			groupDataDisabled: true,
			themeTags: ["indicator", "ema"]
		}))

		this.emaSeries = emaSeries;
	}

	public _updateChildren() {
		if (this.isDirty("dPeriod") || this.isDirty("emaPeriod")) {
			this.markDataDirty();
			this.setCustomData("dPeriod", this.get("dPeriod"));
			this.setCustomData("emaPeriod", this.get("emaPeriod"));
		}

		super._updateChildren();

		if (this.isDirty("emaColor")) {
			this._updateSeriesColor(this.emaSeries, this.get("emaColor"), "emaColor")
		}
	}

	/**
	 * @ignore
	 * https://www.barchart.com/education/technical-indicators/stochastic_momentum_index
	 */
	public prepareData() {
		if (this.series) {
			const dataItems = this.get("stockSeries").dataItems;
			let kPeriod = this.get("period", 10);
			let data: Array<any> = [];
			let index = 0;

			$array.each(dataItems, (dataItem) => {
				const valueX = dataItem.get("valueX");
				let lp = Infinity;
				let hp = -lp;
				let hhh;
				let dhl;

				if (index >= kPeriod - 1) {
					let value = this._getValue(dataItem);

					if (value != null) {
						for (let j = index; j > index - kPeriod; j--) {
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

						let c = (hp + lp) / 2;
						hhh = value - c;
						dhl = hp - lp;
					}
				}

				if (hhh == null || $type.isNaN(hhh) || hhh === 0) {
					data.push({ valueX: valueX });
				}
				else {
					data.push({ valueX: valueX, hhh: hhh, dhl: dhl });
				}
				index++;
			})

			let dPeriod = this.get("dPeriod", 3);
			this._ema(data, dPeriod, "hhh", "hhh_ema");
			this._ema(data, dPeriod, "hhh_ema", "hhh_ema2");

			this._ema(data, dPeriod, "dhl", "dhl_ema");
			this._ema(data, dPeriod, "dhl_ema", "dhl_ema2");

			$array.each(data, (d) => {
				let hhh = d.hhh_ema2;
				let dhl = d.dhl_ema2;

				if (hhh != null && dhl != null) {
					d.valueS = d.hhh_ema2 / d.dhl_ema2 * 200;
				}
			})

			let emaPeriod = this.get("emaPeriod", 3);
			this._sma(data, emaPeriod, "valueS", "ema");

			this.series.updateData(data);
			this.emaSeries.updateData(data);
		}
	}
}