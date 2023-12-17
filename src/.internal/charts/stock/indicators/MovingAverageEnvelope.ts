import type { IIndicatorEditableSetting } from "./Indicator";
import type { Color } from "../../../core/util/Color";

import { MovingAverage, IMovingAverageSettings, IMovingAveragePrivate, IMovingAverageEvents } from "./MovingAverage";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IMovingAverageEnvelopeSettings extends IMovingAverageSettings {

	/**
	 * Shift.
	 *
	 * @default 5
	 */
	shift?: number;

	/**
	 * Type of the shift.
	 *
	 * @default "percent"
	 */
	shiftType?: "percent" | "points";

	/**
	 * A color for upper section.
	 */
	upperColor?: Color;

	/**
	 *  A color for lower section.
	 */
	lowerColor?: Color;

}

export interface IMovingAverageEnvelopePrivate extends IMovingAveragePrivate {
}

export interface IMovingAverageEnvelopeEvents extends IMovingAverageEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class MovingAverageEnvelope extends MovingAverage {
	public static className: string = "MovingAverageEnvelope";
	public static classNames: Array<string> = MovingAverage.classNames.concat([MovingAverageEnvelope.className]);

	declare public _settings: IMovingAverageEnvelopeSettings;
	declare public _privateSettings: IMovingAverageEnvelopePrivate;
	declare public _events: IMovingAverageEnvelopeEvents;

	/**
	 * Indicator series for the upper band.
	 */
	public upperBandSeries!: LineSeries;

	/**
	 * Indicator series for the lower band.
	 */
	public lowerBandSeries!: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "period",
		name: this.root.language.translateAny("Period"),
		type: "number"
	}, {
		key: "type",
		name: this.root.language.translateAny("Type"),
		type: "dropdown",
		options: ["simple", "weighted", "exponential", "dema", "tema"]
	}, {
		key: "field",
		name: this.root.language.translateAny("Field"),
		type: "dropdown",
		options: ["open", "close", "low", "high", "hl/2", "hlc/3", "hlcc/4", "ohlc/4"]
	}, {
		key: "shiftType",
		name: this.root.language.translateAny("Shift type"),
		type: "dropdown",
		options: ["percent", "points"]
	}, {
		key: "shift",
		name: this.root.language.translateAny("Shift"),
		type: "number"
	}, {
		key: "offset",
		name: this.root.language.translateAny("Offset"),
		type: "number"
	}, {
		key: "upperColor",
		name: this.root.language.translateAny("Top"),
		type: "color"
	}, {
		key: "seriesColor",
		name: this.root.language.translateAny("Median"),
		type: "color"
	}, {
		key: "lowerColor",
		name: this.root.language.translateAny("Bottom"),
		type: "color"
	}];

	protected _afterNew() {

		const stockSeries = this.get("stockSeries");
		const chart = stockSeries.chart;

		if (chart) {
			const upperBandSeries = chart.series.push(LineSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "upper",
				openValueYField: "lower",
				xAxis: stockSeries.get("xAxis"),
				yAxis: stockSeries.get("yAxis"),
				groupDataDisabled: true,
				calculateAggregates: true,
				themeTags: ["indicator", "movingaverageenvelope", "upper"]
			}))

			upperBandSeries.fills.template.set("visible", true);
			upperBandSeries.setPrivate("baseValueSeries", stockSeries);

			this.upperBandSeries = upperBandSeries;

			const lowerBandSeries = chart.series.push(LineSeries.new(this._root, {
				valueXField: "valueX",
				valueYField: "lower",
				xAxis: stockSeries.get("xAxis"),
				yAxis: stockSeries.get("yAxis"),
				groupDataDisabled: true,
				calculateAggregates: true,
				themeTags: ["indicator", "movingaverageenvelope", "lower"]
			}))

			lowerBandSeries.setPrivate("baseValueSeries", stockSeries);
			this.lowerBandSeries = lowerBandSeries;
		}

		super._afterNew();
		this.series.addTag("movingaverageenvelope");
		this.series._applyThemes();
	}

	public _updateChildren() {
		super._updateChildren();
		if (this.isDirty("upperColor")) {
			const color = this.get("upperColor");
			const upperBandSeries = this.upperBandSeries;
			upperBandSeries.set("stroke", color);
			upperBandSeries.set("fill", color);
			upperBandSeries.strokes.template.set("stroke", color);

			this._updateSeriesColor(upperBandSeries, color, "upperColor");
		}

		if (this.isDirty("lowerColor")) {
			const color = this.get("lowerColor");
			const lowerBandSeries = this.lowerBandSeries;
			lowerBandSeries.set("stroke", color);
			lowerBandSeries.strokes.template.set("stroke", color);

			this._updateSeriesColor(lowerBandSeries, color, "lowerColor");
		}

	}

	public _prepareChildren() {
		if (this.isDirty("shiftType") || this.isDirty("shift")) {
			this.markDataDirty();
			this.setCustomData("shift", this.get("shift"));
			this.setCustomData("shiftType", this.get("shiftType"));
		}
		super._prepareChildren();
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		super.prepareData();

		if (this.series) {
			let smaData = this.series.data.values as any;
			let shift = Number(this.get("shift", 5));
			let shiftType = this.get("shiftType");

			$array.each(smaData, (dataItem: any) => {
				let value = dataItem.ma;
				if (value != null) {
					let upper = value;
					let lower = value;
					if (shiftType == "points") {
						upper += shift;
						lower -= shift;
					}
					else {
						upper += upper * shift / 100;
						lower -= lower * shift / 100;
					}

					dataItem.upper = upper;
					dataItem.lower = lower;
				}
			})

			this.upperBandSeries.data.setAll(smaData);
			this.lowerBandSeries.data.setAll(smaData);
		}
	}

	protected _dispose() {
		this.upperBandSeries.dispose();
		this.lowerBandSeries.dispose();
		super._dispose();
	}

	public async hide(duration?: number): Promise<any> {
		return Promise.all([
			super.hide(duration),
			this.upperBandSeries.hide(duration),
			this.lowerBandSeries.hide(duration)
		]);
	}

	public async show(duration?: number): Promise<any> {
		return Promise.all([
			super.show(duration),
			this.upperBandSeries.show(duration),
			this.lowerBandSeries.show(duration)
		]);
	}
}