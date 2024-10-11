import type { DataItem } from "../../../core/render/Component";

import { ColumnSeries, IColumnSeriesPrivate, IColumnSeriesSettings, IColumnSeriesDataItem, IColumnSeriesAxisRange } from "./ColumnSeries";
import { Candlestick } from "./Candlestick";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";

import * as $utils from "../../../core/util/Utils";
import * as $array from "../../../core/util/Array";

export interface ICandlestickSeriesDataItem extends IColumnSeriesDataItem {
}

export interface ICandlestickSeriesSettings extends IColumnSeriesSettings {
}

export interface ICandlestickSeriesPrivate extends IColumnSeriesPrivate {
}

export interface ICandlestickSeriesAxisRange extends IColumnSeriesAxisRange {

	/**
	 * A list of [[Candlestick]] element in series.
	 *
	 * @readonly
	 */
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
	public readonly columns: ListTemplate<Candlestick> = this.addDisposer(new ListTemplate(
		Template.new({
			themeTags: ["autocolor"]
		}),
		() => Candlestick._new(this._root, {
			themeTags: $utils.mergeTags(this.columns.template.get("themeTags", []), ["candlestick", "series", "column"])
		}, [this.columns.template])
	));

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
			}, [this.columns.template, axisRange.columns.template])
		);
	}
}
