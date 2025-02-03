import type { Root } from "../Root";
import type { Template, ApplyState } from "./Template";
import type { Theme, IRule } from "../Theme";
import type { ILocale } from "./Language";

import { IDisposer, Disposer } from "./Disposer";
import { EventDispatcher, Events } from "./EventDispatcher";
import { Time, IAnimation, AnimationState, getInterpolate } from "./Animation";
import { States } from "./States";
import { registry } from "../Registry";

import * as $object from "./Object";
import * as $ease from "./Ease";
import * as $array from "./Array";
import * as $order from "./Order";

/**
 * @ignore
 */
export type Dirty<A> = { [K in keyof A]?: boolean };


/**
 * Allows to dynamically modify setting value of its target element.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/adapters/} for more info
 */
export class Adapters<E extends Settings> {
	private _entity: E;
	private _callbacks: { [K in keyof E["_settings"]]?: Array<<O extends E>(value: O["_settings"][K], target: O, key: K) => O["_settings"][K]> } = {};
	private _disabled: { [K in keyof E["_settings"]]?: boolean } = {};

	constructor(entity: E) {
		this._entity = entity;
	}

	/**
	 * Add a function (`callback`) that will modify value for setting `key`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/adapters/} for more info
	 */
	public add<Key extends keyof E["_settings"]>(key: Key, callback: (value: E["_settings"][Key], target: E, key: Key) => E["_settings"][Key]): IDisposer {
		let callbacks = this._callbacks[key];

		if (callbacks === undefined) {
			callbacks = this._callbacks[key] = [];
		}

		callbacks.push(callback);

		this._entity._markDirtyKey(key);

		return new Disposer(() => {
			if ($array.removeFirst(callbacks!, callback)) {
				this._entity._markDirtyKey(key);
			}
		});
	}

	/**
	 * Removes all adapters for the specific key.
	 *
	 * @since 5.1.0
	 */
	public remove<Key extends keyof E["_settings"]>(key: Key) {
		const callbacks = this._callbacks[key];

		if (callbacks !== undefined) {
			delete this._callbacks[key];

			if (callbacks.length !== 0) {
				this._entity._markDirtyKey(key);
			}
		}
	}

	/**
	 * Enables (previously disabled) adapters for specific key.
	 *
	 * @since 5.1.0
	 */
	public enable<Key extends keyof E["_settings"]>(key: Key) {
		if (this._disabled[key]) {
			delete this._disabled[key];
			this._entity._markDirtyKey(key);
		}
	}

	/**
	 * Disables all adapters for specific key.
	 *
	 * @since 5.1.0
	 */
	public disable<Key extends keyof E["_settings"]>(key: Key) {
		if (!this._disabled[key]) {
			this._disabled[key] = true;
			this._entity._markDirtyKey(key);
		}
	}

	/**
	 * @ignore
	 */
	public fold<Key extends keyof E["_settings"]>(key: Key, value: E["_settings"][Key]): E["_settings"][Key] {
		if (!this._disabled[key]) {
			const callbacks = this._callbacks[key];

			if (callbacks !== undefined) {
				for (let i = 0, len = callbacks.length; i < len; ++i) {
					value = callbacks[i](value, this._entity, key);
				}
			}
		}

		return value;
	}
}


export interface IEntitySettings {

	/**
	 * Tags which can be used by the theme rules.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
	 */
	themeTags?: Array<string>;

	/**
	 * Tags which can be used by the theme rules.
	 *
	 * These tags only apply to this object, not any children.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
	 */
	themeTagsSelf?: Array<string>;

	/**
	 * A list of themes applied to the element.
	 */
	themes?: Array<Theme>;


	/**
	 * Duration of transition from one state to another.
	 */
	stateAnimationDuration?:number;

	/**
	 * Easing of transition from one state to another.
	 */
	stateAnimationEasing?:$ease.Easing;

	/**
	 * A custom string ID for the element.
	 *
	 * If set, element can be looked up via `root.entitiesById`.
	 *
	 * Will raise error if an element with the same ID already exists.
	 */
	id?: string;

	/**
	 * A storage for any custom user data that needs to be associated with the
	 * element.
	 */
	userData?: any;

}

export interface IEntityPrivate {
}

export interface IEntityEvents {
}

/**
 * Animation options.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/} for more info
 */
export interface AnimationOptions<Key, Value> {

	/**
	 * A setting key to animate value for.
	 */
	key: Key,

	/**
	 * Initial value to animate from. If not set, will use current value.
	 */
	from?: Value;

	/**
	 * Target value to animate to.
	 */
	to: Value;

	/**
	 * Animation duration in milliseconds.
	 */
	duration: number;

	/**
	 * Easing function. Defaults to linear.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Easing_functions} for more info
	 */
	easing?: $ease.Easing;

	/**
	 * How many times to play the animation. Defaults to 1.
	 */
	loops?: number;
}

export interface IAnimationEvents {
	/**
	 * Invoked when animation was stopped, which happens in these situations:
	 * 1. When the animation reached the end.
	 * 2. When the `stop()` method is called.
	 * 3. When a new animation starts for the same key.
	 * 4. When calling `set` for the same key.
	 */
	stopped: {};
}

