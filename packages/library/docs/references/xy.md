# XY Charts — Line, Area, Bar, Column, Candlestick, Scatter


## Required imports

### ES modules / TypeScript
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN / script tags
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Core setup pattern

Every XY chart follows this structure:

```js
// 1. Root
const root = am5.Root.new("chartdiv");

// 2. Theme
root.setThemes([am5themes_Animated.new(root)]);

// 3. Chart
const chart = root.container.children.push(
  am5xy.XYChart.new(root, { layout: root.verticalLayout })
);

// 4. Axes (X + Y)
const xAxis = chart.xAxes.push(/* axis */);
const yAxis = chart.yAxes.push(/* axis */);

// 5. Series
const series = chart.series.push(/* series */);

// 6. Optional: cursor, scrollbar, legend

// 7. Data — ALWAYS LAST
series.data.setAll(data);

// 8. Animate in
series.appear(1000);
chart.appear(1000, 100);
```

## Axis types

| Axis class | Use when | Data field prefix | Needs own data? |
|-----------|----------|-------------------|-----------------|
| `am5xy.CategoryAxis` | Discrete categories (product names, months) | `category` | **Yes** — `xAxis.data.setAll()` |
| `am5xy.DateAxis` | Time-based data | `value` (timestamps) | No |
| `am5xy.ValueAxis` | Numeric values | `value` | No |
| `am5xy.DurationAxis` | Duration values | `value` | No |
| `am5xy.GaplessDateAxis` | Time data without gaps | `value` (timestamps) | No |

## Series types

| Series class | Use for |
|-------------|---------|
| `am5xy.LineSeries` | Line and area charts |
| `am5xy.ColumnSeries` | Vertical columns or horizontal bars |
| `am5xy.StepLineSeries` | Step/staircase lines |
| `am5xy.CandlestickSeries` | Financial candlesticks |
| `am5xy.OHLCSeries` | Financial OHLC |
| `am5xy.SmoothedXLineSeries` | Smoothed/curved lines (X smooth) |
| `am5xy.SmoothedXYLineSeries` | Smoothed lines (XY smooth) |

## Data field naming convention

The field name combines the **value type** + **axis direction**:

- Category axis on X > `categoryXField: "category"`
- Value axis on Y > `valueYField: "value"`
- Date axis on X > `valueXField: "date"` (dates are numeric timestamps)
- Open/high/low/close > `openValueYField`, `highValueYField`, `lowValueYField`, `valueYField`

**There is NO `dateXField` in v5** (a common wrong guess carried over from v4). A `DateAxis` series reads its date from `valueXField`, pointing at a numeric timestamp (`new Date(...).getTime()`).

## Common additions

### Cursor
```js
chart.set("cursor", am5xy.XYCursor.new(root, {
  behavior: "none" // "zoomX", "zoomY", "zoomXY", "selectX", "selectXY"
}));
```

### Scrollbar
```js
chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal" }));
```

### Legend
```js
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.percent(50),
  x: am5.percent(50)
}));
legend.data.setAll(chart.series.values);
```

### Tooltip on series
```js
series.set("tooltip", am5.Tooltip.new(root, {
  labelText: "{name}: {valueY}"
}));

// For column/bar series the tooltip text often lives on the columns template instead:
series.columns.template.set("tooltipText", "{categoryX}: {valueY}");
```
A tooltip enabled with no `labelText`/`tooltipText` shows an empty bubble — always give it text. See index.md > Tooltip for background/text styling.

### Stacking
```js
// On each series:
am5xy.ColumnSeries.new(root, {
  stacked: true,
  // ... other settings
})
```

## Disposal (SPA frameworks)

Always dispose on component unmount:
```js
root.dispose();
```


---

# amCharts 5 XY Charts — API Reference

Detailed reference for axes, series, and configuration options.
Full docs: https://www.amcharts.com/docs/v5/charts/xy-chart/

## CategoryAxis

Used for discrete, non-numeric categories (product names, countries, months as labels).

```js
const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "category",
  renderer: am5xy.AxisRendererX.new(root, {
    minGridDistance: 30,
    cellStartLocation: 0.1,  // padding between columns
    cellEndLocation: 0.9
  }),
  tooltip: am5.Tooltip.new(root, {})
}));

// CRITICAL: CategoryAxis MUST receive data separately
xAxis.data.setAll(data);
```

