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


// Create chart: a globe that keeps turning
// https://www.amcharts.com/docs/v5/charts/map-chart/
const chart = root.container.children.push(am5map.MapChart.new(root, {
  projection: am5map.geoOrthographic(), // a globe
  panX: "rotateX",   // dragging sideways spins the globe...
  panY: "rotateY",   // ...and dragging up or down tilts it
  animations: [      // one full turn every 2 minutes, forever
    { key: "rotationX", from: 0, to: 360, duration: 120000, loops: 0 }
  ]
}));


// Add satellite image. It is read from the amCharts CDN, which needs a
// connection: a page opened from disk cannot read an image file beside it
chart.series.push(am5map.MapRasterSeries.new(root, {
  src: "https://cdn.amcharts.com/lib/5/geodata/images/earthDay2048.jpg" // the world by day, 2048 px wide
}));


// Add country borders
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow
}));

polygonSeries.mapPolygons.template.setAll({
  fillOpacity: 0,    // no fill, so the satellite image shows through
  stroke: root.interfaceColors.get("background"), // borders in the background color...
  strokeWidth: 0.5,  // ...thin...
  strokeOpacity: 0.6 // ...and a little see-through
});


// Add image credit
chart.children.push(am5.Label.new(root, {
  text: "Imagery: NASA Earth Observatory", // NASA asks to be credited for its images
  fontSize: 12,
  x: am5.p100,       // the label's right edge on the chart's right edge...
  centerX: am5.p100,
  y: am5.p100,       // ...and its bottom on the chart's bottom
  centerY: am5.p100
}));


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);
