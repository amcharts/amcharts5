import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import data from "./data.json";


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
  panX: true,       // drag the plot to move along the dates...
  panY: false,      // ...but not up and down
  wheelX: "panX",   // a sideways wheel or trackpad swipe moves along the dates too...
  wheelY: "zoomX",  // ...and the vertical wheel zooms in on them
  colors: am5.ColorSet.new(root, {
    step: 2         // every second color of the set, so neighboring series differ more
  })
}));


// Add cursor
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
chart.set("cursor", am5xy.XYCursor.new(root, {}));


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
// a gapless date axis leaves out the days with no data, so the lines have no gaps
const dateAxis = chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
  baseInterval: {             // one data point per day
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true    // fainter grid lines between the labelled ones
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

// The price axis shows percent change, so its labels get a percent sign
const valueAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  height: am5.percent(70), // the top 70% of the plot, for the prices
  numberFormat: "#'%'",
  renderer: am5xy.AxisRendererY.new(root, {
    inside: true           // labels inside the plot, not in a column beside it
  })
}));

valueAxis.get("renderer").labels.template.setAll({
  centerY: am5.percent(100), // each label sits just above its grid line
  maxPosition: 0.98          // none at the very top, where it would stick out of the panel
});

const volumeAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  height: am5.percent(30), // the bottom 30%, for the volume
  layer: 5,                // on a higher layer, so its labels are drawn over the columns
  renderer: am5xy.AxisRendererY.new(root, {
    inside: true
  })
}));

volumeAxis.get("renderer").labels.template.setAll({
  centerY: am5.percent(100),
  maxPosition: 0.98
});

volumeAxis.axisHeader.set("paddingTop", 10); // a gap above the volume legend, between the two panels


// Stack axes vertically
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Stacked_axes
chart.leftAxesContainer.set("layout", root.verticalLayout);


// Add series
// Each price is shown as percent change from the first value in the zoomed range
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Display_fields
function makeValueSeries(name: string, fieldName: string) {
  return chart.series.push(am5xy.LineSeries.new(root, {
    name: name,
    xAxis: dateAxis,
    yAxis: valueAxis,
    valueYField: fieldName,
    valueXField: "date",
    calculateAggregates: true,                   // works out the change values the line plots
    valueYShow: "valueYChangeSelectionPercent",
    legendValueText: "{valueY}",                 // the legend shows the hovered day's price
    tooltip: am5.Tooltip.new(root, {
      pointerOrientation: "horizontal", // sits beside the point, pointing left or right
      // the price, then its signed change since the start of the zoomed range
      labelText: "{name}: {valueY} ({valueYChangeSelectionPercent.formatNumber('+#.0p|#.0p|0p')})"
    })
  }));
}

const valueSeries1 = makeValueSeries("XTD", "price1");
const valueSeries2 = makeValueSeries("BTD", "price2");

// plain volume columns in the bottom panel
const volumeSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
  name: "Volume",
  xAxis: dateAxis,
  yAxis: volumeAxis,
  valueYField: "quantity",
  valueXField: "date",
  legendValueText: "{valueY}",     // the legend shows the hovered day's volume
  tooltip: am5.Tooltip.new(root, {
    labelText: "{name}: {valueY}"
  })
}));


// Set data
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Setting_data
// all three series read their own fields from the same rows
valueSeries1.data.setAll(data);
valueSeries2.data.setAll(data);
volumeSeries.data.setAll(data);


// Add legends to axis headers
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-headers/
const valueLegend = valueAxis.axisHeader.children.push(am5.Legend.new(root, {
  useDefaultMarker: true // plain square markers, not small copies of the series
}));
valueLegend.data.setAll([valueSeries1, valueSeries2]);

const volumeLegend = volumeAxis.axisHeader.children.push(am5.Legend.new(root, {
  useDefaultMarker: true
}));
volumeLegend.data.setAll([volumeSeries]);


// Add scrollbar
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
// above the plot: drag its ends to zoom, or its middle to move along the dates
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
valueSeries1.appear(1000);
valueSeries2.appear(1000);
volumeSeries.appear(1000);
chart.appear(1000, 100);