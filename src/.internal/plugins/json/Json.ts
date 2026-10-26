import type { Root } from "../../core/Root";

import { Entity } from "../../core/util/Entity";
import { Sprite } from "../../core/render/Sprite";
import { Container } from "../../core/render/Container";
import { Color } from "../../core/util/Color";
import { ColorSet } from "../../core/util/ColorSet";
import { Percent } from "../../core/util/Percent";
import { Template } from "../../core/util/Template";
import { ListData } from "../../core/util/Data";

import * as $type from "../../core/util/Type";
import * as $array from "../../core/util/Array";
import { registry } from "../../core/Registry";
import * as $object from "../../core/util/Object";

import type { IClasses } from "./Classes";
import classes from "./Classes";


interface IRef {
	[key: string]: any;
}


function isObject(value: any): value is { [key: string]: any } {
	return $type.isObject(value);
}

function isObjectParsed(value: object): boolean {
	return value instanceof Entity || value instanceof Color || value instanceof Percent || value instanceof Template;
}

// Detects a type-less, entity-shaped config object, e.g. a serialized `background`
// whose `type` was stripped so that it configures the existing sub-object in place
// instead of constructing a new one.
function isMergeDescriptor(value: any): boolean {
	return isObject(value)
		&& value.constructor === Object
		&& value.type === undefined
		&& (value.settings !== undefined || value.states !== undefined || value.properties !== undefined || value.adapters !== undefined);
}


// Detects whether a raw setting value references `@self` (the entity itself),
// which means it must be applied after the entity is constructed.
//
// Only recurses into plain JSON objects/arrays (the shapes a parsed config is made of) so that
// live instances passed programmatically (Entity, DataItem, Sprite, ...) are never walked - those
// can hold circular references and are never `@self` strings anyway.
function usesSelfRef(value: any): boolean {
	if ($type.isString(value)) {
		return value === "@self" || value.indexOf("@self.") === 0;

	} else if ($type.isArray(value)) {
		return $array.any(value, usesSelfRef);

	} else if (isObject(value) && value.constructor === Object) {
		return $array.any($object.keys(value), (key) => usesSelfRef(value[key]));

	} else {
		return false;
	}
}


// A ref that is not there yet. Refs are parsed in order, and one of them can
// point at another further down the list - an axis whose header holds a legend
// listing a series, say - so the value is resolved again once everything exists.
export class MissingRefError extends Error {
	constructor(public refName: string) {
		super("Could not find ref " + refName);
	}
}

function lookupRef(refs: Array<IRef>, name: string, fallback?: Array<IRef>): any {
	let i = refs.length;

	while (i--) {
		const sub = refs[i];

		if (name in sub) {
			return sub[name];
		}
	}

	if (fallback) {
		let j = fallback.length;

		while (j--) {
			const sub = fallback[j];

			if (name in sub) {
				return sub[name];
			}
		}
	}

	throw new MissingRefError(name);
}


interface IAxisRange<E extends Entity> {
	__parseLogic: "axisRange" | "seriesAxisRange",
	axis: string,
	series?: string,
	settings: E["_settings"],
}

interface IAdapter<E extends Entity> {
	key: keyof E["_settings"],
	callback: (value: E["_settings"][this["key"]], target: E, key: this["key"]) => E["_settings"][this["key"]],
}

interface IState<E extends Entity> {
	key: string,
	settings: E["_settings"],
}

type IParsedProperties = Array<(entity: object) => void>;

type IRefs = { [key: string]: any } | Array<{ [key: string]: any }>;

interface IChild {
	index: number | undefined,
	value: Sprite,
}

interface IParsedEntity<E extends Entity> {
	isValue: false,
	type: string | undefined,
	construct: typeof Entity | undefined,
	settings: object | undefined,
	adapters: Array<IAdapter<E>> | undefined,
	states: Array<IState<E>> | undefined,
	children: Array<IChild> | undefined,
	properties: IParsedProperties | undefined,
	index: number | undefined,
	value: object,
}

type IParsed<E extends Entity>
	= IParsedEntity<E>
	| { isValue: true, value: any };


const GEODATA_PREFIX = "am5geodata_";
const LOCALE_PREFIX = "am5locales_";


