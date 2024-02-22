import { OverboughtOversold, IOverboughtOversoldSettings, IOverboughtOversoldPrivate, IOverboughtOversoldEvents } from "./OverboughtOversold";
import * as $type from "../../../core/util/Type";

export interface ICommodityChannelIndexSettings extends IOverboughtOversoldSettings { }

export interface ICommodityChannelIndexPrivate extends IOverboughtOversoldPrivate { }

export interface ICommodityChannelIndexEvents extends IOverboughtOversoldEvents { }

/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class CommodityChannelIndex extends OverboughtOversold {
	public static className: string = "CommodityChannelIndex";
	public static classNames: Array<string> = OverboughtOversold.classNames.concat([CommodityChannelIndex.className]);

	declare public _settings: ICommodityChannelIndexSettings;
	declare public _privateSettings: ICommodityChannelIndexPrivate;
	declare public _events: ICommodityChannelIndexEvents;

	protected _afterNew() {

		this._themeTags.push("commoditychannelindex")

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
		}
		)
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			const dataItems = this.get("stockSeries").dataItems;
			let data = this._getTypicalPrice(dataItems);
			let period = this.get("period", 20);

			this._sma(data, period, "value_y", "sma");

			for (let i = 0, len = data.length; i < len; i++) {
				const dataItem = data[i];
				const value = dataItem.value_y;
				let ma = dataItem.sma;

				let meanDeviation = 0;
				if (i >= period - 1) {
					for (let j = i; j > i - period; j--) {
						let di = data[j];
						meanDeviation += Math.abs(di.value_y - ma)
					}
					meanDeviation = meanDeviation / period;

					let valueS = (value - ma) / (0.015 * meanDeviation);
					if ($type.isNumber(valueS)) {
						dataItem.valueS = valueS;
					}
				}
			}

			this.series.data.setAll(data);
		}
	}
}