import type { IIndicatorEditableSetting } from "./Indicator";

import { Color } from "../../../core/util/Color";
import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { ColumnSeries } from "../../xy/series/ColumnSeries";

import * as $array from "../../../core/util/Array";

export interface IAwesomeOscillatorSettings extends IChartIndicatorSettings {

	/**
	 * Increasing color.
	 */
	increasingColor?: Color;

	/**
	 * Decreasing color.
	 */
	decreasingColor?: Color;

}

export interface IAwesomeOscillatorPrivate extends IChartIndicatorPrivate {
}

export interface IAwesomeOscillatorEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class AwesomeOscillator extends ChartIndicator {
	public static className: string = "AwesomeOscillator";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([AwesomeOscillator.className]);

	declare public _settings: IAwesomeOscillatorSettings;
	declare public _privateSettings: IAwesomeOscillatorPrivate;
	declare public _events: IAwesomeOscillatorEvents;

	/**
	 * Indicator series.
	 */
	declare public series: ColumnSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "increasingColor",
		name: this.root.language.translateAny("Increasing"),
		type: "color"
	}, {
		key: "decreasingColor",
		name: this.root.language.translateAny("Decreasing"),
		type: "color"
	}];


	public _afterNew(){
		this._themeTags.push("awesomeoscillator");
		super._afterNew();
	}	

	public _createSeries(): ColumnSeries {
		return this.panel.series.push(ColumnSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "ao",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _updateChildren() {
		super._updateChildren();

		const increasingColor= "increasingColor";
		const decreasingColor= "decreasingColor";

		if (this.isDirty(increasingColor) || this.isDirty(decreasingColor)) {
			const template = this.series.columns.template;
			const increasing = this.get(increasingColor);
			const decreasing = this.get(decreasingColor);
			template.states.create("riseFromPrevious", { fill: increasing, stroke: increasing });
			template.states.create("dropFromPrevious", { fill: decreasing, stroke: decreasing });
			this.markDataDirty();
		}
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			this.set("field", "hl/2");

			const dataItems = this.get("stockSeries").dataItems;

			let decreasingColor = this.get("decreasingColor", Color.fromHex(0xff0000)).toCSSHex();
			let increasingColor = this.get("increasingColor", Color.fromHex(0x00ff00)).toCSSHex();

			let data = this._getDataArray(dataItems);
			let period = 5;
			this._sma(data, 5, "value_y", "sma5");

			period = 34;
			this._sma(data, 34, "value_y", "sma34");

			let po = -Infinity;
			let i = 0;
			$array.each(data, (dataItem) => {
				i++;
				if (i >= period) {
					let o = dataItem.sma5 - dataItem.sma34
					let color = increasingColor;

					if (o < po) {
						color = decreasingColor;
					}

					dataItem.ao = o;
					dataItem.oscillatorColor = color;
					po = o;
				}
			})

			this.series.data.setAll(data);
		}
	}
}