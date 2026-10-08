import type { DataItem } from "../../core/render/Component";
import type { IGraphics } from "../../core/render/backend/Renderer";
import type { GeoProjection } from "d3-geo";
import type { IPoint } from "../../core/util/IPoint";
import type { ISpritePointerEvent } from "../../core/render/Sprite";

import { geoPath } from "d3-geo";
import { MapPolygonSeries, IMapPolygonSeriesSettings, IMapPolygonSeriesDataItem, IMapPolygonSeriesPrivate } from "./MapPolygonSeries";
import { Graphics } from "../../core/render/Graphics";
import { MapPolygon } from "./MapPolygon";
import { Color } from "../../core/util/Color";

import { isGlobe } from "./MapUtils";

import * as $array from "../../core/util/Array";
import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";

interface IPixelShape {
	// Outline in half-cells east and north; a circle is its center, then east, north, west and south
	points: Array<number>;
	// Spacing along and between rows, relative to step, so the shapes tile
	across: number;
	between: number;
	// Odd rows shift by half a cell
	stagger: boolean;
}

const SHAPES: { [type: string]: IPixelShape } = {
	square: { points: [1, 1, -1, 1, -1, -1, 1, -1], across: 1, between: 1, stagger: false },
	squareStaggered: { points: [1, 1, -1, 1, -1, -1, 1, -1], across: 1, between: 1, stagger: true },
	circle: { points: [0, 0, 1, 0, 0, 2 / Math.sqrt(3), -1, 0, 0, -2 / Math.sqrt(3)], across: 1, between: Math.sqrt(3) / 2, stagger: true },
	circleAligned: { points: [0, 0, 1, 0, 0, 1, -1, 0, 0, -1], across: 1, between: 1, stagger: false },
	hexagon: { points: [0, 4 / 3, 1, 2 / 3, 1, -2 / 3, 0, -4 / 3, -1, -2 / 3, -1, 2 / 3], across: 1, between: Math.sqrt(3) / 2, stagger: true },
	diamond: { points: [0, 2, 1, 0, 0, -2, -1, 0], across: Math.SQRT2, between: Math.SQRT1_2, stagger: true }
};

// Bezier handle length for a quarter circle
const KAPPA = 0.5523;

// Pointer events the pixels pass on to the polygon under the pointer
type PolygonEvent = "click" | "dblclick" | "rightclick" | "middleclick" | "pointerdown" | "pointerup" | "pointerover" | "pointerout";

// How far flat-map columns lean right, per unit of height
const COLUMN_LEAN = 0.35;

// Most pixels a grid holds: a finer step is coarsened to stay under it
const MAX_PIXELS = 500000;

// Finest step, in degrees
const MIN_STEP = 0.001;

// Grid rows from the south pole up: latitude, spacing, first longitude and cell count of each
interface IGridRows {
	rowCount: number;
	rowStep: number;
	rowLat: Array<number>;
	rowLonStep: Array<number>;
	rowStart: Array<number>;
	counts: Array<number>;
}

// Signed area (doubled) of an outline
function polygonArea(xs: ArrayLike<number>, ys: ArrayLike<number>, count: number): number {
	let area = 0;
	for (let q = 0; q < count; q++) {
		const n = (q + 1) % count;
		area += xs[q] * ys[n] - xs[n] * ys[q];
	}
	return area;
}

// Whether a point is inside a convex outline, whichever way it winds
function insideConvex(x: number, y: number, xs: ArrayLike<number>, ys: ArrayLike<number>, start: number, count: number): boolean {
	let sign = 0;
	for (let q = 0; q < count; q++) {
		const a = start + q;
		const b = start + (q + 1) % count;
		const cross = (xs[b] - xs[a]) * (y - ys[a]) - (ys[b] - ys[a]) * (x - xs[a]);
		if (cross != 0) {
			const side = cross > 0 ? 1 : -1;
			if (!sign) {
				sign = side;
			}
			else if (side != sign) {
				return false;
			}
		}
	}
	return true;
}

export interface IPixelMapSeriesPrivate extends IMapPolygonSeriesPrivate {
}

export interface IPixelMapSeriesDataItem extends IMapPolygonSeriesDataItem {
}

export interface IPixelMapSeriesSettings extends IMapPolygonSeriesSettings {

	/**
	 * Distance between the centers of neighbouring pixels, in degrees. With
	 * `uniform`, in degrees as measured at the center of the map.
	 *
	 * Small maps can take a fine step, e.g. `0.01` for a small country. A step
	 * that would make more than 500,000 pixels is coarsened to stay under that,
	 * with a warning in the console.
	 *
	 * @default 2
	 * @since 5.21.0
	 */
	step?: number;

	/**
	 * Size of a pixel relative to `step`. At `1` neighbouring pixels touch.
	 *
	 * @default 0.8
	 * @since 5.21.0
	 */
	pixelSize?: number;

	/**
	 * Shape of a pixel. At a `pixelSize` of `1` pixels fit edge to edge;
	 * `stagger` sets how rows line up.
	 *
	 * @default "square"
	 * @since 5.21.0
	 */
	pixelType?: "square" | "circle" | "diamond" | "hexagon";

	/**
	 * Shifts every other row by half a pixel, like bricks in a wall.
	 *
	 * Squares line up in columns unless this is `true`; circles are staggered
	 * unless this is `false`. Hexagons and diamonds are always staggered, as
	 * that is the only way they fit together.
	 *
	 * Not set by default, so each shape packs its own way.
	 *
	 * @since 5.21.0
	 */
	stagger?: boolean;

	/**
	 * Spreads pixels evenly over the globe, with fewer per row towards the
	 * poles. The count changes in bands of rows: within a band pixels line up
	 * exactly, and the pattern shifts where one band meets the next.
	 *
	 * Set to `false` for the same number of pixels in every row, which lines up
	 * across the whole map; on a globe pixels then crowd towards the poles.
	 *
	 * @default true
	 * @since 5.21.0
	 */
	equalArea?: boolean;

	/**
	 * Draws every pixel as wide as a pixel on the equator, with straight sides,
	 * whatever its latitude. Pixels no longer narrow towards the poles, so
	 * they overlap there (most with `equalArea: false`).
	 *
	 * Does not apply with `uniform`.
	 *
	 * @default false
	 * @since 5.21.0
	 */
	equalWidth?: boolean;

	/**
	 * Lays pixels out on a grid that is even on screen, all the same size and
	 * upright, like a pixel image of the map. The grid scales with zoom;
	 * rotating the map samples it again, so the grid stays level.
	 *
	 * `equalArea` does not apply.
	 *
	 * @default false
	 * @since 5.21.0
	 */
	uniform?: boolean;

	/**
	 * Raises pixels into 3D columns. The tallest column is this share of the
	 * globe's radius; on flat maps columns rise up the screen by the same
	 * measure.
	 *
	 * `0` keeps pixels flat. Does not apply with `uniform`.
	 *
	 * A column just behind a globe's edge shows where it rises past the edge.
	 *
	 * @default 0
	 * @since 5.21.0
	 */
	columnHeight?: number;

	/**
	 * A function that returns the height of each pixel's column, from `0` to
	 * `1` of `columnHeight`.
	 *
	 * Without it, columns take their polygon's `pixelHeight` setting, which
	 * heat rules can set:
	 *
	 * ```TypeScript
	 * series.set("heatRules", [{
	 *   target: series.mapPolygons.template,
	 *   dataField: "value",
	 *   min: 0.1,
	 *   max: 1,
	 *   key: "pixelHeight"
	 * }]);
	 * ```
	 * ```JavaScript
	 * series.set("heatRules", [{
	 *   target: series.mapPolygons.template,
	 *   dataField: "value",
	 *   min: 0.1,
	 *   max: 1,
	 *   key: "pixelHeight"
	 * }]);
	 * ```
	 *
	 * Polygons without that setting follow their value, from the series'
	 * lowest to its highest (set `calculateAggregates: true`); those with no
	 * value stay flat. Without any values every column is full height.
	 *
	 * NOTE: a function is not saved when the chart is serialized to JSON. Heights
	 * set with heat rules are.
	 *
	 * @since 5.21.0
	 */
	pixelHeightFunction?: (dataItem: DataItem<IPixelMapSeriesDataItem>, longitude: number, latitude: number) => number;
}

/**
 * Shows the polygons of a map as a grid of pixels.
 *
 * Each pixel takes the fill of the polygon it falls in, so heat rules,
 * `templateField` and states work as in [[MapPolygonSeries]]. The polygons
 * stay, invisible, to handle tooltips, hover and clicks.
 *
 * Pixels have no outline by default. Set `strokeWidth` (and `stroke`) on
 * `mapPolygons.template` to outline each pixel in its polygon's stroke.
 *
 * In SVG export ([[renderToSVG]]) each polygon's flat pixels are a group
 * with the polygon's `id` and `data-name`. Export just the pixels with
 * `am5.renderToSVG(series.pixels)`.
 *
 * Pixels lie on the surface of the map, so on a globe they turn and shrink
 * towards the edge. With `uniform: true` they sit on an even grid on screen
 * instead.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/pixel-map-series/} for more information
 * @important
 * @since 5.21.0
 */
