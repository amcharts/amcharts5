import { DataItem } from "../../../core/render/Component";
import type { AxisRenderer } from "./AxisRenderer";
import type { XYSeries, IXYSeriesDataItem } from "../series/XYSeries";
import { ValueAxis, IValueAxisSettings, IValueAxisPrivate, IValueAxisDataItem, IMinMaxStep, IValueAxisEvents } from "./ValueAxis";
import * as $type from "../../../core/util/Type";
import * as $math from "../../../core/util/Math";
import * as $order from "../../../core/util/Order";
import * as $array from "../../../core/util/Array";
import * as $object from "../../../core/util/Object";
import * as $utils from "../../../core/util/Utils";
import * as $time from "../../../core/util/Time";
import type { ITimeInterval } from "../../../core/util/Time";
import type { TimeUnit } from "../../../core/util/Time";

export interface IDateAxisSettings<R extends AxisRenderer> extends IValueAxisSettings<R> {

	/**
	 * Indicates granularity of data.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Data_granularity} for more info
	 */
	baseInterval: ITimeInterval;

	/**
	 * Relative location of where axis cell starts: 0 - beginning, 1 - end.
	 *
	 * IMPORTANT: `startLocation` is not supported by [[GaplessDateAxis]].
	 *
	 * @default 0
	 */
	startLocation?: number;

	/**
	 * Relative location of where axis cell ends: 0 - beginning, 1 - end.
	 *
	 * IMPORTANT: `endLocation` is not supported by [[GaplessDateAxis]].
	 * 
	 * @default 1
	 */
	endLocation?: number;

	/**
	 * Should axis group data items togeter dynamically?
	 *
	 * @default false
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	groupData?: boolean;

	/**
	 * Maximum number of data items in the view before data grouping kicks in.
	 *
	 * @default 500
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	groupCount?: number;

	/**
	 * Force data item grouping to specific interval. This interval must be within groupIntervals array for this to work.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	groupInterval?: ITimeInterval;

	/**
	 * A list of intervals the axis is allowed to group data items into.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping} for more info
	 */
	groupIntervals?: Array<ITimeInterval>;

	/**
	 * A list of intervals the axis is allowed to show grid/labels on.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Grid_granularity} for more info
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
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Date_formats} for more info
	 */
	dateFormats?: { [index: string]: string | Intl.DateTimeFormatOptions };

	/**
	 * Date formats used for minor grid labels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Minor_grid_formats} for more info
	 * @since 5.6.0
	 */
	minorDateFormats?: { [index: string]: string | Intl.DateTimeFormatOptions };

	/**
	 * Date formats used for "period change" labels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Date_formats} for more info
	 */
	periodChangeDateFormats?: { [index: string]: string | Intl.DateTimeFormatOptions };

	/**
	 * A date format to use for axis tooltip.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Axis_tooltip} for more info
	 */
	tooltipDateFormat?: string | Intl.DateTimeFormatOptions;

	/**
	 * Time unit-specific formats to use for axis tooltip.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Axis_tooltip} for more info
	 * @since 5.1.4
	 */
	tooltipDateFormats?: { [index: string]: string | Intl.DateTimeFormatOptions };

	/**
	 * A value which indicates relative position within axis cell to get timestamp
	 * for the tooltip from.
	 *
	 * Values are from `-1` to `1`.
	 *
	 * If not set, it will use `tooltipLocation` value, if `tooltipLocation`` is
	 * not set, it will use -0.5.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Axis_tooltip} for more info
	 * @since 5.1.4
	 */
	tooltipIntervalOffset?: number;
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

	/**
	 * Current grid interval.
	 */
	gridInterval: ITimeInterval;
}

export interface IDateAxisEvents extends IValueAxisEvents {

	/**
	 * Kicks in when data grouping is on, and current group interval changes, e.g. via zooming the chart.
	 *
	 * @since 5.2.43
	 */
	groupintervalchanged: {}

}

/**
 * Creates a date axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/} for more info
 * @important
 */
export class DateAxis<R extends AxisRenderer> extends ValueAxis<R> {
	public static className: string = "DateAxis";
	public static classNames: Array<string> = ValueAxis.classNames.concat([DateAxis.className]);

	declare public _settings: IDateAxisSettings<R>;
	declare public _privateSettings: IDateAxisPrivate;
	declare public _dataItemSettings: IDateAxisDataItem;
	declare public _events: IDateAxisEvents;

