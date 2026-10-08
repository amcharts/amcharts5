import type { DataItem } from "../../../core/render/Component";
import type { AxisRenderer } from "./AxisRenderer";
import type { Tooltip } from "../../../core/render/Tooltip";
import type { IXYSeriesDataItem, XYSeries } from "../series/XYSeries";

import { Axis, IAxisSettings, IAxisPrivate, IAxisDataItem, IAxisEvents } from "./Axis";
import { populateString } from "../../../core/util/PopulateString";
import { ValueAxis } from "./ValueAxis";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";
import * as $math from "../../../core/util/Math";
import * as $utils from "../../../core/util/Utils";

export interface ICategoryAxisSettings<R extends AxisRenderer> extends IAxisSettings<R> {

	/**
	 * Function that decides which axis fills show; it is called for each
	 * category with its index. The default fills every other category.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Axis_fills} for more info
	 */
	fillRule?: (dataItem: DataItem<ICategoryAxisDataItem>, index?: number) => void;

	/**
	 * Field in the data that holds the category names.
	 */
	categoryField: string;

	/**
	 * Field in the data that holds a unique id for each category.
	 */
	idField?: string;

	/**
	 * Field in the data that holds each category's relative size: a category
	 * of `2` takes twice the room of one of `1`. Categories without it get
	 * `1`.
	 */
	cellSizeField?: string;

	/**
	 * Where within the first category the axis starts, from `0` (its start)
	 * to `1` (its end): `0.5` cuts off the first half of the first category.
	 *
	 * @default 0
	 */
	startLocation?: number;

	/**
	 * Where within the last category the axis ends, from `0` (its start) to
	 * `1` (its end): `0.5` cuts off the second half of the last category.
	 *
	 * @default 1
	 */
	endLocation?: number;
}

export interface ICategoryAxisDataItem extends IAxisDataItem {

	/**
	 * The category name.
	 */
	category?: string;

	/**
	 * End category, for axis ranges that span several categories.
	 */
	endCategory?: string;

	/**
	 * Index of the data item.
	 */
	index?: number;

	/**
	 * Where within `category` the item starts, from `0` (start) to `1` (end).
	 *
	 * @default 0
	 */
	categoryLocation?: number;

	/**
	 * Where within `endCategory` (or `category`) the item ends, from `0`
	 * (start) to `1` (end).
	 *
	 * @default 1
	 */
	endCategoryLocation?: number;

	/**
	 * Shifts the category from its place, as a share of the whole axis
	 * length (`1` is the full axis). Used to animate sorting without
	 * reordering the data.
	 */
	deltaPosition?: number;

	/**
	 * Relative size of the category's cell. Used only when the axis has
	 * `cellSizeField` set.
	 */
	cellSize?: number;

	/**
	 * @ignore
	 */
	finalCellSize?: number;

	/**
	 * A unique id of the data item.
	 */
	id?: string;
}

export interface ICategoryAxisPrivate extends IAxisPrivate {

	/**
	 * Index of the first category in view.
	 */
	startIndex?: number;

	/**
	 * Index after the last category in view.
	 */
	endIndex?: number;
}

export interface ICategoryAxisEvents extends IAxisEvents {

}

/**
 * An axis of named categories, each taking an equal share of the axis unless
 * `cellSizeField` sets their sizes.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/category-axis/} for more info
 * @important
 */
export class CategoryAxis<R extends AxisRenderer> extends Axis<R> {
	public static className: string = "CategoryAxis";
	public static classNames: Array<string> = Axis.classNames.concat([CategoryAxis.className]);

	declare public _settings: ICategoryAxisSettings<R>;
	declare public _privateSettings: ICategoryAxisPrivate;
	declare public _dataItemSettings: ICategoryAxisDataItem;
	declare public _events: ICategoryAxisEvents;

	protected _frequency: number = 1;

