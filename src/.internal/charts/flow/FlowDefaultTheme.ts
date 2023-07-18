import type { DataItem } from "../../core/render/Component";
import type { IFlowNodesDataItem } from "../../charts/flow/FlowNodes";

import { Theme } from "../../core/Theme";
import { percent, p100, p50 } from "../../core/util/Percent";
import { ColorSet } from "../../core/util/ColorSet";
import { setColor } from "../../themes/DefaultTheme";

import * as $array from "../../core/util/Array";
import * as $ease from "../../core/util/Ease";


/**
 * @ignore
 */
export class FlowDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const ic = this._root.interfaceColors;
		const r = this.rule.bind(this);
		/**
		 * ========================================================================
		 * charts/flow
		 * ========================================================================
		 */

		r("Flow").setAll({
			width: p100,
			height: p100,
			paddingLeft: 10,
			paddingRight: 10,
			paddingTop: 10,
			paddingBottom: 10,
			hiddenSize: 0.05,
			minSize: 0,
			minHiddenValue: 0
		});

		r("FlowNodes").setAll({
			colors: ColorSet.new(this._root, {}),
			legendLabelText: "{name}",
			legendValueText: "{sumOutgoing.formatNumber('#.#')}"
		});


		r("FlowNode").setAll({
			setStateOnChildren: true,
			cursorOverStyle: "pointer",
			toggleKey: "disabled"
		})


		r("FlowNode").states.create("disabled", {}); // do not remove

		r("FlowNode", ["unknown"]).setAll({
			draggable: false,
			opacity: 0
		});

		r("Label", ["flow"]).states.create("disabled", {
			fill: ic.get("disabled")
		})

		r("RadialLabel", ["flow", "node"]).setAll({
			text: "{name}",
			populateText: true
		});

		r("FlowLink").setAll({
			fillStyle: "gradient",
			strokeStyle: "gradient"
		});

		r("FlowLink", ["source", "unknown"]).setAll({
		});

		r("FlowLink", ["target", "unknown"]).setAll({
		});


		r("FlowNode").events.on("pointerover", (e) => {
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

		r("FlowNode").events.on("pointerout", (e) => {
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

		r("Sankey").setAll({
			orientation: "horizontal",
			nodeAlign: "justify",
			linkTension: 0.5,
			nodePadding: 10,
			nodeWidth: 10
		});

		// Class: RoundedRectangle
		r("RoundedRectangle", ["sankey", "node", "shape"]).setAll({
			cornerRadiusTL: 0,
			cornerRadiusBL: 0,
			cornerRadiusTR: 0,
			cornerRadiusBR: 0
		});

		r("RoundedRectangle", ["shape"]).states.create("disabled", {
			fill: ic.get("disabled")
		})

		r("SankeyLink").setAll({
			controlPointDistance: 0.2
		});

		r("FlowNode", ["sankey"]).setAll({
			draggable: true
		});

		{
			const rule = r("Graphics", ["sankey", "link"]);

			rule.setAll({
				fillOpacity: 0.2,
				strokeOpacity: 0,
				interactive: true,
				tooltipText: "{sourceId} - {targetId}: {value}"
			});

			setColor(rule, "fill", ic, "grid");
		}

		r("Graphics", ["sankey", "link"]).states.create("hover", { fillOpacity: 0.5 });

		r("Label", ["sankey", "node"]).setAll({
			text: "{name}",
			populateText: true
		});

		r("Label", ["sankey", "horizontal"]).setAll({
			y: p50,
			centerY: p50,
			paddingLeft: 15
		});

		r("Label", ["sankey", "vertical"]).setAll({
			x: p50,
			centerX: p50,
			paddingTop: 15
		});


		/**
		 * ------------------------------------------------------------------------
		 * charts/flow: Chord
		 * ------------------------------------------------------------------------
		 */

		r("Chord").setAll({
			radius: percent(90),
			nodeWidth: 10,
			padAngle: 1,
			startAngle: 0,
			sort:"none"
		});

		r("ChordDirected").setAll({
			linkHeadRadius: 10
		});

		r("ChordNodes").setAll({
			x: p50,
			y: p50
		});

		r("FlowNode", ["chord"]).setAll({
			draggable: true
		});

		r("ChordLink").setAll({
			sourceRadius: p100,
			targetRadius: p100,
			fillStyle: "solid",
			strokeStyle: "solid",
			tooltipText: "{sourceId} - {targetId}: {value}"
		});

		r("Slice", ["chord", "node", "shape"]).setAll({
			cornerRadius: 0
		})

		r("Slice", ["shape"]).states.create("disabled", {
			fill: ic.get("disabled")
		})

		r("RadialLabel", ["chord", "node"]).setAll({
			radius: 5,
			textType: "circular"
		});

		r("ChordLinkDirected").setAll({
			headRadius: 10
		});

		// Class: Graphics
		{
			const rule = r("Graphics", ["chord", "link", "shape"]);

			rule.setAll({
				fillOpacity: 0.2,
				strokeOpacity: 0,
				interactive: true
			});

			setColor(rule, "fill", ic, "grid");
			setColor(rule, "stroke", ic, "grid");
		}

		r("Graphics", ["chord", "link", "shape"]).states.create("hover", { fillOpacity: 0.5 });

		r("ChordNonRibbon").setAll({
			linkType: "curve" // "line" | "curve"
		})

		r("ChordLink", ["basic"]).setAll({
			fillStyle: "none",
			strokeStyle: "source"
		});

		r("Graphics", ["chord", "link", "shape", "basic"]).setAll({
			strokeOpacity: 0.4
		});

		r("Graphics", ["chord", "link", "shape", "basic"]).states.create("hover", { strokeWidth: 2, strokeOpacity: 1 });


		/**
		 * ------------------------------------------------------------------------
		 * charts/flow: ArcDiagram
		 * ------------------------------------------------------------------------
		 */

		r("ArcDiagram").setAll({
			orientation: "horizontal",
			nodePadding: 5,
			minRadius: 5,
			radiusKey: "sum",
			animationEasing: $ease.out($ease.cubic)
		});

		r("ArcDiagramNodes", ["horizontal"]).setAll({
			y: p100,
			centerY: p100
		});

		r("ArcDiagramNodes", ["vertical"]).setAll({
			centerX: 0
		});

		r("Circle", ["arcdiagram", "node", "shape"]).setAll({
			tooltipText: "{name}: {sum}"
		});

		r("Circle", ["arcdiagram", "node", "shape"]).states.create("disabled", {
			fill: ic.get("disabled")
		})

		{
			const rule = r("ArcDiagramLink", ["link", "shape"]);

			rule.setAll({
				strokeOpacity: 0.15,
				strokeStyle: "solid",
				fillStyle: "none",
				isMeasured: false
			});

			setColor(rule, "stroke", ic, "grid");
		}

		r("ArcDiagramLink", ["link", "shape"]).states.create("hover", {
			strokeOpacity: 1
		});

		r("Label", ["arcdiagram", "node"]).setAll({
			text: "{name}",
			populateText: true
		});

		r("Label", ["arcdiagram", "horizontal"]).setAll({
			y: 0,
			centerY: p50,
			centerX: p100,
			rotation: -90
		});

		r("Label", ["arcdiagram", "vertical"]).setAll({
			centerY: p50,
			centerX: p100,
			paddingRight: 15
		});
	}
}
