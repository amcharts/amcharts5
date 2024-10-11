import type { DataItem } from "../../../core/render/Component";

import { BaseColumnSeries, IBaseColumnSeriesPrivate, IBaseColumnSeriesSettings, IBaseColumnSeriesDataItem, IBaseColumnSeriesAxisRange } from "./BaseColumnSeries";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";
import { RoundedRectangle } from "../../../core/render/RoundedRectangle";

import * as $utils from "../../../core/util/Utils";

export interface IColumnSeriesDataItem extends IBaseColumnSeriesDataItem { }

export interface IColumnSeriesSettings extends IBaseColumnSeriesSettings { }

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

	/**
	 * @ignore
	 */
	public makeColumn(dataItem: DataItem<this["_dataItemSettings"]>, listTemplate: ListTemplate<RoundedRectangle>): RoundedRectangle {
		const column = this.mainContainer.children.push(listTemplate.make());
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
}
