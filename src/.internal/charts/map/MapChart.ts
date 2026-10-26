import type { MapSeries } from "./MapSeries";
import type { MapPointSeries } from "./MapPointSeries";
import type { GeoProjection, GeoPath, GeoRawProjection } from "d3-geo";
import type { IPoint } from "../../core/util/IPoint";
import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { Time } from "../../core/util/Animation";
import type { ZoomControl } from "./ZoomControl";
import type { Animation } from "../../core/util/Entity";
import type { DataItem } from "../../core/render/Component";
import type { IMapPolygonSeriesDataItem } from "./MapPolygonSeries";

import { MapChartDefaultTheme } from "./MapChartDefaultTheme";
import { SerialChart, ISerialChartPrivate, ISerialChartSettings, ISerialChartEvents } from "../../core/render/SerialChart";
import { Rectangle } from "../../core/render/Rectangle";
import { Graphics } from "../../core/render/Graphics";
import { geoPath, geoProjection, geoProjectionMutator } from "d3-geo";
import { Color } from "../../core/util/Color";
import { registry } from "../../core/Registry";

import * as $math from "../../core/util/Math";
import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $mapUtils from "./MapUtils";
import * as $object from "../../core/util/Object";
import * as $utils from "../../core/util/Utils";

import type { IDisposer } from "../../core/util/Disposer";
import type { Sprite, ISpritePointerEvent } from "../../core/render/Sprite";


/**
 * Projections that [[MapChart]]'s `projectionName` can name. `am5map` registers
 * its bundled projections here; add others with `registerProjection()`.
 */
export const projectionRegistry: { [name: string]: () => GeoProjection } = {};

/**
 * Wraps a projection factory so the projections it makes carry `name`, which
 * lets `ChartSerializer` write `projectionName` for a chart that sets
 * `projection` in code.
 */
export function tagProjection(name: string, factory: () => GeoProjection): () => GeoProjection {
	return () => {
		const projection = factory();
		(projection as any).__projectionName = name;
		return projection;
	};
}

/**
 * Registers a projection factory under `name`, for [[MapChart]]'s
 * `projectionName`.
 *
 * Returns the factory tagged with the name: a chart given `projection: cc()`,
 * where `const cc = registerProjection("geoConicConformal", geoConicConformal)`,
 * serializes with its `projectionName`, as the bundled projections do.
 */
export function registerProjection(name: string, factory: () => GeoProjection): () => GeoProjection {
	const tagged = tagProjection(name, factory);
	projectionRegistry[name] = tagged;
	return tagged;
}

// The settings that place the map
const homeKeys: Array<"zoomLevel" | "translateX" | "translateY" | "rotationX" | "rotationY"> = ["zoomLevel", "translateX", "translateY", "rotationX", "rotationY"];

export interface IMapChartSettings extends ISerialChartSettings {

	/**
	 * The projection the map is drawn with, such as `am5map.geoMercator()`.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/#projections} for more info
	 */
	projection?: GeoProjection;

	/**
	 * The projection by name, such as `"geoOrthographic"`: the chart sets
	 * `projection` to it. Useful in JSON configs, which can't hold a function.
	 *
	 * The names `"geoMercator"`, `"geoOrthographic"`, `"geoEquirectangular"`,
	 * `"geoAlbersUsa"`, `"geoEqualEarth"` and `"geoNaturalEarth1"` work out of
	 * the box. Register any other projection once, before creating the chart:
	 *
	 * ```TypeScript
	 * import { geoConicConformal } from "d3-geo";
	 * am5map.registerProjection("geoConicConformal", geoConicConformal);
	 * ```
	 * ```JavaScript
	 * am5map.registerProjection("geoConicConformal", d3.geoConicConformal);
	 * ```
	 *
	 * @since 5.19.0
	 */
	projectionName?: string;

	/**
	 * The map's zoom level: `1` shows the whole map fitted to the chart, `2`
	 * shows it twice as large.
	 *
	 * @default 1
	 */
	zoomLevel?: number;

	/**
	 * Horizontal position of the projection's center, in pixels from the left
	 * of the map's area. Changes as the map is panned.
	 */
	translateX?: number;

	/**
	 * Vertical position of the projection's center, in pixels from the top of
	 * the map's area. Changes as the map is panned.
	 */
	translateY?: number;

	/**
	 * Tilts the map north or south, in degrees: the latitude `-rotationY`
	 * comes to the middle, so `-30` centers latitude 30. Needs a projection
	 * that can rotate.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/#centering-the-map} for more info
	 * @default 0
	 */
	rotationY?: number;

	/**
	 * Turns the map around the poles, in degrees: the longitude `-rotationX`
	 * comes to the middle, so `-74` centers longitude 74. Needs a projection
	 * that can rotate.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/#centering-the-map} for more info
	 * @default 0
	 */
	rotationX?: number;

	/**
	 * Spins the map around its middle, in degrees. Needs a projection that can
	 * rotate.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/#centering-the-map} for more info
	 * @default 0
	 */
	rotationZ?: number;

	/**
	 * The highest zoom level the map can zoom in to.
	 *
	 * @default 32
	 */
	maxZoomLevel?: number;

	/**
	 * The lowest zoom level the map can zoom out to.
	 *
	 * @default 1
	 */
	minZoomLevel?: number;

	/**
	 * How many times one zoom step zooms in or out: the zoom level is multiplied
	 * or divided by it. Used by [[ZoomControl]], the wheel, double clicks,
	 * `zoomIn()` and `zoomOut()`.
	 *
	 * @default 2
	 */
	zoomStep?: number;

	/**
	 * What dragging the map horizontally does: `"translateX"` moves it,
	 * `"rotateX"` turns it around the poles (as on a globe), `"none"` nothing.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#panning} for more info
	 * @default "translateX"
	 */
	panX?: "none" | "rotateX" | "translateX";

	/**
	 * What dragging the map vertically does: `"translateY"` moves it,
	 * `"rotateY"` tilts it north or south (as on a globe), `"none"` nothing.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#panning} for more info
	 * @default "translateY"
	 */
	panY?: "none" | "rotateY" | "translateY";

	/**
	 * Lets users zoom the map with a two-finger pinch on touch devices.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#pinch-zoom} for more info
	 * @default true
	 */
	pinchZoom?: boolean;

	/**
	 * What scrolling horizontally (with a tilting wheel or a touchpad) does to
	 * the map.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#mouse-wheel-behavior} for more info
	 * @default "none"
	 */
	wheelX?: "none" | "zoom" | "rotateX" | "rotateY";

	/**
	 * What turning the mouse wheel does to the map.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#mouse-wheel-behavior} for more info
	 * @default "zoom"
	 */
	wheelY?: "none" | "zoom" | "rotateX" | "rotateY";

	/**
	 * Multiplies how far the wheel rotates the map. Applies only to the
	 * `"rotateX"` and `"rotateY"` wheel actions.
	 *
	 * @default 1
	 */
	wheelSensitivity?: number;

	/**
	 * Duration of the rotation a wheel turn makes, in milliseconds. Applies
	 * only to the `"rotateX"` and `"rotateY"` wheel actions.
	 *
	 * @default 0
	 */
	wheelDuration?: number;

	/**
	 * Easing of the rotation a wheel turn makes. Applies only to the
	 * `"rotateX"` and `"rotateY"` wheel actions.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/animations/#easing-functions} for more info
	 * @default am5.ease.out(am5.ease.cubic)
	 */
	wheelEasing?: (t: Time) => Time;

	/**
	 * Duration of zoom and rotation animations, in milliseconds: zooming with
	 * the wheel, buttons or a double click, and the zoom and rotate methods.
	 */
	animationDuration?: number;

	/**
	 * Easing of zoom and rotation animations.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/animations/#easing-functions} for more info
	 * @default am5.ease.out(am5.ease.cubic)
	 */
	animationEasing?: (t: Time) => Time;


	/**
	 * Zoom buttons to show on the map.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/#zoom-control} for more info
	 */
	zoomControl?: ZoomControl;

	/**
	 * Zoom level of the home position, which `goHome()` and `autoHome` go to.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#initial-position-and-zoom} for more info
	 * @default 1
	 */
	homeZoomLevel?: number;

