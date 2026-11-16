import { Theme } from "../core/Theme";
import type { Root } from "../core/Root";
import { MultiDisposer } from "../core/util/Disposer";
import type { Template } from "../core/util/Template";
import * as $array from "../core/util/Array";
import * as $object from "../core/util/Object";

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

// The breakpoints, shared: setting one on either theme moves it for both
const sizes: { [key: string]: number } = { XXS: 100, XS: 200, S: 300, M: 400, L: 600, XL: 800, XXL: 1000 };

/**
 * What the responsive themes share: the breakpoints, the functions that test
 * them, and the rules that apply while the chart's size meets a condition.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/responsive/} for more info
 */
export class ResponsiveBaseTheme extends Theme {

	// Named pixel breakpoints
	/**
	 * Breakpoint of 100 pixels.
	 */
	declare static XXS: number;
	/**
	 * Breakpoint of 200 pixels.
	 */
	declare static XS: number;
	/**
	 * Breakpoint of 300 pixels.
	 */
	declare static S: number;
	/**
	 * Breakpoint of 400 pixels.
	 */
	declare static M: number;
	/**
	 * Breakpoint of 600 pixels.
	 */
	declare static L: number;
	/**
	 * Breakpoint of 800 pixels.
	 */
	declare static XL: number;
	/**
	 * Breakpoint of 1000 pixels.
	 */
	declare static XXL: number;

	// Breakpoint functions (for use in `relevant` clause of the responsive rules)

	/**
	 * `true` when the width is at most `XXS` (100 pixels).
	 */
	declare static widthXXS: (width: number, height: number) => boolean;

	/**
	 * `true` when the width is at most `XS` (200 pixels).
	 */
	declare static widthXS: (width: number, height: number) => boolean;

	/**
	 * `true` when the width is at most `S` (300 pixels).
	 */
	declare static widthS: (width: number, height: number) => boolean;

	/**
	 * `true` when the width is at most `M` (400 pixels).
	 */
	declare static widthM: (width: number, height: number) => boolean;

	/**
	 * `true` when the width is at most `L` (600 pixels).
	 */
	declare static widthL: (width: number, height: number) => boolean;

	/**
	 * `true` when the width is at most `XL` (800 pixels).
	 */
	declare static widthXL: (width: number, height: number) => boolean;

	/**
	 * `true` when the width is at most `XXL` (1000 pixels).
	 */
	declare static widthXXL: (width: number, height: number) => boolean;


	/**
	 * `true` when the height is at most `XXS` (100 pixels).
	 */
	declare static heightXXS: (width: number, height: number) => boolean;

	/**
	 * `true` when the height is at most `XS` (200 pixels).
	 */
	declare static heightXS: (width: number, height: number) => boolean;

	/**
	 * `true` when the height is at most `S` (300 pixels).
	 */
	declare static heightS: (width: number, height: number) => boolean;

	/**
	 * `true` when the height is at most `M` (400 pixels).
	 */
	declare static heightM: (width: number, height: number) => boolean;

	/**
	 * `true` when the height is at most `L` (600 pixels).
	 */
	declare static heightL: (width: number, height: number) => boolean;

	/**
	 * `true` when the height is at most `XL` (800 pixels).
	 */
	declare static heightXL: (width: number, height: number) => boolean;

	/**
	 * `true` when the height is at most `XXL` (1000 pixels).
	 */
	declare static heightXXL: (width: number, height: number) => boolean;


	/**
	 * `true` when both the width and the height are at most `XXS` (100 pixels).
	 */
	declare static isXXS: (width: number, height: number) => boolean;

	/**
	 * `true` when both the width and the height are at most `XS` (200 pixels).
	 */
	declare static isXS: (width: number, height: number) => boolean;

	/**
	 * `true` when both the width and the height are at most `S` (300 pixels).
	 */
	declare static isS: (width: number, height: number) => boolean;

	/**
	 * `true` when both the width and the height are at most `M` (400 pixels).
	 */
	declare static isM: (width: number, height: number) => boolean;

	/**
	 * `true` when both the width and the height are at most `L` (600 pixels).
	 */
	declare static isL: (width: number, height: number) => boolean;

	/**
	 * `true` when both the width and the height are at most `XL` (800 pixels).
	 */
	declare static isXL: (width: number, height: number) => boolean;

	/**
	 * `true` when both the width and the height are at most `XXL` (1000
	 * pixels).
	 */
	declare static isXXL: (width: number, height: number) => boolean;


	/**
	 * `true` when the width or the height is at most `XXS` (100 pixels).
	 */
	declare static maybeXXS: (width: number, height: number) => boolean;

	/**
	 * `true` when the width or the height is at most `XS` (200 pixels).
	 */
	declare static maybeXS: (width: number, height: number) => boolean;

	/**
	 * `true` when the width or the height is at most `S` (300 pixels).
	 */
	declare static maybeS: (width: number, height: number) => boolean;

	/**
	 * `true` when the width or the height is at most `M` (400 pixels).
	 */
	declare static maybeM: (width: number, height: number) => boolean;

	/**
	 * `true` when the width or the height is at most `L` (600 pixels).
	 */
	declare static maybeL: (width: number, height: number) => boolean;

	/**
	 * `true` when the width or the height is at most `XL` (800 pixels).
	 */
	declare static maybeXL: (width: number, height: number) => boolean;

	/**
	 * `true` when the width or the height is at most `XXL` (1000 pixels).
	 */
	declare static maybeXXL: (width: number, height: number) => boolean;

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
	static newEmpty<T extends typeof ResponsiveBaseTheme>(this: T, root: Root): InstanceType<T> {
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
			this._unapplyRule(rule);
		}
	}

	// Takes a rule's settings back
	protected _unapplyRule(rule: IResponsiveRule): void {
		rule.applied = false;
		if (rule.template) {
			rule.template.removeAll();
		}
		if (rule.removing) {
			rule.removing.call(rule);
		}
	}
}

// Each breakpoint, and the functions that test it
$object.each(sizes, (key) => {
	const theme: any = ResponsiveBaseTheme;
	Object.defineProperty(theme, key, {
		get: () => sizes[key],
		set: (value: number) => {
			sizes[key] = value;
		},
		enumerable: true
	});
	theme["width" + key] = (width: number, _height: number) => width <= sizes[key];
	theme["height" + key] = (_width: number, height: number) => height <= sizes[key];
	theme["is" + key] = (width: number, height: number) => width <= sizes[key] && height <= sizes[key];
	theme["maybe" + key] = (width: number, height: number) => width <= sizes[key] || height <= sizes[key];
});
