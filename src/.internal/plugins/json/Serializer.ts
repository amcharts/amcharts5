import { Entity, IEntityEvents, IEntitySettings, IEntityPrivate } from "../../core/util/Entity";
import { Component } from "../../core/render/Component";
import { Color } from "../../core/util/Color";
import { Gradient } from "../../core/render/gradients/Gradient";
import { Percent } from "../../core/util/Percent";
import { Template } from "../../core/util/Template";
import { ListData } from "../../core/util/Data";

import * as $type from "../../core/util/Type";
import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";


export interface ISerializerSettings extends IEntitySettings {

	/**
	 * An array of settings to not include in the serialized data.
	 */
	excludeSettings?: Array<string>;

	/**
	 * An array of settings to include in the serialized data.
	 */
	includeSettings?: Array<string>;

	/**
	 * Include full values of these settings.
	 *
	 * @since 6.4.3
	 */
	fullSettings?: Array<string>;

	/**
	 * An array of properties to not include in the serialized data.
	 *
	 * @since 5.3.2
	 */
	excludeProperties?: Array<string>;

	/**
	 * An array of properties to include in the serialized data.
	 *
	 * @ignore
	 * @since 5.15.0
	 */
	includeProperties?: Array<string>;

	/**
	 * Maximum depth of recursion when traversing target object.
	 *
	 * @default 2
	 */
	maxDepth?: number;

	/**
	 * Include states in the output.
	 *
	 * @default false
	 * @since 5.15.0
	 */
	includeStates?: boolean;

	/**
	 * Include adapters in the output.
	 *
	 * @default false
	 * @since 5.15.0
	 */
	includeAdapters?: boolean;

	/**
	 * Include events in the output.
	 *
	 * @since 5.15.0
	 * @default false
	 * @todo implement
	 * @ignore
	 */
	includeEvents?: boolean;

	/**
	 * Serialize functions as strings or functions.
	 *
	 * @default "function"
	 */
	functionsAs?: "string" | "function";

}

export interface ISerializerPrivate extends IEntityPrivate {
}

export interface ISerializerEvents extends IEntityEvents {
}


/**
 * Provides functionality to serialize charts or individual elements into simple
 * objects or JSON.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/serializing/} for more info
 * @since 5.3.0
 */
export class Serializer extends Entity {

	public static className: string = "Serializer";
	public static classNames: Array<string> = Entity.classNames.concat([Serializer.className]);

	declare public _settings: ISerializerSettings;
	declare public _privateSettings: ISerializerPrivate;
	declare public _events: ISerializerEvents;

	protected _refs: { [index: string]: any } = {};

