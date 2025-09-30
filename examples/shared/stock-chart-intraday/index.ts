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
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create a stock chart
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Instantiating_the_chart
let stockChart = root.container.children.push(am5stock.StockChart.new(root, {
}));


// Set global number format
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/
root.numberFormatter.set("numberFormat", "#,###.00");


// Create a main stock panel (chart)
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Adding_panels
let mainPanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
  wheelY: "zoomX",
  panX: true,
  panY: true
}));


// Create value axis
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
let valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {
    pan: "zoom"
  }),
  extraMin: 0.1, // adds some space for for main series
  tooltip: am5.Tooltip.new(root, {}),
  numberFormat: "#,###.00",
  extraTooltipPrecision: 2
}));

let dateAxis = mainPanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
  baseInterval: {
    timeUnit: "minute",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true
  }),
  tooltip: am5.Tooltip.new(root, {})
}));


// Add series
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
let valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
  name: "AMCH",
  turboMode: true,
  clustered: false,
  valueXField: "Date",
  valueYField: "Close",
  highValueYField: "High",
  lowValueYField: "Low",
  openValueYField: "Open",
  calculateAggregates: true,
  xAxis: dateAxis,
  yAxis: valueAxis,
  legendValueText: "open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]",
  legendRangeValueText: ""
}));


// Set main value series
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
stockChart.set("stockSeries", valueSeries);


// Add a stock legend
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/stock-legend/
let valueLegend = mainPanel.plotContainer.children.push(am5stock.StockLegend.new(root, {
  stockChart: stockChart
}));


// Create volume axis
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
let volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
  inside: true
});

volumeAxisRenderer.labels.template.set("forceHidden", true);
volumeAxisRenderer.grid.template.set("forceHidden", true);

let volumeValueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
  numberFormat: "#.#a",
  height: am5.percent(20),
  y: am5.percent(100),
  centerY: am5.percent(100),
  renderer: volumeAxisRenderer
}));

// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
let volumeSeries = mainPanel.series.push(am5xy.ColumnSeries.new(root, {
  name: "Volume",
  turboMode: true,
  clustered: false,
  valueXField: "Date",
  valueYField: "Volume",
  xAxis: dateAxis,
  yAxis: volumeValueAxis,
  legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]"
}));

volumeSeries.columns.template.setAll({
  strokeOpacity: 0,
  fillOpacity: 0.5
});

// color columns by stock rules
volumeSeries.columns.template.adapters.add("fill", function(fill, target) {
  let dataItem = target.dataItem;
  if (dataItem) {
    return stockChart.getVolumeColor(dataItem);
  }
  return fill;
})


// Set main series
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
stockChart.set("volumeSeries", volumeSeries);
valueLegend.data.setAll([valueSeries, volumeSeries]);


// Add cursor(s)
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
mainPanel.set("cursor", am5xy.XYCursor.new(root, {
  yAxis: valueAxis,
  xAxis: dateAxis,
  snapToSeries: [valueSeries],
  snapToSeriesBy: "y!"
}));


// Add scrollbar
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
let scrollbar = mainPanel.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
  orientation: "horizontal",
  height: 50
}));
stockChart.toolsContainer.children.push(scrollbar);

let sbDateAxis = scrollbar.chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
  baseInterval: {
    timeUnit: "minute",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {})
}));

let sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

let sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
  valueYField: "Close",
  valueXField: "Date",
  xAxis: sbDateAxis,
  yAxis: sbValueAxis
}));

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

function getNewSettings(series: am5xy.XYSeries) {
  let newSettings: any = [];
  am5.array.each(["name", "valueYField", "highValueYField", "lowValueYField", "openValueYField", "calculateAggregates", "valueXField", "xAxis", "yAxis", "legendValueText", "legendRangeValueText", "stroke", "fill"], function(setting: any) {
    newSettings[setting] = series.get(setting);
  });
  return newSettings;
}

