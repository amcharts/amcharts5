import type { AxisRenderer } from "./AxisRenderer";

import { DateAxis, IDateAxisSettings, IDateAxisPrivate, IDateAxisDataItem, IDateAxisEvents } from "./DateAxis";
import { DataItem } from "../../../core/render/Component";
import type { XYSeries } from "../../xy/series/XYSeries";

import * as $array from "../../../core/util/Array"
import * as $order from "../../../core/util/Order";
import * as $time from "../../../core/util/Time";
import * as $type from "../../../core/util/Type";
import * as $math from "../../../core/util/Math";
import type { ITimeInterval } from "../../../core/util/Time";

export interface IGaplessDateAxisSettings<R extends AxisRenderer> extends IDateAxisSettings<R> {

}

export interface IGaplessDateAxisDataItem extends IDateAxisDataItem {

	/**
	 * An index of a data item.
	 */
	index?: number

}

export interface IGaplessDateAxisPrivate extends IDateAxisPrivate {

}

export interface IGaplessDateAxisEvents extends IDateAxisEvents {
}

/**
 * A version of a [[DateAxis]] which removes intervals that don't have any data
 * items in them.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/gapless-date-axis/} for more info
 * @important
 */
export class GaplessDateAxis<R extends AxisRenderer> extends DateAxis<R> {
	public static className: string = "GaplessDateAxis";
	public static classNames: Array<string> = DateAxis.classNames.concat([GaplessDateAxis.className]);

	declare public _settings: IGaplessDateAxisSettings<R>;
	declare public _privateSettings: IGaplessDateAxisPrivate;
	declare public _dataItemSettings: IGaplessDateAxisDataItem;
	declare public _events: IGaplessDateAxisEvents;

	protected _frequency: number = 1;
	protected _m: number = 0;

	public _afterNew() {
		this.valueFields.push("date");
		super._afterNew();
	}

	protected _dates: Array<number> = [];

	protected _updateDates(date: number, series: XYSeries) {
		if (!series.get("ignoreMinMax")) {
			const dates = this._dates;
			const result = $array.getSortedIndex(dates, (x) => $order.compare(x, date));
			if (!result.found) {
				$array.insertIndex(dates, result.index, date);
			}
		}
	}

	public _updateAllDates() {
		this._dates.length = 0;

		$array.each(this.series, (series) => {
			let field = "valueX";
			if (series.get("yAxis") == this) {
				field = "valueY"
			}
			$array.each(series.dataItems, (dataItem) => {
				let value = dataItem.get(field as any);
				if ($type.isNumber(value)) {
					if (dataItem.open) {
						this._updateDates(dataItem.open![field], series);
					}
				}
			})
		})
	}

	/**
	 * Convers value to a relative position on axis.
	 *
	 * @param   value  Value
	 * @return         Relative position
	 */
	public valueToPosition(value: number): number {
		const dates = this._dates;
		const startLocation = this.get("startLocation", 0);
		const endLocation = this.get("endLocation", 1);
		const len = dates.length - startLocation - (1 - endLocation);
		const result = $array.getSortedIndex(dates, (x) => $order.compare(x, value));
		let index = result.index;

		if (result.found) {
			return (index - startLocation) / len;
		}
		else {
			if (index > 0) {
				index -= 1;
			}

			let itemValue = dates[index];

			let d = 0;
			if (itemValue > value && value > this.getPrivate("min", 0)) {
				d = itemValue - value;
			}
			else {
				d = value - itemValue;
			}

			return (index - startLocation) / len + d / this.baseDuration() / len;
		}
	}

	/**
	 * Converts numeric value from axis scale to index.
	 * 
	 * @param  value  Value
	 * @return        Index
	 */
	public valueToIndex(value: number): number {
		const dates = this._dates;

		const result = $array.getSortedIndex(dates, (x) => $order.compare(x, value));
		let index = result.index;

		if (result.found) {
			return index;
		}
		else {
			if (index > 0) {
				index -= 1;
			}
			return index;
		}
	}

