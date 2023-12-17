import type { IIndicatorEditableSetting } from "./Indicator";

import { Color } from "../../../core/util/Color";
import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { ColumnSeries } from "../../xy/series/ColumnSeries";

import * as $array from "../../../core/util/Array";

export interface IMovingAverageDeviationSettings extends IChartIndicatorSettings {

	/**
	 * Increasing color.
	 */
	increasingColor?: Color;

	/**
	 * Decreasing color.
	 */
	decreasingColor?: Color;

	/**
	 * Type of the moving average.
	 *
	 * @default "simple"
	 */
	type?: "simple" | "weighted" | "exponential" | "dema" | "tema";

	/**
	 * How units are calculated.
	 *
	 * @default "points"
	 */
	unit?: "points" | "percent"

}

export interface IMovingAverageDeviationPrivate extends IChartIndicatorPrivate {
}

export interface IMovingAverageDeviationEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class MovingAverageDeviation extends ChartIndicator {
	public static className: string = "MovingAverageDeviation";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([MovingAverageDeviation.className]);

	declare public _settings: IMovingAverageDeviationSettings;
	declare public _privateSettings: IMovingAverageDeviationPrivate;
	declare public _events: IMovingAverageDeviationEvents;

	/**
	 * Indicator series.
	 */
	declare public series: ColumnSeries;

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
			key: "type",
			name: this.root.language.translateAny("Type"),
			type: "dropdown",
			options: ["simple", "weighted", "exponential", "dema", "tema"]
		}, {
			key: "unit",
			name: this.root.language.translateAny("Points/Percent"),
			type: "dropdown",
			options: ["points", "percent"]
		},
		{
			key: "increasingColor",
			name: this.root.language.translateAny("Increasing"),
			type: "color"
		}, {
			key: "decreasingColor",
			name: this.root.language.translateAny("Decreasing"),
			type: "color"
		}];

	public _afterNew(){
		this._themeTags.push("movingaveragedeviation");
		super._afterNew();
	}		

	public _createSeries(): ColumnSeries {
		return this.panel.series.push(ColumnSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "deviation",
			fill: undefined
		}))
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("increasingColor") || this.isDirty("decreasingColor")) {
			const template = this.series.columns.template;
			const increasing = this.get("increasingColor");
			const decreasing = this.get("decreasingColor");
			template.states.create("riseFromPrevious", { fill: increasing, stroke: increasing });
			template.states.create("dropFromPrevious", { fill: decreasing, stroke: decreasing });
		}

	}

	public _prepareChildren() {
		if (this.isDirty("type") || this.isDirty("unit")) {
			this.markDataDirty();
		}
		super._prepareChildren();
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			const dataItems = this.get("stockSeries").dataItems;

			let decreasingColor = this.get("decreasingColor", Color.fromHex(0xff0000)).toCSSHex();
			let increasingColor = this.get("increasingColor", Color.fromHex(0x00ff00)).toCSSHex();

			let data = this._getDataArray(dataItems);
			let period = this.get("period", 50);
			const type = this.get("type");
			const unit = this.get("unit");

			switch (type) {
				case "simple":
					this._sma(data, period, "value_y", "ma");
					break;

				case "weighted":
					this._wma(data, period, "value_y", "ma");
					break;

				case "exponential":
					this._ema(data, period, "value_y", "ma");
					break;

				case "dema":
					this._dema(data, period, "value_y", "ma");
					break;

				case "tema":
					this._tema(data, period, "value_y", "ma");
					break;
			}


			let previous = -Infinity;
			let i = 0;
			$array.each(data, (dataItem) => {
				i++;
				if (i >= period) {
					let deviation = dataItem.value_y - dataItem.ma;
					if (unit == "percent") {
						deviation = (dataItem.value_y / dataItem.ma - 1) * 100;
					}
					let color = increasingColor;

					if (deviation < previous) {
						color = decreasingColor;
					}

					dataItem.deviation = deviation;
					dataItem.deviationColor = color;
					previous = deviation;
				}
			})

			this.series.data.setAll(data);
		}
	}
}