	/**
	 * `rotationX` of the home position, which `goHome()` and `autoHome` go to.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#initial-position-and-zoom} for more info
	 */
	homeRotationX?: number;

	/**
	 * `rotationY` of the home position, which `goHome()` and `autoHome` go to.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#initial-position-and-zoom} for more info
	 */
	homeRotationY?: number;

	/**
	 * The point `goHome()` and `autoHome` center the map on. If not set, the
	 * middle of the map is used.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#initial-position-and-zoom} for more info
	 */
	homeGeoPoint?: IGeoPoint;

	/**
	 * Goes to the home position once the map is loaded, as `goHome()` does:
	 * animated when `animationDuration` is set (as by the Animated theme), at
	 * once otherwise.
	 *
	 * @default false
	 * @since 5.21.0
	 */
	autoHome?: boolean;

	/**
	 * How far the map can be dragged away from the middle, as a share of its
	 * size: `0.4` lets its center move 40% of the map's width or height. A map
	 * zoomed larger than the chart can always be dragged to its edges.
	 *
	 * @default 0.4
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#panning-outside-viewport} for more info
	 */
	maxPanOut?: number;

	/**
	 * Centers the map on its home point (`homeGeoPoint`, or the middle of the
	 * map) whenever it zooms to `homeZoomLevel`, such as when fully zoomed out.
	 * Otherwise zooming out keeps the point under the pointer, or the middle of
	 * the view, in place.
	 *
	 * @default true
	 * @since 5.2.1
	 */
	centerMapOnZoomOut?: boolean;

	/**
	 * Zooms the map in by `zoomStep` on a double click or double tap, and out
	 * on Shift + double click.
	 *
	 * On a map panned by rotating (`panX: "rotateX"` or `panY: "rotateY"`), the
	 * clicked location turns to the middle. Otherwise it stays under the
	 * pointer.
	 *
	 * @default true
	 * @since 5.20.2
	 */
	doubleClickZoom?: boolean;

	/**
	 * Zooms the map to a box drawn with the pointer, while this key is held:
	 * `"drag"` needs no key. A plain drag pans the map, so use `"drag"` with
	 * `panX` and `panY` set to `"none"`.
	 *
	 * The box is drawn with `boxZoomSelection`.
	 *
	 * @default "none"
	 * @since 5.20.2
	 */
	boxZoom?: "none" | "drag" | "shift" | "ctrl" | "alt";

}

export interface IMapChartPrivate extends ISerialChartPrivate {

	/**
	 * @ignore
	 */
	geoPath: GeoPath;

	/**
	 * @ignore
	 */
	mapScale: number;

	/**
	 * @ignore
	 */
	projectionBlend?: number;

}


export interface IMapChartEvents extends ISerialChartEvents {

	/**
	 * The geographic bounds of the map's geometries changed, as when series
	 * load their data.
	 */
	geoboundschanged: {};

}


/**
 * A map: geographic data drawn in a projection, which can be zoomed, panned
 * and rotated. Its series draw polygons, lines and points.
 */
export class MapChart extends SerialChart {
	public static className: string = "MapChart";
	public static classNames: Array<string> = SerialChart.classNames.concat([MapChart.className]);

	declare public _settings: IMapChartSettings;
	declare public _privateSettings: IMapChartPrivate;
	declare public _seriesType: MapSeries;
	declare public _events: IMapChartEvents;

	protected _downTranslateX: number | undefined;
	protected _downTranslateY: number | undefined;
	protected _downRotationX: number | undefined;
	protected _downRotationY: number | undefined;
	protected _downRotationZ: number | undefined;
	protected _pLat: number = 0;
	protected _pLon: number = 0;

	protected _movePoints: { [index: number]: IPoint } = {};
	protected _downZoomLevel: number = 1;
	protected _doubleDownDistance: number = 0;

	/**
	 * The box drawn while zooming with `boxZoom`.
	 *
	 * @since 5.20.2
	 */
	public readonly boxZoomSelection: Rectangle = Rectangle.new(this._root, {
		themeTags: ["map", "selection"],
		isMeasured: false,
		visible: false
	});

	protected _boxDownPoint: IPoint | undefined;
	protected _panSuspended: boolean = false;
	protected _suspendedPanX: "none" | "rotateX" | "translateX" | undefined;
	protected _suspendedPanY: "none" | "rotateY" | "translateY" | undefined;

	protected _dirtyGeometries: boolean = false;
	protected _geometryColection: GeoJSON.GeometryCollection = { type: "GeometryCollection", geometries: [] };

	public _centerLocation: [number, number] | null = null;

	protected _za?: Animation<this["_settings"]["zoomLevel"]>;
	protected _rxa?: Animation<this["_settings"]["rotationX"]>;
	protected _rya?: Animation<this["_settings"]["rotationY"]>;
	protected _txa?: Animation<this["_settings"]["translateX"]>;
	protected _tya?: Animation<this["_settings"]["translateY"]>;

	protected _mapBounds = [[0, 0], [0, 0]];

	protected _geoCentroid: IGeoPoint = { longitude: 0, latitude: 0 };
	protected _geoBounds: { left: number, right: number, top: number, bottom: number } = { left: 0, right: 0, top: 0, bottom: 0 };
	protected _prevGeoBounds: { left: number, right: number, top: number, bottom: number } = { left: 0, right: 0, top: 0, bottom: 0 };

	protected _dispatchBounds: boolean = false;

	protected _wheelDp: IDisposer | undefined;

	protected _pw?: number;
	protected _ph?: number;

	protected _mapFitted: boolean = false;
	// Fitted with geometries at least once
	protected _fitted: boolean = false;
	// goHome() called before that
	protected _goHomeOnFit?: { duration?: number };
	protected _homeScheduled: boolean = false;
	// Where going home on load is headed, and the animations taking it there
	protected _homeTarget?: { view: Array<number | undefined>, animations: Array<Animation<any> | undefined>, duration?: number };

	// Zoom level announcement waiting for zooming to settle
	protected _zoomAlert?: IDisposer;
	// Zooms the map makes for its initial view are not announced
	protected _silentZoom: boolean = false;

	protected _centerX: number = 0;
	protected _centerY: number = 0;

	protected _projectionRaw?: GeoRawProjection;
	protected _appliedProjectionName?: string;

	// Clips the series to the outline of a projection that draws its own
	protected _outlineMask?: Graphics;
	protected _outlineProjection?: GeoProjection;
	protected _ownOutline: boolean = false;
	protected _projectionBlendAnim?: Animation<this["_privateSettings"]["projectionBlend"]>;
	protected _projectionBlendData?: {
		blended: GeoProjection;
		mutate: Function;
		sourceScale: number;
		targetScale: number;
		sourceTranslateX: number;
		sourceTranslateY: number;
		targetTranslateX: number;
		targetTranslateY: number;
		target: GeoProjection;
		targetRaw: GeoRawProjection;
	};

	protected _makeGeoPath() {
		const projection = this.get("projection")!;
		const path = geoPath();
		path.projection(projection);
		this.setPrivateRaw("geoPath", path);
	}

	/**
	 * Returns the geographic point in the middle of the view. To come back to
	 * the view later: `chart.zoomToGeoPoint(geoPoint, zoomLevel, true)`.
	 *
	 * @since 5.2.19
	 */
	public geoPoint() {
		return this.invert({ x: this.innerWidth() / 2, y: this.innerHeight() / 2 });
	}

	/**
	 * Returns the geographic center of the map's geometries.
	 */
	public geoCentroid() {
		return this._geoCentroid;
	}

	/**
	 * Returns the geographic bounds of the map's geometries, in degrees:
	 * longitudes `left` and `right`, latitudes `top` and `bottom`.
	 */
	public geoBounds() {
		return this._geoBounds;
	}

