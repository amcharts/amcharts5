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


// Create main polygon series for countries
// https://docs.amcharts.com/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  exclude: ["AQ"] // no Antarctica, which Mercator stretches across the bottom
}));

polygonSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  fillOpacity: 0.15, // ...faded to a light grey, so the bubbles stand out
  strokeWidth: 0.5,  // thin borders...
  stroke: root.interfaceColors.get("background") // ...in the background color
});


// Create point series for bubbles, each placed on the country with its id
// https://docs.amcharts.com/v5/charts/map-chart/map-point-series/
const bubbleSeries = chart.series.push(am5map.MapPointSeries.new(root, {
  calculateAggregates: true, // works out the lowest and highest value, which the heat rules need
  valueField: "value",
  polygonIdField: "id"
}));

// one template for all the bubbles, so the heat rules below can size and color each of them
const circleTemplate = am5.Template.new<am5.Circle>({});

// a bubble for each country
bubbleSeries.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      fillOpacity: 0.7,              // see-through, so the country and overlapping bubbles show
      tooltipText: "{name}: {value}" // e.g. "Brazil: 196,700,000"
    }, circleTemplate)
  });
});


// Size and color bubbles by value
// https://docs.amcharts.com/v5/concepts/settings/heat-rules/
bubbleSeries.set("heatRules", [{
  target: circleTemplate,
  dataField: "value",
  key: "radius",
  min: 4,  // the smallest population gets a 4 px radius...
  max: 30  // ...the largest a 30 px one, the rest in proportion between
}, {
  target: circleTemplate,
  dataField: "value",
  key: "fill",
  min: am5.color(0xffb14e), // light orange for the smallest...
  max: am5.color(0xcd34b5)  // ...magenta for the largest
}]);


// Set data
bubbleSeries.data.setAll([
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
  { id: "CO", name: "Colombia", value: 46900000 },
  { id: "ES", name: "Spain", value: 46500000 },
  { id: "TZ", name: "Tanzania", value: 46200000 },
  { id: "UA", name: "Ukraine", value: 45200000 },
  { id: "KE", name: "Kenya", value: 41600000 },
  { id: "AR", name: "Argentina", value: 40800000 },
  { id: "PL", name: "Poland", value: 38300000 },
  { id: "DZ", name: "Algeria", value: 36000000 },
  { id: "CA", name: "Canada", value: 34300000 },
  { id: "MA", name: "Morocco", value: 32300000 },
  { id: "PE", name: "Peru", value: 29400000 },
  { id: "SA", name: "Saudi Arabia", value: 28100000 },
  { id: "AU", name: "Australia", value: 22600000 },
  { id: "CL", name: "Chile", value: 17300000 },
  { id: "SE", name: "Sweden", value: 9400000 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
chart.appear(1000, 100);