	protected _itemMap: { [index: string]: DataItem<ICategoryAxisDataItem> } = {};

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["axis"]);
		this.fields.push("category", "id", "cellSize");
		this.setPrivateRaw("name", "category");
		this.addTag("category");
		super._afterNew();
	}

	public _afterDataChange(): void {
		super._afterDataChange();
		const len = this.dataItems.length;
		if (len > 0) {
			this.setPrivateRaw("maxZoomFactor", len);
		}

		// Keep the indexes within the data until the next frame works them out from the zoom
		this.setPrivateRaw("startIndex", Math.max(Math.round(this.get("start", 0) * len), 0));
		this.setPrivateRaw("endIndex", Math.min(Math.round(this.get("end", 1) * len), len));
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("startLocation") || this.isDirty("endLocation")) {
			this._sizeDirty = true;
		}

		const len = this.dataItems.length;
		let i = 0;
		if (this._valuesDirty) {
			this._itemMap = {};
			$array.each(this.dataItems, (dataItem) => {
				dataItem.setRaw("index", i);
				this._itemMap[dataItem.get("category") as string] = dataItem;
				i++;
			})

			this.setPrivateRaw("maxZoomFactor", len);
		}

		let start = this.get("start", 0);
		let end = this.get("end", 1);

		let indices = this._getIndices(start, end);

		this.setPrivateRaw("startIndex", indices.startIndex);
		this.setPrivateRaw("endIndex", indices.endIndex);

		if (this._sizeDirty || this._valuesDirty || (this.isDirty("start") || this.isDirty("end") || this.isPrivateDirty("endIndex") || this.isPrivateDirty("startIndex") || this.isPrivateDirty("width") || this.isPrivateDirty("height"))) {
			if (this.dataItems.length > 0) {
				this._handleRangeChange();
				this._prepareAxisItems();
				this._updateAxisRanges();
			}
		}
	}

	/**
	 * @ignore
	 */
	public adjustZoom(): void {
		const len = this.dataItems.length;
		if (len > 1) {
			let maxZoomCount = this.get("maxZoomCount", this.dataItems.length);
			let minZoomCount = this.get("minZoomCount", 1);

			let count = 0;
			let startIndex = this.getPrivate("startIndex", 0);
			let endIndex = this.getPrivate("endIndex", 0);

			const sAnimation = this._sAnimation;
			const eAnimation = this._eAnimation;

			let start = this.get("start", 0);
			let getIndices = false;
			if (sAnimation && !sAnimation.stopped) {
				start = Number(sAnimation.to);
				getIndices = true;
			}
			let end = this.get("end", 1);
			if (eAnimation && !eAnimation.stopped) {
				end = Number(eAnimation.to);
				getIndices = true;
			}

			if (getIndices) {
				const indices = this._getIndices(start, end);
				startIndex = indices.startIndex;
				endIndex = indices.endIndex;
			}

			for (let i = startIndex; i < endIndex; i++) {
				const dataItem = this.dataItems[i];
				count += dataItem.get("finalCellSize", 1);
			};

			if (count <= minZoomCount) {
				// need to zoom out
				let c = 0;

				for (let i = startIndex; i < len; i++) {
					const dataItem = this.dataItems[i];
					c += dataItem.get("finalCellSize", 1);

					endIndex = i + 1;
					if (c >= minZoomCount) {
						break;
					}
				}

				if (c < minZoomCount) {
					// still not enough, try to extend at the start
					for (let i = startIndex - 1; i >= 0; i--) {
						const dataItem = this.dataItems[i];
						c += dataItem.get("finalCellSize", 1);
						startIndex = i;
						if (c >= minZoomCount) {
							break;
						}
					}
				}
				this.zoomToIndexes(startIndex, endIndex);
			}
			else if (count >= maxZoomCount) {
				let c = count;
				for (let i = endIndex - 1; i >= startIndex; i--) {
					const dataItem = this.dataItems[i];
					c -= dataItem.get("finalCellSize", 1);
					if (c <= maxZoomCount) {
						endIndex = i + 1;
						break;
					}
				}
				this.zoomToIndexes(startIndex, endIndex);
			}
		}
	}

	protected _handleRangeChange() {
		$array.each(this.series, (series) => {
			let baseAxis = series.get("baseAxis");
			let xAxis = series.get("xAxis");
			let yAxis = series.get("yAxis");

			if (xAxis instanceof CategoryAxis && yAxis instanceof CategoryAxis) {
				series._markDirtyAxes();
			}
			else if (baseAxis === this) {
				let key: string | undefined;
				let openKey: string | undefined;
				let otherAxis = yAxis;
				if (xAxis === baseAxis) {
					if (series.get("categoryXField")) {
						key = "categoryX";
					}
					if (series.get("openCategoryXField")) {
						openKey = "openCategoryX";
					}
				}
				else if (yAxis === baseAxis) {
					if (series.get("categoryYField")) {
						key = "categoryY";
					}
					if (series.get("openCategoryYField")) {
						openKey = "openCategoryY";
					}
					otherAxis = xAxis;
				}

				if (otherAxis instanceof ValueAxis) {

					if (key || openKey) {
						let firstIndex = this.startIndex();
						let lastIndex = this.endIndex() - 1;

						let startIndex = -1;
						let endIndex = 0;

						// Series data is not necessarily in the same order as axis
						// categories, and a category can hold more than one item, so
						// find the outermost items that touch the selected categories
						// instead of relying on the order.
						for (let i = 0, len = series.dataItems.length; i < len; i++) {
							let dataItem = series.dataItems[i];

							let low = NaN;
							let high = NaN;

							if (key) {
								low = high = this.categoryToIndex(dataItem.get(key as any));
							}

							if (openKey) {
								let openIndex = this.categoryToIndex(dataItem.get(openKey as any));
								if ($type.isNumber(openIndex)) {
									low = $type.isNumber(low) ? Math.min(low, openIndex) : openIndex;
									high = $type.isNumber(high) ? Math.max(high, openIndex) : openIndex;
								}
							}

							if ($type.isNumber(low) && low <= lastIndex && high >= firstIndex) {
								if (startIndex == -1) {
									startIndex = i;
								}
								endIndex = i + 1;
							}
						}

						if (startIndex == -1) {
							startIndex = 0;
						}

						series.setPrivate("startIndex", startIndex);
						series.setPrivate("endIndex", endIndex);

						let hasValue = false;
						for (let i = startIndex; i < endIndex; i++) {
							const dataItem = series.dataItems[i];

							$array.each(series.__valueXShowFields, (key) => {
								let value = dataItem.get(<any>key);
								if (value != null) {
									hasValue = true;
								}
							})

							$array.each(series.__valueYShowFields, (key) => {
								let value = dataItem.get(<any>key);
								if (value != null) {
									hasValue = true;
								}
							})

							if (hasValue) {
								break;
							}
						}
						series.setPrivate("outOfSelection", !hasValue);
					}
				}
				series._markDirtyAxes();	// must be outside
			}
		})
	}


	protected _prepareAxisItems() {
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

		const minorLabelsEnabled = renderer.get("minorLabelsEnabled");
		const minorGridEnabled = renderer.get("minorGridEnabled", minorLabelsEnabled);

		let maxCount = renderer.axisLength() / Math.max(renderer.get("minGridDistance")!, 1);

		let frequency = Math.max(1, Math.min(len, Math.ceil((endIndex - startIndex) / maxCount)));

		// A degenerate axis length (e.g. a NaN/Infinity angle span on a radar
		// chart) makes `maxCount` non-finite, which cascades into a NaN
		// `frequency` and a NaN `startIndex` — and `this.dataItems[NaN]` is
		// undefined, throwing on `.get()` below. Fall back to a valid frequency.
		if (!$type.isNumber(frequency)) {
			frequency = 1;
		}

		startIndex = Math.floor(startIndex / frequency) * frequency;
		this._frequency = frequency;

		for (let j = 0; j < len; j++) {
			this._toggleDataItem(this.dataItems[j], false);
		}

		let f = this.dataItems[startIndex].get("index", 0);

		for (let i = startIndex; i < endIndex; i = i + frequency) {
			let dataItem = this.dataItems[i];

			this._createAssets(dataItem, []);
			this._toggleDataItem(dataItem, true);

			let count = frequency;
			if (minorGridEnabled) {
				count = 1;
			}

			this._prepareDataItem(dataItem, f, count);

			f++;
		}

		if (renderer.get("minorGridEnabled")) {
			for (let i = startIndex; i < endIndex; i++) {
				let dataItem = this.dataItems[i];
				if (i % frequency != 0) {
					this._createAssets(dataItem, ["minor"], true);
					this._toggleDataItem(dataItem, true);
					this._prepareDataItem(dataItem, 0, 1);

					if (!minorLabelsEnabled) {
						dataItem.get("label")?.setPrivate("visible", false);
					}
				}
			}
		}

		this._updateGhost();
	}


	public _prepareDataItem(dataItem: DataItem<this["_dataItemSettings"]>, fillIndex?: number, count?: number) {
		let renderer = this.get("renderer");

		let categoryLocation = dataItem.get("categoryLocation", 0);
		let endCategoryLocation = dataItem.get("endCategoryLocation", 1);

		let index: number | undefined = dataItem.get("index");

		if (!$type.isNumber(index)) {
			index = this.categoryToIndex(dataItem.get("category")!);
		}

		let position = this.indexToPosition(index, categoryLocation);

		let endCategory = dataItem.get("endCategory")!;
		let endIndex: number;
		if (endCategory) {
			endIndex = this.categoryToIndex(endCategory);
			if (!$type.isNumber(endIndex)) {
				endIndex = index;
			}
		}
		else {
			endIndex = index;
		}

		let endPosition = this.indexToPosition(endIndex, endCategoryLocation);

		let fillEndIndex: number;
		let fillEndPosition: number;

		if (dataItem.get("isRange")) {
			fillEndIndex = endIndex;

			if (!$type.isNumber(index)) {
				this._toggleDataItem(dataItem, false);
				return;
			}
		}
		else {
			fillEndIndex = index + this._frequency - 1;
		}

		fillEndPosition = this.indexToPosition(fillEndIndex, endCategoryLocation);

		renderer.updateLabel(dataItem.get("label"), position, endPosition, count);
		renderer.updateGrid(dataItem.get("grid"), position, endPosition);
		renderer.updateTick(dataItem.get("tick"), position, endPosition, count);
		renderer.updateFill(dataItem.get("axisFill"), position, fillEndPosition);

		this._processBullet(dataItem);
		renderer.updateBullet(dataItem.get("bullet"), position, endPosition);

		const fillRule = this.get("fillRule");
		if (fillRule) {
			fillRule(dataItem, fillIndex)
		}
	}

	/**
	 * Returns the index of the first category in view.
	 */
	public startIndex() {
		let len = this.dataItems.length;
		return Math.min(Math.max(this.getPrivate("startIndex", 0), 0), len - 1);
	}

	/**
	 * Returns the index after the last category in view.
	 */
	public endIndex() {
		let len = this.dataItems.length;
		return Math.max(1, Math.min(this.getPrivate("endIndex", len), len));
	}

	/**
	 * @ignore
	 */
	public baseValue(): any {

	}

	/**
	 * @ignore
	 */
	public basePosition() {
		return 0;
	}

	/**
	 * Returns the X coordinate in pixels of the middle of a category.
	 *
	 * @param   value  Category
	 * @return         X coordinate
	 */
	public getX(value: string): number {
		let axisDataItem = this._itemMap[value];
		if (axisDataItem) {
			return this._settings.renderer.positionToCoordinate(this.indexToPosition(axisDataItem.get("index", 0)));
		}
		return NaN;
	}

	/**
	 * Returns the Y coordinate in pixels of the middle of a category.
	 *
	 * @param   value  Category
	 * @return         Y coordinate
	 */
	public getY(value: string): number {
		let axisDataItem = this._itemMap[value];
		if (axisDataItem) {
			return this._settings.renderer.positionToCoordinate(this.indexToPosition(axisDataItem.get("index", 0)));
		}
		return NaN;
	}

	/**
	 * @ignore
	 */
	public getDataItemPositionX(dataItem: DataItem<IXYSeriesDataItem>, field: string, cellLocation: number, _axisLocation?: number): number {
		const category = dataItem.get(field as any);
		const axisDataItem = this._itemMap[category];

		if (axisDataItem) {
			return this.indexToPosition(axisDataItem.get("index", 0), cellLocation);
		}
		return NaN;
	}

	/**
	 * @ignore
	 */
	public getDataItemCoordinateX(dataItem: DataItem<IXYSeriesDataItem>, field: string, cellLocation: number, _axisLocation?: number): number {
		return this._settings.renderer.positionToCoordinate(this.getDataItemPositionX(dataItem, field, cellLocation, _axisLocation));
	}

	/**
	 * @ignore
	 */
	public getDataItemPositionY(dataItem: DataItem<IXYSeriesDataItem>, field: string, cellLocation: number, _axisLocation?: number): number {
		const category = dataItem.get(field as any);
		const axisDataItem = this._itemMap[category];
		if (axisDataItem) {
			return this.indexToPosition(axisDataItem.get("index", 0), cellLocation);
		}
		return NaN;
	}

	/**
	 * @ignore
	 */
	public getDataItemCoordinateY(dataItem: DataItem<IXYSeriesDataItem>, field: string, cellLocation: number, _axisLocation?: number): number {
		return this._settings.renderer.positionToCoordinate(this.getDataItemPositionY(dataItem, field, cellLocation, _axisLocation));
	}

	/**
	 * Converts a category index to a position on the axis (`0` to `1`).
	 *
	 * @param   index     Index
	 * @param   location  Location within the category, from `0` (start) to `1` (end); `0.5` if not set
	 * @param   final     Use the cell sizes running animations head for, and ignore `deltaPosition`
	 * @return            Position
	 */
	public indexToPosition(index: number, location?: number, final?: boolean): number {
		let len = this.dataItems.length;
		let position = 0;

		if (len == 0) {
			return 0;
		}

		if (index >= len) {
			index = len - 1;
			location = 1;
		}

		if (!$type.isNumber(location)) {
			location = 0.5;
		}

		if (!$type.isNumber(index)) {
			return 0;
		}

		let startLocation = this.get("startLocation", 0);
		let endLocation = this.get("endLocation", 1);

		if (!this.get("cellSizeField")) {
			len -= startLocation;
			len -= (1 - endLocation);

			position = (index + location - startLocation) / len;
		}
		else {
			let name: "finalCellSize" | "cellSize" = final ? "finalCellSize" : "cellSize";

			const dataItems = this.dataItems;

			// Calculate total modified count (sum of cell sizes)
			let modCount = 0;
			$array.each(this.dataItems, (dataItem) => {
				modCount += dataItem.get(name, 1);
			});

			modCount -= startLocation * dataItems[0].get(name, 1);
			modCount -= (1 - endLocation) * dataItems[dataItems.length - 1].get(name, 1);

			// Calculate the position based on cell sizes
			let acc = 0;
			for (let i = 0; i < index; i++) {
				acc += dataItems[i].get(name, 1);
			}
			let cellSizeAtIndex = dataItems[index].get(name, 1);

			position = (acc + location * cellSizeAtIndex - startLocation * dataItems[0].get(name, 1)) / modCount;
		}

		if (!final) {
			let dataItem = this.dataItems[index];
			if (dataItem) {
				position += dataItem.get("deltaPosition", 0);
			}
		}

		return position;
	}

	/**
	 * Returns the position (`0` to `1`) of the middle of a category on the
	 * axis.
	 *
	 * @param   category  Category to look up
	 * @return            Position
	 */
	public categoryToPosition(category: string): number {
		let dataItem = this._itemMap[category];
		if (dataItem) {
			return this.indexToPosition(dataItem.get("index")!);
		}
		return NaN;
	}


	/**
	 * Returns an index of a category.
	 *
	 * @param   category  Category to look up
	 * @return            Index
	 */
	public categoryToIndex(category: string): number {
		let dataItem = this._itemMap[category];
		if (dataItem) {
			return dataItem.get("index")!;
		}
		return NaN;
	}

	/**
	 * @ignore
	 */
	public dataItemToPosition(dataItem: DataItem<this["_dataItemSettings"]>): number {
		return this.indexToPosition(dataItem.get("index")!);
	}

	/**
	 * @ignore
	 */
	public roundAxisPosition(position: number, location: number): number {
		position += (0.5 - location) / this.dataItems.length;
		return this.indexToPosition(this.axisPositionToIndex(position), location);
	}

	/**
	 * Returns the index of the category at a position on the axis.
	 *
	 * @param position  Position (`0` to `1`)
	 * @return Category index
	 */
	public axisPositionToIndex(position: number): number {
		let len = this.dataItems.length;
		if (len === 0) {
			return 0;
		}

		// Calculate total modified length (sum of cell sizes)
		if (this.get("cellSizeField")) {
			let modifiedLen = 0;
			let cellSizes: number[] = [];
			$array.each(this.dataItems, (dataItem) => {
				const cellSize = dataItem.get("cellSize", 1);
				cellSizes.push(cellSize);
				modifiedLen += cellSize;
			});
			// Adjust for startLocation and endLocation
			let startLocation = this.get("startLocation", 0);
			let endLocation = this.get("endLocation", 1);
			modifiedLen -= startLocation;
			modifiedLen -= (1 - endLocation);

			// Find which cell the position falls into
			let rel = position * modifiedLen + startLocation;
			let acc = 0;
			for (let i = 0; i < len; i++) {
				const cellSize = cellSizes[i];
				if (rel < acc + cellSize) {
					return i;
				}
				acc += cellSize;
			}
			return len - 1;
		}
		else {
			return $math.fitToRange(Math.floor(position * len), 0, len - 1);
		}
	}

	/**
	 * Returns the text the axis tooltip shows at a position: the axis's
	 * `tooltipText`, or else the text of the tooltip's or the category's label.
	 *
	 * @param   position  Position on the axis (`0` to `1`)
	 * @return            Tooltip text
	 */
	public getTooltipText(position: number, _adjustPosition?: boolean): string | undefined {
		//@todo number formatter + tag
		const dataItem = this.dataItems[this.axisPositionToIndex(position)];
		if (dataItem) {
			const label = dataItem.get("label")
			if (label) {
				// `tooltipText`, else what the axis tooltip shows, else what the axis
				// label shows (e.g. a Gantt task's name rather than its id)
				const tooltip = this.get("tooltip");
				const labelText = label.get("text", "{category}");
				const text = this.get("tooltipText", tooltip ? tooltip.label.get("text", labelText) : labelText);
				return populateString(label, text);
			}
		}
	}

	public _scrollbarText(position: number, isEnd?: boolean): string {
		// A range ends where its last category ends, which is also where the next
		// one starts: name the last one inside
		if (isEnd && position > 0) {
			position -= 0.000001;
		}
		return super._scrollbarText(position, isEnd);
	}

	protected _updateTooltipText(tooltip: Tooltip, position: number) {
		tooltip._setDataItem(this.dataItems[this.axisPositionToIndex(position)]);
		tooltip.label.text.markDirtyText();
	}

	/**
	 * Returns the series data item of the category at a position on the axis.
	 *
	 * @param   series    Series
	 * @param   position  Position on the axis (`0` to `1`)
	 * @return            Data item
	 */
	public getSeriesItem(series: XYSeries, position: number): DataItem<IXYSeriesDataItem> | undefined {
		if (this.dataItems.length > 0) {
			let fieldName = <any>(this.getPrivate("name")! + this.get("renderer").getPrivate("letter")!);
			let index = this.axisPositionToIndex(position);
			// try simple first
			let seriesDataItem = series.dataItems[index];
			let axisDataItem = this.dataItems[index];
			let category = axisDataItem.get("category");

			if (seriesDataItem && axisDataItem) {
				if (seriesDataItem.get(fieldName) === category) {
					return seriesDataItem;
				}
			}

			// if not found, try looking
			for (let i = 0, len = series.dataItems.length; i < len; i++) {
				let dataItem = series.dataItems[i];
				if (dataItem.get(fieldName) === category) {
					return dataItem;
				}
			}
		}
	}

	public _getIndices(start: number, end: number): { startIndex: number, endIndex: number } {
		let len = this.dataItems.length;
		let startIndex = 0;
		let endIndex = len;
		let name: "cellSize" | "finalCellSize" = "cellSize";

		if (this.get("cellSizeField")) {
			let count = 0;
			const dataItems = this.dataItems;
			if (dataItems.length == 0) {
				return { startIndex: 0, endIndex: 0 };
			}

			$array.each(dataItems, (dataItem) => {
				count += dataItem.get(name, 1);
			});

			count -= this.get("startLocation", 0) * dataItems[0].get(name, 1);
			count -= (1 - this.get("endLocation", 1)) * dataItems[dataItems.length - 1].get(name, 1);

			let c = 0;
			for (let i = 0; i < len; i++) {
				c += this.dataItems[i].get(name, 1);
				if (Math.round(c) > Math.round(start * count)) {
					startIndex = i;
					break;
				}
			}

			for (let i = startIndex + 1; i < len; i++) {
				c += this.dataItems[i].get(name, 1);
				if (Math.round(c) >= Math.round(end * count)) {
					endIndex = i + 1;
					break;
				}
			}

			startIndex = Math.max(startIndex, 0);
			endIndex = Math.min(endIndex, len);
		}
		else {
			startIndex = Math.max(Math.round(this.get("start", 0) * len), 0);
			endIndex = Math.min(Math.round(this.get("end", 1) * len), len);
		}

		return { startIndex, endIndex };
	}

	/**
	 * Zooms the axis to show the categories from index `start` up to, but not
	 * including, `end`.
	 *
	 * @param  start     Start index
	 * @param  end       End index (not included)
	 * @param  duration  Animation duration in milliseconds
	 */
	public zoomToIndexes(start: number, end: number, duration?: number) {
		let len = this.dataItems.length;
		if (this.get("cellSizeField")) {
			start = Math.min(Math.max(start, 0), len);
			end = Math.max(Math.min(end, len), 1);
			this.setPrivateRaw("startIndex", start);
			this.setPrivateRaw("endIndex", end);
			this.zoom(this.indexToPosition(start, 0, true), this.indexToPosition(end, 0, true), duration);
		}
		else {
			this.zoom(start / len, end / len, duration);
		}
	}

	/**
	 * Zooms the axis to show the categories from `startCategory` to
	 * `endCategory`, both included.
	 *
	 * @param  startCategory  First category
	 * @param  endCategory    Last category
	 * @param  duration       Animation duration in milliseconds
	 */
	public zoomToCategories(startCategory: string, endCategory: string, duration?: number) {
		this.zoomToIndexes(this.categoryToIndex(startCategory), this.categoryToIndex(endCategory) + 1, duration);
	}

	/**
	 * Returns the distance between two grid lines as a share of the visible
	 * part of the axis.
	 *
	 * @since 5.2.30
	 * @return Distance (`0` to `1`)
	 */
	public getCellWidthPosition(): number {
		return this._frequency / this.dataItems.length / (this.get("end", 1) - this.get("start", 0));
	}

	/**
	 * @ignore
	 */
	public nextPosition(count?: number) {
		if (count == null) {
			count = 1;
		}

		if (this.get("renderer").getPrivate("letter") == "Y") {
			count *= -1;
		}

		const position = this.getPrivate("tooltipPosition", 0);

		const index = $math.fitToRange(this.axisPositionToIndex(position) + count, 0, this.dataItems.length - 1);
		return this.toGlobalPosition(this.indexToPosition(index));
	}
}
