<script lang="ts">
	import { attachAmChart, attachAmChartConfig } from '@amcharts/amcharts5-svelte';
	import type { Root } from '@amcharts/amcharts5';
	import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
	import { buildChart, randomVisits, visits, type Visits } from '../lib/chart';
	import { config } from '../lib/config';

	// Raw state: amCharts gets the plain objects, not reactive copies of them
	let data = $state.raw(visits);

	// What buildChart() returned: the function that sets the chart's data
	let setChartData = $state.raw<(data: Array<Visits>) => void>();

	// attachAmChart() gives this a new root in its element, and disposes the
	// root with the element. Attachments run in the browser only
	function setup(root: Root) {
		setChartData = buildChart(root);
	}

	// The data goes to the chart once it is made, and again when it changes,
	// without making the chart again
	$effect(() => {
		if (setChartData) {
			setChartData(data);
		}
	});

	let configChartType = $state<string>();
</script>

<svelte:head>
	<title>amCharts 5 with SvelteKit</title>
</svelte:head>

<main>
	<h1>amCharts 5 with SvelteKit</h1>

	<section>
		<h2>A chart written in code</h2>
		<button id="new-data" onclick={() => (data = randomVisits())}>New data</button>
		<!-- The chart's element needs a height -->
		<div id="code-chart" {@attach attachAmChart(setup)} style="height: 300px"></div>
	</section>

	<section>
		<h2>A chart from a JSON config</h2>
		<!-- No chart code. Themes are not part of a config, so they are given as classes -->
		<am5-chart
			id="config-chart"
			{@attach attachAmChartConfig({ config, themes: [am5themes_Animated] })}
			onready={(event) => (configChartType = event.detail.chart.className)}
			style="height: 300px"
		></am5-chart>
		{#if configChartType}
			<p>Built: {configChartType}</p>
		{/if}
	</section>
</main>
