import type { MapChart } from "./MapChart";
import type { GeoProjection, GeoPath } from "d3-geo";
import type { DataItem } from "../../core/render/Component";
import type { Sprite } from "../../core/render/Sprite";

import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "../../core/render/Series";

import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";

export interface IMapSeriesDataItem extends ISeriesDataItem {
	geometry?: GeoJSON.Geometry;
	geometryType?: GeoJSON.GeoJsonGeometryTypes;
	value?: number;
}

export interface IMapSeriesSettings extends ISeriesSettings {

	/**
	 * Counts the series' geometries when the chart fits the map to its area.
	 * Turn it off for a background series, so the map fits the rest. Point,
	 * line and sankey series have it off by default. When it is on, adding or
	 * removing data fits the map again, so keep it off for data that changes
	 * often.
	 *
	 * @default true
	 * @since 5.2.36
	 */
	affectsBounds?: boolean;

	/**
	 * Map data in GeoJSON format.
	 */
	geoJSON?: GeoJSON.GeoJSON;

	/**
	 * Ids of the geodata objects to show; the others are hidden.
	 */
	include?: Array<string>;

	/**
	 * Ids of the geodata objects to hide.
	 */
	exclude?: Array<string>;

	/**
	 * Field in `data` that holds each map object's numeric value, for use in
	 * tooltips, heat rules and such.
	 */
	valueField?: string;

	/**
	 * @ignore
	 */
	geometryField?: string;

	/**
	 * @ignore
	 */
	geometryTypeField?: string;

	/**
	 * Names, keyed by id, to replace the names in the geodata with, such as
	 * translated country names. Read when the series parses `geoJSON`.
	 *
	 * ```TypeScript
	 * import am5geodata_lang_ES from "@amcharts/amcharts5-geodata/lang/ES";
	 * // ...
	 * const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
	 *   geoJSON: am5geodata_worldLow,
	 *   geodataNames: am5geodata_lang_ES
	 * }));
	 * ```
	 * ```JavaScript
	 * var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
	 *   geoJSON: am5geodata_worldLow,
	 *   geodataNames: am5geodata_lang_ES
	 * }));
	 * ```
	 *
	 * @since 5.1.13
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-translations/} for more info
	 */
	geodataNames?: { [index: string]: string };

}

export interface IMapSeriesPrivate extends ISeriesPrivate {
}

export interface IMapSeriesEvents extends ISeriesEvents {

	/**
	 * The series finished turning its `geoJSON` into data items.
	 */
	geodataprocessed: {};

}

/**
 * Base class for map series.
 */
export abstract class MapSeries extends Series {
	public static className: string = "MapSeries";
	public static classNames: Array<string> = Series.classNames.concat([MapSeries.className]);

	declare public chart: MapChart | undefined;
	declare public _settings: IMapSeriesSettings;
	declare public _privateSettings: IMapSeriesPrivate;
	declare public _dataItemSettings: IMapSeriesDataItem;
	declare public _events: IMapSeriesEvents;

	protected _types: Array<GeoJSON.GeoJsonGeometryTypes> = [];

	public _geometries: Array<GeoJSON.Geometry> = [];
	// where each geometry is in `_geometries`: it is added once, and removed without a search
	protected _geometryIndex: Map<GeoJSON.Geometry, number> = new Map();
	protected _geoJSONparsed: boolean = false;

	protected _excluded: Array<DataItem<IMapSeriesDataItem>> = [];
	protected _notIncluded: Array<DataItem<IMapSeriesDataItem>> = [];

	protected _afterNew() {
		this.fields.push("geometry", "geometryType");
		this._setRawDefault("geometryField", "geometry");
		this._setRawDefault("geometryTypeField", "geometryType");
		this._setRawDefault("idField", "id");

		this.on("geoJSON", (geoJSON) => {
			let previous = this._prevSettings.geoJSON;
			if (previous && previous != geoJSON) {
				this.data.clear();
			}
		})

		this.on("affectsBounds", () => {
			if (this.chart) {
				this.chart.markDirtyGeometries();
			}
		})

		super._afterNew();
	}

