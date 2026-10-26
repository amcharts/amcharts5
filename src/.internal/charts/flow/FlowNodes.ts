import type { DataItem } from "../../core/render/Component";
import type { Color } from "../../core/util/Color";
import type { Time } from "../../core/util/Animation";
import type { Flow, IFlowDataItem } from "./Flow";
import type { ColorSet } from "../../core/util/ColorSet";
import type { PatternSet } from "../../core/util/PatternSet";
import type { Pattern } from "../../core/render/patterns/Pattern";
import type { Container } from "../../core/render/Container";
import type { Bullet } from "../../core/render/Bullet";

import type * as d3sankey from "d3-sankey";

import { Label } from "../../core/render/Label";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "../../core/render/Series";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { FlowNode } from "./FlowNode";

import * as $array from "../../core/util/Array";

export interface IFlowNodesDataItem extends ISeriesDataItem {

	/**
	 * Node name.
	 */
	name: string;

	/**
	 * The node element.
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
	 * Node pattern.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
	 * @since 5.10.0
	 */
	fillPattern: Pattern;

	/**
	 * Marks a placeholder node, made for a link that has no source or target
	 * ID. It is not shown, and its links fade out toward it.
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
	 * Data items of the links that come into the node.
	 */
	incomingLinks: Array<DataItem<IFlowDataItem>>;

	/**
	 * Data items of the links that go out of the node.
	 */
	outgoingLinks: Array<DataItem<IFlowDataItem>>;

	/**
	 * Depth of the node.
	 */
	depth: number;

}

export interface IFlowNodesSettings extends ISeriesSettings {

	/**
	 * Field in data that marks a node as "unknown" (`true`): a hidden
	 * placeholder that its links fade out toward.
	 *
	 * @default "unknown"
	 */
	unknownField?: string;

	/**
	 * Field in data that holds the node's name.
	 *
	 * @default "id"
	 */
	nameField?: string;

	/**
	 * Field in data that, when `true`, makes the node start toggled off, with
	 * its links hidden.
	 *
	 * @since 5.4.2
	 */
	disabledField?: string;

	/**
	 * Field in data that holds the node's color.
	 *
	 * @default "fill"
	 */
	fillField?: string;

	/**
	 * [[ColorSet]] that gives each node its color, unless the data sets one.
	 */
	colors?: ColorSet;

	/**
	 * A [[PatternSet]] that series will use to apply to its nodes.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/#pattern-sets} for more info
	 * @since 5.10.0
	 */
	patterns?: PatternSet;

	/**
	 * Animation duration in ms.
	 */
	animationDuration?: number;

	/**
	 * Easing function to use for node animations.
	 */
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

	public _applyThemes(force: boolean = false): boolean {
		const colors = this.get("colors");
		if (colors) {
			colors.reset();
		}
		return super._applyThemes(force);		
	}	

