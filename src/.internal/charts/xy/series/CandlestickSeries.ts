import { ColumnSeries, IColumnSeriesPrivate, IColumnSeriesSettings, IColumnSeriesDataItem, IColumnSeriesAxisRange } from "./ColumnSeries";
import type { DataItem } from "../../../core/render/Component";
import { Candlestick } from "./Candlestick";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";
import * as $utils from "../../../core/util/Utils";
import * as $array from "../../../core/util/Array";

export interface ICandlestickSeriesDataItem extends IColumnSeriesDataItem {
	lowValueX?: number;
	lowValueXWorking?: number;
	lowValueXChange?: number;
	lowValueXChangePercent?: number;
	lowValueXChangeSelection?: number;
	lowValueXChangeSelectionPercent?: number;
	lowValueXChangePrevious?: number;
	lowValueXChangePreviousPercent?: number;
	lowValueXWorkingOpen?: number;
	lowValueXWorkingClose?: number;

	highValueY?: number;
	highValueYWorking?: number;
	highValueYChange?: number;
	highValueYChangePercent?: number;
	highValueYChangeSelection?: number;
	highValueYChangeSelectionPercent?: number;
	highValueYChangePrevious?: number;
	highValueYChangePreviousPercent?: number;
	highValueYWorkingOpen?: number;
	highValueYWorkingClose?: number;
}

export interface ICandlestickSeriesSettings extends IColumnSeriesSettings {

	/**
	 * Input data field for X low value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
	 */
	lowValueXField?: string;

	/**
	 * Input data field for Y low value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
	 */
	lowValueYField?: string;

	/**
	 * Input data field for X high value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
	 */
	highValueXField?: string;

	/**
	 * Input data field for Y high value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
	 */
	highValueYField?: string;

	/**
	 * Display data field for X low value.
	 */
	lowValueXShow?: "lowValueXWorking" | "lowValueXChange" | "lowValueXChangePercent" | "lowValueXChangeSelection" | "lowValueXChangeSelectionPercent" | "lowValueXChangePrevious" | "lowValueXChangePreviousPercent";

	/**
	 * Display data field for Y low value.
	 */
	lowValueYShow?: "lowValueYWorking" | "lowValueYChange" | "lowValueYChangePercent" | "lowValueYChangeSelection" | "lowValueYChangeSelectionPercent" | "lowValueYChangePrevious" | "lowValueYChangePreviousPercent";

	/**
	 * Indicates what aggregate value to use for collective data item, when
	 * aggregating X low values from several data items.
	 */
	lowValueXGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * Indicates what aggregate value to use for collective data item, when
	 * aggregating Y low values from several data items.
	 */
	lowValueYGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * Display data field for X high value.
	 */
	highValueXShow?: "highValueXWorking" | "highValueXChange" | "highValueXChangePercent" | "highValueXChangeSelection" | "highValueXChangeSelectionPercent" | "highValueXChangePrevious" | "highValueXChangePreviousPercent";

	/**
	 * Display data field for Y low value.
	 */
	highValueYShow?: "highValueYWorking" | "highValueYChange" | "highValueYChangePercent" | "highValueYChangeSelection" | "highValueYChangeSelectionPercent" | "highValueYChangePrevious" | "highValueYChangePreviousPercent";

	/**
	 * Indicates what aggregate value to use for collective data item, when
	 * aggregating X high values from several data items.
	 */
	highValueXGrouped?: "open" | "close" | "high" | "high" | "average" | "sum" | "extreme";

	/**
	 * Indicates what aggregate value to use for collective data item, when
	 * aggregating X high values from several data items.
	 */
	highValueYGrouped?: "open" | "close" | "high" | "high" | "average" | "sum" | "extreme";

	/**
	 * Horizontal location of the low data point relative to its cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @default 0.5
	 */
	lowLocationX?: number;

	/**
	 * Vertical location of the low data point relative to its cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @default 0.5
	 */
	lowLocationY?: number;

	/**
	 * Horizontal location of the high data point relative to its cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @default 0.5
	 */
	highLocationX?: number;

	/**
	 * Vertical location of the high data point relative to its cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @default 0.5
	 */
	highLocationY?: number;

}

export interface ICandlestickSeriesPrivate extends IColumnSeriesPrivate {
	lowValueXAverage?: number;
	lowValueXCount?: number;
	lowValueXSum?: number;
	lowValueXAbsoluteSum?: number;
	lowValueXLow?: number;
	lowValueXHigh?: number;
	lowValueXlow?: number;
	lowValueXClose?: number;

