# Stock & Financial Charts
Build financial stock charts with panels, indicators, and toolbar.


## Required imports

### ES modules
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
<script src="https://cdn.amcharts.com/lib/5/stock.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Core setup

```html
<div id="chartcontrols"></div>  <!-- toolbar container -->
<div id="chartdiv"></div>       <!-- chart container -->
```

```js
const root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

// 1. Stock chart (wrapper)
const stockChart = root.container.children.push(
  am5stock.StockChart.new(root, {})
);

// 2. Main panel (is an XYChart)
const mainPanel = stockChart.panels.push(
  am5stock.StockPanel.new(root, {
    wheelY: "zoomX",
    panX: true,
    panY: true
  })
);

// 3. Axes on the panel
const dateAxis = mainPanel.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: { timeUnit: "day", count: 1 },
  renderer: am5xy.AxisRendererX.new(root, {}),
  tooltip: am5.Tooltip.new(root, {})
}));

const valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

// 4. Main series (candlestick)
const valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
  name: "STCK",
  xAxis: dateAxis,
  yAxis: valueAxis,
  valueXField: "Date",
  valueYField: "Close",
  highValueYField: "High",
  lowValueYField: "Low",
  openValueYField: "Open",
  calculateAggregates: true,
  legendValueText: "{valueY}"
}));

// 5. Register as main stock series (CRITICAL)
stockChart.set("stockSeries", valueSeries);

// 6. Stock legend
const legend = mainPanel.plotContainer.children.push(
  am5stock.StockLegend.new(root, { stockChart: stockChart })
);

// 7. Cursor
mainPanel.set("cursor", am5xy.XYCursor.new(root, {
  yAxis: valueAxis,
  xAxis: dateAxis,
  behavior: "none",
  snapToSeries: [valueSeries]
}));

// 8. Scrollbar with preview series
const scrollbar = mainPanel.set("scrollbarX",
  am5xy.XYChartScrollbar.new(root, {
    orientation: "horizontal",
    height: 50
  })
);

var sbDateAxis = scrollbar.chart.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: { timeUnit: "day", count: 1 },
  renderer: am5xy.AxisRendererX.new(root, {})
}));
var sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));
var sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
  xAxis: sbDateAxis,
  yAxis: sbValueAxis,
  valueYField: "Close",
  valueXField: "Date"
}));

// 9. Data — LAST
valueSeries.data.setAll(data);
sbSeries.data.setAll(data);

// 10. Toolbar (optional)
const toolbar = am5stock.StockToolbar.new(root, {
  container: document.getElementById("chartcontrols"),
  stockChart: stockChart,
  controls: [
    am5stock.IndicatorControl.new(root, { stockChart: stockChart }),
    am5stock.DrawingControl.new(root, { stockChart: stockChart }),
    am5stock.PeriodSelector.new(root, {
      stockChart: stockChart,
      periods: [
        { timeUnit: "day", count: 1, name: "1D" },
        { timeUnit: "month", count: 1, name: "1M" },
        { timeUnit: "month", count: 3, name: "3M" },
        { timeUnit: "year", count: 1, name: "1Y" },
        { timeUnit: "max", name: "Max" }
      ]
    }),
    am5stock.SeriesTypeControl.new(root, { stockChart: stockChart }),
    am5stock.SettingsControl.new(root, { stockChart: stockChart }),
    am5stock.ResetControl.new(root, { stockChart: stockChart })
  ]
});
```

## Adding a volume panel

```js
const volumePanel = stockChart.panels.push(
  am5stock.StockPanel.new(root, {
    wheelY: "zoomX",
    panX: true,
    panY: true,
    height: am5.percent(30)
  })
);

const volDateAxis = volumePanel.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: { timeUnit: "day", count: 1 },
  renderer: am5xy.AxisRendererX.new(root, {})
}));

const volValueAxis = volumePanel.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

const volumeSeries = volumePanel.series.push(am5xy.ColumnSeries.new(root, {
  name: "Volume",
  xAxis: volDateAxis,
  yAxis: volValueAxis,
  valueXField: "Date",
  valueYField: "Volume"
}));

stockChart.set("volumeSeries", volumeSeries);
volumeSeries.data.setAll(data);
```

## Adding indicators programmatically

```js
// Bollinger Bands
stockChart.indicators.push(am5stock.BollingerBands.new(root, {
  stockChart: stockChart,
  stockSeries: valueSeries,
  legend: legend
}));

// Moving Average (SMA)
stockChart.indicators.push(am5stock.MovingAverage.new(root, {
  stockChart: stockChart,
  stockSeries: valueSeries,
  legend: legend,
  period: 20,
  type: "simple"  // "simple", "weighted", "exponential", "dema", "tema"
}));

// RSI (creates its own panel)
stockChart.indicators.push(am5stock.RelativeStrengthIndex.new(root, {
  stockChart: stockChart,
  stockSeries: valueSeries,
  legend: legend
}));

// MACD (creates its own panel)
stockChart.indicators.push(am5stock.MACD.new(root, {
  stockChart: stockChart,
  stockSeries: valueSeries,
  legend: legend
}));

// Volume (requires volumeSeries)
stockChart.indicators.push(am5stock.Volume.new(root, {
  stockChart: stockChart,
  stockSeries: valueSeries,
  volumeSeries: volumeSeries,
  legend: legend
}));
```