/**
 * Animation object.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/} for more info
 */
export class Animation<Value> {
	private _animation: IStartAnimation;
	private _from: Value;
	private _to: Value;
	private _duration: number;
	private _easing: $ease.Easing;
	private _loops: number;
	private _interpolate: <A extends Value>(diff: Time, from: A, to: A) => A;
	private _oldTime: number | null;
	private _time: number = 0;

	public _stopped: boolean = false;
	public _playing: boolean = true;

	public events: EventDispatcher<Events<this, IAnimationEvents>> = new EventDispatcher();

	constructor(animation: IStartAnimation, from: Value, to: Value, duration: number, easing: $ease.Easing, loops: number, startingTime: number | null) {
		this._animation = animation;
		this._from = from;
		this._to = to;
		this._duration = duration;
		this._easing = easing;
		this._loops = loops;
		this._interpolate = getInterpolate(from, to);
		this._oldTime = startingTime;
	}

	public get to() {
		return this._to;
	}

	public get from() {
		return this._from;
	}

	public get playing() {
		return this._playing;
	}

	public get stopped() {
		return this._stopped;
	}

	public stop(): void {
		if (!this._stopped) {
			this._stopped = true;
			this._playing = false;

			if (this.events.isEnabled("stopped")) {
				this.events.dispatch("stopped", {
					type: "stopped",
					target: this,
				});
			}
		}
	}

	public pause(): void {
		this._playing = false;
		this._oldTime = null;
	}

	public play(): void {
		if (!this._stopped && !this._playing) {
			this._playing = true;
			this._animation._startAnimation();
		}
	}

	public get percentage(): Time {
		return this._time / this._duration;
	}

	public waitForStop(): Promise<void> {
		return new Promise((resolve, _reject) => {
			if (this._stopped) {
				resolve();

			} else {
				const listener = () => {
					stopped.dispose();
					resolve();
				};

				const stopped = this.events.on("stopped", listener);
			}
		});
	}

	public _checkEnded(): boolean {
		if (this._loops > 1) {
			--this._loops;
			return false;

		} else {
			return true;
		}
	}

	public _run(currentTime: number): void {
		if (this._oldTime !== null) {
			this._time += currentTime - this._oldTime;

			if (this._time > this._duration) {
				this._time = this._duration;
			}
		}

		this._oldTime = currentTime;
	}

	public _reset(currentTime: number): void {
		this._oldTime = currentTime;
		this._time = 0;
	}

	public _value(diff: Time): Value {
		return this._interpolate(this._easing(diff), this._from, this._to);
	}
}

type Animated<P> = { [K in keyof P]?: Animation<P[K]> };


interface IStartAnimation {
	_startAnimation(): void;
}


/**
 * @ignore
 */
let counter = 0;

/**
 * Base class for [[Entity]] objects that support Settings.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
 */
export abstract class Settings implements IDisposer, IAnimation, IStartAnimation {

	/**
	 * Unique ID.
	 */
	public uid: number = ++counter;

	public _settings: {};
	public _privateSettings: {} = {};

