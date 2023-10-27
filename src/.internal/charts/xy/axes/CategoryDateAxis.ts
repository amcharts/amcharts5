import type { DataItem } from "../../../core/render/Component";
import type { AxisRenderer } from "./AxisRenderer";
import { CategoryAxis, ICategoryAxisSettings, ICategoryAxisPrivate, ICategoryAxisDataItem, ICategoryAxisEvents } from "./CategoryAxis";
import type { ITimeInterval } from "../../../core/util/Time";
import * as $time from "../../../core/util/Time";
import * as $type from "../../../core/util/Type";
import * as $array from "../../../core/util/Array";
import * as $utils from "../../../core/util/Utils";
import type { Tooltip } from "../../../core/render/Tooltip";

export interface ICategoryDateAxisSettings<R extends AxisRenderer> extends ICategoryAxisSettings<R> {

	/**
	 * Indicates granularity of data.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Data_granularity} for more info
	 */
	baseInterval: ITimeInterval;

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
	dateFormats?: { [index: string]: string };

	/**
	 * Date formats used for "period change" labels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Date_formats} for more info
	 */
	periodChangeDateFormats?: { [index: string]: string };

	/**
	 * A date format to use for axis tooltip.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/formatting-dates/} for more info
	 */
	tooltipDateFormat?: string;

}

export interface ICategoryDateAxisDataItem extends ICategoryAxisDataItem {
}

export interface ICategoryDateAxisPrivate extends ICategoryAxisPrivate {

	/**
	 * Current base interval.
	 */
	baseInterval: ITimeInterval;

}

export interface ICategoryDateAxisEvents extends ICategoryAxisEvents {
}


/**
 * Category-based date axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/category-date-axis/} for more info
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


	protected _prepareAxisItems() {
		// temp
		this.setPrivateRaw("baseInterval", this.get("baseInterval"));

		const renderer = this.get("renderer");
		const len = this.dataItems.length;

		let startIndex = this.startIndex();
		if (startIndex > 0) {
			startIndex--;
		}

		let endIndex = this.endIndex();
		if (endIndex < len) {
			endIndex++;
		}

		let maxCount = renderer.axisLength() / Math.max(renderer.get("minGridDistance")!, 1 / Number.MAX_SAFE_INTEGER);

		let frequency = Math.min(len, Math.ceil((endIndex - startIndex) / maxCount));
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
	 * Returns a duration of currently active `baseInterval` in milliseconds.
	 *
	 * @return Duration
	 */
	public baseDuration(): number {
		return $time.getIntervalDuration(this.getPrivate("baseInterval"));
	}


	/**
	 * Returns text to be used in an axis tooltip for specific relative position.
	 *
	 * @param   position  Position
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
