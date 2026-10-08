import type { Axis, IAxisPrivate, IAxisDataItem } from "../axes/Axis";
import type { AxisRenderer } from "../axes/AxisRenderer";
import type { IPoint } from "../../../core/util/IPoint";
import type { Sprite } from "../../../core/render/Sprite";
import type { Bullet } from "../../../core/render/Bullet";
import type { XYChart } from "../XYChart";
import type { CategoryAxis } from "../axes/CategoryAxis";
import type { DateAxis } from "../axes/DateAxis";
import type { ITimeInterval } from "../../../core/util/Time";
import type { IDisposer } from "../../../core/util/Disposer";

import { DataItem } from "../../../core/render/Component";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "../../../core/render/Series";
import { List } from "../../../core/util/List";
import { Container } from "../../../core/render/Container";
import { Graphics } from "../../../core/render/Graphics";


import * as $type from "../../../core/util/Type";
import * as $object from "../../../core/util/Object";
import * as $array from "../../../core/util/Array";
import * as $utils from "../../../core/util/Utils";

/**
 * @ignore
 */
function min(left: number | undefined, right: number | undefined): number | undefined {
	if (left == null) return right;
	if (right == null) return left;
	return (right < left) ? right : left;
}

/**
 * @ignore
 */
function max(left: number | undefined, right: number | undefined): number | undefined {
	if (left == null) return right;
	if (right == null) return left;
	return (left > right) ? left : right;
}


/**
 * An axis range of a series: a stretch of an axis within which the series
 * can look different.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-ranges/#Series_axis_ranges} for more info
 */
export interface IXYSeriesAxisRange {

	/**
	 * The axis data item that sets where the range starts and ends.
	 */
	axisDataItem: DataItem<IAxisDataItem>;

	/**
	 * Container that holds the range's elements.
	 */
	container?: Container;

	/**
	 * The series the range belongs to.
	 */
	series?: XYSeries;

}

export interface IXYAxisPrivate extends IAxisPrivate {
	min?: number;
	max?: number;
}

export interface IXYAxis extends Axis<AxisRenderer> {
	_privateSettings: IXYAxisPrivate;
}

export interface IXYSeriesEvents extends ISeriesEvents {

	/**
	 * The series switched to another data set, such as data grouped by
	 * another interval on a [[DateAxis]]. `id` names the new set.
	 *
	 * @since 5.1.1
	 */
	datasetchanged: {
		id: string
	}
}

/**
 * XY chart series data item.
 */
export interface IXYSeriesDataItem extends ISeriesDataItem {
	valueX?: number;
	valueXWorking?: number;
	valueXChange?: number;
	valueXChangePercent?: number;
	valueXChangeSelection?: number;
	valueXChangeSelectionPercent?: number;
	valueXChangePrevious?: number;
	valueXChangePreviousPercent?: number;
	valueXWorkingOpen?: number;
	valueXWorkingClose?: number;

	valueY?: number;
	valueYChange?: number;
	valueYWorking?: number;
	valueYChangePercent?: number;
	valueYChangeSelection?: number;
	valueYChangeSelectionPercent?: number;
	valueYChangePrevious?: number;
	valueYChangePreviousPercent?: number;
	valueYWorkingOpen?: number;
	valueYWorkingClose?: number;

	openValueX?: number;
	openValueXWorking?: number;
	openValueXChange?: number;
	openValueXChangePercent?: number;
	openValueXChangeSelection?: number;
	openValueXChangeSelectionPercent?: number;
	openValueXChangePrevious?: number;
	openValueXChangePreviousPercent?: number;
	openValueXWorkingOpen?: number;
	openValueXWorkingClose?: number;
	openValueY?: number;
	openValueYWorking?: number;
	openValueYChange?: number;
	openValueYChangePercent?: number;
	openValueYChangeSelection?: number;
	openValueYChangeSelectionPercent?: number;
	openValueYChangePrevious?: number;
	openValueYChangePreviousPercent?: number;
	openValueYWorkingOpen?: number;
	openValueYWorkingClose?: number;

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

	highValueX?: number;
	highValueXWorking?: number;
	highValueXChange?: number;
	highValueXChangePercent?: number;
	highValueXChangeSelection?: number;
	highValueXChangeSelectionPercent?: number;
	highValueXChangePrevious?: number;
	highValueXChangePreviousPercent?: number;
	highValueXWorkingOpen?: number;
	highValueXWorkingClose?: number;

	lowValueY?: number;
	lowValueYWorking?: number;
	lowValueYChange?: number;
	lowValueYChangePercent?: number;
	lowValueYChangeSelection?: number;
	lowValueYChangeSelectionPercent?: number;
	lowValueYChangePrevious?: number;
	lowValueYChangePreviousPercent?: number;
	lowValueYWorkingOpen?: number;
	lowValueYWorkingClose?: number;

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

	categoryX?: string;
	categoryY?: string;

	openCategoryX?: string;
	openCategoryY?: string;

	locationX?: number;
	locationY?: number;

	openLocationX?: number;
	openLocationY?: number;

	stackToItemX?: DataItem<IXYSeriesDataItem>;
	stackToItemY?: DataItem<IXYSeriesDataItem>;

	left?: number;
	right?: number;
	top?: number;
	bottom?: number;

	point?: IPoint;

	originals?: Array<DataItem<IXYSeriesDataItem>>;
}

export interface IXYSeriesSettings extends ISeriesSettings {

	/**
	 * Places data points at their exact date on a [[DateAxis]] X axis,
	 * ignoring `locationX`. When that axis is the base axis, a column then
	 * spans exactly from its open date to its date, so it needs an
	 * `openValueXField` to have any width.
	 *
	 * @default false
	 * @since 5.13.0
	 */
	exactLocationX?: boolean;

	/**
	 * Places data points at their exact date on a [[DateAxis]] Y axis,
	 * ignoring `locationY`. Columns are not affected.
	 *
	 * @default false
	 * @since 5.13.0
	 */
	exactLocationY?: boolean;

	/**
	 * Makes the value axis scale to the series' values within the visible
	 * range only, instead of all its values. Useful for stacked series.
	 *
	 * @since 5.10.11
	 */
	useSelectionExtremes?: boolean;

	/**
	 * Hides the bullets while data items are, on average, closer than this
	 * many pixels to each other along the base axis.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Bullets} for more info
	 */
	minBulletDistance?: number;

	/**
	 * The X axis the series is plotted against. Must be set when creating the
	 * series; it can be switched to another axis of the same type later.
	 */
	xAxis: IXYAxis;

	/**
	 * The Y axis the series is plotted against. Must be set when creating the
	 * series; it can be switched to another axis of the same type later.
	 */
	yAxis: IXYAxis;

	/**
	 * Stacks the series on the one before it in the chart's `series` that has
	 * the same axes and is of the same type. The first series of a stack
	 * doesn't need it set.
	 *
	 * Stacking goes by data item index, so all stacked series need the same
	 * data items (dates or categories), in the same order.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Stacked_series} for more info
	 */
	stacked?: boolean;

	/**
	 * When stacking, puts negative values on the negative values below and
	 * positive on positive, so the stack grows away from zero both ways. With
	 * `false`, each value goes on the one right below it, whatever its sign.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Negative_value_stacking} for more info
	 */
	stackToNegative?: boolean;

	/**
	 * The axis the series runs along, such as the category axis of a column
	 * series; the other axis holds its values. If not set, the chart picks the
	 * Y axis when it is a category or date axis, and the X axis otherwise.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Base_axis} for more info
	 */
	baseAxis?: IXYAxis;

	/**
	 * Data field with the X value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	valueXField?: string;

	/**
	 * Data field with the Y value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	valueYField?: string;

	/**
	 * Leaves the series out of the totals (`valueYTotal`, `valueYTotalPercent`
	 * and the like) that a value axis with `calculateTotals` works out.
	 *
	 * @default false
	 */
	excludeFromTotal?: boolean;

	/**
	 * Which form of the X value the series plots on a [[ValueAxis]]: the value
	 * itself (`"valueXWorking"`), or one worked out from it, such as its change
	 * since the first visible data item (`"valueXChangeSelection"`) or its
	 * percent of the total (`"valueXTotalPercent"`).
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 * @default "valueXWorking"
	 */
	valueXShow?: "valueXWorking" | "valueXChange" | "valueXChangePercent" | "valueXChangeSelection" | "valueXChangeSelectionPercent" | "valueXChangePrevious" | "valueXChangePreviousPercent" | "valueXTotal" | "valueXTotalPercent" | "valueXSum";

