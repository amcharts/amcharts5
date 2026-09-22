import type { IMapPointSeriesDataItem, MapPointSeries } from "./MapPointSeries";
import type { DataItem } from "../../core/render/Component";
import type { IDisposer } from "../../core/util/Disposer";

import { MapSeries, IMapSeriesSettings, IMapSeriesDataItem, IMapSeriesPrivate } from "./MapSeries";
import { MapLine } from "./MapLine";
import { ListTemplate } from "../../core/util/List";
import { Template } from "../../core/util/Template";

import * as $array from "../../core/util/Array";

/**
 * @ignore
 */
export interface IMapLineSeriesPrivate extends IMapSeriesPrivate {
}

export interface IMapLineSeriesDataItem extends IMapSeriesDataItem {

	/**
	 * Related [[MapLine]] object.
	 */
	mapLine?: MapLine;

	/**
	 * GeoJSON geometry of the line.
	 */
	geometry?: GeoJSON.LineString | GeoJSON.MultiLineString;

	/**
	 * An array of data items from [[MapPointSeries]] to use as line end-points. Note, fixed points can not be used here.
	 */
	pointsToConnect?: Array<DataItem<IMapPointSeriesDataItem>>;

	/**
	 * Ids of the points the line connects, looked up in the series set as
	 * `pointSeries`. The points themselves stay where they are; the line follows
	 * them, and a config carries the ids rather than a copy of the coordinates.
	 *
	 * The line waits for every id to match a point of its own before it is drawn,
	 * so it is never drawn short. Fixed points cannot be used, same as with
	 * `pointsToConnect`.
	 *
	 * Ignored if `pointsToConnect` is set on the same data item.
	 *
	 * @since 5.20.3
	 */
	pointIds?: Array<string>;

	/**
	 * A line type.
	 *
	 * * `"curved"` (default) - connects points using shortest distance, which will result in curved lines based on map projection.
	 * * `"straight"` - connects points using visually straight lines, and will not cross the -180/180 longitude.
	 *
	 * @default "curved"
	 * @since 5.2.32
	 */
	lineType?: "curved" | "straight"

}

export interface IMapLineSeriesSettings extends IMapSeriesSettings {

	/**
	 * If set to `true` will hide line segments that are in the invisible range
	 * of the map.
	 *
	 * For example on the side of the globe facing away from the viewer when
	 * used with Orthographic projection.
	 *
	 * NOTE: not all projections have invisible side.
	 */
	clipBack?: boolean;

	/**
	 * A line type.
	 *
	 * * `"curved"` (default) - connects points using shortest distance, which will result in curved lines based on map projection.
	 * * `"straight"` - connects points using visually straight lines, and will not cross the -180/180 longitude.
	 *
	 * @default "curved"
	 * @since 5.2.24
	 */
	lineType?: "curved" | "straight"


	/**
	 * @ignore
	 */
	lineTypeField?: string;

	/**
	 * A [[MapPointSeries]] the `pointIds` of a data item are looked up in.
	 *
	 * @since 5.20.3
	 */
	pointSeries?: MapPointSeries;

	/**
	 * A field in data that holds ids of the points a line connects.
	 *
	 * @default "pointIds"
	 * @since 5.20.3
	 */
	pointIdsField?: string;
}

/**
 * Creates a map series for displaying lines on the map.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-line-series/} for more info
 * @important
 */
export class MapLineSeries extends MapSeries {

	protected _pointSeriesDP?: IDisposer;

	/**
	 * The data items whose `pointsToConnect` this series worked out from
	 * `pointIds`, so that they can be worked out again - and one set by hand can
	 * be left alone.
	 */
	protected _derivedPoints: WeakSet<DataItem<IMapLineSeriesDataItem>> = new WeakSet();

