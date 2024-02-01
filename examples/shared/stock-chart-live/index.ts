import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// Create root element
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
let root = am5.Root.new("chartdiv");

// Set themes
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([am5themes_Animated.new(root)]);

// Create a stock chart
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Instantiating_the_chart
let stockChart = root.container.children.push(
  am5stock.StockChart.new(root, {})
);

// Set global number format
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/
root.numberFormatter.set("numberFormat", "#,###.00");

// Create a main stock panel (chart)
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Adding_panels
let mainPanel = stockChart.panels.push(
  am5stock.StockPanel.new(root, {
    wheelY: "zoomX",
    panX: true,
    panY: true
  })
);

// Create value axis
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
let valueAxis = mainPanel.yAxes.push(
  am5xy.ValueAxis.new(root, {
    renderer: am5xy.AxisRendererY.new(root, {
      pan: "zoom"
    }),
    extraMin: 0.1, // adds some space for for main series
    tooltip: am5.Tooltip.new(root, {}),
    numberFormat: "#,###.00",
    extraTooltipPrecision: 2
  })
);

let dateAxis = mainPanel.xAxes.push(
  am5xy.GaplessDateAxis.new(root, {
    baseInterval: {
      timeUnit: "minute",
      count: 1
    },
    renderer: am5xy.AxisRendererX.new(root, {
      minorGridEnabled: true
    }),
    tooltip: am5.Tooltip.new(root, {})
  })
);

// add range which will show current value
let currentValueDataItem = valueAxis.createAxisRange(valueAxis.makeDataItem({ value: 0 }));
let currentLabel = currentValueDataItem.get("label");
if (currentLabel) {
  currentLabel.setAll({
    fill: am5.color(0xffffff),
    background: am5.Rectangle.new(root, { fill: am5.color(0x000000) })
  })
}

let currentGrid = currentValueDataItem.get("grid");
if (currentGrid) {
  currentGrid.setAll({ strokeOpacity: 0.5, strokeDasharray: [2, 5] });
}


// Add series
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
let valueSeries = mainPanel.series.push(
  am5xy.CandlestickSeries.new(root, {
    name: "AMCH",
    clustered: false,
    valueXField: "Date",
    valueYField: "Close",
    highValueYField: "High",
    lowValueYField: "Low",
    openValueYField: "Open",
    calculateAggregates: true,
    xAxis: dateAxis,
    yAxis: valueAxis,
    legendValueText:
      "open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]",
    legendRangeValueText: ""
  })
);

// Set main value series
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
stockChart.set("stockSeries", valueSeries);

// Add a stock legend
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/stock-legend/
let valueLegend = mainPanel.plotContainer.children.push(
  am5stock.StockLegend.new(root, {
    stockChart: stockChart
  })
);

// Set main series
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
valueLegend.data.setAll([valueSeries]);

// Add cursor(s)
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
mainPanel.set(
  "cursor",
  am5xy.XYCursor.new(root, {
    yAxis: valueAxis,
    xAxis: dateAxis,
    snapToSeries: [valueSeries],
    snapToSeriesBy: "y!"
  })
);

// Add scrollbar
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
let scrollbar = mainPanel.set(
  "scrollbarX",
  am5xy.XYChartScrollbar.new(root, {
    orientation: "horizontal",
    height: 50
  })
);
stockChart.toolsContainer.children.push(scrollbar);

let sbDateAxis = scrollbar.chart.xAxes.push(
  am5xy.GaplessDateAxis.new(root, {
    baseInterval: {
      timeUnit: "minute",
      count: 1
    },
    renderer: am5xy.AxisRendererX.new(root, {})
  })
);

let sbValueAxis = scrollbar.chart.yAxes.push(
  am5xy.ValueAxis.new(root, {
    renderer: am5xy.AxisRendererY.new(root, {})
  })
);

let sbSeries = scrollbar.chart.series.push(
  am5xy.LineSeries.new(root, {
    valueYField: "Close",
    valueXField: "Date",
    xAxis: sbDateAxis,
    yAxis: sbValueAxis
  })
);

sbSeries.fills.template.setAll({
  visible: true,
  fillOpacity: 0.3
});

// Set up series type switcher
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock/toolbar/series-type-control/
let seriesSwitcher = am5stock.SeriesTypeControl.new(root, {
  stockChart: stockChart
});

seriesSwitcher.events.on("selected", function(ev) {
  setSeriesType(ev.item.id);
});

