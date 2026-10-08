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
  panX: false,                  // dragging the plot does not pan it
  panY: false,
  wheelX: "panX",               // a sideways wheel or trackpad swipe moves along the years...
  wheelY: "zoomX",              // ...and the vertical wheel zooms in on them
  layout: root.verticalLayout   // the legend, added further down, goes below the plot
}));


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
// The cell locations leave a gap between the clusters
const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "year",
  renderer: am5xy.AxisRendererX.new(root, {
    cellStartLocation: 0.1,
    cellEndLocation: 0.9
  })
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
function makeSeries(name: string, fieldName: string) {
  // column series are clustered by default: each year's columns stand side by side
  const series = chart.series.push(am5xy.ColumnSeries.new(root, {
    name: name,
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: fieldName,
    categoryXField: "year"
  }));

  series.columns.template.setAll({
    tooltipText: "{name}, {categoryX}: {valueY}", // region, year and value
    width: am5.percent(90),                       // wider than the default 70%: thin gaps between columns
    tooltipY: 0                                   // the tooltip points at the column's top
  });

  // Show the value at the top of each column
  series.bullets.push(() => {
    return am5.Bullet.new(root, {
      locationY: 1, // at the column's top end
      sprite: am5.Label.new(root, {
        text: "{valueY}",
        fill: root.interfaceColors.get("alternativeText"), // white in this theme, to read on the column
        centerY: 0,                                         // the label hangs down from the top, inside the column
        centerX: am5.p50,                                   // centered across the column
        populateText: true                                  // fills in the {placeholder} from the data
      })
    });
  });
}

makeSeries("Europe", "europe");
makeSeries("North America", "namerica");
makeSeries("Asia", "asia");
makeSeries("Latin America", "lamerica");
makeSeries("Middle East", "meast");
makeSeries("Africa", "africa");


// Set data
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Setting_data
const data = [
  { year: "2021", europe: 2.5, namerica: 2.5, asia: 2.1, lamerica: 1, meast: 0.8, africa: 0.4 },
  { year: "2022", europe: 2.6, namerica: 2.7, asia: 2.2, lamerica: 0.5, meast: 0.4, africa: 0.3 },
  { year: "2023", europe: 2.8, namerica: 2.9, asia: 2.4, lamerica: 0.3, meast: 0.9, africa: 0.5 }
];

xAxis.data.setAll(data);
chart.series.each((series) => {
  series.data.setAll(data);
});


// Add legend
// https://www.amcharts.com/docs/v5/charts/xy-chart/legend-xy-series/
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.p50, // the legend's middle...
  x: am5.p50        // ...at the middle of the chart
}));

legend.data.setAll(chart.series.values);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.series.each((series) => {
  series.appear(1000);
});
chart.appear(1000, 100);