	public _settingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K], O extends this>(value: V, target?: O, key?: K) => void> } = {};
	public _privateSettingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K], O extends this>(value: V, target?: O, key?: K) => void> } = {};

	public _prevSettings: this["_settings"] = {};
	public _prevPrivateSettings: this["_privateSettings"] = {};

	protected _animatingSettings: Animated<this["_settings"]> = {};
	protected _animatingPrivateSettings: Animated<this["_privateSettings"]> = {};

	private _disposed: boolean = false;

	// TODO move this into Entity
	protected _userProperties: Dirty<this["_settings"]> = {};

	/**
	 * If this is set to `false` then disposing does nothing, it's a no-op.
	 */
	public enableDispose: boolean = true;

	constructor(settings: Settings["_settings"]) {
		this._settings = settings;
	}

	protected _checkDirty(): void {
		$object.keys(this._settings).forEach((key) => {
			(this._userProperties as any)[key] = true;
			this._markDirtyKey(key);
		});
	}

	/**
	 * @ignore
	 */
	public resetUserSettings(){
		this._userProperties = {};
	}

	/**
	 * @ignore
	 */
	public abstract markDirty(): void;

	public _runAnimation(currentTime: number): AnimationState {
		let state = AnimationState.Stopped;

		if (!this.isDisposed()) {
			let playing = false;
			let paused = false;

			$object.each(this._animatingSettings, (key, animation) => {
				if (animation.stopped) {
					this._stopAnimation(key);

				} else if (animation.playing) {
					animation._run(currentTime);

					const diff = animation.percentage;

					if (diff >= 1) {
						if (animation._checkEnded()) {
							this.set(key, animation._value(1));

						} else {
							playing = true;
							animation._reset(currentTime);
							this._set(key, animation._value(1));
						}

					} else {
						playing = true;
						this._set(key, animation._value(diff));
					}

				} else {
					paused = true;
				}
			});

			$object.each(this._animatingPrivateSettings, (key, animation) => {
				if (animation.stopped) {
					this._stopAnimationPrivate(key);

				} else if (animation.playing) {
					animation._run(currentTime);

					const diff = animation.percentage;

					if (diff >= 1) {
						if (animation._checkEnded()) {
							this.setPrivate(key, animation._value(1));

						} else {
							playing = true;
							animation._reset(currentTime);
							this._setPrivate(key, animation._value(1));
						}

					} else {
						playing = true;
						this._setPrivate(key, animation._value(diff));
					}

				} else {
					paused = true;
				}
			});

			if (playing) {
				state = AnimationState.Playing;

			} else if (paused) {
				state = AnimationState.Paused;
			}
		}

		return state;
	}

	public abstract _startAnimation(): void;
	protected abstract _animationTime(): number | null;

	public _markDirtyKey<Key extends keyof this["_settings"]>(_key: Key) {
		this.markDirty();
	}

	public _markDirtyPrivateKey<Key extends keyof this["_privateSettings"]>(_key: Key) {
		this.markDirty();
	}

	/**
	 * Sets a callback function to invoke when specific key of settings changes
	 * or is set.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/events/#Settings_value_change} for more info
	 * @param   key       Settings key
	 * @param   callback  Callback
	 * @return            Disposer for event
	 */
	public on<Key extends keyof this["_settings"]>(key: Key, callback: (value: this["_settings"][Key], target?: this, key?: Key) => void): IDisposer {
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

	/**
	 * Removes a callback for when value of a setting changes.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/events/#Settings_value_change} for more info
	 * @param   key       Private settings key
	 * @param   callback  Callback
	 * @since 5.9.2
	 */
	public off<Key extends keyof this["_settings"]>(key: Key, callback?: (value: this["_settings"][Key], target?: this, key?: Key) => void): void {
		let events = this._settingEvents[key];
		if (events !== undefined && callback !== undefined) {
			$array.removeFirst(events, callback);
		}
		else {
			delete this._settingEvents[key];
		}
	}

	/**
	 * Sets a callback function to invoke when specific key of private settings
	 * changes or is set.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/events/#Settings_value_change} for more info
	 * @param   key       Private settings key
	 * @param   callback  Callback
	 * @return            Disposer for event
	 */
	public onPrivate<Key extends keyof this["_privateSettings"]>(key: Key, callback: (value: this["_privateSettings"][Key], target?: this, key?: Key) => void): IDisposer {
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

	/**
	 * Removes a callback for when value of a private setting changes.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/events/#Settings_value_change} for more info
	 * @param   key       Private settings key
	 * @param   callback  Callback
	 * @since 5.9.2
	 */
	public offPrivate<Key extends keyof this["_privateSettings"]>(key: Key, callback?: (value: this["_privateSettings"][Key], target?: this, key?: Key) => void): void {
		let events = this._privateSettingEvents[key];
		if (events !== undefined && callback !== undefined) {
			$array.removeFirst(events, callback);
		}
		else {
			delete this._privateSettingEvents[key];
		}
	}

/**
	 * @ignore
	 */
	public getRaw<Key extends keyof this["_settings"], F>(key: Key, fallback: F): NonNullable<this["_settings"][Key]> | F;

	/**
	 * @ignore
	 */
	public getRaw<Key extends keyof this["_settings"]>(key: Key): this["_settings"][Key];

	/**
	 * @ignore
	 */
	public getRaw<Key extends keyof this["_settings"]>(key: Key, fallback?: any): any {
		const value = (<any>this._settings)[key];

		if (value !== undefined) {
			return value;

		} else {
			return fallback;
		}
	}

	/**
	 * Returns `true` if the setting exists.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param   key        Settings key
	 * @return  {boolean}  Key exists
	 */
	public has<Key extends keyof this["_settings"]>(key: Key): boolean {
		return key in this._settings;
	}

	/**
	 * Returns settings value for the specified `key`.
	 *
	 * If there is no value, `fallback` is returned instead (if set).
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param   key       Settings value
	 * @param   callback  Fallback value
	 * @return  {any}     Value
	 */
	public get<Key extends keyof this["_settings"], F>(key: Key, fallback: F): NonNullable<this["_settings"][Key]> | F;
	public get<Key extends keyof this["_settings"]>(key: Key): this["_settings"][Key];
	public get<Key extends keyof this["_settings"]>(key: Key, fallback?: any): any {
		return this.getRaw(key, fallback);
	}

	protected _sendKeyEvent<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value): void {
		const events = this._settingEvents[key];

		if (events !== undefined) {
			$array.each(events!, (callback) => {
				callback(value, this, key);
			});
		}
	}

	protected _sendPrivateKeyEvent<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value): void {
		const events = this._privateSettingEvents[key];

		if (events !== undefined) {
			$array.each(events!, (callback) => {
				callback(value, this, key);
			});
		}
	}

	/**
	 * @ignore
	 */
	private _setRaw<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, old: Value, value: Value) {
		this._prevSettings[key] = old;
		this._sendKeyEvent(key, value);
	}

	/**
	 * @ignore
	 */
	public setRaw<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value) {
		const old = (<any>this._settings)[key];

		(<any>this._settings)[key] = value;

		if (old !== value) {
			this._setRaw(key, old, value);
		}
	}

	/**
	 * @ignore
	 */
	private _set<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		const old = (<any>this._settings)[key];

		(<any>this._settings)[key] = value;

		if (old !== value) {
			this._setRaw(key, old, value);
			this._markDirtyKey(key);
		}
	}


	protected _stopAnimation<Key extends keyof this["_settings"]>(key: Key): void {
		const animation = this._animatingSettings[key];

		if (animation) {
			delete this._animatingSettings[key];
			animation.stop();
		}
	}

	/**
	 * Sets a setting `value` for the specified `key`, and returns the same `value`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param   key       Setting key
	 * @param   value     Setting value
	 * @return            Setting value
	 */
	public set<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value): Value {
		this._set(key, value);
		this._stopAnimation(key);
		return value;
	}

	/**
	 * Removes a setting value for the specified `key`;
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param   key       Setting key
	 */
	public remove<Key extends keyof this["_settings"]>(key: Key): void {
		if (key in this._settings) {
			this._prevSettings[key] = (<any>this._settings)[key];

			delete (<any>this._settings)[key];

			this._sendKeyEvent(key, undefined as any);
			this._markDirtyKey(key);
		}

		this._stopAnimation(key);
	}

	/**
	 * Removes all keys;
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 */
	public removeAll(): void {
		$array.each($object.keys(this._settings), (key) => {
			this.remove(key);
		});
	}

	/**
	 * @ignore
	 */
	public getPrivate<Key extends keyof this["_privateSettings"], F>(key: Key, fallback: F): NonNullable<this["_privateSettings"][Key]> | F;

	/**
	 * @ignore
	 */
	public getPrivate<Key extends keyof this["_privateSettings"]>(key: Key): this["_privateSettings"][Key];

	/**
	 * Returns a value of a private setting.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/#Private_settings} for more info
	 */
	public getPrivate<Key extends keyof this["_privateSettings"]>(key: Key, fallback?: any): any {
		const value = (<any>this._privateSettings)[key];

		if (value !== undefined) {
			return value;

		} else {
			return fallback;
		}
	}

	/**
	 * @ignore
	 */
	private _setPrivateRaw<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, old: Value, value: Value) {
		this._prevPrivateSettings[key] = old;
		this._sendPrivateKeyEvent(key, value);
	}

	/**
	 * @ignore
	 */
	public setPrivateRaw<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, value: Value) {
		const old = (<any>this._privateSettings)[key];

		(<any>this._privateSettings)[key] = value;

		if (old !== value) {
			this._setPrivateRaw(key, old, value);
		}
	}

	/**
	 * @ignore
	 */
	private _setPrivate<Key extends keyof this["_privateSettings"]>(key: Key, value: this["_privateSettings"][Key]) {
		const old = (<any>this._privateSettings)[key];

		(<any>this._privateSettings)[key] = value;

		if (old !== value) {
			this._setPrivateRaw(key, old, value);
			this._markDirtyPrivateKey(key);
		}
	}

	protected _stopAnimationPrivate<Key extends keyof this["_privateSettings"]>(key: Key): void {
		const animation = this._animatingPrivateSettings[key];

		if (animation) {
			animation.stop();
			delete this._animatingPrivateSettings[key];
		}
	}

	/**
	 * @ignore
	 */
	public setPrivate<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, value: Value): Value {
		this._setPrivate(key, value);
		this._stopAnimationPrivate(key);
		return value;
	}

	/**
	 * @ignore
	 */
	public removePrivate<Key extends keyof this["_privateSettings"]>(key: Key): void {
		if (key in this._privateSettings) {
			this._prevPrivateSettings[key] = (<any>this._privateSettings)[key];

			delete (<any>this._privateSettings)[key];

			this._markDirtyPrivateKey(key);
		}

		this._stopAnimationPrivate(key);
	}

	/**
	 * Sets multiple settings at once.
	 *
	 * `settings` must be an object with key: value pairs.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param settings Settings
	 */
	public setAll(settings: Partial<this["_settings"]>) {
		$object.each(settings, (key, value) => {
			this.set(key, value);
		});
	}

	/**
	 * Animates setting values from current/start values to new ones.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Animating_settings} for more info
	 * @param   options  Animation options
	 * @return           Animation object
	 */
	public animate<Key extends keyof this["_settings"]>(options: AnimationOptions<Key, this["_settings"][Key]>): Animation<this["_settings"][Key]> {
		const key = options.key;
		const to = options.to;
		const duration = options.duration || 0;
		const loops = options.loops || 1;

		const from = (options.from === undefined ? this.get(key) : options.from);
		const easing = (options.easing === undefined ? $ease.linear : options.easing);

		if (duration === 0) {
			this.set(key, to);

		} else {
			if (from === undefined || from === to) {
				this.set(key, to);

			} else {
				this.set(key, from);

				const animation = this._animatingSettings[key] = new Animation(this, from, to, duration, easing, loops, this._animationTime());

				this._startAnimation();

				return animation;
			}
		}

		const animation = new Animation(this, from, to, duration, easing, loops, null);
		animation.stop();
		return animation;
	}

	/**
	 * @ignore
	 */
	public animatePrivate<Key extends keyof this["_privateSettings"]>(options: AnimationOptions<Key, this["_privateSettings"][Key]>): Animation<this["_privateSettings"][Key]> {
		const key = options.key;
		const to = options.to;
		const duration = options.duration || 0;
		const loops = options.loops || 1;

		const from = (options.from === undefined ? this.getPrivate(key) : options.from);
		const easing = (options.easing === undefined ? $ease.linear : options.easing);

		if (duration === 0) {
			this.setPrivate(key, to);

		} else {
			if (from === undefined || from === to) {
				this.setPrivate(key, to);

			} else {
				this.setPrivate(key, from);

				const animation = this._animatingPrivateSettings[key] = new Animation(this, from, to, duration, easing, loops, this._animationTime());

				this._startAnimation();

				return animation;
			}
		}

		const animation = new Animation(this, from, to, duration, easing, loops, null);
		animation.stop();
		return animation;
	}

	protected _dispose() {}

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
		if (this.enableDispose && !this._disposed) {
			this._disposed = true;
			this._dispose();
		}
	}
}

