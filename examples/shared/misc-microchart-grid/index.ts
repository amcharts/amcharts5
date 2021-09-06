import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Micro from "@amcharts/amcharts5/themes/Micro";

const tickers = [
  "AAPL", "ADBE", "ADSK", "AMD", "AMZN", "ATVI", "CRM", "CSCO", "COIN", "DELL",
  "DOCU", "EA", "EBAY", "FB", "GOOG", "HOOD", "IBM", "INTC", "MSFT", "NET",
  "NFLX", "NVDA", "ORCL", "PLTR", "PYPL", "ROKU", "SAP", "SHOP", "SNAP",
  "SONY", "STX", "T", "TSLA", "TSM", "TWTR", "U", "UBER", "VMW", "WDC", "ZM"
];

for (let i = 0; i < tickers.length; i++) {
  const ticker = tickers[i];
  const positive = am5.color(0x50b300);
  const negative = am5.color(0xb30000);

  const data = generateData(20);
  const change = Math.round((data[data.length - 1].value / data[0].value - 1) * 1000) / 10;
  const color = change < 0 ? negative : positive;

  const div = document.getElementById("chartdiv");
  div.style.overflow = "auto";

  const row = document.createElement("div");
  row.style.borderBottom = "1px solid #eee";
  row.style.clear = "left";
  div.appendChild(row);

  const col1 = document.createElement("div");
  col1.innerHTML = ticker;
  col1.style.fontSize = "2em";
  col1.style.width = "10%";
  col1.style.padding = "0.2em 0.4em";
  col1.style.float = "left";
  row.appendChild(col1);

  const col2 = document.createElement("div");
  col2.innerHTML = change + "%";
  col2.style.fontSize = "2em";
  col2.style.width = "10%";
  col2.style.padding = "0.2em 0.4em";
  col2.style.float = "left";
  col2.style.color = color.toCSSHex();
  col2.style.textAlign = "center";
  row.appendChild(col2);

  const col3 = document.createElement("div");
  col3.style.fontSize = "2em";
  col3.style.width = "33%";
  col3.style.height = "35px";
  col3.style.padding = "0.2em 0.4em";
  col3.style.float = "left";
  row.appendChild(col3);
  createValueChart(col3, data, color);

  const col4 = document.createElement("div");
  col4.style.fontSize = "2em";
  col4.style.width = "33%";
  col4.style.height = "35px";
  col4.style.padding = "0.2em 0.4em";
  col4.style.float = "left";
  row.appendChild(col4);
  createVolumeChart(col4, data);
}

// Generate random data
function generateData(count: number) {
  let date = new Date();
  date.setHours(0, 0, 0, 0);
  let value = Math.round(Math.random() * 100);
  let volume = Math.round(Math.random() * 10000);

  const data = [];
  for (let i = 0; i < count; ++i) {
    value = Math.round((Math.random() * 6 - 3) + value);
    volume = Math.round((Math.random() * 1000 - 500) + volume);
    if (volume < 0) {
      volume = 0;
    }
    am5.time.add(date, "day", 1);
    data.push({
      date: date.getTime(),
      value: value,
      volume: volume
    });
  }
  return data;
}


function createValueChart(div, data, color) {
  let root = am5.Root.new(div);

  root.setThemes([
    am5themes_Micro.new(root)
  ]);

  let chart = root.container.children.push(am5xy.XYChart.new(root, {
    panX: false,
    panY: false,
    wheelX: "none",
    wheelY: "none"
  }));

  chart.zoomOutButton.set("forceHidden", true);

  let xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
    maxDeviation: 0,
    baseInterval: { timeUnit: "day", count: 1 },
    renderer: am5xy.AxisRendererX.new(root, {})
  }));

  let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
    strictMinMax: true,
    renderer: am5xy.AxisRendererY.new(root, {})
  }));


  let series = chart.series.push(am5xy.LineSeries.new(root, {
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: "value",
    valueXField: "date",
    stroke: color
  }));

  series.strokes.template.setAll({
    strokeWidth: 2
  });

  series.data.setAll(data);
}

function createVolumeChart(div, data) {
  let root = am5.Root.new(div);

  root.setThemes([
    am5themes_Micro.new(root)
  ]);

  let chart = root.container.children.push(am5xy.XYChart.new(root, {
    panX: false,
    panY: false,
    wheelX: "none",
    wheelY: "none"
  }));

  chart.zoomOutButton.set("forceHidden", true);

  let xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
    maxDeviation: 0,
    baseInterval: { timeUnit: "day", count: 1 },
    renderer: am5xy.AxisRendererX.new(root, {})
  }));

  let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
    renderer: am5xy.AxisRendererY.new(root, {})
  }));


  let series = chart.series.push(am5xy.ColumnSeries.new(root, {
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: "volume",
    valueXField: "date",
    fill: am5.color(0x999999)
  }));

  series.data.setAll(data);
}