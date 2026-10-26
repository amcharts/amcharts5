import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);

// Set global number format
// https://docs.amcharts.com/v5/concepts/formatters/formatting-numbers/
root.numberFormatter.set("numberFormat", "#,###.00");


// Create a stock chart
// https://docs.amcharts.com/v5/charts/stock/#instantiating-the-chart
const stockChart = root.container.children.push(am5stock.StockChart.new(root, {}));


// Create a main stock panel (chart)
// https://docs.amcharts.com/v5/charts/stock/
const mainPanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
  wheelY: "zoomX", // the mouse wheel zooms in on the minutes
  panX: true,      // dragging the plot moves along the minutes...
  panY: true       // ...and up or down the price scale
}));


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {
    pan: "zoom" // drag the price labels up or down to stretch or squeeze the scale
  }),
  tooltip: am5.Tooltip.new(root, {}), // shows the cursor's price on the axis...
  extraTooltipPrecision: 2            // ...with two more decimals than the labels
}));

const dateAxis = mainPanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
  baseInterval: { // one candle per minute
    timeUnit: "minute",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true // fainter grid lines between the labelled ones
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's time on the axis
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/
const valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
  name: "AMCH",
  valueXField: "Date",
  valueYField: "Close",
  highValueYField: "High",
  lowValueYField: "Low",
  openValueYField: "Open",
  xAxis: dateAxis,
  yAxis: valueAxis,
  // the hovered candle's prices in the legend
  legendValueText: "open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]",
  legendRangeValueText: "" // no values while the pointer is off the plot
}));


// Set main value series
// https://docs.amcharts.com/v5/charts/stock/#setting-main-series
stockChart.set("stockSeries", valueSeries);


// Add a stock legend
// https://docs.amcharts.com/v5/charts/stock/stock-legend/
// in the plot container, so it sits over the top left of the plot
const valueLegend = mainPanel.plotContainer.children.push(am5stock.StockLegend.new(root, {
  stockChart: stockChart
}));

valueLegend.data.setAll([valueSeries]);


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
mainPanel.set("cursor", am5xy.XYCursor.new(root, {
  yAxis: valueAxis,
  xAxis: dateAxis,
  snapToSeries: [valueSeries], // the horizontal line jumps to the close of the candle...
  snapToSeriesBy: "y!"         // ...at the minute under the pointer
}));


