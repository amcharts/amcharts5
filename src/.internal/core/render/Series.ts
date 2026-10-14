import type { Root } from "../../core/Root";
import type { Chart } from "./Chart";
import type { Bullet } from "./Bullet";
import type { Graphics } from "../../core/render/Graphics";
import type { ILegendDataItem } from "./Legend";
import type { Template } from "../../core/util/Template";
import type { Sprite } from "../../core/render/Sprite";
import type { Pattern } from "./patterns/Pattern";
import type { Gradient } from "./gradients/Gradient";

import { Component, IComponentSettings, IComponentPrivate, DataItem, IComponentEvents, IComponentDataItem } from "../../core/render/Component";
import { List } from "../../core/util/List";
import { Color } from "../../core/util/Color";
import { percentInterpolate } from "../../core/util/Animation";
import { Percent } from "../../core/util/Percent";
import { p100 } from "../../core/util/Percent";
import { Container } from "../../core/render/Container";
import { Label } from "../../core/render/Label";
//import { Animations } from "../../core/util/Animation";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $time from "../../core/util/Time";

/**
 * A rule that sets a setting of each series element, such as its color or
 * size, by its data item's value: from `min` at the lowest value to `max` at
 * the highest.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/heat-rules/} for more info
 */
export interface IHeatRule {

	/**
	 * Template of the elements to set, e.g. `series.columns.template`.
	 */
	target: Template<any>;

	/**
	 * Setting value for the element with the lowest value.
	 */
	min?: any;

	/**
	 * Setting value for the element with the highest value.
	 */
	max?: any;

	/**
	 * Setting value for elements whose data item has no value.
	 */
	neutral?: any;

	/**
	 * Setting values for a scale through more than two, in place of `min` and
	 * `max`: the element with the lowest value gets the first, the one with
	 * the highest the last, and the ones between blend through the stops
	 * between. Numbers, percents or colors, all of one kind, e.g.
	 * `[negative, warning, positive]` from the interface colors. Values
	 * outside `minValue` and `maxValue` get the first or last stop.
	 *
	 * @since 5.21.2
	 */
	stops?: Array<any>;

	/**
	 * Data item field that holds the value, e.g. `"value"` or `"valueY"`.
	 */
	dataField: string;

	/**
	 * The setting to set, e.g. `"fill"`.
	 */
	key?: string;

	/**
	 * Lowest value of the range. If not set, the series' lowest value is used,
	 * which needs `calculateAggregates`.
	 */
	minValue?: number;

	/**
	 * Highest value of the range. If not set, the series' highest value is
	 * used, which needs `calculateAggregates`.
	 */
	maxValue?: number;

	/**
	 * Spreads the values between `min` and `max` on a logarithmic scale.
	 *
	 * @default false
	 */
	logarithmic?: boolean;

	/**
	 * A function that sets the element's settings itself, in place of `min`,
	 * `max` and `key`. It is called for each element, also for one with no
	 * value.
	 */
	customFunction?: (target: Sprite, minValue: number, maxValue: number, value?: any) => void;

}


// A value on a scale through `stops`, spread evenly, as `min` and `max` blend
function interpolateStops(position: number, stops: Array<any>): any {
	const last = stops.length - 1;
	if (last < 1) {
		return stops[0];
	}
	const at = (position > 0 ? Math.min(1, position) : 0) * last;
	const index = Math.min(Math.floor(at), last - 1);
	const from = stops[index];
	const to = stops[index + 1];
	const t = at - index;
	if ($type.isNumber(from)) {
		return from + (to - from) * t;
	}
	else if (from instanceof Color) {
		return Color.interpolate(t, from, to);
	}
	else if (from instanceof Percent) {
		return percentInterpolate(t, from, to);
	}
}

export interface ISeriesDataItem extends IComponentDataItem {
	id?: string;

	/**
	 * A URL to open when the data item's element is clicked.
	 *
	 * @since 5.20.7
	 */
	url?: string;
	value?: number;
	valueWorking?:number;
	valueChange?: number;
	valueChangePercent?: number;
	valueChangeSelection?: number;
	valueChangeSelectionPercent?: number;
	valueChangePrevious?: number;
	valueChangePreviousPercent?: number;
	valueWorkingOpen?: number;
	valueWorkingClose?: number;

	customValue?: number;
	customValueWorking?:number;
	customValueChange?: number;
	customValueChangePercent?: number;
	customValueChangeSelection?: number;
	customValueChangeSelectionPercent?: number;
	customValueChangePrevious?: number;
	customValueChangePreviousPercent?: number;
}