function setSeriesType(seriesType: string) {
  // Get current series and its settings
  let currentSeries = stockChart.get("stockSeries")!;
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
      series = mainPanel.series.push(am5xy.CandlestickSeries.new(root, newSettings));
      if (seriesType == "procandlestick") {
        series.columns.template.get("themeTags")!.push("pro");
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


// Stock toolbar
// -------------------------------------------------------------------------------
// https://www.amcharts.com/docs/v5/charts/stock/toolbar/
let toolbar = am5stock.StockToolbar.new(root, {
  container: document.getElementById("chartcontrols")!,
  stockChart: stockChart,
  controls: [
    am5stock.IndicatorControl.new(root, {
      stockChart: stockChart,
      legend: valueLegend
    }),
    seriesSwitcher,
    am5stock.DrawingControl.new(root, {
      stockChart: stockChart
    }),
    am5stock.ResetControl.new(root, {
      stockChart: stockChart
    }),
    am5stock.SettingsControl.new(root, {
      stockChart: stockChart
    })
  ]
})

// data
let data = [
  {Date:1649842200000,Open:282.73,High:282.73,Low:281.92,Close:281.95,Volume:55522},
  {Date:1649842260000,Open:281.93,High:282.49,Low:281.69,Close:282.16,Volume:44862},
  {Date:1649842320000,Open:282.19,High:282.62,Low:281.6,Close:282.58,Volume:60104},
  {Date:1649842380000,Open:282.55,High:282.57,Low:281.77,Close:281.95,Volume:62857},
  {Date:1649842440000,Open:281.8,High:281.97,Low:281.61,Close:281.82,Volume:46548},
  {Date:1649842500000,Open:281.77,High:282.39,Low:281.75,Close:282,Volume:107311},
  {Date:1649842560000,Open:282.08,High:282.37,Low:281.85,Close:281.99,Volume:44348},
  {Date:1649842620000,Open:281.98,High:282.05,Low:281.8,Close:281.84,Volume:59741},
  {Date:1649842680000,Open:281.82,High:282.08,Low:281.7,Close:281.93,Volume:59910},
  {Date:1649842740000,Open:281.92,High:282.17,Low:281.74,Close:281.75,Volume:103366},
  {Date:1649842800000,Open:281.77,High:281.88,Low:281.3,Close:281.72,Volume:108402},
  {Date:1649842860000,Open:281.73,High:282.29,Low:281.65,Close:282.18,Volume:142668},
  {Date:1649842920000,Open:282.14,High:282.61,Low:282.1,Close:282.2,Volume:116732},
  {Date:1649842980000,Open:282.19,High:282.86,Low:282,Close:282.86,Volume:107624},
  {Date:1649843040000,Open:282.82,High:283.36,Low:282.77,Close:283.1,Volume:102217},
  {Date:1649843100000,Open:283.12,High:283.5,Low:282.9,Close:283.44,Volume:69037},
  {Date:1649843160000,Open:283.45,High:283.86,Low:283.25,Close:283.37,Volume:64511},
  {Date:1649843220000,Open:283.36,High:283.77,Low:283.2,Close:283.64,Volume:51860},
  {Date:1649843280000,Open:283.66,High:283.78,Low:283.5,Close:283.54,Volume:44270},
  {Date:1649843340000,Open:283.5,High:283.73,Low:283.21,Close:283.25,Volume:77339},
  {Date:1649843400000,Open:283.23,High:283.53,Low:283.08,Close:283.36,Volume:56200},
  {Date:1649843460000,Open:283.37,High:283.58,Low:283.27,Close:283.4,Volume:40796},
  {Date:1649843520000,Open:283.37,High:283.37,Low:282.92,Close:283.11,Volume:39419},
  {Date:1649843580000,Open:283.08,High:283.23,Low:282.93,Close:283.08,Volume:36623},
  {Date:1649843640000,Open:283.06,High:283.53,Low:283.05,Close:283.48,Volume:35163},
  {Date:1649843700000,Open:283.49,High:283.54,Low:283.08,Close:283.12,Volume:50792},
  {Date:1649843760000,Open:283.08,High:283.08,Low:282.5,Close:282.8,Volume:68439},
  {Date:1649843820000,Open:282.83,High:283.09,Low:282.81,Close:283.03,Volume:25099},
  {Date:1649843880000,Open:283.17,High:283.36,Low:283.12,Close:283.12,Volume:38277},
  {Date:1649843940000,Open:283.12,High:283.14,Low:282.17,Close:282.76,Volume:66937},
  {Date:1649844000000,Open:282.78,High:282.79,Low:282.5,Close:282.7,Volume:29629},
  {Date:1649844060000,Open:282.68,High:282.76,Low:282.36,Close:282.4,Volume:33094},
  {Date:1649844120000,Open:282.42,High:282.72,Low:282.4,Close:282.72,Volume:37719},
  {Date:1649844180000,Open:282.69,High:282.78,Low:282.51,Close:282.57,Volume:23199},
  {Date:1649844240000,Open:282.64,High:283.16,Low:282.62,Close:283.14,Volume:41676},
  {Date:1649844300000,Open:283.16,High:283.7,Low:283.16,Close:283.65,Volume:71061},
  {Date:1649844360000,Open:283.69,High:283.83,Low:283.44,Close:283.82,Volume:52597},
  {Date:1649844420000,Open:283.79,High:283.85,Low:283.48,Close:283.79,Volume:54694},
  {Date:1649844480000,Open:283.78,High:283.82,Low:283.23,Close:283.33,Volume:35363},
  {Date:1649844540000,Open:283.28,High:283.29,Low:282.85,Close:283,Volume:37211},
  {Date:1649844600000,Open:282.96,High:283.04,Low:282.68,Close:282.76,Volume:30244},
  {Date:1649844660000,Open:282.75,High:282.81,Low:282.62,Close:282.8,Volume:20986},
  {Date:1649844720000,Open:282.82,High:283.24,Low:282.81,Close:283.1,Volume:37861},
  {Date:1649844780000,Open:283.07,High:283.22,Low:282.86,Close:282.98,Volume:30877},
  {Date:1649844840000,Open:282.96,High:283.28,Low:282.85,Close:283.24,Volume:23297},
  {Date:1649844900000,Open:283.25,High:283.98,Low:283.25,Close:283.93,Volume:45930},
  {Date:1649844960000,Open:283.98,High:284.32,Low:283.94,Close:284.21,Volume:60952},
  {Date:1649845020000,Open:284.22,High:284.24,Low:283.87,Close:283.91,Volume:26137},
  {Date:1649845080000,Open:283.9,High:284.07,Low:283.82,Close:283.99,Volume:24452},
  {Date:1649845140000,Open:283.96,High:284.18,Low:283.9,Close:284.05,Volume:30367},
  {Date:1649845200000,Open:284.02,High:284.07,Low:283.89,Close:283.97,Volume:14544},
  {Date:1649845260000,Open:283.97,High:284.24,Low:283.92,Close:284.23,Volume:46323},
  {Date:1649845320000,Open:284.23,High:284.45,Low:284.17,Close:284.37,Volume:46267},
  {Date:1649845380000,Open:284.36,High:284.53,Low:284.2,Close:284.53,Volume:34193},
  {Date:1649845440000,Open:284.52,High:284.63,Low:284.42,Close:284.57,Volume:26571},
  {Date:1649845500000,Open:284.55,High:284.57,Low:284.19,Close:284.29,Volume:55144},
  {Date:1649845560000,Open:284.28,High:284.29,Low:284.05,Close:284.1,Volume:31951},
  {Date:1649845620000,Open:284.08,High:284.2,Low:284.05,Close:284.14,Volume:35332},
  {Date:1649845680000,Open:284.17,High:284.2,Low:283.94,Close:284.05,Volume:53518},
  {Date:1649845740000,Open:284.05,High:284.22,Low:283.96,Close:284.07,Volume:43175},
  {Date:1649845800000,Open:284.1,High:285.26,Low:283.99,Close:285.07,Volume:87031},
  {Date:1649845860000,Open:285.07,High:285.19,Low:284.84,Close:284.86,Volume:45023},
  {Date:1649845920000,Open:284.84,High:284.91,Low:284.53,Close:284.53,Volume:18505},
  {Date:1649845980000,Open:284.54,High:284.63,Low:284.34,Close:284.57,Volume:33079},
  {Date:1649846040000,Open:284.55,High:284.63,Low:284.41,Close:284.47,Volume:23419},
  {Date:1649846100000,Open:284.46,High:284.6,Low:284.29,Close:284.31,Volume:40430},
  {Date:1649846160000,Open:284.33,High:284.45,Low:284.18,Close:284.41,Volume:19354},
  {Date:1649846220000,Open:284.4,High:284.46,Low:284.05,Close:284.07,Volume:20545},
  {Date:1649846280000,Open:284.08,High:284.3,Low:284.04,Close:284.21,Volume:16342},
  {Date:1649846340000,Open:284.22,High:284.28,Low:283.8,Close:283.87,Volume:24988},
  {Date:1649846400000,Open:283.85,High:283.85,Low:283.51,Close:283.69,Volume:57977},
  {Date:1649846460000,Open:283.68,High:283.97,Low:283.6,Close:283.89,Volume:46137},
  {Date:1649846520000,Open:283.91,High:284.21,Low:283.91,Close:284.18,Volume:16234},
  {Date:1649846580000,Open:284.21,High:284.35,Low:284.14,Close:284.23,Volume:22813},
  {Date:1649846640000,Open:284.22,High:284.45,Low:284.22,Close:284.36,Volume:42546},
  {Date:1649846700000,Open:284.34,High:284.53,Low:284.34,Close:284.48,Volume:18541},
  {Date:1649846760000,Open:284.44,High:284.76,Low:284.24,Close:284.67,Volume:33107},
  {Date:1649846820000,Open:284.66,High:284.66,Low:284.14,Close:284.16,Volume:25193},
  {Date:1649846880000,Open:284.14,High:284.28,Low:284.1,Close:284.26,Volume:37239},
  {Date:1649846940000,Open:284.26,High:284.4,Low:284.09,Close:284.16,Volume:31077},
  {Date:1649847000000,Open:284.18,High:284.26,Low:284.04,Close:284.19,Volume:22293},
  {Date:1649847060000,Open:284.22,High:284.26,Low:284.06,Close:284.1,Volume:20200},
  {Date:1649847120000,Open:284.09,High:284.7,Low:283.96,Close:284.58,Volume:39355},
  {Date:1649847180000,Open:284.63,High:284.68,Low:284.34,Close:284.34,Volume:20627},
  {Date:1649847240000,Open:284.36,High:284.59,Low:284.34,Close:284.4,Volume:19732},
  {Date:1649847300000,Open:284.38,High:284.49,Low:284.16,Close:284.24,Volume:26977},
  {Date:1649847360000,Open:284.25,High:284.25,Low:283.91,Close:283.95,Volume:23927},
  {Date:1649847420000,Open:283.94,High:284.04,Low:283.69,Close:283.76,Volume:31329},
  {Date:1649847480000,Open:283.74,High:283.75,Low:283.59,Close:283.68,Volume:38368},
  {Date:1649847540000,Open:283.69,High:283.84,Low:283.6,Close:283.6,Volume:22433},
  {Date:1649847600000,Open:283.64,High:284.15,Low:283.62,Close:284.03,Volume:33964},
  {Date:1649847660000,Open:283.98,High:284.14,Low:283.91,Close:284.01,Volume:27711},
  {Date:1649847720000,Open:283.98,High:284.22,Low:283.9,Close:284.17,Volume:17090},
  {Date:1649847780000,Open:284.18,High:285.02,Low:284.14,Close:284.99,Volume:73585},
  {Date:1649847840000,Open:284.98,High:285.26,Low:284.81,Close:284.81,Volume:77582},
  {Date:1649847900000,Open:284.81,High:284.9,Low:284.67,Close:284.72,Volume:33368},
  {Date:1649847960000,Open:284.67,High:284.69,Low:284.47,Close:284.6,Volume:19578},
  {Date:1649848020000,Open:284.61,High:284.69,Low:284.54,Close:284.68,Volume:30905},
  {Date:1649848080000,Open:284.69,High:284.9,Low:284.62,Close:284.88,Volume:39504},
  {Date:1649848140000,Open:284.87,High:284.87,Low:284.61,Close:284.62,Volume:26355},
  {Date:1649848200000,Open:284.61,High:284.78,Low:284.52,Close:284.76,Volume:26386},
  {Date:1649848260000,Open:284.78,High:284.86,Low:284.63,Close:284.78,Volume:25872},
  {Date:1649848320000,Open:284.76,High:284.88,Low:284.71,Close:284.76,Volume:18526},
  {Date:1649848380000,Open:284.75,High:285.24,Low:284.74,Close:285.15,Volume:38250},
  {Date:1649848440000,Open:285.17,High:285.42,Low:285.05,Close:285.3,Volume:80991},
  {Date:1649848500000,Open:285.29,High:285.34,Low:285.08,Close:285.22,Volume:37712},
  {Date:1649848560000,Open:285.24,High:285.3,Low:285.1,Close:285.1,Volume:25697},
  {Date:1649848620000,Open:285.09,High:285.14,Low:284.89,Close:285.07,Volume:32478},
  {Date:1649848680000,Open:285.06,High:285.25,Low:285.05,Close:285.21,Volume:31950},
  {Date:1649848740000,Open:285.2,High:285.22,Low:285.07,Close:285.16,Volume:12448},
  {Date:1649848800000,Open:285.17,High:285.23,Low:284.99,Close:285.01,Volume:26271},
  {Date:1649848860000,Open:285,High:285.23,Low:284.99,Close:285.17,Volume:32554},
  {Date:1649848920000,Open:285.18,High:285.42,Low:285.15,Close:285.36,Volume:45911},
  {Date:1649848980000,Open:285.38,High:285.6,Low:285.38,Close:285.55,Volume:47816},
  {Date:1649849040000,Open:285.51,High:285.59,Low:285.44,Close:285.5,Volume:31700},
  {Date:1649849100000,Open:285.5,High:285.9,Low:285.5,Close:285.87,Volume:51563},
  {Date:1649849160000,Open:285.83,High:285.9,Low:285.68,Close:285.71,Volume:37968},
  {Date:1649849220000,Open:285.72,High:285.76,Low:285.6,Close:285.61,Volume:20678},
  {Date:1649849280000,Open:285.58,High:285.67,Low:285.4,Close:285.54,Volume:18607},
  {Date:1649849340000,Open:285.58,High:285.62,Low:285.49,Close:285.56,Volume:16850},
  {Date:1649849400000,Open:285.57,High:285.78,Low:285.53,Close:285.76,Volume:22000},
  {Date:1649849460000,Open:285.75,High:285.8,Low:285.68,Close:285.68,Volume:22715},
  {Date:1649849520000,Open:285.69,High:285.8,Low:285.65,Close:285.69,Volume:26349},
  {Date:1649849580000,Open:285.69,High:285.83,Low:285.67,Close:285.71,Volume:22740},
  {Date:1649849640000,Open:285.69,High:285.96,Low:285.48,Close:285.65,Volume:57494},
  {Date:1649849700000,Open:285.67,High:285.77,Low:285.56,Close:285.68,Volume:20805},
  {Date:1649849760000,Open:285.69,High:285.8,Low:285.65,Close:285.72,Volume:34365},
  {Date:1649849820000,Open:285.72,High:285.72,Low:285.58,Close:285.59,Volume:19158},
  {Date:1649849880000,Open:285.58,High:285.7,Low:285.57,Close:285.7,Volume:23436},
  {Date:1649849940000,Open:285.7,High:285.76,Low:285.61,Close:285.74,Volume:16478},
  {Date:1649850000000,Open:285.77,High:285.81,Low:285.64,Close:285.69,Volume:31069},
  {Date:1649850060000,Open:285.7,High:285.7,Low:285.62,Close:285.7,Volume:16625},
  {Date:1649850120000,Open:285.71,High:286,Low:285.71,Close:286,Volume:34302},
  {Date:1649850180000,Open:286,High:286.1,Low:285.82,Close:285.86,Volume:35727},
  {Date:1649850240000,Open:285.85,High:285.86,Low:285.56,Close:285.63,Volume:42080},
  {Date:1649850300000,Open:285.65,High:285.65,Low:285.19,Close:285.19,Volume:35268},
  {Date:1649850360000,Open:285.2,High:285.36,Low:285.18,Close:285.33,Volume:35098},
  {Date:1649850420000,Open:285.33,High:285.36,Low:285.17,Close:285.17,Volume:20557},
  {Date:1649850480000,Open:285.17,High:285.29,Low:285.1,Close:285.26,Volume:16803},
  {Date:1649850540000,Open:285.24,High:285.36,Low:285.2,Close:285.36,Volume:15292},
  {Date:1649850600000,Open:285.33,High:285.39,Low:285.27,Close:285.29,Volume:25898},
  {Date:1649850660000,Open:285.28,High:285.47,Low:285.26,Close:285.32,Volume:19607},
  {Date:1649850720000,Open:285.34,High:285.46,Low:285.26,Close:285.46,Volume:13002},
  {Date:1649850780000,Open:285.49,High:285.56,Low:285.48,Close:285.56,Volume:14955},
  {Date:1649850840000,Open:285.55,High:285.67,Low:285.55,Close:285.61,Volume:21725},
  {Date:1649850900000,Open:285.6,High:285.61,Low:285.5,Close:285.57,Volume:24164},
  {Date:1649850960000,Open:285.58,High:285.6,Low:285.41,Close:285.47,Volume:24789},
  {Date:1649851020000,Open:285.45,High:285.67,Low:285.44,Close:285.67,Volume:16814},
  {Date:1649851080000,Open:285.64,High:285.67,Low:285.53,Close:285.66,Volume:15273},
  {Date:1649851140000,Open:285.66,High:285.68,Low:285.54,Close:285.67,Volume:17328},
  {Date:1649851200000,Open:285.66,High:285.72,Low:285.35,Close:285.38,Volume:33397},
  {Date:1649851260000,Open:285.36,High:285.43,Low:285.26,Close:285.34,Volume:28198},
  {Date:1649851320000,Open:285.33,High:285.42,Low:285.23,Close:285.37,Volume:12687},
  {Date:1649851380000,Open:285.39,High:285.64,Low:285.39,Close:285.61,Volume:17180},
  {Date:1649851440000,Open:285.63,High:285.8,Low:285.63,Close:285.72,Volume:25027},
  {Date:1649851500000,Open:285.7,High:285.81,Low:285.64,Close:285.73,Volume:19857},
  {Date:1649851560000,Open:285.71,High:285.72,Low:285.48,Close:285.63,Volume:34650},
  {Date:1649851620000,Open:285.63,High:285.77,Low:285.63,Close:285.7,Volume:16469},
  {Date:1649851680000,Open:285.69,High:285.87,Low:285.59,Close:285.76,Volume:14704},
  {Date:1649851740000,Open:285.74,High:285.98,Low:285.73,Close:285.94,Volume:24354},
  {Date:1649851800000,Open:285.92,High:286.07,Low:285.63,Close:285.69,Volume:41856},
  {Date:1649851860000,Open:285.7,High:285.7,Low:285.43,Close:285.63,Volume:22231},
  {Date:1649851920000,Open:285.63,High:285.69,Low:285.52,Close:285.64,Volume:13064},
  {Date:1649851980000,Open:285.63,High:285.63,Low:285.5,Close:285.57,Volume:15223},
  {Date:1649852040000,Open:285.65,High:285.83,Low:285.56,Close:285.83,Volume:37501},
  {Date:1649852100000,Open:285.84,High:285.85,Low:285.69,Close:285.71,Volume:21245},
  {Date:1649852160000,Open:285.7,High:285.72,Low:285.62,Close:285.66,Volume:17972},
  {Date:1649852220000,Open:285.65,High:285.77,Low:285.59,Close:285.65,Volume:16845},
  {Date:1649852280000,Open:285.68,High:286.01,Low:285.68,Close:286.01,Volume:27338},
  {Date:1649852340000,Open:286.01,High:286.29,Low:285.99,Close:286.12,Volume:57536},
  {Date:1649852400000,Open:286.13,High:286.13,Low:285.83,Close:285.94,Volume:19150},
  {Date:1649852460000,Open:285.93,High:286.03,Low:285.86,Close:286.02,Volume:23586},
  {Date:1649852520000,Open:286.03,High:286.3,Low:286.02,Close:286.26,Volume:38761},
  {Date:1649852580000,Open:286.28,High:286.34,Low:286.13,Close:286.16,Volume:23405},
  {Date:1649852640000,Open:286.19,High:286.2,Low:286.07,Close:286.18,Volume:14660},
  {Date:1649852700000,Open:286.17,High:286.42,Low:286.15,Close:286.32,Volume:41203},
  {Date:1649852760000,Open:286.32,High:286.36,Low:286.19,Close:286.22,Volume:19782},
  {Date:1649852820000,Open:286.2,High:286.27,Low:285.9,Close:286.12,Volume:49183},
  {Date:1649852880000,Open:286.12,High:286.2,Low:286.12,Close:286.12,Volume:13620},
  {Date:1649852940000,Open:286.14,High:286.14,Low:286.05,Close:286.07,Volume:15096},
  {Date:1649853000000,Open:286.09,High:286.13,Low:285.91,Close:285.99,Volume:27396},
  {Date:1649853060000,Open:286,High:286.01,Low:285.89,Close:286,Volume:20352},
  {Date:1649853120000,Open:286.02,High:286.05,Low:285.87,Close:286.02,Volume:21114},
  {Date:1649853180000,Open:286.03,High:286.05,Low:285.83,Close:285.86,Volume:20378},
  {Date:1649853240000,Open:285.87,High:286,Low:285.84,Close:285.92,Volume:34398},
  {Date:1649853300000,Open:285.92,High:286.24,Low:285.92,Close:286.18,Volume:26062},
  {Date:1649853360000,Open:286.16,High:286.32,Low:286.11,Close:286.13,Volume:27939},
  {Date:1649853420000,Open:286.13,High:286.25,Low:286.13,Close:286.25,Volume:28972},
  {Date:1649853480000,Open:286.25,High:286.29,Low:286.06,Close:286.06,Volume:32361},
  {Date:1649853540000,Open:286.1,High:286.26,Low:286.04,Close:286.22,Volume:16056},
  {Date:1649853600000,Open:286.25,High:286.62,Low:286.16,Close:286.23,Volume:29015},
  {Date:1649853660000,Open:286.23,High:286.26,Low:286.14,Close:286.2,Volume:17686},
  {Date:1649853720000,Open:286.17,High:286.19,Low:286.1,Close:286.17,Volume:15480},
  {Date:1649853780000,Open:286.18,High:286.28,Low:286.17,Close:286.27,Volume:17654},
  {Date:1649853840000,Open:286.27,High:286.4,Low:286.24,Close:286.27,Volume:23426},
  {Date:1649853900000,Open:286.28,High:286.39,Low:286.19,Close:286.3,Volume:23571},
  {Date:1649853960000,Open:286.29,High:286.35,Low:286.25,Close:286.27,Volume:12630},
  {Date:1649854020000,Open:286.29,High:286.32,Low:286.23,Close:286.32,Volume:13372},
  {Date:1649854080000,Open:286.3,High:286.41,Low:286.27,Close:286.29,Volume:14142},
  {Date:1649854140000,Open:286.3,High:286.34,Low:286.16,Close:286.3,Volume:39928},
  {Date:1649854200000,Open:286.3,High:286.42,Low:286.28,Close:286.34,Volume:19423},
  {Date:1649854260000,Open:286.36,High:286.4,Low:286.23,Close:286.24,Volume:22212},
  {Date:1649854320000,Open:286.26,High:286.31,Low:286.16,Close:286.2,Volume:20930},
  {Date:1649854380000,Open:286.21,High:286.26,Low:286.14,Close:286.25,Volume:15616},
  {Date:1649854440000,Open:286.26,High:286.36,Low:286.22,Close:286.24,Volume:19106},
  {Date:1649854500000,Open:286.25,High:286.27,Low:286.18,Close:286.19,Volume:22496},
  {Date:1649854560000,Open:286.2,High:286.21,Low:286.1,Close:286.19,Volume:22694},
  {Date:1649854620000,Open:286.17,High:286.22,Low:286.1,Close:286.22,Volume:23774},
  {Date:1649854680000,Open:286.2,High:286.28,Low:286.06,Close:286.06,Volume:21255},
  {Date:1649854740000,Open:286.08,High:286.16,Low:286.02,Close:286.09,Volume:22495},
  {Date:1649854800000,Open:286.1,High:286.16,Low:286.04,Close:286.13,Volume:18638},
  {Date:1649854860000,Open:286.12,High:286.22,Low:286.01,Close:286.07,Volume:28439},
  {Date:1649854920000,Open:286.07,High:286.3,Low:285.97,Close:286.3,Volume:32658},
  {Date:1649854980000,Open:286.28,High:286.44,Low:286.24,Close:286.34,Volume:20654},
  {Date:1649855040000,Open:286.33,High:286.39,Low:286.23,Close:286.25,Volume:17270},
  {Date:1649855100000,Open:286.25,High:286.31,Low:286.21,Close:286.28,Volume:11596},
  {Date:1649855160000,Open:286.29,High:286.37,Low:286.06,Close:286.1,Volume:35632},
  {Date:1649855220000,Open:286.11,High:286.22,Low:286.05,Close:286.12,Volume:17587},
  {Date:1649855280000,Open:286.11,High:286.24,Low:286.1,Close:286.23,Volume:11695},
  {Date:1649855340000,Open:286.22,High:286.35,Low:286.2,Close:286.28,Volume:14107},
  {Date:1649855400000,Open:286.27,High:286.4,Low:286.23,Close:286.39,Volume:20065},
  {Date:1649855460000,Open:286.36,High:286.62,Low:286.36,Close:286.57,Volume:42629},
  {Date:1649855520000,Open:286.58,High:286.74,Low:286.57,Close:286.67,Volume:25175},
  {Date:1649855580000,Open:286.66,High:286.66,Low:286.52,Close:286.55,Volume:16457},
  {Date:1649855640000,Open:286.55,High:286.55,Low:286.34,Close:286.39,Volume:17989},
  {Date:1649855700000,Open:286.38,High:286.45,Low:286.32,Close:286.42,Volume:16288},
  {Date:1649855760000,Open:286.41,High:286.43,Low:286.35,Close:286.43,Volume:12470},
  {Date:1649855820000,Open:286.44,High:286.48,Low:286.33,Close:286.4,Volume:15141},
  {Date:1649855880000,Open:286.43,High:286.56,Low:286.41,Close:286.52,Volume:21990},
  {Date:1649855940000,Open:286.53,High:286.54,Low:286.38,Close:286.43,Volume:16585},
  {Date:1649856000000,Open:286.41,High:286.58,Low:286.37,Close:286.55,Volume:19651},
  {Date:1649856060000,Open:286.54,High:286.65,Low:286.52,Close:286.61,Volume:12811},
  {Date:1649856120000,Open:286.58,High:286.65,Low:286.57,Close:286.62,Volume:11652},
  {Date:1649856180000,Open:286.62,High:286.79,Low:286.62,Close:286.79,Volume:20925},
  {Date:1649856240000,Open:286.8,High:286.86,Low:286.59,Close:286.63,Volume:22225},
  {Date:1649856300000,Open:286.61,High:286.62,Low:286.31,Close:286.33,Volume:30324},
  {Date:1649856360000,Open:286.32,High:286.44,Low:286.27,Close:286.33,Volume:29903},
  {Date:1649856420000,Open:286.33,High:286.44,Low:286.28,Close:286.39,Volume:23032},
  {Date:1649856480000,Open:286.41,High:286.5,Low:286.33,Close:286.4,Volume:30054},
  {Date:1649856540000,Open:286.43,High:286.58,Low:286.43,Close:286.54,Volume:16300},
  {Date:1649856600000,Open:286.56,High:286.58,Low:286.35,Close:286.35,Volume:16773},
  {Date:1649856660000,Open:286.33,High:286.33,Low:286.26,Close:286.32,Volume:17825},
  {Date:1649856720000,Open:286.29,High:286.44,Low:286.28,Close:286.34,Volume:11774},
  {Date:1649856780000,Open:286.34,High:286.36,Low:286.15,Close:286.22,Volume:21540},
  {Date:1649856840000,Open:286.21,High:286.26,Low:286.11,Close:286.13,Volume:34196},
  {Date:1649856900000,Open:286.14,High:286.17,Low:286.08,Close:286.11,Volume:11905},
  {Date:1649856960000,Open:286.08,High:286.09,Low:285.93,Close:286.02,Volume:57100},
  {Date:1649857020000,Open:286.01,High:286.03,Low:285.83,Close:285.93,Volume:24832},
  {Date:1649857080000,Open:285.94,High:286,Low:285.94,Close:285.99,Volume:9228},
  {Date:1649857140000,Open:285.97,High:286.1,Low:285.95,Close:286.08,Volume:13612},
  {Date:1649857200000,Open:286.08,High:286.14,Low:286,Close:286.06,Volume:14908},
  {Date:1649857260000,Open:286.05,High:286.05,Low:285.92,Close:286.04,Volume:13503},
  {Date:1649857320000,Open:286.03,High:286.07,Low:285.89,Close:285.92,Volume:25104},
  {Date:1649857380000,Open:285.95,High:285.96,Low:285.85,Close:285.92,Volume:11515},
  {Date:1649857440000,Open:285.94,High:286.05,Low:285.93,Close:285.94,Volume:14407},
  {Date:1649857500000,Open:285.93,High:286.03,Low:285.92,Close:286.03,Volume:29697},
  {Date:1649857560000,Open:286.04,High:286.14,Low:285.95,Close:285.99,Volume:14550},
  {Date:1649857620000,Open:285.99,High:285.99,Low:285.75,Close:285.75,Volume:42672},
  {Date:1649857680000,Open:285.73,High:285.76,Low:285.58,Close:285.68,Volume:30775},
  {Date:1649857740000,Open:285.69,High:285.81,Low:285.68,Close:285.8,Volume:15785},
  {Date:1649857800000,Open:285.8,High:285.8,Low:285.62,Close:285.67,Volume:16283},
  {Date:1649857860000,Open:285.66,High:285.67,Low:285.56,Close:285.58,Volume:20315},
  {Date:1649857920000,Open:285.57,High:285.57,Low:285.36,Close:285.43,Volume:23877},
  {Date:1649857980000,Open:285.45,High:285.47,Low:285.28,Close:285.34,Volume:36273},
  {Date:1649858040000,Open:285.33,High:285.48,Low:285.28,Close:285.46,Volume:26077},
  {Date:1649858100000,Open:285.46,High:285.6,Low:285.46,Close:285.5,Volume:20545},
  {Date:1649858160000,Open:285.52,High:285.6,Low:285.45,Close:285.6,Volume:30858},
  {Date:1649858220000,Open:285.62,High:285.69,Low:285.6,Close:285.66,Volume:13738},
  {Date:1649858280000,Open:285.68,High:285.8,Low:285.68,Close:285.71,Volume:22668},
  {Date:1649858340000,Open:285.7,High:286.01,Low:285.69,Close:285.94,Volume:32283},
  {Date:1649858400000,Open:285.94,High:286,Low:285.86,Close:285.9,Volume:21954},
  {Date:1649858460000,Open:285.9,High:285.98,Low:285.84,Close:285.87,Volume:18435},
  {Date:1649858520000,Open:285.92,High:286,Low:285.87,Close:285.91,Volume:17877},
  {Date:1649858580000,Open:285.91,High:286.11,Low:285.9,Close:285.93,Volume:28928},
  {Date:1649858640000,Open:285.93,High:286.1,Low:285.86,Close:286.06,Volume:30313},
  {Date:1649858700000,Open:286.05,High:286.12,Low:285.95,Close:286.06,Volume:17560},
  {Date:1649858760000,Open:286.07,High:286.28,Low:286.06,Close:286.26,Volume:26634},
  {Date:1649858820000,Open:286.26,High:286.34,Low:286.21,Close:286.21,Volume:21552},
  {Date:1649858880000,Open:286.21,High:286.36,Low:286.19,Close:286.33,Volume:16173},
  {Date:1649858940000,Open:286.34,High:286.41,Low:286.27,Close:286.29,Volume:10113},
  {Date:1649859000000,Open:286.28,High:286.28,Low:286.1,Close:286.16,Volume:23948},
  {Date:1649859060000,Open:286.15,High:286.15,Low:286.03,Close:286.08,Volume:25395},
  {Date:1649859120000,Open:286.05,High:286.05,Low:285.78,Close:285.83,Volume:30288},
  {Date:1649859180000,Open:285.84,High:286.09,Low:285.79,Close:286.06,Volume:19991},
  {Date:1649859240000,Open:286.06,High:286.09,Low:285.98,Close:286,Volume:16041},
  {Date:1649859300000,Open:286,High:286.1,Low:285.95,Close:286.1,Volume:13064},
  {Date:1649859360000,Open:286.06,High:286.1,Low:286.02,Close:286.05,Volume:8628},
  {Date:1649859420000,Open:286.06,High:286.1,Low:285.99,Close:286.04,Volume:17819},
  {Date:1649859480000,Open:286.04,High:286.09,Low:285.98,Close:286.06,Volume:16794},
  {Date:1649859540000,Open:286.06,High:286.16,Low:286.03,Close:286.12,Volume:18364},
  {Date:1649859600000,Open:286.1,High:286.23,Low:286.1,Close:286.13,Volume:14573},
  {Date:1649859660000,Open:286.13,High:286.37,Low:286.11,Close:286.26,Volume:29790},
  {Date:1649859720000,Open:286.27,High:286.32,Low:286.21,Close:286.31,Volume:15409},
  {Date:1649859780000,Open:286.31,High:286.31,Low:286.09,Close:286.1,Volume:10858},
  {Date:1649859840000,Open:286.12,High:286.26,Low:286.12,Close:286.21,Volume:16660},
  {Date:1649859900000,Open:286.21,High:286.26,Low:286.01,Close:286.19,Volume:38241},
  {Date:1649859960000,Open:286.18,High:286.3,Low:286.14,Close:286.23,Volume:19257},
  {Date:1649860020000,Open:286.21,High:286.34,Low:286.18,Close:286.32,Volume:17021},
  {Date:1649860080000,Open:286.33,High:286.44,Low:286.33,Close:286.44,Volume:14404},
  {Date:1649860140000,Open:286.44,High:286.44,Low:286.33,Close:286.36,Volume:20730},
  {Date:1649860200000,Open:286.36,High:286.4,Low:286.3,Close:286.4,Volume:20346},
  {Date:1649860260000,Open:286.41,High:286.43,Low:286.15,Close:286.19,Volume:23709},
  {Date:1649860320000,Open:286.19,High:286.33,Low:286.19,Close:286.3,Volume:12125},
  {Date:1649860380000,Open:286.33,High:286.37,Low:286.27,Close:286.27,Volume:22493},
  {Date:1649860440000,Open:286.28,High:286.4,Low:286.27,Close:286.39,Volume:18132},
  {Date:1649860500000,Open:286.38,High:286.53,Low:286.35,Close:286.41,Volume:37205},
  {Date:1649860560000,Open:286.4,High:286.63,Low:286.38,Close:286.59,Volume:27489},
  {Date:1649860620000,Open:286.59,High:286.76,Low:286.58,Close:286.73,Volume:33522},
  {Date:1649860680000,Open:286.73,High:286.84,Low:286.71,Close:286.82,Volume:27767},
  {Date:1649860740000,Open:286.81,High:286.86,Low:286.66,Close:286.74,Volume:28545},
  {Date:1649860800000,Open:286.74,High:286.85,Low:286.71,Close:286.84,Volume:12483},
  {Date:1649860860000,Open:286.84,High:286.92,Low:286.83,Close:286.92,Volume:16485},
  {Date:1649860920000,Open:286.92,High:286.97,Low:286.81,Close:286.87,Volume:27154},
  {Date:1649860980000,Open:286.89,High:286.92,Low:286.86,Close:286.89,Volume:14502},
  {Date:1649861040000,Open:286.92,High:287.03,Low:286.87,Close:286.95,Volume:29184},
  {Date:1649861100000,Open:286.95,High:287,Low:286.87,Close:286.92,Volume:29174},
  {Date:1649861160000,Open:286.94,High:287,Low:286.81,Close:286.81,Volume:38363},
  {Date:1649861220000,Open:286.87,High:287.1,Low:286.87,Close:287.05,Volume:23032},
  {Date:1649861280000,Open:287.07,High:287.28,Low:287.05,Close:287.21,Volume:39755},
  {Date:1649861340000,Open:287.21,High:287.26,Low:287.15,Close:287.21,Volume:35864},
  {Date:1649861400000,Open:287.21,High:287.34,Low:287.05,Close:287.07,Volume:44299},
  {Date:1649861460000,Open:287.06,High:287.2,Low:287.03,Close:287.12,Volume:19374},
  {Date:1649861520000,Open:287.11,High:287.2,Low:287.06,Close:287.1,Volume:22775},
  {Date:1649861580000,Open:287.09,High:287.22,Low:287.07,Close:287.16,Volume:11901},
  {Date:1649861640000,Open:287.17,High:287.22,Low:287.05,Close:287.07,Volume:20224},
  {Date:1649861700000,Open:287.07,High:287.13,Low:287.03,Close:287.08,Volume:17358},
  {Date:1649861760000,Open:287.11,High:287.18,Low:287.08,Close:287.18,Volume:24833},
  {Date:1649861820000,Open:287.18,High:287.41,Low:287.18,Close:287.32,Volume:55834},
  {Date:1649861880000,Open:287.33,High:287.42,Low:287.3,Close:287.39,Volume:27115},
  {Date:1649861940000,Open:287.38,High:287.4,Low:287.2,Close:287.22,Volume:22168},
  {Date:1649862000000,Open:287.23,High:287.34,Low:287.05,Close:287.06,Volume:38061},
  {Date:1649862060000,Open:287.07,High:287.07,Low:286.86,Close:286.9,Volume:32873},
  {Date:1649862120000,Open:286.91,High:286.98,Low:286.77,Close:286.94,Volume:29357},
  {Date:1649862180000,Open:286.94,High:287,Low:286.77,Close:286.82,Volume:39595},
  {Date:1649862240000,Open:286.82,High:286.91,Low:286.78,Close:286.91,Volume:14471},
  {Date:1649862300000,Open:286.9,High:287.3,Low:286.9,Close:287.28,Volume:30883},
  {Date:1649862360000,Open:287.27,High:287.42,Low:287.22,Close:287.38,Volume:32260},
  {Date:1649862420000,Open:287.39,High:287.58,Low:287.37,Close:287.44,Volume:51364},
  {Date:1649862480000,Open:287.44,High:287.72,Low:287.43,Close:287.51,Volume:37347},
  {Date:1649862540000,Open:287.53,High:287.77,Low:287.51,Close:287.67,Volume:38998},
  {Date:1649862600000,Open:287.7,High:287.79,Low:287.64,Close:287.76,Volume:31985},
  {Date:1649862660000,Open:287.75,High:287.77,Low:287.58,Close:287.74,Volume:29039},
  {Date:1649862720000,Open:287.73,High:287.79,Low:287.65,Close:287.78,Volume:33026},
  {Date:1649862780000,Open:287.8,High:287.87,Low:287.76,Close:287.81,Volume:27689},
  {Date:1649862840000,Open:287.83,High:287.92,Low:287.8,Close:287.82,Volume:28882},
  {Date:1649862900000,Open:287.81,High:287.97,Low:287.8,Close:287.95,Volume:29592},
  {Date:1649862960000,Open:287.96,High:288.04,Low:287.92,Close:287.94,Volume:55121},
  {Date:1649863020000,Open:287.95,High:288.09,Low:287.93,Close:288.07,Volume:27560},
  {Date:1649863080000,Open:288.07,High:288.12,Low:287.99,Close:288.07,Volume:39048},
  {Date:1649863140000,Open:288.06,High:288.16,Low:288.01,Close:288.04,Volume:37496},
  {Date:1649863200000,Open:288.02,High:288.05,Low:287.76,Close:287.81,Volume:47843},
  {Date:1649863260000,Open:287.81,High:287.85,Low:287.67,Close:287.71,Volume:55392},
  {Date:1649863320000,Open:287.7,High:287.77,Low:287.68,Close:287.74,Volume:32702},
  {Date:1649863380000,Open:287.74,High:287.82,Low:287.72,Close:287.82,Volume:42327},
  {Date:1649863440000,Open:287.82,High:287.93,Low:287.81,Close:287.91,Volume:35473},
  {Date:1649863500000,Open:287.92,High:288.01,Low:287.89,Close:287.95,Volume:40552},
  {Date:1649863560000,Open:287.95,High:288.06,Low:287.94,Close:287.97,Volume:31570},
  {Date:1649863620000,Open:287.97,High:287.99,Low:287.76,Close:287.88,Volume:39974},
  {Date:1649863680000,Open:287.88,High:288.15,Low:287.87,Close:288.14,Volume:34060},
  {Date:1649863740000,Open:288.11,High:288.11,Low:288.04,Close:288.07,Volume:36172},
  {Date:1649863800000,Open:288.06,High:288.1,Low:287.91,Close:288,Volume:43323},
  {Date:1649863860000,Open:288,High:288.18,Low:287.97,Close:288.17,Volume:36531},
  {Date:1649863920000,Open:288.17,High:288.4,Low:288.14,Close:288.39,Volume:69299},
  {Date:1649863980000,Open:288.39,High:288.5,Low:288.32,Close:288.48,Volume:72362},
  {Date:1649864040000,Open:288.48,High:288.58,Low:288.41,Close:288.44,Volume:48394},
  {Date:1649864100000,Open:288.45,High:288.56,Low:288.35,Close:288.54,Volume:55393},
  {Date:1649864160000,Open:288.52,High:288.55,Low:288.11,Close:288.16,Volume:73083},
  {Date:1649864220000,Open:288.14,High:288.48,Low:288.14,Close:288.46,Volume:45926},
  {Date:1649864280000,Open:288.46,High:288.54,Low:288.36,Close:288.4,Volume:44675},
  {Date:1649864340000,Open:288.39,High:288.48,Low:288.32,Close:288.42,Volume:39451},
  {Date:1649864400000,Open:288.41,High:288.44,Low:288.31,Close:288.35,Volume:46241},
  {Date:1649864460000,Open:288.33,High:288.35,Low:288.18,Close:288.35,Volume:53960},
  {Date:1649864520000,Open:288.35,High:288.38,Low:288.18,Close:288.23,Volume:55907},
  {Date:1649864580000,Open:288.23,High:288.32,Low:288.12,Close:288.15,Volume:50229},
  {Date:1649864640000,Open:288.16,High:288.18,Low:288.06,Close:288.15,Volume:66863},
  {Date:1649864700000,Open:288.14,High:288.32,Low:288.09,Close:288.2,Volume:72523},
  {Date:1649864760000,Open:288.2,High:288.39,Low:288.19,Close:288.39,Volume:62308},
  {Date:1649864820000,Open:288.38,High:288.39,Low:288.19,Close:288.3,Volume:71194},
  {Date:1649864880000,Open:288.29,High:288.32,Low:287.99,Close:288.05,Volume:72909},
  {Date:1649864940000,Open:288.04,High:288.12,Low:287.87,Close:288.06,Volume:79361},
  {Date:1649865000000,Open:288.04,High:288.24,Low:287.65,Close:287.87,Volume:95362},
  {Date:1649865060000,Open:287.86,High:287.95,Low:287.73,Close:287.8,Volume:57193},
  {Date:1649865120000,Open:287.79,High:287.93,Low:287.58,Close:287.92,Volume:76699},
  {Date:1649865180000,Open:287.89,High:287.92,Low:287.61,Close:287.67,Volume:76323},
  {Date:1649865240000,Open:287.68,High:288.35,Low:287.47,Close:287.7,Volume:92112},
  {Date:1649865300000,Open:287.71,High:287.81,Low:287.57,Close:287.69,Volume:76299},
  {Date:1649865360000,Open:287.68,High:287.83,Low:287.56,Close:287.81,Volume:71957},
  {Date:1649865420000,Open:287.81,High:287.83,Low:287.64,Close:287.69,Volume:52673},
  {Date:1649865480000,Open:287.69,High:287.7,Low:287.57,Close:287.6,Volume:71778},
  {Date:1649865540000,Open:287.6,High:287.84,Low:287.3,Close:287.6,Volume:90524}  
]
// set data to all series
valueSeries.data.setAll(data);
volumeSeries.data.setAll(data);
sbSeries.data.setAll(data);