import { Entity, _lastUid } from "../../core/util/Entity";
import { ColorSet } from "../../core/util/ColorSet";
import type { Sprite } from "../../core/render/Sprite";
import type { SerialChart } from "../../core/render/SerialChart";
import type { SerialChartContainer } from "../../core/render/SerialChartContainer";
import type { Series } from "../../core/render/Series";
import type { XYChart } from "../../charts/xy/XYChart";
import type { XYSeries } from "../../charts/xy/series/XYSeries";
import type { XYChartScrollbar } from "../../charts/xy/XYChartScrollbar";
import type { MapChart } from "../../charts/map/MapChart";
import type { CurveChart } from "../../charts/timeline/CurveChart";
import type { Gantt } from "../../charts/gantt/Gantt";
import type { StockChart } from "../../charts/stock/StockChart";
import type { Hierarchy } from "../../charts/hierarchy/Hierarchy";
import type { Legend } from "../../core/render/Legend";
import type { HeatLegend } from "../../core/render/HeatLegend";
import type { Axis } from "../../charts/xy/axes/Axis";
import type { CategoryAxis } from "../../charts/xy/axes/CategoryAxis";

import { Container } from "../../core/render/Container";
import { DataItem } from "../../core/render/Component";
import { Color } from "../../core/util/Color";
import { ListTemplate } from "../../core/util/List";
import { Serializer, ISerializerEvents, ISerializerSettings, ISerializerPrivate } from "./Serializer";

import * as $object from "../../core/util/Object";
import * as $type from "../../core/util/Type";
import * as $array from "../../core/util/Array";

export interface IChartSerializerSettings extends ISerializerSettings {

	/**
	 * Leaves empty objects out of the output.
	 *
	 * @default true
	 */
	removeEmptyObjects?: boolean;

	/**
	 * Adds a `root` section with what was configured on the [[Root]], such as
	 * its settings, formatters and locale.
	 *
	 * @default false
	 * @since 5.20.2
	 */
	includeRoot?: boolean;

	/**
	 * Objects to write out by name instead of copying them: geodata packs and
	 * locales, under the names [[JsonParser]] gets them by in its `resources`,
	 * e.g. `{ am5geodata_worldLow }`. Without them, only packs loaded as
	 * globals (the script version) are written as names.
	 *
	 * @since 5.21.4
	 */
	resources?: { [name: string]: unknown };

}

export interface IChartSerializerPrivate extends ISerializerPrivate {
}

export interface IChartSerializerEvents extends ISerializerEvents {
}


/**
 * Serializes a whole chart, with its axes, series, data and legends, into a
 * config that [[JsonParser]] builds the chart from again. Unlike
 * [[Serializer]], by default it writes states and adapters, keeps adapter
 * callbacks as functions, and goes 10 levels deep.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/serializing/chart-serializer/} for more info
 * @since 5.15.0
 */
export class ChartSerializer extends Serializer {

	public static className: string = "ChartSerializer";
	public static classNames: Array<string> = Serializer.classNames.concat([ChartSerializer.className]);

	declare public _settings: IChartSerializerSettings;
	declare public _privateSettings: IChartSerializerPrivate;
	declare public _events: IChartSerializerEvents;

	private _disableDataSerialization: boolean = false;

	/**
	 * Settings that hold another series (a map line series' `pointSeries`, say).
	 * They are written out as a reference, but the series they point at may not
	 * have been given one yet, so they are collected and filled in at the end.
	 */
	private _pendingSeriesRefs: Array<{ node: any, key: string, series: any, holder: any }> = [];

	/**
	 * Work that cannot be done until every series has been given an id - a legend
	 * that sits above its chart is reached before the series it lists.
	 */
	private _deferred: Array<() => void> = [];
	private _globalRefs: Array<any> = [];
	private _internalRefs: any = {};
	private _counters: { [index: string]: number } = {};
	private _lists: { [index: string]: any } = {};
	private _mainRefs: { [index: string]: Array<any> } = {};

	protected _afterNew(): void {
		super._afterNew();
		this._setSoft("maxDepth", 10);
		this._setSoft("removeEmptyObjects", true);
		this._setSoft("includeRoot", false);
		this._setSoft("includeEvents", true);
		this._setSoft("includeAdapters", true);
		this._setSoft("includeStates", true);
		this._setSoft("functionsAs", "function");
		//this._setSoft("includeProperties", ["label"]);
		this._setSoft("excludeSettings", [
			"chart",
			"draw",
			"curveFactory",
			"pixelHeightFunction",
			"tooltipDataItem",
			"legendDataItem",
			"vcx",
			"vcy",
			"bounds",
			"pointTo",
			"tooltipTarget",
			"translateX",
			"translateY",
			// Handled directly
			"heatRules"
		]); // "x", "y"

		this.adapters.add("excludeProperties", (exclude: Array<string> | undefined) => {
			if (this._disableDataSerialization) {
				return (exclude || []).concat(["data"]);
			}
			return exclude;
		});

		this.reset();
	}

	/**
	 * Clears what the serializer remembers from an earlier `serializeAll()`.
	 * Call it before serializing again with the same serializer.
	 */
	public reset(): void {
		this._palette = undefined;
		this._disableDataSerialization = false;
		this._pendingSeriesRefs = [];
		this._deferred = [];
		this._globalRefs = [];
		this._internalRefs = {};
		this._counters = {};
		this._lists = {
			data: {},
			axes: {},
			series: {},
			sprites: {},
			elements: {}
		};
		this._mainRefs = {
			functions: [],
			data: [],
			templates: [],
			axes: [],
			series: [],
			axisRanges: [],
			seriesAxisRanges: []
		};
	}

	/**
	 * Serializes a chart, or a container with charts, into a config object.
	 *
	 * @param   source  Chart or container
	 * @return          Config
	 */
	public serializeAll(source: Container): any {

		// This will go as deep in the structure to find either chart or a series,
		// then will pass on to specialized serializers

		// Map out the structure
		this._examineStructure(source);

		// Kick off serializing
		const result = this._serializeEntity(source);

		// Now that every series has been given an id, the settings that point at
		// one can say so
		const referenced: { [index: string]: Array<string> } = {};

		$array.each(this._pendingSeriesRefs, (pending) => {
			const id = this._getInternalRef(pending.series.uid);
			if (id) {
				pending.node[pending.key] = "#" + id;
				const holder = this._getInternalRef(pending.holder.uid);
				if (holder) {
					if (!referenced[holder]) {
						referenced[holder] = [];
					}
					referenced[holder].push(id);
				}
			}
			else {
				// Nothing to point at - the series is not part of what was
				// serialized. Better an absent setting than a second, empty copy
				// of a series that already exists somewhere else.
				delete pending.node[pending.key];
			}
		});

		this._orderSeriesRefs(referenced);

		// Anything that had to wait for every series to have an id
		$array.each(this._deferred, (run) => {
			run();
		});

		// Finally, add in global references
		result.refs = [];
		$object.each(this._mainRefs, (_key, value) => {
			if (value.length) {
				value.forEach((item) => {
					// A series saved on its own is the config itself, not something it refers to
					if (!$object.keys(item).some((id) => item[id] === result)) {
						result.refs.push(item);
					}
				});
			}
		});

		// Root settings/properties
		if (this.get("includeRoot")) {
			result.root = this._serializeRoot();
		}

		// Cleanup
		if (this.get("removeEmptyObjects")) {
			this._pruneEmptyObjects(result);
		}

		return result;
	}