	/**
	 * Which form of the Y value the series plots on a [[ValueAxis]]: the value
	 * itself (`"valueYWorking"`), or one worked out from it, such as its change
	 * since the first visible data item (`"valueYChangeSelection"`) or its
	 * percent of the total (`"valueYTotalPercent"`).
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 * @default "valueYWorking"
	 */
	valueYShow?: "valueYWorking" | "valueYChange" | "valueYChangePercent" | "valueYChangeSelection" | "valueYChangeSelectionPercent" | "valueYChangePrevious" | "valueYChangePreviousPercent" | "valueYTotal" | "valueYTotalPercent" | "valueYSum";

	/**
	 * How a [[DateAxis]] with `groupData` combines the X values of the data
	 * items it groups into one: `"open"` takes the first, `"close"` the last,
	 * `"extreme"` the one farthest from zero, and the rest as named.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 * @default "close"
	 */
	valueXGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * How a [[DateAxis]] with `groupData` combines the Y values of the data
	 * items it groups into one: `"open"` takes the first, `"close"` the last,
	 * `"extreme"` the one farthest from zero, and the rest as named.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 * @default "close"
	 */
	valueYGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * Data field with the open X value, such as where a horizontal column
	 * starts.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openValueXField?: string;

	/**
	 * Data field with the open Y value, such as where a column starts.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openValueYField?: string;

	/**
	 * Which form of the open X value the series plots; see `valueXShow`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openValueXShow?: "openValueXWorking" | "openValueXChange" | "openValueXChangePercent" | "openValueXChangeSelection" | "openValueXChangeSelectionPercent" | "openValueXChangePrevious" | "openValueXChangePreviousPercent";

	/**
	 * Which form of the open Y value the series plots; see `valueYShow`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openValueYShow?: "openValueYWorking" | "openValueYChange" | "openValueYChangePercent" | "openValueYChangeSelection" | "openValueYChangeSelectionPercent" | "openValueYChangePrevious" | "openValueYChangePreviousPercent";

	/**
	 * How grouping combines the open X values; see `valueXGrouped`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 * @default "open"
	 */
	openValueXGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * How grouping combines the open Y values; see `valueYGrouped`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 * @default "open"
	 */
	openValueYGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";



	/**
	 * Data field with the low X value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
	 */
	lowValueXField?: string;

	/**
	 * Data field with the low Y value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
	 */
	lowValueYField?: string;

	/**
	 * Data field with the high X value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
	 */
	highValueXField?: string;

	/**
	 * Data field with the high Y value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/candlestick-series/} for more info
	 */
	highValueYField?: string;

	/**
	 * Which form of the low X value the series plots; see `valueXShow`.
	 */
	lowValueXShow?: "lowValueXWorking" | "lowValueXChange" | "lowValueXChangePercent" | "lowValueXChangeSelection" | "lowValueXChangeSelectionPercent" | "lowValueXChangePrevious" | "lowValueXChangePreviousPercent";

	/**
	 * Which form of the low Y value the series plots; see `valueYShow`.
	 */
	lowValueYShow?: "lowValueYWorking" | "lowValueYChange" | "lowValueYChangePercent" | "lowValueYChangeSelection" | "lowValueYChangeSelectionPercent" | "lowValueYChangePrevious" | "lowValueYChangePreviousPercent";

	/**
	 * How grouping combines the low X values; see `valueXGrouped`.
	 *
	 * @default "low"
	 */
	lowValueXGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * How grouping combines the low Y values; see `valueYGrouped`.
	 *
	 * @default "low"
	 */
	lowValueYGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * Which form of the high X value the series plots; see `valueXShow`.
	 */
	highValueXShow?: "highValueXWorking" | "highValueXChange" | "highValueXChangePercent" | "highValueXChangeSelection" | "highValueXChangeSelectionPercent" | "highValueXChangePrevious" | "highValueXChangePreviousPercent";

	/**
	 * Which form of the high Y value the series plots; see `valueYShow`.
	 */
	highValueYShow?: "highValueYWorking" | "highValueYChange" | "highValueYChangePercent" | "highValueYChangeSelection" | "highValueYChangeSelectionPercent" | "highValueYChangePrevious" | "highValueYChangePreviousPercent";

	/**
	 * How grouping combines the high X values; see `valueXGrouped`.
	 *
	 * @default "high"
	 */
	highValueXGrouped?: "open" | "close" | "high" | "average" | "sum" | "extreme";

	/**
	 * How grouping combines the high Y values; see `valueYGrouped`.
	 *
	 * @default "high"
	 */
	highValueYGrouped?: "open" | "close" | "high" | "average" | "sum" | "extreme";

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


	/**
	 * Data field with the X category.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	categoryXField?: string;

	/**
	 * Data field with the Y category.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	categoryYField?: string;

	/**
	 * Data field with the X category a column starts at, so that it can span
	 * several categories.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openCategoryXField?: string;

	/**
	 * Data field with the Y category a column starts at, so that it can span
	 * several categories.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openCategoryYField?: string;

	/**
	 * Leaves the series out when its axes work out their scale.
	 *
	 * @default false
	 */
	ignoreMinMax?: boolean;

	/**
	 * @ignore
	 */
	vcx?: number;

	/**
	 * @ignore
	 */
	vcy?: number;

	/**
	 * Horizontal location of the data point relative to its cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/line-series/#Data_item_location} for more info
	 * @default 0.5
	 */
	locationX?: number;

	/**
	 * Vertical location of the data point relative to its cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/line-series/#Data_item_location} for more info
	 * @default 0.5
	 */
	locationY?: number;

	/**
	 * Where in its X axis cell the open data point sits: `0` at the start,
	 * `0.5` in the middle, `1` at the end. If not set, `locationX` is used.
	 */
	openLocationX?: number;

	/**
	 * Where in its Y axis cell the open data point sits: `0` at the start,
	 * `0.5` in the middle, `1` at the end. If not set, `locationY` is used.
	 */
	openLocationY?: number;

	/**
	 * Lets the cursor show the nearest data item even when there is none in
	 * the date interval under the pointer. Works only with a [[DateAxis]].
	 */
	snapTooltip?: boolean;

	/**
	 * Text of the series' legend label while the cursor is not over any of
	 * its data items. If not set, `legendLabelText` is used.
	 */
	legendRangeLabelText?: string;

	/**
	 * Text of the series' legend value label while the cursor is not over any
	 * of its data items.
	 */
	legendRangeValueText?: string;


	/**
	 * Clips the series' bullets to the plot area.
	 *
	 * @default true
	 */
	maskBullets?: boolean;

	/**
	 * Where the series' tooltip takes its color from: the series (on a
	 * column series, the hovered column), or the data item's first bullet.
	 *
	 * @default "series"
	 */
	seriesTooltipTarget?: "series" | "bullet";

	/**
	 * Which of the data item's X values the series' tooltip points at.
	 *
	 * @default "value"
	 * @since 5.0.16
	 */
	tooltipPositionX?: "open" | "value" | "low" | "high";

	/**
	 * Which of the data item's Y values the series' tooltip points at.
	 *
	 * @default "value"
	 * @since 5.0.16
	 */
	tooltipPositionY?: "open" | "value" | "low" | "high";


	/**
	 * Keeps the series' data ungrouped even when its [[DateAxis]] has
	 * `groupData` set.
	 *
	 * @since 5.0.19
	 */
	groupDataDisabled?: boolean;

	/**
	 * The data item the series' tooltip currently shows, such as the one
	 * under the cursor.
	 *
	 * @since 5.1.2
	 */
	tooltipDataItem?: DataItem<IXYSeriesDataItem>

	/**
	 * Fills the `originals` of each grouped data item with the source data
	 * items it was made from. Always on when `groupDataCallback` is set.
	 *
	 * @since 5.1.11
	 * @default false
	 */
	groupDataWithOriginals?: boolean;

	/**
	 * Function called for each grouped data item once it is complete, to set
	 * values of your own. Its `originals` hold the source data items.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Custom_aggregation_functions} for more info
	 * @since 5.1.11
	 */
	groupDataCallback?: (dataItem: DataItem<IXYSeriesDataItem>, interval: ITimeInterval) => void;

}

export interface IXYSeriesPrivate extends ISeriesPrivate {

	minX?: number;
	maxX?: number;

	minY?: number;
	maxY?: number;

	selectionMinX?: number;
	selectionMaxX?: number;

	selectionMinY?: number;
	selectionMaxY?: number;

	valueXAverage?: number;
	valueXCount?: number;
	valueXSum?: number;
	valueXAbsoluteSum?: number;
	valueXLow?: number;
	valueXHigh?: number;
	valueXOpen?: number;
	valueXClose?: number;

	valueYAverage?: number;
	valueYCount?: number;
	valueYSum?: number;
	valueYAbsoluteSum?: number;
	valueYLow?: number;
	valueYHigh?: number;
	valueYOpen?: number;
	valueYClose?: number;

