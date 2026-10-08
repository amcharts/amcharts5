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
  behavior: "zoomX" // drag across the plot to zoom in on that stretch of time
}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
// With groupData the axis shows hours as days, weeks or months when zoomed out
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/date-axis/#Dynamic_data_item_grouping
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  groupData: true,            // the trick: over 500 points in view are merged into longer periods
  maxDeviation: 0.2,          // the view can go a little past the first and last hour
  baseInterval: {             // one data point per hour
    timeUnit: "hour",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true,   // fainter grid lines between the labelled ones
    pan: "zoom"               // dragging along the axis labels zooms the dates
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 1, // can be moved or zoomed out up to a whole axis length past the data
  renderer: am5xy.AxisRendererY.new(root, {
    pan: "zoom"    // dragging along the axis labels zooms the values
  })
}));


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
const series = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Series",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  valueXField: "date",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{valueY}" // the hovered value; when grouped, the period's last one
  })
}));


// Add scrollbar
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
// above the plot: drag its ends to zoom, or its middle to move along the dates
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));


// Generate hourly data: two waves and a random walk from a fixed seed, so
// the chart is the same on every load
function generateData(count: number) {
  const data = [];
  const firstDate = new Date(2019, 0, 1).getTime();
  let seed = 1;
  let walk = 0;

  for (let i = 0; i < count; i++) {
    seed = (seed * 16807) % 2147483647; // the next number of a seeded random generator
    walk += seed / 2147483647 - 0.5;    // a random step between -0.5 and 0.5

    data.push({
      date: firstDate + i * 3600000, // one hour apart, in milliseconds
      value: Math.round(1000 + 200 * Math.sin(i / 4000) + 80 * Math.sin(i / 350) + walk * 4)
    });
  }

  return data;
}


// Set data
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Setting_data
series.data.setAll(generateData(50000));


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000);
chart.appear(1000, 100);