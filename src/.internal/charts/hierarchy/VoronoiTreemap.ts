import { voronoiTreemap } from 'd3-voronoi-treemap';
import seedrandom from "seedrandom";

import type { HierarchyNode } from "../hierarchy/HierarchyNode";

import type { DataItem } from "../../core/render/Component";
import { Hierarchy, IHierarchyPrivate, IHierarchySettings, IHierarchyDataItem } from "../hierarchy/Hierarchy";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { Polygon } from "../../core/render/Polygon";
import * as $utils from "../../core/util/Utils";
import * as $array from "../../core/util/Array";
import { p50 } from "../../core/util/Percent";


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
	 * Data it of a parent node.
	 */
	parent: DataItem<IVoronoiTreemapDataItem>;

	/**
	 * A [[Polygon]] element of a node.
	 */
	polygon: Polygon;

}

export interface IVoronoiTreemapSettings extends IHierarchySettings {

	/**
	 * Type of the diagram's shape.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/voronoi-treemap/#Diagram_type} for more info
	 * @default "polygon"
	 */
	type?: "rectangle" | "polygon"

	/**
	 * Number of corners when type is `"polygon"`.
	 *
	 * `120` means the polygoon will look like a circle.
	 *
	 * NOTE: this setting is ignored if `type="rectangle"`.
	 *
	 * @default 120
	 */
	cornerCount?: number;

	/**
	 * Minimum weight ratio which allows computing the minimum allowed
	 * weight (`= [maximum weight] * minWeightRatio`).
	 *
	 * Setting very small `minWeigtRatio` might result flickering.
	 *
	 * NOTE: the nodes that have smaller weight will be scaled up and will not
	 * represent their true value correctly.
	 *
	 * @default 0.005
	 */
	minWeightRatio?: number;

	/**
	 * The convergence ratio in Voronoi treemaps measures how well the treemap
	 * layout represents the hierarchical structure of the underlying data.
	 *
	 * It is calculated as the ratio of the summed area of the smallest enclosing
	 * rectangle for each cell to the total area of the treemap. A lower
	 * convergence ratio indicates a better representation of the hierarchy,
	 * meaning that the cells are closely packed and the treemap effectively
	 * captures the nested relationships between the data elements.
	 *
	 * @default 0.005
	 */
	convergenceRatio?: number;

	/**
	 * Maximum allowed number of iterations when computing the layout.
	 *
	 * Computation is stopped when it number of iterations is reached, even if
	 * the `convergenceRatio` is not yet reached.
	 *
	 * Bigger number means finer results, but slower performance.
	 *
	 * @default 100
	 */
	maxIterationCount?: number;

}

export interface IVoronoiTreemapPrivate extends IHierarchyPrivate {
}

/**
 * A Weighted Voronoi Treemap series.
 *
 * NOTE: Try to avoid a big number of data items with very big value
 * differences. Better group small items into "Other" item.
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
	 * A list of node graphics elements in a [[VoronoiTreemap]] chart.
	 *
	 * @default new ListTemplate<RoundedRectangle>
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

		if (this.isDirty("type")) {
			if (this.get("type") == "polygon") {
				this.voronoi.clip(this.getCirclePolygon(1));
				this._updateVisuals();
			}
		}

		if (this._sizeDirty) {
			if (this.get("type") == "rectangle") {
				this.voronoi.prng(seedrandom("X"));
				this.voronoi.clip([[-width, -height], [-width, height], [width, height], [width, -height]])(node);
				this._updateVisuals();
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
			if (this.get("type") == "polygon") {
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