// Set data: 60 candles, one per minute
const data = [
  { Date: 1736173800000, Open: 1200, High: 1203.46, Low: 1197.08, Close: 1202.94 },
  { Date: 1736173860000, Open: 1202.94, High: 1203.16, Low: 1192.44, Close: 1192.44 },
  { Date: 1736173920000, Open: 1192.44, High: 1201.14, Low: 1191.79, Close: 1201.14 },
  { Date: 1736173980000, Open: 1201.14, High: 1201.14, Low: 1191.12, Close: 1191.12 },
  { Date: 1736174040000, Open: 1191.12, High: 1191.54, Low: 1184.79, Close: 1184.79 },
  { Date: 1736174100000, Open: 1184.79, High: 1187.65, Low: 1183.76, Close: 1185.81 },
  { Date: 1736174160000, Open: 1185.81, High: 1186.22, Low: 1178.6, Close: 1178.6 },
  { Date: 1736174220000, Open: 1178.6, High: 1186.49, Low: 1176.8, Close: 1185.67 },
  { Date: 1736174280000, Open: 1185.67, High: 1194.28, Low: 1185.67, Close: 1194.28 },
  { Date: 1736174340000, Open: 1194.28, High: 1196.32, Low: 1189.19, Close: 1190.12 },
  { Date: 1736174400000, Open: 1190.12, High: 1198.44, Low: 1188.7, Close: 1192.88 },
  { Date: 1736174460000, Open: 1192.88, High: 1200.61, Low: 1190.9, Close: 1199.84 },
  { Date: 1736174520000, Open: 1199.84, High: 1199.84, Low: 1194.35, Close: 1197.06 },
  { Date: 1736174580000, Open: 1197.06, High: 1198.72, Low: 1189.68, Close: 1191.5 },
  { Date: 1736174640000, Open: 1191.5, High: 1195.55, Low: 1190.68, Close: 1191.49 },
  { Date: 1736174700000, Open: 1191.49, High: 1194.48, Low: 1187.81, Close: 1187.81 },
  { Date: 1736174760000, Open: 1187.81, High: 1187.81, Low: 1182.6, Close: 1186.33 },
  { Date: 1736174820000, Open: 1186.33, High: 1186.33, Low: 1177.97, Close: 1179.8 },
  { Date: 1736174880000, Open: 1179.8, High: 1181.07, Low: 1172.38, Close: 1172.38 },
  { Date: 1736174940000, Open: 1172.38, High: 1173.79, Low: 1168.36, Close: 1170.08 },
  { Date: 1736175000000, Open: 1170.08, High: 1174.66, Low: 1168.71, Close: 1174.66 },
  { Date: 1736175060000, Open: 1174.66, High: 1178.42, Low: 1173.04, Close: 1176.9 },
  { Date: 1736175120000, Open: 1176.9, High: 1176.9, Low: 1170.44, Close: 1171.66 },
  { Date: 1736175180000, Open: 1171.66, High: 1171.66, Low: 1159.67, Close: 1167.69 },
  { Date: 1736175240000, Open: 1167.69, High: 1168.12, Low: 1164.32, Close: 1166.78 },
  { Date: 1736175300000, Open: 1166.78, High: 1173.11, Low: 1166.32, Close: 1168.92 },
  { Date: 1736175360000, Open: 1168.92, High: 1173.1, Low: 1165.3, Close: 1165.92 },
  { Date: 1736175420000, Open: 1165.92, High: 1169.31, Low: 1162.25, Close: 1163.07 },
  { Date: 1736175480000, Open: 1163.07, High: 1165.3, Low: 1161.65, Close: 1162.6 },
  { Date: 1736175540000, Open: 1162.6, High: 1166.06, Low: 1161.76, Close: 1165.11 },
  { Date: 1736175600000, Open: 1165.11, High: 1167.38, Low: 1163.78, Close: 1163.78 },
  { Date: 1736175660000, Open: 1163.78, High: 1164.07, Low: 1158, Close: 1158 },
  { Date: 1736175720000, Open: 1158, High: 1162.19, Low: 1158, Close: 1158.95 },
  { Date: 1736175780000, Open: 1158.95, High: 1159.61, Low: 1154.92, Close: 1159.05 },
  { Date: 1736175840000, Open: 1159.05, High: 1162.69, Low: 1157.36, Close: 1161.47 },
  { Date: 1736175900000, Open: 1161.47, High: 1162.39, Low: 1155.42, Close: 1157.74 },
  { Date: 1736175960000, Open: 1157.74, High: 1157.74, Low: 1153.31, Close: 1154.03 },
  { Date: 1736176020000, Open: 1154.03, High: 1154.25, Low: 1148.35, Close: 1152.6 },
  { Date: 1736176080000, Open: 1152.6, High: 1156.46, Low: 1151.49, Close: 1153.55 },
  { Date: 1736176140000, Open: 1153.55, High: 1154.98, Low: 1140.7, Close: 1141.96 },
  { Date: 1736176200000, Open: 1141.96, High: 1144.25, Low: 1134.8, Close: 1134.8 },
  { Date: 1736176260000, Open: 1134.8, High: 1146.09, Low: 1134.44, Close: 1146.09 },
  { Date: 1736176320000, Open: 1146.09, High: 1147.4, Low: 1130.41, Close: 1130.69 },
  { Date: 1736176380000, Open: 1130.69, High: 1133.69, Low: 1129.29, Close: 1132.44 },
  { Date: 1736176440000, Open: 1132.44, High: 1133.58, Low: 1128.31, Close: 1129.35 },
  { Date: 1736176500000, Open: 1129.35, High: 1135.03, Low: 1129.06, Close: 1134.73 },
  { Date: 1736176560000, Open: 1134.73, High: 1140.71, Low: 1134.73, Close: 1140.71 },
  { Date: 1736176620000, Open: 1140.71, High: 1143.03, Low: 1138.83, Close: 1141.63 },
  { Date: 1736176680000, Open: 1141.63, High: 1141.63, Low: 1135.02, Close: 1135.02 },
  { Date: 1736176740000, Open: 1135.02, High: 1135.16, Low: 1129.66, Close: 1129.66 },
  { Date: 1736176800000, Open: 1129.66, High: 1131.73, Low: 1122.89, Close: 1125.39 },
  { Date: 1736176860000, Open: 1125.39, High: 1125.39, Low: 1119.34, Close: 1119.34 },
  { Date: 1736176920000, Open: 1119.34, High: 1126.07, Low: 1117.81, Close: 1125.62 },
  { Date: 1736176980000, Open: 1125.62, High: 1132.83, Low: 1125.62, Close: 1132.83 },
  { Date: 1736177040000, Open: 1132.83, High: 1133.91, Low: 1128.11, Close: 1130.77 },
  { Date: 1736177100000, Open: 1130.77, High: 1135.19, Low: 1130.02, Close: 1131.76 },
  { Date: 1736177160000, Open: 1131.76, High: 1133.4, Low: 1124.67, Close: 1132.92 },
  { Date: 1736177220000, Open: 1132.92, High: 1134.9, Low: 1126.52, Close: 1126.52 },
  { Date: 1736177280000, Open: 1126.52, High: 1128.29, Low: 1125.21, Close: 1128.29 },
  { Date: 1736177340000, Open: 1128.29, High: 1128.44, Low: 1122.95, Close: 1124.51 }
];

