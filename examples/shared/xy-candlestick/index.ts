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
  panX: true,        // drag the plot sideways to move along the dates...
  panY: true,        // ...or up and down to move along the prices
  wheelX: "panX",    // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX"    // ...and the vertical wheel zooms in on them
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 1,            // panning can go past the first or last day by up to a full view
  baseInterval: {             // one candle per day
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true,   // fainter grid lines between the labelled ones
    minGridDistance: 80,      // at least 80 pixels between labelled grid lines
    pan: "zoom"               // drag along the date labels to zoom in or out
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 1,            // panning can go past the highest or lowest price by up to a full view
  renderer: am5xy.AxisRendererY.new(root, {
    pan: "zoom"               // drag along the price labels to stretch or squeeze the scale
  })
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/candlestick-series/
// OHLCSeries takes the same settings and draws bars instead of candles
const series = chart.series.push(am5xy.CandlestickSeries.new(root, {
  name: "MDXI",
  xAxis: xAxis,
  yAxis: yAxis,
  valueXField: "date",
  openValueYField: "open",  // each candle's body runs from the open price...
  highValueYField: "high",  // ...its wick from the high...
  lowValueYField: "low",    // ...to the low...
  valueYField: "close",     // ...and the body ends at the close: green if the day rose, red if it fell
  tooltip: am5.Tooltip.new(root, {
    pointerOrientation: "horizontal", // the tooltip sits beside the candle, not over it
    labelText: "open: {openValueY}\nhigh: {highValueY}\nlow: {lowValueY}\nclose: {valueY}"
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
  { date: "2024-01-01", open: 172.37, high: 176.55, low: 171.32, close: 173.38 },
  { date: "2024-01-02", open: 172.41, high: 174.3, low: 172.26, close: 172.62 },
  { date: "2024-01-03", open: 171.72, high: 172.36, low: 168, close: 170.37 },
  { date: "2024-01-04", open: 170.84, high: 175.75, low: 168.11, close: 173.05 },
  { date: "2024-01-05", open: 173.06, high: 179.64, low: 171.21, close: 176.45 },
  { date: "2024-01-06", open: 177.34, high: 181.87, low: 174.16, close: 180.68 },
  { date: "2024-01-07", open: 181.27, high: 182.67, low: 179.77, close: 180.75 },
  { date: "2024-01-08", open: 180.74, high: 186.96, low: 179.53, close: 184.39 },
  { date: "2024-01-09", open: 184.91, high: 188.9, low: 182.39, close: 186.68 },
  { date: "2024-01-10", open: 186.92, high: 189.62, low: 184.15, close: 189.33 },
  { date: "2024-01-11", open: 190.17, high: 191.59, low: 184.21, close: 186.8 },
  { date: "2024-01-12", open: 187.35, high: 188.84, low: 183.67, close: 186.97 },
  { date: "2024-01-13", open: 187.95, high: 190.25, low: 183.52, close: 184.34 },
  { date: "2024-01-14", open: 184.48, high: 186.39, low: 182.32, close: 183.75 },
  { date: "2024-01-15", open: 184.11, high: 187.55, low: 183.76, close: 184.61 },
  { date: "2024-01-16", open: 184, high: 187.04, low: 181.14, close: 186.79 },
  { date: "2024-01-17", open: 186.43, high: 188.47, low: 183.6, close: 187.26 },
  { date: "2024-01-18", open: 186.7, high: 188.34, low: 180.95, close: 183.08 },
  { date: "2024-01-19", open: 182.28, high: 186.31, low: 180.09, close: 186.09 },
  { date: "2024-01-20", open: 186.12, high: 188.93, low: 179.5, close: 182.75 },
  { date: "2024-01-21", open: 183.09, high: 183.74, low: 176.4, close: 178.46 },
  { date: "2024-01-22", open: 177.91, high: 179.43, low: 175.16, close: 175.75 },
  { date: "2024-01-23", open: 174.96, high: 177.37, low: 171.05, close: 174.37 },
  { date: "2024-01-24", open: 174.68, high: 177.38, low: 173.44, close: 175.74 },
  { date: "2024-01-25", open: 174.91, high: 176.91, low: 170.77, close: 172.94 },
  { date: "2024-01-26", open: 173.73, high: 174.63, low: 169.29, close: 169.54 },
  { date: "2024-01-27", open: 169.52, high: 174.34, low: 169.23, close: 171.07 },
  { date: "2024-01-28", open: 171.61, high: 176.93, low: 168.52, close: 175.36 },
  { date: "2024-01-29", open: 176.03, high: 176.22, low: 174.54, close: 175.39 },
  { date: "2024-01-30", open: 176.01, high: 177.3, low: 169.74, close: 172.51 },
  { date: "2024-01-31", open: 172.87, high: 174.65, low: 169.05, close: 171.78 },
  { date: "2024-02-01", open: 172.18, high: 174.4, low: 171.53, close: 173.39 },
  { date: "2024-02-02", open: 174.29, high: 178.27, low: 172.56, close: 176.98 },
  { date: "2024-02-03", open: 177.22, high: 180.32, low: 177.03, close: 179.98 },
  { date: "2024-02-04", open: 179.5, high: 185.67, low: 176.11, close: 182.77 },
  { date: "2024-02-05", open: 183.35, high: 184.5, low: 181.43, close: 182.74 },
  { date: "2024-02-06", open: 181.92, high: 182.6, low: 181.11, close: 181.51 },
  { date: "2024-02-07", open: 181.18, high: 182.21, low: 178.96, close: 181.3 },
  { date: "2024-02-08", open: 182.19, high: 186.79, low: 178.95, close: 186.53 },
  { date: "2024-02-09", open: 187.2, high: 192.01, low: 185.63, close: 188.95 },
  { date: "2024-02-10", open: 189.52, high: 196.07, low: 188.33, close: 193.17 },
  { date: "2024-02-11", open: 192.44, high: 192.65, low: 191.44, close: 191.52 },
  { date: "2024-02-12", open: 192.08, high: 192.83, low: 186.75, close: 188.26 },
  { date: "2024-02-13", open: 187.74, high: 194.08, low: 186.5, close: 191.6 },
  { date: "2024-02-14", open: 192.56, high: 193.44, low: 188.85, close: 190.92 },
  { date: "2024-02-15", open: 190.92, high: 197.84, low: 190.77, close: 195 },
  { date: "2024-02-16", open: 195.74, high: 202.62, low: 195.7, close: 199.83 },
  { date: "2024-02-17", open: 199.76, high: 201.55, low: 197.1, close: 197.3 },
  { date: "2024-02-18", open: 196.62, high: 200.15, low: 196.11, close: 199.68 },
  { date: "2024-02-19", open: 199.8, high: 204.91, low: 196.72, close: 203.36 },
  { date: "2024-02-20", open: 204.21, high: 204.23, low: 202.79, close: 202.92 },
  { date: "2024-02-21", open: 202.85, high: 210.09, low: 201.19, close: 207.06 },
  { date: "2024-02-22", open: 207.09, high: 211.8, low: 205.7, close: 209.12 },
  { date: "2024-02-23", open: 208.26, high: 210.53, low: 207.76, close: 209.96 },
  { date: "2024-02-24", open: 209.94, high: 210.7, low: 209.06, close: 210.68 },
  { date: "2024-02-25", open: 211.65, high: 215.3, low: 208.57, close: 212.55 },
  { date: "2024-02-26", open: 212.9, high: 215.87, low: 210.84, close: 212.45 },
  { date: "2024-02-27", open: 212.99, high: 213.29, low: 209.44, close: 212.33 },
  { date: "2024-02-28", open: 211.62, high: 212.35, low: 207.73, close: 208.54 },
  { date: "2024-02-29", open: 209.15, high: 211.04, low: 203.9, close: 205.11 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);