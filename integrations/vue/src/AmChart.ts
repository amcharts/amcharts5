import { defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, toRaw, watch } from "vue";
import type { PropType } from "vue";
import type { Theme } from "@amcharts/amcharts5";
import type { ChartElement, IChartElementReadyEvent } from "@amcharts/amcharts5/element";

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
		 * Themes, as theme classes, e.g. `[am5themes_Animated]`. Themes are not
		 * part of a config.
		 */
		themes: {
			type: Array as PropType<Array<typeof Theme>>,
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
			const themes = props.themes ? toRaw(props.themes).map((theme) => toRaw(theme)) : undefined;
			const config = toRaw(props.config);
			if (themes !== undefined || target.themes !== undefined) {
				target.themes = themes;
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
		// template is a new object on every render
		watch(() => JSON.stringify([
			typeof props.config === "string" ? props.config : JSON.stringify(props.config),
			props.themes ? props.themes.map((theme) => themeKey(toRaw(theme))) : [],
			props.src,
			props.renderer,
		]), apply);

		expose({ element: exposed });

		return () => h("am5-chart", { ref: element });
	},
});