export interface ISeriesSettings extends IComponentSettings {

	/**
	 * Name of the series.
	 */
	name?: string;

	/**
	 * A key to look up in data for an id of the data item.
	 */
	idField?: string;

	/**
	 * A key to look up in data for a URL to open when the data item's element
	 * (a bullet, column, slice, map polygon or map line) is clicked. Links are
	 * off until this is set.
	 *
	 * @since 5.20.7
	 */
	urlField?: string;

	/**
	 * Where a data item's URL opens: `"_self"` for the same window, `"_blank"`
	 * for a new tab, or a named window / frame. A chart embedded in an iframe
	 * usually wants `"_blank"` or `"_top"`.
	 *
	 * @default "_self"
	 * @since 5.20.7
	 */
	linkTarget?: string;

	/**
	 * A key to look up in data for a numeric value of the data item. Some
	 * series draw their elements by it; heat rules can use it too.
	 */
	valueField?: string;

	/**
	 * A key to look up in data for an extra numeric value of the data item
	 * (`customValue`), e.g. for heat rules.
	 */
	customValueField?: string;

	/**
	 * Text template for the item's label in a [[Legend]].
	 */
	legendLabelText?: string;

	/**
	 * Text template for the item's value label in a [[Legend]].
	 */
	legendValueText?: string;

	/**
	 * Shows and hides the data items one after another instead of all at
	 * once, including in the initial animation. Works in XY and percent
	 * series.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Animation_of_series} for more info
	 */
	sequencedInterpolation?:boolean;

	/**
	 * Extra delay in milliseconds between the animations of consecutive data
	 * items, with `sequencedInterpolation`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Animation_of_series} for more info
	 */
	sequencedDelay?:number;

	/**
	 * Heat rules to apply to the series' elements. A rule without `minValue`
	 * and `maxValue` needs `calculateAggregates` to find the value range.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/heat-rules/} for more info
	 */
	heatRules?:IHeatRule[];

	/**
	 * Makes the series compute aggregate values, such as sums, averages, lows,
	 * highs and changes.
	 *
	 * Enable it only if they are used, e.g. in tooltips, data fields or heat
	 * rules.
	 */
	calculateAggregates?: boolean;

	/**
	 * Series stroke color.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Series_colors} for more info
	 */
	stroke?: Color;

	/**
	 * Series fill color.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Series_colors} for more info
	 */
	fill?: Color;

	/**
	 * Series fill pattern.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
	 * @since 5.10.0
	 */
	fillPattern?: Pattern;

	/**
	 * Series fill gradient.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more info
	 */
	fillGradient?: Gradient;

	/**
	 * Series stroke gradient.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more info
	 */
	strokeGradient?: Gradient;

	/**
	 * The series' data item in a [[Legend]].
	 *
	 * @readonly
	 */
	legendDataItem?: DataItem<ILegendDataItem>;

	/**
	 * Fields to leave out of `calculateAggregates`, to save work where their
	 * aggregates are not needed.
	 *
	 * @since 5.14.4
	 */
	excludeFromAggregate?: Array<string>;
}

export interface ISeriesPrivate extends IComponentPrivate {

	/**
	 * @ignore
	 */
	chart?: Chart;
	startIndex?: number;
	endIndex?: number;
	adjustedStartIndex?:number;

	/**
	 * Average of all data items' values (with `calculateAggregates`).
	 */
	valueAverage?: number;
	/**
	 * Number of data items with a value (with `calculateAggregates`).
	 */
	valueCount?: number;
	/**
	 * Sum of all data items' values (with `calculateAggregates`).
	 */
	valueSum?: number;
	/**
	 * Sum of the absolute values of all data items (with `calculateAggregates`).
	 */
	valueAbsoluteSum?: number;
	/**
	 * Lowest value of all data items (with `calculateAggregates`).
	 */
	valueLow?: number;
	/**
	 * Highest value of all data items (with `calculateAggregates`).
	 */
	valueHigh?: number;
	/**
	 * Value of the first data item that has one (with `calculateAggregates`).
	 */
	valueOpen?: number;
	/**
	 * Value of the last data item that has one (with `calculateAggregates`).
	 */
	valueClose?: number;

	customValueAverage?: number;
	customValueCount?: number;
	customValueSum?: number;
	customValueAbsoluteSum?: number;
	customValueLow?: number;
	customValueHigh?: number;
	customValueOpen?: number;
	customValueClose?: number;

