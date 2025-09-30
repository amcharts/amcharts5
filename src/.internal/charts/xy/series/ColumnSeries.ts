import type { DataItem } from "../../../core/render/Component";
import type { Color } from "../../../core/util/Color";

import { BaseColumnSeries, IBaseColumnSeriesPrivate, IBaseColumnSeriesSettings, IBaseColumnSeriesDataItem, IBaseColumnSeriesAxisRange } from "./BaseColumnSeries";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";
import { RoundedRectangle } from "../../../core/render/RoundedRectangle";
import { Graphics } from "../../../core/render/Graphics";

import * as $utils from "../../../core/util/Utils";
import * as $array from "../../../core/util/Array";

export interface IColumnSeriesDataItem extends IBaseColumnSeriesDataItem { }

export interface IColumnSeriesSettings extends IBaseColumnSeriesSettings {

	/**
	 * Enables "turbo mode" of rendering.
	 * 
	 * If enabled, the columsn will be drawn directly on canvas, rather than
	 * each individually, significantly speeding up the rendering. Especially
	 * on column-heavy charts.
	 *
	 * NOTE: this is an experimental feature and may not work in all setups. Some
	 * features might be disabled, too, e.g. pointer events and rounded corners.
	 *
	 * @since 5.14.0
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/column-series/#Turbo_mode} for more info
	 */
	turboMode?: boolean;

}

export interface IColumnSeriesPrivate extends IBaseColumnSeriesPrivate { }

export interface IColumnSeriesAxisRange extends IBaseColumnSeriesAxisRange {
	/**
	 * A list of actual columns in a range.
	 */
	columns: ListTemplate<RoundedRectangle>
}

export class ColumnSeries extends BaseColumnSeries {

	declare public _settings: IColumnSeriesSettings;
	declare public _privateSettings: IColumnSeriesPrivate;
	declare public _dataItemSettings: IColumnSeriesDataItem;
	declare public _axisRangeType: IColumnSeriesAxisRange;

	public allColumns: Graphics = this.children.push(Graphics.new(this._root, {}));
	public allColumnsData: Array<{ width: number, height: number, x: number, y: number, lowX0?: number, lowY0?: number, lowX1?: number, lowY1?: number, highX0?: number, highY0?: number, highX1?: number, highY1?: number, stroke?: Color, fill?: Color, strokeWidth: number, strokeOpacity: number, fillOpacity: number }> = [];

	/**
	 * @ignore
	 */
	public makeColumn(dataItem: DataItem<this["_dataItemSettings"]>, listTemplate: ListTemplate<RoundedRectangle>): RoundedRectangle {
		const column = listTemplate.make();
		if (!this.get("turboMode")) {
			this.mainContainer.children.push(column);
		}
		else {
			column.virtualParent = this.chart;
		}

		column._setDataItem(dataItem);
		listTemplate.push(column);
		return column;
	}

	/**
	 * A [[TemplateList]] of all columns in series.
	 *
	 * `columns.template` can be used to set default settings for all columns,
	 * or to change on existing ones.
	 */
	public readonly columns: ListTemplate<RoundedRectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => RoundedRectangle._new(this._root, {
			position: "absolute",
			themeTags: $utils.mergeTags(this.columns.template.get("themeTags", []), ["series", "column"])
		}, [this.columns.template])
	));

	public static className: string = "ColumnSeries";
	public static classNames: Array<string> = BaseColumnSeries.classNames.concat([ColumnSeries.className]);


	protected _processAxisRange(axisRange: this["_axisRangeType"]) {
		super._processAxisRange(axisRange);
		axisRange.columns = new ListTemplate(
			Template.new({}),
			() => RoundedRectangle._new(this._root, {
				position: "absolute",
				themeTags: $utils.mergeTags(axisRange.columns.template.get("themeTags", []), ["series", "column"]),
			}, [this.columns.template, axisRange.columns.template])
		);
	}

	protected _beforeColumnsDraw() {
		this.allColumnsData = [];
	}

	protected _afterColumnsDraw() {
		if (this.get("turboMode")) {

			this.allColumns.set("draw", (display) => {
				display.clear();

				$array.each(this.allColumnsData, (column) => {
					const w = column.width;
					const h = column.height;
					const x = column.x;
					const y = column.y;
					const stroke = column.stroke;
					const fill = column.fill;
					const strokeWidth = column.strokeWidth;
					const strokeOpacity = column.strokeOpacity;
					const fillOpacity = column.fillOpacity;

					display.beginFill(fill, fillOpacity);
					display.beginPath();
					display.lineStyle(strokeWidth, stroke, strokeOpacity);
					display.drawRect(x, y, w, h);
					display.endStroke();
					display.endFill();
				});
			})
		}
	}


	protected _updateSeriesGraphics(dataItem: DataItem<this["_dataItemSettings"]>, graphics: Graphics, l: number, r: number, t: number, b: number, fitW: boolean, fitH: boolean) {
		if (this.get("turboMode")) {
			const stroke = graphics.get("stroke");
			const fillOpacity = graphics.get("fillOpacity", 1);
			const strokeOpacity = graphics.get("strokeOpacity", 1);
			const strokWidth = graphics.get("strokeWidth", 1);
			const fill = graphics.get("fill");

			const ptl = this.getPoint(l, t);
			const pbr = this.getPoint(r, b);

			const tooltipPoint = dataItem.get("point");

			if (tooltipPoint) {
				const point = this.getPoint(tooltipPoint.x, tooltipPoint.y);
				tooltipPoint.x = point.x + this._x;
				tooltipPoint.y = point.y + this._y;
			}

			l = ptl.x;
			r = pbr.x;

			t = ptl.y;
			b = pbr.y;

			dataItem.setRaw("left", l);
			dataItem.setRaw("right", r);
			dataItem.setRaw("top", t);
			dataItem.setRaw("bottom", b);

			this.allColumnsData.push({ width: r - l, height: b - t, x: l, y: t, stroke: stroke, fill: fill, strokeWidth: strokWidth, strokeOpacity: strokeOpacity, fillOpacity: fillOpacity });
		}
		else {
			super._updateSeriesGraphics(dataItem, graphics, l, r, t, b, fitW, fitH);
		}
	}
}
