import type { HierarchyNode } from "./HierarchyNode";
import type { Root } from "../../core/Root";
import type { DataItem } from "../../core/render/Component";

import { Hierarchy, IHierarchyPrivate, IHierarchySettings, IHierarchyDataItem, IHierarchyDataObject } from "./Hierarchy";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $utils from "../../core/util/Utils";
import * as d3hierarchy from "d3-hierarchy";

/**
 * @ignore
 */
export interface IPartitionDataObject {
	name?: string,
	value?: number,
	children?: IPartitionDataObject[],
	dataItem?: DataItem<IPartitionDataItem>
};

export interface IPartitionDataItem extends IHierarchyDataItem {

	/**
	 * Data items of child nodes.
	 */
	children: Array<DataItem<IPartitionDataItem>>;

	/**
	 * Data it of a parent node.
	 */
	parent: DataItem<IPartitionDataItem>;

	/**
	 * @ignore
	 */
	d3HierarchyNode: d3hierarchy.HierarchyRectangularNode<IHierarchyDataObject>;

	/**
	 * A [[RoundedRectangle]] element of a node.
	 */
	rectangle: RoundedRectangle;

}

export interface IPartitionSettings extends IHierarchySettings {

	/**
	 * Gap between nodes in pixels.
	 *
	 * @default 0
	 */
	nodePadding?: number;

	/**
	 * Orientation of the diagram.
	 *
	 * @default "vertical"
	 */
	orientation?: "horizontal" | "vertical";

}

export interface IPartitionPrivate extends IHierarchyPrivate {

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
 * Partition series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/hierarchy/partition/} for more info
 */
export class Partition extends Hierarchy {

	declare public _settings: IPartitionSettings;
	declare public _privateSettings: IPartitionPrivate;
	declare public _dataItemSettings: IPartitionDataItem;

