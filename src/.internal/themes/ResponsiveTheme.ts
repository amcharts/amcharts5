import { ResponsiveBaseTheme } from "./ResponsiveBaseTheme";
import type { IResponsiveRule } from "./ResponsiveBaseTheme";
import { p100, percent } from "../core/util/Percent";

export type { IResponsiveRule } from "./ResponsiveBaseTheme";

/**
 * A theme that changes chart settings as the chart's size changes, so charts
 * fit small spaces. `new()` comes with built-in rules for the common chart
 * types; `newEmpty()` starts with none, for rules of your own.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/responsive/} for more info
 */
export class ResponsiveTheme extends ResponsiveBaseTheme {

	/**
	 * Adds default rules for various chart types and most standard scenarios.
	 */
	protected setupDefaultRules(): void {
		super.setupDefaultRules();

		const addRule = (rule: IResponsiveRule) => this.addRule(rule);

		/**
		 * ========================================================================
		 * Universal
		 * ========================================================================
		 */

		addRule({
			name: "Chart",
			relevant: ResponsiveTheme.widthXXS,
			settings: {
				paddingLeft: 0,
				paddingRight: 0
			}
		});

		addRule({
			name: "Chart",
			relevant: ResponsiveTheme.heightXXS,
			settings: {
				paddingTop: 0,
				paddingBottom: 0
			}
		});

		addRule({
			name: "Bullet",
			relevant: ResponsiveTheme.isXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Legend",
			relevant: ResponsiveTheme.isXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "HeatLegend",
			tags: ["vertical"],
			relevant: ResponsiveTheme.widthXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "HeatLegend",
			tags: ["horizontal"],
			relevant: ResponsiveTheme.heightXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Label",
			tags: ["heatlegend", "start"],
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Label",
			tags: ["heatlegend", "end"],
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Button",
			tags: ["resize"],
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				forceHidden: true
			}
		});


		/**
		 * ========================================================================
		 * XY
		 * ========================================================================
		 */

		addRule({
			name: "AxisRendererX",
			relevant: ResponsiveTheme.heightXS,
			settings: {
				inside: true
			}
		});

		addRule({
			name: "AxisRendererY",
			relevant: ResponsiveTheme.widthXS,
			settings: {
				inside: true
			}
		});

		addRule({
			name: "AxisRendererXLabel",
			relevant: ResponsiveTheme.heightXS,
			settings: {
				minPosition: 0.1,
				maxPosition: 0.9
			}
		});

		addRule({
			name: "AxisLabel",
			tags: ["y"],
			relevant: ResponsiveTheme.widthXS,
			settings: {
				centerY: p100,
				maxPosition: 0.9
			}
		});

		addRule({
			name: "AxisLabel",
			tags: ["x"],
			relevant: ResponsiveTheme.heightXXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "AxisLabel",
			tags: ["x", "minor"],
			relevant: ResponsiveTheme.widthL,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "AxisLabel",
			tags: ["y"],
			relevant: ResponsiveTheme.widthXXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "AxisLabel",
			tags: ["y", "minor"],
			relevant: ResponsiveTheme.heightL,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "AxisTick",
			tags: ["x"],
			relevant: ResponsiveTheme.heightXS,
			settings: {
				inside: true,
				minPosition: 0.1,
				maxPosition: 0.9
			}
		});

		addRule({
			name: "AxisTick",
			tags: ["y"],
			relevant: ResponsiveTheme.widthXXS,
			settings: {
				inside: true,
				minPosition: 0.1,
				maxPosition: 0.9
			}
		});

		addRule({
			name: "Grid",
			relevant: ResponsiveTheme.maybeXXS,
			settings: {
				forceHidden: true
			}
		});


		/**
		 * ========================================================================
		 * Radar
		 * ========================================================================
		 */

		addRule({
			name: "RadialLabel",
			tags: ["radial"],
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "RadialLabel",
			tags: ["circular"],
			relevant: ResponsiveTheme.maybeS,
			settings: {
				inside: true
			}
		});

		addRule({
			name: "AxisTick",
			tags: ["circular"],
			relevant: ResponsiveTheme.maybeS,
			settings: {
				inside: true
			}
		});