	baseValueSeries?: Series;
}

export interface ISeriesEvents extends IComponentEvents {

}

/**
 * Base class of all series.
 */
export abstract class Series extends Component {
	public static className: string = "Series";
	public static classNames: Array<string> = Component.classNames.concat([Series.className]);

	declare public _settings: ISeriesSettings;
	declare public _privateSettings: ISeriesPrivate;
	declare public _dataItemSettings: ISeriesDataItem;
	declare public _events: ISeriesEvents;

	protected _aggregatesCalculated: boolean = false;
	protected _selectionAggregatesCalculated: boolean = false;
	protected _dataProcessed: boolean = false;

	protected _psi: number | undefined;
	protected _pei: number | undefined;

	protected _baseSeriesDirty: boolean = false;

	/**
	 * The chart the series belongs to.
	 */
	public chart:Chart | undefined;

	/**
	 * Functions that make the series' bullets: each is called for every data
	 * item and returns a [[Bullet]], or nothing for no bullet.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/bullets/} for more info
	 */
	public bullets: List<<D extends DataItem<this["_dataItemSettings"]>>(root: Root, series:Series, dataItem: D) => Bullet | undefined> = new List();

	/**
	 * The [[Container]] that holds the series' bullets.
	 */
	public readonly bulletsContainer: Container = Container.new(this._root, {width:p100, height:p100, position:"absolute"})._markC("width", "height", "position");

	protected _afterNew() {
		this.valueFields.push("value", "customValue");
		this.fields.push("url");

		super._afterNew();

		this.setPrivate("customData", {});

		this._disposers.push(this.bullets.events.onAll(() => {
			this._handleBullets(this.dataItems);
		}));
	}

	protected _dispose(){
		this.bulletsContainer.dispose(); // can be in a different parent
		super._dispose();
	}

	/**
	 * Returns the index of the first data item in the visible range.
	 */
	public startIndex():number {
		let len = this.dataItems.length;
		return Math.min(this.getPrivate("startIndex", 0), len);
	}

	/**
	 * Returns the index after the last data item in the visible range.
	 */
	public endIndex():number {
		let len = this.dataItems.length;
		return Math.max(0, Math.min(this.getPrivate("endIndex", len), len));
	}

	protected _handleBullets(dataItems:Array<DataItem<this["_dataItemSettings"]>>){
		$array.each(dataItems, (dataItem)=>{
			const bullets = dataItem.bullets;
			if(bullets){
				$array.each(bullets, (bullet)=>{
					bullet.dispose();
				})

				dataItem.bullets = undefined;
			}
		})

		this.markDirtyValues();
	}


	protected _makeBullets(dataItem: DataItem<this["_dataItemSettings"]>) {
		if(this._shouldMakeBullet(dataItem)){
			dataItem.bullets = [];

			this.bullets.each((bulletFunction) => {
				this._makeBullet(dataItem, bulletFunction);
			})
		}
	}

	protected _shouldMakeBullet(_dataItem: DataItem<this["_dataItemSettings"]>):boolean{
		return true;
	}

	protected _makeBullet(dataItem: DataItem<this["_dataItemSettings"]>, bulletFunction:(root: Root, series:Series, dataItem: DataItem<this["_dataItemSettings"]>) => Bullet | undefined, index?:number):Bullet | undefined{
		const bullet = bulletFunction(this._root, this, dataItem);
		if(bullet){
			bullet._index = index;
			this._makeBulletReal(dataItem, bullet);
		}
		return bullet;
	}

	/**
	 * Container a data item's bullets are added to. Series that lay their data
	 * items out as separate containers can put bullets into the item itself, so
	 * that they move with it and can be stacked among its other children.
	 */
	protected _getBulletContainer(_dataItem: DataItem<this["_dataItemSettings"]>): Container {
		return this.bulletsContainer;
	}

	protected _makeBulletReal(dataItem: DataItem<this["_dataItemSettings"]>, bullet:Bullet){
		let sprite = bullet.get("sprite");

		if (sprite) {
			sprite._setDataItem(dataItem);
			sprite.setRaw("position", "absolute");

			this._applyBulletDefaultPaint(sprite, dataItem);
			this._linkSprite(sprite, dataItem);

			this._getBulletContainer(dataItem).children.push(sprite);
		}
		bullet.series = this;
		dataItem.bullets!.push(bullet);
	}

