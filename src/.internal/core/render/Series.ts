import { Component, IComponentSettings, IComponentPrivate, DataItem, IComponentEvents, IComponentDataItem } from "../../core/render/Component";
import { List } from "../../core/util/List";
import { Color } from "../../core/util/Color";
import { percentInterpolate } from "../../core/util/Animation";
import { Percent } from "../../core/util/Percent";
import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $time from "../../core/util/Time";
import type { Root } from "../../core/Root";
import { p100 } from "../../core/util/Percent";
import type { Chart } from "./Chart";
import type { Bullet } from "./Bullet";
import { Container } from "../../core/render/Container";
import type { Graphics } from "../../core/render/Graphics";
import type { ILegendDataItem } from "./Legend";
import type { Template } from "../../core/util/Template";
import type { Sprite } from "../../core/render/Sprite";
import { Label } from "../../core/render/Label";
//import { Animations } from "../../core/util/Animation";

/**
 * Defines interface for a heat rule.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/heat-rules/} for more info
 */
export interface IHeatRule {

	/**
	 * Target template.
	 */
	target: Template<any>;

	/**
	 * The setting value to use for items if the lowest value.
	 */
	min: any;

	/**
	 * The setting value to use for items if the highest value.
	 */
	max: any;

	/**
	 * Which data field to use when determining item's value.
	 */
	dataField: string;

	/**
	 * A setting key to set.
	 */
	key?: string;

	/**
	 * Custom lowest value.
	 */
	minValue?: number;

	/**
	 * Custom highest value.
	 */
	maxValue?: number;

	/**
	 * Use logarithmic scale when calculating intermediate setting values.
	 *
	 * @default false
	 */
	logarithmic?: boolean;

	/**
	 * A custom function that will set target element's settings.
	 *
	 * Can be used to do custom manipulation on complex objects requiring more
	 * than modifying a setting.
	 */
	customFunction?: (target: Sprite, minValue: number, maxValue: number, propertyValue?: any) => void;

}


export interface ISeriesDataItem extends IComponentDataItem {
	id?: string;

	value?: number;

	/**
	 * @ignore
	 */
	valueWorking?:number;

	valueChange?: number;
	valueChangePercent?: number;
	valueChangeSelection?: number;
	valueChangeSelectionPercent?: number;
	valueChangePrevious?: number;
	valueChangePreviousPercent?: number;

	/**
	 * @ignore
	 */
	valueWorkingOpen?: number;

	/**
	 * @ignore
	 */
	valueWorkingClose?: number;
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
	 * A key to look up in data for a numeric value of the data item.
	 *
	 * Some series use it to display its elements. It can also be used in heat
	 * rules.
	 */
	valueField?: string;

	/**
	 * A text template to be used for label in legend.
	 */
	legendLabelText?: string;

	/**
	 * A text template to be used for value label in legend.
	 */
	legendValueText?: string;

	/**
	 * If set to `true` the series initial animation will be played item by item
	 * rather than all at once.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Animation_of_series} for more info
	 */
	sequencedInterpolation?:boolean;

	/**
	 * A delay in milliseconds to wait before starting animation of next data
	 * item.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Animation_of_series} for more info
	 */
	sequencedDelay?:number;

	/**
	 * A list of heat rules to apply on series elements.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/heat-rules/} for more info
	 */
	heatRules?:IHeatRule[];

	/**
	 * If set to `true`, series will calculate aggregate values, e.g. change
	 * percent, high, low, etc.
	 *
	 * Do not enable unless you are using such aggregate values in tooltips,
	 * display data fields, heat rules, or similar.
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
	 * A data item representing series in a [[Legend]].
	 *
	 * @readonly
	 */
	legendDataItem?: DataItem<ILegendDataItem>;

}

export interface ISeriesPrivate extends IComponentPrivate {

	/**
	 * @ignore
	 */
	chart?: Chart;
	startIndex?: number;
	endIndex?: number;

	valueAverage?: number;
	valueCount?: number;
	valueSum?: number;
	valueAbsoluteSum?: number;
	valueLow?: number;
	valueHigh?: number;
	valueOpen?: number;
	valueClose?: number;
}

export interface ISeriesEvents extends IComponentEvents {

}