// The sample data is fixed: move it in time, so that its last candle is the current minute
const minute = 60000;
const shift = Math.floor(Date.now() / minute) * minute - data[data.length - 1].Date;
am5.array.each(data, (item) => {
  item.Date += shift;
});

valueSeries.data.setAll(data);


// Add an axis range that shows the current value
// https://docs.amcharts.com/v5/charts/xy-chart/axes/axis-ranges/
const currentValueDataItem = valueAxis.createAxisRange(valueAxis.makeDataItem({
  value: data[data.length - 1].Close
}));

// the range's label on the axis: contrasting text on a box that showCurrentValue() colors
const currentLabel = currentValueDataItem.get("label");
if (currentLabel) {
  currentLabel.setAll({
    fill: root.interfaceColors.get("alternativeText"),
    background: am5.Rectangle.new(root, {})
  });
}

// and its grid line across the plot, dashed
const currentGrid = currentValueDataItem.get("grid");
if (currentGrid) {
  currentGrid.setAll({
    strokeOpacity: 0.5,
    strokeDasharray: [2, 5] // 2 px dashes, 5 px gaps
  });
}


// Update data every second
// https://docs.amcharts.com/v5/concepts/data/
let candle = data[data.length - 1];

setInterval(() => {
  const date = Date.now();

  // A random step from the last price
  const value = am5.math.round(candle.Close + (Math.random() - 0.5) * 4, 2);

  // the main series, which the toolbar's series type switcher may have replaced
  const series = stockChart.get("stockSeries");
  if (!series) {
    return;
  }

  if (am5.time.checkChange(date, candle.Date, "minute")) {
    // A new minute has started: add a candle
    candle = {
      Date: date,
      Open: value,
      High: value,
      Low: value,
      Close: value
    };
    series.data.push(candle);
  }
  else {
    // Update the last candle
    candle = {
      Date: candle.Date,
      Open: candle.Open,
      High: Math.max(candle.High, value),
      Low: Math.min(candle.Low, value),
      Close: value
    };
    series.data.setIndex(series.data.length - 1, candle); // replaces the last row
  }

  showCurrentValue();
}, 1000);

// Moves the range to the last price and colors its label by the direction of the candle
function showCurrentValue() {
  currentValueDataItem.animate({
    key: "value",
    to: candle.Close,
    duration: 500,                       // slides to the new price in half a second...
    easing: am5.ease.out(am5.ease.cubic) // ...slowing down as it arrives
  });

  if (currentLabel) {
    currentLabel.set("text", root.numberFormatter.format(candle.Close));

    const background = currentLabel.get("background");
    if (background) {
      background.set("fill", root.interfaceColors.get(candle.Close < candle.Open ? "negative" : "positive"));
    }
  }
}