	valueXAverageSelection?: number;
	valueXCountSelection?: number;
	valueXSumSelection?: number;
	valueXAbsoluteSumSelection?: number;
	valueXLowSelection?: number;
	valueXHighSelection?: number;
	valueXOpenSelection?: number;
	valueXCloseSelection?: number;

	valueYAverageSelection?: number;
	valueYCountSelection?: number;
	valueYSumSelection?: number;
	valueYAbsoluteSumSelection?: number;
	valueYLowSelection?: number;
	valueYHighSelection?: number;
	valueYOpenSelection?: number;
	valueYCloseSelection?: number;

	openValueXAverage?: number;
	openValueXCount?: number;
	openValueXSum?: number;
	openValueXAbsoluteSum?: number;
	openValueXLow?: number;
	openValueXHigh?: number;
	openValueXOpen?: number;
	openValueXClose?: number;

	openValueYAverage?: number;
	openValueYCount?: number;
	openValueYSum?: number;
	openValueYAbsoluteSum?: number;
	openValueYLow?: number;
	openValueYHigh?: number;
	openValueYOpen?: number;
	openValueYClose?: number;

	openValueXAverageSelection?: number;
	openValueXCountSelection?: number;
	openValueXSumSelection?: number;
	openValueXAbsoluteSumSelection?: number;
	openValueXLowSelection?: number;
	openValueXHighSelection?: number;
	openValueXOpenSelection?: number;
	openValueXCloseSelection?: number;

	openValueYAverageSelection?: number;
	openValueYCountSelection?: number;
	openValueYSumSelection?: number;
	openValueYAbsoluteSumSelection?: number;
	openValueYLowSelection?: number;
	openValueYHighSelection?: number;
	openValueYOpenSelection?: number;
	openValueYCloseSelection?: number;

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

	outOfSelection?: boolean;

	doNotUpdateLegend?: boolean;
}


/**
 * Base class for all XY chart series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/} for more info
 */
export abstract class XYSeries extends Series {
	public static className: string = "XYSeries";
	public static classNames: Array<string> = Series.classNames.concat([XYSeries.className]);

	declare public _settings: IXYSeriesSettings;
	declare public _privateSettings: IXYSeriesPrivate;
	declare public _dataItemSettings: IXYSeriesDataItem;
	declare public _axisRangeType: IXYSeriesAxisRange;
	declare public _events: IXYSeriesEvents;

	protected _xField!: string;
	protected _yField!: string;
	protected _xOpenField!: string;
	protected _yOpenField!: string;

	protected _xLowField!: string;
	protected _xHighField!: string;
	protected _yLowField!: string;
	protected _yHighField!: string;

	protected _axesDirty: boolean = false;
	public _stackDirty: boolean = false;

	protected _selectionProcessed = false;

	declare public chart: XYChart | undefined;

	public _dataSets: { [index: string]: Array<DataItem<IXYSeriesDataItem>> } = {};

	public _mainContainerMask: Graphics | undefined;

	protected _x: number = 0;
	protected _y: number = 0;

	protected _xRenderer!: AxisRenderer;
	protected _yRenderer!: AxisRenderer;

	public _bullets: { [index: string]: Sprite } = {};

	/**
	 * Container that holds the series' elements, such as its lines or
	 * columns.
	 *
	 * @default Container.new()
	 */
	public readonly mainContainer: Container = this.children.push(Container.new(this._root, {}));

	/**
	 * Axis ranges of the series, added with `createAxisRange()`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-ranges/} for more info
	 */
	public readonly axisRanges: List<this["_axisRangeType"]> = new List();

	protected _skipped: boolean = false;

	protected _couldStackTo: Array<XYSeries> = [];

	protected _reallyStackedTo: { [index: number]: XYSeries } = {};

	public _stackedSeries: { [index: number]: XYSeries } = {};

	protected _aLocationX0: number = 0;
	protected _aLocationX1: number = 1;
	protected _aLocationY0: number = 0;
	protected _aLocationY1: number = 1;

	protected _showBullets: boolean = true;

	protected valueXFields = [
		"valueX",
		"openValueX",
		"lowValueX",
		"highValueX"
	];

	protected valueYFields = [
		"valueY",
		"openValueY",
		"lowValueY",
		"highValueY"
	];

	public _valueXFields!: Array<string>;
	public _valueYFields!: Array<string>;

	// used for full min/max
	protected _valueXShowFields!: Array<string>;
	protected _valueYShowFields!: Array<string>;

	// used for selection (uses working)
	public __valueXShowFields!: Array<string>;
	public __valueYShowFields!: Array<string>;

	protected _emptyDataItem = new DataItem(this, undefined, {});

	public _dataSetId?: string;

	protected _tooltipFieldX?: string;
	protected _tooltipFieldY?: string;

	public _posXDp?: IDisposer;
	public _posYDp?: IDisposer;

	protected _afterNew() {
		this.fields.push("categoryX", "categoryY", "openCategoryX", "openCategoryY");
		this.valueFields.push("valueX", "valueY", "openValueX", "openValueY", "lowValueX", "lowValueY", "highValueX", "highValueY");

		this._setRawDefault("vcx", 1);
		this._setRawDefault("vcy", 1);
		// this can't go to themes, as data might be parsed before theme
		this._setRawDefault("valueXShow", "valueXWorking");
		this._setRawDefault("valueYShow", "valueYWorking");

		this._setRawDefault("openValueXShow", "openValueXWorking");
		this._setRawDefault("openValueYShow", "openValueYWorking");

		this._setRawDefault("lowValueXShow", "lowValueXWorking");
		this._setRawDefault("lowValueYShow", "lowValueYWorking");

		this._setRawDefault("highValueXShow", "highValueXWorking");
		this._setRawDefault("highValueYShow", "highValueYWorking");

		this._setRawDefault("lowValueXGrouped", "low");
		this._setRawDefault("lowValueYGrouped", "low");

		this._setRawDefault("highValueXGrouped", "high");
		this._setRawDefault("highValueYGrouped", "high");

		const xAxis = this.get("xAxis");
		if (xAxis) {
			this._xRenderer = xAxis.get("renderer");
		}

		const yAxis = this.get("yAxis");
		if (yAxis) {
			this._yRenderer = yAxis.get("renderer");
		}

		super._afterNew();

		this._setC("maskContent", true);

		// Re-wire the series when it is reassigned to a different axis after
		// creation. Handled via `on()` (fires once on `.set()`, outside the
		// validation cycle) so the swap's `set`/markDirty calls can't re-enter.
		this._disposers.push(this.on("xAxis", () => {
			this._switchAxis("xAxis");
		}));
		this._disposers.push(this.on("yAxis", () => {
			this._switchAxis("yAxis");
		}));

		this._disposers.push(this.axisRanges.events.onAll((change) => {
			if (change.type === "clear") {
				$array.each(change.oldValues, (axisRange) => {
					this._removeAxisRange(axisRange);
				});
			} else if (change.type === "push") {
				this._processAxisRange(change.newValue);
			} else if (change.type === "setIndex") {
				this._processAxisRange(change.newValue);
			} else if (change.type === "insertIndex") {
				this._processAxisRange(change.newValue);
			} else if (change.type === "removeIndex") {
				this._removeAxisRange(change.oldValue);
			} else if (change.type === "moveIndex") {
				this._processAxisRange(change.value);
			} else {
				throw new Error("Unknown IStreamEvent type");
			}
		}))

		this.states._createC("hidden", <any>{ opacity: 1, visible: false });

		this.onPrivate("startIndex", () => {
			this.root.events.once("frameended", () => {
				this.updateLegendValue();
			})
		})

		this.onPrivate("endIndex", () => {
			this.root.events.once("frameended", () => {
				this.updateLegendValue();
			})
		})

		this._makeFieldNames();

		// Value fields were historically meant to be set once at creation. Allow
		// them to be changed dynamically: rebuild the field map and names
		// synchronously when a `*Field` setting changes, so a subsequent
		// `data.setAll()` (which parses synchronously) picks up the new field.
		const onFieldChange = () => {
			this._updateFields();
			this._makeFieldNames();
			this.markDirtyValues();
		};
		$array.each([...this.valueXFields, ...this.valueYFields], (key) => {
			this.on(<any>(key + "Field"), onFieldChange);
		});
	}

	protected _processAxisRange(axisRange: this["_axisRangeType"]) {
		const container = Container.new(this._root, {});
		axisRange.container = container;
		this.children.push(container);

		axisRange.series = this;

		const axisDataItem = axisRange.axisDataItem;
		axisDataItem.setRaw("isRange", true);

		const axis = <Axis<AxisRenderer>>axisDataItem.component;
		if (axis) {
			axis._processAxisRange(axisDataItem, ["range", "series"]);

			const bullet = axisDataItem.get("bullet");
			if (bullet) {
				const sprite = bullet.get("sprite");
				if (sprite) {
					sprite.setPrivate("visible", false);
				}
			}
			const axisFill = axisDataItem.get("axisFill");
			if (axisFill) {
				container._setC("mask", axisFill);
			}
			axis._seriesAxisRanges.push(axisDataItem);
		}
	}

