# Map Charts — Geographic Visualizations

> **As a JSON config:** see `references/json.md`. The settings below go into each object's `"settings"` there.


## Required imports

### ES modules
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
```

### CDN
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/map.js"></script>
<script src="https://cdn.amcharts.com/lib/5/geodata/worldLow.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Geodata (map files)

NPM: `@amcharts/amcharts5-geodata`
CDN: `https://cdn.amcharts.com/lib/5/geodata/{mapName}.js`

| Map | ES import | CDN global |
|-----|----------|-----------|
| World (low detail) | `@amcharts/amcharts5-geodata/worldLow` | `am5geodata_worldLow` |
| World (high detail) | `@amcharts/amcharts5-geodata/worldHigh` | `am5geodata_worldHigh` |
| USA (low) | `@amcharts/amcharts5-geodata/usaLow` | `am5geodata_usaLow` |
| USA (high) | `@amcharts/amcharts5-geodata/usaHigh` | `am5geodata_usaHigh` |
| France (low) | `@amcharts/amcharts5-geodata/franceLow` | `am5geodata_franceLow` |
| Continents | `@amcharts/amcharts5-geodata/continentsLow` | `am5geodata_continentsLow` |

Pattern: camelCase country name + detail level. E.g. `germanyLow`, `canadaHigh`, `chinaLow`.

**IMPORTANT — regional/continent geodata:**
- Individual country maps: `geodata/{countryName}Low.js` > global `am5geodata_{countryName}Low`
- **There are NO continent-level maps** like `europeLow.js` or `asiaLow.js` at the top-level CDN path
- Regional maps are in subdirectories: `geodata/region/world/{regionName}Low.js`
  - CDN: `https://cdn.amcharts.com/lib/5/geodata/region/world/europeLow.js`
  - Global: `am5geodata_region_world_europeLow`
- For a map of European countries, use `worldLow.js` and filter with `include: ["DE", "FR", "IT", ...]`
- **US congressional districts** come in versioned packs under `geodata/region/usa/<pack>/`, each with `usaCongressionalLow.js` / `usaCongressionalHigh.js` (all states) and per-state `<st>Low.js` / `<st>High.js` (e.g. `txLow.js`). There is no top-level `geodata/usaCongressionalLow.js`.

| Pack | Districts |
|------|-----------|
| `congressional` | 117th Congress (the original set; the 116th used the same districts) |
| `congressional2022` | 118th |
| `congressional2025` | 119th |
| `congressional120` | 120th, the newest (geodata 5.1.6; includes proposed changes) |

**Global names** are `am5geodata_` + the path below `geodata/`, with `/` > `_` and case kept: `geodata/region/usa/congressional120/usaCongressionalLow.js` > `am5geodata_region_usa_congressional120_usaCongressionalLow`; ES import `@amcharts/amcharts5-geodata/region/usa/congressional120/usaCongressionalLow`. The npm package has the same maps (default exports, raw GeoJSON under `json/`, also on the CDN as `geodata/json/<path>.json`), and its `loadMap("region/usa/congressional120/txLow")` loads any map by path. Where the amCharts MCP server is connected, its `list_geodata(filter)` tool lists every map with its CDN path, global name and ES import.

## Core setup

```js
const root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

const chart = root.container.children.push(
  am5map.MapChart.new(root, {
    panX: "rotateX",           // "translateX", "rotateX", "none"
    panY: "translateY",        // "translateY", "rotateY", "none"
    projection: am5map.geoMercator(),
    // homeGeoPoint: { latitude: 48.8566, longitude: 2.3522 },
    // homeZoomLevel: 5,
    // autoHome: true              // (5.21.0) start at the home position
  })
);

// Polygon series (countries/regions)
const polygonSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow
    // exclude: ["AQ"]             // exclude Antarctica (only if needed)
    // include: ["US", "CA", "MX"]  // show only these
  })
);

chart.appear(1000, 100);
```

## Available projections

```js
am5map.geoMercator()          // most common, rectangular
am5map.geoNaturalEarth1()     // rounded, good for world maps
am5map.geoAlbersUsa()         // USA with Alaska/Hawaii repositioned
am5map.geoOrthographic()      // globe
am5map.geoEqualEarth()        // equal-area
am5map.geoEquirectangular()   // simple lat/long grid
```

**IMPORTANT — Antarctica (`exclude: ["AQ"]`):**
- Do NOT exclude Antarctica by default. Many amCharts demos exclude it because they use Mercator projection where Antarctica appears disproportionately large, but this is a demo-specific choice, not a best practice.
- Only exclude Antarctica when the user explicitly asks for it, or when referencing a specific demo that excludes it.
- With non-Mercator projections (`geoNaturalEarth1`, `geoEqualEarth`, `geoOrthographic`, `geoEquirectangular`) Antarctica renders at a reasonable size and should be included.

## Series types

### MapPolygonSeries (countries, regions)

```js
const polygonSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow,
    // exclude: ["AQ"],          // only if user requests Antarctica exclusion
    valueField: "value",        // for choropleth coloring
    calculateAggregates: true   // needed for heat rules
  })
);

// Polygon appearance
polygonSeries.mapPolygons.template.setAll({
  tooltipText: "{name}",
  interactive: true,
  fill: am5.color(0xdadada),
  strokeWidth: 0.5
});

// Hover state
polygonSeries.mapPolygons.template.states.create("hover", {
  fill: am5.color(0x297373)
});

// Supplement geodata with custom values
polygonSeries.data.setAll([
  { id: "US", name: "United States", value: 331 },
  { id: "CN", name: "China", value: 1411 },
  { id: "IN", name: "India", value: 1380 }
]);
```

**Custom GeoJSON: exterior rings must be CLOCKWISE.** amCharts projects on a sphere (d3-geo), where a ring's winding order decides which side is "inside". The GeoJSON spec (RFC 7946) winds exterior rings counter-clockwise, and d3-geo reads a CCW ring as *the whole globe minus the polygon* — so every polygon fills the entire viewport and the real shape shows only as a sliver (looks like a zoom/fit bug, is not). GIS exports are usually already clockwise; programmatically generated GeoJSON (grids, cells, buffers) usually is not. amCharts does **not** auto-rewind, so reverse the rings yourself:

```js
// Fix winding before handing custom GeoJSON to MapPolygonSeries
geojson.features.forEach(function(feature) {
  var g = feature.geometry;
  if (g.type === "Polygon") {
    g.coordinates = g.coordinates.map(function(ring) { return ring.slice().reverse(); });
  } else if (g.type === "MultiPolygon") {
    g.coordinates = g.coordinates.map(function(poly) {
      return poly.map(function(ring) { return ring.slice().reverse(); });
    });
  }
});
polygonSeries.set("geoJSON", geojson);

// Fit the map to a custom region (no country geodata needed): left/right = longitude, top/bottom = latitude
chart.zoomToGeoBounds({ left: -8.6, right: 1.8, top: 60.9, bottom: 49.9 }, 500);
```

`zoomToGeoBounds(bounds, duration?)` is the most direct way to fit custom polygons. Since 5.21.0 it uses the `duration` you pass (it rotated with `animationDuration`) and no longer modifies the bounds object; `goHome()` also works when called before the map is ready or on a rotated map, and `autoHome: true` does the initial trip for you (see "Zoom controls").

### Choropleth (heat map) via heat rules

```js
polygonSeries.set("heatRules", [{
  target: polygonSeries.mapPolygons.template,
  dataField: "value",
  min: am5.color(0xf7e9b9),
  max: am5.color(0x5a1d6e),
  key: "fill"
}]);

// Heat legend
const heatLegend = chart.children.push(am5.HeatLegend.new(root, {
  orientation: "horizontal",
  startColor: am5.color(0xf7e9b9),
  endColor: am5.color(0x5a1d6e),
  startText: "Low",
  endText: "High",
  stepCount: 5
}));
```

For a scale through more than two colors (5.21.2), give the heat rule `stops` instead of `min`/`max` and the legend `colors` instead of `startColor`/`endColor`: see index.md "Heat rules". `Adaptive` and `Monochrome` themes take `mapShade: true` (5.21.2) for map land in a lighter shade of their base color.

**Styling heat-legend segments.** With `stepCount: N` the legend draws N discrete `RoundedRectangle` markers inside `heatLegend.markerContainer`, all styled through `heatLegend.markers.template` (it accepts the usual Graphics settings — `stroke`, `strokeWidth`, `strokeOpacity`, `fillOpacity`, `cornerRadius*`, `tooltipText` for a per-block hover tooltip). Segment **thickness** is the marker's cross-axis size: a **vertical** legend uses the marker `width` (default `15`) with `height: 100%`; a **horizontal** legend uses `height` (default `15`) with `width: 100%`. Style via the template — `heatLegend.markers.values` can read empty even while `markerContainer.children` holds the rectangles.

```js
heatLegend.markers.template.setAll({
  width: 30,                 // thicker bar on a vertical legend (use height on a horizontal one)
  stroke: am5.color(0xffffff),
  strokeWidth: 1,
  tooltipText: "{value}"
});
```

### MapPointSeries (markers, bubbles, labels)

```js
const pointSeries = chart.series.push(
  am5map.MapPointSeries.new(root, {
    latitudeField: "latitude",
    longitudeField: "longitude"
  })
);

// Define bullet appearance
pointSeries.bullets.push(function(root, series, dataItem) {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 5,
      fill: am5.color(0xff0000),
      tooltipText: "{name}"
    })
  });
});

// Add points via data. Fields named "latitude"/"longitude" are the series
// defaults since 5.16.1; any other naming must be declared via
// latitudeField/longitudeField or the points silently won't render.
pointSeries.data.setAll([
  { latitude: 48.8566, longitude: 2.3522, name: "Paris" },
  { latitude: 40.7128, longitude: -74.0060, name: "New York" },
  { latitude: 35.6762, longitude: 139.6503, name: "Tokyo" }
]);

// OR: place points at polygon centers using polygonIdField
const pointSeries2 = chart.series.push(
  am5map.MapPointSeries.new(root, { polygonIdField: "polygonId" })
);
pointSeries2.data.setAll([
  { polygonId: "US", name: "USA" },
  { polygonId: "FR", name: "France" }
]);
```

`surfaceBullets: true` (5.21.0) lays the bullets onto the map surface, and `altitudeField` (5.21.0) raises points — see "Bullets on the surface" and "Raised lines and points" below.

**A point's bullet sprite:** `dataItem.bullets` is a plain array property, not a setting (`dataItem.get("bullets")` is `undefined`), on every series type:

```js
var sprite = pointSeries.dataItems[0].bullets?.[0]?.get("sprite");   // the Circle made by the bullet function
```

**Points on lines as data rows (5.20.6):** `MapPointSeries` has `lineIdField` (default `"lineId"`), `positionOnLineField` (default `"positionOnLine"`), `autoRotateField` (default `"autoRotate"`) and `autoRotateAngleField` (default `"autoRotateAngle"`), so a point on a `MapLine` can be a plain row — `{ lineId: "jfk-lhr", positionOnLine: 0.5, autoRotate: true }`, where `lineId` is the line's data `id` in a `MapLineSeries` of the same chart — instead of `pushDataItem({ lineDataItem, positionOnLine })`. Data values of `autoRotate`/`autoRotateAngle` win over the bullet's own setting. `polygonIdField` still has **no** default — declare it as above. See "Animating bullets along lines".

### MapLineSeries (connections, routes)

