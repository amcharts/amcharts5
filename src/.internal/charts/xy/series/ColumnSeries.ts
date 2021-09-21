import { BaseColumnSeries, IBaseColumnSeriesPrivate, IBaseColumnSeriesSettings, IBaseColumnSeriesDataItem, IBaseColumnSeriesAxisRange } from "./BaseColumnSeries";
import type { Root } from "../../../core/Root";
import type { DataItem } from "../../../core/render/Component";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";
import { RoundedRectangle } from "../../../core/render/RoundedRectangle";
import * as $utils from "../../../core/util/Utils";

export interface IColumnSeriesDataItem extends IBaseColumnSeriesDataItem { }

export interface IColumnSeriesSettings extends IBaseColumnSeriesSettings { }

export interface IColumnSeriesPrivate extends IBaseColumnSeriesPrivate { }

export interface IColumnSeriesAxisRange extends IBaseColumnSeriesAxisRange {
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
	public readonly columns: ListTemplate<RoundedRectangle> = new ListTemplate(
		Template.new({}),
		() => RoundedRectangle.new(this._root, {
			position: "absolute",
			themeTags: $utils.mergeTags(this.columns.template.get("themeTags", []), ["series", "column"])
		}, this.columns.template)
	);

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: ColumnSeries["_settings"], template?: Template<ColumnSeries>): ColumnSeries {
		const x = new ColumnSeries(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "ColumnSeries";
	public static classNames: Array<string> = BaseColumnSeries.classNames.concat([ColumnSeries.className]);


	protected _processAxisRange(axisRange: this["_axisRangeType"]) {
		super._processAxisRange(axisRange);
		axisRange.columns = new ListTemplate(
			Template.new({}),
			() => RoundedRectangle.new(this._root, { position: "absolute", themeTags: $utils.mergeTags(axisRange.columns.template.get("themeTags", []), ["series", "column"]) }, axisRange.columns.template)
		);
	}
}
