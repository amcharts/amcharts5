import type { DataItem } from "../../core/render/Component";
import type { Color } from "../../core/util/Color";
import type { Time } from "../../core/util/Animation";
import type { Flow, IFlowDataItem } from "./Flow";
import type * as d3sankey from "d3-sankey";

import { Label } from "../../core/render/Label";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "../../core/render/Series";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { FlowNode } from "./FlowNode";
import type { ColorSet } from "../../core/util/ColorSet";

import * as $array from "../../core/util/Array";

export interface IFlowNodesDataItem extends ISeriesDataItem {

	/**
	 * Node name.
	 */
	name: string;

	/**
	 * An associated node instance.
	 */
	node: FlowNode;

	/**
	 * Node label.
	 */
	label: Label;

	/**
	 * Node color.
	 */
	fill: Color;

	/**
	 * Indicates "unknown" node.
	 */
	unknown: boolean;

	/**
	 * @ignore
	 */
	d3SankeyNode: d3sankey.SankeyNode<d3sankey.SankeyExtraProperties, d3sankey.SankeyExtraProperties>;

	/**
	 * Sum of values of all incoming links.
	 */
	sumIncoming: number;

	/**
	 * Sum of values of all outgoing links.
	 */
	sumOutgoing: number;

	/**
	 * @ignore
	 */
	sumIncomingWorking: number;

	/**
	 * @ignore
	 */
	sumOutgoingWorking: number;

	/**
	 * Sum of values of all links: incoming and outgoing.
	 */
	sum: number;

	/**
	 * @ignore
	 */
	sumWorking: number;

	/**
	 * A list of incoming link data items.
	 */
	incomingLinks: Array<DataItem<IFlowDataItem>>;

	/**
	 * A list of outgoing link data items.
	 */
	outgoingLinks: Array<DataItem<IFlowDataItem>>;

	/**
	 * Depth of the node.
	 */
	depth: number;

}

export interface IFlowNodesSettings extends ISeriesSettings {

	/**
	 * A field in data boolean setting if the node is "unknown".
	 *
	 * @default "unknown"
	 */
	unknownField?: string;

	/**
	 * A field in data that holds name for the node.
	 *
	 * @default "id"
	 */
	nameField?: string;

	/**
	 * A field in data that holds color used for fills nodes.
	 *
	 * @default "fill"
	 */
	fillField?: string;

	/**
	 * A [[ColorSet]] that series will use to apply to its nodes.
	 */
	colors?: ColorSet;
	animationDuration?: number;
	animationEasing?: (t: Time) => Time;
}

export interface IFlowNodesPrivate extends ISeriesPrivate {
}

export interface IFlowNodesEvents extends ISeriesEvents {
}


/**
 * Holds instances of nodes for a [[Flow]] series.
 */
export abstract class FlowNodes extends Series {
	public static className: string = "FlowNodes";
	public static classNames: Array<string> = Series.classNames.concat([FlowNodes.className]);

	declare public _settings: IFlowNodesSettings;
	declare public _privateSettings: IFlowNodesPrivate;
	declare public _dataItemSettings: IFlowNodesDataItem;
	declare public _events: IFlowNodesEvents;

	/**
	 * List of label elements.
	 *
	 * @default new ListTemplate<Label>
	 */
	public readonly labels: ListTemplate<Label> = new ListTemplate(
		Template.new({}),
		() => Label.new(this._root, {}, this.labels.template)
	);

	/**
	 * List of node elements.
	 *
	 * @default new ListTemplate<FlowNode>
	 */
	public readonly nodes: ListTemplate<FlowNode> = new ListTemplate(
		Template.new({}),
		() => FlowNode.new(this._root, { themeTags: ["node"] }, this.nodes.template)
	);

	/**
	 * Related [[Flow]] series.
	 */
	public abstract flow: Flow | undefined;

	protected _afterNew() {
		this.fields.push("unknown", "name", "fill");

		this.set("idField", "id");
		this.set("nameField", "id");
		this.set("fillField", "fill");
		this.set("unknownField", "unknown");

		this.children.push(this.bulletsContainer);

		super._afterNew();
	}

	protected _onDataClear() {
		const colors = this.get("colors");
		if (colors) {
			colors.reset();
		}
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);
		dataItem.setRaw("d3SankeyNode", { name: dataItem.get("id"), dataItem: dataItem });

		if (dataItem.get("fill") == null) {
			let colors = this.get("colors");
			if (colors) {
				dataItem.setRaw("fill", colors.next());
			}
		}

		dataItem.setRaw("node", this.makeNode(dataItem));
	}

	/**
	 * @ignore
	 */
	public makeNode(dataItem: DataItem<this["_dataItemSettings"]>, themeTag?: string): FlowNode {

		const node = this.nodes.make();
		this.nodes.push(node);

		if (themeTag) {
			node.addTag(themeTag);
		}

		if (dataItem.get("unknown")) {
			node.addTag("unknown");
		}

		this.children.push(node);
		node._setDataItem(dataItem);
		node.series = this;

		dataItem.set("node", node);
		return node;
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		let node = dataItem.get("node");
		if (node) {
			node.dispose();
			this.nodes.removeValue(node);
		}
		let label = dataItem.get("label");
		if (label) {
			label.dispose();
			this.labels.removeValue(label);
		}
	}

	/**
	 * @ignore
	 */
	public addincomingLink(dataItem: DataItem<this["_dataItemSettings"]>, link: DataItem<IFlowDataItem>) {
		let incoming = dataItem.get("incomingLinks");
		if (!incoming) {
			incoming = [];
			dataItem.set("incomingLinks", incoming)
		}
		incoming.push(link);
	}

	/**
	 * @ignore
	 */
	public addOutgoingLink(dataItem: DataItem<this["_dataItemSettings"]>, link: DataItem<IFlowDataItem>) {
		let outgoing = dataItem.get("outgoingLinks");
		if (!outgoing) {
			outgoing = [];
			dataItem.set("outgoingLinks", outgoing)
		}
		outgoing.push(link);
	}

	/**
	 * Shows node's data item.
	 * 
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.showDataItem(dataItem, duration)];
		const flow = this.flow;
		if (flow) {

			let label = dataItem.get("label");

			if (label) {
				label.show(duration);
			}

			let links = dataItem.get("outgoingLinks");
			if (links) {
				$array.each(links, (link) => {
					flow.showDataItem(link, duration);
				})
			}

			links = dataItem.get("incomingLinks");
			if (links) {
				$array.each(links, (link) => {
					flow.showDataItem(link, duration);
				})
			}
		}

		await promises;
	}

	/**
	 * Hides series's data item.
	 * 
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.hideDataItem(dataItem, duration)];

		const flow = this.flow;
		if (flow) {

			let label = dataItem.get("label");

			if (label) {
				label.hide(duration);
			}

			let links = dataItem.get("outgoingLinks");

			if (links) {
				$array.each(links, (link) => {
					flow.hideDataItem(link, duration);
				})
			}

			links = dataItem.get("incomingLinks");

			if (links) {

				$array.each(links, (link) => {
					flow.hideDataItem(link, duration);
				})
			}
		}
		await promises;
	}
}