showCurrentValue();


// Set up series type switcher
// https://docs.amcharts.com/v5/charts/stock/toolbar/series-type-control/
const seriesSwitcher = am5stock.SeriesTypeControl.new(root, {
  stockChart: stockChart
});

// a pick from the list (line, candles, hollow candles or OHLC) swaps the main series
seriesSwitcher.events.on("selected", (ev) => {
  if (!am5.type.isString(ev.item)) {
    setSeriesType(ev.item.id);
  }
});

// Replaces the main series with one of another type
function setSeriesType(seriesType: string) {
  const currentSeries = stockChart.get("stockSeries");
  if (!currentSeries) {
    return;
  }

  // The new series takes over the settings of the current one
  const settings = {
    name: currentSeries.get("name"),
    clustered: false,
    valueXField: currentSeries.get("valueXField"),
    valueYField: currentSeries.get("valueYField"),
    highValueYField: currentSeries.get("highValueYField"),
    lowValueYField: currentSeries.get("lowValueYField"),
    openValueYField: currentSeries.get("openValueYField"),
    calculateAggregates: currentSeries.get("calculateAggregates"),
    xAxis: currentSeries.get("xAxis"),
    yAxis: currentSeries.get("yAxis"),
    legendValueText: currentSeries.get("legendValueText"),
    legendRangeValueText: currentSeries.get("legendRangeValueText"),
    stroke: currentSeries.get("stroke"),
    fill: currentSeries.get("fill")
  };

  // Create the new series
  let series: am5xy.XYSeries;
  if (seriesType == "line") {
    series = am5xy.LineSeries.new(root, settings);
  }
  else if (seriesType == "ohlc") {
    series = am5xy.OHLCSeries.new(root, settings);
  }
  else {
    const candlesticks = am5xy.CandlestickSeries.new(root, settings);
    if (seriesType == "procandlestick") {
      // hollow when the close is above the open, colored by the change from the day before
      candlesticks.columns.template.set("themeTags", ["autocolor", "pro"]);
    }
    series = candlesticks;
  }

  // Put it in place of the current one
  const seriesData = currentSeries.data.values;
  mainPanel.series.removeValue(currentSeries);
  mainPanel.series.push(series);
  series.data.setAll(seriesData);
  stockChart.set("stockSeries", series);

  valueLegend.data.removeValue(currentSeries);
  valueLegend.data.insertIndex(0, series);

  // the cursor snaps to the new series
  const cursor = mainPanel.get("cursor");
  if (cursor) {
    cursor.set("snapToSeries", [series]);
  }
}


// Add stock toolbar
// https://docs.amcharts.com/v5/charts/stock/toolbar/
am5stock.StockToolbar.new(root, {
  container: document.getElementById("chartcontrols")!, // the div above the chart that holds the toolbar
  stockChart: stockChart,
  controls: [
    // a searchable list of indicators, such as moving averages or RSI
    am5stock.IndicatorControl.new(root, {
      stockChart: stockChart,
      legend: valueLegend // indicators drawn on the price panel get an entry in this legend
    }),
    // from and to dates to zoom to
    am5stock.DateRangeSelector.new(root, {
      stockChart: stockChart
    }),
    // buttons for 5 days, 1 month and so on, up to all the data
    am5stock.PeriodSelector.new(root, {
      stockChart: stockChart
    }),
    seriesSwitcher,
    // tools for drawing lines, shapes and labels on the chart
    am5stock.DrawingControl.new(root, {
      stockChart: stockChart
    }),
    // removes all drawings and indicators
    am5stock.ResetControl.new(root, {
      stockChart: stockChart
    }),
    // the price scale (regular, percent change or logarithmic) and saving drawings
    am5stock.SettingsControl.new(root, {
      stockChart: stockChart
    })
  ]
});



// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
valueSeries.appear(1000);
stockChart.appear(1000, 100);