	/**
	 * Makes an element open its data item's URL when clicked.
	 *
	 * @ignore
	 */
	public _linkSprite(sprite: Sprite, dataItem: DataItem<this["_dataItemSettings"]>) {
		// the url can come or go later (setIndex, urlField set), so the click and pointer follow it
		let clicking = false;
		const sync = (url: string | undefined) => {
			if (url && !clicking) {
				clicking = true;
				sprite.events.on("click", () => {
					this.openUrl(dataItem);
				});
			}
			// a cursor someone chose stays; only the library's own pointer follows the url
			if (sprite.isUserSetting("cursorOverStyle") && !sprite.isComputedSetting("cursorOverStyle")) {
				return;
			}
			if (url) {
				sprite._setC("cursorOverStyle", "pointer");
			}
			else if (sprite.get("cursorOverStyle") == "pointer") {
				sprite.remove("cursorOverStyle");
			}
		};
		sync(dataItem.get("url"));
		sprite.addDisposer(dataItem.on("url", (url) => sync(url)));
	}

	/**
	 * Opens a data item's URL in the window set by `linkTarget`.
	 *
	 * Override to intercept links, e.g. in an editor.
	 *
	 * @param  dataItem  Data item
	 * @since 5.20.7
	 */
	public openUrl(dataItem: DataItem<this["_dataItemSettings"]>) {
		const url = dataItem.get("url");
		// a script url would run code in the chart's page, not go anywhere
		if (url && !/^(javascript|data|vbscript):/i.test(String(url).replace(/[\s\x00-\x1f]/g, ""))) {
			const target = this.get("linkTarget", "_self");
			window.open(url, target, target == "_blank" ? "noopener" : undefined);
		}
	}

	/**
	 * A bullet whose shape defines none of its own paint inherits the full set
	 * from the series, so bullets match their series without restating the color
	 * (like columns do). It's all-or-nothing: if the bullet sets even one of
	 * `fill`/`fillGradient`/`fillPattern`/`stroke`/`strokeGradient`, it is left
	 * entirely alone. Only `Graphics`-based shapes are touched; container/label/
	 * picture bullets are left to style their own children.
	 *
	 * @ignore
	 */
	public _applyBulletDefaultPaint(sprite: Sprite, dataItem?: DataItem<this["_dataItemSettings"]>) {
		if (sprite.isType<Graphics>("Graphics")) {
			const unstyled = sprite.get("fill") == null
				&& sprite.get("fillGradient") == null
				&& sprite.get("fillPattern") == null
				&& sprite.get("stroke") == null
				&& sprite.get("strokeGradient") == null;

			if (unstyled) {
				// pie slices, flow nodes and hierarchy nodes hold their color on the data item
				const itemFill = dataItem ? (dataItem as any).get("fill") : undefined;

				sprite.set("fill", itemFill != null ? itemFill : this.get("fill"));
				sprite.set("fillGradient", this.get("fillGradient"));
				sprite.set("fillPattern", this.get("fillPattern"));
				sprite.set("stroke", this.get("stroke"));
				sprite.set("strokeGradient", this.get("strokeGradient"));
			}
		}
	}

	/**
	 * Adds a bullet to one data item. Unlike `series.bullets`, it takes a
	 * [[Bullet]] instance, not a function.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/bullets/#Adding_directly_to_data_item} for more info
	 * @since 5.6.0
	 *
	 * @param  dataItem  Target data item
	 * @param  bullet    Bullet instance
	 */
	public addBullet(dataItem:DataItem<this["_dataItemSettings"]>, bullet:Bullet){
		if(!dataItem.bullets){
			dataItem.bullets = [];
		}
		if(bullet){
			this._makeBulletReal(dataItem, bullet);
		}
	}

	// autoAppear waits for data: a series that gets it later grows when it does
	protected _autoAppearReady(): boolean {
		return this.dataItems.length > 0;
	}

	public _clearDirty() {
		super._clearDirty();
		this._aggregatesCalculated = false;
		this._baseSeriesDirty = false;
		this._selectionAggregatesCalculated = false;
	}

