import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

/**
 * ---------------------------------------
 * This demo was created using amCharts 5.
 *
 * For more information visit:
 * https://www.amcharts.com/
 *
 * Documentation is available at:
 * https://www.amcharts.com/docs/v5/
 * ---------------------------------------
 */

// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");

// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([am5themes_Animated.new(root)]);

// Create the map chart
// https://www.amcharts.com/docs/v5/charts/map-chart/
const chart = root.container.children.push(
  am5map.MapChart.new(root, {
    panX: "rotateX",
    panY: "rotateY",
    projection: am5map.geoMercator()
  })
);

// Create series for background fill
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
backgroundSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"),
  fillOpacity: 0,
  strokeOpacity: 0
});
// Add background polygo
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
backgroundSeries.data.push({
  geometry: am5map.getGeoRectangle(90, 180, -90, -180)
});

// Create main polygon series for countries
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow
  })
);

// Create point series for Sun icon
// https://www.amcharts.com/docs/v5/charts/map-chart/map-point-series/
const sunSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));

sunSeries.bullets.push(function () {
  const circle = am5.Circle.new(root, {
    radius: 18,
    fill: am5.color(0xffba00),
    filter: "blur(5px)"
  });

  circle.animate({
    key: "radius",
    duration: 2000,
    to: 23,
    loops: Infinity,
    easing: am5.ease.yoyo(am5.ease.linear)
  });

  return am5.Bullet.new(root, {
    sprite: circle
  });
});

sunSeries.bullets.push(function () {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 14,
      fill: am5.color(0xffba00)
    })
  });
});

const sunDataItem = sunSeries.pushDataItem({});

// Create polygon series for night-time polygons
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const nightSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));

nightSeries.mapPolygons.template.setAll({
  fill: am5.color(0x000000),
  fillOpacity: 0.25,
  strokeOpacity: 0
});

const nightDataItem0 = nightSeries.pushDataItem({});
const nightDataItem1 = nightSeries.pushDataItem({});
const nightDataItem2 = nightSeries.pushDataItem({});

// Create controls
const container = chart.children.push(
  am5.Container.new(root, {
    y: am5.percent(95),
    centerX: am5.p50,
    x: am5.p50,
    width: am5.percent(80),
    layout: root.horizontalLayout
  })
);

const playButton = container.children.push(
  am5.Button.new(root, {
    themeTags: ["play"],
    centerY: am5.p50,
    marginRight: 15,
    icon: am5.Graphics.new(root, {
      themeTags: ["icon"]
    })
  })
);

playButton.events.on("click", function () {
  if (playButton.get("active")) {
    slider.set("start", slider.get("start") + 0.0001);
  } else {
    slider.animate({
      key: "start",
      to: 1,
      duration: 15000 * (1 - slider.get("start"))
    });
  }
});

const slider = container.children.push(
  am5.Slider.new(root, {
    orientation: "horizontal",
    start: 0.5,
    centerY: am5.p50
  })
);

slider.on("start", function (start) {
  if (start === 1) {
    playButton.set("active", false);
  }
});

slider.events.on("rangechanged", function () {
  updateDateNight(
    (slider.get("start", 0) - 0.5) * am5.time.getDuration("day", 2) +
      new Date().getTime()
  );
});

const cont = chart.children.push(
  am5.Container.new(root, {
    layout: root.horizontalLayout,
    x: 20,
    y: 40
  })
);

cont.children.push(
  am5.Label.new(root, {
    centerY: am5.p50,
    text: "Map"
  })
);

const switchButton = cont.children.push(
  am5.Button.new(root, {
    themeTags: ["switch"],
    centerY: am5.p50,
    icon: am5.Circle.new(root, {
      themeTags: ["icon"]
    })
  })
);

switchButton.on("active", function () {
  if (!switchButton.get("active")) {
    chart.set("projection", am5map.geoMercator());
    chart.set("panY", "translateY");
    chart.set("panX", "translateX");
    backgroundSeries.mapPolygons.template.set("fillOpacity", 0);
  } else {
    chart.set("projection", am5map.geoOrthographic());
    chart.set("panY", "rotateY");
    chart.set("panX", "rotateX");
    backgroundSeries.mapPolygons.template.set("fillOpacity", 0.1);
  }
});
cont.children.push(
  am5.Label.new(root, {
    centerY: am5.p50,
    text: "Globe"
  })
);

