import type { MapSeries } from "./MapSeries";
import type { MapPointSeries } from "./MapPointSeries";
import type { GeoProjection, GeoPath } from "d3-geo";
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
import { geoPath } from "d3-geo";
import { Color } from "../../core/util/Color";
import { registry } from "../../core/Registry";

import * as $math from "../../core/util/Math";
import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $mapUtils from "./MapUtils";
import * as $object from "../../core/util/Object";
import * as $utils from "../../core/util/Utils";

import type { IDisposer } from "../../core/util/Disposer";
import type { ISpritePointerEvent } from "../../core/render/Sprite";


export interface IMapChartSettings extends ISerialChartSettings {

	/**
	 * A projection to use when plotting the map.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/#Projections} for more info
	 */
	projection?: GeoProjection;

	/**
	 * Current zoom level.
	 */
	zoomLevel?: number;

	/**
	 * current x position of a map
	 */
	translateX?: number;

	/**
	 * current y position of a map
	 */
	translateY?: number;

	/**
	 * Vertical centering of the map.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/#Centering_the_map} for more info
	 */
	rotationY?: number;

	/**
	 * Horizontal centering of the map.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/#Centering_the_map} for more info
	 */
	rotationX?: number;

	/**
	 * Depth centering of the map.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/#Centering_the_map} for more info
	 */
	rotationZ?: number;

	/**
	 * Highest zoom level map is allowed to zoom in to.
	 *
	 * @deault 32
	 */
	maxZoomLevel?: number;

	/**
	 * Lowest zoom level map is allowed to zoom in to.
	 *
	 * @deault 1
	 */
	minZoomLevel?: number;

	/**
	 * Increment zoom level by `zoomStep` when user zooms in via [[ZoomControl]] or
	 * API.
	 *
	 * @default 2
	 */
	zoomStep?: number;

	/**
	 * Defines what happens when map is being dragged horizontally.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Panning} for more info
	 * @default "translateX"
	 */
	panX?: "none" | "rotateX" | "translateX";

	/**
	 * Defines what happens when map is being dragged vertically.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Panning} for more info
	 * @default "translateY"
	 */
	panY?: "none" | "rotateY" | "translateY";

	/**
	 * Enables pinch-zooming of the map on multi-touch devices.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Pinch_zoom} for more info
	 * @default true
	 */
	pinchZoom?: boolean;

	/**
	 * Defines what happens when horizontal mouse wheel (only some mouses do have such a wheel)
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Mouse_wheel_behavior} for more info
	 * @default "none"
	 */
	wheelX?: "none" | "zoom" | "rotateX" | "rotateY";

	/**
	 * Defines what happens when mouse wheel is turned.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Mouse_wheel_behavior} for more info
	 * @default "zoom"
	 */
	wheelY?: "none" | "zoom" | "rotateX" | "rotateY";

	/**
	 * Sensitivity of a mouse wheel.
	 *
	 * NOTE: this setting is ignored when `wheelX` or `wheelY` is set to `"zoom"`.
	 *
	 * @default 1
	 */
	wheelSensitivity?: number;

	/**
	 * Duration of mouse-wheel action animation, in milliseconds.
	 *
	 * NOTE: this setting is ignored when `wheelX` or `wheelY` is set to `"zoom"`.
	 */
	wheelDuration?: number;

	/**
	 * An easing function to use for mouse wheel action animations.
	 *
	 * NOTE: this setting is ignored when `wheelX` or `wheelY` is set to `"zoom"`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Easing_functions} for more info
	 * @default am5.ease.out($ease.cubic)
	 */
	wheelEasing?: (t: Time) => Time;

	/**
	 * Duration of zoom/pan animations, in milliseconds.
	 */
	animationDuration?: number;

	/**
	 * An easing function to use for zoom/pan animations.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Easing_functions} for more info
	 * @default am5.ease.out($ease.cubic)
	 */
	animationEasing?: (t: Time) => Time;


	/**
	 * A [[ZoomControl]] instance.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/#Zoom_control} for more info
	 */
	zoomControl?: ZoomControl;

	/**
	 * Initial/home zoom level.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Initial_position_and_zoom} for more info
	 */
	homeZoomLevel?: number;

	/**
	 * Initial/home rotationX.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Initial_position_and_zoom} for more info
	 */
	homeRotationX?: number;

	/**
	 * Initial/home rotationY.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Initial_position_and_zoom} for more info
	 */
	homeRotationY?: number;

	/**
	 * Initial coordinates to center map on load or `goHome()` call.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Initial_position_and_zoom} for more info
	 */
	homeGeoPoint?: IGeoPoint;

	/**
	 * How much of a map can go outside the viewport.
	 *
	 * @default 0.4
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Panning_outside_viewport} for more info
	 */
	maxPanOut?: number;

	/**
	 * Setting `true` means that the map will automatically center itself (or go
	 * to `homeGeoPoint` if set) when fully zoomed out.
	 *
	 * `false` would mean that zoom out will be centered around the mouse
	 * cursor (when zooming using wheel), or current map position.
	 * 
	 * @default true
	 * @since 5.2.1
	 */
	centerMapOnZoomOut?: boolean;

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

}


