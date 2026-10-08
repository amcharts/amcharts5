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

// Specify date fields, so that they are formatted accordingly in tooltips
// https://www.amcharts.com/docs/v5/concepts/formatters/data-placeholders/#Formatting_placeholders
root.dateFormatter.setAll({
  dateFormat: "MMM d", // e.g. "Jun 15"
  dateFields: ["valueX", "previousDate"]
});


// Create chart
// https://www.amcharts.com/docs/v5/charts/xy-chart/
const chart = root.container.children.push(am5xy.XYChart.new(root, {
  panX: true,        // drag the plot sideways to move along the dates...
  panY: true,        // ...or up and down to move along the values
  wheelX: "panX",    // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX"    // ...and the vertical wheel zooms in on them
}));


// Add cursor
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 0.3,          // panning can go up to 30% of a view past the first or last day
  baseInterval: {             // one data point per day
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true    // fainter grid lines between the labelled ones
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 0.3,          // panning can go up to 30% of a view past the highest or lowest value
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
// This period: its tooltip shows the previous period's value as well
const series = chart.series.push(am5xy.LineSeries.new(root, {
  name: "This period",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  valueXField: "date",
  tooltip: am5.Tooltip.new(root, { // {previousDate} and {previousValue} come from the same data row
    labelText: "{valueX}: {valueY}\n{previousDate}: {previousValue}"
  })
}));

series.strokes.template.set("strokeWidth", 2); // twice the default line width

// Make the tooltip see-through, so it does not hide the lines
const tooltip = series.get("tooltip");
if (tooltip) {
  const background = tooltip.get("background");
  if (background) {
    background.set("fillOpacity", 0.5);
  }
}

// Previous period: same dates and color, dashed line
const previousSeries = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Previous period",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "previousValue",
  valueXField: "date",
  stroke: series.get("stroke")
}));

previousSeries.strokes.template.setAll({
  strokeDasharray: [2, 2], // 2 pixel dashes with 2 pixel gaps
  strokeWidth: 2           // as thick as this period's line
});


// Set data
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Setting_data
// A row holds a day of this period and the matching day of the previous one
const data = [
  { date: new Date(2024, 5, 15).getTime(), value: 50, previousDate: new Date(2024, 5, 1).getTime(), previousValue: 48 },
  { date: new Date(2024, 5, 16).getTime(), value: 53, previousDate: new Date(2024, 5, 2).getTime(), previousValue: 51 },
  { date: new Date(2024, 5, 17).getTime(), value: 56, previousDate: new Date(2024, 5, 3).getTime(), previousValue: 58 },
  { date: new Date(2024, 5, 18).getTime(), value: 52, previousDate: new Date(2024, 5, 4).getTime(), previousValue: 53 },
  { date: new Date(2024, 5, 19).getTime(), value: 48, previousDate: new Date(2024, 5, 5).getTime(), previousValue: 44 },
  { date: new Date(2024, 5, 20).getTime(), value: 47, previousDate: new Date(2024, 5, 6).getTime(), previousValue: 42 },
  { date: new Date(2024, 5, 21).getTime(), value: 59, previousDate: new Date(2024, 5, 7).getTime(), previousValue: 55 },
  { date: new Date(2024, 5, 22).getTime(), value: 63, previousDate: new Date(2024, 5, 8).getTime(), previousValue: 56 },
  { date: new Date(2024, 5, 23).getTime(), value: 61, previousDate: new Date(2024, 5, 9).getTime(), previousValue: 60 },
  { date: new Date(2024, 5, 24).getTime(), value: 57, previousDate: new Date(2024, 5, 10).getTime(), previousValue: 59 },
  { date: new Date(2024, 5, 25).getTime(), value: 60, previousDate: new Date(2024, 5, 11).getTime(), previousValue: 54 },
  { date: new Date(2024, 5, 26).getTime(), value: 66, previousDate: new Date(2024, 5, 12).getTime(), previousValue: 57 },
  { date: new Date(2024, 5, 27).getTime(), value: 69, previousDate: new Date(2024, 5, 13).getTime(), previousValue: 62 },
  { date: new Date(2024, 5, 28).getTime(), value: 67, previousDate: new Date(2024, 5, 14).getTime(), previousValue: 64 }
];

series.data.setAll(data);
previousSeries.data.setAll(data);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000);
previousSeries.appear(1000);
chart.appear(1000, 100);