	protected _dataGrouped: boolean = false;
	protected _seriesDataGrouped: boolean = false;
	protected _groupingCalculated: boolean = false;
	protected _intervalDuration: number = 1;
	protected _baseDuration: number = 1;

	protected _intervalMax: { [index: string]: number } = {};
	protected _intervalMin: { [index: string]: number } = {};

	public _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["axis"]);
		super._afterNew();
		this._setBaseInterval(this.get("baseInterval"));
		this.on("baseInterval", () => {
			this._setBaseInterval(this.get("baseInterval"));
		})
	}

	protected _setBaseInterval(interval: ITimeInterval) {
		this.setPrivateRaw("baseInterval", interval);
		this._baseDuration = $time.getIntervalDuration(interval);
	}

	protected _fixZoomFactor() {
		const maxZoomFactor = this.get("maxZoomFactor");
		if (maxZoomFactor != null && maxZoomFactor != Infinity) {
			this.setPrivateRaw("maxZoomFactor", maxZoomFactor);
		}
		else {
			this.setPrivateRaw("maxZoomFactor", Math.round((this.getPrivate("max", 0) - this.getPrivate("min", 0)) / this.baseMainDuration()));
		}
	}

	protected _groupData() {
		const min = this.getPrivate("min");
		const max = this.getPrivate("max");

		if (($type.isNumber(min) && $type.isNumber(max))) {

			this._fixZoomFactor();

			const groupInterval = this.getPrivate("groupInterval")!;
			if (groupInterval) {
				this._setBaseInterval(groupInterval);
			}
			else {
				this._setBaseInterval(this.get("baseInterval"));
			}


			if (this.isDirty("groupInterval")) {
				let groupInterval = this.get("groupInterval")!;
				if (groupInterval) {
					this.setRaw("groupIntervals", [groupInterval]);
					this._handleRangeChange();
				}
			}

			if (this.isDirty("groupData")) {
				if (!this._dataGrouped) {
					if (this.get("groupData")) {
						$array.each(this.series, (series) => {
							this._groupSeriesData(series);
						})

						this._handleRangeChange();
					}
					else {
						let baseInterval = this.get("baseInterval");
						let mainDataSetId: string = baseInterval.timeUnit + baseInterval.count;
						$array.each(this.series, (series) => {
							series.setDataSet(mainDataSetId);
							series.resetGrouping();
						})

						this._setBaseInterval(baseInterval);
						this.setPrivateRaw("groupInterval", undefined);
						this.markDirtyExtremes();
					}
					this._dataGrouped = true;
				}
			}
		}
	}


	public _groupSeriesData(series: XYSeries) {
		if (this.get("groupData") && !series.get("groupDataDisabled")) {

			this._dataGrouped = true; // helps to avoid double grouping

			this._seriesDataGrouped = true;

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

			let dataItems = series._mainDataItems;
			let baseInterval = this.get("baseInterval");
			let mainDataSetId: string = baseInterval.timeUnit + baseInterval.count;

			series._dataSets[mainDataSetId] = dataItems;

			const groupCallback = series.get("groupDataCallback");
			let groupOriginals = series.get("groupDataWithOriginals", false);
			if (groupCallback) {
				groupOriginals = true;
			}

			$array.each(intervals, (interval) => {

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

				let intervalDuration = $time.getDuration(interval.timeUnit);

				let firstItem = dataItems[0];
				let firstTime: any;
				if (firstItem) {
					firstTime = dataItems[0].get(key as any);
				}

				let prevNewDataItem: DataItem<IXYSeriesDataItem> | undefined;
				$array.each(dataItems, (dataItem) => {
					let time = dataItem.get(key as any);
					//let roundedTime = $time.round(new Date(time), interval.timeUnit, interval.count, firstDay, utc, firstDate, timezone).getTime();
					let roundedTime = $time.roun(time, interval.timeUnit, interval.count, this._root, firstTime);
					let dataContext: any;

					if (previousTime < roundedTime - intervalDuration / 24) {
						dataContext = $object.copy(dataItem.dataContext);

						newDataItem = new DataItem(series, dataContext, series._makeDataItem(dataContext));
						newDataItem.setRaw(key as any, roundedTime);

						series._dataSets[dataSetId].push(newDataItem);

						$array.each(fields, (field) => {
							let value = dataItem.get(field as any);
							if ($type.isNumber(value)) {
								newDataItem.setRaw(field as any, value);
								newDataItem.setRaw(workingFields[field] as any, value);
								count[field] = 1;
								sum[field] = value;
							}
							else {
								sum[field] = 0;
								count[field] = 0;
							}
						})

						if (groupOriginals) {
							newDataItem.set("originals", [dataItem]);
						}

						if (groupCallback && prevNewDataItem) {
							groupCallback(prevNewDataItem, interval);
						}

						prevNewDataItem = newDataItem;
					}
					else {
						$array.each(fields, (field) => {
							let groupKey = groupFieldValues[field];
							let value = dataItem.get(field as any);

							if (value != null) {

								let currentValue = newDataItem.get(field as any);

								switch (groupKey) {
									case "close":
										newDataItem.setRaw(field as any, value);
										break;

									case "sum":
										newDataItem.setRaw(field as any, currentValue + value);
										break;

									case "open":
										break;

									case "low":
										if (value < currentValue) {
											newDataItem.setRaw(field as any, value);
										}
										break;

									case "high":
										if (value > currentValue) {
											newDataItem.setRaw(field as any, value);
										}
										break;

									case "average":
										count[field]++;
										sum[field] += value;
										let average = sum[field] / count[field];
										newDataItem.setRaw(field as any, average);
										break;

									case "extreme":
										if (Math.abs(value) > Math.abs(currentValue)) {
											newDataItem.setRaw(field as any, value);
										}
										break;
								}

								newDataItem.setRaw(workingFields[field] as any, newDataItem.get(field as any));
								let dataContext: any = $object.copy(dataItem.dataContext);
								dataContext[key as any] = roundedTime;
								newDataItem.dataContext = dataContext;
							}
						})

						if (groupOriginals) {
							newDataItem.get("originals")!.push(dataItem);
						}
					}
					previousTime = roundedTime;
				})

				if (groupCallback && prevNewDataItem) {
					groupCallback(prevNewDataItem, interval);
				}
			})

			if (series._dataSetId) {
				series.setDataSet(series._dataSetId);
			}
			this.markDirtySize();
			// solves problem if new series was added
			if (this._seriesAdded) {
				this._root.events.once("frameended", () => {
					this.markDirtySize();

				})
			}
		}
	}

	public _clearDirty() {
		super._clearDirty();
		this._groupingCalculated = false;
		this._dataGrouped = false;
	}

	/**
	 * Returns a time interval axis would group data to for a specified duration.
	 *
	 * @since 5.2.1
	 */
	public getGroupInterval(duration: number): ITimeInterval {
		let baseInterval = this.get("baseInterval");
		let groupInterval = $time.chooseInterval(0, duration, this.get("groupCount", Infinity), this.get("groupIntervals")!);
		if ($time.getIntervalDuration(groupInterval) < $time.getIntervalDuration(baseInterval)) {
			groupInterval = { ...baseInterval };
		}
		return groupInterval;
	}

	/**
	 * Return `max` of a specified time interval.
	 * 
	 * Will work only if the axis was grouped to this interval at least once.
	 * 
	 * @since 5.2.1
	 * @param   interval  Interval
	 * @return            Max
	 */
	public getIntervalMax(interval: ITimeInterval): number {
		return this._intervalMax[interval.timeUnit + interval.count];
	}

	/**
	 * Return `min` of a specified time interval.
	 * 
	 * Will work only if the axis was grouped to this interval at least once.
	 * 
	 * @since 5.2.1
	 * @param   interval  Interval
	 * @return            Min
	 */
	public getIntervalMin(interval: ITimeInterval): number {
		return this._intervalMin[interval.timeUnit + interval.count];
	}

	protected _handleRangeChange() {
		super._handleRangeChange();

		let selectionMin = Math.round(this.getPrivate("selectionMin")! as number);
		let selectionMax = Math.round(this.getPrivate("selectionMax")! as number);

		if ($type.isNumber(selectionMin) && $type.isNumber(selectionMax)) {

			if (this.get("endLocation") == 0) {
				selectionMax += 1;
			}

			if (this.get("groupData") && !this._groupingCalculated) {
				this._groupingCalculated = true;

				let groupInterval = this.get("groupInterval");
				let current = this.getPrivate("groupInterval");

				let modifiedDifference = (selectionMax - selectionMin) + (this.get("startLocation", 0) + (1 - this.get("endLocation", 1)) * this.baseDuration());

				if (current) {
					let duration = $time.getIntervalDuration(current);
					modifiedDifference = Math.ceil(modifiedDifference / duration) * duration;
				}

				if (!groupInterval) {
					groupInterval = this.getGroupInterval(modifiedDifference);
				}

				if (groupInterval && (!current || (current.timeUnit !== groupInterval.timeUnit || current.count !== groupInterval.count) || this._seriesDataGrouped)) {
					this._seriesDataGrouped = false;
					this.setPrivateRaw("groupInterval", groupInterval);
					this._setBaseInterval(groupInterval)


					let newId = groupInterval.timeUnit + groupInterval.count;
					$array.each(this.series, (series) => {
						if (series.get("baseAxis") === this) {
							series.setDataSet(newId);
						}
					})

					this.markDirtyExtremes();

					this._root.events.once("frameended", () => {
						this._root.events.once("frameended", () => {
							const type = "groupintervalchanged";
							if (this.events.isEnabled(type)) {
								this.events.dispatch(type, { type: type, target: this });
							}
						})
					})
				}
			}

			$array.each(this.series, (series) => {
				if (series.get("baseAxis") === this) {
					let fieldName = <any>(this.getPrivate("name")! + this.get("renderer").getPrivate("letter")!);

					const start = $array.getFirstSortedIndex(series.dataItems, (dataItem) => {
						return $order.compare(dataItem.get(fieldName), selectionMin);
					});

					let startIndex = start.index;

					if (startIndex > 0) {
						startIndex -= 1;
					}

					selectionMax += this.baseDuration() * (1 - this.get("endLocation", 1));

					const end = $array.getSortedIndex(series.dataItems, (dataItem) => {
						return $order.compare(dataItem.get(fieldName), selectionMax);
					});

					let endIndex = end.index;
					let endIndex2 = endIndex;

					if (endIndex2 > 1) {
						endIndex2--;
					}

					const firstDataItem = series.dataItems[startIndex];
					const lastDataItem = series.dataItems[endIndex2];

					let lastDate: number | undefined;
					let firstDate: number | undefined;
					if (firstDataItem) {
						firstDate = firstDataItem.get(fieldName);
					}

					if (lastDataItem) {
						lastDate = lastDataItem.get(fieldName);
					}

					let outOfSelection = false;
					if (lastDate != null && firstDate != null) {
						if (lastDate < selectionMin || firstDate > selectionMax) {
							outOfSelection = true;
						}
					}

					series.setPrivate("outOfSelection", outOfSelection);
					series.setPrivate("startIndex", startIndex);
					series.setPrivate("adjustedStartIndex", series._adjustStartIndex(startIndex));
					series.setPrivate("endIndex", endIndex);
					this.root.events.once("frameended", () => {
						series._markDirtyPrivateKey("adjustedStartIndex");
					})

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

	protected _saveMinMax(min: number, max: number) {
		let groupInterval = this.getPrivate("groupInterval");

		if (!groupInterval) {
			groupInterval = this.get("baseInterval");
		}

		let id = groupInterval.timeUnit + groupInterval.count;
		this._intervalMin[id] = min;
		this._intervalMax[id] = max;
	}

	protected _getM(timeUnit: TimeUnit) {
		if (timeUnit == "month" || timeUnit == "year" || timeUnit == "day") {
			return 1.05;
		}
		return 1.01;
	}

	protected _getMinorInterval(interval: ITimeInterval): ITimeInterval | undefined {
		let minorGridInterval: ITimeInterval | undefined;
		let count = interval.count;
		let timeUnit = interval.timeUnit;
		if (count > 1) {
			if (count == 10) {
				count = 5;
			}
			else if (count == 15) {
				count = 5;
			}
			else if (count == 12) {
				count = 2;
			}
			else if (count == 6) {
				count = 1;
			}
			else if (count == 30) {
				count = 10;
			}
			else if (count < 10) {
				count = 1;
			}
			minorGridInterval = { timeUnit: timeUnit, count: count };
		}
		if (timeUnit == "week") {
			if (this.getPrivate("baseInterval")?.timeUnit != "week") {
				minorGridInterval = { timeUnit: "day", count: 1 };
			}
			else {
				minorGridInterval = { timeUnit: "week", count: 1 };
			}
		}
		return minorGridInterval;
	}

	protected _prepareAxisItems() {
		const min = this.getPrivate("min");
		const max = this.getPrivate("max");

		if ($type.isNumber(min) && $type.isNumber(max)) {
			const root = this._root;
			const selectionMin = Math.round(this.getPrivate("selectionMin")! as number);
			const selectionMax = Math.round(this.getPrivate("selectionMax")! as number);
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
			const utc = root.utc;
			const timezone = root.timezone;

			//value = $time.round(new Date(selectionMin - intervalDuration), gridInterval.timeUnit, gridInterval.count, firstDay, utc, new Date(min), timezone).getTime();
			value = $time.roun(selectionMin - intervalDuration, gridInterval.timeUnit, gridInterval.count, root, min);
			let previousValue = value - intervalDuration;
			let format: string | Intl.DateTimeFormatOptions;
			const formats = this.get("dateFormats")!;

			this.setPrivateRaw("gridInterval", gridInterval);

			const minorLabelsEnabled = renderer.get("minorLabelsEnabled");
			const minorGridEnabled = renderer.get("minorGridEnabled", minorLabelsEnabled);

			let minorGridInterval: ITimeInterval | undefined;
			let minorDuration = 0;

			if (minorGridEnabled) {
				minorGridInterval = this._getMinorInterval(gridInterval);
				minorDuration = $time.getIntervalDuration(minorGridInterval);
			}

			let m = 0;
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

				this._createAssets(dataItem, []);

				this._toggleDataItem(dataItem, true);

				dataItem.setRaw("value", value);
				dataItem.setRaw("labelEndValue", undefined);

				let endValue = value + $time.getDuration(gridInterval.timeUnit, gridInterval.count * this._getM(gridInterval.timeUnit));
				//endValue = $time.round(new Date(endValue), gridInterval.timeUnit, 1, firstDay, utc, undefined, timezone).getTime();
				endValue = $time.roun(endValue, gridInterval.timeUnit, 1, root);

				dataItem.setRaw("endValue", endValue);

				let date = new Date(value);

				format = formats[gridInterval.timeUnit];
				if (nextGridUnit && this.get("markUnitChange") && $type.isNumber(previousValue)) {
					if (gridInterval.timeUnit != "year") {
						if ($time.checkChange(value, previousValue, nextGridUnit, utc, timezone)) {
							format = this.get("periodChangeDateFormats")![gridInterval.timeUnit];
						}
					}
				}

				const label = dataItem.get("label");
				if (label) {
					label.set("text", root.dateFormatter.format(date, format!));
				}

				let count = gridInterval.count;
				// so that labels of week would always be at the beginning of the grid
				if (gridInterval.timeUnit == "week") {
					dataItem.setRaw("labelEndValue", value);
				}

				if (minorGridEnabled) {
					count = 1;
					let timeUnit = gridInterval.timeUnit;
					if (timeUnit == "week") {
						timeUnit = "day";
					}

					let labelEndValue = value + $time.getDuration(timeUnit, this._getM(timeUnit));
					//labelEndValue = $time.round(new Date(labelEndValue), timeUnit, 1, firstDay, utc, undefined, timezone).getTime();
					labelEndValue = $time.roun(labelEndValue, timeUnit, 1, root);
					dataItem.setRaw("labelEndValue", labelEndValue);
				}

				this._prepareDataItem(dataItem, count);

				previousValue = value;
				value = endValue;

				// min grid
				if (minorGridInterval) {
					const minorTimeUnit = minorGridInterval.timeUnit;
					const minorCount = minorGridInterval.count;
					const mmm = this._getM(minorTimeUnit);

					//let minorValue = $time.round(new Date(previousValue + minorDuration * this._getM(minorGridInterval.timeUnit)), minorGridInterval.timeUnit, minorGridInterval.count, firstDay, utc, new Date(previousValue), timezone).getTime();
					let minorValue = $time.roun(previousValue + minorDuration * mmm, minorTimeUnit, minorCount, root, previousValue);

					let previousMinorValue: number | undefined;
					let minorFormats = this.get("minorDateFormats", this.get("dateFormats"))!;

					while (minorValue < value - 0.01 * minorDuration) {
						let minorDataItem: DataItem<this["_dataItemSettings"]>;
						if (this.minorDataItems.length < m + 1) {
							minorDataItem = new DataItem(this, undefined, {});
							this.minorDataItems.push(minorDataItem);
							this.processDataItem(minorDataItem);
						}
						else {
							minorDataItem = this.minorDataItems[m];
						}

						this._createAssets(minorDataItem, ["minor"], true);

						this._toggleDataItem(minorDataItem, true);

						minorDataItem.setRaw("value", minorValue);

						let minorEndValue = minorValue + $time.getDuration(minorTimeUnit, minorCount * mmm);
						//minorEndValue = $time.round(new Date(minorEndValue), minorGridInterval.timeUnit, 1, firstDay, utc, undefined, timezone).getTime();
						minorEndValue = $time.roun(minorEndValue, minorTimeUnit, 1, root);

						minorDataItem.setRaw("endValue", minorEndValue);

						let date = new Date(minorValue);

						format = minorFormats[minorTimeUnit];

						const minorLabel = minorDataItem.get("label");

						if (minorLabel) {
							if (minorLabelsEnabled) {
								minorLabel.set("text", root.dateFormatter.format(date, format!));
							}
							else {
								minorLabel.setPrivate("visible", false);
							}
						}

						this._prepareDataItem(minorDataItem, 1);

						if (minorValue == previousMinorValue) {
							break;
						}

						previousMinorValue = minorValue;
						minorValue = minorEndValue;
						m++;
					}
				}

				if (value == previousValue) {
					break;
				}

				i++;
			}

			for (let j = i; j < this.dataItems.length; j++) {
				this._toggleDataItem(this.dataItems[j], false);
			}

			for (let j = m; j < this.minorDataItems.length; j++) {
				this._toggleDataItem(this.minorDataItems[j], false);
			}

			$array.each(this.series, (series) => {
				if (series.inited) {
					series._markDirtyAxes();
				}
			})
		}

		this._updateGhost();
	}

	protected _updateFinals(start: number, end: number) {
		this.setPrivateRaw("selectionMinFinal", this.positionToValue(start));
		this.setPrivateRaw("selectionMaxFinal", this.positionToValue(end));
	}

	protected _getDelta() {
		this._deltaMinMax = this.baseDuration() / 2;
	}

	protected _fixMin(min: number) {
		const baseInterval = this.getPrivate("baseInterval");
		const timeUnit = baseInterval.timeUnit;
		//let startTime = $time.round(new Date(min), timeUnit, baseInterval.count, firstDay, utc, undefined, timezone).getTime();
		let startTime = $time.roun(min, timeUnit, baseInterval.count, this._root);

		let endTime = startTime + $time.getDuration(timeUnit, baseInterval.count * this._getM(timeUnit))
		//endTime = $time.round(new Date(endTime), timeUnit, 1, firstDay, utc, undefined, timezone).getTime();
		endTime = $time.roun(endTime, timeUnit, 1, this._root);
		return startTime + (endTime - startTime) * this.get("startLocation", 0);
	}

	protected _fixMax(max: number) {
		const baseInterval = this.getPrivate("baseInterval");
		const timeUnit = baseInterval.timeUnit;
		//let startTime = $time.round(new Date(max), timeUnit, baseInterval.count, firstDay, utc, undefined, timezone).getTime();
		let startTime = $time.roun(max, timeUnit, baseInterval.count, this._root);
		let endTime = startTime + $time.getDuration(timeUnit, baseInterval.count * this._getM(timeUnit))
		//endTime = $time.round(new Date(endTime), timeUnit, 1, firstDay, utc, undefined, timezone).getTime();
		endTime = $time.roun(endTime, timeUnit, 1, this._root);

		return startTime + (endTime - startTime) * this.get("endLocation", 1);
	}

	protected _updateDates(_date: number, _series: XYSeries) {

	}

	/**
	 * Returns a duration of currently active `baseInterval` in milliseconds.
	 * 
	 * @return Duration
	 */
	public baseDuration(): number {
		return this._baseDuration;
		//return $time.getIntervalDuration(this.getPrivate("baseInterval"));
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

		if (!dataItem.open) {
			dataItem.open = {};
		}
		if (!dataItem.close) {
			dataItem.close = {};
		}

		$array.each(fields, (field) => {
			let value = dataItem.get(field as any);
			if ($type.isNumber(value)) {
				let startTime = dataItem.open![field];
				let endTime = dataItem.close![field];
				// this is done to save cpu, as rounding is quite expensive, especially with timezone set. 
				// if value is between prev start and end, it means it didn't change, all is fine.
				if (value >= startTime && value <= endTime) {

				}
				else {
					const timeUnit = baseInterval.timeUnit;
					const count = baseInterval.count;
					//startTime = $time.round(new Date(value), timeUnit, count, firstDay, utc, undefined, timezone).getTime();
					startTime = $time.roun(value, timeUnit, count, this._root);
					endTime = startTime + $time.getDuration(timeUnit, count * this._getM(timeUnit));
					//endTime = $time.round(new Date(endTime), timeUnit, 1, firstDay, utc, undefined, timezone).getTime();
					endTime = $time.roun(endTime, timeUnit, 1, this._root);

					dataItem.open![field] = startTime;
					dataItem.close![field] = endTime;
				}

				this._updateDates(startTime, dataItem.component as XYSeries);
			}
		})
	}

	protected _handleSizeDirty() {
		// void 
	}

	/**
	 * @ignore
	 */
	public getDataItemPositionX(dataItem: DataItem<IXYSeriesDataItem>, field: string, cellLocation: number, axisLocation: number): number {

		let openValue;
		let closeValue;

		if (dataItem.open && dataItem.close) {
			openValue = dataItem.open[field];
			closeValue = dataItem.close[field];
		}
		else {
			openValue = dataItem.get(field as any)
			closeValue = openValue;
		}

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
		let openValue;
		let closeValue;

		if (dataItem.open && dataItem.close) {
			openValue = dataItem.open[field];
			closeValue = dataItem.close[field];
		}
		else {
			openValue = dataItem.get(field as any)
			closeValue = openValue;
		}

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
		value = value - (location - 0.5) * this.baseDuration();

		let baseInterval = this.getPrivate("baseInterval");
		if (!$type.isNaN(value)) {
			const firstDay = this._root.locale.firstDayOfWeek;
			const timeUnit = baseInterval.timeUnit;
			const utc = this._root.utc;
			const timezone = this._root.timezone;
			const count = baseInterval.count;

			//value = $time.round(new Date(value), timeUnit, count, firstDay, utc, new Date(this.getPrivate("min", 0)), timezone).getTime();
			value = $time.roun(value, timeUnit, count, this._root, this.getPrivate("min", 0));

			let duration = $time.getDateIntervalDuration(baseInterval, new Date(value), firstDay, utc, timezone);
			if (timezone) {
				//value = $time.round(new Date(value + this.baseDuration() * 0.05), timeUnit, count, firstDay, utc, new Date(this.getPrivate("min", 0)), timezone).getTime();
				value = $time.roun(value + this.baseDuration() * 0.05, timeUnit, count, this._root, this.getPrivate("min", 0));
				duration = $time.getDateIntervalDuration(baseInterval, new Date(value + duration * location), firstDay, utc, timezone);
			}

			return this.valueToPosition(value + duration * location);
		}
		return NaN;
	}

	/**
	 * Returns text to be used in an axis tooltip for specific relative position.
	 *
	 * NOTE: Unless `adjustPosition` (2nd parameter) is set to `false`, the method
	 * will adjust position by `tooltipIntervalOffset`.
	 *
	 * @param  position        Position
	 * @param  adjustPosition  Adjust position
	 * @return                 Tooltip text
	 */
	public getTooltipText(position: number, adjustPosition?: boolean): string | undefined {
		//@todo number formatter + tag
		if (this.getPrivate("min") != null) {
			let format = this.get("tooltipDateFormats")![this.getPrivate("baseInterval").timeUnit];
			let value = this.positionToValue(position);
			if ($type.isNumber(value)) {
				let date = new Date(value);

				let baseInterval = this.getPrivate("baseInterval");
				let duration = $time.getDateIntervalDuration(baseInterval, date, this._root.locale.firstDayOfWeek, this._root.utc, this._root.timezone);

				if (adjustPosition !== false) {
					date = new Date(value + this.get("tooltipIntervalOffset", -this.get("tooltipLocation", 0.5)) * duration)
				}

				return this._root.dateFormatter.format(date, this.get("tooltipDateFormat", format));
			}

		}
		return "";
	}

	/**
	 * Returns a data item from series that is closest to the `position`.
	 *
	 * @param   series    Series
	 * @param   position  Relative position
	 * @return            Data item
	 */
	public getSeriesItem(series: XYSeries, position: number, location?: number, snap?: boolean): DataItem<IXYSeriesDataItem> | undefined {
		let fieldName = <any>(this.getPrivate("name")! + this.get("renderer").getPrivate("letter")!);
		let value = this.positionToValue(position);

		if (location == null) {
			location = 0.5;
		}

		value = value - (location - 0.5) * this.baseDuration();

		const result = $array.getSortedIndex(series.dataItems, (dataItem) => {
			let diValue = 0;
			if (dataItem.open) {
				diValue = dataItem.open[fieldName];
			}

			return $order.compare(diValue, value);
		});

		if (snap || series.get("snapTooltip")) {
			let first = series.dataItems[result.index - 1];
			let second = series.dataItems[result.index];

			if (first && second) {
				if (first.open && second.close) {
					let open = first.open[fieldName];
					let close = second.close[fieldName];

					if (Math.abs(value - open) > Math.abs(value - close)) {
						return second;
					}
				}
			}

			if (first) {
				return first;
			}

			if (second) {
				return second;
			}
		}
		else {
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
	 * Zooms the axis to specific `start` and `end` values.
	 *
	 * Optional `duration` specifies duration of zoom animation in milliseconds.
	 *
	 * @param  start     Start value
	 * @param  end       End value
	 * @param  duration  Duration in milliseconds
	 */
	public zoomToValues(start: number, end: number, duration?: number) {
		const min = this.getPrivate("minFinal", 0);
		const max = this.getPrivate("maxFinal", 0);
		if (this.getPrivate("min") != null && this.getPrivate("max") != null) {
			if (this.get("groupData")) {
				const futureGroupInterval = this.getGroupInterval(end - start);
				const baseInterval = this.get("baseInterval");

				let baseMin = this.getIntervalMin(baseInterval);
				let baseMax = this.getIntervalMax(baseInterval) - 1;
				baseMax = $time.roun(baseMax, futureGroupInterval.timeUnit, futureGroupInterval.count, this.root);
				baseMax += this._getM(futureGroupInterval.timeUnit) * $time.getIntervalDuration(futureGroupInterval);
				baseMax = $time.roun(baseMax, futureGroupInterval.timeUnit, futureGroupInterval.count, this.root);

				let futureMin = $time.roun(baseMin, futureGroupInterval.timeUnit, futureGroupInterval.count, this.root);
				let futureMax = $time.roun(baseMax, futureGroupInterval.timeUnit, futureGroupInterval.count, this.root);

				let s = (start - futureMin) / (futureMax - futureMin);
				let e = (end - futureMin) / (futureMax - futureMin);

				this.zoom(s, e, duration);
			}
			else {
				this.zoom((start - min) / (max - min), (end - min) / (max - min), duration);
			}
		}
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

	/**
	 * Returns relative position between two grid lines of the axis.
	 *
	 * @since 5.2.30
	 * @return Position
	 */
	public getCellWidthPosition(): number {
		let max = this.getPrivate("selectionMax", this.getPrivate("max"));
		let min = this.getPrivate("selectionMin", this.getPrivate("min"));

		if ($type.isNumber(max) && $type.isNumber(min)) {
			return this._intervalDuration / (max - min);
		}
		return 0.05;
	}

	public nextPosition(count?: number) {
		if (count == null) {
			count = 1;
		}

		let dtime = this.get("tooltipLocation", 0.5) * this.baseDuration();
		if (this.get("renderer").getPrivate("letter") == "Y") {
			count *= -1;
		}

		let tooltipValue = this.positionToValue(this.getPrivate("tooltipPosition", 0));

		const baseInterval = this.getPrivate("baseInterval");
		let time = this._nextTime(tooltipValue, count, baseInterval);

		let selectionMin = this.getPrivate("selectionMin", 0);
		let selectionMax = this.getPrivate("selectionMax", 0);

		let min = $time.roun(selectionMin, baseInterval.timeUnit, baseInterval.count, this._root);
		let max = $time.roun(selectionMax, baseInterval.timeUnit, baseInterval.count, this._root);

		time += dtime;
		time = $math.fitToRange(time, min + dtime, max - dtime);

		return this.toGlobalPosition(this.valueToPosition(time));
	}

	protected _nextTime(time: number, count: number, baseInterval: ITimeInterval) {
		return $time.roun(time + count * this.baseDuration(), baseInterval.timeUnit, baseInterval.count, this._root);
	}
}