	protected _handleSetWheel() {

		const wheelX = this.get("wheelX");
		const wheelY = this.get("wheelY");
		const chartContainer = this.chartContainer;

		if (wheelX != "none" || wheelY != "none") {
			if (this._wheelDp) {
				this._wheelDp.dispose();
			}

			this._wheelDp = chartContainer.events.on("wheel", (event) => {
				const wheelEasing = this.get("wheelEasing")!;
				const wheelSensitivity = this.get("wheelSensitivity", 1);
				const wheelDuration = this.get("wheelDuration", 0);

				const wheelEvent = event.originalEvent;

				// Ignore wheel event if it is happening on a non-chart element, e.g. if
				// some page element is over the chart.
				let prevent = false;
				if ($utils.isLocalEvent(wheelEvent, this)) {
					prevent = true;
				}
				else {
					return;
				}

				const point = chartContainer._display.toLocal(event.point);

				if ((wheelY == "zoom")) {
					if (this.get("zoomLevel") == this.get("minZoomLevel", 1) && wheelEvent.deltaY > 0) {
						return;
					}

					this._handleWheelZoom(wheelEvent.deltaY, point);
				}
				else if (wheelY == "rotateY") {
					this._handleWheelRotateY(wheelEvent.deltaY / 5 * wheelSensitivity, wheelDuration, wheelEasing);
				}
				else if (wheelY == "rotateX") {
					this._handleWheelRotateX(wheelEvent.deltaY / 5 * wheelSensitivity, wheelDuration, wheelEasing);
				}

				if ((wheelX == "zoom")) {
					this._handleWheelZoom(wheelEvent.deltaX, point);
				}
				else if (wheelX == "rotateY") {
					this._handleWheelRotateY(wheelEvent.deltaX / 5 * wheelSensitivity, wheelDuration, wheelEasing);
				}
				else if (wheelX == "rotateX") {
					this._handleWheelRotateX(wheelEvent.deltaX / 5 * wheelSensitivity, wheelDuration, wheelEasing);
				}
				if (prevent) {
					wheelEvent.preventDefault();
				}

			});

			this._disposers.push(this._wheelDp);
		}
		else {
			if (this._wheelDp) {
				this._wheelDp.dispose();
			}
		}
	}

	protected _handleDoubleClick(event: ISpritePointerEvent) {
		if (!this.get("doubleClickZoom")) {
			return;
		}

		if ((event.originalEvent as MouseEvent).shiftKey) {
			this.zoomOut();
		}
		else {
			const level = this.get("zoomLevel", 1) * this.get("zoomStep", 2);
			this._zoomToScreenPoint(this.chartContainer._display.toLocal(event.point), level);
		}
	}

	/**
	 * Zooms to a point on the screen, rotating the map so that the point ends up
	 * in the center of it, if the map is panned by rotating.
	 */
	protected _zoomToScreenPoint(point: IPoint, level: number) {
		const projection = this.get("projection")!;
		const rotateX = this.get("panX") == "rotateX";
		const rotateY = this.get("panY") == "rotateY";

		if ((rotateX || rotateY) && projection.rotate && projection.invert) {
			const geoPoint = this.invert(point);
			// A point outside the globe does not translate to a location
			if ($type.isNumber(geoPoint.longitude) && $type.isNumber(geoPoint.latitude)) {
				this.zoomToGeoPoint(geoPoint, level, true, undefined,
					rotateX ? -geoPoint.longitude : this.get("rotationX", 0),
					rotateY ? -geoPoint.latitude : this.get("rotationY", 0));
				return;
			}
		}

		this.zoomToPoint(point, level);
	}

	protected _isBoxZoomEvent(event: ISpritePointerEvent): boolean {
		const originalEvent = event.originalEvent as MouseEvent;

		// Right and middle button presses come through as "pointerdown" too
		if (originalEvent.button) {
			return false;
		}

		switch (this.get("boxZoom", "none")) {
			case "drag":
				return true;
			case "shift":
				return originalEvent.shiftKey;
			case "ctrl":
				return originalEvent.ctrlKey;
			case "alt":
				return originalEvent.altKey;
		}

		return false;
	}

	protected _handleBoxDown(event: ISpritePointerEvent) {
		// Root simulates pointer events to drag a focused element with a keyboard
		if (event.simulated || !this._isBoxZoomEvent(event)) {
			return;
		}

		this._boxDownPoint = this.chartContainer._display.toLocal(event.point);

		// Panning has to be off while the box is being drawn, otherwise the map
		// would move along with the pointer
		if (!this._panSuspended) {
			this._panSuspended = true;
			this._suspendedPanX = this.get("panX");
			this._suspendedPanY = this.get("panY");
			this.setRaw("panX", "none");
			this.setRaw("panY", "none");
		}

		this._drawBoxSelection(this._boxDownPoint);
		this.boxZoomSelection.set("visible", true);
	}

	protected _handleBoxMove(event: ISpritePointerEvent) {
		if (this._boxDownPoint) {
			this._drawBoxSelection(this.chartContainer._display.toLocal(event.point));
		}
	}

	protected _handleBoxUp(event: ISpritePointerEvent) {
		const downPoint = this._boxDownPoint;
		const upPoint = this.chartContainer._display.toLocal(event.point);

		this._endBoxZoom();

		if (!downPoint) {
			return;
		}

		const width = Math.abs(upPoint.x - downPoint.x);
		const height = Math.abs(upPoint.y - downPoint.y);

		// Ignore accidental micro-drags, e.g. a double click with a key held down
		if (width < 10 || height < 10) {
			return;
		}

		const level = this.get("zoomLevel", 1) * Math.min(this.innerWidth() / width, this.innerHeight() / height);

		this._zoomToScreenPoint({ x: (downPoint.x + upPoint.x) / 2, y: (downPoint.y + upPoint.y) / 2 }, level);
	}

	protected _endBoxZoom() {
		this._boxDownPoint = undefined;
		this.boxZoomSelection.set("visible", false);

		if (this._panSuspended) {
			this._panSuspended = false;
			// Do not undo a panning change made while the box was being drawn
			if (this.get("panX") == "none") {
				this.setRaw("panX", this._suspendedPanX);
			}
			if (this.get("panY") == "none") {
				this.setRaw("panY", this._suspendedPanY);
			}
		}
	}

	protected _drawBoxSelection(point: IPoint) {
		const downPoint = this._boxDownPoint!;

		this.boxZoomSelection.setAll({
			x: Math.min(downPoint.x, point.x),
			y: Math.min(downPoint.y, point.y),
			width: Math.abs(point.x - downPoint.x),
			height: Math.abs(point.y - downPoint.y)
		});
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("projectionName")) {
			const name = this.get("projectionName") as string | undefined;
			if (name && name !== this._appliedProjectionName) {
				const factory = projectionRegistry[name];
				if (factory) {
					this._appliedProjectionName = name;
					this.set("projection", factory());
				}
			}
		}

		const projection = this.get("projection")!;
		const w = this.innerWidth();
		const h = this.innerHeight();

		// Before a refit below moves the map
		const goingHome = this._isGoingHome();
		let refitted = false;

		const previousGeometries = this._geometryColection.geometries;

		if (this.isDirty("projection")) {
			this._makeGeoPath();
			this.markDirtyProjection();
			this._fitMap();
			refitted = w > 0 && h > 0;

			this._applyZoom();
			if (projection.rotate) {
				projection.rotate([this.get("rotationX", 0), this.get("rotationY", 0), this.get("rotationZ", 0)])
			}

			// Zoomed in: keep the same place in the middle, if the new projection shows it
			let prev = this._prevSettings.projection;
			if (prev && prev != projection && this.get("zoomLevel", 1) > 1) {
				let hw = w / 2;
				let hh = h / 2;
				if (prev.invert) {
					let centerLocation = prev.invert([hw, hh]);

					if (centerLocation && $mapUtils.isPointVisible(projection, centerLocation)) {

						let xy = projection(centerLocation);
						if (xy && isFinite(xy[0]) && isFinite(xy[1])) {
							let translate = projection.translate();

							let xx = hw - ((xy[0] - translate[0]));
							let yy = hh - ((xy[1] - translate[1]));

							projection.translate([xx, yy])

							this.setRaw("translateX", xx);
							this.setRaw("translateY", yy);
						}
					}
				}
			}
		}

