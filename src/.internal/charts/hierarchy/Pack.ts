import type { DataItem } from "../../core/render/Component";
import type { HierarchyNode } from "./HierarchyNode";

import { Hierarchy, IHierarchyPrivate, IHierarchySettings, IHierarchyDataItem, IHierarchyEvents } from "./Hierarchy";
import { Circle } from "../../core/render/Circle";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";

import * as $array from "../../core/util/Array";
import * as d3hierarchy from "d3-hierarchy";
import * as $utils from "../../core/util/Utils";

/**
 * @ignore
 */
export interface IPackDataObject {
	name?: string,
	value?: number,
	children?: IPackDataObject[],
	dataItem?: DataItem<IPackDataItem>
};

export interface IPackDataItem extends IHierarchyDataItem {

	/**
	 * An array of data items of node's children.
	 */
	children: Array<DataItem<IPackDataItem>>;

	/**
	 * A data item of node's parent.
	 */
	parent: DataItem<IPackDataItem>;

	/**
	 * @ignore
	 */
	d3HierarchyNode: d3hierarchy.HierarchyCircularNode<IPackDataObject>;

	/**
	 * A [[Circle]] element of the node.
	 */
	circle: Circle;

}

export interface IPackSettings extends IHierarchySettings {

	/**
	 * Gap between nodes, in pixels.
	 *
	 * @since 5.2.6
	 */
	nodePadding?:number

}

export interface IPackPrivate extends IHierarchyPrivate {

	/**
	 * @ignore
	 */
	scaleR?: number;

}

export interface IPackEvents extends IHierarchyEvents {
}

/**
 * Builds a pack diagram.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/sunburst/} for more info
 * @important
 */
export class Pack extends Hierarchy {

	declare public _settings: IPackSettings;
	declare public _privateSettings: IPackPrivate;
	declare public _dataItemSettings: IPackDataItem;

	protected _tag: string = "pack";

	public static className: string = "Pack";
	public static classNames: Array<string> = Hierarchy.classNames.concat([Pack.className]);

	public _packLayout = d3hierarchy.pack();
	declare public _rootNode: d3hierarchy.HierarchyCircularNode<IPackDataObject> | undefined;
	public _packData: IPackDataObject | undefined;

	/**
	 * A list of node circle elements in a [[Pack]] chart.
	 *
	 * @default new ListTemplate<Circle>
	 */
	public readonly circles: ListTemplate<Circle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Circle._new(this._root, {
			themeTags: $utils.mergeTags(this.circles.template.get("themeTags", []), [this._tag, "shape"])
		}, [this.circles.template])
	));

	protected _afterNew() {
		super._afterNew();
		this.setPrivate("scaleR", 1);
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isPrivateDirty("scaleR")) {
			if (this._rootNode) {
				this._updateNodesScale(this._rootNode);
			}
		}
	}

	protected _updateVisuals() {
		if (this._rootNode) {
			const packLayout = this._packLayout;
			packLayout.size([this.innerWidth(), this.innerHeight()]);
			packLayout(this._rootNode);
			packLayout.padding(this.get("nodePadding", 0));
			this._updateNodes(this._rootNode);
		}
	}

	protected _updateNode(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._updateNode(dataItem);

		const node = dataItem.get("node");
		const circle = dataItem.get("circle");
		const hierarchyNode = dataItem.get("d3HierarchyNode");

		const scaleR = this.getPrivate("scaleR", 1);

		const x = hierarchyNode.x * scaleR;
		const y = hierarchyNode.y * scaleR;
		const radius = hierarchyNode.r * scaleR;

		const duration = this.get("animationDuration", 0);
		const easing = this.get("animationEasing");

		node.animate({ key: "x", to: x, duration: duration, easing: easing })
		node.animate({ key: "y", to: y, duration: duration, easing: easing })

		if (circle) {
			const fill = dataItem.get("fill");
			const fillPattern = dataItem.get("fillPattern");

			circle.animate({ key: "radius", to: radius, duration: duration, easing: easing })
			circle._setDefault("fill", fill);
			circle._setDefault("fillPattern", fillPattern);
			circle._setDefault("stroke", fill);
		}
	}

	protected _updateNodesScale(hierarchyNode: d3hierarchy.HierarchyCircularNode<IPackDataObject>) {
		const dataItem = hierarchyNode.data.dataItem;
		if (dataItem) {
			const node = dataItem.get("node");
			const circle = dataItem.get("circle");

			const scaleR = this.getPrivate("scaleR", 1);

			const x = hierarchyNode.x * scaleR;
			const y = hierarchyNode.y * scaleR;
			const radius = hierarchyNode.r * scaleR;

			node.setAll({ x: x, y: y })
			circle.set("radius", radius);

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

		const circle = node.children.moveValue(this.circles.make(), 0);
		node.setPrivate("tooltipTarget", circle);
		this.circles.push(circle);
		dataItem.setRaw("circle", circle);

		const label = dataItem.get("label");

		circle.on("radius", () => {
			const d = circle.get("radius", this.width()) * 2;
			label.setAll({ maxWidth: d, maxHeight: d });
		})

		return node;
	}

	public _zoom(dataItem: DataItem<this["_dataItemSettings"]>) {
		const hierarchyNode = dataItem.get("d3HierarchyNode");

		let x = hierarchyNode.x;
		let y = hierarchyNode.y;
		let r = hierarchyNode.r;

		let scaleR = Math.min(this.innerWidth(), this.innerHeight()) / (r * 2);

		const easing = this.get("animationEasing");
		let duration = this.get("animationDuration", 0);

		if (!this.inited) {
			duration = 0;
		}

		this.animatePrivate({ key: "scaleR", to: scaleR, duration: duration, easing: easing });

		const nodesContainer = this.nodesContainer;
		nodesContainer.animate({ key: "x", from: nodesContainer.x(), to: this.width() / 2 - x * scaleR, duration: duration, easing: easing });
		nodesContainer.animate({ key: "y", from: nodesContainer.y(), to: this.height() / 2 - y * scaleR, duration: duration, easing: easing });
	}
}
