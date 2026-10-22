import type { Root } from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

export interface Visits {
	country: string;
	visits: number;
}

export const visits: Array<Visits> = [
	{ country: "Lithuania", visits: 501 },
	{ country: "Latvia", visits: 301 },
	{ country: "Estonia", visits: 201 },
	{ country: "Finland", visits: 165 },
];

// New values for the same countries, for the "New data" button
export function randomVisits(): Array<Visits> {
	return visits.map((item) => ({ country: item.country, visits: Math.round(100 + Math.random() * 500) }));
}

/**
 * Builds a column chart in the root it gets, as in any amCharts example.
 *
 * It returns a function that gives the chart new data. Calling that changes
 * the chart in place, with an animation, instead of making it again.
 */
export function buildChart(root: Root): (data: Array<Visits>) => void {
	root.setThemes([am5themes_Animated.new(root)]);

	const chart = root.container.children.push(am5xy.XYChart.new(root, {}));

	const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
		categoryField: "country",
		renderer: am5xy.AxisRendererX.new(root, {})
	}));

	const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
		min: 0,
		renderer: am5xy.AxisRendererY.new(root, {})
	}));

	const series = chart.series.push(am5xy.ColumnSeries.new(root, {
		xAxis: xAxis,
		yAxis: yAxis,
		categoryXField: "country",
		valueYField: "visits"
	}));

	return (data) => {
		xAxis.data.setAll(data);
		series.data.setAll(data);
	};
}
