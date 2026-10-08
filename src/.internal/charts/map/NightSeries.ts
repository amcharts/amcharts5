import type { DataItem } from "../../core/render/Component";
import type { Sprite } from "../../core/render/Sprite";
import type { IDisposer } from "../../core/util/Disposer";
import type { MapChart } from "./MapChart";

import { MapPolygonSeries, IMapPolygonSeriesSettings, IMapPolygonSeriesPrivate, IMapPolygonSeriesDataItem } from "./MapPolygonSeries";
import { MapPolygon } from "./MapPolygon";
import type { MapSeries } from "./MapSeries";
import { Circle } from "../../core/render/Circle";
import { ISunSettings, SunClock } from "./MapSun";
import { getGeoCircle, normalizeGeoPoint, projectAltitude } from "./MapUtils";

import * as $array from "../../core/util/Array";
import * as $utils from "../../core/util/Utils";

export interface INightSeriesDataItem extends IMapPolygonSeriesDataItem {
}

export interface INightSeriesPrivate extends IMapPolygonSeriesPrivate {
}

export interface INightSeriesSettings extends IMapPolygonSeriesSettings, ISunSettings {

	/**
	 * How many shades the twilight is drawn in, from day to full night.
	 *
	 * @default 4
	 */
	twilightSteps?: number;

	/**
	 * The sprite shown where the sun is directly overhead. The series makes a
	 * circle: configure it via `get("sun")`, or set any sprite instead.
	 */
	sun?: Sprite;

	/**
	 * Raises the sun above the map, in metres, as `altitude` raises a
	 * [[MapLine]]. On a globe it stays in view a little past the edge after
	 * the point below it has gone round the back.
	 *
	 * It is for looks, not the real distance: `1000000` to `5000000` suits a
	 * globe (the Earth's radius is about 6,371,000).
	 *
	 * @default 0
	 * @since 5.21.0
	 */
	sunAltitude?: number;
}

/**
 * Shades the part of a map where it is night, with the twilight in steps,
 * and shows the sun.
 *
 * Set `sunDate` (e.g. `"now"`) or `sunPosition`. The night is styled through
 * `mapPolygons.template`: `fill`, and `fillOpacity` for how dark full night is.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/night-series/} for more information
 * @since 5.21.0
 * @important
 */
export class NightSeries extends MapPolygonSeries {

	public static className: string = "NightSeries";
	public static classNames: Array<string> = MapPolygonSeries.classNames.concat([NightSeries.className]);

	declare public _settings: INightSeriesSettings;
	declare public _privateSettings: INightSeriesPrivate;
	declare public _dataItemSettings: INightSeriesDataItem;

	// One per twilight step, outermost (lightest) first
	protected _steps: Array<DataItem<this["_dataItemSettings"]>> = [];
	protected _sunClock: SunClock = new SunClock(this);
	// The sun sprite that is among the children
	protected _sun?: Sprite;
	// The chart the night was last drawn for
	protected _drawnFor?: MapChart;
	protected _sunDirty: boolean = false;
	protected _shadeDp?: IDisposer;

	protected _afterNew() {
		super._afterNew();

		this._shadeDp = this.mapPolygons.template.on("fillOpacity", () => this._shade());

		if (!this.get("sun")) {
			this._setC("sun", Circle.new(this._root, { themeTags: ["night", "sun"] })._markC("themeTags"));
		}
	}

