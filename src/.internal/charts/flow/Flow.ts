import type { DataItem } from "../../core/render/Component";
import type { Color } from "../../core/util/Color";
import type { FlowLink } from "./FlowLink";
import type { FlowNodes, IFlowNodesDataItem } from "./FlowNodes";
import type { ListTemplate } from "../../core/util/List";
import type { Bullet } from "../../core/render/Bullet";
import type * as d3sankey from "d3-sankey";

import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "../../core/render/Series";
import { Container } from "../../core/render/Container";
import { LinearGradient } from "../../core/render/gradients/LinearGradient";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";

export interface IFlowDataItem extends ISeriesDataItem {

	/**
	 * Link value.
	 */
	value: number;

	/**
	 * @ignore
	 */
	valueWorking: number;

	/**
	 * Associated link element.
	 */
	link: FlowLink;

	/**
	 * Link's color.
	 */
	fill: Color;

	/**
	 * @ignore
	 */
	d3SankeyLink: d3sankey.SankeyLink<d3sankey.SankeyExtraProperties, d3sankey.SankeyExtraProperties>;

	/**
	 * An ID of the target node.
	 */
	targetId: string;

	/**
	 * An ID of the source node.
	 */
	sourceId: string;

	/**
	 * A data item of the source node.
	 */
	source: DataItem<IFlowNodesDataItem>;

	/**
	 * A data item of the target node.
	 */
	target: DataItem<IFlowNodesDataItem>;

}

export interface IFlowSettings extends ISeriesSettings {

	/**
	 * A field in data which holds source node ID.
	 */
	sourceIdField?: string;

	/**
	 * A field in data which holds target node ID.
	 */
	targetIdField?: string;

	/**
	 * The thickness of node strip in pixels.
	 *
	 * @default 10
	 */
	nodeWidth?: number;

	/**
	 * Minimum gap between adjacent nodes.
	 *
	 * @default 10
	 */
	nodePadding?: number;

}

export interface IFlowPrivate extends ISeriesPrivate {
	valueSum?: number;
	valueLow?: number;
	valueHigh?: number;
}

export interface IFlowEvents extends ISeriesEvents {
}

/**
 * A base class for all flow type series: [[Sankey]] and [[Chord]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/flow-charts/} for more info
 */
export abstract class Flow extends Series {
	public static className: string = "Flow";
	public static classNames: Array<string> = Series.classNames.concat([Flow.className]);

	declare public _settings: IFlowSettings;
	declare public _privateSettings: IFlowPrivate;
	declare public _dataItemSettings: IFlowDataItem;
	declare public _events: IFlowEvents;

	/**
	 * @ignore
	 */
	declare public readonly nodes: FlowNodes;

	/**
	 * Container series will place their links in.
	 *
	 * @default Container.new()
	 */
	public readonly linksContainer = this.children.push(Container.new(this._root, {}));

	/**
	 * @ignore
	 */
	public abstract readonly links: ListTemplate<FlowLink>;

	protected _nodesData: d3sankey.SankeyNodeMinimal<{}, {}>[] = [];
	protected _linksData: { source: d3sankey.SankeyNodeMinimal<{}, {}>, target: d3sankey.SankeyNodeMinimal<{}, {}>, value: number }[] = [];
	protected _index = 0;

	protected _linksByIndex: { [index: string]: any } = {};
	protected _afterNew() {
		this.fields.push("disabled", "sourceId", "targetId");

		if (this.nodes) {
			this.nodes.flow = this;
		}

		super._afterNew();

		this.children.push(this.bulletsContainer);
	}