	protected _onDataClear(): void {
		super._onDataClear();
		$object.each(this._dataSets, (_key, dataItems) => {
			$array.each(dataItems, (dataItem) => {
				dataItem.dispose();
			});
			dataItems.length = 0;
		});
	}

	protected _removeAxisRange(axisRange: this["_axisRangeType"]) {
		const axisDataItem = axisRange.axisDataItem;
		const axis = <Axis<AxisRenderer>>axisDataItem.component;
		axisDataItem.dispose();

		$array.remove(axis._seriesAxisRanges, axisDataItem);

		const container = axisRange.container;
		if (container) {
			container.dispose();
		}
	}

	public _updateFields() {
		super._updateFields();

		this._valueXFields = [];
		this._valueYFields = [];
		this._valueXShowFields = [];
		this._valueYShowFields = [];

		this.__valueXShowFields = [];
		this.__valueYShowFields = [];

		if (this.valueXFields) {
			$array.each(this.valueXFields as Array<keyof this["_settings"]>, (key) => {
				const field = this.get(<any>(key + "Field"));
				if (field) {
					this._valueXFields.push(<any>key);
					let field = this.get(<any>(key + "Show"));
					this.__valueXShowFields.push(field);

					if (field.indexOf("Working") != -1) {
						this._valueXShowFields.push(field.split("Working")[0]);
					}
					else {
						this._valueXShowFields.push(field);
					}
				}
			});
		}

		if (this.valueYFields) {
			$array.each(this.valueYFields as Array<keyof this["_settings"]>, (key) => {
				const field = this.get(<any>(key + "Field"));

				if (field) {
					this._valueYFields.push(<any>key);
					let field = this.get(<any>(key + "Show"));
					this.__valueYShowFields.push(field);

					if (field.indexOf("Working") != -1) {
						this._valueYShowFields.push(field.split("Working")[0]);
					}
					else {
						this._valueYShowFields.push(field);
					}
				}
			});
		}
	}

	protected _dispose() {
		super._dispose();

		this._bullets = {};
		const chart = this.chart;
		if (chart) {
			chart.series.removeValue(this);
		}

		const xAxis = this.get("xAxis");
		if (xAxis) {
			$array.removeFirst(xAxis.series, this);
		}
		const yAxis = this.get("yAxis");
		if (yAxis) {
			$array.removeFirst(yAxis.series, this);
		}
	}

	// TODO use  SelectKeys<this["_privateSettings"], number | undefined>
	protected _min<Key extends keyof this["_privateSettings"]>(key: Key, value: number | undefined) {
		let newValue = min(this.getPrivate(key) as any, value);
		this.setPrivate(key, newValue as any);
	}

	// TODO use  SelectKeys<this["_privateSettings"], number | undefined>
	protected _max<Key extends keyof this["_privateSettings"]>(key: Key, value: number | undefined) {
		let newValue = max(this.getPrivate(key) as any, value);
		this.setPrivate(key, newValue as any);
	}

	protected _shouldMakeBullet(dataItem: DataItem<this["_dataItemSettings"]>): boolean {

		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");
		const baseAxis = this.get("baseAxis");

		if (!xAxis.inited || !yAxis.inited) {
			return false
		}

		const minBulletDistance = this.get("minBulletDistance", 0);
		if (minBulletDistance > 0) {
			let startIndex = this.startIndex();
			let endIndex = this.endIndex();

			let count = endIndex - startIndex;

			if (xAxis == baseAxis) {
				if (this._xRenderer.axisLength() / count < minBulletDistance / 5) {
					return false;
				}
			}
			else if (yAxis == baseAxis) {
				if (this._yRenderer.axisLength() / count < minBulletDistance / 5) {
					return false;
				}
			}
		}

		if (dataItem.get(this._xField as any) != null && dataItem.get(this._yField as any) != null) {
			return true;
		}
		return false;
	}

	protected _makeFieldNames() {
		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");
		const xName = xAxis.getPrivate("name")!;
		const xCapName = $utils.capitalizeFirst(xName);

		const yName = yAxis.getPrivate("name")!;
		const yCapName = $utils.capitalizeFirst(yName);

		const xLetter = xAxis.get("renderer").getPrivate("letter")!
		const yLetter = yAxis.get("renderer").getPrivate("letter")!

		const open = "open";
		const low = "low";
		const high = "high";
		const show = "Show";

		if (xAxis.className === "ValueAxis") {
			this._xField = this.get(<any>(xName + xLetter! + show));
			this._xOpenField = this.get(<any>(open + xCapName + xLetter! + show));
			this._xLowField = this.get(<any>(low + xCapName + xLetter! + show));
			this._xHighField = this.get(<any>(high + xCapName + xLetter! + show));
		}
		else {
			this._xField = <any>(xName + xLetter!);
			this._xOpenField = <any>(open + xCapName + xLetter!);
			this._xLowField = <any>(low + xCapName + xLetter!);
			this._xHighField = <any>(high + xCapName + xLetter!);
		}

		if (yAxis.className === "ValueAxis") {
			this._yField = this.get(<any>(yName + yLetter! + show));
			this._yOpenField = this.get(<any>(open + yCapName + yLetter! + show));
			this._yLowField = this.get(<any>(low + yCapName + yLetter! + show));
			this._yHighField = this.get(<any>(high + yCapName + yLetter! + show));
		}
		else {
			this._yField = <any>(yName + yLetter!);
			this._yOpenField = <any>(open + yCapName + yLetter!);
			this._yLowField = <any>(low + yCapName + yLetter!);
			this._yHighField = <any>(high + yCapName + yLetter!);
		}
	}

	protected _fixVC() {
		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");
		const baseAxis = this.get("baseAxis");
		const hiddenState = this.states.lookup("hidden");
		const sequencedInterpolation = this.get("sequencedInterpolation");

		if (hiddenState) {
			let value = 0;
			if (sequencedInterpolation) {
				value = 0.999999999999; // makes animate, good for stacked
			}

			if (xAxis === baseAxis) {
				hiddenState._setC("vcy", value);
			}
			else if (yAxis === baseAxis) {
				hiddenState._setC("vcx", value);
			}
			else {
				hiddenState._setC("vcy", value);
				hiddenState._setC("vcx", value);
			}
		}
	}


	protected _handleMaskBullets() {
		if (this.isDirty("maskBullets")) {
			this.bulletsContainer._setC("maskContent", this.get("maskBullets"));
		}
	}

	public _fixPosition() {
		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");

		this._setC("x", xAxis.x() - $utils.relativeToValue(xAxis.get("centerX", 0), xAxis.width()) - xAxis.parent!.get("paddingLeft", 0));
		this._setC("y", yAxis.y() - $utils.relativeToValue(yAxis.get("centerY", 0), yAxis.height()) - yAxis.parent!.get("paddingTop", 0));

		this.bulletsContainer._setC("y", this.y());
		this.bulletsContainer._setC("x", this.x());
	}


	/**
	 * Re-wires the series when its `xAxis`/`yAxis` setting is changed to a
	 * different axis after creation, mirroring `XYChart._processSeries`. Invoked
	 * from an `on()` handler (fires once on `.set()`) rather than from
	 * `_prepareChildren`, so setting `baseAxis`/markDirty here can't re-enter.
	 */
	protected _switchAxis(key: "xAxis" | "yAxis") {
		const prevAxis = (this._prevSettings as any)[key] as Axis<any> | undefined;
		const axis = this.get(key as any) as Axis<any> | undefined;

		if (prevAxis && axis && prevAxis !== axis) {
			// Detach from the previous axis
			$array.remove(prevAxis.series, this);
			const prevDp = key == "xAxis" ? this._posXDp : this._posYDp;
			if (prevDp) {
				prevDp.dispose();
			}
			prevAxis.markDirtyExtremes();

			// Re-point baseAxis if it referenced the previous axis
			if (this.get("baseAxis") === prevAxis) {
				if (this._computedProperties["baseAxis"]) {
					// the chart's own pick, so make it again the way the chart
					// would - carrying the old one over lands somewhere a rebuilt
					// chart never would
					const xAxis = this.get("xAxis");
					const yAxis = this.get("yAxis");
					if (xAxis && yAxis) {
						const categoryish = yAxis.isType<CategoryAxis<any>>("CategoryAxis") || yAxis.isType<DateAxis<any>>("DateAxis");
						this._setC("baseAxis", categoryish ? yAxis : xAxis);
					}
					else {
						this._setC("baseAxis", axis);
					}
				}
				else {
					this.set("baseAxis", axis);
				}
			}

			// Attach to the new axis
			$array.move(axis.series, this);
			const dp = this.addDisposer(axis.events.on("positionchanged", () => {
				this._fixPosition();
			}));
			if (key == "xAxis") {
				this._posXDp = dp;
			}
			else {
				this._posYDp = dp;
			}
			axis.markDirtyExtremes();
			axis._seriesAdded = true;

			this._markDirtyAxes();
		}
	}

