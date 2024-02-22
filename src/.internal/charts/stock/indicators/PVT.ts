import type { IIndicatorEditableSetting } from "./Indicator";
import type { XYSeries } from "../../xy/series/XYSeries";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";
import * as $type from "../../../core/util/Type";

export interface IPVTSettings extends IChartIndicatorSettings {

	/**
	 * Chart's main volume series.
	 */
	volumeSeries: XYSeries;

}

export interface IPVTPrivate extends IChartIndicatorPrivate {
}

export interface IPVTEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class PVT extends ChartIndicator {
	public static className: string = "PVT";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([PVT.className]);

	declare public _settings: IPVTSettings;
	declare public _privateSettings: IPVTPrivate;
	declare public _events: IPVTEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "seriesColor",
		name: this.root.language.translateAny("Color"),
		type: "color"
	}];

	public _afterNew() {
		this._themeTags.push("pvt");
		super._afterNew();
		this.yAxis.set("numberFormat", "#.###a");
	}

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "pvt",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {

			this.setRaw("field", "close");

			const dataItems = this.get("stockSeries").dataItems;
			const volumeSeries = this.get("volumeSeries");

			let data: Array<any> = this._getDataArray(dataItems);
			let previous = 0;
			let len = data.length;

			//PVT = [((CurrentClose - PreviousClose) / PreviousClose) x Volume] + PreviousPVT

			if (volumeSeries && len > 1) {
				let cy = data[0].value_y as number;

				for (let i = 1; i < len; i++) {
					const dataItem = data[i];

					let c = dataItem.value_y;

					if (c != null && $type.isNumber(c) && c != 0) {
						const volumeDI = volumeSeries.dataItems[i];
						let volume = 0;
						if (volumeDI) {
							volume = volumeDI.get("valueY", 1);
						}

						let pvt = (((c - cy) / cy) * volume) + previous;

						dataItem.pvt = pvt;

						previous = pvt;
						cy = c;
					}
				}
			}

			this.series.data.setAll(data);
		}
	}
}