export class PixelMapSeries extends MapPolygonSeries {

	public static className: string = "PixelMapSeries";
	public static classNames: Array<string> = MapPolygonSeries.classNames.concat([PixelMapSeries.className]);

	declare public _settings: IPixelMapSeriesSettings;
	declare public _privateSettings: IPixelMapSeriesPrivate;
	declare public _dataItemSettings: IPixelMapSeriesDataItem;

	/**
	 * The element that draws all pixels.
	 */
	public readonly pixels: Graphics = this.children.push(Graphics._new(this._root, {
		themeTags: ["pixels"],
		isMeasured: false
	})._markC("themeTags", "isMeasured"));

	// Every pixel's whole cell, invisible, where the pointer is tested, so the
	// gaps between a polygon's pixels count as the polygon
	protected _hitArea: Graphics = this.children.push(Graphics._new(this._root, {
		themeTags: ["pixels", "hit"],
		isMeasured: false,
		opacity: 0
	})._markC("themeTags", "isMeasured", "opacity"));

	// The grid: pixel coordinates, grouped by the data item they belong to
	protected _gridDirty: boolean = true;
	protected _positionsDirty: boolean = true;
	protected _lon: Float64Array = new Float64Array(0);
	protected _lat: Float64Array = new Float64Array(0);
	protected _halfLon: Float64Array = new Float64Array(0);
	protected _halfLat: number = 0;
	protected _unit: Float64Array = new Float64Array(0);
	protected _owners: Array<DataItem<this["_dataItemSettings"]>> = [];
	protected _ownerStart: Uint32Array = new Uint32Array(1);

	// Projected outline points of each pixel ([[SHAPES]] order)
	protected _vx: Float64Array = new Float64Array(0);
	protected _vy: Float64Array = new Float64Array(0);
	// 1 when in view; 2 when behind a globe's edge, where only a column shows
	protected _shown: Uint8Array = new Uint8Array(0);

	// Columns: height (0 to 1) and owner of each pixel, and how near the viewer it is on a globe
	protected _height: Float32Array = new Float32Array(0);
	protected _heightsDirty: boolean = true;
	protected _pixelOwner: Uint32Array = new Uint32Array(0);
	protected _depth: Float64Array = new Float64Array(0);

	// The polygon under the pointer
	protected _hovered?: MapPolygon;

	// The step the grid was built with, and the one last warned about as too fine
	protected _step: number = 2;
	protected _warnedStep?: number;

	// Whether the hit area's interactivity needs working out again
	protected _interactionDirty: boolean = true;

	// The map moved while the series was hidden
	protected _projectionStale: boolean = false;

	// With uniform: pixel centers on screen, and the grid spacing
	protected _x: Float64Array = new Float64Array(0);
	protected _y: Float64Array = new Float64Array(0);
	protected _spacing: number = 0;

	// The projection the positions were made with, and where a few geo points
	// fell then, to tell later whether it changed
	protected _view?: { projection: GeoProjection, scale: number, x: number, y: number, clip: string, geo: Array<Array<number>>, probes: Array<number> };

	protected _afterNew() {
		super._afterNew();

		this.pixels._setC("draw", (display) => {
			this._drawPixels(display);
		});

		const hitArea = this._hitArea;
		hitArea._setC("draw", (display) => {
			this._drawHitArea(display);
		});
		hitArea.states.create("default", {})._setC("opacity", 0);

		// Moves count only while the pointer is over the hit area, not over
		// something drawn on top of it
		let over = false;
		const move = (event: ISpritePointerEvent) => {
			const mapPolygon = this._pointerPolygon(event);
			if (mapPolygon !== this._hovered) {
				this._setHovered(mapPolygon, event);
			}
			else if (mapPolygon && mapPolygon.get("tooltipPosition") == "pointer") {
				mapPolygon.showTooltip(event.point);
			}
		};
		this._disposers.push(hitArea.events.on("pointerover", (event) => {
			over = true;
			move(event);
		}));
		this._disposers.push(hitArea.events.on("globalpointermove", (event) => {
			if (over) {
				move(event);
			}
		}));
		this._disposers.push(hitArea.events.on("pointerout", () => {
			over = false;
			this._setHovered(undefined);
		}));
		$array.each(["click", "dblclick", "rightclick", "middleclick", "pointerdown", "pointerup"] as Array<PolygonEvent>, (type) => {
			this._disposers.push(hitArea.events.on(type, (event: ISpritePointerEvent) => {
				const mapPolygon = this._pointerPolygon(event);
				if (mapPolygon) {
					this._dispatch(mapPolygon, type, event);
				}
			}));
		});
	}

	// Whether a polygon takes the pointer, as it would in a MapPolygonSeries
	protected _takesPointer(mapPolygon: MapPolygon): boolean {
		return !!(mapPolygon.get("interactive") || mapPolygon.get("tooltipText") || mapPolygon.get("tooltipHTML"));
	}

	// The polygon under the pointer, if it takes the pointer
	protected _pointerPolygon(event: ISpritePointerEvent): MapPolygon | undefined {
		const mapPolygon = this.getPolygonByPoint(event.point);
		return mapPolygon && this._takesPointer(mapPolygon) ? mapPolygon : undefined;
	}

	/**
	 * The hit area takes part in hit testing only when some polygon would have,
	 * by its own settings or its template's.
	 */
	protected _updateInteraction() {
		this._interactionDirty = false;
		let interactive = false;
		this.mapPolygons.each((mapPolygon) => {
			if (!interactive && this._takesPointer(mapPolygon)) {
				interactive = true;
			}
		});
		const hitArea = this._hitArea;
		if (hitArea.get("interactive") !== interactive) {
			hitArea._setC("interactive", interactive);
			hitArea._markDirtyKey("draw");
		}
		const cursor = this.mapPolygons.template.get("cursorOverStyle");
		if (hitArea.get("cursorOverStyle") !== cursor) {
			hitArea._setC("cursorOverStyle", cursor);
		}
	}

	protected _markInteractionDirty() {
		this._interactionDirty = true;
		this.markDirty();
	}

	protected _setHovered(mapPolygon: MapPolygon | undefined, event?: ISpritePointerEvent) {
		const previous = this._hovered;
		this._hovered = mapPolygon;
		if (previous && !previous.isDisposed()) {
			previous.unhover();
			this._dispatch(previous, "pointerout", event);
		}
		if (mapPolygon && event) {
			// Tooltip first, so a pointer-positioned one starts at the pointer
			mapPolygon.showTooltip(event.point);
			mapPolygon.hover();
			this._dispatch(mapPolygon, "pointerover", event);
		}
	}

	protected _dispatch(mapPolygon: MapPolygon, type: PolygonEvent, event?: ISpritePointerEvent) {
		const events = mapPolygon.events;
		if (event && events.isEnabled(type)) {
			events.dispatch(type, {
				type: type,
				target: mapPolygon,
				originalEvent: event.originalEvent,
				point: event.point,
				simulated: event.simulated
			});
		}
	}

	// Tagged, so the theme gives pixels no outline unless one is set
	protected _newMapPolygon(): MapPolygon {
		const template = this.mapPolygons.template;
		return MapPolygon._new(this._root, {
			themeTags: $utils.mergeTags(template.get("themeTags", []), ["pixel"])
		}, [template])._markC("themeTags");
	}