chart.appear(1000, 100);

function updateDateNight(time) {
  const sunPosition = solarPosition(time);
  sunDataItem.set("longitude", sunPosition.longitude);
  sunDataItem.set("latitude", sunPosition.latitude);

  const nightPosition = {
    longitude: sunPosition.longitude + 180,
    latitude: -sunPosition.latitude
  };

  nightDataItem0.set("geometry", am5map.getGeoCircle(nightPosition, 92));
  nightDataItem1.set("geometry", am5map.getGeoCircle(nightPosition, 90));
  nightDataItem2.set("geometry", am5map.getGeoCircle(nightPosition, 88));
}

const offset = new Date().getTimezoneOffset() * 60 * 1000;
//updateDateNight(new Date().getTime());

// all sun position calculation is taken from: http://bl.ocks.org/mbostock/4597134
function solarPosition(time) {
  const centuries = (time - Date.UTC(2000, 0, 1, 12)) / 864e5 / 36525; // since J2000
  const longitude =
    ((am5.time.round(new Date(time), "day", 1).getTime() - time - offset) /
      864e5) *
      360 -
    180;

  return am5map.normalizeGeoPoint({
    longitude: longitude - equationOfTime(centuries) * am5.math.DEGREES,
    latitude: solarDeclination(centuries) * am5.math.DEGREES
  });
}

// Equations based on NOAA’s Solar Calculator; all angles in RADIANS.
// http://www.esrl.noaa.gov/gmd/grad/solcalc/

function equationOfTime(centuries) {
  const e = eccentricityEarthOrbit(centuries),
    m = solarGeometricMeanAnomaly(centuries),
    l = solarGeometricMeanLongitude(centuries),
    y = Math.tan(obliquityCorrection(centuries) / 2);

  y *= y;
  return (
    y * Math.sin(2 * l) -
    2 * e * Math.sin(m) +
    4 * e * y * Math.sin(m) * Math.cos(2 * l) -
    0.5 * y * y * Math.sin(4 * l) -
    1.25 * e * e * Math.sin(2 * m)
  );
}

function solarDeclination(centuries) {
  return Math.asin(
    Math.sin(obliquityCorrection(centuries)) *
      Math.sin(solarApparentLongitude(centuries))
  );
}

function solarApparentLongitude(centuries) {
  return (
    solarTrueLongitude(centuries) -
    (0.00569 +
      0.00478 * Math.sin((125.04 - 1934.136 * centuries) * am5.math.RADIANS)) *
      am5.math.RADIANS
  );
}

function solarTrueLongitude(centuries) {
  return (
    solarGeometricMeanLongitude(centuries) + solarEquationOfCenter(centuries)
  );
}

function solarGeometricMeanAnomaly(centuries) {
  return (
    (357.52911 + centuries * (35999.05029 - 0.0001537 * centuries)) *
    am5.math.RADIANS
  );
}

function solarGeometricMeanLongitude(centuries) {
  const l = (280.46646 + centuries * (36000.76983 + centuries * 0.0003032)) % 360;
  return ((l < 0 ? l + 360 : l) / 180) * Math.PI;
}

function solarEquationOfCenter(centuries) {
  const m = solarGeometricMeanAnomaly(centuries);
  return (
    (Math.sin(m) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries)) +
      Math.sin(m + m) * (0.019993 - 0.000101 * centuries) +
      Math.sin(m + m + m) * 0.000289) *
    am5.math.RADIANS
  );
}

function obliquityCorrection(centuries) {
  return (
    meanObliquityOfEcliptic(centuries) +
    0.00256 *
      Math.cos((125.04 - 1934.136 * centuries) * am5.math.RADIANS) *
      am5.math.RADIANS
  );
}

function meanObliquityOfEcliptic(centuries) {
  return (
    (23 +
      (26 +
        (21.448 -
          centuries * (46.815 + centuries * (0.00059 - centuries * 0.001813))) /
          60) /
        60) *
    am5.math.RADIANS
  );
}

function eccentricityEarthOrbit(centuries) {
  return 0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries);
}
