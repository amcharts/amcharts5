import type { DataItem } from "../../core/render/Component";

import { Flow, IFlowSettings, IFlowDataItem, IFlowPrivate, IFlowEvents } from "./Flow";
import { SankeyNodes, ISankeyNodesDataItem } from "./SankeyNodes";
import { SankeyLink } from "./SankeyLink";
import { area, line } from "d3-shape";
import { curveMonotoneXTension } from "../../core/render/MonotoneXTension";
import { curveMonotoneYTension } from "../../core/render/MonotoneYTension";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $utils from "../../core/util/Utils";
import * as d3sankey from "d3-sankey";

import type { Bullet } from "../../core/render/Bullet";

export interface ISankeyDataItem extends IFlowDataItem {

	/**
	 * Link element.
	 */
	link: SankeyLink;

	/**
	 * Source node data item.
	 */
	source: DataItem<ISankeyNodesDataItem>;

	/**
	 * Target node data item.
	 */
	target: DataItem<ISankeyNodesDataItem>;

}

export interface ISankeySettings extends IFlowSettings {

	/**
	 * Orientation of the series.
	 *
	 * @default "horizontal"
	 */
	orientation?: "horizontal" | "vertical";

	/**
	 * Alignment of nodes.
	 *
	 * @default "left"
	 */
	nodeAlign?: "left" | "right" | "justify" | "center"

	/**
	 * Tension setting of the link curve.
	 *
	 * Accepts values from `0` to `1`.
	 *
	 * `1` will result in perfectly straight lines.
	 *
	 * @default 0.5
	 */
	linkTension?: number;

	/**
	 * A custom function to use when sorting nodes.
	 *
	 * @todo test
	 * @ignore
	 */
	nodeSort?: (a: d3sankey.SankeyNodeMinimal<{}, {}>, b: d3sankey.SankeyNodeMinimal<{}, {}>) => number | null;

	/**
	 * A custom function to use when sorting links.
	 *
	 * Use `null` to sort links exactly the way they are presented in data.
	 *
	 * @since 5.4.4
	 */
	linkSort?: null | ((a: d3sankey.SankeyLinkMinimal<{}, {}>, b: d3sankey.SankeyLinkMinimal<{}, {}>) => number | null);

}

export interface ISankeyPrivate extends IFlowPrivate {
}

export interface ISankeyEvents extends IFlowEvents {
}

/**
 * Sankey series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/flow-charts/} for more information
 * @important
 */
export class Sankey extends Flow {

	public static className: string = "Sankey";
	public static classNames: Array<string> = Flow.classNames.concat([Sankey.className]);

