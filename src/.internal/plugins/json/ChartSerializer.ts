import { Entity } from "../../core/util/Entity";
import type { Sprite } from "../../core/render/Sprite";
import type { SerialChart } from "../../core/render/SerialChart";
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
import { ListTemplate } from "../../core/util/List";
import { Serializer, ISerializerEvents, ISerializerSettings, ISerializerPrivate } from "./Serializer";

import * as $object from "../../core/util/Object";
import * as $type from "../../core/util/Type";
import * as $array from "../../core/util/Array";

export interface IChartSerializerSettings extends ISerializerSettings {

	/**
	 * Remove empty objects from the output.
	 *
	 * @default true
	 */
	removeEmptyObjects?: boolean;

	/**
	 * Include projection settings in the output.
	 *
	 * If enabled, the projection function will be included in the output,
	 * according to the `functionsAs` setting.
	 *
	 * @default false
	 */
	includeProjection?: boolean;

}

export interface IChartSerializerPrivate extends ISerializerPrivate {
}

export interface IChartSerializerEvents extends ISerializerEvents {
}


/**
 * Serializes whole charts into simple objects or JSON.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/serializing/chart-serializer/} for more info
 * @since 5.15.0
 */
export class ChartSerializer extends Serializer {

	public static className: string = "ChartSerializer";
	public static classNames: Array<string> = Serializer.classNames.concat([ChartSerializer.className]);

	declare public _settings: IChartSerializerSettings;
	declare public _privateSettings: IChartSerializerPrivate;
	declare public _events: IChartSerializerEvents;

	private _disableDataSerialization: boolean = false;
	private _globalRefs: Array<any> = [];
	private _internalRefs: any = {};
	private _counters: { [index: string]: number } = {};
	private _lists: { [index: string]: any } = {};
	private _mainRefs: { [index: string]: Array<any> } = {};

