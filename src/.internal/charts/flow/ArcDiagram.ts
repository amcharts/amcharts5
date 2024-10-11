import type { DataItem } from "../../core/render/Component";

import { Flow, IFlowSettings, IFlowDataItem, IFlowPrivate, IFlowEvents } from "./Flow";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { ArcDiagramNodes, IArcDiagramNodesDataItem } from "./ArcDiagramNodes";
import { ArcDiagramLink } from "./ArcDiagramLink";
import type { Easing } from "../../core/util/Ease";

import * as $utils from "../../core/util/Utils";
import * as $array from "../../core/util/Array";



export interface IArcDiagramDataItem extends IFlowDataItem {

	/**
	 * A link element.
	 */
	link: ArcDiagramLink;

	/**
	 * Source node data item.
	 */
	source: DataItem<IArcDiagramNodesDataItem>;

	/**
	 * Target node data item.
	 */
	target: DataItem<IArcDiagramNodesDataItem>;

}

export interface IArcDiagramSettings extends IFlowSettings {
	/**
	 * Orientation of the series. This setting can not be changed after the chart is initialized.
	 *
	 * @default "horizontal"
	 */
	orientation: "horizontal" | "vertical";

	/**
	 * Minimum radius of a nodes circle.
	 * Maximum radius is computed based on available space
	 * @default 5
	 */
	minRadius?: number;

	/**
	 * Defines Which value should be used when calculating circle radius. Use "none" if you want all circles to be the same.
	 * @martynas: gal cia reik naudot radiusField, biski no idea.
	 * @default "sum"
	 */
	radiusKey?: "sum" | "sumIncoming" | "sumOutgoing" | "none";

	/**
	 * Duration for all drill animations in milliseconds.
	 */
	animationDuration?: number;

	/**
	 * An easing function to use for drill animations.
	 */
	animationEasing?: Easing;
}

export interface IArcDiagramPrivate extends IFlowPrivate {
}

export interface IArcDiagramEvents extends IFlowEvents {
}

/**
 * Regular ArcDiagram series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/flow-charts/} for more information
 * @important
 */
export class ArcDiagram extends Flow {

	public static className: string = "ArcDiagram";
	public static classNames: Array<string> = Flow.classNames.concat([ArcDiagram.className]);

	/**
	 * List of link elements.
	 *
	 * @default new ListTemplate<ArcDiagramLink>
	 */
	public readonly links: ListTemplate<ArcDiagramLink> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => ArcDiagramLink._new(this._root, { themeTags: ["link", "shape"] }, [this.links.template])
	));

	/**
	 * A series for all ArcDiagram nodes.
	 *
	 * @default ArcDiagramNodes.new()
	 */
	public readonly nodes: ArcDiagramNodes = this.children.push(ArcDiagramNodes.new(this._root, {}));

	declare public _settings: IArcDiagramSettings;
	declare public _privateSettings: IArcDiagramPrivate;
	declare public _dataItemSettings: IArcDiagramDataItem;
	declare public _events: IArcDiagramEvents;

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["arcdiagram", this._settings.orientation || "horizontal"]);

		super._afterNew();
		this.nodes.children.push(this.bulletsContainer);
	}


	/**
	 * @ignore
	 */
	public makeLink(dataItem: DataItem<this["_dataItemSettings"]>): ArcDiagramLink {
		const link = this.nodes.children.moveValue(this.links.make(), 0);
		this.links.push(link);
		link._setDataItem(dataItem);
		link.set("source", dataItem.get("source"));
		link.set("target", dataItem.get("target"));
		link.series = this;
		return link;
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this._valuesDirty || this._sizeDirty || this.isDirty("orientation")) {
			let width = 1;
			const orientation = this.get("orientation");

			$array.each(this.dataItems, (dataItem) => {
				const link = dataItem.get("link");
				link.setPrivate("orientation", this.get("orientation"));
			})

			if (orientation == "vertical") {
				width = this.innerHeight();
			}
			else {
				width = this.innerWidth();
			}

			let sum = 0;
			let low = Infinity;
			let radiusKey = this.get("radiusKey");

			if (radiusKey != "none") {
				$array.each(this.nodes.dataItems, (dataItem) => {
					let value = dataItem.get(radiusKey + "Working" as any);
					sum += value;
					low = Math.min(low, value);
				})
			}

			const count = this.nodes.dataItems.length;
			const nodePadding = this.get("nodePadding", 10);
			const minRadius = this.get("minRadius", 5);

			width = width - count * (nodePadding + minRadius * 2);

			if (width <= 0) {
				width = 0;
			}

			let sumNoLow = sum - count * low;
			let c = width / sumNoLow;

			let prevCoord = 0;
			const animationDuration = this.get("animationDuration", 0);
			const animationEasing = this.get("animationEasing");

			$array.each(this.nodes.dataItems, (dataItem) => {
				let value = dataItem.get(radiusKey + "Working" as any);

				const node = dataItem.get("node");
				let radius = minRadius + c * (value - low) / 2;

				if (radiusKey == "none") {
					radius = minRadius + width / count / 2;
				}

				if (orientation == "vertical") {
					node.set("x", 0);

					const y = prevCoord + nodePadding + radius;
					if (node.y() == 0) {
						node.set("y", y);
					}
					else {
						node.animate({ key: "y", to: y, duration: animationDuration, easing: animationEasing });
					}
				}
				else {
					node.set("y", 0);
					const x = prevCoord + nodePadding + radius;
					if (node.x() == 0) {
						node.set("x", x);
					}
					else {
						node.animate({ key: "x", to: x, duration: animationDuration, easing: animationEasing });
					}
				}

				prevCoord = prevCoord + nodePadding + radius * 2;
				dataItem.get("circle").set("radius", radius);
			})
		}
	}

	public _updateLinkColor(dataItem: DataItem<this["_dataItemSettings"]>) {
		super._updateLinkColor(dataItem);
		const orientation = this.get("orientation");
		const fillGradient = dataItem.get("link")._fillGradient;
		const strokeGradient = dataItem.get("link")._strokeGradient;

		if (orientation == "vertical") {
			if (fillGradient) {
				fillGradient.set("rotation", 90);
			}
			if (strokeGradient) {
				strokeGradient.set("rotation", 90);
			}
		}
		else {
			if (fillGradient) {
				fillGradient.set("rotation", 0);
			}
			if (strokeGradient) {
				strokeGradient.set("rotation", 0);
			}
		}
	}
}