	/**
	 * List of link elements.
	 *
	 * @default new ListTemplate<SankeyLink>
	 */
	public readonly links: ListTemplate<SankeyLink> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => SankeyLink._new(this._root, { themeTags: ["link", "shape"] }, [this.links.template])
	));

	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["sankey", this._settings.orientation || "horizontal"]);

		this._fillGenerator.y0(function(p: number[]) {
			return p[3];
		});

		this._fillGenerator.x0(function(p: number[]) {
			return p[2];
		});

		this._fillGenerator.y1(function(p: number[]) {
			return p[1];
		});

		this._fillGenerator.x1(function(p: number[]) {
			return p[0];
		});

		super._afterNew();
	}

	/**
	 * A series representing sankey nodes.
	 *
	 * @default SankeyNodes.new()
	 */
	public readonly nodes: SankeyNodes = this.children.push(SankeyNodes.new(this._root, {}));

	declare public _settings: ISankeySettings;
	declare public _privateSettings: ISankeyPrivate;
	declare public _dataItemSettings: ISankeyDataItem;
	declare public _events: ISankeyEvents;

	public _d3Sankey = d3sankey.sankey();
	public _d3Graph: d3sankey.SankeyGraph<{}, {}> | undefined;

	public _fillGenerator = area();
	public _strokeGenerator = line();

	/**
	 * @ignore
	 */
	public makeLink(dataItem: DataItem<this["_dataItemSettings"]>): SankeyLink {
		const source = dataItem.get("source");
		const target = dataItem.get("target");

		const link = this.links.make();

		if (source.get("unknown")) {
			link.addTag("source");
			link.addTag("unknown");
		}

		if (target.get("unknown")) {
			link.addTag("target");
			link.addTag("unknown");
		}

		this.linksContainer.children.push(link);
		link._setDataItem(dataItem);
		link.set("source", source);
		link.set("target", target);
		link.series = this;

		this.links.push(link);

		return link;
	}

	/**
	 * @ignore
	 */
	public updateSankey() {
		const d3Graph = this._d3Graph;
		if (d3Graph) {
			this._d3Sankey.update(d3Graph);

			$array.each(this.dataItems, (dataItem) => {
				const link = dataItem.get("link");
				link.setPrivate("orientation", this.get("orientation"));
				link.markDirty();
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

	protected _getBulletLocation(bullet: Bullet): number {
		if (this.get("orientation") == "vertical") {
			return bullet.get("locationY", 0);
		}
		else {
			return bullet.get("locationX", 0);
		}
	}

	public _prepareChildren() {
		super._prepareChildren();
		let vertical = false;
		if (this.get("orientation") == "vertical") {
			vertical = true;
		}

		if (this.isDirty("orientation") || this.isDirty("linkTension")) {
			const linkTension = this.get("linkTension", 0.5);
			if (vertical) {
				this._fillGenerator.curve(curveMonotoneYTension(linkTension));
				this._strokeGenerator.curve(curveMonotoneYTension(linkTension));
			}
			else {
				this._fillGenerator.curve(curveMonotoneXTension(linkTension));
				this._strokeGenerator.curve(curveMonotoneXTension(linkTension));
			}
		}

		if (this._valuesDirty || this._sizeDirty || this.isDirty("nodePadding") || this.isDirty("nodeWidth") || this.isDirty("nodeAlign") || this.isDirty("nodeSort") || this.isDirty("orientation") || this.isDirty("linkTension") || this.isDirty("linkSort")) {
			if (this._nodesData.length > 0) {
				const d3Sankey = this._d3Sankey;
				let w = this.innerWidth();
				let h = this.innerHeight();

				if (vertical) {
					[w, h] = [h, w];
				}

				d3Sankey.size([w, h]);
				d3Sankey.nodePadding(this.get("nodePadding", 10));
				d3Sankey.nodeWidth(this.get("nodeWidth", 10));
				d3Sankey.nodeSort(this.get("nodeSort", null) as any);
				(d3Sankey as any).linkSort(this.get("linkSort") as any);

				switch (this.get("nodeAlign")) {
					case "right":
						d3Sankey.nodeAlign(d3sankey.sankeyRight);
						break;
					case "justify":
						d3Sankey.nodeAlign(d3sankey.sankeyJustify);
						break;
					case "center":
						d3Sankey.nodeAlign(d3sankey.sankeyCenter);
						break;
					default:
						d3Sankey.nodeAlign(d3sankey.sankeyLeft);
						break;
				}

				this._d3Graph = d3Sankey({ nodes: this._nodesData, links: this._linksData });

				$array.each(this.dataItems, (dataItem) => {
					const link = dataItem.get("link");
					link.setPrivate("orientation", this.get("orientation"));
					link.markDirty();
				})

				const d3Graph = this._d3Graph;

				if (d3Graph) {
					const nodes = d3Graph.nodes;

					$array.each(nodes, (d3SankeyNode) => {
						const dataItem = (d3SankeyNode as any).dataItem as DataItem<ISankeyNodesDataItem>;
						const node = dataItem.get("node");

						let x0: number | undefined;
						let x1: number | undefined;
						let y0: number | undefined;
						let y1: number | undefined;

						if (vertical) {
							x0 = d3SankeyNode.y0;
							x1 = d3SankeyNode.y1;
							y0 = d3SankeyNode.x0;
							y1 = d3SankeyNode.x1;
						}
						else {
							x0 = d3SankeyNode.x0;
							x1 = d3SankeyNode.x1;
							y0 = d3SankeyNode.y0;
							y1 = d3SankeyNode.y1;
						}

						if ($type.isNumber(x0) && $type.isNumber(x1) && $type.isNumber(y0) && $type.isNumber(y1)) {
							node.setAll({ x: x0, y: y0, width: x1 - x0, height: y1 - y0 });

							const rectangle = dataItem.get("rectangle");
							rectangle.setAll({ width: x1 - x0, height: y1 - y0 });
						}
					})
				}
			}
		}
	}
}
