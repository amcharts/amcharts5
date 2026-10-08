import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
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
  projection: am5map.geoEqualEarth() // a rounded world map that keeps areas true
}));


// Add satellite images: day where the sun is up now, night where it is down.
// They are read from the amCharts CDN, which needs a connection: a page
// opened from disk cannot read an image file beside it
chart.series.push(am5map.MapRasterSeries.new(root, {
  src: "https://cdn.amcharts.com/lib/5/geodata/images/earthDay2048.jpg", // the world by day, 2048 px wide
  nightSrc: "https://cdn.amcharts.com/lib/5/geodata/images/earthNight2048.jpg", // city lights at night
  sunDate: "now" // where the sun is up right now, moved on every minute
}));


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
