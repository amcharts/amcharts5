import type { Entity, Dirty } from "./Entity";
import type { State } from "./States";
import { EventDispatcher, Events } from "./EventDispatcher";
import { IDisposer, Disposer, MultiDisposer } from "./Disposer";
import * as $array from "./Array";
import * as $object from "./Object";
import * as $type from "./Type";


function disposeSettings(settings: object) {
	$object.each(settings, (_key, value) => {
		if ($type.isObject(value) && typeof (value as any).dispose === "function") {
			(value as any).enableDispose = true;
			(value as any).dispose();
		}
	});
}


export class TemplateState<E extends Entity> {
	public _settings: Partial<E["_settings"]>;

	private _name: string;
	private _template: Template<E>;

	constructor(name: string, template: Template<E>, settings: Partial<E["_settings"]>) {
		this._name = name;
		this._template = template;
		this._settings = settings;
	}

	public _dispose() {
		disposeSettings(this._settings);
	}

	public get<Key extends keyof this["_settings"]>(key: Key): this["_settings"][Key];
	public get<Key extends keyof this["_settings"], F>(key: Key, fallback: F): NonNullable<this["_settings"][Key]> | F;
	public get<Key extends keyof this["_settings"]>(key: Key, fallback?: any): any {
		const value = this._settings[key];

		if (value !== undefined) {
			return value;

		} else {
			return fallback;
		}
	}

	public set<Key extends keyof E["_settings"]>(key: Key, value: E["_settings"][Key]) {
		this._settings[key] = value;
		// TODO maybe only do this if the value changed ?
		this._template._stateChanged(this._name);
	}

	public remove<Key extends keyof this["_settings"]>(key: Key) {
		delete this._settings[key];
		// TODO maybe only do this if the value changed ?
		this._template._stateChanged(this._name);
	}

	public setAll(settings: this["_settings"]) {
		$object.keys(settings).forEach((key) => {
			this._settings[key] = settings[key];
		});

		this._template._stateChanged(this._name);
	}

	public _apply(other: State<E>, seen: Dirty<E["_settings"]>): void {
		$object.each(this._settings, (key, value) => {
			if (!seen[key] && !other._userSettings[key]) {
				seen[key] = true;
				other.setRaw(key, value);
			}
		});
	}
}


export class TemplateStates<E extends Entity> {
	private _template: Template<E>;
	private _states: { [key: string]: TemplateState<E> } = {};

	constructor(template: Template<E>) {
		this._template = template;
	}

	public _dispose() {
		$object.each(this._states, (_key, state) => {
			state._dispose();
		});
	}

	public lookup(name: string): TemplateState<E> | undefined {
		return this._states[name];
	}

	public create(name: string, settings: Partial<E["_settings"]>): TemplateState<E> {
		const state = this._states[name];

		if (state) {
			state.setAll(settings);
			return state;

		} else {
			const state = new TemplateState(name, this._template, settings);
			this._states[name] = state;
			this._template._stateChanged(name);
			return state;
		}
	}

	public remove(name: string) {
		delete this._states[name];
		this._template._stateChanged(name);
	}

	public _apply(entity: E, state: ApplyState<E>): void {
		$object.each(this._states, (key, value) => {
			let seen = state.states[key];

			if (seen == null) {
				seen = state.states[key] = {};
			}

			const other = entity.states.create(key as string, {});
			value._apply(other, seen);
		});
	}
}


export class TemplateAdapters<E extends Entity> {
	private _callbacks: { [K in keyof E["_settings"]]?: Array<<O extends E>(value: O["_settings"][K], target: O, key: K) => O["_settings"][K]> } = {};

	public add<Key extends keyof E["_settings"]>(key: Key, callback: (value: E["_settings"][Key], target: E, key: Key) => E["_settings"][Key]): IDisposer {
		let callbacks = this._callbacks[key];

		if (callbacks === undefined) {
			callbacks = this._callbacks[key] = [];
		}

		callbacks.push(callback);

		return new Disposer(() => {
			$array.removeFirst(callbacks!, callback);

			if (callbacks!.length === 0) {
				delete this._callbacks[key];
			}
		});
	}

	public remove<Key extends keyof E["_settings"]>(key: Key) {
		const callbacks = this._callbacks[key];

		if (callbacks !== undefined) {
			delete this._callbacks[key];
		}
	}

	public _apply(entity: E): IDisposer {
		const disposers: Array<IDisposer> = [];

		$object.each(this._callbacks, (key, callbacks) => {
			$array.each(callbacks, (callback) => {
				disposers.push(entity.adapters.add(key, callback));
			});
		});

		return new MultiDisposer(disposers);
	}
}


export interface ApplyState<E extends Entity> {
	settings: Dirty<E["_settings"]>;
	privateSettings: Dirty<E["_privateSettings"]>;
	states: { [name: string]: Dirty<E["_settings"]> };
}


// TODO maybe extend from Properties ?
export class Template<E extends Entity> implements IDisposer {
	private _disposed: boolean = false;

	public _settings: Partial<E["_settings"]>;
	public _privateSettings: E["_privateSettings"] = {};

