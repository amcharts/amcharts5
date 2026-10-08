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


// Create chart: it goes to its home position once it loads
// https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Initial_position_and_zoom
const chart = root.container.children.push(am5map.MapChart.new(root, {
  projection: am5map.geoMercator(),              // the common flat world map
  homeGeoPoint: { longitude: 14, latitude: 51 }, // home is centered on central Europe...
  homeZoomLevel: 3.5,                            // ...zoomed in 3.5 times, so Europe fills the map
  autoHome: true // goes there on load, animated by the Animated theme's animationDuration
}));


// Add zoom control with a home button
// https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Zoom_control
const zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
zoomControl.homeButton.set("visible", true); // hidden by default; a click goes back home


// Add countries
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  exclude: ["AQ"] // no Antarctica, which Mercator stretches across the bottom
}));

polygonSeries.mapPolygons.template.setAll({
  tooltipText: "{name}" // the country's name, which comes with the map data
});


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);
