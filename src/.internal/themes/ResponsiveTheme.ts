import { Theme } from "../core/Theme";
import type { Root } from "../core/Root";
import { MultiDisposer } from "../core/util/Disposer";
import { p100, percent } from "../core/util/Percent";
import type { Template } from "../core/util/Template";
import * as $array from "../core/util/Array";

/**
 * A responsive rule: settings for matching elements that apply while the
 * chart's size meets a condition.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/responsive/} for more info
 * @important
 */
export interface IResponsiveRule {

	/**
	 * Class name of the elements the rule applies to, such as `"AxisLabel"`.
	 */
	name?: string;

	/**
	 * Theme tags the elements must also have.
	 */
	tags?: string | string[];

	/**
	 * Settings for the elements while the rule applies. Needs `name`.
	 */
	settings?: any;

	/**
	 * Returns `true` while the rule should apply. Gets the root's width and
	 * height in pixels; the breakpoint functions of [[ResponsiveTheme]], such
	 * as `ResponsiveTheme.widthM`, fit here.
	 */
	relevant: (width: number, height: number) => boolean;

	/**
	 * Called when the rule starts to apply.
	 */
	applying?: () => void;

	/**
	 * Called when the rule stops applying.
	 */
	removing?: () => void;

	/**
	 * Whether the rule currently applies.
	 * @readonly
	 */
	applied?: boolean;

	/**
	 * The theme rule's [[Template]] that `settings` are set on.
	 * @readonly
	 */
	template?: Template<any>;

	/**
	 * @ignore
	 */
	_dp?: MultiDisposer;

}

/**
 * A theme that changes chart settings as the chart's size changes, so charts
 * fit small spaces. `new()` comes with built-in rules for the common chart
 * types; `newEmpty()` starts with none, for rules of your own.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/responsive/} for more info
 */
export class ResponsiveTheme extends Theme {

	// Named pixel breakpoints
	/**
	 * Breakpoint of 100 pixels.
	 */
	static XXS = 100;
	/**
	 * Breakpoint of 200 pixels.
	 */
	static XS = 200;
	/**
	 * Breakpoint of 300 pixels.
	 */
	static S = 300;
	/**
	 * Breakpoint of 400 pixels.
	 */
	static M = 400;
	/**
	 * Breakpoint of 600 pixels.
	 */
	static L = 600;
	/**
	 * Breakpoint of 800 pixels.
	 */
	static XL = 800;
	/**
	 * Breakpoint of 1000 pixels.
	 */
	static XXL = 1000;

	// Breakpoint functions (for use in `relevant` clause of the responsive rules)

	/**
	 * `true` when the width is at most `XXS` (100 pixels).
	 */
	static widthXXS(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.XXS;
	}

	/**
	 * `true` when the width is at most `XS` (200 pixels).
	 */
	static widthXS(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.XS;
	}

	/**
	 * `true` when the width is at most `S` (300 pixels).
	 */
	static widthS(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.S;
	}

	/**
	 * `true` when the width is at most `M` (400 pixels).
	 */
	static widthM(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.M;
	}

	/**
	 * `true` when the width is at most `L` (600 pixels).
	 */
	static widthL(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.L;
	}

	/**
	 * `true` when the width is at most `XL` (800 pixels).
	 */
	static widthXL(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.XL;
	}

	/**
	 * `true` when the width is at most `XXL` (1000 pixels).
	 */
	static widthXXL(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.XXL;
	}


	/**
	 * `true` when the height is at most `XXS` (100 pixels).
	 */
	static heightXXS(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.XXS;
	}

	/**
	 * `true` when the height is at most `XS` (200 pixels).
	 */
	static heightXS(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.XS;
	}

	/**
	 * `true` when the height is at most `S` (300 pixels).
	 */
	static heightS(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.S;
	}

	/**
	 * `true` when the height is at most `M` (400 pixels).
	 */
	static heightM(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.M;
	}

	/**
	 * `true` when the height is at most `L` (600 pixels).
	 */
	static heightL(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.L;
	}

	/**
	 * `true` when the height is at most `XL` (800 pixels).
	 */
	static heightXL(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.XL;
	}

	/**
	 * `true` when the height is at most `XXL` (1000 pixels).
	 */
	static heightXXL(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.XXL;
	}


