import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);

// Set date fields, so that they are formatted as dates in tooltips
// https://docs.amcharts.com/v5/concepts/formatters/data-placeholders/#formatting-placeholders
root.dateFormatter.setAll({
  dateFormat: "MMM d",
  dateFields: ["valueX", "openValueX"]
});


// Create chart
// https://docs.amcharts.com/v5/charts/radar-chart/
const chart = root.container.children.push(am5radar.RadarChart.new(root, {
  innerRadius: am5.percent(30) // a hole in the middle, so the innermost ring is not squeezed to a dot
}));


// Create axes and their renderers: one year around the circle, a ring per category
// https://docs.amcharts.com/v5/charts/radar-chart/#adding-axes
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  min: new Date(2025, 0, 1).getTime(),         // the circle shows all of 2025 (months count from 0)...
  max: new Date(2026, 0, 1).getTime(),         // ...and closes where it started, on January 1
  baseInterval: { timeUnit: "day", count: 1 }, // the dates are whole days
  renderer: am5radar.AxisRendererCircular.new(root, {})
}));

const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "produce",
  renderer: am5radar.AxisRendererRadial.new(root, {
    minGridDistance: 20 // every ring keeps its label down to 20 px apart (default 40)
  })
}));


// Create series: a column goes from its open value to its value
// https://docs.amcharts.com/v5/charts/radar-chart/#adding-series
const series = chart.series.push(am5radar.RadarColumnSeries.new(root, {
  name: "In season",
  xAxis: xAxis,
  yAxis: yAxis,
  categoryYField: "produce",
  openValueXField: "start",
  valueXField: "end"
}));

series.columns.template.setAll({
  cornerRadius: 25,                                   // rounded ends on each season's band
  tooltipText: "{categoryY}: {openValueX} - {valueX}" // the dates use the formatter set above
});


// Set data: the processor turns the date strings into timestamps
// https://docs.amcharts.com/v5/concepts/data/#parsing-dates
series.data.processor = am5.DataProcessor.new(root, {
  dateFormat: "yyyy-MM-dd",
  dateFields: ["start", "end"]
});

series.data.setAll([
  { produce: "Leeks", start: "2025-09-15", end: "2025-12-31" },
  { produce: "Apples", start: "2025-08-15", end: "2025-11-15" },
  { produce: "Tomatoes", start: "2025-07-01", end: "2025-10-10" },
  { produce: "Strawberries", start: "2025-05-20", end: "2025-07-20" },
  { produce: "Asparagus", start: "2025-04-15", end: "2025-06-20" },
  { produce: "Spinach", start: "2025-03-01", end: "2025-05-31" },
  { produce: "Spinach", start: "2025-09-01", end: "2025-11-10" }
]);

// the axis lists each category once: Spinach has two seasons, so two columns on one ring
yAxis.data.setAll([
  { produce: "Leeks" },
  { produce: "Apples" },
  { produce: "Tomatoes" },
  { produce: "Strawberries" },
  { produce: "Asparagus" },
  { produce: "Spinach" }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);