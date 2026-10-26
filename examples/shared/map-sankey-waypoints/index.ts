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


// Create the map chart: a globe that turns to its home view once it loads
// https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#initial-position-and-zoom
const chart = root.container.children.push(am5map.MapChart.new(root, {
  panX: "rotateX",     // dragging sideways spins the globe...
  panY: "rotateY",     // ...and dragging up or down tilts it
  projection: am5map.geoOrthographic(), // a globe
  homeRotationX: -74,  // home faces 74 degrees east...
  homeRotationY: -22,  // ...and 22 degrees north
  homeZoomLevel: 1.25, // zoomed in a little
  autoHome: true       // turns there on load, animated by the Animated theme
}));


// Add zoom control
// https://docs.amcharts.com/v5/charts/map-chart/map-pan-zoom/#zoom-control
const zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
zoomControl.homeButton.set("visible", true); // hidden by default; a click goes back home


// Create series for background fill
// https://docs.amcharts.com/v5/charts/map-chart/map-polygon-series/#background-polygon
const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));

backgroundSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  fillOpacity: 0.1,  // ...faded to a light grey disc for the sea
  strokeOpacity: 0   // no outline
});

backgroundSeries.data.push({
  geometry: am5map.getGeoRectangle(90, 180, -90, -180) // one polygon over the whole earth
});


// Create graticule series
// https://docs.amcharts.com/v5/charts/map-chart/graticule-series/
// lines of latitude and longitude, every 10 degrees by default
const graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));

graticuleSeries.mapLines.template.setAll({
  stroke: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  strokeOpacity: 0.08 // ...but very faint
});


// Create main polygon series for countries
// https://docs.amcharts.com/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow
}));

polygonSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"), // black on a light theme...
  fillOpacity: 0.15, // ...faded to a grey a little darker than the sea
  strokeWidth: 0.5,  // thin borders...
  stroke: root.interfaceColors.get("background") // ...in the background color
});


// Create Map Sankey series: flows between coordinates
// https://docs.amcharts.com/v5/charts/map-chart/map-sankey-series/
const oilColor = am5.color(0xc8890a); // an amber for both the flows and the ports

const sankeySeries = chart.series.push(am5map.MapSankeySeries.new(root, {
  maxWidth: 0.8,    // the biggest flow is 0.8 degrees wide, the others in proportion
  nodePadding: 0.1, // each port's circle reaches 0.1 degrees past its flows
  controlPointDistance: 0.4 // curve handles 0.4 of each leg long, a bit under the default 0.5
}));

// the flows
sankeySeries.mapPolygons.template.setAll({
  fill: oilColor,
  fillOpacity: 0.5,  // see-through, so overlapping flows show
  strokeOpacity: 0,  // no outline
  tooltipText: "{source} > {target}: {value}k barrels a day" // names from the data row
});

// the ports: a circle at each end of the flows
sankeySeries.nodes.mapPolygons.template.setAll({
  fill: oilColor,
  stroke: root.interfaceColors.get("background"), // a ring in the background color
  strokeWidth: 1.5,
  tooltipText: "{name}: {sum}k barrels a day" // sum: all the port's flows, in and out
});


// Add a drop that travels along each flow, at the same speed on every route
// https://docs.amcharts.com/v5/concepts/animations/
sankeySeries.bullets.push((root, series, dataItem) => {
  // 5 s for every radian of route (about 6,400 km), so longer routes take longer
  const duration = sankeySeries.getPathLength(dataItem) * 5000;
  // each drop waits 0 to 2.5 s before it starts, so they don't all set off together
  const delay = (series.dataItems.indexOf(dataItem) % 6) * 500;

  return am5.Bullet.new(root, {
    locationX: 0,         // at the source end of the flow
    autoRotate: true,     // turned to follow the flow's direction...
    autoRotateAngle: -90, // ...with the drop's tip trailing behind
    animations: [         // travels from source to target, then starts over, forever
      { key: "locationX", from: 0, to: 1, duration: duration, delay: delay, loops: 0 }
    ],
    sprite: am5.Graphics.new(root, {
      svgPath: "M0,-7 C2,-4 5,0 5,3 C5,6 3,8 0,8 C-3,8 -5,6 -5,3 C-5,0 -2,-4 0,-7 Z", // a drop
      scale: 0.5, // half size: about 8 px tall
      fill: root.interfaceColors.get("text") // the theme's text color
    })
  });
});


// Oil terminals in the Persian Gulf
const rasTanura = { name: "Ras Tanura", longitude: 50.17, latitude: 26.64 };
const basra = { name: "Basra", longitude: 48.8, latitude: 29.69 };
const fujairah = { name: "Fujairah", longitude: 56.33, latitude: 25.12 };
const minaAlAhmadi = { name: "Mina Al Ahmadi", longitude: 48.17, latitude: 29.08 };
const khargIsland = { name: "Kharg Island", longitude: 50.32, latitude: 29.23 };
const rasLaffan = { name: "Ras Laffan", longitude: 51.56, latitude: 25.93 };

