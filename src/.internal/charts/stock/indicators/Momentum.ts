import type { IIndicatorEditableSetting } from "./Indicator";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IMomentumSettings extends IChartIndicatorSettings {
}

export interface IMomentumPrivate extends IChartIndicatorPrivate {
}

export interface IMomentumEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 * @since 5.4.8
 */
export class Momentum extends ChartIndicator {
	public static className: string = "Momentum";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([Momentum.className]);

	declare public _settings: IMomentumSettings;
	declare public _privateSettings: IMomentumPrivate;
	declare public _events: IMomentumEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [
		{
			key: "period",
			name: this.root.language.translateAny("Period"),
			type: "number"
		}, {
			key: "field",
			name: this.root.language.translateAny("Field"),
			type: "dropdown",
			options: ["open", "close", "low", "high", "hl/2", "hlc/3", "hlcc/4", "ohlc/4"]
		}, {
			key: "seriesColor",
			name: this.root.language.translateAny("Color"),
			type: "color"
		}
	];

	public _afterNew(){
		this._themeTags.push("momentum");
		super._afterNew();
	}		

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "valueY",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			const dataItems = this.get("stockSeries").dataItems;
			const period = this.get("period", 14);
			const data: Array<any> = [];

			let i = 0;

			$array.each(dataItems, (dataItem) => {
				if (i > period) {
					let value = this._getValue(dataItem);
					let prevValue = this._getValue(dataItems[i - period]);

					if (value != undefined && prevValue != undefined) {
						data.push({ valueX: dataItem.get("valueX"), valueY: value - prevValue });
					}
				}
				else {
					data.push({ valueX: dataItem.get("valueX") });
				}
				i++;
			})


			this.series.data.setAll(data);
		}
	}
}