	public _prepareChildren() {
		super._prepareChildren();

		this._xRenderer = this.get("xAxis").get("renderer");
		this._yRenderer = this.get("yAxis").get("renderer");

		this._bullets = {};

		if (this.isDirty("valueYShow") || this.isDirty("valueXShow") || this.isDirty("openValueYShow") || this.isDirty("openValueXShow") || this.isDirty("lowValueYShow") || this.isDirty("lowValueXShow") || this.isDirty("highValueYShow") || this.isDirty("highValueXShow")) {			
			this._updateFields();
			this._makeFieldNames();
			this._valuesDirty = true;
		}

		if (this.isDirty("xAxis") || this.isDirty("yAxis")) {
			this._valuesDirty = true;
		}

		// Location settings are read while (re)building points/columns in
		// `_updateChildren` (gated by `_valuesDirty`), so force that rebuild when
		// they change dynamically.
		if (this.isDirty("locationX") || this.isDirty("locationY") || this.isDirty("openLocationX") || this.isDirty("openLocationY") || this.isDirty("exactLocationX") || this.isDirty("exactLocationY")) {
			this._valuesDirty = true;
		}

		this._setC("width", this.get("xAxis").width());
		this._setC("height", this.get("yAxis").height());

		this._handleMaskBullets();

		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");
		const baseAxis = this.get("baseAxis");

		const tooltipPositionX = this.get("tooltipPositionX");
		let tooltipFieldX: string;

		switch (tooltipPositionX) {
			case "open":
				tooltipFieldX = this._xOpenField;
				break;
			case "low":
				tooltipFieldX = this._xLowField;
				break;
			case "high":
				tooltipFieldX = this._xHighField;
				break;
			default:
				tooltipFieldX = this._xField;
		}
		this._tooltipFieldX = tooltipFieldX;

		const tooltipPositionY = this.get("tooltipPositionY");
		let tooltipFieldY: string;
		switch (tooltipPositionY) {
			case "open":
				tooltipFieldY = this._yOpenField;
				break;
			case "low":
				tooltipFieldY = this._yLowField;
				break;
			case "high":
				tooltipFieldY = this._yHighField;
				break;
			default:
				tooltipFieldY = this._yField;
		}
		this._tooltipFieldY = tooltipFieldY;

		if (this.isDirty("baseAxis")) {
			this._fixVC();
		}


		this._fixPosition();

		const stacked = this.get("stacked");

		if (this.isDirty("stacked") || (this.isDirty("stackToNegative") && stacked)) {
			if (stacked) {
				if (this._valuesDirty && !this._dataProcessed) {

				}
				else {
					this._valuesDirty = true;
					this._stack();
				}
			}
			else {
				this._valuesDirty = true;
				this._unstack();
			}
		}

		if (this._valuesDirty && !this._dataProcessed) {
			this._dataProcessed = true;

			if (stacked) {
				this._stack();
			}

			let minX: any = undefined;
			let maxX: any = undefined;
			let minY: any = undefined;
			let maxY: any = undefined;
			$array.each(this.dataItems, (dataItem) => {
				$array.each(this._valueXShowFields, (key) => {
					let value = dataItem.get(<any>key);
					if (value != null) {
						if (stacked) {
							value += this.getStackedXValue(dataItem, key);
						}
						minX = min(minX, value);
						maxX = max(maxX, value);
					}
				})

				$array.each(this._valueYShowFields, (key) => {
					let value = dataItem.get(<any>key);
					if (value != null) {
						if (stacked) {
							value += this.getStackedYValue(dataItem, key);
						}
						minY = min(minY, value);
						maxY = max(maxY, value);
					}
				})

				xAxis.processSeriesDataItem(dataItem, this._valueXFields);
				yAxis.processSeriesDataItem(dataItem, this._valueYFields);
			})
			this._min("minX", minX);
			this._max("maxX", maxX);
			this._min("minY", minY);
			this._max("maxY", maxY);

			xAxis._seriesValuesDirty = true;
			yAxis._seriesValuesDirty = true;

			if (!this.get("ignoreMinMax")) {
				if (this.isPrivateDirty("minX") || this.isPrivateDirty("maxX")) {
					xAxis.markDirtyExtremes();
				}
				if (this.isPrivateDirty("minY") || this.isPrivateDirty("maxY")) {
					yAxis.markDirtyExtremes();
				}
			}

			this._markStakedDirtyStack();

			//this.updateLegendMarker(undefined); // causes legend marker to change color instantly when on
			if (!this.get("tooltipDataItem")) {
				this.updateLegendValue(undefined);
			}
		}

		if (this.isDirty("vcx") || this.isDirty("vcy")) {
			this._markStakedDirtyStack();
		}

		if (!this._dataGrouped) {
			xAxis._groupSeriesData(this);
			yAxis._groupSeriesData(this);
			this._dataGrouped = true;
		}

		if (this._valuesDirty || this.isPrivateDirty("startIndex") || this.isPrivateDirty("adjustedStartIndex") || this.isPrivateDirty("endIndex") || this.isDirty("vcx") || this.isDirty("vcy") || this._stackDirty || this._sizeDirty || this.isDirty("minBulletDistance")) {
			let startIndex = this.startIndex();
			let endIndex = this.endIndex();
			let minBulletDistance = this.get("minBulletDistance", 0);
			if (minBulletDistance > 0 && baseAxis) {
				if (baseAxis.get("renderer").axisLength() / (endIndex - startIndex) > minBulletDistance) {
					this._showBullets = true;
				}
				else {
					this._showBullets = false;
				}
			}

			if ((this._psi != startIndex || this._pei != endIndex || this.isDirty("vcx") || this.isDirty("vcy") || this.isPrivateDirty("adjustedStartIndex") || this._stackDirty || this._valuesDirty) && !this._selectionProcessed) {
				this._selectionProcessed = true;

				const vcx = this.get("vcx", 1);
				const vcy = this.get("vcy", 1);
				const stacked = this.get("stacked", false);
				const outOfSelection = this.getPrivate("outOfSelection");

				if (baseAxis === xAxis || !baseAxis) {
					yAxis._calculateTotals();
					this.setPrivateRaw("selectionMinY", undefined);
					this.setPrivateRaw("selectionMaxY", undefined);
					if (!outOfSelection) {
						for (let i = startIndex; i < endIndex; i++) {
							this.processYSelectionDataItem(this.dataItems[i], vcy, stacked);
						}
					}
					else {
						yAxis.markDirtySelectionExtremes();
					}
				}
				if (baseAxis === yAxis || !baseAxis) {
					xAxis._calculateTotals();
					this.setPrivateRaw("selectionMinX", undefined);
					this.setPrivateRaw("selectionMaxX", undefined);
					if (!outOfSelection) {
						for (let i = startIndex; i < endIndex; i++) {
							this.processXSelectionDataItem(this.dataItems[i], vcx, stacked);
						}
					}
					else {
						xAxis.markDirtySelectionExtremes();
					}
				}

				if (baseAxis === xAxis || !baseAxis) {
					if (this.get("valueYShow") !== "valueYWorking" || this.get("useSelectionExtremes")) {
						const selectionMinY = this.getPrivate("selectionMinY");
						if (selectionMinY != null) {
							this.setPrivateRaw("minY", selectionMinY);
							yAxis.markDirtyExtremes();
						}
						const selectionMaxY = this.getPrivate("selectionMaxY");
						if (selectionMaxY != null) {
							this.setPrivateRaw("maxY", selectionMaxY);
							yAxis.markDirtyExtremes();
						}
					}
				}
				if (baseAxis === yAxis || !baseAxis) {
					if (this.get("valueXShow") !== "valueXWorking" || this.get("useSelectionExtremes")) {
						const selectionMinX = this.getPrivate("selectionMinX");
						if (selectionMinX != null) {
							this.setPrivateRaw("minX", selectionMinX);
							xAxis.markDirtyExtremes();
						}
						const selectionMaxX = this.getPrivate("selectionMaxX")
						if (selectionMaxX != null) {
							this.setPrivateRaw("maxX", selectionMaxX);
							xAxis.markDirtyExtremes();
						}
					}
				}

				if (this.isPrivateDirty("selectionMinX") || this.isPrivateDirty("selectionMaxX")) {
					xAxis.markDirtySelectionExtremes();
				}

				if (this.isPrivateDirty("selectionMinY") || this.isPrivateDirty("selectionMaxY")) {
					yAxis.markDirtySelectionExtremes();
				}
				// this.updateLegendValue(undefined); flickers while panning
			}
		}
	}

