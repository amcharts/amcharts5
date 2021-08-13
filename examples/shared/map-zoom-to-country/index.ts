import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import { worldLow } from "@amcharts/amcharts5/geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

root.setThemes([
  am5themes_Animated.new(root)
]);


const chart = root.container.children.push(am5map.MapChart.new(root, { panX: "translateX", panY: "translateY", projection: am5map.geoMercator() }));
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: worldLow as any }));
polygonSeries.mapPolygons.template.setAll({ tooltipText: "{name}", toggleKey: "active", interactive: true });
polygonSeries.mapPolygons.template.states.create("hover", { fill: root.interfaceColors.get("primaryButtonHover") });
polygonSeries.mapPolygons.template.states.create("active", { fill: root.interfaceColors.get("primaryButtonHover") });

let previousPolygon;

polygonSeries.mapPolygons.template.on("active", (active, target) => {
  if (previousPolygon && previousPolygon != target) {
    previousPolygon.set("active", false);
  }
  if (target.get("active")) {
    polygonSeries.zoomToDataItem(target.dataItem as any);
  }
  else {
    chart.goHome();
  }
  previousPolygon = target;
})

chart.set("zoomControl", am5map.ZoomControl.new(root, {}));


chart.chartContainer.get("background").events.on("click", () => {  
  chart.goHome();
})

chart.appear();