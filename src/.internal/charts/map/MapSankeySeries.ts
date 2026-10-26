import type { DataItem } from "../../core/render/Component";
import type { Bullet } from "../../core/render/Bullet";
import type { IOrientationPoint } from "../../core/util/IPoint";
import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { IDisposer } from "../../core/util/Disposer";
import type { Color } from "../../core/util/Color";

import { MapPolygonSeries, IMapPolygonSeriesSettings, IMapPolygonSeriesDataItem, IMapPolygonSeriesPrivate } from "./MapPolygonSeries";
import { MapSankeyNodes, IMapSankeyNodesDataItem } from "./MapSankeyNodes";
import { getGeoCentroid, getGeoCircle } from "./MapUtils";
import { geoArea } from "d3-geo";

import * as $array from "../../core/util/Array";
import * as $math from "../../core/util/Math";

/**
 * Parameters for a single cubic bezier segment in geographic coordinates.
 * @ignore
 */
export interface IBezierSegment {
	p0Lon: number; p0Lat: number;
	p1Lon: number; p1Lat: number;
	cp0Lon: number; cp0Lat: number;
	cp1Lon: number; cp1Lat: number;
}

export interface IMapSankeySeriesPrivate extends IMapPolygonSeriesPrivate {
}

export interface IMapSankeySeriesDataItem extends IMapPolygonSeriesDataItem {

	/**
	 * Id of the polygon in `polygonSeries` the link starts from, at its
	 * geographic centroid. Also the id of the source node.
	 */
	sourceId?: string;

	/**
	 * Id of the polygon in `polygonSeries` the link ends at, at its geographic
	 * centroid. Also the id of the target node.
	 */
	targetId?: string;

	/**
	 * Longitude the link starts at, when `sourceId` names no polygon.
	 */
	sourceLongitude?: number;

	/**
	 * Latitude the link starts at, when `sourceId` names no polygon.
	 */
	sourceLatitude?: number;

	/**
	 * Longitude the link ends at, when `targetId` names no polygon.
	 */
	targetLongitude?: number;

	/**
	 * Latitude the link ends at, when `targetId` names no polygon.
	 */
	targetLatitude?: number;

	/**
	 * The link's value: its band is as wide as its share of the largest value.
	 */
	value?: number;

	/**
	 * Points the band passes through on its way, in order.
	 */
	waypoints?: Array<IGeoPoint>;

	/**
	 * `controlPointDistance` for this link, instead of the series'.
	 */
	controlPointDistance?: number;

	/**
	 * `controlPointDistanceSource` for this link, instead of the series'.
	 */
	controlPointDistanceSource?: number;

	/**
	 * `controlPointDistanceTarget` for this link, instead of the series'.
	 */
	controlPointDistanceTarget?: number;

	/**
	 * The node the link starts from.
	 * @readonly
	 */
	sourceNode?: DataItem<IMapSankeyNodesDataItem>;

	/**
	 * The node the link ends at.
	 * @readonly
	 */
	targetNode?: DataItem<IMapSankeyNodesDataItem>;

}

export interface IMapSankeySeriesSettings extends IMapPolygonSeriesSettings {

	/**
	 * The polygon series that `sourceId` and `targetId` refer to.
	 */
	polygonSeries?: MapPolygonSeries;

	/**
	 * How far a band's curve control points sit from its ends, as a share of
	 * the distance between them, from `0` to `0.5`. Larger values keep the
	 * band level for longer before its S-bend.
	 *
	 * Used where `controlPointDistanceSource` or `controlPointDistanceTarget`
	 * isn't set.
	 *
	 * @default 0.5
	 */
	controlPointDistance?: number;

	/**
	 * `controlPointDistance` at the source end: larger values keep the band
	 * level for longer as it leaves.
	 */
	controlPointDistanceSource?: number;

	/**
	 * `controlPointDistance` at the target end: larger values keep the band
	 * level for longer as it arrives.
	 */
	controlPointDistanceTarget?: number;

	/**
	 * Which way bands leave and arrive at their nodes:
	 *
	 * * `"horizontal"` - east or west, with bands stacked north to south at each node.
	 * * `"vertical"` - north or south, with bands stacked west to east at each node.
	 *
	 * @default "horizontal"
	 */
	orientation?: "horizontal" | "vertical";

	/**
	 * Width of the band with the largest value, in degrees. Other bands are as
	 * wide as their share of that value.
	 *
	 * @default 5
	 */
	maxWidth?: number;

	/**
	 * Points worked out along each curve of a band. More is smoother.
	 *
	 * @default 50
	 */
	resolution?: number;

	/**
	 * How far, in degrees, a node reaches past the bands it holds: added to a
	 * circle's radius, or to each end of a bar. Hides thin gaps between the
	 * bands and the node.
	 *
	 * @default 0.3
	 */
	nodePadding?: number;

	/**
	 * Stacks the bands at each node by the latitude of their other end, so
	 * bands heading north sit above those heading south and don't cross.
	 *
	 * @default true
	 */
	autoSort?: boolean;

	/**
	 * How links without `waypoints` treat the 180th meridian:
	 *
	 * * `"short"` - take the shorter way, across it if need be (from China to the US, east over the Pacific).
	 * * `"long"` - never cross it, going the long way round.
	 *
	 * @default "short"
	 */
	antimeridian?: "short" | "long";

	/**
	 * Shape of the nodes, styled via `nodes.mapPolygons.template`:
	 *
	 * * `"circle"` - a circle around all bands at the node.
	 * * `"bar"` - a bar across the bands, as in a classic Sankey diagram.
	 *
	 * @default "circle"
	 */
	nodeType?: "circle" | "bar";

	/**
	 * Thickness of a bar node, in degrees, along the way the bands run. Only
	 * with `nodeType: "bar"`.
	 *
	 * @default 1
	 */
	nodeWidth?: number;

	/**
	 * How bands are colored:
	 *
	 * * `"solid"` - all with the `mapPolygons.template` fill.
	 * * `"source"` - each with its source node's fill.
	 * * `"target"` - each with its target node's fill.
	 *
	 * @default "solid"
	 */
	linkColorMode?: "solid" | "source" | "target";