```js
const lineSeries = chart.series.push(
  am5map.MapLineSeries.new(root, {})
);

lineSeries.mapLines.template.setAll({
  stroke: am5.color(0xff0000),
  strokeWidth: 2,
  strokeOpacity: 0.5
});

// Using point data items for connections
const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
const nyc = pointSeries.pushDataItem({ latitude: 40.71, longitude: -74.01 });
const london = pointSeries.pushDataItem({ latitude: 51.47, longitude: -0.45 });

lineSeries.pushDataItem({
  pointsToConnect: [nyc, london]
});

// OR using GeoJSON geometry
lineSeries.pushDataItem({
  geometry: {
    type: "LineString",
    coordinates: [[-74.01, 40.71], [-0.45, 51.47]]  // [lng, lat] pairs
  }
});

// OR (5.20.3) name the points by id — data-driven, JSON-friendly, no data-item references needed
const pointSeries2 = chart.series.push(am5map.MapPointSeries.new(root, {}));   // ids come from the "id" data field
pointSeries2.data.setAll([
  { id: "JFK", latitude: 40.64, longitude: -73.78 },
  { id: "LAX", latitude: 33.94, longitude: -118.41 }
]);
const lineSeries2 = chart.series.push(am5map.MapLineSeries.new(root, {
  pointSeries: pointSeries2          // where pointIds are looked up
  // pointIdsField: "pointIds"       // default field name
}));
lineSeries2.data.setAll([
  { pointIds: ["JFK", "LAX"] }       // the line waits until every id has a point, then draws
]);
```

`pointsToConnect` wins if a data item has both. Fixed points (`fixed: true`) cannot be used with either. `altitude` on `mapLines.template` (5.21.0) arcs lines above the surface — see "Raised lines and points". Changing `lineType` on the series or a data item redraws lines already drawn since 5.21.0.

### MapSankeySeries (geographic flow bands)

Draws variable-width curved bands between geographic points on a map. Band thickness represents a numeric value — like a Sankey diagram projected onto a map. Extends `MapPolygonSeries` and generates actual GeoJSON polygon geometries, so bands follow the map projection during pan, zoom, and rotation.

**Requires** a `MapPolygonSeries` to resolve country IDs to geographic centroids.

```js
// Create polygon series for countries (required for ID resolution)
var polygonSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow
  })
);

// Create Sankey flow series
var sankeySeries = chart.series.push(
  am5map.MapSankeySeries.new(root, {
    polygonSeries: polygonSeries,
    maxWidth: 5               // max band width in geographic degrees
  })
);
```

#### Data format

Two data patterns — polygon IDs or explicit coordinates.

**Pattern 1: `sourceId` / `targetId` (country codes)**

IDs use ISO 3166-1 alpha-2 codes matching the geodata. Set data directly — `MapSankeySeries` auto-resolves `sourceId`/`targetId` once the referenced `polygonSeries` finishes loading, so data can be set at any time:

```js
sankeySeries.data.setAll([
  { sourceId: "BR", targetId: "DE", value: 350 },
  { sourceId: "BR", targetId: "US", value: 450 },
  { sourceId: "DE", targetId: "FR", value: 150 },
  { sourceId: "DE", targetId: "PL", value: 100 }
]);
```

**Pattern 2: Explicit coordinates**

When using `sourceLongitude`/`sourceLatitude`/`targetLongitude`/`targetLatitude`, centroid lookup is skipped entirely:
```js
sankeySeries.data.setAll([
  {
    sourceLongitude: 2.35, sourceLatitude: 48.86,    // Paris
    targetLongitude: -74.01, targetLatitude: 40.71,  // New York
    value: 100
  }
]);
```

**Waypoints** — route flows through intermediate points:
```js
sankeySeries.data.setAll([
  {
    sourceId: "GB", targetId: "JP", value: 40,
    waypoints: [
      { longitude: 30, latitude: 65 },
      { longitude: 90, latitude: 55 }
    ]
  }
]);
```

**WARNING:** Never call `polygonSeries.data.setAll()` with custom objects — this replaces all geoJSON-derived data items, breaking MapSankeySeries centroid resolution. To set per-country properties (like colors), iterate existing data items after `datavalidated` instead:
```js
polygonSeries.events.on("datavalidated", function() {
  am5.array.each(polygonSeries.dataItems, function(di) {
    if (di.get("id") === "BR") {
      di.get("mapPolygon").setAll({ fill: am5.color(0x8fae7e) });
    }
  });
});
```

#### Key settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `polygonSeries` | MapPolygonSeries | — | Reference series for resolving country IDs |
| `maxWidth` | number | `5` | Maximum band width in geographic degrees |
| `controlPointDistance` | number | `0.5` | Bezier control point distance (0–0.5) |
| `controlPointDistanceSource` | number | — | Control point distance at source end |
| `controlPointDistanceTarget` | number | — | Control point distance at target end |
| `orientation` | string | `"horizontal"` | `"horizontal"` or `"vertical"` — controls departure/arrival direction |
| `resolution` | number | `50` | Sample points per bezier segment |
| `autoSort` | boolean | `true` | Sort bands by target latitude to prevent overlap |
| `nodeType` | string | `"circle"` | `"circle"` or `"bar"` — endpoint node shape |
| `nodeWidth` | number | `1` | Bar width in degrees (bar nodeType only) |
| `nodePadding` | number | `0.3` | Extra padding on node shapes in degrees |
| `antimeridian` | string | `"short"` | `"short"` for shortest path, `"long"` to avoid ±180° crossing |
| `linkColorMode` | string | `"solid"` | `"solid"`: every band takes `mapPolygons.template`'s fill; `"source"` / `"target"`: each band takes that node's fill, so the nodes need colors (see "Band appearance"). Followed since 5.21.1, also when node fills change |
| `sourceIdField` | string | `"sourceId"` | Data field for source polygon ID |
| `targetIdField` | string | `"targetId"` | Data field for target polygon ID |
| `sourceLongitudeField` | string | `"sourceLongitude"` | Data field for source longitude |
| `sourceLatitudeField` | string | `"sourceLatitude"` | Data field for source latitude |
| `targetLongitudeField` | string | `"targetLongitude"` | Data field for target longitude |
| `targetLatitudeField` | string | `"targetLatitude"` | Data field for target latitude |
| `waypointsField` | string | `"waypoints"` | Data field for waypoints array |

#### Band appearance

Configure flow bands via `mapPolygons.template`:

```js
sankeySeries.mapPolygons.template.setAll({
  fill: am5.color(0xff6b35),
  fillOpacity: 0.6,
  strokeOpacity: 0,
  tooltipText: "{sourceId} > {targetId}: {value}"
});
```

Bands colored like their nodes — map nodes get no colors of their own, so give them a `ColorSet` (before the data):

```js
var sankeySeries = chart.series.push(am5map.MapSankeySeries.new(root, {
  polygonSeries: polygonSeries,
  linkColorMode: "source"     // each band takes its source node's fill ("target": its target's)
}));
sankeySeries.nodes.set("colors", am5.ColorSet.new(root, {}));   // map nodes have no colors by default
```

Per-link control point overrides in data:
```js
sankeySeries.data.setAll([
  { sourceId: "CN", targetId: "US", value: 300, controlPointDistance: 0.2 },
  { sourceId: "CN", targetId: "DE", value: 200, controlPointDistanceSource: 0.4 }
]);
```

#### Node configuration

Each unique endpoint gets a node shape. Configure via `nodes.mapPolygons.template`:

```js
sankeySeries.nodes.mapPolygons.template.setAll({
  fill: am5.color(0x8b5e3c),
  fillOpacity: 0.9,
  stroke: am5.color(0xffffff),
  strokeWidth: 1.5
});
```

Bar-style nodes (like traditional Sankey):
```js
var sankeySeries = chart.series.push(
  am5map.MapSankeySeries.new(root, {
    polygonSeries: polygonSeries,
    nodeType: "bar",
    nodeWidth: 1.5   // bar width in degrees
  })
);
```

#### Animated bullets along bands

```js
sankeySeries.bullets.push(function(root, series, dataItem) {
  return am5.Bullet.new(root, {
    locationX: 0,
    autoRotate: true,
    sprite: am5.Circle.new(root, {
      radius: 3,
      fill: am5.color(0xffffff)
    })
  });
});

// Animate bullets along flow paths
sankeySeries.events.on("datavalidated", function() {
  am5.array.each(sankeySeries.dataItems, function(dataItem) {
    var bullets = dataItem.bullets;
    if (bullets) {
      am5.array.each(bullets, function(bullet) {
        bullet.animate({
          key: "locationX",
          from: 0,
          to: 1,
          duration: 3000,
          easing: am5.ease.linear,
          loops: Infinity
        });
      });
    }
  });
});
```

Bullets automatically hide on the back side of the globe (orthographic projection). Since 5.21.0 they are drawn above the flows, and bullets that are not moving along their flow follow the map when it moves (before, they stayed behind).

#### Multi-level flows

The same country can be both target and source — incoming and outgoing bands share unified stacking at intermediate nodes:

```js
sankeySeries.data.setAll([
  // Level 1: Producers > Hubs
  { sourceId: "BR", targetId: "DE", value: 350 },
  { sourceId: "VN", targetId: "DE", value: 200 },
  // Level 2: Hubs > Consumers
  { sourceId: "DE", targetId: "FR", value: 150 },
  { sourceId: "DE", targetId: "PL", value: 100 }
]);
```

### Animating bullets along lines (positionOnLine)

`MapPointSeries` data items have a `positionOnLine` setting (0–1) that positions the point along a line. Combined with `lineDataItem` (or, since 5.20.6, a `lineId` data field) and `autoRotate`, this enables flight-path-style animations.

```js
// Create a point that follows a line
var planeSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
planeSeries.bullets.push(function(root, series, dataItem) {
  return am5.Bullet.new(root, {
    sprite: am5.Graphics.new(root, {
      svgPath: "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47",
      scale: 0.04, centerY: am5.p50, centerX: am5.p50, fill: am5.color(0xff6600)
    })
  });
});

var plane = planeSeries.pushDataItem({
  lineDataItem: lineDataItem,  // a MapLineSeries data item
  positionOnLine: 0,
  autoRotate: true
});

// Animate along the line
plane.animate({ key: "positionOnLine", to: 1, duration: 3000,
  easing: am5.ease.inOut(am5.ease.cubic) });

// Track position for globe rotation or scale changes
plane.on("positionOnLine", function(pos) {
  // Center globe on plane's current position
  chart.set("rotationX", -plane.get("longitude"));
  chart.set("rotationY", -plane.get("latitude"));
});
```

**Data-row form + declared flight (5.20.6 / 5.20.8)** — no data-item references and no `animate()` call, so the whole thing survives `ChartSerializer` (points added with `pushDataItem()` are not serialized; `data` rows are):

```js
var lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));   // push before the point series
lineSeries.data.setAll([{ id: "jfk-lhr",
  geometry: { type: "LineString", coordinates: [[-73.78, 40.64], [-0.45, 51.47]] } }]);

var planeSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
planeSeries.bullets.push(function (root, series, dataItem) {
  return am5.Bullet.new(root, {
    sprite: am5.Graphics.new(root, {
      svgPath: "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47",
      scale: 0.06, centerX: am5.p50, centerY: am5.p50,
      // loops: 0 = forever; yoyo flies back; keep `from` explicit (a row without positionOnLine would jump to `to`)
      animations: [{ target: "dataItem", key: "positionOnLine", from: 0, to: 1,
                     duration: 6000, loops: 0, yoyo: true, easing: "cubic", ease: "inOut" }]
    })
  });
});
planeSeries.data.setAll([{ lineId: "jfk-lhr", positionOnLine: 0, autoRotate: true }]);
```

