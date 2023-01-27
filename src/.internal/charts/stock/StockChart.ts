import type { StockPanel } from "./StockPanel";
import type { StockLegend, IStockLegendDataItem } from "./StockLegend";
import type { Axis } from "../xy/axes/Axis";
import type { AxisRenderer } from "../xy/axes/AxisRenderer";
import type { BaseColumnSeries } from "../xy/series/BaseColumnSeries";
import type { IValueAxisSettings } from "../xy/axes/ValueAxis";
import type { XYSeries, IXYSeriesDataItem, IXYSeriesSettings } from "../xy/series/XYSeries";
import type { DataItem } from "../../core/render/Component";
import type { Indicator } from "./indicators/Indicator";
import type { DrawingSeries } from "./drawing/DrawingSeries";

import { PanelControls } from "./PanelControls";
import { StockChartDefaultTheme } from "./StockChartDefaultTheme";
import { XYChartDefaultTheme } from "../xy/XYChartDefaultTheme";
import { Container, IContainerPrivate, IContainerSettings, IContainerEvents } from "../../core/render/Container";
import { ListAutoDispose } from "../../core/util/List";
import { Rectangle } from "../../core/render/Rectangle";
import { p100, percent, Percent } from "../../core/util/Percent";
import { SettingsModal } from "./SettingsModal";
import { Color } from "../../core/util/Color";
import { registry } from "../../core/Registry";

import * as $array from "../../core/util/Array";
import * as $utils from "../../core/util/Utils";
import * as $object from "../../core/util/Object";

export interface IStockChartSettings extends IContainerSettings {

	/**
	 * Main value series.
	 *
	 * This series is used to target by settings, as well as calculating
	 * indicators, and annotations.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/#Setting_main_series}
	 */
	stockSeries?: XYSeries;

	/**
	 * Main volume series.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/#Setting_main_series}
	 */
	volumeSeries?: XYSeries;

	/**
	 * @ignore
	 */
	comparingSeriesSettings?: Partial<IXYSeriesSettings>;

	/**
	 * Settings to be applied to the the main value series, when chart is
	 * switched to "percent scale".
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/percent-mode/#Configuring} for more info
	 */
	percentScaleSeriesSettings?: Partial<IXYSeriesSettings>;

	/**
	 * Settings to be applied to the [[ValueAxis]] of the main value series,
	 * when chart is switched to "percent scale".
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/percent-mode/#Configuring} for more info
	 */
	percentScaleValueAxisSettings?: Partial<IValueAxisSettings<AxisRenderer>>;

	/**
	 * If set to `true`, the chart will go into "percent scale" when compared
	 * series are added to chart, and will exit it when all of the comparisons
	 * are removed.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/percent-mode/} for more info
	 * @default true
	 */
	autoSetPercentScale?: boolean;

	/**
	 * This color will be applied to columns/candles on the main value series (series
	 * set as `stockSeries`) where the open value is lower or equal to the close
	 * value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/#Positive_negative_colors} for more info
	 */
	stockPositiveColor?: Color;

	/**
	 * This color will be applied to columns/candles on the main value series (series
	 * set as `stockSeries`) where the open value is higher than the close value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/#Positive_negative_colors} for more info
	 */
	stockNegativeColor?: Color;

	/**
	 * This color will be applied to columns/candles on the main volume series (series
	 * set as `stockSeries`) where the open value is lower or equal to the close
	 * value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/#Positive_negative_colors} for more info
	 */
	volumePositiveColor?: Color;

	/**
	 * This color will be applied to columns/candles on the main volume series (series
	 * set as `stockSeries`) where the open value is higher than the close value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/#Positive_negative_colors} for more info
	 */
	volumeNegativeColor?: Color;

}

export interface IStockChartPrivate extends IContainerPrivate {

	/**
	 * A instance of [[SettingsModal]].
	 */
	settingsModal: SettingsModal;

	/**
	 * Indicates if chart has currently have any "compared" series set.
	 */
	comparing?: boolean;

	/**
	 * A list of compared series.
	 */
	comparedSeries?: XYSeries[];

}

