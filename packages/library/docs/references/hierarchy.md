# Hierarchy Charts — Treemap, Sunburst, Force-Directed


## Required imports

### ES modules
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/hierarchy.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Data structure (shared by all hierarchy types)

```js
var data = [{
  name: "Root",
  children: [{
    name: "Category A",
    children: [
      { name: "Item A1", value: 100 },
      { name: "Item A2", value: 80 }
    ]
  }, {
    name: "Category B",
    children: [
      { name: "Item B1", value: 60 },
      { name: "Item B2", value: 40 }
    ]
  }]
}];

// Set on series:
series.data.setAll(data);
```

## Series types

| Class | Use for | Module |
|-------|---------|--------|
| `am5hierarchy.Treemap` | Nested rectangles showing proportions | hierarchy |
| `am5hierarchy.ForceDirected` | Force-directed bubble/node graph | hierarchy |
| `am5hierarchy.Sunburst` | Concentric ring chart (hierarchical pie) | hierarchy |
| `am5hierarchy.Pack` | Packed circles (bubble chart) | hierarchy |
| `am5hierarchy.Partition` | Rectangular partition layout | hierarchy |
| `am5hierarchy.Tree` | Traditional tree layout (org charts) | hierarchy |
| `am5hierarchy.VoronoiTreemap` | Voronoi-based treemap | hierarchy |

## Treemap

```js
const root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

const container = root.container.children.push(am5.Container.new(root, {
  width: am5.percent(100),
  height: am5.percent(100),
  layout: root.verticalLayout
}));

const series = container.children.push(am5hierarchy.Treemap.new(root, {
  valueField: "value",
  categoryField: "name",
  childDataField: "children",
  initialDepth: 2,           // how many levels visible initially
  topDepth: 1,               // hide root node (start from first children)
  layoutAlgorithm: "squarify",  // "squarify" | "binary" | "slice" | "dice" | "sliceDice"
  nodePaddingOuter: 4,
  nodePaddingInner: 4
}));

// Configure rectangle appearance
series.rectangles.template.setAll({
  strokeWidth: 2,
  stroke: am5.color(0xffffff),
  cornerRadiusTL: 4,
  cornerRadiusTR: 4,
  cornerRadiusBL: 4,
  cornerRadiusBR: 4
});

// Tooltip
series.nodes.template.set("tooltipText", "{category}: [bold]{sum}[/]");

// Labels
series.labels.template.setAll({
  text: "{category}",
  fontSize: 14
});

series.data.setAll(data);
series.appear(1000);
```

## Force-Directed Tree

```js
const series = container.children.push(am5hierarchy.ForceDirected.new(root, {
  valueField: "value",
  categoryField: "name",
  childDataField: "children",
  idField: "name",               // for cross-linking
  linkWithField: "linkWith",     // optional: cross-link nodes
  minRadius: 20,
  maxRadius: 80,
  initialFrames: 200,            // frames of physics simulation
  centerStrength: 0.5,
  manyBodyStrength: -15,
  topDepth: 1
}));

// Circle appearance
series.circles.template.setAll({
  fillOpacity: 0.8,
  strokeWidth: 2,
  stroke: am5.color(0xffffff)
});

// Labels
series.labels.template.setAll({
  text: "{category}",
  fill: am5.color(0xffffff),
  fontSize: 12
});

// Links between nodes
series.links.template.setAll({
  strokeWidth: 1,
  strokeOpacity: 0.5
});

// Outer circles (parent nodes indicator)
series.outerCircles.template.setAll({
  strokeWidth: 2,
  strokeDasharray: [4, 4]
});

series.data.setAll(data);
```

## Sunburst

```js
const series = container.children.push(am5hierarchy.Sunburst.new(root, {
  valueField: "value",
  categoryField: "name",
  childDataField: "children",
  radius: am5.percent(95),
  innerRadius: am5.percent(20),   // hole in center
  // startAngle: -90,              // default: -90
  // endAngle: 270                 // default: 270 (full circle)
}));

series.nodes.template.set("tooltipText", "{category}: [bold]{sum}[/]");
series.labels.template.set("forceHidden", true);  // hide labels if crowded

series.data.setAll(data);
```

## Pack (Packed Circles)