**Key settings:**
- `categoryField` (required) — field name in data for categories
- `startLocation` / `endLocation` — 0 to 1, controls where axis starts/ends within first/last category
- `tooltip` — shows category under cursor

**Gotchas:**
- Category order in axis data and series data must match
- Forgetting `xAxis.data.setAll()` is the #1 mistake — the chart will render empty

## DateAxis

Used for time-series data. Values must be **millisecond timestamps** (numbers), not Date objects.

```js
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: { timeUnit: "day", count: 1 },
  renderer: am5xy.AxisRendererX.new(root, {
    minGridDistance: 50
  }),
  tooltip: am5.Tooltip.new(root, {})
}));
```

**Key settings:**
- `baseInterval` (required) — smallest data granularity: `{ timeUnit: "minute"|"hour"|"day"|"week"|"month"|"year", count: N }`
- `groupData: true` — automatically groups data when zoomed out (e.g., daily > monthly)
- `groupCount: 500` — target number of data items after grouping
- `groupIntervals` — array of allowed group intervals
- `markUnitChange: true` — highlights when time unit changes on axis labels (e.g., new month)
- `tooltipDateFormat` — format string for cursor tooltip

**Data format:**
```js
series.data.setAll([
  { date: new Date(2024, 0, 1).getTime(), value: 100 },  // ✅ timestamp
  { date: 1704067200000, value: 120 },                     // ✅ timestamp
  { date: "2024-01-01", value: 100 },                      // ❌ WRONG — string
  { date: new Date(2024, 0, 1), value: 100 },              // ❌ WRONG — Date object
]);
```

## ValueAxis

Used for numeric values. Auto-calculates min/max from data.

```js
const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {}),
  // Optional:
  min: 0,                    // force minimum
  max: 100,                  // force maximum
  strictMinMax: true,        // don't let axis adjust beyond min/max
  logarithmic: false,        // log scale
  treatZeroAs: 0.001,        // when logarithmic, replace zeros
  numberFormat: "#,###",     // custom format
  extraMax: 0.1,             // add 10% padding above highest value
  extraMin: 0.1,             // add 10% padding below lowest value
  calculateTotals: true,     // needed for 100% stacked charts
  maxPrecision: 0            // max decimal places in axis labels
}));
```

## AxisRendererX / AxisRendererY

Controls visual rendering of an axis. Every axis MUST have a renderer.

```js
am5xy.AxisRendererX.new(root, {
  minGridDistance: 30,        // min pixels between grid lines
  opposite: false,            // true > show on top/right
  inversed: false,            // true > flip direction
  inside: false,              // true > labels inside plot area
  cellStartLocation: 0,      // 0–1, column start offset
  cellEndLocation: 1,         // 0–1, column end offset
  pan: "none",                // "zoom" > enable drag-zoom on axis
})
```

**Configuring grid lines:**
```js
const renderer = yAxis.get("renderer");
renderer.grid.template.setAll({
  stroke: am5.color(0xcccccc),
  strokeWidth: 1,
  strokeDasharray: [3, 3]
});
```

**Configuring axis labels:**
```js
renderer.labels.template.setAll({
  fontSize: 12,
  fill: am5.color(0x666666),
  rotation: -45,            // rotate labels
  centerY: am5.percent(50),
  centerX: am5.percent(100)
});
```

**Axis sub-element defaults:** grid and labels are visible by default; **ticks default to `visible:false`**. To show ticks you must raise `visible` (and give them a non-zero `strokeOpacity`) — toggling `forceHidden` won't reveal them:
```js
renderer.ticks.template.setAll({ visible: true, strokeOpacity: 0.5, length: 5 });
```

## LineSeries

For line and area charts.

```js
const series = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Revenue",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "revenue",
  valueXField: "date",           // for DateAxis/ValueAxis on X
  // OR categoryXField: "cat",   // for CategoryAxis on X
  tooltip: am5.Tooltip.new(root, { labelText: "{valueY}" }),
  // Visual:
  stroke: am5.color(0x095256),
  fill: am5.color(0x095256),
  // Stacking:
  stacked: false,                 // true for stacked area
}));

// Make it an area chart:
series.fills.template.setAll({
  visible: true,
  fillOpacity: 0.3
});

// Stroke width:
series.strokes.template.setAll({
  strokeWidth: 2
});
```

**Line appearance:**
- `connect: true` — connect lines over missing data (default: true). Set `false` for line breaks at gaps
- `minDistance: 10` — min pixel distance between points before simplifying

## ColumnSeries

