import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
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
// https://www.amcharts.com/docs/v5/charts/xy-chart/
const chart = root.container.children.push(am5xy.XYChart.new(root, {
  panX: false,       // dragging the plot does not pan: the cursor uses the drag to zoom
  panY: false,
  wheelX: "panX",    // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX"    // ...and the vertical wheel zooms in on them
}));


// Add cursor
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  behavior: "zoomX" // drag across the plot to zoom in on those days
}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 0,            // no scrolling past the first or last day
  baseInterval: {             // one data point per day, so each column is a day wide
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true    // fainter grid lines between the labelled ones
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  min: 0, // start at zero, so the column heights compare fairly
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
const series = chart.series.push(am5xy.ColumnSeries.new(root, {
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
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
// above the plot: drag its ends to zoom, or its middle to move along the dates
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));


// Set data
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Setting_data
// The dates in the data are strings: the processor turns them into timestamps
// https://www.amcharts.com/docs/v5/concepts/data/#Parsing_dates
series.data.processor = am5.DataProcessor.new(root, {
  dateFormat: "yyyy-MM-dd",
  dateFields: ["date"]
});

series.data.setAll([
  { date: "2024-01-01", value: 58 },
  { date: "2024-01-02", value: 57 },
  { date: "2024-01-03", value: 52 },
  { date: "2024-01-04", value: 49 },
  { date: "2024-01-05", value: 48 },
  { date: "2024-01-06", value: 57 },
  { date: "2024-01-07", value: 66 },
  { date: "2024-01-08", value: 62 },
  { date: "2024-01-09", value: 61 },
  { date: "2024-01-10", value: 68 },
  { date: "2024-01-11", value: 61 },
  { date: "2024-01-12", value: 57 },
  { date: "2024-01-13", value: 60 },
  { date: "2024-01-14", value: 56 },
  { date: "2024-01-15", value: 46 },
  { date: "2024-01-16", value: 56 },
  { date: "2024-01-17", value: 49 },
  { date: "2024-01-18", value: 50 },
  { date: "2024-01-19", value: 58 },
  { date: "2024-01-20", value: 47 },
  { date: "2024-01-21", value: 47 },
  { date: "2024-01-22", value: 41 },
  { date: "2024-01-23", value: 42 },
  { date: "2024-01-24", value: 41 },
  { date: "2024-01-25", value: 31 },
  { date: "2024-01-26", value: 35 },
  { date: "2024-01-27", value: 42 },
  { date: "2024-01-28", value: 52 },
  { date: "2024-01-29", value: 56 },
  { date: "2024-01-30", value: 58 }
]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000);
chart.appear(1000, 100);