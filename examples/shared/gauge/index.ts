import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

root.setThemes([
  am5themes_Animated.new(root)
]);

const chart = root.container.children.push(
  am5radar.RadarChart.new(root, {
    panX: false,
    panY: false,
    startAngle: 180,
    endAngle: 360
  })
);

const axisRenderer = am5radar.AxisRendererCircular.new(root, {
  innerRadius: am5.percent(98),
  strokeOpacity: 0.1
});

const xAxis = chart.xAxes.push(
  am5xy.ValueAxis.new(root, {
    maxDeviation: 0,
    min: 0,
    max: 100,
    strictMinMax: true,
    renderer: axisRenderer
  })
);

const axisDataItem = xAxis.makeDataItem({});
axisDataItem.set("value", 0);

const bullet = axisDataItem.set("bullet", am5xy.AxisBullet.new(root, {}));
bullet.children.push(am5radar.ClockHand.new(root, {}));
xAxis.createAxisRange(axisDataItem);

axisDataItem.get("grid").set("visible", false);

setInterval(() => {
  axisDataItem.animate({
    key: "value",
    to: Math.round(Math.random() * 100),
    duration: 800,
    easing: am5.ease.out(am5.ease.cubic)
  });
}, 1000);

chart.appear();