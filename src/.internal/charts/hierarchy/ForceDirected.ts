import type { DataItem } from "../../core/render/Component";
import type { Percent } from "../../core/util/Percent";
import type { LinkedHierarchyNode } from "./LinkedHierarchyNode";
import type { HierarchyLink } from "./HierarchyLink";
import type * as d3Hierarchy from "d3-hierarchy";

import { LinkedHierarchy, ILinkedHierarchySettings, ILinkedHierarchyDataItem, ILinkedHierarchyPrivate, ILinkedHierarchyEvents } from "./LinkedHierarchy";

import * as $array from "../../core/util/Array";
import * as $utils from "../../core/util/Utils";
import * as $type from "../../core/util/Type";
import * as d3Force from "d3-force";

/**
 * @ignore
 */
export interface IForceDirectedDataObject {
	name?: string,
	value?: number,
	children?: IForceDirectedDataObject[],
	dataItem?: DataItem<IForceDirectedDataItem>
};

export interface IForceDirectedDataItem extends ILinkedHierarchyDataItem {

	/**
	 * An array of data items of child nodes.
	 */
	children: Array<DataItem<IForceDirectedDataItem>>;

	/**
	 * Data item of a parent node.
	 */
	parent: DataItem<IForceDirectedDataItem>;

	/**
	 * @ignore
	 */
	d3ForceNode: d3Force.SimulationNodeDatum;

	/**
	 * X coordinate.
	 */
	x: number | undefined;

	/**
	 * Y coordinate.
	 */
	y: number | undefined;
}

export interface IForceDirectedSettings extends ILinkedHierarchySettings {

	/**
	 * Minimum gap in pixels between the nodes.
	 */
	nodePadding?: number;

	/**
	 * A force that attracts (or pushes back) all nodes to the center of the
	 * chart.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Layout_and_force_simulation} for more info
	 * @default 0.5
	 */
	centerStrength?: number;

	/**
	 * A force that attracts (or pushes back) all nodes to each other.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Layout_and_force_simulation} for more info
	 * @default -15
	 */
	manyBodyStrength?: number;

	/**
	 * A force that attracts (or pushes back) nodes that are linked together
	 * via `linkWithField`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Layout_and_force_simulation} for more info
	 * @default 0.5
	 */
	linkWithStrength?: number | undefined;

	/**
	 * Resistance acting agains node speed.
	 *
	 * The greater the value, the more "sluggish" the nodes will be.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Layout_and_force_simulation} for more info
	 * @default 0.5
	 */
	velocityDecay?: number;

	/**
	 * Length of how long initial force simulation would run in frames.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Layout_and_force_simulation} for more info
	 * @default 500
	 */
	initialFrames?: number;

	/**
	 * If set to a number will wait X number of frames before revealing
	 * the tree.
	 *
	 * Can be used to hide initial animations where nodes settle into their
	 * places.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Layout_and_force_simulation} for more info
	 * @default 10
	 */
	showOnFrame?: number;

	/**
	 * Smallest possible radius for a node circle.
	 *
	 * Can be a fixed pixel value or percent relative to chart size.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Sizing_nodes} for more info
	 * @default 1%
	 */
	minRadius?: number | Percent;

	/**
	 * Biggest possible radius for a node circle.
	 *
	 * Can be a fixed pixel value or percent relative to chart size.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Sizing_nodes} for more info
	 * @default 8%
	 */
	maxRadius?: number | Percent;

	/**
	 * Field in data that holds X coordinate of the node.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Fixed_nodes} for more info
	 */
	xField?: string;

	/**
	 * Field in data that holds X coordinate of the node.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/#Fixed_nodes} for more info
	 */
	yField?: string;

}

export interface IForceDirectedPrivate extends ILinkedHierarchyPrivate {
}

export interface IForceDirectedEvents extends ILinkedHierarchyEvents {
}

/**
 * Creates a force-directed tree.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/} for more info
 * @important
 */
export class ForceDirected extends LinkedHierarchy {

	protected _tag: string = "forcedirected";

	/**
	 * @ignore
	 */
	public readonly d3forceSimulation: d3Force.Simulation<{}, d3Force.SimulationLinkDatum<d3Force.SimulationNodeDatum>> = d3Force.forceSimulation();

	/**
	 * @ignore
	 */
	public readonly collisionForce: d3Force.ForceCollide<d3Force.SimulationNodeDatum> = d3Force.forceCollide(20);

	/**
	 * @ignore
	 */
	public linkForce: d3Force.ForceLink<d3Force.SimulationNodeDatum, d3Force.SimulationLinkDatum<d3Force.SimulationNodeDatum>> = d3Force.forceLink();

	public static className: string = "ForceDirected";
	public static classNames: Array<string> = LinkedHierarchy.classNames.concat([ForceDirected.className]);

	declare public _settings: IForceDirectedSettings;
	declare public _privateSettings: IForceDirectedPrivate;
	declare public _dataItemSettings: IForceDirectedDataItem;
	declare public _events: IForceDirectedEvents;

	protected _nodes: Array<any> = [];
	protected _links: Array<any> = [];