	/**
	 * A field in data that holds `sourceId`.
	 * @default "sourceId"
	 */
	sourceIdField?: string;

	/**
	 * A field in data that holds `targetId`.
	 * @default "targetId"
	 */
	targetIdField?: string;

	/**
	 * A field in data that holds the source longitude.
	 * @default "sourceLongitude"
	 */
	sourceLongitudeField?: string;

	/**
	 * A field in data that holds the source latitude.
	 * @default "sourceLatitude"
	 */
	sourceLatitudeField?: string;

	/**
	 * A field in data that holds the target longitude.
	 * @default "targetLongitude"
	 */
	targetLongitudeField?: string;

	/**
	 * A field in data that holds the target latitude.
	 * @default "targetLatitude"
	 */
	targetLatitudeField?: string;

	/**
	 * A field in data that holds the waypoints array.
	 * @default "waypoints"
	 */
	waypointsField?: string;

}

/**
 * Settings the band and node geometry is generated from: a change to any of them
 * means the shapes have to be worked out again.
 */
const GEOMETRY_SETTINGS = [
	"controlPointDistance", "controlPointDistanceSource", "controlPointDistanceTarget",
	"orientation", "maxWidth", "resolution", "nodePadding", "autoSort", "antimeridian",
	"nodeType", "nodeWidth"
];

/**
 * A map series of Sankey-style flow bands between places, each as wide as
 * its value. The bands are polygons on the map, so they follow it as it is
 * panned, zoomed and rotated.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-sankey-series/} for more info
 * @since 5.17.0
 * @important
 */
export class MapSankeySeries extends MapPolygonSeries {

	/**
	 * Don't consume polygon features from geodata - our data comes from user's data array.
	 */
	protected _types: Array<GeoJSON.GeoJsonGeometryTypes> = [];

	/**
	 * The nodes at the ends of the bands. They are made from the link data; set
	 * `nodes.data.setAll([...])` to give them names and fills of your own.
	 * Style them via `nodes.mapPolygons.template`.
	 */
	public readonly nodes: MapSankeyNodes = this.addDisposer(
		MapSankeyNodes.new(this._root, {})
	);

	/**
	 * Stored bezier segment params per data item for bullet positioning.
	 * Each link can have multiple segments (when waypoints are used).
	 * @ignore
	 */
	public _bezierSegments: Map<DataItem<IMapSankeySeriesDataItem>, Array<IBezierSegment>> = new Map();

	/**
	 * Cumulative arc-length array per data item for uniform-speed bullet positioning.
	 * Entry i = cumulative length from segment 0 through segment i.
	 * Last entry = total path length.
	 * @ignore
	 */
	public _segmentCumulativeLengths: Map<DataItem<IMapSankeySeriesDataItem>, number[]> = new Map();

	// Reusable scratch Maps for _generateGeometries — cleared and reused each call
	// to avoid allocating 10 fresh Maps per dirty cycle.
	private _geoSourceCoords: Map<DataItem<IMapSankeySeriesDataItem>, IGeoPoint> = new Map();
	private _geoTargetCoords: Map<DataItem<IMapSankeySeriesDataItem>, IGeoPoint> = new Map();
	private _geoWidths: Map<DataItem<IMapSankeySeriesDataItem>, number> = new Map();
	private _geoSourceGroups: Map<string, Array<DataItem<IMapSankeySeriesDataItem>>> = new Map();
	private _geoTargetGroups: Map<string, Array<DataItem<IMapSankeySeriesDataItem>>> = new Map();
	private _geoNodeSourceTotal: Map<string, number> = new Map();
	private _geoNodeTargetTotal: Map<string, number> = new Map();
	private _geoNodeRange: Map<string, number> = new Map();
	private _geoSourceOffsets: Map<DataItem<IMapSankeySeriesDataItem>, number> = new Map();
	private _geoTargetOffsets: Map<DataItem<IMapSankeySeriesDataItem>, number> = new Map();

	/**
	 * Disposer for the polygonSeries `datavalidated` listener. Re-attached
	 * whenever the `polygonSeries` setting changes.
	 */
	private _polygonSeriesDP?: IDisposer;

	/**
	 * @ignore
	 */
	protected _afterNew() {
		this.fields.push("sourceId", "targetId", "sourceLongitude", "sourceLatitude", "targetLongitude", "targetLatitude", "waypoints");
		this.valueFields.push("value");

		this._setRawDefault("sourceIdField", "sourceId");
		this._setRawDefault("targetIdField", "targetId");
		this._setRawDefault("sourceLongitudeField", "sourceLongitude");
		this._setRawDefault("sourceLatitudeField", "sourceLatitude");
		this._setRawDefault("targetLongitudeField", "targetLongitude");
		this._setRawDefault("targetLatitudeField", "targetLatitude");
		this._setRawDefault("valueField", "value");
		this._setRawDefault("waypointsField", "waypoints");

		this.nodes.flow = this;

		// Watch for polygonSeries changes — re-attach the datavalidated
		// listener so users don't have to wait for the polygon series to
		// be ready before calling sankey.data.setAll().
		this.on("polygonSeries", () => {
			this._setupPolygonSeriesListener();
		});

		super._afterNew();

		// Initial setup in case polygonSeries was passed in constructor settings.
		this._setupPolygonSeriesListener();

		// Nodes set after the links replace the ones the links were bound to
		this._disposers.push(this.nodes.events.on("datavalidated", () => {
			this._rebindLinks();
		}));
	}