	public _prepareChildren(){
		super._prepareChildren();

		const dataItems = this.dataItems;
		const count = dataItems.length;

		let startIndex = this.startIndex();
		let endIndex = this.endIndex();

		// links switched on, off or moved to another field after the items exist
		if (this.isDirty("urlField")) {
			this._updateFields();
			const urlField = this.get("urlField");
			$array.each(dataItems, (dataItem) => {
				const context: any = dataItem.dataContext;
				dataItem.set("url", urlField && context ? context[urlField] : undefined);
			});
		}

		if(this.isDirty("name")){
			this.updateLegendValue();
		}

		if(this.isDirty("heatRules")){
			this._valuesDirty = true;
		}

		if(this.isPrivateDirty("baseValueSeries")){
			const baseValueSeries = this.getPrivate("baseValueSeries");
			if(baseValueSeries){
				this._disposers.push(baseValueSeries.onPrivate("startIndex", ()=>{
					this._baseSeriesDirty = true;
					this.markDirtyValues();
				}))
			}
		}

		const calculateAggregates = this.get("calculateAggregates");
		if(calculateAggregates){
			if (this._valuesDirty && !this._dataProcessed) {
				if (!this._aggregatesCalculated) {
					this._calculateAggregates(0, count);
					this._aggregatesCalculated = true;
					if(startIndex != 0){
						this._psi = undefined;
					}
				}
			}

			if ((this._psi != startIndex || this._pei != endIndex || this.isPrivateDirty("adjustedStartIndex")) && !this._selectionAggregatesCalculated) {
				if (startIndex === 0 && endIndex === count && this._aggregatesCalculated) {
					// void
				}
				else {
					this._calculateAggregates(startIndex, endIndex);
				}
				this._selectionAggregatesCalculated = true;
			}
		}

		if(this.isDirty("tooltip")){
			let tooltip = this.get("tooltip");
			if(tooltip){
				tooltip.hide(0);
				tooltip.set("tooltipTarget", this);
			}
		}

		if (this.isDirty("fill") || this.isDirty("stroke")) {

			let markerRectangle: Graphics | undefined;
			const legendDataItem = this.get("legendDataItem");
			if (legendDataItem) {
				markerRectangle = legendDataItem.get("markerRectangle");

				if (markerRectangle) {
					if(this.isVisible()){
						if (this.isDirty("stroke")) {
							let stroke = this.get("stroke");
							markerRectangle.set("stroke", stroke);
						}
						if (this.isDirty("fill")) {
							let fill = this.get("fill");
							markerRectangle.set("fill", fill);
						}
					}
				}
			}
			this.updateLegendMarker(undefined);
		}


		if (this.bullets.length > 0) {
			let startIndex = this.startIndex();
			let endIndex = this.endIndex();

			if(endIndex < count){
				endIndex++;
			}

			for (let i = startIndex; i < endIndex; i++) {
				let dataItem = dataItems[i];
				if (!dataItem.bullets) {
					this._makeBullets(dataItem);
				}
			}
		}

	}

	public _handleRemoved(){

	}

	/**
	 * @ignore
	 */
	public _adjustStartIndex(index:number):number{
		return index;
	}

