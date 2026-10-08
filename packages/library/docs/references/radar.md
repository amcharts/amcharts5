# Radar & Gauge Charts


## Required imports

### ES modules
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
<script src="https://cdn.amcharts.com/lib/5/radar.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Radar chart setup

```js
const root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

const chart = root.container.children.push(
  am5radar.RadarChart.new(root, {
    panX: false,
    panY: false,
    wheelX: "panX",
    wheelY: "zoomX",
    radius: am5.percent(80),
    innerRadius: am5.percent(20),   // hole in center (0 = solid)
    startAngle: -90,                // default: -90 (top)
    endAngle: 270                   // default: 270 (full circle)
  })
);
```

### RadarChart key settings

| Setting | Type | Description |
|---------|------|-------------|
| `radius` | percent/number | Outer radius (default: `am5.percent(80)`) |
| `innerRadius` | percent/number | Inner radius / hole size (default: 0) |
| `startAngle` | number | Start angle in degrees (default: -90) |
| `endAngle` | number | End angle in degrees (default: 270) |

## Axes — use circular + radial renderers

```js
// Circular axis (X — goes around the perimeter)
const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "category",
  renderer: am5radar.AxisRendererCircular.new(root, {
    minGridDistance: 30
  }),
  tooltip: am5.Tooltip.new(root, {})
}));
xAxis.data.setAll(data);  // CategoryAxis needs data

// Radial axis (Y — goes from center outward)
const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5radar.AxisRendererRadial.new(root, {}),
  min: 0
}));
```

### Circular renderer label options

```js
am5radar.AxisRendererCircular.new(root, {
  minGridDistance: 30
});
// Label text type:
xAxis.get("renderer").labels.template.setAll({
  textType: "circular",   // "circular" | "radial" | "adjusted"
  fontSize: 12
});
```

## Series types

| Class | Use for |
|-------|---------|
| `am5radar.RadarLineSeries` | Lines on radar chart (spider chart) |
| `am5radar.RadarColumnSeries` | Columns on radar chart |
| `am5radar.SmoothedRadarLineSeries` | Smoothed/curved radar lines |

```js
// Radar line series (spider chart)
const series = chart.series.push(am5radar.RadarLineSeries.new(root, {
  name: "Performance",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  categoryXField: "category",
  tooltip: am5.Tooltip.new(root, { labelText: "{categoryX}: {valueY}" }),
  connectEnds: true    // connect first and last point (default: true)
}));

// Make it an area chart
series.fills.template.setAll({
  visible: true,
  fillOpacity: 0.3
});

series.strokes.template.setAll({ strokeWidth: 2 });

// Radar column series
const columnSeries = chart.series.push(am5radar.RadarColumnSeries.new(root, {
  name: "Values",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  categoryXField: "category",
  stacked: false
}));

columnSeries.columns.template.setAll({
  strokeOpacity: 0,
  fillOpacity: 0.8,
  width: am5.percent(80)
});
```

## Gauge chart

Gauges are built with RadarChart + a single axis + axis ranges for colored bands.

```js
const chart = root.container.children.push(am5radar.RadarChart.new(root, {
  panX: false,
  panY: false,
  startAngle: -180,
  endAngle: 0,                      // semi-circle
  innerRadius: -25,                  // fixed-width band (negative = from outer edge)
  radius: am5.percent(95)
}));

// Single value axis (the gauge scale)
const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
  min: 0,
  max: 100,
  strictMinMax: true,
  renderer: am5radar.AxisRendererCircular.new(root, {
    strokeOpacity: 0.1,
    minGridDistance: 30
  })
}));

// Enable ticks
xAxis.get("renderer").ticks.template.setAll({
  visible: true,
  strokeOpacity: 0.5
});

// Disable grid
xAxis.get("renderer").grid.template.setAll({ visible: false });

// Colored bands via axis ranges
function createRange(start, end, color, label) {
  var rangeDataItem = xAxis.makeDataItem({ value: start, endValue: end });
  xAxis.createAxisRange(rangeDataItem);
  rangeDataItem.get("axisFill").setAll({
    visible: true,
    fill: color,
    fillOpacity: 0.8
  });
  rangeDataItem.get("label").setAll({
    text: label,
    inside: true,
    radius: 8,
    fontSize: "0.9em",
    fill: am5.color(0xffffff)
  });
}

createRange(0, 33, am5.color(0x4caf50), "Good");
createRange(33, 66, am5.color(0xffc107), "Warning");
createRange(66, 100, am5.color(0xf44336), "Danger");

// Needle (clock hand) — uses an axis data item
var handDataItem = xAxis.makeDataItem({ value: 42 });
xAxis.createAxisRange(handDataItem);

var hand = handDataItem.set("bullet", am5xy.AxisBullet.new(root, {
  sprite: am5radar.ClockHand.new(root, {
    radius: am5.percent(99),
    innerRadius: am5.percent(40),
    pinRadius: 10
  })
}));

// Animate needle to a new value
// handDataItem.animate({ key: "value", to: 75, duration: 1000, easing: am5.ease.out(am5.ease.cubic) });

chart.appear(1000, 100);
```