export interface IStockChartEvents extends IContainerEvents {

}


/**
 * A main class for the Stock Chart.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/} for more info
 * @important
 */
export class StockChart extends Container {

	public static className: string = "StockChart";
	public static classNames: Array<string> = Container.classNames.concat([StockChart.className]);


	declare public _settings: IStockChartSettings;
	declare public _privateSettings: IStockChartPrivate;
	declare public _events: IContainerEvents;

	protected _xAxes: Array<Axis<AxisRenderer>> = [];
	protected _downY?: number;
	protected _upperPanel?: StockPanel;
	protected _dhp?: Percent;
	protected _uhp?: Percent;
	protected _downResizer?: Rectangle;

	/**
	 * A list of stock panels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/#Panels} for more info
	 */
	public readonly panels: ListAutoDispose<StockPanel> = new ListAutoDispose();

	/**
	 * A list of indicators on chart.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
	 */
	public readonly indicators: ListAutoDispose<Indicator> = new ListAutoDispose();

	/**
	 * A [[Container]], resiting on top of the charts, suitable for additional
	 * tools, like [[Scrollbar]].
	 * 
	 * @default Container.new()
	 */
	public readonly toolsContainer: Container = this.children.push(Container.new(this._root, { width: p100, themeTags: [] }));

	/**
	 * A [[Container]] where all the stock panels are placed into.
	 * 
	 * @default Container.new()
	 */
	public readonly panelsContainer: Container = this.children.push(Container.new(this._root, { width: p100, height: p100, layout: this._root.verticalLayout, themeTags: ["chartscontainer"] }));


	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["stock"]);
		this._defaultThemes.push(StockChartDefaultTheme.new(this._root));
		this._defaultThemes.push(XYChartDefaultTheme.new(this._root));

		const tooltipContainer = this._root.tooltipContainer;
		tooltipContainer.set("themeTags", $utils.mergeTags(tooltipContainer.get("themeTags", []), ["stock"]));

		super._afterNew();

		const children = this.panelsContainer.children;
		this._disposers.push(this.panels.events.onAll((change) => {
			if (change.type === "clear") {
				$array.each(change.oldValues, (chart) => {
					this._removePanel(chart);
				})
			} else if (change.type === "push") {
				children.moveValue(change.newValue);
				this._processPanel(change.newValue);
			} else if (change.type === "setIndex") {
				children.setIndex(change.index, change.newValue);
				this._processPanel(change.newValue);
			} else if (change.type === "insertIndex") {
				children.insertIndex(change.index, change.newValue);
				this._processPanel(change.newValue);
			} else if (change.type === "removeIndex") {
				this._removePanel(change.oldValue);
			} else {
				throw new Error("Unknown IListEvent type");
			}
		}));

		this._disposers.push(this.indicators.events.onAll((change) => {
			if (change.type === "clear") {
				$array.each(change.oldValues, (indicator) => {
					this._removeIndicator(indicator);
				})
			} else if (change.type === "push") {
				this._processIndicator(change.newValue);
			} else if (change.type === "setIndex") {
				this._processIndicator(change.newValue);
			} else if (change.type === "insertIndex") {
				this._processIndicator(change.newValue);
			} else if (change.type === "removeIndex") {
				this._removeIndicator(change.oldValue);
			} else {
				throw new Error("Unknown IListEvent type");
			}
		}));

		this.setPrivateRaw("settingsModal", SettingsModal.new(this.root, {
			stockChart: this
		}));

		let license = false;
		for (let i = 0; i < registry.licenses.length; i++) {
			if (registry.licenses[i].match(/^AM5S.{5,}/i)) {
				license = true;
			}
		}
		if (!license) {
			this._root._showBranding();
		}
		else {
			this._root._licenseApplied();
		}
	}

	public _prepareChildren() {

		if (this.isDirty("volumeNegativeColor") || this.isDirty("volumePositiveColor")) {
			const volumeSeries = this.get("volumeSeries");
			if (volumeSeries && volumeSeries.isType<BaseColumnSeries>("BaseColumnSeries")) {
				volumeSeries.columns.each((column) => {
					column._markDirtyKey("fill");
				})
			}
		}

		const stockSeries = this.get("stockSeries");


		if (this.isDirty("stockSeries")) {

			if (stockSeries) {
				this.indicators.each((indicator) => {
					indicator.set("stockSeries", stockSeries);
				})
				const mainChart = stockSeries.chart;

				if (mainChart) {
					const previous = this._prevSettings.stockSeries;
					mainChart.series.each((series) => {
						if (series.isType<DrawingSeries>("DrawingSeries")) {
							let s = series.get("series");
							if (s == previous) {
								series.set("series", stockSeries);
							}
						}
					});
				}

				if (this.getPrivate("comparing")) {
					this.setPercentScale(true);
				}
			}
		}

		super._prepareChildren();
	}

	public _updateChildren() {
		super._updateChildren()
		const stockSeries = this.get("stockSeries");

		if (this.isDirty("volumeSeries")) {
			const volumeSeries = this.get("volumeSeries");
			if (volumeSeries) {
				const volumePanel = volumeSeries.chart;
				if (volumePanel) {
					volumePanel.series.events.on("removeIndex", (event) => {
						if (event.oldValue == volumeSeries) {
							this.set("volumeSeries", undefined);
						}
					})
				}
			}
		}

		if (this.isDirty("stockNegativeColor") || this.isDirty("stockPositiveColor") || this.isDirty("stockSeries")) {
			if (stockSeries && stockSeries.isType<BaseColumnSeries>("BaseColumnSeries")) {
				const stockNegativeColor = this.get("stockNegativeColor", this._root.interfaceColors.get("negative"));
				const stockPositiveColor = this.get("stockPositiveColor", this._root.interfaceColors.get("positive"));
				let previous = stockSeries.dataItems[0];

				$array.each(stockSeries.dataItems, (dataItem) => {
					const column = dataItem.get("graphics");
					if (column) {
						const dropFromOpen = column.states.lookup("dropFromOpen");
						if (dropFromOpen) {
							dropFromOpen.setAll({ fill: stockNegativeColor, stroke: stockNegativeColor });
						}

						const riseFromOpen = column.states.lookup("riseFromOpen");
						if (riseFromOpen) {
							riseFromOpen.setAll({ fill: stockPositiveColor, stroke: stockPositiveColor });
						}

						const dropFromPrevious = column.states.lookup("dropFromPrevious");
						if (dropFromPrevious) {
							dropFromPrevious.setAll({ fill: stockNegativeColor, stroke: stockNegativeColor });
						}

						const riseFromPrevious = column.states.lookup("riseFromPrevious");
						if (riseFromPrevious) {
							riseFromPrevious.setAll({ fill: stockPositiveColor, stroke: stockPositiveColor });
						}

						stockSeries._applyGraphicsStates(dataItem, previous);
						previous = dataItem;
					}
				})

				stockSeries.columns.template.states.create("riseFromOpen", { fill: stockPositiveColor, stroke: stockPositiveColor });
				stockSeries.columns.template.states.create("riseFromPrevious", { fill: stockPositiveColor, stroke: stockPositiveColor });

				stockSeries.columns.template.states.create("dropFromOpen", { fill: stockNegativeColor, stroke: stockNegativeColor });
				stockSeries.columns.template.states.create("dropFromPrevious", { fill: stockNegativeColor, stroke: stockNegativeColor });

				stockSeries.markDirtyValues();
			}
		}
	}


	/**
	 * Enables or disables percent scale mode.
	 *
	 * If `percentScale` is not set, it will try to determine the status on its own.
	 *
	 * In percent scale mode `percentScaleSeriesSettings` and `percentScaleValueAxisSettings` will
	 * be applied to the regular series on the main panel and its Y axis.
	 * 
	 * @param  percentScale  Comparison mode active
	 */
	public setPercentScale(percentScale?: boolean): void {
		const stockSeries = this.get("stockSeries");
		const seriesSettings = this.get("percentScaleSeriesSettings");
		const axisSettings = this.get("percentScaleValueAxisSettings");
		if (stockSeries) {
			const mainChart = stockSeries.chart;
			const yAxis = stockSeries.get("yAxis");
			this._maybePrepAxisDefaults();
			if (mainChart) {
				const seriesList: XYSeries[] = [];
				mainChart.series.each((series) => {
					if (series.get("yAxis") == yAxis) {
						seriesList.push(series);
						this._maybePrepSeriesDefaults(series);
					}
				});

				if (percentScale == undefined) {
					percentScale = this.getPrivate("comparedSeries", []).length > 0;
				}

				this.setPrivate("comparing", percentScale);

				if (seriesSettings) {
					$array.each(seriesList, (series) => {
						if (percentScale) {
							series.setAll(seriesSettings);
						}
						else {
							series.states.apply("comparingDefaults");
						}
					});
				}

				if (axisSettings) {
					if (percentScale) {
						yAxis.setAll(axisSettings);
					}
					else {
						yAxis.states.apply("comparingDefaults");
					}
				}
			}
		}
	}

	/**
	 * Adds a "compared" series to chart. Returns the same series.
	 *
	 * @param   series  Compared series
	 * @return          Compared series
	 */
	public addComparingSeries(series: XYSeries): XYSeries {
		const stockSeries = this.get("stockSeries");
		if (stockSeries) {
			const chart = stockSeries.chart;
			if (chart) {
				chart.series.push(series);
			}

			// Apply comparingSeriesSettings
			const comparingSeriesSettings = this.get("comparingSeriesSettings");
			if (comparingSeriesSettings) {
				series.setAll(comparingSeriesSettings);
			}

			const comparedSeries = this.getPrivate("comparedSeries");
			if (comparedSeries) {
				comparedSeries.push(series);
			}
			else {
				this.setPrivate("comparedSeries", [series]);
			}

			const legendDataItem = stockSeries.get("legendDataItem");

			if (legendDataItem) {
				const legend = legendDataItem.component;
				if (legend.isType<StockLegend>("StockLegend")) {
					legend.data.push(series);
					const ldi = series.get("legendDataItem") as DataItem<IStockLegendDataItem>;
					if (ldi) {
						const closeButton = ldi.get("closeButton");
						closeButton.set("forceHidden", false);
						closeButton.events.on("click", () => {
							this.removeComparingSeries(series);
						})
					}
				}
			}

			if (this.get("autoSetPercentScale")) {
				this.setPercentScale(true);
			}

		}
		return series;
	}

	/**
	 * Removes compared series.
	 * 
	 * @param  series  Compared series
	 */
	public removeComparingSeries(series: XYSeries) {
		const stockSeries = this.get("stockSeries");
		if (stockSeries) {
			const chart = stockSeries.chart;
			if (chart) {
				chart.series.removeValue(series);
			}

			const comparedSeries = this.getPrivate("comparedSeries");
			if (comparedSeries) {
				$array.remove(comparedSeries, series);
				if (comparedSeries.length == 0 && this.get("autoSetPercentScale")) {
					this.setPercentScale(false);
				}
			}

		}

		const ldi = series.get("legendDataItem") as DataItem<IStockLegendDataItem>;
		if (ldi) {
			const legend = ldi.component;
			legend.data.removeValue(series);
		}

	}

	protected _maybePrepSeriesDefaults(series: XYSeries): void {
		if (!series.states.lookup("comparingDefaults")) {
			const seriesSettings = this.get("percentScaleSeriesSettings");
			const defaults: any = {};
			$object.each(seriesSettings, (key, _val) => {
				defaults[key] = (<any>series).get(key);
			});
			series.states.create("comparingDefaults", defaults);
		}
	}

	protected _maybePrepAxisDefaults(): void {
		const stockSeries = this.get("stockSeries")!;
		const axis = stockSeries.get("yAxis");
		if (!axis.states.lookup("comparingDefaults")) {
			const axisSettings = this.get("percentScaleValueAxisSettings");
			const defaults: any = {};
			$object.each(axisSettings, (key, _val) => {
				defaults[key] = (<any>axis).get(key);
			});
			axis.states.create("comparingDefaults", defaults);
		}
	}

	protected _processIndicator(indicator: Indicator) {
		this.children.push(indicator);
		const stockSeries = this.get("stockSeries");
		if (stockSeries) {
			indicator.set("stockSeries", stockSeries);
		}

		const volumeSeries = this.get("volumeSeries");
		if (volumeSeries) {
			indicator.set("volumeSeries", volumeSeries);
		}

		if (this.getPrivate("comparing")) {
			this.setPercentScale(true);
		}

		indicator.prepareData();
	}

	protected _removeIndicator(indicator: Indicator) {
		this.children.removeValue(indicator);
	}

	protected _removePanel(chart: StockPanel) {
		this.panelsContainer.children.removeValue(chart);
	}

	public _updateControls() {
		const stockSeries = this.get("stockSeries");
		this.panels.each((panel) => {
			const panelControls = panel.panelControls;
			const index = this.panelsContainer.children.indexOf(panel);
			const len = this.panels.length;

			panelControls.upButton.setPrivate("visible", false);
			panelControls.downButton.setPrivate("visible", false);
			panelControls.expandButton.setPrivate("visible", false);
			panelControls.closeButton.setPrivate("visible", false);

			if (len > 1) {
				panelControls.expandButton.setPrivate("visible", true);

				if (index != 0) {
					panelControls.upButton.setPrivate("visible", true);
				}
				if (index != len - 1) {
					panelControls.downButton.setPrivate("visible", true);
				}

				if (!stockSeries || stockSeries.chart != panel) {
					panelControls.closeButton.setPrivate("visible", true);
				}
			}

			if (stockSeries) {
				this.indicators.each((indicator) => {
					indicator.set("stockSeries", stockSeries);
				});
			}
		})

	}

	protected _processPanel(panel: StockPanel) {

		panel.setPrivate("otherCharts", this.panels.values);
		panel.setPrivate("stockChart", this);
		panel.panelControls = panel.topPlotContainer.children.push(PanelControls.new(this._root, { stockPanel: panel, stockChart: this }));
		this._updateControls();

		if (this.panels.length > 1) {
			const resizer = panel.children.push(Rectangle.new(this._root, { themeTags: ["panelresizer"] }))
			resizer.events.on("pointerdown", (e) => {
				const chartsContainer = this.panelsContainer;
				this._downResizer = e.target;
				this.panels.each((chart) => {
					chart.set("height", percent(chart.height() / chartsContainer.height() * 100))
				})

				this._downY = chartsContainer.toLocal(e.point).y;

				const upperChart = this.panels.getIndex(this.panels.indexOf(panel) - 1);
				this._upperPanel = upperChart;
				if (upperChart) {
					this._uhp = upperChart.get("height") as Percent;
				}

				this._dhp = panel.get("height") as Percent;
			})

			resizer.events.on("pointerup", () => {
				this._downResizer = undefined;
			})

			resizer.events.on("globalpointermove", (e) => {
				if (e.target == this._downResizer) {
					const chartsContainer = this.panelsContainer;
					const height = chartsContainer.height();
					const upperChart = this._upperPanel;

					if (upperChart) {
						const index = this.panels.indexOf(upperChart) + 2
						let max = height - panel.get("minHeight", 0);
						const lowerChart = this.panels.getIndex(index);
						if (lowerChart) {
							max = lowerChart.y() - panel.get("minHeight", 0);
						}
						//console.log(upperChart.get("minHeight", 0))
						const y = Math.max(upperChart.y() + upperChart.get("minHeight", 0) + upperChart.get("paddingTop", 0), Math.min(chartsContainer.toLocal(e.point).y, max));

						const downY = this._downY;
						const dhp = this._dhp;
						const uhp = this._uhp;
						if (downY != null && dhp != null && uhp != null) {
							const diff = (downY - y) / height;
							panel.set("height", percent((dhp.value + diff) * 100));
							upperChart.set("height", percent((uhp.value - diff) * 100))
						}
					}
				}
			})
		}
		panel.xAxes.events.onAll((change) => {
			if (change.type === "clear") {
				$array.each(change.oldValues, (axis) => {
					this._removeXAxis(axis);
				})
			} else if (change.type === "push") {
				this._processXAxis(change.newValue);
			} else if (change.type === "setIndex") {
				this._processXAxis(change.newValue);
			} else if (change.type === "insertIndex") {
				this._processXAxis(change.newValue);
			} else if (change.type === "removeIndex") {
				this._removeXAxis(change.oldValue);
			} else {
				throw new Error("Unknown IListEvent type");
			}
		})

		panel.leftAxesContainer.events.on("boundschanged", () => {
			this._syncYAxesSize();
		})

		panel.rightAxesContainer.events.on("boundschanged", () => {
			this._syncYAxesSize();
		})

	}

	protected _syncYAxesSize() {
		var maxLeft = 0;
		var maxRight = 0;
		this.panels.each((chart) => {
			let lw = chart.leftAxesContainer.width();
			let rw = chart.rightAxesContainer.width();
			if (lw > maxLeft) {
				maxLeft = lw;
			}
			if (rw > maxRight) {
				maxRight = rw;
			}
		})
		this.panels.each((chart) => {
			chart.leftAxesContainer.set("minWidth", maxLeft);
			chart.rightAxesContainer.set("minWidth", maxRight);
		})

		this.toolsContainer.set("paddingRight", maxRight);
		this.toolsContainer.set("paddingRight", maxRight);
	}

	protected _removeXAxis(_axis: Axis<AxisRenderer>) {

	}

	protected _processXAxis(axis: Axis<AxisRenderer>) {
		$array.move(this._xAxes, axis);
		axis.on("start", () => {
			if (axis._skipSync != true) {
				this._syncXAxes(axis);
			}
		})
		axis.on("end", () => {
			if (axis._skipSync != true) {
				this._syncXAxes(axis);
			}
		})
	}

	protected _syncXAxes(axis: Axis<AxisRenderer>) {
		$array.each(this._xAxes, (xAxis) => {
			if (xAxis != axis) {
				xAxis._skipSync = true;
				xAxis.set("start", axis.get("start"));
				xAxis.set("end", axis.get("end"));
				xAxis._skipSync = false;
			}
		})
	}

	/**
	 * Returns a color for volume, based on current and previous close.
	 *
	 * * `positiveColor` - close is greater or euqal than close of the previous period.
	 * * `negativeColor` - close is lower than close of the previous period.
	 * 
	 * @param   dataItem       Target data item
	 * @param   negativeColor  "Negative color" (red)
	 * @param   positiveColor  "Positive color" (green)
	 * @return  Color
	 */
	public getVolumeColor(dataItem: DataItem<IXYSeriesDataItem>, negativeColor?: Color, positiveColor?: Color): Color | undefined {
		if (dataItem) {
			const stockSeries = this.get("stockSeries");
			const volumeSeries = dataItem.component;

			if (!negativeColor) {
				negativeColor = this.get("volumeNegativeColor", this.root.interfaceColors.get("negative", Color.fromHex(0xff0000)));
			}

			if (!positiveColor) {
				positiveColor = this.get("volumePositiveColor", this.root.interfaceColors.get("positive", Color.fromHex(0x00FF00)));
			}

			if (stockSeries && volumeSeries) {
				const index = volumeSeries.dataItems.indexOf(dataItem);
				if (index > 0) {
					let stockDataItem = stockSeries.dataItems[index];
					if (stockDataItem) {
						let close = stockDataItem.get("valueY");
						if (close != null) {
							for (let i = index - 1; i >= 0; i--) {
								let di = stockSeries.dataItems[i];
								let previousClose = di.get("valueY");

								if (previousClose != null) {
									if (close < previousClose) {
										return negativeColor;
									}
									else {
										return positiveColor;
									}
								}
							}
						}
					}
				}
			}
		}
		return positiveColor;
	}

}
