import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

root.setThemes([
  am5themes_Animated.new(root)
]);


const chart = root.container.children.push(am5radar.RadarChart.new(root, { panX: false, panY: false, wheelX: "panX", wheelY: "zoomX" }));
const cursor = chart.set("cursor", am5radar.RadarCursor.new(root, { behavior: "zoomX" }));
cursor.lineY.set("visible", false);

let i = -1;
let value = 10;

function generateData() {
  value = Math.round((Math.random() * 4 - 2) + value);
  i++;
  return { category: "cat" + i, value: value };
}

function generateDatas(count: number) {
  const data = [];
  for (let i = 0; i < count; ++i) {
    data.push(generateData());
  }
  return data;
}
const xRenderer = am5radar.AxisRendererCircular.new(root, {});
xRenderer.labels.template.setAll({ radius: 10 });
const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { maxDeviation:0, categoryField: "category", renderer: xRenderer }));
const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { renderer: am5radar.AxisRendererRadial.new(root, {}) }));

xAxis.set("tooltip", am5.Tooltip.new(root, { themeTags: ["axis"], animationDuration: 200 }))

const series = chart.series.push(am5radar.RadarLineSeries.new(root, { name: "Series", xAxis: xAxis, yAxis: yAxis, "valueYField": "value", "categoryXField": "category" }));
series.bullets.push(() => {
  return am5.Bullet.new(root, { sprite: am5.Circle.new(root, { radius: 5, fill: series.get("fill") }) })
})

const tooltip = series.set("tooltip", am5.Tooltip.new(root, {}));
tooltip.label.set("text", "{valueY}");

chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal" }));
chart.set("scrollbarY", am5.Scrollbar.new(root, { orientation: "vertical" }));

let data = generateDatas(12);
series.data.setAll(data);
xAxis.data.setAll(data);

series.appear();
chart.appear();