function getNewSettings(series) {
  let newSettings = [];
  am5.array.each(
    [
      "name",
      "valueYField",
      "highValueYField",
      "lowValueYField",
      "openValueYField",
      "calculateAggregates",
      "valueXField",
      "xAxis",
      "yAxis",
      "legendValueText",
      "legendRangeValueText", 
      "stroke",
      "fill"
    ],
    function(setting) {
      newSettings[setting] = series.get(setting);
    }
  );
  return newSettings;
}

function setSeriesType(seriesType) {
  // Get current series and its settings
  let currentSeries = stockChart.get("stockSeries");
  let newSettings = getNewSettings(currentSeries);

  // Remove previous series
  let data = currentSeries.data.values;
  mainPanel.series.removeValue(currentSeries);

  // Create new series
  let series;
  switch (seriesType) {
    case "line":
      series = mainPanel.series.push(am5xy.LineSeries.new(root, newSettings));
      break;
    case "candlestick":
    case "procandlestick":
      newSettings.clustered = false;
      series = mainPanel.series.push(
        am5xy.CandlestickSeries.new(root, newSettings)
      );
      if (seriesType == "procandlestick") {
        series.columns.template.get("themeTags").push("pro");
      }
      break;
    case "ohlc":
      newSettings.clustered = false;
      series = mainPanel.series.push(am5xy.OHLCSeries.new(root, newSettings));
      break;
  }

  // Set new series as stockSeries
  if (series) {
    valueLegend.data.removeValue(currentSeries);
    series.data.setAll(data);
    stockChart.set("stockSeries", series);
    let cursor = mainPanel.get("cursor");
    if (cursor) {
      cursor.set("snapToSeries", [series]);
    }
    valueLegend.data.insertIndex(0, series);
  }
}

// Data generator
let firstDate = new Date();
let lastDate;
let value = 1200;

// data
function generateChartData() {
  let chartData = [];

  for (let i = 0; i < 50; i++) {
    let newDate = new Date(firstDate);
    newDate.setMinutes(newDate.getMinutes() - i);

    value += Math.round((Math.random() < 0.49 ? 1 : -1) * Math.random() * 10);

    let open = value + Math.round(Math.random() * 16 - 8);
    let low = Math.min(value, open) - Math.round(Math.random() * 5);
    let high = Math.max(value, open) + Math.round(Math.random() * 5);

    chartData.unshift({
      Date: newDate.getTime(),
      Close: value,
      Open: open,
      Low: low,
      High: high
    });

    lastDate = newDate;
  }
  return chartData;
}

let data = generateChartData();

// set data to all series
valueSeries.data.setAll(data);
sbSeries.data.setAll(data);

// update data
let previousDate;

setInterval(function() {
  let date = Date.now();
  let lastDataObject = valueSeries.data.getIndex(valueSeries.data.length - 1);
  if (lastDataObject) {
    let previousDate = lastDataObject.Date;
    let previousValue = lastDataObject.Close;

    value = am5.math.round(previousValue + (Math.random() < 0.5 ? 1 : -1) * Math.random() * 2, 2);

    let high = lastDataObject.High;
    let low = lastDataObject.Low;
    let open = lastDataObject.Open;

    if (am5.time.checkChange(date, previousDate, "minute")) {
      open = value;
      high = value;
      low = value;

      let dObj1 = {
        Date: date,
        Close: value,
        Open: value,
        Low: value,
        High: value
      };

      valueSeries.data.push(dObj1);
      sbSeries.data.push(dObj1);
      previousDate = date;
    } else {
      if (value > high) {
        high = value;
      }

      if (value < low) {
        low = value;
      }

      let dObj2 = {
        Date: date,
        Close: value,
        Open: open,
        Low: low,
        High: high
      };

      valueSeries.data.setIndex(valueSeries.data.length - 1, dObj2);
      sbSeries.data.setIndex(sbSeries.data.length - 1, dObj2);
    }
    // update current value
    if (currentLabel) {
      currentValueDataItem.animate({ key: "value", to: value, duration: 500, easing: am5.ease.out(am5.ease.cubic) });
      currentLabel.set("text", stockChart.getNumberFormatter().format(value));
      let bg = currentLabel.get("background");
      if (bg) {
          if(value < open){      
            bg.set("fill", root.interfaceColors.get("negative"));
          }
          else{
            bg.set("fill", root.interfaceColors.get("positive"));
          }
      }
    }
  }
}, 1000);