	protected _calculateAggregates(startIndex: number, endIndex: number) {

		let fields = this._valueFields;
		if (!fields) {
			throw new Error("No value fields are set for the series.");
		}

		const excludeFromAggregate = this.get("excludeFromAggregate");
		if(excludeFromAggregate){
			fields = fields.filter((field)=>{
				return excludeFromAggregate.indexOf(field) == -1;
			});
		}

		const sum: { [index: string]: number } = {};
		const absSum: { [index: string]: number } = {};
		const count: { [index: string]: number } = {};
		const low: { [index: string]: number } = {};
		const high: { [index: string]: number } = {};
		const open: { [index: string]: number } = {};
		const close: { [index: string]: number } = {};
		const average: { [index: string]: number } = {};
		const previous: { [index: string]: number } = {};

		for(let f = 0, flen = fields.length; f < flen; f++){
			let key = fields[f];
			sum[key] = 0;
			absSum[key] = 0;
			count[key] = 0;
		}

		const dataItems = this.dataItems;
		const len = dataItems.length;

		for(let f = 0, flen = fields.length; f < flen; f++){
			let key = fields[f];
			let change = key + "Change";
			let changePercent = key + "ChangePercent";
			let changePrevious = key + "ChangePrevious";
			let changePreviousPercent = key + "ChangePreviousPercent";
			let changeSelection = key + "ChangeSelection";
			let changeSelectionPercent = key + "ChangeSelectionPercent";

			let openKey = key;

			if (key === "valueX" || key.endsWith("ValueX")) {
				openKey = "valueX";
			}
			else if (key === "valueY" || key.endsWith("ValueY")) {
				openKey = "valueY";
			}

			const baseValueSeries = this.getPrivate("baseValueSeries");
			const adjustedStartIndex = this.getPrivate("adjustedStartIndex", startIndex);

			const calculateChangesForItem = (dataItem: any, value:number, key: string) => {
				if (startIndex === 0) {
					const openValue = open[openKey];
					const changeValue = value - openValue;
					dataItem.setRaw(<any>(change), changeValue);
					dataItem.setRaw(<any>(changePercent), changeValue / openValue * 100);
				}

				const changePreviousValue = value - previous[openKey];
				const changeSelectionValue = value - open[openKey];
				dataItem.setRaw(<any>(changePrevious), changePreviousValue);
				dataItem.setRaw(<any>(changePreviousPercent), changePreviousValue / previous[openKey] * 100);
				dataItem.setRaw(<any>(changeSelection), changeSelectionValue);
				dataItem.setRaw(<any>(changeSelectionPercent), changeSelectionValue / open[openKey] * 100);
				previous[key] = value;
			};

			// find first non-null value to initialize open, low, high instead of checking in loop
			for (let i = adjustedStartIndex; i < endIndex; i++) {
				const dataItem = dataItems[i];
				if(dataItem){
					let value = dataItem.get(<any>key)
					if(value != null){
						if(low[key] == null){
							low[key] = value;
						}
						if(high[key] == null){
							high[key] = value;
						}

						if (open[key] == null) {
							open[key] = value;
							previous[key] = value;

							if(baseValueSeries){
								open[openKey] = baseValueSeries._getBase(openKey);
							}
						}

						// stop cycle
						break;
					}
				}
			}


			for (let i = adjustedStartIndex; i < endIndex; i++) {
				const dataItem = dataItems[i];
				if(dataItem){
					let value = (dataItem._settings as any)[key];

					if (value != null) {
						count[key]++;
						sum[key] += value;

						absSum[key] += Math.abs(value);

						if (low[key] > value) {
							low[key] = value;
						}
						if (high[key] < value) {
							high[key] = value;
						}

						close[key] = value;
						calculateChangesForItem(dataItem, value, key);
					}
				}
			}

			average[key] = sum[key] / count[key];

			if (endIndex < len) {
				const dataItem = dataItems[endIndex];
				if(dataItem){
					let value = dataItem.get(<any>key);
					if(value != null){
						calculateChangesForItem(dataItem, value, key);
					}
				}
			}

			if (endIndex + 1 < len) {
				const dataItem = dataItems[endIndex + 1];
				if(dataItem){
					let value = dataItem.get(<any>key);
					if(value != null){
						calculateChangesForItem(dataItem, value, key);
					}
				}
			}

			if (startIndex > 0) {
				startIndex--;
			}

			delete previous[key];

			for (let i = startIndex; i < adjustedStartIndex; i++) {
				const dataItem = dataItems[i];
				if(dataItem) {
					let value = dataItem.get(<any>key);

					if (previous[key] == null) {
						previous[key] = value;
					}

					if (value != null) {
						calculateChangesForItem(dataItem, value, key);
					}
				}
			}
		}

		for(let f = 0, flen = fields.length; f < flen; f++){
			let key = fields[f];
			this.setPrivate(<any>(key + "AverageSelection"), average[key]);
			this.setPrivate(<any>(key + "CountSelection"), count[key]);
			this.setPrivate(<any>(key + "SumSelection"), sum[key]);
			this.setPrivate(<any>(key + "AbsoluteSumSelection"), absSum[key]);
			this.setPrivate(<any>(key + "LowSelection"), low[key]);
			this.setPrivate(<any>(key + "HighSelection"), high[key]);
			this.setPrivate(<any>(key + "OpenSelection"), open[key]);
			this.setPrivate(<any>(key + "CloseSelection"), close[key]);
		}

		if (startIndex === 0 && endIndex === len) {
			for(let f = 0, flen = fields.length; f < flen; f++){
				let key = fields[f];
				this.setPrivate(<any>(key + "Average"), average[key]);
				this.setPrivate(<any>(key + "Count"), count[key]);
				this.setPrivate(<any>(key + "Sum"), sum[key]);
				this.setPrivate(<any>(key + "AbsoluteSum"), absSum[key]);
				this.setPrivate(<any>(key + "Low"), low[key]);
				this.setPrivate(<any>(key + "High"), high[key]);
				this.setPrivate(<any>(key + "Open"), open[key]);
				this.setPrivate(<any>(key + "Close"), close[key]);
			}
		}
	}

