import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

root.setThemes([
  am5themes_Animated.new(root)
]);


const chart = root.container.children.push(am5xy.XYChart.new(root, { panX: false, panY: false, wheelX: "panX", wheelY: "zoomX" }));
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "zoomX" }));
cursor.lineY.set("visible", false);

let date = new Date();
date.setHours(0, 0, 0, 0);
let value = 1;

function generateData() {
  value = Math.round((Math.random() * 10 - 5) + value);
  if (date.getDay() == 5) {
    am5.time.add(date, "day", 3);
  }
  else {
    am5.time.add(date, "day", 1);
  }

  return { date: date.getTime(), value: value };
}

function generateDatas(count: number) {
  const data = [];
  for (let i = 0; i < count; ++i) {
    data.push(generateData());
  }
  return data;
}

// CategoryDateAxis instead of DateAxis for having date axis which does not show gaps for dates with no-data
const xAxis = chart.xAxes.push(am5xy.CategoryDateAxis.new(root, { categoryField: "date", baseInterval: { timeUnit: "day", count: 1 }, renderer: am5xy.AxisRendererX.new(root, {}) }));
const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { renderer: am5xy.AxisRendererY.new(root, {}) }));

xAxis.set("tooltip", am5.Tooltip.new(root, { themeTags: ["axis"], animationDuration: 200 }))

const series = chart.series.push(am5xy.LineSeries.new(root, { name: "Series", xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "date" }));

const tooltip = series.set("tooltip", am5.Tooltip.new(root, {}));
tooltip.label.set("text", "{valueY}");

chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal" }));

let data = generateDatas(200);
series.data.setAll(data);
xAxis.data.setAll(data);

series.appear();
chart.appear();