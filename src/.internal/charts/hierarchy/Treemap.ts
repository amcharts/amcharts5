import type { HierarchyNode } from "./HierarchyNode";
import type { DataItem } from "../../core/render/Component";

import { Hierarchy, IHierarchyPrivate, IHierarchySettings, IHierarchyDataItem, IHierarchyDataObject } from "./Hierarchy";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $utils from "../../core/util/Utils";
import * as d3hierarchy from "d3-hierarchy";

export interface ITreemapDataObject { name?: string, value?: number, children?: ITreemapDataObject[], dataItem?: DataItem<ITreemapDataItem> };

export interface ITreemapDataItem extends IHierarchyDataItem {
	children: Array<DataItem<ITreemapDataItem>>;
	parent: DataItem<ITreemapDataItem>;
	d3HierarchyNode: d3hierarchy.HierarchyRectangularNode<IHierarchyDataObject>;
	rectangle: RoundedRectangle;
}

export interface ITreemapSettings extends IHierarchySettings {

	/**
	 * Gap between nodes. In pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/treemap/#Margins}
	 */
	nodePaddingInner?: number;

	/**
	 * Gap between nodes and outer edge of the chart. In pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/treemap/#Margins}
	 */
	nodePaddingOuter?: number;

	/**
	 * Gap between nodes and top edge.
	 *
	 * Will be ignored if `nodePaddingOuter` is set.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/treemap/#Margins}
	 */
	nodePaddingTop?: number;

	/**
	 * Gap between nodes and bottomedge.
	 *
	 * Will be ignored if `nodePaddingOuter` is set.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/treemap/#Margins}
	 */
	nodePaddingBottom?: number;

	/**
	 * Gap between nodes and left edge.
	 *
	 * Will be ignored if `nodePaddingOuter` is set.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/treemap/#Margins}
	 */
	nodePaddingLeft?: number;

	/**
	 * Gap between nodes and bottom edge.
	 *
	 * Will be ignored if `nodePaddingOuter` is set.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/treemap/#Margins}
	 */
	nodePaddingRight?: number;

	/**
	 * An algorithm to use when laying out node rectangles.
	 *
	 * @see {@link }
	 * @default "squarify"
	 */
	layoutAlgorithm?: "binary" | "squarify" | "slice" | "dice" | "sliceDice";

}

export interface ITreemapPrivate extends IHierarchyPrivate {

	/**
	 * Current horizontal scale.
	 */
	scaleX?: number;

	/**
	 * Current vertical scale.
	 */
	scaleY?: number;

}

/**
 * Treemap series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/treemap/} for more info
 */
export class Treemap extends Hierarchy {

	declare public _settings: ITreemapSettings;
	declare public _privateSettings: ITreemapPrivate;
	declare public _dataItemSettings: ITreemapDataItem;

	protected _tag: string = "treemap";

	public static className: string = "Treemap";
	public static classNames: Array<string> = Hierarchy.classNames.concat([Treemap.className]);

	public readonly rectangleTemplate: Template<RoundedRectangle> = Template.new({});

	public _treemapLayout = d3hierarchy.treemap().tile(d3hierarchy.treemapSquarify);

	declare public _rootNode: d3hierarchy.HierarchyRectangularNode<ITreemapDataObject> | undefined;

