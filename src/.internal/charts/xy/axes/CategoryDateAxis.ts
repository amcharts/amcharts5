import type { DataItem } from "../../../core/render/Component";
import type { AxisRenderer } from "./AxisRenderer";
import type { ITimeInterval } from "../../../core/util/Time";
import type { Tooltip } from "../../../core/render/Tooltip";

import { CategoryAxis, ICategoryAxisSettings, ICategoryAxisPrivate, ICategoryAxisDataItem, ICategoryAxisEvents } from "./CategoryAxis";

import * as $time from "../../../core/util/Time";
import * as $type from "../../../core/util/Type";
import * as $array from "../../../core/util/Array";
import * as $utils from "../../../core/util/Utils";

export interface ICategoryDateAxisSettings<R extends AxisRenderer> extends ICategoryAxisSettings<R> {

	/**
	 * The time interval of the data, such as `{ timeUnit: "day", count: 1 }`
	 * for daily data.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/date-axis/#data-granularity} for more info
	 */
	baseInterval: ITimeInterval;

	/**
	 * Intervals the grid and labels can be placed at, from shortest to
	 * longest. The axis uses the shortest that keeps grid lines at least
	 * `minGridDistance` apart.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/date-axis/#grid-granularity} for more info
	 */
	gridIntervals?: Array<ITimeInterval>;

	/**
	 * Formats labels where a new period begins, such as the first day of a
	 * month, with `periodChangeDateFormats` instead of `dateFormats`.
	 *
	 * @default true
	 */
	markUnitChange?: boolean;

	/**
	 * Date formats for labels, by the time unit of the grid, such as `"day"`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/date-axis/#date-formats} for more info
	 */
	dateFormats?: { [index: string]: string };

	/**
	 * Date formats, by time unit, for labels where a new period begins (see
	 * `markUnitChange`).
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/date-axis/#date-formats} for more info
	 */
	periodChangeDateFormats?: { [index: string]: string };

	/**
	 * Date format for the axis tooltip. If not set, the one in `dateFormats`
	 * for the time unit of `baseInterval` is used.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/formatters/formatting-dates/} for more info
	 */
	tooltipDateFormat?: string;

}

export interface ICategoryDateAxisDataItem extends ICategoryAxisDataItem {
}

export interface ICategoryDateAxisPrivate extends ICategoryAxisPrivate {

	/**
	 * The `baseInterval` in use.
	 */
	baseInterval: ITimeInterval;

}

export interface ICategoryDateAxisEvents extends ICategoryAxisEvents {
}


/**
 * A category axis whose categories are timestamps. Each data item takes an
 * equal share of the axis, so periods without data leave no gaps.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/category-date-axis/} for more info
 * @important
 */
export class CategoryDateAxis<R extends AxisRenderer> extends CategoryAxis<R> {
	public static className: string = "CategoryDateAxis";
	public static classNames: Array<string> = CategoryAxis.classNames.concat([CategoryDateAxis.className]);

	declare public _settings: ICategoryDateAxisSettings<R>;
	declare public _privateSettings: ICategoryDateAxisPrivate;
	declare public _dataItemSettings: ICategoryDateAxisDataItem;
	declare public _events: ICategoryDateAxisEvents;

	protected _frequency: number = 1;

