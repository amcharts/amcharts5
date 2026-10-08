# Venn Diagram

Docs: https://www.amcharts.com/docs/v5/charts/venn/

Venn diagrams show overlapping relationships between sets. There is NO `VennDiagram` chart class — `am5venn.Venn` is both the series and the visual container, pushed directly into `root.container.children` (or any `Container`).

## Imports

### ES modules / TypeScript
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5venn from "@amcharts/amcharts5/venn";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN / script tags
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/venn.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Setup

**IMPORTANT:** There is no `am5venn.VennDiagram` class. The `am5venn.Venn` object IS the chart — push it directly into a container.

```js
const root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

// Create a wrapper container (optional, useful for adding legend)
const container = root.container.children.push(am5.Container.new(root, {
  width: am5.p100,
  height: am5.p100,
  layout: root.verticalLayout
}));

// Venn is pushed directly into the container — NOT into chart.series
const series = container.children.push(
  am5venn.Venn.new(root, {
    categoryField: "name",
    valueField: "value",
    intersectionsField: "sets",   // field that holds parent set names
  })
);
```

## Data structure

Venn data contains two types of entries:

### 1. Sets (circles)

Each set defines a circle. `value` controls the circle's area.

```js
{ name: "Set A", value: 100 }
```

### 2. Intersections (overlaps)

Intersections reference their parent sets by name via the `sets` array. `value` controls the overlap area.

```js
{ name: "A ∩ B", value: 30, sets: ["Set A", "Set B"] }
```

### Complete example data

```js
series.data.setAll([
  // Individual sets (circles)
  { name: "Set A", value: 100 },
  { name: "Set B", value: 80 },
  { name: "Set C", value: 60 },

  // Two-set intersections
  { name: "A ∩ B", value: 30, sets: ["Set A", "Set B"] },
  { name: "B ∩ C", value: 20, sets: ["Set B", "Set C"] },
  { name: "A ∩ C", value: 15, sets: ["Set A", "Set C"] },

  // Three-set intersection
  { name: "A ∩ B ∩ C", value: 10, sets: ["Set A", "Set B", "Set C"] }
]);
```

**Important:** The `sets` array values must exactly match the `name` field of the parent sets.

## Customizing appearance

### Slices (circles)

```js
series.slices.template.setAll({
  fillOpacity: 0.6,
  strokeWidth: 2,
  stroke: am5.color(0xffffff),
  tooltipText: "{category}: {value}"
});

// Hover state
series.slices.template.states.create("hover", {
  fillOpacity: 0.8,
  scale: 1.02
});
```

### Labels

```js
series.labels.template.setAll({
  text: "{category}",
  fontSize: 16,
  fill: am5.color(0x000000),
  textAlign: "center",
  oversizedBehavior: "truncate"   // "truncate" | "wrap" | "none"
});
```

### Custom colors

```js
// Per-set colors from data
series.data.setAll([
  { name: "Frontend", value: 100, fill: am5.color(0x264653) },
  { name: "Backend", value: 80, fill: am5.color(0x2a9d8f) },
  // ...
]);

// Use fillField to map colors from data
am5venn.Venn.new(root, {
  categoryField: "name",
  valueField: "value",
  intersectionsField: "sets",
  fillField: "fill"
})
```

### Hide labels on intersections

```js
series.labels.template.adapters.add("text", function(text, target) {
  if (target.dataItem && target.dataItem.dataContext.sets) {
    return "";  // hide label on intersections
  }
  return text;
});
```

## Click events

```js
series.slices.template.events.on("click", function(ev) {
  var dataItem = ev.target.dataItem;
  console.log("Clicked:", dataItem.get("category"));
});
```

## Legend

```js
// Add legend to the same container as the Venn series
const legend = container.children.push(am5.Legend.new(root, {
  centerX: am5.percent(50),
  x: am5.percent(50),
  layout: root.horizontalLayout
}));

// Only show legend for main sets, not intersections
legend.data.setAll(series.dataItems.filter(function(di) {
  return !di.dataContext.sets;
}));
```

## Two-set Venn example

```js
series.data.setAll([
  { name: "Frontend", value: 300 },
  { name: "Backend", value: 250 },
  { name: "Frontend ∩ Backend", value: 80, sets: ["Frontend", "Backend"] }  // intersection — name must be unique
]);
```

