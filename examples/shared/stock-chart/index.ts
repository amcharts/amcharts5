import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
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

// Set global number format
// https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/
root.numberFormatter.set("numberFormat", "#,###.00");


// Create a stock chart
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Instantiating_the_chart
const stockChart = root.container.children.push(am5stock.StockChart.new(root, {}));


// Create a main stock panel (chart)
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Adding_panels
const mainPanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
  wheelY: "zoomX", // the mouse wheel zooms in on the dates
  panX: true,      // dragging the plot moves along the dates...
  panY: true       // ...and up or down the price scale
}));


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
const valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {
    pan: "zoom" // drag the price labels up or down to stretch or squeeze the scale
  }),
  extraMin: 0.1, // room for the volume columns
  tooltip: am5.Tooltip.new(root, {}), // shows the cursor's price on the axis...
  extraTooltipPrecision: 2            // ...with two more decimals than the labels
}));

// Intraday data only needs a smaller baseInterval, e.g. { timeUnit: "minute", count: 1 }
// a GaplessDateAxis leaves out the days without data, such as weekends
const dateAxis = mainPanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
  baseInterval: { // one candle per trading day
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true // fainter grid lines between the labelled ones
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

// The first label would be cut off by the edge of the chart
dateAxis.get("renderer").labels.template.set("minPosition", 0.01);

// Volume has its own axis: the bottom fifth of the panel, no labels or grid
const volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
  inside: true // inside the plot, so it takes no room beside the price axis
});
volumeAxisRenderer.labels.template.set("forceHidden", true);
volumeAxisRenderer.grid.template.set("forceHidden", true);

const volumeAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
  height: am5.percent(20),
  y: am5.percent(100),
  centerY: am5.percent(100),
  renderer: volumeAxisRenderer
}));


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
const valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
  name: "MSFT",
  clustered: false,          // each candle takes its whole day, not sharing it with the volume
  valueXField: "Date",
  valueYField: "Close",
  highValueYField: "High",
  lowValueYField: "Low",
  openValueYField: "Open",
  calculateAggregates: true, // works out the changes that the percent scale in the settings shows
  xAxis: dateAxis,
  yAxis: valueAxis,
  // the hovered candle's prices in the legend
  legendValueText: "open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]",
  legendRangeValueText: "" // no values while the pointer is off the plot
}));

const volumeSeries = mainPanel.series.push(am5xy.ColumnSeries.new(root, {
  name: "Volume",
  clustered: false, // each column lines up with its candle instead of sitting beside it
  valueXField: "Date",
  valueYField: "Volume",
  xAxis: dateAxis,
  yAxis: volumeAxis,
  legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]" // shortened, such as 25.3M
}));

volumeSeries.columns.template.setAll({
  strokeOpacity: 0, // no outlines
  fillOpacity: 0.5  // half see-through, so the candles behind them still show
});

// Volume columns are colored by the price change of their day
volumeSeries.columns.template.adapters.add("fill", (fill, target) => {
  const dataItem = target.dataItem;
  if (dataItem) {
    return stockChart.getVolumeColor(dataItem);
  }
  return fill;
});


// Set main series
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
// the series that indicators, drawings and the toolbar controls work with
stockChart.set("stockSeries", valueSeries);
stockChart.set("volumeSeries", volumeSeries);


// Add a stock legend
// https://www.amcharts.com/docs/v5/charts/stock-chart/stock-legend/
// in the plot container, so it sits over the top left of the plot
const valueLegend = mainPanel.plotContainer.children.push(am5stock.StockLegend.new(root, {
  stockChart: stockChart
}));

valueLegend.data.setAll([valueSeries, volumeSeries]);


// Add cursor
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
mainPanel.set("cursor", am5xy.XYCursor.new(root, {
  yAxis: valueAxis,
  xAxis: dateAxis,
  snapToSeries: [valueSeries], // the horizontal line jumps to the close of the candle...
  snapToSeriesBy: "y!"         // ...at the date under the pointer
}));


// Add scrollbar with a preview of the closing price
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
const scrollbar = mainPanel.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
  orientation: "horizontal",
  height: 50
}));

// moved to the stock chart's tools container, above the panels
stockChart.toolsContainer.children.push(scrollbar);

// the scrollbar has a small chart of its own, with its own axes and series
const sbDateAxis = scrollbar.chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
  baseInterval: {
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {})
}));

const sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

const sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
  valueYField: "Close",
  valueXField: "Date",
  xAxis: sbDateAxis,
  yAxis: sbValueAxis
}));

sbSeries.fills.template.setAll({
  visible: true,   // a shaded area under the preview line
  fillOpacity: 0.3
});


// Set data
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_data
valueSeries.data.setAll(data);
volumeSeries.data.setAll(data);
sbSeries.data.setAll(data);


// Set up series type switcher
// https://www.amcharts.com/docs/v5/charts/stock/toolbar/series-type-control/
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
// https://www.amcharts.com/docs/v5/charts/stock/toolbar/
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
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
valueSeries.appear(1000);
stockChart.appear(1000, 100);