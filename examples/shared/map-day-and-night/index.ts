import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_ResponsiveMax from "@amcharts/amcharts5/themes/ResponsiveMax";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root),
  am5themes_ResponsiveMax.new(root) // fits the chart to small screens
]);


// Create the map chart
// https://docs.amcharts.com/v5/charts/map-chart/
const chart = root.container.children.push(am5map.MapChart.new(root, {
  panX: "rotateX", // dragging sideways turns the world, so any longitude can be centered
  projection: am5map.geoNaturalEarth1() // a rounded world map, with sizes close to true
}));


// Create main polygon series for countries
// https://docs.amcharts.com/v5/charts/map-chart/map-polygon-series/
chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow
}));


// Shade the night side and show the sun
// the edge fades through 4 shades of twilight, and the sun marks where it is overhead
chart.series.push(am5map.NightSeries.new(root, {
  sunDate: "now" // the night as it is right now, moved on every minute
}));


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
chart.setAll({
  focusable: true, // Tab reaches the map, and a screen reader names it
  ariaLabel: "World map of where it is day and where it is night right now, with the sun where it stands overhead"
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
chart.appear(1000, 100);
