import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create chart
// https://docs.amcharts.com/v5/charts/percent-charts/sliced-chart/
const chart = root.container.children.push(am5percent.SlicedChart.new(root, {
  layout: root.verticalLayout // stacks the pyramid and the legend, so the legend goes below
}));


// Create series
// https://docs.amcharts.com/v5/charts/percent-charts/sliced-chart/pyramid-series/
// each slice's area is its share of the total; the labels line up in a column beside the
// pyramid, joined to their slices by ticks (alignLabels is on by default)
const series = chart.series.push(am5percent.PyramidSeries.new(root, {
  orientation: "vertical", // the tip at the top, the base at the bottom
  valueField: "value",
  categoryField: "category"
}));


// Set data: slices go from the tip down, so the smallest value comes first
// https://docs.amcharts.com/v5/charts/percent-charts/sliced-chart/#setting-data
series.data.setAll([
  { value: 3, category: "One" },
  { value: 3, category: "Two" },
  { value: 4, category: "Three" },
  { value: 5, category: "Four" },
  { value: 6, category: "Five" },
  { value: 9, category: "Six" },
  { value: 10, category: "Seven" }
]);


// Create legend
// https://docs.amcharts.com/v5/charts/percent-charts/legend-percent-series/
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.percent(50), // centered under the pyramid
  x: am5.percent(50),
  marginTop: 15,            // some room between the pyramid and the legend...
  marginBottom: 15          // ...and below it
}));

legend.data.setAll(series.dataItems);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear();
chart.appear(1000, 100);