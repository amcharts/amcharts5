import type { IIndicatorEditableSetting } from "./Indicator";
import type { XYSeries } from "../../xy/series/XYSeries";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

export interface IAccumulationDistributionSettings extends IChartIndicatorSettings {

	/**
	 * Main volume series of the [[StockChart]].
	 */
	volumeSeries?: XYSeries;

	/**
	 * Use volume series (if set)?
	 */
	useVolume?: boolean;

}

export interface IAccumulationDistributionPrivate extends IChartIndicatorPrivate {

}

export interface IAccumulationDistributionEvents extends IChartIndicatorEvents {

}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class AccumulationDistribution extends ChartIndicator {
	public static className: string = "AccumulationDistribution";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([AccumulationDistribution.className]);

	declare public _settings: IAccumulationDistributionSettings;
	declare public _privateSettings: IAccumulationDistributionPrivate;
	declare public _events: IAccumulationDistributionEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "seriesColor",
		name: this.root.language.translateAny("Color"),
		type: "color"
	}, {
		key: "useVolume",
		name: this.root.language.translateAny("Use Volume"),
		type: "checkbox"
	}];

	public _afterNew() {
		this._themeTags.push("accumulationdistribution");
		super._afterNew();
		this.yAxis.set("numberFormat", "#.###a");
	}

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "ad",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _prepareChildren() {
		const useVolume = "useVolume";
		if (this.isDirty(useVolume)) {
			this.markDataDirty();
			this.setCustomData(useVolume, this.get(useVolume) ? "Y" : "N");
		}
		super._prepareChildren();
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (!this.series) {
			return;
		}

		const stockSeries = this.get("stockSeries") as any;
		const dataItems = stockSeries?.dataItems ?? [];
		const volumeSeries = this.get("volumeSeries") as XYSeries | undefined;
		this.setRaw("field", "close");

		const data: Array<any> = this._getDataArray(dataItems);
		const useVolume = !!this.get("useVolume");
		const volItems = useVolume && volumeSeries ? volumeSeries.dataItems : undefined;

		let prevAD = 0;
		for (let i = 0, len = dataItems.length; i < len; i++) {
			const dataItem = dataItems[i];
			const close = dataItem.get("valueY") as number | undefined;
			if (close == null) {
				continue;
			}

			const low = dataItem.get("lowValueY", close) as number;
			const high = dataItem.get("highValueY", close) as number;
			const range = high - low;

			const mf = range === 0 ? 0 : ((close - low) - (high - close)) / range;

			let volume = 1;
			if (volItems) {
				const vdi = volItems[i];
				if (vdi) {
					const v = vdi.get("valueY");
					volume = v != null ? (v as number) : 1;
				}
			}

			const ad = prevAD + mf * volume;
			data[i].ad = ad;
			prevAD = ad;
		}

		this.series.updateData(data);
	}
}