		// Handle projection blend animation (driven by animatePrivate on projectionBlend)
		if (this.isPrivateDirty("projectionBlend") && this._projectionBlendData) {
			const d = this._projectionBlendData;
			const t = this.getPrivate("projectionBlend", 0)!;

			// Update the blended raw function
			(d.mutate as any)(t);

			// Interpolate scale and translate
			const scale = d.sourceScale + (d.targetScale - d.sourceScale) * t;
			const tx = d.sourceTranslateX + (d.targetTranslateX - d.sourceTranslateX) * t;
			const ty = d.sourceTranslateY + (d.targetTranslateY - d.sourceTranslateY) * t;

			d.blended.scale(scale * this.get("zoomLevel", 1));
			d.blended.translate([tx, ty]);

			if (d.blended.rotate) {
				d.blended.rotate([
					this.get("rotationX", 0),
					this.get("rotationY", 0),
					this.get("rotationZ", 0)
				]);
			}

			this.setPrivateRaw("mapScale", scale);
			this.setRaw("translateX", tx);
			this.setRaw("translateY", ty);

			this.markDirtyProjection();

			// Animation complete — install the real target projection
			if (t >= 1) {
				this._projectionRaw = d.targetRaw;
				this._projectionBlendData = undefined;
				this._projectionBlendAnim = undefined;
				this.set("projection", d.target);
			}
		}

		if (this.isDirty("wheelX") || this.isDirty("wheelY")) {
			this._handleSetWheel();
		}
		if (this._dirtyGeometries) {
			this._geometryColection.geometries = [];

			this.series.each((series) => {
				$array.pushAll(this._geometryColection.geometries, series._geometries);
			})


			this._fitMap();
			this._applyZoom();
			refitted = w > 0 && h > 0;
		}

		if (previousGeometries.length != 0 && (w != this._pw || h != this._ph || this._dirtyGeometries)) {
			if (w > 0 && h > 0) {
				let hw = w / 2;
				let hh = h / 2;
				refitted = true;

				$mapUtils.fitProjection(projection, [w, h], this._geometryColection);
				const newScale = projection.scale();

				// Measured unzoomed, as in `_fitMap`: the pan limits apply the zoom themselves
				const geoPath = this.getPrivate("geoPath");
				this._mapBounds = $mapUtils.boundsInOutline(projection, geoPath.bounds(this._geometryColection));

				this.setPrivateRaw("mapScale", newScale);
				projection.scale(newScale * this.get("zoomLevel", 1));

				if (this._centerLocation) {
					let xy = projection(this._centerLocation);
					if (xy) {
						let translate = projection.translate();

						let xx = hw - ((xy[0] - translate[0]));
						let yy = hh - ((xy[1] - translate[1]));

						projection.translate([xx, yy])

						this.setRaw("translateX", xx);
						this.setRaw("translateY", yy);

						this._centerX = translate[0];
						this._centerY = translate[1];
					}
				}

				this.markDirtyProjection();
			}
		}

		this._pw = w;
		this._ph = h;

		if (this.isDirty("zoomControl")) {
			const previous = this._prevSettings.zoomControl;
			const zoomControl = this.get("zoomControl")!;
			if (zoomControl !== previous) {
				this._disposeProperty("zoomControl");
				if (previous) {
					previous.dispose();
				}
				if (zoomControl) {
					zoomControl.setPrivate("chart", this);
					this.children.push(zoomControl);
				}

				this.setRaw("zoomControl", zoomControl);
			}
		}

		if (this.isDirty("zoomLevel")) {
			this._applyZoom();
			this.markDirtyProjection();

			this.series.each((series) => {
				if (series.isType<MapPointSeries>("MapPointSeries")) {
					if (series.get("autoScale")) {
						$array.each(series.dataItems, (dataItem) => {
							const bullets = dataItem.bullets;
							if (bullets) {
								$array.each(bullets, (bullet) => {
									const sprite = bullet.get("sprite");
									if (sprite) {
										sprite.set("scale", this.get("zoomLevel"));
									}
								})
							}
						})
					}
				}
			})

			const zoomControl = this.get("zoomControl");
			if (zoomControl) {
				const zoomLevel = this.get("zoomLevel", 1);

				if (zoomLevel == this.get("minZoomLevel", 1)) {
					zoomControl.minusButton._setC("disabled", true);
				}
				else {
					zoomControl.minusButton._setC("disabled", false);
				}

				if (zoomLevel == this.get("maxZoomLevel", 32)) {
					zoomControl.plusButton._setC("disabled", true);
				}
				else {
					zoomControl.plusButton._setC("disabled", false);
				}
			}
		}

		if (this.isDirty("translateX") || this.isDirty("translateY")) {
			projection.translate([this.get("translateX", this.width() / 2), this.get("translateY", this.height() / 2)])
			this.markDirtyProjection();
		}

		if (projection.rotate) {
			if (this.isDirty("rotationX") || this.isDirty("rotationY") || this.isDirty("rotationZ")) {
				projection.rotate([this.get("rotationX", 0), this.get("rotationY", 0), this.get("rotationZ", 0)])
				this.markDirtyProjection();
			}
		}

		if (this.isDirty("pinchZoom") || this.get("panX") || this.get("panY")) {
			this._setUpTouch();
		}

		// autoHome or an early goHome() once the map is first fitted; again after a refit on the way
		if (refitted && this._geometryColection.geometries.length > 0) {
			const goHomeOnFit = this._goHomeOnFit;
			const homeTarget = this._homeTarget;
			if ((!this._fitted && this.get("autoHome")) || goHomeOnFit || goingHome) {
				this._goHomeOnFit = undefined;
				// Going again takes as long as it was asked to the first time
				this._scheduleHome(goHomeOnFit ? goHomeOnFit.duration : goingHome && homeTarget ? homeTarget.duration : undefined);
			}
			this._fitted = true;
		}