	protected _afterNew() {
		super._afterNew();

		this.d3forceSimulation.on("tick", () => {
			this._tick++;
			this.updateNodePositions();
		});
	}

	protected _tick: number = 0;
	protected _nodesDirty: boolean = false;

	public _prepareChildren() {
		super._prepareChildren();
		if (this.isDirty("showOnFrame")) {
			const showOnFrame = this.get("showOnFrame");
			if (showOnFrame > this._tick) {
				this.nodesContainer.setPrivate("visible", false);
				this.linksContainer.setPrivate("visible", false);
			}
		}

		const d3forceSimulation = this.d3forceSimulation;

		if (this.isDirty("velocityDecay")) {
			d3forceSimulation.velocityDecay(this.get("velocityDecay", 0));
		}

		if (this.isDirty("initialFrames")) {
			d3forceSimulation.alphaDecay(1 - Math.pow(0.001, 1 / this.get("initialFrames", 500)));
		}
	}

	/**
	 * @ignore
	 */
	public restartSimulation(alpha: number): void {
		const d3forceSimulation = this.d3forceSimulation;
		if (d3forceSimulation.alpha() < .25) {
			d3forceSimulation.alpha(alpha);
			d3forceSimulation.restart();
		}
	}

	public _handleRadiusChange() {
		this._updateForces();
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		const d3ForceNode: any = { index: this._index, x: this.innerWidth() / 2, y: this.innerHeight() / 2, dataItem: dataItem };
		const index = this._nodes.push(d3ForceNode) - 1;
		d3ForceNode.index = index;

		this.d3forceSimulation.nodes(this._nodes);

		dataItem.set("d3ForceNode", d3ForceNode);
		super.processDataItem(dataItem);

		const node = dataItem.get("node");
		node.set("x", -10000);
		node.on("scale", () => {
			this._updateForces();
		})

		node.events.on("dragged", () => {
			d3ForceNode.fx = node.x();
			d3ForceNode.fy = node.y();
			this._updateForces();
		})

		node.events.on("dragstop", () => {
			if (dataItem.get("x") == null) {
				d3ForceNode.fx = undefined;
			}
			if (dataItem.get("y") == null) {
				d3ForceNode.fy = undefined;
			}
		})
	}

	protected _updateValues(d3HierarchyNode: d3Hierarchy.HierarchyNode<IForceDirectedDataObject>) {
		super._updateValues(d3HierarchyNode);

		this._nodesDirty = true;

		const d3forceSimulation = this.d3forceSimulation;
		d3forceSimulation.force("collision", this.collisionForce);
		d3forceSimulation.nodes(this._nodes);

		this.linkForce = d3Force.forceLink(this._links);
		d3forceSimulation.force("link", this.linkForce);
	}

	protected _updateVisuals() {
		super._updateVisuals();
		this.restartSimulation(.3);
	}

	public _updateChildren() {
		super._updateChildren();

		const d3forceSimulation = this.d3forceSimulation;

		if (this._sizeDirty) {
			let w = Math.max(50, this.innerWidth());
			let h = Math.max(50, this.innerHeight());
			let pt = this.get("paddingTop", 0);
			let pl = this.get("paddingLeft", 0);

			let centerStrength = this.get("centerStrength", 1);

			d3forceSimulation.force("x", d3Force.forceX().x(w / 2 + pl).strength(centerStrength * 100 / w));
			d3forceSimulation.force("y", d3Force.forceY().y(h / 2 + pt).strength(centerStrength * 100 / h));
		}

		if (this._nodesDirty) {
			this._updateForces();
		}
	}

	public _updateForces() {
		const d3forceSimulation = this.d3forceSimulation;
		d3forceSimulation.force("manybody", d3Force.forceManyBody().strength((d3node) => {
			let dataItem = (d3node as any).dataItem;
			let node = dataItem.get("node") as LinkedHierarchyNode;
			let circle = dataItem.get("circle");
			let manyBodyStrength = this.get("manyBodyStrength", -15);

			if (circle) {
				return circle.get("radius", 1) * node.get("scale", 1) * manyBodyStrength;
			}
			return 0;
		}));

		this.collisionForce.radius((d3node) => {
			let dataItem = (d3node as any).dataItem;
			let node = dataItem.get("node") as LinkedHierarchyNode;
			let circle = dataItem.get("circle");
			let outerCircle = dataItem.get("outerCircle");
			if (circle && outerCircle) {
				let radius = circle.get("radius", 1);

				if (!outerCircle.isHidden()) {
					radius = radius * outerCircle.get("scale", 1.1);
				}

				radius *= node.get("scale", 1);

				return radius + this.get("nodePadding", 0);
			}
		})
		this.restartSimulation(0.3);
	}

	protected _animatePositions(_dataItem: DataItem<this["_dataItemSettings"]>) {
		// void, do not remove
	}

	public _clearDirty() {
		super._clearDirty();
		this._nodesDirty = false;
	}

