import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create chart
// https://www.amcharts.com/docs/v5/charts/percent-charts/sliced-chart/
const chart = root.container.children.push(am5percent.SlicedChart.new(root, {
  layout: root.verticalLayout // stacks the funnel and the legend, so the legend goes below
}));


// Create series
// https://www.amcharts.com/docs/v5/charts/percent-charts/sliced-chart/funnel-series/
// one slice per data row, top to bottom, each as wide as its value is to the largest one,
// with a faint band narrowing to the next slice
const series = chart.series.push(am5percent.FunnelSeries.new(root, {
  alignLabels: false,      // labels sit in the middle of their slices, not in a column beside
  orientation: "vertical", // slices top to bottom; "horizontal" lays them left to right
  valueField: "value",
  categoryField: "category"
}));


// Set data
// https://www.amcharts.com/docs/v5/charts/percent-charts/sliced-chart/#Setting_data
series.data.setAll([
  { value: 10, category: "One" },
  { value: 9, category: "Two" },
  { value: 6, category: "Three" },
  { value: 5, category: "Four" },
  { value: 4, category: "Five" },
  { value: 3, category: "Six" },
  { value: 1, category: "Seven" }
]);


// Create legend
// https://www.amcharts.com/docs/v5/charts/percent-charts/legend-percent-series/
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.percent(50), // centered under the funnel
  x: am5.percent(50),
  marginTop: 15,            // some room between the funnel and the legend...
  marginBottom: 15          // ...and below it
}));

legend.data.setAll(series.dataItems);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear();
chart.appear(1000, 100);