	public _updateChildren() {
		super._updateChildren();

		this._psi = this.startIndex();
		this._pei = this.endIndex();

		if(this.isDirty("visible")){
			this.bulletsContainer._setC("visible", this.get("visible"));
		}


		// Apply heat rules
		const rules = this.get("heatRules");

		if (this._valuesDirty && rules && rules.length > 0) {
			$array.each(rules, (rule) => {
				const minValue = $type.isNumber(rule.minValue) ? rule.minValue : (this.getPrivate(<any>(rule.dataField + "Low")) || 0);
				const maxValue = $type.isNumber(rule.maxValue) ? rule.maxValue : (this.getPrivate(<any>(rule.dataField + "High")) || 0);

				$array.each(rule.target._entities, (target) => {

					const value = target.dataItem.get(rule.dataField);

					if (!$type.isNumber(value)) {
						if(rule.neutral){
							target._setC(rule.key, rule.neutral);
						}

						const states = target.states;
						if(states){
							const defaultState = states.lookup("default");
							if(defaultState && rule.neutral){
								defaultState._setC(rule.key, rule.neutral);
							}
						}
						if(!rule.customFunction){
							return;
						}
					}

					if (rule.customFunction) {
						rule.customFunction.call(this, target, minValue, maxValue, value);
					}
					else {
						let percent: number;
						if (rule.logarithmic) {
							percent = (Math.log(value) * Math.LOG10E - Math.log(minValue) * Math.LOG10E) / ((Math.log(maxValue) * Math.LOG10E - Math.log(minValue) * Math.LOG10E));
						}
						else {
							percent = (value - minValue) / (maxValue - minValue);
						}

						if ($type.isNumber(value) && (!$type.isNumber(percent) || Math.abs(percent) == Infinity)) {
							percent = 0.5;
						}

						// fixes problems if all values are the same
						let propertyValue;
						if (rule.stops && rule.stops.length) {
							propertyValue = interpolateStops(percent, rule.stops);
						}
						else if ($type.isNumber(rule.min)) {
							propertyValue = rule.min + (rule.max - rule.min) * percent;
						}
						else if (rule.min instanceof Color) {
							propertyValue = Color.interpolate(percent, rule.min, rule.max);
						}
						else if (rule.min instanceof Percent) {
							propertyValue = percentInterpolate(percent, rule.min, rule.max);
						}

						target._setC(rule.key, propertyValue);
						const states = target.states;
						if(states){
							const defaultState = states.lookup("default");
							if(defaultState){
								defaultState._setC(rule.key, propertyValue);
							}
						}
					}
				});
			});
		}

		if(this.get("visible")){
			const dataItems = this.dataItems;
			let count = dataItems.length;
			let startIndex = this.startIndex();
			let endIndex = this.endIndex();

			if(endIndex < count){
				endIndex++;
			}
			if(startIndex > 0){
				startIndex--;
			}

			for (let i = 0; i < startIndex; i++) {
				this._hideBullets(dataItems[i]);
			}

			for (let i = startIndex; i < endIndex; i++) {
				this._positionBullets(dataItems[i]);
			}

			for (let i = endIndex; i < count; i++) {
				this._hideBullets(dataItems[i]);
			}
		}
	}

	public _positionBullets(dataItem: DataItem<this["_dataItemSettings"]>){
		if(dataItem.bullets){
			$array.each(dataItem.bullets, (bullet) => {
				this._positionBullet(bullet);
				const sprite = bullet.get("sprite");

				if(bullet.get("dynamic")){

					if(sprite){
						sprite._markDirtyKey("fill" as any);
						sprite.markDirtySize();
					}
					if(sprite instanceof Container){
						sprite.walkChildren((child)=>{
							child._markDirtyKey("fill" as any);
							child.markDirtySize();

							if(child instanceof Label){
								child.text.markDirtyText();
							}
						})
					}
				}
				if(sprite instanceof Label && sprite.get("populateText" as any)){
					sprite.text.markDirtyText();
				}
			})
		}
	}

	protected _hideBullets(dataItem: DataItem<this["_dataItemSettings"]>) {
		if (dataItem.bullets) {
			$array.each(dataItem.bullets, (bullet) => {
				let sprite = bullet.get("sprite");
				if (sprite) {
					sprite.setPrivate("visible", false);
				}
			})
		}
	}

