import type { Root } from "@amcharts/amcharts5";

/**
 * What `use:amChart` takes: the function that builds the chart, or that with
 * options.
 */
export type AmChartParameter = ((root: Root) => unknown) | {

	/**
	 * Builds the chart in the root it gets.
	 */
	setup: (root: Root) => unknown;

	/**
	 * Values that make the chart again, with `setup` run again, when one of
	 * them changes. Data is compared by content, so changing an array in
	 * place counts too.
	 */
	deps?: Array<unknown>;

	/**
	 * Draws the chart as SVG instead of canvas.
	 *
	 * @default "canvas"
	 */
	renderer?: "canvas" | "svg";

	/**
	 * Called when the chart could not be built: `setup` threw, or the library
	 * could not be loaded. Without it the error is reported as an uncaught
	 * error, so that `window.onerror` and error trackers see it.
	 */
	onError?: (error: unknown) => void;

};

interface Read {
	setup: (root: Root) => unknown;
	deps: Array<unknown>;
	renderer: "canvas" | "svg" | undefined;
	onError: ((error: unknown) => void) | undefined;
}

function read(parameter: AmChartParameter): Read {
	if (typeof parameter === "function") {
		return { setup: parameter, deps: [], renderer: undefined, onError: undefined };
	}
	return { setup: parameter.setup, deps: parameter.deps || [], renderer: parameter.renderer, onError: parameter.onError };
}

// An error nobody handles is reported as uncaught, not only logged
export function report(error: unknown, onError: ((error: unknown) => void) | undefined): void {
	if (onError) {
		onError(error);
	}
	else if (typeof reportError === "function") {
		reportError(error);
	}
	else {
		setTimeout(() => {
			throw error;
		});
	}
}

// Data by its content, so that Svelte 5 state changed in place counts; what
// is not JSON (a function, say) by identity
function key(value: unknown): unknown {
	try {
		const text = JSON.stringify(value);
		if (text !== undefined && typeof value !== "function") {
			return text;
		}
	}
	catch (error) {
		// Not JSON
	}
	return value;
}

function same(a: Array<unknown>, b: Array<unknown>): boolean {
	return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * A chart written in code, in the element the action is on. `setup` gets a
 * new root and builds the chart in it, as in any amCharts example. The root
 * is disposed when the element goes away. The element needs a height.
 *
 * ```svelte
 * <div use:amChart={{ setup: buildChart, deps: [data] }} style="height: 400px"></div>
 * ```
 *
 * The library is loaded in the browser only: actions do not run on a server.
 *
 * @param  node       The chart's element
 * @param  parameter  The setup function, or it with `deps` and `renderer`
 */
export function amChart(node: HTMLElement, parameter: AmChartParameter) {
	let current = read(parameter);
	let keys = current.deps.map(key);
	let root: Root | undefined;
	let build = 0;

	const dispose = () => {
		build++;
		if (root) {
			root.dispose();
			root = undefined;
		}
	};

	const make = () => {
		dispose();
		const id = build;
		const { setup, renderer, onError } = current;

		import("@amcharts/amcharts5").then((am5) => {
			if (id !== build) {
				return;
			}
			root = am5.Root.new(node, renderer === "svg" ? { renderer: am5.SVGRenderer } : {});
			try {
				setup(root);
			}
			catch (error) {
				// No half-made chart
				dispose();
				report(error, onError);
			}

		}).catch((error) => {
			// The library could not be loaded
			if (id === build) {
				report(error, onError);
			}
		});
	};

	make();

	return {
		update(next: AmChartParameter) {
			const previous = current;
			const previousKeys = keys;
			current = read(next);
			keys = current.deps.map(key);
			// A new setup function alone does not make the chart again: one written
			// inline is new every time
			if (!same(previousKeys, keys) || previous.renderer !== current.renderer) {
				make();
			}
		},

		destroy() {
			dispose();
		},
	};
}


/**
 * Options of `attachAmChart()`.
 */
export interface AttachAmChartOptions {

	/**
	 * Draws the chart as SVG instead of canvas.
	 *
	 * @default "canvas"
	 */
	renderer?: "canvas" | "svg";

	/**
	 * Called when the chart could not be built. Without it the error is
	 * reported as an uncaught error.
	 */
	onError?: (error: unknown) => void;

}

/**
 * A chart written in code, as an attachment (Svelte 5.29 or later). `setup`
 * gets a new root in the element and builds the chart in it, as in any
 * amCharts example. The root is disposed when the element goes away. The
 * element needs a height.
 *
 * ```svelte
 * <div {@attach attachAmChart(buildChart)} style="height: 400px"></div>
 * ```
 *
 * Like any attachment, it runs again, making the chart again, when state read
 * in its expression changes: `{@attach attachAmChart(buildChart, { renderer })}`
 * makes the chart again when `renderer` changes. What `setup` reads does not
 * count. The library is loaded in the browser only: attachments do not run on
 * a server.
 *
 * @param  setup    Builds the chart in the root it gets
 * @param  options  The renderer, and what to do with errors
 * @return          The attachment
 */
export function attachAmChart(setup: (root: Root) => unknown, options: AttachAmChartOptions = {}): (node: HTMLElement) => () => void {
	return (node) => {
		const action = amChart(node, { setup: setup, renderer: options.renderer, onError: options.onError });
		return () => action.destroy();
	};
}
