import { OverboughtOversold, IOverboughtOversoldSettings, IOverboughtOversoldPrivate, IOverboughtOversoldEvents } from "./OverboughtOversold";

export interface IWilliamsRSettings extends IOverboughtOversoldSettings { }

export interface IWilliamsRPrivate extends IOverboughtOversoldPrivate { }

export interface IWilliamsREvents extends IOverboughtOversoldEvents { }

/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class WilliamsR extends OverboughtOversold {
	public static className: string = "WilliamsR";
	public static classNames: Array<string> = OverboughtOversold.classNames.concat([WilliamsR.className]);

	declare public _settings: IWilliamsRSettings;
	declare public _privateSettings: IWilliamsRPrivate;
	declare public _events: IWilliamsREvents;


	protected _afterNew() {
		this._themeTags.push("williamsr");
		super._afterNew();

		this._editableSettings.unshift({
			key: "period",
			name: this.root.language.translateAny("Period"),
			type: "number"
		}, {
			key: "seriesColor",
			name: this.root.language.translateAny("Period"),
			type: "color"
		});
	}


	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			this.set("field", "close");

			const dataItems = this.get("stockSeries").dataItems;
			let data = this._getDataArray(dataItems);
			let period = this.get("period", 14);

			for (let i = 0, len = data.length; i < len; i++) {
				const dataItem = data[i];

				let h = -Infinity;
				let l = Infinity;
				let b = Math.max(0, i - period);
				for (let j = b; j <= i; j++) {

					let vh = dataItems[j].get("highValueY", 0);
					if (vh >= h) {
						h = vh;
					}

					let vl = dataItems[j].get("lowValueY", 0);
					if (vl <= l) {
						l = vl;
					}
				}

				if (h - l != 0) {
					dataItem.valueS = -100 * (h - dataItem.value_y) / (h - l);
				}
			}

			this.series.data.setAll(data);
		}
	}
}