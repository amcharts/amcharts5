import { Settings } from "../util/Entity";
import { Container, IContainerSettings, IContainerPrivate, IContainerEvents } from "./Container";
import { ListData } from "../util/Data";
import * as $array from "../util/Array";
import * as $object from "../util/Object";
import type * as $ease from "../util/Ease";
import type { Bullet } from "./Bullet";
import type { Sprite } from "./Sprite";

/**
 * One item of a [[Component]]'s data, holding its values and settings.
 */
export class DataItem<P extends IComponentDataItem> extends Settings {
	declare public _settings: P;

	/**
	 * The [[Component]] the data item belongs to.
	 */
	public component: Component;

	/**
	 * The object in the source data this data item was made from.
	 */
	public dataContext: unknown;

	/**
	 * Bullets shown for this data item.
	 */
	public bullets: Array<Bullet> | undefined;

	/**
	 * Start of the base interval each date field's value falls in, by field.
	 * Set by a [[DateAxis]].
	 */
	public open: { [index: string]: any } | undefined;

	/**
	 * End of the base interval each date field's value falls in, by field.
	 * Set by a [[DateAxis]].
	 */
	public close: { [index: string]: any } | undefined;

	constructor(component: Component, dataContext: unknown, settings: P) {
		super(settings);

		this.dataContext = dataContext;
		this.component = component;
		this._settings.visible = true;
		this._checkDirty();
	}

	/**
	 * @ignore
	 */
	public markDirty(): void {
		this.component.markDirtyValues(this);
	}

	public _startAnimation(): void {
		this.component._root._addAnimation(this);
	}

	protected _animationTime(): number | null {
		return this.component._root.animationTime;
	}

	protected _dispose() {
		if (this.component) {
			this.component.disposeDataItem(this);
		}
		super._dispose();
	}

	/**
	 * Shows the data item.
	 *
	 * @param  duration  Animation duration in milliseconds
	 */
	public show(duration?: number) {
		this.setRaw("visible", true);
		if (this.component) {
			this.component.showDataItem(this, duration);
		}
	}

	/**
	 * Hides the data item.
	 *
	 * @param  duration  Animation duration in milliseconds
	 */
	public hide(duration?: number) {
		this.setRaw("visible", false);
		if (this.component) {
			this.component.hideDataItem(this, duration);
		}
	}

	/**
	 * Returns `true` if the data item is hidden.
	 */
	public isHidden() {
		return !this.get("visible");
	}
}


export interface IComponentDataItem {
	visible?: boolean;
}

export interface IComponentSettings extends IContainerSettings {

	/**
	 * Duration in milliseconds of the animation from old values to new ones,
	 * e.g. when data changes.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/animations/#animating-data-values} for more info
	 * @default 0
	 */
	interpolationDuration?: number;

	/**
	 * Easing function of the animation from old values to new ones.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/animations/#easing-functions} for more info
	 */
	interpolationEasing?: $ease.Easing;
}

export interface IComponentPrivate extends IContainerPrivate {
}

export interface IComponentEvents extends IContainerEvents {
	/**
	 * The component's data changed and was processed.
	 */
	datavalidated: {}
	/**
	 * Values of the component's data items changed.
	 */
	valueschanged: {}
}

/**
 * Base class for elements that use data.
 */
export abstract class Component extends Container {
	public static className: string = "Component";
	public static classNames: Array<string> = Container.classNames.concat([Component.className]);

	declare public _settings: IComponentSettings;
	declare public _privateSettings: IComponentPrivate;
	declare public _dataItemSettings: IComponentDataItem;
	declare public _events: IComponentEvents;

	/**
	 * The layer name an SVG document gives `sprite`, an element shown for one
	 * of this component's data items.
	 *
	 * @ignore
	 */
	public _dataItemName(_dataItem: DataItem<this["_dataItemSettings"]>, _sprite: Sprite): string | undefined {
		return undefined;
	}

	protected _data: ListData<unknown> = new ListData();

	protected _dataItems: Array<DataItem<this["_dataItemSettings"]>> = [];

	public _mainDataItems = this._dataItems;

	protected valueFields: Array<string> = [];
	protected fields: Array<string> = ["id"];

	protected _valueFields!: Array<string>;
	protected _valueFieldsF!: { [index: string]: { fieldKey: string, workingKey: string } };

