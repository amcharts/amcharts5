import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create the map chart
// https://docs.amcharts.com/v5/charts/map-chart/
const chart = root.container.children.push(am5map.MapChart.new(root, {
  panX: "translateX",  // dragging moves the map sideways...
  panY: "translateY",  // ...and up and down
  projection: am5map.geoMercator() // the common flat world map
}));


// Add zoom control
// https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#zoom-control
const zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
zoomControl.homeButton.set("visible", true); // hidden by default; a click zooms back out to the world


// Create main polygon series for countries. clickZoom zooms to the clicked
// country, and back out when it is clicked again or the water is clicked
// https://docs.amcharts.com/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  exclude: ["AQ"], // no Antarctica, which Mercator stretches across the bottom
  clickZoom: true
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
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
chart.appear(1000, 100);