	lowValueYAverage?: number;
	lowValueYCount?: number;
	lowValueYSum?: number;
	lowValueYAbsoluteSum?: number;
	lowValueYLow?: number;
	lowValueYHigh?: number;
	lowValueYlow?: number;
	lowValueYClose?: number;

	lowValueXAverageSelection?: number;
	lowValueXCountSelection?: number;
	lowValueXSumSelection?: number;
	lowValueXAbsoluteSumSelection?: number;
	lowValueXLowSelection?: number;
	lowValueXHighSelection?: number;
	lowValueXlowSelection?: number;
	lowValueXCloseSelection?: number;

	lowValueYAverageSelection?: number;
	lowValueYCountSelection?: number;
	lowValueYSumSelection?: number;
	lowValueYAbsoluteSumSelection?: number;
	lowValueYLowSelection?: number;
	lowValueYHighSelection?: number;
	lowValueYlowSelection?: number;
	lowValueYCloseSelection?: number;

	highValueXAverage?: number;
	highValueXCount?: number;
	highValueXSum?: number;
	highValueXAbsoluteSum?: number;
	highValueXLow?: number;
	highValueXHigh?: number;
	highValueXhigh?: number;
	highValueXClose?: number;

	highValueYAverage?: number;
	highValueYCount?: number;
	highValueYSum?: number;
	highValueYAbsoluteSum?: number;
	highValueYLow?: number;
	highValueYHigh?: number;
	highValueYhigh?: number;
	highValueYClose?: number;

	highValueXAverageSelection?: number;
	highValueXCountSelection?: number;
	highValueXSumSelection?: number;
	highValueXAbsoluteSumSelection?: number;
	highValueXLowSelection?: number;
	highValueXHighSelection?: number;
	highValueXhighSelection?: number;
	highValueXCloseSelection?: number;

	highValueYAverageSelection?: number;
	highValueYCountSelection?: number;
	highValueYSumSelection?: number;
	highValueYAbsoluteSumSelection?: number;
	highValueYLowSelection?: number;
	highValueYHighSelection?: number;
	highValueYhighSelection?: number;
	highValueYCloseSelection?: number;
}

export interface ICandlestickSeriesAxisRange extends IColumnSeriesAxisRange {
	columns: ListTemplate<Candlestick>
}

/**
 * Candlestick series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
 * @important
 */
export class CandlestickSeries extends ColumnSeries {

	declare public _settings: ICandlestickSeriesSettings;
	declare public _privateSettings: ICandlestickSeriesPrivate;
	declare public _dataItemSettings: ICandlestickSeriesDataItem;
	declare public _axisRangeType: ICandlestickSeriesAxisRange;

	public static className: string = "CandlestickSeries";
	public static classNames: Array<string> = ColumnSeries.classNames.concat([CandlestickSeries.className]);

	protected _afterNew() {
		this.valueFields.push("lowValueX", "lowValueY", "highValueX", "highValueY");
		this.valueXFields.push("lowValueX", "highValueX");
		this.valueYFields.push("lowValueY", "highValueY");

		this._setRawDefault("lowValueXShow", "lowValueXWorking");
		this._setRawDefault("lowValueYShow", "lowValueYWorking");

		this._setRawDefault("highValueXShow", "highValueXWorking");
		this._setRawDefault("highValueYShow", "highValueYWorking");

		this._setRawDefault("lowValueXGrouped", "low");
		this._setRawDefault("lowValueYGrouped", "low");

		this._setRawDefault("highValueXGrouped", "high");
		this._setRawDefault("highValueYGrouped", "high");

		super._afterNew();
	}

	/**
	 * @ignore
	 */
	public makeColumn(dataItem: DataItem<this["_dataItemSettings"]>, listTemplate: ListTemplate<Candlestick>): Candlestick {
		const column = this.mainContainer.children.push(listTemplate.make());
		column._setDataItem(dataItem);
		listTemplate.push(column);
		return column;
	}

	/**
	 * A list of candles in the series.
	 *
	 * `columns.template` can be used to configure candles.
	 *
	 * @default new ListTemplate<Candlestick>
	 */
	public readonly columns: ListTemplate<Candlestick> = new ListTemplate(
		Template.new({
			themeTags: ["autocolor"]
		}),
		() => Candlestick._new(this._root, {
			themeTags: $utils.mergeTags(this.columns.template.get("themeTags", []), ["candlestick", "series", "column"])
		}, [this.columns.template])
	);

