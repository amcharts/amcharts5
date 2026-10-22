"use client";

import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CSSProperties, ForwardedRef } from "react";
import type { Theme } from "@amcharts/amcharts5";
import type { ChartElement, IChartElementReadyEvent } from "@amcharts/amcharts5/element";

/**
 * Props of `<AmChart>`.
 */
export interface AmChartProps {

	/**
	 * The chart as a JSON config: an object, or a JSON string. A different
	 * value makes the chart again.
	 */
	config?: object | string;

	/**
	 * Where to load the config from, when there is no `config`.
	 */
	src?: string;

	/**
	 * Themes, as theme classes, e.g. `[am5themes_Animated]`. Themes are not part
	 * of a config.
	 */
	themes?: Array<typeof Theme>;

	/**
	 * Draws the chart as SVG instead of canvas.
	 *
	 * @default "canvas"
	 */
	renderer?: "canvas" | "svg";

	/**
	 * Called when the chart is built, with its root and the chart.
	 */
	onReady?: (event: IChartElementReadyEvent) => void;

	/**
	 * Called when the chart could not be built.
	 */
	onError?: (error: unknown) => void;

	id?: string;

	className?: string;

	/**
	 * Give the chart a height here or with `className`; without one it is
	 * 400 pixels high.
	 */
	style?: CSSProperties;

}

// The value from an earlier render while its content stays the same
function useSameContent<T>(value: T, key: (value: T) => string): T {
	const kept = useRef<{ key: string, value: T } | undefined>(undefined);
	const current = key(value);
	if (!kept.current || kept.current.key !== current) {
		kept.current = { key: current, value: value };
	}
	return kept.current.value;
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

/**
 * A chart built from a JSON config, with no chart code.
 *
 * ```tsx
 * <AmChart config={config} themes={[am5themes_Animated]} style={{ height: 400 }} />
 * ```
 *
 * It is the library's `<am5-chart>` element; a ref on it gives that element,
 * with `root`, `chart` and `whenReady()`. The library is loaded in the browser
 * only, so the component renders on a server without it.
 */
export const AmChart = forwardRef(function AmChart(props: AmChartProps, ref: ForwardedRef<ChartElement | null>) {
	const element = useRef<ChartElement | null>(null);
	const [defined, setDefined] = useState(false);

	// The latest callbacks: new ones on every render do not make the chart again
	const latest = useRef(props);
	latest.current = props;

	// The element only once its code is there: before, it has no whenReady()
	useImperativeHandle(ref, () => (defined ? element.current : null) as ChartElement, [defined]);

	// The element's code. Until it is defined, the element must not get properties:
	// they would hide the ones it gets when it is
	useEffect(() => {
		let cancelled = false;

		import("@amcharts/amcharts5/element").then(() => customElements.whenDefined("am5-chart")).then(() => {
			if (!cancelled) {
				setDefined(true);
			}
		}).catch((error) => {
			console.error("AmChart:", error);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	// Listeners first, so that the first chart's events are heard
	useEffect(() => {
		const target = element.current;
		if (!defined || !target) {
			return;
		}

		const ready = (event: Event) => {
			const callback = latest.current.onReady;
			if (callback) {
				callback((event as CustomEvent<IChartElementReadyEvent>).detail);
			}
		};

		const error = (event: Event) => {
			const callback = latest.current.onError;
			if (callback) {
				callback((event as CustomEvent).detail);
			}
		};

		target.addEventListener("ready", ready);
		target.addEventListener("error", error);

		return () => {
			target.removeEventListener("ready", ready);
			target.removeEventListener("error", error);
		};
	}, [defined]);

	// What the chart is built from; a change builds it again. Compared by
	// content: a config or a list of themes written inline is a new object on
	// every render
	const config = useSameContent(props.config, (value) => typeof value === "string" ? value : JSON.stringify(value));
	const themes = useSameContent(props.themes, (value) => value ? value.map((theme) => themeKey(theme)).join(",") : "");
	const { src, renderer } = props;

	useEffect(() => {
		const target = element.current;
		if (!defined || !target) {
			return;
		}

		if (renderer === "svg") {
			target.setAttribute("renderer", "svg");
		}
		else {
			target.removeAttribute("renderer");
		}

		if (src) {
			target.setAttribute("src", src);
		}
		else {
			target.removeAttribute("src");
		}

		// Nothing to nothing would only build the chart again
		if (themes !== undefined || target.themes !== undefined) {
			target.themes = themes;
		}
		if (config !== undefined || target.config !== undefined) {
			target.config = config;
		}
	}, [defined, config, src, themes, renderer]);

	// "class": React 18 gives a custom element its props as attributes by name
	return createElement("am5-chart", {
		ref: element,
		id: props.id,
		class: props.className,
		style: props.style,
	});
});
