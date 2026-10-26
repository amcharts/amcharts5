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
 * Functions that modify an element's setting values each time they are read.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/settings/adapters/} for more info
 */
export class Adapters<E extends Settings> {
	private _entity: E;
	private _callbacks: { [K in keyof E["_settings"]]?: Array<<O extends E>(value: O["_settings"][K], target: O, key: K) => O["_settings"][K]> } = {};
	private _disabled: { [K in keyof E["_settings"]]?: boolean } = {};

	constructor(entity: E) {
		this._entity = entity;
	}

	/**
	 * Adds a function that modifies the value of setting `key` each time it is
	 * read.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/adapters/} for more info
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

		this._entity._markDirtyKey(key);

		return new Disposer(() => {
			if ($array.removeFirst(callbacks!, callback)) {
				this._entity._markDirtyKey(key);
			}
		});
	}

	/**
	 * Removes all adapters for setting `key`.
	 *
	 * @since 5.1.0
	 * @param  key  Setting key
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
	 * Turns the adapters for setting `key` back on after `disable()`.
	 *
	 * @since 5.1.0
	 * @param  key  Setting key
	 */
	public enable<Key extends keyof E["_settings"]>(key: Key) {
		if (this._disabled[key]) {
			delete this._disabled[key];
			this._entity._markDirtyKey(key);
		}
	}

	/**
	 * Turns off all adapters for setting `key` without removing them.
	 *
	 * @since 5.1.0
	 * @param  key  Setting key
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
	 * Ignores themes: no theme rule applies to the element, not even one of the
	 * default theme.
	 *
	 * @default false
	 * @since 5.15.6
	 */
	ignoreThemes?: boolean;

	/**
	 * Tags that theme rules can target. They also count for the element's
	 * children, so a rule can match a child by a tag of its parent.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
	 */
	themeTags?: Array<string>;

	/**
	 * Tags that theme rules can target, like `themeTags`, but only for this
	 * element, not its children.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
	 */
	themeTagsSelf?: Array<string>;

	/**
	 * Themes applied to the element and everything inside it.
	 */
	themes?: Array<Theme>;


	/**
	 * How long, in milliseconds, a switch from one state to another animates.
	 * `0` switches at once.
	 *
	 * @default 0
	 */
	stateAnimationDuration?:number;

	/**
	 * Easing of the animated switch from one state to another.
	 *
	 * @default out(cubic)
	 */
	stateAnimationEasing?:$ease.Easing;

	/**
	 * A unique ID for looking the element up in `root.entitiesById`. Setting
	 * an ID that another element already has throws an error.
	 */
	id?: string;

	/**
	 * Any data of your own to keep with the element.
	 */
	userData?: any;

	/**
	 * Animations the element plays on its own, described as data - so they can
	 * be set from a JSON config and saved with it.
	 *
	 * Each one animates a setting of the element (or, with `target: "dataItem"`,
	 * a value of its data item - a map point's `positionOnLine`, say). They start
	 * when the setting is applied, restart when it changes, and stop when the
	 * element is disposed. A saved config keeps what was configured, never a
	 * value caught half way through an animation.
	 *
	 * ```TypeScript
	 * sprite.set("animations", [
	 *   { key: "rotation", to: 360, duration: 4000, loops: 0 },
	 *   { key: "scale", from: 1, to: 1.3, duration: 800, loops: 0, yoyo: true, easing: "sine" }
	 * ]);
	 * ```
	 *
	 * @since 5.20.8
	 */
	animations?: Array<IDeclaredAnimation>;

}

/**
 * An animation described as data, for the `animations` setting.
 *
 * @since 5.20.8
 */
export interface IDeclaredAnimation {

	/**
	 * Setting (or data item value, with `target: "dataItem"`) to animate.
	 */
	key: string;

	/**
	 * Value to start from. Defaults to the current value.
	 */
	from?: any;

	/**
	 * Value to animate to.
	 */
	to: any;

	/**
	 * Duration in milliseconds. With `yoyo`, one way.
	 */
	duration: number;

	/**
	 * Milliseconds to wait before starting.
	 *
	 * @default 0
	 */
	delay?: number;

	/**
	 * How many times to play it; `0` plays it forever.
	 *
	 * @default 1
	 */
	loops?: number;

	/**
	 * Go back to `from` after reaching `to`, rather than jumping back.
	 *
	 * @default false
	 */
	yoyo?: boolean;

