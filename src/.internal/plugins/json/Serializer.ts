import { Entity, Settings, IEntityEvents, IEntitySettings, IEntityPrivate } from "../../core/util/Entity";
import { Component } from "../../core/render/Component";
import { Color } from "../../core/util/Color";
import { ColorSet } from "../../core/util/ColorSet";
import { Gradient } from "../../core/render/gradients/Gradient";
import { Percent } from "../../core/util/Percent";
import { Template } from "../../core/util/Template";
import { ListData } from "../../core/util/Data";

import * as $type from "../../core/util/Type";
import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";
import * as $ease from "../../core/util/Ease";


export interface ISerializerSettings extends IEntitySettings {

	/**
	 * Settings to leave out of the output. Ignored when `includeSettings` is
	 * set.
	 */
	excludeSettings?: Array<string>;

	/**
	 * The only settings to write; all others are left out.
	 */
	includeSettings?: Array<string>;

	/**
	 * Settings whose plain-object values are written with all their keys.
	 * In other settings, a plain object comes out empty.
	 *
	 * @since 5.7.0
	 */
	fullSettings?: Array<string>;

	/**
	 * Properties to leave out of the output, e.g. `"data"`.
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
	 * How many levels of nested objects to write; deeper ones are left out.
	 *
	 * @default 2
	 */
	maxDepth?: number;

	/**
	 * Write an animation started in code that loops forever - a globe that
	 * keeps turning, a marker that keeps pulsing - into the `animations`
	 * setting, so the saved chart plays it too. Animations that end (`appear()`,
	 * state changes, zooming) are never written, and neither is one whose easing
	 * is a function of its own rather than one of amCharts' easings.
	 *
	 * @default true
	 * @since 5.20.8
	 */
	runningAnimations?: boolean;

	/**
	 * Writes the elements' states.
	 *
	 * @default false
	 * @since 5.15.0
	 */
	includeStates?: boolean;

	/**
	 * Writes the elements' adapters.
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
	 * How adapter callbacks are written (see `includeAdapters`): `"string"` as
	 * their source code, `"function"` as the functions themselves, which JSON
	 * can't hold. [[ChartSerializer]] uses `"function"` unless set.
	 *
	 * @default "string"
	 */
	functionsAs?: "string" | "function";

}

export interface ISerializerPrivate extends IEntityPrivate {
}

// A reference written into data, kept apart from the data's own strings
// until those are escaped
class DataRef {
	constructor(public ref: string) { }
}

export interface ISerializerEvents extends IEntityEvents {
}


