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
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 0,            // no scrolling past the first or last day
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
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/smoothed-series/
// a curve through the points: SmoothedXLineSeries is made for data that runs left to right
const series = chart.series.push(am5xy.SmoothedXLineSeries.new(root, {
  name: "Series",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  valueXField: "date",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{valueY}" // the hovered day's value
  })
}));

// fill the area below the line
series.fills.template.setAll({
  visible: true,   // line series fills are hidden by default
  fillOpacity: 0.2 // pale, so the grid shows through
});

// a dot on every data point
series.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 4,
      stroke: root.interfaceColors.get("background"), // a ring in the background color...
      strokeWidth: 2,                                 // ...2 px wide, around each dot
      fill: series.get("fill")                        // the line's color
    })
  });
});


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
series.data.setAll([
  { date: 1704067200000, value: 97 },
  { date: 1704153600000, value: 98 },
  { date: 1704240000000, value: 96 },
  { date: 1704326400000, value: 98 },
  { date: 1704412800000, value: 99 },
  { date: 1704499200000, value: 98 },
  { date: 1704585600000, value: 101 },
  { date: 1704672000000, value: 98 },
  { date: 1704758400000, value: 98 },
  { date: 1704844800000, value: 94 },
  { date: 1704931200000, value: 94 },
  { date: 1705017600000, value: 90 },
  { date: 1705104000000, value: 91 },
  { date: 1705190400000, value: 88 },
  { date: 1705276800000, value: 85 },
  { date: 1705363200000, value: 90 },
  { date: 1705449600000, value: 92 },
  { date: 1705536000000, value: 88 },
  { date: 1705622400000, value: 84 },
  { date: 1705708800000, value: 79 },
  { date: 1705795200000, value: 80 },
  { date: 1705881600000, value: 79 },
  { date: 1705968000000, value: 82 },
  { date: 1706054400000, value: 85 },
  { date: 1706140800000, value: 80 },
  { date: 1706227200000, value: 80 },
  { date: 1706313600000, value: 79 },
  { date: 1706400000000, value: 79 },
  { date: 1706486400000, value: 77 },
  { date: 1706572800000, value: 77 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);