	protected _tag: string = "partition";

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Partition["_settings"], template?: Template<Partition>): Partition {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["partition", settings.orientation || "vertical"]);
		const x = new Partition(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "Partition";
	public static classNames: Array<string> = Hierarchy.classNames.concat([Partition.className]);

	/**
	 * A list of node rectangle elements in a [[LinkedHierarchy]] chart.
	 *
	 * @default new ListTemplate<RoundedRectangle>
	 */
	public readonly rectangles: ListTemplate<RoundedRectangle> = new ListTemplate(
		Template.new({}),
		() => RoundedRectangle.new(this._root, {
			themeTags: $utils.mergeTags(this.rectangles.template.get("themeTags", []), [this._tag, "hierarchy", "node", "shape"])
		}, this.rectangles.template)
	);

	public _partitionLayout = d3hierarchy.partition();

	declare public _rootNode: d3hierarchy.HierarchyRectangularNode<IPartitionDataObject> | undefined;

	protected _afterNew() {
		super._afterNew();
		this.setPrivate("scaleX", 1);
		this.setPrivate("scaleY", 1);
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("nodePadding")) {
			if (this._rootNode) {
				this._updateNodes(this._rootNode);
			}
		}

		if (this.isPrivateDirty("scaleX") || this.isPrivateDirty("scaleY")) {
			if (this._rootNode) {
				this._updateNodesScale(this._rootNode);
			}
		}

		if (this.isDirty("orientation")) {
			this._updateVisuals();
		}
	}

	protected _updateVisuals() {
		if (this._rootNode) {
			const partitionLayout = this._partitionLayout;
			let w = this.innerWidth();
			let h = this.innerHeight();

			if (this.get("orientation") == "horizontal") {
				[w, h] = [h, w];
			}

			partitionLayout.size([w, h]);

			const nodePadding = this.get("nodePadding");

			if ($type.isNumber(nodePadding)) {
				partitionLayout.padding(nodePadding);
			}


			partitionLayout(this._rootNode);
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

		let x0, x1, y0, y1: number;

		if (this.get("orientation") == "horizontal") {
			x0 = hierarchyNode.y0 * scaleX;
			x1 = hierarchyNode.y1 * scaleX;
			y0 = hierarchyNode.x0 * scaleY;
			y1 = hierarchyNode.x1 * scaleY;
		}
		else {
			x0 = hierarchyNode.x0 * scaleX;
			x1 = hierarchyNode.x1 * scaleX;
			y0 = hierarchyNode.y0 * scaleY;
			y1 = hierarchyNode.y1 * scaleY;
		}
		let w = x1 - x0;
		let h = y1 - y0;

		const duration = this.get("animationDuration", 0);
		const easing = this.get("animationEasing");

		node.animate({ key: "x", to: x0, duration: duration, easing: easing })
		node.animate({ key: "y", to: y0, duration: duration, easing: easing })
		node.animate({ key: "width", to: w, duration: duration, easing: easing })
		node.animate({ key: "height", to: h, duration: duration, easing: easing })

		if (rectangle) {
			const fill = dataItem.get("fill");
			rectangle.animate({ key: "width", to: w, duration: duration, easing: easing })
			rectangle.animate({ key: "height", to: h, duration: duration, easing: easing })
			rectangle.setAll({ fill: fill });
		}
	}


	protected _updateNodesScale(hierarchyNode: d3hierarchy.HierarchyRectangularNode<IPartitionDataObject>) {
		const dataItem = hierarchyNode.data.dataItem;
		if (dataItem) {
			const node = dataItem.get("node");
			const rectangle = dataItem.get("rectangle");

			const scaleX = this.getPrivate("scaleX", 1);
			const scaleY = this.getPrivate("scaleY", 1);

			let x0, x1, y0, y1: number;

			if (this.get("orientation") == "horizontal") {
				x0 = hierarchyNode.y0 * scaleX;
				x1 = hierarchyNode.y1 * scaleX;
				y0 = hierarchyNode.x0 * scaleY;
				y1 = hierarchyNode.x1 * scaleY;
			}
			else {
				x0 = hierarchyNode.x0 * scaleX;
				x1 = hierarchyNode.x1 * scaleX;
				y0 = hierarchyNode.y0 * scaleY;
				y1 = hierarchyNode.y1 * scaleY;
			}

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
		this._makeNode(dataItem, node);
		return node;
	}

	protected _makeNode(dataItem: DataItem<this["_dataItemSettings"]>, node: HierarchyNode) {
		const rectangle = node.children.moveValue(this.rectangles.make(), 0);
		node.setPrivate("tooltipTarget", rectangle);
		dataItem.set("rectangle", rectangle);

		const label = dataItem.get("label");

		rectangle.on("width", () => {
			label.set("maxWidth", rectangle.width());
		})

		rectangle.on("height", () => {
			label.set("maxHeight", rectangle.height());
		})
	}

	protected _zoom(dataItem: DataItem<this["_dataItemSettings"]>) {
		let x0 = 0;
		let x1 = 0;
		let y0 = 0;
		let y1 = 0;

		const upDepth = this.get("upDepth", 0) + 1;
		const topDepth = this.get("topDepth", 0);

		const width = this.innerWidth();
		const height = this.innerHeight();

		const maxDepth = this.getPrivate("maxDepth", 1);
		const levelHeight = height / (maxDepth + 1);
		const levelWidth = width / (maxDepth + 1);
		const initialDepth = Math.min(this.get("initialDepth", 1), maxDepth - topDepth);

		let downDepth = this._currentDownDepth;
		if (downDepth == null) {
			downDepth = this.get("downDepth", 1);
		}

		if (dataItem) {
			const hierarchyNode = dataItem.get("d3HierarchyNode");
			let currentDepth = hierarchyNode.depth;

			if (this.get("orientation") == "horizontal") {
				x0 = hierarchyNode.y0;
				x1 = hierarchyNode.y1;

				y0 = hierarchyNode.x0;
				y1 = hierarchyNode.x1;

				x0 = x1 - levelWidth * upDepth;
				x1 = x0 + levelWidth * (downDepth + 1);

				if (currentDepth < topDepth) {
					y0 = 0;
					y1 = height;
					x0 = levelWidth * topDepth;
					x1 = x0 + levelWidth * initialDepth;
				}
			}
			else {
				x0 = hierarchyNode.x0;
				x1 = hierarchyNode.x1;

				y0 = hierarchyNode.y0;
				y1 = hierarchyNode.y1;

				y0 = y1 - levelHeight * upDepth;
				y1 = y0 + levelHeight * (downDepth + 1);

				if (currentDepth < topDepth) {
					x0 = 0;
					x1 = width;
					y0 = levelHeight * topDepth;
					y1 = y0 + levelHeight * initialDepth;
				}
			}
		}

		let scaleX = width / (x1 - x0);
		let scaleY = height / (y1 - y0);

		const easing = this.get("animationEasing");
		let duration = this.get("animationDuration", 0);

		if (!this.inited) {
			duration = 0;
		}

		this.animatePrivate({ key: "scaleX", to: scaleX, duration: duration, easing: easing });
		this.animatePrivate({ key: "scaleY", to: scaleY, duration: duration, easing: easing });

		this.nodesContainer.animate({ key: "x", to: -x0 * scaleX, duration: duration, easing: easing });
		this.nodesContainer.animate({ key: "y", to: -y0 * scaleY, duration: duration, easing: easing });
	}
}