		if (this.isDirty("translateX") || this.isDirty("translateY") || this.isDirty("zoomLevel") || this.isDirty("rotationX") || this.isDirty("rotationY") || this.isDirty("rotationZ") || this.isDirty("projection") || this._sizeDirty) {
			this._scheduleFocusView();
		}
	}

	protected _processSeries(series: this["_seriesType"]) {
		super._processSeries(series);
		this._disposers.push(series.events.on("datavalidated", () => {
			this._scheduleFocusView();
		}));
	}

	// Check of which focusable map objects are in view, waiting for the map to
	// stop moving
	protected _focusViewTimeout?: IDisposer;

	/**
	 * @ignore
	 */
	public _scheduleFocusView(): void {
		if (this._focusViewTimeout) {
			this.removeDispose(this._focusViewTimeout);
			this._focusViewTimeout.dispose();
		}
		this._focusViewTimeout = this.setTimeout(() => {
			this._focusViewTimeout = undefined;
			this._updateFocusView();
		}, 100);
	}

	// A focusable map object entirely outside the visible area is not a TAB stop
	// until panned or zoomed back. Even partly visible, it stays one
	protected _updateFocusView(): void {
		// The map is visible anywhere in the chart's root, or only in its own
		// area if that masks its content
		let left = 0;
		let top = 0;
		let right = this._root.container.width();
		let bottom = this._root.container.height();

		const chartContainer = this.chartContainer;
		if (chartContainer.get("maskContent")) {
			const p0 = chartContainer.toGlobal({ x: 0, y: 0 });
			const p1 = chartContainer.toGlobal({ x: chartContainer.width(), y: chartContainer.height() });
			left = Math.max(left, Math.min(p0.x, p1.x));
			top = Math.max(top, Math.min(p0.y, p1.y));
			right = Math.min(right, Math.max(p0.x, p1.x));
			bottom = Math.min(bottom, Math.max(p0.y, p1.y));
		}

		const check = (sprite: Sprite | undefined) => {
			if (sprite && sprite.get("focusable")) {
				const bounds = sprite._focusBounds();
				// At least a pixel of it in view
				const inView = bounds.right - left >= 1 && right - bounds.left >= 1 && bounds.bottom - top >= 1 && bottom - bounds.top >= 1;
				sprite.setPrivate("focusOutOfView", !inView);
			}
		};

		this.series.each((series) => {
			$array.each(series.dataItems, (dataItem: any) => {
				check(dataItem.get("mapPolygon"));
				check(dataItem.get("mapLine"));
				$array.each(dataItem.bullets || [], (bullet: any) => {
					check(bullet.get("sprite"));
				});
			});
		});
	}


	// Before the first fit there is no scale to zoom
	protected _applyZoom() {
		const mapScale = this.getPrivate("mapScale");
		if (mapScale) {
			this.get("projection")!.scale(mapScale * this.get("zoomLevel", 1));
		}
	}

	protected _fitMap() {
		const projection = this.get("projection")!;

		let w = this.innerWidth();
		let h = this.innerHeight();

		if (w > 0 && h > 0) {
			$mapUtils.fitProjection(projection, [w, h], this._geometryColection);
			this.setPrivateRaw("mapScale", projection.scale());

			const translate = projection.translate();

			this.setRaw("translateX", translate[0]);
			this.setRaw("translateY", translate[1]);

			this._centerX = translate[0];
			this._centerY = translate[1];

			const geoPath = this.getPrivate("geoPath");
			this._mapBounds = $mapUtils.boundsInOutline(projection, geoPath.bounds(this._geometryColection));

			this._geoCentroid = $mapUtils.getGeoCentroid(this._geometryColection);

			const bounds = $mapUtils.getGeoBounds(this._geometryColection);
			this._geoBounds = bounds;

			if (this._geometryColection.geometries.length > 0) {

				bounds.left = $math.round(this._geoBounds.left, 3);
				bounds.right = $math.round(this._geoBounds.right, 3);
				bounds.top = $math.round(this._geoBounds.top, 3);
				bounds.bottom = $math.round(this._geoBounds.bottom, 3);

				const prevGeoBounds = this._prevGeoBounds;

				if (prevGeoBounds && !$utils.sameBounds(bounds, prevGeoBounds)) {
					this._dispatchBounds = true;
					this._prevGeoBounds = bounds;
				}
			}

			this._mapFitted = true;
		}

		// Data that comes after the first frame refits here only
		this._updateOutlineMask();
	}

	/**
	 * Returns the point `goHome()` centers on: `homeGeoPoint` if set, otherwise
	 * the middle of the map fitted to the chart at the home rotation, whatever
	 * the current view.
	 */
	public homeGeoPoint(): IGeoPoint {
		let homeGeoPoint = this.get("homeGeoPoint");
		if (!homeGeoPoint) {
			const projection = this.get("projection")!;
			const w = this.innerWidth();
			const h = this.innerHeight();
			const geometries = this._geometryColection;
			if (w > 0 && h > 0 && geometries.geometries.length > 0 && projection.invert) {
				const scale = projection.scale();
				const translate = projection.translate();
				const rotate = projection.rotate ? projection.rotate() : undefined;
				if (rotate) {
					const rotation = this._homeRotation();
					projection.rotate([rotation[0], rotation[1], rotate[2]]);
				}
				$mapUtils.fitProjection(projection, [w, h], geometries);
				const center = projection.invert([w / 2, h / 2]);
				projection.scale(scale);
				projection.translate(translate);
				if (rotate) {
					projection.rotate(rotate);
				}
				if (center && $type.isNumber(center[0]) && $type.isNumber(center[1])) {
					return { longitude: center[0], latitude: center[1] };
				}
			}
			homeGeoPoint = this.invert({ x: w / 2, y: h / 2 });
		}
		return homeGeoPoint;
	}

	// The home rotation; a missing half keeps the current one
	protected _homeRotation(): [number, number] {
		return [this.get("homeRotationX", this.get("rotationX", 0)), this.get("homeRotationY", this.get("rotationY", 0))];
	}

	protected _view(): Array<number | undefined> {
		return $array.map(homeKeys, (key) => this.get(key) as number | undefined);
	}

	// Still on the way home from loading (or there): nothing else has moved the map since
	protected _isGoingHome(): boolean {
		const target = this._homeTarget;
		if (target) {
			const animating = this._animatingSettings as any;
			const view = this._view();
			for (let i = 0; i < homeKeys.length; i++) {
				const animation = animating[homeKeys[i]];
				const value = view[i];
				const to = target.view[i];
				// A finished animation can land a rounding error away
				const moved = value !== to && !($type.isNumber(value) && $type.isNumber(to) && Math.abs(value - to) < 1e-6);
				if (animation ? animation !== target.animations[i] : moved) {
					this._homeTarget = undefined;
					return false;
				}
			}
			return true;
		}
		return false;
	}

	// Goes home once this frame is drawn, and keeps track of it so a refit on the way can aim again
	protected _scheduleHome(duration?: number) {
		if (!this._homeScheduled) {
			this._homeScheduled = true;
			this._root.events.once("frameended", () => {
				this._homeScheduled = false;
				if (!this.isDisposed()) {
					// Going home as the map is first fitted sets up its initial view,
					// which is not announced
					this._silentZoom = true;
					this.goHome(duration);
					this._silentZoom = false;
					const animating = this._animatingSettings as any;
					const animations = $array.map(homeKeys, (key) => animating[key]);
					const view = this._view();
					this._homeTarget = { view: $array.map(animations, (animation, i) => animation ? animation.to : view[i]), animations: animations, duration: duration };
				}
			});
		}
	}

	/**
	 * Zooms and moves the map to its home position: `homeZoomLevel`,
	 * `homeGeoPoint`, and `homeRotationX` and `homeRotationY` if set. Called
	 * before the map is loaded, it goes there once it is.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#resetting-positionlevel} for more info
	 * @param  duration  Animation duration in milliseconds; `animationDuration` if not set
	 */
	public goHome(duration?: number) {
		this.series.each((series) => {
			series._onGoHome();
		});

		// Not fitted yet, so there is no home to go to: goes once it is
		if (!this._fitted) {
			this._goHomeOnFit = { duration: duration };
			return;
		}
		const rotation = this.get("homeRotationX") != null || this.get("homeRotationY") != null ? this._homeRotation() : [undefined, undefined];
		this.zoomToGeoPoint(this.homeGeoPoint(), this.get("homeZoomLevel", 1), true, duration, rotation[0], rotation[1]);
	}

	public _updateChildren() {
		const projection = this.get("projection")!;
		if (projection.invert) {
			let w = this.innerWidth();
			let h = this.innerHeight();
			if (w > 0 && h > 0) {
				const center = projection.invert([w / 2, h / 2]);
				// Not yet fitted, there is no center
				if (center && isFinite(center[0]) && isFinite(center[1])) {
					this._centerLocation = center;
				}
			}
		}
		super._updateChildren();
	}

	public _afterChanged() {
		super._afterChanged();
		if (this._dispatchBounds) {
			this._dispatchBounds = false;
			const type = "geoboundschanged";
			if (this.events.isEnabled(type)) {
				this.events.dispatch(type, { type: type, target: this });
			}
		}
	}

	protected _setUpTouch(): void {
		if (!this.chartContainer._display.cancelTouch) {
			this.chartContainer._display.cancelTouch = (this.get("pinchZoom") || this.get("panX") || this.get("panY")) ? true : false;
		}
	}


	/**
	 * @ignore
	 */
	public markDirtyGeometries() {
		this._dirtyGeometries = true;
		this.markDirty();
	}

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		this.series.each((series) => {
			series.markDirtyProjection();
		})
		this._updateOutlineMask();
	}

	// d3 does not cut shapes to such an outline, see `hasOwnOutline()`
	protected _updateOutlineMask() {
		const projection = this.get("projection");
		if (projection && projection !== this._outlineProjection) {
			this._outlineProjection = projection;
			this._ownOutline = $mapUtils.hasOwnOutline(projection);
		}

		const childrenDisplay = this.seriesContainer._childrenDisplay;
		let mask = this._outlineMask;

		// A mask set on `seriesContainer` wins
		if (this._ownOutline && !this.seriesContainer.get("mask")) {
			if (!mask) {
				mask = Graphics.new(this._root, {});
				this._outlineMask = mask;
				childrenDisplay.addChildAt(mask._display, 0);
				childrenDisplay.mask = mask._display;
			}
			// A new function each time, so it redraws
			mask.set("draw", (display) => {
				const path = this.getPrivate("geoPath");
				path.context(display as any);
				path({ type: "Sphere" });
				path.context(null);
			});
		}
		else if (mask) {
			childrenDisplay.removeChild(mask._display);
			if (childrenDisplay.mask === mask._display) {
				childrenDisplay.mask = null;
			}
			mask.dispose();
			this._outlineMask = undefined;
		}
	}

	protected _afterNew() {
		this._defaultThemes.push(MapChartDefaultTheme.new(this._root));
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["map"]);

		this.children.push(this.bulletsContainer);

		super._afterNew();

		this._makeGeoPath();

		this.chartContainer.children.push(this.seriesContainer);
		this.chartContainer.children.push(this.boxZoomSelection);

		if (this.get("translateX") == null) {
			this.set("translateX", this.width() / 2);
		}
		if (this.get("translateY") == null) {
			this.set("translateY", this.height() / 2);
		}

		// Setting trasnparent background so that full body of the plot container
		// is interactive
		this.chartContainer.set("interactive", true);
		this.chartContainer.set("interactiveChildren", false);
		this.chartContainer.set("background", Rectangle.new(this._root, {
			themeTags: ["map", "background"],
			fill: Color.fromHex(0x000000),
			fillOpacity: 0
		}));

		this._disposers.push(this.chartContainer.events.on("pointerdown", (event) => {
			this._handleChartDown(event);
		}));

		this._disposers.push(this.chartContainer.events.on("globalpointerup", (event) => {
			this._handleChartUp(event);
		}));

		this._disposers.push(this.chartContainer.events.on("globalpointermove", (event) => {
			this._handleChartMove(event);
		}));

		this._disposers.push(this.chartContainer.events.on("dblclick", (event) => {
			this._handleDoubleClick(event);
		}));

		// Box zoom
		this._disposers.push(this.chartContainer.events.on("pointerdown", (event) => {
			this._handleBoxDown(event);
		}));

		this._disposers.push(this.chartContainer.events.on("globalpointermove", (event) => {
			this._handleBoxMove(event);
		}));

		this._disposers.push(this.chartContainer.events.on("globalpointerup", (event) => {
			this._handleBoxUp(event);
		}));

		let license = false;
		for (let i = 0; i < registry.licenses.length; i++) {
			if (registry.licenses[i].match(/^AM5M.{5,}/i)) {
				license = true;
			}
		}
		if (!license) {
			this._root._showBranding();
		}
		else {
			this._root._licenseApplied();
		}

		this._setUpTouch();

	}

	protected _handleChartDown(event: ISpritePointerEvent) {

		this._downZoomLevel = this.get("zoomLevel", 1);
		const downPoints = this.chartContainer._downPoints;

		let count = $object.keys(downPoints).length;
		if (count == 1) {
			// workaround to solve a problem when events are added to some children of chart container (rotation stops working)
			let downPoint = downPoints[1];
			if (!downPoint) {
				downPoint = downPoints[0];
			}

			if (downPoint && (downPoint.x == event.point.x && downPoint.y == event.point.y)) {
				count = 0;
			}
		}

		if (count > 0) {
			this._downTranslateX = this.get("translateX");
			this._downTranslateY = this.get("translateY");
			this._downRotationX = this.get("rotationX");
			this._downRotationY = this.get("rotationY");
			this._downRotationZ = this.get("rotationZ");

			const downId = this.chartContainer._getDownPointId();
			if (downId) {
				let movePoint = this._movePoints[downId];
				if (movePoint) {
					this.chartContainer._downPoints[downId] = movePoint;
				}
			}
		}
		else if (count == 0) {
			let bg = this.chartContainer.get("background");
			if (bg) {
				bg.events.enableType("click");
			}

			if (this.get("panX") || this.get("panY")) {

				if (this._za) {
					this._za.stop();
				}
				if (this._txa) {
					this._txa.stop();
				}
				if (this._tya) {
					this._tya.stop();
				}
				if (this._rxa) {
					this._rxa.stop();
				}
				if (this._rya) {
					this._rya.stop();
				}

				const downPoint = this.chartContainer._display.toLocal(event.point);
				this._downTranslateX = this.get("translateX");
				this._downTranslateY = this.get("translateY");
				this._downRotationX = this.get("rotationX");
				this._downRotationY = this.get("rotationY");
				this._downRotationZ = this.get("rotationZ");

				let projection = this.get("projection")!;

				if (projection.invert) {
					let l0 = projection.invert([downPoint.x, downPoint.y]);
					let l1 = projection.invert([downPoint.x + 1, downPoint.y + 1]);
					if (l0 && l1) {
						this._pLon = Math.abs(l1[0] - l0[0]);
						this._pLat = Math.abs(l1[1] - l0[1]);
					}
				}
			}
		}
	}

	/**
	 * Converts a point on the map to geographic coordinates. A point with no
	 * location, such as one off a globe, gives longitude and latitude `0`.
	 *
	 * @param  point  Point in pixels, relative to the map's area (the chart inside its padding)
	 * @return        Geographic coordinates
	 */
	public invert(point: IPoint): IGeoPoint {
		let projection = this.get("projection")!;

		if (projection.invert) {
			const ll = projection.invert([point.x, point.y]);
			if (ll) {
				return { longitude: ll[0], latitude: ll[1] };
			}
		}

		return { longitude: 0, latitude: 0 };
	}

	/**
	 * Converts geographic coordinates to a point on the map. Given one rotation
	 * only, it takes the other, and `rotationZ`, as `0`.
	 *
	 * @param  point      Geographic coordinates
	 * @param  rotationX  `rotationX` to convert at instead of the current rotation
	 * @param  rotationY  `rotationY` to convert at instead of the current rotation
	 *
	 * @return Point in pixels, relative to the map's area (the chart inside its padding)
	 */
	public convert(point: IGeoPoint, rotationX?: number, rotationY?: number): IPoint {
		let projection = this.get("projection")!;
		let xy;

		if (!projection.rotate) {
			rotationX = undefined;
			rotationY = undefined;
		}

		if (rotationX != null || rotationY != null) {
			if (rotationX == null) {
				rotationX = 0;
			}
			if (rotationY == null) {
				rotationY = 0;
			}
			let rotation = projection.rotate();
			projection.rotate([rotationX, rotationY, 0]);
			xy = projection([point.longitude, point.latitude]);
			projection.rotate(rotation);
		}
		else {
			xy = projection([point.longitude, point.latitude]);
		}

		if (xy) {
			return { x: xy[0], y: xy[1] };
		}

		return { x: 0, y: 0 };
	}

	protected _handleChartUp(_event: ISpritePointerEvent) {
		this.chartContainer._downPoints = {}
	}

	protected _handlePinch() {
		const chartContainer = this.chartContainer;
		let i = 0;
		let downPoints: Array<IPoint> = [];
		let movePoints: Array<IPoint> = [];

		$object.each(chartContainer._downPoints, (k, point) => {
			downPoints[i] = point;
			let movePoint = this._movePoints[k];
			if (movePoint) {
				movePoints[i] = movePoint;
			}
			i++;
		});

		if (downPoints.length > 1 && movePoints.length > 1) {
			const display = chartContainer._display;

			let downPoint0 = downPoints[0];
			let downPoint1 = downPoints[1];

			let movePoint0 = movePoints[0];
			let movePoint1 = movePoints[1];

			if (downPoint0 && downPoint1 && movePoint0 && movePoint1) {

				downPoint0 = display.toLocal(downPoint0);
				downPoint1 = display.toLocal(downPoint1);

				movePoint0 = display.toLocal(movePoint0);
				movePoint1 = display.toLocal(movePoint1);

				let initialDistance = Math.hypot(downPoint1.x - downPoint0.x, downPoint1.y - downPoint0.y);
				let currentDistance = Math.hypot(movePoint1.x - movePoint0.x, movePoint1.y - movePoint0.y);

				let level = currentDistance / initialDistance * this._downZoomLevel;
				level = $math.fitToRange(level, this.get("minZoomLevel", 1), this.get("maxZoomLevel", 32));

				let moveCenter = { x: movePoint0.x + (movePoint1.x - movePoint0.x) / 2, y: movePoint0.y + (movePoint1.y - movePoint0.y) / 2 };
				let downCenter = { x: downPoint0.x + (downPoint1.x - downPoint0.x) / 2, y: downPoint0.y + (downPoint1.y - downPoint0.y) / 2 };

				let tx = this._downTranslateX || 0;
				let ty = this._downTranslateY || 0;

				let zoomLevel = this._downZoomLevel;

				let xx = moveCenter.x - (- tx + downCenter.x) / zoomLevel * level;
				let yy = moveCenter.y - (- ty + downCenter.y) / zoomLevel * level;

				this.set("zoomLevel", level);
				this.set("translateX", xx);
				this.set("translateY", yy);
			}
		}
	}

	protected _handleChartMove(event: ISpritePointerEvent) {
		const chartContainer = this.chartContainer;
		let downPoint = chartContainer._getDownPoint();
		const downPointId = chartContainer._getDownPointId();
		const originalEvent = event.originalEvent as any;

		const pointerId = originalEvent.pointerId;

		if (this.get("pinchZoom")) {
			if (pointerId) {
				this._movePoints[pointerId] = event.point;

				if ($object.keys(chartContainer._downPoints).length > 1) {
					this._handlePinch();
					return;
				}
			}
		}

		if (downPointId && pointerId && pointerId != downPointId) {
			return;
		}
		else {
			if (downPoint) {
				const panX = this.get("panX");
				const panY = this.get("panY");
				if (panX != "none" || panY != "none") {
					const display = chartContainer._display;
					let local = display.toLocal(event.point);
					downPoint = display.toLocal(downPoint);

					let x = this._downTranslateX;
					let y = this._downTranslateY;

					if (Math.hypot(downPoint.x - local.x, downPoint.y - local.y) > 5) {
						let bg = chartContainer.get("background");
						if (bg) {
							bg.events.disableType("click");
						}

						if ($type.isNumber(x) && $type.isNumber(y)) {
							let projection = this.get("projection")!;
							const zoomLevel = this.get("zoomLevel", 1);

							const maxPanOut = this.get("maxPanOut", 0.4);
							const bounds = this._mapBounds;

							const w = this.innerWidth();
							const h = this.innerHeight();

							const ww = bounds[1][0] - bounds[0][0];
							const hh = bounds[1][1] - bounds[0][1];

							// A map bigger than the view can always be panned to its edges. A map
							// already past the limit (e.g. zoomed to a point) does not jump back
							const downX = x;
							const downY = y;
							if (panX == "translateX") {
								x += local.x - downPoint.x;

								const cx = w / 2 - (w / 2 - this._centerX) * zoomLevel;
								const maxX = Math.max(ww * maxPanOut * zoomLevel, (ww * zoomLevel - w) / 2);
								x = Math.min(x, Math.max(cx + maxX, downX));
								x = Math.max(x, Math.min(cx - maxX, downX));

							}
							if (panY == "translateY") {
								y += local.y - downPoint.y;
								const cy = h / 2 - (h / 2 - this._centerY) * zoomLevel;
								const maxY = Math.max(hh * maxPanOut * zoomLevel, (hh * zoomLevel - h) / 2);
								y = Math.min(y, Math.max(cy + maxY, downY));
								y = Math.max(y, Math.min(cy - maxY, downY));
							}

							this.set("translateX", x);
							this.set("translateY", y);

							if (projection.invert) {
								let downLocation = projection.invert([downPoint.x, downPoint.y]);
								if (location && downLocation) {
									if (panX == "rotateX") {
										this.set("rotationX", this._downRotationX! - (downPoint.x - local.x) * this._pLon);
									}
									if (panY == "rotateY") {
										this.set("rotationY", this._downRotationY! + (downPoint.y - local.y) * this._pLat);
									}
								}
							}
						}
					}
				}
			}
		}
	}

	protected _handleWheelRotateY(delta: number, duration: number, easing: (t: Time) => Time) {
		this._rya = this.animate({ key: "rotationY", to: this.get("rotationY", 0) - delta, duration: duration, easing: easing });
	}

	protected _handleWheelRotateX(delta: number, duration: number, easing: (t: Time) => Time) {
		this._rxa = this.animate({ key: "rotationX", to: this.get("rotationX", 0) - delta, duration: duration, easing: easing });
	}

	protected _handleWheelZoom(delta: number, point: IPoint) {
		let step = this.get("zoomStep", 2);
		let zoomLevel = this.get("zoomLevel", 1);
		let newZoomLevel = zoomLevel;
		if (delta > 0) {
			newZoomLevel = zoomLevel / step;
		}
		else if (delta < 0) {
			newZoomLevel = zoomLevel * step;
		}

		if (newZoomLevel != zoomLevel) {
			this.zoomToPoint(point, newZoomLevel)
		}
	}

	/**
	 * Zooms the map to fit geographic bounds, with a 10% margin. Bounds whose
	 * `right` is less than `left` take all longitudes.
	 *
	 * @param  geoBounds  Longitudes `left` and `right`, latitudes `top` and `bottom`, in degrees
	 * @param  duration   Animation duration in milliseconds; `animationDuration` if not set
	 * @param  rotationX  `rotationX` to end at
	 * @param  rotationY  `rotationY` to end at
	 * @return            Zoom level animation
	 */
	public zoomToGeoBounds(geoBounds: { left: number, right: number, top: number, bottom: number }, duration?: number, rotationX?: number, rotationY?: number): Animation<this["_settings"]["zoomLevel"]> | undefined {
		if (geoBounds.right < geoBounds.left) {
			geoBounds = { left: -180, right: 180, top: geoBounds.top, bottom: geoBounds.bottom };
		}

		const geoPath = this.getPrivate("geoPath");
		const mapBounds = $mapUtils.boundsInOutline(this.get("projection")!, geoPath.bounds(this._geometryColection));

		let p0 = this.convert({ longitude: geoBounds.left, latitude: geoBounds.top }, rotationX, rotationY);
		let p1 = this.convert({ longitude: geoBounds.right, latitude: geoBounds.bottom }, rotationX, rotationY);

		if (p0.y < mapBounds[0][1]) {
			p0.y = mapBounds[0][1];
		}

		if (p1.y > mapBounds[1][1]) {
			p1.y = mapBounds[1][1];
		}

		let zl = this.get("zoomLevel", 1);

		let bounds = { left: p0.x, right: p1.x, top: p0.y, bottom: p1.y };

		let seriesContainer = this.seriesContainer;

		let zoomLevel = .9 * Math.min(seriesContainer.innerWidth() / (bounds.right - bounds.left) * zl, seriesContainer.innerHeight() / (bounds.bottom - bounds.top) * zl);
		let x = bounds.left + (bounds.right - bounds.left) / 2;
		let y = bounds.top + (bounds.bottom - bounds.top) / 2;

		let geoPoint = this.invert({ x, y });

		if (rotationX != null || rotationY != null) {
			this.rotate(rotationX, rotationY, duration);
		}

		return this.zoomToGeoPoint(geoPoint, zoomLevel, true, duration);
	}

	/**
	 * Zooms the map in or out at a point on it. With `centerMapOnZoomOut`, a
	 * zoom to `homeZoomLevel` centers on the home point instead.
	 *
	 * @param  point    Point in pixels, relative to the map's area (the chart inside its padding)
	 * @param  level    Zoom level, kept within `minZoomLevel` and `maxZoomLevel`
	 * @param  center   Move the point to the middle; otherwise it stays where it is
	 * @param  duration Animation duration in milliseconds; `animationDuration` if not set
	 * @return          Zoom level animation
	 */
	public zoomToPoint(point: IPoint, level: number, center?: boolean, duration?: number): Animation<this["_settings"]["zoomLevel"]> | undefined {
		if (level) {
			level = $math.fitToRange(level, this.get("minZoomLevel", 1), this.get("maxZoomLevel", 32));
		}

		if (!$type.isNumber(duration)) {
			duration = this.get("animationDuration", 0);
		}
		const easing = this.get("animationEasing");
		const zoomLevel = this.get("zoomLevel", 1);

		if (this.get("centerMapOnZoomOut") && level == this.get("homeZoomLevel", 1)) {
			const rotation = this.get("homeRotationX") != null || this.get("homeRotationY") != null ? this._homeRotation() : [undefined, undefined];
			point = this.convert(this.homeGeoPoint(), rotation[0], rotation[1]);
			center = true;
		}

		let x = point.x;
		let y = point.y;

		let tx = this.get("translateX", 0);
		let ty = this.get("translateY", 0);

		let cx = x;
		let cy = y;

		// The middle of the map's area, inside the chart's padding
		if (center) {
			cx = this.innerWidth() / 2;
			cy = this.innerHeight() / 2;
		}

		let xx = cx - ((x - tx) / zoomLevel * level);
		let yy = cy - ((y - ty) / zoomLevel * level);


		this._txa = this.animate({ key: "translateX", to: xx, duration: duration, easing: easing });
		this._tya = this.animate({ key: "translateY", to: yy, duration: duration, easing: easing });
		this._za = this.animate({ key: "zoomLevel", to: level, duration: duration, easing: easing });

		if (zoomLevel != level && !this._silentZoom) {
			this._announceZoom(level);
		}

		return this._za;
	}

	// Announces the zoom level once zooming settles, so a wheel or a quick
	// series of zooms reads out only the level it ends at
	protected _announceZoom(level: number) {
		if (this._zoomAlert) {
			this.removeDispose(this._zoomAlert);
			this._zoomAlert.dispose();
		}
		this._zoomAlert = this.setTimeout(() => {
			this._zoomAlert = undefined;
			this._root.readerAlert(this._t("Zoom level changed to %1", this._root.locale, this._root.numberFormatter.format(level, "#.#")));
		}, 300);
	}

	/**
	 * Zooms the map in or out at a geographic point.
	 *
	 * @param  geoPoint   Geographic point
	 * @param  level      Zoom level, kept within `minZoomLevel` and `maxZoomLevel`
	 * @param  center     Move the point to the middle; otherwise it stays where it is
	 * @param  duration   Animation duration in milliseconds; `animationDuration` if not set
	 * @param  rotationX  `rotationX` to end at
	 * @param  rotationY  `rotationY` to end at
	 * @return            Zoom level animation
	 *
	 */
	public zoomToGeoPoint(geoPoint: IGeoPoint, level: number, center?: boolean, duration?: number, rotationX?: number, rotationY?: number): Animation<this["_settings"]["zoomLevel"]> | undefined {

		let xy = this.convert(geoPoint, rotationX, rotationY);

		if (rotationX != null || rotationY != null) {
			this.rotate(rotationX, rotationY, duration);
		}

		if (xy) {
			return this.zoomToPoint(xy, level, center, duration);
		}
	}

	/**
	 * Rotates the map to the given angles, in degrees. Does nothing on a
	 * projection that can't rotate.
	 *
	 * @param  rotationX  `rotationX` to end at; unchanged if not set
	 * @param  rotationY  `rotationY` to end at; unchanged if not set
	 * @param  duration   Animation duration in milliseconds; `animationDuration` if not set
	 */
	public rotate(rotationX?: number, rotationY?: number, duration?: number) {
		const projection = this.get("projection")!;
		if (!projection.rotate) {
		}
		else {
			if (!$type.isNumber(duration)) {
				duration = this.get("animationDuration", 0);
			}

			const easing = this.get("animationEasing");
			if (rotationX != null) {
				this.animate({ key: "rotationX", to: rotationX, duration: duration, easing: easing });
			}
			if (rotationY != null) {
				this.animate({ key: "rotationY", to: rotationY, duration: duration, easing: easing });
			}
		}
	}

	/**
	 * Morphs the map from the current projection into `target`.
	 *
	 * d3-geo projections don't expose their raw functions, so pass `targetRaw`
	 * along, and on the first call `sourceRaw` for the current projection;
	 * later calls reuse the previous target's. Without a source raw function,
	 * or with a zero duration, the projection switches at once.
	 *
	 * @param target     Target projection (e.g. `geoOrthographic()`)
	 * @param targetRaw  Raw projection function (e.g. `geoOrthographicRaw`)
	 * @param duration   Duration in milliseconds (default: `animationDuration`)
	 * @param easing     Easing function (default: `animationEasing`)
	 * @param sourceRaw  Raw function of the current projection (needed on first call)
	 *
	 * @since 5.16.0
	 */
	public animateProjection(
		target: GeoProjection,
		targetRaw: GeoRawProjection,
		duration?: number,
		easing?: (t: Time) => Time,
		sourceRaw?: GeoRawProjection
	): void {

		// Cancel any ongoing projection blend animation
		if (this._projectionBlendAnim) {
			this._projectionBlendAnim.stop();
			this._projectionBlendAnim = undefined;
			this._projectionBlendData = undefined;
		}

		// Use provided sourceRaw, or fall back to stored one from previous call
		if (sourceRaw) {
			this._projectionRaw = sourceRaw;
		}

		const currentRaw = this._projectionRaw;

		// If we don't have a source raw, snap immediately
		if (!currentRaw) {
			this.set("projection", target);
			this._projectionRaw = targetRaw;
			return;
		}

		if (duration == null) {
			duration = this.get("animationDuration", 0);
		}

		if (!duration) {
			this.set("projection", target);
			this._projectionRaw = targetRaw;
			return;
		}

		if (!easing) {
			easing = this.get("animationEasing");
		}

		// Stop ongoing zoom/pan/rotation animations
		if (this._za) this._za.stop();
		if (this._txa) this._txa.stop();
		if (this._tya) this._tya.stop();
		if (this._rxa) this._rxa.stop();
		if (this._rya) this._rya.stop();

		const w = this.innerWidth();
		const h = this.innerHeight();

		// Capture current source state
		const sScale = this.getPrivate("mapScale")!;
		const sTx = this.get("translateX", w / 2);
		const sTy = this.get("translateY", h / 2);

		// Compute fitted target state using a temporary projection
		const tempTarget = geoProjection(targetRaw);
		tempTarget.fitSize([w, h], this._geometryColection);
		const tScale = tempTarget.scale();
		const tTranslate = tempTarget.translate();

		// Create blended projection via geoProjectionMutator
		const mutate = geoProjectionMutator((t: number) => {
			return (lambda: number, phi: number): [number, number] => {
				const p0 = currentRaw(lambda, phi);
				const p1 = targetRaw(lambda, phi);
				return [
					(1 - t) * p0[0] + t * p1[0],
					(1 - t) * p0[1] + t * p1[1]
				];
			};
		});

		// Initialize at t=0
		const blended = (mutate as any)(0) as GeoProjection;

		blended.scale(sScale * this.get("zoomLevel", 1));
		blended.translate([sTx, sTy]);
		blended.precision(0.5);

		if (blended.rotate) {
			blended.rotate([
				this.get("rotationX", 0),
				this.get("rotationY", 0),
				this.get("rotationZ", 0)
			]);
		}

		// Install blended projection without triggering isDirty("projection") cascade
		this.setRaw("projection", blended);
		this._makeGeoPath();

		// Store blend data for _prepareChildren to use
		this._projectionBlendData = {
			blended,
			mutate,
			sourceScale: sScale,
			targetScale: tScale,
			sourceTranslateX: sTx,
			sourceTranslateY: sTy,
			targetTranslateX: tTranslate[0],
			targetTranslateY: tTranslate[1],
			target,
			targetRaw
		};

		// Animate the blend value 0→1 using the standard animation system
		this._projectionBlendAnim = this.animatePrivate({
			key: "projectionBlend",
			from: 0,
			to: 1,
			duration,
			easing
		});
	}

	/**
	 * Zooms the map in by `zoomStep`, at the middle of the view.
	 *
	 * @return Zoom level animation
	 */
	public zoomIn(): Animation<this["_settings"]["zoomLevel"]> | undefined {
		return this.zoomToPoint({ x: this.innerWidth() / 2, y: this.innerHeight() / 2 }, this.get("zoomLevel", 1) * this.get("zoomStep", 2));
	}

	/**
	 * Zooms the map out by `zoomStep`, at the middle of the view.
	 *
	 * @return Zoom level animation
	 */
	public zoomOut(): Animation<this["_settings"]["zoomLevel"]> | undefined {
		return this.zoomToPoint({ x: this.innerWidth() / 2, y: this.innerHeight() / 2 }, this.get("zoomLevel", 1) / this.get("zoomStep", 2));
	}

	public _clearDirty() {
		super._clearDirty();
		this._dirtyGeometries = false;
		this._mapFitted = false;
	}

	protected _dispose() {
		super._dispose();
		if (this._outlineMask) {
			this._outlineMask.dispose();
			this._outlineMask = undefined;
		}
	}

	/**
	 * Returns the area a polygon takes on screen at the current zoom.
	 *
	 * @param  dataItem  Data item of a [[MapPolygonSeries]]
	 * @return           Area in square pixels
	 */
	public getArea(dataItem: DataItem<IMapPolygonSeriesDataItem>): number {
		const geoPath = this.getPrivate("geoPath");
		const geometry = dataItem.get("geometry");
		if (geometry) {
			return geoPath.area(geometry);
		}
		return 0;
	}
}
