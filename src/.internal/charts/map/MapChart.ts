import type { IPointerEvent } from "../../core/render/backend/Renderer";
import { SerialChart, ISerialChartPrivate, ISerialChartSettings } from "../../core/render/SerialChart";
import { Rectangle } from "../../core/render/Rectangle";
import { p100 } from "../../core/util/Percent";
import type { MapSeries } from "./MapSeries";
import type { Root } from "../../core/Root";
import { geoPath } from "d3-geo";
import type { GeoProjection, GeoPath } from "d3-geo";
import * as $math from "../../core/util/Math";
import * as $array from "../../core/util/Array";
import type { IPoint } from "../../core/util/IPoint";
import type { Template } from "../../core/util/Template";
import type { IGeoPoint } from "../../core/util/IGeoPoint";
import * as $type from "../../core/util/Type";
import type { Time } from "../../core/util/Animation";
import type { ZoomControl } from "./ZoomControl";
import { Color } from "../../core/util/Color";
import type { Animation } from "../../core/util/Entity";
import * as $mapUtils from "./MapUtils";


export interface IMapChartSettings extends ISerialChartSettings {

	/**
	 * A projection to use when plotting the map.
	 *
	 * @see (@link https://www.amcharts.com/docs/v5/getting-started/map-chart/#Projections} for more info
	 */
	projection?: GeoProjection;


	zoomLevel?: number;

	/**
	 * @ignore
	 */
	translateX?: number;

	/**
	 * @ignore
	 */	
	translateY?: number;

	rotationY?: number;
	rotationX?: number;
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

	panX?: "none" | "rotateX" | "translateX";
	panY?: "none" | "rotateY" | "translateY";

	wheelX?: "none" | "zoom" | "rotateX" | "rotateY";
	wheelY?: "none" | "zoom" | "rotateX" | "rotateY";

	animationDuration?: number;
	animationEasing?: (t: Time) => Time;

	wheelDuration?: number;
	wheelEasing?: (t: Time) => Time;

	// @todo maybe there will be some mouse options?
	wheelSensitivity?: number;

	zoomControl?: ZoomControl;

	homeZoomLevel?: number;
	homeGeoPoint?: IGeoPoint;