function parseRef<E extends Entity>(value: string, refs: Array<IRef>, fallback?: Array<IRef>): IParsed<E> {
	if (value[0] === "#" || value[0] === "@") {
		if (value[1] === value[0]) {
			// "##foo" or "@@foo" gets escaped into the literal strings "#foo" or "@foo"
			return {
				isValue: true,
				value: value.slice(1),
			};

		} else {
			const path = value.split(/\./g);

			let object = lookupRef(refs, path[0], fallback);

			for (let i = 1; i < path.length; ++i) {
				const subpath = path[i];

				// Supports `#foo.get("bar")` and `#foo.get('bar')` syntax
				const parsed = /get\((["'])([^\1]*)\1\)/.exec(subpath);
				// and `@colors.getIndex(3)`
				const index = /^getIndex\((\d+)\)$/.exec(subpath);

				if (parsed) {
					object = object.get(parsed[2]);

				} else if (index) {
					object = object.getIndex(+index[1]);

				} else {
					object = object[subpath];
				}
			}

			return {
				isValue: true,
				value: object,
			};
		}

	} else {
		return {
			isValue: true,
			value,
		};
	}
}


function mergeObject<E extends Entity>(entity: object, parsed: IParsedEntity<E>): void {
	if (parsed.properties) {
		$array.each(parsed.properties, (fn) => {
			fn(entity);
		});
	}
}

function mergeEntity<E extends Entity>(entity: E, parsed: IParsedEntity<E>): void {
	mergeObject(entity, parsed);

	if (parsed.adapters) {
		$array.each(parsed.adapters, (adapter) => {
			// A callback cannot survive a trip through JSON, so a config may carry
			// an adapter with nothing to call. Skip it rather than break the chart
			if (typeof adapter.callback === "function") {
				entity.adapters.add(adapter.key, adapter.callback);
			}
		});
	}

	if (parsed.states) {
		$array.each(parsed.states, (state) => {
			entity.states.create(state.key, state.settings);
		});
	}

	if (entity instanceof Container) {
		if (parsed.children) {
			parsed.children.forEach((child) => {
				if (child.index == null || child.index >= entity.children.length) {
					entity.children.push(child.value);

				} else {
					entity.children.insertIndex(child.index, child.value);
				}
			});
		}
	}
}

// Adds parsed tags to the ones an existing element already has, instead of replacing them
function mergeThemeTags(entity: Entity, settings: any): void {
	if (settings && $type.isArray(settings.themeTags)) {
		entity._addUserThemeTags(settings.themeTags);
		const tags = entity.get("themeTags", []).slice();
		$array.each(settings.themeTags as Array<string>, (tag) => {
			if (tags.indexOf(tag) === -1) {
				tags.push(tag);
			}
		});
		settings.themeTags = tags;
	}
}

function mergeExisting<E extends Entity>(entity: E, parsed: IParsedEntity<E>): void {
	if (parsed.settings) {
		mergeThemeTags(entity, parsed.settings);
		entity.setAll(parsed.settings);
	}

	mergeEntity(entity, parsed);
}


// TODO replace this with `__parseLogic: "merge"`
function mergeExistingAxisRange<E extends Entity>(entity: E, parsed: IParsedEntity<E>): void {
	if (parsed.settings) {
		mergeThemeTags(entity, parsed.settings);
		$object.each(parsed.settings, (key, value: any) => {
			if (value instanceof Entity) {
				const old = entity.get(key) as any;

				if (old instanceof Entity) {
					old.setAll(value._settings);

				} else {
					entity.set(key, value as any);
				}

			} else {
				entity.set(key, value);
			}
		});
	}

	mergeEntity(entity, parsed);
}


function constructEntity<E extends Entity>(root: Root, parsed: IParsedEntity<E>): E | object {
	if (!parsed.construct) {
		return parsed.value;
	}

	const entity = parsed.construct.new(root, parsed.settings || {}) as E;

	mergeEntity(entity, parsed);

	return entity;
}


class ParserState {
	protected _caching: { [key: string]: Promise<void> } = {};
	protected _cache: { [key: string]: typeof Entity } = {};
	protected _delayed: Array<() => void> = [];
	// Every ref parsed so far, so a value resolved later sees the whole config
	protected _globalRefs: Array<IRef> = [];
	protected _updateTargets: "strict" | "soft";
	protected _resources: { [name: string]: unknown } | undefined;

	constructor(updateTargets: "strict" | "soft" = "strict", root?: Root, resources?: { [name: string]: unknown }) {
		this._updateTargets = updateTargets;
		this._resources = resources;
		// "@root" for every config, e.g. "@root.interfaceColors.get('background')"
		if (root) {
			this._globalRefs.push({ "@root": root });

			// "@colors", the theme's palette, e.g. "@colors.getIndex(3)"; made when
			// first used, so that themes set after the parser count
			let colors: ColorSet | undefined;
			const palette: IRef = {};
			Object.defineProperty(palette, "@colors", {
				enumerable: true,
				get: () => {
					if (!colors) {
						colors = ColorSet.new(root, {});
					}
					return colors;
				}
			});
			this._globalRefs.push(palette);
		}
	}

	// When `updateTargets` is "soft" and there is an existing entity target whose
	// type matches the incoming config's `type`, the config is merged into that
	// target in place (as if `type` had not been specified) instead of replacing
	// it with a freshly constructed object.
	protected _softMerges(old: unknown, type: string | undefined): old is Entity {
		return this._updateTargets === "soft"
			&& type !== undefined
			&& old instanceof Entity
			&& old.className === type;
	}


	afterParse(): void {
		this._delayed.forEach((f) => {
			f();
		});
	}


	getClass(name: string): typeof Entity {
		return this._cache[name];
	}

	async storeClass(name: string): Promise<void> {
		if (name === "Template") {
			// Do nothing
			return;
		}

		const promise = classes[name as keyof IClasses];

		if (promise == null) {
			throw new Error("Unknown object type `" + name + "`");
		}

		this._cache[name] = await promise() as typeof Entity;
	}

	cacheClass(name: string): Promise<void> {
		let promise = this._caching[name];

		if (promise == null) {
			promise = this._caching[name] = this.storeClass(name);
		}

		return promise;
	}


	async parseAsyncArray(array: Array<unknown>): Promise<void> {
		await Promise.all($array.map(array, (x) => this.parseAsync(x)));
	}

	async parseAsyncObjectKey(key: string, value: unknown): Promise<void> {
		if (key === "type") {
			if ($type.isString(value)) {
				await this.cacheClass(value);

			} else {
				await this.parseAsync(value);
			}

		} else if (key === "geoJSON" || key === "geometry") {
			// Do nothing

		} else {
			await this.parseAsync(value);
		}
	}

	async parseAsyncObject(object: object): Promise<void> {
		switch ((object as any).type) {
			case "Color":
			case "Percent":
				// Do nothing
				break;
			default:
				// `__parse` says the object is data, so a `type` in it is a column
				// name and not a class to go and load
				const isData = (object as any).__parse === true;
				await Promise.all($array.map($object.keys(object), (key) => {
					return isData && key === "type" ? Promise.resolve() : this.parseAsyncObjectKey(key, object[key]);
				}));
		}
	}

	async parseAsync(value: unknown): Promise<void> {
		if ($type.isArray(value)) {
			await this.parseAsyncArray(value);

		} else if (isObject(value)) {
			if (!isObjectParsed(value)) {
				if (value.__parse === true || value.__parse !== false) {
					await this.parseAsyncObject(value);
				}
			}
		}
	}


	parseObject(root: Root, object: object, refs: Array<IRef>): object {
		const output: { [key: string]: any } = {};

		$array.each($object.keys(object), (key) => {
			// Our own marker, not part of the object
			if (key === "__parse") {
				return;
			}
			output[key] = this.parse(root, object[key], refs);
		});

		return output;
	}

	parseArray(root: Root, value: Array<unknown>, refs: Array<IRef>): Array<unknown> {
		return $array.map(value, (value) => this.parse(root, value, refs));
	}

	parseChildren(root: Root, value: Array<{ [key: string]: any } | string>, refs: Array<IRef>): Array<IChild> {
		return $array.map(value, (value) => this.parseChild(root, value, refs));
	}

	parseStops(root: Root, value: Array<object>, refs: Array<IRef>): Array<object> {
		return $array.map(value, (value) => this.parseObject(root, value, refs));
	}

	parseSetting(root: Root, key: string, value: unknown, refs: Array<IRef>): unknown {
		if (key === "layout") {
			switch (value) {
				case "horizontal":
					return root.horizontalLayout;
				case "vertical":
					return root.verticalLayout;
				case "grid":
					return root.gridLayout;
			}
		}

		if (key === "clusteredBullet") {
			return (_: unknown, series: unknown) => {
				const newRefs = refs.concat([{ "@series": series }]);
				return this.parse(root, value, newRefs);
			};
		}

		if (key === "projection") {
			// @todo: implement
			return value;
		}

		if (key === "geoJSON") {
			// A geodata pack is referred to by name (`am5geodata_worldLow`) rather
			// than carrying a megabyte of coordinates
			if ($type.isString(value)) {
				const geodata = this.named(value, GEODATA_PREFIX);
				if (geodata) {
					return geodata;
				}
			}
			return value;
		}

		if (key === "stops") {
			return this.parseStops(root, value as Array<object>, refs);
		}

		// Plain descriptions whose `from` / `to` can be colors or percents
		if (key === "animations" && $type.isArray(value)) {
			return this.parseStops(root, value as Array<object>, refs);
		}

		return this.parse(root, value, refs);
	}

	parseSettings<E extends Entity>(root: Root, object: object, refs: Array<IRef>, pending?: { [key: string]: any }): E["_settings"] {
		const settings: { [key: string]: any } = {};

		$array.each($object.keys(object), (key) => {
			try {
				settings[key] = this.parseSetting(root, key, object[key], refs);
			} catch (e) {
				// A ref further down the config: hold the raw value and set it once
				// everything is parsed
				if (pending && e instanceof MissingRefError) {
					pending[key] = object[key];
				} else {
					throw e;
				}
			}
		});

		return settings;
	}

	parseState<E extends Entity>(root: Root, object: { key: string, settings: Object }, refs: Array<IRef>): { key: string, settings: E["_settings"] } {
		return {
			key: object.key,
			settings: object.settings ? this.parseSettings(root, object.settings, refs) : {},
		};
	}

	parseAdapter<E extends Entity>(root: Root, object: { key: keyof E["_settings"], callback: unknown }, refs: Array<IRef>): IAdapter<E> {
		return {
			key: object.key,
			callback: this.parse(root, object.callback, refs),
		};
	}

	parseProperties(root: Root, object: object, refs: Array<IRef>): IParsedProperties {
		// A flow's `nodes` have to exist before the `data` whose links point at
		// them, so they go first no matter where the config lists them
		const keys = $object.keys(object).slice();
		const nodesAt = (keys as Array<string>).indexOf("nodes");
		if (nodesAt > 0) {
			const nodesKey = keys.splice(nodesAt, 1)[0];
			keys.unshift(nodesKey);
		}

		return $array.map(keys, (key) => {
			const rawValue = object[key];

			return (entity: object) => {
				const run = () => {
					const parsed = this.parseValue(root, rawValue, refs);
					// Usually a property, but a block may also name a setting that
					// already holds an entity - an axis' `renderer`, say - and then it
					// configures the one that is there rather than replacing it
					const old = (entity[key] === undefined && typeof (entity as any).get === "function"
						? (entity as any).get(key)
						: entity[key]) as unknown;

					if (old) {
						if (parsed.isValue) {
							// Merge Array into List
							if ($type.isArray(parsed.value)) {
								if (old instanceof ListData) {
									(old as any).setAll(parsed.value);
								}
								else {
									$array.each(parsed.value, (value) => {
										(old as any).push(value);
									});
								}

							} else {
								(entity as any)[key] = parsed.value;
							}

							// A typed config normally replaces the existing object, but in
							// "soft" mode a same-type target is merged into instead (falls
							// through to the merge branch below).
						} else if (parsed.construct && !this._softMerges(old, parsed.type)) {
							(entity as any)[key] = constructEntity(root, parsed);

							// Merge into existing Entity
						} else if (old instanceof Entity) {
							this.mergeExistingEntity(root, old as Entity, parsed, refs);

							// Merge into existing Template
						} else if (old instanceof Template) {
							mergeExisting(old as unknown as Entity, parsed);

							// Merge into existing object
						} else {
							mergeObject(old as object, parsed);
						}

					} else {
						if (parsed.isValue) {
							(entity as any)[key] = parsed.value;

						} else {
							(entity as any)[key] = constructEntity(root, parsed);
						}
					}
				};

				const runOrDefer = () => {
					try {
						run();
					} catch (e) {
						if (e instanceof MissingRefError) {
							this._delayed.push(run);
						} else {
							throw e;
						}
					}
				};

				if (key === "data") {
					this._delayed.push(run);

				} else if (key === "bullets") {
					const old = entity[key] as unknown;

					$type.assert(old != null);
					$type.assert($type.isArray(rawValue));

					$array.each(rawValue, (value) => {
						(old as any).push((_: unknown, series: unknown) => {
							const newRefs = refs.concat([{ "@series": series }]);
							return this.parse(root, value, newRefs);
						});
					});

				} else if (key === "bullet") {
					(entity as any).set("bullet", (_: unknown, axis: unknown) => {
						const newRefs = refs.concat([{ "@axis": axis }]);
						return this.parse(root, rawValue, newRefs);
					});

				} else {
					runOrDefer();
				}
			};
		});
	}

	// Applies a parsed config to an already-existing entity. Unlike `setAll`, a
	// setting whose existing value is an [[Entity]] and whose incoming value is a
	// type-less, entity-shaped object (see `isMergeDescriptor`) is merged into that
	// existing sub-entity instead of replacing it with the raw config object.
	mergeExistingEntity<E extends Entity>(root: Root, entity: E, parsed: IParsedEntity<E>, refs: Array<IRef>): void {
		if (parsed.settings) {
			const rawSettings: any = (parsed.value as any).settings;
			mergeThemeTags(entity, parsed.settings);

			$object.each(parsed.settings, (key, value: any) => {
				const existing = (entity as any).get(key);
				const raw = rawSettings ? rawSettings[key] : undefined;

				// Merge into the existing sub-entity when the incoming setting is a
				// type-less merge descriptor, or - in "soft" mode - a same-type typed
				// object. Otherwise replace it with the parsed value.
				if (existing instanceof Entity && (isMergeDescriptor(raw) || this._softMerges(existing, isObject(raw) ? raw.type : undefined))) {
					this.mergeExistingEntity(root, existing, this.parseEntity(root, raw, refs), refs);

				} else {
					(entity as any).set(key, value);
				}
			});
		}

		mergeEntity(entity, parsed);
	}

	// What a config names instead of carrying it, such as a geodata pack: from
	// `resources`, or else the global of that name, which the script version
	// defines. A missing pack only warns, as the config may still build
	named(name: string, prefix: string): unknown {
		const resources = this._resources;
		// An empty entry (a wrong import) falls through to the warning
		if (resources && Object.prototype.hasOwnProperty.call(resources, name) && resources[name] != null) {
			return resources[name];
		}

		if (name.indexOf(prefix) === 0) {
			const found = typeof window !== "undefined" ? (window as any)[name] : undefined;
			if (found) {
				return found;
			}
			console.warn("JsonParser: \"" + name + "\" was not found. Pass it in the parse settings' `resources`, e.g. `resources: { " + name + " }`, or load its script file first.");
		}

		return undefined;
	}

	// Applies a `root` config section to the [[Root]] object. `properties` are set
	// directly on the `Root`; [[Entity]]-based properties (e.g. `numberFormatter`,
	// `dateFormatter`) are parsed and merged into the existing instance the same
	// way entities are parsed elsewhere (i.e. their settings live in a `settings`
	// block). `settings` are applied to the root's settings, then re-applied
	// non-destructively so they take effect.
	applyRoot(root: Root, config: { [key: string]: any }): void {
		const rootAny: any = root;

		const properties = config.properties;
		if (isObject(properties)) {
			$object.each(properties, (key, value) => {
				// A locale is named rather than copied out, so the pack it names is
				// looked up the same way a geodata pack is
				if (key === "locale" && $type.isString(value)) {
					const pack = this.named(value, LOCALE_PREFIX);
					if (pack) {
						rootAny.locale = pack;
					}
					if (pack || value.indexOf(LOCALE_PREFIX) === 0) {
						return;
					}
				}

				const existing = rootAny[key];
				if (existing instanceof Entity && isObject(value)) {
					this.mergeExistingEntity(root, existing, this.parseEntity(root, value, []), []);
				} else {
					rootAny[key] = this.parse(root, value, []);
				}
			});
		}

		const settings = config.settings;
		if (isObject(settings) && $object.keys(settings).length > 0) {
			$object.each(settings, (key, value) => {
				rootAny._settings[key] = this.parse(root, value, []);
				// Asked for now, whatever the Root filled in for itself earlier
				delete rootAny._computedSettings[key];
			});
			// Non-destructive re-apply (does NOT re-run `_init()`, which would
			// duplicate containers, DOM nodes and event listeners).
			rootAny._reapplySettings();
		}
	}

	parseAxisRange<E extends Entity>(root: Root, value: IAxisRange<E>, refs: Array<IRef>): IParsedEntity<E> {
		const settings = this.parseSettings(root, value.settings, refs);

		return {
			isValue: false,
			type: undefined,
			construct: undefined,
			settings,
			adapters: undefined,
			states: undefined,
			children: undefined,
			properties: undefined,
			index: undefined,
			value,
		};
	}

	parseRefsObject(root: Root, object: { [key: string]: any }, refs: Array<IRef>): IRef {
		const newRefs: IRef = {};

		$object.each(object, (key, value) => {
			if (value.__parseLogic == "axisRange" || value.__parseLogic == "seriesAxisRange") {
				// Parse axis range
				const parsed = this.parseAxisRange(root, value, refs);

				const axis = lookupRef(refs, value.axis);
				const axisDataItem = axis.makeDataItem({});

				let seriesRange: any | undefined;

				const series = value.series ? lookupRef(refs, value.series) : undefined;

				if (series) {
					seriesRange = series.createAxisRange(axisDataItem);

				} else {
					axis.createAxisRange(axisDataItem);
				}

				// Apply settings to data item
				mergeExistingAxisRange(axisDataItem, parsed);

				// Set series range settings
				if (seriesRange) {
					["fills", "strokes", "graphics"].forEach((targetKey: string) => {
						if (seriesRange[targetKey] !== undefined && value[targetKey] !== undefined) {
							value[targetKey].__parse = true;
							const parsedSetting = this.parse(root, value[targetKey], refs);
							// The flag is ours, not a setting
							delete parsedSetting.__parse;
							seriesRange[targetKey].template.setAll(parsedSetting);
						}
					});
				}

			} else {
				newRefs["#" + key] = this.parse(root, value, refs);
			}
		});

		return newRefs;
	}

	parseRefs(root: Root, object: IRefs, refs: Array<IRef>): Array<IRef> {
		if ($type.isArray(object)) {
			const length = object.length;

			for (let i = 0; i < length; ++i) {
				const parsed = this.parseRefsObject(root, object[i] as any, refs);
				this._globalRefs.push(parsed);
				refs = refs.concat([parsed]);
			}

		} else {
			const parsed = this.parseRefsObject(root, object, refs);
			this._globalRefs.push(parsed);
			refs = refs.concat([parsed]);
		}

		return refs;
	}


	parseChild(root: Root, value: { [key: string]: any } | string, refs: Array<IRef>): IChild {
		if ($type.isString(value)) {
			return {
				index: undefined,
				value: parseRef<Sprite>(value, refs).value,
			};

		} else if (value.ref != null) {
			const index = (value.index == null ? undefined : value.index);

			return {
				index,
				value: parseRef<Sprite>(value.ref, refs).value,
			};

		} else {
			const parsed = this.parseEntity<Sprite>(root, value, refs);

			return {
				index: parsed.index,
				value: constructEntity(root, parsed) as Sprite,
			};
		}
	}

	parseEntity<E extends Entity>(root: Root, value: { [key: string]: any }, refs: Array<IRef>): IParsedEntity<E> {
		if (value.refs) {
			refs = this.parseRefs(root, value.refs, refs);
		}

		const construct = (value.type ? this.getClass(value.type) : undefined);

		// Settings that reference `@self` (the entity itself) can't be resolved at construction time,
		// so they're split off and applied after the entity is built and its deferred data is set.
		let settingsRaw = value.settings;
		const selfSettings: { [key: string]: any } = {};
		let hasSelfSettings = false;

		if (settingsRaw) {
			$array.each($object.keys(settingsRaw), (key) => {
				// `geoJSON`/`geometry` are large opaque settings (same ones `parseAsync` skips) - never
				// scan into them.
				if (key !== "geoJSON" && key !== "geometry" && usesSelfRef(settingsRaw[key])) {
					selfSettings[key] = settingsRaw[key];
					hasSelfSettings = true;
				}
			});

			if (hasSelfSettings) {
				settingsRaw = Object.assign({}, settingsRaw);
				$array.each($object.keys(selfSettings), (key) => {
					delete settingsRaw[key];
				});
			}
		}

		const pendingSettings: { [key: string]: any } = {};
		const settings = (settingsRaw ? this.parseSettings(root, settingsRaw, refs, pendingSettings) : undefined);
		const hasPendingSettings = $object.keys(pendingSettings).length > 0;
		const properties = (value.properties ? this.parseProperties(root, value.properties, refs) : undefined);
		const children = (value.children ? this.parseChildren(root, value.children, refs) : undefined);
		const states = (value.states ? $array.map(value.states, (value: any) => this.parseState(root, value, refs)) : undefined);
		const adapters = (value.adapters ? $array.map(value.adapters, (value: any) => this.parseAdapter(root, value, refs)) : undefined) as any;

		const index = (value.index == null ? undefined : value.index);

		let allProperties = properties;

		if (hasPendingSettings) {
			const deferredRefs = (entity: object) => {
				this._delayed.push(() => {
					$array.each($object.keys(pendingSettings), (key) => {
						const parsed = this.parseValue(root, pendingSettings[key], refs);
						(entity as any).set(key, parsed.isValue ? parsed.value : constructEntity(root, parsed));
					});
				});
			};
			allProperties = allProperties ? allProperties.concat([deferredRefs]) : [deferredRefs];
		}

		if (hasSelfSettings) {
			const deferredProp = (entity: object) => {
				this._delayed.push(() => {
					const newRefs = refs.concat([{ "@self": entity }]);
					$array.each($object.keys(selfSettings), (key) => {
						const parsed = this.parseValue(root, selfSettings[key], newRefs);
						(entity as any).set(key, parsed.isValue ? parsed.value : constructEntity(root, parsed));
					});
				});
			};
			allProperties = allProperties ? allProperties.concat([deferredProp]) : [deferredProp];
		}

		return {
			isValue: false,
			type: value.type,
			construct,
			settings,
			adapters,
			states,
			children,
			properties: allProperties,
			index,
			value,
		};
	}

	parseTemplate<E extends Entity>(root: Root, value: { [key: string]: any }, refs: Array<IRef>): IParsed<E> {
		if (value.refs) {
			refs = this.parseRefs(root, value.refs, refs);
		}

		const settings = (value.settings ? this.parseSettings(root, value.settings, refs) : {});

		const template = Template.new(settings);

		const states = (value.states ? $array.map(value.states, (value: any) => this.parseState(root, value, refs)) : undefined);
		const adapters = (value.adapters ? $array.map(value.adapters, (value: any) => this.parseAdapter(root, value, refs)) : undefined) as any;

		if (adapters) {
			$array.each(adapters, (adapter: any) => {
				if (typeof adapter.callback === "function") {
					template.adapters.add(adapter.key, adapter.callback);
				}
			});
		}

		if (states) {
			$array.each(states, (state: any) => {
				template.states.create(state.key, state.settings);
			});
		}

		return {
			isValue: true,
			value: template,
		};
	}

	parseValue<E extends Entity>(root: Root, value: any, refs: Array<IRef>): IParsed<E> {
		if (value instanceof Entity) {
			return { isValue: true, value: value };

		} else if ($type.isArray(value)) {
			return {
				isValue: true,
				value: this.parseArray(root, value, refs),
			};

		} else if (isObject(value)) {
			if (isObjectParsed(value)) {
				return {
					isValue: true,
					value,
				};

				// Read before any `type`: the marker is what says whether this is an
				// object to build or data to leave alone
			} else if (value.__parse === true) {
				return {
					isValue: true,
					value: this.parseObject(root, value, refs),
				};

			} else if (value.__parse === false) {
				// The marker is ours, not part of the data
				const copy: { [key: string]: any } = {};
				$object.each(value, (key, item) => {
					if (key !== "__parse") {
						copy[key] = item;
					}
				});
				return {
					isValue: true,
					value: copy,
				};

			} else if (value.type === "Color") {
				return {
					isValue: true,
					value: Color.fromAny(value.value),
				};

			} else if (registry.geometryFunctions[value.type as string]) {
				// A shape stored as the call that made it (GeoRectangle, GeoCircle)
				const args: any = {};
				$object.each(value as any, (key, arg) => {
					if (key !== "type") {
						args[key] = arg;
					}
				});
				return {
					isValue: true,
					value: registry.geometryFunctions[value.type as string](args),
				};

			} else if (value.type === "Percent") {
				return {
					isValue: true,
					value: new Percent(value.value),
				};

			} else if (value.type === "Template") {
				return this.parseTemplate(root, value, refs);

			} else {
				return this.parseEntity(root, value, refs);
			}

		} else if ($type.isString(value)) {
			return parseRef(value, refs, this._globalRefs);

		} else {
			return {
				isValue: true,
				value,
			};
		}
	}

	parse<E extends Entity>(root: Root, value: unknown, refs: Array<IRef>): any {
		const parsed = this.parseValue<E>(root, value, refs);

		if (parsed.isValue) {
			return parsed.value;

		} else {
			return constructEntity<E>(root, parsed);
		}
	}
}

export interface IParseSettings {

	/**
	 * Container to add the parsed chart to, usually `root.container`. The
	 * config must then build a [[Sprite]].
	 */
	parent?: Container;

	/**
	 * What a config block with a `type` does to an object that is already
	 * there: `"strict"` replaces it with a new object of that type; `"soft"`
	 * replaces it only if its type differs, and otherwise applies the block to
	 * it, as if the block had no `type`.
	 *
	 * @default "strict"
	 * @since 5.20.3
	 */
	updateTargets?: "strict" | "soft";

	/**
	 * Objects a config names instead of carrying them, by that name: geodata
	 * packs (`"geoJSON": "am5geodata_worldLow"`) and locales
	 * (`"locale": "am5locales_de_DE"`). They are looked up here first, and then
	 * as globals, which only the script version defines, so with npm imports
	 * pass them here:
	 *
	 * ```TypeScript
	 * import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
	 * parser.parse(config, { parent: root.container, resources: { am5geodata_worldLow } });
	 * ```
	 *
	 * @since 5.21.4
	 */
	resources?: { [name: string]: unknown };
}

/**
 * Builds charts from JSON configs.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/serializing/} for more info
 * @since 5.3.0
 */
export class JsonParser {
	protected _root: Root;

	/**
	 * IMPORTANT! Do not instantiate this class via `new Class()` syntax.
	 *
	 * Use static method `Class.new()` instead.
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/#new-element-syntax} for more info
	 * @ignore
	 */
	constructor(root: Root, isReal: boolean) {
		if (!isReal) {
			throw new Error("You cannot use `new Class()`, instead use `Class.new()`");
		}

		this._root = root;
	}

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/#new-element-syntax} for more info
	 * @param   root      Root element
	 * @return            Instantiated object
	 */
	static new<C extends typeof JsonParser, T extends InstanceType<C>>(this: C, root: Root): T {
		return (new this(root, true)) as T;
	}

	/**
	 * Builds the chart objects a config describes, loading the classes it
	 * needs first.
	 *
	 * @param   object    Config, as a plain object
	 * @param   settings  Parse settings
	 * @return            A promise of the object the config builds, usually the chart
	 */
	async parse<E extends Entity>(object: unknown, settings: IParseSettings = {}): Promise<E> {
		const state = new ParserState(settings.updateTargets, this._root, settings.resources);

		await state.parseAsync(object);

		// Apply the top-level `root` config section to the `Root` object before
		// the chart is parsed. Only the top-level entry is treated this way
		// (nested parsing never inspects `root`), and the key is ignored by the
		// rest of the parser, so it does not affect chart/entity parsing.
		if (isObject(object) && isObject((object as any).root)) {
			state.applyRoot(this._root, (object as any).root);
		}

		const output = state.parse(this._root, object, []) as E;

		if (settings.parent) {
			if (output instanceof Sprite) {
				settings.parent.children.push(output);

			} else {
				throw new Error("When using the parent setting, the entity must be a Sprite");
			}

		}
		else if (output instanceof Entity) {
			output._applyThemes(true);
		}

		state.afterParse();

		return output;
	}

	/**
	 * Builds the chart objects a config describes, from a JSON string.
	 *
	 * @param   string    JSON string
	 * @param   settings  Parse settings
	 * @return            A promise of the object the config builds, usually the chart
	 */
	async parseString<E extends Entity>(string: string, settings: IParseSettings = {}): Promise<E> {
		return await this.parse(JSON.parse(string), settings);
	}
}

/**
 * Registers a class so that it can be parsed and instantiated by JSON parser.
 *
 * @param  name  Class name
 * @param  ref   Class reference
 * @ignore
 */
export function registerCustomClass(name: string, ref: any): void {
	if (!(classes as any)[name]) {
		(classes as any)[name] = () => new Promise((resolve) => {
			resolve(ref);
		});
	}
}
