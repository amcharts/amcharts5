import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
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
// https://docs.amcharts.com/v5/charts/radar-chart/
const chart = root.container.children.push(am5radar.RadarChart.new(root, {
  panX: false,    // dragging does not pan: the cursor uses the drag to zoom
  panY: false,
  wheelX: "panX", // a sideways wheel or trackpad swipe moves along the months...
  wheelY: "zoomX" // ...and the vertical wheel zooms in on them
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/radar-chart/#cursor
const cursor = chart.set("cursor", am5radar.RadarCursor.new(root, {
  behavior: "zoomX" // drag around the circle to zoom in on those months
}));
cursor.lineY.set("visible", false); // only the spoke to the hovered month, no circle at the pointer


// Create axes and their renderers
// https://docs.amcharts.com/v5/charts/radar-chart/#adding-axes
const xRenderer = am5radar.AxisRendererCircular.new(root, {});
xRenderer.labels.template.setAll({
  radius: 10 // month names 10 px outside the circle
});

const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  maxDeviation: 0, // no scrolling past January or December
  categoryField: "month",
  renderer: xRenderer,
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's month on the axis
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5radar.AxisRendererRadial.new(root, {})
}));


// Create series
// https://docs.amcharts.com/v5/charts/radar-chart/#adding-series
const series = chart.series.push(am5radar.RadarLineSeries.new(root, {
  name: "Rainfall",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "rainfall",
  categoryXField: "month",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{valueY} mm" // the hovered month's rainfall
  })
}));

// a dot on each month's value
series.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 5,
      fill: series.get("fill") // the line's own color
    })
  });
});


// Set data
// https://docs.amcharts.com/v5/charts/radar-chart/#setting-data
const data = [
  { month: "Jan", rainfall: 100 },
  { month: "Feb", rainfall: 85 },
  { month: "Mar", rainfall: 53 },
  { month: "Apr", rainfall: 68 },
  { month: "May", rainfall: 54 },
  { month: "Jun", rainfall: 16 },
  { month: "Jul", rainfall: 4 },
  { month: "Aug", rainfall: 6 },
  { month: "Sep", rainfall: 33 },
  { month: "Oct", rainfall: 101 },
  { month: "Nov", rainfall: 128 },
  { month: "Dec", rainfall: 127 }
];

series.data.setAll(data);
xAxis.data.setAll(data); // the axis takes its months from the same rows


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);