	/**
	 * Converts a relative position to a corresponding numeric value from axis
	 * scale.
	 *
	 * @param   position  Relative position
	 * @return            Value
	 */
	public positionToValue(position: number): number {
		const startLocation = this.get("startLocation", 0);
		const endLocation = this.get("endLocation", 1);
		let len = Math.round(this._dates.length - startLocation - (1 - endLocation));
		let index = position * len;
		let findex = Math.floor(index);
		if (findex < 0) {
			findex = 0;
		}

		if (findex > len - 1) {
			findex = len - 1
		}

		return this._dates[findex] + (index - findex + startLocation) * this.baseDuration();
	}

	protected _fixZoomFactor() {
		this.setPrivateRaw("maxZoomFactor", this._dates.length - this.get("startLocation", 0) - (1 - this.get("endLocation", 1)));
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
		const min = this.getPrivate("min", 0);
		const max = this.getPrivate("max", 0);
		start = $math.fitToRange(start, min, max);
		end = $math.fitToRange(end, min, max);
		this.zoom(this.valueToPosition(start), this.valueToPosition(end), duration);
	}


	protected _prepareAxisItems() {
		let startTime = this.getPrivate("selectionMin", 0);
		let endTime = this.getPrivate("selectionMax", 0);

		if ($type.isNumber(startTime) && $type.isNumber(endTime)) {

			if (this._seriesValuesDirty) {
				this._seriesValuesDirty = false;
				this._updateAllDates();
			}

			const firstDay = this._root.locale.firstDayOfWeek;
			const utc = this._root.utc;
			const timezone = this._root.timezone;
			const dates = this._dates;
			const renderer = this.get("renderer");
			const len = dates.length;
			const baseDuration = this.baseDuration();

			let startIndex = this.valueToIndex(startTime);
			if (startIndex > 0) {
				startIndex--;
			}

			let endIndex = this.valueToIndex(endTime);
			if (endIndex < len - 1) {
				endIndex++;
			}
			let maxCount = renderer.axisLength() / Math.max(renderer.get("minGridDistance")!, 1 / Number.MAX_SAFE_INTEGER);
			let frequency = Math.min(len, Math.ceil((endIndex - startIndex) / maxCount));
			frequency = Math.max(1, frequency);

			startIndex = Math.floor(startIndex / frequency) * frequency;

			this._frequency = frequency;

			$array.each(this.dataItems, (dataItem) => {
				this._toggleDataItem(dataItem, false);
			})

			$array.each(this.minorDataItems, (dataItem) => {
				this._toggleDataItem(dataItem, false);
			})

			let realDuration = (endTime - startTime) - ((endTime - startTime) / baseDuration - (endIndex - startIndex)) * baseDuration;

			// if all items are on axis
			let gridInterval = $time.chooseInterval(0, realDuration, maxCount, this.get("gridIntervals")!);

			const baseInterval = this.getPrivate("baseInterval");
			let intervalDuration = $time.getIntervalDuration(gridInterval);

			if (intervalDuration < baseDuration) {
				gridInterval = { ...baseInterval };
				intervalDuration = $time.getIntervalDuration(gridInterval);
			}

			this._intervalDuration = intervalDuration;

			const timeUnit = gridInterval.timeUnit;
			const formats = this.get("dateFormats")!;

			let firstDate = new Date();
			if (this._dates[0]) {
				firstDate = new Date(this._dates[0]);
			}

			let value = $time.round(new Date(this.getPrivate("selectionMin", 0)), timeUnit, gridInterval.count, firstDay, utc, firstDate, timezone).getTime();

			const minorLabelsEnabled = renderer.get("minorLabelsEnabled");
			const minorGridEnabled = renderer.get("minorGridEnabled", minorLabelsEnabled);

			let minorGridInterval: ITimeInterval | undefined;
			let minorDuration = 0;
			let previousDataItem: DataItem<IGaplessDateAxisDataItem> | undefined;

			if (minorGridEnabled) {
				minorGridInterval = this._getMinorInterval(gridInterval);
				minorDuration = $time.getIntervalDuration(minorGridInterval);
			}


			let selectedItems: Array<number> = this._getIndexes(value, this.getPrivate("selectionMax", value) + intervalDuration, gridInterval, this.getPrivate("min", value));
			if (selectedItems.length > 0) {
				let i = 0;
				this._m = 0;
				let previousValue = value - intervalDuration * 10;
				const nextGridUnit = $time.getNextUnit(timeUnit);

				// MINOR GRID
				if (minorGridInterval) {
					let first = dates[selectedItems[0]];
					this._addMinorGrid(first - intervalDuration, first, minorDuration, minorGridInterval);
				}

				let minDistance = renderer.axisLength() / renderer.gridCount() * 0.5;

				$array.each(selectedItems, (index) => {
					let dataItem: DataItem<this["_dataItemSettings"]>;
					if (this.dataItems.length < i + 1) {
						dataItem = new DataItem<this["_dataItemSettings"]>(this, undefined, {});
						this._dataItems.push(dataItem);
						this.processDataItem(dataItem);
					}
					else {
						dataItem = this.dataItems[i];
					}

					let value = dates[index];
					let date = new Date(value);

					let endValue = value;
					if (i < selectedItems.length - 1) {
						endValue = dates[selectedItems[i + 1]];
					}
					else {
						endValue += intervalDuration;
					}
					dataItem.setRaw("value", value);
					dataItem.setRaw("endValue", endValue);
					dataItem.setRaw("index", i);
					dataItem.setRaw("labelEndValue", undefined);

					let format = formats[timeUnit];
					if (nextGridUnit && this.get("markUnitChange") && $type.isNumber(previousValue)) {
						if (timeUnit != "year") {
							if ($time.checkChange(value, previousValue, nextGridUnit, utc, timezone)) {
								format = this.get("periodChangeDateFormats")![timeUnit];
							}
						}
					}

					this._createAssets(dataItem, []);

					const label = dataItem.get("label");
					if (label) {
						label.set("text", this._root.dateFormatter.format(date, format!));
					}

					this._toggleDataItem(dataItem, true);

					let count = gridInterval.count;

					// so that labels of week would always be at the beginning of the grid
					if (timeUnit == "week") {
						dataItem.setRaw("labelEndValue", value);
					}

					if (minorGridEnabled) {
						let timeUnit2 = gridInterval.timeUnit;
						if (timeUnit2 == "week") {
							timeUnit2 = "day";
						}

						if (count > 1 || gridInterval.timeUnit == "week") {
							let labelEndValue = $time.round(new Date(value), timeUnit2, 1, firstDay, utc, undefined, timezone).getTime() + $time.getDuration(timeUnit2, this._getM(timeUnit2));
							let index = this.valueToIndex(labelEndValue)
							labelEndValue = this._dates[index];
							if (labelEndValue == value) {
								let next = this._dates[index + 1];
								if (next) {
									labelEndValue = next;
								}
								else {
									labelEndValue += minorDuration;
								}
							}

							dataItem.setRaw("labelEndValue", labelEndValue);
						}
						count = 1;
					}

					this._prepareDataItem(dataItem, count);

					if (label && previousDataItem) {
						if (renderer.getPrivate("letter") == "X") {
							let previousLabel = previousDataItem.get("label");
							if (previousLabel) {
								let x = label.x();
								let previousX = previousLabel.x();

								if (x - previousX < minDistance) {
									let worse = this._pickWorse(previousDataItem, dataItem, gridInterval)
									if (worse) {
										worse.get("label")?.setPrivate("visible", false);
									}
								}
							}
						}

						// todo y?

					}

					// MINOR GRID
					if (minorGridInterval) {
						this._addMinorGrid(value, endValue, minorDuration, minorGridInterval);
					}

					i++;

					if (label && label.getPrivate("visible")) {
						previousDataItem = dataItem;
					}
					previousValue = value;
				})
			}

			$array.each(this.series, (series) => {
				if (series.inited) {
					series._markDirtyAxes();
				}
			})
		}

		this._updateGhost();
	}

