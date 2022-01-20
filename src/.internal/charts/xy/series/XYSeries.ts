import { DataItem } from "../../../core/render/Component";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate } from "../../../core/render/Series";
import type { Axis, IAxisPrivate, IAxisDataItem } from "../axes/Axis";
import type { AxisRenderer } from "../axes/AxisRenderer";
import * as $array from "../../../core/util/Array";
import * as $utils from "../../../core/util/Utils";
import { List } from "../../../core/util/List";
import * as $type from "../../../core/util/Type";
import * as $object from "../../../core/util/Object";
import type { IPoint } from "../../../core/util/IPoint";
import type { Sprite } from "../../../core/render/Sprite";
import type { Bullet } from "../../../core/render/Bullet";
import type { XYChart } from "../XYChart";
import { Container } from "../../../core/render/Container";
import { Graphics } from "../../../core/render/Graphics";

import type { CategoryAxis } from "../axes/CategoryAxis";
import type { DateAxis } from "../axes/DateAxis";

/**
 * @ignore
 */
function min(left: number | undefined, right: number | undefined): number | undefined {
	if (left == null) {
		return right;

	} else if (right == null) {
		return left;

	} else if (right < left) {
		return right;

	} else {
		return left;
	}
}

/**
 * @ignore
 */
function max(left: number | undefined, right: number | undefined): number | undefined {
	if (left == null) {
		return right;

	} else if (right == null) {
		return left;

	} else if (right > left) {
		return right;

	} else {
		return left;
	}
}

/**
 * Interface representing a series axis range.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-ranges/#Series_axis_ranges} for more info
 */
export interface IXYSeriesAxisRange {

	/**
	 * Related axis data item.
	 */
	axisDataItem: DataItem<IAxisDataItem>;

	/**
	 * A [[Container]] element that range's elements are placed in.
	 */
	container?: Container;

	/**
	 * Target series.
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
}

export interface IXYSeriesSettings extends ISeriesSettings {

	/**
	 * Minimal distance between data items in pixels.
	 *
	 * If data items are closer than this, bullets are turned off to avoid
	 * overcrowding.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Bullets} for more info
	 */
	minBulletDistance?: number;

	/**
	 * X axis series uses.
	 */
	xAxis: IXYAxis;

	/**
	 * Y axis series uses.
	 */
	yAxis: IXYAxis;

	/**
	 * If set to `true` series will be stacked to other series that also have
	 * this setting set to `true`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Stacked_series} for more info
	 */
	stacked?: boolean;

	/**
	 * Whether to stack negative values from zero (`true`) or from whatever
	 * previous series value is (`false`).
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Negative_value_stacking} for more info
	 */
	stackToNegative?: boolean;

	/**
	 * Base axis for the series.
	 *
	 * A base axis will dictate direction series plot.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Base_axis} for more info
	 */
	baseAxis?: IXYAxis;

	/**
	 * Input data field for X value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	valueXField?: string;

	/**
	 * Input data field for Y value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	valueYField?: string;

	/**
	 * Exclude series values when calculating totals for category/interval.
	 *
	 * @default false
	 */
	excludeFromTotal?: boolean;

	/**
	 * Display data field for X value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	valueXShow?: "valueXWorking" | "valueXChange" | "valueXChangePercent" | "valueXChangeSelection" | "valueXChangeSelectionPercent" | "valueXChangePrevious" | "valueXChangePreviousPercent" | "valueXTotal" | "valueXTotalPercent" | "valueXSum";

	/**
	 * Display data field for Y value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	valueYShow?: "valueYWorking" | "valueYChange" | "valueYChangePercent" | "valueYChangeSelection" | "valueYChangeSelectionPercent" | "valueYChangePrevious" | "valueYChangePreviousPercent" | "valueYTotal" | "valueYTotalPercent" | "valueYSum";

	/**
	 * Indicates what aggregate value to use for collective data item, when
	 * aggregating X values from several data items.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	valueXGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * Indicates what aggregate value to use for collective data item, when
	 * aggregating X values from several data items.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	valueYGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * Input data field for X open value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openValueXField?: string;

	/**
	 * Input data field for X open value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openValueYField?: string;

	/**
	 * Display data field for X open value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openValueXShow?: "openValueXWorking" | "openValueXChange" | "openValueXChangePercent" | "openValueXChangeSelection" | "openValueXChangeSelectionPercent" | "openValueXChangePrevious" | "openValueXChangePreviousPercent";

	/**
	 * Display data field for Y open value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openValueYShow?: "openValueYWorking" | "openValueYChange" | "openValueYChangePercent" | "openValueYChangeSelection" | "openValueYChangeSelectionPercent" | "openValueYChangePrevious" | "openValueYChangePreviousPercent";

	/**
	 * Display data field for Y open value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	openValueXGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * Display data field for Y open value.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	openValueYGrouped?: "open" | "close" | "low" | "high" | "average" | "sum" | "extreme";

	/**
	 * Input data field for X category.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	categoryXField?: string;

	/**
	 * Input data field for Y category.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	categoryYField?: string;

	/**
	 * Display data field for X category.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openCategoryXField?: string;

	/**
	 * Display data field for Y category.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Data_fields} for more info
	 */
	openCategoryYField?: string;

