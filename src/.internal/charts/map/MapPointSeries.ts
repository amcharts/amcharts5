import type { IMapLineSeriesDataItem, MapLineSeries } from "./MapLineSeries";
import type { IMapPolygonSeriesDataItem, MapPolygonSeries } from "./MapPolygonSeries";
import type { Bullet } from "../../core/render/Bullet";
import type { DataItem } from "../../core/render/Component";
import type { MapLine } from "./MapLine";
import type { MapPolygon } from "./MapPolygon";

import { MapSeries, IMapSeriesSettings, IMapSeriesDataItem, IMapSeriesPrivate } from "./MapSeries";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $math from "../../core/util/Math";
import type { Animation } from "../../core/util/Entity";

export interface IMapPointSeriesPrivate extends IMapSeriesPrivate {
}

export interface IMapPointSeriesDataItem extends IMapSeriesDataItem {

	/**
	 * GeoJSON geometry of the point.
	 */
	geometry?: GeoJSON.Point | GeoJSON.MultiPoint;

	/**
	 * Longitude.
	 */
	longitude?: number;

	/**
	 * Latitude.
	 */
	latitude?: number;

	/**
	 * Relative position (0-1) on the [[MapLine]] to place point on.
	 */
	positionOnLine?: number;

	/**
	 * Automatically rotate the point bullet to face the direction of the line
	 * it is attached to.
	 */
	autoRotate?: boolean;

	/**
	 * The angle will be added to the automatically-calculated angle.
	 *
	 * Can be used to reverse the direction.
	 */
	autoRotateAngle?: number;

	/**
	 * A data item from a [[MapLineSeries]] the point is attached to.
	 */
	lineDataItem?: DataItem<IMapLineSeriesDataItem>;

	/**
	 * An ID of a [[MapLine]] the point is attached to.
	 */
	lineId?: string;

	/**
	 * A data item from a [[MapPolygonSeries]] to use for positioning of the
	 * point.
	 */
	polygonDataItem?: DataItem<IMapPolygonSeriesDataItem>;

	/**
	 * An ID of the [[MapPolygon]] to use for centering the point.
	 */
	polygonId?: string;
}

export interface IMapPointSeriesSettings extends IMapSeriesSettings {

	/**
	 * A field in data that holds an ID of the related polygon.
	 *
	 * If set, the point will be positioned in the visual center of the target
	 * polygon.
	 */
	polygonIdField?: string;

	/**
	 * If set to `true` will hide all points that are in the visible range of
	 * the map.
	 */
	clipFront?: boolean;

	/**
	 * If set to `true` will hide all points that are in the invisible range of
	 * the map.
	 *
	 * For example on the side of the globe facing away from the viewer when
	 * used with Orthographic projection.
	 *
	 * NOTE: not all projections have invisible side.
	 *
	 * @default true
	 */
	clipBack?: boolean;

	/**
	 * A field in data that holds point's longitude.
	 */
	latitudeField?: string;

	/**
	 * A field in data that holds point's longitude.
	 */
	longitudeField?: string;


	/**
	 * @todo review
	 * @default false
	 */
	autoScale?:boolean
};

/**
 * Creates a map series for displaying markers on the map.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-point-series/} for more info
 * @important
 */
export class MapPointSeries extends MapSeries {

	public static className: string = "MapPointSeries";
	public static classNames: Array<string> = MapSeries.classNames.concat([MapPointSeries.className]);

	declare public _settings: IMapPointSeriesSettings;
	declare public _privateSettings: IMapPointSeriesPrivate;
	declare public _dataItemSettings: IMapPointSeriesDataItem;

	protected _types: Array<GeoJSON.GeoJsonGeometryTypes> = ["Point", "MultiPoint"];

