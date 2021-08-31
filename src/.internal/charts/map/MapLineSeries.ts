import { MapSeries, IMapSeriesSettings, IMapSeriesDataItem, IMapSeriesPrivate } from "./MapSeries";
import { MapLine } from "./MapLine";
import type { IMapPointSeriesDataItem } from "./MapPointSeries";
import type { Root } from "../../core/Root";
import * as $array from "../../core/util/Array";
import type { DataItem } from "../../core/render/Component";
import { ListTemplate } from "../../core/util/List";
import { Template } from "../../core/util/Template";

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
	 * An array of data items from [[MapPointSeries]] to use as line end-points.
	 */
	pointsToConnect?: Array<DataItem<IMapPointSeriesDataItem>>;

}

export interface IMapLineSeriesSettings extends IMapSeriesSettings {
	//@todo description
	clipBack?:boolean;	
}

/**
 * Creates a map series for displaying lines on the map.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-line-series/} for more info
 * @important
 */
export class MapLineSeries extends MapSeries {

	/**
	 * @ignore
	 */
	public makeMapLine(dataItem: DataItem<this["_dataItemSettings"]>): MapLine {
		const mapLine = this.children.push(this.mapLines.make());
		mapLine._setDataItem(dataItem);
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
	public readonly mapLines: ListTemplate<MapLine> = new ListTemplate(
		Template.new({}),
		() => MapLine.new(this._root, {}, this.mapLines.template)
	);

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: MapLineSeries["_settings"], template?: Template<MapLineSeries>): MapLineSeries {
		const x = new MapLineSeries(root, settings, true, template);
		x._afterNew();
		return x;
	}

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

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		let mapLine = dataItem.get("mapLine");
		if (!mapLine) {
			mapLine = this.makeMapLine(dataItem);
		}

		dataItem.set("mapLine", mapLine);
		const pointsToConnect = dataItem.get("pointsToConnect");
		if (pointsToConnect) {
			$array.each(pointsToConnect, (point) => {

				point.on("geometry", () => {
					this._markDirtyValues(dataItem);
				})

				point.on("longitude", () => {
					this._markDirtyValues(dataItem);
				})

				point.on("latitude", () => {
					this._markDirtyValues(dataItem);
				})
			})

			this._markDirtyValues(dataItem);
		}

		mapLine.setPrivate("series", this);

		this._addGeometry(dataItem.get("geometry"));
	}

	public _markDirtyValues(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._markDirtyValues();
		if (dataItem) {
			const mapLine = dataItem.get("mapLine");
			if (mapLine) {
				const pointsToConnect = dataItem.get("pointsToConnect");
				if (pointsToConnect) {
					let coordinates: Array<Array<number>> = [];
					$array.each(pointsToConnect, (point) => {
						let geometry = point.get("geometry");
						if (geometry) {
							let coords = geometry.coordinates;
							if (coords) {
								coordinates.push([coords[0] as any, coords[1] as any]);
							}
						}
						else {
							coordinates.push([point.get("longitude", 0), point.get("latitude", 0)]);
						}
					})

					let geometry:any = { type: "LineString", coordinates: coordinates };

					dataItem.setRaw("geometry", geometry);
					mapLine.set("geometry", geometry);
				}
				else {
					mapLine.set("geometry", dataItem.get("geometry"));
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
}
