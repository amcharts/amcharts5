import type { XYSeries } from "../../xy/series/XYSeries";
import type { AxisRenderer } from "../../xy/axes/AxisRenderer";

import { Indicator, IIndicatorSettings, IIndicatorPrivate, IIndicatorEvents } from "./Indicator";
import { StockPanel } from "../StockPanel";
import { XYCursor } from "../../xy/XYCursor";
import { DateAxis } from "../../xy/axes/DateAxis";
import { GaplessDateAxis } from "../../xy/axes/GaplessDateAxis";
import { ValueAxis } from "../../xy/axes/ValueAxis";
import { AxisRendererX } from "../../xy/axes/AxisRendererX";
import { AxisRendererY } from "../../xy/axes/AxisRendererY";
import { Tooltip } from "../../../core/render/Tooltip";
import { StockLegend } from "../StockLegend";


export interface IChartIndicatorSettings extends IIndicatorSettings {
}

export interface IChartIndicatorPrivate extends IIndicatorPrivate {
}

export interface IChartIndicatorEvents extends IIndicatorEvents {
}


/**
 * A base class for chart-based [[StockChart]] indicators.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export abstract class ChartIndicator extends Indicator {
	public static className: string = "ChartIndicator";
	public static classNames: Array<string> = Indicator.classNames.concat([ChartIndicator.className]);

	declare public _settings: IChartIndicatorSettings;
	declare public _privateSettings: IChartIndicatorPrivate;
	declare public _events: IChartIndicatorEvents;

	public panel!: StockPanel;
	public xAxis!: DateAxis<AxisRenderer>;
	public yAxis!: ValueAxis<AxisRenderer>;
	public cursor!: XYCursor;
	public legend!: StockLegend;

	protected _themeTag?: string;
	protected _themeTags: Array<string> = ["indicator"];

	protected _afterNew() {
		super._afterNew();

		const stockChart = this.get("stockChart");
		const stockSeries = this.get("stockSeries");
		const seriesChart = stockSeries.chart;
		const root = this._root;
		if (stockChart && seriesChart) {
			// make chart
			const chart = stockChart.panels.push(StockPanel.new(root, { themeTags: this._themeTags }));
			chart.addTag("indicator");
			this.panel = chart;

			this.addDisposer(stockChart.panels.events.on("removeIndex", (e) => {
				if (e.oldValue == chart) {
					stockChart.indicators.removeValue(this);
				}
			}))

			const seriesXAxis = stockSeries.get("xAxis") as any;

			// xAxis
			const xRenderer = AxisRendererX.new(root, {});
			let xAxis: DateAxis<AxisRenderer> | GaplessDateAxis<AxisRenderer> | undefined;
			let baseInterval = seriesXAxis.get("baseInterval");
			let start = seriesXAxis.get("start");
			let end = seriesXAxis.get("end");

			if (seriesXAxis instanceof GaplessDateAxis) {
				xAxis = chart.xAxes.push(GaplessDateAxis.new(root, { renderer: xRenderer, baseInterval: baseInterval }));
			}
			else {
				xAxis = chart.xAxes.push(DateAxis.new(root, { renderer: xRenderer, baseInterval: baseInterval }));
			}

			xRenderer.set("minorGridEnabled", seriesXAxis.get("renderer")?.get("minorGridEnabled"));
			xAxis.set("groupData", seriesXAxis.get("groupData"));
			xAxis.set("groupCount", seriesXAxis.get("groupCount"));

			xAxis.set("tooltip", Tooltip.new(root, { themeTags: ["indicator"] }));

			xAxis.setAll({ start: start, end: end })
			this.xAxis = xAxis;

			// yAxis
			const yRenderer = AxisRendererY.new(root, {
				minGridDistance: 20
			});
			const yTooltip = Tooltip.new(root, { themeTags: ["indicator"] });

			const yAxis = chart.yAxes.push(ValueAxis.new(root, {
				renderer: yRenderer,
				tooltip: yTooltip
			}))
			this.yAxis = yAxis;

			const series = this._createSeries();
			this.series = series;

			// legend
			const legend = chart.topPlotContainer.children.insertIndex(0,
				StockLegend.new(root, { stockChart: this.get("stockChart") })
			);

			legend.data.push(series);

			const legendDataItem = legend.dataItems[legend.dataItems.length - 1];
			legendDataItem.set("panel", chart);
			legendDataItem.get("marker").set("forceHidden", true);

			const settingsButton = legendDataItem.get("settingsButton");
			settingsButton.setPrivate("customData", this);

			const editableSettings = this._editableSettings;
			if (!editableSettings || editableSettings.length == 0) {
				settingsButton.set("forceHidden", true);
			}

			chart.set("cursor", XYCursor.new(root, { yAxis: yAxis, xAxis: xAxis }));
		}
	}

	protected _dispose() {
		super._dispose();
		const stockChart = this.get("stockChart");
		stockChart.panels.removeValue(this.panel);
	}

	public async hide(duration?: number): Promise<any> {
		return Promise.all([
			super.hide(duration),
			this.panel.hide(duration)
		]);
	}

	public async show(duration?: number): Promise<any> {
		return Promise.all([
			super.show(duration),
			this.panel.show(duration)
		]);
	}

	protected abstract _createSeries(): XYSeries;
}