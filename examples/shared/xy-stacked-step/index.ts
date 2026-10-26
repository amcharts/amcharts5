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
  panX: true,      // drag the plot to move around it, sideways...
  panY: true,      // ...and up and down
  wheelX: "panX",  // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX"  // ...and the vertical wheel zooms in on them
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: {             // one data point per day, so each step is a day wide
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true    // fainter grid lines between the labelled ones
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {
    minorGridEnabled: true, // fainter grid lines between the labelled ones
    minGridDistance: 70     // labelled lines at least 70 px apart (40 by default)
  })
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/step-line-series/
// a step line holds each value flat for the whole day, then jumps to the next one
const series1 = chart.series.push(am5xy.StepLineSeries.new(root, {
  name: "Series 1",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value1",
  valueXField: "date",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{name}: {valueY}" // the series name and the hovered day's value
  })
}));

// fill the area below the line
series1.fills.template.setAll({
  fillOpacity: 0.5, // half see-through
  visible: true     // line series fills are hidden by default
});

// The second series is stacked on top of the first one
// https://docs.amcharts.com/v5/charts/xy-chart/series/#stacked-series
const series2 = chart.series.push(am5xy.StepLineSeries.new(root, {
  name: "Series 2",
  stacked: true,
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value2",
  valueXField: "date",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{name}: {valueY}" // its own value, not the stacked total
  })
}));

// stacked, its fill covers only the band between the two lines
series2.fills.template.setAll({
  fillOpacity: 0.5,
  visible: true
});


// Add scrollbar
// https://docs.amcharts.com/v5/charts/xy-chart/scrollbars/
// above the plot: drag its ends to zoom, or its middle to move along the dates
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
const data = [
  { date: 1704067200000, value1: 102, value2: 21 },
  { date: 1704153600000, value1: 104, value2: 19 },
  { date: 1704240000000, value1: 103, value2: 18 },
  { date: 1704326400000, value1: 99, value2: 20 },
  { date: 1704412800000, value1: 102, value2: 21 },
  { date: 1704499200000, value1: 100, value2: 22 },
  { date: 1704585600000, value1: 101, value2: 22 },
  { date: 1704672000000, value1: 103, value2: 20 },
  { date: 1704758400000, value1: 105, value2: 21 },
  { date: 1704844800000, value1: 108, value2: 20 },
  { date: 1704931200000, value1: 112, value2: 21 },
  { date: 1705017600000, value1: 115, value2: 22 },
  { date: 1705104000000, value1: 120, value2: 23 },
  { date: 1705190400000, value1: 121, value2: 21 },
  { date: 1705276800000, value1: 118, value2: 20 },
  { date: 1705363200000, value1: 120, value2: 19 },
  { date: 1705449600000, value1: 118, value2: 20 },
  { date: 1705536000000, value1: 119, value2: 22 },
  { date: 1705622400000, value1: 122, value2: 23 },
  { date: 1705708800000, value1: 126, value2: 22 },
  { date: 1705795200000, value1: 125, value2: 21 },
  { date: 1705881600000, value1: 121, value2: 22 },
  { date: 1705968000000, value1: 116, value2: 22 },
  { date: 1706054400000, value1: 111, value2: 22 },
  { date: 1706140800000, value1: 115, value2: 24 },
  { date: 1706227200000, value1: 117, value2: 25 },
  { date: 1706313600000, value1: 117, value2: 25 },
  { date: 1706400000000, value1: 113, value2: 27 },
  { date: 1706486400000, value1: 115, value2: 29 },
  { date: 1706572800000, value1: 118, value2: 28 }
];

series1.data.setAll(data);
series2.data.setAll(data);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series1.appear(1000);
series2.appear(1000);
chart.appear(1000, 100);