	public _positionBullet(_bullet: Bullet) {
	}

	public _placeBulletsContainer(chart:Chart){
		chart.bulletsContainer.children.moveValue(this.bulletsContainer);
	}

	public _removeBulletsContainer(){
		const bulletsContainer = this.bulletsContainer;
		if(bulletsContainer.parent){
			bulletsContainer.parent.children.removeValue(bulletsContainer)
		}
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		//super.disposeDataItem(dataItem); // does nothing

		const bullets = dataItem.bullets;

		if(bullets){
			$array.each(bullets, (bullet)=>{
				bullet.dispose();
			})
			dataItem.bullets = undefined;
		}
	}

	protected _getItemReaderLabel(): string {
		return "";
	}

	/**
	 * Shows a data item and its bullets.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.showDataItem(dataItem, duration)];
		const bullets = dataItem.bullets;
		if(bullets){
			$array.each(bullets, (bullet)=>{
				const sprite = bullet.get("sprite");
				if(sprite){
					promises.push(sprite.show(duration));
				}
			})
		}
		await Promise.all(promises);
	}

	/**
	 * Hides a data item and its bullets.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.hideDataItem(dataItem, duration)];
		const bullets = dataItem.bullets;
		if(bullets){
			$array.each(bullets, (bullet)=>{
				const sprite = bullet.get("sprite");
				if(sprite){
					promises.push(sprite.hide(duration));
				}
			})
		}
		await Promise.all(promises);
	}


	protected async _sequencedShowHide(show: boolean, duration?: number): Promise<void> {
		if (this.get("sequencedInterpolation")) {

			if (!$type.isNumber(duration)) {
				duration = this.get("interpolationDuration", 0);
			}

			if (duration > 0) {
				const startIndex = this.startIndex();
				const endIndex = this.endIndex();

				await Promise.all($array.map(this.dataItems, async (dataItem, i) => {
					let realDuration = duration || 0;

					if (i < startIndex - 10 || i > endIndex + 10) {
						realDuration = 0;
					}

					//let delay = this.get("sequencedDelay", 0) * i + realDuration * (i - startIndex) / (endIndex - startIndex);
					let delay = this.get("sequencedDelay", 0) + realDuration / (endIndex - startIndex);

					await $time.sleep(delay * (i - startIndex));

					if (show) {
						await this.showDataItem(dataItem, realDuration);
					}
					else {
						await this.hideDataItem(dataItem, realDuration);
					}
				}));
			}
			else {
				await Promise.all($array.map(this.dataItems, (dataItem) => {
					if (show) {
						return this.showDataItem(dataItem, 0);
					}
					else {
						return this.hideDataItem(dataItem, 0);
					}
				}));
			}
		}
	}

	/**
	 * @ignore
	 */
	public updateLegendValue(dataItem?: DataItem<this["_dataItemSettings"]>) {
		if(dataItem){
			const legendDataItem = dataItem.get("legendDataItem" as any) as DataItem<ILegendDataItem>;

			if (legendDataItem) {
				const valueLabel = legendDataItem.get("valueLabel");
				if (valueLabel) {
					const text = valueLabel.text;
					let txt = "";
					valueLabel._setDataItem(dataItem);
					txt = this.get("legendValueText", text.get("text", ""));

					valueLabel.set("text", txt);
					text.markDirtyText();
				}

				const label = legendDataItem.get("label");
				if (label) {
					const text = label.text;
					let txt = "";
					label._setDataItem(dataItem);
					txt = this.get("legendLabelText", text.get("text", ""));

					label.set("text", txt);
					text.markDirtyText();
				}
			}
		}
	}

	/**
	 * @ignore
	 */
	public updateLegendMarker(_dataItem?: DataItem<this["_dataItemSettings"]>) {
	}

	protected _onHide(){
		super._onHide();

		const tooltip = this.getTooltip();
		if(tooltip){
			tooltip.hide();
		}
	}

	/**
	 * @ignore
	 */
	public hoverDataItem(_dataItem: DataItem<this["_dataItemSettings"]>) {}

	/**
	 * @ignore
	 */
	public unhoverDataItem(_dataItem: DataItem<this["_dataItemSettings"]>) {}

	/**
	 * @ignore
	 */
	public _getBase(key: any): number {
		const dataItem = this.dataItems[this.startIndex()];
		if (dataItem) {
			return dataItem.get(key);
		}
		return 0;
	}
}
