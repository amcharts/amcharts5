import type { DataItem } from "../../core/render/Component";
import type { Animation } from "../../core/util/Entity";
import type { IPoint } from "../../core/util/IPoint";
import type { IGeoPoint } from "../../core/util/IGeoPoint";

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
	 * Related [[MapPolygon]] object.
	 */
	mapPolygon: MapPolygon;

	/**
	 * GeoJSON geometry of the polygon.
	 */
	geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface IMapPolygonSeriesSettings extends IMapSeriesSettings {

	/**
	 * If set to `true`, the order of coordinates in GeoJSON will be flipped.
	 *
	 * Some GeoJSON software produces those in reverse order, so if your custom
	 * map appears garbled, try this setting.
	 *
	 * @default false
	 * @since 5.2.42
	 */
	reverseGeodata?: boolean;

}

/**
 * Creates a map series for displaying polygons.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/} for more info
 * @important
 */
export class MapPolygonSeries extends MapSeries {

	/**
	 * @ignore
	 */
	public makeMapPolygon(dataItem: DataItem<this["_dataItemSettings"]>): MapPolygon {
		const mapPolygon = this.children.push(this.mapPolygons.make());
		mapPolygon._setDataItem(dataItem);
		this.mapPolygons.push(mapPolygon);
		return mapPolygon;
	}

	/**
	 * A [[ListTemplate]] of all polygons in series.
	 *
	 * `mapPolygons.template` can also be used to configure polygons.
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

		if (this.isDirty("fill")) {
			this.mapPolygons.template.set("fill", this.get("fill"));
		}
		if (this.isDirty("stroke")) {
			this.mapPolygons.template.set("stroke", this.get("stroke"));
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
			if (this.get("reverseGeodata")) {
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
				}
			}
			mapPolygon.set("geometry", geometry);
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
			this.mapPolygons.removeValue(mapPolygon);
			mapPolygon.dispose();
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
			mapPolygon.setPrivate("visible", false);
		}
	}

	/**
	 * @ignore
	 */
	protected _unexcludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unexcludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			mapPolygon.setPrivate("visible", true);
		}
	}

	/**
	 * @ignore
	 */
	protected _notIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._notIncludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			mapPolygon.setPrivate("visible", false);
		}
	}

	/**
	 * @ignore
	 */
	protected _unNotIncludeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._unNotIncludeDataItem(dataItem);
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			mapPolygon.setPrivate("visible", true);
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
			const mapPolygon = dataItem.get("mapPolygon");
			if (mapPolygon) {
				mapPolygon.set("geometry", dataItem.get("geometry"));
			}
		}
	}

	/**
	 * Centers and zooms in on the specific polygon.
	 *
	 * @param  dataItem  Target data item
	 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Zooming_to_clicked_object} for more info
	 * @param  rotate If it's true, the map will rotate so that this polygon would be in the center. Mostly usefull with geoOrthographic projection.
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
	 * Zooms the map in so that all polygons in the array are visible.
	 *
	 * @param   dataItems  An array of data items to zoom to
	 * @param   rotate     Rotate the map so it is centered on the selected items
	 * @return             Animation
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
	 * Returns a [[MapPolygon]] that is under specific X/Y point.
	 *
	 * @since 5.9.8
	 * @param   point  X/Y
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

	public getPolygonByGeoPoint(point: IGeoPoint): MapPolygon | undefined {
		return this.getPolygonByPoint(this.chart!.convert(point));
	}
}
