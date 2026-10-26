import type { XYSeries, IXYSeriesDataItem } from "../../xy/series/XYSeries";
import type { StockLegend } from "../StockLegend";
import type { StockChart } from "../StockChart";
import type { DataItem } from "../../../core/render/Component";
import type { Color } from "../../../core/util/Color";

import { Container, IContainerSettings, IContainerPrivate, IContainerEvents } from "../../../core/render/Container";
import { LineSeries } from "../../xy/series/LineSeries";
import { BaseColumnSeries } from "../../xy/series/BaseColumnSeries";
import { MultiDisposer } from "../../../core/util/Disposer";

import * as $array from "../../../core/util/Array";
import * as $math from "../../../core/util/Math";
import * as $type from "../../../core/util/Type";

export interface IIndicatorEditableSetting {

	/**
	 * Key of the indicator setting this field edits.
	 */
	key: string;

	/**
	 * Label of the field in the settings modal. Consecutive fields with the
	 * same name share one row.
	 */
	name: string;

	/**
	 * Kind of input the settings modal shows for the setting.
	 */
	type: "color" | "number" | "dropdown" | "checkbox" | "text";

	/**
	 * Smallest value allowed for a `"number"` setting.
	 *
	 * @since 5.8.1
	 */
	minValue?: number;

	/**
	 * Largest value allowed for a `"number"` setting.
	 *
	 * @since 5.20.0
	 */
	maxValue?: number;

	/**
	 * Step of the number input. A step of `1` or more also makes the setting a
	 * whole number: typed decimals are rounded.
	 *
	 * @since 5.20.0
	 */
	step?: number;

	/**
	 * Multiplier for showing the value in the settings modal: the input shows
	 * the stored value times `scale` and divides it back on save. For example,
	 * Acceleration Bands `factor` is stored in thousandths, so `scale: 1000`
	 * shows `0.001` as `1`.
	 *
	 * The stored value, `minValue`, `maxValue` and `step` stay in stored units.
	 *
	 * @since 5.20.0
	 */
	scale?: number;

	/**
	 * Items of a `"dropdown"`: strings, or objects with a `value` and a `text`.
	 * An option with `extTarget` (the key of a `"number"` field) sets that
	 * field to `extTargetValue` when picked, and its limits to
	 * `extTargetMinValue`, `extTargetMaxValue` and `extTargetStep`.
	 */
	options?: Array<string | {
		value: number | string,
		text: string,
		extTarget?: string,
		extTargetValue?: number | string,
		extTargetMinValue?: number,
		/** @since 5.20.0 */
		extTargetMaxValue?: number,
		/** @since 5.20.0 */
		extTargetStep?: number
	}>;

}

export interface IIndicatorSettings extends IContainerSettings {

	/**
	 * The [[StockChart]] the indicator belongs to.
	 */
	stockChart: StockChart;

	/**
	 * The series whose data the indicator is calculated from.
	 */
	stockSeries: XYSeries;

	/**
	 * The volume series, for indicators that use volume.
	 */
	volumeSeries?: XYSeries;

	/**
	 * A [[StockLegend]] to add the indicator to.
	 */
	legend?: StockLegend;

	/**
	 * Number of data items each value is calculated over.
	 */
	period?: number;

	/**
	 * Price to calculate from: `"open"`, `"close"`, `"low"`, `"high"`, or an
	 * average such as `"hl/2"` (high and low) or `"ohlc/4"` (all four).
	 */
	field?: "open" | "close" | "low" | "high" | "hl/2" | "hlc/3" | "hlcc/4" | "ohlc/4";

	/**
	 * Name of the indicator, such as "Moving Average".
	 */
	name?: string;

	/**
	 * Short name of the indicator, such as "MA", shown in the legend.
	 */
	shortName?: string;

	/**
	 * Color of the indicator's series.
	 */
	seriesColor?: Color;

	/**
	 * Opens the indicator's settings modal when the indicator is added from an
	 * [[IndicatorControl]].
	 *
	 * @default true
	 * @since 5.10.6
	 */
	autoOpenSettings?: boolean;

}

export interface IIndicatorPrivate extends IContainerPrivate {
}

export interface IIndicatorEvents extends IContainerEvents {
}

/**
 * Base class for [[StockChart]] indicators.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/stock/indicators/} for more info
 */
export abstract class Indicator extends Container {
	public static className: string = "Indicator";
	public static classNames: Array<string> = Container.classNames.concat([Indicator.className]);

