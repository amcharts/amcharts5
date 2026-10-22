import { useEffect, useState } from "react";
import { AmChart, useAmChart } from "@amcharts/amcharts5-react";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { buildChart, randomVisits, visits } from "./chart";
import { config } from "./config";

// A React island. With client:load it renders on the server too, where it
// draws nothing: the library is loaded in the browser only. Its imports in
// chart.ts need vite.ssr.noExternal in astro.config.mjs
export function Charts() {
	const [data, setData] = useState(visits);

	// useAmChart() gives buildChart() a new root in the element of `ref`, and
	// disposes it with the component. With no dependencies ([]) the chart is
	// made once. `result` is what buildChart() returned: here the function
	// that sets the chart's data
	const { ref, result: setChartData } = useAmChart(buildChart, []);

	// The data goes to the chart once it is made, and again when it changes,
	// without making the chart again
	useEffect(() => {
		if (setChartData) {
			setChartData(data);
		}
	}, [setChartData, data]);

	return (
		<>
			<section>
				<h2>A chart written in code</h2>
				<button id="new-data" onClick={() => setData(randomVisits())}>New data</button>
				{/* The chart's element needs a height */}
				<div id="code-chart" ref={ref} style={{ height: 300 }} />
			</section>
			<section>
				<h2>A chart from a JSON config</h2>
				{/* No chart code. Themes are not part of a config, so they are given as classes */}
				<AmChart id="config-chart" config={config} themes={[am5themes_Animated]} style={{ height: 300 }} />
			</section>
		</>
	);
}