	protected _afterNew(): void {
		super._afterNew();
		this._setSoft("maxDepth", 10);
		this._setSoft("removeEmptyObjects", true);
		this._setSoft("includeEvents", true);
		this._setSoft("includeAdapters", true);
		this._setSoft("includeStates", true);
		this._setSoft("functionsAs", "function");
		//this._setSoft("includeProperties", ["label"]);
		this._setSoft("excludeSettings", [
			"chart",
			"themeTags",
			"draw",
			"curveFactory",
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

	public reset(): void {
		this._disableDataSerialization = false;
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
	 * Serializes target object into a simple object.
	 *
	 * @param   source  Target object
	 * @return          Serialized data
	 */
	public serializeAll(source: Container): any {

		// This will go as deep in the structure to find either chart or a series,
		// then will pass on to specialized serializers

		// Map out the structure
		this._examineStructure(source);

		// Kick off serializing
		const result = this._serializeEntity(source);

		// Finally, add in global references
		result.refs = [];
		$object.each(this._mainRefs, (_key, value) => {
			if (value.length) {
				value.forEach((item) => {
					result.refs.push(item);
				});
			}
		});

		// Cleanup
		if (this.get("removeEmptyObjects")) {
			this._pruneEmptyObjects(result);
		}

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
				if (!this._isLegend(child)) {
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
		// Collect serializable custom children
		source.children.each((child: Sprite) => {
			this._lists.elements[child.uid] = child;
			if (child.hasTag("serialize") || this._isLegend(child)) {
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

				// Additional processing for Legend
				if (child.isType<Legend>("Legend")) {
					// Do not let serializer serialize legend's data
					// It can contain big objects like Series, we'll build the data array
					// ourselves
					this._disableDataSerialization = true;
					childItem = this.serialize(child, 0, false);
					this._maybeInit(childItem, "properties", {});
					childItem.properties.data = [];
					child.data.values.forEach((item: any, index: number) => {
						if (item instanceof DataItem) {
							const series = item.component;
							childItem.properties.data[index] = "#" + this._getInternalRef(series.uid) + ".dataItems." + index;
						}
						else if ((item as Entity).isType<Series>("Series")) {
							childItem.properties.data[index] = "#" + this._getInternalRef(item.uid);
						}
						else {
							childItem.properties.data[index] = item;
						}
					});
					this._disableDataSerialization = false;

					// Populate templates
					this._populateTemplates(child, childItem.properties, [
						"labels", "valueLabels", "markers", "markerRectangles", "itemContainers"
					]);
				}
				else {
					childItem = this.serialize(child, 0, true);
				}

				childItem.index = child.parent!.children.indexOf(child);
				result.children.push(childItem);
			}
		});
	}

	private _processSeries(series: Series, result: any): string {
		const datahash = this._hashObject(series.data.values);
		let dataId: any = this._getInternalRef(datahash);
		const seriesId = this._getId("series");
		this._lists.series[seriesId] = result;

		this._saveInternalRef(series.uid, seriesId);
		if (dataId === undefined) {
			dataId = this._getId("data");
			this._lists.data[dataId] = this.serialize(series.data.values, 0, true, true);
			this._saveInternalRef(datahash, dataId);
			//_datas[dataId] = this._lists.data[dataId];
			this._saveRefId("data", dataId, this._lists.data[dataId]);
		}
		this._maybeInit(this._lists.series[seriesId], "properties", {});
		this._lists.series[seriesId].properties.data = "#" + dataId;

		// Populate templates
		this._populateTemplates(series, this._lists.series[seriesId].properties, [
			// XY
			"strokes", "fills", "columns",
			// Percent
			"slices", "labels", "ticks", "links",
			// Hierarchy
			"nodes", "circles", "outerCircles",
			// Map
			"mapPolygons", "mapLines"
		]);

		// Handle bullets
		series.bullets.each((bulletFunction: any) => {
			this._maybeInit(this._lists.series[seriesId].properties, "bullets", []);
			const sampleDataItem = series.dataItems.length ? series.dataItems[0] : new DataItem(series, {}, {});
			const bullet = bulletFunction(series.root, series, sampleDataItem);
			const serializedBullet: any = this.serialize(bullet, 0, true);
			const bulletSprite = bullet.get("sprite");
			if (bulletSprite) {
				// Serialize the sprite (including children)
				serializedBullet.settings.sprite = this._serializeEntity(bullet.get("sprite"));
				this._lists.series[seriesId].properties.bullets.push(serializedBullet);

				// Look for templates
				this._processTemplate(bullet.get("sprite"), serializedBullet.settings.sprite);
			}

		});

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

		this._saveRefId("series", seriesId, this._lists.series[seriesId]);
		this._processCustomChildren(series, this._lists.series[seriesId]);

		return seriesId;
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
		this._maybeInit(result, "properties", {});
		this._maybeInit(result.properties, "series", []);
		result.properties.series = _series;

		// Custom children
		this._processCustomChildren(source, result);
	}

	private _processXYChart(source: XYChart, result: any) {

		this._maybeInit(result.properties, "xAxes", []);
		this._maybeInit(result.properties, "yAxes", []);

		// Add axes
		["x", "y"].forEach((axisType: string) => {
			(source as any)[axisType + "Axes"].each((axis: Axis<any>, _index: number) => {
				const axisId = this._processAxis(axis, null);
				result.properties[axisType + "Axes"].push("#" + axisId);
			});

		});

		// Populate series with axe references
		source.series.each((series: any, _index: number) => {
			const id = this._getInternalRef(series.uid);
			this._lists.series[id].settings.xAxis = "#" + this._getInternalRef(series.get("xAxis").uid);
			this._lists.series[id].settings.yAxis = "#" + this._getInternalRef(series.get("yAxis").uid);
			this._lists.series[id].settings.baseAxis = "#" + this._getInternalRef(series.get("baseAxis").uid);
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
					const serializedRange: any = {
						axis: "#" + axisId,
						series: "#" + seriesId,
						settings: this.serialize(range.axisDataItem._settings, 0, true),
						__parseLogic: "axisRange"
					};
					["fills", "strokes", "graphics"].forEach((key: string) => {
						const value = (range as any)[key];
						if (value && value instanceof ListTemplate) {
							serializedRange[key] = this.serialize(value.template._settings, 0, true);
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
		if (cursor) {
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
		result.properties.zoomOutButton = this.serialize(source.zoomOutButton, 0, false);
		this._stripType(result.properties.zoomOutButton);
		this._stripKeys(result.properties.zoomOutButton.settings, ["background", "icon"])

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
			"labels", "grid", "minorGrid", "ticks"
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
				const serializedRange: any = {
					axis: "#" + axisId,
					settings: this.serialize(range._settings, 0, true),
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
				this._lists.data[dataid] = this.serialize(axis.data.values, 0, true, true);
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
			let serializedData = this._getRef("data", serializedSeries.properties.data.substr(1))
			$array.keepIf(serializedData, (item: any) => !item.madeFromGeoData);
			$array.map(serializedData, (item: any) => {
				if (item.geometry) {
					//delete item.geometry;
				}
			});
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
		if (result.settings.zoomControl && result.settings.zoomControl.settings.target) {
			delete result.settings.zoomControl.settings.target;
			this._maybeInit(result.settings.zoomControl, "properties", {});
			["homeButton", "minusButton", "plusButton"].forEach((button) => {
				result.settings.zoomControl.properties[button] = {
					settings: {
						visible: (source.get("zoomControl") as any)[button].get("visible")
					}
				}
			});
		}

		// Handle projection setting
		const projection = source.get("projection")
		if (projection && this.get("includeProjection", false)) {
			// @TODO: use references for functions instead
			//result.settings.projection = "#" + this._saveFunction(projection);
			const asString = this.get("functionsAs", "string") == "string";
			if (asString) {
				result.settings.projection = projection.toString();
			}
			else {
				result.settings.projection = projection;
			}
		}
	}

	private _processGantt(source: Gantt, result: any) {

		this._notSupported(source, result);

		/*
		// Process series and axis data
		this._maybeInit(result, "properties", {});

		// Process series
		this._disableDataSerialization = true;
		const serializedSeries = this.serialize(source.series, 0, true);
		this._stripType(serializedSeries);
		result.properties.series = "#" + this._processSeries(source.series, serializedSeries);

		// Process category axis
		const serializedYAxis = this.serialize(source.yAxis, 0, true);
		this._stripType(serializedYAxis);
		const yAxisId = this._processAxis(source.yAxis, serializedYAxis, true);
		result.properties.yAxis = "#" + yAxisId;
*/
	}

	private _processStockChart(source: StockChart, result: any) {
		this._notSupported(source, result);
	}

	private _processHierarchy(source: Hierarchy, result: any) {
		const selectedDataItem = source.get("selectedDataItem");
		if (selectedDataItem) {
			const index = source.dataItems.indexOf(selectedDataItem);
			result.settings.selectedDataItem = "@series.dataItems." + index;
		}
	}

	private _populateTemplates(source: any, result: any, templateKeys: Array<any>): void {
		templateKeys.forEach((key: string) => {
			if (source[key]) {
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

	private _stripKeys(source: any, keys: Array<string>): void {
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

	private _isLegend(source: Entity): boolean {
		return source.isType<Legend>("Legend") || source.isType<HeatLegend>("HeatLegend");
	}

	private _notSupported(_source: Entity, result: any) {
		throw new Error("Unsupported type for serialization: " + result.type);
	}

}