// Ports the oil goes to
const ningbo = { name: "Ningbo", longitude: 121.97, latitude: 29.87 };
const qingdao = { name: "Qingdao", longitude: 120.38, latitude: 36.07 };
const yokohama = { name: "Yokohama", longitude: 139.64, latitude: 35.44 };
const ulsan = { name: "Ulsan", longitude: 129.38, latitude: 35.5 };
const jamnagar = { name: "Jamnagar", longitude: 69.66, latitude: 22.42 };
const mumbai = { name: "Mumbai", longitude: 72.88, latitude: 19.08 };
const singapore = { name: "Singapore", longitude: 103.84, latitude: 1.26 };
const trieste = { name: "Trieste", longitude: 13.78, latitude: 45.65 };
const piraeus = { name: "Piraeus", longitude: 23.63, latitude: 37.94 };
const rotterdam = { name: "Rotterdam", longitude: 4.12, latitude: 51.95 };

// Waypoints take the routes around the land, roughly where the ships go
const gulfOfOman = { longitude: 59, latitude: 24.2 };
const arabianSea = { longitude: 64, latitude: 18 };
const omanCoast = { longitude: 60.5, latitude: 19.5 };
const sriLanka = { longitude: 78, latitude: 6 };
const aden = { longitude: 46, latitude: 12.3 };
const suez = { longitude: 33.5, latitude: 28.5 };

// Routes to East Asia are a little apart, so that their flows do not merge
const toIndia = [gulfOfOman];
const toMumbai = [gulfOfOman, arabianSea];
const toSingapore = [gulfOfOman, sriLanka];
const toChina = [{ longitude: 59.5, latitude: 23.4 }, { longitude: 76, latitude: 3 }, { longitude: 99, latitude: 1 }];
const toNorthChina = toChina.concat([{ longitude: 124, latitude: 32 }]);
const toKorea = [gulfOfOman, sriLanka, { longitude: 101, latitude: 3 }];
const toJapan = [{ longitude: 58.5, latitude: 25 }, { longitude: 80, latitude: 9 }, { longitude: 104, latitude: 7 }];
const toSuez = [gulfOfOman, omanCoast, aden, suez];
const toGreece = toSuez;
const toItaly = toSuez.concat([{ longitude: 22, latitude: 35 }, { longitude: 18.5, latitude: 40 }]);
const toNetherlands = toSuez.concat([{ longitude: 13, latitude: 37 }, { longitude: -10, latitude: 39 }]);

// Makes a data row for a flow from one port to another
function flow(source: typeof rasTanura, target: typeof rasTanura, value: number, waypoints: Array<am5.IGeoPoint>) {
  return {
    source: source.name,
    sourceLongitude: source.longitude,
    sourceLatitude: source.latitude,
    target: target.name,
    targetLongitude: target.longitude,
    targetLatitude: target.latitude,
    value: value,
    waypoints: waypoints
  };
}


// Set data: oil exports, in thousands of barrels a day
// Fujairah is on the Gulf of Oman already, so its routes skip the first waypoint
sankeySeries.data.setAll([
  flow(rasTanura, ningbo, 1100, toChina),
  flow(rasTanura, qingdao, 600, toNorthChina),
  flow(rasTanura, yokohama, 700, toJapan),
  flow(rasTanura, ulsan, 800, toKorea),
  flow(rasTanura, jamnagar, 500, toIndia),
  flow(rasTanura, mumbai, 300, toMumbai),
  flow(rasTanura, rotterdam, 350, toNetherlands),
  flow(basra, ningbo, 700, toChina),
  flow(basra, ulsan, 400, toKorea),
  flow(basra, jamnagar, 600, toIndia),
  flow(basra, mumbai, 400, toMumbai),
  flow(basra, trieste, 350, toItaly),
  flow(basra, piraeus, 250, toGreece),
  flow(fujairah, yokohama, 400, toJapan.slice(1)),
  flow(fujairah, ulsan, 350, toKorea.slice(1)),
  flow(fujairah, singapore, 250, toSingapore.slice(1)),
  flow(fujairah, jamnagar, 300, []),
  flow(minaAlAhmadi, ulsan, 400, toKorea),
  flow(minaAlAhmadi, yokohama, 300, toJapan),
  flow(minaAlAhmadi, ningbo, 300, toChina),
  flow(khargIsland, ningbo, 400, toChina),
  flow(khargIsland, qingdao, 200, toNorthChina),
  flow(khargIsland, piraeus, 100, toGreece),
  flow(rasLaffan, yokohama, 300, toJapan),
  flow(rasLaffan, ulsan, 200, toKorea),
  flow(rasLaffan, singapore, 120, toSingapore)
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
chart.appear(1000, 100);
