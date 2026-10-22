"use client";

// A client component: it has state, and gives the hook a function. It is
// rendered on the server too, where the hook draws nothing: the library is
// loaded in the browser only

import { useEffect, useState } from "react";
import { useAmChart } from "@amcharts/amcharts5-react";
import { buildChart, randomVisits, visits } from "./chart";

export function CodeChart() {
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
		<section>
			<h2>A chart written in code</h2>
			<button id="new-data" onClick={() => setData(randomVisits())}>New data</button>
			{/* The chart's element needs a height */}
			<div id="code-chart" ref={ref} style={{ height: 300 }} />
		</section>
	);
}