### Available indicators

| Indicator | Class | Needs volumeSeries |
|-----------|-------|--------------------|
| Moving Average | `MovingAverage` | No |
| Moving Average Cross | `MACross` | No |
| Moving Average Envelope | `MovingAverageEnvelope` | No |
| Moving Average Deviation | `MovingAverageDeviation` | No |
| Bollinger Bands | `BollingerBands` | No |
| MACD | `MACD` | No |
| RSI | `RelativeStrengthIndex` | No |
| Stochastic Oscillator | `StochasticOscillator` | No |
| Williams %R | `WilliamsR` | No |
| Aroon | `Aroon` | No |
| Awesome Oscillator | `AwesomeOscillator` | No |
| Commodity Channel Index | `CommodityChannelIndex` | No |
| Standard Deviation | `StandardDeviation` | No |
| Disparity Index | `DisparityIndex` | No |
| Trix | `Trix` | No |
| ZigZag | `ZigZag` | No |
| Typical Price | `TypicalPrice` | No |
| Median Price | `MedianPrice` | No |
| On Balance Volume | `OnBalanceVolume` | Yes |
| Accumulation Distribution | `AccumulationDistribution` | Yes |
| Chaikin Money Flow | `ChaikinMoneyFlow` | Yes |
| Chaikin Oscillator | `ChaikinOscillator` | Yes |
| Volume Profile | `VolumeProfile` | Yes |
| VWAP | `VWAP` | Yes |
| PVT | `PVT` | Yes |
| Volume | `Volume` | Yes |

All classes are under `am5stock.*` (e.g., `am5stock.BollingerBands`).

## Data format

```js
var data = [
  { Date: new Date(2024, 0, 2).getTime(), Open: 150.0, High: 155.2, Low: 148.5, Close: 153.1, Volume: 1200000 },
  { Date: new Date(2024, 0, 3).getTime(), Open: 153.1, High: 158.0, Low: 151.3, Close: 156.4, Volume: 1350000 },
  { Date: new Date(2024, 0, 4).getTime(), Open: 156.4, High: 160.1, Low: 154.8, Close: 159.7, Volume: 1100000 },
  { Date: new Date(2024, 0, 5).getTime(), Open: 159.7, High: 162.5, Low: 157.2, Close: 158.3, Volume: 980000 },
  { Date: new Date(2024, 0, 8).getTime(), Open: 158.3, High: 163.0, Low: 156.9, Close: 161.8, Volume: 1420000 },
  { Date: new Date(2024, 0, 9).getTime(), Open: 161.8, High: 165.4, Low: 160.1, Close: 164.2, Volume: 1560000 },
  { Date: new Date(2024, 0, 10).getTime(), Open: 164.2, High: 167.8, Low: 162.0, Close: 163.5, Volume: 1180000 },
  { Date: new Date(2024, 0, 11).getTime(), Open: 163.5, High: 166.3, Low: 161.7, Close: 165.9, Volume: 1050000 },
  { Date: new Date(2024, 0, 12).getTime(), Open: 165.9, High: 170.2, Low: 164.5, Close: 169.1, Volume: 1630000 },
  { Date: new Date(2024, 0, 16).getTime(), Open: 169.1, High: 172.0, Low: 167.3, Close: 171.4, Volume: 1470000 },
  // ... more data points
];
```

**All date values must be timestamps (milliseconds).** Data must be sorted ascending by date.

## Toolbar controls

| Control | Class | Purpose |
|---------|-------|---------|
| Period selector | `am5stock.PeriodSelector` | 1D, 1M, 1Y, Max buttons |
| Date range | `am5stock.DateRangeSelector` | Date picker for custom range |
| Series type | `am5stock.SeriesTypeControl` | Switch line/candlestick/OHLC/area |
| Indicators | `am5stock.IndicatorControl` | Add SMA, EMA, Bollinger, RSI, etc. |
| Drawing | `am5stock.DrawingControl` | Trend lines, Fibonacci, annotations |
| Comparison | `am5stock.ComparisonControl` | Compare multiple symbols |
| Settings | `am5stock.SettingsControl` | Theme, fills, auto-save |
| Reset | `am5stock.ResetControl` | Reset chart to defaults |
| Interval | `am5stock.IntervalControl` | Switch time interval |

## Events

