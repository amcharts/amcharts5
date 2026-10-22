import { AmChart } from "@amcharts/amcharts5-react";
import { CodeChart } from "./CodeChart";
import { config } from "./config";

// A server component. It can render <AmChart> with a config, because a config
// is plain data. Themes are classes, and functions cannot be passed from a
// server component either: for those, use a client component, as CodeChart is
export default function Page() {
	return (
		<main>
			<h1>amCharts 5 with Next.js</h1>
			<CodeChart />
			<section>
				<h2>A chart from a JSON config</h2>
				<AmChart id="config-chart" config={config} style={{ height: 300 }} />
			</section>
		</main>
	);
}