/**
 * Serializes charts or individual elements into plain objects, which can be
 * saved as JSON.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/serializing/} for more info
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
	 * Set while serializing data. A `#` or `@` at the start of a string means a
	 * reference in a config, so strings are escaped - but most of a data row is
	 * handed back untouched when parsed, and escaping it there would corrupt it
	 * a little more on every round trip. `_escapeParsed` puts the escaping back
	 * in the few places the parser does read values.
	 *
	 * @ignore
	 */
	protected _serializingData: boolean = false;
	protected _inInterfaceColors: boolean = false;

	// A color set as the theme makes it, and its list, which every color set of
	// the root shares
	protected _paletteSet?: ColorSet;
	protected _palette?: Array<Color>;

	// Where this very Color object is in the theme's palette, if it is there,
	// as `getIndex()` hands out the list's own objects. A color generated past
	// the list counts if it was made as a new color set would make it
	protected _paletteIndex(color: Color): number | undefined {
		if (!this._paletteSet) {
			this._paletteSet = ColorSet.new(this._root, {});
			this._palette = this._paletteSet.get("colors", []);
		}
		const palette = this._palette!;
		const index = palette.indexOf(color);
		if (index < 0) {
			return undefined;
		}
		return index < ColorSet.paletteLength(palette) || ColorSet.generatedLike(color, this._paletteSet) ? index : undefined;
	}

	protected _dispose(): void {
		super._dispose();
		if (this._paletteSet) {
			this._paletteSet.dispose();
		}
	}

	// Which of the root's interface colours this very Color object is, if any
	protected _interfaceColorKey(color: Color): string | undefined {
		const interfaceColors: any = this._root.interfaceColors;
		if (this._inInterfaceColors || !interfaceColors) {
			return undefined;
		}
		const settings = interfaceColors._settings;
		return $array.find($object.keys(settings), (key) => settings[key] === color) as string | undefined;
	}

	/**
	 * Serializes data, which is values rather than configuration.
	 *
	 * @ignore
	 */
	public serializeData(values: Array<any>): unknown {
		const previous = this._serializingData;
		this._serializingData = true;
		const result = this.serialize(values, 0, true, true);
		this._serializingData = previous;
		this._escapeParsed(result);
		return result;
	}

	/**
	 * Escapes the strings the parser is going to read as references, and only
	 * those. It walks data the way the parser does: through every array, and
	 * into an object only when that object is marked `__parse`. Anywhere else a
	 * string comes back as it was written, so escaping it would leave a stray
	 * `##` in the data. References the serializer made go in as they are.
	 */
	private _escapeParsed(value: any, parsed: boolean = true): void {
		if ($type.isArray(value)) {
			$array.each(value, (item, index) => {
				value[index] = this._escapeItem(item, parsed);
			});
		}
		else if ($type.isObject(value)) {
			const read = parsed && (value as any).__parse === true;
			$object.each(value as any, (key, item) => {
				(value as any)[key] = this._escapeItem(item, read);
			});
		}
	}

	private _escapeItem(item: any, parsed: boolean): any {
		if (item instanceof DataRef) {
			return item.ref;
		}
		if ($type.isString(item)) {
			return parsed ? this._escapeText(item) : item;
		}
		this._escapeParsed(item, parsed);
		return item;
	}

	/**
	 * Serializes an object into a plain object.
	 *
	 * @param   source      Object to serialize
	 * @param   depth       Current depth
	 * @param   full        Write plain objects in full, with all their keys
	 * @param   forceParse  Mark plain objects with `__parse`, so the parser reads them
	 * @return              Serialized data
	 */
	public serialize(source: unknown, depth: number = 0, full: boolean = false, forceParse: boolean = false): unknown {
		if (depth > this.get("maxDepth", 2)) {
			return undefined;
		}

		// The root's own interface colours go out as values, not as references to themselves
		if (source === this._root.interfaceColors && !this._inInterfaceColors) {
			this._inInterfaceColors = true;
			try {
				return this.serialize(source, depth, full, forceParse);
			}
			finally {
				this._inInterfaceColors = false;
			}
		}

		if (source === false || source === true || source === null) {
			return source;
		}

		// A geometry built by one of the map's shape functions goes out as that
		// call - a handful of numbers rather than every coordinate it expands to
		const described: any = source && (source as any).__geometry;
		if (described) {
			const call: any = { type: described.name };
			$object.each(described.args, (key, value) => {
				call[key] = value;
			});
			return call;
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

			// A setting an `animations` entry is playing is written as it was
			// configured, not as it happens to be mid-animation
			const bases = source._animationBases;

			// Include only what was asked for - not what the chart worked out for
			// itself
			settings = settings.filter((value) => {
				const base = bases[value];
				if (base) {
					return base.user && !base.computed;
				}
				return source.isUserSetting(value as any) && !source.isComputedSetting(value as any);
			});

			if (settings.length) {
				res.settings = {};
				$array.each(settings, (setting) => {
					// Raw, not `get()`: an adapter's job is to work out a value at
					// draw time from a data item, and the sample sprite serialized
					// here has none - running one throws. What was configured is
					// the raw value anyway; the adapted one is not configuration.
					let settingValue = bases[setting] ? bases[setting].value : (<any>source).getRaw(setting);
					// Only the tags that were given, not the ones the library added
					if (setting === "themeTags") {
						settingValue = source._getUserThemeTags();
						if (!settingValue.length) {
							return;
						}
					}
					if (settingValue !== undefined) {
						res.settings[setting] = this.serialize(settingValue, depth + 1, full || fullSettings.indexOf(setting) !== -1);
						if (source instanceof Gradient && setting === "stops") {
							res.settings[setting] = this.serialize(settingValue, 0, true);
						}
					}
				});
			}
			if (this.get("runningAnimations", true)) {
				this._processRunningAnimations(source, res, depth);
			}
			this._processComputedEntities(source, res, settings, depth);
			this._processAdapters(source, res);
			this._processStates(source, res);
		}
		else if (source instanceof Template) {
			res.type = "Template";
			let settings: Array<string> = this._filterSettings($object.keys(source._settings));

			settings = settings.filter((value) => {
				return value !== "themeTags" && !source._computedSettings[value as never];
			});

			if (settings.length) {
				res.settings = {};
				$array.each(settings, (setting) => {
					if ((<any>source)._settings[setting] !== undefined) {
						// In full like an element's settings, or plain objects in them (`animations`) come out empty
						res.settings[setting] = this.serialize((<any>source).get(setting), depth + 1, full || fullSettings.indexOf(setting) !== -1);
					}
				});
			}
			this._processAdapters(source, res);
			this._processStates(source, res);
			this._afterEntity(source, res);

			return res;
		}

		// Data
		if (source instanceof Component) {
			if (source.data.length && (this.get("excludeProperties")! || []).indexOf("data") === -1) {
				res.properties = {
					data: this.serializeData(source.data.values)
				};
			}
		}

		// Process the rest
		if (source instanceof Color) {
			// A colour taken from the root's interface colours goes out as a
			// reference, so it follows the theme the config is parsed with
			const key = this._interfaceColorKey(source);
			const index = key ? undefined : this._paletteIndex(source);
			// The same for a colour taken from the theme's palette with getIndex()
			const ref = key ? "@root.interfaceColors.get('" + key + "')" : index != null ? "@colors.getIndex(" + index + ")" : undefined;
			if (ref) {
				// Its row then reads as one to parse, and the ref is not escaped
				return this._serializingData ? new DataRef(ref) : ref;
			}
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
		else if (source instanceof Date) {
			// A date has no keys of its own to write: saved as its timestamp
			return source.getTime();
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

					// A data row with its own `type` field reads as an entity to the
					// parser, which then goes looking for a class by that name. Saying
					// so outright keeps a column called `type` a column.
					if (res.type !== undefined && res.__parse !== true) {
						res.__parse = false;
					}
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

		this._afterEntity(source, res);

		return res;
	}

	/**
	 * A place for a subclass to add to what an entity serialized to, wherever it
	 * was reached from.
	 *
	 * @ignore
	 */
	protected _afterEntity(_source: any, _res: any): void { }

	/**
	 * Adds the element's endless animations started in code to its `animations`
	 * setting. The setting they animate is left out: the animation sets it.
	 *
	 * @param   source  Source object
	 * @param   res     Result
	 * @param   depth   Current depth
	 */
	private _processRunningAnimations(source: Entity, res: any, depth: number): void {
		const entries = this._runningAnimationEntries(source, depth);

		$array.each(entries, (entry) => {
			if (res.settings) {
				delete res.settings[entry.key];
			}
		});

		if (entries.length) {
			res.settings = res.settings || {};
			res.settings.animations = (res.settings.animations || []).concat(entries);
		}
	}

	/**
	 * Describes the endless animations running on `source` as `animations`
	 * entries.
	 *
	 * @param   source  Source object
	 * @param   depth   Current depth
	 * @param   target  Whose setting the entries animate
	 * @return          Animation entries
	 */
	protected _runningAnimationEntries(source: Settings, depth: number, target?: "dataItem"): Array<any> {
		const entries: Array<any> = [];

		$object.each((source as any)._animatingSettings || {}, (key: any, animation: any) => {
			if (!animation || animation.stopped || animation.loops !== Infinity) {
				return;
			}

			// Playing because an `animations` setting says so - this element's, or
			// one aimed at this data item: already written
			if (animation._declared) {
				return;
			}

			const info = $ease.easingInfo(animation.easing);
			if (!info) {
				return;
			}

			const entry: any = {
				key,
				from: this.serialize(animation.from, depth + 2),
				to: this.serialize(animation.to, depth + 2),
				// With yoyo, one run goes there and back; the entry gives one way
				duration: info.yoyo ? animation.duration / 2 : animation.duration,
				loops: 0
			};
			if (info.easing !== "linear") {
				entry.easing = info.easing;
			}
			if (info.ease) {
				entry.ease = info.ease;
			}
			if (info.yoyo) {
				entry.yoyo = true;
			}
			if (target) {
				entry.target = target;
			}
			entries.push(entry);
		});

		return entries;
	}

	/**
	 * Writes out what was styled on an object the library built for itself.
	 *
	 * A background an element seeds, a part it configures - the object itself is
	 * not configuration, so it is not written out on its own account. What
	 * someone then styled on it is, and would otherwise be lost. It goes out
	 * without a `type`, so parsing configures the object already there instead of
	 * replacing it with a new one.
	 *
	 * @param   source    Source object
	 * @param   res       Result
	 * @param   written   Setting keys already written out in full
	 * @param   depth     Current depth
	 */
	private _processComputedEntities(source: Entity, res: any, written: Array<string>, depth: number): void {
		$array.each(this._filterSettings($object.keys(source._settings)), (key: any) => {
			if (written.indexOf(key) !== -1) {
				return;
			}

			const value: any = (<any>source._settings)[key];

			if (!(value instanceof Entity)) {
				return;
			}

			// An element the chart holds in its own right - an axis, a series,
			// another chart - is written out where it belongs and referenced from
			// here. Only the parts an element owns are configured in place.
			const part: any = value;

			if (part.isType && (part.isType("Axis") || part.isType("Series") || part.isType("Chart"))) {
				return;
			}

			// past `maxDepth` there is nothing to write
			const serialized: any = this.serialize(part, depth + 1, false);

			if (!serialized || typeof serialized !== "object") {
				return;
			}

			delete serialized.type;

			// The part already has its tags, and writing them would replace them
			if (serialized.settings) {
				delete serialized.settings.themeTags;
				if (!Object.keys(serialized.settings).length) {
					delete serialized.settings;
				}
			}

			if (serialized.settings || serialized.properties || serialized.states || serialized.adapters) {
				if (!res.properties) {
					res.properties = {};
				}
				if (res.properties[key] === undefined) {
					res.properties[key] = serialized;
				}
			}
		});
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
				const serialized: Array<any> = [];

				$object.each(states, (key: any, state: any) => {
					// Same rule as for settings - leave out what the chart worked out
					// for itself. A template's states have no computed settings of
					// their own: a template is configuration, so its states are too.
					const settings: any = {};
					const computed: any = state._computedSettings || {};

					$object.each(state._settings, (settingKey: any, value: any) => {
						if (!computed[settingKey]) {
							settings[settingKey] = value;
						}
					});

					if (Object.keys(settings).length > 0) {
						const serializedSettings: any = this.serialize(settings, 0, true);
						if (serializedSettings && Object.keys(serializedSettings).length > 0) {
							serialized.push({
								key: key,
								settings: serializedSettings
							});
						}
					}
				});

				if (serialized.length > 0) {
					res.states = serialized;
				}
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
		if (this._serializingData) {
			return text;
		}
		return this._escapeText(text);
	}

	private _escapeText(text: string): string {
		return text.replace(/^#/, '##').replace(/^@/, '@@');
	}

}
