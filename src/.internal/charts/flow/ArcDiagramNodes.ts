import type { DataItem } from "../../core/render/Component";
import type { FlowNode } from "./FlowNode";
import type { ArcDiagram } from "./ArcDiagram";
import type { Bullet } from "../../core/render/Bullet";

import { FlowNodes, IFlowNodesSettings, IFlowNodesDataItem, IFlowNodesPrivate, IFlowNodesEvents } from "./FlowNodes";
import { Circle } from "../../core/render/Circle";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { Label } from "../../core/render/Label";

export interface IArcDiagramNodesDataItem extends IFlowNodesDataItem {

	/**
	 * The node's [[Circle]] element.
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
 * Holds the nodes of an [[ArcDiagram]] series.
 */
export class ArcDiagramNodes extends FlowNodes {
	public static className: string = "ArcDiagramNodes";
	public static classNames: Array<string> = FlowNodes.classNames.concat([ArcDiagramNodes.className]);

	/**
	 * List of node labels; configure them all through `labels.template`.
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
	 * List of node circles; configure them all through `circles.template`.
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

	public _positionBullet(bullet: Bullet) {
		const sprite = bullet.get("sprite");

		if (sprite) {
			const dataItem = sprite.dataItem as DataItem<this["_dataItemSettings"]>;

			if (dataItem) {
				const circle = dataItem.get("circle");

				if (circle) {
					// locations are fractions of the circle's bounding box, so the
					// default 0.5/0.5 sits in the middle of the node
					const radius = circle.get("radius", 0);
					const locationX = bullet.get("locationX", 0.5);
					const locationY = bullet.get("locationY", 0.5);

					sprite.setAll({
						x: radius * (2 * locationX - 1),
						y: radius * (2 * locationY - 1)
					});
				}
			}
		}
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
