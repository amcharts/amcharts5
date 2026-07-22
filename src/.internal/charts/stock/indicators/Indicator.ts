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
	 * Setting key.
	 */
	key: string;

	/**
	 * Name of the setting (displayed in edit modal).
	 *
	 * Settings with the same name will be grouped in modal.
	 */
	name: string;

	/**
	 * Type of the control to show for editing the setting in modal.
	 */
	type: "color" | "number" | "dropdown" | "checkbox" | "text";

	/**
	 * Minimum numeric value allowable in this field.
	 *
	 * @since 5.8.1
	 */
	minValue?: number;

	/**
	 * Maximum numeric value allowable in this field.
	 *
	 * @since 5.20.0
	 */
	maxValue?: number;

	/**
	 * Step for the numeric input. A step of `1` also marks the setting as an
	 * integer, so typed decimals are rounded to whole numbers.
	 *
	 * @since 5.20.0
	 */
	step?: number;

	/**
	 * Display multiplier for the settings modal only. The value shown/edited in
	 * the UI is `stored value × scale`, and it is divided back on save. Use it
	 * when a setting's stored unit is awkward to show — e.g. Acceleration Bands
	 * `factor` is stored in thousandths, so `scale: 1000` displays the
	 * conventional `1` (= single band width) instead of `0.001`.
	 *
	 * Does NOT affect the stored/serialized value, the API, or `minValue`/
	 * `maxValue`/`step` — those all stay in stored units.
	 *
	 * @since 5.20.0
	 */
	scale?: number;

	/**
	 * If `type: "dropdown"`, `options` should contain a list of items it.
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
	 * An instance of target [[StockChart]].
	 */
	stockChart: StockChart;

	/**
	 * A main series indicator will be based on.
	 */
	stockSeries: XYSeries;

	/**
	 * A volume series indicator will be based on, if it requires one.
	 */
	volumeSeries?: XYSeries;

	/**
	 * If set to a reference to [[StockLegend]], indicator will add itself into
	 * the legend.
	 */
	legend?: StockLegend;

	/**
	 * Period.
	 */
	period?: number;

	/**
	 * A value field to use.
	 */
	field?: "open" | "close" | "low" | "high" | "hl/2" | "hlc/3" | "hlcc/4" | "ohlc/4";

	/**
	 * Indicator name, e.g. "Moving Average".
	 */
	name?: string;

	/**
	 * Short name for the indicator, e.g. "MA" (for "Moving Average").
	 *
	 * Mainly used for the legend.
	 */
	shortName?: string;

	/**
	 * A color to use for the indicator series.
	 */
	seriesColor?: Color;

	/**
	 * Should indicator settings modal be opened automatically when indicator
	 * is added to a chart via [[IndicatorControl]].
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
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
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
	 * Clamps numeric settings that carry `minValue`/`maxValue`/`step` limits in
	 * `_editableSettings` back into their allowed range, so out-of-range values
	 * (from the settings modal, deserialized configs, or the API) can never reach
	 * the heavy `prepareData()` — which, for e.g. Volume Profile, would otherwise
	 * freeze the page. A `step` of `1` marks an integer setting, so typed decimals
	 * are rounded. Called with `force` on add/deserialize (nothing is "dirty"
	 * yet); otherwise only dirty keys are checked.
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
	 * Assigns numeric limits to an editable setting by key. Used for entries that
	 * are inherited from a base indicator (e.g. overbought/oversold) whose range
	 * differs per subclass.
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