	/**
	 * If set to `true` this series will be ignored when calculating scale of the
	 * related axes.
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
	 * Horizontal location of the open data point relative to its cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @default 0.5
	 */
	openLocationX?: number;

	/**
	 * Vertical location of the open data point relative to its cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @default 0.5
	 */
	openLocationY?: number;

	/**
	 * If set to `true` [[XYCursor]] will show closest data item from series
	 * even if it is outside currently hovered date axis interval.
	 *
	 * This setting is relevant only if `baseAxis` is a date axis.
	 */
	snapTooltip?: boolean;

	/**
	 * Text to use for series legend label when no particular category/interval
	 * is selected.
	 */
	legendRangeLabelText?: string;

	/**
	 * Text to use for series legend value label when no particular
	 * category/interval is selected.
	 */
	legendRangeValueText?: string;


	/**
	 * If set to `true`, series bullets will be masked by plot area.
	 */
	maskBullets?: boolean;

	/**
	 * Whether series' tooltip should inherit its color from series or its first
	 * bullet.
	 *
	 * @default "series"
	 */
	seriesTooltipTarget?: "series" | "bullet";

	/**
	 * Indicates horizontal position at which to show series' tooltip at.
	 *
	 * @default "value"
	 * @since 5.0.16
	 */
	tooltipPositionX?: "open" | "value" | "low" | "high";

	/**
	 * Indicates vertical position at which to show series' tooltip at.
	 *
	 * @default "value"
	 * @since 5.0.16
	 */
	tooltipPositionY?: "open" | "value" | "low" | "high";


	/**
	 * @todo review
	 */
	groupDataDisabled?: boolean;
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
}