/**
 * Base class.
 *
 * @important
 */
export class Entity extends Settings implements IDisposer {
	public _root: Root;

	public _user_id:any; // for testing purposes

	declare public _settings: IEntitySettings;
	declare public _privateSettings: IEntityPrivate;
	declare public _events: IEntityEvents;

	public states: States<this> = new States(this);
	public adapters: Adapters<this> = new Adapters(this);
	public events: EventDispatcher<Events<this, this["_events"]>> = this._createEvents();

	protected _userPrivateProperties: Dirty<this["_privateSettings"]> = {};

	public _dirty: Dirty<this["_settings"]> = {};
	public _dirtyPrivate: Dirty<this["_privateSettings"]> = {};

	protected _template: Template<this> | undefined;

	// Templates for the themes
	protected _templates: Array<Template<this>> = [];

	// Internal templates which can be overridden by the user's templates
	protected _internalTemplates: Array<Template<this>>;

	// Default themes which can be overridden by the user's themes
	public _defaultThemes: Array<Theme> = [];

	// Disposers for all of the templates
	protected _templateDisposers: Array<IDisposer> = [];

	protected _disposers: Array<IDisposer> = [];

	// Whether the template setup function should be run
	protected _runSetup: boolean = true;

	public static className: string = "Entity";
	public static classNames: Array<string> = ["Entity"];