		addRule({
			name: "AxisTick",
			tags: ["radial"],
			relevant: ResponsiveTheme.maybeS,
			settings: {
				inside: true
			}
		});

		addRule({
			name: "RadialLabel",
			tags: ["circular"],
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				forceHidden: true
			}
		});


		/**
		 * ========================================================================
		 * Pie
		 * ========================================================================
		 */
		addRule({
			name: "PieChart",
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				radius: percent(99)
			}
		});

		addRule({
			name: "PieChart",
			relevant: ResponsiveTheme.widthM,
			settings: {
				radius: percent(99)
			}
		});

		addRule({
			name: "RadialLabel",
			tags: ["pie"],
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "RadialLabel",
			tags: ["pie"],
			relevant: ResponsiveTheme.widthM,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Tick",
			tags: ["pie"],
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Tick",
			tags: ["pie"],
			relevant: ResponsiveTheme.widthM,
			settings: {
				forceHidden: true
			}
		});


		/**
		 * ========================================================================
		 * Funnel
		 * ========================================================================
		 */

		addRule({
			name: "FunnelSeries",
			relevant: ResponsiveTheme.widthM,
			settings: {
				alignLabels: false
			}
		});

		addRule({
			name: "Label",
			tags: ["funnel", "vertical"],
			relevant: ResponsiveTheme.widthL,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Tick",
			tags: ["funnel", "vertical"],
			relevant: ResponsiveTheme.widthL,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Label",
			tags: ["funnel", "horizontal"],
			relevant: ResponsiveTheme.heightS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Tick",
			tags: ["funnel", "horizontal"],
			relevant: ResponsiveTheme.heightS,
			settings: {
				forceHidden: true
			}
		});


		/**
		 * ========================================================================
		 * Pyramid
		 * ========================================================================
		 */

		addRule({
			name: "PyramidSeries",
			relevant: ResponsiveTheme.widthM,
			settings: {
				alignLabels: false
			}
		});

		addRule({
			name: "Label",
			tags: ["pyramid", "vertical"],
			relevant: ResponsiveTheme.widthL,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Tick",
			tags: ["pyramid", "vertical"],
			relevant: ResponsiveTheme.widthL,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Label",
			tags: ["pyramid", "horizontal"],
			relevant: ResponsiveTheme.heightS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Tick",
			tags: ["pyramid", "horizontal"],
			relevant: ResponsiveTheme.heightS,
			settings: {
				forceHidden: true
			}
		});


		/**
		 * ========================================================================
		 * Pictorial
		 * ========================================================================
		 */

		addRule({
			name: "PictorialStackedSeries",
			relevant: ResponsiveTheme.widthM,
			settings: {
				alignLabels: false
			}
		});

		addRule({
			name: "Label",
			tags: ["pictorial", "vertical"],
			relevant: ResponsiveTheme.widthL,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Tick",
			tags: ["pictorial", "vertical"],
			relevant: ResponsiveTheme.widthL,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Label",
			tags: ["pictorial", "horizontal"],
			relevant: ResponsiveTheme.heightS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Tick",
			tags: ["pictorial", "horizontal"],
			relevant: ResponsiveTheme.heightS,
			settings: {
				forceHidden: true
			}
		});


		/**
		 * ========================================================================
		 * Map
		 * ========================================================================
		 */

		// Nothing to do here

		/**
		 * ========================================================================
		 * Flow (Sankey+Chord)
		 * ========================================================================
		 */

		addRule({
			name: "Label",
			tags: ["flow", "horizontal"],
			relevant: ResponsiveTheme.widthS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Label",
			tags: ["flow", "vertical"],
			relevant: ResponsiveTheme.heightS,
			settings: {
				forceHidden: true
			}
		});

		addRule({
			name: "Chord",
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				radius: percent(99)
			}
		});


		/**
		 * ========================================================================
		 * Hierarchy (Treemap, Partition, Sunburst, Pack, ForceDirected)
		 * ========================================================================
		 */

		addRule({
			name: "Label",
			tags: ["hierarchy", "node"],
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				forceHidden: true
			}
		});

	}
}