	/**
	 * `true` when both the width and the height are at most `XXS` (100 pixels).
	 */
	static isXXS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XXS) && (height <= ResponsiveTheme.XXS);
	}

	/**
	 * `true` when both the width and the height are at most `XS` (200 pixels).
	 */
	static isXS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XS) && (height <= ResponsiveTheme.XS);
	}

	/**
	 * `true` when both the width and the height are at most `S` (300 pixels).
	 */
	static isS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.S) && (height <= ResponsiveTheme.S);
	}

	/**
	 * `true` when both the width and the height are at most `M` (400 pixels).
	 */
	static isM(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.M) && (height <= ResponsiveTheme.M);
	}

	/**
	 * `true` when both the width and the height are at most `L` (600 pixels).
	 */
	static isL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.L) && (height <= ResponsiveTheme.L);
	}

	/**
	 * `true` when both the width and the height are at most `XL` (800 pixels).
	 */
	static isXL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XL) && (height <= ResponsiveTheme.XL);
	}

	/**
	 * `true` when both the width and the height are at most `XXL` (1000
	 * pixels).
	 */
	static isXXL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XXL) && (height <= ResponsiveTheme.XXL);
	}


	/**
	 * `true` when the width or the height is at most `XXS` (100 pixels).
	 */
	static maybeXXS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XXS) || (height <= ResponsiveTheme.XXS);
	}

	/**
	 * `true` when the width or the height is at most `XS` (200 pixels).
	 */
	static maybeXS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XS) || (height <= ResponsiveTheme.XS);
	}

	/**
	 * `true` when the width or the height is at most `S` (300 pixels).
	 */
	static maybeS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.S) || (height <= ResponsiveTheme.S);
	}

	/**
	 * `true` when the width or the height is at most `M` (400 pixels).
	 */
	static maybeM(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.M) || (height <= ResponsiveTheme.M);
	}

	/**
	 * `true` when the width or the height is at most `L` (600 pixels).
	 */
	static maybeL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.L) || (height <= ResponsiveTheme.L);
	}

	/**
	 * `true` when the width or the height is at most `XL` (800 pixels).
	 */
	static maybeXL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XL) || (height <= ResponsiveTheme.XL);
	}

	/**
	 * `true` when the width or the height is at most `XXL` (1000 pixels).
	 */
	static maybeXXL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XXL) || (height <= ResponsiveTheme.XXL);
	}

	private _dp?: MultiDisposer;

	constructor(root: Root, isReal: boolean) {
		super(root, isReal);
		this._dp = new MultiDisposer([
			this._root._rootContainer.onPrivate("width", (_width) => {
				if (this._isUsed()) {
					this._maybeApplyRules();
				}
			}),
			this._root._rootContainer.onPrivate("height", (_height) => {
				if (this._isUsed()) {
					this._maybeApplyRules();
				}
			})
		]);
	}

	/**
	 * Rules added to the theme.
	 */
	public responsiveRules: IResponsiveRule[] = [];

	/**
	 * Creates the theme without its built-in rules, for rules of your own.
	 */
	static newEmpty<T extends typeof ResponsiveTheme>(this: T, root: Root): InstanceType<T> {
		return (new this(root, true)) as InstanceType<T>;
	}


	/**
	 * Adds a responsive rule and returns it. It applies at once if it is
	 * relevant.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/responsive/} for more info
	 * @param   rule  Responsive rule
	 * @return        Responsive rule
	 */
	public addRule(rule: IResponsiveRule): IResponsiveRule {
		if (rule.name && !rule.template) {
			rule.template = (<any>this).rule(rule.name, rule.tags);
		}

		this.responsiveRules.push(rule);
		this._maybeApplyRule(rule);
		return rule;
	}

	/**
	 * Removes a responsive rule from the theme.
	 *
	 * @param  rule  Responsive rule
	 */
	public removeRule(rule: IResponsiveRule): void {
		$array.remove(this.responsiveRules, rule);
	}

	public dispose(): void {
		if (this._dp) {
			this._dp.dispose();
		}
	}

	protected _isUsed(): boolean {
		return this._root._rootContainer.get("themes")!.indexOf(this) !== -1;
	}

	protected _maybeApplyRules(): void {
		$array.each(this.responsiveRules, (rule) => {
			this._maybeUnapplyRule(rule);
		});
		$array.each(this.responsiveRules, (rule) => {
			this._maybeApplyRule(rule);
		});
	}

	protected _maybeApplyRule(rule: IResponsiveRule): void {
		if (rule.applied) return;
		const w = this._root._rootContainer.getPrivate("width");
		const h = this._root._rootContainer.getPrivate("height");
		const relevant = rule.relevant.call(rule, <number>w, <number>h);
		if (relevant) {
			rule.applied = true;
			if (rule.template && rule.settings) {
				rule.template.setAll(rule.settings);
			}
			if (rule.applying) {
				rule.applying.call(rule);
			}
		}
	}

	protected _maybeUnapplyRule(rule: IResponsiveRule): void {
		if (!rule.applied) return;
		const w = this._root._rootContainer.getPrivate("width");
		const h = this._root._rootContainer.getPrivate("height");
		const relevant = rule.relevant.call(rule, <number>w, <number>h);
		if (!relevant) {
			rule.applied = false;
			if (rule.template) {
				rule.template.removeAll();
			}
			if (rule.removing) {
				rule.removing.call(rule);
			}
		}
	}

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