	protected _disposerProperties: { [Key in keyof this["_settings"]]?: Array<IDisposer> } = {};

	/**
	 * IMPORTANT! Do not instantiate this class via `new Class()` syntax.
	 *
	 * Use static method `Class.new()` instead.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @ignore
	 */
	constructor(root: Root, settings: Entity["_settings"], isReal: boolean, templates: Array<Template<Entity>> = []) {
		super(settings);
		if (!isReal) {
			throw new Error("You cannot use `new Class()`, instead use `Class.new()`");
		}
		this._root = root;
		this._internalTemplates = templates as Array<Template<this>>;

		if (settings.id) {
			this._registerId(settings.id);
		}
	}

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	static new<C extends typeof Entity, T extends InstanceType<C>>(this: C, root: Root, settings: T["_settings"], template?: Template<T>): T {
		const x = (new this(root, settings, true)) as T;
		x._template = template;
		x._afterNew();
		return x;
	}

	static _new<C extends typeof Entity, T extends InstanceType<C>>(this: C, root: Root, settings: T["_settings"], templates: Array<Template<T>> = []): T {
		const x = (new this(root, settings, true, templates)) as T;
		x._afterNew();
		return x;
	}

	protected _afterNew() {
		this._checkDirty();

		let shouldApply = false;

		const template = this._template;

		if (template) {
			shouldApply = true;
			template._setObjectTemplate(this);
		}

		$array.each(this._internalTemplates, (template) => {
			shouldApply = true;
			template._setObjectTemplate(this);
		});

		if (shouldApply) {
			this._applyTemplates(false);
		}

		this.states.create("default", {});

		this._setDefaults();
	}

	// This is the same as _afterNew, except it also applies the themes.
	// This should only be used for classes which don't have a parent (because they extend from Entity and not Sprite).
	protected _afterNewApplyThemes() {
		this._checkDirty();

		const template = this._template;

		if (template) {
			template._setObjectTemplate(this);
		}

		$array.each(this._internalTemplates, (template) => {
			template._setObjectTemplate(this);
		});

		this.states.create("default", {});

		this._setDefaults();

		this._applyThemes();
	}

	protected _createEvents(): EventDispatcher<Events<this, this["_events"]>> {
		return new EventDispatcher();
	}

	/**
	 * @ignore
	 */
	public get classNames(): Array<string> {
		return (this.constructor as any).classNames;
	}

	/**
	 * @ignore
	 */
	public get className(): string {
		return (this.constructor as any).className;
	}

	protected _setDefaults(){

	}