	/**
	 * Easing by name: `"linear"`, `"quad"`, `"cubic"`, `"exp"`, `"sine"`,
	 * `"circle"`, `"bounce"` or `"elastic"`.
	 *
	 * @default "linear"
	 */
	easing?: string;

	/**
	 * Which way the easing applies.
	 *
	 * @default "in"
	 */
	ease?: "in" | "out" | "inOut";

	/**
	 * `"self"` animates a setting of the element; `"dataItem"` a value of the
	 * element's data item.
	 *
	 * @default "self"
	 */
	target?: "self" | "dataItem";
}

export interface IEntityPrivate {
}

export interface IEntityEvents {
}

/**
 * Animation options.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/animations/} for more info
 */
export interface AnimationOptions<Key, Value> {

	/**
	 * The setting to animate.
	 */
	key: Key,

	/**
	 * Value to start from. The current value if not set.
	 */
	from?: Value;

	/**
	 * Value to animate to.
	 */
	to: Value;

	/**
	 * Duration in milliseconds. `0` sets the value at once.
	 */
	duration: number;

	/**
	 * Easing function. Linear if not set.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/animations/#easing-functions} for more info
	 */
	easing?: $ease.Easing;

	/**
	 * How many times to play the animation; `Infinity` plays it forever.
	 * Plays once if not set.
	 */
	loops?: number;
}

export interface IAnimationEvents {
	/**
	 * The animation stopped: it reached the end, `stop()` was called, or the
	 * same setting was set, removed or animated again.
	 */
	stopped: {};
}

/**
 * An animation of a setting, returned by `animate()`. It can be paused,
 * resumed, stopped or waited for.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/animations/} for more info
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

	// Started by an `animations` setting, not in code
	public _declared: boolean = false;

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

	/**
	 * The value the animation goes to.
	 */
	public get to() {
		return this._to;
	}

	/**
	 * @ignore
	 */
	public get duration(): number {
		return this._duration;
	}

	/**
	 * @ignore
	 */
	public get easing(): $ease.Easing {
		return this._easing;
	}

	/**
	 * Plays left, `Infinity` for one that loops for ever.
	 *
	 * @ignore
	 */
	public get loops(): number {
		return this._loops;
	}

	/**
	 * The value the animation starts from.
	 */
	public get from() {
		return this._from;
	}

	/**
	 * `true` while the animation plays, `false` when it is paused or stopped.
	 */
	public get playing() {
		return this._playing;
	}

	/**
	 * `true` once the animation has stopped. A stopped animation can't be
	 * played again.
	 */
	public get stopped() {
		return this._stopped;
	}

	/**
	 * Stops the animation, leaving the setting at its current value.
	 */
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

	/**
	 * Pauses the animation; `play()` resumes it.
	 */
	public pause(): void {
		this._playing = false;
		this._oldTime = null;
	}

	/**
	 * Resumes a paused animation.
	 */
	public play(): void {
		if (!this._stopped && !this._playing) {
			this._playing = true;
			this._animation._startAnimation();
		}
	}

	/**
	 * How far the current loop has played, from `0` to `1`, before easing.
	 */
	public get percentage(): Time {
		return this._time / this._duration;
	}

	/**
	 * Returns a promise that resolves when the animation stops.
	 *
	 * @return  Promise
	 */
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
		if ((diff as number) <= 0) {
			return this._from;
		}
		const eased = this._easing(diff) as number;
		if (eased >= 0.999999) {
			return this._to;
		}
		if (eased <= 0.000001) {
			return this._from;
		}
		return this._interpolate(eased, this._from, this._to);
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
 * The newest `uid` given out: anything made after this call has a higher one.
 *
 * @ignore
 */
export function _lastUid(): number {
	return counter;
}

// How many elements are being built right now
let constructing = 0;

/**
 * Base class for objects with settings, such as [[Entity]].
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
 */
export abstract class Settings implements IDisposer, IAnimation, IStartAnimation {

	/**
	 * A unique number, given to each object as it is created.
	 */
	public uid: number = ++counter;

	public _settings: {};
	public _privateSettings: {} = {};

