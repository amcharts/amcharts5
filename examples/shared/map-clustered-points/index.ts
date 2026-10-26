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
  panX: "rotateX",     // dragging sideways turns the world, so it wraps around endlessly...
  panY: "translateY",  // ...while up and down it just moves
  projection: am5map.geoMercator() // the common flat world map
}));


// Add zoom control
// https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#zoom-control
chart.set("zoomControl", am5map.ZoomControl.new(root, {}));


// Create main polygon series for countries
// https://docs.amcharts.com/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  exclude: ["AQ"] // no Antarctica, which Mercator stretches across the bottom
}));

polygonSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  fillOpacity: 0.15 // ...faded to a light grey, so the orange points stand out
});


// Create clustered point series for cities
// https://docs.amcharts.com/v5/charts/map-chart/clustered-point-series/
// cities closer than 20 px on screen (the default minDistance) merge into one cluster
const pointSeries = chart.series.push(am5map.ClusteredPointSeries.new(root, {}));

// Bullet of a single city
pointSeries.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 6,
      tooltipY: 0,            // the tooltip points at the top of the dot, not its middle
      tooltipText: "{title}", // the city's name from the data
      fill: am5.color(0xff8c00)
    })
  });
});


// Set clustered bullet: shows how many cities it holds, zooms in on click
// https://docs.amcharts.com/v5/charts/map-chart/clustered-point-series/#group-bullet
pointSeries.set("clusteredBullet", (root, series, dataItem) => {
  const container = am5.Container.new(root, {
    cursorOverStyle: "pointer" // a hand cursor, as the cluster can be clicked
  });

  // two see-through rings around a solid dot
  container.children.push(am5.Circle.new(root, {
    radius: 16,
    fillOpacity: 0.3,
    fill: am5.color(0xff8c00)
  }));

  container.children.push(am5.Circle.new(root, {
    radius: 12,
    fillOpacity: 0.3,
    fill: am5.color(0xff8c00)
  }));

  container.children.push(am5.Circle.new(root, {
    radius: 8,
    fill: am5.color(0xff8c00)
  }));

  container.children.push(am5.Label.new(root, {
    centerX: am5.p50,  // centered on the dot
    centerY: am5.p50,
    fill: root.interfaceColors.get("alternativeText"), // white on a light theme
    populateText: true, // fill in {value} from the cluster's data item
    fontSize: 8,
    text: "{value}"     // the number of cities in the cluster
  }));

  // https://docs.amcharts.com/v5/charts/map-chart/clustered-point-series/#drill-down
  // a click zooms in until the cluster's cities fill the map
  container.events.on("click", () => {
    series.zoomToCluster(dataItem);
  });

  return am5.Bullet.new(root, {
    sprite: container
  });
});


// Set data
pointSeries.data.setAll([
  { title: "London", latitude: 51.5, longitude: -0.13 },
  { title: "Paris", latitude: 48.86, longitude: 2.35 },
  { title: "Brussels", latitude: 50.84, longitude: 4.37 },
  { title: "Amsterdam", latitude: 52.37, longitude: 4.89 },
  { title: "Berlin", latitude: 52.52, longitude: 13.41 },
  { title: "Prague", latitude: 50.09, longitude: 14.42 },
  { title: "Vienna", latitude: 48.21, longitude: 16.37 },
  { title: "Budapest", latitude: 47.5, longitude: 19.04 },
  { title: "Warsaw", latitude: 52.23, longitude: 21.01 },
  { title: "Kyiv", latitude: 50.44, longitude: 30.54 },
  { title: "Vilnius", latitude: 54.69, longitude: 25.28 },
  { title: "Riga", latitude: 56.95, longitude: 24.1 },
  { title: "Stockholm", latitude: 59.33, longitude: 18.06 },
  { title: "Oslo", latitude: 59.91, longitude: 10.74 },
  { title: "Copenhagen", latitude: 55.68, longitude: 12.57 },
  { title: "Madrid", latitude: 40.42, longitude: -3.7 },
  { title: "Lisbon", latitude: 38.71, longitude: -9.14 },
  { title: "Rome", latitude: 41.9, longitude: 12.48 },
  { title: "Athens", latitude: 37.98, longitude: 23.72 },
  { title: "Ankara", latitude: 39.94, longitude: 32.86 },
  { title: "Tehran", latitude: 35.71, longitude: 51.44 },
  { title: "New Delhi", latitude: 28.64, longitude: 77.22 },
  { title: "Beijing", latitude: 39.91, longitude: 116.4 },
  { title: "Seoul", latitude: 37.51, longitude: 126.98 },
  { title: "Tokyo", latitude: 35.68, longitude: 139.68 },
  { title: "Hanoi", latitude: 21.03, longitude: 105.84 },
  { title: "Bangkok", latitude: 13.76, longitude: 100.5 },
  { title: "Kuala Lumpur", latitude: 3.15, longitude: 101.71 },
  { title: "Singapore", latitude: 1.29, longitude: 103.85 },
  { title: "Ottawa", latitude: 45.42, longitude: -75.7 },
  { title: "Washington, D.C.", latitude: 38.89, longitude: -77.02 },
  { title: "Mexico City", latitude: 19.43, longitude: -99.13 },
  { title: "Bogota", latitude: 4.65, longitude: -74.1 },
  { title: "Lima", latitude: -12.09, longitude: -77.05 },
  { title: "Buenos Aires", latitude: -34.61, longitude: -58.42 },
  { title: "Montevideo", latitude: -34.89, longitude: -56.07 },
  { title: "Algiers", latitude: 36.78, longitude: 3.06 },
  { title: "Tunis", latitude: 36.81, longitude: 10.18 },
  { title: "Cairo", latitude: 30.06, longitude: 31.23 },
  { title: "Accra", latitude: 5.54, longitude: -0.21 },
  { title: "Nairobi", latitude: -1.28, longitude: 36.8 },
  { title: "Pretoria", latitude: -25.75, longitude: 28.19 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
chart.appear(1000, 100);