	protected _fields!: Array<string>;
	protected _fieldsF!: { [index: string]: string };

	public _valuesDirty: boolean = false;

	protected _dataChanged: boolean = false;

	protected _dataGrouped = false;

	/**
	 * Becomes `true` after the component's first update.
	 */
	public inited: boolean = false;

	/**
	 * The component's data: a list of data objects, each made into a data
	 * item.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/data/} for more info
	 */
	public set data(data: ListData<unknown>) {
		data.incrementRef();
		this._data.decrementRef();
		this._data = data;
	}

	/**
	 * @return  Data
	 */
	public get data(): ListData<unknown> {
		return this._data;
	}

	protected _dispose() {
		super._dispose();
		this._data.decrementRef();
	}

	protected _onDataClear() {

	}

	protected _afterNew() {
		super._afterNew();

		this._data.incrementRef();
		this._updateFields();

		this._disposers.push(this.data.events.onAll((change) => {
			const dataItems = this._mainDataItems;
			this.markDirtyValues();
			this._markDirtyGroup();
			this._dataChanged = true;
			if (change.type === "clear") {
				$array.each(dataItems, (dataItem) => {
					dataItem.dispose();
				});

				dataItems.length = 0;
				this._onDataClear();
			} else if (change.type === "push") {
				const dataItem = new DataItem(this, change.newValue, this._makeDataItem(change.newValue));
				dataItems.push(dataItem);
				this.processDataItem(dataItem);

			} else if (change.type === "setIndex") {
				const dataItem = dataItems[change.index];
				const properties = this._makeDataItem(change.newValue);
				if (dataItem.bullets && dataItem.bullets.length == 0) {
					dataItem.bullets = undefined;
				}

				$object.entries(properties).forEach(([key, value]) => {
					if (dataItem.get(key) == value) {
						return;
					}

					dataItem.animate({
						key: key,
						to: value,
						duration: this.get("interpolationDuration", 0),
						easing: this.get("interpolationEasing"),
					});
				});

				dataItem.dataContext = change.newValue;

			} else if (change.type === "insertIndex") {
				const dataItem = new DataItem(this, change.newValue, this._makeDataItem(change.newValue));
				dataItems.splice(change.index, 0, dataItem);
				this.processDataItem(dataItem);

			} else if (change.type === "removeIndex") {
				const dataItem = dataItems[change.index];
				dataItem.dispose();
				dataItems.splice(change.index, 1);

			} else if (change.type === "moveIndex") {
				const dataItem = dataItems[change.oldIndex];
				dataItems.splice(change.oldIndex, 1);
				dataItems.splice(change.newIndex, 0, dataItem);

			} else {
				throw new Error("Unknown IStreamEvent type");
			}

			this._afterDataChange();
		}));
	}

	protected _postUpdateData() {

	}

	/**
	 * Updates the data in place, keeping the existing data items: each object's
	 * values go into the data item at the same index. Extra objects are added
	 * as new data items, and data items beyond the new data are removed.
	 *
	 * @param  data  New data
	 */
	public updateData(data: Array<any>) {

		let ii = -1;

		$array.each(data, (dataObject, index) => {
			const dataItem = this.dataItems[index];
			if (!dataItem) {
				this.data.push(dataObject);
			}
			else {
				const dataContext = dataItem.dataContext as any
				if (dataContext) {
					$object.entries(dataObject).forEach(([key, value]) => {
						dataContext[key] = value;
					});
				}

				const properties = this._makeDataItem(dataContext);

				$object.entries(properties).forEach(([key, value]) => {
					if (dataItem.get(key) != value) {
						dataItem.set(key, value);
						const workingKey = this._valueFieldsF[key]?.workingKey;
						if (workingKey) {
							dataItem.set(workingKey as any, value);
						}
					}
				});

			}
			ii = index;
		})

		for (let i = this.dataItems.length - 1; i > ii; i--) {
			const dataItem = this.dataItems[i];
			$array.remove(this.dataItems, dataItem);
			dataItem.dispose();
		}

		this._postUpdateData();
	}