	private _serializeRoot(): any {
		const root: any = this.root;
		const result: any = { properties: {}, settings: {} };

		// Properties. Entity-based properties (formatters) are serialized into a
		// `settings` block (no `type`) so they merge into the existing instance on
		// parse; primitives are included as-is.
		// What a `Root` starts out with, so that only a changed one is written out
		const rootDefaults: { [index: string]: any } = { utc: false, tabindex: 0 };

		$array.each(["utc", "fps", "numberFormatter", "dateFormatter", "durationFormatter", "tabindex", "interfaceColors"], (key: string) => {
			const value = root[key];
			if (value === undefined || value === rootDefaults[key]) {
				return;
			}
			if (value instanceof Entity) {
				const serialized: any = this.serialize(value, 0, false);
				this._stripType(serialized);
				result.properties[key] = serialized;
			}
			else {
				result.properties[key] = value;
			}
		});

		// A locale is a pack loaded as a global (`am5locales_de_DE`), so it goes
		// out as that name - the same as a geodata pack - rather than as a copy of
		// every translation in it
		if (root.locale) {
			const name = this._nameOf(root.locale, "am5locales_");
			if (name !== undefined) {
				result.properties.locale = name;
			}
		}

		// Settings from `Root._settings`, minus the ones the Root filled in for
		// itself
		const settings: any = {};
		$object.each(root.settings, (key: any, value: any) => {
			// The renderer is a runtime choice (and a class), not chart configuration
			if (!root._computedSettings[key] && key !== "renderer") {
				settings[key] = value;
			}
		});
		result.settings = this.serialize(settings, 0, true);

		return result;
	}

	private _serializeEntity(source: Entity): any {
		// Initialize the result object
		let result: any;

		// Process series differently
		if (source.isType<Series>("Series") && !this._isLegend(source)) {
			this._disableDataSerialization = true;
			result = this.serialize(source, 0, true);
			this._disableDataSerialization = false;
			this._processSeries(source, result);
			// const seriesId = this._processSeries(source, result);
			// this._lists.series[seriesId];
		}
		else {
			result = this.serialize(source, 0, true)!;
		}

		// Only go deeper if it's a plain Container
		if (source.className === "Container") {
			result.children = [];
			(source as Container).children.each((child: Sprite) => {
				// A legend, a breadcrumb bar or anything tagged `serialize` is written
				// out by `_processCustomChildren`, which knows how to do it - writing
				// it here as well would put it in the config twice
				const claimed = this._lists.sprites[child.uid] !== undefined;

				if (!this._isLegend(child) && !claimed) {
					const serializedChild = this._serializeEntity(child);
					if (child.isType<Series>("Series")) {
						result.children.push("#" + this._getInternalRef(child.uid));
					}
					else {
						result.children.push(serializedChild);
					}
				}
			});
		}

		// Specialized serializers
		if (source.isType<SerialChart>("SerialChart")) {
			this._processSerialChart(source, result);
		}

		if (source.isType<SerialChartContainer>("SerialChartContainer")) {
			this._processSerialChartContainer(source, result);
		}

		if (source.isType<XYChart>("XYChart")) {
			this._processXYChart(source, result);
		}

		if (source.isType<MapChart>("MapChart")) {
			this._processMapChart(source, result);
		}

		if (source.isType<CurveChart>("CurveChart")) {
			this._processCurveChart(source, result);
		}

		if (source.isType<StockChart>("StockChart")) {
			this._processStockChart(source, result);
		}

		if (source.isType<Gantt>("Gantt")) {
			this._processGantt(source, result);
		}

		if (source.isType<Hierarchy>("Hierarchy")) {
			this._processHierarchy(source, result);
		}


		// Process custom children
		if (source.isType<Container>("Container")) {
			this._processCustomChildren(source, result);

			// Check for custom children in property-linked internal containers
			$object.each(source, (key: string, child: any) => {
				if (child instanceof Container && !key.match(/^\_/)) {
					this._maybeInit(result, "properties", {})
					this._maybeInit(result.properties, key, {})
					this._processCustomChildren(child, result.properties[key]);
				}
			});
		}

		return result;
	}

	private _examineStructure(source: Container) {
		// A plain container someone made is serialized with its children. One the
		// library built - a chart's plot container, say - is not, so what was put
		// in it is looked for here.
		const plain = source.className === "Container" && !source._builtIn;

		// Collect serializable custom children
		source.children.each((child: Sprite) => {
			this._lists.elements[child.uid] = child;
			// A sprite made for a data item is the data showing, not configuration
			const dataDriven = (child as any).dataItem !== undefined;
			const builtIn = child._builtIn;

			if (child.hasTag("serialize") || this._isLegend(child) || child.isType<Entity>("BreadcrumbBar")
				|| (!plain && !dataDriven && !builtIn && !this._isOwnElement(source, child))) {
				this._lists.sprites[child.uid] = child;
			}

			if (child.isType<Container>("Container")) {
				this._examineStructure(child);
			}
		});
	}

	private _processCustomChildren(source: Container, result: any) {
		source.children.each((child: Sprite) => {
			if (this._lists.sprites[child.uid] !== undefined) {
				delete this._lists.sprites[child.uid];
				this._maybeInit(result, "children", []);
				let childItem: any;

				// A series among the children still goes through the series path -
				// data, templates and bullets - and is referenced from here
				if (child.isType<Series>("Series") && !this._isLegend(child)) {
					this._serializeEntity(child);
					result.children.push("#" + this._getInternalRef(child.uid));
					return;
				}

				// Additional processing for Legend
				if (child.isType<Legend>("Legend")) {
					// Do not let serializer serialize legend's data
					// It can contain big objects like Series, we'll build the data array
					// ourselves
					this._disableDataSerialization = true;
					childItem = this.serialize(child, 0, false);
					this._maybeInit(childItem, "properties", {});
					childItem.properties.data = [];
					this._disableDataSerialization = false;

					// Which series a legend lists is settled at the end: a legend put
					// above its chart - in a band of its own, say - is reached before
					// the series it refers to, and those have no ids yet
					const legendItem: any = childItem;
					const legendChild: any = child;

					this._deferred.push(() => {
						legendChild.data.values.forEach((item: any, index: number) => {
							if (item instanceof DataItem) {
								legendItem.properties.data[index] = this._dataItemRef(item.component, item);
							}
							else if (item instanceof Entity && item.isType<Series>("Series")) {
								legendItem.properties.data[index] = "#" + this._getInternalRef(item.uid);
							}
							else {
								// A row of its own, written like series data (e.g. a Color as a type)
								legendItem.properties.data[index] = (this.serializeData([item]) as Array<any>)[0];
							}
						});

						this._collapseLegendData(legendChild, legendItem);
					});

					this._populateTemplates(child, childItem.properties, [
						"labels", "valueLabels", "markers", "markerRectangles", "itemContainers"
					]);
				}
				else if (child.isType<HeatLegend>("HeatLegend")) {
					childItem = this.serialize(child, 0, false);
					this._maybeInit(childItem, "properties", {});
					this._populateTemplates(child, childItem.properties, ["markers"]);
					["startLabel", "endLabel"].forEach((key: string) => {
						const serializedPropValue = this.serialize((child as any)[key], 0, true);
						if (serializedPropValue) {
							this._stripType(serializedPropValue);
							childItem.properties[key] = serializedPropValue;
						}
					});
				}
				else if (child.isType<Entity>("BreadcrumbBar")) {
					childItem = this.serialize(child, 0, false);
					// `series` is the chart's own series, so it goes out as a reference
					const series: any = (child as any).get("series");
					if (series) {
						this._maybeInit(childItem, "settings", {});
						// Filled in at the end: a bar sitting above its chart is reached
						// before the series is, and the series has no id yet
						this._pendingSeriesRefs.push({ node: childItem.settings, key: "series", series: series, holder: child });
					}
				}
				else {
					// A container someone added to a chart - a title block, say - is
					// only itself worth writing out if what is inside it comes too
					childItem = this._serializeEntity(child);
				}

				// Only worth writing out if the child sits somewhere other than the
				// end, where parsing puts it anyway
				const children = child.parent!.children;
				const index = children.indexOf(child);
				if (index < children.length - 1) {
					childItem.index = index;
				}

				result.children.push(childItem);
			}
		});
	}

