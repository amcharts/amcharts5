import { useEffect, useState } from "react";
import { AmChart, useAmChart } from "@amcharts/amcharts5-react";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import { buildChart, randomVisits, visits } from "./chart";
import { config } from "./config";
import { mapConfig } from "./map";

// A chart written in code
function CodeChart() {
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

// A chart from a JSON config: no chart code. Themes are not part of a config,
// so they are given as classes
function ConfigChart() {
	return (
		<section>
			<h2>A chart from a JSON config</h2>
			<AmChart id="config-chart" config={config} themes={[am5themes_Animated]} style={{ height: 300 }} />
		</section>
	);
}

// A map from a JSON config. The config names its geodata by its global name,
// "am5geodata_worldLow". With npm imports, that is not a global: give the
// imported geodata in `resources`, under that name
function MapConfigChart() {
	return (
		<section>
			<h2>A map from a JSON config</h2>
			<AmChart id="map-chart" config={mapConfig} resources={{ am5geodata_worldLow }} themes={[am5themes_Animated]} style={{ height: 400 }} />
		</section>
	);
}

export function App() {
	return (
		<main>
			<h1>amCharts 5 with React</h1>
			<CodeChart />
			<ConfigChart />
			<MapConfigChart />
		</main>
	);
}
