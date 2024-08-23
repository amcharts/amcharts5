import type { DataItem } from "../../../core/render/Component";
import type { AxisRenderer } from "./AxisRenderer";
import { Axis, IAxisSettings, IAxisPrivate, IAxisDataItem, IAxisEvents } from "./Axis";
import type { IXYSeriesDataItem, XYSeries } from "../series/XYSeries";
import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";
import * as $math from "../../../core/util/Math";
import * as $utils from "../../../core/util/Utils";
import { populateString } from "../../../core/util/PopulateString";
import type { Tooltip } from "../../../core/render/Tooltip";
import { ValueAxis } from "./ValueAxis";

export interface ICategoryAxisSettings<R extends AxisRenderer> extends IAxisSettings<R> {

	/**
	 * A function that can be used to specify how to configure axis fills.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Axis_fills} for more info
	 */
	fillRule?: (dataItem: DataItem<ICategoryAxisDataItem>, index?: number) => void;

	/**
	 * A field in data which holds categories.
	 */
	categoryField: string;

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
}

export interface ICategoryAxisDataItem extends IAxisDataItem {

	/**
	 * Named category.
	 */
	category?: string;

	/**
	 * Named end category (for axis items that span multiple categories, like
	 * axis ranges).
	 */
	endCategory?: string;

	/**
	 * Index of the data item.
	 */
	index?: number;

	/**
	 * Relative location of the category within cell: 0 - start, 1 - end.
	 */
	categoryLocation?: number;

	/**
	 * Relative location of the end category within cell: 0 - start, 1 - end.
	 */
	endCategoryLocation?: number;

	/**
	 * A distance to shift data item relative to its original position.
	 *
	 * The value is 0 to 1, where 1 is full witdth of the axis.
	 *
	 * Can be used to sort data items without modifying order of the actual data.
	 */
	deltaPosition?: number;

}

export interface ICategoryAxisPrivate extends IAxisPrivate {

	/**
	 * Start index of the current zoom scope.
	 */
	startIndex?: number;

	/**
	 * End index of the current zoom scope.
	 */
	endIndex?: number;

}

export interface ICategoryAxisEvents extends IAxisEvents {

}