	/**
	 * @ignore
	 */
	public abstract makeLink(dataItem: DataItem<this["_dataItemSettings"]>): FlowLink;

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		const nodes = this.nodes;
		if (nodes) {
			let unknown = false;
			let sourceId = dataItem.get("sourceId");
			let sourceDataItem = nodes.getDataItemById(sourceId);

			if (!sourceDataItem) {
				if (sourceId == null) {
					sourceId = "undefined" + this._index;
					this._index++;
					unknown = true;
				}
				nodes.data.push({ id: sourceId, unknown: unknown });
				sourceDataItem = nodes.getDataItemById(sourceId)!;
				if (!unknown) {
					sourceDataItem.set("name", sourceId);
				}
			}

			unknown = false;
			let targetId = dataItem.get("targetId");

			let targetDataItem = nodes.getDataItemById(targetId);
			if (!targetDataItem) {
				if (targetId == null) {
					targetId = "undefined" + this._index;
					this._index++;
					unknown = true;
				}

				nodes.data.push({ id: targetId, unknown: unknown });
				targetDataItem = nodes.getDataItemById(targetId)!;
				if (!unknown) {
					targetDataItem.set("name", targetId);
				}
			}

			if (sourceDataItem) {
				dataItem.set("source", sourceDataItem);
				nodes.addOutgoingLink(sourceDataItem, dataItem);
			}

			if (targetDataItem) {
				dataItem.set("target", targetDataItem);
				nodes.addincomingLink(targetDataItem, dataItem);
			}

			dataItem.set("link", this.makeLink(dataItem));

			const sourceIndex = this.nodes.dataItems.indexOf(sourceDataItem);
			const targetIndex = this.nodes.dataItems.indexOf(targetDataItem);

			this._linksByIndex[sourceIndex + "_" + targetIndex] = dataItem;

			if (sourceDataItem.get("unknown")) {
				if (targetDataItem) {
					sourceDataItem.set("fill", targetDataItem.get("fill"));
				}

				dataItem.get("link").set("fillStyle", "gradient");
			}


			if (targetDataItem.get("unknown")) {
				if (sourceDataItem) {
					targetDataItem.set("fill", sourceDataItem.get("fill"));
				}

				dataItem.get("link").set("fillStyle", "gradient");
			}

			this._updateLinkColor(dataItem);
		}
	}

	public _prepareChildren() {
		super._prepareChildren();

		let valueLow = Infinity;
		let valueHigh = -Infinity;
		let valueSum = 0;

		if (this._valuesDirty) {
			this._nodesData = [];
			const nodes = this.nodes;
			if (nodes) {
				$array.each(nodes.dataItems, (dataItem) => {
					this._nodesData.push(dataItem.get("d3SankeyNode"));

					const incoming = dataItem.get("incomingLinks")

					let sumIncoming = 0;
					let sumIncomingWorking = 0;
					if (incoming) {
						$array.each(incoming, (link) => {
							const value = link.get("value");
							const workingValue = link.get("valueWorking");
							sumIncoming += value;
							sumIncomingWorking += workingValue;
						})
					}

					dataItem.set("sumIncoming", sumIncoming);
					dataItem.set("sumIncomingWorking", sumIncomingWorking);

					const outgoing = dataItem.get("outgoingLinks")
					let sumOutgoing = 0;
					let sumOutgoingWorking = 0;
					if (outgoing) {
						$array.each(outgoing, (link) => {
							const value = link.get("value");
							const workingValue = link.get("valueWorking");
							sumOutgoing += value;
							sumOutgoingWorking += workingValue;
						})
					}

					dataItem.set("sumOutgoing", sumOutgoing);
					dataItem.set("sumOutgoingWorking", sumOutgoingWorking);

					dataItem.set("sum", sumIncoming + sumOutgoing);
					dataItem.set("sumWorking", sumIncomingWorking + sumOutgoingWorking);

					nodes.updateLegendValue(dataItem);
				})
			}
			this._linksData = [];
			$array.each(this.dataItems, (dataItem) => {
				let value = dataItem.get("value");
				if ($type.isNumber(value)) {
					let valueWorking = dataItem.get("valueWorking");
					let d3SankeyLink = { source: dataItem.get("source").get("d3SankeyNode"), target: dataItem.get("target").get("d3SankeyNode"), value: valueWorking };
					dataItem.setRaw("d3SankeyLink", d3SankeyLink);
					this._linksData.push(d3SankeyLink);

					if (value < valueLow) {
						valueLow = value;
					}

					if (value > valueHigh) {
						valueHigh = value;
					}

					valueSum += value;

					this.updateLegendValue(dataItem);
				}
			})

			this.setPrivateRaw("valueHigh", valueHigh);
			this.setPrivateRaw("valueLow", valueLow);
			this.setPrivateRaw("valueSum", valueSum);
		}
	}

	public _updateLinkColor(dataItem: DataItem<this["_dataItemSettings"]>) {
		const link = dataItem.get("link");

		const fillStyle = link.get("fillStyle");
		const strokeStyle = link.get("strokeStyle");
		const source = dataItem.get("source");
		const target = dataItem.get("target");
		const sourceFill = source.get("fill");
		const targetFill = target.get("fill");
		link.set("fillGradient", undefined);
		link.set("strokeGradient", undefined);

		switch (fillStyle) {

			case "solid":
				link._applyTemplates();
				break;
			case "source":
				link.set("fill", sourceFill);
				break;

			case "target":
				link.set("fill", targetFill);
				break;

			case "gradient":
				let gradient = link._fillGradient;
				if (!gradient) {
					gradient = LinearGradient.new(this._root, {});
					const sourceStop: any = { color: sourceFill }
					if (source.get("unknown")) {
						sourceStop.opacity = 0;
					}
					const targetStop: any = { color: targetFill };
					if (target.get("unknown")) {
						targetStop.opacity = 0;
					}

					gradient.set("stops", [sourceStop, targetStop]);
					link._fillGradient = gradient;
				}
				link.set("fillGradient", gradient);
				break;
			case "none":
				link.set("fill", undefined);
				break;
		}

		switch (strokeStyle) {
			case "solid":
				link._applyTemplates();
				break;

			case "source":
				link.set("stroke", sourceFill);
				break;

			case "target":
				link.set("stroke", targetFill);

			case "gradient":
				let gradient = link._strokeGradient;
				if (!gradient) {
					gradient = LinearGradient.new(this._root, {});
					const sourceStop: any = { color: sourceFill }
					if (source.get("unknown")) {
						sourceStop.opacity = 0;
					}
					const targetStop: any = { color: targetFill };
					if (target.get("unknown")) {
						targetStop.opacity = 0;
					}

					gradient.set("stops", [sourceStop, targetStop]);
					link._strokeGradient = gradient;
				}
				link.set("strokeGradient", gradient);
				break;

			case "none":
				link.set("stroke", undefined);
				break;
		}
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		let link = dataItem.get("link");
		if (link) {
			this.links.removeValue(link);
			link.dispose();
		}
	}

	/**
	 * Shows diagram's data item.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.hideDataItem(dataItem, duration)];
		const hiddenState = this.states.create("hidden", {})

		const stateAnimationDuration = "stateAnimationDuration";
		const stateAnimationEasing = "stateAnimationEasing";

		if (!$type.isNumber(duration)) {
			duration = hiddenState.get(stateAnimationDuration, this.get(stateAnimationDuration, 0));
		}

		const easing = hiddenState.get(stateAnimationEasing, this.get(stateAnimationEasing));

		promises.push(dataItem.animate({ key: "valueWorking" as any, to: 0, duration: duration, easing: easing }).waitForStop());

		const linkGraphics = dataItem.get("link");
		linkGraphics.hide();

		await Promise.all(promises);
	}

	/**
	 * Shows diagram's data item.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.showDataItem(dataItem, duration)];

		if (!$type.isNumber(duration)) {
			duration = this.get("stateAnimationDuration", 0);
		}

		const easing = this.get("stateAnimationEasing");

		promises.push(dataItem.animate({ key: "valueWorking" as any, to: dataItem.get("value"), duration: duration, easing: easing }).waitForStop());

		const linkGraphics = dataItem.get("link");
		linkGraphics.show();

		await Promise.all(promises);
	}

	public _positionBullet(bullet: Bullet) {
		const sprite = bullet.get("sprite");

		if (sprite) {
			const dataItem = sprite.dataItem as DataItem<this["_dataItemSettings"]>;
			if (dataItem) {
				const link = dataItem.get("link");
				const sprite = bullet.get("sprite");

				if (sprite) {
					const point = link.getPoint(this._getBulletLocation(bullet));
					sprite.setAll({ x: point.x, y: point.y });

					if (bullet.get("autoRotate")) {
						sprite.set("rotation", point.angle + bullet.get("autoRotateAngle", 0));
					}
				}
			}
		}
	}

	protected _getBulletLocation(bullet: Bullet): number {
		return bullet.get("locationY", 0);
	}
}
