import { CandlestickSeries, ICandlestickSeriesPrivate, ICandlestickSeriesSettings, ICandlestickSeriesDataItem, ICandlestickSeriesAxisRange } from "./CandlestickSeries";
import { OHLC } from "./OHLC";
import type { Root } from "../../../core/Root";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";
import type { DataItem } from "../../../core/render/Component";
import * as $utils from "../../../core/util/Utils";

export interface IOHLCSeriesDataItem extends ICandlestickSeriesDataItem {
	column?: OHLC;
}

export interface IOHLCSeriesSettings extends ICandlestickSeriesSettings {
}

export interface IOHLCSeriesPrivate extends ICandlestickSeriesPrivate {
}

export interface IOHLCSeriesAxisRange extends ICandlestickSeriesAxisRange {
	columns: ListTemplate<OHLC>
}

/**
 * OHLC series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
 * @important
 */
export class OHLCSeries extends CandlestickSeries {

	declare public _settings: IOHLCSeriesSettings;
	declare public _privateSettings: IOHLCSeriesPrivate;
	declare public _dataItemSettings: IOHLCSeriesDataItem;
	declare public _axisRangeType: IOHLCSeriesAxisRange;

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: OHLCSeries["_settings"], template?: Template<OHLCSeries>): OHLCSeries {
		const x = new OHLCSeries(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "OHLCSeries";
	public static classNames: Array<string> = CandlestickSeries.classNames.concat([OHLCSeries.className]);

	/**
	 * @ignore
	 */
	public makeColumn(dataItem: DataItem<this["_dataItemSettings"]>, listTemplate: ListTemplate<OHLC>): OHLC {
		const column = this.mainContainer.children.push(listTemplate.make());
		column._setDataItem(dataItem);
		listTemplate.push(column);
		return column;
	}

	/**
	 * A list of OHLC bars in the series.
	 *
	 * `columns.template` can be used to configure OHLC bars.
	 *
	 * @default new ListTemplate<OHLC>
	 */
	public readonly columns: ListTemplate<OHLC> = new ListTemplate(
		Template.new({
			themeTags: ["autocolor"]
		}),
		() => OHLC.new(this._root, {
			themeTags: $utils.mergeTags(this.columns.template.get("themeTags", []), ["ohlc", "series", "column"])
		}, this.columns.template)
	);

	protected _processAxisRange(axisRange: this["_axisRangeType"]) {
		super._processAxisRange(axisRange);
		axisRange.columns = new ListTemplate(
			Template.new({}),
			() => OHLC.new(this._root, { themeTags: $utils.mergeTags(axisRange.columns.template.get("themeTags", []), ["ohlc", "series", "column"]) }, axisRange.columns.template)
		);
	}	
}