```js
// Period changed — the `periodselected` event fires on the PeriodSelector
// instance, NOT on stockChart. Attach the handler to the selector you created.
periodSelector.events.on("periodselected", (ev) => {
  console.log("Period:", ev.period);
});

// Series type changed
valueSeries.events.on("datavalidated", () => {
  console.log("Data updated");
});
```

## Disposal

```js
root.dispose();
```

---

## Example 1: Stock chart with candlesticks and toolbar

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Stock Chart</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; }
    #chartcontrols { height: auto; padding: 5px 0; }
    #chartdiv { width: 100%; height: 500px; }
  </style>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/stock.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
</head>
<body>
  <div id="chartcontrols"></div>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    // Stock chart wrapper
    var stockChart = root.container.children.push(
      am5stock.StockChart.new(root, {})
    );

    // Main panel
    var mainPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        wheelY: "zoomX",
        panX: true,
        panY: true
      })
    );

    // Axes
    var dateAxis = mainPanel.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {}),
      tooltip: am5.Tooltip.new(root, {})
    }));

    var valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    // Candlestick series
    var valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
      name: "ACME",
      xAxis: dateAxis,
      yAxis: valueAxis,
      valueXField: "Date",
      valueYField: "Close",
      highValueYField: "High",
      lowValueYField: "Low",
      openValueYField: "Open",
      calculateAggregates: true,
      legendValueText: "O:{openValueY} H:{highValueY} L:{lowValueY} C:{valueY}"
    }));

    // CRITICAL: register as stock series
    stockChart.set("stockSeries", valueSeries);

    // Legend
    var legend = mainPanel.plotContainer.children.push(
      am5stock.StockLegend.new(root, { stockChart: stockChart })
    );

    // Cursor
    mainPanel.set("cursor", am5xy.XYCursor.new(root, {
      yAxis: valueAxis,
      xAxis: dateAxis,
      behavior: "none",
      snapToSeries: [valueSeries]
    }));

    // Scrollbar
    var scrollbar = mainPanel.set("scrollbarX",
      am5xy.XYChartScrollbar.new(root, {
        orientation: "horizontal",
        height: 50
      })
    );

    // Scrollbar preview series
    var sbDateAxis = scrollbar.chart.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {})
    }));
    var sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));
    var sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
      xAxis: sbDateAxis,
      yAxis: sbValueAxis,
      valueYField: "Close",
      valueXField: "Date"
    }));

    // Toolbar
    am5stock.StockToolbar.new(root, {
      container: document.getElementById("chartcontrols"),
      stockChart: stockChart,
      controls: [
        am5stock.IndicatorControl.new(root, { stockChart: stockChart }),
        am5stock.DrawingControl.new(root, { stockChart: stockChart }),
        am5stock.PeriodSelector.new(root, {
          stockChart: stockChart,
          periods: [
            { timeUnit: "month", count: 1, name: "1M" },
            { timeUnit: "month", count: 3, name: "3M" },
            { timeUnit: "month", count: 6, name: "6M" },
            { timeUnit: "year", count: 1, name: "1Y" },
            { timeUnit: "max", name: "Max" }
          ]
        }),
        am5stock.SeriesTypeControl.new(root, { stockChart: stockChart }),
        am5stock.ResetControl.new(root, { stockChart: stockChart })
      ]
    });

    // Generate sample OHLCV data
    var data = [];
    var open = 150;
    var date = new Date(2024, 0, 2);
    for (var i = 0; i < 120; i++) {
      // Skip weekends
      if (date.getDay() === 0) date.setDate(date.getDate() + 1);
      if (date.getDay() === 6) date.setDate(date.getDate() + 2);

      var change = (Math.random() - 0.48) * 4;
      var high = open + Math.random() * 3 + 1;
      var low = open - Math.random() * 3 - 1;
      var close = open + change;
      close = Math.max(low, Math.min(high, close));

      data.push({
        Date: date.getTime(),
        Open: Math.round(open * 100) / 100,
        High: Math.round(high * 100) / 100,
        Low: Math.round(low * 100) / 100,
        Close: Math.round(close * 100) / 100,
        Volume: Math.round(800000 + Math.random() * 1200000)
      });

      open = close;
      date = new Date(date);
      date.setDate(date.getDate() + 1);
    }

    // Set data LAST
    valueSeries.data.setAll(data);
    sbSeries.data.setAll(data);

    stockChart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 2: Stock chart with volume panel and Bollinger Bands indicator

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Stock Chart with Volume & Indicators</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; }
    #chartcontrols { height: auto; padding: 5px 0; }
    #chartdiv { width: 100%; height: 600px; }
  </style>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/stock.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