	protected _postUpdateData(): void {

		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");

		xAxis._seriesValuesDirty = true;
		yAxis._seriesValuesDirty = true;		

		$array.each(this.dataItems, (dataItem) => {
			dataItem.open = undefined;
			dataItem.close = undefined;

			xAxis.processSeriesDataItem(dataItem, this._valueXFields);
			yAxis.processSeriesDataItem(dataItem, this._valueYFields);
		})
	}


	protected _makeRangeMask() {
		if (this.axisRanges.length > 0) {
			let mainContainerMask = this._mainContainerMask;
			if (mainContainerMask == null) {
				mainContainerMask = this.children.push(Graphics.new(this._root, {}));
				this._mainContainerMask = mainContainerMask;

				mainContainerMask.set("draw", (display, target) => {
					const parent = this.parent;
					if (parent) {
						const w = this._root.container.width();
						const h = this._root.container.height();
						display.moveTo(-w, -h);
						display.lineTo(-w, h * 2);
						display.lineTo(w * 2, h * 2);
						display.lineTo(w * 2, -h);
						display.lineTo(-w, -h);


						this.axisRanges.each((axisRange) => {
							const fill = axisRange.axisDataItem.get("axisFill");

							if (parent) {
								if (fill) {
									let draw = fill.get("draw");
									if (draw) {
										draw(display, target);
									}
								}
							}
						})
					}
					this.mainContainer._display.mask = mainContainerMask!._display;
				})
			}

			mainContainerMask.markDirty();
			mainContainerMask._markDirtyKey("fill");
		}
		else {
			this.mainContainer._display.mask = null;
		}
	}


	public _updateChildren() {
		super._updateChildren();

		// save for performance
		this._x = this.x();
		this._y = this.y();
		this._makeRangeMask();
	}

	protected _stack() {
		const chart = this.chart;
		if (chart) {
			const seriesIndex = chart.series.indexOf(this);

			this._couldStackTo = [];

			if (seriesIndex > 0) {
				let series: XYSeries;

				for (let i = seriesIndex - 1; i >= 0; i--) {
					series = chart.series.getIndex(i)!;
					if (series.get("xAxis") === this.get("xAxis") && series.get("yAxis") === this.get("yAxis") && series.className === this.className) {
						this._couldStackTo.push(series);
						if (!series.get("stacked")) {
							break;
						}
					}
				}
			}
			this._stackDataItems();
		}
	}

	public _unstack() {

		$object.each(this._reallyStackedTo, (_key, value) => {
			delete (value._stackedSeries[this.uid]);
		})

		this._reallyStackedTo = {};
		$array.each(this.dataItems, (dataItem) => {
			dataItem.setRaw("stackToItemY", undefined);
			dataItem.setRaw("stackToItemX", undefined);
		})
	}

	public _handleRemoved(): void {
		const xAxis = this.get("xAxis");
		if (xAxis) {
			xAxis._handleSeriesRemoved();
		}
		const yAxis = this.get("yAxis");
		if (yAxis) {
			yAxis._handleSeriesRemoved();
		}
	}

	protected _stackDataItems() {
		// this works only with the same number of data @todo: search by date/category?
		const baseAxis = this.get("baseAxis");
		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");

		let field: "valueX" | "valueY";
		let stackToItemKey: "stackToItemX" | "stackToItemY";
		if (baseAxis === xAxis) {
			field = "valueY";
			stackToItemKey = "stackToItemY";
		}
		else if (baseAxis === yAxis) {
			field = "valueX";
			stackToItemKey = "stackToItemX";
		}

		let len = this._couldStackTo.length;
		let index = 0;
		const stackToNegative = this.get("stackToNegative");

		this._reallyStackedTo = {};

		$array.each(this.dataItems, (dataItem) => {
			for (let s = 0; s < len; s++) {
				let stackToSeries = this._couldStackTo[s];
				let stackToItem = stackToSeries.dataItems[index];
				let value = dataItem.get(field);

				if (stackToItem) {
					let stackValue = stackToItem.get(field);
					if (stackToNegative) {
						if ($type.isNumber(value)) {
							if ($type.isNumber(stackValue)) {

								if (s == len - 1) {
									dataItem.setRaw(stackToItemKey, undefined);
								}

								if (value >= 0 && stackValue >= 0) {
									dataItem.setRaw(stackToItemKey, stackToItem);
									this._reallyStackedTo[stackToSeries.uid] = stackToSeries;
									stackToSeries._stackedSeries[this.uid] = this;
									break;
								}
								if (value < 0 && stackValue < 0) {
									dataItem.setRaw(stackToItemKey, stackToItem);
									this._reallyStackedTo[stackToSeries.uid] = stackToSeries;
									stackToSeries._stackedSeries[this.uid] = this;
									break;
								}
							}
						}
						else {
							break;
						}
					}
					else {
						if ($type.isNumber(value) && $type.isNumber(stackValue)) {
							dataItem.setRaw(stackToItemKey, stackToItem);
							this._reallyStackedTo[stackToSeries.uid] = stackToSeries;
							stackToSeries._stackedSeries[this.uid] = this;
							break;
						}
					}
				}
			}

			index++;
		})
	}

	protected processXSelectionDataItem(dataItem: DataItem<this["_dataItemSettings"]>, vcx: number, stacked: boolean) {
		$array.each(this.__valueXShowFields, (key) => {
			let value = dataItem.get(<any>key);
			if (value != null) {
				if (stacked) {
					value += this.getStackedXValueWorking(dataItem, key);
				}

				this._min("selectionMinX", value);
				this._max("selectionMaxX", value * vcx);
			}
		})
	}

	protected processYSelectionDataItem(dataItem: DataItem<this["_dataItemSettings"]>, vcy: number, stacked: boolean) {
		$array.each(this.__valueYShowFields, (key) => {

			let value = dataItem.get(<any>key);
			if (value != null) {
				if (stacked) {
					value += this.getStackedYValueWorking(dataItem, key);
				}

				this._min("selectionMinY", value);
				this._max("selectionMaxY", value * vcy);
			}
		})
	}

	/**
	 * @ignore
	 */
	public getStackedYValueWorking(dataItem: DataItem<IXYSeriesDataItem>, key: string): number {
		const stackToItem = dataItem.get("stackToItemY");

		if (stackToItem) {
			const stackedToSeries = stackToItem.component as XYSeries;

			return stackToItem.get(key as any, 0) * stackedToSeries.get("vcy", 1) + this.getStackedYValueWorking(stackToItem, key);
		}
		return 0;
	}

	/**
	 * @ignore
	 */
	public getStackedXValueWorking(dataItem: DataItem<IXYSeriesDataItem>, key: string): number {
		const stackToItem = dataItem.get("stackToItemX");

		if (stackToItem) {
			const stackedToSeries = stackToItem.component as XYSeries;
			return stackToItem.get(key as any, 0) * stackedToSeries.get("vcx", 1) + this.getStackedXValueWorking(stackToItem, key);
		}
		return 0;
	}

	/**
	 * @ignore
	 */
	public getStackedYValue(dataItem: DataItem<IXYSeriesDataItem>, key: string): number {
		const stackToItem = dataItem.get("stackToItemY");

		if (stackToItem) {
			return stackToItem.get(key as any, 0) + this.getStackedYValue(stackToItem, key);
		}
		return 0;
	}

	/**
	 * @ignore
	 */
	public getStackedXValue(dataItem: DataItem<IXYSeriesDataItem>, key: string): number {
		const stackToItem = dataItem.get("stackToItemX");

		if (stackToItem) {
			return stackToItem.get(key as any, 0) + this.getStackedXValue(stackToItem, key);
		}
		return 0;
	}

	/**
	 * @ignore
	 */
	public createLegendMarker(_dataItem?: DataItem<this["_dataItemSettings"]>) {
		this.updateLegendMarker();
	}

	public _markDirtyAxes() {
		this._axesDirty = true;
		this.markDirty();
	}

	public _markDataSetDirty() {
		this._afterDataChange();
		this._valuesDirty = true;
		this._dataProcessed = false;
		this._aggregatesCalculated = false;
		this.markDirty();
	}

	public _clearDirty() {
		super._clearDirty();
		this._axesDirty = false;
		this._selectionProcessed = false;
		this._stackDirty = false;
		this._dataProcessed = false;
	}