```js
const series = container.children.push(am5hierarchy.Pack.new(root, {
  valueField: "value",
  categoryField: "name",
  childDataField: "children",
  nodePadding: 5
}));

series.circles.template.setAll({
  fillOpacity: 0.7,
  strokeWidth: 2,
  stroke: am5.color(0xffffff)
});

series.data.setAll(data);
```

## Tree

```js
const series = container.children.push(am5hierarchy.Tree.new(root, {
  valueField: "value",
  categoryField: "name",
  childDataField: "children",
  orientation: "horizontal",   // "horizontal" | "vertical"
  topDepth: 0
}));

series.circles.template.setAll({
  radius: 15,
  fillOpacity: 0.9
});

series.links.template.setAll({
  strokeWidth: 2,
  strokeOpacity: 0.5
});

series.labels.template.setAll({
  text: "{category}",
  fontSize: 12
});

series.data.setAll(data);
```

## Partition

```js
const series = container.children.push(am5hierarchy.Partition.new(root, {
  valueField: "value",
  categoryField: "name",
  childDataField: "children",
  orientation: "horizontal",   // "horizontal" | "vertical"
  initialDepth: 3
}));

series.rectangles.template.setAll({
  strokeWidth: 1,
  stroke: am5.color(0xffffff)
});

series.data.setAll(data);
```

## VoronoiTreemap

**Note:** VoronoiTreemap has NO `.rectangles` property. Unlike `Treemap` (which has `series.rectangles.template`), VoronoiTreemap renders organic polygon cells. Style via `series.nodes.template` and its children.

```js
const series = container.children.push(am5hierarchy.VoronoiTreemap.new(root, {
  valueField: "value",
  categoryField: "name",
  childDataField: "children",
  initialDepth: 2,
  topDepth: 1
}));

series.data.setAll(data);
```

## Flat data with parentField (database-friendly)

Instead of nested `children` arrays, use flat data with `id` and `parentId` fields:

```js
const series = container.children.push(am5hierarchy.Treemap.new(root, {
  valueField: "value",
  categoryField: "name",
  childDataField: "children",  // still required
  parentIdField: "parentId",   // enables flat data
  idField: "id"
}));

// Flat data (e.g., from a database query)
series.data.setAll([
  { id: "root", name: "Root", children: [] },
  { id: "a", name: "Group A", parentId: "root", children: [] },
  { id: "b", name: "Group B", parentId: "root", children: [] },
  { id: "a1", name: "Item A1", parentId: "a", value: 100 },
  { id: "a2", name: "Item A2", parentId: "a", value: 60 },
  { id: "b1", name: "Item B1", parentId: "b", value: 80 }
]);
```

## Common configuration

### Node colors
```js
// From color set (automatic)
series.get("colors").set("colors", [
  am5.color(0x095256), am5.color(0x087f8c),
  am5.color(0x5aaa95), am5.color(0x86a873)
]);

// Per-node via data + templateField
// { name: "A", value: 100, nodeSettings: { fill: am5.color(0xff0000) } }
// series.nodes.template.set("templateField", "nodeSettings");
```

### Drill-down (built-in for Treemap, Sunburst)
Clicking a node zooms into its children. Configure with:
```js
series.set("topDepth", 1);       // hide root
series.set("initialDepth", 2);   // initial visible depth
series.set("downDepth", 1);      // how many levels to reveal on drill-down
```

### Breadcrumbs (for navigation)

amCharts 5 provides a built-in `BreadcrumbBar` component for hierarchy navigation:

```js
const breadcrumbs = container.children.push(am5hierarchy.BreadcrumbBar.new(root, {
  series: series
}));
```

### Events on hierarchy nodes

```js
// Node click
series.nodes.template.events.on("click", function(ev) {
  var data = ev.target.dataItem.dataContext;
  console.log("Clicked:", data.name);
});

// Data validated (after render)
series.events.on("datavalidated", function() {
  console.log("Hierarchy rendered");
});
```

## Disposal

```js
root.dispose();
```


---

# amCharts 5 Hierarchy Charts — Working Examples