	protected _pickWorse(dataItemA: DataItem<IGaplessDateAxisDataItem>, dataItemB: DataItem<IGaplessDateAxisDataItem>, interval: ITimeInterval): DataItem<IGaplessDateAxisDataItem> {
		const timeUnit = interval.timeUnit;

		const valueA = dataItemA.get("value", 0);
		const valueB = dataItemB.get("value", 0);

		if (timeUnit == "hour") {
			if (new Date(valueA).getDate() != new Date(valueB).getDate()) {
				return dataItemA;
			}
		}

		return dataItemB;
	}

	protected _addMinorGrid(startValue: number, endValue: number, minorDuration: number, gridInterval: ITimeInterval) {
		const minorFormats = this.get("minorDateFormats", this.get("dateFormats"))!;
		const mTimeUnit = gridInterval.timeUnit;
		const firstDay = this._root.locale.firstDayOfWeek;
		const utc = this._root.utc;
		const timezone = this._root.timezone;

		let value = startValue + $time.getDuration(mTimeUnit, this._getM(mTimeUnit));
		value = $time.round(new Date(value), mTimeUnit, 1, firstDay, utc, undefined, timezone).getTime();

		let maxValue = endValue - minorDuration * 0.5;

		let minorSelectedItems: Array<number> = this._getIndexes(value, maxValue, gridInterval, value);

		$array.each(minorSelectedItems, (index) => {
			let minorDataItem: DataItem<this["_dataItemSettings"]>;
			if (this.minorDataItems.length < this._m + 1) {
				minorDataItem = new DataItem<this["_dataItemSettings"]>(this, undefined, {});
				this.minorDataItems.push(minorDataItem);
				this.processDataItem(minorDataItem);
			}
			else {
				minorDataItem = this.minorDataItems[this._m];
			}

			value = this._dates[index];
			minorDataItem.setRaw("value", value);
			minorDataItem.setRaw("endValue", value + minorDuration);
			minorDataItem.setRaw("index", index);

			this._createAssets(minorDataItem, ["minor"], true);

			const label = minorDataItem.get("label");
			if (label) {
				if (this.get("renderer").get("minorLabelsEnabled")) {
					let date = new Date(value);
					let format = minorFormats[mTimeUnit];
					label.set("text", this._root.dateFormatter.format(date, format!));
				}
				else {
					label.setPrivate("visible", false);
				}
			}

			this._toggleDataItem(minorDataItem, true);
			this._prepareDataItem(minorDataItem, 1);
			this._m++;
		})
	}


