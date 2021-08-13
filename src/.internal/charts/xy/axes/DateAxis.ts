import type { Root } from "../../../core/Root";
import { DataItem } from "../../../core/render/Component";
import type { AxisRenderer } from "./AxisRenderer";
import type { XYSeries, IXYSeriesDataItem } from "../series/XYSeries";
import { ValueAxis, IValueAxisSettings, IValueAxisPrivate, IValueAxisDataItem, IMinMaxStep, IValueAxisEvents } from "./ValueAxis";
import type { Template } from "../../../core/util/Template";
import * as $type from "../../../core/util/Type";
import * as $order from "../../../core/util/Order";
import * as $array from "../../../core/util/Array";
import * as $object from "../../../core/util/Object";
import * as $utils from "../../../core/util/Utils";
import * as $time from "../../../core/util/Time";
import type { ITimeInterval } from "../../../core/util/Time";

export interface IDateAxisSettings<R extends AxisRenderer> extends IValueAxisSettings<R> {

	/**
	 * Indicates granularity of data.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/date-axis/#Data_granularity} for more info
	 */
	baseInterval: ITimeInterval;

	/**
	 * Relative location of where axis cell starts: 0 - beginning, 1 - end.
	 * 
	 * @default 0
	 */
	startLocation?: number;

	/**
	 * Relative location of where axis cell ends: 0 - beginning, 1 - end.
	 * 
	 * @default 1
	 */
	endLocation?: number;

	/**
	 * Should axis group data items togeter dynamically?
	 *
	 * @default false
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	groupData?: boolean;

	/**
	 * Maximum number of data items in the view before data grouping kicks in.
	 * 
	 * @default 500
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	groupCount?: number;

	/**
	 * Force data item grouping to specific interval.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	groupInterval?: ITimeInterval;

	/**
	 * A list of intervals the axis is allowed to group data items into.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	groupIntervals?: Array<ITimeInterval>;

	/**
	 * A list of intervals the axis is allowed to show grid/labels on.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/date-axis/#Grid_granularity} for more info
	 */
	gridIntervals?: Array<ITimeInterval>;

	/**
	 * Display "period change" labels using different format.
	 *
	 * If set to `true`, will use `periodChangeDateFormats` instead
	 * of `dateFormats` for such labels, e.g. for month start.
	 *
	 * @default true
	 */
	markUnitChange?: boolean;

	/**
	 * Date formats used for intermediate labels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/date-axis/#Date_formats} for more info
	 */
	dateFormats?: { [index: string]: string };

	/**
	 * Date formats used for "period change" labels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/date-axis/#Date_formats} for more info
	 */
	periodChangeDateFormats?: { [index: string]: string };

	/**
	 * A date format to use for axis tooltip.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-dates/} for more info
	 */
	tooltipDateFormat?: string;

}

export interface IDateAxisDataItem extends IValueAxisDataItem {
}

export interface IDateAxisPrivate extends IValueAxisPrivate {

	/**
	 * Current group interval.
	 */
	groupInterval?: ITimeInterval;

	/**
	 * Current base interval.
	 */
	baseInterval: ITimeInterval;

}

export interface IDateAxisEvents extends IValueAxisEvents {
}

/**
 * Creates a date axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/date-axis/} for more info
 * @important
 */
