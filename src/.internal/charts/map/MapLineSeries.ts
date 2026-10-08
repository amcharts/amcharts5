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
	 * The line that shows the data item.
	 */
	mapLine?: MapLine;

	/**
	 * GeoJSON geometry of the line.
	 */
	geometry?: GeoJSON.LineString | GeoJSON.MultiLineString;

	/**
	 * Data items of a [[MapPointSeries]] for the line to connect, in order. The
	 * line follows them when they move. Fixed points can't be used.
	 */
	pointsToConnect?: Array<DataItem<IMapPointSeriesDataItem>>;

	/**
	 * Ids of the points for the line to connect, looked up in `pointSeries`.
	 * The line follows the points, and a config holds just the ids.
	 *
	 * The line isn't drawn until every id matches a point, so it is never drawn
	 * short. Fixed points can't be used. Ignored if `pointsToConnect` is set.
	 *
	 * @since 5.20.3
	 */
	pointIds?: Array<string>;

	/**
	 * How the line runs between its points, instead of the series' `lineType`:
	 *
	 * * `"curved"` - along the shortest path on the globe, which the projection may bend.
	 * * `"straight"` - in straight lines on screen, never across the 180th meridian.
	 *
	 * @default "curved"
	 * @since 5.2.32
	 */
	lineType?: "curved" | "straight"

}

export interface IMapLineSeriesSettings extends IMapSeriesSettings {

	/**
	 * Hides the parts of lines on the far side of a globe, unless set to
	 * `false`. Only projections with a hidden side, such as `geoOrthographic`,
	 * are affected.
	 */
	clipBack?: boolean;

	/**
	 * How lines run between their points:
	 *
	 * * `"curved"` - along the shortest path on the globe, which the projection may bend.
	 * * `"straight"` - in straight lines on screen, never across the 180th meridian.
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
	 * The point series that data items' `pointIds` refer to.
	 *
	 * @since 5.20.3
	 */
	pointSeries?: MapPointSeries;

	/**
	 * Field in `data` that holds each line's `pointIds`.
	 *
	 * @default "pointIds"
	 * @since 5.20.3
	 */
	pointIdsField?: string;
}

/**
 * A map series of lines, such as routes: from GeoJSON geometries, or
 * connecting the points of a [[MapPointSeries]].
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
	 * All lines of the series. Configure them through `mapLines.template`.
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

		// Lines take their type when they are drawn, so draw them again
		if (this.isDirty("lineType")) {
			this.markDirtyProjection();
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
		dataItem.on("lineType", () => {
			const line = dataItem.get("mapLine");
			if (line) {
				line.markDirtyProjection();
			}
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

				point.on("altitude", () => {
					this.markDirtyValues(dataItem);
				})
			})

			this.markDirtyValues(dataItem);
		}
	}

	/**
	 * Redraws the series, and the line of `dataItem`, rebuilding its geometry
	 * from `pointsToConnect` if set.
	 *
	 * @param  dataItem  Data item whose line to redraw
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
						// A raised point raises the line's end too (metres, as in GeoJSON)
						const altitude = point.get("altitude");
						if (longitude != null && latitude != null) {
							coordinates.push(altitude ? [longitude, latitude, altitude] : [longitude, latitude]);
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
			this._setExcluded(mapLine, true);
		}
	}

	/**
	 * @ignore
	 */
	protected _unexcludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unexcludeDataItem(dataItem);
		const mapLine = dataItem.get("mapLine");
		if (mapLine) {
			this._setExcluded(mapLine, false);
		}
	}

	/**
	 * @ignore
	 */
	protected _notIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._notIncludeDataItem(dataItem);
		const mapLine = dataItem.get("mapLine");
		if (mapLine) {
			this._setExcluded(mapLine, true);
		}
	}

	/**
	 * @ignore
	 */
	protected _unNotIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unNotIncludeDataItem(dataItem);
		const mapLine = dataItem.get("mapLine");
		if (mapLine) {
			this._setExcluded(mapLine, false);
		}
	}
}