/**
 * Creates a category axis.
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
		this.fields.push("category");
		this.setPrivateRaw("name", "category");
		this.addTag("category");
		super._afterNew();
	}

	public _prepareChildren() {
		super._prepareChildren();

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

		this.setPrivateRaw("startIndex", Math.max(Math.round(this.get("start", 0) * len), 0));
		this.setPrivateRaw("endIndex", Math.min(Math.round(this.get("end", 1) * len), len));

		if (this._sizeDirty || this._valuesDirty || (this.isDirty("start") || this.isDirty("end") || this.isPrivateDirty("endIndex") || this.isPrivateDirty("startIndex") || this.isPrivateDirty("width") || this.isPrivateDirty("height"))) {
			if (this.dataItems.length > 0) {
				this._handleRangeChange();
				this._prepareAxisItems();
				this._updateAxisRanges();
			}
		}
	}

	protected _handleRangeChange() {
		$array.each(this.series, (series) => {
			let startCategory = this.dataItems[this.startIndex()].get("category");
			let endCategory = this.dataItems[this.endIndex() - 1].get("category");

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
						let startDataItem: DataItem<IXYSeriesDataItem> | undefined;
						let endDataItem: DataItem<IXYSeriesDataItem> | undefined;

						for (let i = 0, len = series.dataItems.length; i < len; i++) {
							let dataItem = series.dataItems[i];
							if (key) {
								if (dataItem.get(key as any) === startCategory) {
									startDataItem = dataItem;
									break;
								}
							}
							if (openKey) {
								if (dataItem.get(openKey as any) === startCategory) {
									startDataItem = dataItem;
									break;
								}
							}
						}

						for (let i = series.dataItems.length - 1; i >= 0; i--) {
							let dataItem = series.dataItems[i];
							if (key) {
								if (dataItem.get(key as any) === endCategory) {
									endDataItem = dataItem;
									break;
								}
							}
							if (openKey) {
								if (dataItem.get(openKey as any) === endCategory) {
									endDataItem = dataItem;
									break;
								}
							}
						}

						let startIndex = 0;
						let endIndex = series.dataItems.length;

						if (startDataItem) {
							startIndex = series.dataItems.indexOf(startDataItem);
						}

						if (endDataItem) {
							endIndex = series.dataItems.indexOf(endDataItem) + 1;
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

	public startIndex() {
		let len = this.dataItems.length;
		return Math.min(Math.max(this.getPrivate("startIndex", 0), 0), len - 1);
	}

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
	 * Returns X coordinate in pixels corresponding to specific category index.
	 *
	 * @param   value  Index
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
	 * Returns Y coordinate in pixels corresponding to specific category index.
	 *
	 * @param   value  Index
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
	 * Converts category index to a relative position.
	 *
	 * `location` indicates relative position within category: 0 - start, 1 - end.
	 *
	 * If not set, will use middle (0.5) of the category.
	 *
	 * @param   index     Index
	 * @param   location  Location
	 * @return            Index
	 */
	public indexToPosition(index: number, location?: number): number {
		if (!$type.isNumber(location)) {
			location = 0.5;
		}

		let len = this.dataItems.length;

		let startLocation = this.get("startLocation", 0);
		let endLocation = this.get("endLocation", 1);

		len -= startLocation;
		len -= (1 - endLocation);

		let position = (index + location - startLocation) / len;

		let dataItem = this.dataItems[index];
		if (dataItem) {
			position += dataItem.get("deltaPosition", 0);
		}

		return position;
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
	 * Returns an index of the category that corresponds to specific pixel
	 * position within axis.
	 *
	 * @param position  Position (px)
	 * @return Category index
	 */
	public axisPositionToIndex(position: number): number {
		let len = this.dataItems.length;
		return $math.fitToRange(Math.floor(position * len), 0, len - 1);//$math.fitToRange(Math.floor((end - start) * len * position + len * start), 0, len - 1);
	}

	/**
	 * Returns text to be used in an axis tooltip for specific relative position.
	 *
	 * @param   position  Position
	 * @return            Tooltip text
	 */
	public getTooltipText(position: number, _adjustPosition?: boolean): string | undefined {
		//@todo number formatter + tag
		const dataItem = this.dataItems[this.axisPositionToIndex(position)];
		if (dataItem) {
			const label = dataItem.get("label")
			if (label) {
				return populateString(label, this.get("tooltipText", ""));
			}
		}
	}

	protected _updateTooltipText(tooltip: Tooltip, position: number) {
		tooltip._setDataItem(this.dataItems[this.axisPositionToIndex(position)]);
		tooltip.label.text.markDirtyText();
	}

	/**
	 * Returns a data item from series that is closest to the `position`.
	 *
	 * @param   series    Series
	 * @param   position  Relative position
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

	/**
	 * Zooms the axis to specific `start` and `end` indexes.
	 *
	 * Optional `duration` specifies duration of zoom animation in milliseconds.
	 *
	 * @param  start     Start index
	 * @param  end       End index
	 * @param  duration  Duration in milliseconds
	 */
	public zoomToIndexes(start: number, end: number, duration?: number) {
		let len = this.dataItems.length;
		this.zoom(start / len, end / len, duration);
	}

	public zoomToCategories(startCategory: string, endCategory: string, duration?: number) {
		this.zoomToIndexes(this.categoryToIndex(startCategory), this.categoryToIndex(endCategory) + 1, duration);
	}

	/**
	 * Returns position span between start and end of a single cell in axis.
	 *
	 * @since 5.2.30
	 * @return Position
	 */
	public getCellWidthPosition(): number {
		return this._frequency / this.dataItems.length / (this.get("end", 1) - this.get("start", 0));
	}
	
	/**
	 * @ignore
	 */	
	public nextPosition(count?:number){
		if(count == null){
			count = 1;
		}

		if(this.get("renderer").getPrivate("letter") == "Y"){
			count *= -1;
		}

		const position = this.getPrivate("tooltipPosition", 0);

		const index = $math.fitToRange(this.axisPositionToIndex(position) + count, 0, this.dataItems.length - 1);		
		return this.toGlobalPosition(this.indexToPosition(index));
	}
}
