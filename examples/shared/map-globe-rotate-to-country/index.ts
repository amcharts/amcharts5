import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import { worldLow } from "@amcharts/amcharts5/geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

root.setThemes([
  am5themes_Animated.new(root)
]);


const chart = root.container.children.push(am5map.MapChart.new(root, { panX: "rotateX", panY: "rotateY", projection: am5map.geoOrthographic(), paddingBottom:20, paddingTop:20, paddingLeft:20, paddingRight:20 }));
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: worldLow as any }));

polygonSeries.mapPolygons.template.setAll({ tooltipText: "{name}", toggleKey: "active", interactive: true });
polygonSeries.mapPolygons.template.states.create("hover", { fill: root.interfaceColors.get("primaryButtonHover") });
polygonSeries.mapPolygons.template.states.create("active", { fill: root.interfaceColors.get("primaryButtonHover") });


const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
backgroundSeries.mapPolygons.template.setAll({ fill: root.interfaceColors.get("alternativeBackground"), fillOpacity: 0.1, strokeOpacity: 0 });
backgroundSeries.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) })

let previousPolygon;

polygonSeries.mapPolygons.template.on("active", (active, target) => {
  if (previousPolygon && previousPolygon != target) {
    previousPolygon.set("active", false);
  }
  if (target.get("active")) {
    const centroid = target.centroid();
    if (centroid) {
      chart.animate({ key: "rotationX", to: -centroid.longitude, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
      chart.animate({ key: "rotationY", to: -centroid.latitude, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
    }
  }

  previousPolygon = target;
})


chart.appear();