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


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
cursor.lineX.set("forceHidden", true); // no cursor lines, so the handle's line stands out...
cursor.lineY.set("forceHidden", true); // ...but the cursor still brings up the series tooltip


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: {             // one data point per day
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true,   // fainter grid lines between the labelled ones
    minGridDistance: 80       // at least 80 pixels between labelled grid lines
  })
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
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

// a light fill under the line
series.fills.template.setAll({
  fillOpacity: 0.2, // 20% opaque
  visible: true     // line series fills are hidden until made visible
});


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
  { date: "2024-01-02", value: 96 },
  { date: "2024-01-03", value: 89 },
  { date: "2024-01-04", value: 94 },
  { date: "2024-01-05", value: 96 },
  { date: "2024-01-06", value: 100 },
  { date: "2024-01-07", value: 108 },
  { date: "2024-01-08", value: 103 },
  { date: "2024-01-09", value: 118 },
  { date: "2024-01-10", value: 121 },
  { date: "2024-01-11", value: 128 },
  { date: "2024-01-12", value: 140 },
  { date: "2024-01-13", value: 156 },
  { date: "2024-01-14", value: 157 },
  { date: "2024-01-15", value: 159 },
  { date: "2024-01-16", value: 160 },
  { date: "2024-01-17", value: 169 },
  { date: "2024-01-18", value: 171 },
  { date: "2024-01-19", value: 191 },
  { date: "2024-01-20", value: 202 },
  { date: "2024-01-21", value: 199 },
  { date: "2024-01-22", value: 194 },
  { date: "2024-01-23", value: 189 },
  { date: "2024-01-24", value: 181 },
  { date: "2024-01-25", value: 183 },
  { date: "2024-01-26", value: 173 },
  { date: "2024-01-27", value: 177 },
  { date: "2024-01-28", value: 169 },
  { date: "2024-01-29", value: 160 },
  { date: "2024-01-30", value: 156 },
  { date: "2024-01-31", value: 141 },
  { date: "2024-02-01", value: 142 },
  { date: "2024-02-02", value: 127 },
  { date: "2024-02-03", value: 116 },
  { date: "2024-02-04", value: 122 },
  { date: "2024-02-05", value: 110 },
  { date: "2024-02-06", value: 107 },
  { date: "2024-02-07", value: 109 },
  { date: "2024-02-08", value: 106 },
  { date: "2024-02-09", value: 116 },
  { date: "2024-02-10", value: 125 },
  { date: "2024-02-11", value: 118 },
  { date: "2024-02-12", value: 127 },
  { date: "2024-02-13", value: 132 },
  { date: "2024-02-14", value: 140 },
  { date: "2024-02-15", value: 146 },
  { date: "2024-02-16", value: 163 },
  { date: "2024-02-17", value: 158 },
  { date: "2024-02-18", value: 164 },
  { date: "2024-02-19", value: 172 },
  { date: "2024-02-20", value: 179 },
  { date: "2024-02-21", value: 185 },
  { date: "2024-02-22", value: 188 },
  { date: "2024-02-23", value: 197 },
  { date: "2024-02-24", value: 212 },
  { date: "2024-02-25", value: 211 },
  { date: "2024-02-26", value: 217 },
  { date: "2024-02-27", value: 209 },
  { date: "2024-02-28", value: 201 },
  { date: "2024-02-29", value: 187 }
]);


// Add series range: the part of the series after the handle
// https://docs.amcharts.com/v5/charts/xy-chart/axes/axis-ranges/#series-axis-ranges
const rangeTime = new Date(2024, 0, 31).getTime();       // 31 January: JavaScript months count from 0
const rangeColor = root.interfaceColors.get("negative"); // red in this theme

const seriesRangeDataItem = xAxis.makeDataItem({
  value: rangeTime // the range starts at the handle's date; its end is set below
});
const seriesRange = series.createAxisRange(seriesRangeDataItem); // these dates get their own line and fill

if (seriesRange.strokes) {
  seriesRange.strokes.template.set("stroke", rangeColor); // the line turns red after the handle
}

// The fill is a pattern: slanted lines over the background color
if (seriesRange.fills) {
  seriesRange.fills.template.setAll({
    visible: true,  // shown, like the series' own fill
    opacity: 0.3,   // the whole patterned fill at 30%
    fillPattern: am5.LinePattern.new(root, {
      color: rangeColor,
      fill: root.interfaceColors.get("background"),
      angle: 45,     // lines slanted at 45 degrees
      strokeWidth: 2 // 2 pixels thick
    })
  });
}

// The range ends where the axis ends
xAxis.onPrivate("max", (max) => {
  seriesRangeDataItem.set("endValue", max);
});


// Add axis range: the line and the handle on it
// https://docs.amcharts.com/v5/charts/xy-chart/axes/axis-ranges/
const range = xAxis.createAxisRange(xAxis.makeDataItem({
  value: rangeTime
}));

const grid = range.get("grid");
if (grid) {
  grid.setAll({
    strokeOpacity: 1,                                  // solid, unlike the faint regular grid
    stroke: root.interfaceColors.get("primaryButton")  // the theme's button blue
  });
}

// the handle: a draggable button styled by the theme
const resizeButton = am5.Button.new(root, {
  themeTags: ["resize", "horizontal"], // the theme makes it draggable, with a sideways resize cursor
  icon: am5.Graphics.new(root, {
    themeTags: ["icon"]                // the theme draws two short grip lines on it
  })
});

// as the range's bullet, the handle is drawn at the range's date on the axis
range.set("bullet", am5xy.AxisBullet.new(root, {
  sprite: resizeButton
}));


// Keep the handle from being dragged vertically
resizeButton.adapters.add("y", () => {
  return 0;
});

// Keep the handle inside the plot area
resizeButton.adapters.add("x", (x) => {
  if (typeof x == "number") {
    return Math.max(0, Math.min(chart.plotContainer.width(), x));
  }
  return x;
});

// Move both ranges when the handle is dragged
resizeButton.events.on("dragged", () => {
  const position = xAxis.toAxisPosition(resizeButton.x() / chart.plotContainer.width()); // allows for zoom
  const value = xAxis.positionToValue(position); // the date under the handle

  range.set("value", value);
  seriesRangeDataItem.set("value", value);
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);