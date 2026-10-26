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
  panX: false,                // dragging the plot does not move it
  panY: false,
  wheelX: "panX",             // a sideways wheel or trackpad swipe moves along the years...
  wheelY: "zoomX",            // ...and the vertical wheel zooms in on them
  layout: root.verticalLayout // the legend added below goes under the plot, not over it
}));


// Data
const data = [
  { year: "2021", europe: 2.5, namerica: 2.5, asia: 2.1, lamerica: 1, meast: 0.8, africa: 0.4 },
  { year: "2022", europe: 2.6, namerica: 2.7, asia: 2.2, lamerica: 0.5, meast: 0.4, africa: 0.3 },
  { year: "2023", europe: 2.8, namerica: 2.9, asia: 2.4, lamerica: 0.3, meast: 0.9, africa: 0.5 }
];


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "year",
  renderer: am5xy.AxisRendererX.new(root, {})
}));

xAxis.data.setAll(data); // the axis takes its categories, the years, from the data

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  min: 0, // start at zero, so the stacks compare fairly
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/#stacked-series
function makeSeries(name: string, fieldName: string) {
  const series = chart.series.push(am5xy.ColumnSeries.new(root, {
    name: name,
    stacked: true, // the trick: each series' columns sit on top of the previous series'
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: fieldName,
    categoryXField: "year"
  }));

  series.columns.template.setAll({
    tooltipText: "{name}, {categoryX}: {valueY}", // the region, the year and its value
    tooltipY: am5.percent(10)                     // the tooltip points near the column's top
  });

  // Show the value in the middle of each column
  series.bullets.push(() => {
    return am5.Bullet.new(root, {
      sprite: am5.Label.new(root, {
        text: "{valueY}",
        fill: root.interfaceColors.get("alternativeText"), // white by default, readable on the colors
        centerY: am5.p50,  // the label is centered on its spot, vertically...
        centerX: am5.p50,  // ...and horizontally
        populateText: true // fills in {valueY} from the column's data
      })
    });
  });

  series.data.setAll(data);
}

// one series per region, stacked in this order from the bottom up
makeSeries("Europe", "europe");
makeSeries("North America", "namerica");
makeSeries("Asia", "asia");
makeSeries("Latin America", "lamerica");
makeSeries("Middle East", "meast");
makeSeries("Africa", "africa");


// Add legend
// https://docs.amcharts.com/v5/charts/xy-chart/legend-xy-series/
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.p50, // the legend's middle...
  x: am5.p50        // ...at the middle of the chart, so it is centered
}));

legend.data.setAll(chart.series.values);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
chart.series.each((series) => {
  series.appear(1000);
});
chart.appear(1000, 100);