	/**
	 * A map's `geoJSON` is normally one of the geodata packs, loaded as a global.
	 * Written out by the name it is loaded under, so a config stays small and the
	 * pack is not duplicated into it.
	 */
	private _referenceGeodata(source: any, result: any): void {
		// The live setting, not the serialized copy - the copy has lost the
		// identity that says which pack it came from
		const geoJSON = source.get ? source.get("geoJSON") : undefined;
		if (!geoJSON || !result || !result.settings || !result.settings.geoJSON) {
			return;
		}

		const name = this._nameOf(geoJSON, "am5geodata_");
		if (name !== undefined) {
			result.settings.geoJSON = name;
		}
	}

	// The name an object is known by: its key in `resources`, or else the
	// global (with the given prefix) it was loaded as
	private _nameOf(value: unknown, prefix: string): string | undefined {
		const resources = this.get("resources");
		if (resources) {
			const keys = $object.keys(resources);
			for (let i = 0; i < keys.length; i++) {
				if (resources[keys[i]] === value) {
					return keys[i] as string;
				}
			}
		}

		if (typeof window !== "undefined") {
			const global: any = window;
			const keys = $object.keys(global);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i] as string;
				if (key.indexOf(prefix) === 0 && global[key] === value) {
					return key;
				}
			}
		}

		return undefined;
	}

	private _processSeries(series: Series, result: any): string {
		this._referenceGeodata(series, result);

		const datahash = this._hashObject(series.data.values);
		let dataId: any = this._getInternalRef(datahash);
		const seriesId = this._getId("series");
		this._lists.series[seriesId] = result;

		// A word cloud extracts its words from `text`, so its data is its own
		// doing and comes back on its own
		const generated = series.isType<Entity>("WordCloud") && (series as any).get("text") != null;

		this._saveInternalRef(series.uid, seriesId);
		if (dataId === undefined && !generated) {
			dataId = this._getId("data");
			this._lists.data[dataId] = this.serializeData(series.data.values);
			this._saveInternalRef(datahash, dataId);
			//_datas[dataId] = this._lists.data[dataId];
			this._saveRefId("data", dataId, this._lists.data[dataId]);
		}
		this._maybeInit(this._lists.series[seriesId], "properties", {});
		if (!generated) {
			this._lists.series[seriesId].properties.data = "#" + dataId;
		}

		// Populate templates
		this._populateTemplates(series, this._lists.series[seriesId].properties, [
			// XY
			"strokes", "fills", "columns",
			// Percent
			"slices", "labels", "ticks", "links",
			// Hierarchy
			"nodes", "circles", "outerCircles", "rectangles", "polygons",
			// Map
			"mapPolygons", "mapLines"
		]);

		// The nodes of a flow - or of a map sankey - are a series in their own
		// right, with their own templates. Serialized without a type, so that they
		// configure the nodes the series already made
		const nodes: any = (series as any).nodes;
		if (nodes && nodes.isType && nodes.isType("Series")) {
			// The nodes are built from the links, so their data is only worth
			// writing out when it was set by hand
			this._disableDataSerialization = !nodes._userDataSet;
			const serializedNodes: any = this.serialize(nodes, 0, false);
			this._disableDataSerialization = false;

			this._stripType(serializedNodes);
			this._maybeInit(serializedNodes, "properties", {});
			this._populateTemplates(nodes, serializedNodes.properties, [
				"rectangles", "slices", "circles", "labels", "mapPolygons"
			]);
			this._processBullets(nodes, serializedNodes.properties);
			this._lists.series[seriesId].properties.nodes = serializedNodes;
		}

		// A word cloud's silhouette is styleable, so it goes out as settings for
		// the shape the series already made
		if (series.isType<Entity>("WordCloud")) {
			const shape: any = (series as any).shape;
			if (shape) {
				const serializedShape: any = this.serialize(shape, 0, false);
				this._stripType(serializedShape);
				if (serializedShape.settings) {
					this._lists.series[seriesId].properties.shape = serializedShape;
				}
			}
		}

		// A setting that holds another series goes out as a reference to it, not as
		// a second copy of that series
		const serializedSettings: any = this._lists.series[seriesId].settings;
		if (serializedSettings) {
			$object.each(serializedSettings, (key: any) => {
				const value: any = (series as any).get(key);
				if (value && value.isType && value.isType("Series")) {
					this._pendingSeriesRefs.push({ node: serializedSettings, key: key, series: value, holder: series });
				}
			});
		}

		// Handle bullets
		this._processBullets(series, this._lists.series[seriesId].properties);

		// Handle heat rules
		const heatRules = series.get("heatRules");
		if (heatRules) {

			this._lists.series[seriesId].settings.heatRules = [];
			heatRules.forEach((rule: any) => {

				// Figure out target
				let targetId: any = this._findInternalRef(rule.target);
				if (targetId) {
					targetId = "#" + targetId;
				}
				else {
					// Let's search in series template lists
					$object.each(series, (key: any, value: any) => {
						if (value instanceof ListTemplate && value.template === rule.target) {
							const templateId = this._getId("template");
							const serializedTemplate = this.serialize(value.template, 0, true);
							targetId = "#" + templateId;
							result.properties[key].properties.template = "#" + templateId;
							this._saveRefId("templates", templateId, serializedTemplate);
							this._saveInternalRef(templateId, value.template);
						}
					});
				}
				if (targetId) {
					const serializedRule: any = this.serialize(rule, 0, true);
					serializedRule.target = targetId;
					serializedRule.__parse = true;
					this._lists.series[seriesId].settings.heatRules.push(serializedRule);
				}
			});
		}

		// Handle Hierarchy
		if (series.isType<Hierarchy>("Hierarchy")) {
			this._processHierarchy(series, result);
		}

		this._saveRefId("series", seriesId, this._lists.series[seriesId]);
		this._processCustomChildren(series, this._lists.series[seriesId]);

		return seriesId;
	}

	private _referenceSeriesColors(sprite: Sprite, series: Series, serializedSprite: any): void {
		const settings = serializedSprite && serializedSprite.settings;
		if (!settings) {
			return;
		}
		$array.each(["fill", "stroke"], (key: string) => {
			// Only touch colors that were actually serialized (own settings).
			if (settings[key] === undefined) {
				return;
			}
			// Raw: the comparison is against what was configured on the sprite, and
			// a colour adapter reads a data item the sample sprite does not have
			const spriteColor = sprite.getRaw(key as any);
			const seriesColor = series.get(key as any);
			if (spriteColor instanceof Color && seriesColor instanceof Color && spriteColor.hex === seriesColor.hex) {
				settings[key] = "@series.get('" + key + "')";
			}
		});
	}

	private _processTemplate(source: Sprite, result: any): void {
		if (source.template) {
			const template = source.template;
			const templateId = this._getId("template");
			const serializedTemplate = this.serialize(template, 0, true);
			this._maybeInit(result, "properties", {})
			result.properties.template = "#" + templateId;
			this._saveRefId("templates", templateId, serializedTemplate);
			this._saveInternalRef(templateId, template);
		}

		if (source.isType<Container>("Container")) {
			source.children.each((child: any, index: number) => {
				if (result.children && (result.children.length > index)) {
					this._processTemplate(child, result.children[index]);
				}
			});
		}
	}

	private _processSerialChart(source: SerialChart, result: any): void {

		// A background behind the series is styling; the container's own geometry is
		// the chart's business and is left alone. Shaped like the plot container's:
		// the background is a setting, so it rides in `settings` where merging
		// reaches it
		const seriesBackground: any = source.seriesContainer.get("background");

		if (seriesBackground) {
			// The type stays: unlike a plot container, a series container has no
			// background of its own, so there is nothing to merge into and one has
			// to be built
			const serializedBackground: any = this.serialize(seriesBackground, 0, false);

			if (serializedBackground.settings || serializedBackground.states) {
				this._maybeInit(result, "properties", {});
				result.properties.seriesContainer = { settings: { background: serializedBackground } };
			}
		}

		// Process series
		const _series: any = [];
		source.series.each((series: any, _index: number) => {
			this._disableDataSerialization = true;
			const serializedSeries = this.serialize(series, 0, true);
			this._disableDataSerialization = false;
			const seriesId = this._processSeries(series, serializedSeries);
			this._lists.series[seriesId];
			_series.push("#" + seriesId);
		});

		// Add series to chart
		if (_series.length) {
			this._maybeInit(result, "properties", {});
			result.properties.series = _series;
		}

		// Custom children
		this._processCustomChildren(source, result);
	}

	private _processSerialChartContainer(source: SerialChartContainer, result: any): void {

		// Init properites
		this._maybeInit(result, "properties", {});

		// Serialize zoomableContainer
		result.properties.zoomableContainer = this.serialize(source.zoomableContainer, 0, false);
		this._stripType(result.properties.zoomableContainer);

		// Process ZoomTools
		if (result.settings && result.settings.zoomTools && result.settings.zoomTools.settings) {
			// `target` is re-pointed at the chart's `seriesContainer` on parse.
			delete result.settings.zoomTools.settings.target;

			// A parsed `ZoomTools` creates its own buttons, so we only export
			// their settings (no `type`) to configure them in place. `background`
			// and `icon` are theme-created sub-elements and are stripped, same as
			// XYChart's `zoomOutButton`.
			const zoomTools: any = source.get("zoomTools");
			this._maybeInit(result.settings.zoomTools, "properties", {});
			["homeButton", "minusButton", "plusButton"].forEach((button) => {
				const serializedButton: any = this.serialize(zoomTools[button], 0, false);
				this._stripType(serializedButton);
				if (serializedButton.settings) {
					this._stripType(serializedButton.settings.background);
					this._stripType(serializedButton.settings.icon);
					//delete serializedButton.settings.icon;
				}
				result.settings.zoomTools.properties[button] = serializedButton;
			});
		}
	}

	private _processXYChart(source: XYChart, result: any) {

		this._maybeInit(result, "properties", {});

		// Add axes
		["x", "y"].forEach((axisType: string) => {
			const ids: Array<string> = [];

			(source as any)[axisType + "Axes"].each((axis: Axis<any>, _index: number) => {
				const axisId = this._processAxis(axis, null);
				ids.push("#" + axisId);
			});

			if (ids.length) {
				result.properties[axisType + "Axes"] = ids;
			}
		});

		// Populate series with axe references
		source.series.each((series: any, _index: number) => {
			const id = this._getInternalRef(series.uid);
			this._lists.series[id].settings.xAxis = "#" + this._getInternalRef(series.get("xAxis").uid);
			this._lists.series[id].settings.yAxis = "#" + this._getInternalRef(series.get("yAxis").uid);
			// only when it was asked for - the chart picks one otherwise
			if (series.isUserSetting("baseAxis") && !series.isComputedSetting("baseAxis")) {
				this._lists.series[id].settings.baseAxis = "#" + this._getInternalRef(series.get("baseAxis").uid);
			}
		});

		// Process series axis ranges
		source.series.each((series: any, _index: number) => {
			const axisRanges = (series as XYSeries).axisRanges.values;
			if (axisRanges.length) {
				for (let i = 0; i < axisRanges.length; i++) {
					const rangeId = this._getId("seriesAxisRange");
					const range = axisRanges[i];
					const axis = range.axisDataItem.component;
					const axisId = this._getInternalRef(axis.uid)
					const seriesId = this._getInternalRef(series.uid)
					const rangeSettings: any = this.serialize(range.axisDataItem._settings, 0, true);
					this._stripRangeInternals(rangeSettings);

					const serializedRange: any = {
						axis: "#" + axisId,
						series: "#" + seriesId,
						settings: rangeSettings,
						__parseLogic: "axisRange"
					};
					["fills", "strokes", "graphics"].forEach((key: string) => {
						const value = (range as any)[key];
						if (value && value instanceof ListTemplate) {
							// Raw settings, so the computed ones have to be left out here
							const templateSettings: any = {};
							$object.each(value.template._settings, (settingKey: any, settingValue: any) => {
								if (!value.template._computedSettings[settingKey]) {
									templateSettings[settingKey] = settingValue;
								}
							});
							serializedRange[key] = this.serialize(templateSettings, 0, true);
						}
					});
					this._saveRefId("seriesAxisRanges", rangeId, serializedRange);
				}
			}
		});

		// Handle layout for axis containers
		["leftAxesContainer", "rightAxesContainer"].forEach((key: string) => {
			const serializedContainer = this.serialize((source as any)[key], 0, true);
			if (serializedContainer) {
				this._stripType(serializedContainer);
				this._maybeInit(result, "properties", {});
				result.properties[key] = serializedContainer;
			}
		});

		// Process cursor
		const cursor: any = source.get("cursor");
		if (cursor && result.settings && result.settings.cursor) {
			["x", "y"].forEach((axisType: string) => {
				const axis = cursor.get(axisType + "Axis");
				if (axis) {
					result.settings.cursor.settings[axisType + "Axis"] = "#" + this._getInternalRef(axis.uid);
				}
				this._maybeInit(result.settings.cursor, "properties", {});
			});
			result.settings.cursor.properties.lineX = this.serialize(cursor.lineX);
			result.settings.cursor.properties.lineY = this.serialize(cursor.lineY);
			this._stripType(result.settings.cursor.properties.lineX);
			this._stripType(result.settings.cursor.properties.lineY);

			cursor.get("snapToSeries", []).forEach((series: any, index: number) => {
				result.settings.cursor.settings.snapToSeries[index] = "#" + this._getInternalRef(series.uid);
			});
		}

		// Process the rest of the XY stuff
		// The chart makes this button itself, so it goes out type-less - and so do
		// the background and icon it carries, which are styleable and used to be
		// dropped outright
		result.properties.zoomOutButton = this.serialize(source.zoomOutButton, 0, false);
		this._stripType(result.properties.zoomOutButton);

		if (result.properties.zoomOutButton.settings) {
			this._stripType(result.properties.zoomOutButton.settings.background);
			this._stripType(result.properties.zoomOutButton.settings.icon);
		}

		// The plot container is a readonly property, so it is serialized type-less
		// and merged into the existing one on parse. Its background gets the same
		// treatment, so it keeps the theme tags the chart gave it.
		const serializedPlotContainer: any = this.serialize(source.plotContainer, 0, false);
		this._stripType(serializedPlotContainer);

		// Its background gets the same treatment - unless someone chose it, in
		// which case the class is part of the choice
		if (serializedPlotContainer.settings && serializedPlotContainer.settings.background) {
			const plotBackground: any = source.plotContainer.get("background");
			const chosen = source.plotContainer.isUserSetting("background") && !source.plotContainer.isComputedSetting("background");

			if (!chosen || !plotBackground) {
				this._stripType(serializedPlotContainer.settings.background);
			}
		}

		result.properties.plotContainer = serializedPlotContainer;

		// Process the scrollbar
		const scrollbarX = source.get("scrollbarX");
		if (scrollbarX && scrollbarX.isType<XYChartScrollbar>("XYChartScrollbar")) {
			const serializedScrollbarChart: any = this._serializeEntity(scrollbarX.chart);
			this._stripType(serializedScrollbarChart);
			this._maybeInit(result.settings.scrollbarX, "properties", {});
			result.settings.scrollbarX.properties.chart = serializedScrollbarChart;
		}
	}

	private _processAxis(axis: Axis<any>, _result: any, stripType?: boolean): string {
		const axisId = this._getId("axis");
		const serializedAxis: any = this.serialize(axis, 0, true);
		this._saveRefId("axes", axisId, serializedAxis);

		// Renderer
		this._maybeInit(serializedAxis.settings, "renderer", {});
		this._maybeInit(serializedAxis.settings.renderer, "properties", {});
		this._populateTemplates(axis.get("renderer"), serializedAxis.settings.renderer.properties, [
			"labels", "grid", "minorGrid", "ticks", "axisFills"
		]);

		// Axis syncing
		const syncedAxis = (axis as any).get("syncWithAxis");
		if (syncedAxis) {
			serializedAxis.settings.syncWithAxis = "#" + this._getInternalRef(syncedAxis.uid);
		}

		// Axis header
		if (axis.axisHeader && axis.axisHeader.children.length) {
			this._maybeInit(serializedAxis, "properties", {});
			serializedAxis.properties.axisHeader = this.serialize(axis.axisHeader, 0, true);
			this._processCustomChildren(axis.axisHeader, serializedAxis.properties.axisHeader);
		}

		// Axis bullet
		const bulletFunction = axis.get("bullet");
		if (bulletFunction) {
			const sampleDataItem = axis.dataItems.length ? axis.dataItems[0] : new DataItem(axis, {}, {});
			const bullet = bulletFunction(axis.root, axis, sampleDataItem);
			const serializedBullet: any = this.serialize(bullet, 0, true);
			serializedAxis.properties.bullet = serializedBullet;
		}

		// Axis ranges
		const axisRanges = axis.axisRanges.values;
		if (axisRanges.length) {
			for (let i = 0; i < axisRanges.length; i++) {
				const rangeId = this._getId("axisRange");
				const range = axisRanges[i];
				const rangeSettings: any = this.serialize(range._settings, 0, true);
				this._stripRangeInternals(rangeSettings);

				const serializedRange: any = {
					axis: "#" + axisId,
					settings: rangeSettings,
					__parseLogic: "axisRange"
				};
				this._saveRefId("axisRanges", rangeId, serializedRange);
			}
		}

		// Process CategoryAxis data
		if (axis.isType<CategoryAxis<any>>("CategoryAxis")) {
			let dataid: any = this._getInternalRef(this._hashObject(axis.data.values));
			if (dataid === undefined) {
				dataid = this._getId("data");
				this._lists.data[dataid] = this.serializeData(axis.data.values);
				this._saveInternalRef(this._hashObject(axis.data.values), dataid);
				this._saveRefId("data", dataid, this._lists.data[dataid]);
			}
			this._maybeInit(serializedAxis, "properties", {});
			serializedAxis.properties.data = "#" + dataid;
		}
		this._saveInternalRef(axis.uid, axisId);

		if (stripType) {
			this._stripType(serializedAxis);
			this._stripType(serializedAxis.settings.renderer);
		}

		const axisItem: any = {};
		axisItem[axisId] = serializedAxis;
		this._processCustomChildren(axis, axisItem[axisId]);
		this._globalRefs.push(axisItem);

		return axisId;
	}

	/**
	 * Some elements are built out of smaller ones they make for themselves - a
	 * scrollbar's thumb and grips, a button's background and icon, a clock hand's
	 * hand and pin. Styling those is styling the chart, so they go out as settings
	 * for the ones already there, wherever the element was reached from.
	 */
	protected _afterEntity(source: any, res: any): void {
		if (!source || !source.isType) {
			return;
		}

		if (source.isType("ClockHand")) {
			this._processParts(source, res, ["hand", "pin"]);
		}

		if (source.isType("Scrollbar")) {
			// `overlay` is an XY chart scrollbar's - absent ones are skipped
			this._processParts(source, res, ["thumb", "startGrip", "endGrip", "background", "overlay"]);
		}

		if (source.isType("XYCursor")) {
			this._processParts(source, res, ["selection"]);
		}

		if (source.isType("AxisRenderer")) {
			this._processParts(source, res, ["thumb"]);
		}

		if (source.isType("PictorialStackedSeries")) {
			this._processParts(source, res, ["seriesGraphics"]);
		}

		// The sun the series makes itself, unless one was set
		if (source.isType("NightSeries")) {
			this._processParts(source, res, ["sun"]);
		}

		if (source.isType("PercentSeries")) {
			this._processParts(source, res, ["labelsContainer", "ticksContainer"]);
		}

		if (source.isType("Series")) {
			this._processParts(source, res, ["bulletsContainer"]);

			// Hidden with hide() or a legend click: a state, not a setting, but it
			// is how the chart was left. Not while autoAppear has yet to show it
			if (source.isHidden() && !source._appearPending && !(res.settings && res.settings.visible !== undefined)) {
				this._maybeInit(res, "settings", {});
				res.settings.visible = false;
			}
		}

		// A palette usually arrives from a theme and is then edited in place rather
		// than replaced, so what was changed on it has to be written out. It keeps
		// its type and goes in `settings`, the same shape an assigned palette
		// already takes - a colour set is cheap to build, and a config that names
		// its colours has no need of the themed one. An assigned palette is
		// already there and is left alone.
		const colors: any = source.get ? source.get("colors") : undefined;

		if (colors && colors.isType && colors.isType("ColorSet") && !(res.settings && res.settings.colors)) {
			// A palette arriving from a theme is not a setting anyone made, so the
			// generic pass writes what was edited on it in place. It is written
			// whole here instead, and both would be one palette too many.
			if (res.properties) {
				delete res.properties.colors;
			}

			const serializedColors: any = this.serialize(colors, 0, false);

			if (serializedColors.settings) {
				// It stands in for the themed palette rather than merging into it, so
				// it has to carry what the theme built that one with - a hierarchy's
				// `step: 2`, the scrollbar preview's `saturation: 0` - or those are
				// lost and the colours come back different. Not what any color set
				// gets from the theme anyway, such as the palette itself
				const themed = ColorSet.new(this._root, { themeTags: colors.get("themeTags") });
				$object.each((colors as any)._settings, (key: any, value: any) => {
					// A plain object set by the user, such as `passOptions`, came out empty above
					const written = serializedColors.settings[key];
					const missing = written === undefined || ($type.isObject(written) && !$type.isArray(written) && $object.keys(written).length == 0);
					if (missing && themed.get(key) !== value) {
						serializedColors.settings[key] = this.serialize(value, 0, true);
					}
				});
				themed.dispose();

				this._maybeInit(res, "settings", {});
				res.settings.colors = serializedColors;
			}
		}

		if (source.isType("Button")) {
			this._processParts(source, res, ["background", "icon"]);
		}
	}

	/**
	 * Writes out the named parts of an element, type-less so that they configure
	 * the ones it has already made rather than standing in for them. A part with
	 * nothing configured on it is left out, and one the element carries as a
	 * setting is left to that setting.
	 */
	private _processParts(source: any, res: any, keys: Array<string>): void {
		$array.each(keys, (key: string) => {
			if (res.settings && res.settings[key] !== undefined) {
				return;
			}

			const part: any = source[key] !== undefined ? source[key] : (source.get ? source.get(key) : undefined);

			if (!part || !part.isType) {
				return;
			}

			const serializedPart: any = this.serialize(part, 0, false);
			this._stripType(serializedPart);

			// States and adapters count as configuration too - a hover on a
			// scrollbar's thumb may be the only thing anyone set on it
			if (serializedPart.settings || serializedPart.properties || serializedPart.states || serializedPart.adapters) {
				this._maybeInit(res, "properties", {});
				res.properties[key] = serializedPart;
			}
		});
	}

	private _processCurveChart(source: CurveChart, _result: any) {
		// Curve Chart needs special treament, as it's X axis references Y axis
		// via `yAxis` of its renderer
		source.xAxes.each((axis: Axis<any>) => {
			const xRenderer = axis.get("renderer");
			const yRenderer = xRenderer.get("yRenderer");
			if (yRenderer) {
				// Add reference
				const xAxisId = this._getInternalRef(axis.uid);
				const yAxisId = this._getInternalRef(yRenderer.axis.uid);
				const serializedXAxis = this._getRef("axes", xAxisId);
				serializedXAxis.settings.renderer.settings.yRenderer = "#" + yAxisId + ".get('renderer')";

				const serializedYAxis = this._getRef("axes", yAxisId);
				delete serializedYAxis.settings.renderer.settings.xRenderer;

				// Swap positions of the axes
				const xIndex = this._getRefIndex("axes", xAxisId);
				const yIndex = this._getRefIndex("axes", yAxisId);
				if (xIndex < yIndex) {
					[this._mainRefs.axes[xIndex], this._mainRefs.axes[yIndex]] = [this._mainRefs.axes[yIndex], this._mainRefs.axes[xIndex]];
				}
			}
		});
	}

	private _processMapChart(source: MapChart, result: any) {
		// Clean up auto-populated data
		source.series.each((series: any, _index: number) => {
			const seriesId = this._getInternalRef(series.uid);
			const serializedSeries = this._lists.series[seriesId];
			let serializedData = this._getRef("data", serializedSeries.properties.data.substr(1));
			$array.keepIf(serializedData, (item: any) => !item.madeFromGeoData);

			// Collect ids present in the series' `geoJSON`, so we can strip the
			// geometry off the user data that duplicates a GeoJSON feature.
			const idField = series.get("idField", "id");
			const geoJSON = series.get("geoJSON");
			const geoJSONIds: { [index: string]: any } = {};
			if (geoJSON) {
				let features: any[] = [];
				if (geoJSON.type == "FeatureCollection") {
					features = geoJSON.features;
				}
				else if (geoJSON.type == "Feature") {
					features = [geoJSON];
				}
				$array.each(features, (feature: any) => {
					const id = feature[idField];
					if (id != null) {
						geoJSONIds[id] = feature.properties || {};
					}
				});
			}

			$array.each(serializedData, (item: any) => {
				const id = item[idField];
				// If the same id exists in `geoJSON`, the geometry will be
				// re-populated from there, so we don't need to serialize it.
				if (id != null && geoJSONIds[id]) {
					delete item.geometry;
					delete item.geometryType;
					// Feature properties (`name`, ...) are copied onto the row on
					// load, so one still equal to the feature's is not the user's
					$object.each(geoJSONIds[id], (key, value) => {
						if (key !== idField && item[key] === value) {
							delete item[key];
						}
					});
				}
			});
			// what is left of a row that only restated its feature is its id
			if (geoJSON) {
				$array.keepIf(serializedData, (item: any) => {
					return item[idField] == null || !geoJSONIds[item[idField]] || $object.keys(item).some((key) => key !== idField && key !== "__parse");
				});
			}
			if (serializedData.length === 0) {
				delete serializedSeries.properties.data;
			}

			// Clustered bullet
			if (series.get("clusteredBullet")) {
				const bulletFunction = series.get("clusteredBullet");
				const sampleDataItem = series.clusteredDataItems.length ? series.clusteredDataItems[0] : new DataItem(series, {}, {});
				const bullet = bulletFunction(series.root, series, sampleDataItem);
				const serializedBullet: any = this.serialize(bullet, 0, true);
				if (bullet.get("sprite")) {
					serializedBullet.settings.sprite = this._serializeEntity(bullet.get("sprite"));
					this._lists.series[seriesId].settings.clusteredBullet = serializedBullet;
					this._processTemplate(bullet.get("sprite"), serializedBullet.settings.sprite);
				}
			}
		});

		// Remove target from ZoomControl
		if (result.settings && result.settings.zoomControl && result.settings.zoomControl.settings && result.settings.zoomControl.settings.target) {
			delete result.settings.zoomControl.settings.target;
			this._maybeInit(result.settings.zoomControl, "properties", {});
			// Same as `ZoomTools`: the control builds its own buttons, so export
			// what was asked of them and nothing else.
			const zoomControl: any = source.get("zoomControl");
			["homeButton", "minusButton", "plusButton"].forEach((button) => {
				const serializedButton: any = this.serialize(zoomControl[button], 0, false);
				this._stripType(serializedButton);
				if (serializedButton.settings) {
					this._stripType(serializedButton.settings.background);
					this._stripType(serializedButton.settings.icon);
				}
				if (serializedButton.settings || serializedButton.properties || serializedButton.states) {
					result.settings.zoomControl.properties[button] = serializedButton;
				}
			});
		}

		// Handle projection setting
		const projection = source.get("projection")

		// If the projection carries a registered name (e.g. set via
		// `am5map.geoMercator()`) and no explicit `projectionName` was set,
		// emit `projectionName` so the chart round-trips even when built in code.
		if (projection && !source.get("projectionName") && (projection as any).__projectionName) {
			this._maybeInit(result, "settings", {});
			result.settings.projectionName = (projection as any).__projectionName;
		}

	}

	/**
	 * A Gantt is its own settings, the rows it lays out and the tasks on them.
	 * The chart, both date axes, the category axis, the series and the
	 * scrollbars are the Gantt's own doing, so they are written out only where
	 * something was configured on them - as settings on the ones it rebuilds,
	 * never as replacements.
	 */
	private _processGantt(source: Gantt, result: any) {
		this._maybeInit(result, "properties", {});

		const part = (element: any, data: Array<any> | undefined, templates: Array<string>) => {
			// No type: the Gantt makes these itself, so this configures them in
			// place rather than standing in for them
			this._disableDataSerialization = true;
			const serialized: any = this.serialize(element, 0, false);
			this._disableDataSerialization = false;
			this._stripType(serialized);

			if (data && data.length) {
				this._maybeInit(serialized, "properties", {});
				serialized.properties.data = "#" + this._dataRef(data);
			}

			if (templates.length) {
				this._maybeInit(serialized, "properties", {});
				this._populateTemplates(element, serialized.properties, templates);
			}

			return serialized;
		};

		const yAxis: any = part(source.yAxis, source.yAxis.data.values, []);

		// Labels, grid and ticks belong to the axis' renderer, and the Gantt makes
		// that renderer itself - so it goes out type-less too, to style the one
		// that is already there
		const renderer: any = source.yAxis.get("renderer");
		if (renderer) {
			const serializedRenderer: any = part(renderer, undefined, ["labels", "grid", "ticks"]);
			this._maybeInit(yAxis, "properties", {});
			yAxis.properties.renderer = serializedRenderer;
		}

		result.properties.yAxis = yAxis;

		const series: any = part(source.series, source.series.data.values, [
			"links", "columns", "startGrips", "endGrips", "startBullets", "endBullets",
			"zeroRectangles", "progressRectangles", "progressGrips"
		]);

		// The line and the arrow shown while a link is being drawn are sprites
		// rather than templates, so they are styled in place
		this._maybeInit(series, "properties", {});
		["connectorLine", "connectorArrow"].forEach((key: string) => {
			const sprite: any = (source.series as any)[key];
			if (sprite) {
				const serializedSprite: any = this.serialize(sprite, 0, false);
				this._stripType(serializedSprite);
				if (serializedSprite.settings) {
					series.properties[key] = serializedSprite;
				}
			}
		});

		result.properties.series = series;
	}

	/**
	 * The ref a data array is written out as, reusing the one already made if
	 * the same data is on more than one element.
	 */
	private _dataRef(values: Array<any>): string {
		const hash = this._hashObject(values);
		let dataId: any = this._getInternalRef(hash);

		if (dataId === undefined) {
			dataId = this._getId("data");
			this._lists.data[dataId] = this.serializeData(values);
			this._saveInternalRef(hash, dataId);
			this._saveRefId("data", dataId, this._lists.data[dataId]);
		}

		return dataId;
	}

	private _processStockChart(source: StockChart, result: any) {
		this._notSupported(source, result);
	}

	private _processHierarchy(source: Hierarchy, result: any) {
		const selectedDataItem = source.get("selectedDataItem");
		if (selectedDataItem) {
			const index = source.dataItems.indexOf(selectedDataItem);
			result.settings.selectedDataItem = "@self.dataItems." + index;
		}
	}

	/**
	 * A data item's endless animation - a plane flying its route, say - is
	 * started in code, so nothing on the bullet says it is playing. It is
	 * written as an `animations` entry aimed at the data item, which is what
	 * plays it back: on the bullet's sprite when every data item plays the same
	 * one, or in each data item's own data, through the sprite's
	 * `templateField`, when they differ (moons, each at its own speed). Where
	 * the data can't hold them, the first one goes on the sprite, as before.
	 *
	 * @param   series            Series
	 * @param   sprite            Bullet sprite
	 * @param   serializedSprite  Serialized bullet sprite
	 * @param   properties        Serialized series properties
	 */
	private _processDataItemAnimations(series: any, sprite: any, serializedSprite: any, properties: any): void {
		if (!this.get("runningAnimations", true) || !serializedSprite) {
			return;
		}

		// Each playing data item's entries, by its row in the data
		const values = series.data.values;
		const byRow: Array<Array<any>> = [];
		let first: Array<any> = [];
		let same = true;
		let perRow = true;
		$array.each(series.dataItems, (dataItem: any) => {
			const entries = this._runningAnimationEntries(dataItem, 0, "dataItem");
			if (!entries.length) {
				return;
			}
			if (!first.length) {
				first = entries;
			}
			else if (JSON.stringify(entries) !== JSON.stringify(first)) {
				same = false;
			}
			// Rows dropped later (made from geodata) or not parsed (objects) can't hold them
			const context: any = dataItem.dataContext;
			const row = values.indexOf(context);
			const objects = $array.any(entries, (entry: any) => $type.isObject(entry.from) || $type.isObject(entry.to));
			if (row === -1 || (context && context.madeFromGeoData) || objects) {
				perRow = false;
			}
			else {
				byRow[row] = entries;
			}
		});

		if (!first.length) {
			return;
		}

		const settings = serializedSprite.settings = serializedSprite.settings || {};
		const dataRef = properties && properties.data;
		const rows = $type.isString(dataRef) && dataRef[0] === "#" ? this._lists.data[dataRef.substr(1)] : undefined;

		// A template can't add to a sprite's own `animations`, so those go there too
		if (same || !perRow || !$type.isArray(rows) || settings.animations || sprite.get("animations")) {
			settings.animations = (settings.animations || []).concat(first);
			return;
		}

		// Each item's own, in its data row, under the sprite's templateField
		let field: string = sprite.get("templateField");
		if (!$type.isString(field)) {
			field = "bulletSettings";
			while ($array.any(rows, (row: any) => $type.isObject(row) && (row as any)[field] !== undefined)) {
				field += "_";
			}
			settings.templateField = field;
		}
		$array.each(rows, (row: any, index: number) => {
			const entries = byRow[index];
			const item: any = row;
			if (entries && $type.isObject(row)) {
				const own: any = $type.isObject(item[field]) ? item[field] : {};
				const merged: any = $object.copy(own);
				merged.animations = (own.animations || []).concat(entries);
				item[field] = merged;
			}
		});
	}

	private _processBullets(series: any, properties: any): void {
		let first = true;

		series.bullets.each((bulletFunction: any) => {
			const sampleDataItem = series.dataItems.length ? series.dataItems[0] : new DataItem(series, {}, {});
			// What the function makes now gets a higher uid; anything older is shared
			const lastUid = _lastUid();
			const bullet = bulletFunction(series.root, series, sampleDataItem);

			// A bullet function may decide there is no bullet for this data item
			if (!bullet) {
				return;
			}

			// only now, or a series whose bullets all opt out writes out an empty list
			this._maybeInit(properties, "bullets", []);

			const serializedBullet: any = this.serialize(bullet, 0, true);
			const bulletSprite = bullet.get("sprite");
			if (bulletSprite) {
				// Serialize the sprite (including children)
				serializedBullet.settings.sprite = this._serializeEntity(bulletSprite);

				// If the bullet's `fill`/`stroke` is the exact same color as the
				// related series', replace the serialized color with a reference to
				// the series, so the two stay in sync when parsed back.
				this._referenceSeriesColors(bulletSprite, series, serializedBullet.settings.sprite);

				// Only the first one, or every bullet animates the same data item
				if (first) {
					this._processDataItemAnimations(series, bulletSprite, serializedBullet.settings.sprite, properties);
					first = false;
				}

				properties.bullets.push(serializedBullet);

				// Look for templates
				this._processTemplate(bulletSprite, serializedBullet.settings.sprite);
			}

			// The sample was built only to be read. Left alive it still draws on
			// the next frame, and a bullet's own adapter - which expects the data
			// item this sample never had - throws there instead.
			this._disposeSampleBullet(bulletFunction, series, sampleDataItem, bullet, lastUid);
		});
	}

	// Disposes what a bullet function made for the sample, but not what it hands
	// out again: anything made before the call, or cached on this first call
	private _disposeSampleBullet(bulletFunction: any, series: any, dataItem: any, bullet: any, lastUid: number): void {
		const isNew = (entity: any) => entity && entity.uid > lastUid;
		const sprite = bullet.get("sprite");

		if (!isNew(bullet) && !isNew(sprite)) {
			return;
		}

		// A function that caches returns the same objects again
		const again = bulletFunction(series.root, series, dataItem);
		const againSprite = again ? again.get("sprite") : undefined;

		if (isNew(sprite) && sprite !== againSprite) {
			sprite.dispose();
		}
		if (isNew(bullet) && bullet !== again) {
			bullet.dispose();
		}
		if (isNew(againSprite) && againSprite !== sprite) {
			againSprite.dispose();
		}
		if (isNew(again) && again !== bullet) {
			again.dispose();
		}
	}

	private _populateTemplates(source: any, result: any, templateKeys: Array<any>): void {
		templateKeys.forEach((key: string) => {
			if (source[key] && source[key].template) {
				this._maybeInit(result, key, {});
				result[key] = {
					properties: {
						template: this.serialize(source[key].template, 0, true)
					}
				};
				this._stripType(result[key].properties.template);
			}
		});
	}

	/**
	 * A reference to a data item, by the path it sits at. Only rows of a series'
	 * data end up in `dataItems`; anything below that (a hierarchy's second level,
	 * say) is reached through its parent's `children`.
	 */
	private _dataItemRef(series: any, item: any): string | undefined {
		const path: Array<string> = [];
		let current: any = item;

		while (current) {
			const parent: any = current.get("parent");

			if (parent) {
				const children: Array<any> = parent.get("children", []);
				const index = $array.indexOf(children, current);
				if (index === -1) {
					return undefined;
				}
				path.unshift("get('children')." + index);
				current = parent;
			}
			else {
				const index = $array.indexOf(series.dataItems, current);
				if (index === -1) {
					return undefined;
				}
				path.unshift("dataItems." + index);
				current = undefined;
			}
		}

		return "#" + this._getInternalRef(series.uid) + "." + path.join(".");
	}

	private _stripKeys(source: any, keys: Array<string>): void {
		if (source == null) {
			return;
		}

		keys.forEach((key: string) => {
			if (source[key] !== undefined) {
				delete source[key];
			}
		});
	}

	private _stripType(source: any): void {
		this._stripKeys(source, ["type"]);
	}

	private _saveInternalRef(ref: any, value: any): any {
		return this._internalRefs[ref] = value;
	}

	private _getInternalRef(ref: any): any {
		return this._internalRefs[ref];
	}

	private _findInternalRef(ref: any): any {
		let res: any;
		$object.eachContinue(this._internalRefs, (key, value) => {
			if (value === ref) {
				res = key;
				return false;
			}
			return true;
		});
		return res;
	}

	private _getRef(key: string, id: string): any {
		let found: any;
		this._mainRefs[key].forEach((value: any) => {
			if (value[id] !== undefined) {
				found = value[id];
				return;
			}
		});
		return found;
	}

	private _getRefIndex(key: string, id: string): number {
		let found: number = -1;
		this._mainRefs[key].forEach((value: any, index: number) => {
			if (value[id] !== undefined) {
				found = index;
				return;
			}
		});
		return found;
	}

	private _saveRef(key: string, value: any): void {
		this._mainRefs[key].push(value);
	}

	/**
	 * Puts a series that another series points at before the one pointing at it.
	 *
	 * Refs are resolved in the order they are written, so a reference to a series
	 * further down the list is not there yet when it is read. Series are usually
	 * added to a chart in drawing order - lines under points, say - which is
	 * exactly the order that breaks.
	 */
	private _orderSeriesRefs(referenced: { [index: string]: Array<string> }): void {
		if ($object.keys(referenced).length === 0) {
			return;
		}

		const entries: Array<any> = this._mainRefs.series;
		const byId: { [index: string]: any } = {};

		$array.each(entries, (entry) => {
			byId[$object.keys(entry)[0]] = entry;
		});

		const ordered: Array<any> = [];
		const placed: { [index: string]: boolean } = {};
		const visiting: { [index: string]: boolean } = {};

		const place = (id: string) => {
			// A cycle cannot be satisfied by ordering; leave those where they were
			if (placed[id] || visiting[id] || !byId[id]) {
				return;
			}
			visiting[id] = true;
			$array.each(referenced[id] || [], (target) => {
				place(target);
			});
			delete visiting[id];
			placed[id] = true;
			ordered.push(byId[id]);
		};

		$array.each(entries, (entry) => {
			place($object.keys(entry)[0]);
		});

		this._mainRefs.series = ordered;
	}

	private _saveRefId(key: string, id: string, value: any): void {
		const ref: any = {};
		ref[id] = value;
		this._saveRef(key, ref);
	}

	// private _saveFunction(callback: any): string {
	// 	const id = this._getId("function");
	// 	this._saveRefId("functions", id, this.get("functionsAs") == "string" ? callback.toString() : callback);
	// 	return id;
	// }

	private _hashObject(obj: any) {
		const json = JSON.stringify(obj, (_key, value) => {
			if ($type.isObject(value) && value instanceof Entity) {
				return JSON.stringify(Object.keys(value));
			}
			return value;
		});
		let hash = 0;

		for (let i = 0; i < json.length; i++) {
			const chr = json.charCodeAt(i);
			hash = (hash << 5) - hash + chr;
			hash |= 0; // convert to 32-bit int
		}

		return "h" + (hash >>> 0).toString(16); // unsigned hex
	}

	private _maybeInit(source: any, key: string, value: any): void {
		if (!source[key]) {
			source[key] = value;
		}
	}

	private _counter(id: string): number {
		if (this._counters[id] === undefined) {
			this._counters[id] = 0;
		}
		else {
			this._counters[id]++;
		}
		return this._counters[id];
	}

	private _getId(id: string): string {
		return id + "-" + this._counter(id);
	}

	/**
	 * Leaves out what a range sets up for itself when parsed back: `isRange`,
	 * which `__parseLogic` already implies, and any asset that came out carrying
	 * nothing but a type - saying only that the object exists.
	 */
	private _stripRangeInternals(settings: any) {
		delete settings.isRange;

		// A range starts out shown, so only a hidden one is worth writing out
		if (settings.visible === true) {
			delete settings.visible;
		}

		$array.each(["grid", "tick", "label", "axisFill", "bullet"], (key) => {
			const value = settings[key];
			if (value && $type.isObject(value) && (value as any).type !== undefined) {
				// empty its settings first - a bag that only held values the axis
				// worked out is empty by the time anyone reads it
				this._pruneEmptyObjects(value);
				if ($object.keys(value).length === 1) {
					delete settings[key];
				}
			}
		});
	}

	private _pruneEmptyObjects(value: any): boolean {
		// Non-object primitives → never empty
		if (value === null || !$type.isObject(value)) {
			return false;
		}

		// Process arrays
		if ($type.isArray(value)) {
			for (let i = value.length - 1; i >= 0; i--) {
				const el = value[i];
				if (el && $type.isObject(el) && !$type.isArray(el)) {
					const empty = this._pruneEmptyObjects(el);
					if (empty) {
						value.splice(i, 1);
					}
				}
			}
			return false;
		}

		// Regular object
		for (const key of $object.keys(value)) {
			const child = value[key];

			if (key === "states" && $type.isArray(value)) {
				delete value[key];
			}
			else if (child && $type.isObject(child)) {
				const childEmpty = this._pruneEmptyObjects(child);
				if (childEmpty) {
					delete value[key];
				}
			}
		}

		return Object.keys(value).length === 0;
	}

	/**
	 * A legend holding a whole list of data items, in order, is written out as the
	 * list itself - the way it is usually configured - rather than as one
	 * reference per item, so it still matches the series after its data changes.
	 */
	private _collapseLegendData(legend: any, item: any): void {
		const values: Array<any> = legend.data.values;
		const first: any = values[0];

		if (!values.length || !(first instanceof DataItem)) {
			return;
		}

		const series = first.component;
		const parent: any = first.get("parent");
		const siblings: Array<any> = parent ? parent.get("children", []) : series.dataItems;

		let whole = siblings.length === values.length;

		if (whole) {
			$array.eachContinue(values, (value: any, index: number) => {
				whole = value === siblings[index];
				return whole;
			});
		}

		if (!whole) {
			return;
		}

		if (parent) {
			const parentRef = this._dataItemRef(series, parent);
			if (parentRef) {
				item.properties.data = parentRef + ".get('children')";
			}
		}
		else {
			item.properties.data = "#" + this._getInternalRef(series.uid) + ".dataItems";
		}
	}

	/**
	 * Whether the element is one the parent keeps for itself - held in a property
	 * or in a setting. Anything else among its children was put there by whoever
	 * built the chart.
	 */
	private _isOwnElement(source: any, child: Sprite): boolean {
		// The holder is not always the parent: a Gantt keeps its toolbar containers
		// and puts them inside the chart it builds, so ask every ancestor too
		let holder: any = source;

		while (holder) {
			if (this._holds(holder, child)) {
				return true;
			}
			holder = holder.parent;
		}

		return false;
	}

	private _holds(source: any, child: Sprite): boolean {
		let own = false;

		$object.each(source, (_key: any, value: any) => {
			if (value === child) {
				own = true;
			}
		});

		if (!own) {
			$object.each(source._settings, (_key: any, value: any) => {
				if (value === child) {
					own = true;
				}
			});
		}

		// A list the parent keeps - a series' axis ranges, say - can hold the
		// element itself or a container the library made to put it in. `children`
		// is the list being decided about, so it holds everything and answers
		// nothing. Data is never one of those, and walking it would mean a pass
		// over every row.
		if (!own) {
			$object.each(source, (key: any, value: any) => {
				if (own || key === "children" || key === "_data" || key === "_dataItems" || !value || typeof value.each !== "function") {
					return;
				}

				$array.eachContinue(value.values || [], (item: any) => {
					if (item === child || (item && item.container === child)) {
						own = true;
					}
					return !own;
				});
			});
		}

		return own;
	}

	private _isLegend(source: Entity): boolean {
		return source.isType<Legend>("Legend") || source.isType<HeatLegend>("HeatLegend");
	}

	private _notSupported(_source: Entity, result: any) {
		throw new Error("Unsupported type for serialization: " + result.type);
	}

}
