import type { HierarchyNode } from "../hierarchy/HierarchyNode";
import type { DataItem } from "../../core/render/Component";

import { Hierarchy, IHierarchyPrivate, IHierarchySettings, IHierarchyDataItem } from "../hierarchy/Hierarchy";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { Polygon } from "../../core/render/Polygon";
import { p50 } from "../../core/util/Percent";
import { voronoiTreemap } from 'd3-voronoi-treemap';
import seedrandom from "seedrandom";

import * as $utils from "../../core/util/Utils";
import * as $array from "../../core/util/Array";


export interface IVoronoiTreemapDataObject {
	name?: string,
	value?: number,
	children?: IVoronoiTreemapDataObject[],
	dataItem?: DataItem<IVoronoiTreemapDataItem>
};

export interface IVoronoiTreemapDataItem extends IHierarchyDataItem {
	/**
	 * Data items of child nodes.
	 */
	children: Array<DataItem<IVoronoiTreemapDataItem>>;

	/**
	 * Data item of the parent node.
	 */
	parent: DataItem<IVoronoiTreemapDataItem>;

	/**
	 * The node's polygon.
	 */
	polygon: Polygon;

}

export interface IVoronoiTreemapSettings extends IHierarchySettings {

	/**
	 * Outline of the whole diagram: `"polygon"`, a round shape of
	 * `cornerCount` corners, or `"rectangle"`, which fills the series' area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/voronoi-treemap/#Diagram_type} for more info
	 * @default "polygon"
	 */
	shapeType?: "rectangle" | "polygon"

	/**
	 * Type of the diagram's shape.
	 * Left for backward compatibility. Please use `shapeType` instead.
	 * @ignore
	 */
	type?: "rectangle" | "polygon"

	/**
	 * Number of corners of the outline when `shapeType` is `"polygon"`. The
	 * default `120` looks like a circle.
	 *
	 * @default 120
	 */
	cornerCount?: number;

	/**
	 * Smallest weight a cell may have, as a fraction of the largest. Lighter
	 * cells are enlarged to it, so they no longer show their true value. Very
	 * small values can make the layout flicker.
	 *
	 * @default 0.005
	 */
	minWeightRatio?: number;

	/**
	 * How closely the cell areas must match their values before the layout
	 * stops: it stops once the cells' summed area error is below this
	 * fraction of the total area. Smaller values are more precise but slower.
	 *
	 * @default 0.005
	 */
	convergenceRatio?: number;

	/**
	 * Most iterations the layout runs, even if `convergenceRatio` is not
	 * reached yet. More iterations give finer results but take longer.
	 *
	 * @default 100
	 */
	maxIterationCount?: number;

}

export interface IVoronoiTreemapPrivate extends IHierarchyPrivate {
}

/**
 * A weighted Voronoi treemap: nodes as polygon cells sized by value, each
 * inside its parent's cell. Many items with very different values lay out
 * poorly; group the small ones into an "Other" item.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/voronoi-treemap/} for more info
 * @since 5.4.0
 */
export class VoronoiTreemap extends Hierarchy {

	declare public _settings: IVoronoiTreemapSettings;
	declare public _privateSettings: IVoronoiTreemapPrivate;
	declare public _dataItemSettings: IVoronoiTreemapDataItem;

	protected _tag: string = "voronoitreemap";

	public static className: string = "VoronoiTreemap";
	public static classNames: Array<string> = Hierarchy.classNames.concat([VoronoiTreemap.className]);

