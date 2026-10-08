import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element, drawn as SVG instead of canvas
// am5.renderToSVG(root) returns the chart as SVG markup
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv", {
  renderer: am5.SVGRenderer // set only when the root is created; the default draws on a canvas
});


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create chart
// https://www.amcharts.com/docs/v5/charts/xy-chart/
const chart = root.container.children.push(am5xy.XYChart.new(root, {}));


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "country",
  renderer: am5xy.AxisRendererX.new(root, {
    minGridDistance: 30 // grid lines and labels may be 30 px apart, so every country gets one
  })
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
const series = chart.series.push(am5xy.ColumnSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  categoryXField: "country",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{categoryX}: {valueY}" // the country and its value
  })
}));


// Set data
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Setting_data
const data = [
  { country: "USA", value: 2025 },
  { country: "China", value: 1882 },
  { country: "Japan", value: 1809 },
  { country: "Germany", value: 1322 },
  { country: "UK", value: 1122 },
  { country: "France", value: 1114 },
  { country: "India", value: 984 },
];

xAxis.data.setAll(data); // the axis takes its categories from the same rows
series.data.setAll(data);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000);
chart.appear(1000, 100);
