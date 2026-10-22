<script setup lang="ts">
import { shallowRef, useTemplateRef, watchEffect } from "vue";
import { AmChart, useAmChart } from "@amcharts/amcharts5-vue";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { buildChart, randomVisits, visits } from "./chart";
import { config } from "./config";

// A shallow ref: amCharts gets the plain objects, not reactive copies of them
const data = shallowRef(visits);

// useAmChart() gives buildChart() a new root in the element of the template
// ref "chart" when the component is mounted, and disposes it when it is
// unmounted. `result` is what buildChart() returned: here the function that
// sets the chart's data
const { result: setChartData } = useAmChart(useTemplateRef<HTMLElement>("chart"), buildChart);

// The data goes to the chart once it is made, and again when it changes,
// without making the chart again
watchEffect(() => {
	if (setChartData.value) {
		setChartData.value(data.value);
	}
});

// Themes are not part of a config, so they are given as classes
const themes = [am5themes_Animated];
</script>

<template>
	<main>
		<h1>amCharts 5 with Vue</h1>

		<section>
			<h2>A chart written in code</h2>
			<button id="new-data" @click="data = randomVisits()">New data</button>
			<!-- The chart's element needs a height -->
			<div id="code-chart" ref="chart" style="height: 300px"></div>
		</section>

		<section>
			<h2>A chart from a JSON config</h2>
			<!-- No chart code -->
			<AmChart id="config-chart" :config="config" :themes="themes" style="height: 300px" />
		</section>
	</main>
</template>
