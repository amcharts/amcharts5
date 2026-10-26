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


/**
 * A state of a [[Template]], passed on to every object that uses the template.
 */
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

	/**
	 * Returns the state's value of setting `key`, or `fallback` if it has none.
	 *
	 * @param   key       Setting key
	 * @param   fallback  Value to return if the state has no value
	 * @return            Value
	 */
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

	/**
	 * Sets the value setting `key` takes in this state, for every object that
	 * uses the template.
	 *
	 * @param   key    Setting key
	 * @param   value  Setting value
	 */
	public set<Key extends keyof E["_settings"]>(key: Key, value: E["_settings"][Key]) {
		this._settings[key] = value;
		// TODO maybe only do this if the value changed ?
		this._template._stateChanged(this._name);
	}

	/**
	 * Removes setting `key` from the state.
	 *
	 * @param   key  Setting key
	 */
	public remove<Key extends keyof this["_settings"]>(key: Key) {
		delete this._settings[key];
		// TODO maybe only do this if the value changed ?
		this._template._stateChanged(this._name);
	}

	/**
	 * Sets several of the state's settings at once.
	 *
	 * @param   settings  Settings
	 */
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
				// came from a theme, so it is not part of the configuration
				other._computedSettings[key] = true;
			}
		});
	}
}


/**
 * The states of a [[Template]], by name.
 */
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

	/**
	 * Returns the state called `name`, or `undefined` if there is none.
	 *
	 * @param   name  State name
	 * @return        State
	 */
	public lookup(name: string): TemplateState<E> | undefined {
		return this._states[name];
	}

	/**
	 * Creates the state called `name` with `settings`, or adds `settings` to
	 * it if it already exists.
	 *
	 * @param   name      State name
	 * @param   settings  Settings
	 * @return            State
	 */
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

	/**
	 * Removes the state called `name`.
	 *
	 * @param   name  State name
	 */
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


/**
 * Adapters of a [[Template]], added to every object that uses the template.
 */
export class TemplateAdapters<E extends Entity> {
	private _callbacks: { [K in keyof E["_settings"]]?: Array<<O extends E>(value: O["_settings"][K], target: O, key: K) => O["_settings"][K]> } = {};

	/**
	 * Adds a function that modifies the value of setting `key` each time it is
	 * read, on the objects that use the template.
	 *
	 * @param   key       Setting key
	 * @param   callback  Takes the value and returns the modified one
	 * @return            Disposer that removes the adapter
	 */
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

	/**
	 * Removes all adapters for setting `key` from the template.
	 *
	 * @param   key  Setting key
	 */
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
/**
 * Settings, states, adapters and events shared by many objects, such as all
 * columns of a series. A setting on the template reaches every object that
 * uses it, unless the object has its own value.
 */
export class Template<E extends Entity> implements IDisposer {
	private _disposed: boolean = false;

	public _settings: Partial<E["_settings"]>;
	public _privateSettings: E["_privateSettings"] = {};

	public _computedSettings: Dirty<E["_settings"]> = {};

