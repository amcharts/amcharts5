import type { DataItem } from "../../core/render/Component";
import type { FlowNode } from "./FlowNode";
import type { ArcDiagram } from "./ArcDiagram";

import { FlowNodes, IFlowNodesSettings, IFlowNodesDataItem, IFlowNodesPrivate, IFlowNodesEvents } from "./FlowNodes";
import { Circle } from "../../core/render/Circle";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { Label } from "../../core/render/Label";

export interface IArcDiagramNodesDataItem extends IFlowNodesDataItem {

	/**
	 * Node [[Circle]] element.
	 */
	circle: Circle;

	/**
	 * Node label element.
	 */
	label: Label;
}

export interface IArcDiagramNodesSettings extends IFlowNodesSettings { };

export interface IArcDiagramNodesPrivate extends IFlowNodesPrivate { };

export interface IArcDiagramNodesEvents extends IFlowNodesEvents { };

/**
 * Holds instances of nodes for a [[ArcDiagram]] series.
 */
export class ArcDiagramNodes extends FlowNodes {
	public static className: string = "ArcDiagramNodes";
	public static classNames: Array<string> = FlowNodes.classNames.concat([ArcDiagramNodes.className]);

	/**
	 * List of label elements.
	 *
	 * @default new ListTemplate<Label>
	 */
	public readonly labels: ListTemplate<Label> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Label._new(this._root, {}, [this.labels.template])
	));

	declare public _settings: IArcDiagramNodesSettings;
	declare public _privateSettings: IArcDiagramNodesPrivate;
	declare public _dataItemSettings: IArcDiagramNodesDataItem;
	declare public _events: IArcDiagramNodesEvents;

	/**
	 * Related [[ArcDiagram]] series.
	 */
	public flow: ArcDiagram | undefined;

	protected _dAngle: number = 0;

	/**
	 * List of slice elements.
	 *
	 * @default new ListTemplate<Slice>
	 */
	public readonly circles: ListTemplate<Circle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Circle._new(this._root, { themeTags: ["shape"] }, [this.circles.template])
	));

	/**
	 * @ignore
	 */
	public makeNode(dataItem: DataItem<this["_dataItemSettings"]>): FlowNode {
		const node = super.makeNode(dataItem, "ArcDiagram");

		const circle = node.children.insertIndex(0, this.circles.make());
		dataItem.set("circle", circle);
		circle._setSoft("fill", dataItem.get("fill"));
		circle._setSoft("fillPattern", dataItem.get("fillPattern"));

		const label = this.labels.make();
		this.labels.push(label);
		label.addTag("flow");
		label.addTag("arcdiagram");
		label.addTag("node");

		node.children.push(label);
		dataItem.set("label", label);

		label._setDataItem(dataItem);
		circle._setDataItem(dataItem);

		return node;
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		let circle = dataItem.get("circle");
		if (circle) {
			this.circles.removeValue(circle);
			circle.dispose();
		}
	}

	public _updateNodeColor(dataItem: DataItem<this["_dataItemSettings"]>) {
		const circle = dataItem.get("circle");
		if (circle) {
			circle.set("fill", dataItem.get("fill"));
			circle.set("fillPattern", dataItem.get("fillPattern"));
		}
	}
}