## Notes on sizing and positioning

- Circle sizes are proportional to `value`
- Intersection overlap is **approximate** — amCharts positions circles to visually suggest the declared intersection values, but exact area-proportional overlap is not guaranteed
- For best results, keep intersection values smaller than either parent set value
- Very small intersections relative to set sizes may not be visible

---

## Example: Technology skills Venn diagram

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Venn Diagram</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/venn.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    #chartdiv { width: 100%; height: 500px; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var container = root.container.children.push(am5.Container.new(root, {
      width: am5.p100,
      height: am5.p100,
      layout: root.verticalLayout
    }));

    var series = container.children.push(
      am5venn.Venn.new(root, {
        categoryField: "name",
        valueField: "value",
        intersectionsField: "sets"
      })
    );

    // Slice styling
    series.slices.template.setAll({
      fillOpacity: 0.6,
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
      tooltipText: "{category}: {value}"
    });

    series.slices.template.states.create("hover", {
      fillOpacity: 0.8
    });

    // Label styling
    series.labels.template.setAll({
      text: "{category}",
      fontSize: 14,
      fill: am5.color(0x000000)
    });

    // Data
    series.data.setAll([
      { name: "Frontend", value: 120 },
      { name: "Backend", value: 100 },
      { name: "DevOps", value: 70 },
      { name: "Frontend ∩ Backend", value: 40, sets: ["Frontend", "Backend"] },
      { name: "Backend ∩ DevOps", value: 25, sets: ["Backend", "DevOps"] },
      { name: "Frontend ∩ DevOps", value: 15, sets: ["Frontend", "DevOps"] },
      { name: "Full Stack", value: 10, sets: ["Frontend", "Backend", "DevOps"] }
    ]);

    // Legend — only main sets
    var legend = container.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50)
    }));
    legend.data.setAll(series.dataItems.filter(function(di) {
      return !di.dataContext.sets;
    }));

    series.appear(1000);
    // Note: no chart.appear() needed — Venn is not a chart, just a series
  </script>
</body>
</html>
```

## Example 2: Two-set Venn with custom colors and click handler

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Two-Set Venn</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/venn.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    #chartdiv { width: 100%; height: 500px; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var container = root.container.children.push(am5.Container.new(root, {
      width: am5.p100,
      height: am5.p100,
      layout: root.verticalLayout
    }));

    var series = container.children.push(
      am5venn.Venn.new(root, {
        categoryField: "name",
        valueField: "value",
        intersectionsField: "sets",
        fillField: "fill"
      })
    );

    // Styling
    series.slices.template.setAll({
      fillOpacity: 0.65,
      strokeWidth: 3,
      stroke: am5.color(0xffffff),
      tooltipText: "{category}: {value}"
    });

    series.slices.template.states.create("hover", {
      fillOpacity: 0.85,
      scale: 1.03
    });

    series.labels.template.setAll({
      text: "{category}\n[bold]{value}[/]",
      fontSize: 15,
      fill: am5.color(0xffffff),
      textAlign: "center"
    });

    // Hide labels on intersection
    series.labels.template.adapters.add("text", function(text, target) {
      if (target.dataItem && target.dataItem.dataContext.sets) {
        return "[bold]{value}[/]";
      }
      return text;
    });

    // Click handler
    series.slices.template.events.on("click", function(ev) {
      var di = ev.target.dataItem;
      alert(di.get("category") + ": " + di.get("value"));
    });

    // Data
    series.data.setAll([
      { name: "Mobile Users", value: 450, fill: am5.color(0x2196f3) },
      { name: "Desktop Users", value: 380, fill: am5.color(0x4caf50) },
      { name: "Both Platforms", value: 120, sets: ["Mobile Users", "Desktop Users"], fill: am5.color(0x9c27b0) }
    ]);

    // Legend — main sets only
    var legend = container.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50),
      y: am5.percent(95),
      centerY: am5.percent(100)
    }));
    legend.data.setAll(series.dataItems.filter(function(di) {
      return !di.dataContext.sets;
    }));

    series.appear(1000);
    // Note: no chart.appear() needed — Venn is not a chart, just a series
  </script>
</body>
</html>
```
