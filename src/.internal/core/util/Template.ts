import type { Entity } from "./Entity";
import { EventDispatcher, Events } from "./EventDispatcher";
import { IDisposer, Disposer, MultiDisposer } from "./Disposer";
import * as $array from "./Array";
import * as $object from "./Object";

export class TemplateState<E extends Entity> {
	public _settings: Partial<E["_settings"]>;

	constructor(settings: Partial<E["_settings"]>) {
		this._settings = settings;
	}

	public get<Key extends keyof this["_settings"]>(key: Key): this["_settings"][Key];
	public get<Key extends keyof this["_settings"], F>(key: Key, fallback: F): NonNullable<this["_settings"][Key]> | F;
	public get<Key extends keyof this["_settings"]>(key: Key, fallback?: any): any {
		if (key in this._settings) {
			return this._settings[key];

		} else {
			return fallback;
		}
	}

	public set<Key extends keyof E["_settings"]>(key: Key, value: E["_settings"][Key]) {
		this._settings[key] = value;
	}

	public remove<Key extends keyof this["_settings"]>(key: Key) {
		delete this._settings[key];
	}

	public setAll(settings: this["_settings"]) {
		$object.keys(settings).forEach((key) => {
			this._settings[key] = settings[key];
		});
	}
}


export class TemplateStates<E extends Entity> {
	private _states: { [key: string]: TemplateState<E> } = {};

	public lookup(name: string): TemplateState<E> | undefined {
		return this._states[name];
	}

	public create(name: string, settings: Partial<E["_settings"]>): TemplateState<E> {
		const state = this._states[name];

		if (state) {
			state.setAll(settings);
			return state;

		} else {
			const state = new TemplateState(settings);
			this._states[name] = state;
			return state;
		}
	}

	public remove(name: string) {
		delete this._states[name];
	}

	public _apply(entity: E): void {
		// TODO handle animationOptions ?
		$object.each(this._states, (key, _state) => {
			entity.states.create(key as string, {});
		});
	}
}


export class TemplateAdapters<E extends Entity> {
	private _callbacks: { [K in keyof E["_settings"]]?: Array<<O extends E["_settings"]>(value: O[K], target?: O, key?: K) => O[K]> } = {};

	public add<Key extends keyof E["_settings"]>(key: Key, callback: <O extends E["_settings"]>(value: O[Key], target?: O, key?: Key) => O[Key]) {
		let callbacks = this._callbacks[key];

		if (callbacks === undefined) {
			callbacks = this._callbacks[key] = [];
		}

		callbacks.push(callback);
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


// TODO maybe extend from Properties ?
export class Template<E extends Entity> {
	public _settings: Partial<E["_settings"]>;
	public _privateSettings: E["_privateSettings"] = {};

	// TODO code duplication with Properties
	public _settingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K]>(value: V) => void> } = {};
	public _privateSettingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K]>(value: V) => void> } = {};

	public _entities: Array<E> = [];

	public readonly states: TemplateStates<E> = new TemplateStates();

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

	constructor(settings: E["_settings"], isReal: boolean) {
		if (!isReal) {
			throw new Error("You cannot use `new Class()`, instead use `Class.new()`");
		}

		this._settings = settings;
	}

	public get<Key extends keyof this["_settings"]>(key: Key): this["_settings"][Key];
	public get<Key extends keyof this["_settings"], F>(key: Key, fallback: F): NonNullable<this["_settings"][Key]> | F;
	public get<Key extends keyof this["_settings"]>(key: Key, fallback?: any): any {
		if (key in this._settings) {
			return this._settings[key];

		} else {
			return fallback;
		}
	}

	public setRaw<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		this._settings[key] = value;
	}

	public set<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		if (this._settings[key] !== value) {
			this.setRaw(key, value);

			this._entities.forEach((entity) => {
				entity._setTemplateProperty(this, key, value);
			});
		}
	}

	public remove<Key extends keyof this["_settings"]>(key: Key): void {
		if (key in this._settings) {
			delete this._settings[key];

			this._entities.forEach((entity) => {
				entity._removeTemplateProperty(key);
			});
		}
	}

	public removeAll(): void {
		$object.each(this._settings, (key, _value) => {
			this.remove(key);
		});
	}

	public getPrivate<Key extends keyof this["_privateSettings"], F>(key: Key, fallback: F): NonNullable<this["_privateSettings"][Key]> | F;
	public getPrivate<Key extends keyof this["_privateSettings"]>(key: Key): this["_privateSettings"][Key];
	public getPrivate<Key extends keyof this["_privateSettings"]>(key: Key, fallback?: any): any {
		if (key in this._privateSettings) {
			return this._privateSettings[key];

		} else {
			return fallback;
		}
	}

	public setPrivateRaw<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, value: Value): Value {
		this._privateSettings[key] = value;
		return value;
	}

	public setPrivate<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, value: Value): Value {
		if (this._privateSettings[key] !== value) {
			this.setPrivateRaw(key, value);

			this._entities.forEach((entity) => {
				entity._setTemplatePrivateProperty(this, key, value);
			});
		}

		return value;
	}

	public removePrivate<Key extends keyof this["_privateSettings"]>(key: Key): void {
		if (key in this._privateSettings) {
			delete this._privateSettings[key];

			this._entities.forEach((entity) => {
				entity._removeTemplatePrivateProperty(key);
			});
		}
	}

	public setAll(value: this["_settings"]) {
		$object.each(value, (key, value) => {
			this.set(key, value);
		});
	}

	// TODO code duplication with Properties
	public on<Key extends keyof this["_settings"]>(key: Key, callback: (value: this["_settings"][Key], target?: E, key?: Key) => void): IDisposer {
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

	public _apply(entity: E): IDisposer {
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

		disposers.push(this.adapters._apply(entity));
		disposers.push(entity.events.copyFrom(this.events));

		return new MultiDisposer(disposers);
	}

	public _setObjectTemplate(entity: E) {
		this._entities.push(entity);
	}

	public _removeObjectTemplate(entity: E) {
		$array.keepIf(this._entities, (x) => x !== entity);
	}
}
