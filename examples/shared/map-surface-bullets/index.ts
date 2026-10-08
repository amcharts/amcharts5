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
  projection: am5map.geoOrthographic(), // a globe
  panX: "rotateX",   // dragging sideways spins the globe...
  panY: "rotateY"    // ...and dragging up or down tilts it
}));


// Add globe background
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
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
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow
}));


// Add points: bullets lie on the surface and flatten towards the edge
// https://www.amcharts.com/docs/v5/charts/map-chart/map-point-series/
const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {
  surfaceBullets: true, // the pins turn and squash with the globe, as if painted on it
  latitudeField: "latitude",
  longitudeField: "longitude"
}));

// A pin, drawn with its tip at the point
pointSeries.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Graphics.new(root, {
      svgPath: "M0,0 C-5,-7 -9,-11 -9,-17 A9,9 0 1 1 9,-17 C9,-11 5,-7 0,0 Z M0,-20.5 A3.5,3.5 0 1 0 0,-13.5 A3.5,3.5 0 1 0 0,-20.5 Z",
      fill: am5.color(0xff621f),
      stroke: root.interfaceColors.get("background"), // a thin outline in the background color
      strokeWidth: 1,
      tooltipText: "{title}" // the city's name from the data
    })
  });
});


// Set data
pointSeries.data.setAll([
  { title: "New York", latitude: 40.7128, longitude: -74.006 },
  { title: "Mexico City", latitude: 19.4326, longitude: -99.1332 },
  { title: "Sao Paulo", latitude: -23.5505, longitude: -46.6333 },
  { title: "Reykjavik", latitude: 64.1466, longitude: -21.9426 },
  { title: "London", latitude: 51.5072, longitude: -0.1276 },
  { title: "Lagos", latitude: 6.5244, longitude: 3.3792 },
  { title: "Cape Town", latitude: -33.9249, longitude: 18.4241 },
  { title: "Cairo", latitude: 30.0444, longitude: 31.2357 },
  { title: "Moscow", latitude: 55.7558, longitude: 37.6173 },
  { title: "Delhi", latitude: 28.6139, longitude: 77.209 },
  { title: "Tokyo", latitude: 35.6895, longitude: 139.6917 },
  { title: "Sydney", latitude: -33.8688, longitude: 151.2093 },
]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);