	public _positionBullet(bullet: Bullet) {
		let sprite = bullet.get("sprite");
		if (sprite) {
			let dataItem = sprite.dataItem as DataItem<this["_dataItemSettings"]>;

			let locationX = bullet.get("locationX", dataItem.get("locationX", 0.5));
			let locationY = bullet.get("locationY", dataItem.get("locationY", 0.5));

			let xAxis = this.get("xAxis");
			let yAxis = this.get("yAxis");

			let exactLocationX = this.get("exactLocationX", false);
			let exactLocationY = this.get("exactLocationY", false);

			let positionX = xAxis.getDataItemPositionX(dataItem, this._xField, locationX, this.get("vcx", 1), exactLocationX);
			let positionY = yAxis.getDataItemPositionY(dataItem, this._yField, locationY, this.get("vcy", 1), exactLocationY);

			let point = this.getPoint(positionX, positionY);

			let left = dataItem.get("left", point.x);
			let right = dataItem.get("right", point.x);
			let top = dataItem.get("top", point.y);
			let bottom = dataItem.get("bottom", point.y);

			let x = 0;
			let y = 0;

			let w = right - left;
			let h = bottom - top;

			if (this._shouldShowBullet(positionX, positionY)) {
				sprite.setPrivate("visible", !bullet.getPrivate("hidden"));

				let field = bullet.get("field");

				const baseAxis = this.get("baseAxis");
				const xAxis = this.get("xAxis");
				const yAxis = this.get("yAxis");

				if (field != undefined) {
					let realField: string | undefined;

					if (baseAxis == xAxis) {
						if (field == "value") {
							realField = this._yField;
						}
						else if (field == "open") {
							realField = this._yOpenField;
						}
						else if (field == "high") {
							realField = this._yHighField;
						}
						else if (field == "low") {
							realField = this._yLowField;
						}
						if (realField) {
							positionY = yAxis.getDataItemPositionY(dataItem, realField as any, 0, this.get("vcy", 1), exactLocationY)

							point = this._yRenderer.positionToPoint(positionY);

							y = point.y;
							x = left + w * locationX;
						}
					}
					else {
						if (field == "value") {
							realField = this._xField;
						}
						else if (field == "open") {
							realField = this._xOpenField;
						}
						else if (field == "high") {
							realField = this._xHighField;
						}
						else if (field == "low") {
							realField = this._xLowField;
						}

						if (realField) {
							positionX = xAxis.getDataItemPositionX(dataItem, realField as any, 0, this.get("vcx", 1), exactLocationX);

							point = this._xRenderer.positionToPoint(positionX);

							x = point.x;
							y = bottom - h * locationY;
						}
					}
				}
				else {
					x = left + w * locationX;
					y = bottom - h * locationY;
				}

				const stacked = bullet.get("stacked");
				if (stacked) {
					const chart = this.chart;
					if (baseAxis == xAxis) {
						let previousBullet = this._bullets[positionX + "_" + positionY];
						if (previousBullet) {
							let previousBounds = previousBullet.bounds();
							let bounds = sprite.localBounds();
							let yo = y;
							y = previousBounds.top;

							if (stacked == "down") {
								y = previousBounds.bottom - bounds.top;
							}
							else if (stacked == "auto") {
								if (chart) {
									if (yo < chart.plotContainer.height() / 2) {
										y = previousBounds.bottom - bounds.top;
									}
									else {
										y -= bounds.bottom;
									}
								}
							}
							else {
								y -= bounds.bottom;
							}
						}
						this._bullets[positionX + "_" + positionY] = sprite;
					}
					else {
						let previousBullet = this._bullets[positionX + "_" + positionY];
						if (previousBullet) {
							let previousBounds = previousBullet.bounds();
							let bounds = sprite.localBounds();
							let xo = x;
							x = previousBounds.right;

							if (stacked == "down") {
								x = previousBounds.left - bounds.right;
							}
							else if (stacked == "auto") {
								if (chart) {
									if (xo < chart.plotContainer.width() / 2) {
										x = previousBounds.left - bounds.right;
									}
									else {
										x -= bounds.left;
									}
								}
							}
							else {
								x -= bounds.left;
							}
						}

						this._bullets[positionX + "_" + positionY] = sprite;
					}
				}

				if (sprite.isType("Label")) {
					sprite.setPrivate("maxWidth", Math.abs(w));
					sprite.setPrivate("maxHeight", Math.abs(h));
				}

				sprite.setAll({ x, y });
			}
			else {
				sprite.setPrivate("visible", false);
			}
		}
	}

	protected _shouldShowBullet(_positionX: number, _positionY: number): boolean {
		return this._showBullets;
	}

