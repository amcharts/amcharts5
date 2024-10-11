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
	type: "color" | "number" | "dropdown" | "checkbox";

	/**
	 * Minimum numeric value allowable in this field.
	 *
	 * @since 5.8.1
	 */
	minValue?: number;

	/**
	 * If `type: "dropdown"`, `options` should contain a list of items it.
	 */
	options?: Array<string | {
		value: number | string,
		text: string,
		extTarget?: string,
		extTargetValue?: number | string,
		extTargetMinValue?: number
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
	 * A volume series indicator will be based on, if it reaquires one.
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
	 * Should indicator settings modal be openend automatically when indicator
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

	public _prepareChildren() {
		super._prepareChildren();

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
			data.push({ valueX: dataItem.get("valueX"), value_y: (dataItem.get("valueY", 0) + dataItem.get("highValueY", 0) + dataItem.get("lowValueY", 0)) / 2 });
		})
		return data;
	}

	protected _sma(data: Array<any>, period: number, field: string, toField: string) {
		let i = 0;
		let index = 0;
		let ma = 0;
		$array.each(data, (dataItem) => {
			let value = dataItem[field];
			if (value != null) {
				i++;
				ma += value / period;

				if (i >= period) {
					if (i > period) {
						let valueToRemove = data[index - period][field];
						if (valueToRemove != null) {
							ma -= valueToRemove / period;
						}
					}
					dataItem[toField] = ma;
				}
			}
			index++;
		})
	}

	protected _wma(data: Array<any>, period: number, field: string, toField: string) {
		let i = 0;
		let index = 0;
		let ma = 0;
		$array.each(data, (dataItem) => {
			let value = dataItem[field];
			if (value != null) {
				i++;
				if (i >= period) {
					let sum = 0;
					let m = 0;
					let count = 0;
					let k = 0
					for (let n = index; n >= 0; n--) {
						let pValue = data[n][field];

						if (pValue != null) {
							sum += pValue * (period - m);
							count += (period - m);
							k++;
						}
						m++;

						if (k == period) {
							break;
						}
					}

					ma = sum / count;
					dataItem[toField] = ma;
				}
			}
			index++;
		})
	}

	protected _ema(data: Array<any>, period: number, field: string, toField: string) {
		let i = 0;
		let ma = 0;
		let multiplier = 2 / (1 + period);
		$array.each(data, (dataItem) => {
			let value = dataItem[field];
			if (value != null) {
				i++;

				if (i > period) {
					ma = value * multiplier + ma * (1 - multiplier);
					dataItem[toField] = ma;
				}
				else {
					ma += value / period;
					if (i == period) {
						dataItem[toField] = ma;
					}
				}
			}
		})
	}

	protected _dema(data: Array<any>, period: number, field: string, toField: string) {
		let i = 0;
		let ema2 = 0;
		let multiplier = 2 / (1 + period);

		this._ema(data, period, field, "ema");

		$array.each(data, (dataItem) => {
			let ema = dataItem.ema;
			if (ema != null) {
				i++;
				if (i > period) {
					ema2 = ema * multiplier + ema2 * (1 - multiplier);
					dataItem[toField] = 2 * ema - ema2;
					dataItem.ema2 = ema2;
				}
				else {
					ema2 += ema / period;
					if (i == period) {
						dataItem[toField] = 2 * ema - ema2;
						dataItem.ema2 = ema2;
					}
				}
			}
		})
	}

	protected _tema(data: Array<any>, period: number, field: string, toField: string) {
		let i = 0;
		let ema3 = 0;
		let multiplier = 2 / (1 + period);

		this._dema(data, period, field, "dema");

		$array.each(data, (dataItem) => {
			let ema = dataItem.ema;
			let ema2 = dataItem.ema2;

			if (ema2 != null) {
				i++;
				if (i > period) {
					ema3 = ema2 * multiplier + ema3 * (1 - multiplier);
					dataItem[toField] = 3 * ema - 3 * ema2 + ema3;
				}
				else {
					ema3 += ema2 / period;
					if (i == period) {
						dataItem[toField] = 3 * ema - 3 * ema2 + ema3;
					}
				}
			}
		})
	}
}