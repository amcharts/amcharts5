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
  panX: "rotateX",   // dragging sideways spins the globe...
  panY: "rotateY",   // ...and dragging up or down tilts it
  projection: am5map.geoOrthographic(), // a globe
  paddingBottom: 20, // 20 px of room on every side, between the globe and the chart's edges
  paddingTop: 20,
  paddingLeft: 20,
  paddingRight: 20
}));


// Create series for background fill
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));

backgroundSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  fillOpacity: 0.1,  // ...faded to a light grey disc for the sea
  strokeOpacity: 0   // no outline
});

backgroundSeries.data.push({
  geometry: am5map.getGeoRectangle(90, 180, -90, -180) // one polygon over the whole earth
});


// Create main polygon series for countries. clickZoom zooms to the clicked
// country; on a map that pans by rotating, it turns the globe to it as well
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  clickZoom: true // a second click on the country, or one on the water, zooms back out
}));

polygonSeries.mapPolygons.template.setAll({
  tooltipText: "{name}", // the country's name, which comes with the map data
  interactive: true      // the countries react to the pointer: hover and click
});

// the country under the pointer takes the theme's hover color
polygonSeries.mapPolygons.template.states.create("hover", {
  fill: root.interfaceColors.get("primaryButtonHover")
});

// The country zoomed to is active
polygonSeries.mapPolygons.template.states.create("active", {
  fill: root.interfaceColors.get("primaryButtonActive") // green in the default theme
});


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);