	protected _afterNew() {
		this.fields.push("lineType", "pointIds");
		this._setRawDefault("lineTypeField", "lineType");
		this._setRawDefault("pointIdsField", "pointIds");

		// Data can be set before the point series has loaded, so the lookup is
		// retried whenever that series validates - and again if it is swapped
		this.on("pointSeries", () => {
			this._setupPointSeriesListener();
		});

		super._afterNew();

		this._setupPointSeriesListener();
	}

	protected _dispose() {
		super._dispose();

		if (this._pointSeriesDP) {
			this._pointSeriesDP.dispose();
			this._pointSeriesDP = undefined;
		}
	}

	/**
	 * (Re)subscribes to the current `pointSeries` so that lines whose points were
	 * not there yet get connected once they are.
	 */
	protected _setupPointSeriesListener() {
		if (this._pointSeriesDP) {
			this._pointSeriesDP.dispose();
			this._pointSeriesDP = undefined;
		}

		const pointSeries = this.get("pointSeries");
		if (pointSeries) {
			this._pointSeriesDP = pointSeries.events.on("datavalidated", () => {
				this._resolvePendingPointIds();
			});

			if (pointSeries.dataItems.length > 0) {
				this._resolvePendingPointIds();
			}
		}
	}

	/**
	 * Retries every line that is still waiting for its points.
	 */
	protected _resolvePendingPointIds() {
		$array.each(this.dataItems, (dataItem) => {
			this._resolvePointIds(dataItem);
		});
	}

	/**
	 * Turns a data item's `pointIds` into the points themselves. Silent when an
	 * id matches nothing: the line waits rather than being drawn short.
	 */
	protected _resolvePointIds(dataItem: DataItem<this["_dataItemSettings"]>): boolean {
		const current = dataItem.get("pointsToConnect");

		// Whoever set the points outright meant it. Only a link this series made
		// itself is its to remake - after the points are reloaded, say, or the
		// series they come from is swapped for another
		if (current && !this._derivedPoints.has(dataItem)) {
			return false;
		}

		const pointIds = dataItem.get("pointIds");
		const pointSeries = this.get("pointSeries");

		if (!pointIds || pointIds.length === 0 || !pointSeries) {
			return false;
		}

		const points: Array<DataItem<IMapPointSeriesDataItem>> = [];

		for (let i = 0; i < pointIds.length; i++) {
			const point = pointSeries.getDataItemById(pointIds[i]);

			// A point that is not there, or has nowhere on the map to be - one
			// pinned to the screen, say - leaves the line waiting. Better nothing
			// than a line drawn short of where it was asked to go. Same test the
			// line itself uses to place a point (see `markDirtyValues`)
			if (!point) {
				return false;
			}

			// A fixed point sits at screen coordinates and is given a placeholder
			// geometry, so connecting to it draws a line to the middle of the ocean.
			// `fixed` only reaches the data item when `fixedField` is set, so the row
			// itself is the other place to look
			const context: any = point.dataContext;

			if (point.get("fixed") || (context && context.fixed)) {
				return false;
			}

			const hasPosition = (point.get("longitude") != null && point.get("latitude") != null) || point.get("geometry") != null;

			if (!hasPosition) {
				return false;
			}

			points.push(point);
		}

		// Already connected to exactly these
		if (current && current.length === points.length && !$array.any(points, (point) => current.indexOf(point) === -1)) {
			return false;
		}

		this._derivedPoints.add(dataItem);
		dataItem.set("pointsToConnect", points);
		return true;
	}

	/**
	 * @ignore
	 */
	public makeMapLine(dataItem: DataItem<this["_dataItemSettings"]>): MapLine {
		const mapLine = this.children.push(this.mapLines.make());
		mapLine._setDataItem(dataItem);
		this._linkSprite(mapLine, dataItem);
		this.mapLines.push(mapLine);
		return mapLine;
	}