	/**
	 * List of node labels; configure them all through `labels.template`.
	 */
	public readonly labels: ListTemplate<Label> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Label._new(this._root, { themeTags: ["flow"] }, [this.labels.template])
	));

	/**
	 * List of node elements; configure them all through `nodes.template`.
	 */
	public readonly nodes: ListTemplate<FlowNode> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => FlowNode._new(this._root, { themeTags: ["node"] }, [this.nodes.template])
	));

	/**
	 * Related [[Flow]] series.
	 */
	public abstract flow: Flow | undefined;

	public _userDataSet = false;

	protected _afterNew() {
		this.fields.push("unknown", "name", "fill");

		this._setC("idField", "id");
		this._setC("nameField", "id");
		this._setC("fillField", "fill");
		this._setC("unknownField", "unknown");

		this.children.push(this.bulletsContainer);

		super._afterNew();
	}

	protected _onDataClear() {
		const colors = this.get("colors");
		if (colors) {
			colors.reset();
		}

		const patterns = this.get("patterns");
		if (patterns) {
			patterns.reset();
		}

		this._userDataSet = true;
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

		if (dataItem.get("fillPattern") == null) {
			let patterns = this.get("patterns");
			if (patterns) {
				dataItem.setRaw("fillPattern", patterns.next());
			}
		}

		const node = this.makeNode(dataItem);
		dataItem.setRaw("node", node);

		const disabledField = this.get("disabledField");

		if (disabledField) {
			const dataContext = dataItem.dataContext as any;
			if (dataContext) {
				if (dataContext[disabledField]) {
					this.root.events.once("frameended", () => {
						this.disableDataItem(dataItem, 0);
					})
				}
			}
		}
	}

	/**
	 * Node bullets go into the node itself, so that they move with it and sit
	 * above its shape but below its label.
	 */
	protected _getBulletContainer(dataItem: DataItem<this["_dataItemSettings"]>): Container {
		return dataItem.get("node") || super._getBulletContainer(dataItem);
	}

	protected _makeBulletReal(dataItem: DataItem<this["_dataItemSettings"]>, bullet: Bullet) {
		super._makeBulletReal(dataItem, bullet);

		// bullets are added after the label, so put it back on top
		const label = dataItem.get("label");
		const node = dataItem.get("node");
		if (label && node && label.parent === node) {
			node.children.moveValue(label);
		}
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

		node.events.on("click", (e) => {
			const node = e.target;
			if (node.get("toggleKey") == "disabled") {
				const dataItem = node.dataItem as DataItem<IFlowNodesDataItem>;
				if (dataItem) {
					if (dataItem.isHidden()) {
						this.enableDataItem(dataItem);
					}
					else {
						this.disableDataItem(dataItem);
					}
				}
			}
		})

		dataItem.on("fill", () => {
			this._updateNodeColor(dataItem);
		})

		dataItem.on("fillPattern", () => {
			this._updateNodeColor(dataItem);
		})


		dataItem.set("node", node);
		return node;
	}

	public _updateNodeColor(_dataItem: DataItem<this["_dataItemSettings"]>) {

	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		let node = dataItem.get("node");
		if (node) {
			this.nodes.removeValue(node);
			node.dispose();
		}
		let label = dataItem.get("label");
		if (label) {
			this.labels.removeValue(label);
			label.dispose();
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
	 * Shows a hidden node, with its label and links.
	 *
	 * @param   dataItem  Node data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.showDataItem(dataItem, duration)];
		const flow = this.flow;

		if (flow) {

			const node = dataItem.get("node");
			if (node) {
				node.show();
			}

			let label = dataItem.get("label");

			if (label) {
				promises.push(label.show(duration));
			}

			let links = dataItem.get("outgoingLinks");
			if (links) {
				$array.each(links, (link) => {
					promises.push(flow.showDataItem(link, duration));
				})
			}

			links = dataItem.get("incomingLinks");
			if (links) {
				$array.each(links, (link) => {
					promises.push(flow.showDataItem(link, duration));
				})
			}
		}

		await Promise.all(promises);
	}

	/**
	 * Hides a node, with its label and links.
	 *
	 * @param   dataItem  Node data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.hideDataItem(dataItem, duration)];

		const flow = this.flow;

		if (flow) {

			const node = dataItem.get("node");
			if (node) {
				node.hide();
			}

			let label = dataItem.get("label");

			if (label) {
				promises.push(label.hide(duration));
			}

			let links = dataItem.get("outgoingLinks");

			if (links) {
				$array.each(links, (link) => {
					promises.push(flow.hideDataItem(link, duration));
				})
			}

			links = dataItem.get("incomingLinks");

			if (links) {
				$array.each(links, (link) => {
					promises.push(flow.hideDataItem(link, duration));
				})
			}
		}
		await Promise.all(promises);
	}

	/**
	 * Toggles a node back on, as a click does: clears its disabled state and
	 * shows its links.
	 *
	 * @param   dataItem  Node data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async enableDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.showDataItem(dataItem, duration)];
		const flow = this.flow;

		if (flow) {

			const node = dataItem.get("node");
			if (node) {
				this.root.events.once("frameended", () => {
					node.set("disabled", false);
				})

			}

			let label = dataItem.get("label");

			if (label) {
				label.set("disabled", false);
			}

			let links = dataItem.get("outgoingLinks");
			if (links) {
				$array.each(links, (link) => {
					promises.push(flow.showDataItem(link, duration));
				})
			}

			links = dataItem.get("incomingLinks");
			if (links) {
				$array.each(links, (link) => {
					promises.push(flow.showDataItem(link, duration));
				})
			}
		}

		await Promise.all(promises);
	}

	/**
	 * Toggles a node off, as a click does: the node and its label take the
	 * disabled state and its links hide. The node itself stays visible.
	 *
	 * @param   dataItem  Node data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async disableDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.hideDataItem(dataItem, duration)];

		const flow = this.flow;

		if (flow) {

			const node = dataItem.get("node");
			if (node) {
				this.root.events.once("frameended", () => {
					node.set("disabled", true);
				})
			}

			let label = dataItem.get("label");

			if (label) {
				label.set("disabled", true);
			}

			let links = dataItem.get("outgoingLinks");

			if (links) {
				$array.each(links, (link) => {
					promises.push(flow.hideDataItem(link, duration));
				})
			}

			links = dataItem.get("incomingLinks");

			if (links) {
				$array.each(links, (link) => {
					promises.push(flow.hideDataItem(link, duration));
				})
			}
		}
		await Promise.all(promises);
	}

}
