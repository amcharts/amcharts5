import type { DateAxis } from "../../xy/axes/DateAxis";
import type { Color } from "../../../core/util/Color";
import type { Graphics } from "../../../core/render/Graphics";
import type { XYSeries } from "../../xy/series/XYSeries";

import { AxisRendererX } from "../../xy/axes/AxisRendererX";
import { ValueAxis } from "../../xy/axes/ValueAxis";
import { Indicator, IIndicatorSettings, IIndicatorPrivate, IIndicatorEvents, IIndicatorEditableSetting } from "./Indicator";
import { ColumnSeries } from "../../xy/series/ColumnSeries";
import { percent } from "../../../core/util/Percent";

import * as $type from "../../../core/util/Type";
import * as $array from "../../../core/util/Array";

export interface IVolumeProfileSettings extends IIndicatorSettings {
	/**
	 * Color of the up volume part of each row.
	 */
	upColor?: Color;

	/**
	 * Color of the down volume part of each row.
	 */
	downColor?: Color;

	/**
	 * How the price range is split into rows: `"rows"` into `count` rows of
	 * equal height, `"ticks"` into rows `count` ticks tall.
	 *
	 * @default "rows"
	 */
	countType?: "rows" | "ticks";

	/**
	 * Number of rows, or with `countType: "ticks"`, the height of a row in
	 * ticks of `0.01`.
	 *
	 * @default 24
	 */
	count?: number;

	/**
	 * Width of the profile's longest row, in percent of the plot area width.
	 *
	 * @default 40
	 */
	axisWidth?: number;

	/**
	 * Percent of the visible range's volume to highlight as the value area:
	 * the rows around the row with the most volume.
	 *
	 * @default 70
	 */
	valueArea?: number;

	/**
	 * Fill opacity of the rows in the value area.
	 *
	 * @default .7
	 */
	valueAreaOpacity?: number;

	/**
	 * The volume series to build the profile from. Required.
	 */
	volumeSeries: XYSeries;
}

export interface IVolumeProfilePrivate extends IIndicatorPrivate {
}

export interface IVolumeProfileEvents extends IIndicatorEvents {
}

/**
 * Volume Profile indicator: horizontal rows over the main series showing how
 * much volume traded at each price in the visible range, split into up and
 * down volume.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 * @since 5.7.0
 */
export class VolumeProfile extends Indicator {
	public static className: string = "VolumeProfile";
	public static classNames: Array<string> = Indicator.classNames.concat([VolumeProfile.className]);

	declare public _settings: IVolumeProfileSettings;
	declare public _privateSettings: IVolumeProfilePrivate;
	declare public _events: IVolumeProfileEvents;

