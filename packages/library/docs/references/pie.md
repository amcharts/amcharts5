# Pie & Sliced Charts — Pie, Donut, Funnel, Pyramid


## Required imports

### ES modules
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/percent.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Pie / Donut chart setup

```js
const root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

const chart = root.container.children.push(
  am5percent.PieChart.new(root, {
    layout: root.verticalLayout,
    // Donut: set innerRadius
    // innerRadius: am5.percent(50)
  })
);

const series = chart.series.push(
  am5percent.PieSeries.new(root, {
    name: "Sales",
    valueField: "value",
    categoryField: "category"
  })
);

// Data — LAST
series.data.setAll([
  { category: "Phones", value: 501 },
  { category: "Tablets", value: 301 },
  { category: "Laptops", value: 201 }
]);

series.appear(1000);
chart.appear(1000, 100);
```

### PieChart key settings

| Setting | Type | Description |
|---------|------|-------------|
| `radius` | percent/number | Outer radius (default: `am5.percent(80)`) |
| `innerRadius` | percent/number | Inner hole for donut (default: 0). Percent is relative to radius |
| `startAngle` | number | Start angle in degrees (default: -90) |
| `endAngle` | number | End angle in degrees (default: 270) |

**Semi-circle pie:** `startAngle: 180, endAngle: 360` (set on BOTH PieChart AND PieSeries)

### PieSeries key settings

| Setting | Type | Description |
|---------|------|-------------|
| `valueField` | string | Data field for values (required) |
| `categoryField` | string | Data field for categories (required) |
| `alignLabels` | boolean | Align labels in column (default: true). Set false for radial/inside labels |
| `legendLabelText` | string | Legend label format, e.g. `"{category}"` |
| `legendValueText` | string | Legend value format, e.g. `"{value}"` |
| `startAngle` | number | Start angle in degrees (default: inherits from chart). Must match PieChart's startAngle for semi-circle |
| `endAngle` | number | End angle in degrees (default: inherits from chart). Must match PieChart's endAngle for semi-circle |

### Labels

```js
// Standard aligned labels (default)
series.labels.template.setAll({
  text: "{category}: {valuePercentTotal.formatNumber('0.0')}%",
  fontSize: 12
});

// Radial labels
series.set("alignLabels", false);
series.labels.template.setAll({
  textType: "radial",
  centerX: am5.percent(100),
  text: "{category}"
});

// Inside labels
series.labels.template.setAll({
  inside: true,
  radius: 10,
  text: "{valuePercentTotal.formatNumber('0')}%"
});

// Hide labels
series.labels.template.set("forceHidden", true);
series.ticks.template.set("forceHidden", true);
```

### Slice appearance

```js
series.slices.template.setAll({
  strokeWidth: 2,
  stroke: am5.color(0xffffff),
  cornerRadius: 5,
  tooltipText: "{category}: {valuePercentTotal.formatNumber('0.0')}% ({value})"
});

// Click to pull out slice
series.slices.template.set("toggleKey", "active");
series.slices.template.states.create("active", {
  shiftRadius: 20   // pixels to pull out
});
```

### Custom colors

```js
// Set colors per slice from data
series.slices.template.adapters.add("fill", function(fill, target) {
  return chart.get("colors").getIndex(series.slices.indexOf(target));
});

// Or in data:
// { category: "A", value: 100, sliceSettings: { fill: am5.color(0xff0000) } }
// series.slices.template.set("templateField", "sliceSettings");
```

## Funnel chart setup

```js
const chart = root.container.children.push(
  am5percent.SlicedChart.new(root, {
    layout: root.horizontalLayout
  })
);

const series = chart.series.push(
  am5percent.FunnelSeries.new(root, {
    name: "Funnel",
    valueField: "value",
    categoryField: "stage",
    orientation: "vertical",   // "vertical" or "horizontal"
    bottomRatio: 0,            // 0 = trapezoids (classic funnel), 1 = rectangles
    alignLabels: true
  })
);

series.data.setAll([
  { stage: "Prospects", value: 1000 },
  { stage: "Qualified", value: 600 },
  { stage: "Proposals", value: 300 },
  { stage: "Closed", value: 100 }
]);
```

