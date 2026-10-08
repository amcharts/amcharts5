import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create the map chart
// https://www.amcharts.com/docs/v5/charts/map-chart/
const chart = root.container.children.push(am5map.MapChart.new(root, {
  panX: "rotateX", // dragging sideways turns the world, so any longitude can be centered
  projection: am5map.geoNaturalEarth1() // a rounded world map, with sizes close to true
}));


// Create main polygon series for countries
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow
}));


// Shade the night side and show the sun
// the edge fades through 4 shades of twilight, and the sun marks where it is overhead
chart.series.push(am5map.NightSeries.new(root, {
  sunDate: "now" // the night as it is right now, moved on every minute
}));


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);