/**
 * A base class for all series.
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

	/**
	 * A chart series belongs to.
	 */
	public chart:Chart | undefined;

	/**
	 * List of bullets to use for the series.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/bullets/} for more info
	 */
	public bullets: List<<D extends DataItem<this["_dataItemSettings"]>>(root: Root, series:Series, dataItem: D) => Bullet | undefined> = new List();

	/**
	 * A [[Container]] series' bullets are stored in.
	 *
	 * @default Container.new()
	 */
	public readonly bulletsContainer: Container = Container.new(this._root, {isMeasured:false, width:p100, height:p100, position:"absolute"});

	protected _afterNew() {
		this.valueFields.push("value");

		super._afterNew();

		this._disposers.push(this.bullets.events.onAll((change) => {
			if (change.type === "clear") {
				this._handleBullets(this.dataItems);
			} else if (change.type === "push") {
				this._handleBullets(this.dataItems);
			} else if (change.type === "setIndex") {
				this._handleBullets(this.dataItems);
			} else if (change.type === "insertIndex") {
				this._handleBullets(this.dataItems);
			} else if (change.type === "removeIndex") {
				this._handleBullets(this.dataItems);
			} else if (change.type === "moveIndex") {
				this._handleBullets(this.dataItems);
			} else {
				throw new Error("Unknown IListEvent type");
			}
		}));
	}

	protected _dispose(){
		this.bulletsContainer.dispose(); // can be in a different parent
		super._dispose();
	}

	public startIndex() {
		return this.getPrivate("startIndex", 0);
	}

	public endIndex() {
		let len = this.dataItems.length;
		return Math.min(this.getPrivate("endIndex", len), len)
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

		this._markDirtyValues();
	}

	/**
	 * Looks up and returns a data item by its ID.
	 *
	 * @param   id  ID
	 * @return      Data item
	 */
	public getDataItemById(id: string): DataItem<this["_dataItemSettings"]> | undefined {
		return $array.find(this.dataItems, (dataItem: any) => {
			return dataItem.get("id") == id;
		})
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
			let sprite = bullet.get("sprite");

			if (sprite) {
				sprite._setDataItem(dataItem);
				sprite.setRaw("position", "absolute");
				this.bulletsContainer.children.push(sprite);
			}
			bullet._index = index;
			bullet.series = this;
			dataItem.bullets!.push(bullet);
		}
		return bullet;
	}

	public _clearDirty() {
		super._clearDirty();
		this._aggregatesCalculated = false;
		this._selectionAggregatesCalculated = false;
	}

	public _prepareChildren(){
		super._prepareChildren();

		let startIndex = this.startIndex();
		let endIndex = this.endIndex();

		const calculateAggregates = this.get("calculateAggregates");
		if(calculateAggregates){
			if (this._valuesDirty && !this._dataProcessed) {
				if (!this._aggregatesCalculated) {
					this._calculateAggregates(0, this.dataItems.length);
					this._aggregatesCalculated = true;
				}
			}

			if ((this._psi != startIndex || this._pei != endIndex) && !this._selectionAggregatesCalculated) {
				if (startIndex === 0 && endIndex === this.dataItems.length && this._aggregatesCalculated) {
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
			this.updateLegendMarker(undefined);
		}


		if (this.bullets.length > 0) {
			let startIndex = this.startIndex();
			let endIndex = this.endIndex();

			for (let i = startIndex; i < endIndex; i++) {
				let dataItem = this.dataItems[i];
				if (!dataItem.bullets) {
					this._makeBullets(dataItem);
				}
			}
		}

	}

	protected _calculateAggregates(startIndex: number, endIndex: number) {
		let fields = this._valueFields;

		if (!fields) {
			throw new Error("No value fields are set for the series.");
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

		$array.each(fields, (key) => {
			sum[key] = 0;
			absSum[key] = 0;
			count[key] = 0;
		})

		$array.each(fields, (key) => {
			let change = key + "Change";
			let changePercent = key + "ChangePercent";
			let changePrevious = key + "ChangePrevious";
			let changePreviousPercent = key + "ChangePreviousPercent";
			let changeSelection = key + "ChangeSelection";
			let ChangeSelectionPercent = key + "ChangeSelectionPercent";

			for (let i = startIndex; i < endIndex; i++) {
				const dataItem = this.dataItems[i];

				let value = dataItem.get(<any>key)

				if (value != null) {
					count[key]++;
					sum[key] += value;

					absSum[key] += Math.abs(value);

					average[key] = sum[key] / count[key];

					if (low[key] > value || low[key] == null) {
						low[key] = value;
					}
					if (high[key] < value || high[key] == null) {
						high[key] = value;
					}

					close[key] = value;

					if (open[key] == null) {
						open[key] = value;
						previous[key] = value;
					}

					if (startIndex === 0) {
						dataItem.setRaw(<any>(change), value - open[key]);
						dataItem.setRaw(<any>(changePercent), (value - open[key]) / open[key] * 100);
					}


					dataItem.setRaw(<any>(changePrevious), value - previous[key]);
					dataItem.setRaw(<any>(changePreviousPercent), (value - previous[key]) / previous[key] * 100);
					dataItem.setRaw(<any>(changeSelection), value - open[key]);
					dataItem.setRaw(<any>(ChangeSelectionPercent), (value - open[key]) / open[key] * 100);

					previous[key] = value;
				}
			}
		})

		$array.each(fields, (key) => {
			this.setPrivate(<any>(key + "AverageSelection"), average[key]);
			this.setPrivate(<any>(key + "CountSelection"), count[key]);
			this.setPrivate(<any>(key + "SumSelection"), sum[key]);
			this.setPrivate(<any>(key + "AbsoluteSumSelection"), absSum[key]);
			this.setPrivate(<any>(key + "LowSelection"), low[key]);
			this.setPrivate(<any>(key + "HighSelection"), high[key]);
			this.setPrivate(<any>(key + "OpenSelection"), open[key]);
			this.setPrivate(<any>(key + "CloseSelection"), close[key]);
		})

		if (startIndex === 0 && endIndex === this.dataItems.length) {
			$array.each(fields, (key) => {
				this.setPrivate(<any>(key + "Average"), average[key]);
				this.setPrivate(<any>(key + "Count"), count[key]);
				this.setPrivate(<any>(key + "Sum"), sum[key]);
				this.setPrivate(<any>(key + "AbsoluteSum"), absSum[key]);
				this.setPrivate(<any>(key + "Low"), low[key]);
				this.setPrivate(<any>(key + "High"), high[key]);
				this.setPrivate(<any>(key + "Open"), open[key]);
				this.setPrivate(<any>(key + "Close"), close[key]);
			})
		}
	}

	public _updateChildren() {
		super._updateChildren();

		this._psi = this.startIndex();
		this._pei = this.endIndex();

		// Apply heat rules
		if (this._valuesDirty && this.get("heatRules") != null) {
			const rules = this.get("heatRules", []);
			$array.each(rules, (rule) => {
				const minValue = rule.minValue || this.getPrivate(<any>(rule.dataField + "Low")) || 0;
				const maxValue = rule.maxValue || this.getPrivate(<any>(rule.dataField + "High")) || 0;

				$array.each(rule.target._entities, (target) => {
					const value = target.dataItem.get(rule.dataField);

					if (!$type.isNumber(value)) {
						return;
					}

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
					if ($type.isNumber(rule.min)) {
						propertyValue = rule.min + (rule.max - rule.min) * percent;
					}
					else if (rule.min instanceof Color) {
						propertyValue = Color.interpolate(percent, rule.min, rule.max);
					}
					else if (rule.min instanceof Percent) {
						propertyValue = percentInterpolate(percent, rule.min, rule.max);
					}

					if (rule.customFunction) {
						rule.customFunction.call(this, target, minValue, maxValue, propertyValue);
					}
					else {
						target.set(rule.key, propertyValue);
					}
				});
			});
		}

		if (this.bullets.length > 0) {
			let count = this.dataItems.length;
			let startIndex = this.startIndex();
			let endIndex = this.endIndex();

			if(endIndex < count){
				endIndex++;
			}
			if(startIndex > 0){
				startIndex--;
			}

			for (let i = 0; i < startIndex; i++) {
				this._hideBullets(this.dataItems[i]);
			}

			for (let i = startIndex; i < endIndex; i++) {
				this._positionBullets(this.dataItems[i]);
			}

			for (let i = endIndex; i < count; i++) {
				this._hideBullets(this.dataItems[i]);
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
		const bullets = dataItem.bullets;

		if(bullets){
			$array.each(bullets, (bullet)=>{
				bullet.dispose();
			})
		}
	}

	protected _getItemReaderLabel(): string {
		return "";
	}

	/**
	 * Shows series's data item.
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
				promises.push(bullet.get("sprite").show(duration));
			})
		}
		await Promise.all(promises);
	}

	/**
	 * Hides series's data item.
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
				promises.push(bullet.get("sprite").hide(duration));
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
	public updateLegendValue(dataItem: DataItem<this["_dataItemSettings"]>) {
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
	public hoverDataItem(_dataItem: DataItem<this["_dataItemSettings"]>) {
	}

	/**
	 * @ignore
	 */
	public unhoverDataItem(_dataItem: DataItem<this["_dataItemSettings"]>) {
	}
}
