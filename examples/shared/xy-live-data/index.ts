import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

root.setThemes([
  am5themes_Animated.new(root)
]);

let value = 100;

function generateChartData() {
  var chartData = [];
  var firstDate = new Date();
  firstDate.setDate(firstDate.getDate() - 1000);
  firstDate.setHours(0, 0, 0, 0);

  for (var i = 0; i < 16; i++) {
    var newDate = new Date(firstDate);
    newDate.setDate(newDate.getDate() + i);

    value += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);

    chartData.push({
      date: newDate.getTime(),
      value: value
    });
  }
  return chartData;
}

const data = generateChartData();

const chart = root.container.children.push(
  am5xy.XYChart.new(
    root,
    {
      focusable: true,
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX"
    }
  )
);

let easing = am5.ease.linear;

const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, { maxDeviation: 0.5, groupData: false, baseInterval: { timeUnit: "day", count: 1 }, renderer: am5xy.AxisRendererX.new(root, { minGridDistance:50 }) }));
const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { renderer: am5xy.AxisRendererY.new(root, {}) }));
xAxis.set("tooltip", am5.Tooltip.new(root, { themeTags: ["axis"], animationDuration: 300 }))

const series = chart.series.push(am5xy.LineSeries.new(root, { minBulletDistance: 10, name: "Series 1", xAxis: xAxis, yAxis: yAxis, "valueYField": "value", "valueXField": "date" }));
series.data.setAll(data);

var tooltip = am5.Tooltip.new(root, { pointerOrientation: "horizontal" });
tooltip.label.set("text", "{valueY}");
series.set("tooltip", tooltip);


const cursor = chart.set("cursor", am5xy.XYCursor.new(root, { xAxis: xAxis }));
cursor.lineY.set("visible", false);

series.bullets.push(() => {
  return am5.Bullet.new(root, { sprite: am5.Circle.new(root, { radius: 4, fill: series.get("fill") }) })
})

setInterval(() => {
  addData();
}, 1000)


function addData() {
  const lastDataItem = series.dataItems[series.dataItems.length - 1];
  const lastValue = lastDataItem.get("valueY");
  const newValue = value + Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 2);
  const lastDate = new Date(lastDataItem.get("valueX")!);
  let time = am5.time.add(new Date(lastDate), "day", 1).getTime();
  series.data.removeIndex(0);
  series.data.push({ date: time, value: newValue })

  let newDataItem = series.dataItems[series.dataItems.length - 1];
  newDataItem.animate({ key: "valueYWorking", to: newValue, from: lastValue, duration: 600, easing: easing });

  let animation = newDataItem.animate({ key: "locationX", to: 0.5, from: -0.5, duration: 600 });
  if (animation) {
    let tooltip = xAxis.get("tooltip");
    if (tooltip && !tooltip.isHidden()) {
      animation.events.on("stopped", () => {
         xAxis.updateTooltip();
      })
    }
  }
}
