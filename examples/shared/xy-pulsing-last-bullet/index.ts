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
  panX: true,      // drag the plot to move around it, sideways...
  panY: true,      // ...and up and down
  wheelX: "panX",  // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX"  // ...and the vertical wheel zooms in on them
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 0.3,          // can be dragged up to 30% of the view past the first or last day
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
  maxDeviation: 0.3, // the same up and down, past the highest and lowest values
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

series.strokes.template.set("strokeWidth", 2); // a 2 px line, thicker than the default 1 px


// Add bullet
// https://docs.amcharts.com/v5/charts/xy-chart/series/#bullets
// Hidden, unless a data row shows its own through "bulletSettings"
const bulletTemplate: am5.Template<am5.Container> = am5.Template.new({
  visible: false
});

series.bullets.push(() => {
  const container = am5.Container.new(root, {
    templateField: "bulletSettings" // the last row's bulletSettings make its bullet visible
  }, bulletTemplate);

  // The dot
  container.children.push(am5.Circle.new(root, {
    radius: 5,
    fill: series.get("fill") // the line's color
  }));

  // The pulse: a second dot that grows and fades for ever (loops: 0)
  container.children.push(am5.Circle.new(root, {
    radius: 5,                // starts the same size as the dot
    fill: series.get("fill"),
    // both run for a second at the same time, fast at first and slowing at the end:
    // the dot grows to four times its size while it fades out
    animations: [
      { key: "scale", from: 1, to: 4, duration: 1000, easing: "cubic", ease: "out", loops: 0 },
      { key: "opacity", from: 1, to: 0, duration: 1000, easing: "cubic", ease: "out", loops: 0 }
    ]
  }));

  return am5.Bullet.new(root, {
    sprite: container
  });
});


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
series.data.setAll([
  { date: new Date(2024, 5, 1).getTime(), value: 50 },
  { date: new Date(2024, 5, 2).getTime(), value: 53 },
  { date: new Date(2024, 5, 3).getTime(), value: 56 },
  { date: new Date(2024, 5, 4).getTime(), value: 52 },
  { date: new Date(2024, 5, 5).getTime(), value: 48 },
  { date: new Date(2024, 5, 6).getTime(), value: 47 },
  { date: new Date(2024, 5, 7).getTime(), value: 51 },
  { date: new Date(2024, 5, 8).getTime(), value: 55 },
  { date: new Date(2024, 5, 9).getTime(), value: 54 },
  { date: new Date(2024, 5, 10).getTime(), value: 58 },
  { date: new Date(2024, 5, 11).getTime(), value: 62 },
  { date: new Date(2024, 5, 12).getTime(), value: 60 },
  { date: new Date(2024, 5, 13).getTime(), value: 57 },
  { date: new Date(2024, 5, 14).getTime(), value: 61 },
  { date: new Date(2024, 5, 15).getTime(), value: 65, bulletSettings: { visible: true } }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);