	protected _updateGraphics(dataItem: DataItem<this["_dataItemSettings"]>, previousDataItem: DataItem<this["_dataItemSettings"]>) {
		super._updateGraphics(dataItem, previousDataItem);

		const xAxis = this.getRaw("xAxis");
		const yAxis = this.getRaw("yAxis");
		const baseAxis = this.getRaw("baseAxis");

		let vcy = this.get("vcy", 1);
		let vcx = this.get("vcx", 1);

		let lx0: number;
		let lx1: number;
		let ly0: number;
		let ly1: number;

		let hx0: number;
		let hx1: number;
		let hy0: number;
		let hy1: number;

		let locationX = this.get("locationX", dataItem.get("locationX", 0.5));
		let locationY = this.get("locationY", dataItem.get("locationY", 0.5));

		let openLocationX = this.get("openLocationX", dataItem.get("openLocationX", locationX));
		let openLocationY = this.get("openLocationY", dataItem.get("openLocationY", locationY));

		let orientation: "horizontal" | "vertical";

		if (yAxis === baseAxis) {
			let open = xAxis.getDataItemPositionX(dataItem, this._xOpenField, 1, vcx);
			let close = xAxis.getDataItemPositionX(dataItem, this._xField, 1, vcx);

			lx1 = xAxis.getDataItemPositionX(dataItem, this._xLowField, 1, vcx);
			hx1 = xAxis.getDataItemPositionX(dataItem, this._xHighField, 1, vcx);

			hx0 = Math.max(open, close);
			lx0 = Math.min(open, close);

			let startLocation = this._aLocationY0 + openLocationY - 0.5;
			let endLocation = this._aLocationY1 + locationY - 0.5;

			ly0 = yAxis.getDataItemPositionY(dataItem, this._yField, startLocation + (endLocation - startLocation) / 2, vcy);
			ly1 = ly0;
			hy0 = ly0;
			hy1 = ly0;

			orientation = "horizontal";
		}
		else {
			let open = yAxis.getDataItemPositionY(dataItem, this._yOpenField, 1, vcy);
			let close = yAxis.getDataItemPositionY(dataItem, this._yField, 1, vcy);

			ly1 = yAxis.getDataItemPositionY(dataItem, this._yLowField, 1, vcy);
			hy1 = yAxis.getDataItemPositionY(dataItem, this._yHighField, 1, vcy);

			hy0 = Math.max(open, close);
			ly0 = Math.min(open, close);

			let startLocation = this._aLocationX0 + openLocationX - 0.5;
			let endLocation = this._aLocationX1 + locationX - 0.5;

			lx0 = xAxis.getDataItemPositionX(dataItem, this._xField, startLocation + (endLocation - startLocation) / 2, vcx);
			lx1 = lx0;
			hx0 = lx0;
			hx1 = lx0;

			orientation = "vertical";
		}

		this._updateCandleGraphics(dataItem, lx0, lx1, ly0, ly1, hx0, hx1, hy0, hy1, orientation)
	}

	protected _updateCandleGraphics(dataItem: DataItem<this["_dataItemSettings"]>, lx0: number, lx1: number, ly0: number, ly1: number, hx0: number, hx1: number, hy0: number, hy1: number, orientation: "horizontal" | "vertical") {
		let column = dataItem.get("graphics") as Candlestick;

		if (column) {
			let pl0 = this.getPoint(lx0, ly0);
			let pl1 = this.getPoint(lx1, ly1);

			let ph0 = this.getPoint(hx0, hy0);
			let ph1 = this.getPoint(hx1, hy1);

			let x = column.x();
			let y = column.y();

			column.set("lowX0", pl0.x - x);
			column.set("lowY0", pl0.y - y);

			column.set("lowX1", pl1.x - x);
			column.set("lowY1", pl1.y - y);

			column.set("highX0", ph0.x - x);
			column.set("highY0", ph0.y - y);

			column.set("highX1", ph1.x - x);
			column.set("highY1", ph1.y - y);

			column.set("orientation", orientation);

			let rangeGraphics = dataItem.get("rangeGraphics")!;
			if (rangeGraphics) {
				$array.each(rangeGraphics, (column: any) => {
					column.set("lowX0", pl0.x - x);
					column.set("lowY0", pl0.y - y);

					column.set("lowX1", pl1.x - x);
					column.set("lowY1", pl1.y - y);

					column.set("highX0", ph0.x - x);
					column.set("highY0", ph0.y - y);

					column.set("highX1", ph1.x - x);
					column.set("highY1", ph1.y - y);

					column.set("orientation", orientation);
				})
			}
		}
	}

	protected _processAxisRange(axisRange: this["_axisRangeType"]) {
		super._processAxisRange(axisRange);
		axisRange.columns = new ListTemplate(
			Template.new({}),
			() => Candlestick._new(this._root, {
				themeTags: $utils.mergeTags(axisRange.columns.template.get("themeTags", []), ["candlestick", "series", "column"]),
			}, [axisRange.columns.template])
		);
	}
}
