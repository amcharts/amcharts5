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
		const r = this.rule.bind(this);

		/**
		 * ========================================================================
		 * charts/hierarchy
		 * ========================================================================
		 */

		r("Hierarchy").setAll({
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

		r("HierarchyNode").setAll({
			toggleKey: "disabled",
			setStateOnChildren: true,
			position: "absolute",
			isMeasured: false,
			cursorOverStyle: "pointer",
			tooltipText: "{category}: {sum}"
		});

		r("HierarchyNode", ["last"]).setAll({
			cursorOverStyle: "default"
		});

		{
			const rule = r("Label", ["hierarchy", "node"]);

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
			const rule = r("HierarchyLink");

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

		r("Circle", ["linkedhierarchy", "shape"]).setAll({
			position: "absolute",
			fillOpacity: 1,
			strokeOpacity: 0,
			radius: 15,
			tooltipY: 0
		});

		r("Circle", ["linkedhierarchy", "shape", "outer"]).setAll({
			position: "absolute",
			opacity: 1,
			fillOpacity: 0,
			strokeDasharray: 0,
			strokeOpacity: 1,
			radius: 15,
			scale: 1.1,
			interactive: false
		})

		r("Circle", ["linkedhierarchy", "shape", "outer"]).states.create("disabled", { opacity: 1, scale: 1.1, strokeDasharray: 2 });
		r("Circle", ["linkedhierarchy", "shape", "outer"]).states.create("hoverDisabled", { scale: 1.2, opacity: 1, strokeDasharray: 2 });
		r("Circle", ["linkedhierarchy", "shape", "outer"]).states.create("hover", { scale: 1.05, strokeDasharray: 0 });
		r("Circle", ["linkedhierarchy", "shape", "outer"]).states.create("hidden", { opacity: 0, strokeDasharray: 0 });


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: BreadcrumbBar
		 * ------------------------------------------------------------------------
		 */

		r("BreadcrumbBar").setAll({
			paddingLeft: 8,
			layout: gridLayout
		});

		{
			const rule = r("Label", ["breadcrumb"]);

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
			const rule = r("Label", ["breadcrumb"]).states.create("hover", {});
			setColor(rule, "fill", ic, "primaryButtonHover");
		}

		{
			const rule = r("Label", ["breadcrumb"]).states.create("down", { stateAnimationDuration: 0 });
			setColor(rule, "fill", ic, "primaryButtonDown");
		}

		{
			const rule = r("Label", ["breadcrumb", "last"]);

			rule.setAll({
				populateText: true,
				text: "{category}",
				fontWeight: "bold",
				cursorOverStyle: "default"
			});

			setColor(rule, "fill", ic, "primaryButton");
		}

		{
			const rule = r("RoundedRectangle", ["breadcrumb", "label", "background"]);

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

		r("Partition").setAll({
			downDepth: 1,
			upDepth: 0,
			initialDepth: 5
		});

		r("HierarchyNode", ["partition"]).setAll({
			setStateOnChildren: false
		});

		r("HierarchyNode", ["partition"]).states.create("hidden", {
			opacity: 1,
			visible: true
		});

		{
			const rule = r("Label", ["partition", "node"]);

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

		r("Label", ["horizontal", "partition", "node"]).setAll({
			rotation: 0
		});

		{
			const rule = r("RoundedRectangle", ["partition", "node", "shape"]);

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

		r("RoundedRectangle", ["partition", "node", "shape", "last"]).setAll({
			fillOpacity: 0.75
		});


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: Sunburst
		 * ------------------------------------------------------------------------
		 */

		r("Sunburst").setAll({
			singleBranchOnly: true
		});

		r("HierarchyNode", ["sunburst"]).setAll({
			setStateOnChildren: false
		});

		r("HierarchyNode", ["sunburst"]).states.create("hidden", {
			opacity: 0,
			visible: false
		});

		{
			const rule = r("Slice", ["sunburst", "node", "shape"]);

			rule.setAll({
				strokeOpacity: 1,
				strokeWidth: 1,
				cornerRadius: 0
			});

			setColor(rule, "stroke", ic, "background");
		}

		r("Slice", ["sunburst", "node", "shape", "last"]).setAll({
			fillOpacity: 0.75
		});

		{
			const rule = r("RadialLabel", ["sunburst", "node"]);

			rule.setAll({
				x: 0,
				y: 0,
				textType: "radial",
				paddingBottom: 1,
				paddingTop: 1,
				paddingLeft: 1,
				paddingRight: 1,
				centerX: p50,
				populateText: true,
				text: "{category}",
				oversizedBehavior: "fit",
				minScale: 0.4,
				baseRadius: p50,
				rotation: 0
			});

			setColor(rule, "fill", ic, "alternativeText");
		}


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: ForceDirected
		 * ------------------------------------------------------------------------
		 */

		r("ForceDirected").setAll({
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

		r("Tree").setAll({
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

		r("Pack").setAll({
			paddingLeft: 20,
			paddingTop: 20,
			paddingBottom: 20,
			paddingRight: 20,
			nodePadding: 0
		});

		{
			const rule = r("Label", ["pack", "node"]);

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
			const rule = r("Circle", ["pack", "node", "shape"]);

			rule.setAll({
				strokeOpacity: 0.5,
				fillOpacity: 0.8,
				strokeWidth: 1,
			});

			setColor(rule, "stroke", ic, "background");
		}


		r("LinkedHierarchyNode").setAll({
			draggable: true
		});

		r("LinkedHierarchyNode").states.create("hidden", { scale: 0, opacity: 0, visible: false });


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: Treemap
		 * ------------------------------------------------------------------------
		 */

		r("Treemap").setAll({
			upDepth: 0,
			layoutAlgorithm: "squarify"
		});

		{
			const rule = r("Label", ["treemap", "node"]);

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

		r("HierarchyNode", ["treemap", "node"]).setAll({
			tooltipY: percent(40),
			isMeasured: false,
			position: "absolute"
		});

		{
			const rule = r("RoundedRectangle", ["treemap", "node", "shape"]);

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


		/**
		 * ------------------------------------------------------------------------
		 * charts/hierarchy: Voronoi Treemap
		 * ------------------------------------------------------------------------
		 */

		{
			r("VoronoiTreemap").setAll({
				type: "polygon",
				minWeightRatio: 0.005,
				convergenceRatio: 0.005,
				maxIterationCount: 100,
				singleBranchOnly: true
			})
		}

		{
			const rule = r("Graphics", ["voronoitreemap", "node", "shape"]);

			rule.setAll({
				strokeOpacity: 1,
				strokeWidth: 1,
				fillOpacity: 1
			});

			setColor(rule, "stroke", ic, "background");
		}

		{
			r("Polygon", ["hierarchy", "node", "shape", "depth1"]).setAll({
				strokeWidth: 3
			});
		}

		{
			const rule = r("Label", ["voronoitreemap"]);

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
				minScale: 0.4,
				layer: 30
			});

			setColor(rule, "fill", ic, "alternativeText");
		}

	}
}