	protected _itemMap: { [index: string]: DataItem<ICategoryDateAxisDataItem> } = {};

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["axis"]);
		this.fields.push("category");
		super._afterNew();
	}

	public _prepareChildren() {
		// `baseInterval` is read in `_prepareAxisItems` (gated by `_sizeDirty` among
		// others), so re-run it when the interval changes. Set the flag directly to
		// avoid re-entering `_prepareChildren`.
		if (this.isDirty("baseInterval")) {
			this._sizeDirty = true;
		}
		super._prepareChildren();
	}


	protected _prepareAxisItems() {
		// temp
		this.setPrivateRaw("baseInterval", this.get("baseInterval"));

		const renderer = this.get("renderer");
		const len = this.dataItems.length;

		if (len === 0) {
			return;
		}

		let startIndex = this.startIndex();
		if (startIndex > 0) {
			startIndex--;
		}

		let endIndex = this.endIndex();
		if (endIndex < len) {
			endIndex++;
		}

		let maxCount = renderer.axisLength() / Math.max(renderer.get("minGridDistance")!, 1 / Number.MAX_SAFE_INTEGER);

		let frequency = Math.max(1, Math.min(len, Math.ceil((endIndex - startIndex) / maxCount)));
		if (!$type.isNumber(frequency)) {
			frequency = 1;
		}
		startIndex = Math.floor(startIndex / frequency) * frequency;
		this._frequency = frequency;

		for (let j = 0; j < len; j++) {
			this._toggleDataItem(this.dataItems[j], false);
		}

		let startTime = Number(this.dataItems[startIndex].get("category"));
		let endTime = Number(this.dataItems[endIndex - 1].get("category"));
		let realDuration = (endTime - startTime);
		if (endIndex - startIndex < maxCount) {
			realDuration = (endTime - startTime) - ((endTime - startTime) / this.baseDuration() - (endIndex - startIndex)) * this.baseDuration();
		}

		// if all items are on axis
		let gridInterval = $time.chooseInterval(0, realDuration, maxCount, this.get("gridIntervals")!);

		const nextGridUnit = $time.getNextUnit(gridInterval.timeUnit);
		const baseInterval = this.getPrivate("baseInterval");

		if ($time.getIntervalDuration(gridInterval) < this.baseDuration()) {
			gridInterval = { ...baseInterval };
		}

		const formats = this.get("dateFormats")!;

		let previousValue = -Infinity;
		let previousIndex = -Infinity;
		let previousUnitValue = -Infinity;
		let format: string;

		let selectedItems: Array<{ format: string, dataItem: DataItem<ICategoryDateAxisDataItem> }> = [];
		let changed = false;

		for (let i = startIndex; i < endIndex; i++) {
			let dataItem = this.dataItems[i];
			let index = dataItem.get("index")!;
			let skip = false;

			let value = Number(dataItem.get("category"));
			let date = new Date(value);
			let unitValue = $time.getUnitValue(date, gridInterval.timeUnit);

			format = formats[gridInterval.timeUnit];
			let added = false;

			if (gridInterval.timeUnit != "year" && gridInterval.timeUnit != "week") {
				if (nextGridUnit && this.get("markUnitChange") && $type.isNumber(previousValue)) {

					if ($time.checkChange(value, previousValue, nextGridUnit, this._root.utc)) {
						format = this.get("periodChangeDateFormats")![gridInterval.timeUnit];

						if (index - frequency * 0.5 < previousIndex) {
							selectedItems.pop();
						}

						selectedItems.push({ format: format, dataItem: dataItem });
						changed = true;
						added = true;
						previousIndex = index;
						previousUnitValue = unitValue;
					}
				}
			}

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

			if (!added && shouldAdd) {
				if (index - frequency * 0.7 < previousIndex) {
					if (changed) {
						skip = true;
					}
				}
				if (!skip) {
					selectedItems.push({ format: format, dataItem: dataItem });
					previousIndex = index;
					previousUnitValue = unitValue;
				}
				changed = false;

			}

			previousValue = value;

		}

		if (selectedItems.length > 0) {
			let f = selectedItems[0].dataItem.get("index", 0);

			$array.each(selectedItems, (item) => {
				const dataItem = item.dataItem;
				const format = item.format;
				this._createAssets(dataItem, []);

				this._toggleDataItem(dataItem, true);

				let value = Number(dataItem.get("category"));
				let date = new Date(value);

				const label = dataItem.get("label");
				if (label) {
					label.set("text", this._root.dateFormatter.format(date, format!));
				}
				f++;
				this._prepareDataItem(dataItem, f, frequency);
			})

		}
	}

	/**
	 * Returns the duration of `baseInterval` in milliseconds.
	 *
	 * @return Duration
	 */
	public baseDuration(): number {
		return $time.getIntervalDuration(this.getPrivate("baseInterval"));
	}


	/**
	 * Returns the text the axis tooltip shows at a position: the date of the
	 * category there.
	 *
	 * @param   position  Position on the axis (`0` to `1`)
	 * @return            Tooltip text
	 */
	public getTooltipText(position: number, _adjustPosition?: boolean): string | undefined {
		//@todo number formatter + tag
		let dataItem = this.dataItems[this.axisPositionToIndex(position)];

		if (dataItem) {
			let format = this.get("dateFormats")![this.getPrivate("baseInterval").timeUnit];
			return this._root.dateFormatter.format(new Date(dataItem.get("category", 0)), this.get("tooltipDateFormat", format));
		}
	}

	protected _updateTooltipText(tooltip: Tooltip, position: number) {
		tooltip.label.set("text", this.getTooltipText(position));
	}

}