	protected _handleDirties() {
		const geoJSON = this.get("geoJSON");
		let previous = this._prevSettings.geoJSON;

		if (previous && previous != geoJSON) {
			this._prevSettings.geoJSON = undefined;
			this._geoJSONparsed = false;
		}

		// parsed only once there is a geoJSON, so one set later is not skipped
		if (!this._geoJSONparsed && geoJSON) {
			this._parseGeoJSON();
			this._geoJSONparsed = true;
		}
	}

	public _prepareChildren() {
		// the data items made from the geoJSON exist before the values are aggregated
		if (this.get("geoJSON") && (this._valuesDirty || this.isDirty("geoJSON"))) {
			this._handleDirties();
		}

		super._prepareChildren();

		if (this._valuesDirty) {
			this._handleDirties();
		}

		if (this.get("geoJSON") && (this.isDirty("geoJSON") || this.isDirty("include") || this.isDirty("exclude"))) {

			this._handleDirties();

			const chart = this.chart;

			const exclude = this.get("exclude");
			const include = this.get("include");
			// an item comes back only if the other setting doesn't leave it out too
			const excluded = (dataItem: DataItem<this["_dataItemSettings"]>) => {
				const id = dataItem.get("id");
				return !!exclude && id != null && exclude.indexOf(id) != -1;
			};
			const notIncluded = (dataItem: DataItem<this["_dataItemSettings"]>) => {
				const id = dataItem.get("id");
				return !!include && !!id && include.indexOf(id) == -1;
			};

			if (exclude) {
				if (chart) {
					chart._centerLocation = null;
				}
				$array.each(exclude, (id) => {
					const dataItem = this.getDataItemById(id);
					if (dataItem) {
						this._excludeDataItem(dataItem)
					}
				})

				$array.each(this._excluded, (dataItem) => {
					const id = dataItem.get("id");
					if (id) {
						if (exclude.indexOf(id) == -1 && !notIncluded(dataItem)) {
							this._unexcludeDataItem(dataItem)
						}
					}
				})
			}


			if (!exclude || exclude.length == 0) {
				$array.each(this._excluded, (dataItem) => {
					if (!notIncluded(dataItem)) {
						this._unexcludeDataItem(dataItem)
					}
				})
				this._excluded = [];
			}

			if (include) {
				if (chart) {
					chart._centerLocation = null;
				}
				$array.each(this.dataItems, (dataItem) => {
					const id = dataItem.get("id");
					if (id && include.indexOf(id) == -1) {
						this._notIncludeDataItem(dataItem);
					}
					else if (!excluded(dataItem)) {
						this._unNotIncludeDataItem(dataItem);
					}
				})
			}

			if (!include) {
				$array.each(this._notIncluded, (dataItem) => {
					if (!excluded(dataItem)) {
						this._unNotIncludeDataItem(dataItem);
					}
				})
				this._notIncluded = [];
			}

		}
	}

