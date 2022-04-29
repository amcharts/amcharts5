import type { IIndicatorEditableSetting } from "./Indicator";
import type { IValueAxisDataItem } from "../../xy/axes/ValueAxis";
import type { DataItem } from "../../../core/render/Component";
import type { Color } from "../../../core/util/Color";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries, ILineSeriesAxisRange } from "../../xy/series/LineSeries";

export interface ICommodityChannelIndexSettings extends IChartIndicatorSettings {

	/**
	 * @todo review
	 */
	overBought?: number;

	/**
	 * @todo review
	 */
	overSold?: number;

	/**
	 * @todo review
	 */
	overBoughtColor?: Color;

	/**
	 * @todo review
	 */
	overSoldColor?: Color;

}

export interface ICommodityChannelIndexPrivate extends IChartIndicatorPrivate {
}

export interface ICommodityChannelIndexEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class CommodityChannelIndex extends ChartIndicator {
	public static className: string = "CommodityChannelIndex";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([CommodityChannelIndex.className]);

	declare public _settings: ICommodityChannelIndexSettings;
	declare public _privateSettings: ICommodityChannelIndexPrivate;
	declare public _events: ICommodityChannelIndexEvents;

	public overBought!: DataItem<IValueAxisDataItem>;
	public overSold!: DataItem<IValueAxisDataItem>;

	public overSoldRange!: ILineSeriesAxisRange;
	public overBoughtRange!: ILineSeriesAxisRange;

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
			key: "seriesColor",
			name: this.root.language.translateAny("Color"),
			type: "color"
		}, {
			key: "overBought",
			name: this.root.language.translateAny("Overbought"),
			type: "number"
		}, {
			key: "overBoughtColor",
			name: this.root.language.translateAny("Overbought"),
			type: "color"
		}, {
			key: "overSold",
			name: this.root.language.translateAny("Oversold"),
			type: "number"
		}, {
			key: "overSoldColor",
			name: this.root.language.translateAny("Oversold"),
			type: "color"
		}];

	protected _themeTag: string = "commoditychannelindex";

	protected _afterNew() {
		super._afterNew();

		//this.yAxis.setAll({ min: -100, max: 0, strictMinMax: true });

		// overbought range
		const overBought = this.yAxis.makeDataItem({});
		this.overBought = overBought;

		overBought.set("endValue", 1000);
		const overBoughtRange = this.series.createAxisRange(overBought);
		this.overBoughtRange = overBoughtRange;
		const overBoughtFills = overBoughtRange.fills;
		if (overBoughtFills) {
			overBoughtFills.template.set("themeTags", ["overbought", "fill"]);
		}

		const overBoughtGrid = overBought.get("grid");
		if (overBoughtGrid) {
			overBoughtGrid.setAll({ themeTags: ["overbought"], visible: true });
			overBoughtGrid._applyThemes();
		}

		const overBoughtLabel = overBought.get("label");
		if (overBoughtLabel) {
			overBoughtLabel.setAll({ themeTags: ["overbought"], visible: true, location: 0 });
			overBoughtLabel._applyThemes();
		}

		const overSold = this.yAxis.makeDataItem({});
		this.overSold = overSold;

		overSold.set("endValue", -1000);
		const overSoldRange = this.series.createAxisRange(overSold);
		this.overSoldRange = overSoldRange;
		const overSoldFills = overSoldRange.fills;
		if (overSoldFills) {
			overSoldFills.template.set("themeTags", ["oversold", "fill"]);
		}

		const overSoldGrid = overSold.get("grid");
		if (overSoldGrid) {
			overSoldGrid.setAll({ themeTags: ["oversold"], visible: true });
			overSoldGrid._applyThemes();
		}

		const overSoldLabel = overSold.get("label");
		if (overSoldLabel) {
			overSoldLabel.setAll({ themeTags: ["oversold"], visible: true, location: 0 });
			overSoldLabel._applyThemes();
		}
	}

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "cci",
			fill: undefined
		}))
	}

	public _updateChildren() {

		super._updateChildren();

		const overSoldValue = this.get("overSold", 100);
		const overBoughtValue = this.get("overBought", -100);

		if (this.isDirty("overBought")) {
			this.overBought.set("value", overBoughtValue);

			const label = this.overBought.get("label");
			if (label) {
				label.set("text", this.getNumberFormatter().format(overBoughtValue));
			}
		}

		if (this.isDirty("overSold")) {
			this.overSold.set("value", overSoldValue);

			const label = this.overSold.get("label");
			if (label) {
				label.set("text", this.getNumberFormatter().format(overSoldValue));
			}
		}

		if (this.isDirty("overSoldColor")) {
			const color = this.get("overSoldColor");
			const label = this.overSold.get("label");

			if (label) {
				label.set("fill", color);
			}

			this.overSold.get("grid")!.set("stroke", color);
			this.overSoldRange.fills!.template.set("fill", color);
			this.overSoldRange.strokes!.template.set("stroke", color);
		}

		if (this.isDirty("overBoughtColor")) {
			const color = this.get("overBoughtColor");
			const label = this.overBought.get("label");

			if (label) {
				label.set("fill", color);
			}

			this.overBought.get("grid")!.set("stroke", color);
			this.overBoughtRange.fills!.template.set("fill", color);
			this.overBoughtRange.strokes!.template.set("stroke", color);
		}

		let min = Math.min(overBoughtValue, overSoldValue)
		let max = Math.max(overBoughtValue, overSoldValue)

		this.series.get("yAxis").set("baseValue", min + (max - min) / 2);
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			this.set("field", "close");

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
					dataItem.cci = (value - ma) / (0.015 * meanDeviation);
				}
			}

			this.series.data.setAll(data);
		}
	}
}