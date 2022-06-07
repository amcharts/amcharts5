import type { IIndicatorEditableSetting } from "./Indicator";
import type { IValueAxisDataItem } from "../../xy/axes/ValueAxis";
import type { DataItem } from "../../../core/render/Component";
import type { Color } from "../../../core/util/Color";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries, ILineSeriesAxisRange } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IRelativeStrengthIndexSettings extends IChartIndicatorSettings {

	/**
	 * A value for "overbought" threshold.
	 */
	overBought?: number;

	/**
	 * A value for "oversold" threshold.
	 */
	overSold?: number;

	/**
	 * A color for "overbought" section.
	 */
	overBoughtColor?: Color;

	/**
	 * A color for "oversold" section.
	 */
	overSoldColor?: Color;

}

export interface IRelativeStrengthIndexPrivate extends IChartIndicatorPrivate {
}

export interface IRelativeStrengthIndexEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class RelativeStrengthIndex extends ChartIndicator {
	public static className: string = "RelativeStrengthIndex";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([RelativeStrengthIndex.className]);

	declare public _settings: IRelativeStrengthIndexSettings;
	declare public _privateSettings: IRelativeStrengthIndexPrivate;
	declare public _events: IRelativeStrengthIndexEvents;

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
			key: "field",
			name: this.root.language.translateAny("Field"),
			type: "dropdown",
			options: ["open", "close", "low", "high", "hl/2", "hlc/3", "hlcc/4", "ohlc/4"]
		}, {
			key: "seriesColor",
			name: this.root.language.translateAny("Color"),
			type: "color"
		},
		{
			key: "overBought",
			name: this.root.language.translateAny("Overbought"),
			type: "number"
		}, {
			key: "overSold",
			name: this.root.language.translateAny("Oversold"),
			type: "number"
		},
		{
			key: "overBought",
			name: this.root.language.translateAny("Overbought"),
			type: "number"
		}, {
			key: "overSold",
			name: this.root.language.translateAny("Oversold"),
			type: "number"
		},
		{
			key: "overBoughtColor",
			name: this.root.language.translateAny("Overbought"),
			type: "color"
		}, {
			key: "overSoldColor",
			name: this.root.language.translateAny("Oversold"),
			type: "color"
		}];

	protected _themeTag: string = "rsi";

	protected _afterNew() {
		super._afterNew();

		this.yAxis.setAll({ min: 0, max: 100, strictMinMax: true });

		// overbought range
		const overBought = this.yAxis.makeDataItem({});
		this.overBought = overBought;

		overBought.set("endValue", 100);
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

		overSold.set("endValue", 0);
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
			valueYField: "valueY",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _updateChildren() {

		super._updateChildren();

		const overSoldValue = this.get("overSold", 20);
		const overBoughtValue = this.get("overBought", 80);

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

		this.series.get("yAxis").set("baseValue", overSoldValue + (overBoughtValue - overSoldValue) / 2);
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
			let averageGain = 0;
			let averageLoss = 0;
			let prevAverageGain = 0;
			let prevAverageLoss = 0;
			$array.each(dataItems, (dataItem) => {
				let rsi = null;
				i++;

				if (i == period + 1) {
					for (let j = 1; j <= period; j++) {
						let value = dataItems[j].get("valueY", 0)
						let prevValue = dataItems[j - 1].get("valueY", 0);
						let change = value - prevValue;

						if (change > 0) {
							averageGain += change / period;
						}
						else {
							averageLoss += Math.abs(change) / period;
						}
					}

					rsi = 100 - (100 / (1 + averageGain / averageLoss));
				}
				else if (i > period) {
					let value = dataItem.get("valueY", 0);
					let prevValue = dataItems[i - 2].get("valueY", 0);

					let change = value - prevValue;

					let gain = 0;
					let loss = 0;

					if (change > 0) {
						gain = change;
					}
					else {
						loss = -change;
					}

					averageGain = (prevAverageGain * (period - 1) + gain) / period;
					averageLoss = (prevAverageLoss * (period - 1) + loss) / period;

					rsi = 100 - (100 / (1 + averageGain / averageLoss));
				}

				data.push({ valueX: dataItem.get("valueX"), valueY: rsi });

				prevAverageGain = averageGain;
				prevAverageLoss = averageLoss;
			})
			this.series.data.setAll(data);
		}
	}
}