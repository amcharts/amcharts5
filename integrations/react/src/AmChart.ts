"use client";

import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CSSProperties, ForwardedRef } from "react";
import type { ChartElement, ChartElementTheme, IChartElementReadyEvent } from "@amcharts/amcharts5/element";

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

// A theme by its class, and its settings by content
function themesKey(themes: Array<ChartElementTheme> | undefined): string {
	return themes ? JSON.stringify(themes.map((theme) => Array.isArray(theme) ? [objectKey(theme[0]), theme[1]] : objectKey(theme))) : "";
}

// Each resource by identity: geodata is too big to compare
function resourcesKey(resources: { [name: string]: unknown } | undefined): string {
	return resources ? JSON.stringify(Object.keys(resources).sort().map((name) => [name, objectKey(resources[name])])) : "";
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
	const themes = useSameContent(props.themes, themesKey);
	const resources = useSameContent(props.resources, resourcesKey);
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
		if (resources !== undefined || target.resources !== undefined) {
			target.resources = resources;
		}
		if (config !== undefined || target.config !== undefined) {
			target.config = config;
		}
	}, [defined, config, src, themes, resources, renderer]);

	// "class": React 18 gives a custom element its props as attributes by name
	return createElement("am5-chart", {
		ref: element,
		id: props.id,
		class: props.className,
		style: props.style,
	});
});