	/**
	 * @ignore
	 */
	public makeMapPolygon(dataItem: DataItem<this["_dataItemSettings"]>): MapPolygon {
		const mapPolygon = super.makeMapPolygon(dataItem);

		// Never drawn: the polygon holds fills, states, tooltips and events, and
		// the pixels pass the pointer on to it
		mapPolygon._setC("forceHidden", true);
		mapPolygon._setC("forceInactive", true);

		const interaction = () => this._markInteractionDirty();
		mapPolygon.on("interactive", interaction);
		mapPolygon.on("tooltipText", interaction);
		mapPolygon.on("tooltipHTML", interaction);
		mapPolygon.on("cursorOverStyle", interaction);
		this._markInteractionDirty();

		const recolor = () => this._markPixelsDirty();
		const reshape = () => this._markShapesDirty();
		mapPolygon.on("fill", recolor);
		mapPolygon.on("fillOpacity", recolor);
		mapPolygon.on("stroke", recolor);
		mapPolygon.on("strokeWidth", recolor);
		mapPolygon.on("strokeOpacity", recolor);
		mapPolygon.on("visible", reshape);
		mapPolygon.onPrivate("visible", reshape);
		mapPolygon.on("pixelHeight", () => {
			this._heightsDirty = true;
			this._markShapesDirty();
		});
		return mapPolygon;
	}

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		// Polygons are not drawn, so they are not projected again
		if (this.isVisible()) {
			this._markShapesDirty();
		}
		else {
			this._projectionStale = true;
		}
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this._projectionStale && this.isVisible()) {
			this._projectionStale = false;
			this._markShapesDirty();
		}

		if (this._interactionDirty) {
			this._updateInteraction();
		}

		if (this.isDirty("step") || this.isDirty("equalArea") || this.isDirty("pixelType") || this.isDirty("stagger") || this.isDirty("uniform") || this.isDirty("include") || this.isDirty("exclude")) {
			this._markGridDirty();
		}
		if (this.isDirty("pixelSize") || this.isDirty("equalWidth")) {
			if (!this.get("uniform", false)) {
				this._positionsDirty = true;
			}
			this._markShapesDirty();
		}
		if (this.isDirty("pixelHeightFunction") || this._valuesDirty) {
			this._heightsDirty = true;
			this._markShapesDirty();
		}
		if (this.isDirty("columnHeight")) {
			// Taller columns show from further behind a globe's edge
			if (!this.get("uniform", false)) {
				this._positionsDirty = true;
			}
			this._markShapesDirty();
		}
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);
		this._markGridDirty();
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		this._markGridDirty();
	}

	/**
	 * Redraws the pixels of `dataItem`, laying them out again if its geometry
	 * changed.
	 *
	 * @param  dataItem  Data item whose pixels to redraw
	 */
	public markDirtyValues(dataItem: DataItem<this["_dataItemSettings"]>) {
		// Only a new geometry moves pixels; other changes (values, visibility)
		// need heights and a redraw at most
		const mapPolygon = dataItem ? dataItem.get("mapPolygon") : undefined;
		const reshaped = !!mapPolygon && mapPolygon.get("geometry") !== dataItem.get("geometry");
		super.markDirtyValues(dataItem);
		if (reshaped) {
			this._markGridDirty();
		}
		else {
			this._heightsDirty = true;
			this._markShapesDirty();
		}
	}

	// Left out by `include` or `exclude`: no pixels, and no share of the pixel
	// budget. Read from the settings, as `MapSeries` applies them
	protected _isLeftOut(dataItem: DataItem<this["_dataItemSettings"]>): boolean {
		const id = dataItem.get("id");
		const include = this.get("include");
		const exclude = this.get("exclude");
		return !!id && ((!!exclude && exclude.indexOf(id) != -1) || (!!include && include.indexOf(id) == -1));
	}

	protected _markGridDirty() {
		this._gridDirty = true;
		this._positionsDirty = true;
		this._markShapesDirty();
	}

	// Colors only: the hit area stays as it is
	protected _markPixelsDirty() {
		if (this.pixels) {
			this.pixels._markDirtyKey("draw");
		}
	}

	protected _markShapesDirty() {
		this._markPixelsDirty();
		if (this._hitArea) {
			this._hitArea._markDirtyKey("draw");
		}
	}

	/**
	 * Lays pixels out again if the projection changed in more than scale and
	 * translation.
	 */
	protected _prepareLayout(projection: GeoProjection) {
		if (!this._gridDirty && !this._positionsDirty && !this._viewHolds(projection)) {
			if (this.get("uniform", false)) {
				this._gridDirty = true;
			}
			else {
				this._positionsDirty = true;
			}
		}
		this._layOut(projection);
	}

	protected _visibleOwners(): Array<boolean> {
		const visible: Array<boolean> = [];
		const owners = this._owners;
		for (let o = 0; o < owners.length; o++) {
			const dataItem = owners[o];
			const mapPolygon = dataItem.get("mapPolygon");
			visible.push(!!mapPolygon && mapPolygon.get("visible", true) && mapPolygon.getPrivate("visible", true) && !dataItem.isHidden() && !!mapPolygon.get("fill"));
		}
		return visible;
	}

	/**
	 * A closed copy of a ring whose longitudes do not jump across the
	 * antimeridian (they may run past 180). A ring that goes round a pole is
	 * closed along that pole.
	 */
	protected _unwrapRing(ring: Array<Array<number>>): Array<Array<number>> {
		const n = ring.length;
		const out: Array<Array<number>> = [];
		if (!n) {
			return out;
		}
		let shift = 0;
		let latitudes = 0;
		for (let j = 0; j <= n; j++) {
			const point = ring[j % n];
			if (j > 0) {
				const jump = point[0] - ring[j - 1][0];
				if (jump > 180) {
					shift -= 360;
				}
				else if (jump < -180) {
					shift += 360;
				}
			}
			out.push([point[0] + shift, point[1]]);
			latitudes += point[1];
		}
		if (shift != 0) {
			const pole = latitudes < 0 ? -90 : 90;
			out.push([out[n][0], pole], [out[0][0], pole]);
		}
		return out;
	}

	/**
	 * Puts a pixel on every grid point that falls inside a polygon, by
	 * scanning each grid row across the polygon's edges.
	 *
	 * Only the cells inside polygons are kept, so a fine step costs memory in
	 * proportion to the pixels, not to the whole globe.
	 */
	protected _buildGrid() {
		this._gridDirty = false;

		const shape = this._shape();
		const equalArea = this.get("equalArea", true);

		// Rings of each data item's polygons, unwrapped, with holes in the outline's 360 degree window
		const sources: Array<{ dataItem: DataItem<IPixelMapSeriesDataItem>, polygons: Array<Array<Array<Array<number>>>> }> = [];
		let estimate = 0;
		for (let i = 0; i < this.dataItems.length; i++) {
			const dataItem = this.dataItems[i];
			const geometry = dataItem.get("geometry");
			if (!geometry || this._isLeftOut(dataItem)) {
				continue;
			}
			const polygons: Array<Array<Array<Array<number>>>> = geometry.type == "Polygon"
				? [geometry.coordinates as Array<Array<Array<number>>>]
				: geometry.type == "MultiPolygon" ? geometry.coordinates as Array<Array<Array<Array<number>>>> : [];

			const unwrapped: Array<Array<Array<Array<number>>>> = [];
			for (let p = 0; p < polygons.length; p++) {
				const rings = polygons[p].map((ring) => this._unwrapRing(ring));
				if (!rings.length || !rings[0].length) {
					continue;
				}
				let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
				$array.each(rings[0], (point) => {
					west = Math.min(west, point[0]);
					east = Math.max(east, point[0]);
					south = Math.min(south, point[1]);
					north = Math.max(north, point[1]);
				});
				for (let k = 1; k < rings.length; k++) {
					const hole = rings[k];
					if (hole.length) {
						const shift = hole[0][0] < west ? 360 : (hole[0][0] > east ? -360 : 0);
						if (shift) {
							rings[k] = hole.map((point) => [point[0] + shift, point[1]]);
						}
					}
				}
				unwrapped.push(rings);

				// Cells in the bounding box at a step of 1, for a first guess at the pixel count
				const widest = south <= 0 && north >= 0 ? 1 : Math.cos(Math.min(Math.abs(south), Math.abs(north)) * $math.RADIANS);
				estimate += (north - south) / shape.between * Math.min(360, east - west) * (equalArea ? widest : 1) / shape.across;
			}
			sources.push({ dataItem, polygons: unwrapped });
		}

		// A step too fine for the pixel budget is coarsened: first by the
		// bounding boxes, so the scan stays quick, then by the scan's own count,
		// which can also take back what the boxes coarsened too much
		const requested = this.get("step", 2);
		const minStep = Math.max(MIN_STEP, requested);
		let step = minStep;
		if (estimate / (step * step) > MAX_PIXELS * 4) {
			step = Math.sqrt(estimate / (MAX_PIXELS * 4));
		}
		const polygons = sources.map((source) => source.polygons);
		let rows = this._gridRows(step, shape, equalArea);
		let scan = this._gridSpans(polygons, rows);
		if (scan.count > MAX_PIXELS || (step > minStep && scan.count < MAX_PIXELS / 2)) {
			step = Math.max(minStep, step * Math.sqrt(scan.count / MAX_PIXELS) * 1.02);
			rows = this._gridRows(step, shape, equalArea);
			scan = this._gridSpans(polygons, rows);
			if (scan.count > MAX_PIXELS) {
				step *= Math.sqrt(scan.count / MAX_PIXELS) * 1.02;
				rows = this._gridRows(step, shape, equalArea);
				scan = this._gridSpans(polygons, rows);
			}
		}
		this._step = step;
		this._warnCoarse(requested, step);

		const { rowCount, rowStep, rowLat, rowLonStep, rowStart, counts } = rows;

		// The cells each row takes, and which data item they belong to; the
		// first polygon to reach a cell keeps it
		const taken: Array<Map<number, number> | undefined> = [];
		const owners: Array<DataItem<this["_dataItemSettings"]>> = [];
		const ownerCounts: Array<number> = [];
		for (let o = 0; o < sources.length; o++) {
			const spans = scan.spans[o];
			let count = 0;
			for (let s = 0; s < spans.length; s += 3) {
				const r = spans[s];
				const cellCount = counts[r];
				const cells = taken[r] || (taken[r] = new Map());
				for (let c = spans[s + 1]; c <= spans[s + 2]; c++) {
					const cell = ((c % cellCount) + cellCount) % cellCount;
					if (!cells.has(cell)) {
						cells.set(cell, o);
						count++;
					}
				}
			}
			owners.push(sources[o].dataItem);
			ownerCounts.push(count);
		}

		// Pixels grouped by owner, so each polygon's pixels share one fill
		const starts = new Uint32Array(owners.length + 1);
		for (let o = 0; o < owners.length; o++) {
			starts[o + 1] = starts[o] + ownerCounts[o];
		}
		const total = starts[owners.length];
		const lon = new Float64Array(total);
		const lat = new Float64Array(total);
		const halfLon = new Float64Array(total);
		const unit = new Float64Array(total * 3);
		const next = starts.slice(0, owners.length);

		for (let r = 0; r < rowCount; r++) {
			const cells = taken[r];
			if (!cells) {
				continue;
			}
			const keys = Array.from(cells.keys()).sort((a, b) => a - b);
			for (let j = 0; j < keys.length; j++) {
				const c = keys[j];
				const i = next[cells.get(c)!]++;
				const lo = rowStart[r] + c * rowLonStep[r];
				const la = rowLat[r];
				lon[i] = lo;
				lat[i] = la;
				halfLon[i] = rowLonStep[r] / 2;
				const cosLat = Math.cos(la * $math.RADIANS);
				unit[i * 3] = cosLat * Math.cos(lo * $math.RADIANS);
				unit[i * 3 + 1] = cosLat * Math.sin(lo * $math.RADIANS);
				unit[i * 3 + 2] = Math.sin(la * $math.RADIANS);
			}
		}

		this._owners = owners;
		this._ownerStart = starts;
		this._lon = lon;
		this._lat = lat;
		this._halfLon = halfLon;
		this._halfLat = rowStep / 2;
		this._unit = unit;
		this._x = new Float64Array(0);
		this._y = new Float64Array(0);
		this._shown = new Uint8Array(total);
		this._depth = new Float64Array(total);
		this._height = new Float32Array(total);
		this._pixelOwner = new Uint32Array(total);
		for (let o = 0; o < owners.length; o++) {
			this._pixelOwner.fill(o, starts[o], starts[o + 1]);
		}
		this._positionsDirty = true;
		this._heightsDirty = true;
	}

	protected _warnCoarse(requested: number, step: number) {
		if (step > Math.max(MIN_STEP, requested) && this._warnedStep !== requested) {
			this._warnedStep = requested;
			console.warn("PixelMapSeries: a step of " + requested + " would make more than " + MAX_PIXELS + " pixels, so " + $math.round(step, 4) + " is used.");
		}
	}

	/**
	 * Grid rows for a step: each row's latitude, spacing, first longitude and
	 * number of cells.
	 */
	protected _gridRows(step: number, shape: IPixelShape, equalArea: boolean): IGridRows {
		const stagger = shape.stagger;

		// Rows from the south pole up; each has its own spacing and start
		const rowCount = Math.max(1, Math.round(180 / (step * shape.between)));
		const rowStep = 180 / rowCount;

		const counts: Array<number> = [];
		for (let r = 0; r < rowCount; r++) {
			const lat = -90 + rowStep * (r + 0.5);
			const wanted = step * shape.across / (equalArea ? Math.max(Math.cos(lat * $math.RADIANS), 0.001) : 1);
			counts.push(Math.max(1, Math.round(360 / wanted)));
		}

		// Pixels line up only between rows with as many cells, so rows share a
		// count in bands, from the equator out, stretching cells at most 15%
		if (equalArea) {
			const band = (from: number, to: number, direction: number) => {
				let first = from;
				while (first != to) {
					let last = first;
					while (last + direction != to && counts[first] / counts[last + direction] <= 1.15 * 1.15) {
						last += direction;
					}
					const count = Math.max(1, Math.round(Math.sqrt(counts[first] * counts[last])));
					for (let r = first; r != last + direction; r += direction) {
						counts[r] = count;
					}
					first = last + direction;
				}
			};
			const middle = Math.floor(rowCount / 2);
			band(middle, rowCount, 1);
			band(rowCount % 2 ? middle : middle - 1, -1, -1);
		}

		const rowLat: Array<number> = [];
		const rowLonStep: Array<number> = [];
		const rowStart: Array<number> = [];
		for (let r = 0; r < rowCount; r++) {
			const lonStep = 360 / counts[r];
			rowLat.push(-90 + rowStep * (r + 0.5));
			rowLonStep.push(lonStep);
			rowStart.push(-180 + lonStep * (stagger && r % 2 ? 1 : 0.5));
		}

		return { rowCount, rowStep, rowLat, rowLonStep, rowStart, counts };
	}

	/**
	 * The runs of cells inside each owner's polygons, as `row, first cell, last
	 * cell` triples (cells may run past a row's end, and wrap), and how many
	 * cells they cover in all.
	 */
	protected _gridSpans(sources: Array<Array<Array<Array<Array<number>>>>>, rows: IGridRows): { spans: Array<Array<number>>, count: number } {
		const { rowCount, rowStep, rowLat, rowLonStep, rowStart, counts } = rows;
		const spans: Array<Array<number>> = [];
		let total = 0;

		for (let o = 0; o < sources.length; o++) {
			const out: Array<number> = [];
			const polygons = sources[o];

			for (let p = 0; p < polygons.length; p++) {
				// Where each row crosses the polygon's edges (holes included)
				const crossings: { [row: number]: Array<number> } = {};
				const rings = polygons[p];

				for (let k = 0; k < rings.length; k++) {
					const ring = rings[k];
					const n = ring.length;
					for (let j = 0; j < n; j++) {
						const a = ring[j];
						const b = ring[(j + 1) % n];
						if (a[1] == b[1]) {
							continue;
						}
						const yMin = Math.min(a[1], b[1]);
						const yMax = Math.max(a[1], b[1]);
						const r0 = Math.max(0, Math.ceil((yMin + 90) / rowStep - 0.5));
						const r1 = Math.min(rowCount - 1, Math.ceil((yMax + 90) / rowStep - 0.5) - 1);
						for (let r = r0; r <= r1; r++) {
							const lat = rowLat[r];
							if (lat >= yMin && lat < yMax) {
								(crossings[r] = crossings[r] || []).push(a[0] + (lat - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
							}
						}
					}
				}

				// Grid points between each pair of crossings are inside; the
				// crossings may run past 180, so cells wrap around
				for (const key in crossings) {
					const r = +key;
					const xs = crossings[r].sort((u, v) => u - v);
					const cellCount = counts[r];
					const lonStep = rowLonStep[r];
					const start = rowStart[r];
					for (let j = 0; j + 1 < xs.length; j += 2) {
						const c0 = Math.ceil((xs[j] - start) / lonStep);
						const c1 = Math.min(Math.floor((xs[j + 1] - start) / lonStep), c0 + cellCount - 1);
						if (c1 >= c0) {
							out.push(r, c0, c1);
							total += c1 - c0 + 1;
						}
					}
				}
			}
			spans.push(out);
		}

		return { spans, count: total };
	}

	/**
	 * Works out each pixel's column height, from 0 to 1.
	 */
	protected _computeHeights() {
		this._heightsDirty = false;

		// Anything but a function is ignored
		const setting = this.get("pixelHeightFunction");
		const pixelHeightFunction = typeof setting == "function" ? setting : undefined;
		const low = this.getPrivate("valueLow") as number | undefined;
		const high = this.getPrivate("valueHigh") as number | undefined;
		const heights = this._height;
		const owners = this._owners;
		const starts = this._ownerStart;

		for (let o = 0; o < owners.length; o++) {
			const dataItem = owners[o];
			let polygonHeight = 1;
			if (!pixelHeightFunction) {
				const mapPolygon = dataItem.get("mapPolygon");
				const own = mapPolygon ? mapPolygon.get("pixelHeight") : undefined;
				const value = dataItem.get("value") as number | undefined;
				if (own != null) {
					polygonHeight = own;
				}
				else if (low != null && high != null && high > low) {
					polygonHeight = value != null ? (value - low) / (high - low) : 0;
				}
			}
			for (let i = starts[o]; i < starts[o + 1]; i++) {
				const h = pixelHeightFunction ? pixelHeightFunction(dataItem as any, this._lon[i], this._lat[i]) : polygonHeight;
				heights[i] = Math.max(0, Math.min(1, h || 0));
			}
		}
	}

	protected _shape(): IPixelShape {
		const type = this.get("pixelType", "square");
		const stagger = this.get("stagger");
		if (type == "square" && stagger) {
			return SHAPES.squareStaggered;
		}
		if (type == "circle" && stagger === false) {
			return SHAPES.circleAligned;
		}
		return SHAPES[type] || SHAPES.square;
	}

	/**
	 * Puts a pixel on every point of an even screen grid that falls inside a
	 * polygon as the map draws it (projected, clipped and cut).
	 */
	protected _buildScreenGrid(projection: GeoProjection) {
		this._gridDirty = false;
		this._positionsDirty = false;

		const scale = projection.scale();
		const translate = projection.translate();
		const originX = translate[0];
		const originY = translate[1];
		const shape = this._shape();

		// A step too fine for the pixel budget is coarsened: first by the map's
		// area on screen, so the scan stays quick, then by the scan's own count
		const requested = this.get("step", 2);
		const minStep = Math.max(MIN_STEP, requested);
		let step = minStep;
		const geometries: Array<GeoJSON.Geometry> = [];
		$array.each(this.dataItems, (dataItem) => {
			const geometry = dataItem.get("geometry");
			if (geometry && !this._isLeftOut(dataItem)) {
				geometries.push(geometry);
			}
		});
		const bounds = geoPath(projection).bounds({ type: "GeometryCollection", geometries: geometries });
		const area = (bounds[1][0] - bounds[0][0]) * (bounds[1][1] - bounds[0][1]);
		const unit = $math.RADIANS * scale;
		if (area > 0 && area / (step * unit * step * unit * shape.across * shape.between) > MAX_PIXELS * 4) {
			step = Math.sqrt(area / (MAX_PIXELS * 4 * shape.across * shape.between)) / unit;
		}

		const stagger = shape.stagger;
		const scanAt = (step: number) => {
			const spacing = step * unit;
			const across = spacing * shape.across;
			const between = spacing * shape.between;
			const owners: Array<DataItem<this["_dataItemSettings"]>> = [];
			const ownerPoints: Array<Array<number>> = [];
			const taken = new Set<number>();
			let count = 0;

			// Rings as flat x, y lists
			let rings: Array<Array<number>> = [];
			let ring: Array<number> = [];
			const path = geoPath(projection, {
				moveTo: (x, y) => {
					ring = [x, y];
					rings.push(ring);
				},
				lineTo: (x, y) => {
					ring.push(x, y);
				},
				closePath: () => { },
				beginPath: () => { },
				arc: () => { }
			});

			for (let d = 0; d < this.dataItems.length; d++) {
				const dataItem = this.dataItems[d];
				const geometry = dataItem.get("geometry");
				if (!geometry || this._isLeftOut(dataItem)) {
					continue;
				}

				rings = [];
				path(geometry);

				// Where each grid row crosses the rings' edges
				const crossings: { [row: number]: Array<number> } = {};
				for (let k = 0; k < rings.length; k++) {
					const points = rings[k];
					const n = points.length;
					for (let j = 0; j < n; j += 2) {
						const ax = points[j];
						const ay = points[j + 1];
						const bx = points[(j + 2) % n];
						const by = points[(j + 3) % n];
						if (ay == by) {
							continue;
						}
						const yMin = Math.min(ay, by);
						const yMax = Math.max(ay, by);
						const r1 = Math.ceil((yMax - originY) / between) - 1;
						for (let r = Math.ceil((yMin - originY) / between); r <= r1; r++) {
							const y = originY + r * between;
							if (y >= yMin && y < yMax) {
								(crossings[r] = crossings[r] || []).push(ax + (y - ay) * (bx - ax) / (by - ay));
							}
						}
					}
				}

				// Grid points between each pair of crossings are inside
				const points: Array<number> = [];
				for (const key in crossings) {
					const r = +key;
					const xs = crossings[r].sort((u, v) => u - v);
					const y = originY + r * between;
					const left = originX + (stagger && (r & 1) ? across / 2 : 0);
					for (let j = 0; j + 1 < xs.length; j += 2) {
						const c1 = Math.floor((xs[j + 1] - left) / across);
						for (let c = Math.ceil((xs[j] - left) / across); c <= c1; c++) {
							const cell = r * 4194304 + c;
							if (!taken.has(cell)) {
								taken.add(cell);
								points.push(left + c * across, y);
							}
						}
					}
				}

				owners.push(dataItem);
				ownerPoints.push(points);
				count += points.length / 2;
			}
			return { owners, ownerPoints, spacing, count };
		};

		let grid = scanAt(step);
		if (grid.count > MAX_PIXELS || (step > minStep && grid.count < MAX_PIXELS / 2)) {
			step = Math.max(minStep, step * Math.sqrt(grid.count / MAX_PIXELS) * 1.02);
			grid = scanAt(step);
			if (grid.count > MAX_PIXELS) {
				step *= Math.sqrt(grid.count / MAX_PIXELS) * 1.02;
				grid = scanAt(step);
			}
		}
		this._step = step;
		this._warnCoarse(requested, step);
		const { owners, ownerPoints, spacing } = grid;

		const starts = new Uint32Array(owners.length + 1);
		for (let o = 0; o < owners.length; o++) {
			starts[o + 1] = starts[o] + ownerPoints[o].length / 2;
		}
		const total = starts[owners.length];
		const x = new Float64Array(total);
		const y = new Float64Array(total);
		for (let o = 0; o < owners.length; o++) {
			const points = ownerPoints[o];
			for (let j = 0, i = starts[o]; j < points.length; j += 2, i++) {
				x[i] = points[j];
				y[i] = points[j + 1];
			}
		}

		this._owners = owners;
		this._ownerStart = starts;
		this._lon = new Float64Array(0);
		this._lat = new Float64Array(0);
		this._halfLon = new Float64Array(0);
		this._unit = new Float64Array(0);
		this._x = x;
		this._y = y;
		this._spacing = spacing;
		this._pixelOwner = new Uint32Array(total);
		for (let o = 0; o < owners.length; o++) {
			this._pixelOwner.fill(o, starts[o], starts[o + 1]);
		}
		this._vx = new Float64Array(0);
		this._vy = new Float64Array(0);
		this._shown = new Uint8Array(total).fill(1);

		// Geo points under a few pixels, to notice when the projection changes
		const geo: Array<Array<number>> = [];
		if (total && projection.invert) {
			const indexes = [0, total >> 1, total - 1];
			for (let j = 0; j < indexes.length; j++) {
				const point = projection.invert([x[indexes[j]], y[indexes[j]]]);
				if (point && isFinite(point[0]) && isFinite(point[1])) {
					geo.push(point);
				}
			}
		}
		this._setView(projection, geo);
	}

	protected _setView(projection: GeoProjection, geo: Array<Array<number>>) {
		const translate = projection.translate();
		this._view = {
			projection,
			scale: projection.scale(),
			x: translate[0],
			y: translate[1],
			clip: this._clipKey(projection),
			geo,
			probes: this._probe(projection, geo)
		};
	}

	/**
	 * Projects the outline points of every pixel at their own latitude and
	 * longitude, and marks the pixels a clipped projection (a globe) hides
	 * behind its horizon.
	 */
	protected _projectPixels(projection: GeoProjection) {
		this._positionsDirty = false;

		const lon = this._lon;
		const lat = this._lat;
		const halfLon = this._halfLon;
		const unit = this._unit;
		const shown = this._shown;
		const total = lon.length;
		const points = this._shape().points;
		const corners = points.length / 2;
		const size = this.get("pixelSize", 0.8);
		const halfLat = this._halfLat * size;

		// Half a pixel's width on the equator, in degrees
		const equalWidth = this.get("equalWidth", false);
		const equatorWidth = this._step * this._shape().across / 2 * size;

		if (this._vx.length != total * corners) {
			this._vx = new Float64Array(total * corners);
			this._vy = new Float64Array(total * corners);
		}
		const vx = this._vx;
		const vy = this._vy;

		// The visible cap of a clipped projection: points within the clip angle
		// of the view center (unclipped projections report 0)
		const clipAngle = projection.clipAngle ? projection.clipAngle() : 0;
		const rotation = projection.rotate ? projection.rotate() : [0, 0, 0];
		let cx = 0, cy = 0, cz = 0, minDot = -2;
		if (clipAngle) {
			const centerLon = -rotation[0] * $math.RADIANS;
			const centerLat = -rotation[1] * $math.RADIANS;
			cx = Math.cos(centerLat) * Math.cos(centerLon);
			cy = Math.cos(centerLat) * Math.sin(centerLon);
			cz = Math.sin(centerLat);
			minDot = Math.cos(clipAngle * $math.RADIANS);
		}

		// Columns just behind a globe's edge show where they rise past it
		const columnHeight = this.get("uniform", false) ? 0 : this.get("columnHeight", 0);
		const farDot = columnHeight > 0 && isGlobe(projection) ? -Math.sqrt(1 - 1 / ((1 + columnHeight) * (1 + columnHeight))) : minDot;

		// A flat map is cut at the antimeridian; pixels there are trimmed to it
		const cut = !clipAngle && !rotation[1] && !rotation[2];
		const edge = 180 - 1e-6;

		// Wider than this, a pixel is torn across the map (flat maps turned
		// on their other axes)
		const tear = 3 * $math.RADIANS * projection.scale();

		const depth = this._depth;
		for (let i = 0; i < total; i++) {
			shown[i] = 0;
			let far = false;
			if (minDot > -2) {
				depth[i] = unit[i * 3] * cx + unit[i * 3 + 1] * cy + unit[i * 3 + 2] * cz;
				if (depth[i] < minDot) {
					if (depth[i] < farDot) {
						continue;
					}
					far = true;
				}
			}
			const lo = lon[i];
			const la = lat[i];
			const d = halfLon[i] * size;
			const center = cut ? (((lo + rotation[0] + 180) % 360) + 360) % 360 - 180 : 0;

			let left = Infinity, right = -Infinity, widest = d;
			let q = 0;
			for (; q < corners; q++) {
				const north = Math.max(-90, Math.min(90, la + points[q * 2 + 1] * halfLat));
				let east = points[q * 2] * d;
				if (equalWidth) {
					// As wide as on the equator, measured at this point's own latitude
					east = points[q * 2] * Math.min(179, equatorWidth / Math.max(Math.cos(north * $math.RADIANS), 0.01));
					widest = Math.max(widest, Math.abs(east));
				}
				if (cut) {
					east = Math.max(-edge - center, Math.min(edge - center, east));
				}
				const point = projection([lo + east, north]);
				if (!point || !isFinite(point[0]) || !isFinite(point[1])) {
					break;
				}
				vx[i * corners + q] = point[0];
				vy[i * corners + q] = point[1];
				left = Math.min(left, point[0]);
				right = Math.max(right, point[0]);
			}
			if (q == corners && right - left <= tear * widest * 2 + 1) {
				shown[i] = far ? 2 : 1;
			}
		}

		const geo: Array<Array<number>> = [];
		if (total) {
			const indexes = [0, total >> 1, total - 1];
			for (let j = 0; j < indexes.length; j++) {
				geo.push([lon[indexes[j]], lat[indexes[j]]]);
			}
		}
		this._setView(projection, geo);
	}

	protected _clipKey(projection: GeoProjection): string {
		return String(projection.clipAngle ? projection.clipAngle() : null) + "|" + String(projection.clipExtent ? projection.clipExtent() : null);
	}

	protected _probe(projection: GeoProjection, geo: Array<Array<number>>): Array<number> {
		const probes: Array<number> = [];
		for (let j = 0; j < geo.length; j++) {
			const point = projection(geo[j] as [number, number]);
			probes.push(point ? point[0] : NaN, point ? point[1] : NaN);
		}
		return probes;
	}

	/**
	 * Whether the pixels still hold after the projection's scale and
	 * translation changed. Any other change (rotation, center, clipping, a
	 * different projection) needs them laid out again.
	 */
	protected _viewHolds(projection: GeoProjection): boolean {
		const view = this._view;
		if (!view || view.projection !== projection || view.clip != this._clipKey(projection) || !view.geo.length) {
			return false;
		}
		const translate = projection.translate();
		const k = projection.scale() / view.scale;
		const dx = translate[0] - view.x * k;
		const dy = translate[1] - view.y * k;
		const probes = this._probe(projection, view.geo);
		for (let j = 0; j < probes.length; j++) {
			const was = view.probes[j];
			const now = probes[j];
			if (isNaN(was) || isNaN(now)) {
				if (isNaN(was) != isNaN(now)) {
					return false;
				}
			}
			else if (Math.abs(was * k + (j % 2 ? dy : dx) - now) > 0.001) {
				return false;
			}
		}
		return true;
	}

	protected _drawPixels(display: IGraphics) {
		const projection = this.projection();
		if (!projection) {
			return;
		}

		// Zoom and pan only scale and move the pixels; other changes lay them out again
		const uniform = this.get("uniform", false);
		this._prepareLayout(projection);

		const view = this._view!;
		const translate = projection.translate();
		const k = projection.scale() / view.scale;
		const dx = translate[0] - view.x * k;
		const dy = translate[1] - view.y * k;

		// The part of the root that is on screen, to skip pixels outside it
		const root = this._root;
		const topLeft = this.pixels.toLocal({ x: 0, y: 0 });
		const bottomRight = this.pixels.toLocal({ x: root.width(), y: root.height() });
		const minX = topLeft.x;
		const minY = topLeft.y;
		const maxX = bottomRight.x;
		const maxY = bottomRight.y;

		if (!uniform && this.get("columnHeight", 0) > 0) {
			this._drawColumns(display, projection, k, dx, dy, minX, minY, maxX, maxY);
			return;
		}

		const type = this.get("pixelType", "square");
		const shape = this._shape();
		const points = shape.points;
		const corners = points.length / 2;
		const circle = type == "circle";
		const owners = this._owners;
		const starts = this._ownerStart;
		const shown = this._shown;

		// Uniform pixels: the same upright shape at every grid point
		const size = this.get("pixelSize", 0.8);
		const halfAcross = this._spacing * shape.across / 2 * size * k;
		const halfBetween = this._spacing * shape.between / 2 * size * k;
		const reach = Math.max(halfAcross, halfBetween * 2);
		const x = this._x;
		const y = this._y;

		// Surface pixels: outline points projected at their own latitude and longitude
		const vx = this._vx;
		const vy = this._vy;
		const px = new Float64Array(corners);
		const py = new Float64Array(corners);

		for (let o = 0; o < owners.length; o++) {
			const dataItem = owners[o];
			const mapPolygon = dataItem.get("mapPolygon");
			if (!mapPolygon || !mapPolygon.get("visible", true) || !mapPolygon.getPrivate("visible", true) || dataItem.isHidden()) {
				continue;
			}
			const fill = mapPolygon.get("fill");
			if (!fill) {
				continue;
			}

			// The polygon's stroke outlines each pixel; by default it has none
			const stroke = mapPolygon.get("stroke");
			const strokeWidth = mapPolygon.get("strokeWidth", 0);
			const strokeOpacity = mapPolygon.get("strokeOpacity", 1);
			const stroked = !!stroke && strokeWidth > 0 && strokeOpacity > 0;

			// Grouped under the polygon's id and name, which SVG export writes
			const dataContext = dataItem.dataContext as any;
			display.beginGroup(dataItem.get("id"), dataContext ? dataContext.name : undefined);

			// No closePath unless outlined: it is slow on long paths, and the fill closes each shape
			display.beginPath();
			display.beginFill(fill, mapPolygon.get("fillOpacity", 1));
			for (let i = starts[o]; i < starts[o + 1]; i++) {
				if (shown[i] != 1) {
					continue;
				}

				if (uniform) {
					const cx = x[i] * k + dx;
					const cy = y[i] * k + dy;
					if (cx + reach < minX || cx - reach > maxX || cy + reach < minY || cy - reach > maxY) {
						continue;
					}
					if (circle) {
						display.drawCircle(cx, cy, halfAcross);
					}
					else {
						display.moveTo(cx + points[0] * halfAcross, cy - points[1] * halfBetween);
						for (let q = 1; q < corners; q++) {
							display.lineTo(cx + points[q * 2] * halfAcross, cy - points[q * 2 + 1] * halfBetween);
						}
						if (stroked) {
							display.closePath();
						}
					}
					continue;
				}

				let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
				for (let q = 0; q < corners; q++) {
					const qx = vx[i * corners + q] * k + dx;
					const qy = vy[i * corners + q] * k + dy;
					px[q] = qx;
					py[q] = qy;
					left = Math.min(left, qx);
					right = Math.max(right, qx);
					top = Math.min(top, qy);
					bottom = Math.max(bottom, qy);
				}
				if (right < minX || left > maxX || bottom < minY || top > maxY) {
					continue;
				}

				if (circle) {
					// Quarter curves through the east, north, west and south points
					const c = KAPPA;
					const ox = px[0], oy = py[0];
					display.moveTo(px[1], py[1]);
					for (let q = 1; q <= 4; q++) {
						const a = q;
						const b = q % 4 + 1;
						display.bezierCurveTo(
							px[a] + c * (px[b] - ox), py[a] + c * (py[b] - oy),
							px[b] + c * (px[a] - ox), py[b] + c * (py[a] - oy),
							px[b], py[b]
						);
					}
				}
				else {
					display.moveTo(px[0], py[0]);
					for (let q = 1; q < corners; q++) {
						display.lineTo(px[q], py[q]);
					}
					if (stroked) {
						display.closePath();
					}
				}
			}
			display.endFill();
			if (stroked) {
				display.lineStyle(strokeWidth, stroke, strokeOpacity);
				display.endStroke();
			}
			display.endGroup();
		}
	}

	/**
	 * Draws pixels as prisms, far to near: the sides that face the viewer,
	 * shaded by a light from the upper left, then the top.
	 */
	protected _drawColumns(display: IGraphics, projection: GeoProjection, k: number, dx: number, dy: number, minX: number, minY: number, maxX: number, maxY: number) {
		const points = this._shape().points;
		const corners = points.length / 2;
		const circle = this.get("pixelType", "square") == "circle";
		const sides = circle ? 12 : corners;
		const columnHeight = this.get("columnHeight", 0);
		const scale = projection.scale();
		const translate = projection.translate();
		const centerX = translate[0];
		const centerY = translate[1];

		// On a globe columns rise away from its center; on a flat map, up the
		// screen, leaning right so a side shows
		const globe = !!(projection.clipAngle && projection.clipAngle());

		const owners = this._owners;
		const pixelOwner = this._pixelOwner;
		const shown = this._shown;
		const heights = this._height;
		const vx = this._vx;
		const vy = this._vy;
		const total = shown.length;

		// Pixels of visible polygons, sorted far to near
		const visible: Array<boolean> = [];
		for (let o = 0; o < owners.length; o++) {
			const dataItem = owners[o];
			const mapPolygon = dataItem.get("mapPolygon");
			visible.push(!!mapPolygon && mapPolygon.get("visible", true) && mapPolygon.getPrivate("visible", true) && !dataItem.isHidden() && !!mapPolygon.get("fill"));
		}
		const key = new Float64Array(total);
		const order: Array<number> = [];
		for (let i = 0; i < total; i++) {
			if (shown[i] && visible[pixelOwner[i]]) {
				key[i] = globe ? this._depth[i] : (vy[i * corners] * k + dy) - COLUMN_LEAN * (vx[i * corners] * k + dx);
				order.push(i);
			}
		}
		order.sort((a, b) => key[a] - key[b]);

		// Side shades per polygon, darkest to lightest
		const levels = 6;
		const shades: Array<Array<Color> | undefined> = [];

		const bx = new Float64Array(sides);
		const by = new Float64Array(sides);
		const tx = new Float64Array(sides);
		const ty = new Float64Array(sides);
		const ux = new Float64Array(sides);
		const uy = new Float64Array(sides);

		for (let j = 0; j < order.length; j++) {
			const i = order[j];
			const o = pixelOwner[i];
			const mapPolygon = owners[o].get("mapPolygon")!;
			const fill = mapPolygon.get("fill")!;
			const opacity = mapPolygon.get("fillOpacity", 1);
			const stroke = mapPolygon.get("stroke");
			const strokeWidth = mapPolygon.get("strokeWidth", 0);
			const strokeOpacity = mapPolygon.get("strokeOpacity", 1);
			const stroked = !!stroke && strokeWidth > 0 && strokeOpacity > 0;
			const outline = () => {
				if (stroked) {
					display.closePath();
					display.endFill();
					display.lineStyle(strokeWidth, stroke, strokeOpacity);
					display.endStroke();
				}
				else {
					display.endFill();
				}
			};

			this._screenOutline(i, corners, circle, k, dx, dy, bx, by);

			// Behind the globe's edge only a column shows, and only its sides
			const far = shown[i] == 2;
			const lift = columnHeight * heights[i];
			if (far && lift <= 0) {
				continue;
			}

			// Which way the outline winds on screen, and the base before it is cut
			const facing = polygonArea(bx, by, sides);
			let ex = bx, ey = by;
			if (far) {
				ux.set(bx);
				uy.set(by);
				ex = ux;
				ey = uy;
			}

			// The top, raised
			if (!this._raise(globe, far, lift, scale, centerX, centerY, bx, by, tx, ty, sides)) {
				continue;
			}
			let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
			for (let q = 0; q < sides; q++) {
				left = Math.min(left, bx[q], tx[q]);
				right = Math.max(right, bx[q], tx[q]);
				top = Math.min(top, by[q], ty[q]);
				bottom = Math.max(bottom, by[q], ty[q]);
			}
			if (right < minX || left > maxX || bottom < minY || top > maxY) {
				continue;
			}

			// Sides wound like the top face the viewer; behind the edge, the others do
			if (lift > 0) {
				for (let q = 0; q < sides; q++) {
					const n = (q + 1) % sides;
					const area = (bx[q] * by[n] - bx[n] * by[q]) + (bx[n] * ty[n] - tx[n] * by[n]) + (tx[n] * ty[q] - tx[q] * ty[n]) + (tx[q] * by[q] - bx[q] * ty[q]);
					if (far ? area * facing >= 0 : area * facing <= 0) {
						continue;
					}

					// Outward normal of the base edge against the light
					let nx = ey[n] - ey[q];
					let ny = ex[q] - ex[n];
					if (facing < 0) {
						nx = -nx;
						ny = -ny;
					}
					if (far) {
						// Seen from behind, a wall points the other way along the radius
						const rx = (ex[q] + ex[n]) / 2 - centerX;
						const ry = (ey[q] + ey[n]) / 2 - centerY;
						const along = 2 * (nx * rx + ny * ry) / (rx * rx + ry * ry || 1);
						nx -= along * rx;
						ny -= along * ry;
					}
					const length = Math.sqrt(nx * nx + ny * ny) || 1;
					const light = (-0.6 * nx - 0.8 * ny) / length;
					const level = Math.round((light + 1) / 2 * (levels - 1));

					let polygonShades = shades[o];
					if (!polygonShades) {
						polygonShades = [];
						for (let l = 0; l < levels; l++) {
							polygonShades.push(Color.brighten(fill, -0.55 + 0.4 * l / (levels - 1)));
						}
						shades[o] = polygonShades;
					}

					display.beginPath();
					display.beginFill(polygonShades[level], opacity);
					display.moveTo(bx[q], by[q]);
					display.lineTo(bx[n], by[n]);
					display.lineTo(tx[n], ty[n]);
					display.lineTo(tx[q], ty[q]);
					outline();
				}
			}

			// A top behind the edge faces away
			if (far) {
				continue;
			}

			display.beginPath();
			display.beginFill(fill, opacity);
			display.moveTo(tx[0], ty[0]);
			for (let q = 1; q < sides; q++) {
				display.lineTo(tx[q], ty[q]);
			}
			outline();
		}
	}

	/**
	 * A surface pixel's outline on screen; a circle as 12 points along its curves.
	 */
	protected _screenOutline(i: number, corners: number, circle: boolean, k: number, dx: number, dy: number, xs: Float64Array, ys: Float64Array) {
		const vx = this._vx;
		const vy = this._vy;
		const base = i * corners;
		if (circle) {
			const ox = vx[base] * k + dx;
			const oy = vy[base] * k + dy;
			for (let q = 0; q < 4; q++) {
				const a = base + 1 + q;
				const b = base + 1 + (q + 1) % 4;
				const ax = vx[a] * k + dx, ay = vy[a] * k + dy;
				const cx = vx[b] * k + dx, cy = vy[b] * k + dy;
				const p1x = ax + KAPPA * (cx - ox), p1y = ay + KAPPA * (cy - oy);
				const p2x = cx + KAPPA * (ax - ox), p2y = cy + KAPPA * (ay - oy);
				for (let s = 0; s < 3; s++) {
					const t = s / 3;
					const u = 1 - t;
					const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
					xs[q * 3 + s] = w0 * ax + w1 * p1x + w2 * p2x + w3 * cx;
					ys[q * 3 + s] = w0 * ay + w1 * p1y + w2 * p2y + w3 * cy;
				}
			}
		}
		else {
			for (let q = 0; q < corners; q++) {
				xs[q] = vx[base + q] * k + dx;
				ys[q] = vy[base + q] * k + dy;
			}
		}
	}

	/**
	 * Weights that turn a surface pixel's outline points into its center and
	 * its east and north half-cell vectors.
	 */
	protected _cellWeights(): { east: Array<number>, north: Array<number> } {
		const points = this._shape().points;
		let eastSum = 0, northSum = 0;
		for (let q = 0; q < points.length; q += 2) {
			eastSum += points[q] * points[q];
			northSum += points[q + 1] * points[q + 1];
		}
		const east: Array<number> = [];
		const north: Array<number> = [];
		for (let q = 0; q < points.length; q += 2) {
			east.push(points[q] / eastSum);
			north.push(points[q + 1] / northSum);
		}
		return { east, north };
	}

	/**
	 * A surface pixel's whole cell on screen, as four corners. Cells fit edge to
	 * edge, so together they cover the polygon without gaps.
	 */
	protected _cellOutline(i: number, corners: number, weights: { east: Array<number>, north: Array<number> }, k: number, dx: number, dy: number, xs: Float64Array, ys: Float64Array) {
		const vx = this._vx;
		const vy = this._vy;
		const base = i * corners;
		const size = this.get("pixelSize", 0.8) || 1;
		let cx = 0, cy = 0, ax = 0, ay = 0, bx = 0, by = 0;
		for (let q = 0; q < corners; q++) {
			const x = vx[base + q] * k + dx;
			const y = vy[base + q] * k + dy;
			cx += x;
			cy += y;
			ax += weights.east[q] * x;
			ay += weights.east[q] * y;
			bx += weights.north[q] * x;
			by += weights.north[q] * y;
		}
		cx /= corners;
		cy /= corners;
		ax /= size;
		ay /= size;
		bx /= size;
		by /= size;
		xs[0] = cx + ax + bx; ys[0] = cy + ay + by;
		xs[1] = cx - ax + bx; ys[1] = cy - ay + by;
		xs[2] = cx - ax - bx; ys[2] = cy - ay - by;
		xs[3] = cx + ax - bx; ys[3] = cy + ay - by;
	}

	/**
	 * A column's top on screen, raised from its base. A column behind a
	 * globe's edge (`far`) is cut to the part that rises past the edge, so its
	 * base moves there. Returns `false` when nothing of it shows.
	 */
	protected _raise(globe: boolean, far: boolean, lift: number, scale: number, centerX: number, centerY: number, bx: Float64Array, by: Float64Array, tx: Float64Array, ty: Float64Array, count: number): boolean {
		let shows = !far;
		for (let q = 0; q < count; q++) {
			if (far) {
				// On a globe the scale is its radius
				const ox = bx[q] - centerX;
				const oy = by[q] - centerY;
				const distance = Math.sqrt(ox * ox + oy * oy) || 1;
				const reach = distance * (1 + lift);
				if (reach > scale) {
					shows = true;
				}
				const top = Math.max(scale, reach) / distance;
				tx[q] = centerX + ox * top;
				ty[q] = centerY + oy * top;
				bx[q] = centerX + ox * scale / distance;
				by[q] = centerY + oy * scale / distance;
			}
			else if (globe) {
				tx[q] = centerX + (bx[q] - centerX) * (1 + lift);
				ty[q] = centerY + (by[q] - centerY) * (1 + lift);
			}
			else {
				tx[q] = bx[q] + COLUMN_LEAN * lift * scale;
				ty[q] = by[q] - lift * scale;
			}
		}
		return shows;
	}

	/**
	 * Draws every pixel's whole cell (or column) in one invisible path, for
	 * hit testing.
	 */
	protected _drawHitArea(display: IGraphics) {
		const projection = this.projection();
		if (!projection || !this._hitArea.get("interactive")) {
			return;
		}
		this._prepareLayout(projection);

		const view = this._view!;
		const translate = projection.translate();
		const scale = projection.scale();
		const k = scale / view.scale;
		const dx = translate[0] - view.x * k;
		const dy = translate[1] - view.y * k;

		const root = this._root;
		const topLeft = this._hitArea.toLocal({ x: 0, y: 0 });
		const bottomRight = this._hitArea.toLocal({ x: root.width(), y: root.height() });

		const uniform = this.get("uniform", false);
		const columnHeight = uniform ? 0 : this.get("columnHeight", 0);
		const globe = !!(projection.clipAngle && projection.clipAngle());
		const shape = this._shape();
		const corners = shape.points.length / 2;
		const weights = this._cellWeights();
		const visible = this._visibleOwners();
		const pixelOwner = this._pixelOwner;
		const shown = this._shown;

		const bx = new Float64Array(4);
		const by = new Float64Array(4);
		const tx = new Float64Array(4);
		const ty = new Float64Array(4);

		const halfAcross = this._spacing * shape.across / 2 * k;
		const halfBetween = this._spacing * shape.between / 2 * k;

		display.beginPath();
		display.beginFill(Color.fromHex(0x000000), 1);
		for (let i = 0; i < shown.length; i++) {
			if (!shown[i] || !visible[pixelOwner[i]]) {
				continue;
			}
			if (uniform) {
				const cx = this._x[i] * k + dx;
				const cy = this._y[i] * k + dy;
				if (cx + halfAcross >= topLeft.x && cx - halfAcross <= bottomRight.x && cy + halfBetween >= topLeft.y && cy - halfBetween <= bottomRight.y) {
					display.drawRect(cx - halfAcross, cy - halfBetween, halfAcross * 2, halfBetween * 2);
				}
				continue;
			}

			this._cellOutline(i, corners, weights, k, dx, dy, bx, by);
			const far = shown[i] == 2;
			const lift = columnHeight * this._height[i];
			if (far && lift <= 0) {
				continue;
			}
			let from = bx, fromY = by;
			if (lift > 0) {
				const facing = polygonArea(bx, by, 4);
				if (!this._raise(globe, far, lift, scale, translate[0], translate[1], bx, by, tx, ty, 4)) {
					continue;
				}
				from = tx;
				fromY = ty;
				// Sides that face the viewer: wound like the top, or unlike it behind the edge
				for (let q = 0; q < 4; q++) {
					const n = (q + 1) % 4;
					const area = (bx[q] * by[n] - bx[n] * by[q]) + (bx[n] * ty[n] - tx[n] * by[n]) + (tx[n] * ty[q] - tx[q] * ty[n]) + (tx[q] * by[q] - bx[q] * ty[q]);
					if (far ? area * facing < 0 : area * facing > 0) {
						display.moveTo(bx[q], by[q]);
						display.lineTo(bx[n], by[n]);
						display.lineTo(tx[n], ty[n]);
						display.lineTo(tx[q], ty[q]);
					}
				}
			}
			if (Math.max(from[0], from[1], from[2], from[3]) < topLeft.x || Math.min(from[0], from[1], from[2], from[3]) > bottomRight.x
				|| Math.max(fromY[0], fromY[1], fromY[2], fromY[3]) < topLeft.y || Math.min(fromY[0], fromY[1], fromY[2], fromY[3]) > bottomRight.y) {
				continue;
			}
			if (far) {
				continue;
			}
			display.moveTo(from[0], fromY[0]);
			display.lineTo(from[1], fromY[1]);
			display.lineTo(from[2], fromY[2]);
			display.lineTo(from[3], fromY[3]);
		}
		display.endFill();
	}

	/**
	 * Returns the polygon whose pixel cell, or column, is at a point.
	 *
	 * @param   point  Point in pixels, relative to the root
	 * @return         Polygon
	 */
	public getPolygonByPoint(point: IPoint): MapPolygon | undefined {
		const projection = this.projection();
		const view = this._view;
		if (!projection || !view || this._gridDirty || this._positionsDirty) {
			return;
		}

		const local = this.pixels.toLocal(point);
		const translate = projection.translate();
		const scale = projection.scale();
		const k = scale / view.scale;
		const dx = translate[0] - view.x * k;
		const dy = translate[1] - view.y * k;

		const uniform = this.get("uniform", false);
		const columnHeight = uniform ? 0 : this.get("columnHeight", 0);
		const globe = !!(projection.clipAngle && projection.clipAngle());
		const shape = this._shape();
		const corners = shape.points.length / 2;
		const weights = this._cellWeights();
		const visible = this._visibleOwners();
		const owners = this._owners;
		const pixelOwner = this._pixelOwner;
		const shown = this._shown;

		const bx = new Float64Array(4);
		const by = new Float64Array(4);
		const tx = new Float64Array(4);
		const ty = new Float64Array(4);
		const qx = new Float64Array(4);
		const qy = new Float64Array(4);

		const halfAcross = this._spacing * shape.across / 2 * k;
		const halfBetween = this._spacing * shape.between / 2 * k;

		// Cells do not overlap; columns can, and the nearest one wins
		let found = -1;
		let nearest = -Infinity;
		for (let i = 0; i < shown.length; i++) {
			if (!shown[i] || !visible[pixelOwner[i]]) {
				continue;
			}
			if (uniform) {
				if (Math.abs(local.x - (this._x[i] * k + dx)) <= halfAcross && Math.abs(local.y - (this._y[i] * k + dy)) <= halfBetween) {
					found = i;
					break;
				}
				continue;
			}

			this._cellOutline(i, corners, weights, k, dx, dy, bx, by);
			const far = shown[i] == 2;
			const lift = columnHeight * this._height[i];
			if (lift <= 0) {
				if (!far && insideConvex(local.x, local.y, bx, by, 0, 4)) {
					found = i;
					break;
				}
				continue;
			}

			const key = globe ? this._depth[i] : by[0] - COLUMN_LEAN * bx[0];
			if (key <= nearest) {
				continue;
			}
			if (!this._raise(globe, far, lift, scale, translate[0], translate[1], bx, by, tx, ty, 4)) {
				continue;
			}
			let hit = insideConvex(local.x, local.y, tx, ty, 0, 4) || (!far && insideConvex(local.x, local.y, bx, by, 0, 4));
			for (let q = 0; q < 4 && !hit; q++) {
				const n = (q + 1) % 4;
				qx[0] = bx[q]; qy[0] = by[q];
				qx[1] = bx[n]; qy[1] = by[n];
				qx[2] = tx[n]; qy[2] = ty[n];
				qx[3] = tx[q]; qy[3] = ty[q];
				hit = insideConvex(local.x, local.y, qx, qy, 0, 4);
			}
			if (hit) {
				found = i;
				nearest = key;
			}
		}

		return found >= 0 ? owners[pixelOwner[found]].get("mapPolygon") : undefined;
	}

	/**
	 * Returns the number of pixels in the grid.
	 */
	public pixelCount(): number {
		const projection = this.projection();
		if (projection) {
			this._layOut(projection);
		}
		else if (this._gridDirty && !this.get("uniform", false)) {
			this._buildGrid();
		}
		return this._shown.length;
	}

	protected _layOut(projection: GeoProjection) {
		if (this._gridDirty) {
			if (this.get("uniform", false)) {
				this._buildScreenGrid(projection);
			}
			else {
				this._buildGrid();
			}
		}
		if (this._positionsDirty) {
			this._projectPixels(projection);
		}
		if (this._heightsDirty && !this.get("uniform", false)) {
			this._computeHeights();
		}
	}
}
