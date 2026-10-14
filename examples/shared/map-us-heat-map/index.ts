import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_usaLow from "@amcharts/amcharts5-geodata/usaLow";
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
  projection: am5map.geoAlbersUsa(), // Alaska and Hawaii moved in under the other states
  paddingBottom: 60 // room under the map for the heat legend
}));


// Create polygon series for the states
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_usaLow,
  valueField: "value"
}));

polygonSeries.mapPolygons.template.setAll({
  tooltipText: "{name}: {value}", // e.g. "Vermont: 94"
  stroke: root.interfaceColors.get("background"), // borders in the background color
  strokeWidth: 1
});


// The scale: red for low scores, yellow in the middle, green for high ones
const colors = [
  root.interfaceColors.get("negative")!,
  root.interfaceColors.get("warning")!,
  root.interfaceColors.get("positive")!
];


// Color the states by value
// https://www.amcharts.com/docs/v5/concepts/settings/heat-rules/
polygonSeries.set("heatRules", [{
  target: polygonSeries.mapPolygons.template,
  dataField: "value",
  key: "fill",
  stops: colors,  // a scale through all three colors
  minValue: 50,   // 50 is red...
  maxValue: 100   // ...100 green, 75 yellow
}]);


// Set data: a customer satisfaction score for each state
polygonSeries.data.setAll([
  { id: "US-AL", value: 61 },
  { id: "US-AK", value: 74 },
  { id: "US-AZ", value: 68 },
  { id: "US-AR", value: 57 },
  { id: "US-CA", value: 83 },
  { id: "US-CO", value: 88 },
  { id: "US-CT", value: 79 },
  { id: "US-DE", value: 71 },
  { id: "US-DC", value: 66 },
  { id: "US-FL", value: 72 },
  { id: "US-GA", value: 64 },
  { id: "US-HI", value: 90 },
  { id: "US-ID", value: 77 },
  { id: "US-IL", value: 69 },
  { id: "US-IN", value: 63 },
  { id: "US-IA", value: 81 },
  { id: "US-KS", value: 75 },
  { id: "US-KY", value: 58 },
  { id: "US-LA", value: 54 },
  { id: "US-ME", value: 86 },
  { id: "US-MD", value: 73 },
  { id: "US-MA", value: 89 },
  { id: "US-MI", value: 67 },
  { id: "US-MN", value: 92 },
  { id: "US-MS", value: 52 },
  { id: "US-MO", value: 65 },
  { id: "US-MT", value: 84 },
  { id: "US-NE", value: 80 },
  { id: "US-NV", value: 62 },
  { id: "US-NH", value: 91 },
  { id: "US-NJ", value: 76 },
  { id: "US-NM", value: 59 },
  { id: "US-NY", value: 78 },
  { id: "US-NC", value: 70 },
  { id: "US-ND", value: 82 },
  { id: "US-OH", value: 66 },
  { id: "US-OK", value: 56 },
  { id: "US-OR", value: 85 },
  { id: "US-PA", value: 72 },
  { id: "US-RI", value: 74 },
  { id: "US-SC", value: 60 },
  { id: "US-SD", value: 79 },
  { id: "US-TN", value: 63 },
  { id: "US-TX", value: 69 },
  { id: "US-UT", value: 87 },
  { id: "US-VT", value: 94 },
  { id: "US-VA", value: 77 },
  { id: "US-WA", value: 88 },
  { id: "US-WV", value: 53 },
  { id: "US-WI", value: 81 },
  { id: "US-WY", value: 76 }
]);


// Heat legend with the same colors, under the map
// https://www.amcharts.com/docs/v5/concepts/legend/heat-legend/
chart.children.push(am5.HeatLegend.new(root, {
  orientation: "horizontal",
  colors: colors,
  startValue: 50,
  endValue: 100,
  width: am5.percent(40),
  x: am5.p50,
  centerX: am5.p50,
  y: am5.p100, // at the bottom of the map's area, so in the padding under it
  paddingTop: 15
}));


// Make stuff animate on load
chart.appear(1000, 100);
