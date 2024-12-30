import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { CandlestickSeries } from "../../xy/series/CandlestickSeries";

import type { IIndicatorEditableSetting } from "./Indicator";
import type { Color } from "../../../core/util/Color";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";

export interface IHeikinAshiSettings extends IChartIndicatorSettings {

	/**
	 * Increasing color.
	 */
	increasingColor?: Color;

	/**
	 * Decreasing color.
	 */
	decreasingColor?: Color;

}

export interface IHeikinAshiPrivate extends IChartIndicatorPrivate {
}

export interface IHeikinAshiEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class HeikinAshi extends ChartIndicator {
	public static className: string = "HeikinAshi";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([HeikinAshi.className]);

	declare public _settings: IHeikinAshiSettings;
	declare public _privateSettings: IHeikinAshiPrivate;
	declare public _events: IHeikinAshiEvents;

	/**
	 * Indicator series.
	 */
	declare public series: CandlestickSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "increasingColor",
		name: this.root.language.translateAny("Increasing"),
		type: "color"
	}, {
		key: "decreasingColor",
		name: this.root.language.translateAny("Decreasing"),
		type: "color"
	}];


	public _afterNew() {
		this._themeTags.push("heikinashi");
		super._afterNew();
	}

	public _createSeries(): CandlestickSeries {
		return this.panel.series.push(CandlestickSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			openValueYField: "value_o",
			valueYField: "value_y",
			lowValueYField: "value_l",
			highValueYField: "value_h",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _updateChildren() {
		super._updateChildren();

		const increasingColor = "increasingColor";
		const decreasingColor = "decreasingColor";

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

			if (dataItems.length > 0) {
				const data: any = [];

				const firstDataItem = dataItems[0];
				let prevOpen = firstDataItem.get("openValueY", 0);
				let prevClose = firstDataItem.get("valueY", 0);

				$array.each(dataItems, (dataItem) => {

					const open = dataItem.get("openValueY");
					const close = dataItem.get("valueY");
					const high = dataItem.get("highValueY");
					const low = dataItem.get("lowValueY");

					if ($type.isNumber(open) && $type.isNumber(close) && $type.isNumber(high) && $type.isNumber(low)) {

						const newClose = (open + close + high + low) / 4;
						const newOpen = (prevOpen + prevClose) / 2;

						const newHigh = Math.max(high, newOpen, newClose);
						const newLow = Math.min(low, newOpen, newClose);

						data.push({
							valueX: dataItem.get("valueX"),
							value_o: newOpen,
							value_y: newClose,
							value_h: newHigh,
							value_l: newLow
						});

						prevOpen = newOpen;
						prevClose = newClose;
					}
				})

				this.series.data.setAll(data);
			}
		}
	}
}