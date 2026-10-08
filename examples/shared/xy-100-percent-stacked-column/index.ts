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
const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "year",
  renderer: am5xy.AxisRendererX.new(root, {})
}));

// The value axis works out the total of each category
const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  min: 0,                 // the scale runs from 0...
  max: 100,               // ...to 100 percent
  numberFormat: "#'%'",   // labels like "40%": the values are already percentages
  strictMinMax: true,     // exactly 0 to 100, with no extra room added above the stacks
  calculateTotals: true,
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
function makeSeries(name: string, fieldName: string) {
  // Each column shows its share of the category's total
  const series = chart.series.push(am5xy.ColumnSeries.new(root, {
    name: name,
    stacked: true, // each region's column sits on top of the previous one's
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: fieldName,
    valueYShow: "valueYTotalPercent",
    categoryXField: "year"
  }));

  // a label in the middle of each column piece with its share of the total
  series.bullets.push(() => {
    return am5.Bullet.new(root, {
      sprite: am5.Label.new(root, {
        text: "{valueYTotalPercent.formatNumber('#.#p')}", // e.g. "29.4%": one decimal at most
        fill: root.interfaceColors.get("alternativeText"),  // white in this theme, to read on the columns
        centerY: am5.p50,                                   // the label is centered on its spot both ways
        centerX: am5.p50,
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