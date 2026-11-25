import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_ResponsiveMax from "@amcharts/amcharts5/themes/ResponsiveMax";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root),
  am5themes_ResponsiveMax.new(root) // fits the chart to small screens
]);


// Create chart
// https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/
const chart = root.container.children.push(am5percent.PieChart.new(root, {
  layout: root.verticalLayout // stacks the pie and the legend added below it
}));


// Create series
// https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/#series
const series = chart.series.push(am5percent.PieSeries.new(root, {
  valueField: "value",
  categoryField: "category"
}));


// Set data
// https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/#setting-data
series.data.setAll([
  { value: 10, category: "One" },
  { value: 9, category: "Two" },
  { value: 6, category: "Three" },
  { value: 5, category: "Four" },
  { value: 4, category: "Five" },
  { value: 3, category: "Six" },
  { value: 1, category: "Seven" },
]);


// Create legend
// https://docs.amcharts.com/v5/charts/percent-charts/legend-percent-series/
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.percent(50), // the legend's middle...
  x: am5.percent(50),       // ...at the middle of the chart: centered
  marginTop: 15,            // some room between the pie and the legend
  marginBottom: 15,
}));

legend.data.setAll(series.dataItems); // one legend item per slice


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
chart.setAll({
  focusable: true, // Tab reaches the chart, and a screen reader names it
  ariaLabel: "Pie chart of seven categories, One to Seven, and their share of the total. Tab to the slices, then move between them with the up and down arrow keys; Enter pulls a slice out"
});
// the slices: one Tab stop, the up and down arrow keys step through them
series.slices.template.setAll({
  focusable: true,
  focusableGroup: "slices",
  hoverOnFocus: true, // the focused slice shows its tooltip
  ariaLabel: "{category}: {value}, {valuePercentTotal.formatNumber('0.0')}%"
});
// the legend: one Tab stop, after the slices
legend.itemContainers.template.setAll({
  focusableGroup: "legend",
  tabindexOrder: 10 // focus runs from low to high (0 if not set)
});


// Play initial series animation
// https://docs.amcharts.com/v5/concepts/animations/#animation-of-series
series.appear(1000, 100);