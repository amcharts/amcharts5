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
import type { IPoint } from "../../core/util/IPoint";
import type { Animation } from "../../core/util/Entity";
import type { IDisposer } from "../../core/util/Disposer";
import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { IDeform } from "../../core/render/backend/Renderer";
import { projectAltitude } from "./MapUtils";

export interface IMapPointSeriesPrivate extends IMapSeriesPrivate {
}

export interface IMapPointSeriesDataItem extends IMapSeriesDataItem {

	/**
	 * GeoJSON geometry of the point.
	 */
	geometry?: GeoJSON.Point | GeoJSON.MultiPoint;

	/**
	 * Longitude of the point, in degrees.
	 */
	longitude?: number;

	/**
	 * Latitude of the point, in degrees.
	 */
	latitude?: number;

	/**
	 * Height above the ground, in metres: `400000` is about the height of the
	 * International Space Station. On flat maps the point rises up the screen.
	 *
	 * Read from data only when the series sets `altitudeField`. A point on a
	 * line takes the line's altitude instead.
	 *
	 * @since 5.21.0
	 */
	altitude?: number;

	/**
	 * Where on its line the point sits, from `0` (start) to `1` (end).
	 */
	positionOnLine?: number;

	/**
	 * Turns the bullet to face the way its line runs.
	 */
	autoRotate?: boolean;

	/**
	 * Degrees added to the angle `autoRotate` works out, such as `180` to face
	 * the other way.
	 */
	autoRotateAngle?: number;

	/**
	 * Data item of a line in a [[MapLineSeries]] to place the point on, at
	 * `positionOnLine`.
	 */
	lineDataItem?: DataItem<IMapLineSeriesDataItem>;

	/**
	 * Id of a line, in any [[MapLineSeries]] of the chart, to place the point
	 * on, at `positionOnLine`.
	 */
	lineId?: string;

	/**
	 * Data item of a polygon in a [[MapPolygonSeries]] to place the point at,
	 * in its visual center.
	 */
	polygonDataItem?: DataItem<IMapPolygonSeriesDataItem>;

	/**
	 * Id of a polygon, in any [[MapPolygonSeries]] of the chart, to place the
	 * point at, in its visual center.
	 */
	polygonId?: string;

	/**
	 * Places the point by its bullet's own `x` and `y` instead of its longitude
	 * and latitude, so it stays put as the map moves.
	 *
	 * A [[MapLineSeries]] can't connect fixed points.
	 *
	 * @default false
	 * @since 5.2.34
	 */
	fixed?: boolean;

	/**
	 * Where the point is drawn, in pixels, relative to the map's area. Set by
	 * the series.
	 */
	point?: IPoint;

	/**
	 * @ignore
	 */
	clipped?: boolean;
}

export interface IMapPointSeriesSettings extends IMapSeriesSettings {

	/**
	 * Field in `data` that holds the id of a polygon to place the point at, in
	 * its visual center. Not set by default.
	 */
	polygonIdField?: string;

	/**
	 * Hides the points on the side of the map facing the viewer. With
	 * `clipBack: false`, only the points behind a globe show.
	 *
	 * @default false
	 */
	clipFront?: boolean;

	/**
	 * Hides the points on the far side of a globe. Only projections with a
	 * hidden side, such as `geoOrthographic`, are affected.
	 *
	 * @default true
	 */
	clipBack?: boolean;

	/**
	 * Lays bullets onto the map's surface: each bullet turns, squashes and
	 * stretches with the projection where it is, as if painted on the map.
	 * On a globe they flatten towards the edge; on Mercator they grow towards
	 * the poles.
	 *
	 * @default false
	 * @since 5.21.0
	 */
	surfaceBullets?: boolean;

	/**
	 * Field in `data` that holds the point's latitude.
	 *
	 * @default "latitude"
	 */
	latitudeField?: string;

	/**
	 * Field in `data` that holds the point's longitude.
	 *
	 * @default "longitude"
	 */
	longitudeField?: string;

	/**
	 * Field in `data` that holds whether the point is `fixed`. Not set by
	 * default.
	 */
	fixedField?: string;

	/**
	 * Field in `data` that holds the id of the line the point sits on.
	 *
	 * @default "lineId"
	 * @since 5.20.6
	 */
	lineIdField?: string;

