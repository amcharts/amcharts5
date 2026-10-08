# Timeline Charts — Curve, Serpentine, Spiral

Docs: https://www.amcharts.com/docs/v5/charts/timeline/

Timeline charts are "curved XY charts" — they use XY-style axes and series but bend the chart into serpentine, spiral, or custom shapes. Added in amCharts 5.12.0.

## Key differences from XY charts

Timeline charts work like XY charts but use **different classes**:

| XY class | Timeline equivalent |
|----------|-------------------|
| `am5xy.XYChart` | `am5timeline.CurveChart` / `SerpentineChart` / `SpiralChart` |
| `am5xy.AxisRendererX` | `am5timeline.AxisRendererCurveX` |
| `am5xy.AxisRendererY` | `am5timeline.AxisRendererCurveY` |
| `am5xy.LineSeries` | `am5timeline.CurveLineSeries` |
| `am5xy.ColumnSeries` | `am5timeline.CurveColumnSeries` |
| `am5xy.XYCursor` | `am5timeline.CurveCursor` |

All XY axis types (DateAxis, CategoryAxis, ValueAxis) work — just swap the renderer.

## Imports

### ES modules / TypeScript
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5timeline from "@amcharts/amcharts5/timeline";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN / script tags
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
<script src="https://cdn.amcharts.com/lib/5/timeline.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Chart types

### SerpentineChart

The easiest starting point. Automatically generates a winding, snake-like path.

```js
const chart = root.container.children.push(
  am5timeline.SerpentineChart.new(root, {
    orientation: "vertical",  // "vertical" | "horizontal"
    levelCount: 3,            // number of bends/turns
    startLocation: 0,         // relative start of the "road" (0-1)
    endLocation: 1,           // relative end of the "road" (0-1)
    yAxisRadius: am5.percent(50),   // band thickness (Percent); applied to the Y axes' radius
  })
);
```

**Serpentine settings** (`ISerpentineChartSettings`):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `orientation` | `"vertical"` \| `"horizontal"` | `"vertical"` | Direction of the snake pattern |
| `levelCount` | number | `3` | Number of turns/bends |
| `startLocation` | number | `0` | Relative location (0-1) of the start |
| `endLocation` | number | `1` | Relative location (0-1) of the end |
| `yAxisRadius` | `Percent` | `50%` | Band thickness — applied to every Y axis renderer's radius |

> There is no `yAxisInnerRadius` setting on the chart. Band thickness is controlled by `yAxisRadius` (a `Percent`). For a plain `CurveChart` (no Serpentine/Spiral wrapper) the Y-axis band length is set via `AxisRendererCurveY`'s `axisLength` instead.

### SpiralChart

Wraps the chart into a spiral shape.

```js
const chart = root.container.children.push(
  am5timeline.SpiralChart.new(root, {
    levelCount: 3,             // number of spiral rings
    startAngle: -90,           // start angle in degrees
    endAngle: -135,            // end angle in degrees
    yAxisRadius: am5.percent(60),  // band thickness (Percent)
    innerRadius: am5.percent(30),  // inner hole radius (Percent)
  })
);
```

**Spiral settings** (`ISpiralChartSettings`):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `levelCount` | number | `3` | Number of spiral rings |
| `startAngle` | number | `-90` | Where the spiral starts (degrees) |
| `endAngle` | number | `0` | Where the spiral ends (degrees) |
| `innerRadius` | `Percent` | `60%` | Size of the center hole |
| `yAxisRadius` | `Percent` | `50%` | Band thickness — applied to every Y axis renderer's radius |

> There is no `inversed` or `yAxisInnerRadius` setting on `SpiralChart`. To reverse direction use the `startAngle`/`endAngle` pair. (`inversed` is a valid axis-renderer setting, but not a chart setting.)

### CurveChart

The base class — define your own custom shape via control points on the X axis renderer.

