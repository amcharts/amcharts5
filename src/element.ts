export { ChartElement, IChartElementReadyEvent, IChartElementEventMap, defineChartElement } from "./.internal/element/ChartElement";

import { ChartElement, defineChartElement } from "./.internal/element/ChartElement";

// Loading this module is what makes <am5-chart> work, with npm and with script tags
defineChartElement();

declare global {
	interface HTMLElementTagNameMap {
		"am5-chart": ChartElement;
	}
}