	/**
	 * Series of the down volume columns.
	 */
	declare public series: ColumnSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "countType",
		name: this.root.language.translateAny("Count"),
		type: "dropdown",
		options: [
			{ value: "rows", text: this.root.language.translateAny("number of rows"), extTarget: "count", extTargetValue: 24, extTargetMinValue: 10, extTargetMaxValue: 500, extTargetStep: 1 },
			{ value: "ticks", text: this.root.language.translateAny("ticks per row"), extTarget: "count", extTargetValue: 1000, extTargetMinValue: 200 }
		]
	}, {
		key: "count",
		name: this.root.language.translateAny("Count"),
		type: "number",
		minValue: 10,
		maxValue: 500,
		step: 1
	}, {
		key: "valueArea",
		name: this.root.language.translateAny("Value Area"),
		type: "number",
		minValue: 50,
		maxValue: 95,
		step: 1
	}, {
		key: "upColor",
		name: this.root.language.translateAny("Up volume"),
		type: "color"
	}, {
		key: "downColor",
		name: this.root.language.translateAny("Down volume"),
		type: "color"
	}, {
		key: "axisWidth",
		name: this.root.language.translateAny("Width %"),
		type: "number",
		minValue: 10,
		maxValue: 100,
		step: 1
	}];

	/**
	 * Horizontal axis the rows' volume is measured on.
	 */
	public xAxis!: ValueAxis<AxisRendererX>;

	/**
	 * Series of the up volume columns, drawn after the down volume.
	 */
	public upSeries!: ColumnSeries;

	protected _previousColumn?: Graphics;

	/**
	 * Sets the limits of `count` for the current `countType`: `10` to `500`
	 * (step `1`) for rows; for ticks, a range derived from the Y axis step, so
	 * it scales with the instrument. Also applies them to the dropdown's
	 * "ticks" option.
	 */
	protected _updateCountBounds(): void {
		let ticksOption: any;
		let countSetting: IIndicatorEditableSetting | undefined;
		$array.each(this._editableSettings, (setting) => {
			if (setting.key == "countType" && setting.options) {
				$array.each(setting.options as Array<any>, (option) => {
					if (option && option.value == "ticks") {
						ticksOption = option;
					}
				});
			}
			else if (setting.key == "count" && setting.type == "number") {
				countSetting = setting;
			}
		});

		// Dynamic ticks range from the y-axis step. Left undefined until the axis
		// step is known, so we never clamp a ticks value against a fixed fallback
		// (which would corrupt a legitimately small tick size on a low-priced
		// instrument). `_updateCountBounds` is re-run with a re-clamp once the step
		// arrives (see the onPrivate("step") handler).
		let ticksDefault = 1000;
		let ticksMin: number | undefined = undefined;
		let ticksMax: number | undefined = undefined;
		const stockSeries = this.get("stockSeries");
		const yAxis = stockSeries ? stockSeries.get("yAxis") as any : undefined;
		const step = yAxis ? yAxis.getPrivate("step") : undefined;
		if (step !== undefined) {
			const val = step * 50;
			ticksDefault = val;
			ticksMin = val * 0.2;
			ticksMax = val * 100;
		}

		if (ticksOption) {
			ticksOption.extTargetValue = ticksDefault;
			ticksOption.extTargetMinValue = ticksMin;
			ticksOption.extTargetMaxValue = ticksMax;
		}

		if (countSetting) {
			if (this.get("countType") == "ticks") {
				countSetting.minValue = ticksMin;
				countSetting.maxValue = ticksMax;
				countSetting.step = undefined;
			}
			else {
				countSetting.minValue = 10;
				countSetting.maxValue = 500;
				countSetting.step = 1;
			}
		}
	}

	public _clampSettings(force: boolean = false): void {
		this._updateCountBounds();
		super._clampSettings(force);
	}

	protected _afterNew() {
		super._afterNew();

		const volumeSeries = this.get("volumeSeries");
		const stockSeries = this.get("stockSeries");
		if (volumeSeries) {
			const chart = stockSeries.chart;
			const root = this._root;

			if (chart) {
				const yAxis = stockSeries.get("yAxis") as any;

				this._updateCountBounds();
				yAxis.onPrivate("step", () => {
					// Bounds are now known: re-clamp count into range and, if that
					// actually changed it, recompute so heavy build never runs stale.
					const before = this.get("count");
					this._clampSettings(true);
					if (this.get("count") !== before) {
						this.markDataDirty();
					}
				});

				const panelXAxis = stockSeries.get("xAxis") as DateAxis<AxisRendererX>;

				panelXAxis.on("start", () => {
					this.markDataDirty();
				})
				panelXAxis.on("end", () => {
					this.markDataDirty();
				})

				const xRenderer = AxisRendererX.new(root, {});
				xRenderer.grid.template.set("forceHidden", true);
				xRenderer.labels.template.set("forceHidden", true);

				this.xAxis = chart.xAxes.push(ValueAxis.new(root, {
					zoomable: false,
					strictMinMax: true,
					panX: false,
					panY: false,
					renderer: xRenderer
				}));

				if (yAxis.get("renderer").get("opposite")) {
					xRenderer.set("inversed", true);
					this.xAxis.setAll({
						x: percent(100),
						centerX: percent(100)
					})
				}

				this.series = chart.series.unshift(ColumnSeries.new(root, {
					xAxis: this.xAxis,
					yAxis: yAxis,
					snapTooltip: false,
					valueXField: "down",
					openValueXField: "xOpen",
					openValueYField: "yOpen",
					valueYField: "y",
					calculateAggregates: true,
					turboMode: false,
					themeTags: ["indicator", "volumeprofile", "down"]
				}))


				this.upSeries = chart.series.unshift(ColumnSeries.new(root, {
					xAxis: this.xAxis,
					yAxis: yAxis,
					snapTooltip: false,
					valueXField: "total",
					openValueXField: "down",
					openValueYField: "yOpen",
					valueYField: "y",
					calculateAggregates: true,
					themeTags: ["indicator", "volumeprofile", "up"]
				}))

				this.upSeries.setPrivate("doNotUpdateLegend", true);
				this.series.setPrivate("doNotUpdateLegend", true);

				this.upSeries.setPrivate("baseValueSeries", stockSeries);
				this.series.setPrivate("baseValueSeries", stockSeries);

				this._handleLegend(this.series);

				this._addInteractivity(this.series);
				this._addInteractivity(this.upSeries);
			}
		}
	}

	protected _addInteractivity(series: ColumnSeries) {
		series.columns.template.events.on("pointerover", (e) => {
			let dataItem = e.target.dataItem;

			if (dataItem) {
				if (dataItem.component == this.upSeries) {
					dataItem = this.series.dataItems[this.upSeries.dataItems.indexOf(dataItem)];
					if (dataItem) {
						const column = dataItem.get("graphics" as any);
						if (column) {
							column.hover();
							this._previousColumn = column;
						}
					}
				}
				else {
					dataItem = this.upSeries.dataItems[this.series.dataItems.indexOf(dataItem)];
					if (dataItem) {
						const column = dataItem.get("graphics" as any);
						if (column) {
							column.hover();
							this._previousColumn = column;
						}
					}
				}

				this.series.updateLegendValue(dataItem);
			}
		})

		series.columns.template.events.on("pointerout", () => {
			this.series.updateLegendValue(undefined);
			if (this._previousColumn) {
				this._previousColumn.unhover();
			}
		})

		series.columns.template.adapters.add("fillOpacity", (fillOpacity, target) => {
			const dataItem = target.dataItem;
			if (dataItem) {
				const dataContext = dataItem.dataContext as any;
				if (dataContext) {
					if (dataContext.area) {
						return this.get("valueAreaOpacity", .7);
					}
				}
			}
			return fillOpacity;
		})
	}

	public _updateChildren(): void {
		if (this.series) {
			super._updateChildren();

			if (this.isDirty("count") || this.isDirty("countType") || this.isDirty("valueArea")) {
				this.markDataDirty();
			}

			if (this.isDirty("countType")) {
				this._updateCountBounds();
			}

			if (this.isDirty("upColor")) {
				const upColor = this.get("upColor");
				this.upSeries.set("fill", upColor);
				this.upSeries.set("stroke", upColor);

				this.upSeries.columns.template.setAll({
					fill: upColor,
					stroke: upColor
				});
				// Turbo mode draws the columns with the colours they had when laid out
				this.upSeries.markDirtyValues();

				this.setCustomData("upColor", upColor);
			}

			if (this.isDirty("downColor")) {
				const downColor = this.get("downColor");
				this.series.set("fill", downColor);
				this.series.set("stroke", downColor);

				this.series.columns.template.setAll({
					fill: downColor,
					stroke: downColor
				});

				this.setCustomData("downColor", downColor);
			}

			if (this.isDirty("axisWidth")) {
				this.xAxis.set("width", percent(this.get("axisWidth", 40)));
			}

		}
	}

	/**
	 * @ignore
	 */
	public prepareData() {
		const volumeSeries = this.get("volumeSeries");
		const stockSeries = this.get("stockSeries");

		if (volumeSeries && this.series) {
			let startIndex = volumeSeries.getPrivate("adjustedStartIndex", volumeSeries.startIndex());
			let endIndex = volumeSeries.endIndex();

			const count = this.get("count", 20);
			const type = this.get("countType");
			let step = 1;

			let min = Infinity;
			let max = -Infinity;

			for (let i = startIndex; i < endIndex; i++) {
				const dataItem = stockSeries.dataItems[i];
				if (dataItem) {
					const close = dataItem.get("valueY");
					if ($type.isNumber(close)) {
						const low = dataItem.get("lowValueY", close);
						const high = dataItem.get("highValueY", close);
						if (low < min) {
							min = low;
						}

						if (high > max) {
							max = high;
						}
					}
				}
			}

			if (min != Infinity) {

				let rows: number;
				if (type == "ticks") {
					step = count / 100;
					min = Math.floor(min / step) * step;
					max = Math.ceil(max / step) * step;
					rows = (max - min) / step;
				}
				else {
					step = (max - min) / count;
					rows = count;
				}

				// Hard safety cap: a pathological count (e.g. a deserialized ticks
				// config restored before the axis step is known) could otherwise
				// build a runaway number of rows and freeze the thread. Rebase the
				// step so binning still spans the range. Normal rows-mode (<=500)
				// and sane ticks values stay well under this.
				rows = Math.max(1, Math.ceil(rows));
				if (rows > 2000) {
					rows = 2000;
					step = (max - min) / rows;
				}

				const rowDataDown: Array<number> = [];
				const rowDataUp: Array<number> = [];

				for (let i = 0; i < rows; i++) {
					rowDataDown[i] = 0;
					rowDataUp[i] = 0;
				}

				for (let i = startIndex; i < endIndex; i++) {
					const dataItem = stockSeries.dataItems[i];
					const volumeDataItem = volumeSeries.dataItems[i];
					if (dataItem && volumeDataItem) {
						const close = dataItem.get("valueY");
						const volume = volumeDataItem.get("valueY");

						if ($type.isNumber(close) && $type.isNumber(volume)) {
							const barOpen = dataItem.get("openValueY", close);
							const low = dataItem.get("lowValueY", close);
							const high = dataItem.get("highValueY", close);
							const bodyTop = Math.max(close, barOpen);
							const bodyBot = Math.min(close, barOpen);
							const green = close >= barOpen;
							const topWick = high - bodyTop;
							const bottomWick = bodyBot - low;
							const body = bodyTop - bodyBot;
							// Spread the bar volume over where it traded, split into body + two
							// wicks with the wicks at double the body per-price density. The
							// body is up volume on a green candle (close >= open), down
							// otherwise; each wick is split evenly between up and down.
							const denom = 2 * topWick + 2 * bottomWick + body;
							if (denom <= 0) {
								// Flat bar (high == low): drop it all in one row.
								let index = Math.floor((close - min) / step);
								if (!(index >= 0)) { index = 0; } // also catches NaN from a zero-width range
								if (index >= rows) { index = rows - 1; }
								if (green) { rowDataUp[index] += volume; } else { rowDataDown[index] += volume; }
							}
							else {
								const bodyVol = body * volume / denom;
								const topVol = 2 * topWick * volume / denom;
								const botVol = 2 * bottomWick * volume / denom;
								let jLow = Math.floor((low - min) / step);
								let jHigh = Math.floor((high - min) / step);
								if (jLow < 0) { jLow = 0; }
								if (jHigh >= rows) { jHigh = rows - 1; }
								for (let j = jLow; j <= jHigh; j++) {
									const rowBot = min + j * step;
									const rowTop = rowBot + step;
									const bodyOv = body > 0 ? bodyVol * (Math.max(0, Math.min(rowTop, bodyTop) - Math.max(rowBot, bodyBot)) / body) : 0;
									const topOv = topWick > 0 ? topVol * (Math.max(0, Math.min(rowTop, high) - Math.max(rowBot, bodyTop)) / topWick) : 0;
									const botOv = bottomWick > 0 ? botVol * (Math.max(0, Math.min(rowTop, bodyBot) - Math.max(rowBot, low)) / bottomWick) : 0;
									rowDataUp[j] += (green ? bodyOv : 0) + topOv / 2 + botOv / 2;
									rowDataDown[j] += (green ? 0 : bodyOv) + topOv / 2 + botOv / 2;
								}
							}
						}
					}
				}

				const dataDown = [];
				let sum = 0;
				for (let i = 0; i < rows; i++) {
					let total = rowDataUp[i] + rowDataDown[i];
					sum += total;

					dataDown.push({
						yOpen: min + i * step,
						y: min + (i + 1) * step,
						up: rowDataUp[i],
						down: rowDataDown[i],
						total: total,
						xOpen: 0,
						area: false
					})
				}

				let len = this.series.data.length;
				if (len && len == dataDown.length) {
					for (let i = 0; i < len; i++) {
						this.series.data.setIndex(i, dataDown[i]);
					}
				}
				else {
					this.series.data.setAll(dataDown);
				}

				const dataUp = [];

				let highest = 0;
				let hi = 0;

				for (let i = 0; i < rows; i++) {
					let total = rowDataUp[i] + rowDataDown[i];
					dataUp.push({
						yOpen: min + i * step,
						y: min + (i + 1) * step,
						up: rowDataUp[i],
						down: rowDataDown[i],
						total: total,
						area: false
					})

					if (total > highest) {
						highest = total;
						hi = i;
					}
				}

				let valueArea = sum * this.get("valueArea", 70) / 100;
				let area = highest;

				let cd = 1;
				let cu = 1;
				let dlen = dataUp.length;

				dataUp[hi].area = true;
				dataDown[hi].area = true;

				// single row
				while (area < valueArea) {
					let rowAbove1 = hi + cu;
					let sumAbove = 0
					if (rowAbove1 < dlen) {
						sumAbove += dataUp[rowAbove1].total;
					}

					let rowBelow1 = hi - cd;

					let sumBelow = 0
					if (rowBelow1 >= 0) {
						sumBelow += dataUp[rowBelow1].total;
					}

					if (sumBelow <= sumAbove) {
						area += sumAbove;
						if (rowAbove1 < dlen) {
							dataDown[rowAbove1].area = true;
							dataUp[rowAbove1].area = true;
							cu++;
						}
					}
					else {
						area += sumBelow;
						if (rowBelow1 >= 0) {
							dataDown[rowBelow1].area = true;
							dataUp[rowBelow1].area = true;
							cd++;
						}
					}

					if (sumBelow == 0) {
						cd++;
					}
					if (sumAbove == 0) {
						cu++;
					}

					if ((cd > dlen && cu > dlen)) {
						break;
					}
				}

				area = Math.ceil(area);

				len = this.upSeries.data.length;
				if (len > 0 && len == dataUp.length) {
					for (let i = 0; i < len; i++) {
						this.upSeries.data.setIndex(i, dataUp[i]);
					}
				}
				else {
					this.upSeries.data.setAll(dataUp);
				}
			}
			else {
				this.upSeries.data.clear();
				this.series.data.clear();
			}
		}

		this.series.columns.each((column) => {
			column._markDirtyKey("fillOpacity")
		})

		this.upSeries.columns.each((column) => {
			column._markDirtyKey("fillOpacity")
		})
	}

	protected _dispose() {
		super._dispose();
		if (this.upSeries) {
			this.upSeries.dispose();
		}

		if (this.xAxis) {
			this.xAxis.dispose();
		}
	}
}