```js
const chart = root.container.children.push(
  am5timeline.CurveChart.new(root, {})
);

// Create Y renderer first, then X renderer with yRenderer + custom points
const yRenderer = am5timeline.AxisRendererCurveY.new(root, {});
const xRenderer = am5timeline.AxisRendererCurveX.new(root, {
  yRenderer: yRenderer,   // REQUIRED
  // Control points define the curve shape
  points: [
    { x: -400, y: 0 },
    { x: -200, y: -100 },
    { x: 0, y: 0 },
    { x: 200, y: 100 },
    { x: 400, y: 0 }
  ]
});
```

## Axes

Same axis types as XY charts, but with Curve renderers.

**IMPORTANT:** `AxisRendererCurveX` MUST receive the `yRenderer` reference. Create the Y renderer first, then pass it to the X renderer. Without this, the chart crashes with `Cannot read properties of undefined (reading 'axis')`.

```js
// Step 1: Create Y renderer FIRST
const yRenderer = am5timeline.AxisRendererCurveY.new(root, {});

// Step 2: Create X renderer and pass yRenderer to it
const xRenderer = am5timeline.AxisRendererCurveX.new(root, {
  yRenderer: yRenderer   // REQUIRED — links the two axes for curve layout
});

// Step 3: Create the axes
const xAxis = chart.xAxes.push(
  am5xy.DateAxis.new(root, {
    baseInterval: { timeUnit: "day", count: 1 },
    renderer: xRenderer
  })
);

const yAxis = chart.yAxes.push(
  am5xy.ValueAxis.new(root, {
    renderer: yRenderer
  })
);
```

**Any XY axis type works:**
- `am5xy.DateAxis` — most common for timelines
- `am5xy.CategoryAxis` — discrete items along the curve
- `am5xy.ValueAxis` — numeric scale

**Important:** CategoryAxis still needs its own data: `xAxis.data.setAll(data)`.

## Series

Use Curve-prefixed series classes:

```js
// Line series
const series = chart.series.push(
  am5timeline.CurveLineSeries.new(root, {
    name: "Events",
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: "value",
    valueXField: "date",     // timestamps for DateAxis
    // or categoryXField     // for CategoryAxis
    tooltip: am5.Tooltip.new(root, { labelText: "{valueY}" })
  })
);

// Column series
const series = chart.series.push(
  am5timeline.CurveColumnSeries.new(root, {
    name: "Events",
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: "value",
    valueXField: "date",
    tooltip: am5.Tooltip.new(root, { labelText: "{valueY}" })
  })
);
```

## Cursor

Timeline charts use `CurveCursor`, NOT `XYCursor`. It follows the curve path.

```js
// Create cursor — must use CurveCursor for timeline charts
var cursor = chart.set("cursor", am5timeline.CurveCursor.new(root, {
  xAxis: xAxis,           // recommended — enables axis-based snapping
  yAxis: yAxis,
  behavior: "none"         // "zoomX", "zoomY", "zoomXY", "selectX", etc.
}));

// Hide crosshair lines (forceHidden stays hidden; visible:false can be overridden by the library)
cursor.lineX.set("forceHidden", true);
cursor.lineY.set("forceHidden", true);

// Snap tooltips to data points — set on the SERIES, not the cursor
series.set("snapTooltip", true);
```

**Do NOT** pass `lineX`/`lineY` as constructor options. Always access `cursor.lineX` / `cursor.lineY` after creation.

## Bullets

Bullets on timeline charts work the same as XY charts:

```js
series.bullets.push(function() {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 5,
      fill: series.get("fill")
    })
  });
});
```

## Event markers on timeline

Use bullets with labels to show discrete events (milestones, releases) along the curve:

```js
series.bullets.push(function(root, series, dataItem) {
  var dc = dataItem.dataContext;
  if (dc.milestone) {
    return am5.Bullet.new(root, {
      sprite: am5.Container.new(root, {
        children: [
          am5.Circle.new(root, { radius: 8, fill: am5.color(0xff5733) }),
          am5.Label.new(root, {
            text: dc.label || "",
            centerX: am5.percent(50),
            centerY: am5.percent(100),
            dy: -15,
            fontSize: 11,
            populateText: true
          })
        ]
      })
    });
  }
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, { radius: 3, fill: series.get("fill") })
  });
});
```

