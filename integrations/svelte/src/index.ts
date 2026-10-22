import type { HTMLAttributes } from "svelte/elements";
import type { ChartElement, IChartElementReadyEvent } from "@amcharts/amcharts5/element";

export { amChart, attachAmChart } from "./amChart.js";
export type { AmChartParameter, AttachAmChartOptions } from "./amChart.js";
export { amChartConfig, attachAmChartConfig } from "./amChartConfig.js";
export type { AmChartConfigParameter } from "./amChartConfig.js";

// <am5-chart> in a Svelte template, with its events: onready in Svelte 5,
// on:ready in Svelte 4 and in Svelte 5 components in legacy mode
declare module "svelte/elements" {
	interface SvelteHTMLElements {
		"am5-chart": Omit<HTMLAttributes<ChartElement>, "onerror" | "on:error"> & {
			onready?: (event: CustomEvent<IChartElementReadyEvent>) => void;
			onerror?: (event: CustomEvent<unknown>) => void;
			"on:ready"?: (event: CustomEvent<IChartElementReadyEvent>) => void;
			"on:error"?: (event: CustomEvent<unknown>) => void;
			config?: string;
			src?: string;
			renderer?: "canvas" | "svg";
		};
	}
}
