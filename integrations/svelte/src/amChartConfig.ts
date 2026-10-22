import type { Theme } from "@amcharts/amcharts5";
import type { ChartElement } from "@amcharts/amcharts5/element";

/**
 * What `use:amChartConfig` takes.
 */
export interface AmChartConfigParameter {

	/**
	 * The chart as a JSON config: an object, or a JSON string. A config with
	 * different content makes the chart again.
	 */
	config?: object | string;

	/**
	 * Where to load the config from, when there is no `config`.
	 */
	src?: string;

	/**
	 * Themes, as theme classes, e.g. `[am5themes_Animated]`. Themes are not
	 * part of a config.
	 */
	themes?: Array<typeof Theme>;

	/**
	 * Draws the chart as SVG instead of canvas.
	 *
	 * @default "canvas"
	 */
	renderer?: "canvas" | "svg";

}

// Theme classes are told apart by identity: each gets a number
const themeKeys = new WeakMap<object, number>();
let themeCount = 0;

function themeKey(theme: object): number {
	let key = themeKeys.get(theme);
	if (key === undefined) {
		key = ++themeCount;
		themeKeys.set(theme, key);
	}
	return key;
}

// The same content gives the same key: a config written inline is a new
// object every time
function contentKey(parameter: AmChartConfigParameter): string {
	return JSON.stringify([
		typeof parameter.config === "string" ? parameter.config : JSON.stringify(parameter.config),
		parameter.themes ? parameter.themes.map((theme) => themeKey(theme)) : [],
		parameter.src,
		parameter.renderer,
	]);
}

/**
 * Builds a chart from a JSON config in the `<am5-chart>` element it is on.
 *
 * ```svelte
 * <am5-chart use:amChartConfig={{ config, themes: [am5themes_Animated] }} onready={(event) => ...} style="height: 400px"></am5-chart>
 * ```
 *
 * The element's own code is loaded in the browser only, and the action waits
 * for it before the element gets its config. Listen for its `ready` and
 * `error` events on the element.
 *
 * @param  node       The `<am5-chart>` element
 * @param  parameter  The config and how to show it
 */
export function amChartConfig(node: HTMLElement, parameter: AmChartConfigParameter) {
	let current = parameter;
	let applied: string | undefined;
	let defined = false;
	let destroyed = false;

	// Until the element is defined it must not get properties: they would hide
	// the ones it gets when it is
	const apply = () => {
		const key = contentKey(current);
		if (!defined || destroyed || key === applied) {
			return;
		}
		applied = key;

		const target = node as ChartElement;

		if (current.renderer === "svg") {
			target.setAttribute("renderer", "svg");
		}
		else {
			target.removeAttribute("renderer");
		}

		if (current.src) {
			target.setAttribute("src", current.src);
		}
		else {
			target.removeAttribute("src");
		}

		// Nothing to nothing would only build the chart again
		if (current.themes !== undefined || target.themes !== undefined) {
			target.themes = current.themes;
		}
		if (current.config !== undefined || target.config !== undefined) {
			target.config = current.config;
		}
	};

	import("@amcharts/amcharts5/element").then(() => customElements.whenDefined("am5-chart")).then(() => {
		defined = true;
		apply();
	}).catch((error) => {
		console.error("amChartConfig:", error);
	});

	return {
		update(next: AmChartConfigParameter) {
			current = next;
			apply();
		},

		destroy() {
			destroyed = true;
		},
	};
}


/**
 * A chart from a JSON config in the `<am5-chart>` element, as an attachment
 * (Svelte 5.29 or later).
 *
 * ```svelte
 * <am5-chart {@attach attachAmChartConfig({ config, themes: [am5themes_Animated] })} onready={(event) => ...} style="height: 400px"></am5-chart>
 * ```
 *
 * Like any attachment, it runs again when state read in its expression
 * changes, e.g. `config`. The element's code is loaded in the browser only,
 * and the attachment waits for it before the element gets its config. Listen
 * for its `ready` and `error` events on the element.
 *
 * @param  parameter  The config and how to show it
 * @return            The attachment
 */
export function attachAmChartConfig(parameter: AmChartConfigParameter): (node: HTMLElement) => () => void {
	return (node) => {
		const action = amChartConfig(node, parameter);
		return () => action.destroy();
	};
}