export interface IMapChartEvents extends ISerialChartEvents {

	/**
	 * Invoked when geo bounds of the map change, usually after map is
	 * initialized.
	 */
	geoboundschanged: {};

}


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

	protected _centerX: number = 0;
	protected _centerY: number = 0;

	protected _makeGeoPath() {
		const projection = this.get("projection")!;
		const path = geoPath();
		path.projection(projection);
		this.setPrivateRaw("geoPath", path);
	}

	/**
	 * Returns a geoPoint of the current zoom position.
	 * 
	 * You can later use it to restore zoom position, e.g.: `chart.zoomToGeoPoint(geoPoint, zoomLevel, true)`.
	 *
	 * @since 5.2.19
	 */
	public geoPoint() {
		return this.invert(this.seriesContainer.toGlobal({ x: this.width() / 2, y: this.height() / 2 }));
	}

	/**
	 * Returns coordinates to geographical center of the map.
	 */
	public geoCentroid() {
		return this._geoCentroid;
	}

	/**
	 * Returns geographical bounds of the map.
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
					if(this.get("zoomLevel") == this.get("minZoomLevel", 1) && wheelEvent.deltaY > 0) {
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
				if(prevent) {
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

	public _prepareChildren() {
		super._prepareChildren();

		const projection = this.get("projection")!;
		const w = this.innerWidth();
		const h = this.innerHeight();

		const previousGeometries = this._geometryColection.geometries;

		if (this.isDirty("projection")) {
			this._makeGeoPath();
			this.markDirtyProjection();
			this._fitMap();

			projection.scale(this.getPrivate("mapScale") * this.get("zoomLevel", 1));
			if (projection.rotate) {
				projection.rotate([this.get("rotationX", 0), this.get("rotationY", 0), this.get("rotationZ", 0)])
			}

			let prev = this._prevSettings.projection;
			if (prev && prev != projection) {
				let hw = w / 2;
				let hh = h / 2;
				if (prev.invert) {
					let centerLocation = prev.invert([hw, hh]);

					if (centerLocation) {

						let xy = projection(centerLocation);
						if (xy) {
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

		if (this.isDirty("wheelX") || this.isDirty("wheelY")) {
			this._handleSetWheel();
		}
		if (this._dirtyGeometries) {
			this._geometryColection.geometries = [];

			this.series.each((series) => {
				$array.pushAll(this._geometryColection.geometries, series._geometries);
			})


			this._fitMap();
		}

		if (previousGeometries.length != 0 && (w != this._pw || h != this._ph || this._dirtyGeometries)) {
			if (w > 0 && h > 0) {
				let hw = w / 2;
				let hh = h / 2;

				projection.fitSize([w, h], this._geometryColection);
				const newScale = projection.scale();

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

				const geoPath = this.getPrivate("geoPath");
				this._mapBounds = geoPath.bounds(this._geometryColection);
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
			projection.scale(this.getPrivate("mapScale") * this.get("zoomLevel", 1));
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
					this.root.events.once("frameended", () =>{
						zoomControl.minusButton.set("disabled", true);
					})										
				}
				else {
					zoomControl.minusButton.set("disabled", false);
				}

				if (zoomLevel == this.get("maxZoomLevel", 32)) {
					zoomControl.plusButton.set("disabled", true);
				}
				else {
					zoomControl.plusButton.set("disabled", false);
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
	}


	protected _fitMap() {
		const projection = this.get("projection")!;

		let w = this.innerWidth();
		let h = this.innerHeight();

		if (w > 0 && h > 0) {
			projection.fitSize([w, h], this._geometryColection);
			this.setPrivateRaw("mapScale", projection.scale());

			const translate = projection.translate();

			this.setRaw("translateX", translate[0]);
			this.setRaw("translateY", translate[1]);

			this._centerX = translate[0];
			this._centerY = translate[1];

			const geoPath = this.getPrivate("geoPath");
			this._mapBounds = geoPath.bounds(this._geometryColection);

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
	}

	/**
	 * Returns geographical coordinates for calculated or manual center of the
	 * map.
	 */
	public homeGeoPoint(): IGeoPoint {
		let homeGeoPoint = this.get("homeGeoPoint");
		if (!homeGeoPoint) {
			const geoPath = this.getPrivate("geoPath");
			const bounds = geoPath.bounds(this._geometryColection);

			const left = bounds[0][0];
			const top = bounds[0][1];

			const right = bounds[1][0];
			const bottom = bounds[1][1];

			homeGeoPoint = this.invert({ x: left + (right - left) / 2, y: top + (bottom - top) / 2 });
		}
		return homeGeoPoint;
	}

	/**
	 * Repositions the map to the "home" zoom level and center coordinates.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Resetting_position_level} for more info
	 * @param  duration  Animation duration in milliseconds
	 */
	public goHome(duration?: number) {
		this.zoomToGeoPoint(this.homeGeoPoint(), this.get("homeZoomLevel", 1), true, duration, this.get("homeRotationX"), this.get("homeRotationY"));
	}

	public _updateChildren() {
		const projection = this.get("projection")!;
		if (projection.invert) {
			let w = this.innerWidth();
			let h = this.innerHeight();
			if (w > 0 && h > 0) {
				this._centerLocation = projection.invert([this.innerWidth() / 2, this.innerHeight() / 2]);
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
	}

	protected _afterNew() {
		this._defaultThemes.push(MapChartDefaultTheme.new(this._root));
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["map"]);

		this.children.push(this.bulletsContainer);

		super._afterNew();

		this._makeGeoPath();

		this.chartContainer.children.push(this.seriesContainer);

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
	 * Converts screen coordinates (X and Y) within chart to latitude and
	 * longitude.
	 * 
	 * @param  point  Screen coordinates
	 * @return        Geographical coordinates
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
	 * Converts latitude/longitude to screen coordinates (X and Y).
	 * 
	 * @param  point  Geographical coordinates
	 * @param  rotationX  X rotation of a map if different from current
	 * @param  rotationY  Y rotation of a map if different from current
	 * 
	 * @return Screen coordinates
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

							const w = this.width();
							const h = this.height();

							const ww = bounds[1][0] - bounds[0][0];
							const hh = bounds[1][1] - bounds[0][1];

							if (panX == "translateX") {
								x += local.x - downPoint.x;

								const cx = w / 2 - (w / 2 - this._centerX) * zoomLevel;
								x = Math.min(x, cx + ww * maxPanOut * zoomLevel);
								x = Math.max(x, cx - ww * maxPanOut * zoomLevel);

							}
							if (panY == "translateY") {
								y += local.y - downPoint.y;
								const cy = h / 2 - (h / 2 - this._centerY) * zoomLevel;
								y = Math.min(y, cy + hh * maxPanOut * zoomLevel);
								y = Math.max(y, cy - hh * maxPanOut * zoomLevel);
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
	 * Zoom the map to geographical bounds.
	 *
	 * @param  geoBounds  Bounds
	 * @param  duration   Animation duration in milliseconds
	 * @param  rotationX  X rotation of a map at the end of zoom
	 * @param  rotationY  Y rotation of a map at the end of zoom
	 */
	public zoomToGeoBounds(geoBounds: { left: number, right: number, top: number, bottom: number }, duration?: number, rotationX?: number, rotationY?: number): Animation<this["_settings"]["zoomLevel"]> | undefined {
		if (geoBounds.right < geoBounds.left) {
			geoBounds.right = 180;
			geoBounds.left = -180;
		}

		const geoPath = this.getPrivate("geoPath");
		const mapBounds = geoPath.bounds(this._geometryColection);

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
			this.rotate(rotationX, rotationY);
		}

		return this.zoomToGeoPoint(geoPoint, zoomLevel, true, duration);
	}

	/**
	 * Zooms the map to specific screen point.
	 *
	 * @param  point    Point
	 * @param  level    Zoom level
	 * @param  center   Center the map
	 * @param  duration Duration of the animation in milliseconds
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
			point = this.convert(this.homeGeoPoint(), this.get("homeRotationX"), this.get("homeRotationY"));
			center = true;
		}

		let x = point.x;
		let y = point.y;

		let tx = this.get("translateX", 0);
		let ty = this.get("translateY", 0);

		let cx = x;
		let cy = y;

		if (center) {
			cx = this.width() / 2;
			cy = this.height() / 2;
		}

		let xx = cx - ((x - tx) / zoomLevel * level);
		let yy = cy - ((y - ty) / zoomLevel * level);


		this._txa = this.animate({ key: "translateX", to: xx, duration: duration, easing: easing });
		this._tya = this.animate({ key: "translateY", to: yy, duration: duration, easing: easing });
		this._za = this.animate({ key: "zoomLevel", to: level, duration: duration, easing: easing });

		if (zoomLevel != level) {
			this._root.readerAlert(this._t("Zoom level changed to %1", this._root.locale, $type.numberToString(level)));
		}

		return this._za;
	}

	/**
	 * Zooms the map to specific geographical point.
	 *
	 * @param  geoPoint  Point
	 * @param  level     Zoom level
	 * @param  center    Center the map
	 * @param  duration  Duration of the animation in milliseconds
	 * @param  rotationX  X rotation of a map at the end of zoom
	 * @param  rotationY  Y rotation of a map at the end of zoom
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
	 * Zooms the map in.
	 */
	public zoomIn(): Animation<this["_settings"]["zoomLevel"]> | undefined {
		return this.zoomToPoint({ x: this.width() / 2, y: this.height() / 2 }, this.get("zoomLevel", 1) * this.get("zoomStep", 2));
	}

	/**
	 * Zooms the map out.
	 */
	public zoomOut(): Animation<this["_settings"]["zoomLevel"]> | undefined {
		return this.zoomToPoint({ x: this.width() / 2, y: this.height() / 2 }, this.get("zoomLevel", 1) / this.get("zoomStep", 2));
	}

	public _clearDirty() {
		super._clearDirty();
		this._dirtyGeometries = false;
		this._mapFitted = false;
	}

	/**
	 * Returns area of a mapPolygon in square pixels.
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
