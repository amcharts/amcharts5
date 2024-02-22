import { OverboughtOversold, IOverboughtOversoldSettings, IOverboughtOversoldPrivate, IOverboughtOversoldEvents } from "./OverboughtOversold";
import { LineSeries } from "../../xy/series/LineSeries";
import type { Color } from "../../../core/util/Color";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";

export interface IRelativeStrengthIndexSettings extends IOverboughtOversoldSettings {
	/**
	 * EMA period.
	 */
	smaPeriod?: number;

	/**
	 * A color for "ema" line.
	 */
	smaColor?: Color;
}

export interface IRelativeStrengthIndexPrivate extends IOverboughtOversoldPrivate { }

export interface IRelativeStrengthIndexEvents extends IOverboughtOversoldEvents { }

/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class RelativeStrengthIndex extends OverboughtOversold {
	public static className: string = "RelativeStrengthIndex";
	public static classNames: Array<string> = OverboughtOversold.classNames.concat([RelativeStrengthIndex.className]);

	declare public _settings: IRelativeStrengthIndexSettings;
	declare public _privateSettings: IRelativeStrengthIndexPrivate;
	declare public _events: IRelativeStrengthIndexEvents;

	/**
	 * Indicator series.
	 */
	public smaSeries!: LineSeries;

	protected _afterNew() {

		this._themeTags.push("rsi");
		super._afterNew();
		this._editableSettings.unshift({
			key: "period",
			name: this.root.language.translateAny("Period"),
			type: "number"
		}, {
			key: "seriesColor",
			name: this.root.language.translateAny("Period"),
			type: "color"
		}, {
			key: "field",
			name: this.root.language.translateAny("Field"),
			type: "dropdown",
			options: ["open", "close", "low", "high", "hl/2", "hlc/3", "hlcc/4", "ohlc/4"]
		}, {
			key: "smaPeriod",
			name: this.root.language.translateAny("SMA period"),
			type: "number"
		}, {
			key: "smaColor",
			name: this.root.language.translateAny("SMA period"),
			type: "color"
		})

		const smaSeries = this.panel.series.push(LineSeries.new(this._root, {
			valueXField: "valueX",
			valueYField: "sma",
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			groupDataDisabled: true,
			themeTags: ["indicator", "sma"]
		}))

		this.smaSeries = smaSeries;
	}

	public _updateChildren() {
		super._updateChildren();
		if (this.isDirty("smaColor")) {
			this._updateSeriesColor(this.smaSeries, this.get("smaColor"), "smaColor")
		}
		if (this.isDirty("smaPeriod")) {
			this.markDataDirty();
			this.setCustomData("smaPeriod", this.get("smaPeriod"));
		}
	}



	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			const dataItems = this.get("stockSeries").dataItems;
			let period = this.get("period", 14);
			const data: Array<any> = [];
			let i = 0;
			let averageGain = 0;
			let averageLoss = 0;
			let prevAverageGain = 0;
			let prevAverageLoss = 0;
			$array.each(dataItems, (dataItem) => {
				let rsi = null;
				i++;
	
				if (i == period + 1) {
					for (let j = 1; j <= period; j++) {
						let value = this._getValue(dataItems[j]);
						let prevValue = this._getValue(dataItems[j - 1]);
						if (value != undefined && prevValue != undefined) {
							let change = value - prevValue;

							if (change >= 0) {
								averageGain += change / period;
							}
							else {
								averageLoss += Math.abs(change) / period;
							}
						}
					}

					rsi = 100 - (100 / (1 + averageGain / averageLoss));

					if($type.isNaN(rsi)){
						rsi = 0;
					}
				}
				else if (i > period) {
					let value = this._getValue(dataItem);
					let prevValue = this._getValue(dataItems[i - 2]);
					if (value != null && prevValue != null) {
						let change = value - prevValue;

						let gain = 0;
						let loss = 0;

						if (change > 0) {
							gain = change;
						}
						else {
							loss = -change;
						}

						averageGain = (prevAverageGain * (period - 1) + gain) / period;
						averageLoss = (prevAverageLoss * (period - 1) + loss) / period;

						rsi = 100 - (100 / (1 + averageGain / averageLoss));


						if(isNaN(rsi)){
							rsi = 0;
						}						
					}
				}

				data.push({ valueX: dataItem.get("valueX"), valueS: rsi });

				prevAverageGain = averageGain;
				prevAverageLoss = averageLoss;
			})
			this.series.data.setAll(data);

			period = this.get("smaPeriod", 3);
			this._sma(data, period, "valueS", "sma");

			this.series.data.setAll(data);
			this.smaSeries.data.setAll(data);
		}
	}
}