import type { Entity, Dirty } from "./Entity";
import type { Animations } from "./Animation";
import * as $object from "./Object";
import * as $ease from "./Ease";

/**
 * An object representing a collection of setting values to apply as required.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/states/} for more info
 */
export class State<E extends Entity> {
	private _entity: E;
	public _settings: Partial<E["_settings"]>;
	public _userSettings: Dirty<E["_settings"]> = {};

	constructor(entity: E, settings: Partial<E["_settings"]>) {
		this._entity = entity;
		this._settings = settings;

		$object.each(settings, (key) => {
			this._userSettings[key] = true;
		});
	}

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
	 * @ignore
	 */
	public setRaw<Key extends keyof E["_settings"]>(key: Key, value: E["_settings"][Key]) {
		this._settings[key] = value;
	}

	/**
	 * Sets a setting `value` for the specified `key` to be set when the state
	 * is applied.
	 *
	 * @param   key       Setting key
	 * @param   value     Setting value
	 * @return            Setting value
	 */
	public set<Key extends keyof E["_settings"]>(key: Key, value: E["_settings"][Key]) {
		this._userSettings[key] = true;
		this.setRaw(key, value);
	}

	/**
	 * Removes a setting value for the specified `key`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param   key       Setting key
	 */
	public remove<Key extends keyof this["_settings"]>(key: Key) {
		delete this._userSettings[key];
		delete this._settings[key];
	}

	/**
	 * Sets multiple settings at once.
	 *
	 * `settings` must be an object with key: value pairs.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/} for more info
	 * @param settings Settings
	 */
	public setAll(settings: this["_settings"]) {
		$object.keys(settings).forEach((key) => {
			this.set(key, settings[key]);
		});
	}

	private _eachSetting<Key extends keyof E["_settings"], Value extends E["_settings"][Key]>(f: (key: Key, value: Value) => void): void {
		$object.each(this._settings, f as any);
	}

	/**
	 * Applies the state to the target element.
	 *
	 * All setting values are set immediately.
	 */
	public apply() {
		const seen: Dirty<E["_settings"]> = {};

		seen["stateAnimationEasing"] = true;
		seen["stateAnimationDuration"] = true;

		const defaultState = this._entity.states.lookup("default")!;

		this._eachSetting((key, value) => {
			if (!seen[key]) {
				seen[key] = true;

				// save values to default state
				if (this !== defaultState) {
					if (!(key in defaultState._settings)) {
						defaultState._settings[key] = this._entity.get(key);
					}
				}

				this._entity.set(key, value);
			}
		});
	}



	/**
	 * Applies the state to the target element.
	 *
	 * Returns an object representing all [[Animation]] objects created for
	 * each setting key transition.
	 *
	 * @return           Animations
	 */
	public applyAnimate(duration?: number): Animations<E["_settings"]> {

		if (duration == null) {
			duration = this._settings.stateAnimationDuration;
		}
		if (duration == null) {
			duration = this.get("stateAnimationDuration", this._entity.get("stateAnimationDuration", 0));
		}

		let easing = this._settings.stateAnimationEasing;
		if (easing == null) {
			easing = this.get("stateAnimationEasing", this._entity.get("stateAnimationEasing", $ease.cubic));
		}

		const defaultState = this._entity.states.lookup("default")!;

		const seen: Dirty<E["_settings"]> = {};

		seen["stateAnimationEasing"] = true;
		seen["stateAnimationDuration"] = true;

		const animations: Animations<E["_settings"]> = {};

		this._eachSetting((key, value) => {
			if (!seen[key]) {
				seen[key] = true;

				// save values to default state
				if (this != defaultState) {
					if (!(key in defaultState._settings)) {
						defaultState._settings[key] = this._entity.get(key);
					}
				}

				const animation = this._entity.animate({
					key: key,
					to: value,
					duration: duration!,
					easing: easing
				});

				if (animation) {
					animations[key] = animation;
				}
			}
		});

		return animations;
	}
}

/**
 * Collection of [[State]] objects for an element.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/settings/states/} for more info
 */
export class States<E extends Entity> {
	private _states: { [key: string]: State<E> } = {};
	private _entity: E;

	constructor(entity: E) {
		this._entity = entity;
	}

	/**
	 * Checks if a state by `name` exists. Returns it there is one.
	 *
	 * @param  name  State name
	 * @return       State
	 */
	public lookup(name: string): State<E> | undefined {
		return this._states[name];
	}

	/**
	 * Sets supplied `settings` on a state by the `name`.
	 *
	 * If such state does not yet exists, it is created.
	 *
	 * @param   name      State name
	 * @param   settings  Settings
	 * @return            New State
	 */
	public create(name: string, settings: Partial<E["_settings"]>): State<E> {
		const state = this._states[name];

		if (state) {
			state.setAll(settings);
			return state;

		} else {
			const state = new State(this._entity, settings);
			this._states[name] = state;
			return state;
		}
	}

	/**
	 * Removes the state called `name`.
	 *
	 * @param   name      State name
	 */
	public remove(name: string): void {
		delete this._states[name];
	}

	/**
	 * Applies a named state to the target element.
	 *
	 * @param  newState  State name
	 */
	public apply(newState: string) {
		const state = this._states[newState];

		if (state) {
			state.apply();
		}

		this._entity._applyState(newState);
	}

	/**
	 * Applies a named state to the element.
	 *
	 * Returns an object representing all [[Animation]] objects created for
	 * each setting key transition.
	 *
	 * @param   newState  State name
	 * @return            Animations
	 */
	public applyAnimate(newState: string, duration?: number): Animations<E["_settings"]> | undefined {
		let animations;
		const state = this._states[newState];

		if (state) {
			animations = state.applyAnimate(duration);
		}

		this._entity._applyStateAnimated(newState, duration);
		return animations;
	}
}
