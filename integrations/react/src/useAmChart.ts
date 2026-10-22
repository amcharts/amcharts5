"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DependencyList, RefCallback } from "react";
import type { Root } from "@amcharts/amcharts5";

/**
 * Options of `useAmChart()`.
 */
export interface UseAmChartOptions {

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
	 * Put this on the element the chart goes in. The element needs a height.
	 * The chart is made when the element is there, also if it is rendered
	 * later, e.g. after a loading message.
	 */
	ref: RefCallback<HTMLDivElement>;

	/**
	 * The chart's root, once it is made.
	 */
	root: Root | undefined;

	/**
	 * What `setup` returned, e.g. the chart, once it ran.
	 */
	result: T | undefined;

}

/**
 * A chart written in code. `setup` gets a new root and builds the chart in it,
 * as in any amCharts example. The root is disposed when the component goes
 * away, and made again, with `setup` run again, when one of `deps` changes.
 *
 * ```tsx
 * function Chart({ data }) {
 *   const { ref } = useAmChart((root) => {
 *     const chart = root.container.children.push(am5xy.XYChart.new(root, {}));
 *     ...
 *     return chart;
 *   }, [data]);
 *
 *   return <div ref={ref} style={{ height: 400 }} />;
 * }
 * ```
 *
 * The library is loaded in the browser only, so the component renders on a
 * server without it.
 *
 * @param  setup    Builds the chart in the root it gets
 * @param  deps     Values that make the chart again when they change
 * @param  options  Options
 * @return          The ref for the chart's element, the root and what `setup` returned
 */
export function useAmChart<T = void>(setup: (root: Root) => T, deps: DependencyList = [], options: UseAmChartOptions = {}): UseAmChartResult<T> {
	// The element, as state: the chart is made when it is there
	const [element, setElement] = useState<HTMLDivElement | null>(null);
	const ref = useCallback((node: HTMLDivElement | null) => setElement(node), []);
	const [state, setState] = useState<{ root: Root, result: T } | undefined>(undefined);

	// The latest function: a new one on every render does not make the chart again
	const latest = useRef(setup);
	latest.current = setup;

	const renderer = options.renderer;

	useEffect(() => {
		if (!element) {
			return;
		}

		let root: Root | undefined;
		let cancelled = false;

		import("@amcharts/amcharts5").then((am5) => {
			if (cancelled) {
				return;
			}
			root = am5.Root.new(element, renderer === "svg" ? { renderer: am5.SVGRenderer } : {});

			let result: T;
			try {
				result = latest.current(root);
			}
			catch (error) {
				// No half-made chart, and the error reaches an error boundary
				root.dispose();
				root = undefined;
				setState(() => {
					throw error;
				});
				return;
			}
			setState({ root: root, result: result });

		}).catch((error) => {
			// The library could not be loaded: to an error boundary too
			if (!cancelled) {
				setState(() => {
					throw error;
				});
			}
		});

		return () => {
			cancelled = true;
			if (root) {
				root.dispose();
			}
			// The disposed chart is not kept until the next one is made
			setState(undefined);
		};
	}, [element, ...deps, renderer]);

	const current = state && !state.root.isDisposed() ? state : undefined;

	return {
		ref: ref,
		root: current ? current.root : undefined,
		result: current ? current.result : undefined,
	};
}
