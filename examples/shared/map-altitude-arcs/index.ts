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


// Create chart
// https://docs.amcharts.com/v5/charts/map-chart/
const chart = root.container.children.push(am5map.MapChart.new(root, {
  projection: am5map.geoOrthographic(), // a globe
  panX: "rotateX",   // dragging sideways spins the globe...
  panY: "rotateY",   // ...and dragging up or down tilts it
  rotationX: -20,    // starts with 20 degrees east facing the viewer...
  rotationY: -20     // ...and 20 degrees north
}));


// Add globe background
// https://docs.amcharts.com/v5/charts/map-chart/map-polygon-series/#background-polygon
const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));

backgroundSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  fillOpacity: 0.06,  // ...but barely there: a faint disc for the sea
  strokeOpacity: 0    // no outline
});

backgroundSeries.data.push({
  geometry: am5map.getGeoRectangle(90, 180, -90, -180) // one polygon over the whole earth
});


// Add countries
// https://docs.amcharts.com/v5/charts/map-chart/map-polygon-series/
chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow
}));


// Add cities
// https://docs.amcharts.com/v5/charts/map-chart/map-point-series/
const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {
  latitudeField: "latitude",
  longitudeField: "longitude"
}));

// a dot for each city
pointSeries.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 5,
      fill: am5.color(0xff621f),                     // the same orange as the routes
      stroke: root.interfaceColors.get("background"), // a ring in the background color
      strokeWidth: 2,
      tooltipText: "{title}"                         // the city's name from the data
    })
  });
});

pointSeries.data.setAll([
  { id: "london", title: "London", latitude: 51.5072, longitude: -0.1276 },
  { id: "new-york", title: "New York", latitude: 40.7128, longitude: -74.006 },
  { id: "sao-paulo", title: "Sao Paulo", latitude: -23.5505, longitude: -46.6333 },
  { id: "johannesburg", title: "Johannesburg", latitude: -26.2041, longitude: 28.0473 },
  { id: "singapore", title: "Singapore", latitude: 1.3521, longitude: 103.8198 },
]);


// Add routes: altitude raises the middle of each line, in metres
// https://docs.amcharts.com/v5/charts/map-chart/map-line-series/
const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {
  pointSeries: pointSeries // the pointIds in the data are the ids of these cities
}));

lineSeries.mapLines.template.setAll({
  altitude: 1000000, // each route rises 1,000 km in its middle and lands on both cities
  stroke: am5.color(0xff621f),
  strokeWidth: 2
});

lineSeries.data.setAll([
  { pointIds: ["london", "new-york"] },
  { pointIds: ["london", "singapore"] },
  { pointIds: ["london", "johannesburg"] },
  { pointIds: ["new-york", "sao-paulo"] },
  { pointIds: ["sao-paulo", "johannesburg"] },
  { pointIds: ["johannesburg", "singapore"] },
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
chart.appear(1000, 100);
