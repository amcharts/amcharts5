import { getCurrentInstance, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import type { Ref, ShallowRef, WatchSource } from "vue";
import type { Root } from "@amcharts/amcharts5";

/**
 * Options of `useAmChart()`.
 */
export interface UseAmChartOptions {

	/**
	 * Makes the chart again, with `setup` run again, when this changes: what
	 * Vue's `watch()` takes, e.g. `() => props.data` or a reactive object.
	 */
	watch?: WatchSource | Array<WatchSource> | object;

	/**
	 * Watches deeply, so that changing what is inside `watch` (e.g. pushing
	 * to an array) makes the chart again too. Reactive objects are watched
	 * deeply anyway.
	 */
	deep?: boolean;

	/**
	 * Draws the chart as SVG instead of canvas.
	 *
	 * @default "canvas"
	 */
	renderer?: "canvas" | "svg";

}

/**
 * What `useAmChart()` returns.
 */
export interface UseAmChartResult<T> {

	/**
	 * The chart's root, once it is made.
	 */
	root: ShallowRef<Root | undefined>;

	/**
	 * What `setup` returned, e.g. the chart, once it ran.
	 */
	result: ShallowRef<T | undefined>;

}

/**
 * A chart written in code, in the element of a template ref. `setup` gets a
 * new root and builds the chart in it, as in any amCharts example. The root
 * is made when the component is mounted and disposed when it is unmounted.
 *
 * ```vue
 * <script setup>
 * const props = defineProps(["data"]);
 *
 * useAmChart(useTemplateRef("chart"), (root) => {
 *   const chart = root.container.children.push(am5xy.XYChart.new(root, {}));
 *   ...
 *   return chart;
 * }, { watch: () => props.data });
 * </script>
 *
 * <template>
 *   <div ref="chart" style="height: 400px"></div>
 * </template>
 * ```
 *
 * The library is loaded in the browser only, so the component renders on a
 * server without it.
 *
 * @param  el       The template ref of the element the chart goes in; it needs a height
 * @param  setup    Builds the chart in the root it gets
 * @param  options  What makes the chart again, and the renderer
 * @return          The root and what `setup` returned
 */
export function useAmChart<T = void>(el: Readonly<Ref<HTMLElement | null>>, setup: (root: Root) => T, options: UseAmChartOptions = {}): UseAmChartResult<T> {
	const root = shallowRef<Root | undefined>(undefined);
	const result = shallowRef<T | undefined>(undefined);

	let current: Root | undefined;
	let build = 0;

	// The element the chart is made in, or being made in
	let target: HTMLElement | null = null;

	// Errors go to the app's errorHandler, as errors in a component do
	const instance = getCurrentInstance();
	const report = (error: unknown) => {
		const handler = instance ? instance.appContext.config.errorHandler : undefined;
		if (handler && instance) {
			handler(error, instance.proxy, "useAmChart");
		}
		else {
			console.error("useAmChart:", error);
		}
	};

	const dispose = () => {
		build++;
		if (current) {
			current.dispose();
			current = undefined;
		}
		root.value = undefined;
		result.value = undefined;
	};

	const make = () => {
		dispose();
		const id = build;
		target = el.value;

		import("@amcharts/amcharts5").then((am5) => {
			const element = el.value;
			if (id !== build || !element) {
				return;
			}
			current = am5.Root.new(element, options.renderer === "svg" ? { renderer: am5.SVGRenderer } : {});
			try {
				result.value = setup(current);
			}
			catch (error) {
				// No half-made chart
				dispose();
				throw error;
			}
			root.value = current;

		}).catch(report);
	};

	onMounted(make);
	onBeforeUnmount(() => {
		dispose();
		target = null;
	});

	// An element rendered later (v-if), removed or replaced: the chart follows it
	watch(el, (element) => {
		if (element === target) {
			return;
		}
		if (element) {
			make();
		}
		else {
			dispose();
			target = null;
		}
	}, { flush: "post" });

	if (options.watch) {
		watch(options.watch as WatchSource, make, { deep: options.deep });
	}

	return { root, result };
}