	protected _afterNew() {
		this.fields.push("polygonId", "lineId", "longitude", "latitude");
		super._afterNew();
	}

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		this.markDirty();
	}

	/**
	 * Forces a repaint of the element which relies on data.
	 *
	 * @since 5.0.21
	 */
	public markDirtyValues(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.markDirtyValues();

		if (dataItem) {
			this._positionBullets(dataItem);
		}
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);
		const geometry = dataItem.get("geometry");
		if (!geometry) {
			dataItem.set("geometry", { type: "Point", coordinates: [dataItem.get("longitude", 0), dataItem.get("latitude", 0)] });
		}
		else {
			if (geometry.type == "Point") {
				const coordinates = geometry.coordinates;
				if (coordinates) {
					dataItem.set("longitude", coordinates[0]);
					dataItem.set("latitude", coordinates[1]);
				}
			}
			else if (geometry.type == "MultiPoint") {
				const coordinates = geometry.coordinates;
				if (coordinates && coordinates[0]) {
					dataItem.set("longitude", coordinates[0][0]);
					dataItem.set("latitude", coordinates[0][1]);
				}
			}
		}
	}

	protected _makeBullets(dataItem: DataItem<this["_dataItemSettings"]>) {
		dataItem.bullets = [];

		this.bullets.each((bulletFunction) => {
			const geometry = dataItem.get("geometry");

			if (geometry) {
				if (geometry.type == "Point") {
					this._makeBullet(dataItem, bulletFunction);
				}
				else if (geometry.type = "MultiPoint") {
					let i = 0;
					$array.each(geometry.coordinates, () => {
						this._makeBullet(dataItem, bulletFunction, i);
						i++;
					})
				}
			}
		})
	}

	public _positionBullet(bullet: Bullet) {
		const sprite = bullet.get("sprite");
		if (sprite) {
			const dataItem = sprite.dataItem as DataItem<this["_dataItemSettings"]>;

			const latitude = dataItem.get("latitude");
			const longitude = dataItem.get("longitude");
			const lineDataItem = dataItem.get("lineDataItem");
			const chart = this.chart;
			let line: MapLine | undefined;
			if (lineDataItem) {
				line = lineDataItem.get("mapLine");
			}
			else {
				const lineId = dataItem.get("lineId");

				if (lineId && chart) {
					chart.series.each((series) => {
						if (series.isType<MapLineSeries>("MapLineSeries")) {
							let lineDI = series.getDataItemById(lineId);
							if (lineDI) {
								dataItem.set("lineDataItem", lineDI);
								line = lineDI.get("mapLine");
							}
						}
					})
				}
			}


			const polygonDataItem = dataItem.get("polygonDataItem");
			let polygon: MapPolygon | undefined;
			if (polygonDataItem) {
				polygon = polygonDataItem.get("mapPolygon");
			}
			else {
				const polygonId = dataItem.get("polygonId");

				if (polygonId && chart) {
					chart.series.each((series) => {
						if (series.isType<MapPolygonSeries>("MapPolygonSeries")) {
							let polygonDI = series.getDataItemById(polygonId);
							if (polygonDI) {
								dataItem.set("polygonDataItem", polygonDI);
								polygon = polygonDI.get("mapPolygon");
							}
						}
					})
				}
			}

			const positionOnLine = dataItem.get("positionOnLine");
			let coordinates: [number, number] | undefined;

			let angle: number | undefined;

			if (polygon) {
				let geoPoint = polygon.visualCentroid();
				coordinates = [geoPoint.longitude, geoPoint.latitude];
			}
			else if (line && $type.isNumber(positionOnLine)) {
				let geoPoint = line.positionToGeoPoint(positionOnLine);
				coordinates = [geoPoint.longitude, geoPoint.latitude];

				if (dataItem.get("autoRotate", bullet.get("autoRotate")) && chart) {
					const geoPoint0 = line.positionToGeoPoint(positionOnLine - 0.002);
					const geoPoint1 = line.positionToGeoPoint(positionOnLine + 0.002);

					const point0 = chart.convert(geoPoint0);
					const point1 = chart.convert(geoPoint1);

					//dataItem.set("autoRotateAngle", $math.getAngle(point0, point1));
					angle = $math.getAngle(point0, point1);
				}
			}
			else if ($type.isNumber(longitude) && $type.isNumber(latitude)) {
				coordinates = [longitude, latitude];
			}
			else {
				const geometry = dataItem.get("geometry")!;
				if (geometry) {
					if (geometry.type == "Point") {
						this._positionBulletReal(bullet, geometry, geometry.coordinates as [number, number], angle);
					}
					else if (geometry.type == "MultiPoint") {
						let index = bullet._index || 0;
						coordinates = geometry.coordinates[index] as [number, number];
					}
				}
			}

			if (coordinates) {
				this._positionBulletReal(bullet, { type: "Point", coordinates: coordinates }, coordinates, angle);
			}
		}
	}

	protected _positionBulletReal(bullet: Bullet, geometry: GeoJSON.Geometry, coordinates: [number, number], angle?: number) {
		const sprite = bullet.get("sprite");
		const chart = this.chart;
		if (chart) {
			const projection = chart.get("projection")!;
			const geoPath = chart.getPrivate("geoPath");
			const dataItem: DataItem<IMapPointSeriesDataItem> = sprite.dataItem as DataItem<IMapPointSeriesDataItem>;

			const xy = projection(coordinates as any);

			if (xy) {
				sprite.setAll({ x: xy[0], y: xy[1] });
			}

			let visible = true;
			if (geoPath(geometry)) {
				if (this.get("clipFront")) {
					visible = false;
				}
			}
			else {
				if (this.get("clipBack")) {
					visible = false;
				}
			}
			sprite.setPrivate("visible", visible);

			if (dataItem && angle != null && dataItem.get("autoRotate", bullet.get("autoRotate"))) {
				sprite.set("rotation", angle + dataItem.get("autoRotateAngle", bullet.get("autoRotateAngle", 0)));
			}
		}
	}

	/**
	 * Centers the map to specific series' data item and zooms to the level
	 * specified in the parameters.
	 *
	 * @param  dataItem   Map point
	 * @param  zoomLevel  Zoom level
	 */
	public zoomToDataItem(dataItem: DataItem<IMapPointSeriesDataItem>, zoomLevel: number): Animation<any> | undefined {
		const chart = this.chart;
		if (chart) {
			return chart.zoomToGeoPoint({ longitude: dataItem.get("longitude", 0), latitude: dataItem.get("latitude", 0) }, zoomLevel, true);
		}
	}

}