	/**
	 * @ignore
	 */
	public setDataSet(id: string) {
		if (this._dataSets[id]) {
			this._handleDataSetChange();
			this._dataItems = this._dataSets[id];
			this._markDataSetDirty();
			this._dataSetId = id;

			const type = "datasetchanged";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, { type: type, target: this, id: id });
			}
		}
	}

	/**
	 * @ignore
	 */
	public resetGrouping() {
		$object.each(this._dataSets, (_key, dataSet) => {
			if (dataSet != this._mainDataItems) {
				$array.each(dataSet, (dataItem) => {
					dataItem.dispose();
				})
			}
		})
		this._dataSets = {};
		this._dataItems = this.mainDataItems;
	}

	protected _handleDataSetChange() {
		$array.each(this._dataItems, (dataItem) => {
			let bullets = dataItem.bullets;
			if (bullets) {
				$array.each(bullets, (bullet) => {
					if (bullet) {
						let sprite = bullet.get("sprite");
						if (sprite) {
							sprite.setPrivate("visible", false);
						}
					}
				})
			}
		})

		this._selectionProcessed = false; // for totals to be calculated
	}

	/**
	 * Shows the series.
	 *
	 * @param   duration  Duration of animation in milliseconds
	 * @return            Animation promise
	 */
	public async show(duration?: number): Promise<void> {
		this._fixVC();
		let promises: Array<Promise<any>> = [];
		promises.push(super.show(duration).then(() => {
			this._isShowing = false;
			let xAxis = this.get("xAxis");
			let yAxis = this.get("yAxis");
			let baseAxis = this.get("baseAxis");
			if (yAxis !== baseAxis) {
				yAxis.markDirtySelectionExtremes();
			}
			if (xAxis !== baseAxis) {
				xAxis.markDirtySelectionExtremes();
			}
		}));
		promises.push(this.bulletsContainer.show(duration));
		promises.push(this._sequencedShowHide(true, duration));
		await Promise.all(promises);
	}

	/**
	 * Hides the series.
	 *
	 * @param   duration  Duration of animation in milliseconds
	 * @return            Animation promise
	 */
	public async hide(duration?: number): Promise<void> {
		this._fixVC();
		let promises: Promise<any>[] = [];
		promises.push(super.hide(duration).then(() => {
			this._isHiding = false;
		}));
		promises.push(this.bulletsContainer.hide(duration));
		promises.push(this._sequencedShowHide(false, duration));
		await Promise.all(promises);
	}

	/**
	 * Shows a data item, animating its values back from the base value.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.showDataItem(dataItem, duration)];

		if (!$type.isNumber(duration)) {
			duration = this.get("stateAnimationDuration", 0);
		}

		const easing = this.get("stateAnimationEasing");

		$array.each(this._valueFields, (key) => {
			promises.push(dataItem.animate({ key: key + "Working" as any, to: dataItem.get(key as any), duration: duration!, easing: easing }).waitForStop());
		})

		await Promise.all(promises);
	}

	/**
	 * Hides a data item, animating its values to the value axis's base value.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.hideDataItem(dataItem, duration)];

		let hiddenState = this.states.lookup("hidden");
		if (!hiddenState) {
			hiddenState = this.states.create("hidden", {});
		}

		if (!$type.isNumber(duration)) {
			duration = hiddenState.get("stateAnimationDuration", this.get("stateAnimationDuration", 0));
		}

		const easing = hiddenState.get("stateAnimationEasing", this.get("stateAnimationEasing"));

		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");
		const baseAxis = this.get("baseAxis");
		const stacked = this.get("stacked");

		if (baseAxis === xAxis || !baseAxis) {

			$array.each(this._valueYFields, (key) => {
				let min = yAxis.getPrivate("min");
				let baseValue = yAxis.baseValue();

				if ($type.isNumber(min) && min > baseValue) {
					baseValue = min;
				}
				if (stacked) {
					baseValue = 0;
				}

				let value = dataItem.get(key as any);
				if (value != null) {
					promises.push(dataItem.animate({ key: key + "Working" as any, to: baseValue, duration: duration!, easing: easing }).waitForStop());
				}
			})
		}
		if (baseAxis === yAxis || !baseAxis) {

			let min = xAxis.getPrivate("min");
			let baseValue = xAxis.baseValue();
			if ($type.isNumber(min) && min > baseValue) {
				baseValue = min;
			}
			if (stacked) {
				baseValue = 0;
			}

			$array.each(this._valueXFields, (key) => {
				let value = dataItem.get(key as any);
				if (value != null) {
					promises.push(dataItem.animate({ key: key + "Working" as any, to: baseValue, duration: duration!, easing: easing }).waitForStop());
				}
			})
		}

		await Promise.all(promises);
	}

	public _markDirtyStack() {
		this._stackDirty = true;
		this.markDirty();
		this._markStakedDirtyStack();
	}

	protected _markStakedDirtyStack() {
		const stackedSeries = this._stackedSeries;
		if (stackedSeries) {

			$object.each(stackedSeries, (_key, value) => {
				if (!value._stackDirty) {
					value._markDirtyStack();
				}
			})
		}
	}

	public _afterChanged() {
		super._afterChanged();
		if (this._skipped) {
			this._markDirtyAxes();
			this._skipped = false;
		}
	}

	/**
	 * Shows the series' tooltip for a data item, and shows that data item in
	 * the legend.
	 *
	 * @param  dataItem  Data item, or `undefined` to clear the tooltip
	 */
	public showDataItemTooltip(dataItem: DataItem<this["_dataItemSettings"]> | undefined) {
		if (!this.getPrivate("doNotUpdateLegend")) {
			this.updateLegendMarker(dataItem);
			this.updateLegendValue(dataItem);
		}

		const tooltip = this.get("tooltip");

		const exactLocationX = this.get("exactLocationX", false);
		const exactLocationY = this.get("exactLocationY", false);

		if (tooltip) {
			if (!this.isHidden() && this.get("visible")) {
				tooltip._setDataItem(dataItem);

				if (dataItem) {
					let locationX = this.get("locationX", 0);
					let locationY = this.get("locationY", 1);

					let itemLocationX = dataItem.get("locationX", locationX);
					let itemLocationY = dataItem.get("locationY", locationY);

					const xAxis = this.get("xAxis");
					const yAxis = this.get("yAxis");

					const vcx = this.get("vcx", 1);
					const vcy = this.get("vcy", 1);

					const xPos = xAxis.getDataItemPositionX(dataItem, this._tooltipFieldX!, this._aLocationX0 + (this._aLocationX1 - this._aLocationX0) * itemLocationX, vcx, exactLocationX);
					const yPos = yAxis.getDataItemPositionY(dataItem, this._tooltipFieldY!, this._aLocationY0 + (this._aLocationY1 - this._aLocationY0) * itemLocationY, vcy, exactLocationY);

					const point = this.getPoint(xPos, yPos);

					let show = true;
					$array.each(this._valueFields, (field) => {
						if (dataItem.get(field as any) == null) {
							show = false;
						}
					})

					if (show) {
						const chart = this.chart;
						if (chart && chart.inPlot(point)) {
							tooltip.label.text.markDirtyText();
							tooltip.set("tooltipTarget", this._getTooltipTarget(dataItem));
							tooltip.set("pointTo", this._display.toGlobal({ x: point.x, y: point.y }));
						}
						else {
							tooltip._setDataItem(undefined);
						}
					}
					else {
						tooltip._setDataItem(undefined);
					}
				}
			}
			else {
				this.hideTooltip();
			}
		}
	}

	public hideTooltip(): Promise<void> | undefined {
		const tooltip = this.get("tooltip");
		if (tooltip) {
			tooltip.set("tooltipTarget", this);
		}
		return super.hideTooltip();
	}

	protected _getTooltipTarget(dataItem: DataItem<this["_dataItemSettings"]>): Sprite {
		if (this.get("seriesTooltipTarget") == "bullet") {
			const bullets = dataItem.bullets;
			if (bullets && bullets.length > 0) {
				const bullet = bullets[0];
				const sprite = bullet.get("sprite");
				if (sprite) {
					return sprite;
				}
			}
		}
		return this;
	}

	/**
	 * @ignore
	 */
	public updateLegendValue(dataItem?: DataItem<this["_dataItemSettings"]> | undefined) {
		const legendDataItem = this.get("legendDataItem");

		if (legendDataItem) {

			const label = legendDataItem.get("label");
			if (label) {
				let txt = "";
				if (dataItem) {
					label._setDataItem(dataItem);
					txt = this.get("legendLabelText", label.get("text", this.get("name", "")));
				}
				else {
					label._setDataItem(this._emptyDataItem);
					txt = this.get("legendRangeLabelText", this.get("legendLabelText", label.get("text", this.get("name", ""))));
				}

				label.set("text", txt);
			}

			const valueLabel = legendDataItem.get("valueLabel");
			if (valueLabel) {
				let txt = "";
				if (dataItem) {
					valueLabel._setDataItem(dataItem);
					txt = this.get("legendValueText", valueLabel.get("text", ""));
				}
				else {
					valueLabel._setDataItem(this._emptyDataItem);
					txt = this.get("legendRangeValueText", valueLabel.get("text", ""));
				}

				valueLabel.set("text", txt);
			}
		}
	}

	protected _getItemReaderLabel(): string {
		let text = "X: {" + this._xField;
		if (this.get("xAxis").isType<DateAxis<any>>("DateAxis")) {
			text += ".formatDate()";
		}
		text += "}; Y: {" + this._yField;
		if (this.get("yAxis").isType<DateAxis<any>>("DateAxis")) {
			text += ".formatDate()";
		}
		text += "}";
		return text;
	}

	/**
	 * @ignore
	 */
	public getPoint(positionX: number, positionY: number): IPoint {
		let x = this._xRenderer.positionToCoordinate(positionX);
		let y = this._yRenderer.positionToCoordinate(positionY);

		// if coordinate is super big, canvas fails to draw line, capping to some big number (won't make any visual difference)
		let max = 999999999;
		if (y < -max) {
			y = -max;
		}
		else if (y > max) {
			y = max;
		}

		if (x < -max) {
			x = -max;
		}
		else if (x > max) {
			x = max;
		}

		return { x: x, y: y };
	}

	protected _shouldInclude(_position: number): boolean {
		return true;
	}

	/**
	 * @ignore
	 */
	public handleCursorHide() {
		this.hideTooltip();
		this.updateLegendValue(undefined);
		this.updateLegendMarker(undefined);
	}

	protected _afterDataChange() {
		super._afterDataChange();
		this.get("xAxis")._markDirtyKey("start");
		this.get("yAxis")._markDirtyKey("start");
		this.resetExtremes();
	}


	/**
	 * Clears the series' cached minimum and maximum values, which the axes
	 * use for their scale.
	 */
	public resetExtremes() {
		this.setPrivate("selectionMinX", undefined);
		this.setPrivate("selectionMaxX", undefined);
		this.setPrivate("selectionMinY", undefined);
		this.setPrivate("selectionMaxY", undefined);

		this.setPrivate("minX", undefined);
		this.setPrivate("minY", undefined);
		this.setPrivate("maxX", undefined);
		this.setPrivate("maxY", undefined);
	}

	/**
	 * Adds an axis range to the series and returns it. Make its data item
	 * with the axis's `makeDataItem()`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-ranges/} for more info
	 * @param   axisDataItem  Axis data item
	 * @return                Axis range
	 */
	public createAxisRange(axisDataItem: DataItem<IAxisDataItem>): this["_axisRangeType"] {
		return this.axisRanges.push({
			axisDataItem: axisDataItem
		})
	}

	/**
	 * The series' original data items, before any grouping by a [[DateAxis]].
	 *
	 * @return  Data items
	 */
	public get mainDataItems(): Array<DataItem<this["_dataItemSettings"]>> {
		return this._mainDataItems;
	}

	/**
	 * @ignore
	 */
	public _adjustStartIndex(index: number): number {
		const xAxis = this.get("xAxis");
		const baseAxis = this.get("baseAxis");

		if (baseAxis == xAxis && xAxis.isType<DateAxis<any>>("DateAxis")) {
			const baseDuration = xAxis.baseDuration();
			const minSelection = xAxis.getPrivate("selectionMin", xAxis.getPrivate("min", 0));
			const dl = baseDuration * this.get("locationX", 0.5);

			let value = -Infinity;

			while (value < minSelection) {
				const dataItem = this.dataItems[index];
				if (dataItem) {
					const open = dataItem.open;
					if (open) {
						value = open["valueX"];
					}
					else {
						value = dataItem.get("valueX", 0);
					}
					value += dl;

					if (value < minSelection) {
						index++;
					}
					else {
						break;
					}
				}
				else {
					break;
				}
			}
		}

		return index;
	}
}
