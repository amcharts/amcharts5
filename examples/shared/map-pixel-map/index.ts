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


// Create chart
// https://www.amcharts.com/docs/v5/charts/map-chart/
const chart = root.container.children.push(am5map.MapChart.new(root, {
  projection: am5map.geoNaturalEarth1() // a rounded world map, with sizes close to true
}));


// Add series: countries drawn as a grid of dots
const pixelSeries = chart.series.push(am5map.PixelMapSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  exclude: ["AQ"],         // no Antarctica, which would be a long band of dots at the bottom
  pixelType: "circle",     // round dots; also "square", "diamond" or "hexagon"
  step: 2,                 // a dot about every 2 degrees, measured at the map's center
  uniform: true,           // an even grid on screen: every dot the same size, in straight rows
  valueField: "value",
  calculateAggregates: true // works out the lowest and highest value, which the heat rule needs
}));

// the pixels take their color from the country under them: style the countries, not the dots
pixelSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("disabled"), // countries without data stay grey
  tooltipText: "{name}: {value}"              // the name comes from the map data, the value from yours
});


// Color countries by value
// https://www.amcharts.com/docs/v5/concepts/settings/heat-rules/
pixelSeries.set("heatRules", [{
  target: pixelSeries.mapPolygons.template,
  dataField: "value",
  min: am5.color(0xffd19a), // pale orange for the youngest population...
  max: am5.color(0xb3261e), // ...dark red for the oldest
  key: "fill"
}]);


// Set data: median age, years
pixelSeries.data.setAll([
  { id: "US", value: 38 },
  { id: "CA", value: 41 },
  { id: "MX", value: 29 },
  { id: "BR", value: 33 },
  { id: "AR", value: 32 },
  { id: "RU", value: 39 },
  { id: "KZ", value: 31 },
  { id: "CN", value: 38 },
  { id: "IN", value: 28 },
  { id: "ID", value: 30 },
  { id: "AU", value: 38 },
  { id: "EG", value: 24 },
  { id: "NG", value: 18 },
  { id: "ET", value: 19 },
  { id: "ZA", value: 28 },
]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);
