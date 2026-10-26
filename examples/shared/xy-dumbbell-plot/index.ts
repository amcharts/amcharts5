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
  panX: true,        // drag the plot sideways to move along the names...
  panY: true,        // ...or up and down to move along the values
  wheelX: "panX",    // a sideways wheel or trackpad swipe moves along the names...
  wheelY: "zoomX"    // ...and the vertical wheel zooms in on them
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
cursor.lineY.set("visible", false); // only the vertical line that follows the names


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xRenderer = am5xy.AxisRendererX.new(root, {
  minGridDistance: 30,     // labels as close as 30 pixels (not 120), as the upright names allow
  minorGridEnabled: true   // fainter grid lines between the labelled ones
});

// upright labels, so the names fit side by side
xRenderer.labels.template.setAll({
  rotation: -90,     // turned to read from bottom to top
  centerY: am5.p50,  // each label centered on its name's column
  centerX: 0
});

const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  maxDeviation: 0.3,           // panning can go up to 30% of a view past the first or last name
  categoryField: "category",
  renderer: xRenderer,
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's name on the axis
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 0.3,           // panning can go up to 30% of a view past the highest or lowest value
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/
// A column from the open value to the close value, as thin as a line
const series = chart.series.push(am5xy.ColumnSeries.new(root, {
  name: "Series",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "close",
  openValueYField: "open",
  categoryXField: "category",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{openValueY} - {valueY}" // e.g. "104 - 108"
  })
}));

series.columns.template.set("width", 0.5); // half a pixel: a plain number is pixels, not a share


// Add bullets
// https://docs.amcharts.com/v5/charts/xy-chart/series/#bullets
// One at the open value, in the series' color
series.bullets.push(() => {
  return am5.Bullet.new(root, {
    locationY: 0,
    sprite: am5.Circle.new(root, {
      radius: 5, // a dot 10 pixels across
      fill: series.get("fill")
    })
  });
});

// One at the close value, in the next color of the chart's color set
const colors = chart.get("colors");
const closeColor = colors ? colors.getIndex(1) : series.get("fill");

series.bullets.push(() => {
  return am5.Bullet.new(root, {
    locationY: 1,
    sprite: am5.Circle.new(root, {
      radius: 5, // the same size as the open dot
      fill: closeColor
    })
  });
});


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
const data = [
  { category: "Raina", open: 104, close: 108 },
  { category: "Demarcus", open: 100, close: 110 },
  { category: "Carlo", open: 105, close: 109 },
  { category: "Jacinda", open: 102, close: 111 },
  { category: "Richie", open: 107, close: 113 },
  { category: "Antony", open: 104, close: 111 },
  { category: "Amada", open: 100, close: 112 },
  { category: "Idalia", open: 104, close: 109 },
  { category: "Janella", open: 102, close: 105 },
  { category: "Marla", open: 101, close: 109 },
  { category: "Curtis", open: 101, close: 112 },
  { category: "Shellie", open: 100, close: 104 },
  { category: "Meggan", open: 102, close: 112 },
  { category: "Nathanael", open: 105, close: 118 },
  { category: "Jannette", open: 104, close: 112 },
  { category: "Tyrell", open: 107, close: 118 },
  { category: "Sheena", open: 104, close: 112 },
  { category: "Maranda", open: 102, close: 107 },
  { category: "Briana", open: 99, close: 108 },
  { category: "Rosa", open: 96, close: 109 },
  { category: "Rosanne", open: 96, close: 106 },
  { category: "Herman", open: 99, close: 108 },
  { category: "Wayne", open: 95, close: 107 },
  { category: "Shamika", open: 94, close: 104 },
  { category: "Suk", open: 93, close: 105 },
  { category: "Clair", open: 89, close: 95 },
  { category: "Olivia", open: 87, close: 97 },
  { category: "Hans", open: 87, close: 96 },
  { category: "Glennie", open: 85, close: 93 }
];

xAxis.data.setAll(data);
series.data.setAll(data);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);