### FunnelSeries key settings

| Setting | Type | Description |
|---------|------|-------------|
| `orientation` | `"vertical" \| "horizontal"` | Direction of the funnel (required) |
| `bottomRatio` | number (0–1) | 0 = trapezoids (classic funnel), 1 = rectangles (default) |
| `alignLabels` | boolean | Align labels in a column (default: true) |

### Slice links (connectors between funnel slices)

```js
series.links.template.setAll({
  fillOpacity: 0.5,
  height: 10    // gap between slices
});
```

## Pyramid chart setup

```js
const series = chart.series.push(
  am5percent.PyramidSeries.new(root, {
    name: "Pyramid",
    valueField: "value",
    categoryField: "level",
    orientation: "vertical",
    valueIs: "area",            // "area" (default) or "height"
    topWidth: am5.percent(0),   // tip width
    bottomWidth: am5.percent(100) // base width
  })
);
```

### PyramidSeries extra settings

| Setting | Type | Description |
|---------|------|-------------|
| `valueIs` | `"area" \| "height"` | How value maps to size (area is recommended) |
| `topWidth` | percent/number | Width of pyramid tip |
| `bottomWidth` | percent/number | Width of pyramid base |

## Pictorial Stacked chart setup

Pictorial charts use an SVG path as a mask to create shaped charts (e.g., human figure, bottle, battery). Uses `SlicedChart` (same as funnel/pyramid) with `PictorialStackedSeries`.

```js
// Use SlicedChart — same as funnel and pyramid
const chart = root.container.children.push(
  am5percent.SlicedChart.new(root, {
    layout: root.verticalLayout
  })
);

// SVG path that defines the shape (any SVG path string works)
const humanShape = "M53.5,476c0,14,6.833,21,20.5,21s20.5-7,20.5-21V287h21v189c0,14,6.834,21,20.5,21c13.667,0,20.5-7,20.5-21V154h10v116c0,7.334,2.5,12.667,7.5,16s10.167,3.333,15.5,0s8-8.667,8-16V145c0-13.334-4.5-23.667-13.5-31s-21.5-11-37.5-11h-82c-15.333,0-27.833,3.333-37.5,10s-14.5,17-14.5,31v133c0,6,2.667,10.333,8,13s10.5,2.667,15.5,0s7.5-7,7.5-13V154h10V476 M61.5,42.5c0,11.667,4.167,21.667,12.5,30S92.333,85,104,85s21.667-4.167,30-12.5S146.5,54,146.5,42c0-11.335-4.167-21.168-12.5-29.5C125.667,4.167,115.667,0,104,0S82.333,4.167,74,12.5S61.5,30.833,61.5,42.5z";

const series = chart.series.push(
  am5percent.PictorialStackedSeries.new(root, {
    name: "Survey",
    categoryField: "stage",
    valueField: "value",
    orientation: "vertical",     // "vertical" | "horizontal"
    svgPath: humanShape,         // SVG path string for the mask shape
    // startLocation: 0,         // 0–1, where fill starts
    // endLocation: 1,           // 0–1, where fill ends
  })
);

series.data.setAll([
  { stage: "Applied", value: 600 },
  { stage: "Phone Screen", value: 300 },
  { stage: "Interview", value: 150 },
  { stage: "Offer", value: 50 },
  { stage: "Hired", value: 30 }
]);
```

### Pictorial key settings

| Setting | Type | Description |
|---------|------|-------------|
| `svgPath` | string | SVG path string defining the mask shape (required) |
| `orientation` | `"vertical"` \| `"horizontal"` | Fill direction |
| `startLocation` | number (0–1) | Where the fill starts within the shape |
| `endLocation` | number (0–1) | Where the fill ends within the shape |
| `alignLabels` | boolean | Align labels outside the shape |

