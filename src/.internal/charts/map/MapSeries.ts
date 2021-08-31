import type { MapChart } from "./MapChart";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "../../core/render/Series";
import * as $array from "../../core/util/Array";
import * as $object from "../../core/util/Object";
import type { GeoProjection, GeoPath } from "d3-geo";

export interface IMapSeriesDataItem extends ISeriesDataItem {
	geometry?: GeoJSON.Geometry;
	geometryType?: GeoJSON.GeoJsonGeometryTypes;
	value?: number;
}

export interface IMapSeriesSettings extends ISeriesSettings {

	/**
	 * Map data in GeoJSON format.
	 */
	geoJSON?: GeoJSON.GeoJSON;

	/**
	 * An array of map object ids from geodata to include in the map.
	 *
	 * If set, only those objects listed in `include` will be shown.
	 */
	include?: Array<string>;

	/**
	 * An array of map object ids from geodata to omit when showing the map.
	 */
	exclude?: Array<string>;

	/**
	 * A field in series `data` that will hold map object's numeric value.
	 *
	 * It can be used in a number of places, e.g. tooltips, heat rules, etc.
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
}

export interface IMapSeriesPrivate extends ISeriesPrivate {
}

export interface IMapSeriesEvents extends ISeriesEvents {

	/**
	 * Invoked when geodata is finished loading and processed.
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
	protected _geoJSONparsed: boolean = false;

	protected _afterNew() {
		this.fields.push("geometry", "geometryType");
		this._setRawDefault("geometryField", "geometry");
		this._setRawDefault("geometryTypeField", "geometryType");
		this._setRawDefault("idField", "id");

		super._afterNew();
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this._valuesDirty || this.isDirty("geoJSON") || this.isDirty("include") || this.isDirty("exclude")) {
			if (!this._geoJSONparsed) {
				this._parseGeoJSON();
				this._geoJSONparsed = true;
			}
		}
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

			if (features) {
				for (let i = 0, len = features.length; i < len; i++) {
					let feature: any = features[i];
					let geometry: any = feature.geometry;

					if (geometry) {
						let type = geometry.type;
						let id: string = feature.id;

						// @todo
						//if (this.chart.geodataNames && this.chart.geodataNames[id]) {
						//	feature.properties.name = this.chart.geodataNames[id];
						//}

						if (this._types.indexOf(type) != -1) {
							if (!this.checkInclude(id, this.get("include"), this.get("exclude"))) {
								continue;
							}

							// find data object in user-provided data
							let dataItem: any = $array.find(this.dataItems, (value: any) => {
								return value.get("id") == id;
							})

							let dataObject: any;

							if (dataItem) {
								dataObject = dataItem.dataContext;
							}

							// create one if not found
							if (!dataItem) {
								dataObject = { geometry: geometry, geometryType: type, id: id, madeFromGeoData: true };
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
							$object.softCopyProperties(feature.properties, dataObject);
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

	protected _addGeometry(geometry: any) {
		if (geometry) {
			this._geometries.push(geometry);

			const chart = this.chart;
			if (chart) {
				chart.markDirtyGeometries();
			}
		}
	}
}
