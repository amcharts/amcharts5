import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import data from "./data.json";


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
  wheelY: "zoomX", // the mouse wheel zooms in on the dates
  panX: true,      // dragging the plot moves along the dates...
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

// a GaplessDateAxis leaves out the dates without data, such as weekends
const dateAxis = mainPanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
  baseInterval: { // matches the daily data the chart starts with; the switcher changes it
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


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/
const valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
  name: "MSFT",
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
  snapToSeriesBy: "y!"         // ...at the date under the pointer
}));


// Set data: data.json has one dataset per interval, the chart starts with the daily one
// https://docs.amcharts.com/v5/charts/stock/
valueSeries.data.setAll(data.day);


// Set up interval switcher: the id of an item is the name of its dataset
// https://docs.amcharts.com/v5/charts/stock/toolbar/interval-control/
const intervalSwitcher = am5stock.IntervalControl.new(root, {
  stockChart: stockChart,
  currentItem: "day", // the control starts on "1 day", to match the data loaded above
  items: [
    { id: "minute", label: "1 minute", interval: { timeUnit: "minute", count: 1 } },
    { id: "day", label: "1 day", interval: { timeUnit: "day", count: 1 } },
    { id: "week", label: "1 week", interval: { timeUnit: "week", count: 1 } },
    { id: "month", label: "1 month", interval: { timeUnit: "month", count: 1 } }
  ]
});

// a picked interval loads its own dataset and sets the axis's base interval to match
intervalSwitcher.events.on("selected", (ev) => {
  const item = ev.item as am5stock.IIntervalControlItem;

  // The new data covers another period: show all of it
  valueSeries.events.once("datavalidated", () => {
    mainPanel.zoomOut();
  });

  // Tell the axis how far apart the data items are, then swap the data
  dateAxis.set("baseInterval", {
    timeUnit: item.interval.timeUnit,
    count: item.interval.count || 1
  });
  valueSeries.data.setAll(data[item.id as keyof typeof data]);
});


// Add stock toolbar
// https://docs.amcharts.com/v5/charts/stock/toolbar/
am5stock.StockToolbar.new(root, {
  container: document.getElementById("chartcontrols")!, // the div above the chart that holds the toolbar
  stockChart: stockChart,
  controls: [
    intervalSwitcher
  ]
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
valueSeries.appear(1000);
stockChart.appear(1000, 100);