	/**
	 * List of node polygons; configure them all through `polygons.template`.
	 */
	public readonly polygons: ListTemplate<Polygon> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Polygon._new(this._root, {
			themeTags: $utils.mergeTags(this.polygons.template.get("themeTags", []), [this._tag, "shape"])
		}, [this.polygons.template])
	));

	public voronoi = voronoiTreemap();

	protected _afterNew() {

		this.nodesContainer.setAll({
			x: p50,
			y: p50,
			centerX: p50,
			centerY: p50
		})

		this.nodes.template.setPrivate("trustBounds", true);

		super._afterNew();
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("type") && this.get("type") !== undefined) {
			this.set("shapeType", this.get("type"));
			this.setRaw("type", undefined);
		}

		const width = this.innerWidth() / 2;
		const height = this.innerHeight() / 2;

		let node = this._rootNode;
		const selectedDataItem = this.get("selectedDataItem") as DataItem<IVoronoiTreemapDataItem>;

		if (selectedDataItem) {
			node = selectedDataItem.get("d3HierarchyNode")
		}

		this.voronoi.convergenceRatio((this.get("convergenceRatio", 0.005)));
		this.voronoi.maxIterationCount((this.get("maxIterationCount", 100)));
		this.voronoi.minWeightRatio((this.get("minWeightRatio", 0.005)));

		// Re-clip and re-tessellate on the relevant setting changes. Full
		// re-tessellation is expensive, so avoid it where it isn't needed:
		//  - "rectangle": the clip depends on the actual size, so recompute on a
		//    shape change AND on resize.
		//  - "polygon": uses a size-independent unit clip (scaled per node in
		//    `_updateNode`), so it only needs a re-tessellation when the shape or
		//    `cornerCount` changes — NOT on resize. Resizing just rescales the
		//    existing cells (handled by the base `_updateVisuals` on `_sizeDirty`),
		//    which is cheap; re-tessellating there would spike CPU with lots of
		//    data (e.g. when a legend reflows the plot area).
		if (node) {
			if (this.get("shapeType") == "rectangle") {
				if (this.isDirty("shapeType") || this._sizeDirty) {
					this.voronoi.prng(seedrandom("X"));
					this.voronoi.clip([[-width, -height], [-width, height], [width, height], [width, -height]])(node);
					this._updateVisuals();
				}
			}
			else {
				if (this.isDirty("shapeType") || this.isDirty("cornerCount")) {
					this.voronoi.prng(seedrandom("X"));
					this.voronoi.clip(this.getCirclePolygon(1))(node);
					this._updateVisuals();
				}
			}
		}

		if ((this._valuesDirty || this.isDirty("selectedDataItem")) && node) {
			this.voronoi.prng(seedrandom("X"));
			this.voronoi(node);
			this._updateVisuals();
		}
	}

	protected _updateNode(dataItem: DataItem<this["_dataItemSettings"]>) {
		const coords: any = (dataItem.get("d3HierarchyNode") as any).polygon;
		const polygon = dataItem.get("polygon");

		if (coords && polygon) {

			let coordinates: any = [];

			let d = 1;
			if (this.get("shapeType") == "polygon") {
				d = Math.min(this.innerWidth(), this.innerHeight()) / 2;
			}

			let minX = Infinity;
			let maxX = -Infinity;

			for (let i = 0, len = coords.length; i < len; i++) {
				const point: Array<number> = coords[i] as any;
				let x = point[0] * d;
				let y = point[1] * d;

				coordinates.push([x, y]);

				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
			}

			polygon.set("coordinates", coordinates);

			const fill = dataItem.get("fill");
			const fillPattern = dataItem.get("fillPattern");

			polygon._setDefault("fill", fill);
			polygon._setDefault("fillPattern", fillPattern);

			const label = dataItem.get("label");
			if (label) {
				const site = coords.site;

				if (site) {
					label.setAll({
						x: site.x * d,
						y: site.y * d,
						maxWidth: Math.abs(maxX - minX)
					})
				}
			}
		}
	}


	protected _handleSingle(dataItem: DataItem<this["_dataItemSettings"]>) {
		const parent = dataItem.get("parent");
		if (parent) {
			const children = parent.get("children");
			if (children) {
				$array.each(children, (child) => {
					if (child != dataItem) {
						this.disableDataItem(child);
						child.get("node").hide();
					}
				})
			}
			this._handleSingle(parent);
		}
	}

	/**
	 * @ignore
	 */
	public makeNode(dataItem: DataItem<this["_dataItemSettings"]>): HierarchyNode {
		const node = super.makeNode(dataItem);
		this._makeNode(dataItem, node);
		return node;
	}

	protected _makeNode(dataItem: DataItem<this["_dataItemSettings"]>, node: HierarchyNode) {
		const polygon = node.children.moveValue(this.polygons.make(), 0);
		node.setPrivate("tooltipTarget", polygon);
		dataItem.setRaw("polygon", polygon);
		polygon._setDataItem(dataItem);
	}

	protected getCirclePolygon(radius: number) {
		const points = this.get("cornerCount", 120);
		const dAngle = Math.PI * 2 / points;
		const polygon: Array<Array<number>> = [];

		for (let i = 0; i < points; i++) {
			let angle = i * dAngle;
			polygon.push([radius * Math.cos(angle), radius * Math.sin(angle)])
		}

		return polygon;
	}
}
