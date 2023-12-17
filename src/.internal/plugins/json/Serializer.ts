import { Entity, IEntityEvents, IEntitySettings, IEntityPrivate } from "../../core/util/Entity";
import { Component } from "../../core/render/Component";
import { Color } from "../../core/util/Color";
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
	 * @todo implement
	 */
	includeProperties?: Array<string>;

	/**
	 * Maximum depth of recursion when traversing target object.
	 *
	 * @default 2
	 */
	maxDepth?: number;

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
	 * @param   source  Target object
	 * @param   depth   Current depth
	 * @param   full    Serialize object in full (ignoring maxDepth)
	 * @return          Serialized data
	 */
	public serialize(source: unknown, depth: number = 0, full: boolean = false): unknown {
		if (depth > this.get("maxDepth", 2)) {
			return undefined;
		}

		if (source === false || source === true) {
			return source;
		}

		if ($type.isArray(source)) {
			const res: any[] = [];
			$array.each(source, (arrval) => {
				res.push(this.serialize(arrval, depth, full));
			});
			return res;
		}
		else if (source instanceof ListData) {
			const res: any[] = [];
			$array.each(source.values, (arrval) => {
				res.push(this.serialize(arrval, depth, full));
			});
			return res;
		}
		const res: any = {};

		const am5object = source instanceof Entity || source instanceof Template || source instanceof Color || source instanceof Percent ? true : false;

		// Process settings
		const fullSettings: any = this.get("fullSettings", []);
		if (source instanceof Entity) {
			res.type = source.className;

			let settings: Array<string> = $object.keys(source._settings);
			const includeSettings: Array<string> = this.get("includeSettings", []);
			const excludeSettings: Array<string> = this.get("excludeSettings", []);
			if (includeSettings.length) {
				settings = includeSettings;
			}
			else if (excludeSettings.length) {
				settings = settings.filter((value) => {
					return excludeSettings.indexOf(value) === -1;
				});
			}

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
					}
				});
			}
		}
		else if (source instanceof Template) {
			res.type = "Template";
			let settings: Array<string> = $object.keys(source._settings);
			if (settings.length) {
				res.settings = {};
				$array.each(settings, (setting) => {
					res.settings[setting] = this.serialize((<any>source).get(setting), depth + 1, fullSettings.indexOf(setting) !== -1);
				});
			}
			return res;
		}

		// Data
		if (source instanceof Component) {
			if (source.data.length) {
				res.properties = {
					data: this.serialize(source.data.values, 1, true)
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
		else if ($type.isString(source) || $type.isNumber(source)) {
			return source;
		}
		else if ($type.isObject(source)) {
			// TODO
			if (full && !am5object) {
				const excludeProperties: Array<string> = this.get("excludeProperties", []);
				$object.each(source, (key, value) => {
					if (excludeProperties.indexOf(key) === -1 && value !== undefined) {
						res[key] = this.serialize(value, depth + 1, full);
					}
				});
			}
		}

		if (depth == 0 && $object.keys(this._refs).length) {
			res.refs = this._refs;
		}

		return res;
	}
}