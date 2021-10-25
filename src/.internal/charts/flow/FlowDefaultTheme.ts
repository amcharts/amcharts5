import type { DataItem } from "../../core/render/Component";
import type { IFlowNodesDataItem } from "../../charts/flow/FlowNodes";

import { Theme } from "../../core/Theme";
import { percent, p100, p50 } from "../../core/util/Percent";
import { ColorSet } from "../../core/util/ColorSet";
import { setColor } from "../../themes/DefaultTheme";

import * as $array from "../../core/util/Array";


/**
 * @ignore
 */
export class FlowDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const ic = this._root.interfaceColors;

		/**
		 * ========================================================================
		 * charts/flow
		 * ========================================================================
		 */

		this.rule("Flow").setAll({
			width: p100,
			height: p100,
			paddingLeft: 10,
			paddingRight: 10,
			paddingTop: 10,
			paddingBottom: 10
		});

		this.rule("FlowNodes").setAll({
			colors: ColorSet.new(this._root, {}),
			legendLabelText: "{name}",
			legendValueText: "{sumOutgoing.formatNumber('#.#')}"
		});

		this.rule("FlowNode").setAll({

		});

		this.rule("FlowNode", ["unknown"]).setAll({
			draggable: false,
			opacity: 0
		});

		this.rule("RadialLabel", ["flow", "node"]).setAll({
			text: "{name}",
			populateText: true
		});

		this.rule("FlowLink").setAll({
			fillStyle: "gradient",
			strokeStyle: "gradient"
		});

		this.rule("FlowLink", ["source", "unknown"]).setAll({
		});

		this.rule("FlowLink", ["target", "unknown"]).setAll({
		});


		this.rule("FlowNode").events.on("pointerover", (e) => {
			const dataItem = e.target.dataItem as DataItem<IFlowNodesDataItem>;
			if (dataItem) {
				const outgoing = dataItem.get("outgoingLinks")
				if (outgoing) {
					$array.each(outgoing, (linkDataItem) => {
						const link = (linkDataItem as any).get("link");
						link.hover();
						link.hideTooltip();
					})
				}
				const incoming = dataItem.get("incomingLinks")
				if (incoming) {
					$array.each(incoming, (linkDataItem) => {
						const link = (linkDataItem as any).get("link");
						link.hover();
						link.hideTooltip();
					})
				}
			}

			let rectangle = (<any>dataItem).get("slice") || (<any>dataItem).get("rectangle");
			if (rectangle && rectangle.get("tooltipText")) {
				rectangle.showTooltip();
			}
		});

		this.rule("FlowNode").events.on("pointerout", (e) => {
			const dataItem = e.target.dataItem as DataItem<IFlowNodesDataItem>;
			if (dataItem) {
				const outgoing = dataItem.get("outgoingLinks")
				if (outgoing) {
					$array.each(outgoing, (linkDataItem) => {
						(linkDataItem as any).get("link").unhover();
					})
				}
				const incoming = dataItem.get("incomingLinks")
				if (incoming) {
					$array.each(incoming, (linkDataItem) => {
						(linkDataItem as any).get("link").unhover();
					})
				}
			}
		});


		/**
		 * ------------------------------------------------------------------------
		 * charts/flow: Sankey
		 * ------------------------------------------------------------------------
		 */

		this.rule("Sankey").setAll({
			orientation: "horizontal",
			nodeAlign: "justify",
			linkTension: 0.5,
			nodePadding: 10,
			nodeWidth: 10
		});

		// Class: RoundedRectangle
		this.rule("RoundedRectangle", ["sankey", "node", "shape"]).setAll({
			cornerRadiusTL: 0,
			cornerRadiusBL: 0,
			cornerRadiusTR: 0,
			cornerRadiusBR: 0
		});

		this.rule("SankeyLink").setAll({
			controlPointDistance: 0.2
		});

		this.rule("FlowNode", ["sankey"]).setAll({
			draggable: true
		});

		{
			const rule = this.rule("Graphics", ["sankey", "link"]);

			rule.setAll({
				fillOpacity: 0.2,
				strokeOpacity: 0,
				interactive: true,
				tooltipText: "{sourceId} - {targetId}: {value}"
			});

			setColor(rule, "fill", ic, "grid");
		}

		this.rule("Graphics", ["sankey", "link"]).states.create("hover", { fillOpacity: 0.5 });

		this.rule("Label", ["sankey", "node"]).setAll({
			text: "{name}",
			populateText: true
		});

		this.rule("Label", ["sankey", "horizontal"]).setAll({
			y: p50,
			centerY: p50,
			paddingLeft: 15
		});

		this.rule("Label", ["sankey", "vertical"]).setAll({
			x: p50,
			centerX: p50,
			paddingTop: 15
		});

		/**
		 * ------------------------------------------------------------------------
		 * charts/flow: Chord
		 * ------------------------------------------------------------------------
		 */

		this.rule("Chord").setAll({
			radius: percent(90),
			nodeWidth: 10,
			padAngle: 1,
			startAngle: 0,
			sort: "descending"
		});

		this.rule("ChordDirected").setAll({
			linkHeadRadius: 10
		});

		this.rule("ChordNodes").setAll({
			x: p50,
			y: p50
		});

		this.rule("FlowNode", ["chord"]).setAll({
			draggable: true
		});

		this.rule("ChordLink").setAll({
			sourceRadius: p100,
			targetRadius: p100,
			fillStyle: "solid",
			strokeStyle: "solid",
			tooltipText: "{sourceId} - {targetId}: {value}"
		});

		this.rule("Slice", ["chord", "node", "shape"]).setAll({
			cornerRadius: 0
		})

		this.rule("RadialLabel", ["chord", "node"]).setAll({
			radius: 5,
			textType: "circular"
		});

		this.rule("ChordLinkDirected").setAll({
			headRadius: 10
		});

		// Class: Graphics
		{
			const rule = this.rule("Graphics", ["chord", "link", "shape"]);

			rule.setAll({
				fillOpacity: 0.2,
				strokeOpacity: 0,
				interactive: true
			});

			setColor(rule, "fill", ic, "grid");
			setColor(rule, "stroke", ic, "grid");
		}

		this.rule("Graphics", ["chord", "link", "shape"]).states.create("hover", { fillOpacity: 0.5 });

		this.rule("ChordNonRibbon").setAll({
			linkType: "curve" // "line" | "curve"
		})

		this.rule("ChordLink", ["basic"]).setAll({
			fillStyle: "none",
			strokeStyle: "source"
		});

		this.rule("Graphics", ["chord", "link", "shape", "basic"]).setAll({
			strokeOpacity: 0.4
		});

		this.rule("Graphics", ["chord", "link", "shape", "basic"]).states.create("hover", { strokeWidth: 2, strokeOpacity: 1 });

	}
}