	public _setDefaultFn<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, f: () => Value): NonNullable<this["_settings"][Key]> | Value {
		const value = this.get(key);

		if (value) {
			return value as any;

		} else {
			const value = f();
			this.set(key, value);
			return value;
		}
	}

	public _setDefault<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		if (!this.has(key)) {
			super.set(key, value);
		}
	}

	public _setRawDefault<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		if (!this.has(key)) {
			super.setRaw(key, value);
		}
	}

	public _clearDirty() {
		$object.keys(this._dirty).forEach((key) => {
			this._dirty[key] = false;
		});

		$object.keys(this._dirtyPrivate).forEach((key) => {
			this._dirtyPrivate[key] = false;
		});
	}

	/**
	 * @ignore
	 */
	public isDirty<Key extends keyof this["_settings"]>(key: Key): boolean {
		return !!this._dirty[key];
	}

	/**
	 * @ignore
	 */
	public isPrivateDirty<Key extends keyof this["_privateSettings"]>(key: Key): boolean {
		return !!this._dirtyPrivate[key];
	}

	public _markDirtyKey<Key extends keyof this["_settings"]>(key: Key) {
		this._dirty[key] = true;
		super._markDirtyKey(key);
	}

	public _markDirtyPrivateKey<Key extends keyof this["_privateSettings"]>(key: Key) {
		this._dirtyPrivate[key] = true;
		super._markDirtyKey(key);
	}

	/**
	 * Checks if element is of certain class (or inherits one).
	 *
	 * @param   type  Class name to check
	 * @return {boolean} Is of class?
	 */
	public isType<A>(type: string): this is A {
		return this.classNames.indexOf(type) !== -1;
	}

	protected _pushPropertyDisposer<Key extends keyof this["_settings"], D extends IDisposer>(key: Key, disposer: D): D {
		let disposers = this._disposerProperties[key];

		if (disposers === undefined) {
			disposers = this._disposerProperties[key] = [];
		}

		disposers.push(disposer);

		return disposer;
	}

	protected _disposeProperty<Key extends keyof this["_settings"]>(key: Key): void {
		const disposers = this._disposerProperties[key];

		if (disposers !== undefined) {
			$array.each(disposers!, (disposer) => {
				disposer.dispose();
			});

			delete this._disposerProperties[key];
		}
	}

	/**
	 * @todo needs description
	 * @param  value  Template
	 */
	public set template(value: Template<this> | undefined) {
		const template = this._template;

		if (template !== value) {
			this._template = value;

			if (template) {
				template._removeObjectTemplate(this);
			}

			if (value) {
				value._setObjectTemplate(this);
			}

			this._applyTemplates();
		}
	}

	public get template(): Template<this> | undefined {
		return this._template;
	}

	/**
	 * @ignore
	 */
	public markDirty() {
		this._root._addDirtyEntity(this);
	}

	public _startAnimation(): void {
		this._root._addAnimation(this);
	}

	protected _animationTime(): number | null {
		return this._root.animationTime;
	}

	public _applyState(_name: string): void { }
	public _applyStateAnimated(_name: string, _duration?: number): void { }

	/**
	 * Returns settings value for the specified `key`.
	 *
	 * If there is no value, `fallback` is returned instead (if set).
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param   key       Settings value
	 * @param   callback  Fallback value
	 * @return            Value
	 */
	public get<Key extends keyof this["_settings"], F>(key: Key, fallback: F): NonNullable<this["_settings"][Key]> | F;
	public get<Key extends keyof this["_settings"]>(key: Key): this["_settings"][Key];
	public get<Key extends keyof this["_settings"]>(key: Key, fallback?: any): any {
		const value = this.adapters.fold(key, (<any>this._settings)[key]);

		if (value !== undefined) {
			return value;

		} else {
			return fallback;
		}
	}

	/**
	 * @ignore
	 */
	public isUserSetting<Key extends keyof this["_settings"]>(key: Key): boolean {
		return this._userProperties[key] || false;
	}

	/**
	 * Sets a setting `value` for the specified `key`, and returns the same `value`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param   key       Setting key
	 * @param   value     Setting value
	 * @return            Setting value
	 */
	public set<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value): Value {
		this._userProperties[key] = true;
		return super.set(key, value);
	}


	/**
	 * @ignore
	 */
	public setRaw<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value) {
		this._userProperties[key] = true;
		super.setRaw(key, value);
	}

	/**
	 * Sets a setting `value` for the specified `key` only if the value for this key was not set previously using set method, and returns the same `value`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param   key       Setting key
	 * @param   value     Setting value
	 * @return            Setting value
	 */
	public _setSoft<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value): Value {
		if(!this._userProperties[key]){
			return super.set(key, value);
		}
		return value;
	}

	/**
	 * Removes a setting value for the specified `key`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param   key       Setting key
	 */
	public remove<Key extends keyof this["_settings"]>(key: Key) {
		delete this._userProperties[key];
		this._removeTemplateProperty(key);
	}

	/**
	 * @ignore
	 */
	public setPrivate<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, value: Value): Value {
		this._userPrivateProperties[key] = true;
		return super.setPrivate(key, value);
	}

	/**
	 * @ignore
	 */
	public setPrivateRaw<Key extends keyof this["_privateSettings"], Value extends this["_privateSettings"][Key]>(key: Key, value: Value) {
		this._userPrivateProperties[key] = true;
		super.setPrivateRaw(key, value);
	}

	/**
	 * @ignore
	 */
	public removePrivate<Key extends keyof this["_privateSettings"]>(key: Key) {
		delete this._userPrivateProperties[key];
		this._removeTemplatePrivateProperty(key);
	}

	public _setTemplateProperty<Key extends keyof this["_settings"]>(template: Template<this>, key: Key, value: this["_settings"][Key]) {
		if (!this._userProperties[key]) {
			const match = this._findTemplateByKey(key);

			if (template === match) {
				super.set(key, value);
			}
		}
	}

	public _setTemplatePrivateProperty<Key extends keyof this["_privateSettings"]>(template: Template<this>, key: Key, value: this["_privateSettings"][Key]) {
		if (!this._userPrivateProperties[key]) {
			const match = this._findTemplateByPrivateKey(key);

			if (template === match) {
				super.setPrivate(key, value);
			}
		}
	}

	public _removeTemplateProperty<Key extends keyof this["_settings"]>(key: Key) {
		if (!this._userProperties[key]) {
			const match = this._findTemplateByKey(key);

			if (match) {
				// TODO don't stop the animation if the property didn't change
				super.set(key, match._settings[key]!);

			} else {
				super.remove(key);
			}
		}
	}

	public _removeTemplatePrivateProperty<Key extends keyof this["_privateSettings"]>(key: Key) {
		if (!this._userPrivateProperties[key]) {
			const match = this._findTemplateByPrivateKey(key);

			if (match) {
				// TODO don't stop the animation if the property didn't change
				super.setPrivate(key, match._privateSettings[key]);

			} else {
				super.removePrivate(key);
			}
		}
	}

	public _walkParents(f: (parent: Entity) => void): void {
		f(this._root._rootContainer);
		f(this);
	}

	// TODO faster version of this method which is specialized to just 1 key
	public _applyStateByKey(name: string): void {
		const other = this.states.create(name, {});
		const seen: Dirty<this["_settings"]> = {};

		this._eachTemplate((template) => {
			const state = template.states.lookup(name);

			if (state) {
				state._apply(other, seen);
			}
		});

		$object.each(other._settings, (key) => {
			if (!seen[key] && !other._userSettings[key]) {
				other.remove(key);
			}
		});
	}

	protected _applyTemplate(template: Template<this>, state: ApplyState<this>): void {
		this._templateDisposers.push(template._apply(this, state));

		$object.each(template._settings, (key, value) => {
			if (!state.settings[key] && !this._userProperties[key]) {
				state.settings[key] = true;
				super.set(key, value);
			}
		});

		$object.each(template._privateSettings, (key, value) => {
			if (!state.privateSettings[key] && !this._userPrivateProperties[key]) {
				state.privateSettings[key] = true;
				super.setPrivate(key, value);
			}
		});

		if (this._runSetup && template.setup) {
			this._runSetup = false;
			template.setup(this);
		}
	}

	/**
	 * Calls the closure with each template and returns the first template which is true
	 */
	protected _findStaticTemplate(f: (template: Template<this>) => boolean): Template<this> | undefined {
		if (this._template) {
			if (f(this._template)) {
				return this._template;
			}
		}
	}

	public _eachTemplate(f: (template: Template<this>) => void): void {
		this._findStaticTemplate((template) => {
			f(template);
			return false;
		});

		// _internalTemplates is sorted with most specific to the right
		$array.eachReverse(this._internalTemplates, f);

		// _templates is sorted with most specific to the left
		$array.each(this._templates, f);
	}

	public _applyTemplates(remove: boolean = true): void {
		if (remove) {
			this._disposeTemplates();
		}

		const state: ApplyState<this> = {
			settings: {},
			privateSettings: {},
			states: {},
		};

		this._eachTemplate((template) => {
			this._applyTemplate(template, state);
		});

		if (remove) {
			$object.each(this._settings, (key) => {
				if (!this._userProperties[key] && !state.settings[key]) {
					super.remove(key);
				}
			});

			$object.each(this._privateSettings, (key) => {
				if (!this._userPrivateProperties[key] && !state.privateSettings[key]) {
					super.removePrivate(key);
				}
			});
		}
	}

	protected _findTemplate(f: (template: Template<this>) => boolean): Template<this> | undefined {
		const value = this._findStaticTemplate(f);

		if (value === undefined) {
			// _internalTemplates is sorted with most specific to the right
			const value = $array.findReverse(this._internalTemplates, f);

			if (value === undefined) {
				// _templates is sorted with most specific to the left
				return $array.find(this._templates, f);

			} else {
				return value;
			}

		} else {
			return value;
		}
	}

	protected _findTemplateByKey<Key extends keyof this["_settings"]>(key: Key): Template<this> | undefined {
		return this._findTemplate((template) => {
			return key in template._settings;
		});
	}

	protected _findTemplateByPrivateKey<Key extends keyof this["_privateSettings"]>(key: Key): Template<this> | undefined {
		return this._findTemplate((template) => {
			return key in template._privateSettings;
		});
	}

	protected _disposeTemplates() {
		$array.each(this._templateDisposers, (disposer) => {
			disposer.dispose();
		});

		this._templateDisposers.length = 0;
	}

	protected _removeTemplates() {
		$array.each(this._templates, (template) => {
			template._removeObjectTemplate(this);
		});

		this._templates.length = 0;
	}

	public _applyThemes(force: boolean = false): boolean {
		let isConnected = false;

		const defaults: Array<Array<Theme>> = [];

		let themes: Array<Array<Theme>> = [];

		const themeTags: Set<string> = new Set();

		const tags = this.get("themeTagsSelf");

		if (tags) {
			$array.each(tags, (tag) => {
				themeTags.add(tag);
			});
		}

		this._walkParents((entity) => {
			if (entity === this._root._rootContainer) {
				isConnected = true;
			}

			if (entity._defaultThemes.length > 0) {
				defaults.push(entity._defaultThemes);
			}

			const theme = entity.get("themes");

			if (theme) {
				themes.push(theme);
			}

			const tags = entity.get("themeTags");

			if (tags) {
				$array.each(tags, (tag) => {
					themeTags.add(tag);
				});
			}
		});

		themes = defaults.concat(themes);

		this._removeTemplates();

		if (isConnected || force) {
			$array.eachReverse(this.classNames, (name) => {
				const allRules: Array<IRule<this>> = [];

				$array.each(themes, (themes) => {
					$array.each(themes, (theme) => {
						const rules = theme._lookupRules<this>(name);

						if (rules) {
							$array.eachReverse(rules, (rule) => {
								const matches = rule.tags.every((tag) => {
									return themeTags.has(tag);
								});

								if (matches) {
									const result = $array.getFirstSortedIndex(allRules, (x) => {
										const order = $order.compare(rule.tags.length, x.tags.length);

										if (order === 0) {
											return $order.compareArray(rule.tags, x.tags, $order.compare);

										} else {
											return order;
										}
									});

									allRules.splice(result.index, 0, rule);
								}
							});
						}
					});
				});

				$array.each(allRules, (rule) => {
					this._templates.push(rule.template);
					rule.template._setObjectTemplate(this);
				});
			});
		}

		this._applyTemplates();

		if (isConnected || force) {
			// This causes it to only run the setup function the first time that the themes are applied
			this._runSetup = false;
		}

		return isConnected || force;
	}

	public _changed(): void { }

	public _beforeChanged(): void {

		if (this.isDirty("id")) {
			const id = this.get("id")!;
			if (id) {
				this._registerId(id);
			}

			const prevId = this._prevSettings.id;
			if(prevId) {
				delete this._root.entitiesById[prevId];
				delete registry.entitiesById[prevId];
			}
		}
	}

	private _registerId(id: string): void {
		if (this._root.entitiesById[id] && this._root.entitiesById[id] !== this) {
			throw new Error("An entity with id \"" + id + "\" already exists.");
		}

		this._root.entitiesById[id] = this;
		registry.entitiesById[id] = this;
	}

	public _afterChanged(): void { }

	/**
	 * @ignore
	 */
	public addDisposer<T extends IDisposer>(disposer: T): T {
		this._disposers.push(disposer);
		return disposer;
	}

	protected _dispose() {
		super._dispose();

		const template = this._template;

		if (template) {
			template._removeObjectTemplate(this);
		}

		$array.each(this._internalTemplates, (template) => {
			template._removeObjectTemplate(this);
		});

		this._removeTemplates();
		this._disposeTemplates();

		this.events.dispose();

		this._disposers.forEach((x) => {
			x.dispose();
		});

		$object.each(this._disposerProperties, (_, disposers) => {
			$array.each(disposers, (disposer) => {
				disposer.dispose();
			});
		});

		const id = this.get("id")!;
		if (id) {
			delete this._root.entitiesById[id];
			delete registry.entitiesById[id];
		}
	}

	/**
	 * Creates and returns a "disposable" timeout.
	 *
	 * @param   fn     Callback
	 * @param   delay  Delay in milliseconds
	 * @return         Timeout disposer
	 */
	public setTimeout(fn: () => void, delay: number): IDisposer {
		const id = setTimeout(() => {
			this.removeDispose(disposer);
			fn();
		}, delay);

		const disposer = new Disposer(() => {
			clearTimeout(id);
		});

		this._disposers.push(disposer);
		return disposer;
	}

	/**
	 * @ignore
	 */
	public removeDispose(target: IDisposer): void {
		if (!this.isDisposed()) {
			let index = $array.indexOf(this._disposers, target);
			if (index > -1) {
				this._disposers.splice(index, 1);
			}
		}

		target.dispose();
	}

	/**
	 * @ignore
	 */
	public hasTag(tag: string): boolean {
		return $array.indexOf(this.get("themeTags", []), tag) !== -1;
	}

	/**
	 * @ignore
	 */
	public addTag(tag: string): void {
		if (!this.hasTag(tag)) {
			const tags = (<any>this).get("themeTags", []);
			tags.push(tag);
			this.set("themeTags", tags);
		}
	}

	/**
	 * @ignore
	 */
	public removeTag(tag: string): void {
		if (this.hasTag(tag)) {
			const tags = (<any>this).get("themeTags", []);
			$array.remove(tags, tag);
			this.set("themeTags", tags);
		}
	}

	protected _t(text: any, locale?: ILocale, ...rest: Array<string>){
		return this._root.language.translate(text, locale, ...rest);
	}

	/**
	 * An instance of [[Root]] object.
	 *
	 * @readonly
	 * @since 5.0.6
	 * @return Root object
	 */
	public get root(): Root {
		return this._root;
	}

}