**Tip: Avoiding needle/label overlap** — When adding a value label in the gauge center, the clock hand pin and inner portion will overlap the label. Hide the pin and increase `innerRadius` to leave space:

```js
am5radar.ClockHand.new(root, {
  radius: am5.percent(99),
  innerRadius: am5.percent(55),  // keep needle away from center
  pinRadius: 0                    // hide the center pin circle
})
```

## Cursor

```js
chart.set("cursor", am5radar.RadarCursor.new(root, {
  behavior: "zoomX"    // "none" | "zoomX" | "zoomY" | "zoomXY"
}));
```

## Legend

```js
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.percent(50),
  x: am5.percent(50)
}));
legend.data.setAll(chart.series.values);
```

## Partial-circle radar chart

```js
// Half radar (180 degrees)
var chart = root.container.children.push(am5radar.RadarChart.new(root, {
  startAngle: -90,
  endAngle: 90
}));

// Three-quarter radar (270 degrees)
var chart = root.container.children.push(am5radar.RadarChart.new(root, {
  startAngle: -135,
  endAngle: 135
}));
```

## Dynamic gauge value update

```js
// After creating the gauge hand and data item:
// Update value from external event (button, API, timer, etc.)
function setGaugeValue(newValue) {
  handDataItem.animate({
    key: "value",
    to: newValue,
    duration: 800,
    easing: am5.ease.out(am5.ease.cubic)
  });
}

// Example: update every 2 seconds
setInterval(function() {
  setGaugeValue(Math.random() * 100);
}, 2000);
```

## Axis label formatting for gauges

```js
// Append "%" to gauge axis labels
xAxis.get("renderer").labels.template.adapters.add("text", function(text) {
  return text + "%";
});

// Custom number format
xAxis.set("numberFormat", "#.#'%'");
```

## Events on radar elements

```js
// Click on radar columns
columnSeries.columns.template.events.on("click", function(ev) {
  var di = ev.target.dataItem;
  console.log("Category:", di.get("categoryX"), "Value:", di.get("valueY"));
});

// Pointer over/out on radar line data points (via bullets)
series.bullets.push(function() {
  var circle = am5.Circle.new(root, {
    radius: 5,
    fill: series.get("fill"),
    cursorOverStyle: "pointer"
  });
  circle.events.on("click", function(ev) {
    console.log("Clicked data point:", ev.target.dataItem.get("valueY"));
  });
  return am5.Bullet.new(root, { sprite: circle });
});

// Gauge needle animation complete
handDataItem.animate({
  key: "value",
  to: 75,
  duration: 1000,
  easing: am5.ease.out(am5.ease.cubic)
}).events.on("stopped", function() {
  console.log("Needle animation complete");
});
```

## Disposal

```js
root.dispose();
```


---

# amCharts 5 Radar & Gauge Charts — Working Examples

## Example 1: Spider chart (radar line chart)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Spider Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/radar.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5radar.RadarChart.new(root, {
      panX: false,
      panY: false,
      radius: am5.percent(80)
    }));

    var data = [
      { category: "Speed", team1: 90, team2: 70 },
      { category: "Accuracy", team1: 75, team2: 85 },
      { category: "Stamina", team1: 80, team2: 60 },
      { category: "Strategy", team1: 65, team2: 90 },
      { category: "Teamwork", team1: 85, team2: 75 },
      { category: "Defense", team1: 70, team2: 80 }
    ];

    // Circular axis (categories)
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "category",
      renderer: am5radar.AxisRendererCircular.new(root, {
        minGridDistance: 30
      })
    }));
    xAxis.data.setAll(data);

    // Radial axis (values)
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      min: 0,
      max: 100,
      renderer: am5radar.AxisRendererRadial.new(root, {}),
      strictMinMax: true
    }));

    // Helper to create series
    function createSeries(name, field) {
      var series = chart.series.push(am5radar.RadarLineSeries.new(root, {
        name: name,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: field,
        categoryXField: "category",
        tooltip: am5.Tooltip.new(root, { labelText: "{name}: {valueY}" })
      }));

      series.fills.template.setAll({ visible: true, fillOpacity: 0.2 });
      series.strokes.template.setAll({ strokeWidth: 2 });

      series.data.setAll(data);
      series.appear(1000);
      return series;
    }

    createSeries("Team Alpha", "team1");
    createSeries("Team Beta", "team2");

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