	public _settingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K], O extends this>(value: V, target?: O, key?: K) => void> } = {};
	public _privateSettingEvents: { [K in keyof this["_settings"]]?: Array<<V extends this["_settings"][K], O extends this>(value: V, target?: O, key?: K) => void> } = {};

	public _debouncedSettingEvents: { [K in keyof this["_settings"]]?: Array<{ cb: (value: any, target?: any, key?: any) => void; delay: number; timeout?: number }> } = {};
	public _debouncedPrivateSettingEvents: { [K in keyof this["_settings"]]?: Array<{ cb: (value: any, target?: any, key?: any) => void; delay: number; timeout?: number }> } = {};

	public _prevSettings: this["_settings"] = {};
	public _prevPrivateSettings: this["_privateSettings"] = {};

	protected _animatingSettings: Animated<this["_settings"]> = {};
	protected _animatingPrivateSettings: Animated<this["_privateSettings"]> = {};

	private _disposed: boolean = false;

	// TODO move this into Entity
	protected _userProperties: Dirty<this["_settings"]> = {};

	// Settings the library worked out for itself. Anything written through
	// `_setC` is flagged in `_userProperties` as well, so that everything which
	// keys off it - themes, templates - behaves exactly as before, and only code
	// that cares about provenance (serializing) tells them apart. Defaults
	// (`_setDefault` and friends) are flagged here alone, since they never
	// counted as user properties in the first place.
	protected _computedProperties: Dirty<this["_settings"]> = {};

	/**
	 * What a setting held before an `animations` entry took it over, and where
	 * that came from - what a saved config writes, rather than a value caught
	 * mid-animation. Put back when the animation is removed.
	 *
	 * @ignore
	 */
	public _animationBases: { [key: string]: { value: any, user: boolean, computed: boolean } } = {};

	// Above zero while an animation is writing a value, so that write is not
	// mistaken for someone setting it.
	protected _animationWriting: number = 0;

	/**
	 * Set to `false` to make `dispose()` do nothing.
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
		this._computedProperties = {};
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
							this._setAnimated(key, animation._value(1));

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
	 * Calls `callback` each time the value of setting `key` changes or is
	 * removed. Setting the same value again does not call it.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
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
	 * Removes a callback added with `on()`. Without `callback`, removes all of
	 * them for `key`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
	 * @param   key       Settings key
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
	 * Like `on()`, but the callback is removed after it is called once.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
	 * @param   key       Settings key
	 * @param   callback  Callback
	 * @return            Disposer for event
	 * @since 5.20.4
	 */
	public once<Key extends keyof this["_settings"]>(key: Key, callback: (value: this["_settings"][Key], target?: this, key?: Key) => void): IDisposer {
		const disposer = this.on(key, (value, target, key) => {
			disposer.dispose();
			callback(value, target, key);
		});

		return disposer;
	}

	private _onDebouncedHelper(map: { [key: string]: any }, key: any, callback: any, delay: number): IDisposer {
		let events = map[key];

		if (events === undefined) {
			events = map[key] = [];
		}

		const entry: { cb: any; delay: number; timeout?: number } = { cb: callback, delay };
		events.push(entry);

		return new Disposer(() => {
			if (entry.timeout) {
				window.clearTimeout(entry.timeout);
			}
			$array.removeFirst(events!, entry);

			if (events!.length === 0) {
				delete map[key];
			}
		});
	}

	private _offDebouncedHelper(map: { [key: string]: any }, key: any, callback?: any): void {
		const events = map[key];

		if (events !== undefined) {
			if (callback !== undefined) {
				const index = $array.findIndex(events, (e: any) => e.cb === callback);

				if (index !== -1) {
					const entry = events[index];

					if (entry.timeout) {
						window.clearTimeout(entry.timeout);
					}

					events.splice(index, 1);

					if (events.length === 0) {
						delete map[key];
					}
				}
			} else {
				$array.each(events, (entry: any) => {
					if (entry.timeout) {
						window.clearTimeout(entry.timeout);
					}
				});

				delete map[key];
			}
		}
	}

	/**
	 * Like `on()`, but waits until setting `key` has not changed for
	 * `debounceDelay` milliseconds, then calls `callback` once with the latest
	 * value.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
	 * @param   key            Settings key
	 * @param   callback       Callback
	 * @param   debounceDelay  Debounce delay in milliseconds
	 * @return                 Disposer for event
	 */
	public onDebounced<Key extends keyof this["_settings"]>(key: Key, callback: (value: this["_settings"][Key], target?: this, key?: Key) => void, debounceDelay: number): IDisposer {
		return this._onDebouncedHelper(this._debouncedSettingEvents, key, callback, debounceDelay);
	}

	/**
	 * Removes a callback added with `onDebounced()`. Without `callback`,
	 * removes all of them for `key`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
	 * @param   key       Settings key
	 * @param   callback  Callback
	 */
	public offDebounced<Key extends keyof this["_settings"]>(key: Key, callback?: (value: this["_settings"][Key], target?: this, key?: Key) => void): void {
		this._offDebouncedHelper(this._debouncedSettingEvents, key, callback);
	}

	/**
	 * Like `onDebounced()`, but the callback is removed after it is called once.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
	 * @param   key            Settings key
	 * @param   callback       Callback
	 * @param   debounceDelay  Debounce delay in milliseconds
	 * @return                 Disposer for event
	 * @since 5.20.4
	 */
	public onceDebounced<Key extends keyof this["_settings"]>(key: Key, callback: (value: this["_settings"][Key], target?: this, key?: Key) => void, debounceDelay: number): IDisposer {
		const disposer = this.onDebounced(key, (value, target, key) => {
			disposer.dispose();
			callback(value, target, key);
		}, debounceDelay);

		return disposer;
	}

	/**
	 * Calls `callback` each time the value of private setting `key` changes.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
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
	 * Removes a callback added with `onPrivate()`. Without `callback`, removes
	 * all of them for `key`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
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
	 * Like `onPrivate()`, but waits until private setting `key` has not changed
	 * for `debounceDelay` milliseconds, then calls `callback` once with the
	 * latest value.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
	 * @param   key            Private settings key
	 * @param   callback       Callback
	 * @param   debounceDelay  Debounce delay in milliseconds
	 * @return                 Disposer for event
	 */
	public onPrivateDebounced<Key extends keyof this["_privateSettings"]>(key: Key, callback: (value: this["_privateSettings"][Key], target?: this, key?: Key) => void, debounceDelay: number): IDisposer {
		return this._onDebouncedHelper(this._debouncedPrivateSettingEvents, key, callback, debounceDelay);
	}

	/**
	 * Removes a callback added with `onPrivateDebounced()`. Without `callback`,
	 * removes all of them for `key`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/events/#settings-value-change} for more info
	 * @param   key       Private settings key
	 * @param   callback  Callback
	 */
	public offDebouncedPrivate<Key extends keyof this["_privateSettings"]>(key: Key, callback?: (value: this["_privateSettings"][Key], target?: this, key?: Key) => void): void {
		this._offDebouncedHelper(this._debouncedPrivateSettingEvents, key, callback);
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
	 * Returns `true` if setting `key` is set.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
	 * @param   key        Settings key
	 * @return  {boolean}  Key exists
	 */
	public has<Key extends keyof this["_settings"]>(key: Key): boolean {
		return key in this._settings;
	}

	/**
	 * Returns the value of setting `key`, or `fallback` if it is not set.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
	 * @param   key       Settings key
	 * @param   fallback  Value to return if the setting is not set
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
			// Iterate over a copy so a callback that removes itself (e.g. `once`)
			// does not corrupt the loop.
			$array.each(events!.slice(), (callback) => {
				callback(value, this, key);
			});
		}

		const debouncedEvents = this._debouncedSettingEvents[key];

		if (debouncedEvents !== undefined) {
			$array.each(debouncedEvents, (entry) => {
				if (entry.timeout) {
					window.clearTimeout(entry.timeout);
				}
				entry.timeout = window.setTimeout(() => {
					entry.timeout = undefined;
					entry.cb(value, this, key);
				}, entry.delay);
			});
		}
	}

	protected _sendPrivateKeyEvent<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value): void {
		const events = this._privateSettingEvents[key];

		if (events !== undefined) {
			// Iterate over a copy so a callback that removes itself (e.g. `once`)
			// does not corrupt the loop.
			$array.each(events!.slice(), (callback) => {
				callback(value, this, key);
			});
		}

		const debouncedEvents = this._debouncedPrivateSettingEvents[key];

		if (debouncedEvents !== undefined) {
			$array.each(debouncedEvents, (entry) => {
				if (entry.timeout) {
					window.clearTimeout(entry.timeout);
				}
				entry.timeout = window.setTimeout(() => {
					entry.timeout = undefined;
					entry.cb(value, this, key);
				}, entry.delay);
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
	 * Sets setting `key` to `value` and returns `value`. Stops any animation
	 * of that setting.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
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
	 * Removes the value of setting `key`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
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
	 * Removes all settings, as `remove()` does for each one.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
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
	 * Returns the value of private setting `key`: a value the element works
	 * out itself, such as its size. `fallback` if it is not set.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/#private-settings} for more info
	 * @param   key       Private setting key
	 * @param   fallback  Value to return if the setting is not set
	 * @return            Value
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
	 * Sets several settings at once, from an object of key-value pairs.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
	 * @param settings Settings
	 */
	public setAll(settings: Partial<this["_settings"]>) {
		$object.each(settings, (key, value) => {
			this.set(key, value);
		});
	}

	/**
	 * Writes a value an animation arrived at.
	 *
	 * An animation carries provenance along rather than creating it: a setting
	 * that was asked for stays that way, and one that was computed - or never set
	 * at all - does not become a choice just because something animated to it.
	 */
	protected _setAnimated<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		const authored = this._userProperties[key] && !this._computedProperties[key];

		this._animationWriting++;
		try {
			this.set(key, value as any);
		} finally {
			this._animationWriting--;
		}

		if (!authored) {
			this._computedProperties[key] = true;
		}
	}

	/**
	 * Animates a setting from its current value (or `from`) to `to`. The
	 * setting jumps to `from` at once. With `duration` `0`, or no value to
	 * start from, it is set to `to` at once and the returned animation is
	 * already stopped.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/animations/#animating-settings} for more info
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
			this._setAnimated(key, to);

		} else {
			if (from === undefined || from === to) {
				this._setAnimated(key, to);

			} else {
				this._setAnimated(key, from);

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
	 * Returns `true` if the object has been disposed.
	 *
	 * @return Disposed
	 */
	public isDisposed(): boolean {
		return this._disposed;
	}

	/**
	 * Disposes the object, freeing everything it holds. A disposed object
	 * can't be used again.
	 */
	public dispose() {
		if (this.enableDispose && !this._disposed) {
			this._disposed = true;
			this._dispose();
		}
	}
}