**Getting SVG paths:** Use any vector editor (Adobe Illustrator, Inkscape, Figma) to draw a shape and export as SVG, then extract the `d` attribute from the `<path>` element.

**Pictorial fraction chart:** Use `startLocation` and `endLocation` to show a percentage fill of a single shape (e.g., a battery at 75%):

```js
am5percent.PictorialStackedSeries.new(root, {
  svgPath: batteryPath,
  startLocation: 0,
  endLocation: 0.75,   // 75% filled
  // ...
})
```

## Legend (for all percent charts)

```js
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.percent(50),
  x: am5.percent(50),
  layout: root.horizontalLayout
}));
// IMPORTANT: Use series.dataItems, NOT chart.series.values
legend.data.setAll(series.dataItems);
```

**Custom legend labels:**
```js
am5percent.PieSeries.new(root, {
  legendLabelText: "[{fill}]{category}[/]",
  legendValueText: "[bold {fill}]{value}[/]",
  // ...
});
```

## Nested / Multi-level pie (concentric rings)

```js
// Outer ring
var outerSeries = chart.series.push(am5percent.PieSeries.new(root, {
  valueField: "value",
  categoryField: "category",
  radius: am5.percent(95),
  innerRadius: am5.percent(60)
}));

// Inner ring
var innerSeries = chart.series.push(am5percent.PieSeries.new(root, {
  valueField: "value",
  categoryField: "category",
  radius: am5.percent(55),
  innerRadius: am5.percent(20)
}));

outerSeries.data.setAll(outerData);
innerSeries.data.setAll(innerData);
```

## Data-driven slice colors (templateField)

```js
series.slices.template.set("templateField", "sliceSettings");

series.data.setAll([
  { category: "Critical", value: 40, sliceSettings: { fill: am5.color(0xff0000) } },
  { category: "Warning", value: 35, sliceSettings: { fill: am5.color(0xffa500) } },
  { category: "OK", value: 25, sliceSettings: { fill: am5.color(0x00cc00) } }
]);
```

## Events on slices

```js
series.slices.template.events.on("click", function(ev) {
  var data = ev.target.dataItem.dataContext;
  console.log("Clicked:", data.category, data.value);
});

series.slices.template.events.on("pointerover", function(ev) {
  ev.target.set("scale", 1.05);
});
series.slices.template.events.on("pointerout", function(ev) {
  ev.target.set("scale", 1);
});
```

## Disposal

```js
root.dispose();
```


---

# amCharts 5 Pie & Sliced Charts — Working Examples