## Example 2: Gauge with colored bands

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Gauge Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/radar.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 400px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5radar.RadarChart.new(root, {
      panX: false,
      panY: false,
      startAngle: -180,
      endAngle: 0,
      radius: am5.percent(90),
      innerRadius: -30
    }));

    var xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
      min: 0,
      max: 100,
      strictMinMax: true,
      renderer: am5radar.AxisRendererCircular.new(root, {
        strokeOpacity: 0.1,
        minGridDistance: 30
      })
    }));

    xAxis.get("renderer").ticks.template.setAll({
      visible: true, strokeOpacity: 0.5
    });
    xAxis.get("renderer").grid.template.set("visible", false);
    xAxis.get("renderer").labels.template.setAll({ fontSize: 12 });

    // Colored bands
    function addBand(start, end, color, label) {
      var range = xAxis.makeDataItem({ value: start, endValue: end });
      xAxis.createAxisRange(range);
      range.get("axisFill").setAll({
        visible: true, fill: color, fillOpacity: 0.8
      });
      range.get("label").setAll({
        text: label, inside: true, radius: 8,
        fontSize: "0.8em", fill: am5.color(0xffffff)
      });
    }

    addBand(0, 30, am5.color(0x4caf50), "Good");
    addBand(30, 70, am5.color(0xffc107), "Warning");
    addBand(70, 100, am5.color(0xf44336), "Critical");

    // Needle
    var handDataItem = xAxis.makeDataItem({ value: 0 });
    xAxis.createAxisRange(handDataItem);

    handDataItem.set("bullet", am5xy.AxisBullet.new(root, {
      sprite: am5radar.ClockHand.new(root, {
        radius: am5.percent(99),
        innerRadius: am5.percent(55),
        pinRadius: 0              // hidden — avoids overlap with center label
      })
    }));

    // Animate needle to value
    handDataItem.animate({
      key: "value",
      to: 62,
      duration: 1500,
      easing: am5.ease.out(am5.ease.cubic)
    });

    // Value label in center
    chart.children.push(am5.Label.new(root, {
      text: "62%",
      fontSize: 28,
      fontWeight: "500",
      centerX: am5.percent(50),
      centerY: am5.percent(100),
      x: am5.percent(50),
      y: am5.percent(65)
    }));

    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 3: Radar column chart

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Radar Column Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/radar.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>#chartdiv { width: 100%; height: 500px; }</style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5radar.RadarChart.new(root, {
      panX: false,
      panY: false,
      radius: am5.percent(85),
      innerRadius: am5.percent(30)
    }));

    var data = [
      { month: "Jan", sales: 120 }, { month: "Feb", sales: 150 },
      { month: "Mar", sales: 200 }, { month: "Apr", sales: 180 },
      { month: "May", sales: 220 }, { month: "Jun", sales: 250 },
      { month: "Jul", sales: 230 }, { month: "Aug", sales: 210 },
      { month: "Sep", sales: 190 }, { month: "Oct", sales: 240 },
      { month: "Nov", sales: 260 }, { month: "Dec", sales: 300 }
    ];

    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "month",
      renderer: am5radar.AxisRendererCircular.new(root, { minGridDistance: 20 })
    }));
    xAxis.data.setAll(data);

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      min: 0,
      renderer: am5radar.AxisRendererRadial.new(root, {})
    }));

    var series = chart.series.push(am5radar.RadarColumnSeries.new(root, {
      name: "Sales",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "sales",
      categoryXField: "month",
      tooltip: am5.Tooltip.new(root, { labelText: "{month}: {valueY}" })
    }));

    series.columns.template.setAll({
      strokeOpacity: 0,
      fillOpacity: 0.8,
      width: am5.percent(80),
      cornerRadiusTL: 3,
      cornerRadiusTR: 3
    });

    // Color each column differently
    series.columns.template.adapters.add("fill", function(fill, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    series.data.setAll(data);
    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```