/**
 * A base class for all XY chart series.
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

	protected _xField!: string;
	protected _yField!: string;
	protected _xOpenField!: string;
	protected _yOpenField!: string;

	protected _xLowField!: string;
	protected _xHighField!: string;
	protected _yLowField!: string;
	protected _yHighField!: string;

	protected _axesDirty: boolean = false;
	protected _stackDirty: boolean = false;

	protected _selectionProcessed = false;

	declare public chart: XYChart | undefined;

	public _dataSets: { [index: string]: Array<DataItem<IXYSeriesDataItem>> } = {};

	public _mainContainerMask: Graphics | undefined;

	protected _x: number = 0;
	protected _y: number = 0;

	/**
	 * A [[Container]] that us used to put series' elements in.
	 *
	 * @default Container.new()
	 */
	public readonly mainContainer: Container = this.children.push(Container.new(this._root, {}));

	/**
	 * A list of axis ranges that affect the series.
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
		"openValueX"
	];

	protected valueYFields = [
		"valueY",
		"openValueY"
	];

	public _valueXFields!: Array<string>;
	public _valueYFields!: Array<string>;

	// used for full min/max
	protected _valueXShowFields!: Array<string>;
	protected _valueYShowFields!: Array<string>;

	// used for selection (uses working)
	protected __valueXShowFields!: Array<string>;
	protected __valueYShowFields!: Array<string>;

	protected _emptyDataItem = new DataItem(this, undefined, {});

	public _dataSetId?: string;

	protected _tooltipFieldX?: string;
	protected _tooltipFieldY?: string;

	protected _afterNew() {
		this.fields.push("categoryX", "categoryY", "openCategoryX", "openCategoryY");
		this.valueFields.push("valueX", "valueY", "openValueX", "openValueY");

		this._setRawDefault("vcx", 1);
		this._setRawDefault("vcy", 1);
		// this can't go to themes, as data might be parsed before theme
		this._setRawDefault("valueXShow", "valueXWorking");
		this._setRawDefault("valueYShow", "valueYWorking");

		this._setRawDefault("openValueXShow", "openValueXWorking");
		this._setRawDefault("openValueYShow", "openValueYWorking");

		super._afterNew();

		this._settings.xAxis.series.push(this);
		this._settings.yAxis.series.push(this);

		this.set("maskContent", true);

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

		if (!this.get("baseAxis")) {
			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			if (yAxis.isType<CategoryAxis<any>>("CategoryAxis") || yAxis.isType<DateAxis<any>>("DateAxis")) {
				this.set("baseAxis", yAxis);
			}
			else {
				this.set("baseAxis", xAxis);
			}
		}

		this.states.create("hidden", <any>{ opacity: 1, visible: false });

		this._makeFieldNames();
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
				container.set("mask", axisFill);
			}
			axis._seriesAxisRanges.push(axisDataItem);
		}
	}

	protected _removeAxisRange(axisRange: this["_axisRangeType"]) {
		const axisDataItem = axisRange.axisDataItem;
		const axis = <Axis<AxisRenderer>>axisDataItem.component;
		axis.disposeDataItem(axisDataItem);

		$array.remove(axis._seriesAxisRanges, axisDataItem);

		const container = axisRange.container;
		if (container) {
			container.dispose();
		}
	}

	protected _updateFields() {
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
						this._valueYShowFields.push(field);
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
		$array.removeFirst(this.get("xAxis").series, this);
		$array.removeFirst(this.get("yAxis").series, this);
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
		if (!this.get("xAxis").inited || !this.get("yAxis").inited) {
			return false
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
				hiddenState.set("vcy", value);
			}
			else if (yAxis === baseAxis) {
				hiddenState.set("vcx", value);
			}
			else {
				hiddenState.set("vcy", value);
				hiddenState.set("vcx", value);
			}
		}
	}


	protected _handleMaskBullets() {
		if (this.isDirty("maskBullets")) {
			this.bulletsContainer.set("maskContent", this.get("maskBullets"));
		}
	}


	public _prepareChildren() {
		super._prepareChildren();

		this.set("width", this.get("xAxis").width());
		this.set("height", this.get("yAxis").height());

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

		if (xAxis === baseAxis) {
			this.set("y", yAxis.y() - $utils.relativeToValue(yAxis.get("centerY", 0), yAxis.height()) - yAxis.parent!.get("paddingTop", 0));
			this.bulletsContainer.set("y", this.y());
		}
		else if (yAxis === baseAxis) {
			this.set("x", xAxis.x() - $utils.relativeToValue(xAxis.get("centerX", 0), xAxis.width()) - xAxis.parent!.get("paddingLeft", 0));
			this.bulletsContainer.set("x", this.x());
		}

		const stacked = this.get("stacked");

		if (this.isDirty("stacked")) {
			if (stacked) {
				if (this._valuesDirty && !this._dataProcessed) {

				}
				else {
					this._stack();
				}
			}
			else {
				this._unstack();
			}
		}

		if (this._valuesDirty && !this._dataProcessed) {
			this._dataProcessed = true;

			if (stacked) {
				this._stack();
			}

			$array.each(this.dataItems, (dataItem) => {
				$array.each(this._valueXShowFields, (key) => {
					let value = dataItem.get(<any>key);
					if (value != null) {
						if (stacked) {
							value += this.getStackedXValue(dataItem, key);
						}

						this._min("minX", value);
						this._max("maxX", value);
					}
				})

				$array.each(this._valueYShowFields, (key) => {
					let value = dataItem.get(<any>key);
					if (value != null) {

						if (stacked) {
							value += this.getStackedYValue(dataItem, key);
						}

						this._min("minY", value);
						this._max("maxY", value);
					}
				})

				xAxis.processSeriesDataItem(dataItem, this._valueXFields);
				yAxis.processSeriesDataItem(dataItem, this._valueYFields);
			})

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
			this.updateLegendValue(undefined);
		}

		if (this.isDirty("vcx") || this.isDirty("vcy")) {
			this._markStakedDirtyStack();
		}

		if (!this._dataGrouped) {
			xAxis._groupSeriesData(this);
			yAxis._groupSeriesData(this);
			this._dataGrouped = true;
		}

		if ((this._valuesDirty || this.isPrivateDirty("startIndex") || this.isPrivateDirty("endIndex") || this.isDirty("vcx") || this.isDirty("vcy") || this._stackDirty)) {

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

			if ((this._psi != startIndex || this._pei != endIndex || this.isDirty("vcx") || this.isDirty("vcy") || this._stackDirty || this._valuesDirty) && !this._selectionProcessed) {
				this._selectionProcessed = true;

				const vcx = this.get("vcx", 1);
				const vcy = this.get("vcy", 1);
				const stacked = this.get("stacked", false);

				if (baseAxis === xAxis) {
					yAxis._calculateTotals();
					this.setPrivateRaw("selectionMinY", undefined);
					this.setPrivateRaw("selectionMaxY", undefined);
					for (let i = startIndex; i < endIndex; i++) {
						this.processYSelectionDataItem(this.dataItems[i], vcy, stacked);
					}
				}
				else if (baseAxis === yAxis) {
					xAxis._calculateTotals();
					this.setPrivateRaw("selectionMinX", undefined);
					this.setPrivateRaw("selectionMaxX", undefined);
					for (let i = startIndex; i < endIndex; i++) {
						this.processXSelectionDataItem(this.dataItems[i], vcx, stacked);
					}
				}

				if (baseAxis === xAxis) {
					if (this.get("valueYShow") !== "valueYWorking") {
						this.setPrivateRaw("minY", this.getPrivate("selectionMinY"));
						this.setPrivateRaw("maxY", this.getPrivate("selectionMaxY"));
						yAxis.markDirtyExtremes();
					}
				}
				else if (baseAxis === yAxis) {
					if (this.get("valueXShow") !== "valueXWorking") {
						this.setPrivateRaw("minX", this.getPrivate("selectionMinX"));
						this.setPrivateRaw("maxX", this.getPrivate("selectionMaxX"));
						xAxis.markDirtyExtremes();
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

	protected _unstack() {
		$object.each(this._reallyStackedTo, (_key, value) => {
			delete (value._stackedSeries[this.uid]);
		})

		this._reallyStackedTo = {};
		$array.each(this.dataItems, (dataItem) => {
			dataItem.setRaw("stackToItemY", undefined);
			dataItem.setRaw("stackToItemX", undefined);
		})
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

			const positionX = xAxis.getDataItemPositionX(dataItem, this._xField, locationX, this.get("vcx", 1));
			const positionY = yAxis.getDataItemPositionY(dataItem, this._yField, locationY, this.get("vcy", 1))

			let point = this.getPoint(positionX, positionY);

			let left = dataItem.get("left", point.x);
			let right = dataItem.get("right", point.x);
			let top = dataItem.get("top", point.y);
			let bottom = dataItem.get("bottom", point.y);

			if (this._shouldShowBullet(positionX, positionY)) {
				if (!bullet.getPrivate("hidden")) {
					sprite.setPrivate("visible", true);
				}
				else {
					sprite.setPrivate("visible", false);
				}

				let w = right - left;
				let h = bottom - top;

				if (sprite.isType("Label")) {
					sprite.set("maxWidth", Math.abs(w));
					sprite.set("maxHeight", Math.abs(h));
				}

				let x = left + w * locationX;
				let y = bottom - h * locationY;

				sprite.set("x", x);
				sprite.set("y", y);
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
		}
	}

	protected _handleDataSetChange() {
		if (this.bullets.length > 0) {
			$array.each(this._dataItems, (dataItem) => {
				let bullets = dataItem.bullets;
				if (bullets) {
					$array.each(bullets, (bullet) => {
						let sprite = bullet.get("sprite");
						if (sprite) {
							sprite.setPrivate("visible", false);
						}
					})
				}
			})
		}

	}

	/**
	 * Shows hidden series.
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
	 * Hides series.
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
	 * Shows series's data item.
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
	 * Hides series's data item.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.hideDataItem(dataItem, duration)];

		const hiddenState = this.states.create("hidden", {})

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
				promises.push(dataItem.animate({ key: key + "Working" as any, to: baseValue, duration: duration!, easing: easing }).waitForStop());
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
				promises.push(dataItem.animate({ key: key + "Working" as any, to: baseValue, duration: duration!, easing: easing }).waitForStop());
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
				value._markDirtyStack();
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
	 * Shows a tooltip for specific data item.
	 *
	 * @param  dataItem  Data item
	 */
	public showDataItemTooltip(dataItem: DataItem<this["_dataItemSettings"]> | undefined) {
		this.updateLegendMarker(dataItem);
		this.updateLegendValue(dataItem);

		if (this.get("tooltip")) {
			if (!this.isHidden()) {
				const tooltip = this.get("tooltip")!;
				if (tooltip) {
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

						const xPos = xAxis.getDataItemPositionX(dataItem, this._tooltipFieldX!, this._aLocationX0 + (this._aLocationX1 - this._aLocationX0) * itemLocationX, vcx);
						const yPos = yAxis.getDataItemPositionY(dataItem, this._tooltipFieldY!, this._aLocationY0 + (this._aLocationY1 - this._aLocationY0) * itemLocationY, vcy);

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
			}
			else {
				this.hideTooltip();
			}
		}
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
	public updateLegendValue(dataItem: DataItem<this["_dataItemSettings"]> | undefined) {
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
		let x = this.get("xAxis").get("renderer").positionToCoordinate(positionX);
		let y = this.get("yAxis").get("renderer").positionToCoordinate(positionY);

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

	public _afterDataChange() {
		super._afterDataChange();
		this.resetExtremes();
	}


	// todo description
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
	 * Creates and returns an axis range object.
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

}
