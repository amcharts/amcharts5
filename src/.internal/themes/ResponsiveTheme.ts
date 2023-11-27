import { Theme } from "../core/Theme";
import type { Root } from "../core/Root";
import { MultiDisposer } from "../core/util/Disposer";
import { p100, percent } from "../core/util/Percent";
import type { Template } from "../core/util/Template";
import * as $array from "../core/util/Array";

/**
 * An interface describing resonsive rule.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/responsive/} for more info
 * @important
 */
export interface IResponsiveRule {

	/**
	 * A class name of the elements to apply rule to.
	 */
	name?: string;

	/**
	 * A class group of the elements to apply rule to.
	 */
	tags?: string | string[];

	/**
	 * Settings to apply when activating the responsive rule.
	 */
	settings?: any;

	/**
	 * A callback function which should check and return `true` if rule is
	 * applicable for current situation.
	 */
	relevant: (width: number, height: number) => boolean;

	/**
	 * A custom callback function which is called when applying the rule.
	 */
	applying?: () => void;

	/**
	 * A custom callback function which is called when removing the rule.
	 */
	removing?: () => void;

	/**
	 * Indicates if rule is currently applied.
	 * @readonly
	 */
	applied?: boolean;

	/**
	 * Reference to [[Template]] object associated with the rule.
	 * @readonly
	 */
	template?: Template<any>;

	/**
	 * @ignore
	 */
	_dp?: MultiDisposer;

}

/**
 * A configurable theme that dynamically adapts chart settings for best fit
 * in available space.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/responsive/} for more info
 */
export class ResponsiveTheme extends Theme {

	// Named pixel breakpoints
	static XXS = 100;
	static XS = 200;
	static S = 300;
	static M = 400;
	static L = 600;
	static XL = 800;
	static XXL = 1000;

	// Breakpoint functions (for use in `relevant` clause of the responsive rules)

	static widthXXS(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.XXS;
	}

	static widthXS(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.XS;
	}

	static widthS(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.S;
	}

	static widthM(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.M;
	}

	static widthL(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.L;
	}

	static widthXL(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.XL;
	}

	static widthXXL(width: number, _height: number): boolean {
		return width <= ResponsiveTheme.XXL;
	}


	static heightXXS(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.XXS;
	}

	static heightXS(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.XS;
	}

	static heightS(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.S;
	}

	static heightM(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.M;
	}

	static heightL(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.L;
	}

	static heightXL(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.XL;
	}

	static heightXXL(_width: number, height: number): boolean {
		return height <= ResponsiveTheme.XXL;
	}


	static isXXS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XXS) && (height <= ResponsiveTheme.XXS);
	}

	static isXS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XS) && (height <= ResponsiveTheme.XS);
	}

	static isS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.S) && (height <= ResponsiveTheme.S);
	}

	static isM(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.M) && (height <= ResponsiveTheme.M);
	}

	static isL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.L) && (height <= ResponsiveTheme.L);
	}

	static isXL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XL) && (height <= ResponsiveTheme.XL);
	}

	static isXXL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XXL) && (height <= ResponsiveTheme.XXL);
	}


	static maybeXXS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XXS) || (height <= ResponsiveTheme.XXS);
	}

	static maybeXS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XS) || (height <= ResponsiveTheme.XS);
	}

	static maybeS(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.S) || (height <= ResponsiveTheme.S);
	}

	static maybeM(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.M) || (height <= ResponsiveTheme.M);
	}

	static maybeL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.L) || (height <= ResponsiveTheme.L);
	}

	static maybeXL(width: number, height: number): boolean {
		return (width <= ResponsiveTheme.XL) || (height <= ResponsiveTheme.XL);
	}

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
	 * Currently added rules.
	 */
	public responsiveRules: IResponsiveRule[] = [];

	/**
	 * Instantiates the theme without adding default respomsive rules.
	 */
	static newEmpty<T extends typeof ResponsiveTheme>(this: T, root: Root): InstanceType<T> {
		return (new this(root, true)) as InstanceType<T>;
	}


	/**
	 * Adds a responsive rule as well as retuns it.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/responsive/} for more info
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
	 * Removes the responsive rule.
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
			relevant: ResponsiveTheme.widthXXL,
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
			relevant: ResponsiveTheme.heightXXL,
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

		addRule({
			name: "AxisTick",
			tags: ["circular"],
			relevant: ResponsiveTheme.maybeXS,
			settings: {
				inside: true
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