	/**
	 * A [[ListTemplate]] of all lines in series.
	 *
	 * `mapLines.template` can also be used to configure lines.
	 *
	 * @default new ListTemplate<MapLine>
	 */
	public readonly mapLines: ListTemplate<MapLine> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => MapLine._new(this._root, {}, [this.mapLines.template])
	));

	public static className: string = "MapLineSeries";
	public static classNames: Array<string> = MapSeries.classNames.concat([MapLineSeries.className]);

	declare public _settings: IMapLineSeriesSettings;
	declare public _privateSettings: IMapLineSeriesPrivate;
	declare public _dataItemSettings: IMapLineSeriesDataItem;

	protected _types: Array<GeoJSON.GeoJsonGeometryTypes> = ["LineString", "MultiLineString"];

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		$array.each(this.dataItems, (dataItem) => {
			let mapLine = dataItem.get("mapLine");
			if (mapLine) {
				mapLine.markDirtyProjection();
			}
		})
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("stroke")) {
			this.mapLines.template._setC("stroke", this.get("stroke"));
		}
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		let mapLine = dataItem.get("mapLine");
		if (!mapLine) {
			mapLine = this.makeMapLine(dataItem);
		}

		this._handlePointsToConnect(dataItem);
		dataItem.on("pointsToConnect", () => {
			this._handlePointsToConnect(dataItem);
		})

		// After the listener above, so that resolving connects the line right away
		this._resolvePointIds(dataItem);

		dataItem.set("mapLine", mapLine);

		this._addGeometry(dataItem.get("geometry"), this);

		mapLine.setPrivate("series", this);
	}

	protected _handlePointsToConnect(dataItem: DataItem<this["_dataItemSettings"]>) {

		const pointsToConnect = dataItem.get("pointsToConnect");
		if (pointsToConnect) {
			$array.each(pointsToConnect, (point) => {

				point.on("geometry", () => {
					this.markDirtyValues(dataItem);
				})

				point.on("longitude", () => {
					this.markDirtyValues(dataItem);
				})

				point.on("latitude", () => {
					this.markDirtyValues(dataItem);
				})
			})

			this.markDirtyValues(dataItem);
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
			const mapLine = dataItem.get("mapLine");
			if (mapLine) {
				const pointsToConnect = dataItem.get("pointsToConnect");
				if (pointsToConnect) {
					let coordinates: Array<Array<number>> = [];
					$array.each(pointsToConnect, (point) => {
						const longitude = point.get("longitude");
						const latitude = point.get("latitude");
						if (longitude != null && latitude != null) {
							coordinates.push([longitude, latitude]);
						}
						else {
							const geometry = point.get("geometry");
							if (geometry) {
								const coords = geometry.coordinates;
								if (coords) {
									coordinates.push([coords[0] as any, coords[1] as any]);
								}
							}
						}
					})

					let geometry: any = { type: "LineString", coordinates: coordinates };

					dataItem.setRaw("geometry", geometry);
					mapLine._setC("geometry", geometry);
				}
				else {
					mapLine._setC("geometry", dataItem.get("geometry"));
				}
			}
		}
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const mapLine = dataItem.get("mapLine");
		if (mapLine) {
			this.mapLines.removeValue(mapLine);
			mapLine.dispose();
		}
	}

	/**
	 * @ignore
	 */
	protected _excludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._excludeDataItem(dataItem);
		const mapLine = dataItem.get("mapLine");
		if (mapLine) {
			mapLine.setPrivate("visible", false);
		}
	}

	/**
	 * @ignore
	 */
	protected _unexcludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unexcludeDataItem(dataItem);
		const mapLine = dataItem.get("mapLine");
		if (mapLine) {
			mapLine.setPrivate("visible", true);
		}
	}

	/**
	 * @ignore
	 */
	protected _notIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._notIncludeDataItem(dataItem);
		const mapLine = dataItem.get("mapLine");
		if (mapLine) {
			mapLine.setPrivate("visible", false);
		}
	}

	/**
	 * @ignore
	 */
	protected _unNotIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unNotIncludeDataItem(dataItem);
		const mapLine = dataItem.get("mapLine");
		if (mapLine) {
			mapLine.setPrivate("visible", true);
		}
	}
}