## Events on timeline elements

```js
// Click on data points (via bullets)
series.bullets.push(function() {
  var circle = am5.Circle.new(root, {
    radius: 5,
    fill: series.get("fill"),
    cursorOverStyle: "pointer"
  });
  circle.events.on("click", function(ev) {
    var di = ev.target.dataItem;
    console.log("Clicked:", di.get("valueX"), di.get("valueY"));
  });
  return am5.Bullet.new(root, { sprite: circle });
});

// Click on timeline columns (CurveColumnSeries)
series.columns.template.events.on("click", function(ev) {
  console.log("Column:", ev.target.dataItem.dataContext);
});

// Cursor position tracking
chart.get("cursor").events.on("cursormoved", function(ev) {
  var x = xAxis.positionToValue(xAxis.toAxisPosition(ev.target.getPrivate("positionX")));
  console.log("Cursor at:", new Date(x));
});
```

---

## Example: Serpentine timeline with events

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Serpentine Timeline</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/timeline.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    #chartdiv { width: 100%; height: 600px; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    // Create serpentine chart
    var chart = root.container.children.push(
      am5timeline.SerpentineChart.new(root, {
        orientation: "vertical",
        levelCount: 3,
        yAxisRadius: am5.percent(50)
      })
    );

    // Create axes — Y renderer first, then pass to X renderer
    var yRenderer = am5timeline.AxisRendererCurveY.new(root, {});
    var xRenderer = am5timeline.AxisRendererCurveX.new(root, {
      yRenderer: yRenderer  // REQUIRED
    });

    var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "month", count: 1 },
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    }));

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: yRenderer
    }));

    // Create series
    var series = chart.series.push(am5timeline.CurveLineSeries.new(root, {
      name: "Revenue",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      valueXField: "date",
      tooltip: am5.Tooltip.new(root, { labelText: "{valueY}" })
    }));

    series.strokes.template.setAll({ strokeWidth: 2 });
    series.fills.template.setAll({ visible: true, fillOpacity: 0.3 });

    // Add bullets
    series.bullets.push(function() {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 4,
          fill: series.get("fill")
        })
      });
    });

    // Generate data
    var data = [];
    var date = new Date(2024, 0, 1);
    var value = 100;
    for (var i = 0; i < 24; i++) {
      value += Math.round((Math.random() - 0.45) * 20);
      data.push({
        date: new Date(date.getFullYear(), date.getMonth() + i, 1).getTime(),
        value: value
      });
    }

    series.data.setAll(data);

    // Cursor
    chart.set("cursor", am5timeline.CurveCursor.new(root, {}));

    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example: Spiral chart

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Spiral Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/timeline.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    #chartdiv { width: 100%; height: 600px; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(
      am5timeline.SpiralChart.new(root, {
        levelCount: 3,
        startAngle: -90,
        endAngle: -135,
        yAxisRadius: am5.percent(60),
        innerRadius: am5.percent(30)
      })
    );

    var yRenderer = am5timeline.AxisRendererCurveY.new(root, {});
    var xRenderer = am5timeline.AxisRendererCurveX.new(root, {
      yRenderer: yRenderer  // REQUIRED
    });

    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "category",
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    }));

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: yRenderer,
      min: 0
    }));

    var series = chart.series.push(am5timeline.CurveColumnSeries.new(root, {
      name: "Score",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "category",
      tooltip: am5.Tooltip.new(root, { labelText: "{categoryX}: {valueY}" })
    }));

    series.columns.template.setAll({
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0
    });

    series.columns.template.adapters.add("fill", function(fill, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    var data = [
      { category: "Lithuania", value: 501 },
      { category: "Czechia", value: 301 },
      { category: "Ireland", value: 201 },
      { category: "Germany", value: 165 },
      { category: "Australia", value: 139 },
      { category: "Austria", value: 128 },
      { category: "UK", value: 99 },
      { category: "Belgium", value: 60 },
      { category: "Netherlands", value: 50 }
    ];

    xAxis.data.setAll(data);  // CategoryAxis needs its own data!
    series.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```