	/**
	 * Colors each band from its source or target node, as `linkColorMode`
	 * says, or gives it back its own fill for `"solid"`.
	 *
	 * @ignore
	 */
	public _applyLinkColors() {
		const linkColorMode = this.get("linkColorMode", "solid");
		$array.each(this.dataItems, (dataItem) => {
			const mapPolygon = dataItem.get("mapPolygon");
			if (!mapPolygon) {
				return;
			}
			let nodeFill: Color | undefined;
			if (linkColorMode !== "solid") {
				const nodeDataItem = linkColorMode === "source" ? dataItem.get("sourceNode") : dataItem.get("targetNode");
				nodeFill = nodeDataItem ? nodeDataItem.get("fill") : undefined;
			}
			if (nodeFill) {
				mapPolygon._setC("fill", nodeFill);
			}
			else if (mapPolygon.isComputedSetting("fill")) {
				// Only a fill set here is taken back; the template's comes back
				mapPolygon.remove("fill");
			}
		});
	}

	/**
	 * Unbinds links from nodes that are no longer in `nodes` and binds them
	 * again, to the current nodes.
	 */
	private _rebindLinks() {
		const nodeDataItems = this.nodes.dataItems;
		$array.each(this.dataItems, (dataItem) => {
			const sourceNode = dataItem.get("sourceNode");
			if (sourceNode && nodeDataItems.indexOf(sourceNode) == -1) {
				dataItem.setRaw("sourceNode", undefined);
			}
			const targetNode = dataItem.get("targetNode");
			if (targetNode && nodeDataItems.indexOf(targetNode) == -1) {
				dataItem.setRaw("targetNode", undefined);
			}
		});
		this._resolvePendingDataItems();
	}

	/**
	 * (Re)subscribes to the current `polygonSeries` `datavalidated` event so
	 * that any data items added before the polygon series finished loading
	 * its geoJSON get their endpoints resolved automatically.
	 */
	private _setupPolygonSeriesListener() {
		if (this._polygonSeriesDP) {
			this._polygonSeriesDP.dispose();
			this._polygonSeriesDP = undefined;
		}

		const polygonSeries = this.get("polygonSeries");
		if (polygonSeries) {
			this._polygonSeriesDP = polygonSeries.events.on("datavalidated", () => {
				this._resolvePendingDataItems();
			});

			// If the polygon series already has data items (e.g. it was
			// validated before our data was set), resolve immediately.
			if (polygonSeries.dataItems.length > 0) {
				this._resolvePendingDataItems();
			}
		}
	}

	/**
	 * Walks all data items and resolves any whose source/target endpoints
	 * weren't resolved during the initial `processDataItem` call (because
	 * the polygon series wasn't ready yet). Marks values dirty so the
	 * geometries get regenerated.
	 */
	private _resolvePendingDataItems() {
		let anyResolved = false;
		$array.each(this.dataItems, (dataItem) => {
			if (this._resolveEndpoints(dataItem)) {
				anyResolved = true;
			}
		});
		if (anyResolved) {
			// Trigger geometry regeneration on next validation cycle.
			// Mirrors Component.markDirtyValues without the parent's
			// MapPolygon geometry sync (handled later in _generateGeometries).
			this._valuesDirty = true;
			this.markDirty();
		}
	}

	public static className: string = "MapSankeySeries";
	public static classNames: Array<string> = MapPolygonSeries.classNames.concat([MapSankeySeries.className]);

	declare public _settings: IMapSankeySeriesSettings;
	declare public _privateSettings: IMapSankeySeriesPrivate;
	declare public _dataItemSettings: IMapSankeySeriesDataItem;

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		super.markDirtyProjection();
		$array.each(this.nodes.dataItems, (nodeDataItem) => {
			const mapPolygon = nodeDataItem.get("mapPolygon");
			if (mapPolygon) {
				mapPolygon.markDirtyProjection();
			}
		});