	protected _getIndexes(value: number, maxValue: number, interval: ITimeInterval, firstValue: number): Array<number> {
		const items: Array<number> = [];
		const timeUnit = interval.timeUnit;
		const count = interval.count;

		const baseInterval = this.getPrivate("baseInterval");

		const firstDay = this._root.locale.firstDayOfWeek;
		const utc = this._root.utc;
		const timezone = this._root.timezone;

		let c = count - 1;
		let previousValue = -Infinity;
		let duration = $time.getDuration(timeUnit, this._getM(timeUnit));
		let fullDuration = $time.getDuration(timeUnit, count * this._getM(timeUnit));
		let originalValue = value;

		if (timeUnit == "day") {
			value = firstValue;
		}

		while (value <= maxValue) {
			value = $time.round(new Date(value), timeUnit, count, firstDay, utc, undefined, timezone).getTime();

			let index = this.valueToIndex(value);
			let realValue = this._dates[index];

			if (timeUnit == "day" && baseInterval.timeUnit == "day") {
				if (this._hasDate(value)) {
					c++;
				}

				if (c == count) {
					if (value >= originalValue - fullDuration * 2) {
						$array.move(items, index);
					}
					c = 0;
				}
				value += duration;
				value = $time.round(new Date(value), timeUnit, 1, firstDay, utc, undefined, timezone).getTime();
			}
			else {
				if (realValue < value) {
					for (let i = index, len = this._dates.length; i < len; i++) {
						realValue = this._dates[i];
						if (realValue >= value) {
							index = i;
							break;
						}
					}
				}

				$array.move(items, index);

				value += fullDuration;
				value = $time.round(new Date(value), timeUnit, count, firstDay, utc, undefined, timezone).getTime();
			}

			if (value == previousValue) {
				value += fullDuration + duration;
				value = $time.round(new Date(value), timeUnit, count, firstDay, utc, undefined, timezone).getTime();
			}
			if (value == previousValue) {
				break;
			}

			previousValue = value;
		}

		return items;
	}

	protected _hasDate(time: number) {
		const result = $array.getSortedIndex(this._dates, (date) => {
			return $order.compareNumber(date, time);
		});

		return result.found;
	}

}