	// TODO code duplication with Properties
	public _settingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K]>(value: V) => void> } = {};
	public _privateSettingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K]>(value: V) => void> } = {};

	public _entities: Array<E> = [];

	public readonly states: TemplateStates<E> = new TemplateStates(this);

	public readonly adapters: TemplateAdapters<E> = new TemplateAdapters();
	public readonly events: EventDispatcher<Events<E, E["_events"]>> = new EventDispatcher();

	public setup: (<O extends E>(entity: O) => void) | undefined;

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new<E extends Entity>(settings: E["_settings"]): Template<E> {
		return new Template<E>(settings, true);
	}

	protected _dispose() {
		disposeSettings(this._settings);
		disposeSettings(this._privateSettings);
	}

	/**
	 * Returns `true` if this element is disposed.
	 *
	 * @return Disposed
	 */
	public isDisposed(): boolean {
		return this._disposed;
	}

	/**
	 * Disposes this object.
	 */
	public dispose() {
		if (!this._disposed) {
			this._disposed = true;
			this._dispose();
		}
	}

	private _checkDisposed() {
		if (this._disposed) {
			throw new Error("Template is disposed");
		}
	}

	/**
	 * Array of all entities using this template.
	 */
	public get entities():Array<E>{
		return this._entities;
	}

	constructor(settings: E["_settings"], isReal: boolean) {
		if (!isReal) {
			throw new Error("You cannot use `new Class()`, instead use `Class.new()`");
		}

		this._settings = settings;
	}

	public get<Key extends keyof this["_settings"]>(key: Key): this["_settings"][Key];
	public get<Key extends keyof this["_settings"], F>(key: Key, fallback: F): NonNullable<this["_settings"][Key]> | F;
	public get<Key extends keyof this["_settings"]>(key: Key, fallback?: any): any {
		this._checkDisposed();

		const value = this._settings[key];

		if (value !== undefined) {
			return value;

		} else {
			return fallback;
		}
	}

	public setRaw<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		this._checkDisposed();
		this._settings[key] = value;
	}

	public set<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		this._checkDisposed();

		if (this._settings[key] !== value) {
			this.setRaw(key, value);

			this._entities.forEach((entity) => {
				entity._setTemplateProperty(this, key, value);
			});
		}
	}

	public remove<Key extends keyof this["_settings"]>(key: Key): void {
		this._checkDisposed();

		if (key in this._settings) {
			delete this._settings[key];

			this._entities.forEach((entity) => {
				entity._removeTemplateProperty(key);
			});
		}
	}

	public removeAll(): void {
		this._checkDisposed();

		$object.each(this._settings, (key, _value) => {
			this.remove(key);
		});
	}

	public getPrivate<Key extends keyof this["_privateSettings"], F>(key: Key, fallback: F): NonNullable<this["_privateSettings"][Key]> | F;
	public getPrivate<Key extends keyof this["_privateSettings"]>(key: Key): this["_privateSettings"][Key];
	public getPrivate<Key extends keyof this["_privateSettings"]>(key: Key, fallback?: any): any {
		this._checkDisposed();

		const value = this._privateSettings[key];

		if (value !== undefined) {
			return value;

		} else {
			return fallback;
		}
	}

	public setPrivateRaw<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, value: Value): Value {
		this._checkDisposed();
		this._privateSettings[key] = value;
		return value;
	}

	public setPrivate<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, value: Value): Value {
		this._checkDisposed();

		if (this._privateSettings[key] !== value) {
			this.setPrivateRaw(key, value);

			this._entities.forEach((entity) => {
				entity._setTemplatePrivateProperty(this, key, value);
			});
		}

		return value;
	}

	public removePrivate<Key extends keyof this["_privateSettings"]>(key: Key): void {
		this._checkDisposed();

		if (key in this._privateSettings) {
			delete this._privateSettings[key];

			this._entities.forEach((entity) => {
				entity._removeTemplatePrivateProperty(key);
			});
		}
	}

	public setAll(value: this["_settings"]) {
		this._checkDisposed();

		$object.each(value, (key, value) => {
			this.set(key, value);
		});
	}

	// TODO code duplication with Properties
	public on<Key extends keyof this["_settings"]>(key: Key, callback: (value: this["_settings"][Key], target?: E, key?: Key) => void): IDisposer {
		this._checkDisposed();

		let events = this._settingEvents[key];

		if (events === undefined) {
			events = this._settingEvents[key] = [];
		}

		events.push(callback);

		return new Disposer(() => {
			$array.removeFirst(events!, callback);

			if (events!.length === 0) {
				delete this._settingEvents[key];
			}
		});
	}

	// TODO code duplication with Properties
	public onPrivate<Key extends keyof this["_privateSettings"]>(key: Key, callback: (value: this["_privateSettings"][Key], target?: E, key?: Key) => void): IDisposer {
		this._checkDisposed();

		let events = this._privateSettingEvents[key];

		if (events === undefined) {
			events = this._privateSettingEvents[key] = [];
		}

		events.push(callback);

		return new Disposer(() => {
			$array.removeFirst(events!, callback);

			if (events!.length === 0) {
				delete this._privateSettingEvents[key];
			}
		});
	}

	public _apply(entity: E, state: ApplyState<E>): IDisposer {
		this._checkDisposed();

		const disposers: Array<IDisposer> = [];

		$object.each(this._settingEvents, (key, events) => {
			$array.each(events, (event) => {
				disposers.push(entity.on(key, event));
			});
		});

		$object.each(this._privateSettingEvents, (key, events) => {
			$array.each(events, (event) => {
				disposers.push(entity.onPrivate(key, event));
			});
		});

		this.states._apply(entity, state);

		disposers.push(this.adapters._apply(entity));
		disposers.push(entity.events.copyFrom(this.events));

		return new MultiDisposer(disposers);
	}

	public _setObjectTemplate(entity: E) {
		this._checkDisposed();
		this._entities.push(entity);
	}

	public _removeObjectTemplate(entity: E) {
		//this._checkDisposed();
		$array.remove(this._entities, entity);
	}

	public _stateChanged(name: string): void {
		this._checkDisposed();

		this._entities.forEach((entity) => {
			entity._applyStateByKey(name);
		});
	}
}