	protected _excludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		this._removeGeometry(dataItem.get("geometry"));
		$array.move(this._excluded, dataItem);
	}

	protected _unexcludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		this._addGeometry(dataItem.get("geometry"), this);
	}

	protected _notIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		this._removeGeometry(dataItem.get("geometry"));
		$array.move(this._notIncluded, dataItem);
	}

	protected _unNotIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		this._addGeometry(dataItem.get("geometry"), this);
	}

	// Hides a map object left out by `include` or `exclude`, and keeps it out of
	// keyboard navigation and screen readers
	protected _setExcluded(sprite: Sprite, excluded: boolean) {
		sprite.setPrivate("visible", !excluded);
		sprite.setPrivate("focusExcluded", excluded);
	}

	protected checkInclude(id: string, includes: string[] | undefined, excludes?: string[] | undefined): boolean {
		if (includes) {
			if (includes.length == 0) {
				return false;
			}
			else {
				if (includes.indexOf(id) == -1) {
					return false;
				}
			}
		}

		if (excludes && excludes.length > 0) {
			if (excludes.indexOf(id) != -1) {
				return false;
			}
		}
		return true;
	}

	protected _parseGeoJSON() {

		const geoJSON = this.get("geoJSON");
		if (geoJSON) {

			let features!: any[];

			if (geoJSON.type == "FeatureCollection") {
				features = geoJSON.features;
			}
			else if (geoJSON.type == "Feature") {
				features = [geoJSON];
			}
			else if (["Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon"].indexOf(geoJSON.type) != -1) {
				features = [{ geometry: geoJSON }];
			}
			else {
				console.log("nothing found in geoJSON");
			}

			const geodataNames = this.get("geodataNames");
			if (features) {

				const idField = this.get("idField", "id");

				for (let i = 0, len = features.length; i < len; i++) {
					let feature: any = features[i];
					let geometry: any = feature.geometry;

					if (geometry) {
						let type = geometry.type;
						let id: string = feature[idField];

						// GeoJSON allows `"properties": null`
						const properties: any = feature.properties || {};

						if (geodataNames && geodataNames[id]) {
							properties.name = geodataNames[id];
						}

						if (this._types.indexOf(type) != -1) {
							//if (!this.checkInclude(id, this.get("include"), this.get("exclude"))) {
							//	continue;
							//}

							let dataItem: any;

							if (id != null) {
								// find data object in user-provided data
								dataItem = $array.find(this.dataItems, (value: any) => {
									return value.get("id") == id;
								})
							}

							let dataObject: any;

							if (dataItem) {
								dataObject = dataItem.dataContext;
							}

							// create one if not found
							if (!dataItem) {
								dataObject = { geometry: geometry, geometryType: type, madeFromGeoData: true };
								dataObject[idField] = id;
								// before the push, so fields like `valueField` are read from them
								$object.softCopyProperties(properties, dataObject);
								this.data.push(dataObject);
							}
							// in case found
							else {
								// if user-provided object doesn't have points data provided in any way:
								if (!dataObject.geometry) {
									dataObject.geometry = geometry;
									dataObject.geometryType = type;
									dataItem.set("geometry", geometry);
									dataItem.set("geometryType", type);
									this.processDataItem(dataItem);
								}
							}

							// copy properties data to datacontext
							$object.softCopyProperties(properties, dataObject);
						}
					}
				}
			}

			const type = "geodataprocessed";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, { type: type, target: this });
			}
		}
	}

	/**
	 * @ignore
	 */
	public abstract markDirtyProjection(): void

	public _placeBulletsContainer(_chart: MapChart) {
		this.children.moveValue(this.bulletsContainer);
	}

	public _removeBulletsContainer() {

	}

	/**
	 * @ignore
	 */
	public projection(): GeoProjection | undefined {
		const chart = this.chart;
		if (chart) {
			return chart.get("projection");
		}
	}

	/**
	 * @ignore
	 */
	public geoPath(): GeoPath | undefined {
		const chart = this.chart;
		if (chart) {
			return chart.getPrivate("geoPath");
		}
	}

	// kept whatever `affectsBounds` is: the chart counts them only while it is on
	protected _addGeometry(geometry: any, _series: MapSeries) {
		if (geometry && !this._geometryIndex.has(geometry)) {
			this._geometryIndex.set(geometry, this._geometries.length);
			this._geometries.push(geometry);

			const chart = this.chart;
			if (chart) {
				chart.markDirtyGeometries();
			}
		}
	}

	protected _removeGeometry(geometry: any): boolean {
		const index = geometry ? this._geometryIndex.get(geometry) : undefined;
		if (index === undefined) {
			return false;
		}
		// the last one takes its place: the order doesn't count
		const geometries = this._geometries;
		const last = geometries.pop()!;
		if (last !== geometry) {
			geometries[index] = last;
			this._geometryIndex.set(last, index);
		}
		this._geometryIndex.delete(geometry);

		const chart = this.chart;
		if (chart) {
			chart.markDirtyGeometries();
		}
		return true;
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		this._removeGeometry(dataItem.get("geometry"));
	}

	protected _dispose() {
		super._dispose();

		const chart = this.chart;
		if (chart) {
			chart.series.removeValue(this);
		}
	}

	/**
	 * @ignore
	 */
	public _onGoHome() {
	}

	protected _onDataClear() {
		super._onDataClear();
		this._geoJSONparsed = false;
		this._markDirtyKey("exclude");
	}
}