## Example 1: Basic pie chart with legend

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pie Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/percent.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(
      am5percent.PieChart.new(root, { layout: root.verticalLayout })
    );

    var series = chart.series.push(am5percent.PieSeries.new(root, {
      name: "Market Share",
      valueField: "share",
      categoryField: "browser",
      legendLabelText: "{category}",
      legendValueText: "{valuePercentTotal.formatNumber('0.0')}%"
    }));

    series.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
      tooltipText: "{category}: {valuePercentTotal.formatNumber('0.0')}% ({value})"
    });

    series.labels.template.setAll({
      text: "{category}",
      fontSize: 12
    });

    // Legend — uses dataItems for percent charts
    var legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50),
      layout: root.horizontalLayout
    }));

    // Data LAST
    series.data.setAll([
      { browser: "Chrome", share: 65 },
      { browser: "Safari", share: 19 },
      { browser: "Firefox", share: 4 },
      { browser: "Edge", share: 5 },
      { browser: "Other", share: 7 }
    ]);

    // Populate legend AFTER data is set (dataItems are empty before data.setAll)
    legend.data.setAll(series.dataItems);

    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 2: Donut chart with center label

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Donut Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/percent.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5percent.PieChart.new(root, {
      layout: root.verticalLayout,
      innerRadius: am5.percent(50)
    }));

    var series = chart.series.push(am5percent.PieSeries.new(root, {
      valueField: "value",
      categoryField: "category"
    }));

    // Hide labels and ticks for clean donut
    series.labels.template.set("forceHidden", true);
    series.ticks.template.set("forceHidden", true);

    // Center label inside the donut hole
    series.children.push(am5.Label.new(root, {
      text: "Total\n$1.2M",
      fontSize: 20,
      centerX: am5.percent(50),
      centerY: am5.percent(50),
      textAlign: "center",
      populateText: true
    }));

    series.data.setAll([
      { category: "Q1", value: 300000 },
      { category: "Q2", value: 350000 },
      { category: "Q3", value: 280000 },
      { category: "Q4", value: 270000 }
    ]);

    var legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50)
    }));
    series.events.on("datavalidated", function() {
      legend.data.setAll(series.dataItems);
    });

    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 3: Semi-circle pie

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Semi-Circle Pie</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/percent.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 400px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5percent.PieChart.new(root, {
      startAngle: 180,
      endAngle: 360,
      layout: root.verticalLayout,
      innerRadius: am5.percent(50)
    }));

    var series = chart.series.push(am5percent.PieSeries.new(root, {
      valueField: "value",
      categoryField: "category",
      alignLabels: false,
      startAngle: 180,
      endAngle: 360
    }));

    series.labels.template.setAll({
      textType: "circular",
      inside: true,
      radius: 10
    });

    series.data.setAll([
      { category: "Low", value: 30 },
      { category: "Medium", value: 45 },
      { category: "High", value: 25 }
    ]);

    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 4: Funnel chart

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Funnel Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/percent.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(
      am5percent.SlicedChart.new(root, { layout: root.verticalLayout })
    );

    var series = chart.series.push(am5percent.FunnelSeries.new(root, {
      name: "Sales Funnel",
      valueField: "value",
      categoryField: "stage",
      orientation: "vertical",
      bottomRatio: 0,
      alignLabels: true
    }));

    series.slices.template.setAll({
      tooltipText: "{category}: {value} ({valuePercentTotal.formatNumber('0.0')}%)"
    });

    series.links.template.setAll({
      fillOpacity: 0.3,
      height: 5
    });

    series.labels.template.setAll({
      text: "{category}: {value}",
      fontSize: 14
    });

    series.data.setAll([
      { stage: "Website Visits", value: 10000 },
      { stage: "Sign Ups", value: 5200 },
      { stage: "Free Trial", value: 2800 },
      { stage: "Paid Plan", value: 1400 },
      { stage: "Enterprise", value: 300 }
    ]);

    // Legend
    var legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50)
    }));
    series.events.on("datavalidated", function() {
      legend.data.setAll(series.dataItems);
    });

    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 5: Pyramid chart

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pyramid Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/percent.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(
      am5percent.SlicedChart.new(root, { layout: root.horizontalLayout })
    );

    var series = chart.series.push(am5percent.PyramidSeries.new(root, {
      name: "Needs",
      valueField: "value",
      categoryField: "level",
      orientation: "vertical",
      valueIs: "area",
      topWidth: am5.percent(0),
      bottomWidth: am5.percent(100),
      alignLabels: true
    }));

    series.labels.template.setAll({
      text: "{category}",
      fontSize: 14
    });

    series.data.setAll([
      { level: "Self-Actualization", value: 10 },
      { level: "Esteem", value: 20 },
      { level: "Love / Belonging", value: 30 },
      { level: "Safety", value: 40 },
      { level: "Physiological", value: 50 }
    ]);

    var legend = chart.children.push(am5.Legend.new(root, {
      centerY: am5.percent(50),
      y: am5.percent(50),
      layout: root.verticalLayout
    }));
    series.events.on("datavalidated", function() {
      legend.data.setAll(series.dataItems);
    });

    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```
