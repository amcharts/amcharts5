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


// Generate random data
function generateChartData() {
  var chartData = [];
  var firstDate = new Date();
  firstDate.setDate(firstDate.getDate() - 1000);
  firstDate.setHours(0, 0, 0, 0);
  var value = 1200;
  for (var i = 0; i < 5000; i++) {
    var newDate = new Date(firstDate);
    newDate.setDate(newDate.getDate() + i);

    value += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
    let open = value + Math.round(Math.random() * 16 - 8);
    let low = Math.min(value, open) - Math.round(Math.random() * 5);
    let high = Math.max(value, open) + Math.round(Math.random() * 5);

    chartData.push({
      date: newDate.getTime(),
      value: value,
      open: open,
      low: low,
      high: high,
    });
  }
  return chartData;
}

const data = generateChartData();


// Create chart
// https://www.amcharts.com/docs/v5/charts/xy-chart/
const chart = root.container.children.push(am5xy.XYChart.new(root, {
  focusable: true,
  panX: true,
  panY: true,
  wheelX: "panX",
  wheelY: "zoomX"
}));


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  groupData: true,
  baseInterval: {
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {}),
  tooltip: am5.Tooltip.new(root, {
    themeTags: ["axis"],
    animationDuration: 300
  })
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

const color = root.interfaceColors.get("background");


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
const series = chart.series.push(am5xy.OHLCSeries.new(root, {
  fill: color,
  calculateAggregates: true,
  stroke: color,
  name: "MDXI",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  openValueYField: "open",
  lowValueYField: "low",
  highValueYField: "high",
  valueXField: "date",
  lowValueYGrouped: "low",
  highValueYGrouped: "high",
  openValueYGrouped: "open",
  valueYGrouped: "close"
}));
series.set("legendValueText", "open: {openValueY} low: {lowValueY} high: {highValueY} close: {valueY}");
series.set("legendRangeValueText", "{valueYClose}");
series.data.setAll(data);

const tooltip = am5.Tooltip.new(root, {
  pointerOrientation: "vertical"
});
tooltip.label.setAll({
  fill: root.interfaceColors.get("text"),
  text: "open: {openValueY}\nlow: {lowValueY}\nhigh: {highValueY}\nclose: {valueY}"
});

const tooltipBg = tooltip.get("background");
tooltipBg.set("strokeWidth", 2);
tooltipBg.adapters.add("stroke", (stroke, target) => {
  let dataItem = tooltip.dataItem as am5.DataItem<am5xy.IOHLCSeriesDataItem>;
  if (dataItem) {
    let column = dataItem.get("graphics");
    if (column) {
      return column.get("fill");
    }
  }
  return stroke;
});
series.set("tooltip", tooltip);


// Add cursor
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  xAxis: xAxis
}));
cursor.lineY.set("visible", false);


// Add scrollbar
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
const scrollbar = am5xy.XYChartScrollbar.new(root, {
  orientation: "horizontal",
  height: 50
});
chart.set("scrollbarX", scrollbar);


// Stack axes vertically
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Stacked_axes
chart.leftAxesContainer.set("layout", root.verticalLayout);

const sbxAxis = scrollbar.chart.xAxes.push(am5xy.DateAxis.new(root, {
  groupData: true,
  groupIntervals: [{
    timeUnit: "week",
    count: 1
  }],
  baseInterval: {
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    opposite: false,
    strokeOpacity: 0
  })
}));
const sbyAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

const sbseries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
  xAxis: sbxAxis,
  yAxis: sbyAxis,
  valueYField: "value",
  valueXField: "date"
}));
sbseries.data.setAll(data);


// Add legend
// https://www.amcharts.com/docs/v5/charts/xy-chart/legend-xy-series/
const legend = yAxis.axisHeader.children.push(
  am5.Legend.new(root, {})
);

legend.data.push(series);

legend.markers.template.setAll({
  width: 10
});

legend.markerRectangles.template.setAll({
  cornerRadiusTR: 0,
  cornerRadiusBR: 0,
  cornerRadiusTL: 0,
  cornerRadiusBL: 0
});


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/
series.appear(1000);
chart.appear(1000, 100);