		// Bullets ride on the bands: a still one has to move with the map too
		if (this.bullets.length) {
			this.markDirty();
		}
	}

	/**
	 * Evaluate a single bezier segment at parameter t.
	 *
	 * Same formula as $math.getPointOnCubicCurve but operates on flat
	 * IBezierSegment fields (lon/lat) to avoid IPoint object allocation.
	 */
	protected _evalBezier(bp: IBezierSegment, t: number): IGeoPoint {
		const s = 1 - t;
		return {
			longitude: s * s * s * bp.p0Lon + 3 * s * s * t * bp.cp0Lon + 3 * s * t * t * bp.cp1Lon + t * t * t * bp.p1Lon,
			latitude: s * s * s * bp.p0Lat + 3 * s * s * t * bp.cp0Lat + 3 * s * t * t * bp.cp1Lat + t * t * t * bp.p1Lat
		};
	}

	/**
	 * Approximates the arc length of a single bezier segment by sampling
	 * points along the curve and summing Haversine distances.
	 *
	 * @param bp       Bezier segment parameters
	 * @param samples  Number of sample intervals (default 20)
	 * @return         Approximate arc length in radians
	 */
	protected _segmentArcLength(bp: IBezierSegment, samples: number = 20): number {
		let length = 0;
		let prev = this._evalBezier(bp, 0);
		for (let i = 1; i <= samples; i++) {
			const pt = this._evalBezier(bp, i / samples);
			const dLon = (pt.longitude - prev.longitude) * Math.PI / 180;
			const dLat = (pt.latitude - prev.latitude) * Math.PI / 180;
			// Haversine approximation
			const a = Math.sin(dLat / 2) ** 2 + Math.cos(prev.latitude * Math.PI / 180) * Math.cos(pt.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
			length += 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			prev = pt;
		}
		return length;
	}

	/**
	 * Computes cumulative arc lengths for a set of bezier segments and
	 * stores them in `_segmentCumulativeLengths` for arc-length parameterization.
	 *
	 * @param dataItem  Link data item (used as cache key)
	 * @param segments  Array of bezier segment parameters
	 */
	protected _computeCumulativeLengths(dataItem: DataItem<IMapSankeySeriesDataItem>, segments: Array<IBezierSegment>): void {
		const cumulative: number[] = [];
		let total = 0;
		for (let i = 0; i < segments.length; i++) {
			total += this._segmentArcLength(segments[i]);
			cumulative.push(total);
		}
		this._segmentCumulativeLengths.set(dataItem, cumulative);
	}

	/**
	 * Resolves a normalized location (0–1) to a segment index and local t
	 * using arc-length parameterization. Delegates to `$math.resolveLocationOnPath`
	 * when cumulative lengths are available; falls back to equal distribution.
	 *
	 * @param dataItem  Link data item (for cumulative length lookup)
	 * @param location  Relative position along the full path (0–1)
	 * @param segments  Array of bezier segment parameters (used for fallback)
	 * @return          Segment index and local t (0–1)
	 */
	protected _resolveLocation(dataItem: DataItem<IMapSankeySeriesDataItem>, location: number, segments: Array<IBezierSegment>): { segIdx: number; t: number } {
		const cumLengths = this._segmentCumulativeLengths.get(dataItem);

		if (cumLengths && cumLengths.length > 0) {
			const result = $math.resolveLocationOnPath(location, cumLengths);
			return { segIdx: result.index, t: result.t };
		}

		// Fallback: equal distribution
		const n = segments.length;
		const scaled = location * n;
		const segIdx = Math.min(Math.floor(scaled), n - 1);
		return { segIdx, t: scaled - segIdx };
	}

	/**
	 * Returns the point at a position along a band's center line, relative to
	 * the map's area, and the line's angle there in degrees.
	 *
	 * @param   dataItem  Data item of the link
	 * @param   location  Position from `0` (source) to `1` (target)
	 * @return            Point in pixels, and angle
	 */
	public getPoint(dataItem: DataItem<IMapSankeySeriesDataItem>, location: number): IOrientationPoint {
		const segments = this._bezierSegments.get(dataItem);
		const chart = this.chart;
		if (!segments || segments.length === 0 || !chart) return { x: 0, y: 0, angle: 0 };

		const { segIdx, t } = this._resolveLocation(dataItem, location, segments);
		const bp = segments[segIdx];

		const pt = this._evalBezier(bp, t);
		const screenPoint = chart.convert({ longitude: pt.longitude, latitude: pt.latitude });

		// Angle from a nearby point — use backward difference near t=1 to avoid identical points
		const dt = 0.001;
		let pt2: IGeoPoint;
		let sign = 1;
		if (t + dt <= 1) {
			pt2 = this._evalBezier(bp, t + dt);
		} else {
			pt2 = this._evalBezier(bp, t - dt);
			sign = -1;
		}
		const screenPoint2 = chart.convert({ longitude: pt2.longitude, latitude: pt2.latitude });

		const angle = Math.atan2(sign * (screenPoint2.y - screenPoint.y), sign * (screenPoint2.x - screenPoint.x)) * 180 / Math.PI;

		return { x: screenPoint.x, y: screenPoint.y, angle };
	}

	/**
	 * Returns the geographic point at a position along a band's center line.
	 *
	 * @param   dataItem  Data item of the link
	 * @param   location  Position from `0` (source) to `1` (target)
	 * @return            Geographic point
	 */
	public getGeoPoint(dataItem: DataItem<IMapSankeySeriesDataItem>, location: number): IGeoPoint | undefined {
		const segments = this._bezierSegments.get(dataItem);
		if (!segments || segments.length === 0) return undefined;

		const { segIdx, t } = this._resolveLocation(dataItem, location, segments);
		return this._evalBezier(segments[segIdx], t);
	}

	/**
	 * Returns the approximate length of a band's center line, in radians of
	 * arc on the globe. Useful for making an animation's duration fit the
	 * distance.
	 *
	 * @param   dataItem  Data item of the link
	 * @return            Length in radians
	 */
	public getPathLength(dataItem: DataItem<IMapSankeySeriesDataItem>): number {
		const cumLengths = this._segmentCumulativeLengths.get(dataItem);
		if (cumLengths && cumLengths.length > 0) {
			return cumLengths[cumLengths.length - 1];
		}
		return 0;
	}

	/**
	 * Combined getPoint + getGeoPoint in a single pass (avoids double
	 * _resolveLocation + _evalBezier per bullet per frame).
	 * @ignore
	 */
	private _getPointWithGeo(dataItem: DataItem<IMapSankeySeriesDataItem>, location: number): { x: number; y: number; angle: number; geoPoint: IGeoPoint } | undefined {
		const segments = this._bezierSegments.get(dataItem);
		const chart = this.chart;
		if (!segments || segments.length === 0 || !chart) return undefined;

		const { segIdx, t } = this._resolveLocation(dataItem, location, segments);
		const bp = segments[segIdx];
		const geoPoint = this._evalBezier(bp, t);
		const screenPoint = chart.convert({ longitude: geoPoint.longitude, latitude: geoPoint.latitude });

		const dt = 0.001;
		let pt2: IGeoPoint;
		let sign = 1;
		if (t + dt <= 1) {
			pt2 = this._evalBezier(bp, t + dt);
		} else {
			pt2 = this._evalBezier(bp, t - dt);
			sign = -1;
		}
		const screenPoint2 = chart.convert({ longitude: pt2.longitude, latitude: pt2.latitude });
		const angle = Math.atan2(sign * (screenPoint2.y - screenPoint.y), sign * (screenPoint2.x - screenPoint.x)) * 180 / Math.PI;

		return { x: screenPoint.x, y: screenPoint.y, angle, geoPoint };
	}

	/**
	 * Positions a bullet along its parent link's bezier path.
	 *
	 * @param bullet  Bullet to position
	 */
	public _positionBullet(bullet: Bullet) {
		const sprite = bullet.get("sprite");
		if (sprite) {
			const dataItem = sprite.dataItem as DataItem<IMapSankeySeriesDataItem>;
			if (dataItem) {
				const location = bullet.get("locationX", 0.5);
				const result = this._getPointWithGeo(dataItem, location);
				if (!result) return;

				sprite.setAll({ x: result.x, y: result.y });

				if (bullet.get("autoRotate")) {
					sprite.set("rotation", result.angle + bullet.get("autoRotateAngle", 0));
				}

				// Hide bullets on the back side of the globe (like MapPointSeries clipBack)
				const chart = this.chart;
				if (chart) {
					const geoPath = chart.getPrivate("geoPath");
					if (geoPath) {
						const geometry: GeoJSON.Point = { type: "Point", coordinates: [result.geoPoint.longitude, result.geoPoint.latitude] };
						sprite.setPrivate("visible", !!geoPath(geometry));
					}
				}
			}
		}
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		this._bezierSegments.delete(dataItem);
		this._segmentCumulativeLengths.delete(dataItem);
	}

	/**
	 * @ignore
	 */
	protected _dispose() {
		super._dispose();
		if (this._polygonSeriesDP) {
			this._polygonSeriesDP.dispose();
			this._polygonSeriesDP = undefined;
		}
		this._bezierSegments.clear();
		this._segmentCumulativeLengths.clear();
		this._geoSourceCoords.clear();
		this._geoTargetCoords.clear();
		this._geoWidths.clear();
		this._geoSourceGroups.clear();
		this._geoTargetGroups.clear();
		this._geoNodeSourceTotal.clear();
		this._geoNodeTargetTotal.clear();
		this._geoNodeRange.clear();
		this._geoSourceOffsets.clear();
		this._geoTargetOffsets.clear();
	}

	/**
	 * Processes a newly added data item, creating placeholder geometry and
	 * registering it with source/target nodes.
	 *
	 * @param dataItem  Data item to process
	 */
	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		// Set placeholder geometry so parent creates the MapPolygon
		// Use empty coordinates array (no rings) to avoid d3-geo crash on empty ring
		if (!dataItem.get("geometry")) {
			dataItem.set("geometry", { type: "Polygon", coordinates: [] } as GeoJSON.Polygon);
		}
		super.processDataItem(dataItem);

		this._resolveEndpoints(dataItem);
	}

	/**
	 * Resolves the source/target endpoints for a single data item:
	 * looks up centroids on the polygon series (if `sourceId`/`targetId` is set),
	 * then creates or attaches the appropriate sankey nodes.
	 *
	 * Returns `true` if anything was newly resolved, so callers can decide
	 * whether to mark geometries dirty.
	 *
	 * Safe to call repeatedly: skips endpoints that are already resolved.
	 */
	private _resolveEndpoints(dataItem: DataItem<this["_dataItemSettings"]>): boolean {
		const polygonSeries = this.get("polygonSeries");
		let resolved = false;

		// -- Source --
		if (!dataItem.get("sourceNode")) {
			let sourceLon = dataItem.get("sourceLongitude");
			let sourceLat = dataItem.get("sourceLatitude");
			const sourceId = dataItem.get("sourceId");

			if (sourceId && polygonSeries) {
				const polygonDI = polygonSeries.getDataItemById(sourceId);
				if (polygonDI) {
					const geometry = polygonDI.get("geometry");
					if (geometry) {
						const centroid = getGeoCentroid(geometry);
						sourceLon = centroid.longitude;
						sourceLat = centroid.latitude;
					}
				}
			}

			if (sourceLon != null && sourceLat != null) {
				const sourceKey = sourceId ?? (Number(sourceLon) + "," + Number(sourceLat));
				let sourceNode = this.nodes.getDataItemById(sourceKey);
				if (!sourceNode) {
					const ctx: any = dataItem.dataContext;
					const name = (ctx && ctx.source) || sourceKey;
					this.nodes.data.push({ id: sourceKey, name, longitude: Number(sourceLon), latitude: Number(sourceLat) });
					sourceNode = this.nodes.dataItems[this.nodes.dataItems.length - 1];
				}
				else if (sourceNode.get("longitude") == null || sourceNode.get("latitude") == null) {
					// A node from the user's data without a position takes the link's
					sourceNode.setRaw("longitude", Number(sourceLon));
					sourceNode.setRaw("latitude", Number(sourceLat));
				}
				if (sourceNode) {
					dataItem.setRaw("sourceNode", sourceNode);
					this.nodes.addOutgoingLink(sourceNode, dataItem);
					resolved = true;
				}
			}
		}

		// -- Target --
		if (!dataItem.get("targetNode")) {
			let targetLon = dataItem.get("targetLongitude");
			let targetLat = dataItem.get("targetLatitude");
			const targetId = dataItem.get("targetId");

			if (targetId && polygonSeries) {
				const polygonDI = polygonSeries.getDataItemById(targetId);
				if (polygonDI) {
					const geometry = polygonDI.get("geometry");
					if (geometry) {
						const centroid = getGeoCentroid(geometry);
						targetLon = centroid.longitude;
						targetLat = centroid.latitude;
					}
				}
			}

			if (targetLon != null && targetLat != null) {
				const targetKey = targetId ?? (Number(targetLon) + "," + Number(targetLat));
				let targetNode = this.nodes.getDataItemById(targetKey);
				if (!targetNode) {
					const ctx: any = dataItem.dataContext;
					const name = (ctx && ctx.target) || targetKey;
					this.nodes.data.push({ id: targetKey, name, longitude: Number(targetLon), latitude: Number(targetLat) });
					targetNode = this.nodes.dataItems[this.nodes.dataItems.length - 1];
				}
				else if (targetNode.get("longitude") == null || targetNode.get("latitude") == null) {
					// A node from the user's data without a position takes the link's
					targetNode.setRaw("longitude", Number(targetLon));
					targetNode.setRaw("latitude", Number(targetLat));
				}
				if (targetNode) {
					dataItem.setRaw("targetNode", targetNode);
					this.nodes.addIncomingLink(targetNode, dataItem);
					resolved = true;
				}
			}
		}

		return resolved;
	}

	/**
	 * @ignore
	 */
	protected _onDataClear() {
		// Clear link references on preserved nodes
		$array.each(this.nodes.dataItems, (nodeDataItem) => {
			nodeDataItem.setRaw("incomingLinks", []);
			nodeDataItem.setRaw("outgoingLinks", []);
		});

		if (!this.nodes._userDataSet) {
			// setAll([]) triggers _onDataClear which sets _userDataSet = true;
			// reset it so auto-created nodes work again on next data cycle.
			this.nodes.data.setAll([]);
			this.nodes._userDataSet = false;
		}
	}

	/**
	 * @ignore
	 */
	public _prepareChildren() {
		// The shape of the bands and the nodes is worked out from these, and the
		// only thing that used to re-run that was the data changing - so setting
		// any of them on a chart that was already up did nothing until it did
		if ($array.any(GEOMETRY_SETTINGS, (setting) => this.isDirty(setting as any))) {
			this._valuesDirty = true;
		}

		if (this._valuesDirty || this._sizeDirty) {
			this._generateGeometries();
		}
		else if (this.isDirty("linkColorMode")) {
			this._applyLinkColors();
		}
		super._prepareChildren();

		// Bands made after the bullets container was placed would cover the bullets
		const children = this.children;
		const bulletsContainer = this.bulletsContainer;
		if (bulletsContainer.parent === this && children.getIndex(children.length - 1) !== bulletsContainer) {
			children.moveValue(bulletsContainer);
		}
	}

	/**
	 * Rebuilds all link band geometries from current data.
	 *
	 * Computes bezier control points, stacking offsets, band polygons,
	 * and cumulative arc lengths for each link.
	 */
	protected _generateGeometries() {
		const maxWidthDeg = this.get("maxWidth", 5);
		const cpdBase = Math.min(0.4999, this.get("controlPointDistance", 0.5));
		const cpdSource = Math.min(0.4999, this.get("controlPointDistanceSource", cpdBase));
		const cpdTarget = Math.min(0.4999, this.get("controlPointDistanceTarget", cpdBase));
		const resolution = this.get("resolution", 50);

		// Find max value
		let maxValue = 0;
		$array.each(this.dataItems, (dataItem) => {
			const value = dataItem.get("value");
			if (value != null && value > maxValue) {
				maxValue = value;
			}
		});
		if (maxValue === 0) maxValue = 1;

		const sourceCoords = this._geoSourceCoords; sourceCoords.clear();
		const targetCoords = this._geoTargetCoords; targetCoords.clear();
		const widths = this._geoWidths; widths.clear();
		const sourceGroups = this._geoSourceGroups; sourceGroups.clear();
		const targetGroups = this._geoTargetGroups; targetGroups.clear();

		// Build coord maps and groups from node references on links
		$array.each(this.dataItems, (dataItem) => {
			const value = +(dataItem.get("value") || 0);
			widths.set(dataItem, maxWidthDeg * value / maxValue);

			const sourceNode = dataItem.get("sourceNode");
			if (sourceNode) {
				const lon = sourceNode.get("longitude");
				const lat = sourceNode.get("latitude");
				if (lon != null && lat != null) {
					sourceCoords.set(dataItem, { longitude: lon, latitude: lat });
					const key = sourceNode.get("id")!;
					if (!sourceGroups.has(key)) sourceGroups.set(key, []);
					sourceGroups.get(key)!.push(dataItem);
				}
			}

			const targetNode = dataItem.get("targetNode");
			if (targetNode) {
				const lon = targetNode.get("longitude");
				const lat = targetNode.get("latitude");
				if (lon != null && lat != null) {
					targetCoords.set(dataItem, { longitude: lon, latitude: lat });
					const key = targetNode.get("id")!;
					if (!targetGroups.has(key)) targetGroups.set(key, []);
					targetGroups.get(key)!.push(dataItem);
				}
			}
		});

		// Coordinated stacking at intermediate nodes:
		// At nodes with both incoming and outgoing flows, use the same
		// vertical range for both sides so bands align like in a Sankey.
		const nodePadding = this.get("nodePadding", 0.3);
		const autoSort = this.get("autoSort", true);

		// First: compute the unified stacking range at each node
		const nodeSourceTotal = this._geoNodeSourceTotal; nodeSourceTotal.clear();
		const nodeTargetTotal = this._geoNodeTargetTotal; nodeTargetTotal.clear();

		sourceGroups.forEach((items, key) => {
			let total = 0;
			$array.each(items, (item) => { total += widths.get(item) || 0; });
			nodeSourceTotal.set(key, total);
		});

		targetGroups.forEach((items, key) => {
			let total = 0;
			$array.each(items, (item) => { total += widths.get(item) || 0; });
			nodeTargetTotal.set(key, total);
		});

		// Unified range = max(incoming, outgoing) at each node
		const nodeRange = this._geoNodeRange; nodeRange.clear();
		const allKeys = new Set([...nodeSourceTotal.keys(), ...nodeTargetTotal.keys()]);
		allKeys.forEach((key) => {
			nodeRange.set(key, Math.max(nodeSourceTotal.get(key) || 0, nodeTargetTotal.get(key) || 0));
		});

		// Stack outgoing flows (sourceGroups) centered within the unified range
		const sourceOffsets = this._geoSourceOffsets; sourceOffsets.clear();
		const targetOffsets = this._geoTargetOffsets; targetOffsets.clear();

		sourceGroups.forEach((items, key) => {
			if (autoSort) {
				items.sort((a, b) => ((targetCoords.get(a)?.latitude || 0) - (targetCoords.get(b)?.latitude || 0)));
			}
			const ownTotal = nodeSourceTotal.get(key) || 0;
			const range = nodeRange.get(key) || ownTotal;
			// Center this side's bands within the unified range
			let offset = -range / 2 + (range - ownTotal) / 2;
			$array.each(items, (item) => {
				const w = widths.get(item) || 0;
				sourceOffsets.set(item, offset + w / 2);
				offset += w;
			});
		});

		// Stack incoming flows (targetGroups) centered within the unified range
		targetGroups.forEach((items, key) => {
			if (autoSort) {
				items.sort((a, b) => ((sourceCoords.get(a)?.latitude || 0) - (sourceCoords.get(b)?.latitude || 0)));
			}
			const ownTotal = nodeTargetTotal.get(key) || 0;
			const range = nodeRange.get(key) || ownTotal;
			let offset = -range / 2 + (range - ownTotal) / 2;
			$array.each(items, (item) => {
				const w = widths.get(item) || 0;
				targetOffsets.set(item, offset + w / 2);
				offset += w;
			});
		});

		// Generate polygon for each link
		const orientationSetting = this.get("orientation", "horizontal");

		$array.each(this.dataItems, (dataItem) => {
			const source = sourceCoords.get(dataItem);
			const target = targetCoords.get(dataItem);
			if (!source || !target) return;

			const width = widths.get(dataItem) || 0;
			if (width <= 0) return;

			const halfWidth = width / 2;
			const sourceOff = sourceOffsets.get(dataItem) || 0;
			const targetOff = targetOffsets.get(dataItem) || 0;

			// Build path points: [source, ...waypoints, target]
			// Apply stacking offset to source/target based on orientation
			let startLon: number, startLat: number, endLon: number, endLat: number;

			if (orientationSetting === "vertical") {
				startLon = source.longitude + sourceOff;
				startLat = source.latitude;
				endLon = target.longitude + targetOff;
				endLat = target.latitude;
			} else {
				startLon = source.longitude;
				startLat = source.latitude + sourceOff;
				endLon = target.longitude;
				endLat = target.latitude + targetOff;
			}

			// Per-link control point distances (fall back to series-level)
			const linkCpd = Math.min(0.4999, dataItem.get("controlPointDistance") ?? cpdBase);
			const linkCpdSource = Math.min(0.4999, dataItem.get("controlPointDistanceSource") ?? dataItem.get("controlPointDistance") ?? cpdSource);
			const linkCpdTarget = Math.min(0.4999, dataItem.get("controlPointDistanceTarget") ?? dataItem.get("controlPointDistance") ?? cpdTarget);

			const waypoints = dataItem.get("waypoints");
			const hasWaypoints = waypoints && waypoints.length > 0;

			// Adjust for antimeridian crossing (only without waypoints)
			if (!hasWaypoints) {
				const antimeridian = this.get("antimeridian", "short");
				if (antimeridian === "short") {
					let dLon = endLon - startLon;
					if (dLon > 180) endLon -= 360;
					else if (dLon < -180) endLon += 360;
				}
			}

			const pathPoints: IGeoPoint[] = [{ longitude: startLon, latitude: startLat }];
			if (hasWaypoints) {
				for (const wp of waypoints!) {
					pathPoints.push({ longitude: wp.longitude, latitude: wp.latitude });
				}
			}
			pathPoints.push({ longitude: endLon, latitude: endLat });

			// Build bezier segments between consecutive path points
			const segments: Array<IBezierSegment> = [];

			for (let seg = 0; seg < pathPoints.length - 1; seg++) {
				const p0 = pathPoints[seg];
				const p1 = pathPoints[seg + 1];

				// Tangent direction at each point:
				// - First point: direction toward next point
				// - Last point: direction from previous point
				// - Middle points: average of incoming and outgoing directions
				let tangent0Lon: number, tangent0Lat: number;
				let tangent1Lon: number, tangent1Lat: number;

				if (seg === 0 && pathPoints.length === 2) {
					// Simple case: single segment, use S-curve logic
					if (orientationSetting === "vertical") {
						const dLat = p1.latitude - p0.latitude;
						tangent0Lon = 0; tangent0Lat = dLat;
						tangent1Lon = 0; tangent1Lat = dLat;
					} else {
						const dLon = p1.longitude - p0.longitude;
						tangent0Lon = dLon; tangent0Lat = 0;
						tangent1Lon = dLon; tangent1Lat = 0;
					}
				} else {
					// Multi-point: use direction to neighbor
					if (seg === 0) {
						// First segment start: direction toward next
						tangent0Lon = p1.longitude - p0.longitude;
						tangent0Lat = p1.latitude - p0.latitude;
					} else {
						// Average of incoming and outgoing
						const prev = pathPoints[seg - 1];
						tangent0Lon = p1.longitude - prev.longitude;
						tangent0Lat = p1.latitude - prev.latitude;
					}

					if (seg === pathPoints.length - 2) {
						// Last segment end: direction from previous
						tangent1Lon = p1.longitude - p0.longitude;
						tangent1Lat = p1.latitude - p0.latitude;
					} else {
						const next = pathPoints[seg + 2];
						tangent1Lon = next.longitude - p0.longitude;
						tangent1Lat = next.latitude - p0.latitude;
					}
				}

				// Normalize tangents and scale by cpd * segment distance
				// Use cpdSource at the start of the first segment, cpdTarget at the end of the last
				const segDist = Math.sqrt((p1.longitude - p0.longitude) ** 2 + (p1.latitude - p0.latitude) ** 2);
				const t0Len = Math.sqrt(tangent0Lon ** 2 + tangent0Lat ** 2);
				const t1Len = Math.sqrt(tangent1Lon ** 2 + tangent1Lat ** 2);
				const scale0 = segDist * (seg === 0 ? linkCpdSource : linkCpd);
				const scale1 = segDist * (seg === pathPoints.length - 2 ? linkCpdTarget : linkCpd);

				const cp0Lon = p0.longitude + (t0Len > 0 ? tangent0Lon / t0Len * scale0 : 0);
				const cp0Lat = p0.latitude + (t0Len > 0 ? tangent0Lat / t0Len * scale0 : 0);
				const cp1Lon = p1.longitude - (t1Len > 0 ? tangent1Lon / t1Len * scale1 : 0);
				const cp1Lat = p1.latitude - (t1Len > 0 ? tangent1Lat / t1Len * scale1 : 0);

				segments.push({
					p0Lon: p0.longitude, p0Lat: p0.latitude,
					p1Lon: p1.longitude, p1Lat: p1.latitude,
					cp0Lon, cp0Lat, cp1Lon, cp1Lat
				});
			}

			// Store for bullet positioning
			this._bezierSegments.set(dataItem, segments);
			this._computeCumulativeLengths(dataItem, segments);

			// Sample all segments to build left/right edges
			const leftEdge: [number, number][] = [];
			const rightEdge: [number, number][] = [];

			for (let seg = 0; seg < segments.length; seg++) {
				const bp = segments[seg];
				const startI = (seg === 0) ? 0 : 1; // avoid duplicate at joins
				for (let i = startI; i <= resolution; i++) {
					const t = i / resolution;
					const s = 1 - t;

					const lon = s * s * s * bp.p0Lon + 3 * s * s * t * bp.cp0Lon + 3 * s * t * t * bp.cp1Lon + t * t * t * bp.p1Lon;
					const lat = s * s * s * bp.p0Lat + 3 * s * s * t * bp.cp0Lat + 3 * s * t * t * bp.cp1Lat + t * t * t * bp.p1Lat;

					const dtLon = 3 * s * s * (bp.cp0Lon - bp.p0Lon) + 6 * s * t * (bp.cp1Lon - bp.cp0Lon) + 3 * t * t * (bp.p1Lon - bp.cp1Lon);
					const dtLat = 3 * s * s * (bp.cp0Lat - bp.p0Lat) + 6 * s * t * (bp.cp1Lat - bp.cp0Lat) + 3 * t * t * (bp.p1Lat - bp.cp1Lat);

					const tLen = Math.sqrt(dtLon * dtLon + dtLat * dtLat);
					if (tLen === 0) continue;

					const perpLon = -dtLat / tLen;
					const perpLat = dtLon / tLen;

					leftEdge.push([lon + halfWidth * perpLon, lat + halfWidth * perpLat]);
					rightEdge.push([lon - halfWidth * perpLon, lat - halfWidth * perpLat]);
				}
			}

			// Simple closed polygon: leftEdge forward + rightEdge backward
			const ring: [number, number][] = [];
			for (let i = 0; i < leftEdge.length; i++) ring.push(leftEdge[i]);
			for (let i = rightEdge.length - 1; i >= 0; i--) ring.push(rightEdge[i]);
			ring.push(leftEdge[0]);

			// d3-geo requires clockwise winding for small polygons.
			// If geoArea > 2*PI the winding is inverted — reverse the ring.
			let geometry: GeoJSON.Polygon = {
				type: "Polygon",
				coordinates: [ring]
			};

			if (geoArea(geometry) > 2 * Math.PI) {
				ring.reverse();
				geometry = {
					type: "Polygon",
					coordinates: [ring]
				};
			}

			dataItem.setRaw("geometry", geometry);
			const mapPolygon = dataItem.get("mapPolygon");
			if (mapPolygon) {
				mapPolygon._setC("geometry", geometry);
			}
		});

		this._applyLinkColors();

		// Compute sums and generate geometries for node shapes
		const nodeType = this.get("nodeType", "circle");
		const nodeWidth = this.get("nodeWidth", 1);

		$array.each(this.nodes.dataItems, (nodeDataItem) => {
			const outgoing = nodeDataItem.get("outgoingLinks") || [];
			const incoming = nodeDataItem.get("incomingLinks") || [];
			const nodeKey = nodeDataItem.get("id")!;

			// Compute sums and store on node data item for tooltip resolution
			let sumOutgoing = 0;
			$array.each(outgoing, (link) => { sumOutgoing += link.get("value") || 0; });
			let sumIncoming = 0;
			$array.each(incoming, (link) => { sumIncoming += link.get("value") || 0; });

			nodeDataItem.setRaw("sumOutgoing", sumOutgoing);
			nodeDataItem.setRaw("sumIncoming", sumIncoming);
			nodeDataItem.setRaw("sum", sumOutgoing + sumIncoming);

			const totalWidth = nodeRange.get(nodeKey) || 0;
			const lon = nodeDataItem.get("longitude");
			const lat = nodeDataItem.get("latitude");
			if (lon == null || lat == null) return;

			let nodeGeo: GeoJSON.Polygon;

			if (nodeType === "bar") {
				const steps = 10;
				const halfSpan = totalWidth / 2 + nodePadding;
				const halfW = nodeWidth / 2;

				const ring: [number, number][] = [];

				if (orientationSetting === "vertical") {
					for (let i = 0; i <= steps; i++) {
						const t = i / steps;
						ring.push([lon - halfSpan + 2 * halfSpan * t, lat - halfW]);
					}
					for (let i = 0; i <= steps; i++) {
						const t = i / steps;
						ring.push([lon + halfSpan, lat - halfW + nodeWidth * t]);
					}
					for (let i = 0; i <= steps; i++) {
						const t = i / steps;
						ring.push([lon + halfSpan - 2 * halfSpan * t, lat + halfW]);
					}
					for (let i = 0; i <= steps; i++) {
						const t = i / steps;
						ring.push([lon - halfSpan, lat + halfW - nodeWidth * t]);
					}
					ring.push([lon - halfSpan, lat - halfW]);
				} else {
					for (let i = 0; i <= steps; i++) {
						const t = i / steps;
						ring.push([lon - halfW, lat - halfSpan + 2 * halfSpan * t]);
					}
					for (let i = 0; i <= steps; i++) {
						const t = i / steps;
						ring.push([lon - halfW + nodeWidth * t, lat + halfSpan]);
					}
					for (let i = 0; i <= steps; i++) {
						const t = i / steps;
						ring.push([lon + halfW, lat + halfSpan - 2 * halfSpan * t]);
					}
					for (let i = 0; i <= steps; i++) {
						const t = i / steps;
						ring.push([lon + halfW - nodeWidth * t, lat - halfSpan]);
					}
					ring.push([lon - halfW, lat - halfSpan]);
				}

				nodeGeo = { type: "Polygon", coordinates: [ring] };
				if (geoArea(nodeGeo) > 2 * Math.PI) {
					ring.reverse();
					nodeGeo = { type: "Polygon", coordinates: [ring] };
				}
			} else {
				const radius = totalWidth / 2 + nodePadding;
				nodeGeo = getGeoCircle({ longitude: lon, latitude: lat }, radius);
			}

			const mapPolygon = nodeDataItem.get("mapPolygon");
			if (mapPolygon) {
				mapPolygon._setC("geometry", nodeGeo);
				// Reorder at display level so nodes render above bands.
				// Avoids Children.moveValue which triggers markDirty() loop.
				this._childrenDisplay.removeChild(mapPolygon._display);
				this._childrenDisplay.addChild(mapPolygon._display);
			}
		});
	}
}