For vertical columns or horizontal bars.

```js
const series = chart.series.push(am5xy.ColumnSeries.new(root, {
  name: "Sales",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "sales",
  categoryXField: "category",    // or valueXField for scatter
  tooltip: am5.Tooltip.new(root, { labelText: "{categoryX}: {valueY}" }),
  stacked: false,                 // true for stacked columns
  clustered: true,                // false to overlap columns
}));

// Column appearance:
series.columns.template.setAll({
  cornerRadiusTL: 5,
  cornerRadiusTR: 5,
  strokeOpacity: 0,
  width: am5.percent(80),        // column width
});

// Individual column colors from data:
series.columns.template.adapters.add("fill", (fill, target) => {
  return chart.get("colors").getIndex(series.columns.indexOf(target));
});
```

**Horizontal bar chart:** swap axes — put CategoryAxis on Y, ValueAxis on X:
```js
const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "category",
  renderer: am5xy.AxisRendererY.new(root, { inversed: true })
}));
const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererX.new(root, {})
}));
// Series uses categoryYField + valueXField
```

## CandlestickSeries

For financial OHLC candlestick charts. Requires 4 value fields.

```js
const series = chart.series.push(am5xy.CandlestickSeries.new(root, {
  name: "Price",
  xAxis: xAxis,
  yAxis: yAxis,
  openValueYField: "open",
  highValueYField: "high",
  lowValueYField: "low",
  valueYField: "close",
  valueXField: "date"
}));
```

## XYCursor

Adds crosshair and enables tooltips on hover.

```js
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  behavior: "none",       // "zoomX", "zoomY", "zoomXY", "selectX", "selectXY"
  xAxis: xAxis,           // optional: snap to axis
}));

// Customize appearance (always access cursor.lineX/lineY AFTER creation):
cursor.lineX.setAll({ stroke: am5.color(0x000000), strokeDasharray: [2, 2] });

// Hide a cursor line — use forceHidden (NOT visible:false):
cursor.lineY.set("forceHidden", true);

// Snap tooltips to series data points:
series.set("tooltip", am5.Tooltip.new(root, { labelText: "{valueY}" }));
chart.set("cursor", am5xy.XYCursor.new(root, { snapToSeries: [series] }));
```

**Do NOT** pass `lineX`/`lineY` as constructor options to `XYCursor.new()`. Always access `cursor.lineX` / `cursor.lineY` after creation.

For timeline charts, use `am5timeline.CurveCursor` instead — see `references/timeline.md`.

## Scrollbar

Enables zooming/panning via scrollbar. Can optionally include a preview chart.

```js
// Simple scrollbar:
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));

// Scrollbar with preview chart:
const scrollbar = am5xy.XYChartScrollbar.new(root, {
  orientation: "horizontal",
  height: 50
});
chart.set("scrollbarX", scrollbar);

// Push axes into the scrollbar's internal chart
const sbxAxis = scrollbar.chart.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: { timeUnit: "day", count: 1 },
  renderer: am5xy.AxisRendererX.new(root, {})
}));
const sbyAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

// Add a series to the scrollbar's chart for the preview
const sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
  xAxis: sbxAxis,
  yAxis: sbyAxis,
  valueYField: "value",
  valueXField: "date"
}));
```

## Legend

```js
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.percent(50),
  x: am5.percent(50),
  layout: root.horizontalLayout  // or root.verticalLayout, root.gridLayout
}));
legend.data.setAll(chart.series.values);
```

**Dynamic legend labels (show values under cursor):**
```js
const series = chart.series.push(am5xy.LineSeries.new(root, {
  // ...
  legendLabelText: "{name}",
  legendValueText: "{valueY}",
  legendRangeLabelText: "{name}",
  legendRangeValueText: ""
}));
```

## Stacking

```js
// Each series in the stack needs stacked: true
const series1 = chart.series.push(am5xy.ColumnSeries.new(root, {
  stacked: true, name: "A", valueYField: "a", /* ... */
}));
const series2 = chart.series.push(am5xy.ColumnSeries.new(root, {
  stacked: true, name: "B", valueYField: "b", /* ... */
}));

// For 100% stacked:
// 1. Set calculateTotals on value axis:
const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  calculateTotals: true,
  min: 0, max: 100,
  renderer: am5xy.AxisRendererY.new(root, {})
}));
// 2. Use display fields on series:
am5xy.ColumnSeries.new(root, {
  stacked: true,
  valueYField: "a",
  valueYShow: "valueYTotalPercent",  // display as % of total
  /* ... */
});
```

