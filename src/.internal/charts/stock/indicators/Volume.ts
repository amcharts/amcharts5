import type { IIndicatorEditableSetting } from "./Indicator";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { ColumnSeries } from "../../xy/series/ColumnSeries";
import { Color } from "../../../core/util/Color";

import * as $array from "../../../core/util/Array";

export interface IVolumeSettings extends IChartIndicatorSettings {

	/**
	 * An icreasing color.
	 */
	increasingColor?: Color;

	/**
	 * A decreasing color.
	 */
	decreasingColor?: Color;

}

export interface IVolumePrivate extends IChartIndicatorPrivate {
}

export interface IVolumeEvents extends IChartIndicatorEvents {
}

/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class Volume extends ChartIndicator {
	public static className: string = "Volume";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([Volume.className]);

	declare public _settings: IVolumeSettings;
	declare public _privateSettings: IVolumePrivate;
	declare public _events: IVolumeEvents;

	/**
	 * Indicator series.
	 */
	declare public series: ColumnSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "increasingColor",
		name: this.root.language.translateAny("Up volume"),
		type: "color"
	}, {
		key: "decreasingColor",
		name: this.root.language.translateAny("Down volume"),
		type: "color"
	}];

	public _afterNew(){
		this._themeTags.push("volume");
		super._afterNew();
		this.yAxis.set("numberFormat", "#.###a");
	}

	public _createSeries(): ColumnSeries {
		return this.panel.series.push(ColumnSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "volume",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _prepareChildren() {
		if (this.isDirty("increasingColor") || this.isDirty("decreasingColor")) {
			this.markDataDirty();
		}
		super._prepareChildren();
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			const volumeSeries = this.get("volumeSeries");
			const stockChart = this.get("stockChart");
			if (volumeSeries && stockChart) {
				const dataItems = volumeSeries.dataItems;

				this.setRaw("field", "close");

				let decreasingColor = this.get("decreasingColor", Color.fromHex(0xff0000));
				let increasingColor = this.get("increasingColor", Color.fromHex(0x00ff00));

				let data = this._getDataArray(dataItems);

				$array.each(data, (dataItem) => {
					dataItem.volume = dataItem.value_y;
				})
				this.series.data.setAll(data);

				$array.each(this.series.dataItems, (dataItem) => {
					const dataContext = dataItem.dataContext as any;
					dataContext.volumeColor = stockChart.getVolumeColor(dataItem, decreasingColor, increasingColor);
				})
			}
		}
	}
}