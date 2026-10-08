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
  panX: "translateX",  // dragging moves the map sideways...
  panY: "translateY",  // ...and up and down
  projection: am5map.geoMercator() // the common flat world map
}));


// Create main polygon series for countries
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  exclude: ["AQ"] // no Antarctica, which Mercator stretches across the bottom
}));

polygonSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  fillOpacity: 0.15 // ...faded to a light grey, so the flows stand out
});


// Create Map Sankey series: flows between countries, found by their ids
// https://www.amcharts.com/docs/v5/charts/map-chart/map-sankey-series/
const sankeySeries = chart.series.push(am5map.MapSankeySeries.new(root, {
  polygonSeries: polygonSeries // where sourceId and targetId are found: flows end at country centers
}));

// the flows, each as wide as its value: the biggest is 5 degrees wide by default
sankeySeries.mapPolygons.template.setAll({
  fillOpacity: 0.6, // see-through, so the map and crossing flows show
  tooltipText: "{source} > {target}: {value}" // e.g. "Brazil > Germany: 350"
});

// the nodes: a circle for each country where flows start or end
sankeySeries.nodes.mapPolygons.template.setAll({
  tooltipText: "{name}: {sum}" // sum: all of the country's flows, in and out
});


// Set data: coffee exports, in thousands of tonnes
// https://www.amcharts.com/docs/v5/charts/map-chart/map-sankey-series/
sankeySeries.data.setAll([
  { sourceId: "BR", source: "Brazil", targetId: "US", target: "United States", value: 450 },
  { sourceId: "BR", source: "Brazil", targetId: "DE", target: "Germany", value: 350 },
  { sourceId: "BR", source: "Brazil", targetId: "IT", target: "Italy", value: 200 },
  { sourceId: "CO", source: "Colombia", targetId: "US", target: "United States", value: 250 },
  { sourceId: "CO", source: "Colombia", targetId: "DE", target: "Germany", value: 80 },
  { sourceId: "ET", source: "Ethiopia", targetId: "DE", target: "Germany", value: 80 },
  { sourceId: "VN", source: "Vietnam", targetId: "DE", target: "Germany", value: 200 },
  { sourceId: "VN", source: "Vietnam", targetId: "IT", target: "Italy", value: 150 },
  { sourceId: "VN", source: "Vietnam", targetId: "JP", target: "Japan", value: 100 },
  { sourceId: "ID", source: "Indonesia", targetId: "JP", target: "Japan", value: 80 },
  { sourceId: "ID", source: "Indonesia", targetId: "DE", target: "Germany", value: 60 }
]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);