**Direction on the way back (5.20.8):** an `autoRotate` point turns round to face its travel direction **only** while an `animations` entry on its bullet sprite (`target: "dataItem"`, `key: "positionOnLine"`) moves it back toward the line start. A point moved by `dataItem.animate()` from code keeps facing the line's direction — that code has to turn it (Example 4 rotates its plane between segments itself). An endless loop started on a data item in code is saved by `ChartSerializer` since 5.21.0 (not in 5.20.8). In 5.21.0–5.21.2 only the first one found was saved, on the bullet sprite, so after parsing every point played it. Since 5.21.3 loops that differ per point are saved in each point's data row, under the bullet sprite's `templateField` (`"bulletSettings"` if none is set); one loop shared by all points still goes on the sprite. Where the rows can't hold them, the first one still goes on the sprite for all: points made from geodata, a sprite with its own `animations`, or a loop animating object values. Since 5.21.0 every point placed on a line follows the line when it changes (e.g. gets an `altitude`), not just one of them.

**IMPORTANT — Multi-segment lines and `positionOnLine`:**
- `positionOnLine` treats the entire line as one unit (0 = start, 1 = end). If a line has multiple segments (i.e. `pointsToConnect` has 3+ points), position 0.5 is the midpoint of the *entire* path.
- For advanced per-segment animations (e.g., scaling the bullet differently at the midpoint of each segment, or pausing between segments), use **single-segment lines** (2 points each) instead of one multi-segment line. This gives you full control: animate `positionOnLine` from 0 to 1 on each segment line sequentially, with independent timing, easing, and callbacks per segment.
- Example: instead of one line with points [A, B, C, D], create three lines: [A,B], [B,C], [C,D] and animate the bullet across them one at a time.

### Raised lines and points — `altitude` (5.21.0)

`altitude` on a `MapLine` lifts each leg (one point to the next) into an arc, in **metres** at its middle (`400000` ≈ the ISS). Once set (even `0`), the line's ends sit at the `altitude` of the points it connects (or the third value of their coordinates); without it the line stays on the surface. Not applied to `lineType: "straight"`. On flat maps lines rise up the screen.

```js
var pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
pointSeries.bullets.push(function (root, series, dataItem) {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, { radius: 5, fill: am5.color(0xff621f), tooltipText: "{title}" })
  });
});
pointSeries.data.setAll([
  { id: "london", title: "London", latitude: 51.5072, longitude: -0.1276 },
  { id: "new-york", title: "New York", latitude: 40.7128, longitude: -74.006 },
  { id: "singapore", title: "Singapore", latitude: 1.3521, longitude: 103.8198 }
]);

var lineSeries = chart.series.push(am5map.MapLineSeries.new(root, { pointSeries: pointSeries }));
lineSeries.mapLines.template.setAll({
  altitude: 1000000,   // each route rises 1,000 km in its middle and lands on both cities
  stroke: am5.color(0xff621f),
  strokeWidth: 2
});
lineSeries.data.setAll([{ pointIds: ["london", "new-york"] }, { pointIds: ["london", "singapore"] }]);

// Points raised by a data value — altitudeField has NO default, so declare it
var satSeries = chart.series.push(am5map.MapPointSeries.new(root, { altitudeField: "altitude" }));
satSeries.bullets.push(function (root, series, dataItem) {
  return am5.Bullet.new(root, { sprite: am5.Circle.new(root, { radius: 4, fill: am5.color(0x0066cc) }) });
});
satSeries.data.setAll([{ latitude: 10, longitude: 0, altitude: 400000 }]);   // metres
```

A point on a line takes the line's altitude. `mapLine.positionToAltitude(position)` returns the altitude (m) at `0`–`1` along a line. Works best on a globe (`geoOrthographic`, see `map-altitude-arcs` in the npm package examples). Raised lines draw 3–4 times faster since 5.21.1.

**Heights per coordinate:** once a line's `altitude` is set (`0` for none), the third value of each coordinate is that point's height in metres, and a non-zero `altitude` adds its arc to each leg on top. One line can then change height along its length (a descent from orbit, relief along a parallel); without `altitude` the third values are ignored. The demo "Globe with raised parallels" (`maps/globe-with-raised-parallels`) does this.

```js
var pathSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));
pathSeries.mapLines.template.setAll({ altitude: 0, stroke: am5.color(0xff621f), strokeWidth: 2 });
pathSeries.data.setAll([{ geometry: { type: "LineString",
  coordinates: [[0, 0, 800000], [20, 10, 400000], [40, 15, 0]] } }]);   // [longitude, latitude, metres]
```

