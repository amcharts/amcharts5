import { Settings } from "../util/Entity";
import { Container, IContainerSettings, IContainerPrivate, IContainerEvents } from "./Container";
import { ListData } from "../util/Data";
import * as $array from "../util/Array";
import * as $object from "../util/Object";
import type * as $ease from "../util/Ease";
import type { Bullet } from "./Bullet";

/**
 * A base element that holds data bit (data item) for any [[Component]].
 */
export class DataItem<P extends IComponentDataItem> extends Settings {
	declare public _settings: P;

	/**
	 * A data item's owener [[Component]].
	 */
	public component: Component;

	/**
	 * A reference to actual item in source data this item is based on.
	 */
	public dataContext: unknown;

	/**
	 * @todo requires description
	 */
	public bullets: Array<Bullet> | undefined;

	/**
	 * A set of "open" values.
	 */
	public open: { [index: string]: any } | undefined;

	/**
	 * A set of "close" values.
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
		this.component._markDirtyValues(this);
	}

	protected _startAnimation(): void {
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
	 * Shows a data item that's currently hidden.
	 */
	public show(duration?: number) {
		this.setRaw("visible", true);
		if (this.component) {
			this.component.showDataItem(this, duration);
		}
	}

	/**
	 * Hides a data item that's currently visible.
	 */
	public hide(duration?: number) {
		this.setRaw("visible", false);
		if (this.component) {
			this.component.hideDataItem(this, duration);
		}
	}

	public isHidden() {
		return !this.get("visible");
	}
}


export interface IComponentDataItem {
	visible?: boolean;
}

export interface IComponentSettings extends IContainerSettings {

	/**
	 * A duration of the animation from one setting value to another, in
	 * milliseconds.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Animating_data_values} for more info
	 */
	interpolationDuration?: number;

	/**
	 * Easing function to use for cross setting value animations.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Easing_functions} for more info
	 */
	interpolationEasing?: $ease.Easing;

}

export interface IComponentPrivate extends IContainerPrivate {
}

export interface IComponentEvents extends IContainerEvents {
	datavalidated: {}
}

/**
 * A base class for elements that make use of data.
 */
export abstract class Component extends Container {
	public static className: string = "Component";
	public static classNames: Array<string> = Container.classNames.concat([Component.className]);

	declare public _settings: IComponentSettings;
	declare public _privateSettings: IComponentPrivate;
	declare public _dataItemSettings: IComponentDataItem;
	declare public _events: IComponentEvents;

	protected _data: ListData<unknown> = new ListData();

	protected _dataItems: Array<DataItem<this["_dataItemSettings"]>> = [];

	protected valueFields: Array<string> = [];
	protected fields: Array<string> = ["id"];

	protected _valueFields!: Array<string>;
	protected _valueFieldsF!: { [index: string]: { fieldKey: string, workingKey: string } };

	protected _fields!: Array<string>;
	protected _fieldsF!: { [index: string]: string };

	public _valuesDirty: boolean = false;

	protected _dataChanged: boolean = false;

	/**
	 * Indicates if the component has already been initialized.
	 */
	public inited: boolean = false;

	/**
	 * Component's data.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/data/} for more info
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

	protected _afterNew() {
		super._afterNew();

		this._data.incrementRef();
		this._updateFields();

		this._disposers.push(this.data.events.onAll((change) => {
			this._markDirtyValues();
			this._dataChanged = true;
			if (change.type === "clear") {
				$array.each(this._dataItems, (dataItem) => {
					dataItem.dispose();
				});

				this._dataItems.length = 0;

			} else if (change.type === "push") {
				const dataItem = new DataItem(this, change.newValue, this._makeDataItem(change.newValue));
				this._dataItems.push(dataItem);
				this.processDataItem(dataItem);

			} else if (change.type === "setIndex") {
				const dataItem = this._dataItems[change.index];
				const properties = this._makeDataItem(change.newValue);

				$object.keys(properties).forEach((key) => {
					dataItem.animate({
						key: key,
						to: properties[key],
						duration: this.get("interpolationDuration", 0),
						easing: this.get("interpolationEasing"),
					});
				});

				dataItem.dataContext = change.newValue;

			} else if (change.type === "insertIndex") {
				const dataItem = new DataItem(this, change.newValue, this._makeDataItem(change.newValue));
				this._dataItems.splice(change.index, 0, dataItem);
				this.processDataItem(dataItem);

			} else if (change.type === "removeIndex") {
				const dataItem = this._dataItems[change.index];
				dataItem.dispose();
				this._dataItems.splice(change.index, 1);
				this._markDirtyValues();

			} else {
				throw new Error("Unknown IStreamEvent type");
			}

			this._afterDataChange();
		}));
	}

	protected _fieldsDirty(): boolean {
		let dirty = false;
		$array.eachContinue(this.fields, (field) => {
			if (this.isDirty((field + "Field") as any)) {
				dirty = true;
				return false;
			}
			else {
				return true;
			}
		})
		return dirty;
	}

	protected _valueFieldsDirty(): boolean {
		let dirty = false;
		$array.eachContinue(this.valueFields, (field) => {
			if (this.isDirty((field + "Field") as any)) {
				dirty = true;
				return false;
			}
			else {
				return true;
			}
		})
		return dirty;
	}

	protected _updateFields(): boolean {
		let dirty = false;
		if (this.valueFields) {
			dirty = this._valueFieldsDirty();

			if (dirty) {
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
		}

		if (this.fields) {
			let dirty = this._fieldsDirty();

			if (dirty) {
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

		return dirty;
	}


	public _prepareChildren() {
		super._prepareChildren();

		this._updateFields();
	}

	/**
	 * A list of component's data items.
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
	 * @ignore
	 */
	public makeDataItem(data: this["_dataItemSettings"]): DataItem<this["_dataItemSettings"]> {
		let dataItem = new DataItem(this, undefined, data);
		this.processDataItem(dataItem);
		return dataItem;
	}

	/**
	 * @ignore
	 */
	public pushDataItem(data: this["_dataItemSettings"]): DataItem<this["_dataItemSettings"]> {
		const dataItem = this.makeDataItem(data);
		this.dataItems.push(dataItem);
		return dataItem;
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(_dataItem: DataItem<this["_dataItemSettings"]>) { }

	/**
	 * Shows component's data item.
	 *
	 * @param   dataItem   Data item
	 * @param   _duration  Animation duration in milliseconds
	 * @return             Promise
	 */
	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, _duration?: number): Promise<void> {
		dataItem.set("visible", true);
	}

	/**
	 * Hides component's data item.
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
				this._dataChanged = false;
			}
		}

		this.inited = true;
	}

	public _markDirtyValues(_dataItem?: DataItem<this["_dataItemSettings"]>) {
		this.markDirty();
		this._valuesDirty = true;
	}

	/**
	 * @ignore
	 */
	public markDirtySize() {
		this._sizeDirty = true;
		this.markDirty();
	}

}
