# Flow Charts — Sankey, Chord, Arc Diagrams


## Required imports

### ES modules
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5flow from "@amcharts/amcharts5/flow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/flow.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Data structure (shared by all flow types)

```js
var data = [
  { from: "A", to: "D", value: 10 },
  { from: "B", to: "D", value: 8 },
  { from: "B", to: "E", value: 4 },
  { from: "C", to: "E", value: 3 },
  { from: "D", to: "F", value: 15 },
  { from: "E", to: "F", value: 6 }
];
```

Node IDs ("A", "B", etc.) are automatically extracted — you don't define nodes separately.

## Series types

| Class | Use for | Visual |
|-------|---------|--------|
| `am5flow.Sankey` | Linear flow diagrams | Rectangular nodes + curved links |
| `am5flow.Chord` | Circular relationship diagrams | Arc nodes + ribbon links |
| `am5flow.ChordDirected` | Directed chord (arrows) | Arc nodes + directed ribbons |
| `am5flow.ChordNonRibbon` | Chord with line links | Arc nodes + line links |
| `am5flow.ArcDiagram` | Arc connections between linear nodes | Linear nodes + arc links |

**Geographic Sankey (MapSankeySeries):** For Sankey-style flow bands drawn on a geographic map, use `am5map.MapSankeySeries` from the **map** package (not flow). See `references/map.md` > MapSankeySeries section.

## Sankey diagram

```js
const root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

const series = root.container.children.push(
  am5flow.Sankey.new(root, {
    sourceIdField: "from",
    targetIdField: "to",
    valueField: "value",
    orientation: "horizontal",    // "horizontal" (default) or "vertical"
    nodeAlign: "justify",         // "left" | "right" | "center" | "justify"
    nodeWidth: 10,                // pixel width of nodes
    nodePadding: 10,              // pixel gap between nodes
    minSize: 0.01                 // min node size as fraction of total
  })
);

// Node appearance
series.nodes.rectangles.template.setAll({
  fillOpacity: 1,
  stroke: am5.color(0x000000),
  strokeWidth: 1,
  cornerRadiusTL: 4,
  cornerRadiusTR: 4,
  cornerRadiusBL: 4,
  cornerRadiusBR: 4
});

// Disable node dragging (optional)
series.nodes.nodes.template.setAll({
  draggable: false,
  toggleKey: "none"
});

// Link appearance
series.links.template.setAll({
  fillOpacity: 0.3,
  strokeOpacity: 0,
  tooltipText: "{sourceId} > {targetId}: {value}"
});

// Node labels
series.nodes.labels.template.setAll({
  text: "{name}",
  fontSize: 12,
  fill: am5.color(0x000000)
});

// Node tooltip
series.nodes.nodes.template.set("tooltipText", "{name}: {sumIncoming} in / {sumOutgoing} out");

// Data — LAST
series.data.setAll(data);
series.appear(1000);
```

### Sankey key settings

| Setting | Type | Description |
|---------|------|-------------|
| `sourceIdField` | string | Data field for source node ID (required) |
| `targetIdField` | string | Data field for target node ID (required) |
| `valueField` | string | Data field for link value (required) |
| `orientation` | `"horizontal" \| "vertical"` | Flow direction |
| `nodeAlign` | `"left" \| "right" \| "center" \| "justify"` | Node alignment |
| `nodeWidth` | number | Width of nodes in pixels (default: 10) |
| `nodePadding` | number | Gap between nodes (default: 10) |
| `linkSort` | function \| null | Custom link sort, `null` for no sorting |

## Chord diagram

```js
const series = root.container.children.push(
  am5flow.Chord.new(root, {
    sourceIdField: "from",
    targetIdField: "to",
    valueField: "value",
    nodeWidth: 20,
    padAngle: 2,              // gap between nodes in degrees
    radius: am5.percent(90),
    startAngle: 80,
    sort: "ascending"         // "ascending" | "descending" | "none"
  })
);

// Node appearance (slices on the ring)
series.nodes.rectangles.template.setAll({
  fillOpacity: 0.8,
  stroke: am5.color(0xffffff),
  strokeWidth: 2
});

// Link appearance
series.links.template.setAll({
  fillOpacity: 0.3,
  tooltipText: "{sourceId} > {targetId}: {value}"
});

series.data.setAll(data);
```

### ChordDirected (with arrows)

```js
const series = root.container.children.push(
  am5flow.ChordDirected.new(root, {
    sourceIdField: "from",
    targetIdField: "to",
    valueField: "value"
  })
);
```

