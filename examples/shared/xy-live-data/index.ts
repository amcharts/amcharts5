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
  panY: true,        // ...or up and down to move along the values
  wheelX: "panX",    // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX"    // ...and the vertical wheel zooms in on them
}));


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 0.5,          // panning can go up to half a view past the first or last day
  extraMin: -0.05,            // cuts 5% off the start, so the oldest point sits just out of view
  extraMax: 0.1,              // 10% of empty room after the newest point
  baseInterval: {             // one data point per day
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minGridDistance: 50       // labels as close as 50 pixels (not 120)
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

// The value axis follows the data range as it changes, without zooming
const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  autoZoom: false,
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  xAxis: xAxis // the cursor line snaps to the middle of each day
}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/
const series = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Series",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  valueXField: "date",
  minBulletDistance: 10, // the dots hide when points get closer than 10 pixels, as when zoomed out
  tooltip: am5.Tooltip.new(root, {
    pointerOrientation: "horizontal", // the tooltip sits beside the point, not over the line
    labelText: "{valueY}"             // the hovered day's value
  })
}));

// The bullet gets no location of its own, so that it follows its data item
// while the new point slides in
series.bullets.push(() => {
  return am5.Bullet.new(root, {
    locationX: undefined,
    sprite: am5.Circle.new(root, {
      radius: 4,               // a dot 8 pixels across...
      fill: series.get("fill") // ...in the line's color
    })
  });
});


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
series.data.setAll([
  { date: 1704067200000, value: 92 },
  { date: 1704153600000, value: 98 },
  { date: 1704240000000, value: 104 },
  { date: 1704326400000, value: 99 },
  { date: 1704412800000, value: 97 },
  { date: 1704499200000, value: 90 },
  { date: 1704585600000, value: 90 },
  { date: 1704672000000, value: 93 },
  { date: 1704758400000, value: 90 },
  { date: 1704844800000, value: 83 },
  { date: 1704931200000, value: 83 },
  { date: 1705017600000, value: 81 },
  { date: 1705104000000, value: 82 },
  { date: 1705190400000, value: 92 },
  { date: 1705276800000, value: 93 },
  { date: 1705363200000, value: 90 }
]);


// Add a new point and remove the oldest one
// https://docs.amcharts.com/v5/concepts/data/
function addData() {
  const lastDataItem = series.dataItems[series.dataItems.length - 1];
  const lastValue = lastDataItem.get("valueY", 0);
  const lastDate = lastDataItem.get("valueX", 0);

  // The new value is a random step away from the last one
  const newValue = lastValue + Math.round(Math.random() * 10 - 5);
  const newDate = am5.time.add(new Date(lastDate), "day", 1).getTime(); // the next day

  series.data.removeIndex(0); // the oldest point goes...
  series.data.push({          // ...and the new one is added at the end
    date: newDate,
    value: newValue
  });

  // Slide the new point in from the last one
  const newDataItem = series.dataItems[series.dataItems.length - 1];
  newDataItem.animate({
    key: "valueYWorking",   // the value the point is drawn at, not the one in the data
    to: newValue,
    from: lastValue,        // starts at the last point's height
    duration: 600,          // milliseconds, done before the next point arrives
    easing: am5.ease.linear // at a steady speed
  });

  const animation = newDataItem.animate({
    key: "locationX",       // where in its day the point sits: 0.5 is the middle
    to: 0.5,
    from: -0.5,             // starts in the middle of the previous day, where the last point is
    duration: 600
  });

  // Move the axis tooltip to the point's final place
  const tooltip = xAxis.get("tooltip");
  if (animation && tooltip && !tooltip.isHidden()) {
    animation.events.on("stopped", () => {
      xAxis.updateTooltip();
    });
  }
}

// Update data every second
setInterval(() => {
  addData();
}, 1000);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);