	/**
	 * A list of node rectangle elements in a [[Treemap]] chart.
	 *
	 * @default new ListTemplate<RoundedRectangle>
	 */
	public readonly rectangles: ListTemplate<RoundedRectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => RoundedRectangle._new(this._root, {
			themeTags: $utils.mergeTags(this.rectangles.template.get("themeTags", []), [this._tag, "shape"])
		}, [this.rectangles.template])
	));

	protected _afterNew() {
		super._afterNew();
		this.setPrivate("scaleX", 1);
		this.setPrivate("scaleY", 1);

		this.nodes.template.setPrivate("trustBounds", true);
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("layoutAlgorithm")) {
			let algorithm;

			switch (this.get("layoutAlgorithm")) {
				case "squarify":
					algorithm = d3hierarchy.treemapSquarify;
					break;
				case "binary":
					algorithm = d3hierarchy.treemapBinary;
					break;
				case "slice":
					algorithm = d3hierarchy.treemapSlice;
					break;
				case "dice":
					algorithm = d3hierarchy.treemapDice;
					break;
				case "sliceDice":
					algorithm = d3hierarchy.treemapSliceDice;
					break;
			}
			if (algorithm) {
				this._treemapLayout = d3hierarchy.treemap().tile(algorithm);
				this._updateVisuals();

				const selectedDataItem = this.get("selectedDataItem") as DataItem<this["_dataItemSettings"]>;
				if(selectedDataItem){
					this._zoom(selectedDataItem);
				}
			}
		}

		if (this.isDirty("nodePaddingRight") || this.isDirty("nodePaddingLeft") || this.isDirty("nodePaddingTop") || this.isDirty("nodePaddingBottom") || this.isDirty("nodePaddingOuter") || this.isDirty("nodePaddingInner")) {
			if (this._rootNode) {
				this._updateNodes(this._rootNode);
			}
		}

		if (this.isPrivateDirty("scaleX") || this.isPrivateDirty("scaleY")) {
			if (this._rootNode) {
				this._updateNodesScale(this._rootNode);
			}
		}
	}

	protected _updateVisuals() {
		if (this._rootNode) {
			const treemapLayout = this._treemapLayout;
			treemapLayout.size([this.innerWidth(), this.innerHeight()]);

			const paddingLeft = this.get("nodePaddingLeft");
			const paddingRight = this.get("nodePaddingRight");
			const paddingTop = this.get("nodePaddingTop");
			const paddingBottom = this.get("nodePaddingBottom");
			const paddingInner = this.get("nodePaddingInner");
			const paddingOuter = this.get("nodePaddingOuter");
			if ($type.isNumber(paddingLeft)) {
				treemapLayout.paddingLeft(paddingLeft);
			}
			if ($type.isNumber(paddingRight)) {
				treemapLayout.paddingRight(paddingRight);
			}
			if ($type.isNumber(paddingTop)) {
				treemapLayout.paddingTop(paddingTop);
			}
			if ($type.isNumber(paddingBottom)) {
				treemapLayout.paddingBottom(paddingBottom);
			}
			if ($type.isNumber(paddingInner)) {
				treemapLayout.paddingInner(paddingInner);
			}
			if ($type.isNumber(paddingOuter)) {
				treemapLayout.paddingOuter(paddingOuter);
			}

			treemapLayout(this._rootNode);
			this._updateNodes(this._rootNode);
		}
	}

	protected _updateNode(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._updateNode(dataItem);

		const node = dataItem.get("node");
		const rectangle = dataItem.get("rectangle");
		const hierarchyNode = dataItem.get("d3HierarchyNode");

		const scaleX = this.getPrivate("scaleX", 1);
		const scaleY = this.getPrivate("scaleY", 1);

		const x0 = hierarchyNode.x0 * scaleX;
		const x1 = hierarchyNode.x1 * scaleX;
		const y0 = hierarchyNode.y0 * scaleY;
		const y1 = hierarchyNode.y1 * scaleY;

		const w = x1 - x0;
		const h = y1 - y0;

		const duration = this.get("animationDuration", 0);
		const easing = this.get("animationEasing");

		node.animate({ key: "x", to: x0, duration: duration, easing: easing })
		node.animate({ key: "y", to: y0, duration: duration, easing: easing })

		node.animate({ key: "width", to: w, duration: duration, easing: easing })
		node.animate({ key: "height", to: h, duration: duration, easing: easing })

		if (rectangle) {
			const fill = dataItem.get("fill");
			const fillPattern = dataItem.get("fillPattern");

			rectangle.animate({ key: "width", to: w, duration: duration, easing: easing })
			rectangle.animate({ key: "height", to: h, duration: duration, easing: easing })
			rectangle._setDefault("fill", fill);
			rectangle._setDefault("fillPattern", fillPattern);
			rectangle._setDefault("stroke", fill);
		}
	}


	protected _updateNodesScale(hierarchyNode: d3hierarchy.HierarchyRectangularNode<ITreemapDataObject>) {
		const dataItem = hierarchyNode.data.dataItem;
		if (dataItem) {
			const node = dataItem.get("node");
			const rectangle = dataItem.get("rectangle");

			const scaleX = this.getPrivate("scaleX", 1);
			const scaleY = this.getPrivate("scaleY", 1);

			const x0 = hierarchyNode.x0 * scaleX;
			const x1 = hierarchyNode.x1 * scaleX;
			const y0 = hierarchyNode.y0 * scaleY;
			const y1 = hierarchyNode.y1 * scaleY;

			const w = x1 - x0;
			const h = y1 - y0;

			node.setAll({ x: x0, y: y0, width: w, height: h });
			rectangle.setAll({ width: w, height: h });

			const hierarchyChildren = hierarchyNode.children;
			if (hierarchyChildren) {
				$array.each(hierarchyChildren, (hierarchyChild) => {
					this._updateNodesScale(hierarchyChild)
				})
			}
		}
	}

	/**
	 * @ignore
	 */
	public makeNode(dataItem: DataItem<this["_dataItemSettings"]>): HierarchyNode {
		const node = super.makeNode(dataItem);

		const rectangle = node.children.moveValue(this.rectangles.make(), 0);

		node.setPrivate("tooltipTarget", rectangle);
		dataItem.setRaw("rectangle", rectangle);

		const label = dataItem.get("label");

		rectangle.on("width", () => {
			label.setPrivate("maxWidth", rectangle.width());
		})

		rectangle.on("height", () => {
			label.setPrivate("maxHeight", rectangle.height());
		})

		return node;
	}

	public _zoom(dataItem: DataItem<this["_dataItemSettings"]>) {
		if (this.width() > 0 && this.height() > 0) {
			const hierarchyNode = dataItem.get("d3HierarchyNode");

			const nodePaddingOuter = this.get("nodePaddingOuter", 0);

			let x0 = hierarchyNode.x0 + nodePaddingOuter;
			let x1 = hierarchyNode.x1 - nodePaddingOuter;

			let y0 = hierarchyNode.y0 + nodePaddingOuter;
			let y1 = hierarchyNode.y1 - nodePaddingOuter;

			let scaleX = (this.innerWidth() - nodePaddingOuter * 2) / (x1 - x0);
			let scaleY = (this.innerHeight() - nodePaddingOuter * 2) / (y1 - y0);

			const easing = this.get("animationEasing");
			let duration = this.get("animationDuration", 0);

			if (!this.inited) {
				duration = 0;
			}

			this.animatePrivate({ key: "scaleX", to: scaleX, duration: duration, easing: easing });
			this.animatePrivate({ key: "scaleY", to: scaleY, duration: duration, easing: easing });

			this.nodesContainer.animate({ key: "x", to: nodePaddingOuter - x0 * scaleX, duration: duration, easing: easing });
			this.nodesContainer.animate({ key: "y", to: nodePaddingOuter - y0 * scaleY, duration: duration, easing: easing });
		}
	}

	protected _selectDataItem(dataItem?: DataItem<this["_dataItemSettings"]>, downDepth?: number, skipDisptach?: boolean) {
		super._selectDataItem(dataItem, downDepth, skipDisptach);

		if (dataItem) {
			let maxDepth = this.get("downDepth", 1) + dataItem.get("depth");
			if (!this.inited) {
				maxDepth = this.get("initialDepth", 1);
			}
			const visibleNodes = this._getVisibleNodes(dataItem, maxDepth);
			this.nodes.each((node) => {
				if (visibleNodes.indexOf(node.dataItem as DataItem<this["_dataItemSettings"]>) == -1) {
					node.setPrivate("focusable", false);
				}
				else {
					node.removePrivate("focusable");
				}
			});
		}
		this._root._invalidateTabindexes();
	}

	protected _getVisibleNodes(dataItem: DataItem<this["_dataItemSettings"]>, maxDepth: number) {
		const children = dataItem.get("children");
		let includedChildren: Array<DataItem<this["_dataItemSettings"]>> = [];
		if(children){
			$array.each(children, (child) => {
				if (child.get("depth") == maxDepth || !child.get("children")) {
					includedChildren.push(child);
				}
				else {
					includedChildren = includedChildren.concat(this._getVisibleNodes(child, maxDepth));
				}
			});
		}
		return includedChildren;
	}

}