**Where a raised point is on screen:** for a `MapPointSeries` point, `dataItem.get("point")` is its raised position (`{ x, y }`) and `dataItem.get("clipped")` says whether it is hidden. For any other longitude, latitude and height `h` (MapUtils' `projectAltitude` is not exported): on a globe, `screen = T + (P − T) × (1 + h / R)`, with `P = chart.convert({ longitude, latitude })` the surface point, `T = chart.get("projection").translate()` the globe's center and `R = 6371008.8` m; on a flat map, `P` moved up by `h / R × projection.scale()`.

**`clipFront: true`** on a point series hides the points on the near side. With points raised high (`altitudeField`), what is left are the ones behind the globe that rise past its edge: a starfield behind the globe (`clipBack`, default `true`, still hides those the globe covers).

**`ClusteredPointSeries` with `altitudeField`:** a cluster's bullet floats at the average altitude of its points (the cluster data item gets `altitude`); points still cluster by their distance on screen.

### Bullets on the surface — `surfaceBullets` (5.21.0)

`surfaceBullets: true` on a `MapPointSeries` lays its bullets onto the map: each turns, squashes and stretches with the projection, as if painted on — on a globe they flatten towards the edge, on Mercator they grow towards the poles. Default `false` (bullets stay upright and unscaled).

```js
var pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {
  surfaceBullets: true
}));
pointSeries.bullets.push(function (root, series, dataItem) {
  return am5.Bullet.new(root, {
    sprite: am5.Graphics.new(root, {   // a pin with its tip at the point
      svgPath: "M0,0 C-5,-7 -9,-11 -9,-17 A9,9 0 1 1 9,-17 C9,-11 5,-7 0,0 Z M0,-20.5 A3.5,3.5 0 1 0 0,-13.5 A3.5,3.5 0 1 0 0,-20.5 Z",
      fill: am5.color(0xff621f),
      tooltipText: "{title}"
    })
  });
});
pointSeries.data.setAll([
  { title: "London", latitude: 51.5072, longitude: -0.1276 },
  { title: "Tokyo", latitude: 35.6895, longitude: 139.6917 }
]);
```

Heat-rule-sized circles work too (`polygonIdField` + a bullet `am5.Template` as the rule target) — circles that lie flat on a globe.

### Pixel maps — `PixelMapSeries` (5.21.0)

`am5map.PixelMapSeries` extends `MapPolygonSeries` and draws its polygons as a grid of pixels that rotate and zoom with the map. Each pixel takes the look of the polygon it falls in, so **style `mapPolygons.template`, not the pixels** — heat rules, `templateField`, states and tooltips work as on `MapPolygonSeries` (the polygons stay, invisible, to take hover and clicks).

```js
var pixelSeries = chart.series.push(am5map.PixelMapSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  pixelType: "circle",       // "square" (default), "circle", "diamond", "hexagon"
  step: 2,                   // degrees between pixel centers (default 2)
  uniform: true,             // an even on-screen grid of same-size pixels, like a pixel image of the map
  valueField: "value",
  calculateAggregates: true  // the heat rule needs the value range
}));
pixelSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("disabled"),   // countries without data
  tooltipText: "{name}: {value}"
});
pixelSeries.set("heatRules", [{
  target: pixelSeries.mapPolygons.template, dataField: "value",
  min: am5.color(0xffd19a), max: am5.color(0xb3261e), key: "fill"
}]);
pixelSeries.data.setAll([{ id: "US", value: 38 }, { id: "IN", value: 28 }, { id: "NG", value: 18 }]);
```

3D columns — the height of each polygon's columns comes from `MapPolygon` `pixelHeight` (`0`–`1` of `columnHeight`; set it with a heat rule or `templateField`); without it, from the polygon's value between the series' low and high (needs `calculateAggregates`):

```js
var columns = chart.series.push(am5map.PixelMapSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  valueField: "value",
  calculateAggregates: true,
  columnHeight: 0.15      // tallest column = 15% of the globe's radius (0 = flat, the default)
}));
columns.set("heatRules", [{
  target: columns.mapPolygons.template, dataField: "value",
  min: 0.1, max: 1, key: "pixelHeight"
}]);
columns.mapPolygons.template.setAll({ stroke: am5.color(0xffffff), strokeWidth: 0.5 }); // outline each pixel
columns.data.setAll([{ id: "CN", value: 1410 }, { id: "IN", value: 1430 }, { id: "ID", value: 277 }]);
```

| Setting | Default | Notes |
|---------|---------|-------|
| `step` | `2` | Degrees between pixel centers (with `uniform`, measured at the map's center). Finest `0.001`; a step that would make more than **500,000 pixels** is coarsened, with a console warning — small maps can take a fine step (e.g. `0.01` for a small country) |
| `pixelSize` | `0.8` | Pixel size relative to `step`; `1` = neighbors touch |
| `pixelType` | `"square"` | `"circle"`, `"diamond"`, `"hexagon"` |
| `stagger` | unset | Shift every other row by half a pixel; unset = squares in columns, circles staggered; hexagons/diamonds always staggered |
| `equalArea` | `true` | Fewer pixels per row towards the poles; `false` = same count every row |
| `equalWidth` | `false` | Every pixel as wide as on the equator (overlap towards the poles); not with `uniform` |
| `uniform` | `false` | Even on-screen grid, upright same-size pixels; `equalArea` and `columnHeight` do not apply |
| `columnHeight` | `0` | Raises pixels into columns; tallest = this share of the globe's radius |
| `pixelHeightFunction` | — | `(dataItem, longitude, latitude) => 0..1` per pixel; overrides `pixelHeight`; **not saved** to JSON (heat-rule heights are) |

Pixels have no outline by default (the theme keeps pixel polygons at `strokeWidth: 0`); set `strokeWidth` (and `stroke`) on `mapPolygons.template` to outline each pixel. `pixelSeries.pixels` is the `Graphics` that draws them all: `am5.renderToSVG(pixelSeries.pixels)` exports just the pixels, with each polygon's pixels in a `<g id="US" data-name="United States">`. `include`/`exclude` work as on `MapPolygonSeries`.

**The classic dotted map** is `pixelType: "circle"` with `uniform: true`. Without `uniform` the pixels lie on the surface, so on projections such as `geoEqualEarth` the circles near the poles widen into ovals.

**`step` for one country:** `step` is in degrees, so the default `2` suits the world but leaves a country only a few pixels. Derive it from the area shown, its longer side divided by the pixels wanted across it:

```js
var geodata = am5geodata_germanyLow;
var b = am5map.getGeoBounds({ type: "GeometryCollection",
  geometries: geodata.features.map(function (f) { return f.geometry; }) });   // { left, right, top, bottom } in degrees
var countrySeries = chart.series.push(am5map.PixelMapSeries.new(root, {
  geoJSON: geodata,
  step: Math.max(b.right - b.left, b.top - b.bottom) / 60   // about 60 pixels across
}));
```

(`getGeoBounds` spans `-180`…`180` for a shape that crosses the 180th meridian.)

**Random column heights:** `pixelHeightFunction` runs again for every pixel whenever heights are recomputed (data changes, a hover state that sets `MapPolygon` `pixelHeight`, …), so `Math.random()` makes the columns jump. Use a deterministic hash of longitude and latitude, times the polygon's own height so per-polygon heights still apply:

```js
var hashed = chart.series.push(am5map.PixelMapSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  columnHeight: 0.1,
  pixelHeightFunction: function (dataItem, longitude, latitude) {
    var h = Math.sin(longitude * 12.9898 + latitude * 78.233) * 43758.5453;
    return (h - Math.floor(h)) * dataItem.get("mapPolygon").get("pixelHeight", 1);
  }
}));
```

### Satellite images — `MapRasterSeries` (5.21.0)

`am5map.MapRasterSeries` shows one image of the whole world, reprojected as the map turns and zooms (on the GPU with WebGL2 for orthographic, equirectangular, Mercator, Equal Earth and Natural Earth; on the CPU otherwise). With `nightSrc` and a sun position it shows day where the sun is up and night where it is down, blended across twilight.

```js
var raster = chart.series.push(am5map.MapRasterSeries.new(root, {
  src: "https://cdn.amcharts.com/lib/5/geodata/images/earthDay2048.jpg",       // the world by day
  nightSrc: "https://cdn.amcharts.com/lib/5/geodata/images/earthNight2048.jpg", // optional: city lights at night
  sunDate: "now"   // or sunPosition: { longitude, latitude } — needed only with nightSrc
}));
raster.events.on("loaded", function () { /* src (and nightSrc) are drawn */ });
raster.events.on("loaderror", function () { /* failed, or cross-origin without CORS */ });
```

- The image must be **equirectangular** ("plate carrée": longitude −180…180 left to right, latitude 90…−90 top to bottom). The CDN has `geodata/images/{earthDay,earthNight,moon,mars}{2048,4096}.jpg`, e.g. `https://cdn.amcharts.com/lib/5/geodata/images/moon4096.jpg` (the npm geodata package has no images). The Earth images are from NASA Earth Observatory: credit the source, e.g. with a small `am5.Label`.
- `cors` (default `"anonymous"`): a cross-origin image is drawn only if its server sends CORS headers. A page opened from disk (`file://`) cannot read an image file beside it — serve the page, or use the CDN copy.
- The series counts as the whole world in the map's bounds; on a regional map set `affectsBounds: false`. The projection needs `invert`, so nothing is drawn while `animateProjection()` runs.
- Draw country borders over it with a `MapPolygonSeries` pushed after it, `fillOpacity: 0` on `mapPolygons.template`. `twilight` (default `12` degrees of sun height) sets how wide the day/night blend is.

### Night shading — `NightSeries` and `getSunPosition()` (5.21.0)

`am5map.NightSeries` shades the part of the map where it is night, with the twilight in steps, and shows the sun. It never affects the map's bounds.

```js
chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldLow }));

var night = chart.series.push(am5map.NightSeries.new(root, {
  sunDate: "now",        // "now" (moves on every minute), a timestamp, a date string or a Date
  sunAltitude: 2000000   // metres: keeps the sun in view a little past a globe's edge (default 0)
}));
night.mapPolygons.template.setAll({ fill: am5.color(0x000033), fillOpacity: 0.6 }); // full night (default black, 0.5)
night.get("sun").setAll({ radius: 12 });   // the sun is a Circle the series makes; or set any sprite as `sun`

// …or a fixed moment instead of the clock — where the sun is overhead at a given time:
// am5map.NightSeries.new(root, { sunPosition: am5map.getSunPosition(new Date("2026-06-21T12:00:00Z")) })
```

- `sunDate` overrides `sunPosition`. To change a `Date`, set a new object — mutating the same one goes unnoticed.
- `twilight` (default `12`) and `twilightSteps` (default `4`, number of shades from day to full night).
- `sunAltitude` is for looks: `1000000`–`5000000` suits a globe.
- `am5map.getSunPosition(date?)` takes a `Date` (default now) and returns the `{ longitude, latitude }` where the sun is directly overhead — also for `MapRasterSeries` `sunPosition`, or to place a sun marker on a `MapPointSeries`.
- **JSON:** a saved chart keeps `sunDate`, never the `sunPosition` worked out from it, so a `"now"` map still follows the clock after parsing.

**Day and night on another body.** `sunDate` is the Earth's sun only, so for the Moon or Mars set `sunPosition` to that body's sub-solar point (from your own ephemeris), and leave `sunDate` unset (it wins). A small `twilight` gives an airless body's sharp edge:

```js
chart.series.push(am5map.MapRasterSeries.new(root, {
  src: "https://cdn.amcharts.com/lib/5/geodata/images/moon2048.jpg"
}));
var lunarNight = chart.series.push(am5map.NightSeries.new(root, {
  sunPosition: { longitude: 30, latitude: 1.5 },   // the Moon's sub-solar point
  twilight: 1.5                                    // default 12 (degrees)
}));
lunarNight.get("sun").set("forceHidden", true);    // hide the sun marker
```

## Zoom controls

```js
chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
// its home button is hidden by default: zoomControl.homeButton.set("visible", true)

// Programmatic zoom
chart.zoomToGeoPoint({ latitude: 48.86, longitude: 2.35 }, 5);  // zoom level 5

// Zoom to a polygon (5.21.0: prefer clickZoom, below)
polygonSeries.mapPolygons.template.events.on("click", function(ev) {
  polygonSeries.zoomToDataItem(ev.target.dataItem);
});

// Home button
chart.chartContainer.children.push(am5.Button.new(root, {
  label: am5.Label.new(root, { text: "Home" })
})).events.on("click", function() {
  chart.goHome();
});

// Fit to a lat/long box (left/right = longitude, top/bottom = latitude)
chart.zoomToGeoBounds({ left: -10, right: 40, top: 70, bottom: 35 }, 800);
```

**Pointer zoom behaviors (5.20.2):** a double click/tap zooms in and shift + double click zooms out **by default** (`doubleClickZoom: true`; set `false` to turn it off). `boxZoom` lets the user drag a rectangle to zoom into — its value is the key that must be held: `"shift"`, `"ctrl"`, `"alt"`, or `"drag"` for no key (then set `panX`/`panY: "none"`, since a plain drag otherwise pans); default `"none"`. The rectangle being drawn is `chart.boxZoomSelection` (a `Rectangle`, style its `fill`/`stroke`).

```js
am5map.MapChart.new(root, {
  boxZoom: "shift",          // hold shift and drag to zoom into the box
  doubleClickZoom: false     // opt out of the default double-click zoom
});
chart.boxZoomSelection.setAll({ fill: am5.color(0x1e88e5), fillOpacity: 0.15 });
```

**Zoom to a clicked polygon — `clickZoom` (5.21.0).** One setting replaces the click-handler + `zoomToDataItem` + background-click recipe: a click zooms to the polygon (on a map panned by rotating — `panX: "rotateX"`/`panY: "rotateY"` — the globe also turns to it); clicking it again or the map background goes back home. The polygon zoomed to is `active`, so an `"active"` state marks it. Default `false`; works from JSON.

```js
var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  clickZoom: true
}));
polygonSeries.mapPolygons.template.setAll({ tooltipText: "{name}", interactive: true });
polygonSeries.mapPolygons.template.states.create("active", {
  fill: root.interfaceColors.get("primaryButtonActive")
});
```

`clickZoom` sets `active` itself, so `toggleKey: "active"` is not needed (with it, the two still agree).

**Start at the home position — `autoHome` (5.21.0).** Goes to the home position (`homeGeoPoint`, `homeZoomLevel`, `homeRotationX`/`homeRotationY`) once the map is loaded, as `goHome()` does — animated when `animationDuration` is set (the Animated theme sets it), at once otherwise. No `goHome()` call in a `datavalidated` handler needed, so a map loaded from JSON can start zoomed in. Default `false`.

```js
var chart = root.container.children.push(am5map.MapChart.new(root, {
  projection: am5map.geoMercator(),
  homeGeoPoint: { longitude: 14, latitude: 51 },   // central Europe…
  homeZoomLevel: 3.5,                              // …zoomed in 3.5 times
  autoHome: true
}));
```

With `autoHome` and no `homeZoomLevel`, home zoom is `1`, so a starting `zoomLevel` is overridden: set `homeZoomLevel` to the same value. Without `autoHome`, a `zoomLevel` given to `MapChart.new()` is the starting zoom (since 5.21.1; before, one set before the map loaded was ignored or left the map blank).

**Home on a globe.** On a map that pans by rotating (`panX: "rotateX"`, `panY: "rotateY"`), `goHome()` and the home button restore the rotation only from `homeRotationX` / `homeRotationY` (−longitude / −latitude). `homeGeoPoint` alone leaves the rotation as it is and shifts the globe sideways.

```js
var globe = root.container.children.push(am5map.MapChart.new(root, {
  projection: am5map.geoOrthographic(),
  panX: "rotateX",
  panY: "rotateY",
  homeRotationX: -10,   // home = centered on 10°E…
  homeRotationY: -50    // …50°N
}));
```

**`zoomStep`** (default `2`) is a multiplier, not an increment: `zoomIn()` and the + button multiply `zoomLevel` by it, `zoomOut()` divides, and the mouse wheel and double clicks use it too, one step per wheel event whatever its size. So keep it above `1` (`1` does nothing, below `1` reverses); `zoomStep: 1.1`–`1.2` gives fine control, e.g. on trackpads, which fire many small wheel events. `wheelSensitivity` does not affect wheel zoom, only wheel rotation.

Fixed in 5.21.0: `goHome()` went to the wrong place before the map was ready or on a rotated map (globe); a zoomed-in map could not be dragged to its edges (with `maxPanOut: 0` not at all); `zoomToGeoBounds()` rotated with `animationDuration` instead of the given duration and changed the bounds object; `MapPointSeries.zoomToDataItems(items, true)` / `ClusteredPointSeries.zoomToCluster()` turned a globe to the wrong point; `chart.geoPoint()` and `getPolygonByGeoPoint()` were off on charts with padding.

## Globe (orthographic projection)

```js
var chart = root.container.children.push(am5map.MapChart.new(root, {
  projection: am5map.geoOrthographic(),
  panX: "rotateX",     // drag to rotate horizontally
  panY: "rotateY",     // drag to rotate vertically
  rotationX: -70,      // initial longitude center
  rotationY: -30       // initial latitude center
}));

// Rotate to a specific point (center it on the globe)
// IMPORTANT: use NEGATIVE longitude and NEGATIVE latitude
var paris = { latitude: 48.8566, longitude: 2.3522 };
chart.animate({ key: "rotationX", to: -paris.longitude, duration: 1500, easing: am5.ease.out(am5.ease.cubic) });
chart.animate({ key: "rotationY", to: -paris.latitude, duration: 1500, easing: am5.ease.out(am5.ease.cubic) });
```

**IMPORTANT — Globe rotation direction:** To center the globe on a geographic point, set `rotationX` to **negative longitude** and `rotationY` to **negative latitude**. This is because rotation moves the globe under the camera: rotating X by -2.35 brings longitude 2.35 to the center. A common mistake is using positive coordinates, which rotates the globe in the wrong direction.

Setting `rotationX`/`rotationY`/`rotationZ` on every frame (e.g. a camera that follows a moving point) performs fine.

## GraticuleSeries (grid lines / ocean background)

```js
// Background (ocean)
var backgroundSeries = chart.series.unshift(am5map.MapPolygonSeries.new(root, {}));
backgroundSeries.mapPolygons.template.setAll({
  fill: am5.color(0xddeeff),
  stroke: am5.color(0xddeeff)
});
backgroundSeries.data.push({
  geometry: am5map.getGeoRectangle(90, 180, -90, -180) // full globe background
});

// Grid lines (graticule)
chart.series.push(am5map.GraticuleSeries.new(root, {}));
```

## Drill-down map (country > states)

```js
// World-level polygons
var worldSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow
}));

// Country-level polygons (initially hidden)
var countrySeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));

// Click a country to drill down
worldSeries.mapPolygons.template.events.on("click", function(ev) {
  var country = ev.target.dataItem.dataContext.id; // ISO alpha-2 code, e.g., "US"
  // Load country geodata dynamically
  import("@amcharts/amcharts5-geodata/usaLow").then(function(geodata) {
    countrySeries.set("geoJSON", geodata.default);
    chart.zoomToDataItem(ev.target.dataItem);
  });
});

// Back button
chart.chartContainer.children.push(am5.Button.new(root, {
  label: am5.Label.new(root, { text: "Back" })
})).events.on("click", function() {
  countrySeries.set("geoJSON", undefined);
  chart.goHome();
});
```

## Additional MapChart settings

```js
am5map.MapChart.new(root, {
  maxZoomLevel: 32,         // max zoom
  minZoomLevel: 1,          // min zoom
  maxPanOut: 0.4,           // how far user can pan beyond map (0-1)
  rotationX: 0,             // center longitude
  rotationY: 0,             // center latitude
  rotationZ: 0,             // tilt
  wheelY: "zoom",           // "zoom", "rotateX", "rotateY", "none"
  zoomStep: 2,              // zoom multiplier per step: buttons, wheel, double click (see "Zoom controls")
  wheelSensitivity: 1,      // how far the wheel rotates the map ("rotateX"/"rotateY" only), not zoom speed
  doubleClickZoom: true,    // (5.20.2) double click zooms in, shift+double click out — default true
  boxZoom: "none",          // (5.20.2) "none" | "drag" | "shift" | "ctrl" | "alt" — key held to drag a zoom box
  autoHome: false,          // (5.21.0) true = go to homeGeoPoint/homeZoomLevel once loaded
})
```

**Polygon IDs** use ISO 3166-1 alpha-2 codes (e.g., `"US"`, `"CN"`, `"DE"`, `"FR"`).

**Accessibility (5.21.0):** focusable map polygons can be focused (they could not before), objects left out with `include`/`exclude` get no focus element, objects panned or zoomed out of view are not TAB stops until at least partly back in view, and the zoom level is announced to screen readers once zooming settles.

## Events on map elements

```js
// Polygon click
polygonSeries.mapPolygons.template.events.on("click", function(ev) {
  var id = ev.target.dataItem.dataContext.id;    // "US", "CN", etc.
  var name = ev.target.dataItem.dataContext.name; // "United States"
  console.log("Clicked:", name, id);
});

// Point/marker click
pointSeries.bullets.push(function(root, series, dataItem) {
  var circle = am5.Circle.new(root, { radius: 5, fill: am5.color(0xff0000) });
  circle.events.on("click", function() {
    console.log("Marker:", dataItem.dataContext);
  });
  return am5.Bullet.new(root, { sprite: circle });
});

// Map zoom — use settings watch, NOT events (there is no "zoomlevelchanged" event)
chart.on("zoomLevel", function(zoomLevel) {
  console.log("Zoom:", zoomLevel);
});

// Links without a click handler (5.20.7): urlField on MapPolygonSeries, MapLineSeries or MapPointSeries (bullets)
var linkedSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow, urlField: "url", linkTarget: "_blank"   // linkTarget default "_self"
}));
linkedSeries.data.setAll([{ id: "US", url: "https://en.wikipedia.org/wiki/United_States" }]);
```

`urlField` has no default (links are off until set); the pointer cursor is set automatically unless you set `cursorOverStyle`; `javascript:`/`data:`/`vbscript:` URLs are never opened; override `series.openUrl(dataItem)` to intercept. `MapSankeySeries` nodes are not linked — keep a `click` handler there.

## Disposal

In a React, Vue, Angular, Svelte or React Native app, use amCharts' framework package, which disposes the root with the component (index.md, "Frameworks"). Otherwise dispose the root when the component goes away:

```js
root.dispose();
```


---

# amCharts 5 Map Charts — Working Examples

## Example 1: World choropleth map

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>World Choropleth Map</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/map.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/geodata/worldLow.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "translateY",
      projection: am5map.geoNaturalEarth1()
    }));

    var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
      valueField: "value",
      calculateAggregates: true
    }));

    polygonSeries.mapPolygons.template.setAll({
      tooltipText: "{name}: {value}",
      interactive: true
    });

    polygonSeries.mapPolygons.template.states.create("hover", {
      fill: am5.color(0x677935)
    });

    // Heat rules for choropleth coloring
    polygonSeries.set("heatRules", [{
      target: polygonSeries.mapPolygons.template,
      dataField: "value",
      min: am5.color(0xcee8c0),
      max: am5.color(0x1d6e04),
      key: "fill"
    }]);

    // Sample data — population in millions
    polygonSeries.data.setAll([
      { id: "US", value: 331 }, { id: "CN", value: 1411 },
      { id: "IN", value: 1380 }, { id: "BR", value: 213 },
      { id: "RU", value: 146 }, { id: "JP", value: 126 },
      { id: "DE", value: 83 }, { id: "GB", value: 67 },
      { id: "FR", value: 67 }, { id: "AU", value: 26 }
    ]);

    // Heat legend
    var heatLegend = chart.children.push(am5.HeatLegend.new(root, {
      orientation: "horizontal",
      startColor: am5.color(0xcee8c0),
      endColor: am5.color(0x1d6e04),
      startText: "Low",
      endText: "High",
      stepCount: 5
    }));

    chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 2: Map with point markers (bubble map)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bubble Map</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/map.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/geodata/worldLow.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "translateX",
      panY: "translateY",
      projection: am5map.geoMercator()
    }));

    // Background polygons — excluding Antarctica here because Mercator makes it disproportionately large
    var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
      exclude: ["AQ"]
    }));
    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0xdddddd),
      strokeWidth: 0.5,
      stroke: am5.color(0xffffff)
    });

    // Point series with scaled bubbles
    var pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {
      latitudeField: "latitude",
      longitudeField: "longitude"
    }));

    var cities = [
      { name: "New York", latitude: 40.71, longitude: -74.01, population: 8.3 },
      { name: "London", latitude: 51.51, longitude: -0.13, population: 9.0 },
      { name: "Tokyo", latitude: 35.68, longitude: 139.69, population: 13.5 },
      { name: "Paris", latitude: 48.86, longitude: 2.35, population: 2.2 },
      { name: "Sydney", latitude: -33.87, longitude: 151.21, population: 5.3 }
    ];

    // Scale bubble size by population
    pointSeries.bullets.push(function(root, series, dataItem) {
      var value = dataItem.dataContext.population;
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: Math.sqrt(value) * 4,
          fill: am5.color(0xff5733),
          fillOpacity: 0.5,
          strokeWidth: 1,
          stroke: am5.color(0xffffff),
          tooltipText: "{name}\nPopulation: {population}M"
        })
      });
    });

    pointSeries.data.setAll(cities);

    chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 3: US map with connection lines

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>US Flight Routes</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/map.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/geodata/usaLow.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "translateX",
      panY: "translateY",
      projection: am5map.geoAlbersUsa()
    }));

    // State polygons
    var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_usaLow
    }));
    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0xdadada),
      stroke: am5.color(0xffffff),
      strokeWidth: 1,
      tooltipText: "{name}"
    });

    // Point series for airports
    var pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    pointSeries.bullets.push(function(root, series, dataItem) {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 4,
          fill: am5.color(0x3355ff),
          stroke: am5.color(0xffffff),
          strokeWidth: 1,
          tooltipText: "{name}"
        })
      });
    });

    var jfk = pointSeries.pushDataItem({ latitude: 40.64, longitude: -73.78, name: "JFK" });
    var lax = pointSeries.pushDataItem({ latitude: 33.94, longitude: -118.41, name: "LAX" });
    var ord = pointSeries.pushDataItem({ latitude: 41.97, longitude: -87.91, name: "ORD" });
    var atl = pointSeries.pushDataItem({ latitude: 33.64, longitude: -84.43, name: "ATL" });

    // Line series for routes
    var lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));
    lineSeries.mapLines.template.setAll({
      stroke: am5.color(0x3355ff),
      strokeOpacity: 0.6,
      strokeWidth: 2
    });

    lineSeries.pushDataItem({ pointsToConnect: [jfk, lax] });
    lineSeries.pushDataItem({ pointsToConnect: [jfk, ord] });
    lineSeries.pushDataItem({ pointsToConnect: [ord, atl] });
    lineSeries.pushDataItem({ pointsToConnect: [atl, lax] });

    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 4: Globe with animated flight path (positionOnLine + globe rotation)

