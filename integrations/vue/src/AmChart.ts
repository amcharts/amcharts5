import { defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, toRaw, watch } from "vue";
import type { PropType } from "vue";
import type { ChartElement, ChartElementTheme, IChartElementReadyEvent } from "@amcharts/amcharts5/element";

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

// The plain objects, not Vue's reactive versions of them
function rawThemes(themes: Array<ChartElementTheme> | undefined): Array<ChartElementTheme> | undefined {
	return themes ? toRaw(themes).map((theme) => {
		const entry = toRaw(theme);
		return Array.isArray(entry) ? [toRaw(entry[0]), toRaw(entry[1])] as ChartElementTheme : entry;
	}) : undefined;
}

function rawResources(resources: { [name: string]: unknown } | undefined): { [name: string]: unknown } | undefined {
	if (!resources) {
		return undefined;
	}
	const raw: { [name: string]: unknown } = {};
	const source = toRaw(resources);
	Object.keys(source).forEach((name) => {
		raw[name] = toRaw(source[name]);
	});
	return raw;
}

/**
 * What the component exposes, for a template ref:
 * `useTemplateRef<AmChartExposed>("chart")`.
 */
export interface AmChartExposed {

	/**
	 * The `<am5-chart>` element, with `root`, `chart` and `whenReady()`, once
	 * its code has loaded; `null` until then.
	 */
	element: ChartElement | null;

}

/**
 * A chart built from a JSON config, with no chart code.
 *
 * ```vue
 * <AmChart :config="config" :themes="[am5themes_Animated]" style="height: 400px" @ready="onReady" />
 * ```
 *
 * It is the library's `<am5-chart>` element: the component exposes it as
 * `element` (see {@link AmChartExposed}). The library is loaded in
 * the browser only, so the component renders on a server without it.
 */
export const AmChart = defineComponent({
	name: "AmChart",

	props: {

		/**
		 * The chart as a JSON config: an object, or a JSON string. A config
		 * with different content makes the chart again.
		 */
		config: {
			type: [Object, String] as PropType<object | string>,
			default: undefined,
		},

		/**
		 * Where to load the config from, when there is no `config`.
		 */
		src: {
			type: String,
			default: undefined,
		},

		/**
		 * Themes, as theme classes, e.g. `[am5themes_Animated]`, or a class with
		 * its settings: `[am5themes_Adaptive, { baseColor: "#4150a0" }]`.
		 * Themes are not part of a config.
		 */
		themes: {
			type: Array as PropType<Array<ChartElementTheme>>,
			default: undefined,
		},

		/**
		 * Geodata and locales the config names, by those names, e.g.
		 * `{ am5geodata_worldLow }` for `"geoJSON": "am5geodata_worldLow"`.
		 * With npm imports they are not globals, so the config finds them here.
		 */
		resources: {
			type: Object as PropType<{ [name: string]: unknown }>,
			default: undefined,
		},

		/**
		 * `"svg"` draws the chart as SVG instead of canvas.
		 */
		renderer: {
			type: String as PropType<"canvas" | "svg">,
			default: "canvas",
		},
	},

	emits: {
		/**
		 * The chart is built: `{ root, chart }`.
		 */
		ready: (_event: IChartElementReadyEvent) => true,

		/**
		 * The chart could not be built.
		 */
		error: (_error: unknown) => true,
	},

	setup(props, { emit, expose }) {
		const element = ref<ChartElement | null>(null);
		const exposed = shallowRef<ChartElement | null>(null);
		let defined = false;
		let unmounted = false;

		const ready = (event: Event) => {
			emit("ready", (event as CustomEvent<IChartElementReadyEvent>).detail);
		};

		const error = (event: Event) => {
			emit("error", (event as CustomEvent).detail);
		};

		// Until the element is defined it must not get properties: they would
		// hide the ones it gets when it is
		const apply = () => {
			const target = element.value;
			if (!defined || !target) {
				return;
			}

			if (props.renderer === "svg") {
				target.setAttribute("renderer", "svg");
			}
			else {
				target.removeAttribute("renderer");
			}

			if (props.src) {
				target.setAttribute("src", props.src);
			}
			else {
				target.removeAttribute("src");
			}

			// The plain objects, not Vue's reactive versions of them. Nothing to
			// nothing would only build the chart again
			const themes = rawThemes(props.themes);
			const resources = rawResources(props.resources);
			const config = toRaw(props.config);
			if (themes !== undefined || target.themes !== undefined) {
				target.themes = themes;
			}
			if (resources !== undefined || target.resources !== undefined) {
				target.resources = resources;
			}
			if (config !== undefined || target.config !== undefined) {
				target.config = config;
			}
		};

		onMounted(() => {
			import("@amcharts/amcharts5/element").then(() => customElements.whenDefined("am5-chart")).then(() => {
				const target = element.value;
				if (unmounted || !target) {
					return;
				}
				defined = true;
				exposed.value = target;
				target.addEventListener("ready", ready);
				target.addEventListener("error", error);
				apply();

			}).catch((reason) => {
				console.error("AmChart:", reason);
			});
		});

		onBeforeUnmount(() => {
			unmounted = true;
			const target = element.value;
			if (target) {
				target.removeEventListener("ready", ready);
				target.removeEventListener("error", error);
			}
		});

		// Compared by content: a config or a list of themes written inline in a
		// template is a new object on every render. A theme by its class and its
		// settings by content; each resource by identity, as geodata is too big
		// to compare
		// Read through Vue's reactive versions, so that changes made in place are
		// seen too; only what is keyed by identity is unwrapped
		watch(() => {
			const themes = props.themes;
			const resources = props.resources;
			return JSON.stringify([
				typeof props.config === "string" ? props.config : JSON.stringify(props.config),
				themes ? themes.map((theme) => Array.isArray(theme) ? [objectKey(toRaw(theme[0])), theme[1]] : objectKey(toRaw(theme))) : [],
				resources ? Object.keys(resources).sort().map((name) => [name, objectKey(toRaw(resources[name]))]) : [],
				props.src,
				props.renderer,
			]);
		}, apply);

		expose({ element: exposed });

		return () => h("am5-chart", { ref: element });
	},
});
