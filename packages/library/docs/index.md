<!--
  A copy of the amCharts 5 skill (https://github.com/amcharts/amcharts5-skill),
  bundled with the library. Do not edit it here: it is written from that
  repository.
-->

> These notes come with the library. They can be behind the version you have:
> `../CHANGELOG.md` lists what is newer, and `../examples/` has working code.
>
> Newer than these notes: since 5.21.0 a chart can also be drawn as SVG, with
> `am5.Root.new("chartdiv", { renderer: am5.SVGRenderer })`. Where the notes
> say charts are canvas, that is the default, not the only way.

# amCharts 5

Build any chart with the amCharts 5 JavaScript charting library.

Docs: https://www.amcharts.com/docs/v5/

## Critical rules — apply to ALL chart types

1. **Check demos first (if you can browse the web)** — Before building a chart, search or browse https://www.amcharts.com/demos/ for a demo that matches the user's request. Demo source code is the most reliable starting point — adapt it rather than writing from scratch. Skip this step if you have no web access.
2. **Read the docs (if you can browse the web)** — For unfamiliar features or configuration, check https://www.amcharts.com/docs/v5/ for guides and tutorials. The docs explain concepts, patterns, and options that the class reference alone does not. Skip if you have no web access.
3. **Always use amCharts 5** — never v3 or v4. The APIs are completely different.
4. **Use `.new()` factory** — never `new ClassName()`. Every object is created via `ClassName.new(root, { settings })`.
5. **Root is always the first argument** to `.new()` (except Root itself, which takes a div ID).
6. **Set data last** — once data is set, objects are created. Configuration applied after may not take effect.
7. **Colors use `am5.color()`** — e.g. `am5.color(0xff0000)`, `am5.color("#ff0000")`, or `am5.color("rgb(255,0,0)")`. Never raw hex strings.
8. **Percent values use `am5.percent()`** — e.g. `am5.percent(50)`, not `50` or `"50%"`.
9. **Every axis needs a renderer** — `am5xy.AxisRendererX.new(root, {})` or `AxisRendererY`.
10. **CategoryAxis must receive data** — call `xAxis.data.setAll(data)` in addition to series data. Forgetting this is the #1 bug.
11. **DateAxis values must be timestamps** — use `new Date().getTime()`, not Date objects.
12. **Disposal is mandatory in SPAs** — call `root.dispose()` on component unmount. Not `chart.dispose()`.
13. **Canvas-rendered** — CSS cannot style chart internals. Use amCharts settings/templates instead.
14. **Dark backgrounds require Dark theme** — If the user requests or the page clearly has a dark background, always add `am5themes_Dark.new(root)` to `root.setThemes()` alongside Animated. Without it, labels, grid, and tooltips will be invisible. If the background is not clearly dark, default to white/light and do NOT add the Dark theme unless asked.
15. **Use default amCharts colors** — Do NOT invent custom color palettes unless the user explicitly asks for specific colors. amCharts assigns colors automatically from its built-in ColorSet. If you need a color programmatically, use `chart.get("colors").getIndex(index)` or `chart.get("colors").next()`. For pie/percent charts, use `series.get("colors")` instead.

## Package / module map

| Chart family | ES module import | CDN script | Main classes |
|-------------|-----------------|-----------|-------------|
| Core | `@amcharts/amcharts5` | `index.js` | Root, Theme, Legend, Tooltip, Label, Container |
| XY charts | `@amcharts/amcharts5/xy` | `xy.js` | XYChart, axes, series |
| Pie / Sliced | `@amcharts/amcharts5/percent` | `percent.js` | PieChart, SlicedChart, PieSeries, FunnelSeries, PyramidSeries, PictorialStackedSeries |
| Map | `@amcharts/amcharts5/map` | `map.js` | MapChart, MapPolygonSeries, MapPointSeries, MapLineSeries, MapSankeySeries |
| Hierarchy | `@amcharts/amcharts5/hierarchy` | `hierarchy.js` | Treemap, VoronoiTreemap, ForceDirected, Sunburst, Pack, Partition, Tree |
| Flow | `@amcharts/amcharts5/flow` | `flow.js` | Sankey, Chord, ChordDirected, ChordNonRibbon, ArcDiagram |
| Radar | `@amcharts/amcharts5/radar` | `radar.js` | RadarChart, AxisRendererCircular, AxisRendererRadial |
| Stock | `@amcharts/amcharts5/stock` | `stock.js` | StockChart, StockPanel, StockToolbar |
| Timeline | `@amcharts/amcharts5/timeline` | `timeline.js` | CurveChart, SerpentineChart, SpiralChart, CurveLineSeries, CurveColumnSeries |
| Word cloud | `@amcharts/amcharts5/wc` | `wc.js` | WordCloud |
| Venn | `@amcharts/amcharts5/venn` | `venn.js` | Venn |
| Gantt | `@amcharts/amcharts5/gantt` | `gantt.js` | Gantt (also needs xy) |
| Geodata | `@amcharts/amcharts5-geodata/*` | `geodata/*.js` | worldLow, usaLow, etc. |
| Themes | `@amcharts/amcharts5/themes/Animated` | `themes/Animated.js` | am5themes_Animated |
| Exporting | `@amcharts/amcharts5/plugins/exporting` | `plugins/exporting.js` | Exporting, ExportingMenu |

## Which reference to read

Based on the chart type the user is building, read the relevant reference file for detailed API, patterns, and examples:

| User wants | Read |
|-----------|------|
| Line, area, bar, column, candlestick, OHLC, scatter, stacked charts | `references/xy.md` |
| Pie, donut, semi-circle, funnel, pyramid, pictorial stacked charts | `references/pie.md` |
| World map, country map, choropleth, bubble map, point map, map sankey | `references/map.md` |
| Treemap, sunburst, force-directed, pack, partition, tree, org chart | `references/hierarchy.md` |
| Sankey, chord, arc diagram, alluvial, flow visualization | `references/flow.md` |
| Radar, spider, polar chart, gauge, speedometer, meter | `references/radar.md` |
| Financial stock chart, candlestick with indicators, trading chart | `references/stock.md` |
| Serpentine, spiral, curve chart, custom-shape timeline | `references/timeline.md` |
| Gantt chart, project timeline, task management chart | `references/gantt.md` |
| Word cloud, tag cloud, sentence cloud | `references/wordcloud.md` |
| Venn diagram, set overlap visualization | `references/venn.md` |
| Interactive controls: buttons, sliders, steppers, color pickers | `references/ui-elements.md` |

If the chart type is unclear, start with `references/xy.md` — XY charts are by far the most common.

If the user asks about core setup (theming, colors, exporting, legends, tooltips, disposal, responsive) without a specific chart type, the information below is sufficient — no reference file needed.

## Root element setup

```js
const root = am5.Root.new("chartdiv"); // div id or HTMLElement reference

// Apply theme(s)
root.setThemes([am5themes_Animated.new(root)]);

// Set locale (optional)
import am5locales_de_DE from "@amcharts/amcharts5/locales/de_DE";
root.locale = am5locales_de_DE;

// Set date/number formats (optional)
root.dateFormatter.setAll({ dateFormat: "yyyy-MM-dd" });
root.numberFormatter.setAll({ numberFormat: "#,###.##" });
```

**Available themes:** `Animated`, `Dark`, `Frozen`, `Dataviz`, `Material`, `Moonrise`, `Spirited`, `Kelly`, `Micro`, `Responsive`.

## Colors

```js
// From hex integer or CSS string — only these forms are valid
am5.color(0xff0000)
am5.color("#ff0000")
am5.color("rgb(255, 0, 0)")

// WRONG — {r,g,b} objects are NOT accepted
// am5.color({ r: 255, g: 0, b: 0 })  // throws!

// Lighten / darken — STATIC methods on am5.Color (NOT instance methods)
am5.Color.lighten(am5.color(0xff0000), 0.3)   // lighter
am5.Color.lighten(am5.color(0xff0000), -0.3)  // darker (use negative value; there is NO .darken())
am5.Color.brighten(am5.color(0xff0000), 0.3)  // brighter
// WRONG: am5.color(0xff0000).lighten(0.3) — this does NOT work, lighten is not an instance method

// Color sets (auto-cycle)
chart.get("colors").getIndex(0)   // first color in palette
chart.get("colors").next()        // next color

// Custom color set
chart.get("colors").set("colors", [
  am5.color(0x095256),
  am5.color(0x087f8c),
  am5.color(0x5aaa95),
  am5.color(0x86a873),
  am5.color(0xbb9f06)
]);
```

## Legend

```js
const legend = chart.children.push(am5.Legend.new(root, {
  centerX: am5.percent(50),
  x: am5.percent(50),
  layout: root.horizontalLayout  // or verticalLayout, gridLayout
}));
// XY charts:
legend.data.setAll(chart.series.values);
// Pie/Percent charts:
legend.data.setAll(series.dataItems);
```

## Tooltip

```js
series.set("tooltip", am5.Tooltip.new(root, {
  labelText: "{name}: {valueY}"   // data placeholders in {}
}));
```

**Placeholders:** `{name}`, `{valueX}`, `{valueY}`, `{categoryX}`, `{categoryY}`, `{value}`, `{category}`, `{valuePercentTotal}`, `{sum}`.

**Inline formatting:** `"[bold]{name}[/]: [fontSize: 20px]{value}[/]"`

**A tooltip with no text renders as an empty bubble.** Enabling a `am5.Tooltip` without `labelText` (or `series.tooltipText`) shows a blank tooltip. Series text lives on `tooltip.labelText` or `series.set("tooltipText", ...)`; for column/bar charts the text usually goes on `series.columns.template.set("tooltipText", "{categoryX}: {valueY}")`.

### Styling a tooltip

The tooltip background is a **`PointedRectangle`** (NOT a `RoundedRectangle`), so it has a single `cornerRadius` — there are no `cornerRadiusTL/TR/BL/BR`:

```js
const tooltip = am5.Tooltip.new(root, { labelText: "{valueY}" });

// Background color + shape — must turn OFF getFillFromSprite, else bg copies the series color
tooltip.set("getFillFromSprite", false);
tooltip.get("background").setAll({
  fill: am5.color(0x000000),
  fillOpacity: 0.8,
  stroke: am5.color(0xffffff),
  strokeOpacity: 0.3,
  cornerRadius: 6        // single radius — PointedRectangle, not four corners
});

// Text color — must turn OFF autoTextColor (it auto-picks for contrast), then set on the label
tooltip.set("autoTextColor", false);
tooltip.label.setAll({ fill: am5.color(0xffffff) });   // tooltip.label is read-only accessor

series.set("tooltip", tooltip);
```

`getStrokeFromSprite` (default `false`) copies the sprite's stroke color when `true`.

## Chart title

Do NOT add titles as HTML elements — they are outside the canvas and won't appear in exports. Add an `am5.Label` to the container BEFORE the chart, and set `verticalLayout`:

```js
// Option 1: directly on root.container
root.container.children.push(am5.Label.new(root, {
  text: "Chart Title",
  fontSize: "1.3em",
  x: am5.p50,
  centerX: am5.p50
}));
root.container.set("layout", root.verticalLayout);

var chart = root.container.children.push(am5xy.XYChart.new(root, { ... }));

// Option 2: with a wrapper container
var container = root.container.children.push(am5.Container.new(root, {
  width: am5.p100,
  height: am5.p100,
  layout: root.verticalLayout
}));
container.children.push(am5.Label.new(root, {
  text: "Chart Title",
  fontSize: "1.3em",
  x: am5.p50,
  centerX: am5.p50
}));
var chart = container.children.push(am5xy.XYChart.new(root, { ... }));
```

## Exporting

```js
import * as am5plugins_exporting from "@amcharts/amcharts5/plugins/exporting";

const exporting = am5plugins_exporting.Exporting.new(root, {
  menu: am5plugins_exporting.ExportingMenu.new(root, {}),
  filePrefix: "my-chart",
  pngOptions: { quality: 0.8 },
  pdfOptions: { addURL: true }
});
```

## Responsive rules

```js
import am5themes_Responsive from "@amcharts/amcharts5/themes/Responsive";

const responsive = am5themes_Responsive.new(root);
responsive.addRule({
  relevant: am5themes_Responsive.widthXS,  // <= 200px
  applying: function() {
    legend.setAll({ visible: false });
  },
  removing: function() {
    legend.setAll({ visible: true });
  }
});
root.setThemes([am5themes_Animated.new(root), responsive]);
```

## Heat rules

Color or size elements by value. Requires `calculateAggregates: true` on the series (unless `minValue`/`maxValue` are set manually).

```js
// Color columns by value
series.set("heatRules", [{
  target: series.columns.template,
  dataField: "valueY",
  min: am5.color(0xe5dc36),
  max: am5.color(0x5faa46),
  key: "fill"
}]);

// Scale bullet radius by value
series.set("heatRules", [{
  target: bulletTemplate,        // am5.Template.new({})
  dataField: "value",
  min: 3,
  max: 30,
  key: "radius"
}]);
```

**Heat rule settings:**

| Setting | Type | Description |
|---------|------|-------------|
| `target` | Template | Element template to apply heat to |
| `key` | string | Setting to modify: `"fill"`, `"radius"`, `"opacity"`, `"strokeWidth"`, `"fontSize"`, etc. |
| `dataField` | string | Data field for the value: `"valueY"`, `"value"`, `"valueX"`, etc. |
| `min` | color/number | Value applied at the lowest data value |
| `max` | color/number | Value applied at the highest data value |
| `minValue` | number | Override auto-calculated min (skips `calculateAggregates`) |
| `maxValue` | number | Override auto-calculated max (skips `calculateAggregates`) |
| `customFunction` | function | `(sprite, min, max, value)` — full control over the rule |

**Using heat rules on bullets** — bullets need an explicit `am5.Template`:

```js
var circleTemplate = am5.Template.new({});

series.bullets.push(function() {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      fill: series.get("fill"),
      tooltipText: "{valueX}: {valueY}"
    }, circleTemplate)              // pass template as 3rd arg
  });
});

series.set("heatRules", [{
  target: circleTemplate,
  dataField: "valueY",
  min: 3,
  max: 25,
  key: "radius"
}]);
```

**HeatLegend:**

```js
var heatLegend = chart.children.push(am5.HeatLegend.new(root, {
  orientation: "horizontal",       // or "vertical"
  startColor: am5.color(0xe5dc36),
  endColor: am5.color(0x5faa46),
  startText: "Low",
  endText: "High",
  stepCount: 5                     // number of color stops
}));

// Sync legend range with series data
series.events.on("datavalidated", function() {
  heatLegend.set("startValue", series.getPrivate("valueLow"));
  heatLegend.set("endValue", series.getPrivate("valueHigh"));
});
```

## Animations

```js
series.appear(1000);        // duration in ms
chart.appear(1000, 100);    // duration, delay
```

## Events

```js
// Interaction events on elements
series.columns.template.events.on("click", (ev) => {
  console.log("Clicked:", ev.target.dataItem.dataContext);
});

// Common events: click, pointerover, pointerout, pointerdown, globalpointermove

// Series/chart lifecycle events
series.events.on("datavalidated", () => {
  // Fires after data is processed — safe to read dataItems
});

// Axis zoom/scroll — watch start/end settings, not events
xAxis.on("start", () => {
  console.log("Zoomed/scrolled");
});
xAxis.on("end", () => {
  console.log("Zoomed/scrolled");
});

// Setting change watch
sprite.on("width", (width) => {
  console.log("Width changed to", width);
});

// One-time listener
series.events.once("datavalidated", () => { /* runs once */ });

// Remove listener
const disposer = sprite.events.on("click", handler);
disposer.dispose(); // removes the listener
```

## Settings API

```js
// Set after creation
sprite.set("fill", am5.color(0xff0000));
sprite.setAll({ fill: am5.color(0xff0000), strokeWidth: 2 });

// Read current value
const fill = sprite.get("fill");
const width = sprite.getPrivate("width"); // read-only internal values

// set() RETURNS the value — handy for capturing the created object inline:
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
```

**Reading back a `Percent`:** a `Percent` exposes two numbers — `.percent` is the 0–100 value, `.value` is the normalized 0–1 fraction. `am5.percent(50).percent === 50` but `am5.percent(50).value === 0.5`. When you read a percent setting back (e.g. `sprite.get("x")` after setting `am5.percent(50)`), use `.percent` for a 0–100 number; `.value` gives `0.5`.

**Reading animated settings is unreliable mid-animation.** Right after `series.appear()` / `chart.appear()`, animated settings like `opacity` are still transitioning — `get("opacity")` can return `0` (the start value). Read such settings after the animation completes, or don't persist values read during appear (a common way to accidentally bake `opacity:0` into generated code).

## Dynamic data

```js
// Replace all data (full redraw, NO animation)
series.data.setAll(newData);

// Add items
series.data.push({ category: "New", value: 42 });

// Update item at index — this ANIMATES the change
series.data.setIndex(0, { category: "Updated", value: 99 });

// IMPORTANT: To update data WITH animation, use setIndex() per item.
// setAll() replaces everything at once — no transition animation.
// Loop through items for animated updates:
// newData.forEach(function(item, i) { series.data.setIndex(i, item); });

// Remove item at index
series.data.removeIndex(2);

// Insert at specific position
series.data.insertIndex(1, { category: "Inserted", value: 50 });

// Iterating dataItems — dataItems is a PLAIN ARRAY, not a List
// ❌ series.dataItems.each(fn)                              — will throw, .each() does not exist
// ✅ am5.array.each(series.dataItems, function(dataItem) {}) — amCharts array utility
// ✅ series.dataItems.forEach(function(dataItem) {})         — standard JS
```

## Adapters

```js
// Dynamically modify a setting value before it's applied
series.columns.template.adapters.add("fill", (fill, target) => {
  return target.dataItem.get("valueY") > 100
    ? am5.color(0x00cc00)
    : am5.color(0xcc0000);
});

// Adapter on axis labels
xAxis.get("renderer").labels.template.adapters.add("text", (text, target) => {
  return text + "!";
});
```

## States

```js
// Hover state — applied automatically on pointer over
series.columns.template.states.create("hover", {
  fillOpacity: 0.8,
  scale: 1.05
});

// Active state — toggled via click
series.columns.template.states.create("active", {
  fill: am5.color(0xff0000)
});

// Built-in state names: "default", "hover", "active", "disabled", "hidden"
// State animation: stateAnimationDuration, stateAnimationEasing
```

## Custom themes

```js
const myTheme = am5.Theme.new(root);
myTheme.rule("Label").setAll({ fontSize: 12, fill: am5.color(0x555555) });
myTheme.rule("Grid").setAll({ stroke: am5.color(0xe0e0e0) });
root.setThemes([am5themes_Animated.new(root), myTheme]);
// Theme order matters: later themes override earlier ones
```

## Dark theme

When the page has a dark background, add the Dark theme so labels, grid, and tooltips are readable:

```js
root.setThemes([
  am5themes_Animated.new(root),
  am5themes_Dark.new(root)        // must come after Animated
]);
```

Import: `import am5themes_Dark from "@amcharts/amcharts5/themes/Dark"` or CDN `themes/Dark.js`.

**Rule:** Only add Dark theme when the background is clearly dark. Default to white/light background with no Dark theme.

## ColorSet — using default colors

amCharts assigns colors automatically via a built-in ColorSet. Do not invent custom palettes unless the user asks.

```js
// Get the chart's default color set
var colors = chart.get("colors");       // XY, Radar, Percent charts only
var colors = series.get("colors");      // pie/percent charts use series-level colors

// MapChart has NO built-in ColorSet — create your own:
var colors = am5.ColorSet.new(root, {});

// Get a specific color by index (does not advance internal counter)
var color = colors.getIndex(0);         // first default color
var color = colors.getIndex(3);         // fourth default color

// Get next color in sequence (advances internal counter)
var color = colors.next();

// Reset counter back to start
colors.reset();

// Override the default palette (only if user requests specific colors)
colors.set("colors", [
  am5.color(0x095256),
  am5.color(0x087f8c),
  am5.color(0x5aaa95)
]);
```

## Data processor

```js
// Auto-convert fields when loading external / API data
series.data.processor = am5.DataProcessor.new(root, {
  dateFields: ["date"],
  dateFormat: "yyyy-MM-dd",
  numericFields: ["value", "count"],
  colorFields: ["color"],
  emptyAs: 0  // replace null/empty with 0
});
// Configure processor BEFORE setting data
```

## Accessibility

```js
series.columns.template.setAll({
  focusable: true,
  ariaLabel: "{categoryX}: {valueY}",
  role: "figure"
});
// Keyboard: TAB to navigate focusable elements, ENTER to click
// focusableGroup: "series1" — TAB to first, arrows within group
```

## Container & Layout

```js
// Containers organize child elements
const container = root.container.children.push(am5.Container.new(root, {
  width: am5.percent(100),
  height: am5.percent(100),
  layout: root.verticalLayout  // also: horizontalLayout, gridLayout
}));

// Padding and margin
container.setAll({
  paddingTop: 10,
  paddingBottom: 10,
  marginLeft: 20
});
```

**Layout options:**

| Layout | Access | Behavior |
|--------|--------|----------|
| Vertical | `root.verticalLayout` | Children stacked top-to-bottom |
| Horizontal | `root.horizontalLayout` | Children in a row left-to-right |
| Grid | `root.gridLayout` | Multi-column grid |
| Custom grid | `am5.GridLayout.new(root, { maxColumns: 3 })` | Grid with custom column count |
| None | omit `layout` | Children placed at x/y coordinates |

Use layouts to arrange charts, legends, controls, and labels within containers.

## UI Elements

amCharts 5 provides built-in interactive UI widgets. **Prefer these over HTML elements** when building controls, unless instructed otherwise. Read `references/ui-elements.md` for full API and examples.

| Element | Class | Description |
|---------|-------|-------------|
| Button | `am5.Button` | Clickable button with label, icon, background, hover/down/active states |
| Slider | `am5.Slider` | Single-value slider (0-1 range), fires `rangechanged` event |
| Scrollbar | `am5.Scrollbar` | Two-grip range selector, `orientation: "horizontal"\|"vertical"` |
| NumericStepper | `am5.NumericStepper` | Number input with up/down arrows |
| ProgressPie | `am5.ProgressPie` | Circular progress indicator with `value`, `radius`, `innerRadius` |
| SpriteResizer | `am5.SpriteResizer` | Drag-to-resize handles on any sprite |
| EditableLabel | `am5.EditableLabel` | Label that becomes editable text field on click |
| Modal | `am5.Modal` | HTML overlay dialog with `open()`/`close()` |
| ColorPicker | `am5plugins_colorPicker.ColorPicker` | Color picker (requires `plugins/colorPicker.js`) |

**Quick example — slider + button controlling a chart:**

```js
// Slider to control a value
var slider = container.children.push(am5.Slider.new(root, {
  orientation: "horizontal",
  start: 0.5,
  width: am5.percent(80),
  centerX: am5.percent(50),
  x: am5.percent(50)
}));
slider.events.on("rangechanged", function(ev) {
  var value = ev.start;  // 0-1 range
  // update chart based on slider position
});

// Button
var button = container.children.push(am5.Button.new(root, {
  label: am5.Label.new(root, { text: "Reset" }),
  centerX: am5.percent(50),
  x: am5.percent(50)
}));
button.events.on("click", function() {
  slider.set("start", 0.5);
});
```

## Disposal (SPA frameworks)

```js
// React
useLayoutEffect(() => {
  const root = am5.Root.new("chartdiv");
  // ... build chart
  return () => { root.dispose(); };
}, []);

// Angular
ngOnDestroy() { this.root?.dispose(); }

// Vue
onUnmounted(() => { root.dispose(); });
```

**Always call `root.dispose()`** — this cleans up all children, series, and event listeners.

## v4 > v5 migration pitfalls

| v4 pattern (WRONG) | v5 equivalent (CORRECT) |
|-----------|--------------|
| `am4core.create("div", am4charts.XYChart)` | `am5.Root.new("div")` + `am5xy.XYChart.new(root, {})` |
| `new am4charts.LineSeries()` | `am5xy.LineSeries.new(root, {})` |
| `series.dataFields.valueY = "val"` | `valueYField: "val"` in `.new()` settings |
| `chart.data = [...]` | `series.data.setAll([...])` |
| `am4core.color("#f00")` | `am5.color(0xff0000)` |
| `am4core.percent(50)` | `am5.percent(50)` |
| `chart.dispose()` | `root.dispose()` |
| `chart.legend = new am4charts.Legend()` | `chart.children.push(am5.Legend.new(root, {}))` |

## Common pitfalls

1. **Using `new` keyword** — always use `.new()` factory.
2. **Forgetting `CategoryAxis.data.setAll()`** — axis will be empty.
3. **Passing Date objects to DateAxis** — must be timestamps (ms).
4. **Missing axis renderer** — every axis needs `renderer: am5xy.AxisRendererX.new(root, {})`.
5. **Setting data before configuration** — configure everything, then set data last.
6. **Raw hex strings for colors** — use `am5.color()`.
7. **Mixing v4 and v5 API** — they are completely incompatible.
8. **Calling `chart.dispose()` instead of `root.dispose()`** — always dispose root.
9. **Using CSS to style chart elements** — amCharts renders on Canvas, not DOM.
10. **Wrong package import** — check the package map table above.
11. **Calling `.each()` on `dataItems`** — `series.dataItems` is a plain array, not an amCharts `List`. Use `am5.array.each(series.dataItems, fn)` or standard `forEach`/`for` loops. Only `series.data` (the `ListData` object) has `.each()`.
12. **CDN script load order** — `index.js` must load first, then `xy.js`, then any package that depends on it (`radar.js`, `timeline.js`, `gantt.js`). Wrong order causes runtime errors. Correct order: `index.js` > `xy.js` > `radar.js` / `timeline.js` / `gantt.js` > `themes/*.js`.
13. **No `minorGrid` / `minorTicks` / `minorLabels` objects** — These do not exist on axes. Minor grid is enabled via boolean flags on the **renderer**: `minorGridEnabled: true` and optionally `minorLabelsEnabled: true`. Styling is done through theme rules targeting the `"minor"` tag, not through separate object properties.
14. **Flow chart animated bullets go on `series.bullets`, NOT `series.links.template.bullets`** — To animate labels/circles flowing along Sankey or Chord links, use `series.bullets.push(function(...) { ... })`. Animate `bullet.locationX` (Sankey) or `bullet.locationY` (Chord) from 0>1 with `loops: Infinity`. Use an adapter on opacity for fade effect. See `references/flow.md` > "Animated bullets along links".
15. **`MapPointSeries` needs `latitudeField`/`longitudeField` when using `data.setAll()`** — If point data has `latitude`/`longitude` fields, the series must declare them: `am5map.MapPointSeries.new(root, { latitudeField: "latitude", longitudeField: "longitude" })`. Without these, points silently won't appear. This is NOT needed when using `pushDataItem({ latitude: ..., longitude: ... })` which passes coordinates directly.
16. **`data.setAll()` does NOT animate — use `data.setIndex()` for animated updates** — When the user asks to update/refresh data with animation, do NOT use `series.data.setAll(newData)` — it replaces everything instantly with no transition. Instead, update each item with `series.data.setIndex(i, newItem)` which triggers smooth value animation. For full replacement with animation, loop: `newData.forEach(function(item, i) { series.data.setIndex(i, item); })`.
17. **`color.lighten()` / `color.darken()` are NOT instance methods** — `am5.color(0xff0000).lighten(0.3)` does NOT work. Use static methods: `am5.Color.lighten(color, 0.3)` to lighten, `am5.Color.lighten(color, -0.3)` to darken. There is NO `darken()` method — use negative lighten. Also available: `am5.Color.brighten()`, `am5.Color.saturate()`.
18. **Venn diagram has no `VennDiagram` class** — `am5venn.Venn` is pushed directly into a `Container`, NOT into a chart's `series`. See `references/venn.md`.
19. **Timeline `AxisRendererCurveX` requires `yRenderer`** — Always create the Y renderer first, then pass it: `am5timeline.AxisRendererCurveX.new(root, { yRenderer: yRenderer })`. Without this, crashes with `Cannot read properties of undefined (reading 'axis')`.
20. **Gantt data uses TWO separate calls** — Do NOT use `chart.data.setAll()`. Set categories on `chart.yAxis.data.setAll([{id, name, parentId, color}])` and tasks on `chart.series.data.setAll([{id, start, duration, progress, linkTo}])`. Use flat `parentId` for hierarchy, NOT nested `children` arrays. CDN order: `index.js` > `xy.js` > `plugins/colorPicker.js` > `gantt.js` > `themes/Animated.js` (gantt.js webpack-depends on colorPicker chunk). See `references/gantt.md`.
21. **No continent-level geodata at top-level CDN** — `geodata/europeLow.js` does NOT exist. Use `geodata/region/world/europeLow.js` (global: `am5geodata_region_world_europeLow`) or filter `worldLow` with `include: [...]`.
22. **Do not add chart titles as HTML** — HTML titles are outside the canvas and won't appear in exports. Use `am5.Label` pushed into the container BEFORE the chart, with `verticalLayout` on the container. See "Chart title" section above.
23. **`XYChartScrollbar` axes — never use `scrollbar.get("xAxis")`** — The axes passed to the scrollbar constructor are NOT stored as gettable settings. Create axes as separate variables, pass them to the scrollbar, and reuse those same variables for the scrollbar's inner series. `scrollbar.get("xAxis")` returns `undefined`.
24. **`am5.color()` only accepts hex integers or CSS strings** — `am5.color(0xff0000)`, `am5.color("#ff0000")`, `am5.color("rgb(255,0,0)")` are valid. `am5.color({ r: 255, g: 0, b: 0 })` is NOT — it throws.
25. **`MapChart` has NO `"colors"` setting** — `chart.get("colors")` returns `undefined` on `MapChart`. Only XY, Radar, and Percent charts auto-create a ColorSet. For maps, create your own: `am5.ColorSet.new(root, {})`.
26. **`VoronoiTreemap` has NO `.rectangles` property** — Unlike `Treemap` (which has `series.rectangles.template`), `VoronoiTreemap` renders organic polygon cells. Style via `series.nodes.template` and its children, not `.rectangles`.
27. **Labels with data placeholders need `populateText: true`** — When a Label uses data field placeholders like `text: "{name}"`, you MUST also set `populateText: true`. Without it, the placeholder is not resolved and the label appears blank. This applies everywhere Labels display dynamic data — bullet labels, map point labels, etc. Example: `am5.Label.new(root, { text: "{name}", populateText: true, ... })`.
28. **Easing: `am5.ease.in()` does NOT exist** — amCharts 5 provides base easing functions (`am5.ease.cubic`, `am5.ease.bounce`, `am5.ease.elastic`, `am5.ease.linear`, `am5.ease.quad`, `am5.ease.sine`, `am5.ease.circle`, `am5.ease.exp`, `am5.ease.pow`) and three modifiers: `am5.ease.out()`, `am5.ease.inOut()`, `am5.ease.yoyo()`. Usage: `am5.ease.cubic` (ease-in by default), `am5.ease.out(am5.ease.cubic)` (ease-out), `am5.ease.inOut(am5.ease.cubic)` (ease in+out). There is NO `am5.ease.in()` — using it throws a runtime error. The base functions already ease-in by default.
29. **`forceHidden` vs `visible`** — `forceHidden: true` ALWAYS hides an element, immune to states, themes/library and even `show()`. `visible` is weaker: amCharts re-manages it on many elements (notably cursor lines, but also labels, ticks, tooltips, grid) in response to interaction or data changes, so a `visible: false` you set may be flipped back to `true`. Rules of thumb: for a **persistent hide**, use `forceHidden: true` (`cursor.lineX.set("forceHidden", true)`, `yRenderer.labels.template.set("forceHidden", true)`, `xRenderer.grid.template.set("forceHidden", true)`). To **reveal** an element that defaults hidden — notably **axis ticks** (`ticks.template` defaults to `visible:false`) — you must raise `visible: true`; flipping `forceHidden` alone won't show it. For cursor lines specifically, always access `cursor.lineX`/`cursor.lineY` after creation — do NOT pass them as constructor options.
30. **`snapTooltip: true` on series for cursor tooltip snapping** — When using a cursor and you want tooltips to snap to data points, set `snapTooltip: true` on the series in addition to (or instead of) `snapToSeries` on the cursor. This is especially useful for timeline/curve charts.
31. **Globe rotation uses negative coordinates** — To center the globe (`geoOrthographic`) on a geographic point, set `rotationX` to **-longitude** and `rotationY` to **-latitude**. E.g., to center on Paris (48.86°N, 2.35°E): `chart.animate({ key: "rotationX", to: -2.35 }); chart.animate({ key: "rotationY", to: -48.86 });`. Using positive values rotates the globe the wrong way.
32. **`positionOnLine` with multi-segment lines limits per-segment control** — `MapPointSeries` data items can animate along a line via `positionOnLine` (0>1). If the line has 3+ points (multi-segment), position 0.5 is the midpoint of the *entire* path, making per-segment effects (scaling at each segment midpoint, pausing between segments, etc.) difficult. For advanced per-segment animations, use **single-segment lines** (2 points each) and animate the bullet across them sequentially. E.g., instead of one line [A,B,C,D], create [A,B], [B,C], [C,D].
33. **Do NOT exclude Antarctica (`exclude: ["AQ"]`) by default** — Many amCharts demos exclude Antarctica because they use Mercator projection where it appears disproportionately large. This is a demo-specific choice, not a best practice. Unless the user explicitly asks to exclude Antarctica, or references a demo that does so, keep Antarctica in the map. With non-Mercator projections (`geoNaturalEarth1`, `geoEqualEarth`, `geoOrthographic`, `geoEquirectangular`), Antarctica renders at a reasonable size.

## Easing functions

amCharts 5 easing functions live under `am5.ease`:

```js
// Base functions (ease-in by default):
am5.ease.linear    am5.ease.quad     am5.ease.cubic
am5.ease.sine      am5.ease.circle   am5.ease.exp
am5.ease.pow       am5.ease.bounce   am5.ease.elastic

// Modifiers — wrap a base function:
am5.ease.out(am5.ease.cubic)      // ease-out
am5.ease.inOut(am5.ease.cubic)    // ease in + out
am5.ease.yoyo(am5.ease.cubic)     // animate to end, then back to start

// Usage in .animate():
sprite.animate({
  key: "y", to: 100, duration: 400,
  easing: am5.ease.out(am5.ease.cubic)
});
```

**There is NO `am5.ease.in()`** — the base functions already ease-in by default.

## Validate generated code (if you can execute commands)

If you have the ability to run shell commands, validate your generated chart code before delivering it to the user:

1. Save the complete HTML+JS to a temp `.html` file
2. Open it in a headless browser (Puppeteer, Playwright, or similar) and collect console errors for a few seconds
3. If JavaScript errors are found, fix them and re-validate

Skip this step entirely if you cannot execute code (e.g., chat-only context with no tool access).

## Recent API changes (newer than the bundled class reference)

The bundled per-class API reference was snapshotted on **2026-03-15**, so it predates the changes below. Prefer these names/settings; for anything newer, verify against the live docs (see next section).

**Renamed settings (old name still works but is deprecated — use the new one):**

| Class(es) | Old | New | Since |
|-----------|-----|-----|-------|
| `MovingAverage`, `MovingAverageDeviation`, `MovingAverageEnvelope`, `BollingerBands` | `type` | `maType` | 5.18.0 |
| `VoronoiTreemap` | `type` | `shapeType` | 5.18.0 |

```js
// Moving-average indicators: use maType, not type
am5stock.MovingAverage.new(root, { maType: "exponential", period: 20 });
am5hierarchy.VoronoiTreemap.new(root, { shapeType: "rectangle" }); // was: type
```

**New settings / methods worth knowing:**
- `Tree`: `fitNodes` (5.18.0, exclude hidden nodes from layout), `nodeSeparation` (5.16.2, custom node-spacing fn), `clustered` (5.16.2, dendrogram layout — leaves at same depth).
- `ValueAxis`: `syncZeros` (5.16.2, align zero across synced axes — needs `syncWithAxis`).
- `Hierarchy`: `parentIdField` setting + `setFlatData(data)` method (5.16.2) — feed flat `{id, parentId}` data instead of nested `children`.
- All entities: `onDebounced(key, cb, delay)` / `offDebounced(key, cb?)` and `onPrivateDebounced` / `offDebouncedPrivate` (5.17.3) — fire once after rapid changes settle.
- `Label`: `fontFamily: "inherit"` (5.17.3) uses the chart container's computed font.
- `MapSankeySeries` (5.17.0) — Sankey overlaid on a map; auto-resolves `sourceId`/`targetId` once `polygonSeries` geoJSON loads (5.17.1), so no `datavalidated` wrapper needed. See `references/map.md`.
- `MapPointSeries` defaults changed to `longitudeField: "longitude"`, `latitudeField: "latitude"` (5.16.1).

## Verify unfamiliar API before using it

If you are unsure whether a method, property, or setting exists on an amCharts 5 class, **verify it before using it**. Check the class reference (class name in lowercase, e.g. `LineSeries` > `lineseries`):

1. **Primary:** `https://www.amcharts.com/docs/v5/reference/{classname}/` — e.g. `https://www.amcharts.com/docs/v5/reference/lineseries/`
2. **Fallback (if primary is unavailable):** Check the TypeScript source on GitHub — `https://raw.githubusercontent.com/amcharts/amcharts5/master/src/.internal/charts/` and navigate to the relevant file. Settings interfaces are named `I{ClassName}Settings`.

Common source file paths:
- XY series: `charts/xy/series/{ClassName}.ts`
- XY axes: `charts/xy/axes/{ClassName}.ts`
- Pie: `charts/percent/pie/{ClassName}.ts`
- Radar: `charts/radar/{ClassName}.ts`
- Map: `charts/map/{ClassName}.ts`
- Hierarchy: `charts/hierarchy/{ClassName}.ts`
- Flow: `charts/flow/{ClassName}.ts`
- Core sprites: `core/render/{ClassName}.ts`