Demonstrates: orthographic projection, single-segment lines for per-segment animation control, `positionOnLine` animation, globe auto-rotation to follow the plane, bullet scale animation, and city expand/shrink effects.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Globe Flight Path</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/map.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/geodata/continentsLow.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 600px; background: #0a0a1a; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);
    var orange = am5.color(0xff6b35);
    var cityColor = am5.color(0xcc4a1a);

    var cities = [
      { name: "London", latitude: 51.5074, longitude: -0.1278 },
      { name: "Dubai", latitude: 25.2048, longitude: 55.2708 },
      { name: "Singapore", latitude: 1.3521, longitude: 103.8198 },
      { name: "Sydney", latitude: -33.8688, longitude: 151.2093 },
      { name: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
      { name: "Honolulu", latitude: 21.3069, longitude: -157.8583 },
      { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437 },
      { name: "São Paulo", latitude: -23.5505, longitude: -46.6333 },
      { name: "New York", latitude: 40.7128, longitude: -74.006 },
      { name: "London", latitude: 51.5074, longitude: -0.1278 }
    ];

    // Globe centered on first city (note: NEGATIVE lat/lon for rotation)
    var chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "rotateY",
      projection: am5map.geoOrthographic(),
      rotationX: -cities[0].longitude,
      rotationY: -cities[0].latitude
    }));

    // Ocean background
    var bgSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    bgSeries.mapPolygons.template.setAll({
      fill: am5.color(0x1a1a2e), fillOpacity: 1, strokeOpacity: 0
    });
    bgSeries.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) });

    // Graticule
    var graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));
    graticuleSeries.mapLines.template.setAll({
      stroke: am5.color(0x4a4a65), strokeOpacity: 0.5, strokeWidth: 0.8
    });

    // Continents
    var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_continentsLow
    }));
    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0x2a2a45), stroke: am5.color(0x3a3a55),
      strokeWidth: 0.5, strokeOpacity: 0.6
    });

    // Dashed route lines — one per segment for animation control
    var lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));
    lineSeries.mapLines.template.setAll({
      stroke: orange, strokeOpacity: 0.35, strokeWidth: 1.5, strokeDasharray: [3, 3]
    });

    // City points with pulse + label
    var pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    pointSeries.bullets.push(function(root, series, dataItem) {
      var container = am5.Container.new(root, {});
      container.children.push(am5.Circle.new(root, {
        radius: 3.5, fill: cityColor, fillOpacity: 0.9,
        stroke: orange, strokeWidth: 4, strokeOpacity: 0
      }));
      container.children.push(am5.Label.new(root, {
        text: "{name}", fill: am5.color(0xffffff), fontSize: 11,
        fontWeight: "600", centerX: am5.p50, centerY: am5.p100,
        dy: -8, opacity: 0, populateText: true
      }));
      return am5.Bullet.new(root, { sprite: container });
    });

    var pointsToConnect = [];
    for (var i = 0; i < cities.length; i++) {
      if (i === cities.length - 1) {
        pointsToConnect.push(pointsToConnect[0]); // loop back
      } else {
        pointsToConnect.push(pointSeries.pushDataItem({
          latitude: cities[i].latitude, longitude: cities[i].longitude,
          name: cities[i].name
        }));
      }
    }

    // Single-segment lines (one per city pair) for per-segment control
    var segmentLines = [];
    var numSegments = cities.length - 1;
    for (var i = 0; i < numSegments; i++) {
      segmentLines.push(lineSeries.pushDataItem({
        pointsToConnect: [pointsToConnect[i], pointsToConnect[i + 1]]
      }));
    }

    // Plane series — one per segment, all hidden initially
    var planeSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    planeSeries.bullets.push(function(root, series, dataItem) {
      return am5.Bullet.new(root, {
        sprite: am5.Graphics.new(root, {
          svgPath: "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47",
          scale: 0.04, centerY: am5.p50, centerX: am5.p50,
          fill: orange, forceHidden: true
        })
      });
    });

    var planes = [];
    for (var i = 0; i < numSegments; i++) {
      planes.push(planeSeries.pushDataItem({
        lineDataItem: segmentLines[i], positionOnLine: 0, autoRotate: true
      }));
    }

    var baseScale = 0.04, peakScale = 0.065;

    // Haversine distance for proportional timing
    function haversine(lat1, lon1, lat2, lon2) {
      var R = 6371, dLat = (lat2 - lat1) * Math.PI / 180,
          dLon = (lon2 - lon1) * Math.PI / 180;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    var msPerKm = 0.4;
    var segDurations = [];
    for (var i = 0; i < numSegments; i++) {
      var d = haversine(cities[i].latitude, cities[i].longitude,
                        cities[i + 1].latitude, cities[i + 1].longitude);
      segDurations.push(Math.max(800, Math.round(d * msPerKm)));
    }

    var activeCityIdx = -1;

    function expandCity(idx) {
      var di = pointsToConnect[idx];
      if (!di || !di.bullets || !di.bullets[0]) return;
      var container = di.bullets[0].get("sprite");
      var dot = container.children.getIndex(0);
      var label = container.children.getIndex(1);
      activeCityIdx = idx;
      dot.animate({ key: "radius", to: 14, duration: 400, easing: am5.ease.out(am5.ease.cubic) });
      dot.animate({ key: "fillOpacity", to: 0, duration: 400, easing: am5.ease.out(am5.ease.cubic) });
      dot.animate({ key: "strokeOpacity", to: 1, duration: 400, easing: am5.ease.out(am5.ease.cubic) });
      label.setAll({ opacity: 0, dy: 0 });
      label.animate({ key: "opacity", to: 1, duration: 300, easing: am5.ease.out(am5.ease.cubic) });
      label.animate({ key: "dy", to: -10, duration: 300, easing: am5.ease.out(am5.ease.cubic) });
    }

    function shrinkCity(idx) {
      var di = pointsToConnect[idx];
      if (!di || !di.bullets || !di.bullets[0]) return;
      var container = di.bullets[0].get("sprite");
      var dot = container.children.getIndex(0);
      var label = container.children.getIndex(1);
      dot.animate({ key: "radius", to: 3.5, duration: 500, easing: am5.ease.cubic });
      dot.animate({ key: "fillOpacity", to: 0.9, duration: 500, easing: am5.ease.cubic });
      dot.animate({ key: "strokeOpacity", to: 0, duration: 500, easing: am5.ease.cubic });
      label.animate({ key: "opacity", to: 0, duration: 400, easing: am5.ease.cubic });
      activeCityIdx = -1;
    }

    var lastRotation = null;
    var activeFlightDisposer = null;

    function startFlight(plane, sprite, idx) {
      if (activeCityIdx >= 0) shrinkCity(activeCityIdx);
      var nextIdx = (idx + 1) % numSegments;
      var expanded = false;

      if (activeFlightDisposer) { activeFlightDisposer.dispose(); activeFlightDisposer = null; }

      // Track position: rotate globe + scale bullet + expand destination city early
      activeFlightDisposer = plane.on("positionOnLine", function (pos) {
        chart.set("rotationX", -plane.get("longitude"));
        chart.set("rotationY", -plane.get("latitude"));
        var s = baseScale + (peakScale - baseScale) * Math.sin(pos * Math.PI);
        if (plane.bullets && plane.bullets[0]) {
          plane.bullets[0].get("sprite").set("scale", s);
        }
        if (!expanded && pos >= 0.85) { expanded = true; expandCity(nextIdx); }
      });

      var anim = plane.animate({
        key: "positionOnLine", to: 1, duration: segDurations[idx],
        easing: am5.ease.inOut(am5.ease.cubic)
      });
      anim.events.on("stopped", function () {
        lastRotation = sprite.get("rotation", 0);
        sprite.set("forceHidden", true);
        flySegment(nextIdx);
      });
    }

    function flySegment(idx) {
      var plane = planes[idx];
      var sprite = plane.bullets[0].get("sprite");
      plane.set("positionOnLine", 0);
      sprite.set("forceHidden", false);

      if (lastRotation === null) {
        sprite.set("opacity", 0);
        sprite.animate({ key: "opacity", to: 1, duration: 400, easing: am5.ease.out(am5.ease.cubic) });
      }

      if (lastRotation !== null) {
        var targetRotation = sprite.get("rotation", 0);
        plane.set("autoRotate", false);
        sprite.set("rotation", lastRotation);
        var diff = targetRotation - lastRotation;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        var rotAnim = sprite.animate({
          key: "rotation", to: lastRotation + diff, duration: 500,
          easing: am5.ease.out(am5.ease.cubic)
        });
        rotAnim.events.on("stopped", function () {
          plane.set("autoRotate", true);
          startFlight(plane, sprite, idx);
        });
      } else {
        startFlight(plane, sprite, idx);
      }
    }

    chart.appear(1000, 100);
    expandCity(0);
    setTimeout(function () { flySegment(0); }, 1500);
  </script>
</body>
</html>
```

## Example 5: Map Sankey — Global Coffee Supply Chain (sourceId/targetId)

Demonstrates: `MapSankeySeries` with `sourceId`/`targetId` data (country codes), multi-level flows (producers > hubs > consumers), custom theme, country highlighting, animated coffee bean bullets, Globe/Map projection toggle, and auto-rotation. Based on the `map-sankey` shared example.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Map Sankey — Global Coffee Supply Chain</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/map.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/geodata/worldLow.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>body { margin: 0; background: #f0e6d6; } #chartdiv { width: 100%; height: 600px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");

    // Coffee theme — warm earth tones
    var coffeeTheme = am5.Theme.new(root);
    coffeeTheme.rule("InterfaceColors").setAll({
      primaryButton: am5.color(0x8b5e3c),
      primaryButtonHover: am5.color(0x5c3a1e),
      primaryButtonDown: am5.color(0x3c1e0e),
      primaryButtonActive: am5.color(0xc4956a),
      primaryButtonText: am5.color(0xf5ece0),
      secondaryButton: am5.color(0xe8d5b7),
      secondaryButtonHover: am5.color(0xd4c4a8),
      secondaryButtonDown: am5.color(0xc4956a),
      secondaryButtonText: am5.color(0x3c1e0e),
      background: am5.color(0xe8d5b7),
      text: am5.color(0x3c1e0e)
    });
    root.setThemes([am5themes_Animated.new(root), coffeeTheme]);

    // Grainy paper background
    root.container.set("background", am5.Rectangle.new(root, {
      fill: am5.color(0xf0e6d6),
      fillPattern: am5.GrainPattern.new(root, {
        density: 0.4,
        maxOpacity: 0.07,
        colors: [am5.color(0x000000)]
      })
    }));

    // Coffee palette
    var espresso = am5.color(0x3c1e0e);
    var darkRoast = am5.color(0x5c3a1e);
    var mediumRoast = am5.color(0x8b5e3c);
    var lightRoast = am5.color(0xc4956a);
    var crema = am5.color(0xe8d5b7);
    var cream = am5.color(0xf5ece0);

    var chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "rotateY",
      projection: am5map.geoOrthographic(),
      rotationX: -15,
      rotationY: -20,
      minZoomLevel: 0.5,
      zoomLevel: 0.9
    }));

    // Ocean / globe background
    var bgSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    bgSeries.mapPolygons.template.setAll({
      fill: am5.color(0xede4d4), fillOpacity: 1, strokeOpacity: 0
    });
    bgSeries.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) });

    // Graticule
    var graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));
    graticuleSeries.mapLines.template.setAll({
      stroke: mediumRoast, strokeOpacity: 0.15, strokeWidth: 0.5
    });

    // Countries
    var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow
    }));
    polygonSeries.mapPolygons.template.setAll({
      fill: cream, stroke: lightRoast, strokeWidth: 0.5, strokeOpacity: 0.5
    });

    // Highlight producer, hub, and consumer countries
    var producerIds = ["BR", "VN", "CO", "ET", "ID", "HN"];
    var hubIds = ["DE", "BE", "IT", "US"];
    var consumerIds = ["FR", "PL", "SE", "RU", "GB", "NL", "GR", "AT", "CA", "JP"];

    polygonSeries.events.on("datavalidated", function() {
      am5.array.each(polygonSeries.dataItems, function(di) {
        var id = di.get("id");
        if (id && producerIds.indexOf(id) !== -1) {
          di.get("mapPolygon").setAll({ fill: am5.color(0x8fae7e) });
        } else if (id && hubIds.indexOf(id) !== -1) {
          di.get("mapPolygon").setAll({ fill: am5.color(0xc4a878) });
        } else if (id && consumerIds.indexOf(id) !== -1) {
          di.get("mapPolygon").setAll({ fill: am5.color(0xddc8a0) });
        }
      });
    });

    // MapSankeySeries — coffee supply chain
    var sankeySeries = chart.series.push(am5map.MapSankeySeries.new(root, {
      polygonSeries: polygonSeries,
      maxWidth: 2,
      controlPointDistance: 0.4,
      resolution: 60,
      nodePadding: 0.3
    }));

    sankeySeries.mapPolygons.template.setAll({
      fill: mediumRoast,
      fillOpacity: 0.65,
      strokeOpacity: 0,
      tooltipText: "{sourceNode.name} > {targetNode.name}\n{value}k tonnes"
    });

    sankeySeries.nodes.mapPolygons.template.setAll({
      fill: espresso,
      stroke: crema,
      strokeWidth: 1.5,
      fillOpacity: 0.95,
      strokeOpacity: 1,
      tooltipText: "{name}\n{sum}k tonnes"
    });

    // Animated coffee bean bullets
    sankeySeries.bullets.push(function(root, series, dataItem) {
      return am5.Bullet.new(root, {
        locationX: 0,
        autoRotate: true,
        sprite: am5.Graphics.new(root, {
          svgPath: "M-4,-2.5 C-4,-5 -1.5,-6.5 1,-6.5 C3.5,-6.5 5,-4.5 5,-2 C5,1 3,3.5 0.5,5 C-0.5,5.7 -1.5,5.7 -2.5,5 C-5,3.5 -6,1 -4,-2.5 Z M-1,-5 C-1,-1 -1,2 -0.5,4.5",
          fill: espresso,
          stroke: darkRoast,
          strokeWidth: 0.5,
          centerX: am5.p50,
          centerY: am5.p50,
          scale: 0.35,
          visible: false
        })
      });
    });

    // Set data directly — MapSankeySeries auto-resolves sourceId/targetId
    // once polygonSeries finishes loading.
    sankeySeries.data.setAll([
      // Producers > Hubs
      { sourceId: "BR", targetId: "DE", value: 350 },
      { sourceId: "BR", targetId: "US", value: 450 },
      { sourceId: "BR", targetId: "IT", value: 200 },
      { sourceId: "VN", targetId: "DE", value: 200 },
      { sourceId: "VN", targetId: "BE", value: 150 },
      { sourceId: "CO", targetId: "US", value: 250 },
      { sourceId: "CO", targetId: "DE", value: 80 },
      { sourceId: "ET", targetId: "DE", value: 60 },
      { sourceId: "ET", targetId: "BE", value: 40 },
      { sourceId: "ID", targetId: "US", value: 80 },
      { sourceId: "HN", targetId: "DE", value: 60 },
      { sourceId: "HN", targetId: "BE", value: 40 },
      // Hubs > Consumer Markets
      { sourceId: "DE", targetId: "FR", value: 150 },
      { sourceId: "DE", targetId: "PL", value: 100 },
      { sourceId: "DE", targetId: "SE", value: 80 },
      { sourceId: "DE", targetId: "RU", value: 120 },
      { sourceId: "BE", targetId: "GB", value: 100 },
      { sourceId: "BE", targetId: "NL", value: 80 },
      { sourceId: "IT", targetId: "GR", value: 50 },
      { sourceId: "IT", targetId: "AT", value: 40 },
      { sourceId: "US", targetId: "CA", value: 120 },
      { sourceId: "US", targetId: "JP", value: 80 }
    ]);

    // Set country names on auto-created nodes and animate bullets
    var countryNames = {
      BR: "Brazil", VN: "Vietnam", CO: "Colombia", ET: "Ethiopia",
      ID: "Indonesia", HN: "Honduras", DE: "Germany", BE: "Belgium",
      IT: "Italy", US: "United States", FR: "France", PL: "Poland",
      SE: "Sweden", RU: "Russia", GB: "United Kingdom", NL: "Netherlands",
      GR: "Greece", AT: "Austria", CA: "Canada", JP: "Japan"
    };

    sankeySeries.events.on("datavalidated", function() {
      am5.array.each(sankeySeries.nodes.dataItems, function(di) {
        var id = di.get("id");
        if (id && countryNames[id]) {
          di.set("name", countryNames[id]);
        }
      });

      am5.array.each(sankeySeries.dataItems, function(dataItem) {
        var bullets = dataItem.bullets;
        if (bullets) {
          am5.array.each(bullets, function(bullet) {
            var randomDur = 3000 + Math.random() * 3000;
            var delay = Math.random() * randomDur;
            setTimeout(function() {
              var sprite = bullet.get("sprite");
              if (sprite) sprite.set("visible", true);
              bullet.animate({
                key: "locationX",
                from: 0,
                to: 1,
                duration: randomDur,
                easing: am5.ease.linear,
                loops: Infinity
              });
            }, delay);
          });
        }
      });
    });

    // Title
    var titleCont = chart.children.push(am5.Container.new(root, {
      layout: root.verticalLayout,
      x: am5.p50, centerX: am5.p50,
      y: am5.p100, centerY: am5.p100,
      position: "absolute", paddingBottom: 16
    }));
    titleCont.children.push(am5.Label.new(root, {
      text: "Global Coffee Supply Chain",
      fontSize: 18, fontWeight: "600", fill: espresso,
      x: am5.p50, centerX: am5.p50
    }));
    titleCont.children.push(am5.Label.new(root, {
      text: "(Thousands of tonnes)",
      fontSize: 11, fill: mediumRoast,
      x: am5.p50, centerX: am5.p50
    }));

    // Globe / Map toggle
    var switchCont = chart.children.push(am5.Container.new(root, {
      layout: root.horizontalLayout, x: 20, y: 40
    }));
    switchCont.children.push(am5.Label.new(root, {
      centerY: am5.p50, text: "Globe", fill: espresso, fontSize: 13
    }));
    var switchButton = switchCont.children.push(am5.Button.new(root, {
      themeTags: ["switch"], centerY: am5.p50,
      icon: am5.Circle.new(root, { themeTags: ["icon"] })
    }));

    var easing = am5.ease.inOut(am5.ease.cubic);
    var duration = 1500;
    var fadeDuration = 300;

    function zoomToGlobe() {
      chart.set("projection", am5map.geoOrthographic());
      chart.set("panX", "rotateX");
      chart.set("panY", "rotateY");
      chart.animate({ key: "rotationX", to: -15, duration: duration, easing: easing });
      chart.animate({ key: "rotationY", to: -20, duration: duration, easing: easing });
      bgSeries.mapPolygons.template.set("fillOpacity", 1);
      chart.set("minZoomLevel", 0.9);
      chart.animate({ key: "zoomLevel", to: 0.9, duration: duration, easing: easing });
    }

    function zoomToMap() {
      chart.set("projection", am5map.geoMercator());
      chart.set("panX", "translateX");
      chart.set("panY", "translateY");
      chart.animate({ key: "rotationX", to: 0, duration: duration, easing: easing });
      chart.animate({ key: "rotationY", to: 0, duration: duration, easing: easing });
      bgSeries.mapPolygons.template.set("fillOpacity", 0);
      chart.set("minZoomLevel", 1);
      chart.animate({ key: "zoomLevel", to: 1.7, duration: duration, easing: easing });
    }

    switchButton.on("active", function() {
      chart.goHome(duration);
      setTimeout(function() {
        chart.seriesContainer.animate({ key: "opacity", to: 0, duration: fadeDuration });
      }, duration - fadeDuration);
      setTimeout(function() {
        if (switchButton.get("active")) { zoomToMap(); } else { zoomToGlobe(); }
        chart.seriesContainer.animate({ key: "opacity", to: 1, duration: fadeDuration });
      }, duration);
    });

    switchCont.children.push(am5.Label.new(root, {
      centerY: am5.p50, text: "Map", fill: espresso, fontSize: 13
    }));

    // Zoom controls
    var zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    zoomControl.homeButton.set("visible", true);

    // Auto-rotate globe until user interaction
    var rotationAnimation = chart.animate({
      key: "rotationX", from: -15, to: -15 + 360,
      duration: 120000, loops: Infinity, easing: am5.ease.linear
    });
    chart.chartContainer.events.on("pointerdown", function() {
      if (rotationAnimation) { rotationAnimation.stop(); rotationAnimation = null; }
    });

    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 6: Map Sankey — Oil Export Flows with Waypoints (explicit coordinates)

Demonstrates: `MapSankeySeries` with explicit `sourceLongitude`/`sourceLatitude` coordinates, maritime waypoints for realistic shipping routes, oil drop SVG bullets with proportional animation speed, dark theme, country highlighting, and Globe/Map projection toggle. Based on the `map-sankey-waypoints` shared example.

**IMPORTANT — waypoints must use `longitude`/`latitude` keys** (not shorthand like `lon`/`lat`). Source/target location objects can use any keys because the `flow()` helper maps them to `sourceLongitude`/`sourceLatitude`, but waypoints are read directly by the series via `wp.longitude` and `wp.latitude`.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Map Sankey — Oil Export Flows</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/map.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/geodata/worldLow.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>body { margin: 0; background: #0a0e12; } #chartdiv { width: 100%; height: 600px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");

    // Oil/dark theme
    var oilTheme = am5.Theme.new(root);
    oilTheme.rule("InterfaceColors").setAll({
      primaryButton: am5.color(0x1e2824),
      primaryButtonHover: am5.color(0x3a5040),
      primaryButtonDown: am5.color(0x0a0e12),
      primaryButtonActive: am5.color(0xc8890a),
      primaryButtonText: am5.color(0xf5d090),
      secondaryButton: am5.color(0x1e2824),
      secondaryButtonHover: am5.color(0x3a5040),
      secondaryButtonDown: am5.color(0x141a1a),
      secondaryButtonText: am5.color(0xf5d090),
      background: am5.color(0x0a0e12),
      text: am5.color(0xf5d090)
    });
    root.setThemes([am5themes_Animated.new(root), oilTheme]);

    // Palette
    var deepCrude = am5.color(0x141a1a);
    var slick = am5.color(0x1e2824);
    var pipeline = am5.color(0x3a5040);
    var amber = am5.color(0xc8890a);
    var sulfur = am5.color(0xa89050);
    var flare = am5.color(0xf5d090);

    var chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "rotateY",
      projection: am5map.geoOrthographic(),
      homeGeoPoint: { longitude: 0, latitude: 0 },
      homeRotationX: 0,
      homeRotationY: 0,
      homeZoomLevel: 1,
      minZoomLevel: 0.8,
      zoomLevel: 1
    }));

    // Ocean
    var bgSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    bgSeries.mapPolygons.template.setAll({
      fill: deepCrude, fillOpacity: 1, strokeOpacity: 0
    });
    bgSeries.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) });

    // Graticule
    var graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));
    graticuleSeries.mapLines.template.setAll({
      stroke: pipeline, strokeOpacity: 0.25, strokeWidth: 0.5
    });

    // Countries
    var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow
    }));
    polygonSeries.mapPolygons.template.setAll({
      fill: slick, stroke: pipeline, strokeWidth: 0.5, strokeOpacity: 0.6
    });

    // Highlight producer & importer countries
    var producerIds = ["SA", "IQ", "AE", "KW", "IR", "QA"];
    var importerIds = ["CN", "JP", "KR", "IN", "SG", "IT", "GR", "NL"];
    polygonSeries.events.on("datavalidated", function() {
      am5.array.each(polygonSeries.dataItems, function(di) {
        var id = di.get("id");
        if (producerIds.indexOf(id) !== -1) {
          di.get("mapPolygon").setAll({ fill: am5.color(0x6b5a10), tooltipText: "{name}" });
        } else if (importerIds.indexOf(id) !== -1) {
          di.get("mapPolygon").setAll({ fill: am5.color(0x2a4030), tooltipText: "{name}" });
        }
      });
    });

    // MapSankeySeries
    var sankeySeries = chart.series.push(am5map.MapSankeySeries.new(root, {
      polygonSeries: polygonSeries,
      maxWidth: 0.8,
      controlPointDistance: 0.4,
      resolution: 60,
      nodePadding: 0.1
    }));

    sankeySeries.mapPolygons.template.setAll({
      fill: amber, fillOpacity: 0.4, strokeOpacity: 0,
      tooltipText: "{source} > {target}\n{value}k bbl/day"
    });

    sankeySeries.nodes.mapPolygons.template.setAll({
      fill: amber, stroke: flare, strokeWidth: 1.5,
      fillOpacity: 0.95, strokeOpacity: 1, tooltipText: "{name}"
    });

    // Animated oil drop bullets
    sankeySeries.bullets.push(function(root, series, dataItem) {
      return am5.Bullet.new(root, {
        locationX: 0,
        autoRotate: true,
        autoRotateAngle: -90,
        sprite: am5.Graphics.new(root, {
          svgPath: "M0,-7 C2,-4 5,0 5,3 C5,6 3,8 0,8 C-3,8 -5,6 -5,3 C-5,0 -2,-4 0,-7 Z",
          fill: amber, stroke: am5.color(0x8b6914), strokeWidth: 0.5,
          centerX: am5.p50, centerY: am5.p50, scale: 0.45, visible: false
        })
      });
    });

    sankeySeries.events.on("datavalidated", function() {
      // Scale animation duration proportionally to path length
      var maxLength = 0;
      am5.array.each(sankeySeries.dataItems, function(dataItem) {
        var len = sankeySeries.getPathLength(dataItem);
        if (len > maxLength) maxLength = len;
      });

      var baseDuration = 8000;
      var minDuration = 2000;

      am5.array.each(sankeySeries.dataItems, function(dataItem) {
        var pathLength = sankeySeries.getPathLength(dataItem) || maxLength;
        var dur = maxLength > 0
          ? Math.max(minDuration, (pathLength / maxLength) * baseDuration)
          : baseDuration;
        var bullets = dataItem.bullets;
        if (bullets) {
          am5.array.each(bullets, function(bullet) {
            var randomDur = dur * (0.8 + Math.random() * 0.4);
            var delay = Math.random() * randomDur;
            setTimeout(function() {
              var sprite = bullet.get("sprite");
              if (sprite) sprite.set("visible", true);
              bullet.animate({
                key: "locationX", from: 0, to: 1,
                duration: randomDur, easing: am5.ease.linear, loops: Infinity
              });
            }, delay);
          });
        }
      });
    });

    // Gulf export terminals (source/target objects can use any key names
    // because the flow() helper maps them to sourceLongitude/sourceLatitude)
    var rasTanura   = { lon: 50.17, lat: 26.64 };
    var basra       = { lon: 48.80, lat: 29.69 };
    var fujairah    = { lon: 56.33, lat: 25.12 };
    var minaAhmadi  = { lon: 48.17, lat: 29.08 };
    var khargIsland = { lon: 50.32, lat: 29.23 };
    var rasLaffan   = { lon: 51.56, lat: 25.93 };

    // Import terminals
    var ningbo    = { lon: 121.97, lat: 29.87 };
    var qingdao   = { lon: 120.38, lat: 36.07 };
    var yokohama  = { lon: 139.64, lat: 35.44 };
    var chiba     = { lon: 140.10, lat: 35.60 };
    var ulsan     = { lon: 129.38, lat: 35.50 };
    var jamnagar  = { lon: 69.66, lat: 22.42 };
    var mumbai    = { lon: 72.88, lat: 19.08 };
    var singapore = { lon: 103.84, lat: 1.26 };
    var trieste   = { lon: 13.78, lat: 45.65 };
    var piraeus   = { lon: 23.63, lat: 37.94 };
    var rotterdam = { lon: 4.12, lat: 51.95 };

    function flow(src, srcName, tgt, tgtName, value, wp) {
      var result = {
        sourceLongitude: src.lon, sourceLatitude: src.lat,
        targetLongitude: tgt.lon, targetLatitude: tgt.lat,
        source: srcName, target: tgtName, value: value
      };
      if (wp) result.waypoints = wp;
      return result;
    }

    // IMPORTANT: waypoints must use { longitude: ..., latitude: ... }
    // (NOT shorthand like { lon, lat }) — the series reads wp.longitude / wp.latitude directly
    var wpHormuz     = { longitude: 58,  latitude: 24 };
    var wpArabianSea = { longitude: 64,  latitude: 18 };
    var wpSouthIndia = { longitude: 78,  latitude: 6 };
    var wpMalacca    = { longitude: 101, latitude: 3 };
    var wpAden       = { longitude: 47,  latitude: 12 };
    var wpSuez       = { longitude: 34,  latitude: 29 };

    // Route templates
    var viaJapan      = [{ longitude: 58, latitude: 26 }, { longitude: 80, latitude: 9 },  { longitude: 104, latitude: 7 }];
    var viaKorea      = [{ longitude: 58, latitude: 24 }, { longitude: 78, latitude: 6 },  { longitude: 101, latitude: 3 }];
    var viaChina      = [{ longitude: 58, latitude: 22 }, { longitude: 76, latitude: 3 },  { longitude: 99, latitude: 1 }];
    var viaChinaNorth = [{ longitude: 58, latitude: 22 }, { longitude: 76, latitude: 3 },  { longitude: 99, latitude: 1 }, { longitude: 124, latitude: 32 }];
    var viaIndiaNear  = [wpHormuz];
    var viaIndiaFar   = [wpHormuz, wpArabianSea];
    var viaSingapore  = [wpHormuz, wpSouthIndia];
    var viaSuez       = [wpHormuz, wpAden, wpSuez];
    var wpSouthGreece = { longitude: 22, latitude: 35 };
    var wpOtranto     = { longitude: 18.5, latitude: 40 };
    var viaSuezItaly  = [wpHormuz, wpAden, wpSuez, wpSouthGreece, wpOtranto];
    var wpSicily      = { longitude: 13, latitude: 37 };
    var wpPortugal    = { longitude: -10, latitude: 39 };
    var viaAtlantic   = [wpHormuz, wpAden, wpSuez, wpSicily, wpPortugal];

    sankeySeries.data.setAll([
      // Ras Tanura (Saudi Arabia)
      flow(rasTanura, "Ras Tanura", ningbo,    "Ningbo",    1100, viaChina),
      flow(rasTanura, "Ras Tanura", qingdao,   "Qingdao",    600, viaChinaNorth),
      flow(rasTanura, "Ras Tanura", yokohama,  "Yokohama",   700, viaJapan),
      flow(rasTanura, "Ras Tanura", chiba,     "Chiba",      300, viaJapan),
      flow(rasTanura, "Ras Tanura", ulsan,     "Ulsan",      800, viaKorea),
      flow(rasTanura, "Ras Tanura", jamnagar,  "Jamnagar",   500, viaIndiaNear),
      flow(rasTanura, "Ras Tanura", mumbai,    "Mumbai",     300, viaIndiaFar),
      flow(rasTanura, "Ras Tanura", rotterdam, "Rotterdam",  350, viaAtlantic),
      // Basra Oil Terminal (Iraq)
      flow(basra, "Basra", ningbo,   "Ningbo",    700, viaChina),
      flow(basra, "Basra", qingdao,  "Qingdao",   400, viaChinaNorth),
      flow(basra, "Basra", jamnagar, "Jamnagar",  600, viaIndiaNear),
      flow(basra, "Basra", mumbai,   "Mumbai",    400, viaIndiaFar),
      flow(basra, "Basra", ulsan,    "Ulsan",     400, viaKorea),
      flow(basra, "Basra", trieste,  "Trieste",   350, viaSuezItaly),
      flow(basra, "Basra", piraeus,  "Piraeus",   250, viaSuez),
      // Fujairah (UAE) — already outside Hormuz
      flow(fujairah, "Fujairah", yokohama,  "Yokohama",   400, viaJapan.slice(1)),
      flow(fujairah, "Fujairah", chiba,     "Chiba",      200, viaJapan.slice(1)),
      flow(fujairah, "Fujairah", jamnagar,  "Jamnagar",   300),
      flow(fujairah, "Fujairah", mumbai,    "Mumbai",     200, [wpArabianSea]),
      flow(fujairah, "Fujairah", ningbo,    "Ningbo",     250, viaChina.slice(1)),
      flow(fujairah, "Fujairah", ulsan,     "Ulsan",      350, viaKorea.slice(1)),
      flow(fujairah, "Fujairah", singapore, "Singapore",  250, [wpSouthIndia]),
      // Mina Al Ahmadi (Kuwait)
      flow(minaAhmadi, "Mina Al Ahmadi", ulsan,    "Ulsan",    400, viaKorea),
      flow(minaAhmadi, "Mina Al Ahmadi", yokohama, "Yokohama", 300, viaJapan),
      flow(minaAhmadi, "Mina Al Ahmadi", ningbo,   "Ningbo",   300, viaChina),
      flow(minaAhmadi, "Mina Al Ahmadi", jamnagar, "Jamnagar", 200, viaIndiaNear),
      // Kharg Island (Iran)
      flow(khargIsland, "Kharg Island", ningbo,   "Ningbo",   400, viaChina),
      flow(khargIsland, "Kharg Island", qingdao,  "Qingdao",  200, viaChinaNorth),
      flow(khargIsland, "Kharg Island", jamnagar, "Jamnagar", 200, viaIndiaNear),
      flow(khargIsland, "Kharg Island", piraeus,  "Piraeus",  100, viaSuez),
      // Ras Laffan (Qatar)
      flow(rasLaffan, "Ras Laffan", yokohama, "Yokohama",  300, viaJapan),
      flow(rasLaffan, "Ras Laffan", ulsan,    "Ulsan",     200, viaKorea),
      flow(rasLaffan, "Ras Laffan", jamnagar, "Jamnagar",  150, viaIndiaNear),
      flow(rasLaffan, "Ras Laffan", singapore,"Singapore",  120, viaSingapore)
    ]);

    // Title
    var titleCont = chart.children.push(am5.Container.new(root, {
      layout: root.verticalLayout,
      x: am5.p50, centerX: am5.p50, y: 0,
      position: "absolute", paddingTop: 16
    }));
    titleCont.children.push(am5.Label.new(root, {
      text: "Strait of Hormuz — Oil Export Flows",
      fontSize: 18, fontWeight: "600", fill: amber,
      x: am5.p50, centerX: am5.p50
    }));
    titleCont.children.push(am5.Label.new(root, {
      text: "Gulf Producers > Major Importers  (thousands of barrels/day)",
      fontSize: 11, fill: sulfur,
      x: am5.p50, centerX: am5.p50
    }));

    // Globe / Map toggle
    var switchCont = chart.children.push(am5.Container.new(root, {
      layout: root.horizontalLayout, x: 20, y: 40
    }));
    switchCont.children.push(am5.Label.new(root, {
      centerY: am5.p50, text: "Globe", fill: flare, fontSize: 13
    }));
    var switchButton = switchCont.children.push(am5.Button.new(root, {
      themeTags: ["switch"], centerY: am5.p50,
      icon: am5.Circle.new(root, { themeTags: ["icon"] })
    }));

    var easing = am5.ease.inOut(am5.ease.cubic);
    var duration = 1500;
    var fadeDuration = 300;

    function zoomToGlobe() {
      chart.set("projection", am5map.geoOrthographic());
      chart.set("panX", "rotateX");
      chart.set("panY", "rotateY");
      chart.animate({ key: "rotationX", to: -74, duration: duration, easing: easing });
      chart.animate({ key: "rotationY", to: -30, duration: duration, easing: easing });
      chart.animate({ key: "zoomLevel", to: 1.6, duration: duration, easing: easing });
      bgSeries.mapPolygons.template.set("fillOpacity", 1);
    }

    function zoomToMap() {
      chart.set("projection", am5map.geoMercator());
      chart.set("panX", "translateX");
      chart.set("panY", "translateY");
      chart.animate({ key: "rotationY", to: 0, duration: duration, easing: easing });
      setTimeout(function() {
        chart.zoomToGeoPoint({ longitude: 67, latitude: 32 }, 3.5, true, duration);
      }, 100);
      bgSeries.mapPolygons.template.set("fillOpacity", 0);
    }

    switchButton.on("active", function() {
      chart.goHome(duration);
      setTimeout(function() {
        chart.seriesContainer.animate({ key: "opacity", to: 0, duration: fadeDuration });
      }, duration - fadeDuration);
      setTimeout(function() {
        if (switchButton.get("active")) { zoomToMap(); } else { zoomToGlobe(); }
        chart.seriesContainer.animate({ key: "opacity", to: 1, duration: fadeDuration });
      }, duration);
    });

    switchCont.children.push(am5.Label.new(root, {
      centerY: am5.p50, text: "Map", fill: flare, fontSize: 13
    }));

    // Zoom controls
    var zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    zoomControl.homeButton.set("visible", true);

    chart.appear(1000, 100);

    // Initial animation: rotate to globe position
    setTimeout(function() { zoomToGlobe(); }, 1000);
  </script>
</body>
</html>
```