	/**
	 * Serializes target object into a simple object or JSON string.
	 *
	 * @param   source      Target object
	 * @param   depth       Current depth
	 * @param   full        Serialize object in full (ignoring maxDepth)
	 * @param   forceParse  If true, will add __parse to serialized objects
	 * @return              Serialized data
	 */
	public serialize(source: unknown, depth: number = 0, full: boolean = false, forceParse: boolean = false): unknown {
		if (depth > this.get("maxDepth", 2)) {
			return undefined;
		}

		if (source === false || source === true) {
			return source;
		}

		if ($type.isArray(source)) {
			const res: any[] = [];
			$array.each(source, (arrval) => {
				res.push(this.serialize(arrval, depth, full, forceParse));
			});
			return res;
		}
		else if (source instanceof ListData) {
			const res: any[] = [];
			$array.each(source.values, (arrval) => {
				res.push(this.serialize(arrval, depth, full, forceParse));
			});
			return res;
		}
		const res: any = {};

		const am5object = source instanceof Entity || source instanceof Template || source instanceof Color || source instanceof Percent ? true : false;

		// Process settings
		const fullSettings: any = this.get("fullSettings", []);
		if (source instanceof Entity) {
			res.type = source.className;
			let settings: Array<string> = this._filterSettings($object.keys(source._settings));

			// Include only user settings
			settings = settings.filter((value) => {
				return source.isUserSetting(value as any);
			});

			if (settings.length) {
				res.settings = {};
				$array.each(settings, (setting) => {
					const settingValue = (<any>source).get(setting);
					if (settingValue !== undefined) {
						res.settings[setting] = this.serialize(settingValue, depth + 1, full || fullSettings.indexOf(setting) !== -1);
						if (source instanceof Gradient && setting === "stops") {
							res.settings[setting] = this.serialize(settingValue, 0, true);
						}
					}
				});
			}
			this._processAdapters(source, res);
			this._processStates(source, res);
		}
		else if (source instanceof Template) {
			res.type = "Template";
			let settings: Array<string> = this._filterSettings($object.keys(source._settings));
			if (settings.length) {
				res.settings = {};
				$array.each(settings, (setting) => {
					if ((<any>source)._settings[setting] !== undefined) {
						res.settings[setting] = this.serialize((<any>source).get(setting), depth + 1, fullSettings.indexOf(setting) !== -1);
					}
				});
			}
			this._processAdapters(source, res);
			this._processStates(source, res);

			return res;
		}

		// Data
		if (source instanceof Component) {
			if (source.data.length && (this.get("excludeProperties")! || []).indexOf("data") === -1) {
				res.properties = {
					data: this.serialize(source.data.values, depth, true)
				};
			}
		}

		// Process the rest
		if (source instanceof Color) {
			return {
				type: "Color",
				value: source.toCSSHex()
			};
		}
		else if (source instanceof Percent) {
			return {
				type: "Percent",
				value: source.percent
			};
		}
		else if ($type.isString(source)) {
			return this._escapeRefs(source);
		}
		else if ($type.isNumber(source)) {
			return source;
		}
		else if ($type.isObject(source)) {
			// TODO
			if (full && !am5object) {
				const excludeProperties: Array<string> = this.get("excludeProperties", []);
				$object.each(source, (key, value) => {
					if (excludeProperties.indexOf(key) === -1 && value !== undefined) {
						res[key] = this.serialize(value, depth + 1, full, forceParse);
					}
				});
				if (forceParse) {
					// Add only if there are objects
					$object.each(res, (_key, value) => {
						if ($type.isObject(value)) {
							res.__parse = true;
						}
					});
				}
			}
			else if (am5object) {
				const includeProperties: Array<string> = this.get("includeProperties", []);
				$array.each(includeProperties, (key) => {

					const value: any = (source as any)[key];
					if (value !== undefined) {
						if (res.properties === undefined) {
							res.properties = {};
						}
						res.properties[key] = this.serialize(value, depth + 1, full, forceParse);
					}
				});
			}
		}

		if (depth == 0 && $object.keys(this._refs).length) {
			res.refs = this._refs;
		}

		return res;
	}

	private _processAdapters(source: any, res: any) {
		if (this.get("includeAdapters", false)) {
			const asString = this.get("functionsAs", "string") == "string";
			const callbacks = source.adapters._callbacks;
			if (Object.keys(callbacks).length > 0) {
				res.adapters = [];
				$object.each(callbacks, (key, callbackList) => {
					callbackList.forEach((callback: any) => {
						res.adapters.push({
							key: key,
							callback: asString ? callback.toString() : callback
						});
					});
				});
			}
		}
	}

	private _processStates(source: any, res: any) {
		if (this.get("includeStates", false)) {
			const states = source.states._states;
			if (Object.keys(states).length > 0) {
				res.states = [];
				$object.each(states, (key: any, state: any) => {
					if (Object.keys(state._settings).length > 0) {
						res.states.push({
							key: key,
							settings: this.serialize(state._settings, 0, true)
						});
					}
				});
			}
		}
	}

	private _filterSettings(settings: any) {
		const includeSettings: Array<string> = this.get("includeSettings", []);
		const excludeSettings: Array<string> = this.get("excludeSettings", []);
		if (includeSettings.length) {
			settings = includeSettings;
		}
		else if (excludeSettings.length) {
			settings = settings.filter((value: any) => {
				return excludeSettings.indexOf(value) === -1;
			});
		}
		return settings;
	}

	private _escapeRefs(text: string): string {
		return text.replace(/^#/, '##').replace(/^@/, '@@');
	}

}
