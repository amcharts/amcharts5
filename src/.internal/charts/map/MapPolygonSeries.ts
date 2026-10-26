import type { DataItem } from "../../core/render/Component";
import type { Animation } from "../../core/util/Entity";
import type { IPoint } from "../../core/util/IPoint";
import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { IDisposer } from "../../core/util/Disposer";
import type { MapChart } from "./MapChart";

import { MapSeries, IMapSeriesSettings, IMapSeriesDataItem, IMapSeriesPrivate } from "./MapSeries";
import { MapPolygon } from "./MapPolygon";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";

import * as $array from "../../core/util/Array";
import * as $mapUtils from "./MapUtils";



export interface IMapPolygonSeriesPrivate extends IMapSeriesPrivate {
}

export interface IMapPolygonSeriesDataItem extends IMapSeriesDataItem {

	/**
	 * The polygon that shows the data item.
	 */
	mapPolygon: MapPolygon;

	/**
	 * GeoJSON geometry of the polygon.
	 */
	geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface IMapPolygonSeriesSettings extends IMapSeriesSettings {

	/**
	 * Reverses the order of the points in each polygon ring (their winding
	 * order). Some GeoJSON tools wind polygons the other way, so try this if a
	 * custom map looks garbled.
	 *
	 * @default false
	 * @since 5.2.42
	 */
	reverseGeodata?: boolean;

	/**
	 * Zooms the map to a polygon when it is clicked, and back to the home
	 * position when it is clicked again or the map's background is clicked.
	 *
	 * On a map panned by rotating (`panX: "rotateX"` or `panY: "rotateY"`),
	 * the polygon also turns to the middle.
	 *
	 * The polygon zoomed to is `active`, so an `"active"` state can mark it.
	 *
	 * @default false
	 * @since 5.21.0
	 */
	clickZoom?: boolean;

}

/**
 * A map series of polygons, such as countries or regions.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-polygon-series/} for more info
 * @important
 */
export class MapPolygonSeries extends MapSeries {

	/**
	 * @ignore
	 */
	public makeMapPolygon(dataItem: DataItem<this["_dataItemSettings"]>): MapPolygon {
		const mapPolygon = this.children.push(this._newMapPolygon());
		mapPolygon._setDataItem(dataItem);
		this._linkSprite(mapPolygon, dataItem);
		this.mapPolygons.push(mapPolygon);
		if (this.get("clickZoom")) {
			this._watchClick(mapPolygon);
		}
		return mapPolygon;
	}

	protected _newMapPolygon(): MapPolygon {
		return this.mapPolygons.make();
	}

	// What `clickZoom` listens to, and the chart whose background is among them
	protected _clickDps: Map<MapPolygon, IDisposer> = new Map();
	protected _clickBackgroundDp?: IDisposer;
	protected _clickZoomChart?: MapChart;
	protected _zoomedDataItem?: DataItem<IMapPolygonSeriesDataItem>;