/**
 * Base class of amCharts objects with settings, states, adapters and events:
 * elements, series, charts, formatters and more.
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
	 * Tags given to the element, as opposed to ones the library added.
	 *
	 * @ignore
	 */
	public _userThemeTags: Array<string> | undefined;

	/**
	 * Made by the library while building another element, not by the user.
	 *
	 * @ignore
	 */
	public _builtIn: boolean = false;

	/**
	 * IMPORTANT! Do not instantiate this class via `new Class()` syntax.
	 *
	 * Use static method `Class.new()` instead.
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/#new-element-syntax} for more info
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
	 * Creates an instance of the class. Use it instead of `new Class()`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/#new-element-syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template to apply to the instance
	 * @return            Instantiated object
	 */
	static new<C extends typeof Entity, T extends InstanceType<C>>(this: C, root: Root, settings: T["_settings"], template?: Template<T>): T {
		// An element made while another one is being built is the library's, and
		// so are its tags
		const builtIn = constructing > 0;
		const userTags = !builtIn && settings.themeTags ? settings.themeTags.slice() : undefined;
		constructing++;
		try {
			const x = (new this(root, settings, true)) as T;
			x._builtIn = builtIn;
			x._userThemeTags = userTags;
			x._template = template;
			x._afterNew();
			return x;
		} finally {
			constructing--;
		}
	}

	static _new<C extends typeof Entity, T extends InstanceType<C>>(this: C, root: Root, settings: T["_settings"], templates: Array<Template<T>> = []): T {
		constructing++;
		try {
			const x = (new this(root, settings, true, templates)) as T;
			x._builtIn = true;
			x._afterNew();
			return x;
		} finally {
			constructing--;
		}
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
			this._setC(key, value);
			return value;
		}
	}

	public _setDefault<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		if (!this.has(key)) {
			super.set(key, value);
			// a default only lands when nothing was asked for, so it is the
			// library's own value - see `_setC`
			this._computedProperties[key] = true;
		}
	}

	public _setRawDefault<Key extends keyof this["_settings"]>(key: Key, value: this["_settings"][Key]) {
		if (!this.has(key)) {
			super.setRaw(key, value);
			this._computedProperties[key] = true;
		}
	}

	public _clearDirty() {
		this._animationsApplied = false;

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
	 * Returns `true` if the object is of class `type` or extends it.
	 *
	 * @param   type  Class name, such as `"XYSeries"`
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
	 * A [[Template]] applied to the object. Its settings apply where the
	 * object has none set of its own.
	 *
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
	 * Returns the value of setting `key`, run through any adapters, or
	 * `fallback` if it is not set.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
	 * @param   key       Settings key
	 * @param   fallback  Value to return if the setting is not set
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
	 * Sets setting `key` to `value` and returns `value`. A value set this way
	 * overrides themes and templates, and stops any animation of the setting.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
	 * @param   key       Setting key
	 * @param   value     Setting value
	 * @return            Setting value
	 */
	public set<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value): Value {
		this._userProperties[key] = true;
		delete this._computedProperties[key];
		// Set outright: that is what was configured now, not what the animation replaced
		if (!this._animationWriting) {
			delete this._animationBases[key as string];
		}
		return super.set(key, value);
	}

	/**
	 * Same as `set()`, but for a value the library works out itself rather than
	 * one that was asked for - a size measured during layout, a color derived
	 * from data, and so on.
	 *
	 * Behaves identically in every way that affects the chart; the value is only
	 * additionally flagged as computed, so that it can be left out when the chart
	 * is serialized.
	 *
	 * @ignore
	 * @param   key       Setting key
	 * @param   value     Setting value
	 * @return            Setting value
	 */
	public _setC<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value): Value {
		const authored = this._userProperties[key] && !this._computedProperties[key] && (this._settings as any)[key] === value;
		const result = this.set(key, value);
		if (!authored) {
			this._computedProperties[key] = true;
		}
		return result;
	}

	/**
	 * Same as `setRaw()`, but for a value the library works out itself.
	 *
	 * Kept separate from `_setC()` because `setRaw()` deliberately writes without
	 * the side effects of `set()` - no animation is stopped and no change is
	 * announced - and callers that reach for it are relying on that.
	 *
	 * @ignore
	 * @param   key       Setting key
	 * @param   value     Setting value
	 */
	public _setCRaw<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value) {
		const authored = this._userProperties[key] && !this._computedProperties[key] && (this._settings as any)[key] === value;
		this.setRaw(key, value);
		if (!authored) {
			this._computedProperties[key] = true;
		}
	}

	/**
	 * Flags already-set settings as computed, without writing anything.
	 *
	 * For settings passed to `new()` by the library itself, where re-setting them
	 * just to flag them would announce a change that never happened.
	 *
	 * @ignore
	 * @param   keys  Setting keys
	 * @return        Itself
	 */
	public _markC<T extends Entity>(this: T, ...keys: Array<keyof T["_settings"]>): T {
		$array.each(keys, (key) => {
			this._computedProperties[key] = true;
		});
		return this;
	}

	/**
	 * Sets multiple computed settings at once.
	 *
	 * @ignore
	 * @param   settings  Settings
	 */
	public _setCAll(settings: Partial<this["_settings"]>) {
		$object.each(settings, (key, value) => {
			this._setC(key, value as any);
		});
	}

	/**
	 * Returns `true` if the setting holds a value the library worked out itself.
	 *
	 * @ignore
	 * @param   key  Setting key
	 * @return       Computed?
	 */
	public isComputedSetting<Key extends keyof this["_settings"]>(key: Key): boolean {
		return this._computedProperties[key] || false;
	}


	/**
	 * @ignore
	 */
	public setRaw<Key extends keyof this["_settings"], Value extends this["_settings"][Key]>(key: Key, value: Value) {
		this._userProperties[key] = true;
		delete this._computedProperties[key];
		if (!this._animationWriting) {
			delete this._animationBases[key as string];
		}
		super.setRaw(key, value);
	}

	/**
	 * Sets setting `key` to `value` unless it was already set with `set()`.
	 * Returns `value`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
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
	 * Removes the value set for setting `key`. The setting goes back to the
	 * value from a theme or template, if one has it.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/settings/} for more info
	 * @param   key       Setting key
	 */
	public remove<Key extends keyof this["_settings"]>(key: Key) {
		delete this._userProperties[key];
		delete this._computedProperties[key];
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
		if(this.get("ignoreThemes")){
			return false;
		}

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

	// What the `animations` setting started, so it can be stopped again.
	protected _declaredAnimations: Array<{ target: Settings, key: string, animation: Animation<any> }> = [];
	protected _declaredTimers: Array<IDisposer> = [];
	// The `animations` setting was applied in this frame already
	protected _animationsApplied: boolean = false;

	/**
	 * Stops what the `animations` setting started and puts back what the
	 * animated settings held before.
	 */
	protected _stopDeclaredAnimations(restore: boolean = true): void {
		// Off the disposer list as well, or every restart leaves one behind
		$array.each(this._declaredTimers, (timer) => this.removeDispose(timer));
		this._declaredTimers = [];

		$array.each(this._declaredAnimations, (declared) => declared.animation.stop());
		this._declaredAnimations = [];

		if (!restore) {
			return;
		}

		$object.each(this._animationBases, (key, base) => {
			(this as any)._set(key, base.value);
			if (base.user) { (this._userProperties as any)[key] = true; } else { delete (this._userProperties as any)[key]; }
			if (base.computed) { (this._computedProperties as any)[key] = true; } else { delete (this._computedProperties as any)[key]; }
		});
		this._animationBases = {};
	}

	/**
	 * Plays the `animations` setting.
	 */
	protected _playDeclaredAnimations(): void {
		this._stopDeclaredAnimations();

		const declared = this.get("animations");
		if (!declared || !declared.length) {
			return;
		}

		$array.each(declared, (options) => {
			const target: Settings | undefined = options.target === "dataItem" ? (this as any).dataItem : this;
			const key = options.key;
			if (!target || !key) {
				return;
			}

			// A data item's values are data, never written as settings; an element's
			// setting keeps what was configured, for the saved config.
			if (target === this && !this._animationBases[key]) {
				this._animationBases[key] = {
					value: (this._settings as any)[key],
					user: !!(this._userProperties as any)[key],
					computed: !!(this._computedProperties as any)[key]
				};
			}

			const easing = $ease.byName(options.easing, options.ease);
			const duration = options.duration || 0;
			const loops = options.loops === 0 ? Infinity : (options.loops || 1);

			const start = () => {
				if (target.isDisposed()) {
					return;
				}
				// There and back within one run, so a loop always starts where it began
				const animation = (target as any).animate({
					key,
					from: options.from,
					to: options.to,
					duration: options.yoyo ? duration * 2 : duration,
					easing: options.yoyo ? $ease.yoyo(easing) : easing,
					loops
				});
				animation._declared = true;
				this._declaredAnimations.push({ target, key, animation });
			};

			if (options.delay) {
				this._declaredTimers.push(this.setTimeout(start, options.delay));
			} else {
				start();
			}
		});
	}

	/**
	 * Plays the `animations` setting when it changed. A container does this
	 * before it prepares its children, so that a value an animation starts
	 * from, or puts back when it is removed, is part of the same frame.
	 */
	protected _applyDeclaredAnimations(): void {
		if (!this._animationsApplied && this.isDirty("animations")) {
			this._animationsApplied = true;
			this._playDeclaredAnimations();
		}
	}

	public _beforeChanged(): void {

		this._applyDeclaredAnimations();

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

		// A data item outlives the element that animated it
		this._stopDeclaredAnimations(false);

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
	 * Calls `fn` after `delay` milliseconds, unless the object is disposed
	 * first. Disposing the returned disposer cancels it.
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
	 * Tags given to the element that are still set.
	 *
	 * @ignore
	 */
	public _getUserThemeTags(): Array<string> {
		const userTags = this._userThemeTags;
		if (!userTags) {
			return [];
		}
		const tags = (<any>this).get("themeTags", []);
		return userTags.filter((tag) => tags.indexOf(tag) !== -1);
	}

	/**
	 * @ignore
	 */
	public _addUserThemeTags(tags: Array<string>): void {
		const userTags = this._userThemeTags || [];
		$array.each(tags, (tag) => {
			if (userTags.indexOf(tag) === -1) {
				userTags.push(tag);
			}
		});
		this._userThemeTags = userTags;
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
	 * The [[Root]] the object belongs to.
	 *
	 * @readonly
	 * @since 5.0.6
	 * @return Root object
	 */
	public get root(): Root {
		return this._root;
	}

}