	maxPanOut?: number;
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

export class MapChart extends SerialChart {
	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: MapChart["_settings"], template?: Template<MapChart>): MapChart {
		const x = new MapChart(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "MapChart";
	public static classNames: Array<string> = SerialChart.classNames.concat([MapChart.className]);

	declare public _settings: IMapChartSettings;
	declare public _privateSettings: IMapChartPrivate;
	declare public _seriesType: MapSeries;

	protected _downTranslateX: number | undefined;
	protected _downTranslateY: number | undefined;
	protected _downRotationX: number | undefined;
	protected _downRotationY: number | undefined;
	protected _downRotationZ: number | undefined;
	protected _pLat: number = 0;
	protected _pLon: number = 0;

	protected _dirtyGeometries: boolean = false;
	protected _geometryColection: GeoJSON.GeometryCollection = { type: "GeometryCollection", geometries: [] };

	protected _centerLocation: [number, number] | null = null;

	protected _za?: Animation<this["_settings"]["zoomLevel"]>;
	protected _rxa?: Animation<this["_settings"]["rotationX"]>;
	protected _rya?: Animation<this["_settings"]["rotationY"]>;
	protected _txa?: Animation<this["_settings"]["translateX"]>;
	protected _tya?: Animation<this["_settings"]["translateY"]>;

	protected _mapBounds = [[0, 0], [0, 0]];

	protected _geoCentroid: IGeoPoint = { longitude: 0, latitude: 0 };
	protected _centroid: IPoint = { x: 0, y: 0 };
	protected _geoBounds: { left: number, right: number, top: number, bottom: number } = { left: 0, right: 0, top: 0, bottom: 0 };


	protected makeGeoPath() {
		const projection = this.get("projection")!;

		const path = geoPath();
		path.projection(projection);
		this.setPrivateRaw("geoPath", path);
	}

	public geoCentroid() {
		return this._geoCentroid;
	}

	public geoBounds() {
		return this._geoBounds;
	}

	public _prepareChildren() {
		super._prepareChildren();

		const projection = this.get("projection")!;

		if (this.isDirty("projection")) {
			this.makeGeoPath();
			this.markDirtyProjection();
			this._fitMap();
		}


		if (this._dirtyGeometries) {
			this._geometryColection.geometries = [];

			this.series.each((series) => {
				$array.pushAll(this._geometryColection.geometries, series._geometries);
			})

			this._fitMap();
		}

		let w = this.innerWidth();
		let h = this.innerHeight();

		if (this.isPrivateDirty("width") || this.isPrivateDirty("height") || this.isDirty("paddingTop") || this.isDirty("paddingLeft")) {
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

					this.markDirtyProjection();
				}
			}

			this.markDirtyProjection();
		}

		if (this.isDirty("zoomControl")) {
			const previous = this._prevSettings.zoomControl;
			const zoomControl = this.get("zoomControl")!;
			if (zoomControl !== previous) {
				this._disposeProperty("zoomControl");
				if (previous) {
					previous.setPrivate("chart", undefined)
					if (previous.get("autoDispose")) {
						previous.dispose();
					}
					else {
						this.children.removeValue(previous)
					}
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
	}

	public goHome(duration?: number) {
		this.zoomToGeoBounds(this._geoBounds, duration);
	}


	public _updateChildren() {
		const projection = this.get("projection")!;
		if (projection.invert) {
			this._centerLocation = projection.invert([this.innerWidth() / 2, this.innerHeight() / 2]);
		}
	}

	protected _fitMap() {
		const projection = this.get("projection")!;
		projection.fitSize([this.innerWidth(), this.innerHeight()], this._geometryColection);
		this.setPrivateRaw("mapScale", projection.scale());

		const translate = projection.translate();
		this.setRaw("translateX", translate[0]);
		this.setRaw("translateY", translate[1]);

		this._centroid = { x: translate[0], y: translate[1] };

		const geoPath = this.getPrivate("geoPath");
		this._mapBounds = geoPath.bounds(this._geometryColection);

		this._geoCentroid = $mapUtils.getGeoCentroid(this._geometryColection);
		this._geoBounds = $mapUtils.getGeoBounds(this._geometryColection);

	}

	public markDirtyGeometries() {
		this._dirtyGeometries = true;
		this.markDirty();
	}

	public markDirtyProjection() {
		this.series.each((series) => {
			series.markDirtyProjection();
		})
	}

	protected _afterNew() {
		super._afterNew();

		this.makeGeoPath();

		this.chartContainer.children.push(this.seriesContainer);

		this.set("width", p100);
		this.set("height", p100);
		if (this.get("translateX") == null) {
			this.set("translateX", this.width() / 2);
		}
		if (this.get("translateY") == null) {
			this.set("translateY", this.height() / 2);
		}

		// TODO: maybe set this on-demand only and if wheelX/wheelY are actually set
		// TODO: also properly dispose those events if wheelX/wheelY is disabled
		this.chartContainer.set("wheelable", true);
		this._disposers.push(this.chartContainer.events.on("wheel", (event) => {
			const wheelX = this.get("wheelX");
			const wheelY = this.get("wheelY");

			const wheelEasing = this.get("wheelEasing")!;
			const wheelSensitivity = this.get("wheelSensitivity", 1);
			const wheelDuration = this.get("wheelDuration", 0);

			const wheelEvent = event.originalEvent;

			if (wheelX != "none" || wheelY != "none") {
				const chartContainer = this.chartContainer;
				const point = chartContainer._display.toLocal(this._root.documentPointToRoot({ x: wheelEvent.clientX, y: wheelEvent.clientY }));

				if ((wheelY == "zoom")) {
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
			}
		}));

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
			this._handleChartDown(event.originalEvent);
		}));

		this._disposers.push(this.chartContainer.events.on("globalpointerup", (event) => {
			this._handleChartUp(event.originalEvent);
		}));

		this._disposers.push(this.chartContainer.events.on("globalpointermove", (event) => {
			this._handleChartMove(event.originalEvent);
		}));

	}

	protected _handleChartDown(event: IPointerEvent) {

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

			const downPoint = this.chartContainer._display.toLocal(this._root.documentPointToRoot({ x: event.clientX, y: event.clientY }));
			this._downPoint = downPoint;

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

	public convert(point: IGeoPoint): IPoint {
		let projection = this.get("projection")!;

		const xy = projection([point.longitude, point.latitude]);
		if (xy) {
			return { x: xy[0], y: xy[1] };
		}

		return { x: 0, y: 0 };
	}

	protected _handleChartUp(_event: IPointerEvent) {
		this._downPoint = undefined;
	}

	protected _handleChartMove(event: IPointerEvent) {
		const downPoint = this._downPoint!;
		if (downPoint) {
			const panX = this.get("panX");
			const panY = this.get("panY");
			if (panX != "none" || panY != "none") {
				let local = this.chartContainer._display.toLocal(this._root.documentPointToRoot({ x: event.clientX, y: event.clientY }));

				let x = this._downTranslateX;
				let y = this._downTranslateY;

				if (Math.hypot(downPoint.x - local.x, downPoint.y - local.y) > 5) {
					let bg = this.chartContainer.get("background");
					if (bg) {
						bg.events.disableType("click");
					}

					if ($type.isNumber(x) && $type.isNumber(y)) {
						let projection = this.get("projection")!;

						if (panX == "translateX") {
							x += local.x - downPoint.x;
						}
						if (panY == "translateY") {
							y += local.y - downPoint.y;
						}

						const bounds = this._mapBounds;

						const w = this.width();
						const h = this.height();

						const ww = bounds[1][0] - bounds[0][0];
						const hh = bounds[1][1] - bounds[0][1];

						const zoomLevel = this.get("zoomLevel", 1);

						let cx = this._centroid.x - w / 2;
						let cy = this._centroid.y - h / 2;

						cx *= zoomLevel;
						cy *= zoomLevel;

						const maxPanOut = this.get("maxPanOut", 0);

						let xs = 1;
						if (w < ww * zoomLevel) {
							xs = -1
						}

						let ys = 1;
						if (h < hh * zoomLevel) {
							ys = -1
						}

						x = Math.min(x, cx + xs * (w - ww) / 2 * zoomLevel + (w / 2) * zoomLevel + ww * maxPanOut);
						x = Math.max(x, cx + xs * -1 * (w - ww) / 2 * zoomLevel + w - (w / 2) * zoomLevel - ww * maxPanOut);

						y = Math.min(y, cy + ys * (h - hh) / 2 * zoomLevel + (h / 2) * zoomLevel + hh * maxPanOut);
						y = Math.max(y, cy + ys * -1 * (h - hh) / 2 * zoomLevel + h - (h / 2) * zoomLevel - hh * maxPanOut);

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

	public zoomToGeoBounds(geoBounds: { left: number, right: number, top: number, bottom: number }, duration?: number) {
		if (geoBounds.right < geoBounds.left) {
			geoBounds.right = 180;
			geoBounds.left = -180;
		}

		if (geoBounds.bottom <= -89) {
			geoBounds.bottom = -89;
		}

		let p0 = this.convert({ longitude: geoBounds.left, latitude: geoBounds.top });
		let p1 = this.convert({ longitude: geoBounds.right, latitude: geoBounds.bottom });

		let bounds = { left: p0.x, right: p1.x, top: p0.y, bottom: p1.y };

		let zl = this.get("zoomLevel", 1);

		let seriesContainer = this.seriesContainer;

		let zoomLevel = 0.9 * Math.min(seriesContainer.innerWidth() / (bounds.right - bounds.left) * zl, seriesContainer.innerHeight() / (bounds.bottom - bounds.top) * zl);
		let x = bounds.left + (bounds.right - bounds.left) / 2;
		let y = bounds.top + (bounds.bottom - bounds.top) / 2;

		let geoPoint = this.invert({ x, y });

		this.zoomToGeoPoint(geoPoint, zoomLevel, true, duration);
	}


	public zoomToPoint(point: IPoint, level: number, center?: boolean, duration?: number) {

		if (level) {
			level = $math.fitToRange(level, this.get("minZoomLevel", 1), this.get("maxZoomLevel", 32));
		}

		if (!$type.isNumber(duration)) {
			duration = this.get("animationDuration", 0);
		}
		const easing = this.get("animationEasing");
		const zoomLevel = this.get("zoomLevel", 1);

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
			this._root.readerAlert(this._root.language.translate("Zoom level changed to %1", this._root.locale, $type.numberToString(level)));
		}
	}

	public zoomToGeoPoint(geoPoint: IGeoPoint, level: number, center?: boolean, duration?: number) {
		const xy = this.convert(geoPoint);
		if (xy) {
			this.zoomToPoint(xy, level, center, duration);
		}
	}

	public zoomIn() {
		this.zoomToPoint({ x: this.width() / 2, y: this.height() / 2 }, this.get("zoomLevel", 1) * this.get("zoomStep", 2));
	}

	public zoomOut() {
		this.zoomToPoint({ x: this.width() / 2, y: this.height() / 2 }, this.get("zoomLevel", 1) / this.get("zoomStep", 2));
	}

	public _clearDirty() {
		super._clearDirty();
		this._dirtyGeometries = false;
	}
}