## Axis ranges (highlights / reference lines)

```js
// Highlight a value range:
const rangeDataItem = yAxis.makeDataItem({ value: 50, endValue: 100 });
const range = yAxis.createAxisRange(rangeDataItem);
rangeDataItem.get("grid").setAll({ stroke: am5.color(0xff0000), strokeOpacity: 1 });
rangeDataItem.get("axisFill").setAll({
  fill: am5.color(0xff0000),
  fillOpacity: 0.1,
  visible: true
});
rangeDataItem.get("label").setAll({ text: "Target", fill: am5.color(0xff0000) });
```

## Scatter / Bubble chart

Use `ValueAxis` on both X and Y with `LineSeries` (no connecting line) or `ColumnSeries`.

```js
// Scatter: ValueAxis on both axes
const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererX.new(root, {}),
  tooltip: am5.Tooltip.new(root, {})
}));
const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

const series = chart.series.push(am5xy.LineSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  valueXField: "x",
  valueYField: "y",
  tooltip: am5.Tooltip.new(root, { labelText: "({valueX}, {valueY})" })
}));

// Hide connecting line (scatter, not line chart)
series.strokes.template.set("visible", false);

// Add circle bullets
series.bullets.push(function(root, series, dataItem) {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 5,
      fill: series.get("fill"),
      fillOpacity: 0.7
    })
  });
});

// Bubble chart: variable-size bullets from data
series.bullets.push(function(root, series, dataItem) {
  var size = dataItem.dataContext.size || 1;
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: Math.sqrt(size) * 3,
      fill: series.get("fill"),
      fillOpacity: 0.5,
      tooltipText: "{name}: ({valueX}, {valueY}) size: {size}"
    })
  });
});

series.data.setAll([
  { x: 10, y: 20, size: 50, name: "A" },
  { x: 30, y: 45, size: 120, name: "B" },
  { x: 55, y: 15, size: 80, name: "C" }
]);
```

## Bullets (data point markers)

```js
// Add circle bullets to a line series
series.bullets.push(function(root, series, dataItem) {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 4,
      fill: series.get("fill"),
      stroke: am5.color(0xffffff),
      strokeWidth: 1
    })
  });
});

// Custom bullet (e.g., star, image, label)
series.bullets.push(function(root, series, dataItem) {
  return am5.Bullet.new(root, {
    sprite: am5.Label.new(root, {
      text: "{valueY}",
      centerX: am5.percent(50),
      centerY: am5.percent(100),
      populateText: true
    })
  });
});

// Auto-hide bullets when too close together
series.set("minBulletDistance", 20);
```

## Dual Y-axis (multiple value axes)

```js
// First Y axis (left)
var yAxis1 = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

// Second Y axis (right)
var yAxis2 = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, { opposite: true })
}));

// Sync grid lines (optional)
yAxis2.set("syncWithAxis", yAxis1);

// Series on first axis
var series1 = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Revenue ($)",
  xAxis: xAxis, yAxis: yAxis1,
  valueYField: "revenue", valueXField: "date"
}));

// Series on second axis
var series2 = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Units Sold",
  xAxis: xAxis, yAxis: yAxis2,
  valueYField: "units", valueXField: "date"
}));
```

## Axis titles

```js
yAxis.children.unshift(am5.Label.new(root, {
  text: "Revenue ($)",
  rotation: -90,
  y: am5.percent(50),
  centerX: am5.percent(50)
}));

xAxis.children.push(am5.Label.new(root, {
  text: "Month",
  x: am5.percent(50),
  centerX: am5.percent(50)
}));
```

## Range columns / Waterfall (openValueYField)

```js
// Range columns: each bar spans from openValueY to valueY
var series = chart.series.push(am5xy.ColumnSeries.new(root, {
  xAxis: xAxis, yAxis: yAxis,
  valueYField: "high",
  openValueYField: "low",       // bar starts from this value
  categoryXField: "category"
}));

// Waterfall: cumulative bars using calculated open/close values
// Data should pre-calculate start/end values for each bar
```

## Events on XY elements

