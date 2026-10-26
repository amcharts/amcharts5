import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import data from "./data.json";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create chart
// https://docs.amcharts.com/v5/charts/radar-chart/
const chart = root.container.children.push(am5radar.RadarChart.new(root, {
  innerRadius: am5.percent(50), // an empty middle half, so the inner rings are not tiny
  layout: root.verticalLayout   // the heat legend added below goes under the circle
}));


// Create axes and their renderers
// https://docs.amcharts.com/v5/charts/radar-chart/#adding-axes
// weekdays as rings, Sunday outermost
const yRenderer = am5radar.AxisRendererRadial.new(root, {
  visible: false,      // no axis line
  axisAngle: 90,       // the weekday labels run down from the center, at the bottom
  minGridDistance: 10, // a label on every ring, even thin ones
  inversed: true       // the first weekday on the outside instead of the inside
});

yRenderer.labels.template.setAll({
  textType: "circular", // each weekday is curved along its ring
  textAlign: "center",  // centered on the bottom of the ring
  fontSize: "0.8em",
  radius: -8            // pulled 8 px toward the center
});

yRenderer.grid.template.set("visible", false); // no ring lines: the cells show the rings

const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
  maxDeviation: 0, // no zooming or panning past the first or last weekday
  renderer: yRenderer,
  categoryField: "weekday"
}));

// hours around the circle
const xRenderer = am5radar.AxisRendererCircular.new(root, {
  visible: false,     // no outer circle line
  minGridDistance: 30 // labels may be 30 px apart (default 100), so most hours get one
});

xRenderer.labels.template.setAll({
  textType: "circular", // the hours curve along the circle...
  radius: 10            // ...10 px outside it
});

xRenderer.grid.template.set("visible", false); // no spokes between the hours

const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  renderer: xRenderer,
  categoryField: "hour"
}));


// Create series
// https://docs.amcharts.com/v5/charts/radar-chart/#adding-series
const series = chart.series.push(am5radar.RadarColumnSeries.new(root, {
  calculateAggregates: true,                      // works out the lowest and highest value for the colors
  stroke: root.interfaceColors.get("background"), // cell outlines in the background color, as gaps
  xAxis: xAxis,
  yAxis: yAxis,
  categoryXField: "hour",
  categoryYField: "weekday",
  valueField: "value"
}));

series.columns.template.setAll({
  tooltipText: "{categoryY}, {categoryX}: {value}", // weekday, hour: value
  strokeOpacity: 1,                                 // the outline shows...
  strokeWidth: 2,                                   // ...as a 2 px gap between cells
  width: am5.percent(100),                          // each cell fills its whole hour and weekday
  height: am5.percent(100)                          // (radar columns are 80% by default)
});


// Set up heat rules: the legend uses the same two colors
// https://docs.amcharts.com/v5/concepts/settings/heat-rules/
const minColor = am5.color(0xfffb77); // pale yellow for the lowest value...
const maxColor = am5.color(0xfe131a); // ...red for the highest

series.set("heatRules", [{
  target: series.columns.template,
  min: minColor,
  max: maxColor,
  dataField: "value",
  key: "fill"
}]);


// Set data
// https://docs.amcharts.com/v5/charts/radar-chart/#setting-data
series.data.setAll(data);

// both axes get their categories in order, Sunday first and midnight first
yAxis.data.setAll([
  { weekday: "Sunday" },
  { weekday: "Monday" },
  { weekday: "Tuesday" },
  { weekday: "Wednesday" },
  { weekday: "Thursday" },
  { weekday: "Friday" },
  { weekday: "Saturday" }
]);

xAxis.data.setAll([
  { hour: "12am" },
  { hour: "1am" },
  { hour: "2am" },
  { hour: "3am" },
  { hour: "4am" },
  { hour: "5am" },
  { hour: "6am" },
  { hour: "7am" },
  { hour: "8am" },
  { hour: "9am" },
  { hour: "10am" },
  { hour: "11am" },
  { hour: "12pm" },
  { hour: "1pm" },
  { hour: "2pm" },
  { hour: "3pm" },
  { hour: "4pm" },
  { hour: "5pm" },
  { hour: "6pm" },
  { hour: "7pm" },
  { hour: "8pm" },
  { hour: "9pm" },
  { hour: "10pm" },
  { hour: "11pm" }
]);


// Add heat legend
// https://docs.amcharts.com/v5/concepts/legend/heat-legend/
const heatLegend = chart.children.push(am5.HeatLegend.new(root, {
  orientation: "horizontal", // a bar under the circle
  startColor: minColor,      // the same colors as the heat rule
  endColor: maxColor
}));


// Give the legend the range of values once the series has worked it out
series.events.on("datavalidated", () => {
  heatLegend.set("startValue", series.getPrivate("valueLow"));
  heatLegend.set("endValue", series.getPrivate("valueHigh"));
});

// Show the hovered cell's value on the legend
series.columns.template.events.on("pointerover", (event) => {
  const dataItem = event.target.dataItem as am5.DataItem<am5radar.IRadarColumnSeriesDataItem> | undefined;
  if (dataItem) {
    heatLegend.showValue(dataItem.get("value", 0));
  }
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);