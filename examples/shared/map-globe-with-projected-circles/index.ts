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
  rotationX: -80,    // starts with 80 degrees east facing the viewer...
  rotationY: -25     // ...and 25 degrees north: India and China in front
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


// Create main polygon series for countries
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow
}));

polygonSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  fillOpacity: 0.15, // ...faded to a grey a little darker than the sea
  strokeWidth: 0.5,  // thin borders...
  stroke: root.interfaceColors.get("background") // ...in the background color
});


// Create point series for circles, each placed on the country with its id.
// surfaceBullets lays them on the globe, so they flatten towards its edge
// https://www.amcharts.com/docs/v5/charts/map-chart/map-point-series/
const circleSeries = chart.series.push(am5map.MapPointSeries.new(root, {
  surfaceBullets: true,
  calculateAggregates: true, // works out the lowest and highest value, which the heat rule needs
  valueField: "value",
  polygonIdField: "id"
}));

// one template for all the circles, so the heat rule below can size each of them
const circleTemplate = am5.Template.new<am5.Circle>({});

// a circle for each country
circleSeries.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      fill: am5.color(0xff621f),
      fillOpacity: 0.7, // see-through, so the country and overlapping circles show
      stroke: root.interfaceColors.get("background"), // a thin ring in the background color
      strokeWidth: 1,
      tooltipText: "{name}: {value.formatNumber('#.0a')}" // e.g. "Brazil: 196.7M"
    }, circleTemplate)
  });
});


// Size circles by value
// https://www.amcharts.com/docs/v5/concepts/settings/heat-rules/
circleSeries.set("heatRules", [{
  target: circleTemplate,
  dataField: "value",
  key: "radius",
  min: 5,           // the smallest population gets a 5 px radius...
  max: 40,          // ...the largest a 40 px one
  logarithmic: true // on a log scale, so China and India don't dwarf all the rest
}]);


// Set data: population by country
circleSeries.data.setAll([
  { id: "CN", name: "China", value: 1347600000 },
  { id: "IN", name: "India", value: 1241500000 },
  { id: "US", name: "United States", value: 313100000 },
  { id: "ID", name: "Indonesia", value: 242300000 },
  { id: "BR", name: "Brazil", value: 196700000 },
  { id: "PK", name: "Pakistan", value: 176700000 },
  { id: "NG", name: "Nigeria", value: 162500000 },
  { id: "BD", name: "Bangladesh", value: 150500000 },
  { id: "RU", name: "Russia", value: 142800000 },
  { id: "JP", name: "Japan", value: 126500000 },
  { id: "MX", name: "Mexico", value: 114800000 },
  { id: "PH", name: "Philippines", value: 94900000 },
  { id: "VN", name: "Vietnam", value: 88800000 },
  { id: "ET", name: "Ethiopia", value: 84700000 },
  { id: "EG", name: "Egypt", value: 82500000 },
  { id: "DE", name: "Germany", value: 82200000 },
  { id: "IR", name: "Iran", value: 74800000 },
  { id: "TR", name: "Türkiye", value: 73600000 },
  { id: "TH", name: "Thailand", value: 69500000 },
  { id: "CD", name: "DR Congo", value: 67800000 },
  { id: "FR", name: "France", value: 63100000 },
  { id: "GB", name: "United Kingdom", value: 62400000 },
  { id: "IT", name: "Italy", value: 60800000 },
  { id: "ZA", name: "South Africa", value: 50500000 },
  { id: "KR", name: "South Korea", value: 48400000 },
  { id: "MM", name: "Myanmar", value: 48300000 },
  { id: "CO", name: "Colombia", value: 46900000 },
  { id: "ES", name: "Spain", value: 46500000 },
  { id: "TZ", name: "Tanzania", value: 46200000 },
  { id: "UA", name: "Ukraine", value: 45200000 },
  { id: "KE", name: "Kenya", value: 41600000 },
  { id: "AR", name: "Argentina", value: 40800000 },
  { id: "PL", name: "Poland", value: 38300000 },
  { id: "DZ", name: "Algeria", value: 36000000 },
  { id: "SD", name: "Sudan", value: 34700000 },
  { id: "CA", name: "Canada", value: 34300000 },
  { id: "MA", name: "Morocco", value: 32300000 },
  { id: "PE", name: "Peru", value: 29400000 },
  { id: "SA", name: "Saudi Arabia", value: 28100000 },
  { id: "AU", name: "Australia", value: 22600000 }
]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);