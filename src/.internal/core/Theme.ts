import type { Entity } from "./util/Entity";
import { Template } from "./util/Template";
import type { Root } from "./Root";
import type { IClasses } from "./Classes";
import * as $order from "./util/Order";
import * as $array from "./util/Array";

export interface IRule<A extends Entity> {
	tags: Array<string>;
	template: Template<A>;
}

/**
 * A base class for an amCharts theme.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
 * @important
 */
export class Theme {

	protected _root!: Root;

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://docs.amcharts.com/v5/getting-started/#new-element-syntax} for more info
	 * @param   root      Root element
	 * @return            Instantiated object
	 */
	static new<T extends typeof Theme>(this: T, root: Root): InstanceType<T> {
		const x = (new this(root, true)) as InstanceType<T>;
		x.setupDefaultRules();
		return x;
	}

	constructor(root: Root, isReal:boolean) {
		this._root = root;
		if (!isReal) {
			throw new Error("You cannot use `new Class()`, instead use `Class.new()`");
		}
	}

	protected setupDefaultRules(): void {}

	protected _rules: { [type: string]: Array<IRule<Entity>>; } = {};

	/**
	 * Returns the theme's rules for a class.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
	 * @param   themeClass Class name
	 * @return             Rules, or `undefined` if there are none
	 */
	public _lookupRules<A extends Entity>(themeClass: string): Array<IRule<A>> | undefined {
		return this._rules[themeClass] as unknown as Array<IRule<A>> | undefined;
	}

	/**
	 * Same as `rule()`, but takes any class name, without type checks.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
	 * @param   themeClass Class name
	 * @param   themeTags  Theme tags
	 * @return             Template
	 */
	public ruleRaw<A extends Entity>(themeClass: string, themeTags: Array<string> = []): Template<A> {
		let rules = this._rules[themeClass];

		if (!rules) {
			rules = this._rules[themeClass] = [];
		}

		themeTags.sort($order.compare);

		const { index, found } = $array.getSortedIndex(rules, (x) => {
			const order = $order.compare(x.tags.length, themeTags.length);

			if (order === 0) {
				return $order.compareArray(x.tags, themeTags, $order.compare);

			} else {
				return order;
			}
		});

		if (found) {
			return rules[index].template as Template<A>;

		} else {
			const template = Template.new<A>({});

			rules.splice(index, 0, {
				tags: themeTags,
				template,
			});

			return template;
		}
	}

	/**
	 * Returns the rule for a class and theme tags, as a [[Template]]. Settings
	 * set on it go to every element of that class (or a class extending it)
	 * that has all of these tags. The same class and tags return the same rule.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
	 * @param   themeClass Class name, e.g. `"Label"`
	 * @param   themeTags  Theme tags
	 * @return             Template
	 */
	public rule<K extends keyof IClasses>(themeClass: K, themeTags: Array<string> = []): Template<IClasses[K]> {
		return this.ruleRaw(themeClass, themeTags) as Template<IClasses[K]>;
	}
}