	/**
	 * @ignore
	 */
	public makeMapPolygon(dataItem: DataItem<this["_dataItemSettings"]>): MapPolygon {
		const template = this.mapPolygons.template;
		const mapPolygon = this.children.push(MapPolygon._new(this._root, {
			themeTags: $utils.mergeTags(template.get("themeTags", []), ["night"])
		}, [template]));
		mapPolygon._setDataItem(dataItem);
		this._linkSprite(mapPolygon, dataItem);
		this.mapPolygons.push(mapPolygon);
		return mapPolygon;
	}

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		super.markDirtyProjection();
		this._sunDirty = true;
		this.markDirty();
	}

	// The night never counts towards the map's bounds
	protected _addGeometry(_geometry: any, _series: MapSeries) { }

	protected _removeGeometry(_geometry: any) { }

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("sunDate")) {
			this._sunClock.update();
		}

		// Added to a chart after the night was worked out: draw it there
		const chart = this.chart;
		if (chart !== this._drawnFor) {
			this._drawnFor = chart;
			if (chart) {
				this.markDirtyProjection();
			}
		}

		const sun = this.get("sun");
		const previous = this._sun;
		if (sun !== previous) {
			if (previous) {
				this.children.removeValue(previous);
				previous.dispose();
			}
			if (sun) {
				this.children.push(sun);
			}
			this._sun = sun;
			this._sunDirty = true;
		}
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("sunPosition") || this.isDirty("twilight") || this.isDirty("twilightSteps")) {
			this._generate();
			this._sunDirty = true;
		}

		if (this.isDirty("sunAltitude")) {
			this._sunDirty = true;
		}

		if (this._sunDirty) {
			this._sunDirty = false;
			this._positionSun();
		}
	}

	// The night and the twilight steps: circles around the point opposite the sun
	protected _generate() {
		const steps = this._steps;
		const count = Math.max(1, Math.round(this.get("twilightSteps", 4)));

		while (steps.length < count) {
			const dataItem = this.makeDataItem({} as this["_dataItemSettings"]);
			this.dataItems.push(dataItem);
			steps.push(dataItem);
		}
		while (steps.length > count) {
			const dataItem = steps.pop()!;
			$array.remove(this.dataItems, dataItem);
			dataItem.dispose();
		}

		// New steps are drawn last; the sun stays on top
		const sun = this.get("sun");
		if (sun) {
			this.children.moveValue(sun);
		}

		const sunPosition = this.get("sunPosition");
		const twilight = Math.max(this.get("twilight", 12), 0);

		$array.each(steps, (dataItem, i) => {
			const mapPolygon = dataItem.get("mapPolygon");
			if (mapPolygon) {
				if (sunPosition) {
					// From where the sun is half the twilight up to where it is half of it down
					const center = normalizeGeoPoint({ longitude: sunPosition.longitude + 180, latitude: -sunPosition.latitude });
					const geometry = getGeoCircle(center, 90 + twilight / 2 - (i + 0.5) * twilight / count);
					dataItem.setRaw("geometry", geometry);
					mapPolygon._setC("geometry", geometry);
				}
				mapPolygon.setPrivate("visible", !!sunPosition);
			}
		});

		this._shade();
	}

	// Each step's share of the night, so they stack up evenly to `fillOpacity`
	protected _shade() {
		const steps = this._steps;
		const count = steps.length;
		$array.each(steps, (dataItem, i) => {
			const mapPolygon = dataItem.get("mapPolygon");
			if (mapPolygon) {
				const full = mapPolygon.get("fillOpacity", 1);
				const inside = 1 - full * (i + 1) / count;
				const outside = 1 - full * i / count;
				mapPolygon._setC("opacity", full > 0 && outside > 0 ? (1 - inside / outside) / full : 1);
			}
		});
	}

	protected _positionSun() {
		const sun = this.get("sun");
		const chart = this.chart;
		if (sun && chart) {
			const sunPosition = this.get("sunPosition");
			let visible = false;
			if (sunPosition) {
				const projection = chart.get("projection")!;
				const coordinates: [number, number] = [sunPosition.longitude, sunPosition.latitude];
				const altitude = this.get("sunAltitude", 0);
				if (altitude) {
					// Raised: hidden only while the globe is in front of it
					const raised = projectAltitude(projection, coordinates[0], coordinates[1], altitude);
					if (raised && !raised.hidden) {
						sun._setCAll({ x: raised.x, y: raised.y });
						visible = true;
					}
				}
				else {
					const xy = projection(coordinates);
					// Not on the far side of a globe
					if (xy && chart.getPrivate("geoPath")({ type: "Point", coordinates: coordinates })) {
						sun._setCAll({ x: xy[0], y: xy[1] });
						visible = true;
					}
				}
			}
			sun.setPrivate("visible", visible);
		}
	}

	protected _dispose() {
		this._sunClock.dispose();
		if (this._shadeDp) {
			this._shadeDp.dispose();
		}
		super._dispose();
	}
}
