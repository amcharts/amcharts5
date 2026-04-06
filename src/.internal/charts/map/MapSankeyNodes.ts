import type { DataItem } from "../../core/render/Component";
import type { Color } from "../../core/util/Color";
import type { ColorSet } from "../../core/util/ColorSet";
import type { MapSankeySeries, IMapSankeySeriesDataItem } from "./MapSankeySeries";

import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "../../core/render/Series";
import { MapPolygon } from "./MapPolygon";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";

export interface IMapSankeyNodesDataItem extends ISeriesDataItem {

	/**
	 * Node name.
	 */
	name: string;

	/**
	 * Node color.
	 */
	fill: Color;

	/**
	 * Sum of values of all incoming links.
	 */
	sumIncoming: number;

	/**
	 * Sum of values of all outgoing links.
	 */
	sumOutgoing: number;

	/**
	 * Sum of values of all links: incoming and outgoing.
	 */
	sum: number;

	/**
	 * A list of incoming link data items.
	 */
	incomingLinks: Array<DataItem<IMapSankeySeriesDataItem>>;

	/**
	 * A list of outgoing link data items.
	 */
	outgoingLinks: Array<DataItem<IMapSankeySeriesDataItem>>;

	/**
	 * Node longitude.
	 */
	longitude: number;

	/**
	 * Node latitude.
	 */
	latitude: number;

	/**
	 * Related [[MapPolygon]] object (circle or bar shape).
	 */
	mapPolygon: MapPolygon;
}

export interface IMapSankeyNodesSettings extends ISeriesSettings {

	/**
	 * A field in data that holds name for the node.
	 * @default "name"
	 */
	nameField?: string;

	/**
	 * A field in data that holds color used for node fill.
	 * @default "fill"
	 */
	fillField?: string;

	/**
	 * A field in data that holds the node longitude.
	 * @default "longitude"
	 */
	longitudeField?: string;

	/**
	 * A field in data that holds the node latitude.
	 * @default "latitude"
	 */
	latitudeField?: string;

	/**
	 * A [[ColorSet]] that series will use to apply to its nodes.
	 */
	colors?: ColorSet;
}

export interface IMapSankeyNodesPrivate extends ISeriesPrivate {
}

export interface IMapSankeyNodesEvents extends ISeriesEvents {
}

/**
 * Holds instances of nodes for a [[MapSankeySeries]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-sankey-series/} for more info
 * @since 5.17.0
 * @important
 */
export class MapSankeyNodes extends Series {

	public static className: string = "MapSankeyNodes";
	public static classNames: Array<string> = Series.classNames.concat([MapSankeyNodes.className]);

	declare public _settings: IMapSankeyNodesSettings;
	declare public _privateSettings: IMapSankeyNodesPrivate;
	declare public _dataItemSettings: IMapSankeyNodesDataItem;
	declare public _events: IMapSankeyNodesEvents;

	/**
	 * Related [[MapSankeySeries]].
	 */
	public flow: MapSankeySeries | undefined;

	/**
	 * Flag indicating user has explicitly set node data.
	 * Prevents auto-clearing of nodes when link data changes.
	 * @ignore
	 */
	public _userDataSet = false;

	/**
	 * A [[ListTemplate]] of all node polygons.
	 *
	 * `mapPolygons.template` can be used to configure node appearance.
	 *
	 * @default new ListTemplate<MapPolygon>
	 */
	public readonly mapPolygons: ListTemplate<MapPolygon> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => MapPolygon._new(this._root, {}, [this.mapPolygons.template])
	));

	/**
	 * @ignore
	 */
	public _applyThemes(force: boolean = false): boolean {
		const colors = this.get("colors");
		if (colors) {
			colors.reset();
		}
		return super._applyThemes(force);
	}

	/**
	 * @ignore
	 */
	protected _afterNew() {
		this.fields.push("name", "fill", "longitude", "latitude");

		this._setRawDefault("idField", "id");
		this._setRawDefault("nameField", "name");
		this._setRawDefault("fillField", "fill");
		this._setRawDefault("longitudeField", "longitude");
		this._setRawDefault("latitudeField", "latitude");

		super._afterNew();
	}

	/**
	 * @ignore
	 */
	protected _onDataClear() {
		const colors = this.get("colors");
		if (colors) {
			colors.reset();
		}
		this._userDataSet = true;
	}

	/**
	 * Processes a newly added node data item, assigning a fill color
	 * and creating its map polygon.
	 *
	 * @param dataItem  Data item to process
	 */
	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		// Auto-assign fill from ColorSet if not provided
		if (dataItem.get("fill") == null) {
			const colors = this.get("colors");
			if (colors) {
				dataItem.setRaw("fill", colors.next());
			}
		}

		// Create MapPolygon visual
		const mapPolygon = this.makeMapPolygon(dataItem);
		dataItem.setRaw("mapPolygon", mapPolygon);
	}

	/**
	 * @ignore
	 */
	public _updateNodeColor(dataItem: DataItem<this["_dataItemSettings"]>) {
		const mapPolygon = dataItem.get("mapPolygon");
		if (mapPolygon) {
			mapPolygon.set("fill", dataItem.get("fill"));
		}
	}

	/**
	 * Creates a MapPolygon visual for a node data item.
	 * @ignore
	 */
	public makeMapPolygon(dataItem: DataItem<this["_dataItemSettings"]>): MapPolygon {
		const mapPolygon = this.mapPolygons.make();
		this.mapPolygons.push(mapPolygon);
		mapPolygon._setDataItem(dataItem);

		// Set series to parent MapSankeySeries for projection access
		if (this.flow) {
			mapPolygon.series = this.flow;
			this.flow.children.push(mapPolygon);
		}

		// Apply fill from data item and listen for changes
		const fill = dataItem.get("fill");
		if (fill) {
			mapPolygon._setSoft("fill", fill);
		}

		dataItem.on("fill", () => {
			this._updateNodeColor(dataItem);
		});

		return mapPolygon;
	}

	/**
	 * Add an incoming link to a node data item.
	 * @ignore
	 */
	public addIncomingLink(dataItem: DataItem<this["_dataItemSettings"]>, link: DataItem<IMapSankeySeriesDataItem>) {
		let incoming = dataItem.get("incomingLinks");
		if (!incoming) {
			incoming = [];
			dataItem.setRaw("incomingLinks", incoming);
		}
		incoming.push(link);
	}

	/**
	 * Add an outgoing link to a node data item.
	 * @ignore
	 */
	public addOutgoingLink(dataItem: DataItem<this["_dataItemSettings"]>, link: DataItem<IMapSankeySeriesDataItem>) {
		let outgoing = dataItem.get("outgoingLinks");
		if (!outgoing) {
			outgoing = [];
			dataItem.setRaw("outgoingLinks", outgoing);
		}
		outgoing.push(link);
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
	}
}
