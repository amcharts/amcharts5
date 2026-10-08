import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// Daily prices: each file sets a global variable, e.g. window["AAPL_day"]
import "./data/AAPL_day.js";
import "./data/AMD_day.js";
import "./data/AMZN_day.js";
import "./data/GOOG_day.js";
import "./data/MSFT_day.js";
import "./data/NFLX_day.js";
import "./data/NVDA_day.js";
import "./data/TSLA_day.js";


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
  calculateAggregates: true, // works out the changes the percent scale shows when comparing
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
// the series that comparisons and the toolbar controls work with
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
// gives the series one stock's daily prices, taken from the global variable its file set
function loadData(ticker: string, series: am5xy.XYSeries[]) {
  const data = (window as any)[ticker + "_day"];
  am5.array.each(series, (item) => {
    item.data.setAll(data);
  });
}

loadData("MSFT", [valueSeries, volumeSeries, sbSeries]);


// Add a comparing series
// https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
// addComparingSeries() puts the line on the main panel, gives it a legend entry with a close
// button, and switches the value axis to percent change, so stocks of any price compare
function addComparingSeries(ticker: string) {
  const series = stockChart.addComparingSeries(am5xy.LineSeries.new(root, {
    name: ticker,
    valueYField: "Close",
    calculateAggregates: true, // works out the percent change the comparison shows
    valueXField: "Date",
    xAxis: dateAxis,
    yAxis: valueAxis,
    legendValueText: "{valueY.formatNumber('#.00')}" // the hovered day's value, two decimals
  }));

  loadData(ticker, [series]);
}

// the chart opens with Apple already compared
addComparingSeries("AAPL");


// The stocks that can be searched for; the id is the ticker
const stocks = [
  { id: "AAPL", label: "Apple" },
  { id: "AMD", label: "Advanced Micro Devices" },
  { id: "AMZN", label: "Amazon" },
  { id: "GOOG", label: "Alphabet (Google)" },
  { id: "MSFT", label: "Microsoft" },
  { id: "NFLX", label: "Netflix" },
  { id: "NVDA", label: "NVIDIA" },
  { id: "TSLA", label: "Tesla" }
];

// Finds stocks by name or ticker; the ones on the chart already cannot be picked again
function searchStocks(query: string) {
  const used = [valueSeries.get("name")];
  am5.array.each(stockChart.getPrivate("comparedSeries", []), (series) => {
    used.push(series.get("name"));
  });

  query = query.toLowerCase();

  const items: am5stock.IDropdownListItem[] = [];
  am5.array.each(stocks, (stock) => {
    if (stock.label.toLowerCase().indexOf(query) != -1 || stock.id.toLowerCase().indexOf(query) != -1) {
      items.push({
        id: stock.id,
        label: stock.label,
        subLabel: stock.id,                    // the ticker in smaller text under the name
        disabled: used.indexOf(stock.id) != -1 // listed but not clickable if already on the chart
      });
    }
  });
  return items;
}


// Set up main series selector: a searchable dropdown
// https://www.amcharts.com/docs/v5/charts/stock/toolbar/dropdown-list-control/
const mainSeriesControl = am5stock.DropdownListControl.new(root, {
  stockChart: stockChart,
  name: valueSeries.get("name"),              // the button shows the current ticker
  icon: am5stock.StockIcons.getIcon("Search"),
  fixedLabel: true,                           // picking an item doesn't relabel it: the handler below does
  searchable: true,                           // a search field at the top of the list...
  searchCallback: searchStocks                // ...which asks this function for the matches
});

// a picked stock replaces the main one: new name, new data for the candles, volume and scrollbar
mainSeriesControl.events.on("selected", (ev) => {
  if (!am5.type.isString(ev.item)) {
    const ticker = ev.item.id;
    mainSeriesControl.set("name", ticker);
    valueSeries.set("name", ticker);
    loadData(ticker, [valueSeries, volumeSeries, sbSeries]);
  }
});


// Set up comparison control
// https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
const comparisonControl = am5stock.ComparisonControl.new(root, {
  stockChart: stockChart,
  searchable: true, // the same kind of searchable list
  searchCallback: (query) => {
    // with five stocks compared already, the list shows only a message
    if (stockChart.getPrivate("comparedSeries", []).length > 4) {
      return [{
        id: "",
        label: "A maximum of 5 comparisons is already selected. Remove some to add new ones.",
        className: "am5stock-list-info", // styled as a note, not a list item
        disabled: true
      }];
    }
    return searchStocks(query);
  }
});

// a picked stock is added as a comparison line
comparisonControl.events.on("selected", (ev) => {
  if (!am5.type.isString(ev.item)) {
    addComparingSeries(ev.item.id);
  }
});


// Add stock toolbar
// https://www.amcharts.com/docs/v5/charts/stock/toolbar/
am5stock.StockToolbar.new(root, {
  container: document.getElementById("chartcontrols")!, // the div above the chart that holds the toolbar
  stockChart: stockChart,
  controls: [
    mainSeriesControl,
    comparisonControl,
    // buttons for 5 days, 1 month and so on, up to all the data
    am5stock.PeriodSelector.new(root, {
      stockChart: stockChart
    }),
    // the price scale (regular, percent change or logarithmic) and other options
    am5stock.SettingsControl.new(root, {
      stockChart: stockChart
    })
  ]
});


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
valueSeries.appear(1000);
stockChart.appear(1000, 100);