```js
// Click on a column
series.columns.template.events.on("click", function(ev) {
  var data = ev.target.dataItem.dataContext;
  console.log("Clicked:", data);
});

// Hover on a data point (line series bullet)
series.bullets.push(function(root, series, dataItem) {
  var circle = am5.Circle.new(root, { radius: 5, fill: series.get("fill") });
  circle.events.on("pointerover", function() {
    circle.set("scale", 1.5);
  });
  circle.events.on("pointerout", function() {
    circle.set("scale", 1);
  });
  return am5.Bullet.new(root, { sprite: circle });
});

// Axis zoom/scroll event
xAxis.events.on("rangechanged", function() {
  console.log("Axis range changed (zoomed/scrolled)");
});
```

## Chart settings reference

```js
am5xy.XYChart.new(root, {
  layout: root.verticalLayout,   // how children (legend, chart) are laid out
  panX: true,                     // allow horizontal panning
  panY: false,                    // allow vertical panning
  wheelX: "panX",                 // mouse wheel: "panX", "panY", "zoomX", "zoomY", "none"
  wheelY: "zoomX",                // mouse wheel vertical
  pinchZoomX: true,               // mobile pinch zoom on X
  arrangeTooltips: true,          // de-overlap stacked series tooltips (NOTE: there is no `arrangeFields` setting)
  maxTooltipDistance: 0,           // show tooltips for nearby series (-1 = all)
})
```

---

# amCharts 5 XY Charts — Working Examples

Complete, tested examples ready to use. Each example is self-contained.

## Example 1: Column chart with categories

A basic vertical bar chart with category axis.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Column Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    #chartdiv { width: 100%; height: 500px; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    // Create root
    var root = am5.Root.new("chartdiv");

    // Set theme
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      layout: root.verticalLayout
    }));

    // Data
    var data = [
      { category: "Research", value: 1000 },
      { category: "Marketing", value: 1200 },
      { category: "Sales", value: 850 },
      { category: "Support", value: 600 },
      { category: "Development", value: 1500 }
    ];

    // Create axes
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "category",
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 30,
        cellStartLocation: 0.1,
        cellEndLocation: 0.9
      }),
      tooltip: am5.Tooltip.new(root, {})
    }));
    xAxis.data.setAll(data); // CategoryAxis MUST receive data

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    // Create series
    var series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Revenue",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "category",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{categoryX}: ${valueY}"
      })
    }));

    series.columns.template.setAll({
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0
    });

    // Assign individual colors from chart's color set
    series.columns.template.adapters.add("fill", function (fill, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });
    series.columns.template.adapters.add("stroke", function (stroke, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    // Set data LAST
    series.data.setAll(data);

    // Animate
    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 2: Multi-series line chart with date axis

A time-series line chart with two series, cursor, scrollbar, and legend.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Multi-Series Line Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
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

    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      layout: root.verticalLayout
    }));

    // Generate sample date-based data
    var data = [];
    var date = new Date(2024, 0, 1);
    var revenue = 100;
    var expenses = 80;

    for (var i = 0; i < 90; i++) {
      revenue += Math.round((Math.random() - 0.48) * 10);
      expenses += Math.round((Math.random() - 0.5) * 8);
      data.push({
        date: date.getTime(),  // Must be timestamp!
        revenue: revenue,
        expenses: expenses
      });
      date.setDate(date.getDate() + 1);
    }

    // Axes
    var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 50 }),
      tooltip: am5.Tooltip.new(root, {})
    }));

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    // Helper function to create series
    function createSeries(name, field) {
      var series = chart.series.push(am5xy.LineSeries.new(root, {
        name: name,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: field,
        valueXField: "date",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{name}: {valueY}"
        })
      }));

      series.strokes.template.setAll({ strokeWidth: 2 });
      series.data.setAll(data);
      series.appear(1000);
      return series;
    }

    createSeries("Revenue", "revenue");
    createSeries("Expenses", "expenses");

    // Cursor
    chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "none"
    }));

    // Scrollbar
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal"
    }));

    // Legend
    var legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50)
    }));
    legend.data.setAll(chart.series.values);

    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 3: Stacked area chart