	declare public _settings: IIndicatorSettings;
	declare public _privateSettings: IIndicatorPrivate;
	declare public _events: IIndicatorEvents;

	public _editableSettings: IIndicatorEditableSetting[] = [];

	public series!: XYSeries;

	protected _dataDirty = false;

	protected _sDP?: MultiDisposer;
	protected _vDP?: MultiDisposer;

	/**
	 * Brings numeric settings back within the `minValue`, `maxValue` and `step`
	 * of their `_editableSettings` entries, so an out-of-range value from the
	 * modal, a config or the API never reaches `prepareData()` (a huge one can
	 * freeze the page, as with Volume Profile). With `force`, checks every
	 * setting; otherwise only changed ones.
	 */
	public _clampSettings(force: boolean = false): void {
		$array.each(this._editableSettings, (setting) => {
			if (setting.type != "number") {
				return;
			}
			const key = setting.key as any;
			if (!force && !this.isDirty(key)) {
				return;
			}
			let value = this.get(key);
			if (!$type.isNumber(value)) {
				return;
			}
			let clamped = value;
			if (setting.step != null && setting.step >= 1) {
				clamped = Math.round(clamped);
			}
			clamped = $math.fitToRange(clamped, setting.minValue != null ? setting.minValue : -Infinity, setting.maxValue != null ? setting.maxValue : Infinity);
			if (clamped !== value) {
				// setRaw (not set): writes the value without marking the key dirty, so
				// clamping here can't re-enter the dirty cycle. (The per-setting
				// `on(key)` event still fires; that's harmless and the clamp converges.)
				this.setRaw(key, clamped as any);
			}
		});
	}

	/**
	 * Sets the numeric limits of an editable setting by key, for entries
	 * inherited from a base indicator (such as overbought and oversold) whose
	 * range differs per subclass.
	 */
	protected _setEditableSettingBounds(key: string, minValue?: number, maxValue?: number, step?: number): void {
		$array.each(this._editableSettings, (setting) => {
			if (setting.type == "number" && setting.key == key) {
				setting.minValue = minValue;
				setting.maxValue = maxValue;
				setting.step = step;
			}
		});
	}

	public _prepareChildren() {
		super._prepareChildren();

		this._clampSettings();

		if (this.isDirty("stockSeries") || this.isDirty("volumeSeries")) {
			this.markDataDirty();

			const stockSeries = this.get("stockSeries");
			const previousS = this._prevSettings.stockSeries;
			if (previousS && this._sDP) {
				this._sDP.dispose();
			}
			if (stockSeries) {
				this._sDP = new MultiDisposer([
					stockSeries.events.on("datavalidated", () => {
						this._markDataDirty();
					}),
					stockSeries.events.on("datasetchanged", () => {
						this._markDataDirty();
					})
				])
			}

			const previousV = this._prevSettings.volumeSeries;
			if (previousV && this._vDP) {
				this._vDP.dispose();
			}
			const volumeSeries = this.get("volumeSeries");
			if (volumeSeries) {
				this._vDP = new MultiDisposer([
					volumeSeries.events.on("datavalidated", () => {
						this._markDataDirty();
					}),
					volumeSeries.events.on("datasetchanged", () => {
						this._markDataDirty();
					})
				])
			}
		}

		if (this.isDirty("field")) {
			if (this.get("field")) {
				this.markDataDirty();
			}
		}

		if (this.isDirty("period")) {
			this.markDataDirty();
			this.setCustomData("period", this.get("period"));
		}


		if (this._dataDirty) {
			this.prepareData();
			this._dataDirty = false;
		}
	}

	protected _markDataDirty() {
		this._dataDirty = true;
		this.markDirty();
	}

	/**
	 * Recalculates the indicator's data after the current frame.
	 */
	public markDataDirty() {
		this._root.events.once("frameended", () => {
			this._markDataDirty();
		})
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("seriesColor")) {
			this._updateSeriesColor(this.series, this.get("seriesColor"), "seriesColor");
		}