	// TODO code duplication with Properties
	public _settingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K]>(value: V) => void> } = {};
	public _privateSettingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K]>(value: V) => void> } = {};

	public _entities: Array<E> = [];

	/**
	 * States passed on to the objects that use the template.
	 */
	public readonly states: TemplateStates<E> = new TemplateStates(this);

	/**
	 * Adapters added to the objects that use the template.
	 */
	public readonly adapters: TemplateAdapters<E> = new TemplateAdapters();
	/**
	 * Event listeners added to the objects that use the template.
	 */
	public readonly events: EventDispatcher<Events<E, E["_events"]>> = new EventDispatcher();

	/**
	 * A function called once for each object that uses the template, when the
	 * template is first applied to it.
	 */
	public setup: (<O extends E>(entity: O) => void) | undefined;

	/**
	 * Creates a template with `settings`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/#new-element-syntax} for more info
	 * @param   settings  Settings
	 * @return            Template
	 */
	public static new<E extends Entity>(settings: E["_settings"]): Template<E> {
		return new Template<E>(settings, true);
	}

	protected _dispose() {
		disposeSettings(this._settings);
		disposeSettings(this._privateSettings);
	}

	/**
	 * Returns `true` if the template has been disposed.
	 *
	 * @return Disposed
	 */
	public isDisposed(): boolean {
		return this._disposed;
	}

	/**
	 * Disposes the template, along with any disposable objects in its settings.
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
	 * The objects that use the template.
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

	/**
	 * Returns the template's value of setting `key`, or `fallback` if it has
	 * none.
	 *
	 * @param   key       Setting key
	 * @param   fallback  Value to return if the setting is not set
	 * @return            Value
	 */
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

	/**
	 * Sets setting `key` on the template only, without passing it on to the
	 * objects that use it.
	 *
	 * @param   key    Setting key
	 * @param   value  Setting value
	 */
	public setRaw<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		this._checkDisposed();
		delete this._computedSettings[key];
		this._settings[key] = value;
	}

	/**
	 * Sets setting `key` on the template, and on every object that uses it and
	 * has no value of its own.
	 *
	 * @param   key    Setting key
	 * @param   value  Setting value
	 */
	public set<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		this._checkDisposed();
		delete this._computedSettings[key];

		if (this._settings[key] !== value) {
			this.setRaw(key, value);

			this._entities.forEach((entity) => {
				entity._setTemplateProperty(this, key, value);
			});
		}
	}

	/**
	 * Same as `set()`, but for a value the library works out itself rather than
	 * one that was asked for, so that it can be left out when serializing.
	 *
	 * @ignore
	 */
	public _setC<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		const authored = !this._computedSettings[key] && this._settings[key] === value;
		this.set(key, value);
		if (!authored) {
			this._computedSettings[key] = true;
		}
	}

	/**
	 * Sets multiple computed settings at once.
	 *
	 * @ignore
	 */
	public _setCAll(settings: this["_settings"]) {
		$object.each(settings, (key, value) => {
			this._setC(key, value as any);
		});
	}

	/**
	 * Flags already-set settings as computed, without writing anything.
	 *
	 * @ignore
	 */
	public _markC<T extends Template<any>>(this: T, ...keys: Array<keyof T["_settings"]>): T {
		$array.each(keys, (key) => {
			this._computedSettings[key] = true;
		});
		return this;
	}

	/**
	 * Removes setting `key` from the template. The objects that use it go back
	 * to a value from a theme or other template, if there is one.
	 *
	 * @param   key  Setting key
	 */
	public remove<Key extends keyof this["_settings"]>(key: Key): void {
		this._checkDisposed();

		if (key in this._settings) {
			delete this._settings[key];
			delete this._computedSettings[key];

			this._entities.forEach((entity) => {
				entity._removeTemplateProperty(key);
			});
		}
	}

	/**
	 * Removes all settings from the template, as `remove()` does for each one.
	 */
	public removeAll(): void {
		this._checkDisposed();

		$object.each(this._settings, (key, _value) => {
			this.remove(key);
		});
	}

	/**
	 * Returns the template's value of private setting `key`, or `fallback` if
	 * it has none.
	 *
	 * @param   key       Private setting key
	 * @param   fallback  Value to return if the setting is not set
	 * @return            Value
	 */
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

	/**
	 * Sets private setting `key` on the template only, without passing it on
	 * to the objects that use it. Returns `value`.
	 *
	 * @param   key    Private setting key
	 * @param   value  Setting value
	 * @return         Setting value
	 */
	public setPrivateRaw<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, value: Value): Value {
		this._checkDisposed();
		this._privateSettings[key] = value;
		return value;
	}

	/**
	 * Sets private setting `key` on the template, and on every object that uses
	 * it and has no value of its own. Returns `value`.
	 *
	 * @param   key    Private setting key
	 * @param   value  Setting value
	 * @return         Setting value
	 */
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

	/**
	 * Removes private setting `key` from the template.
	 *
	 * @param   key  Private setting key
	 */
	public removePrivate<Key extends keyof this["_privateSettings"]>(key: Key): void {
		this._checkDisposed();

		if (key in this._privateSettings) {
			delete this._privateSettings[key];

			this._entities.forEach((entity) => {
				entity._removeTemplatePrivateProperty(key);
			});
		}
	}

	/**
	 * Sets several settings at once, as `set()` does for each one.
	 *
	 * @param   value  Settings
	 */
	public setAll(value: this["_settings"]) {
		this._checkDisposed();

		$object.each(value, (key, value) => {
			this.set(key, value);
		});
	}

	// TODO code duplication with Properties
	/**
	 * Calls `callback` each time setting `key` changes on an object that uses
	 * the template.
	 *
	 * @param   key       Setting key
	 * @param   callback  Callback
	 * @return            Disposer for event
	 */
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
	/**
	 * Calls `callback` each time private setting `key` changes on an object
	 * that uses the template.
	 *
	 * @param   key       Private setting key
	 * @param   callback  Callback
	 * @return            Disposer for event
	 */
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