	/**
	 * All polygons of the series. Configure them through
	 * `mapPolygons.template`.
	 *
	 * @default new ListTemplate<MapPolygon>
	 */
	public readonly mapPolygons: ListTemplate<MapPolygon> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => MapPolygon._new(this._root, {}, [this.mapPolygons.template])
	));

	public static className: string = "MapPolygonSeries";
	public static classNames: Array<string> = MapSeries.classNames.concat([MapPolygonSeries.className]);

	declare public _settings: IMapPolygonSeriesSettings;
	declare public _privateSettings: IMapPolygonSeriesPrivate;
	declare public _dataItemSettings: IMapPolygonSeriesDataItem;

	protected _types: Array<GeoJSON.GeoJsonGeometryTypes> = ["Polygon", "MultiPolygon"];

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		$array.each(this.dataItems, (dataItem) => {
			let mapPolygon = dataItem.get("mapPolygon");
			if (mapPolygon) {
				mapPolygon.markDirtyProjection();
			}
		})
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("clickZoom") || this.chart !== this._clickZoomChart) {
			this._setUpClickZoom();
		}

		if (this.isDirty("fill")) {
			this.mapPolygons.template._setC("fill", this.get("fill"));
		}
		if (this.isDirty("stroke")) {
			this.mapPolygons.template._setC("stroke", this.get("stroke"));
		}
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		let mapPolygon = dataItem.get("mapPolygon");
		if (!mapPolygon) {
			mapPolygon = this.makeMapPolygon(dataItem);
		}

		dataItem.set("mapPolygon", mapPolygon);
		let geometry = dataItem.get("geometry")!;

		if (geometry) {
			if (this.get("reverseGeodata") && !(geometry as any)._reversed) {
				const coordinates = geometry.coordinates;
				if (coordinates) {
					for (let x = 0; x < geometry.coordinates.length; x++) {
						if (geometry.type == "MultiPolygon") {
							for (let y = 0; y < geometry.coordinates[x].length; y++) {
								geometry.coordinates[x][y].reverse()
							}
						}
						else {
							geometry.coordinates[x].reverse()
						}
					}
					(geometry as any)._reversed = true;
				}
			}
			mapPolygon._setC("geometry", geometry);
		}

		mapPolygon.series = this;

		this._addGeometry(dataItem.get("geometry"), this);
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			this._clickDps.delete(mapPolygon);
			this.mapPolygons.removeValue(mapPolygon);
			mapPolygon.dispose();
		}
		if (this._zoomedDataItem === dataItem) {
			this._zoomedDataItem = undefined;
		}
		this._removeGeometry(dataItem.get("geometry"));
	}

	/**
	 * @ignore
	 */
	protected _excludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._excludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			this._setExcluded(mapPolygon, true);
		}
	}

	/**
	 * @ignore
	 */
	protected _unexcludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unexcludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			this._setExcluded(mapPolygon, false);
		}
	}

	/**
	 * @ignore
	 */
	protected _notIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._notIncludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			this._setExcluded(mapPolygon, true);
		}
	}

	/**
	 * @ignore
	 */
	protected _unNotIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unNotIncludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			this._setExcluded(mapPolygon, false);
		}
	}

	/**
	 * Redraws the series, and the polygon of `dataItem` from its `geometry`,
	 * such as after the geometry was changed in place.
	 *
	 * @param  dataItem  Data item whose polygon to redraw
	 * @since 5.0.21
	 */
	public markDirtyValues(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.markDirtyValues();
		if (dataItem) {
			const mapPolygon = dataItem.get("mapPolygon");
			if (mapPolygon) {
				mapPolygon._setC("geometry", dataItem.get("geometry"));
			}
		}
	}

	protected _watchClick(mapPolygon: MapPolygon) {
		this._clickDps.set(mapPolygon, mapPolygon.events.on("click", () => {
			this._clickZoomTo(mapPolygon);
		}));
	}

	protected _unwatchClicks() {
		this._clickDps.forEach((disposer) => {
			disposer.dispose();
		});
		this._clickDps.clear();

		if (this._clickBackgroundDp) {
			this._clickBackgroundDp.dispose();
			this._clickBackgroundDp = undefined;
		}
	}

	// Listens to the polygons there are and to the chart's background, or stops
	protected _setUpClickZoom() {
		this._unwatchClicks();

		const chart = this.chart;
		this._clickZoomChart = chart;

		if (this.get("clickZoom")) {
			this.mapPolygons.each((mapPolygon) => {
				this._watchClick(mapPolygon);
			});

			const background = chart ? chart.chartContainer.get("background") : undefined;
			if (background) {
				this._clickBackgroundDp = background.events.on("click", () => {
					this._clickZoomOut();
				});
			}
		}
		else {
			this._markZoomed(undefined);
		}
	}

	/**
	 * @ignore
	 */
	public _onGoHome() {
		this._markZoomed(undefined);
	}

	protected _dispose() {
		super._dispose();
		this._unwatchClicks();
	}

	protected _clickZoomTo(mapPolygon: MapPolygon) {
		const chart = this.chart;
		const dataItem = mapPolygon.dataItem as DataItem<IMapPolygonSeriesDataItem> | undefined;
		if (chart && dataItem) {
			if (this._zoomedDataItem === dataItem) {
				this._clickZoomOut(mapPolygon);
			}
			else {
				this._markZoomed(dataItem, mapPolygon);
				this.zoomToDataItem(dataItem, chart.get("panX") == "rotateX" || chart.get("panY") == "rotateY");
			}
		}
	}

	protected _clickZoomOut(clicked?: MapPolygon) {
		const chart = this.chart;
		if (chart && this._zoomedDataItem) {
			this._markZoomed(undefined, clicked);
			chart.goHome();
		}
	}

	// `active` follows the polygon zoomed to. A polygon with `toggleKey: "active"`
	// flips it on its own click, so the clicked one is left to do that
	protected _markZoomed(dataItem: DataItem<IMapPolygonSeriesDataItem> | undefined, clicked?: MapPolygon) {
		const previous = this._zoomedDataItem ? this._zoomedDataItem.get("mapPolygon") : undefined;
		const next = dataItem ? dataItem.get("mapPolygon") : undefined;
		this._zoomedDataItem = dataItem;

		$array.each([previous, next], (mapPolygon) => {
			if (mapPolygon && !mapPolygon.isDisposed() && !(mapPolygon === clicked && mapPolygon.get("toggleKey") == "active")) {
				mapPolygon._setC("active", mapPolygon === next);
			}
		});
	}

	/**
	 * Zooms the map to fit a polygon, centered.
	 *
	 * @param  dataItem  Data item of the polygon
	 * @see {@link https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#zooming-to-clicked-object} for more info
	 * @param  rotate Also rotate the map to bring the polygon's center to the middle, as on a globe
	 * @return        Zoom level animation
	 */
	public zoomToDataItem(dataItem: DataItem<IMapPolygonSeriesDataItem>, rotate?: boolean): Animation<any> | undefined {
		const polygon = dataItem.get("mapPolygon");
		if (polygon) {
			const geometry = polygon.get("geometry");
			const chart = this.chart;

			if (geometry && chart) {

				if (rotate) {
					const centroid = $mapUtils.getGeoCentroid(geometry);
					chart.rotate(-centroid.longitude, -centroid.latitude);
					return chart.zoomToGeoBounds($mapUtils.getGeoBounds(geometry), undefined, -centroid.longitude, -centroid.latitude);
				}

				return chart.zoomToGeoBounds($mapUtils.getGeoBounds(geometry),);
			}
		}
	}

	/**
	 * Zooms the map to fit several polygons.
	 *
	 * @param   dataItems  Data items of the polygons
	 * @param   rotate     Also rotate the map to bring the middle of their bounds to the middle of the view
	 * @return             Zoom level animation
	 * @since 5.9.0
	 */
	public zoomToDataItems(dataItems: Array<DataItem<IMapPolygonSeriesDataItem>>, rotate?: boolean): Animation<any> | undefined {
		let left!: number;
		let right!: number;
		let top!: number;
		let bottom!: number;

		$array.each(dataItems, (dataItem) => {

			const polygon = dataItem.get("mapPolygon");
			if (polygon) {
				const geometry = polygon.get("geometry");
				if (geometry) {
					let bounds = $mapUtils.getGeoBounds(geometry);

					if (left == null) {
						left = bounds.left;
					}
					if (right == null) {
						right = bounds.right;
					}
					if (top == null) {
						top = bounds.top;
					}
					if (bottom == null) {
						bottom = bounds.bottom;
					}

					left = Math.min(bounds.left, left);
					right = Math.max(bounds.right, right);
					top = Math.max(bounds.top, top);
					bottom = Math.min(bounds.bottom, bottom);
				}
			}
		})

		if (left != null && right != null && top != null && bottom != null) {
			const chart = this.chart;
			if (chart) {
				if (rotate) {
					const rx = left + (right - left) / 2;
					const ry = bottom + (top - bottom) / 2;

					chart.rotate(-rx, -ry);
					return chart.zoomToGeoBounds({ left, right, top, bottom }, undefined, -rx, -ry);
				}

				return chart.zoomToGeoBounds({ left, right, top, bottom });
			}
		}
	}

	/**
	 * Returns the polygon of this series drawn at a point, if any.
	 *
	 * @since 5.9.8
	 * @param   point  Point in pixels, relative to the root
	 * @return         Polygon
	 */
	public getPolygonByPoint(point: IPoint): MapPolygon | undefined {
		let found: MapPolygon | undefined;
		const renderer = this._display._renderer;
		const displayObject = (renderer as any).getObjectAtPoint(point);
		if (displayObject) {
			this.mapPolygons.each(function(polygon) {
				if (polygon._display == displayObject) {
					found = polygon;
				}
			});
			return found;
		}
	}

	/**
	 * Returns the polygon of this series drawn at a geographic point, if any.
	 *
	 * @param   point  Geographic point
	 * @return         Polygon
	 */
	public getPolygonByGeoPoint(point: IGeoPoint): MapPolygon | undefined {
		const chart = this.chart!;
		return this.getPolygonByPoint(chart.seriesContainer.toGlobal(chart.convert(point)));
	}
}
