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
  innerRadius: 20
});

axisRenderer.grid.template.setAll({
  stroke: root.interfaceColors.get("background"),
  visible: true,
  strokeOpacity: 0.8
});

axisRenderer.adapters.add("innerRadius", (innerRadius) => {
  return axisRenderer.getPrivate("radius") - 40
});

const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 0,
  min: -40,
  max: 100,
  strictMinMax: true,
  renderer: axisRenderer
}));

const axisDataItem = xAxis.makeDataItem({});
const bullet = axisDataItem.set("bullet", am5xy.AxisBullet.new(root, {}));
const hand = bullet.children.push(am5radar.ClockHand.new(root, {
  pinRadius: 0,
  radius: 100,
  innerRadius: 80
}));


chart.events.on("boundschanged", ()=>{
  const realRadius = axisRenderer.getPrivate("radius");
  hand.setAll({
    radius: realRadius,
    innerRadius: realRadius / 2
  })
})

hand.pin.set("visible", false);
xAxis.createAxisRange(axisDataItem);

const label = chart.radarContainer.children.push(
  am5.Label.new(root, {
    centerX:am5.percent(50),
    textAlign:"center",
    centerY:am5.percent(100),
    fontSize:"2.5em"
  })
);

axisDataItem.set("value", 50);
bullet.on("rotation", ()=>{
  let value = axisDataItem.get("value");
  let text = Math.round(axisDataItem.get("value")).toString();
  let fill = am5.color(0x000000);
  xAxis.axisRanges.each((axisRange)=>{
    if(value >= axisRange.get("value") && value < axisRange.get("endValue")){
      text += "\n [fontSize:1.5em]" + axisRange.get("label").get("text");
      fill = axisRange.get("axisFill").get("fill");
    }
  })
  label.set("fill", fill);
  label.set("text", text);
});

setInterval(() => {
  axisDataItem.animate({
    key: "value",
    to: Math.round(Math.random() * 140 - 40),
    duration: 800,
    easing: am5.ease.out(am5.ease.cubic)
  });
}, 1000)

chart.bulletsContainer.set("mask", undefined);

const bandsData = [{
  title: "Unsustainable",
  color: "#ee1f25",
  lowScore: -40,
  highScore: -20
}, {
  title: "Volatile",
  color: "#f04922",
  lowScore: -20,
  highScore: 0
}, {
  title: "Foundational",
  color: "#fdae19",
  lowScore: 0,
  highScore: 20
}, {
  title: "Developing",
  color: "#f3eb0c",
  lowScore: 20,
  highScore: 40
}, {
  title: "Maturing",
  color: "#b0d136",
  lowScore: 40,
  highScore: 60
}, {
  title: "Sustainable",
  color: "#54b947",
  lowScore: 60,
  highScore: 80
}, {
  title: "High Performing",
  color: "#0f9747",
  lowScore: 80,
  highScore: 100
}];

am5.array.each(bandsData, (data) => {
  const axisRange = xAxis.createAxisRange(xAxis.makeDataItem({}));
  
  axisRange.setAll({
    value: data.lowScore,
    endValue: data.highScore
  });

  axisRange.get("axisFill").setAll({
    visible: true,
    fill: am5.color(data.color),
    fillOpacity: 0.8
  });

  axisRange.get("label").setAll({
    text: data.title,
    inside: true,
    radius: 15,
    fontSize: "0.9em",
    fill: root.interfaceColors.get("background")
  });
});

chart.appear();