	/**
	 * @ignore
	 */
	public updateNodePositions() {
		const linkForce = this.linkForce;
		if (linkForce) {
			linkForce.distance((linkDatum) => {
				return this.getDistance(linkDatum)
			});
			linkForce.strength((linkDatum) => {
				return this.getStrength(linkDatum)
			});
		}
		if (this._tick == this.get("showOnFrame")) {
			this.nodesContainer.setPrivate("visible", true);
			this.linksContainer.setPrivate("visible", true);
		}

		let d3Nodes = this.d3forceSimulation.nodes();

		$array.each(d3Nodes, (d3Node: any) => {
			const dataItem = d3Node.dataItem as DataItem<this["_dataItemSettings"]>;
			const node = dataItem.get("node");

			node.set("x", d3Node.x);
			node.set("y", d3Node.y);
		})

	}

	/**
	 * @ignore
	 */
	public updateLinkWith(dataItems: Array<DataItem<this["_dataItemSettings"]>>) {
		$array.each(dataItems, (dataItem) => {
			const linkWith = dataItem.get("linkWith");
			if (linkWith) {
				$array.each(linkWith, (id) => {
					const linkWithDataItem = this._getDataItemById(this.dataItems, id);

					if (linkWithDataItem) {
						this.linkDataItems(dataItem, linkWithDataItem, this.get("linkWithStrength"));
					}
				})
			}

			const children = dataItem.get("children");
			if (children) {
				this.updateLinkWith(children);
			}
		})
	}

	/**
	 * @ignore
	 */
	protected getDistance(linkDatum: any) {
		let sourceDataItem: DataItem<this["_dataItemSettings"]> = <DataItem<this["_dataItemSettings"]>>linkDatum.sourceDataItem;
		let targetDataItem: DataItem<this["_dataItemSettings"]> = <DataItem<this["_dataItemSettings"]>>linkDatum.targetDataItem;

		let distance = 0;

		if (sourceDataItem && targetDataItem) {

			const targetNode = targetDataItem.get("node");
			if (targetNode.isHidden()) {
				return 0;
			}

			let link = linkDatum.link;
			if (link) {
				distance = link.get("distance", 1);
			}

			const sourceNode = sourceDataItem.get("node");

			if (targetNode.isHidden()) {
				distance = 1;
			}

			return (distance * (sourceDataItem.get("circle").get("radius", 1) * sourceNode.get("scale", 1) + targetDataItem.get("circle").get("radius", 1) * targetNode.get("scale", 1)));
		}
		return distance;
	}

	/**
	 * @ignore
	 */
	protected getStrength(linkDatum: any) {
		let strength = 0;

		let link = linkDatum.link;
		if (link) {
			strength = link.get("strength", 1);
		}

		const targetDataItem = linkDatum.targetDataItem;
		strength *= targetDataItem.get("node").get("scale");

		return strength;
	}

	protected _updateNode(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._updateNode(dataItem);
		this._updateRadius(dataItem);

		const x = dataItem.get("x");
		const y = dataItem.get("y");

		const d3Node = dataItem.get("d3ForceNode");

		if (x != null) {
			(d3Node as any).fx = $utils.relativeToValue(x, this.innerWidth());
		}
		else {
			(d3Node as any).fx = undefined;
		}

		if (y != null) {
			(d3Node as any).fy = $utils.relativeToValue(y, this.innerHeight());
		}
		else {
			(d3Node as any).fx = undefined;
		}
	}

	protected _updateRadius(dataItem: DataItem<this["_dataItemSettings"]>) {
		let size = (this.innerWidth() + this.innerHeight()) / 2;

		let minRadius = $utils.relativeToValue(this.get("minRadius", 1), size);
		let maxRadius = $utils.relativeToValue(this.get("maxRadius", 5), size);

		let valueWorking = dataItem.get("sum");

		let radius = maxRadius;

		const min = this.getPrivate("valueLow", 0);
		const max = this.getPrivate("valueHigh", 0);

		if (max > 0) {
			radius = minRadius + (valueWorking - min) / (max - min) * (maxRadius - minRadius);
		}

		if (!$type.isNumber(radius)) {
			radius = minRadius;
		}

		const duration = this.get("animationDuration", 0);
		const easing = this.get("animationEasing");

		dataItem.get("circle").animate({ key: "radius", to: radius, duration: duration, easing: easing });
	}

	protected _processLink(link: HierarchyLink, source: DataItem<this["_dataItemSettings"]>, target: DataItem<this["_dataItemSettings"]>) {
		const d3Link = { link: link, source: source.get("d3ForceNode").index, target: target.get("d3ForceNode").index, sourceDataItem: source, targetDataItem: target };
		this._links.push(d3Link);
		link.setPrivate("d3Link", d3Link);

		this.linkForce = d3Force.forceLink(this._links);
		this.d3forceSimulation.force("link", this.linkForce);
		this.restartSimulation(0.5);
	}

	protected _disposeLink(link: HierarchyLink) {
		super._disposeLink(link);
		$array.remove(this._links, link.getPrivate("d3Link"));
	}

	protected _handleUnlink() {
		this.restartSimulation(0.5);
	}

	protected _onDataClear() {

		super._onDataClear();

		this._nodes = [];
		this._links = [];
	}
}