		this.setCustomData("period", this.get("period"));
		this.setCustomData("field", this.get("field"));
		this.setCustomData("name", this.get("name"));
		this.setCustomData("shortName", this.get("shortName"));
	}

	protected _dispose() {
		super._dispose();

		if (this._sDP) {
			this._sDP.dispose();
		}
		if (this._vDP) {
			this._vDP.dispose();
		}

		const series = this.series;
		if (series) {
			series.dispose();

			const yAxis = series.get("yAxis");
			if (yAxis) {
				yAxis.markDirtySelectionExtremes();
			}
		}

		const stockChart = this.get("stockChart");
		if (stockChart) {
			const legend = this.get("legend");
			if (legend) {
				const legendDataItem = series.get("legendDataItem");
				if (legendDataItem) {
					legend.disposeDataItem(legendDataItem as any);
				}
			}
			stockChart.indicators.removeValue(this);
		}
	}

	public async hide(duration?: number): Promise<any> {
		return Promise.all([
			super.hide(duration),
			this.series.hide(duration)
		]);
	}

	public async show(duration?: number): Promise<any> {
		return Promise.all([
			super.show(duration),
			this.series.show(duration)
		]);
	}

	protected _handleLegend(series: XYSeries) {
		const legend = this.get("legend");
		if (legend) {
			legend.data.push(series);

			const legendDataItem = legend.dataItems[legend.dataItems.length - 1];
			legendDataItem.get("marker").set("forceHidden", true);

			const closeButton = legendDataItem.get("closeButton");
			closeButton.set("forceHidden", false);
			closeButton.events.on("click", () => {
				this.dispose();
			})

			const settingsButton = legendDataItem.get("settingsButton");
			settingsButton.setPrivate("customData", this);

			const editableSettings = this._editableSettings;
			if (!editableSettings || editableSettings.length == 0) {
				settingsButton.set("forceHidden", true);
			}
		}
	}

	protected _updateSeriesColor(series?: XYSeries, color?: Color, contextName?: string) {
		if (series) {
			series.set("stroke", color);
			series.set("fill", color);
			if (series instanceof LineSeries) {
				series.strokes.template.set("stroke", color);
				series.fills.template.set("fill", color);
			}

			if (series instanceof BaseColumnSeries) {
				series.columns.template.setAll({ stroke: color, fill: color });
			}

			if (contextName && color) {
				this.setCustomData(contextName, color.toCSSHex());
			}
		}
	}


	/**
	 * Stores a value in the indicator series' `customData`, where text such as
	 * a legend label can show it as `{name}`.
	 *
	 * @param  name   Key
	 * @param  value  Value
	 */
	public setCustomData(name: string, value?: any) {
		const customData = this.series.getPrivate("customData");
		if (customData) {
			customData[name] = value;
		}
	}


	/**
	 * @ignore
	 */
	public prepareData() {

	}

	protected _getValue(dataItem: DataItem<IXYSeriesDataItem>): number | undefined {
		const field = this.get("field");

		let o = dataItem.get("openValueY") as number;
		let h = dataItem.get("highValueY") as number;
		let l = dataItem.get("lowValueY") as number;
		let c = dataItem.get("valueY") as number;

		switch (field) {
			case "close":
				return c;
				break;
			case "open":
				return o;
				break;
			case "high":
				return h;
				break;
			case "low":
				return l;
				break;
			case "hl/2":
				return (h + l) / 2;
				break;
			case "hlc/3":
				return (h + l + c) / 3;
				break;
			case "hlcc/4":
				return (h + l + c + c) / 4;
				break;
			case "ohlc/4":
				return (o + h + l + c) / 4;
				break;
		}
	}

	/**
	 * @ignore
	 */
	protected _getDataArray(dataItems: Array<DataItem<any>>): Array<any> {
		const data: Array<any> = [];
		$array.each(dataItems, (dataItem) => {
			data.push({ valueX: dataItem.get("valueX"), value_y: this._getValue(dataItem) });
		})
		return data;
	}

	/**
	 * @ignore
	 */

	protected _getTypicalPrice(dataItems: Array<DataItem<any>>): Array<any> {
		const data: Array<any> = [];
		$array.each(dataItems, (dataItem) => {
			data.push({ valueX: dataItem.get("valueX"), value_y: (dataItem.get("valueY", 0) + dataItem.get("highValueY", 0) + dataItem.get("lowValueY", 0)) / 3 });
		})
		return data;
	}


	protected _sma(data: Array<any>, period: number, field: string, toField: string) {
		if (!data || data.length === 0 || period <= 0) {
			return;
		}

		const invPeriod = 1 / period;
		const len = data.length;

		let count = 0; // number of non-null values encountered
		let sum = 0;   // sum of values in the current window

		for (let i = 0; i < len; i++) {
			const dataItem = data[i];
			const value = dataItem[field];

			if (value != null) {
				count++;
				sum += value;

				// remove value that goes out of window (by index, to preserve original behavior)
				if (count > period) {
					const valueToRemove = data[i - period][field];
					if (valueToRemove != null) {
						sum -= valueToRemove;
					}
				}

				if (count >= period) {
					dataItem[toField] = sum * invPeriod;
				}
			}
		}
	}

	protected _wma(data: Array<any>, period: number, field: string, toField: string) {
		const denom = period * (period + 1) / 2;
		const buffer: number[] = new Array(period);
		let start = 0;
		let len = 0;
		let sum = 0;      // sum of values in the window
		let weighted = 0; // weighted sum (1*v1 + 2*v2 + ... + p*vp)

		for (let i = 0; i < data.length; i++) {
			const dataItem = data[i];
			const value = dataItem[field];

			if (value == null) {
				continue;
			}

			if (len < period) {

				const pos = (start + len) % period;
				buffer[pos] = value;
				len++;
				sum += value;
				weighted += len * value;

				if (len === period) {
					dataItem[toField] = weighted / denom;
				}
			}
			else {
				const oldest = buffer[start];
				weighted = weighted - sum + period * value;
				sum = sum - oldest + value;
				buffer[start] = value;
				start = (start + 1) % period;
				dataItem[toField] = weighted / denom;
			}
		}
	}


	protected _ema(data: Array<any>, period: number, field: string, toField: string) {
		const len = data.length;
		if (len === 0 || period <= 0) {
			return;
		}

		const invPeriod = 1 / period;
		const multiplier = 2 / (1 + period);
		const oneMinus = 1 - multiplier;

		let ma = 0;
		let count = 0;

		for (let i = 0; i < len; i++) {
			const dataItem = data[i];
			const value = dataItem[field];

			if (value == null) {
				continue;
			}

			count++;

			if (count > period) {
				ma = value * multiplier + ma * oneMinus;
				dataItem[toField] = ma;
			}
			else {
				ma += value * invPeriod;
				if (count === period) {
					dataItem[toField] = ma;
				}
			}
		}
	}

	protected _dema(data: Array<any>, period: number, field: string, toField: string) {
		if (period <= 0 || data.length === 0) {
			return;
		}

		const multiplier = 2 / (1 + period);
		const oneMinus = 1 - multiplier;
		const invPeriod = 1 / period;

		let ema = 0;
		let emaCount = 0;

		let ema2 = 0;
		let ema2Count = 0;

		for (let i = 0, len = data.length; i < len; i++) {
			const dataItem = data[i];
			const value = dataItem[field];

			if (value == null) {
				continue;
			}

			// compute EMA (same logic as _ema)
			emaCount++;
			if (emaCount > period) {
				ema = value * multiplier + ema * oneMinus;
				dataItem.ema = ema;
			}
			else {
				ema += value * invPeriod;
				if (emaCount === period) {
					dataItem.ema = ema;
				}
			}

			// if EMA was produced for this item, update EMA of EMA (ema2) and DEMA
			const emaVal = dataItem.ema;
			if (emaVal != null) {
				ema2Count++;
				if (ema2Count > period) {
					ema2 = emaVal * multiplier + ema2 * oneMinus;
					dataItem[toField] = 2 * emaVal - ema2;
					dataItem.ema2 = ema2;
				}
				else {
					ema2 += emaVal / period;
					if (ema2Count === period) {
						dataItem[toField] = 2 * emaVal - ema2;
						dataItem.ema2 = ema2;
					}
				}
			}
		}
	}

	protected _tema(data: Array<any>, period: number, field: string, toField: string) {
		if (period <= 0 || data.length === 0) {
			return;
		}

		const multiplier = 2 / (1 + period);
		const oneMinus = 1 - multiplier;

		// Ensure ema and ema2 are present
		this._dema(data, period, field, "dema");

		let ema3 = 0;
		let count = 0;
		for (let i = 0, len = data.length; i < len; i++) {
			const dataItem = data[i];
			const ema = dataItem.ema;
			const ema2 = dataItem.ema2;

			if (ema2 == null) {
				continue;
			}

			count++;
			if (count > period) {
				ema3 = ema2 * multiplier + ema3 * oneMinus;
				// guard ema just in case (should be present when ema2 is)
				const emaVal = (ema == null) ? 0 : ema;
				dataItem[toField] = 3 * emaVal - 3 * ema2 + ema3;
			}
			else {
				ema3 += ema2 / period;
				if (count === period) {
					const emaVal = (ema == null) ? 0 : ema;
					dataItem[toField] = 3 * emaVal - 3 * ema2 + ema3;
				}
			}
		}
	}
}