export class DateAxis<R extends AxisRenderer> extends ValueAxis<R> {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new<R extends AxisRenderer>(root: Root, settings: DateAxis<R>["_settings"], template?: Template<DateAxis<R>>): DateAxis<R> {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["axis"]);
		const x = new DateAxis<R>(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "DateAxis";
	public static classNames: Array<string> = ValueAxis.classNames.concat([DateAxis.className]);

	declare public _settings: IDateAxisSettings<R>;
	declare public _privateSettings: IDateAxisPrivate;
	declare public _dataItemSettings: IDateAxisDataItem;
	declare public _events: IDateAxisEvents;

	protected _dataGrouped: boolean = false;
	protected _groupingCalculated: boolean = false;
	protected _intervalDuration: number = 1;

	public _afterNew() {
		super._afterNew();
		this.setPrivateRaw("baseInterval", this.get("baseInterval"));
	}


	protected _groupData() {
		const min = this.getPrivate("min");
		const max = this.getPrivate("max");

		if (($type.isNumber(min) && $type.isNumber(max))) {

			this.setPrivateRaw("maxZoomFactor", Math.round((this.getPrivate("max", 0) - this.getPrivate("min", 0)) / this.baseMainDuration()));

			const groupInterval = this.getPrivate("groupInterval")!;
			if (groupInterval) {
				this.setPrivateRaw("baseInterval", groupInterval);
			}
			else {
				this.setPrivateRaw("baseInterval", this.get("baseInterval"));
			}

			if (!this._dataGrouped) {
				if (this.isDirty("groupInterval")) {
					let groupInterval = this.get("groupInterval")!;
					if (groupInterval) {
						this.setRaw("groupIntervals", [groupInterval]);
					}
				}

				if (this.isDirty("groupData")) {
					if (this.get("groupData")) {
						$array.each(this.series, (series) => {
							this._groupSeriesData(series);
							series.data.events.onAll(() => {
								this._groupSeriesData(series);
							})
						})
					}
				}
				this._dataGrouped = true;
			}
		}
	}


	public _groupSeriesData(series: XYSeries) {

		// make array of intervals which will be used;
		let intervals: ITimeInterval[] = [];
		let baseDuration = this.baseMainDuration();

		let groupIntervals = this.get("groupIntervals")!;
		if (groupIntervals) { }
		$array.each(groupIntervals, (interval) => {
			let intervalDuration = $time.getIntervalDuration(interval);
			if (intervalDuration > baseDuration) {
				intervals.push(interval);
			}
		})

		//for(let k in series._dataSets){
		// clear data sets
		//	console.log(k);
		//}

		series._dataSets = {};

		const key = this.getPrivate("name")! + this.get("renderer").getPrivate("letter")!;
		let fields: Array<string>;

		const baseAxis = series.get("baseAxis");

		if (series.get("xAxis") === baseAxis) {
			fields = series._valueYFields;
		}
		else if (series.get("yAxis") === baseAxis) {
			fields = series._valueXFields;
		}

		let dataItems = series.dataItems;
		let baseInterval = this.get("baseInterval");
		let mainDataSetId: string = baseInterval.timeUnit + baseInterval.count;

		series._dataSets[mainDataSetId] = series.dataItems as any;

		$array.eachContinue(intervals, (interval) => {

			let previousTime = -Infinity;
			let dataSetId = interval.timeUnit + interval.count;
			series._dataSets[dataSetId] = [];

			let newDataItem: DataItem<IXYSeriesDataItem>;

			let sum: { [index: string]: number } = {};
			let count: { [index: string]: number } = {};

			let groupFieldValues: { [index: string]: string } = {};
			let workingFields: { [index: string]: string } = {};

			$array.each(fields, (field) => {
				sum[field] = 0;
				count[field] = 0;
				groupFieldValues[field] = series.get((field + "Grouped") as any);
				workingFields[field] = field + "Working";
			})


			$array.each(dataItems, (dataItem) => {
				let time = dataItem.get(key as any);
				let roundedTime = $time.round(new Date(time), interval.timeUnit, interval.count, this._root.locale.firstDayOfWeek, this._root.utc).getTime();
				let dataContext: any;

				if (previousTime < roundedTime) {
					dataContext = $object.copy(dataItem.dataContext);

					newDataItem = new DataItem(series, dataContext, series._makeDataItem(dataContext));
					series._dataSets[dataSetId].push(newDataItem);

					$array.each(fields, (field) => {
						let value = dataItem.get(field as any);
						if ($type.isNumber(value)) {
							newDataItem.set(field as any, value);
							newDataItem.set(workingFields[field] as any, value);
							count[field]++;
							sum[field] += value;
						}
					})
				}
				else {
					$array.each(fields, (field) => {
						let groupKey = groupFieldValues[field];
						let value = dataItem.get(field as any);
						if (value !== undefined) {

							let currentValue = newDataItem.get(field as any);

							switch (groupKey) {
								case "close":
									newDataItem.set(field as any, value);
									break;

								case "sum":
									newDataItem.set(field as any, currentValue + value);
									break;

								case "open":
									break;

								case "low":
									if (value < currentValue) {
										newDataItem.set(field as any, value);
									}
									break;

								case "high":
									if (value > currentValue) {
										newDataItem.set(field as any, value);
									}
									break;

								case "average":
									count[field]++;
									sum[field] += value;
									let average = sum[field] / count[field];
									newDataItem.set(field as any, average);
									break;

								case "extreme":
									if (Math.abs(value) > Math.abs(currentValue)) {
										newDataItem.set(field as any, value);
									}
									break;
							}

							newDataItem.set(workingFields[field] as any, newDataItem.get(field as any));
							let dataContext: any = $object.copy(dataItem.dataContext);
							dataContext[key as any] = roundedTime
							newDataItem.dataContext = dataContext;
						}
					})
				}
				previousTime = roundedTime;
			})

			if (series._dataSets[dataSetId].length < this.get("groupCount", Infinity)) {
				return false
			}
			return true;
		})
	}

	public _clearDirty() {
		super._clearDirty();
		this._groupingCalculated = false;
	}

	protected _handleRangeChange() {
		super._handleRangeChange();

		const selectionMin = this.getPrivate("selectionMin");
		const selectionMax = this.getPrivate("selectionMax");

		if ($type.isNumber(selectionMin) && $type.isNumber(selectionMax)) {

			if (this.get("groupData") && !this._groupingCalculated) {
				this._groupingCalculated = true;
				let baseInterval = this.get("baseInterval");

				let modifiedDifference = (selectionMax - selectionMin) + (this.get("startLocation", 0) + (1 - this.get("endLocation", 1)) * this.baseDuration());
				let groupInterval = this.get("groupInterval");

				if (!groupInterval) {
					const groupIntervals = this.get("groupIntervals")!;
					if (groupIntervals) {
						groupInterval = $time.chooseInterval(0, modifiedDifference, this.get("groupCount", Infinity), groupIntervals);
						if ($time.getIntervalDuration(groupInterval) < $time.getIntervalDuration(baseInterval)) {
							groupInterval = { ...baseInterval };
						}
					}
				}

				let current = this.getPrivate("groupInterval");

				if (groupInterval && (!current || (current.timeUnit !== groupInterval.timeUnit || current.count !== groupInterval.count))) {
					this.setPrivateRaw("groupInterval", groupInterval);
					this.setPrivateRaw("baseInterval", groupInterval!);

					if (groupInterval) {
						let newId = groupInterval.timeUnit + groupInterval.count;
						$array.each(this.series, (series) => {
							if (series.get("baseAxis") === this) {
								series.setDataSet(newId);
							}
						})
						this.markDirtyExtremes();
					}
				}
			}

			$array.each(this.series, (series) => {
				if (series.get("baseAxis") === this) {
					let fieldName = <any>(this.getPrivate("name")! + this.get("renderer").getPrivate("letter")!);

					const start = $array.getSortedIndex(series.dataItems, (dataItem) => {
						return $order.compare(dataItem.get(fieldName), selectionMin);
					});

					if (start.index > 0) {
						start.index -= 1;
					}

					const end = $array.getSortedIndex(series.dataItems, (dataItem) => {
						return $order.compare(dataItem.get(fieldName), selectionMax);
					});

					series.setPrivate("startIndex", start.index);
					series.setPrivate("endIndex", end.index);
				}
			})
		}
	}

	protected _adjustMinMax(min: number, max: number, gridCount: number, _strictMode?: boolean): IMinMaxStep {
		return { min: min, max: max, step: (max - min) / gridCount };
	}

	/**
	 * @ignore
	 */
	public intervalDuration(): number {
		return this._intervalDuration;
	}

	protected _prepareAxisItems() {
		const min = this.getPrivate("min");
		const max = this.getPrivate("max");

		if ($type.isNumber(min) && $type.isNumber(max)) {
			const selectionMin = this.getPrivate("selectionMin")! as number;
			const selectionMax = this.getPrivate("selectionMax")! as number;
			const renderer = this.get("renderer");
			const baseInterval = this.getPrivate("baseInterval");

			let value = selectionMin;
			let i = 0;

			const intervals = this.get("gridIntervals")!;
			let gridInterval = $time.chooseInterval(0, selectionMax - selectionMin, renderer.gridCount(), intervals);

			if ($time.getIntervalDuration(gridInterval) < this.baseDuration()) {
				gridInterval = { ...baseInterval };
			}

			const intervalDuration = $time.getIntervalDuration(gridInterval);
			this._intervalDuration = intervalDuration;

			const nextGridUnit = $time.getNextUnit(gridInterval.timeUnit);
			value = $time.round(new Date(selectionMin - intervalDuration), gridInterval.timeUnit, gridInterval.count, this._root.locale.firstDayOfWeek, this._root.utc, new Date(min)).getTime();
			let previousValue = value - intervalDuration;
			let format: string;
			const formats = this.get("dateFormats")!;

			while (value < selectionMax + intervalDuration) {
				let dataItem: DataItem<this["_dataItemSettings"]>;
				if (this.dataItems.length < i + 1) {
					dataItem = new DataItem(this, undefined, {});
					this._dataItems.push(dataItem);
					this.processDataItem(dataItem);
				}
				else {
					dataItem = this.dataItems[i];
				}

				this._createAssets(dataItem);

				if (dataItem.isHidden()) {
					dataItem.show();
				}

				dataItem.set("value", value);
				dataItem.set("endValue", value + intervalDuration);
				let date = new Date(value);

				format = formats[gridInterval.timeUnit];

				if (nextGridUnit && this.get("markUnitChange") && $type.isNumber(previousValue)) {
					if (gridInterval.timeUnit != "year") {
						if ($time.checkChange(date, new Date(previousValue), nextGridUnit, this._root.utc)) {
							format = this.get("periodChangeDateFormats")![gridInterval.timeUnit];
						}
					}
				}

				const label = dataItem.get("label");
				if (label) {
					label.set("text", this._root.dateFormatter.format(date, format!));
				}

				this._prepareDataItem(dataItem, gridInterval.count);

				previousValue = value;

				value = $time.add(new Date(value), gridInterval.timeUnit, gridInterval.count, this._root.utc).getTime();

				i++;
			}

			for (let j = i; j < this.dataItems.length; j++) {
				this.dataItems[j].hide();
			}

			$array.each(this.series, (series) => {
				if (series.inited) {
					series._markDirtyAxes();
				}
			})
		}

		this._updateGhost();
	}

	protected _fixMin(min: number) {
		let baseInterval = this.getPrivate("baseInterval");
		let startTime = $time.round(new Date(min), baseInterval.timeUnit, baseInterval.count, this._root.locale.firstDayOfWeek, this._root.utc).getTime();
		let endTime = $time.add(new Date(startTime), baseInterval.timeUnit, baseInterval.count, this._root.utc).getTime();

		return startTime + (endTime - startTime) * this.get("startLocation", 0);
	}

	protected _fixMax(max: number) {
		let baseInterval = this.getPrivate("baseInterval");
		let startTime = $time.round(new Date(max), baseInterval.timeUnit, baseInterval.count, this._root.locale.firstDayOfWeek, this._root.utc).getTime();
		let endTime = $time.add(new Date(startTime), baseInterval.timeUnit, baseInterval.count, this._root.utc).getTime();

		return startTime + (endTime - startTime) * this.get("endLocation", 1);
	}

	/**
	 * Returns a duration of currently active `baseInterval` in milliseconds.
	 * 
	 * @return Duration
	 */
	public baseDuration(): number {
		return $time.getIntervalDuration(this.getPrivate("baseInterval"));
	}

	/**
	 * Returns a duration of user-defined `baseInterval` in milliseconds.
	 * 
	 * @return Duration
	 */
	public baseMainDuration(): number {
		return $time.getIntervalDuration(this.get("baseInterval"));
	}

	/**
	 * @ignore
	 */
	public processSeriesDataItem(dataItem: DataItem<IXYSeriesDataItem>, fields: Array<string>) {
		const baseInterval = this.getPrivate("baseInterval");

		dataItem.open = {};
		dataItem.close = {};

		$array.each(fields, (field) => {
			let value = dataItem.get(field as any);
			if ($type.isNumber(value)) {
				let startTime = $time.round(new Date(value), baseInterval.timeUnit, baseInterval.count, this._root.locale.firstDayOfWeek, this._root.utc).getTime();
				let endTime = $time.add(new Date(startTime), baseInterval.timeUnit, baseInterval.count, this._root.utc).getTime();
				dataItem.open![field] = startTime;
				dataItem.close![field] = endTime;
			}
		})
	}

	/**
	 * @ignore
	 */
	public getDataItemPositionX(dataItem: DataItem<IXYSeriesDataItem>, field: string, cellLocation: number, axisLocation: number): number {
		let openValue = dataItem.open![field];
		let closeValue = dataItem.close![field];

		let value = openValue + (closeValue - openValue) * cellLocation;

		value = this._baseValue + (value - this._baseValue) * axisLocation;

		return this.valueToPosition(value);
	}

	/**
	 * @ignore
	 */
	public getDataItemCoordinateX(dataItem: DataItem<IXYSeriesDataItem>, field: string, cellLocation: number, axisLocation: number): number {
		return this._settings.renderer.positionToCoordinate(this.getDataItemPositionX(dataItem, field, cellLocation, axisLocation));
	}

	/**
	 * @ignore
	 */
	public getDataItemPositionY(dataItem: DataItem<IXYSeriesDataItem>, field: string, cellLocation: number, axisLocation: number): number {
		let openValue = dataItem.open![field];
		let closeValue = dataItem.close![field];

		let value = openValue + (closeValue - openValue) * cellLocation;

		value = this._baseValue + (value - this._baseValue) * axisLocation;
		return this.valueToPosition(value);
	}

	/**
	 * @ignore
	 */
	public getDataItemCoordinateY(dataItem: DataItem<IXYSeriesDataItem>, field: string, cellLocation: number, axisLocation: number): number {
		return this._settings.renderer.positionToCoordinate(this.getDataItemPositionY(dataItem, field, cellLocation, axisLocation));
	}

	/**
	 * @ignore
	 */
	public roundAxisPosition(position: number, location: number): number {
		let value = this.positionToValue(position);
		let baseInterval = this.getPrivate("baseInterval");
		value = $time.round(new Date(value), baseInterval.timeUnit, baseInterval.count, this._root.locale.firstDayOfWeek, this._root.utc).getTime();
		let endValue = value;
		if (location > 0) {
			endValue = $time.add(new Date(value), baseInterval.timeUnit, baseInterval.count, this._root.utc).getTime();
		}
		return this.valueToPosition(value + (endValue - value) * location);
	}

	/**
	 * Returns text to be used in an axis tooltip for specific relative position.
	 * 
	 * @param   position  Position
	 * @return            Tooltip text
	 */
	public getTooltipText(position: number): string | undefined {
		//@todo number formatter + tag

		let format = this.get("dateFormats")![this.getPrivate("baseInterval").timeUnit];
		return this._root.dateFormatter.format(new Date(this.positionToValue(position)), this.get("tooltipDateFormat", format));
	}

	/**
	 * Returns a data item from series that is closest to the `position`.
	 * 
	 * @param   series    Series
	 * @param   position  Relative position
	 * @return            Data item
	 */
	public getSeriesItem(series: XYSeries, position: number): DataItem<IXYSeriesDataItem> | undefined {
		let fieldName = <any>(this.getPrivate("name")! + this.get("renderer").getPrivate("letter")!);
		let value = this.positionToValue(position);
		const result = $array.getSortedIndex(series.dataItems, (dataItem) => {
			return $order.compare(dataItem.get(fieldName), value);
		});

		if (series.get("snapTooltip")) {
			let first = series.dataItems[result.index - 1];
			let second = series.dataItems[result.index];

			if (first && second) {
				let open = first.open![fieldName];
				let close = second.close![fieldName];

				if (Math.abs(value - open) > Math.abs(value - close)) {
					return second;
				}
			}
			return first;
		}
		else {
			// @todo check if is in range
			const dataItem = series.dataItems[result.index - 1];

			if (dataItem) {
				if (dataItem.open && dataItem.close) {
					let open = dataItem.open[fieldName];
					let close = dataItem.close[fieldName];

					if (value >= open && value <= close) {
						return dataItem;
					}
				}
			}
		}
	}

	/**
	 * @ignore
	 */
	public shouldGap(dataItem: DataItem<IXYSeriesDataItem>, nextItem: DataItem<IXYSeriesDataItem>, autoGapCount: number, fieldName: string): boolean {
		const value1 = dataItem.get(fieldName as any);
		const value2 = nextItem.get(fieldName as any);

		if (value2 - value1 > this.baseDuration() * autoGapCount) {
			return true;
		}
		return false;
	}

	/**
	 * Zooms the axis to specific `start` and `end` dates.
	 *
	 * Optional `duration` specifies duration of zoom animation in milliseconds.
	 * 
	 * @param  start     Start Date
	 * @param  end       End Date
	 * @param  duration  Duration in milliseconds
	 */
	public zoomToDates(start: Date, end: Date, duration?: number) {
		this.zoomToValues(start.getTime(), end.getTime(), duration);
	}

	/**
	 * Returns a `Date` object corresponding to specific position within plot
	 * area.
	 * 
	 * @param   position  Pposition
	 * @return            Date
	 */
	public positionToDate(position: number): Date {
		return new Date(this.positionToValue(position));
	}

	/**
	 * Returns a relative position within plot area that corresponds to specific
	 * date.
	 * 
	 * @param   date  Date
	 * @return        Position
	 */
	public dateToPosition(date: Date): number {
		return this.valueToPosition(date.getTime());
	}
}
