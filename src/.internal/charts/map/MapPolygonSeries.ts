import type { DataItem } from "../../core/render/Component";

import { MapSeries, IMapSeriesSettings, IMapSeriesDataItem, IMapSeriesPrivate } from "./MapSeries";
import { MapPolygon } from "./MapPolygon";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";

import * as $array from "../../core/util/Array";
import * as $mapUtils from "./MapUtils";
import type { Animation } from "../../core/util/Entity";

export interface IMapPolygonSeriesPrivate extends IMapSeriesPrivate {
}

export interface IMapPolygonSeriesDataItem extends IMapSeriesDataItem {

	/**
	 * Related [[MapPolygon]] object.
	 */
	mapPolygon: MapPolygon;

	/**
	 * GeoJSON geometry of the polygon.
	 */
	geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface IMapPolygonSeriesSettings extends IMapSeriesSettings {
	/**
	 * @todo review
	 * @default false
	 */
	reverseGeodata?: boolean;
}

/**
 * Creates a map series for displaying polygons.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/} for more info
 * @important
 */
export class MapPolygonSeries extends MapSeries {

	/**
	 * @ignore
	 */
	public makeMapPolygon(dataItem: DataItem<this["_dataItemSettings"]>): MapPolygon {
		const mapPolygon = this.children.push(this.mapPolygons.make());
		mapPolygon._setDataItem(dataItem);
		this.mapPolygons.push(mapPolygon);
		return mapPolygon;
	}

	/**
	 * A [[ListTemplate]] of all polygons in series.
	 *
	 * `mapPolygons.template` can also be used to configure polygons.
	 *
	 * @default new ListTemplate<MapPolygon>
	 */
	public readonly mapPolygons: ListTemplate<MapPolygon> = new ListTemplate(
		Template.new({}),
		() => MapPolygon._new(this._root, {}, [this.mapPolygons.template])
	);

	public static className: string = "MapPolygonSeries";
	public static classNames: Array<string> = MapSeries.classNames.concat([MapPolygonSeries.className]);

	declare public _settings: IMapPolygonSeriesSettings;
	declare public _privateSettings: IMapPolygonSeriesPrivate;
	declare public _dataItemSettings: IMapPolygonSeriesDataItem;

	protected _types: Array<GeoJSON.GeoJsonGeometryTypes> = ["Polygon", "MultiPolygon"];

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		$array.each(this.dataItems, (dataItem) => {
			let mapPolygon = dataItem.get("mapPolygon");
			if (mapPolygon) {
				mapPolygon.markDirtyProjection();
			}
		})
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("fill")) {
			this.mapPolygons.template.set("fill", this.get("fill"));
		}
		if (this.isDirty("stroke")) {
			this.mapPolygons.template.set("stroke", this.get("stroke"));
		}
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		let mapPolygon = dataItem.get("mapPolygon");
		if (!mapPolygon) {
			mapPolygon = this.makeMapPolygon(dataItem);
		}

		dataItem.set("mapPolygon", mapPolygon);
		let geometry = dataItem.get("geometry")!;

		if (geometry) {
			if (this.get("reverseGeodata")) {
				const coordinates = geometry.coordinates;
				if (coordinates) {
					for (let x = 0; x < geometry.coordinates.length; x++) {
						if (geometry.type == "MultiPolygon") {
							for (let y = 0; y < geometry.coordinates[x].length; y++) {
								geometry.coordinates[x][y].reverse()
							}
						}
						else {
							geometry.coordinates[x].reverse()
						}
					}
				}
			}
			mapPolygon.set("geometry", geometry);
		}

		mapPolygon.series = this;

		this._addGeometry(dataItem.get("geometry"), this);
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			this.mapPolygons.removeValue(mapPolygon);
			mapPolygon.dispose();
		}
		this._removeGeometry(dataItem.get("geometry"));
	}

	/**
	 * @ignore
	 */
	protected _excludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._excludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			mapPolygon.setPrivate("visible", false);
		}
	}

	/**
	 * @ignore
	 */
	protected _unexcludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unexcludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			mapPolygon.setPrivate("visible", true);
		}
	}

	/**
	 * @ignore
	 */
	protected _notIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._notIncludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			mapPolygon.setPrivate("visible", false);
		}
	}

	/**
	 * @ignore
	 */
	protected _unNotIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unNotIncludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			mapPolygon.setPrivate("visible", true);
		}
	}

	/**
	 * Forces a repaint of the element which relies on data.
	 *
	 * @since 5.0.21
	 */
	public markDirtyValues(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.markDirtyValues();
		if (dataItem) {
			const mapPolygon = dataItem.get("mapPolygon");
			if (mapPolygon) {
				mapPolygon.set("geometry", dataItem.get("geometry"));
			}
		}
	}

	/**
	 * Centers and zooms in on the specific polygon.
	 *
	 * @param  dataItem  Target data item
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Zooming_to_clicked_object} for more info
	 */
	public zoomToDataItem(dataItem: DataItem<IMapPolygonSeriesDataItem>): Animation<any> | undefined {
		const polygon = dataItem.get("mapPolygon");
		if (polygon) {
			const geometry = polygon.get("geometry");
			const chart = this.chart;
			if (geometry && chart) {
				return chart.zoomToGeoBounds($mapUtils.getGeoBounds(geometry));
			}
		}
	}
}
