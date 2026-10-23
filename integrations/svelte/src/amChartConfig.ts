import type { ChartElement, ChartElementTheme } from "@amcharts/amcharts5/element";

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
	 * Themes, as theme classes, e.g. `[am5themes_Animated]`, or a class with
	 * its settings: `[am5themes_Adaptive, { baseColor: "#4150a0" }]`. Themes
	 * are not part of a config.
	 */
	themes?: Array<ChartElementTheme>;

	/**
	 * Geodata and locales the config names, by those names, e.g.
	 * `{ am5geodata_worldLow }` for `"geoJSON": "am5geodata_worldLow"`. With
	 * npm imports they are not globals, so the config finds them here.
	 */
	resources?: { [name: string]: unknown };

	/**
	 * Draws the chart as SVG instead of canvas.
	 *
	 * @default "canvas"
	 */
	renderer?: "canvas" | "svg";

}

// Objects are told apart by identity: each gets a number
const objectKeys = new WeakMap<object, number>();
let objectCount = 0;

function objectKey(value: unknown): number | string {
	if (value === null || (typeof value !== "object" && typeof value !== "function")) {
		return typeof value + ":" + String(value);
	}
	let key = objectKeys.get(value as object);
	if (key === undefined) {
		key = ++objectCount;
		objectKeys.set(value as object, key);
	}
	return key;
}

// The same content gives the same key: a config written inline is a new
// object every time. A theme by its class and its settings by content; each
// resource by identity, as geodata is too big to compare
function contentKey(parameter: AmChartConfigParameter): string {
	const resources = parameter.resources;
	return JSON.stringify([
		typeof parameter.config === "string" ? parameter.config : JSON.stringify(parameter.config),
		parameter.themes ? parameter.themes.map((theme) => Array.isArray(theme) ? [objectKey(theme[0]), theme[1]] : objectKey(theme)) : [],
		resources ? Object.keys(resources).sort().map((name) => [name, objectKey(resources[name])]) : [],
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
		if (current.resources !== undefined || target.resources !== undefined) {
			target.resources = current.resources;
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
