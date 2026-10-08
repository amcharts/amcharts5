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
  fillOpacity: 0.15 // ...faded to a light grey, so the route and plane stand out
});


// Create point series for cities
// https://www.amcharts.com/docs/v5/charts/map-chart/map-point-series/
const citySeries = chart.series.push(am5map.MapPointSeries.new(root, {}));

// a dot for each city
citySeries.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 6,
      tooltipText: "{title}", // the city's name from the data
      tooltipY: 0,            // the tooltip points at the top of the dot, not its middle
      fill: am5.color(0xffba00),
      stroke: root.interfaceColors.get("background"), // a ring in the background color
      strokeWidth: 2
    })
  });
});

citySeries.data.setAll([
  { id: "los-angeles", title: "Los Angeles", longitude: -118.24, latitude: 34.05 },
  { id: "paris", title: "Paris", longitude: 2.35, latitude: 48.86 }
]);


// Create line series for the route between the cities
// https://www.amcharts.com/docs/v5/charts/map-chart/map-line-series/
const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {
  pointSeries: citySeries // the pointIds in the data are the ids of these cities
}));

lineSeries.mapLines.template.setAll({
  stroke: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  strokeOpacity: 0.4, // ...faded to grey
  strokeWidth: 2
});

lineSeries.data.setAll([
  { id: "route", pointIds: ["los-angeles", "paris"] }
]);


// Create point series for the plane, placed on the line
// https://www.amcharts.com/docs/v5/charts/map-chart/map-point-series/
const planeSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));

// The animation moves the data item along the line and back, forever
// https://www.amcharts.com/docs/v5/concepts/animations/
planeSeries.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Graphics.new(root, {
      // a plane with its nose to the right, the direction autoRotate turns along the line
      svgPath: "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47",
      scale: 0.06,       // the path is about 310 px long: shrink it to under 20 px
      centerX: am5.p50,  // the plane's middle sits on the line...
      centerY: am5.p50,  // ...and it turns around that middle
      fill: root.interfaceColors.get("text"), // the theme's text color
      animations: [      // 10 s each way: yoyo flies it back, loops: 0 repeats forever
        { key: "positionOnLine", from: 0, to: 1, duration: 10000, loops: 0, yoyo: true, target: "dataItem" }
      ]
    })
  });
});

// one plane on the line with id "route", at its start, turned to face the way it flies
planeSeries.data.setAll([
  { lineId: "route", positionOnLine: 0, autoRotate: true }
]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);