### ChordNonRibbon (thin lines)

```js
const series = root.container.children.push(
  am5flow.ChordNonRibbon.new(root, {
    sourceIdField: "from",
    targetIdField: "to",
    valueField: "value"
  })
);

// Line appearance
series.links.template.setAll({
  strokeOpacity: 0.5,
  fillOpacity: 0,
  strokeWidth: 2
});
```

## Arc diagram

```js
const series = root.container.children.push(
  am5flow.ArcDiagram.new(root, {
    sourceIdField: "from",
    targetIdField: "to",
    valueField: "value",
    orientation: "horizontal"
  })
);

series.links.template.setAll({
  strokeOpacity: 0.3,
  fillOpacity: 0,
  strokeWidth: 1
});

series.data.setAll(data);
```

## Custom node data and colors

```js
// Define explicit node data with colors and custom names
series.nodes.data.setAll([
  { id: "A", name: "Source A", fill: am5.color(0x095256) },
  { id: "B", name: "Target B", fill: am5.color(0x087f8c) },
  { id: "C", name: "Output C", fill: am5.color(0x5aaa95) }
]);

// Apply node colors from data
series.nodes.rectangles.template.adapters.add("fill", function(fill, target) {
  var dataItem = target.dataItem;
  if (dataItem && dataItem.dataContext && dataItem.dataContext.fill) {
    return dataItem.dataContext.fill;
  }
  return fill;
});

// Node labels use the "name" field by default
series.nodes.labels.template.setAll({
  text: "{name}"
});
```

## Multi-level Sankey (3+ levels)

```js
// Data with 3 levels: Source > Category > Destination
var data = [
  { from: "Solar", to: "Renewable", value: 30 },
  { from: "Wind", to: "Renewable", value: 25 },
  { from: "Coal", to: "Fossil", value: 40 },
  { from: "Gas", to: "Fossil", value: 35 },
  { from: "Renewable", to: "Residential", value: 20 },
  { from: "Renewable", to: "Commercial", value: 35 },
  { from: "Fossil", to: "Residential", value: 30 },
  { from: "Fossil", to: "Industrial", value: 45 }
];
```

## Events on flow elements

```js
// Node click
series.nodes.nodes.template.events.on("click", function(ev) {
  console.log("Node:", ev.target.dataItem.get("id"));
});

// Link click
series.links.template.events.on("click", function(ev) {
  console.log("Link:", ev.target.dataItem.dataContext);
});
```

## Animated bullets along links

Animated labels/circles that flow along Sankey or Chord links use `series.bullets.push()` — **NOT** `series.links.template.bullets.push()`. The bullet position (0 = source, 1 = target) is animated in a loop, and an adapter fades opacity based on position.

**Important:** Sankey uses `locationX`, Chord uses `locationY`.

```js
series.bullets.push(function(root, series, dataItem) {
  var label = am5.Label.new(root, {
    text: "${value}B",
    populateText: true,
    centerX: am5.p50,
    fill: am5.color(0xffffff),
    fontSize: 11
  });

  var bullet = am5.Bullet.new(root, {
    locationX: 0,
    sprite: label,
    autoRotate: true   // orient along link direction
  });

  // Animate position along the link: 0 > 1, looping forever
  bullet.animate({
    key: "locationX",
    from: 0,
    to: 1,
    duration: Math.random() * 10000 + 2000,
    loops: Infinity
  });

  // Fade in at center, fade out at edges via adapter
  label.adapters.add("opacity", function(opacity) {
    return 0.5 - Math.abs(0.5 - bullet.get("locationX"));
  });

  // Drive the adapter on every position change
  bullet.on("locationX", function() {
    label.set("opacity", label.get("opacity"));
  });

  return bullet;
});
```

**For Chord diagrams**, replace every `locationX` with `locationY`:

```js
var bullet = am5.Bullet.new(root, {
  locationY: 0,
  sprite: label,
  autoRotate: true
});

bullet.animate({
  key: "locationY",
  from: 0, to: 1,
  duration: Math.random() * 10000 + 2000,
  loops: Infinity
});

label.adapters.add("opacity", function(opacity) {
  return 0.5 - Math.abs(0.5 - bullet.get("locationY"));
});

bullet.on("locationY", function() {
  label.set("opacity", label.get("opacity"));
});
```

