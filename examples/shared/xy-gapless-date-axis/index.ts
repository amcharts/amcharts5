import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
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
// https://docs.amcharts.com/v5/charts/xy-chart/
const chart = root.container.children.push(am5xy.XYChart.new(root, {
  panX: false,       // dragging the plot does not pan: the cursor uses the drag to zoom
  panY: false,
  wheelX: "panX",    // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX"    // ...and the vertical wheel zooms in on them
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  behavior: "zoomX" // drag across the plot to zoom in on those days
}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
// A gapless date axis leaves out the dates that have no data: here, weekends
// https://docs.amcharts.com/v5/charts/xy-chart/axes/gapless-date-axis/
const xRenderer = am5xy.AxisRendererX.new(root, {
  pan: "zoom",              // drag along the date labels to zoom in or out
  minorGridEnabled: true    // fainter grid lines between the labelled ones
});

// no labels at the very ends of the axis, where they would stick out past the plot
xRenderer.labels.template.setAll({
  minPosition: 0.01,        // hidden in the first 1% of the axis...
  maxPosition: 0.99         // ...and in the last 1%
});

const xAxis = chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
  maxDeviation: 0.5,          // panning can go up to half a view past the first or last day
  baseInterval: {             // one data point per day: weekend days are simply not in the data
    timeUnit: "day",
    count: 1
  },
  renderer: xRenderer,
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 1,            // panning can go past the highest or lowest value by up to a full view
  renderer: am5xy.AxisRendererY.new(root, {
    pan: "zoom"               // drag along the value labels to stretch or squeeze the scale
  })
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/
const series = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Series",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  valueXField: "date",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{valueY}" // the hovered day's value
  })
}));


// Add scrollbar
// https://docs.amcharts.com/v5/charts/xy-chart/scrollbars/
// above the plot: drag its ends to zoom, or its middle to move along the dates
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
// The dates in the data are strings: the processor turns them into timestamps
// https://docs.amcharts.com/v5/concepts/data/#parsing-dates
series.data.processor = am5.DataProcessor.new(root, {
  dateFormat: "yyyy-MM-dd",
  dateFields: ["date"]
});

series.data.setAll([
  { date: "2024-01-01", value: 102 },
  { date: "2024-01-02", value: 103 },
  { date: "2024-01-03", value: 102 },
  { date: "2024-01-04", value: 104 },
  { date: "2024-01-05", value: 112 },
  { date: "2024-01-08", value: 105 },
  { date: "2024-01-09", value: 110 },
  { date: "2024-01-10", value: 107 },
  { date: "2024-01-11", value: 106 },
  { date: "2024-01-12", value: 109 },
  { date: "2024-01-15", value: 107 },
  { date: "2024-01-16", value: 112 },
  { date: "2024-01-17", value: 108 },
  { date: "2024-01-18", value: 120 },
  { date: "2024-01-19", value: 127 },
  { date: "2024-01-22", value: 128 },
  { date: "2024-01-23", value: 133 },
  { date: "2024-01-24", value: 133 },
  { date: "2024-01-25", value: 135 },
  { date: "2024-01-26", value: 136 },
  { date: "2024-01-29", value: 137 },
  { date: "2024-01-30", value: 141 },
  { date: "2024-01-31", value: 136 },
  { date: "2024-02-01", value: 140 },
  { date: "2024-02-02", value: 144 },
  { date: "2024-02-05", value: 147 },
  { date: "2024-02-06", value: 157 },
  { date: "2024-02-07", value: 156 },
  { date: "2024-02-08", value: 152 },
  { date: "2024-02-09", value: 150 },
  { date: "2024-02-12", value: 147 },
  { date: "2024-02-13", value: 144 },
  { date: "2024-02-14", value: 145 },
  { date: "2024-02-15", value: 145 },
  { date: "2024-02-16", value: 153 },
  { date: "2024-02-19", value: 146 },
  { date: "2024-02-20", value: 144 },
  { date: "2024-02-21", value: 139 },
  { date: "2024-02-22", value: 138 },
  { date: "2024-02-23", value: 138 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);