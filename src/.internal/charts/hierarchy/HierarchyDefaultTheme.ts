import { Theme } from "../../core/Theme";
import { percent, p100, p50 } from "../../core/util/Percent";
import { ColorSet } from "../../core/util/ColorSet";
import { setColor } from "../../themes/DefaultTheme";

import * as $ease from "../../core/util/Ease";


/**
 * @ignore
 */
export class HierarchyDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const ic = this._root.interfaceColors;
		const gridLayout = this._root.gridLayout;

		/**
		 * ========================================================================
		 * charts/hierarchy
		 * ========================================================================
		 */

		this.rule("Hierarchy").setAll({
			legendLabelText: "{category}",
			legendValueText: "{sum.formatNumber('#.#')}",
			width: p100,
			height: p100,
			colors: ColorSet.new(this._root, { step: 2 }),
			downDepth: 1,
			initialDepth: 5,
			singleBranchOnly: true,
			maskContent: true,
			animationEasing: $ease.out($ease.cubic)
		});

		this.rule("HierarchyNode").setAll({
			toggleKey: "disabled",
			setStateOnChildren: true,
			position: "absolute",
			isMeasured: false,
			cursorOverStyle: "pointer",
			tooltipText: "{category}: {sum}"
		});

		{
			const rule = this.rule("Label", ["hierarchy", "node"]);

			rule.setAll({
				centerX: p50,
				centerY: p50,
				position: "absolute",
				paddingBottom: 1,
				paddingTop: 1,
				paddingRight: 4,
				paddingLeft: 4,
				text: "{category}",
				populateText: true,
				oversizedBehavior: "fit",
				minScale: 0.3
			});

			setColor(rule, "fill", ic, "alternativeText");
		}

		{
			const rule = this.rule("HierarchyLink");

			rule.setAll({
				isMeasured: false,
				position: "absolute",
				strokeWidth: 1,
				strokeOpacity: 1,
				strength: 0.9,
				distance: 1.1
			});

			setColor(rule, "stroke", ic, "grid");
		}

		this.rule("Circle", ["linkedhierarchy", "shape"]).setAll({
			position: "absolute",
			fillOpacity: 1,
			strokeOpacity: 0,
			radius: 15,
			tooltipY: 0
		});

		this.rule("Circle", ["linkedhierarchy", "shape", "outer"]).setAll({
			position: "absolute",
			opacity: 1,
			fillOpacity: 0,
			strokeDasharray: 0,
			strokeOpacity: 1,
			radius: 15,
			scale: 1.1,
			interactive: false
		})

		this.rule("Circle", ["linkedhierarchy", "shape", "outer"]).states.create("disabled", { opacity: 1, scale: 1.1, strokeDasharray: 2 });
		this.rule("Circle", ["linkedhierarchy", "shape", "outer"]).states.create("hoverDisabled", { scale: 1.2, opacity: 1, strokeDasharray: 2 });
		this.rule("Circle", ["linkedhierarchy", "shape", "outer"]).states.create("hover", { scale: 1.05, strokeDasharray: 0 });
		this.rule("Circle", ["linkedhierarchy", "shape", "outer"]).states.create("hidden", { opacity: 0, strokeDasharray: 0 });


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: BreadcrumbBar
		 * ------------------------------------------------------------------------
		 */

		this.rule("BreadcrumbBar").setAll({
			paddingLeft: 8,
			layout: gridLayout
		});

		{
			const rule = this.rule("Label", ["breadcrumb"]);

			rule.setAll({
				paddingRight: 4,
				paddingLeft: 4,
				cursorOverStyle: "pointer",
				populateText: true,
				text: "{category}:",
			});

			setColor(rule, "fill", ic, "primaryButton");
		}

		{
			const rule = this.rule("Label", ["breadcrumb"]).states.create("hover", {});
			setColor(rule, "fill", ic, "primaryButtonHover");
		}

		{
			const rule = this.rule("Label", ["breadcrumb"]).states.create("down", { stateAnimationDuration: 0 });
			setColor(rule, "fill", ic, "primaryButtonDown");
		}

		{
			const rule = this.rule("Label", ["breadcrumb", "last"]);

			rule.setAll({
				populateText: true,
				text: "{category}",
				fontWeight: "bold",
				cursorOverStyle: "default"
			});

			setColor(rule, "fill", ic, "primaryButton");
		}

		{
			const rule = this.rule("RoundedRectangle", ["breadcrumb", "label", "background"]);

			rule.setAll({
				fillOpacity: 0,
			});

			setColor(rule, "fill", ic, "background");
		}


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: Partition
		 * ------------------------------------------------------------------------
		 */

		this.rule("Partition").setAll({
			downDepth: 1,
			upDepth: 0,
			initialDepth: 5
		});

		this.rule("HierarchyNode", ["partition"]).setAll({
			setStateOnChildren: false
		});

		this.rule("HierarchyNode", ["partition"]).states.create("hidden", {
			opacity: 1,
			visible: true
		});

		{
			const rule = this.rule("Label", ["partition", "node"]);

			rule.setAll({
				x: p50,
				y: p50,
				centerY: p50,
				centerX: p50,
				paddingBottom: 1,
				paddingTop: 1,
				paddingLeft: 1,
				paddingRight: 1,
				rotation: 90,
				populateText: true,
				text: "{category}",
				oversizedBehavior: "fit",
				minScale: 0.4
			});

			setColor(rule, "fill", ic, "alternativeText");
		}

		this.rule("Label", ["horizontal", "partition", "node"]).setAll({
			rotation: 0
		});

		{
			const rule = this.rule("RoundedRectangle", ["partition", "node", "shape"]);

			rule.setAll({
				strokeOpacity: 1,
				strokeWidth: 1,
				cornerRadiusBR: 0,
				cornerRadiusTR: 0,
				cornerRadiusBL: 0,
				cornerRadiusTL: 0
			});

			setColor(rule, "stroke", ic, "background");
		}

		this.rule("RoundedRectangle", ["partition", "node", "shape", "last"]).setAll({
			fillOpacity: 0.75
		});


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: Sunburst
		 * ------------------------------------------------------------------------
		 */

		this.rule("Sunburst").setAll({
			singleBranchOnly: true
		});

		this.rule("HierarchyNode", ["sunburst"]).setAll({
			setStateOnChildren: false
		});

		this.rule("HierarchyNode", ["sunburst"]).states.create("hidden", {
			opacity: 0,
			visible: false
		});

		{
			const rule = this.rule("Slice", ["sunburst", "node", "shape"]);

			rule.setAll({
				strokeOpacity: 1,
				strokeWidth: 1,
				cornerRadius: 0
			});

			setColor(rule, "stroke", ic, "background");
		}

		this.rule("Slice", ["sunburst", "node", "shape", "last"]).setAll({
			fillOpacity: 0.75
		});

		{
			const rule = this.rule("RadialLabel", ["sunburst", "node"]);

			rule.setAll({
				textType: "radial",
				paddingBottom: 1,
				paddingTop: 1,
				paddingLeft: 1,
				paddingRight: 1,
				centerX: p50,
				populateText: true,
				text: "{category}",
				oversizedBehavior: "fit",
				minScale: 0.4
			});

			setColor(rule, "fill", ic, "alternativeText");
		}


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: ForceDirected
		 * ------------------------------------------------------------------------
		 */

		this.rule("ForceDirected").setAll({
			minRadius: percent(1),
			maxRadius: percent(8),
			initialFrames: 500,
			centerStrength: 0.8,
			manyBodyStrength: -14,
			velocityDecay: 0.5,
			linkWithStrength: 0.5,
			showOnFrame: 10,
			singleBranchOnly: false,
			upDepth: Infinity,
			downDepth: 1,
			initialDepth: 5,
			topDepth: 0
		});


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: Tree
		 * ------------------------------------------------------------------------
		 */

		this.rule("Tree").setAll({
			orientation: "vertical",
			paddingLeft: 20,
			paddingRight: 20,
			paddingTop: 20,
			paddingBottom: 20,
			singleBranchOnly: false,
			upDepth: Infinity,
			downDepth: 1,
			initialDepth: 5,
			topDepth: 0
		});


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: Pack
		 * ------------------------------------------------------------------------
		 */

		this.rule("Pack").setAll({
			paddingLeft: 20,
			paddingTop: 20,
			paddingBottom: 20,
			paddingRight: 20
		});

		{
			const rule = this.rule("Label", ["pack", "node"]);

			rule.setAll({
				centerY: p50,
				centerX: p50,
				paddingBottom: 1,
				paddingTop: 1,
				paddingLeft: 1,
				paddingRight: 1,
				populateText: true,
				text: "{category}",
				oversizedBehavior: "fit",
				minScale: 0.4
			});

			setColor(rule, "fill", ic, "alternativeText");
		}

		{
			const rule = this.rule("Circle", ["pack", "node", "shape"]);

			rule.setAll({
				strokeOpacity: 0.5,
				fillOpacity: 0.8,
				strokeWidth: 1,
			});

			setColor(rule, "stroke", ic, "background");
		}


		this.rule("LinkedHierarchyNode").setAll({
			draggable: true
		});

		this.rule("LinkedHierarchyNode").states.create("hidden", { scale: 0, opacity: 0, visible: false });


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: Treemap
		 * ------------------------------------------------------------------------
		 */

		this.rule("Treemap").setAll({
			upDepth: 0,
			layoutAlgorithm: "squarify"
		});

		{
			const rule = this.rule("Label", ["treemap", "node"]);

			rule.setAll({
				x: p50,
				y: p50,
				centerY: p50,
				centerX: p50,
				paddingBottom: 1,
				paddingTop: 1,
				paddingLeft: 1,
				paddingRight: 1,
				populateText: true,
				text: "{category}",
				oversizedBehavior: "fit",
				minScale: 0.4
			});

			setColor(rule, "fill", ic, "alternativeText");
		}

		this.rule("HierarchyNode", ["treemap", "node"]).setAll({
			tooltipY: percent(40),
			isMeasured: false,
			position: "absolute"
		});

		{
			const rule = this.rule("RoundedRectangle", ["treemap", "node", "shape"]);

			rule.setAll({
				strokeOpacity: 1,
				strokeWidth: 1,
				cornerRadiusBR: 0,
				cornerRadiusTR: 0,
				cornerRadiusBL: 0,
				cornerRadiusTL: 0,
				fillOpacity: 1
			});

			setColor(rule, "stroke", ic, "background");
		}


	}
}