	/**
	 * Field in `data` that holds the point's height above the ground, in
	 * metres.
	 *
	 * Not set by default, so a data column that happens to be called
	 * "altitude" (perhaps in feet, or above sea level) isn't read as heights.
	 *
	 * @since 5.21.0
	 */
	altitudeField?: string;

	/**
	 * Field in `data` that holds where on its line the point sits, from `0`
	 * (start) to `1` (end).
	 *
	 * @default "positionOnLine"
	 * @since 5.20.6
	 */
	positionOnLineField?: string;

	/**
	 * Field in `data` that holds whether the point turns to face the way its
	 * line runs.
	 *
	 * @default "autoRotate"
	 * @since 5.20.6
	 */
	autoRotateField?: string;

	/**
	 * Field in `data` that holds degrees added to the angle `autoRotate` works
	 * out.
	 *
	 * @default "autoRotateAngle"
	 * @since 5.20.6
	 */
	autoRotateAngleField?: string;

	/**
	 * Scales bullets with the map's zoom level, so they grow as the map zooms
	 * in.
	 *
	 * @since 5.2.8
	 * @default false
	 */
	autoScale?: boolean

};

/**
 * A map series of points, shown as bullets. A point sits at a longitude and
 * latitude, in a polygon, or on a line.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-point-series/} for more info
 * @important
 */
export class MapPointSeries extends MapSeries {

	public static className: string = "MapPointSeries";
	public static classNames: Array<string> = MapSeries.classNames.concat([MapPointSeries.className]);

	declare public _settings: IMapPointSeriesSettings;
	declare public _privateSettings: IMapPointSeriesPrivate;
	declare public _dataItemSettings: IMapPointSeriesDataItem;

	protected _types: Array<GeoJSON.GeoJsonGeometryTypes> = ["Point", "MultiPoint"];

	// Where each point last was on its line, and which way it was going
	protected _travel: WeakMap<DataItem<this["_dataItemSettings"]>, { position: number, back: boolean }> = new WeakMap();

	/**
	 * Is the point travelling towards the start of its line? Only while an
	 * `animations` entry of its bullet moves it: a point set in place faces the
	 * way the line runs, and one moved from code is turned by that code, as the
	 * flight demos do.
	 */
	protected _movingBack(dataItem: DataItem<this["_dataItemSettings"]>, position: number, bullet: Bullet): boolean {
		const sprite: any = bullet.get("sprite");
		const declared = sprite && $array.any(sprite._declaredAnimations || [], (item: any) => item.target === dataItem && item.key === "positionOnLine");
		const animating = declared && !!(dataItem as any)._animatingSettings?.positionOnLine;
		const last = this._travel.get(dataItem);
		let back = false;

		if (animating && last) {
			const step = position - last.position;
			// Standing still between two frames, or a loop jumping back to its
			// start, keeps the way it was going
			back = step === 0 || Math.abs(step) > 0.5 ? last.back : step < 0;
		}

		this._travel.set(dataItem, { position, back });
		return back;
	}

	// Each data item on a line follows changes to that line
	protected _lineChangedDps: Map<DataItem<IMapPointSeriesDataItem>, { line: MapLine, dp: IDisposer }> = new Map();

