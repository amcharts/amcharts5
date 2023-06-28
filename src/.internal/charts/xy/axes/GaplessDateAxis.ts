import type { AxisRenderer } from "./AxisRenderer";

import { DateAxis, IDateAxisSettings, IDateAxisPrivate, IDateAxisDataItem, IDateAxisEvents } from "./DateAxis";
import { DataItem } from "../../../core/render/Component";

import * as $array from "../../../core/util/Array"
import * as $order from "../../../core/util/Order";
import * as $time from "../../../core/util/Time";
import * as $type from "../../../core/util/Type";
import * as $math from "../../../core/util/Math";

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

	public _afterNew() {
		this.valueFields.push("date");
		super._afterNew();
	}

	protected _dates: Array<number> = [];

	protected _updateDates(date: number) {
		const dates = this._dates;
		const result = $array.getSortedIndex(dates, (x) => $order.compare(x, date));
		if (!result.found) {
			$array.insertIndex(dates, result.index, date);
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
						this._updateDates(dataItem.open![field]);
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
			if (itemValue > value) {
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

			const dates = this._dates;
			const renderer = this.get("renderer");
			const len = dates.length;

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

			for (let j = 0, length = this.dataItems.length; j < length; j++) {
				this.dataItems[j].hide();
			}

			let realDuration = (endTime - startTime) - ((endTime - startTime) / this.baseDuration() - (endIndex - startIndex)) * this.baseDuration();

			// if all items are on axis
			let gridInterval = $time.chooseInterval(0, realDuration, maxCount, this.get("gridIntervals")!);

			const baseInterval = this.getPrivate("baseInterval");
			let intervalDuration = $time.getIntervalDuration(gridInterval);

			if (intervalDuration < this.baseDuration()) {
				gridInterval = { ...baseInterval };
				intervalDuration = $time.getIntervalDuration(gridInterval);
			}


			this._intervalDuration = intervalDuration;

			const formats = this.get("dateFormats")!;

			let selectedItems: Array<number> = [];
			let firstDate = new Date();
			if (this._dates[0]) {
				firstDate = new Date(this._dates[0]);
			}

			let startDate = $time.round(new Date(this.getPrivate("min", 0)), gridInterval.timeUnit, gridInterval.count, this._root.locale.firstDayOfWeek, this._root.utc, firstDate, this._root.timezone);
			let value = $time.add(startDate, gridInterval.timeUnit, -1, this._root.utc, this._root.timezone).getTime();

			let selectionMax = this.getPrivate("selectionMax")

			let previousPosition = -Infinity;
			let minDifference = (this.get("end", 1) - this.get("start", 0)) / maxCount;

			while (value <= selectionMax) {
				let index = this.valueToIndex(value);
				let realValue = this._dates[index];

				if (realValue < value) {
					for (let i = index, len = this._dates.length; i < len; i++) {
						let realValue = this._dates[i];
						if (realValue >= value) {
							index = i;
							break;
						}
					}
				}

				let position = this.valueToPosition(realValue);
				if (position - previousPosition >= minDifference * 0.95) {
					$array.move(selectedItems, index);
					previousPosition = position;
				}

				let previousValue = value;
				value += $time.getDuration(gridInterval.timeUnit, gridInterval.count * this._getM(gridInterval.timeUnit));
				value = $time.round(new Date(value), gridInterval.timeUnit, gridInterval.count, this._root.locale.firstDayOfWeek, this._root.utc, undefined, this._root.timezone).getTime();

				if (value == previousValue) {
					break;
				}
			}

			if (selectedItems.length > 0) {
				let i = 0;
				let previousValue = value - intervalDuration * 10;
				const nextGridUnit = $time.getNextUnit(gridInterval.timeUnit);

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

					if (index > startIndex - 100 && index < endIndex + 100) {

						let format = formats[gridInterval.timeUnit];

						format = formats[gridInterval.timeUnit];
						if (nextGridUnit && this.get("markUnitChange") && $type.isNumber(previousValue)) {
							if (gridInterval.timeUnit != "year") {
								if ($time.checkChange(value, previousValue, nextGridUnit, this._root.utc, this._root.timezone)) {
									format = this.get("periodChangeDateFormats")![gridInterval.timeUnit];
								}
							}
						}

						this._createAssets(dataItem, []);

						const label = dataItem.get("label");
						if (label) {
							label.set("text", this._root.dateFormatter.format(date, format!));
						}

						if (dataItem.isHidden()) {
							dataItem.show();
						}
						this._prepareDataItem(dataItem, gridInterval.count);
					}
					i++;
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
}