**Key points:**
- Use `series.bullets.push()` — bullets belong to the series, not to `series.links.template`
- **Sankey > `locationX`**, **Chord > `locationY`** (using the wrong one means bullets won't animate)
- `autoRotate: true` makes the label follow the link curve
- Random duration per bullet creates natural asynchronous flow
- The opacity adapter formula `0.5 - Math.abs(0.5 - location)` gives a bell curve: invisible at edges, max at center
- `bullet.on("locationX"/"locationY", ...)` is needed to trigger the adapter as position changes

## Disposal

```js
root.dispose();
```


---

# amCharts 5 Flow Charts — Working Examples

## Example 1: Sankey diagram

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sankey Diagram</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/flow.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var series = root.container.children.push(am5flow.Sankey.new(root, {
      sourceIdField: "from",
      targetIdField: "to",
      valueField: "value",
      nodeAlign: "justify",
      nodeWidth: 12,
      nodePadding: 15
    }));

    series.nodes.rectangles.template.setAll({
      fillOpacity: 1,
      stroke: am5.color(0xffffff),
      strokeWidth: 1,
      cornerRadiusTL: 2, cornerRadiusTR: 2,
      cornerRadiusBL: 2, cornerRadiusBR: 2
    });

    series.links.template.setAll({
      fillOpacity: 0.3,
      tooltipText: "{sourceId} > {targetId}\n[bold]{value}[/]"
    });

    series.nodes.labels.template.setAll({
      fontSize: 13,
      fill: am5.color(0x333333)
    });

    series.data.setAll([
      { from: "Website", to: "Sign Up", value: 5000 },
      { from: "Website", to: "Bounce", value: 3000 },
      { from: "Social Media", to: "Sign Up", value: 2000 },
      { from: "Social Media", to: "Bounce", value: 1500 },
      { from: "Email", to: "Sign Up", value: 1000 },
      { from: "Sign Up", to: "Free Trial", value: 4800 },
      { from: "Sign Up", to: "Abandoned", value: 3200 },
      { from: "Free Trial", to: "Paid", value: 2400 },
      { from: "Free Trial", to: "Cancelled", value: 2400 }
    ]);

    series.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 2: Chord diagram

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Chord Diagram</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/flow.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 600px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var series = root.container.children.push(am5flow.Chord.new(root, {
      sourceIdField: "from",
      targetIdField: "to",
      valueField: "value",
      nodeWidth: 15,
      padAngle: 3
    }));

    series.nodes.rectangles.template.setAll({
      fillOpacity: 0.9,
      stroke: am5.color(0xffffff),
      strokeWidth: 2
    });

    series.links.template.setAll({
      fillOpacity: 0.2,
      tooltipText: "{sourceId} ↔ {targetId}: {value}"
    });

    series.nodes.labels.template.setAll({
      textType: "radial",
      fontSize: 13
    });

    series.data.setAll([
      { from: "US", to: "China", value: 120 },
      { from: "US", to: "EU", value: 200 },
      { from: "US", to: "Japan", value: 80 },
      { from: "China", to: "EU", value: 150 },
      { from: "China", to: "Japan", value: 90 },
      { from: "EU", to: "Japan", value: 60 },
      { from: "US", to: "India", value: 70 },
      { from: "China", to: "India", value: 110 },
      { from: "EU", to: "India", value: 40 }
    ]);

    series.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 3: Vertical Sankey

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vertical Sankey</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/flow.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 600px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var series = root.container.children.push(am5flow.Sankey.new(root, {
      sourceIdField: "from",
      targetIdField: "to",
      valueField: "value",
      orientation: "vertical",
      nodeAlign: "center",
      nodeWidth: 8,
      nodePadding: 20
    }));

    series.nodes.rectangles.template.setAll({
      fillOpacity: 1, strokeOpacity: 0
    });

    series.links.template.setAll({
      fillOpacity: 0.25,
      tooltipText: "{sourceId} > {targetId}: {value}"
    });

    series.data.setAll([
      { from: "Total Budget", to: "Marketing", value: 300 },
      { from: "Total Budget", to: "Engineering", value: 500 },
      { from: "Total Budget", to: "Operations", value: 200 },
      { from: "Marketing", to: "Digital Ads", value: 150 },
      { from: "Marketing", to: "Content", value: 100 },
      { from: "Marketing", to: "Events", value: 50 },
      { from: "Engineering", to: "Frontend", value: 200 },
      { from: "Engineering", to: "Backend", value: 200 },
      { from: "Engineering", to: "Infra", value: 100 }
    ]);

    series.appear(1000, 100);
  </script>
</body>
</html>
```