	protected _afterNew() {
		this.fields.push("polygonId", "lineId", "longitude", "latitude", "altitude", "fixed", "positionOnLine", "autoRotate", "autoRotateAngle");
		this._setRawDefault("longitudeField", "longitude");
		this._setRawDefault("latitudeField", "latitude");
		this._setRawDefault("lineIdField", "lineId");
		this._setRawDefault("positionOnLineField", "positionOnLine");
		this._setRawDefault("autoRotateField", "autoRotate");
		this._setRawDefault("autoRotateAngleField", "autoRotateAngle");
		super._afterNew();
	}

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		this.markDirty();
	}

	/**
	 * Redraws the series, and places the bullets of `dataItem` again.
	 *
	 * @param  dataItem  Data item whose bullets to place
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
		let geometry = dataItem.get("geometry");
		if (!geometry) {
			geometry = { type: "Point", coordinates: [dataItem.get("longitude", 0), dataItem.get("latitude", 0)] };
			dataItem.set("geometry", geometry);
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

		this._addGeometry(geometry, this);
	}

	protected _makeBullets(dataItem: DataItem<this["_dataItemSettings"]>) {
		dataItem.bullets = [];

		this.bullets.each((bulletFunction) => {
			const geometry = dataItem.get("geometry");

			if (geometry) {
				if (geometry.type == "Point") {
					this._setBulletParent(this._makeBullet(dataItem, bulletFunction));
				}
				else if (geometry.type == "MultiPoint") {
					let i = 0;
					$array.each(geometry.coordinates, () => {
						this._setBulletParent(this._makeBullet(dataItem, bulletFunction, i));
						i++;
					})
				}
			}
		})
	}

	protected _setBulletParent(bullet?: Bullet) {
		if (bullet) {
			const sprite = bullet.get("sprite");
			const chart = this.chart;
			if (sprite && chart) {
				const dataItem = sprite.dataItem as DataItem<IMapPointSeriesDataItem>;
				if (dataItem) {
					if (dataItem.get("fixed")) {
						if (sprite.parent != chart.bulletsContainer) {
							chart.bulletsContainer.children.moveValue(sprite);
						}
					}
					else {
						if (sprite.parent != this.bulletsContainer) {
							this.bulletsContainer.children.moveValue(sprite);
						}
					}
				}
			}
		}
	}

	public _positionBullet(bullet: Bullet) {
		const sprite = bullet.get("sprite");
		if (sprite) {
			const dataItem = sprite.dataItem as DataItem<this["_dataItemSettings"]>;
			if (dataItem && dataItem.get("fixed")) {
				return;
			}

			const latitude = dataItem.get("latitude");
			const longitude = dataItem.get("longitude");
			const lineDataItem = dataItem.get("lineDataItem");
			const fixed = dataItem.get("fixed");
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

			const watched = this._lineChangedDps.get(dataItem);
			if (watched && watched.line !== line) {
				watched.dp.dispose();
				this._lineChangedDps.delete(dataItem);
			}
			if (line && (!watched || watched.line !== line)) {
				this._lineChangedDps.set(dataItem, {
					line,
					dp: line.events.on("linechanged", () => {
						this._positionBullets(dataItem);
					})
				});
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
			let altitude = dataItem.get("altitude", 0);

			let angle: number | undefined;

			if (polygon) {
				let geoPoint = polygon.visualCentroid();
				coordinates = [geoPoint.longitude, geoPoint.latitude];
				dataItem.setRaw("longitude", geoPoint.longitude);
				dataItem.setRaw("latitude", geoPoint.latitude);
			}
			else if (line && $type.isNumber(positionOnLine)) {
				let geoPoint = line.positionToGeoPoint(positionOnLine);
				coordinates = [geoPoint.longitude, geoPoint.latitude];
				altitude = line.positionToAltitude(positionOnLine);

				if (dataItem.get("autoRotate", bullet.get("autoRotate")) && chart) {
					const geoPoint0 = line.positionToGeoPoint(positionOnLine - 0.002);
					const geoPoint1 = line.positionToGeoPoint(positionOnLine + 0.002);

					// Along the raised line when it is raised
					const point0 = this._raisedPoint(geoPoint0, line.positionToAltitude(positionOnLine - 0.002)) || chart.convert(geoPoint0);
					const point1 = this._raisedPoint(geoPoint1, line.positionToAltitude(positionOnLine + 0.002)) || chart.convert(geoPoint1);

					//dataItem.set("autoRotateAngle", $math.getAngle(point0, point1));
					angle = $math.getAngle(point0, point1);

					// Moving back along the line (an `animations` entry on its way back): face that way
					if (this._movingBack(dataItem, positionOnLine, bullet)) {
						angle += 180;
					}
				}

				dataItem.setRaw("longitude", geoPoint.longitude);
				dataItem.setRaw("latitude", geoPoint.latitude);
			}
			else if ($type.isNumber(longitude) && $type.isNumber(latitude)) {
				coordinates = [longitude, latitude];
			}
			else {
				const geometry = dataItem.get("geometry")!;
				if (geometry) {
					if (geometry.type == "Point") {
						this._positionBulletReal(bullet, geometry, geometry.coordinates as [number, number], angle, altitude);
					}
					else if (geometry.type == "MultiPoint") {
						let index = bullet._index || 0;
						coordinates = geometry.coordinates[index] as [number, number];
					}
				}
			}

			if (!fixed && coordinates) {
				this._positionBulletReal(bullet, { type: "Point", coordinates: coordinates }, coordinates, angle, altitude);
			}
		}
	}

	// Where a point raised above the surface appears; nothing when it is not raised
	protected _raisedPoint(geoPoint: IGeoPoint, altitude: number): IPoint | undefined {
		const chart = this.chart;
		if (chart && altitude) {
			return projectAltitude(chart.get("projection")!, geoPoint.longitude, geoPoint.latitude, altitude);
		}
	}

	protected _positionBulletReal(bullet: Bullet, geometry: GeoJSON.Geometry, coordinates: [number, number], angle?: number, altitude?: number) {
		const sprite = bullet.get("sprite");
		const chart = this.chart;
		if (chart) {
			const projection = chart.get("projection")!;
			const geoPath = chart.getPrivate("geoPath");
			const dataItem: DataItem<IMapPointSeriesDataItem> = sprite.dataItem as DataItem<IMapPointSeriesDataItem>;

			let visible = true;
			if (altitude) {
				// Raised: a far point shows where it rises past the globe's edge
				const raised = projectAltitude(projection, coordinates[0], coordinates[1], altitude);
				if (raised) {
					const point = { x: raised.x, y: raised.y };
					sprite.setAll(point);
					dataItem.setRaw("point", point);
					visible = raised.far ? !(raised.hidden && this.get("clipBack")) : !this.get("clipFront");
				}
				else {
					visible = false;
				}
			}
			else {
				const xy = projection(coordinates as any);

				if (xy) {
					const point = { x: xy[0], y: xy[1] };
					sprite.setAll(point);
					dataItem.setRaw("point", point);
				}

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
			}
			sprite.setPrivate("visible", visible);
			dataItem.set("clipped", !visible);

			if (dataItem && angle != null && dataItem.get("autoRotate", bullet.get("autoRotate"))) {
				sprite.set("rotation", angle + dataItem.get("autoRotateAngle", bullet.get("autoRotateAngle", 0)));
			}

			// Only a changed deform redraws the bullet (zooming a flat map keeps it)
			const deform = this.get("surfaceBullets") ? this._surfaceDeform(coordinates[0], coordinates[1]) : undefined;
			const current = sprite.getPrivate("deform") as IDeform | null | undefined;
			if (!deform || !current || deform.a !== current.a || deform.b !== current.b || deform.c !== current.c || deform.d !== current.d) {
				sprite.setPrivate("deform", deform);
			}
		}
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("surfaceBullets")) {
			$array.each(this.dataItems, (dataItem) => {
				this._positionBullets(dataItem);
			});
		}
	}

	/**
	 * How the surface looks at a point, against the map's center: the
	 * projected east and north directions, as a 2x2 transform for a bullet.
	 */
	protected _surfaceDeform(longitude: number, latitude: number): IDeform | undefined {
		const chart = this.chart;
		if (!chart) {
			return;
		}
		const projection = chart.get("projection")!;
		const scale = projection.scale();
		const step = 0.5;
		const point = projection([longitude, latitude]);
		const north = projection([longitude, Math.min(89.99, latitude + step)]);
		if (!point || !north) {
			return;
		}

		// East by the same distance as north; across a flat map's edge, west instead
		const eastStep = step / Math.max(Math.cos(latitude * $math.RADIANS), 0.01);
		let east = projection([longitude + eastStep, latitude]);
		let sign = 1;
		if (!east || Math.abs(east[0] - point[0]) > Math.PI * scale / 2) {
			east = projection([longitude - eastStep, latitude]);
			sign = -1;
		}
		if (!east) {
			return;
		}

		const k = 1 / (step * $math.RADIANS * scale);
		return {
			a: (east[0] - point[0]) * k * sign,
			b: (east[1] - point[1]) * k * sign,
			c: -(north[0] - point[0]) * k,
			d: -(north[1] - point[1]) * k
		};
	}

	/**
	 * Zooms the map to a point, centered.
	 *
	 * @param  dataItem   Data item of the point
	 * @param  zoomLevel  Zoom level
	 * @param  rotate     Also rotate the map to bring the point to the middle, as on a globe
	 * @return            Zoom level animation
	 */
	public zoomToDataItem(dataItem: DataItem<IMapPointSeriesDataItem>, zoomLevel: number, rotate?: boolean): Animation<any> | undefined {
		const chart = this.chart;
		if (chart) {
			const longitude = dataItem.get("longitude", 0);
			const latitude = dataItem.get("latitude", 0);
			if (rotate) {
				return chart.zoomToGeoPoint({ longitude: longitude, latitude: latitude }, zoomLevel, true, undefined, -longitude, -latitude);
			}
			return chart.zoomToGeoPoint({ longitude: longitude, latitude: latitude }, zoomLevel, true);
		}
	}


	/**
	 * Zooms the map to fit several points.
	 *
	 * @param   dataItems  Data items of the points
	 * @param   rotate     Also rotate the map to bring the middle of their bounds to the middle of the view
	 * @return             Zoom level animation
	 * @since 5.5.6
	 */
	public zoomToDataItems(dataItems: Array<DataItem<IMapPointSeriesDataItem>>, rotate?: boolean): Animation<any> | undefined {

		let left: number | null = null;
		let right: number | null = null;
		let top: number | null = null;
		let bottom: number | null = null;

		$array.each(dataItems, (dataItem) => {
			const longitude = dataItem.get("longitude", 0);
			const latitude = dataItem.get("latitude", 0);

			if (left == null || left > longitude) {
				left = longitude;
			}
			if (right == null || right < longitude) {
				right = longitude;
			}
			if (top == null || top < latitude) {
				top = latitude;
			}
			if (bottom == null || bottom > latitude) {
				bottom = latitude;
			}
		})
		if (left != null && right != null && top != null && bottom != null) {
			const chart = this.chart;
			if (chart) {
				if (rotate) {
					return chart.zoomToGeoBounds({ left, right, top, bottom }, undefined, -(left + (right - left) / 2), -(bottom + (top - bottom) / 2));
				}
				return chart.zoomToGeoBounds({ left, right, top, bottom });
			}
		}
	}


	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		const chart = this.chart;
		if (chart) {
			chart.series.each((series) => {
				if (series.isType<MapLineSeries>("MapLineSeries")) {
					$array.each(series.dataItems, (di) => {
						const pointsToConnect = di.get("pointsToConnect");
						if (pointsToConnect) {
							$array.each(pointsToConnect, (point) => {
								if (point == dataItem) {
									$array.remove(pointsToConnect, point);
									series.markDirtyValues(di);
								}
							})
						}
					})
				}
			})
		}

		const watched = this._lineChangedDps.get(dataItem);
		if (watched) {
			watched.dp.dispose();
			this._lineChangedDps.delete(dataItem);
		}

		super.disposeDataItem(dataItem);
	}

	protected _dispose() {
		this._lineChangedDps.forEach((watched) => {
			watched.dp.dispose();
		});
		this._lineChangedDps.clear();
		super._dispose();
	}

	/**
	 * @ignore
	 */
	protected _excludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._excludeDataItem(dataItem);
		const bullets = dataItem.bullets;
		if (bullets) {
			$array.each(bullets, (bullet) => {
				const sprite = bullet.get("sprite");
				if (sprite) {
					this._setExcluded(sprite, true);
				}
			})
		}
	}


	/**
	 * @ignore
	 */
	protected _unexcludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unexcludeDataItem(dataItem);
		const bullets = dataItem.bullets;
		if (bullets) {
			$array.each(bullets, (bullet) => {
				const sprite = bullet.get("sprite");
				if (sprite) {
					this._setExcluded(sprite, false);
				}
			})
		}
	}

	/**
	 * @ignore
	 */
	protected _notIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._notIncludeDataItem(dataItem);
		const bullets = dataItem.bullets;
		if (bullets) {
			$array.each(bullets, (bullet) => {
				const sprite = bullet.get("sprite");
				if (sprite) {
					this._setExcluded(sprite, true);
				}
			})
		}
	}

	/**
	 * @ignore
	 */
	protected _unNotIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unNotIncludeDataItem(dataItem);
		const bullets = dataItem.bullets;
		if (bullets) {
			$array.each(bullets, (bullet) => {
				const sprite = bullet.get("sprite");
				if (sprite) {
					this._setExcluded(sprite, false);
				}
			})
		}
	}
}