Area chart with three stacked series.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Stacked Area Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
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

    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      layout: root.verticalLayout
    }));

    var data = [
      { year: "2019", mobile: 250, desktop: 580, tablet: 120 },
      { year: "2020", mobile: 300, desktop: 550, tablet: 150 },
      { year: "2021", mobile: 380, desktop: 500, tablet: 170 },
      { year: "2022", mobile: 450, desktop: 460, tablet: 190 },
      { year: "2023", mobile: 520, desktop: 420, tablet: 200 },
      { year: "2024", mobile: 600, desktop: 380, tablet: 210 }
    ];

    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "year",
      renderer: am5xy.AxisRendererX.new(root, {}),
      tooltip: am5.Tooltip.new(root, {})
    }));
    xAxis.data.setAll(data);

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    function createSeries(name, field) {
      var series = chart.series.push(am5xy.LineSeries.new(root, {
        name: name,
        xAxis: xAxis,
        yAxis: yAxis,
        stacked: true,
        valueYField: field,
        categoryXField: "year",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{name}: {valueY}"
        })
      }));

      // Enable area fill
      series.fills.template.setAll({
        visible: true,
        fillOpacity: 0.5
      });

      series.strokes.template.setAll({ strokeWidth: 2 });
      series.data.setAll(data);
      series.appear(1000);
      return series;
    }

    createSeries("Mobile", "mobile");
    createSeries("Desktop", "desktop");
    createSeries("Tablet", "tablet");

    // Cursor
    chart.set("cursor", am5xy.XYCursor.new(root, {}));

    // Legend
    var legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50)
    }));
    legend.data.setAll(chart.series.values);

    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 4: Horizontal bar chart

Bars extending horizontally — swap category to Y axis.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Horizontal Bar Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
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

    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: false,
      panY: true,
      wheelX: "none",
      wheelY: "panY",
      layout: root.verticalLayout
    }));

    var data = [
      { country: "United States", visits: 4025 },
      { country: "China", visits: 1882 },
      { country: "Japan", visits: 1809 },
      { country: "Germany", visits: 1322 },
      { country: "United Kingdom", visits: 1122 },
      { country: "France", visits: 1114 },
      { country: "India", visits: 984 },
      { country: "Spain", visits: 711 }
    ];

    // Note: CategoryAxis on Y, ValueAxis on X
    var yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "country",
      renderer: am5xy.AxisRendererY.new(root, {
        inversed: true,  // top-to-bottom order
        cellStartLocation: 0.1,
        cellEndLocation: 0.9
      })
    }));
    yAxis.data.setAll(data);

    var xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererX.new(root, {}),
      min: 0
    }));

    // Note: categoryYField + valueXField (swapped from vertical)
    var series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Visits",
      xAxis: xAxis,
      yAxis: yAxis,
      valueXField: "visits",
      categoryYField: "country",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{categoryY}: {valueX}"
      })
    }));

    series.columns.template.setAll({
      cornerRadiusBR: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0
    });

    series.columns.template.adapters.add("fill", function (fill, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    series.data.setAll(data);
    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 5: TypeScript + ES modules (framework-ready)

Suitable for React, Angular, Vue, or any bundled project.

```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

export function createChart(elementId: string): am5.Root {
  const root = am5.Root.new(elementId);
  root.setThemes([am5themes_Animated.new(root)]);

  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      layout: root.verticalLayout,
    })
  );

  const xAxis = chart.xAxes.push(
    am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "month", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 50 }),
      tooltip: am5.Tooltip.new(root, {}),
    })
  );

  const yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {}),
    })
  );

  const series = chart.series.push(
    am5xy.LineSeries.new(root, {
      name: "Series 1",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      valueXField: "date",
      tooltip: am5.Tooltip.new(root, { labelText: "{valueY}" }),
    })
  );

  series.fills.template.setAll({ visible: true, fillOpacity: 0.2 });

  chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
  chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal" }));

  const legend = chart.children.push(
    am5.Legend.new(root, {
      centerX: am5.percent(50),
      x: am5.percent(50),
    })
  );
  legend.data.setAll(chart.series.values);

  // Set data
  const data: Array<{ date: number; value: number }> = [];
  let value = 100;
  for (let i = 0; i < 24; i++) {
    value += Math.round((Math.random() - 0.45) * 20);
    data.push({
      date: new Date(2023, i, 1).getTime(),
      value: value,
    });
  }

  series.data.setAll(data);
  series.appear(1000);
  chart.appear(1000, 100);

  // Return root so caller can dispose: root.dispose()
  return root;
}
```

**React usage:**
```tsx
import { useLayoutEffect, useRef } from "react";
import { createChart } from "./chart";

export function ChartComponent() {
  const chartRef = useRef<am5.Root | null>(null);

  useLayoutEffect(() => {
    chartRef.current = createChart("chartdiv");
    return () => {
      chartRef.current?.dispose();
    };
  }, []);

  return <div id="chartdiv" style={{ width: "100%", height: "500px" }} />;
}
```
