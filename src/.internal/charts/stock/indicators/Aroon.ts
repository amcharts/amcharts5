import type { IIndicatorEditableSetting } from "./Indicator";
import { Color } from "../../../core/util/Color";
import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IAroonSettings extends IChartIndicatorSettings {

	/**
	 * Color for ups.
	 */
	upColor?: Color;

	/**
	 * Color for downs.
	 */
	downColor?: Color;

}

export interface IAroonPrivate extends IChartIndicatorPrivate {
}

export interface IAroonEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class Aroon extends ChartIndicator {
	public static className: string = "Aroon";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([Aroon.className]);

	declare public _settings: IAroonSettings;
	declare public _privateSettings: IAroonPrivate;
	declare public _events: IAroonEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	/**
	 * Indicator series for downs.
	 */
	declare public downSeries: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Period"),
		type: "number"
	}, {
		key: "upColor",
		name: this.root.language.translateAny("Aroon up"),
		type: "color"
	}, {
		key: "downColor",
		name: this.root.language.translateAny("Aroon down"),
		type: "color"
	}];

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "up",
			fill: undefined
		}))
	}

	protected _afterNew() {
		this._themeTags.push("aroon");
		super._afterNew();
		this.downSeries = this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "down",
			fill: undefined
		}))

		this.yAxis.setAll({ min: -1, max: 101, strictMinMax: true, numberFormat: "#'%'" });
	}

	public _updateChildren() {
		super._updateChildren();

		const upColor  = "upColor";
		if (this.isDirty(upColor)) {
			let color = this.get(upColor, Color.fromHex(0x00ff00));
			this._updateSeriesColor(this.series, color);
			this.setCustomData(upColor, color);
		}

		const downColor = "downColor";
		if (this.isDirty(downColor)) {
			let color = this.get(downColor, Color.fromHex(0xff0000));
			this._updateSeriesColor(this.downSeries, color);
			this.setCustomData(downColor, color);
		}
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

			let i = 0;
			$array.each(data, (dataItem) => {
				let b = Math.max(0, i - period);
				let h = -Infinity;
				let l = Infinity;

				let li = 0;
				let hi = 0;

				for (let j = b; j <= i; j++) {
					let vh = dataItems[j].get("highValueY", 0);
					if (vh >= h) {
						h = vh;
						hi = j;
					}

					let vl = dataItems[j].get("lowValueY", 0);
					if (vl <= l) {
						l = vl;
						li = j;
					}
				}

				dataItem.up = (period - (i - hi)) / period * 100;
				dataItem.down = (period - (i - li)) / period * 100;

				i++;
			})

			this.series.data.setAll(data);
			this.downSeries.data.setAll(data);
		}
	}
}