	protected _updateFields() {
		if (this.valueFields) {
			this._valueFields = [];
			this._valueFieldsF = {};

			$array.each(this.valueFields as Array<keyof this["_settings"]>, (key) => {
				const field = this.get(<any>(key + "Field"));
				if (field) {
					this._valueFields.push(<any>key);
					this._valueFieldsF[key as string] = { fieldKey: key + "Field", workingKey: key + "Working" };
				}
			});
		}

		if (this.fields) {
			this._fields = [];
			this._fieldsF = {};

			$array.each(this.fields as Array<keyof this["_settings"]>, (key) => {
				const field = this.get(<any>(key + "Field"));
				if (field) {
					this._fields.push(<any>key);
					this._fieldsF[key as string] = key + "Field";
				}
			});
		}
	}

	/**
	 * The component's data items.
	 *
	 * @return  Data items
	 */
	public get dataItems(): Array<DataItem<this["_dataItemSettings"]>> {
		return this._dataItems;
	}

	protected processDataItem(_dataItem: DataItem<this["_dataItemSettings"]>) { }


	public _makeDataItem(data: unknown): this["_dataItemSettings"] {
		//const output: this["_dataItemSettings"] = {};
		const output: any = {}; // temporary to solve error
		if (this._valueFields) {
			$array.each(this._valueFields, (key) => {
				const field = this.get(<any>(this._valueFieldsF[key].fieldKey));
				output[key] = (data as any)[field];

				output[this._valueFieldsF[key].workingKey] = output[key];
			});
		}
		if (this._fields) {
			$array.each(this._fields, (key) => {
				const field = this.get(<any>(this._fieldsF[key]));
				output[key] = (data as any)[field];
			});
		}

		return output;
	}

	/**
	 * Creates and processes a data item, without adding it to `dataItems`.
	 *
	 * @param   data         Data item settings
	 * @param   dataContext  Object to use as the data item's `dataContext`
	 * @return               New data item
	 */
	public makeDataItem(data: this["_dataItemSettings"], dataContext?: any): DataItem<this["_dataItemSettings"]> {
		let dataItem = new DataItem(this, dataContext, data);
		this.processDataItem(dataItem);
		return dataItem;
	}

	/**
	 * Creates a data item straight from settings, not from data, and adds it
	 * to the component's data items.
	 *
	 * @param   data         Data item settings
	 * @param   dataContext  Object to use as the data item's `dataContext`
	 * @return               New data item
	 */
	public pushDataItem(data: this["_dataItemSettings"], dataContext?: any): DataItem<this["_dataItemSettings"]> {
		const dataItem = this.makeDataItem(data, dataContext);
		this._mainDataItems.push(dataItem);
		return dataItem;
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(_dataItem: DataItem<this["_dataItemSettings"]>) {

	}

	/**
	 * Shows a data item.
	 *
	 * @param   dataItem   Data item
	 * @param   _duration  Animation duration in milliseconds
	 * @return             Promise
	 */
	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, _duration?: number): Promise<void> {
		dataItem.set("visible", true);
	}

	/**
	 * Hides a data item.
	 *
	 * @param   dataItem   Data item
	 * @param   _duration  Animation duration in milliseconds
	 * @return             Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, _duration?: number): Promise<void> {
		dataItem.set("visible", false);
	}

	public _clearDirty() {
		super._clearDirty();
		this._valuesDirty = false;
	}

	protected _afterDataChange() {

	}

	public _afterChanged() {
		super._afterChanged();
		if (this._dataChanged) {
			const type = "datavalidated";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, { type: type, target: this });
			}
			this._dataChanged = false;
		}

		if (this._valuesDirty) {
			const type = "valueschanged";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, { type: type, target: this });
			}
		}

		this.inited = true;
	}

	/**
	 * Makes the component redraw from its data on the next frame.
	 *
	 * @since 5.0.21
	 */
	public markDirtyValues(_dataItem?: DataItem<this["_dataItemSettings"]>) {
		this.markDirty();
		this._valuesDirty = true;
	}

	public _markDirtyGroup() {
		this._dataGrouped = false;
	}

	/**
	 * @ignore
	 */
	public markDirtySize() {
		this._sizeDirty = true;
		this.markDirty();
	}

	/**
	 * Returns the data item whose `id` matches, if any.
	 *
	 * @param   id  ID
	 * @return      Data item
	 */
	public getDataItemById(id: string): DataItem<this["_dataItemSettings"]> | undefined {
		return $array.find(this.dataItems, (dataItem: any) => {
			return dataItem.get("id") == id;
		})
	}
}