## Example 1: Treemap

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Treemap</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/hierarchy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var container = root.container.children.push(am5.Container.new(root, {
      width: am5.percent(100),
      height: am5.percent(100),
      layout: root.verticalLayout
    }));

    var series = container.children.push(am5hierarchy.Treemap.new(root, {
      valueField: "value",
      categoryField: "name",
      childDataField: "children",
      initialDepth: 2,
      topDepth: 1,
      layoutAlgorithm: "squarify",
      nodePaddingOuter: 4,
      nodePaddingInner: 2
    }));

    series.rectangles.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
      cornerRadiusTL: 3, cornerRadiusTR: 3,
      cornerRadiusBL: 3, cornerRadiusBR: 3
    });

    series.nodes.template.set("tooltipText", "{category}: {sum}");
    series.labels.template.setAll({ text: "{category}", fontSize: 13 });

    series.data.setAll([{
      name: "Root",
      children: [{
        name: "Technology",
        children: [
          { name: "Smartphones", value: 500 },
          { name: "Laptops", value: 380 },
          { name: "Tablets", value: 220 },
          { name: "Wearables", value: 150 }
        ]
      }, {
        name: "Media",
        children: [
          { name: "Streaming", value: 350 },
          { name: "Gaming", value: 280 },
          { name: "Music", value: 180 },
          { name: "News", value: 90 }
        ]
      }, {
        name: "Finance",
        children: [
          { name: "Banking", value: 300 },
          { name: "Insurance", value: 200 },
          { name: "Investing", value: 250 }
        ]
      }]
    }]);

    series.appear(1000);
  </script>
</body>
</html>
```

## Example 2: Force-directed tree

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Force-Directed Tree</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/hierarchy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 600px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var container = root.container.children.push(am5.Container.new(root, {
      width: am5.percent(100),
      height: am5.percent(100),
      layout: root.verticalLayout
    }));

    var series = container.children.push(am5hierarchy.ForceDirected.new(root, {
      valueField: "value",
      categoryField: "name",
      childDataField: "children",
      minRadius: 15,
      maxRadius: 60,
      initialFrames: 200,
      topDepth: 1,
      centerStrength: 0.3,
      manyBodyStrength: -10
    }));

    series.circles.template.setAll({
      fillOpacity: 0.85,
      strokeWidth: 2,
      stroke: am5.color(0xffffff)
    });

    series.labels.template.setAll({
      text: "{category}",
      fill: am5.color(0xffffff),
      fontSize: 11,
      oversizedBehavior: "truncate",
      maxWidth: 80
    });

    series.outerCircles.template.setAll({
      strokeDasharray: [3, 3],
      strokeOpacity: 0.3
    });

    series.nodes.template.set("tooltipText", "{category}: {value}");

    series.data.setAll([{
      name: "Team", value: 0,
      children: [{
        name: "Engineering", value: 0,
        children: [
          { name: "Frontend", value: 8 },
          { name: "Backend", value: 12 },
          { name: "DevOps", value: 5 },
          { name: "QA", value: 4 }
        ]
      }, {
        name: "Product", value: 0,
        children: [
          { name: "Design", value: 6 },
          { name: "Research", value: 3 },
          { name: "PM", value: 4 }
        ]
      }, {
        name: "Business", value: 0,
        children: [
          { name: "Sales", value: 10 },
          { name: "Marketing", value: 7 },
          { name: "Support", value: 8 }
        ]
      }]
    }]);

    series.appear(1000);
  </script>
</body>
</html>
```

## Example 3: Sunburst chart

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sunburst</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/hierarchy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 600px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var container = root.container.children.push(am5.Container.new(root, {
      width: am5.percent(100),
      height: am5.percent(100)
    }));

    var series = container.children.push(am5hierarchy.Sunburst.new(root, {
      valueField: "value",
      categoryField: "name",
      childDataField: "children",
      radius: am5.percent(95),
      innerRadius: am5.percent(15)
    }));

    series.nodes.template.set("tooltipText", "{category}: {sum}");
    series.labels.template.set("forceHidden", true);

    series.data.setAll([{
      name: "Revenue",
      children: [{
        name: "Products",
        children: [
          { name: "SaaS", value: 450 },
          { name: "On-Premise", value: 120 },
          { name: "Mobile", value: 200 }
        ]
      }, {
        name: "Services",
        children: [
          { name: "Consulting", value: 180 },
          { name: "Training", value: 80 },
          { name: "Support", value: 160 }
        ]
      }, {
        name: "Licensing",
        children: [
          { name: "Enterprise", value: 300 },
          { name: "SMB", value: 150 }
        ]
      }]
    }]);

    series.appear(1000);
  </script>
</body>
</html>
```