</head>
<body>
  <div id="chartcontrols"></div>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var stockChart = root.container.children.push(
      am5stock.StockChart.new(root, {})
    );

    // === Main panel ===
    var mainPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        wheelY: "zoomX",
        panX: true,
        panY: true
      })
    );

    var dateAxis = mainPanel.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {}),
      tooltip: am5.Tooltip.new(root, {})
    }));

    var valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    var valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
      name: "TECH",
      xAxis: dateAxis,
      yAxis: valueAxis,
      valueXField: "Date",
      valueYField: "Close",
      highValueYField: "High",
      lowValueYField: "Low",
      openValueYField: "Open",
      calculateAggregates: true,
      legendValueText: "O:{openValueY} H:{highValueY} L:{lowValueY} C:{valueY}"
    }));

    stockChart.set("stockSeries", valueSeries);

    var legend = mainPanel.plotContainer.children.push(
      am5stock.StockLegend.new(root, { stockChart: stockChart })
    );

    mainPanel.set("cursor", am5xy.XYCursor.new(root, {
      yAxis: valueAxis,
      xAxis: dateAxis,
      behavior: "none",
      snapToSeries: [valueSeries]
    }));

    // Scrollbar
    mainPanel.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
      orientation: "horizontal",
      height: 50
    }));

    // === Volume panel ===
    var volumePanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        wheelY: "zoomX",
        panX: true,
        panY: true,
        height: am5.percent(30)
      })
    );

    var volDateAxis = volumePanel.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {})
    }));

    var volValueAxis = volumePanel.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {}),
      numberFormat: "#.#a"
    }));

    var volumeSeries = volumePanel.series.push(am5xy.ColumnSeries.new(root, {
      name: "Volume",
      xAxis: volDateAxis,
      yAxis: volValueAxis,
      valueXField: "Date",
      valueYField: "Volume",
      tooltip: am5.Tooltip.new(root, { labelText: "Vol: {valueY}" })
    }));

    // Color volume bars by price direction
    volumeSeries.columns.template.adapters.add("fill", function(fill, target) {
      var dataItem = target.dataItem;
      if (dataItem) {
        var dc = dataItem.dataContext;
        return dc.Close >= dc.Open
          ? am5.color(0x26a69a)
          : am5.color(0xef5350);
      }
      return fill;
    });
    volumeSeries.columns.template.adapters.add("stroke", function(stroke, target) {
      var dataItem = target.dataItem;
      if (dataItem) {
        var dc = dataItem.dataContext;
        return dc.Close >= dc.Open
          ? am5.color(0x26a69a)
          : am5.color(0xef5350);
      }
      return stroke;
    });

    stockChart.set("volumeSeries", volumeSeries);

    var volLegend = volumePanel.plotContainer.children.push(
      am5stock.StockLegend.new(root, { stockChart: stockChart })
    );

    // === Toolbar ===
    am5stock.StockToolbar.new(root, {
      container: document.getElementById("chartcontrols"),
      stockChart: stockChart,
      controls: [
        am5stock.IndicatorControl.new(root, { stockChart: stockChart }),
        am5stock.DrawingControl.new(root, { stockChart: stockChart }),
        am5stock.PeriodSelector.new(root, {
          stockChart: stockChart,
          periods: [
            { timeUnit: "month", count: 1, name: "1M" },
            { timeUnit: "month", count: 3, name: "3M" },
            { timeUnit: "year", count: 1, name: "1Y" },
            { timeUnit: "max", name: "Max" }
          ]
        }),
        am5stock.SeriesTypeControl.new(root, { stockChart: stockChart }),
        am5stock.ResetControl.new(root, { stockChart: stockChart })
      ]
    });

    // Generate sample data
    var data = [];
    var open = 280;
    var date = new Date(2023, 6, 3);
    for (var i = 0; i < 200; i++) {
      if (date.getDay() === 0) date.setDate(date.getDate() + 1);
      if (date.getDay() === 6) date.setDate(date.getDate() + 2);
      var change = (Math.random() - 0.47) * 6;
      var high = open + Math.random() * 4 + 1;
      var low = open - Math.random() * 4 - 1;
      var close = Math.max(low, Math.min(high, open + change));
      data.push({
        Date: date.getTime(),
        Open: Math.round(open * 100) / 100,
        High: Math.round(high * 100) / 100,
        Low: Math.round(low * 100) / 100,
        Close: Math.round(close * 100) / 100,
        Volume: Math.round(500000 + Math.random() * 2000000)
      });
      open = close;
      date = new Date(date);
      date.setDate(date.getDate() + 1);
    }

    // Set data LAST
    valueSeries.data.setAll(data);
    volumeSeries.data.setAll(data);

    // Add Bollinger Bands indicator programmatically
    stockChart.indicators.push(am5stock.BollingerBands.new(root, {
      stockChart: stockChart,
      stockSeries: valueSeries,
      legend: legend
    }));

    stockChart.appear(1000, 100);
  </script>
</body>
</html>
```
