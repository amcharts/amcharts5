import type { AxisRenderer } from "./AxisRenderer";
import { DateAxis, IDateAxisSettings, IDateAxisPrivate, IDateAxisDataItem, IDateAxisEvents } from "./DateAxis";
import * as $array from "../../../core/util/Array"
import * as $order from "../../../core/util/Order";
import * as $time from "../../../core/util/Time";
import * as $type from "../../../core/util/Type";
import { DataItem } from "../../../core/render/Component";

export interface IGaplessDateAxisSettings<R extends AxisRenderer> extends IDateAxisSettings<R> {

}

export interface IGaplessDateAxisDataItem extends IDateAxisDataItem {
	index?: number
}

export interface IGaplessDateAxisPrivate extends IDateAxisPrivate {

}

export interface IGaplessDateAxisEvents extends IDateAxisEvents {
}

/**
 * Creates a date axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/} for more info
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
		const len = dates.length;
		const result = $array.getSortedIndex(dates, (x) => $order.compare(x, value));
		let index = result.index;

		if (result.found) {
			return index / len;
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

			return index / len + d / this.baseDuration() / len;
		}
	}

	public valueToIndex(value: number) {
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

		let len = this._dates.length;
		let index = position * len;
		let findex = Math.floor(index);
		if (findex < 0) {
			findex = 0;
		}

		if (findex > len - 1) {
			findex = len - 1
		}

		return this._dates[findex] + (index - findex) * this.baseDuration();
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

			startIndex = Math.floor(startIndex / frequency) * frequency;
			this._frequency = frequency;

			for (let j = 0, length = this.dataItems.length; j < length; j++) {
				this.dataItems[j].hide();
			}

			let realDuration = (endTime - startTime);

			if (endIndex - startIndex < maxCount) {
				realDuration = (endTime - startTime) - ((endTime - startTime) / this.baseDuration() - (endIndex - startIndex)) * this.baseDuration();
			}

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

			let previousIndex = -Infinity;
			let previousUnitValue = -Infinity;

			let selectedItems: Array<number> = [];
			let changed = false;
			// 0, not a mistake, starting from start index is not good
			for (let i = 0; i < len; i++) {
				let index = i;
				let skip = false;

				let value = dates[i];
				let date = new Date(value);
				let unitValue = $time.getUnitValue(date, gridInterval.timeUnit);

				let shouldAdd = false;
				if (gridInterval.timeUnit === "day" || gridInterval.timeUnit === "week") {
					if (index - previousIndex >= frequency) {
						shouldAdd = true;
					}
				}
				else {
					if (unitValue % gridInterval.count === 0) {
						if (unitValue != previousUnitValue) {
							shouldAdd = true;
						}
					}
				}

				if (shouldAdd) {
					if (index - frequency * 0.7 < previousIndex) {
						if (changed) {
							skip = true;
						}
					}
					if (!skip) {
						selectedItems.push(i);
						previousIndex = index;
						previousUnitValue = unitValue;
					}
					changed = false;
				}
			}

			if (selectedItems.length > 0) {
				let i = 0;
				let previousValue = -Infinity;
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
	}
}