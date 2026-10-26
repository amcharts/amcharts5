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

Docs: https://docs.amcharts.com/v5/

## Critical rules — apply to ALL chart types

1. **Check demos first (if you can browse the web)** — Before building a chart, search or browse https://www.amcharts.com/demos/ for a demo that matches the user's request. Demo source code is the most reliable starting point — adapt it rather than writing from scratch. Skip this step if you have no web access.
2. **Read the docs (if you can browse the web)** — For unfamiliar features or configuration, check https://docs.amcharts.com/v5/ for guides and tutorials. The docs explain concepts, patterns, and options that the class reference alone does not. Skip if you have no web access.
3. **Always use amCharts 5** — never v3 or v4. The APIs are completely different.
4. **Use `.new()` factory** — never `new ClassName()`. Every object is created via `ClassName.new(root, { settings })`.
5. **Root is always the first argument** to `.new()` (except Root itself, which takes a div ID).
6. **Set data last** — once data is set, objects are created. Configuration applied after may not take effect.
7. **Colors use `am5.color()`** — e.g. `am5.color(0xff0000)`, `am5.color("#ff0000")`, or `am5.color("rgb(255,0,0)")`. Never raw hex strings.
8. **Percent values use `am5.percent()`** — e.g. `am5.percent(50)`, not `50` or `"50%"`.
9. **Every axis needs a renderer** — `am5xy.AxisRendererX.new(root, {})` or `AxisRendererY`.
10. **CategoryAxis must receive data** — call `xAxis.data.setAll(data)` in addition to series data. Forgetting this is the #1 bug.
11. **DateAxis values must be timestamps** — use `new Date().getTime()`, not Date objects.
12. **Disposal is mandatory in SPAs** — in React, Vue, Angular, Svelte or React Native use amCharts' framework package, which creates and disposes the root for you (see "Frameworks"); without one, call `root.dispose()` on component unmount. Not `chart.dispose()`.
13. **Style through amCharts, not CSS** — charts draw on canvas by default, so CSS cannot reach chart internals. Even with the optional SVG renderer (5.21.0) the shapes carry no per-element classes or ids, are rewritten as the chart redraws, and exports ignore page CSS. Use amCharts settings/templates/themes instead.
14. **Dark backgrounds require Dark theme** — If the user requests or the page clearly has a dark background, always add `am5themes_Dark.new(root)` to `root.setThemes()` alongside Animated. Without it, labels, grid, and tooltips will be invisible. If the background is not clearly dark, default to white/light and do NOT add the Dark theme unless asked.
15. **Use default amCharts colors** — Do NOT invent custom color palettes unless the user explicitly asks for specific colors. amCharts assigns colors automatically from its built-in ColorSet. If you need a color programmatically, use `chart.get("colors").getIndex(index)` or `chart.get("colors").next()`. For pie/percent charts, use `series.get("colors")` instead.

## Package / module map

| Chart family | ES module import | CDN script | Main classes |
|-------------|-----------------|-----------|-------------|
| Core | `@amcharts/amcharts5` | `index.js` | Root, Theme, Legend, Tooltip, Label, Container |
| XY charts | `@amcharts/amcharts5/xy` | `xy.js` | XYChart, axes, series |
| Pie / Sliced | `@amcharts/amcharts5/percent` | `percent.js` | PieChart, SlicedChart, PieSeries, FunnelSeries, PyramidSeries, PictorialStackedSeries |
| Map | `@amcharts/amcharts5/map` | `map.js` | MapChart, MapPolygonSeries, MapPointSeries, MapLineSeries, MapSankeySeries, PixelMapSeries, MapRasterSeries, NightSeries |
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
| JSON | `@amcharts/amcharts5/plugins/json` | `plugins/json.js` | ChartSerializer, JsonParser |
| Chart element (5.21.0) | `@amcharts/amcharts5/element` | `element.js` (after `plugins/json.js`) | `<am5-chart>` — see "Serializing to JSON" |
| Framework packages | `@amcharts/amcharts5-react`, `-vue`, `-angular`, `-svelte`, `-react-native` (separate npm packages) | — | `useAmChart`, `<AmChart>`, `[amChart]`, `attachAmChart` — see "Frameworks" |

## Which reference to read

Based on the chart type the user is building, read the relevant reference file for detailed API, patterns, and examples:

| User wants | Read |
|-----------|------|
| Line, area, bar, column, candlestick, OHLC, scatter, stacked charts | `references/xy.md` |
| Pie, donut, semi-circle, funnel, pyramid, pictorial stacked charts | `references/pie.md` |
| World map, country map, choropleth, bubble map, point map, map sankey, pixel/dot map, satellite image or day/night map, globe with raised arcs | `references/map.md` |
| Treemap, sunburst, force-directed, pack, partition, tree, org chart | `references/hierarchy.md` |
| Sankey, chord, arc diagram, alluvial, flow visualization | `references/flow.md` |
| Radar, spider, polar chart, gauge, speedometer, meter | `references/radar.md` |
| Financial stock chart, candlestick with indicators, trading chart | `references/stock.md` |
| Serpentine, spiral, curve chart, custom-shape timeline | `references/timeline.md` |
| Gantt chart, project timeline, task management chart | `references/gantt.md` |
| Word cloud, tag cloud, sentence cloud | `references/wordcloud.md` |
| Venn diagram, set overlap visualization | `references/venn.md` |
| Interactive controls: buttons, sliders, steppers, color pickers | `references/ui-elements.md` |
| A chart as a JSON config: "JSON config", "amCharts JSON", a `<am5-chart>` element, a framework package's `config` prop, a Chart Maker link | `references/json.md` (with the chart type's reference for its settings) |

If the chart type is unclear, start with `references/xy.md` — XY charts are by far the most common.

If the user asks about core setup (theming, colors, exporting, legends, tooltips, disposal, responsive) without a specific chart type, the information below is sufficient — no reference file needed. For a chart in a React, Vue, Angular, Svelte or React Native app, read "Frameworks" below as well as the chart type's reference.

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

**Canvas or SVG (5.21.0).** Charts draw on canvas by default. `am5.SVGRenderer` draws the same chart as live SVG instead — it can only be chosen when the root is created:

```js
const root = am5.Root.new("chartdiv", { renderer: am5.SVGRenderer });
// or, before creating any root, for every chart on the page:
am5.Root.defaultRenderer = am5.SVGRenderer;
```

Charts look and behave the same with either (text is measured the same way, interaction and image export work as usual); only blend modes `DST_OVER`, `SRC_ATOP` and `XOR` are canvas-only (drawn as normal in SVG, with a console warning). Keep the canvas default unless the user asks for SVG in the page. An SVG **file** does not need it — `am5.renderToSVG()` and the exporting menu make SVG from either renderer (see "Exporting"). In SVG mode pointer input is still resolved by amCharts (the `<svg>` layers have `pointer-events="none"`), so attach handlers with `events.on()`, not DOM listeners.

**Available themes** (as of 5.20.0):

| Kind | Themes |
|------|--------|
| Behavioral | `Animated` (animations), `Micro` (stripped-down micro charts), `Responsive` (size-based rules) |
| Light palettes | `Dataviz`, `Frozen`, `Kelly`, `Material`, `Moonrise`, `Spirited`, `Ember`, `Nord`, `Pastel`, `Petroleum`, `Savanna`, `Colorblind` (Okabe-Ito, color-blindness safe), `Patterns` (pattern fills instead of flat colors) |
| Dark | `Dark`, `Midnight`, plus a dark variant of most palettes: `DatavizDark`, `FrozenDark`, `KellyDark`, `MaterialDark`, `MoonriseDark`, `SpiritedDark`, `NordDark`, `PastelDark`, `ColorblindDark`, `PatternsDark` |
| Parameterized (5.20.0) | `Monochrome`, `Adaptive` — see below |

Palette themes are additive: combine with `Animated`, e.g. `root.setThemes([am5themes_Animated.new(root), am5themes_Nord.new(root)])`. The `*Dark` variants already carry dark interface colors, so do NOT also add `Dark`.

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

// A color on a scale through several colors (5.21.2): position 0–1, clamped, colors evenly spaced
var ic = root.interfaceColors;
var mid = am5.Color.interpolateColors(0.5, [ic.get("negative"), ic.get("warning"), ic.get("positive")]);   // = warning
```

The interface color `warning` (5.21.2) is a yellow between `negative` (red) and `positive` (green), for the middle of a bad-to-good scale. Prefer `interpolateColors()` through it over `am5.Color.interpolate(t, negative, positive)`, whose middle is brown.

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

### Shared vs per-sprite tooltip

Setting **only** `tooltipText` on a sprite (no `tooltip:` instance anywhere on it) is enough to get a hover tooltip: the sprite lazily resolves the **Root's shared default `Tooltip`** (`sprite.getTooltip()` returns it). You only need your own `am5.Tooltip.new(root, {...})` when that element's tooltip must **look different** from the shared one, or on XY charts, where series/axis tooltips are **cursor-driven** rather than hover-driven and need their own instance.

So for non-XY charts do not create a Tooltip per series — set `tooltipText` on the right template and style the look once on the shared tooltip:

```js
// Where tooltipText goes on non-XY charts
pieSeries.slices.template.set("tooltipText", "{category}: {value}");   // pie / funnel / venn slices
hierarchySeries.nodes.template.set("tooltipText", "{category}: {sum}"); // hierarchy nodes
flowSeries.nodes.nodes.template.set("tooltipText", "{name}");           // flow nodes
flowSeries.links.template.set("tooltipText", "{sourceId} > {targetId}: {value}"); // flow links
wordCloud.labels.template.set("tooltipText", "{category}: {value}");    // word cloud words
polygonSeries.mapPolygons.template.set("tooltipText", "{name}");        // map polygons (map points: the bullet sprite)

// Style the shared tooltip once — it lives on root.container (applies everywhere no dedicated Tooltip was set)
var shared = root.container.get("tooltip");
shared.set("getFillFromSprite", false);
shared.get("background").setAll({ fill: am5.color(0x000000), fillOpacity: 0.8 });
```

## Chart title

Do NOT add titles as HTML elements — they are outside the chart and won't appear in exports. Add an `am5.Label` to the container BEFORE the chart, and set `verticalLayout`:

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

**SVG export (5.21.0)** works whichever renderer draws the chart. The `ExportingMenu` lists "SVG" by default (`svgOptions: { disabled: true }` removes it; `svgOptions: { precision: 3 }` sets the decimals); in code use `exporting.download("svg")`, `exporting.getSVG()` (markup) or `exporting.exportSVG()` (data URI). Without the plugin, the core has `am5.renderToSVG()`:

```js
// The chart as last drawn — after a change, wait for the frame to be drawn
root.events.once("frameended", function () {
  const svg = am5.renderToSVG(root);                              // SVG markup string
  const part = am5.renderToSVG(series, { background: "#ffffff" }); // one element, where it sits on the chart
});
```

Options: `width`, `height`, `precision` (default `3`), `idPrefix` (`"am5-"`; vary it when several SVGs share a page), `title` (screen-reader name; default the Root `ariaLabel`), `background` (CSS color; default transparent). Left out: elements with `exportable: false`, cross-origin images without CORS, and fully transparent elements.

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

// Through more than two values (5.21.2): `stops` in place of min/max, e.g. red–yellow–green
var ic = root.interfaceColors;
series.set("heatRules", [{
  target: series.columns.template,
  dataField: "valueY",
  stops: [ic.get("negative"), ic.get("warning"), ic.get("positive")],
  key: "fill"
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
| `stops` | array | Values for a scale through more than two (5.21.2), in place of `min`/`max`: the lowest data value gets the first, the highest the last, blended between. Numbers, percents or colors, all of one kind |
| `minValue` | number | Override auto-calculated min (skips `calculateAggregates`; `0` is honored since 5.21.0) |
| `maxValue` | number | Override auto-calculated max (skips `calculateAggregates`; `0` is honored since 5.21.0) |
| `customFunction` | function | `(sprite, min, max, value)` — full control over the rule |

**Using heat rules on bullets** — bullets need an explicit `am5.Template`, and the series must track the field the rule reads:

```js
var circleTemplate = am5.Template.new({});

series.bullets.push(function(root, series, dataItem) {
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

Rules that make bullet heat rules work (each failure is **silent** — every bullet just comes out the same size):
- `target` must be the **`Template`** the bullet sprites are built from (3rd argument of `am5.Circle.new(...)`), not the sprite and not `series.bullets`.
- `dataField` is the data item **property key** (`"valueY"`, `"valueX"`, `"value"`, …), **not** the raw column name. To size XY bullets by a column that is not already an axis value, register it as the base value field: `series.set("valueField", "population")` and use `dataField: "value"`.
- `calculateAggregates: true` is required (unless `minValue`/`maxValue` are given) — without it `valueLow`/`valueHigh` are never computed and every bullet gets the midpoint size.
- Setting `valueField` (or any `*Field`) **after** the series has processed data does not re-read the data — re-set it: `series.data.setAll(series.data.values.slice())`.
- Bullet heat rules survive `ChartSerializer` (verified 5.21.0): the sample sprite the serializer builds from the factory is disposed right away and leaves the template, so the old `sprite._setDataItem(dataItem)` workaround is not needed.

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

// Through several colors (5.21.2): `colors` in place of startColor/endColor, matching a heat rule's `stops`
var ic = root.interfaceColors;
var scaleLegend = chart.children.push(am5.HeatLegend.new(root, {
  orientation: "horizontal",
  colors: [ic.get("negative"), ic.get("warning"), ic.get("positive")]
  // stepCount: 1 (default) = a gradient through them; with stepCount > 1, one step per color
}));
```

## Animations

```js
series.appear(1000);        // duration in ms
chart.appear(1000, 100);    // duration, delay
```

**`autoAppear` (5.21.0)** — the same opening animation as a setting, so it works from a JSON config or `<am5-chart>`, where `appear()` cannot be called:

```js
chart.setAll({ autoAppear: true, appearDuration: 1000, appearDelay: 100 });
series.setAll({ autoAppear: true, appearDuration: 1000 });   // a series waits for its first data
// JSON: "settings": { "autoAppear": true, "appearDuration": 1000, "appearDelay": 100 } on the chart and each series
```

It plays once, when the element is first drawn (data updates do not replay it; turning the setting off and on does). `autoAppear` defaults to `false`; `appearDuration` falls back to the element's `stateAnimationDuration`; `appearDelay` (default `0`) keeps the element hidden until it starts. Elements made from a template play as each is made; an element that starts hidden stays hidden.

**Declared animations — the `animations` setting (5.20.8).** Every element can carry its own animations as data, so they live in a JSON config and survive `ChartSerializer` — prefer this over `sprite.animate({ loops: Infinity })` for endless effects:

```js
series.bullets.push(function (root, series, dataItem) {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 6,
      animations: [   // loops: 0 = forever; yoyo goes back to `from`; easing is a NAME
        { key: "scale", from: 1, to: 1.6, duration: 800, loops: 0, yoyo: true, easing: "sine" },
        { key: "opacity", from: 1, to: 0.3, duration: 800, loops: 0, yoyo: true }
      ]
    })
  });
});
```

Entry (`IDeclaredAnimation`) fields: `key`, `to`, `duration` (required; with `yoyo` one way), `from` (default: current value), `delay` (`0`), `loops` (`1`; `0` = forever), `yoyo` (`false`), `easing` (`"linear"` — one of the 8 names under "Easing functions"; unknown names silently become linear), `ease` (`"in"` default, `"out"`, `"inOut"`), `target` (`"self"` default, or `"dataItem"` for a data-item value such as a map point's `positionOnLine`). They start when set, restart when changed, stop on dispose. **Give `from` explicitly** unless the setting has a theme default (`scale`/`opacity`/`rotation` do; `dx`, `fill`, a data item's `positionOnLine` may not) — with `from` omitted and an `undefined` current value it jumps straight to `to`, no animation. In JSON, colors/percents in `from`/`to` are `{ "type": "Color", "value": "#f00" }` / `{ "type": "Percent", "value": 50 }`.

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

**Opening a link on click needs no handler (5.20.7):** `series.set("urlField", "url")` makes each item's bullet, column, slice, Venn slice, map polygon or map line open the URL in its data row (`linkTarget`, default `"_self"`) — see "Recent API changes". Hierarchy nodes, flow nodes/links and word-cloud labels are not linked; keep a `click` handler there.

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

## Settings that already equal the default — omit them

Generated code routinely spells out settings that equal the amCharts default (verified against the default themes, and for `Gantt` the code, of 5.21.2). They add noise and mislead readers into thinking they matter. Do not emit these unless changing them:

| Class | Setting(s) that are already the default |
|-------|------------------------------------------|
| All hierarchy series | `childDataField: "children"`, `downDepth: 1`, `initialDepth: 5` |
| `Sunburst`, `Partition`, `Treemap`, `VoronoiTreemap` | `singleBranchOnly: true` (`Partition`/`Treemap` also `upDepth: 0`; `VoronoiTreemap` also `shapeType: "polygon"`; `Sunburst` ignores the setting since 5.21.0 — always single-branch) |
| `Tree`, `ForceDirected` | `singleBranchOnly: false`, `upDepth: Infinity`, `topDepth: 0` (`Tree` also `orientation: "vertical"`) |
| `PieSeries`, `FunnelSeries`, `PyramidSeries`, `PictorialStackedSeries` | `alignLabels: true` (`PieSeries` also `startAngle: -90`, `endAngle: 270`; `FunnelSeries` also `orientation: "vertical"`, `startLocation: 0`, `endLocation: 1`, `bottomRatio: 0`) |
| `Chord` | `sort: "none"` (data order) |
| `Gantt` | `excludeWeekends: true` |
| `XYSeries` (all XY series) | `maskBullets: true` — note the default is **true**, so `maskBullets: false` is a real change |
| `LineSeries` (incl. smoothed/step) | `connect: true`; `StepLineSeries` `noRisers: false` |
| `XYChart` | `maxTooltipDistance` — leave **unset** (unset shows tooltips for all items in the category; `0` is *not* the same) |
| `HeatLegend` | `stepCount: 1` |

Runtime-mutated settings (`visible`, `x`/`y`, `opacity`, `scale`, cursor line `visible`, physics/random layouts, computed `AxisRendererCurve.points`) cannot be checked by "remove and re-`get()`" — amCharts rewrites them after render. User-set values live in `entity._userProperties` (what `ChartSerializer` reads), separate from the full `_settings` bag that includes theme and internal values.

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

**Changing values on existing data items.** Series draw from the **working** values, so `dataItem.set("valueY", v)` (or `"value"` on a pie) changes nothing on screen, and `markDirtyValues()` doesn't help. Change the data row with `series.data.setIndex(i, row)` (animates), or set the working key too (jumps; use it for per-frame updates):

```js
xySeries.dataItems[0].setAll({ valueX: 4, valueY: 7, valueXWorking: 4, valueYWorking: 7 });   // XY series
pieSeries.dataItems[0].setAll({ value: 80, valueWorking: 80 });                                // pie, funnel, pyramid
// per-frame updates through setIndex on XY: set interpolationDuration: 0 on the series, or the points lag behind
```

A data item's bullets are a plain array **property**: `dataItem.bullets?.[0]?.get("sprite")` is the sprite the bullet function made (`dataItem.get("bullets")` is `undefined`).

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

**A state keeps the value it first replaced.** Once a state (e.g. `hover`) has changed a setting, the sprite's `"default"` state holds the value from that moment and restores it on every unhover. So a setting changed later (painting a polygon on click, a new base color) snaps back on the next unhover unless you change it in both places:

```js
polygon.set("fill", color);
polygon.states.lookup("default")?.set("fill", color);
```

## Parameterized themes — Monochrome & Adaptive (5.20.0)

Two themes generate their palette from colors you pass in (OKLCH-based, so the result stays perceptually balanced). Because a theme cannot take constructor parameters, these ship as **factory functions** — call them with `(root, settings)`; `.new(root, settings)` also works.

```js
import am5themes_Monochrome from "@amcharts/amcharts5/themes/Monochrome";
import am5themes_Adaptive from "@amcharts/amcharts5/themes/Adaptive";

// Monochrome — single-hue lightness ramp
root.setThemes([
  am5themes_Animated.new(root),
  am5themes_Monochrome(root, {
    color: 0x2c6e91,   // base hue (default: blue #2e7c9e)
    accent: 0xff7f0e,  // optional — applied to the FIRST series only, so it pops
    count: 7,          // steps in the ramp (default 7)
    dark: false        // true = dark background + light-to-mid ramp
  })
]);

// Adaptive — full palette generated from one or two base colors
root.setThemes([
  am5themes_Animated.new(root),
  am5themes_Adaptive(root, {
    baseColor: 0x2c6e91,   // first generated color IS this color (good for brand colors)
    baseColor2: 0xffdd00,  // optional — palette spans the two colors
    count: 10,             // number of series colors (default 10)
    dark: false
  })
]);
```

Both are additive (they do not modify built-in themes) and both handle dark mode themselves via `dark: true` — do not also add the `Dark` theme.

**More settings (5.21.2, both themes, all off by default):** `interleave: true` takes the colors in the order 1, 4, 2, 5, 3, 6, so series next to each other differ more (Monochrome keeps `accent` first); `mapShade: true` fills map land with a mid shade of the base color, as light as default map land, instead of the color itself; `keepContrast: true` keeps the series colors and primary buttons at least 3:1 against the background (or give a ratio, e.g. `4.5`). A branded palette:

```js
am5themes_Adaptive(root, { baseColor: 0x2c6e91, baseColor2: 0xffdd00, count: 10, interleave: true, mapShade: true, keepContrast: true })
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

**A `ColorSet` must always hold at least one color.** `colorSet.set("colors", [])` crashes the next `next()`/`getIndex()` call (`Maximum call stack size exceeded`, or `Cannot read properties of undefined (reading 'toHSL')` inside `generateColors`) as soon as a series iterates the palette — as of 5.21.4 the empty list is not guarded. To "reset" a palette, swap in a fresh `am5.ColorSet.new(root, {})` instead of emptying the list. The theme's `baseColor` also resolves lazily, so a **synchronous** re-color right after swapping a `ColorSet` can read a transient value (sprites momentarily black); re-set the series data and let amCharts' own data pass recolor the sprites.

**`step` with a theme that reuses its colors** (`reuse: true`: Adaptive, Monochrome, Nord, Pastel, Kelly, …): before 5.21.2 a `step` sharing a factor with the list length used only a few of the colors (a word cloud or treemap with Nord got two or three). Now every color is used before any repeats, so `step: count / 2` interleaves the palette.

**Repeats are lighter (5.21.3).** In themes that reuse their list, once every color has been used, the next round is 10% lighter instead of the same colors again. This covers Adaptive, Monochrome, Ember, Frozen, Kelly, Material, Midnight, Moonrise, Nord, Pastel, Petroleum, Savanna and Spirited, with their Dark variants, but not Colorblind, Patterns or Dataviz. The setting is `repeatLightness` on the `ColorSet`: HSL lightness per round, `0.1` is 10%, and a negative value makes it darker. It only acts with `reuse: true`. The color sets of one root share the theme's list, and the repeats are added to that list, so whichever color set on the root first needs a new round decides that round for every chart on it. To repeat the colors as they are, as before 5.21.3, set it for the whole root:

```js
// Every ColorSet on the root, through a theme rule
var noLighter = am5.Theme.new(root);
noLighter.rule("ColorSet").set("repeatLightness", 0);
root.setThemes([am5themes_Animated.new(root), am5themes_Nord.new(root), noLighter]);

// Adaptive and Monochrome: a theme setting (true = 0.1, or a number)
am5themes_Adaptive.new(root, { repeatLightness: false });
```

With one chart on the root, `chart.get("colors").set("repeatLightness", 0)` before the data is set works too.

## Data processor

```js
// Auto-convert fields when loading external / API data
series.data.processor = am5.DataProcessor.new(root, {
  dateFields: ["date"],
  dateFormat: "yyyy-MM-dd",  // read as local time (UTC with root.utc); see below for leaving it out
  numericFields: ["value", "count"],
  colorFields: ["color"],
  emptyAs: 0  // replace null, undefined and "" with 0 (before 5.21.0 it also replaced 0 and false)
});
// Configure processor BEFORE setting data
```

Without `dateFormat`, since 5.21.1 the browser's `Date` parses the strings, so ISO strings work and a date-only `"2024-03-15"` is midnight **UTC**. Before 5.21.1 every such string became 1 January 1970.

## Serializing to JSON (ChartSerializer / JsonParser)

**To write a config by hand** (a "JSON config", `<am5-chart>`, a framework package's `config` prop, a Chart Maker link), read `references/json.md`. It covers the exact format, with a complete config per chart family. A config is not `{ "chart": …, "series": … }`; every object has `"type"`, its options go in `"settings"`, and its parts and data go in `"properties"`.

`am5plugins_json.ChartSerializer` turns a live chart into a JSON config and `am5plugins_json.JsonParser` rebuilds it (`await parser.parse(config, { parent: root.container })`). Rules that keep round-trips working:

- **Serialize the chart's top-level container child:** `serializer.serializeAll(root.container.children.getIndex(0))` — the chart, or on chart-less types (hierarchy, flow, word cloud, Venn) the series itself. Before 5.21.0 a series placed straight in `root.container`, or one whose `selectedDataItem` points back at itself, overflowed the stack (`Maximum call stack size exceeded`) or broke `JSON.stringify`; 5.21.0 serializes them. A drilled-down hierarchy's `selectedDataItem` is still not restored (it is written as `"@self.dataItems.-1"`).
- **Adapters do not round-trip.** `includeAdapters` (default `true`) writes each adapter as `{ key, callback: "function (…) {…}" }`; the parser does not turn that string back into a function (and the closure's `chart`/`series`/`root` would not exist anyway). Before 5.20.4 the string was registered as a callback and crashed the chart (`i[s] is not a function` in `Entity.fold`); since 5.20.4 such adapters are skipped. Either way the effect is lost — replace palette-coloring adapters with declarative equivalents: `colorByDataItem: true` on column series (5.20.4), a per-item `fill` data field + `templateField`, or `heatRules`.
- **Only user-set settings are serialized (5.20.3)** — theme and library defaults are left out, so a serialized config is much smaller than before and a value you never set will not appear in it. Add `includeRoot: true` (5.20.2) to also write a top-level `root` section (Root settings/properties, `interfaceColors`, formatters).
- **Re-parsing into an existing chart:** `parser.parse(config, { updateTargets: "soft" })` (5.20.3) applies settings onto an existing object of the same `type` instead of replacing it. The default `"strict"` replaces.
- **Maps and locales with npm imports (5.21.4):** a geodata pack or locale that isn't a global is copied into the config whole, about 250 KB for `worldLow`, unless the serializer gets it in `resources`. `am5plugins_json.ChartSerializer.new(root, { resources: { am5geodata_worldLow } })` writes `"geoJSON": "am5geodata_worldLow"` instead; parse it back with the same `resources` (`references/json.md`, rule 8). With script tags the packs are globals and are written by name without it.
- **Also saved (5.20.6 – 5.20.8):** `themeTags` you pass to `.new()` (5.20.6 — e.g. a `Button` with `themeTags: ["switch"]` keeps its look; tags the library adds are left out); a legend inside an `axisHeader` (5.20.7); declared `animations` (5.20.8, see "Animations"); and animations started in code that **loop forever** (`loops: Infinity`) with a nameable `am5.ease` easing — written as `animations` entries. `runningAnimations` (5.20.8, default `true`) controls the latter: `am5plugins_json.ChartSerializer.new(root, { runningAnimations: false })` turns it off. Never saved: finite animations (`appear()`, states, zoom) and loops with a custom-function or `pow` easing — for the opening animation use `autoAppear` (5.21.0, see "Animations").
- **Data-item loops (5.21.0):** a loop started on a **data item** in code (`dataItem.animate({ key: "positionOnLine", loops: Infinity, … })`) is saved as an `animations` entry with `target: "dataItem"`. When every data item plays the same loop, it goes on the bullet sprite. Since 5.21.3, when they differ (e.g. points each moving at their own speed), each one goes in its own data row, under the sprite's `templateField` (`"bulletSettings"` if none is set). Before 5.21.3, every item got the first one's loop.
- **Also saved (5.21.0):** a series hidden with `hide()` or a legend click; elements you add to library-built containers (`chart.plotContainer`, `seriesContainer`, axes containers, an axis) — no `themeTags: ["serialize"]` needed; a `ZoomableContainer`'s `contents`; `Date` values (as timestamps); settings on a series' `bulletsContainer` and on a pie/funnel series' `labelsContainer`/`ticksContainer`; the `axisFills`, `rectangles` (`Treemap`, `Partition`) and `polygons` (`VoronoiTreemap`) templates. A color taken from `root.interfaceColors` is written as a reference, `"@root.interfaceColors.get('background')"`, so a config parsed under another theme (e.g. Dark) uses that theme's color — write the same string in hand-made configs. Since 5.21.3 a color taken from the theme's palette with `getIndex()` is written as `"@colors.getIndex(3)"` the same way, and hand-made configs can use it too in settings (e.g. `"fill": "@colors.getIndex(0)"`). Only the palette's own colors become references: generated or lightened repeats stay hex, and references are not read inside data rows. Changing a setting such as `step` on a chart's colors no longer writes the theme's whole palette into the config.
- **Not captured by `ChartSerializer` (as of 5.21.0)** — re-apply these in code after `parse()`: a `ZoomTools` you added to a hand-made `ZoomableContainer` (its `target` is written as a copy, so the parsed buttons drive a different container — re-point `target`, or use `am5.SerialChartContainer`, which wires its own `zoomTools`); Venn `hoverGraphics` (Venn slice-template `states` do round-trip); data items added with `pushDataItem()` (only `series.data` rows are written — map points on lines can be data rows since 5.20.6, see `references/map.md`).
- **Bullets** are captured by calling the factory with a sample data item — write factories as `function(root, series, dataItem)` (pitfall #36).

**`<am5-chart>` — a chart as an HTML element (5.21.0).** Builds a chart from a JSON config with no root or chart code. With script tags, load `index.js`, `plugins/json.js`, `element.js`, then every chart package the config uses; with npm, `import { defineChartElement } from "@amcharts/amcharts5/element"` and call `defineChartElement()`. A bare `import "@amcharts/amcharts5/element"` is dropped by esbuild, so the element is never defined; the call keeps it, and does nothing if the element already exists. Chart packages are loaded on demand. Then set `element.themes = [am5themes_Animated]`, for a map `element.resources = { am5geodata_worldLow }` (5.21.4), and `element.config = {…}`, as properties:

```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/plugins/json.js"></script>
<script src="https://cdn.amcharts.com/lib/5/element.js"></script>
<script src="https://cdn.amcharts.com/lib/5/percent.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>

<am5-chart themes="Animated" renderer="svg" style="height: 400px" config='{
  "type": "PieChart",
  "properties": { "series": [{ "type": "PieSeries",
    "settings": { "valueField": "value", "categoryField": "category", "autoAppear": true },
    "properties": { "data": [{ "category": "A", "value": 10 }, { "category": "B", "value": 6 }] } }] }
}'></am5-chart>

<script>
document.querySelector("am5-chart").whenReady().then(function (r) {
  // r.root, r.chart — or listen for the element's "ready" / "error" events
});
</script>
```

Attributes: `config` (JSON) or `src` (URL of a JSON file), `themes`, `renderer="svg"` (default canvas). The `themes` attribute takes names, space- or comma-separated, or since 5.21.4 JSON with a theme's settings: `themes='["Animated", ["Adaptive", { "baseColor": "#4150a0" }]]'`. It works with script tags only. With npm, the `themes` property takes theme classes, or since 5.21.4 a class with its settings: `[am5themes_Animated, [am5themes_Adaptive, { baseColor: "#4150a0" }]]`. Without a height from CSS or its parent it is 400 px high. Themes are not part of a config. Changing `config`/`themes` rebuilds the chart; removing the element disposes it.

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

**High contrast (5.21.0):** in a forced-colors mode such as Windows High Contrast, labels, grid, axes and buttons take the system colors so they stay visible; series colors are kept. It is on by default — `am5.Root.new("chartdiv", { forcedColors: false })` keeps the chart's own interface colors.

Keyboard/screen-reader behavior in 5.21.0: a `focusableGroup` is one TAB stop; arrow keys move between its members even when they are draggable (flow and hierarchy nodes) and SHIFT + arrows drag them; ESC hides a focused element's tooltip and ends a keyboard drag; SPACE clicks a focused element with a button-like `role`. New `ariaExpanded` setting (set by the library on Gantt tasks with subtasks and on hierarchy nodes with children); a `role: "button"` with `toggleKey` exposes `aria-pressed`. `am5.Modal` is a dialog to screen readers, named by its new `ariaLabel` setting (else its first heading).

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

## Frameworks (React, Vue, Angular, Svelte, React Native)

In a framework app, use amCharts' package for that framework instead of writing the mount and dispose code yourself. The packages were first released on 2026-10-22; the current ones (2026-10-23) are react 5.0.1, vue 5.0.2, angular 5.0.1, svelte 5.0.3 and react-native 5.0.1. Each package makes the chart once its element is on the page, disposes it with the component, and loads the library in the browser only, so pages rendered on a server work (Next.js, Nuxt, SvelteKit, Angular SSR). Each takes a chart written in code, or a chart from a JSON config (it wraps the `<am5-chart>` element, see "Serializing to JSON").

| Framework | Package | A chart in code | A chart from a JSON config |
|---|---|---|---|
| React 18+ (Next.js, React Router, Astro) | `@amcharts/amcharts5-react` | `const { ref, root, result } = useAmChart((root) => { … }, [data])`, `<div ref={ref} style={{ height: "500px" }} />` | `<AmChart config={config} themes={[am5themes_Animated]} onReady={({ root, chart }) => …} />` |
| Vue 3.5.2+ (Nuxt) | `@amcharts/amcharts5-vue` | `const { root, result } = useAmChart(useTemplateRef("chart"), (root) => { … }, { watch: () => props.data })`, `<div ref="chart" style="height: 500px">`; `root`/`result` are shallow refs | `<AmChart :config="config" :themes="themes" @ready="onReady" />` |
| Angular 19+ | `@amcharts/amcharts5-angular` | `AmChartDirective`: `<div [amChart]="buildChart" [amChartDeps]="[data()]" (amChartReady)="…" style="height: 500px">`, with `buildChart = (root: Root) => { … }` as an arrow-function property so `this` is the component | `AmChartComponent`: `<am5-chart [config]="config" [themes]="themes" (amChartReady)="…">` |
| Svelte 4+ (SvelteKit) | `@amcharts/amcharts5-svelte` | Svelte 5.29+: `<div {@attach attachAmChart(buildChart)} style="height: 500px">`; Svelte 4 and older 5: `<div use:amChart={{ setup: buildChart, deps: [data] }}>` | `<am5-chart {@attach attachAmChartConfig({ config, themes })}>`, or `use:amChartConfig={{ config, themes }}`; events `onready`/`onerror` (`on:ready` in Svelte 4) |
| React Native 0.72+ | `@amcharts/amcharts5-react-native` (+ `react-native-webview` 13+) | `<AmChart code={code} data={data} />`, where `code` is a **string** (below) | `<AmChart config={config} themes={["Animated"]} />` |

Install the library with the package: `npm install @amcharts/amcharts5 @amcharts/amcharts5-react`. The current web packages need amCharts 5.21.4 or later (peer dependency `^5.21.4`); 5.0.0 worked with 5.21.0 and later. React Native installs only `@amcharts/amcharts5-react-native react-native-webview`: the WebView loads the library from the amCharts CDN.

```jsx
// React. Vue, Angular and Svelte work the same way: your function gets the root.
import { useEffect } from "react";
import { useAmChart } from "@amcharts/amcharts5-react";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

function Chart({ data }) {
  const { ref, result } = useAmChart((root) => {
    root.setThemes([am5themes_Animated.new(root)]);
    const chart = root.container.children.push(am5xy.XYChart.new(root, {}));
    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "category",
      renderer: am5xy.AxisRendererX.new(root, {})
    }));
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));
    const series = chart.series.push(am5xy.ColumnSeries.new(root, {
      xAxis: xAxis, yAxis: yAxis, categoryXField: "category", valueYField: "value"
    }));
    return { xAxis, series };
  }, []); // made once: [data] here would make the chart again on every change

  // New data goes to the chart that is there, with an animation
  useEffect(() => {
    if (result) {
      result.xAxis.data.setAll(data);
      result.series.data.setAll(data);
    }
  }, [result, data]);

  return <div ref={ref} style={{ width: "100%", height: "500px" }}></div>;
}
```

- **Your function gets the root:** never call `am5.Root.new()` or `root.dispose()` in it, because the package does both. Put the code that follows `Root.new()` in any example inside it.
- **The chart's element needs a height.** The JSON-config components are 400 px high without one.
- **Deps make the chart again from scratch:** `[data]` in React, `watch` in Vue (what Vue's `watch()` takes; add `deep: true` to also catch `push()`), `[amChartDeps]` in Angular, `deps` in Svelte actions. A Svelte attachment runs again when state read in its own expression changes. To change data without rebuilding, return what you need and use it from `result` (React, Vue), from `(amChartReady)`'s `{ root, result }` (Angular), or from a `$state.raw` variable set in the function (Svelte).
- **SVG:** `useAmChart(setup, deps, { renderer: "svg" })` in React, `{ renderer: "svg" }` in Vue's options, `[amChartRenderer]="'svg'"` in Angular, and `attachAmChart(setup, { renderer: "svg" })` or `renderer: "svg"` in Svelte's action parameter. The JSON-config components take a `renderer` prop or input.
- **Themes for the JSON-config components are classes** (`[am5themes_Animated]`, not `.new(root)`): themes are not part of a config. A theme with its settings is a pair (5.21.4): `[am5themes_Animated, [am5themes_Adaptive, { baseColor: "#4150a0" }]]`. React Native takes theme **names** (`["Animated", "Dark"]`), and the pair as `["Adaptive", { baseColor: "#4150a0" }]`.
- **Maps and locales in a JSON config** (5.21.4): the config names its geodata (`"geoJSON": "am5geodata_worldLow"`) and locale (`"am5locales_de_DE"`), and with npm imports those aren't globals, so pass them in the `resources` prop: `<AmChart config={config} resources={{ am5geodata_worldLow }} />` in React (import it from `@amcharts/amcharts5-geodata/worldLow`), `:resources` in Vue, `[resources]` in Angular, and `resources` in Svelte's `attachAmChartConfig({ config, resources })` / `use:amChartConfig`. Without it the map is blank, with a console warning that names the pack. React Native loads the geodata a config names by itself, but not a locale: give it `modules={["locales/de_DE"]}`.
- **Give amCharts plain data.** In Vue, keep amCharts objects out of reactive state: use `shallowRef()` for data, or pass `toRaw(data)`. In Svelte 5, use `$state.snapshot(data)`.
- **License:** call `am5.addLicense("AM5C-…")` once when the app starts, before any chart is made, never in the setup function, because the logo is decided when the root is made. Put it in `main.ts`/`main.jsx`, before `createApp()` or `bootstrapApplication()`. In Next.js, put it at the top of a client component's file; in Nuxt, in a client plugin (`plugins/amcharts.client.ts`); in SvelteKit, in `src/hooks.client.ts`. React Native takes `licenses={["AM5C-…"]}` on each chart.
- **Errors** thrown in your function go to React's nearest error boundary, Vue's `app.config.errorHandler`, Angular's `ErrorHandler` and `(amChartError)`, and Svelte's `onError` option (an uncaught error without it).
- **Server rendering:**
  - Next.js, Nuxt (no `<ClientOnly>` needed), SvelteKit and Angular SSR need no configuration.
  - In the Next.js app router, `useAmChart` and theme classes need a client component (`"use client"`). A server component can render `<AmChart config={config}>` itself, because a config is plain data.
  - React Router (Remix 2) and Astro: add `ssr: { noExternal: ["@amcharts/amcharts5"] }` to the Vite config (under `vite` in `astro.config.mjs`).
  - Remix 3 has no package. Either load the script files and render `<am5-chart config={JSON.stringify(config)} data-rmx-preserve-dom>`, or use a `clientEntry()` component that imports amCharts inside Remix's `ref` mixin and disposes the root when its signal aborts.
- **Unit tests in jsdom** (no canvas): mock the package, e.g. `vi.mock("@amcharts/amcharts5-react", () => ({ useAmChart: () => ({ ref: () => {}, root: undefined, result: undefined }), AmChart: () => null }))`.

**React Native** draws the real library in a WebView, so every chart type works, and it runs in Expo Go.
- The chart code is a **string** written like a script-tag example: `am5xy.XYChart`, globals rather than imports. `root`, `data` (the `data` prop) and `post(name, value)` are in scope, and the files the code uses are loaded for it.
- If the code returns a function, new `data` (compared by content) goes to that function instead of making the chart again.
- `post()` calls the `onMessage(name, value)` prop.
- Everything between the app and the chart is JSON, so give dates as timestamps.
- Never build `code` from text a user typed or a server sent: pass such values in `data`.
- Other props: `renderer`, `modules` (e.g. `["locales/de_DE"]`), `libraryUrl`, `geodataUrl`, `onReady`, `onError`, `webViewProps`. A ref gives `run(code)`.

```jsx
import { AmChart } from "@amcharts/amcharts5-react-native";

const code = `
const chart = root.container.children.push(am5xy.XYChart.new(root, {}));
// ... axes and series, as in a script-tag example
series.columns.template.events.on("click", (ev) => post("country", ev.target.dataItem.dataContext.country));
xAxis.data.setAll(data);
series.data.setAll(data);
return (newData) => { xAxis.data.setAll(newData); series.data.setAll(newData); };
`;

<AmChart code={code} data={visits} themes={["Animated"]} style={{ height: 300 }}
  onMessage={(name, value) => console.log(name, value)} />
```

**Without a package** (an older framework version, or when the user asks for it), create the root once the element exists, and dispose it when the component goes away:

```js
// React
useLayoutEffect(() => {
  const root = am5.Root.new(chartdiv.current); // const chartdiv = useRef(null)
  // ... build chart
  return () => { root.dispose(); };
}, []);

// Angular: in ngAfterViewInit, only if isPlatformBrowser(), inside zone.runOutsideAngular()
ngOnDestroy() { this.root?.dispose(); }

// Vue: root = am5.Root.new(chartdiv.value) in onMounted, kept in a plain variable, not reactive state
onBeforeUnmount(() => { root?.dispose(); });

// Svelte: onMount runs in the browser only
onMount(() => { const root = am5.Root.new(chartdiv); /* ... */ return () => root.dispose(); });
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
9. **Using CSS to style chart elements** — amCharts draws on canvas by default; even with `am5.SVGRenderer` (5.21.0) its shapes have no per-element classes, are rewritten on redraw, and exports ignore page CSS. Style through settings, templates and themes.
10. **Wrong package import** — check the package map table above.
11. **Calling `.each()` on `dataItems`** — `series.dataItems` is a plain array, not an amCharts `List`. Use `am5.array.each(series.dataItems, fn)` or standard `forEach`/`for` loops. Only `series.data` (the `ListData` object) has `.each()`.
12. **CDN script load order** — `index.js` must load first, then `xy.js`, then any package that depends on it (`radar.js`, `timeline.js`, `gantt.js`). Wrong order causes runtime errors. Correct order: `index.js` > `xy.js` > `radar.js` / `timeline.js` / `gantt.js` > `themes/*.js`.
13. **No `minorGrid` / `minorTicks` / `minorLabels` objects** — These do not exist on axes. Minor grid is enabled via boolean flags on the **renderer**: `minorGridEnabled: true` and optionally `minorLabelsEnabled: true`. Styling is done through theme rules targeting the `"minor"` tag, not through separate object properties.
14. **Flow chart animated bullets go on `series.bullets`, NOT `series.links.template.bullets`** — To animate labels/circles flowing along Sankey or Chord links, use `series.bullets.push(function(...) { ... })`. Animate `bullet.locationX` (Sankey) or `bullet.locationY` (Chord) from 0>1 with `loops: Infinity`. Use an adapter on opacity for fade effect. See `references/flow.md` > "Animated bullets along links".
15. **`MapPointSeries` needs `latitudeField`/`longitudeField` when your data fields are named anything other than `latitude`/`longitude`** — Since 5.16.1 the series defaults to `latitudeField: "latitude"`, `longitudeField: "longitude"`, so data using exactly those names works with no declaration. Any other naming (`lat`/`lng`, `y`/`x`, …) must be declared or the points silently won't appear: `am5map.MapPointSeries.new(root, { latitudeField: "lat", longitudeField: "lng" })`. Neither is needed with `pushDataItem({ latitude: ..., longitude: ... })`, which passes coordinates directly. On amCharts **older than 5.16.1** there were no defaults, so declare the fields explicitly if you must support those versions.
16. **`data.setAll()` does NOT animate — use `data.setIndex()` for animated updates** — When the user asks to update/refresh data with animation, do NOT use `series.data.setAll(newData)` — it replaces everything instantly with no transition. Instead, update each item with `series.data.setIndex(i, newItem)` which triggers smooth value animation. For full replacement with animation, loop: `newData.forEach(function(item, i) { series.data.setIndex(i, item); })`.
17. **`color.lighten()` / `color.darken()` are NOT instance methods** — `am5.color(0xff0000).lighten(0.3)` does NOT work. Use static methods: `am5.Color.lighten(color, 0.3)` to lighten, `am5.Color.lighten(color, -0.3)` to darken. There is NO `darken()` method — use negative lighten. Also available: `am5.Color.brighten()`, `am5.Color.saturate()`.
18. **Venn diagram has no `VennDiagram` class** — `am5venn.Venn` is pushed directly into a `Container`, NOT into a chart's `series`. See `references/venn.md`.
19. **Timeline `AxisRendererCurveX` requires `yRenderer`** — Always create the Y renderer first, then pass it: `am5timeline.AxisRendererCurveX.new(root, { yRenderer: yRenderer })`. Without this, crashes with `Cannot read properties of undefined (reading 'axis')`.
20. **Gantt data uses TWO separate calls** — Do NOT use `chart.data.setAll()`. Set categories on `chart.yAxis.data.setAll([{id, name, parentId, color}])` and tasks on `chart.series.data.setAll([{id, start, duration, progress, linkTo}])`. Use flat `parentId` for hierarchy, NOT nested `children` arrays. CDN order: `index.js` > `xy.js` > `plugins/colorPicker.js` > `gantt.js` > `themes/Animated.js` (gantt.js webpack-depends on colorPicker chunk). See `references/gantt.md`.
21. **No continent-level geodata at top-level CDN** — `geodata/europeLow.js` does NOT exist. Use `geodata/region/world/europeLow.js` (global: `am5geodata_region_world_europeLow`) or filter `worldLow` with `include: [...]`.
22. **Do not add chart titles as HTML** — HTML titles are outside the chart and won't appear in exports. Use `am5.Label` pushed into the container BEFORE the chart, with `verticalLayout` on the container. See "Chart title" section above.
23. **`XYChartScrollbar` has no `xAxis`/`yAxis` settings** — its preview is a chart of its own, `scrollbar.chart`: push the preview's axes into `scrollbar.chart.xAxes`/`yAxes`, its series into `scrollbar.chart.series`, and give that series the data. Axes passed to `XYChartScrollbar.new()` are never added to the preview (its series then throws), and `get("xAxis")` only hands back whatever you passed. See `references/xy.md` > Scrollbar.
24. **`am5.color()` only accepts hex integers or CSS strings** — `am5.color(0xff0000)`, `am5.color("#ff0000")`, `am5.color("rgb(255,0,0)")` are valid. `am5.color({ r: 255, g: 0, b: 0 })` is NOT — it throws.
25. **`MapChart` has no default `colors`** — it inherits the `colors` setting from `SerialChart`, but no theme sets it on a map, so `chart.get("colors")` returns `undefined`, and map series don't use it anyway. XY and Radar charts (and percent series, via `series.get("colors")`) get a ColorSet from the theme. For maps, make your own: `am5.ColorSet.new(root, {})`.
26. **`VoronoiTreemap` has NO `.rectangles` property** — Unlike `Treemap` (which has `series.rectangles.template`), `VoronoiTreemap` renders organic polygon cells. Style via `series.nodes.template` and its children, not `.rectangles`.
27. **Labels with data placeholders need `populateText: true`** — `Label` defaults to `populateText: false`; labels the library makes for you (axis, legend, tooltip, pie/funnel slice labels, hierarchy and flow node labels…) get `true` from their own theme rules, but a `Label` you create does not. Any Label you create whose `text` has `{placeholders}` (a bullet sprite, a child of a bullet's container, a map point label) needs `populateText: true`, or it shows the braces literally. Example: `am5.Label.new(root, { text: "{name}", populateText: true, ... })`. A `tooltipText` is filled in regardless.
28. **Easing: `am5.ease.in()` does NOT exist** — amCharts 5 provides base easing functions (`am5.ease.cubic`, `am5.ease.bounce`, `am5.ease.elastic`, `am5.ease.linear`, `am5.ease.quad`, `am5.ease.sine`, `am5.ease.circle`, `am5.ease.exp`; `am5.ease.pow(t, e)` takes an exponent, so it is only usable wrapped: `(t) => am5.ease.pow(t, 3)`) and three modifiers: `am5.ease.out()`, `am5.ease.inOut()`, `am5.ease.yoyo()`. Usage: `am5.ease.cubic` (ease-in by default), `am5.ease.out(am5.ease.cubic)` (ease-out), `am5.ease.inOut(am5.ease.cubic)` (ease in+out). There is NO `am5.ease.in()` — using it throws a runtime error. The base functions already ease-in by default.
29. **`forceHidden` vs `visible`** — `forceHidden: true` ALWAYS hides an element, immune to states, themes/library and even `show()`. `visible` is weaker: amCharts re-manages it on many elements (notably cursor lines, but also labels, ticks, tooltips, grid) in response to interaction or data changes, so a `visible: false` you set may be flipped back to `true`. Rules of thumb: for a **persistent hide**, use `forceHidden: true` (`cursor.lineX.set("forceHidden", true)`, `yRenderer.labels.template.set("forceHidden", true)`, `xRenderer.grid.template.set("forceHidden", true)`). To **reveal** an element that defaults hidden — notably **axis ticks** (`ticks.template` defaults to `visible:false`) — you must raise `visible: true`; flipping `forceHidden` alone won't show it. For cursor lines specifically, always access `cursor.lineX`/`cursor.lineY` after creation — do NOT pass them as constructor options.
30. **`snapTooltip: true` on series for cursor tooltip snapping** — When using a cursor and you want tooltips to snap to data points, set `snapTooltip: true` on the series in addition to (or instead of) `snapToSeries` on the cursor. This is especially useful for timeline/curve charts.
31. **Globe rotation uses negative coordinates** — To center the globe (`geoOrthographic`) on a geographic point, set `rotationX` to **-longitude** and `rotationY` to **-latitude**. E.g., to center on Paris (48.86°N, 2.35°E): `chart.animate({ key: "rotationX", to: -2.35 }); chart.animate({ key: "rotationY", to: -48.86 });`. Using positive values rotates the globe the wrong way.
32. **`positionOnLine` with multi-segment lines limits per-segment control** — `MapPointSeries` data items can animate along a line via `positionOnLine` (0>1). If the line has 3+ points (multi-segment), position 0.5 is the midpoint of the *entire* path, making per-segment effects (scaling at each segment midpoint, pausing between segments, etc.) difficult. For advanced per-segment animations, use **single-segment lines** (2 points each) and animate the bullet across them sequentially. E.g., instead of one line [A,B,C,D], create [A,B], [B,C], [C,D].
33. **Do NOT exclude Antarctica (`exclude: ["AQ"]`) by default** — Many amCharts demos exclude Antarctica because they use Mercator projection where it appears disproportionately large. This is a demo-specific choice, not a best practice. Unless the user explicitly asks to exclude Antarctica, or references a demo that does so, keep Antarctica in the map. With non-Mercator projections (`geoNaturalEarth1`, `geoEqualEarth`, `geoOrthographic`, `geoEquirectangular`), Antarctica renders at a reasonable size.
34. **Custom GeoJSON for `MapPolygonSeries` needs CLOCKWISE exterior rings** — amCharts projects on a sphere (d3-geo), where ring winding decides which side is "inside". The RFC 7946 default is counter-clockwise, which d3-geo reads as *the whole globe minus the polygon*, so every polygon floods the entire map and the real shape shows only as a sliver. Programmatically generated GeoJSON (grids, cells, buffers) is usually CCW. amCharts does **not** auto-rewind — reverse each ring yourself: `feature.geometry.coordinates = feature.geometry.coordinates.map(ring => ring.slice().reverse())` (for `MultiPolygon`, one level deeper). See `references/map.md`.
35. **`axis.dispose()` does NOT remove the axis from `chart.xAxes`/`chart.yAxes`** — unlike `series.dispose()`, which self-removes from `chart.series`. A disposed axis stays in the list, keeps showing up in anything built from `chart.yAxes`, and makes `ChartSerializer` throw `Template is disposed`. Remove axes with `chart.yAxes.removeValue(axis)` (or `removeIndex(i)`) — the list auto-disposes the removed axis, no separate `dispose()` needed.
36. **Declare bullet callbacks as `function(root, series, dataItem)`** — amCharts passes all three; closing over an outer `root` works at runtime but breaks JSON round-trips (`ChartSerializer` captures the function source, and the outer `root` dangles on re-bind). Every `series.bullets.push(...)` in these references uses the parameter form — copy it.
37. **A `ColorSet` must contain at least one color** — `colors.set("colors", [])` crashes the next `next()`/`getIndex()`. Swap in a fresh `am5.ColorSet.new(root, {})` instead. See "ColorSet" above.
38. **`LinearGradient` `rotation` only works from 0 to 90** (bug since 5.20.8, still in 5.21.4) — other angles give a flat or wrong fill, and with a transparent end stop the shape can vanish. For the opposite direction keep the angle in range and reverse the `stops`: 180 = `rotation: 0` with reversed stops, 270 = `rotation: 90` with reversed stops. See `references/xy.md` > Series gradients.
39. **Several colors in one `am5.Graphics` `draw`** — `endFill()` fills everything since the last `beginPath()`, so start each color with `display.beginPath()`, or the last color paints over all shapes. Don't give such a Graphics its own `fill` either: after `draw` runs it fills the current path once more, so the last shape takes the Graphics' own `fill` (the default theme sets none). E.g. `draw: function (display) { display.beginPath(); display.beginFill(am5.color(0xff0000)); display.drawRect(0, 0, 10, 10); display.endFill(); display.beginPath(); display.beginFill(am5.color(0x0000ff)); display.drawRect(10, 0, 10, 10); display.endFill(); }`.
40. **Changing a value on a data item moves nothing** — series draw from the working values: set `valueYWorking` (XY) or `valueWorking` (pie) along with the value, or use `series.data.setIndex()`. See "Dynamic data".
41. **A setting changed after a hover snaps back on unhover** — the `"default"` state keeps the value from before the first hover. Change it there too: `sprite.states.lookup("default")?.set("fill", c)`. See "States".
42. **`templateField` goes on the template, not on the series** — per-item settings from data rows are read by the elements a template makes: `series.columns.template.set("templateField", "columnSettings")`, likewise `slices.template`, `mapPolygons.template` or a bullet sprite. Set on the series, `templateField` does nothing and every column stays the same. For a pattern per column, see `references/xy.md` > "Different pattern per column".
43. **A JSON-config map that draws nothing with npm imports** — the config names its geodata (`"geoJSON": "am5geodata_worldLow"`), and with npm imports there is no global of that name. Pass the pack in `resources` (5.21.4): `JsonParser.parse(config, { parent, resources: { am5geodata_worldLow } })`, `element.resources`, or the framework packages' `resources` prop. The same goes for a locale (`am5locales_de_DE`). Since 5.21.4 a console warning names the missing pack. Before 5.21.4, set `window.am5geodata_worldLow = am5geodata_worldLow` after importing it. A config serialized from such a chart copies the whole pack unless `ChartSerializer` gets the same `resources`.

## Easing functions

amCharts 5 easing functions live under `am5.ease`:

```js
// Base functions (ease-in by default) — these 8 are also the names `animations` / byName() accept:
am5.ease.linear    am5.ease.quad     am5.ease.cubic
am5.ease.sine      am5.ease.circle   am5.ease.exp
am5.ease.bounce    am5.ease.elastic

// pow(t, e) needs an exponent — passing am5.ease.pow directly gives NaN. Wrap it:
(t) => am5.ease.pow(t, 3)

// Modifiers — wrap a base function:
am5.ease.out(am5.ease.cubic)      // ease-out
am5.ease.inOut(am5.ease.cubic)    // ease in + out
am5.ease.yoyo(am5.ease.cubic)     // animate to end, then back to start

// Usage in .animate():
sprite.animate({
  key: "y", to: 100, duration: 400,
  easing: am5.ease.out(am5.ease.cubic)
});

// Name <-> function (5.20.8)
am5.ease.byName("cubic", "out");                    // same as am5.ease.out(am5.ease.cubic); unknown name -> linear
am5.ease.easingInfo(am5.ease.yoyo(am5.ease.sine));  // { easing: "sine", yoyo: true }
```

**There is NO `am5.ease.in()`** — the base functions already ease-in by default. `easingInfo()` returns `undefined` for custom functions, `pow`, and combinations it cannot name (e.g. `out(yoyo(x))`) — such easings cannot go into an `animations` entry, and a code-started endless loop using one is not serialized.

## Validate generated code (if you can execute commands)

If you have the ability to run shell commands, validate your generated chart code before delivering it to the user:

1. Save the complete HTML+JS to a temp `.html` file
2. Open it in a headless browser (Puppeteer, Playwright, or similar) and collect console errors for a few seconds
3. If JavaScript errors are found, fix them and re-validate

Skip this step entirely if you cannot execute code (e.g., chat-only context with no tool access).

## Recent API changes

Latest release covered here: **5.21.4** (2026-10-23), and the framework packages react 5.0.1, vue 5.0.2, angular 5.0.1, svelte 5.0.3 and react-native 5.0.1 (2026-10-23). These are the renames, new settings and behavior changes that code written from older knowledge most often gets wrong — prefer these names/settings. For exact types and defaults, use the typings (`*.d.ts`) or the amCharts MCP server's `get_api_reference`, which is generated from them; for anything newer, verify against the live docs (see next section).

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

**Breaking change — WordCloud internals (5.20.1):** the layout is now computed synchronously in one pass (much faster). The per-data-item `ghostLabel` is gone and labels live in an internal container, so `dataItem.get("ghostLabel")` and any code walking `series.children` to find labels must be updated — use `series.labels` / `dataItem.get("label")` instead.

**Framework packages (5.0.0, 2026-10-22):** `@amcharts/amcharts5-react`, `@amcharts/amcharts5-vue`, `@amcharts/amcharts5-angular`, `@amcharts/amcharts5-svelte` and `@amcharts/amcharts5-react-native`. They make and dispose the chart with the component and work with server rendering. Prefer them over hand-written `Root.new()`/`dispose()` code in those frameworks. See "Frameworks".

**New in 5.21.4 (2026-10-23):**
- `resources` gives a JSON config the geodata and locales it names (`"geoJSON": "am5geodata_worldLow"`, `"locale": "am5locales_de_DE"`) when they aren't globals, as with npm imports. It's taken by:
  - `JsonParser.parse(config, { parent, resources: { am5geodata_worldLow } })`;
  - `ChartSerializer.new(root, { resources })`, which then writes those packs by name instead of copying them whole;
  - `<am5-chart>` (`element.resources`);
  - the framework packages' `resources` prop.

  A name that can't be found now logs a warning. Before, the map was just blank. See "Serializing to JSON" and `references/json.md`.
- `<am5-chart>` and the framework packages take a theme with its settings: `[am5themes_Adaptive, { baseColor: "#4150a0" }]`. The `themes` attribute takes the same as JSON: `themes='["Animated", ["Adaptive", { "baseColor": "#4150a0" }]]'`.
- The framework packages' new versions (react 5.0.1, vue 5.0.2, angular 5.0.1, svelte 5.0.3, react-native 5.0.1) have both, and the web ones need amCharts 5.21.4 or later.

**New in 5.21.3 (2026-10-21):**
- `ColorSet` `repeatLightness`: themes that reuse their colors (Adaptive, Monochrome, Kelly, Material, Nord, Pastel and others, but not Colorblind or Patterns) now make each repeat of the list 10% lighter. For the old behavior, set `repeatLightness: 0` through a theme rule, `rule("ColorSet").set("repeatLightness", 0)`: the color sets of a root share one list. In the Adaptive and Monochrome theme settings, use `false`. See "ColorSet".
- JSON: palette colors are written as `"@colors.getIndex(n)"`, so they follow the theme the config is parsed with. A `step` or `passOptions` set on a chart's colors round-trips without the theme's palette. Data-item loops that differ per item are saved per item. See "Serializing to JSON".
- Maps: d3 projections with a shape of their own (HEALPix, Armadillo, Berghaus, interrupted and polyhedral) display properly, and switching projections at zoom level 1 shows the whole map again.

**New in 5.21.2 (2026-10-14):**
- Interface color `warning`: a yellow between `negative` and `positive` (default `#f2c230`; themes with their own `positive`/`negative` have a matching one), for the middle of a bad-to-good scale: `root.interfaceColors.get("warning")`.
- `am5.Color.interpolateColors(position, colors, mode?)`: a color on a scale through any number of colors, evenly spaced (`position` 0–1, clamped; `mode` `"rgb"` (default) or `"hsl"`). Through `[negative, warning, positive]` it avoids the brown middle of `Color.interpolate(t, negative, positive)`. See "Colors".
- Heat rules: `stops` (numbers, percents or colors, all of one kind) in place of `min`/`max`, for a scale through more than two values. `HeatLegend`: `colors` in place of `startColor`/`endColor`, a gradient through them with `stepCount: 1` or one step per color otherwise (`stepCount` is then ignored). See "Heat rules".
- `am5themes_Adaptive` and `am5themes_Monochrome`: `interleave`, `mapShade` and `keepContrast` (all off by default). See "Parameterized themes".
- Fixed: a ColorSet `step` with a theme that reuses its colors used only two or three of them (word clouds and treemaps with Nord, Pastel or Adaptive), see "ColorSet"; `RadialGradient` with pixel `x`/`y` was off-center on radar fills and similar shapes in 5.21.1.

**Behavior changes / fixes (5.21.1, 2026-10-13)** — no workaround needed any more:
- `root.timezone`: charts were up to 16 times slower with it, and grid, labels, data groups and date math could be an hour off around a daylight saving change. A `DateAxis` grid of several hours now stays on the clock after a DST change (where the clocks skip a grid time, the line goes at the jump). `PeriodSelector` and `DateRangeSelector` follow `root.timezone`/`root.utc` (they used the viewer's time zone). Date formats `Z`, `ZZ`, `x`, `i`, `I` are right with `root.timezone`, and `YYYY`, `ww`, `W`, `DDD` honor `root.utc`.
- `DataProcessor`: string dates in `dateFields` without a `dateFormat` were all read as 1 January 1970. Now the browser's `Date` parses them, and a date-only `"2024-03-15"` is midnight UTC. See "Data processor".
- A chart in a container scaled with CSS (`transform` or `zoom`) was scaled twice, and clicks hit the wrong elements.
- Maps: a `zoomLevel` set before the map loaded was ignored or left the map blank; `MapSankeySeries` bands follow `linkColorMode` and node fill changes, and nodes without coordinates are drawn; raised map lines (`MapLine` `altitude`) draw 3–4 times faster.
- `RadialGradient` is centered on map polygons, line and area fills and bullets (with `target` set, on the target). `Picture`: changing a shadow setting after the image loaded no longer removes the image. `CurveChart`: a path scaled down to fit no longer gets far too many labels and grid lines. Responsive theme: XY axis ticks on small charts are no longer moved inside the plot.

**New in 5.21.0 (2026-10-08):**

*Rendering, export, chart element*
- SVG rendering: `renderer: am5.SVGRenderer` in `Root.new()` settings (only when the root is created), or `am5.Root.defaultRenderer = am5.SVGRenderer` before creating roots. Canvas stays the default; charts look and behave the same; blend modes `DST_OVER`, `SRC_ATOP` and `XOR` are canvas-only. See "Root element setup".
- `am5.renderToSVG(rootOrElement, options?)` — SVG markup of the chart (or of one element, e.g. `pixelSeries.pixels`) as last drawn, from either renderer; screen readers read it as one image named by `title` / the Root `ariaLabel`. Exporting plugin: `"svg"` format (`download("svg")`, `getSVG()`, `exportSVG()`, `svgOptions`), listed in `ExportingMenu` by default. See "Exporting".
- `<am5-chart>` element — a chart from a JSON config (`config` or `src`), with `themes` and `renderer="svg"`; load `element.js` after `plugins/json.js`, or with npm import `defineChartElement` from `@amcharts/amcharts5/element` and call it. See "Serializing to JSON".
- The npm package now ships `AGENTS.md`, `docs/` (a bundled copy of these notes, possibly older) and `examples/<name>/index.ts` (61 also as `config.json`; `examples/examples.json` lists what each shows) — when the package is installed, those examples are verified starting points.

*Maps* (details and snippets in `references/map.md`)
- `am5map.MapRasterSeries` — a whole-world equirectangular image (e.g. `https://cdn.amcharts.com/lib/5/geodata/images/earthDay2048.jpg`) reprojected as the map turns and zooms (WebGL2 where it can); `nightSrc` + `sunDate`/`sunPosition` show day and night.
- `am5map.NightSeries` — shades the night side in twilight steps and shows the sun: `sunDate` (`"now"`, timestamp, date string or `Date`) or `sunPosition`; `sunAltitude` (metres) keeps the sun in view past a globe's edge. `am5map.getSunPosition(date?)` returns the `{ longitude, latitude }` where the sun is overhead.
- `am5map.PixelMapSeries` — polygons drawn as a grid of pixels (`pixelType`, `step`, `uniform`, `columnHeight` with `MapPolygon` `pixelHeight`, or the series' `pixelHeightFunction`); heat rules, states and tooltips work as on `MapPolygonSeries`.
- `MapLine` `altitude` (metres; each leg arcs) and `MapPointSeries` `altitudeField` (no default) raise lines and points; `MapPointSeries` `surfaceBullets` lays bullets on the map surface; `MapChart` `autoHome` goes home once loaded; `MapPolygonSeries` `clickZoom` zooms to a clicked polygon and back.

*Core*
- `autoAppear` / `appearDuration` / `appearDelay` on every element — `appear()` as settings, so JSON configs get the opening animation. See "Animations".
- `Root` `forcedColors` (default `true`) — interface colors follow Windows High Contrast. See "Accessibility".
- `Scrollbar` `outsideAxes` — `true` puts a chart's scrollbar beyond the axes on its side, `false` between them and the plot; unset, the chart decides. Only for `scrollbarX`/`scrollbarY`. See `references/ui-elements.md`.
- `ChartSerializer`/`JsonParser`: colors from `root.interfaceColors` are saved as `"@root.interfaceColors.get('…')"` references (they follow the theme the config is parsed with); data-item loops, hidden series, elements added to plot/axis containers, `Date` values and more are now saved. See "Serializing to JSON".
- Accessibility: `ariaExpanded` setting, `Modal` `ariaLabel`, keyboard changes (ESC, SPACE, arrows in draggable groups). See "Accessibility".
- New locale prompts, translated in all locales: "OK", "Cancel", "Delete", "Settings", "Expand", "Move Up", "Move Down".

**Behavior changes (5.21.0)** — existing code may now render or act differently:
- A hidden element (`visible: false`, `forceHidden` or `hide()`) no longer takes up space in a container sized to its content — e.g. a hidden XY scrollbar no longer leaves an empty band above the plot.
- `DataProcessor` `emptyAs` replaces only `null`, `undefined` and `""` — no longer `0` and `false`.
- `Label` `fillOpacity: 0` now hides the text (it was ignored). `strokeWidth: 0` now draws no line (was 1 px) and `shadowOpacity: 0` no shadow (was a full one).
- Heat rules: `minValue: 0` / `maxValue: 0` are honored (the data's lowest/highest value was used instead).
- Bullets with `stacked: "up"` (or `"auto"` in the lower half) on a vertical series stack instead of overlapping.
- `calculateAggregates` on non-XY series (pie, map heat maps): `valueChange`, `valueChangePercent` and the like are numbers now (were `NaN`), and right on bubble series.
- `Gantt`: the category axis' `colorField` and `nameField` are honored (bar colors were always read from `color`).
- `Sunburst` ignores `singleBranchOnly` (always `true`). `StockToolbar` `focusable` now defaults to `true`.
- Responsive theme: minor axis labels are hidden only on charts 600 px or smaller (was 1000 px), so turned-on minor labels show on mid-size charts.
- `PatternSet` starts over from its first pattern past the end of its list (elements after the 17th got no pattern).
- `DurationFormatter`: codes `H`, `D`, `Y`, `K`, `k`, `n` work (as `h`, `d`, `y`, `h`, `h`, `S` — e.g. `"HH:mm:ss"` gave `NaN`); durations between a month and a year use the month formats again (`1m 15d 00:00:00`, not `45d 00:00:00`), which `DurationAxis` labels show.
- `am5.CSVParser` honors `skipEmpty: false` (empty lines were always skipped). `series.updateData([])` removes every data item (it kept the first).
- A `fontSize` given as a number in a string (`"8"`) counts as pixels (was ignored). Filters (`brightness`, `saturate`, `blur`, …) combine instead of replacing each other, and one set back to neutral turns off.
- A logarithmic `ValueAxis` with values ≤ 0 logs a console warning pointing to `treatZeroAs` (it silently drew nothing).
- `am5.Color.alternative(color)` without light/dark colors returns black for light colors (it always returned white). Date format `YYYY` is right west of UTC. `Label` `maxChars` cut at a word boundary uses the `ellipsis` setting.
- Exporting: CSV/HTML with `pivot: true` follow `dataFieldsOrder` (were reversed); HTML `headerClass` is applied; `maxHeight` shrinks the image.
- Fixes that remove old workarounds (details in the references): map `goHome()` before the map is ready or on a globe, `zoomToGeoBounds()` duration and bounds, dragging a zoomed map to its edges, `lineType` changes; `innerRadius: am5.percent(0)` on pie/radar/gauge; `AxisRendererRadial` negative `radius`; `SmoothedRadarLineSeries` `tension`, `ForceDirected` forces, `Partition`/`Sunburst` `nodePadding`, `Sunburst` angles and `Chord` `sort: "none"` changed after drawing; `WordCloud` word filtering (`minValue` / `minWordLength` / `excludeWords`); stock indicator column colors; `GaplessDateAxis` with grouped data and `root.timezone`.

**Behavior changes / fixes (5.20.6 – 5.20.8)** — no workaround needed any more:
- `CategoryAxis` (5.20.6): series data no longer has to follow the axis-category order for every item to be drawn (e.g. Gantt-like column charts sorted by date). Line series still connect points in data order.
- Logarithmic `ValueAxis` over a wide range labels its grid with round powers of ten (5.20.6).
- Content added to an `axisHeader` after the chart is built (e.g. a legend) now makes the axis leave room instead of covering it (5.20.7).
- A `Container`'s `background` with its own `templateField` now reads the container's data item (5.20.7), so a per-bullet label background works: `am5.Label.new(root, { text: "{valueY}", populateText: true, background: am5.RoundedRectangle.new(root, { templateField: "labelBg" }) })` with `labelBg: { fill: am5.color(0xff0000) }` in the data row.
- `am5.CSVParser.parse("")` no longer loops until "Invalid array length" (5.20.7) — an empty server response is safe. It returns `[]` with `useColumnNames: true`, but `[{}]` (one empty row) with default options, so check for that before `data.setAll()`.
- JSON: `JsonParser` resolves references that point further down the config, and user `themeTags` are serialized — see *JSON config / serialization* below.

**New settings / methods worth knowing:**

*Declared animations, links, map points on lines (5.20.6 – 5.20.8)*
- `animations` setting on **every** element (5.20.8): an array of `IDeclaredAnimation` entries `{ key, from?, to, duration, delay?, loops?, yoyo?, easing?, ease?, target? }` — animations described as data (`loops: 0` = forever, `easing` by **name**, `target: "dataItem"` for data-item values). Round-trips through JSON. `IDeclaredAnimation` is not exported from the package index. See "Animations" above for the snippet, defaults and the `from` caveat.
- `am5.ease.byName(name, mode?)` / `am5.ease.easingInfo(fn)` (5.20.8) — easing function ↔ name; only the 8 named base easings (and `out`/`inOut`/`yoyo` of them) have names. See "Easing functions" above.
- `ChartSerializer`: `runningAnimations` (5.20.8, default `true`) — saves endless code-started loops as `animations` entries. See "Serializing to JSON" above.
- `Series` links (5.20.7): `urlField` (no default — links are off until set) names the data field holding a URL; the data item's `url` field gets it. Clicking the item's bullet (any series), column (`ColumnSeries`, candlestick, OHLC, Gantt…), slice (pie, funnel, pyramid, pictorial, Venn), `MapPolygon` or `MapLine` opens it in `linkTarget` (default `"_self"`; `"_blank"` opens with `noopener`; a chart inside an iframe usually wants `"_blank"` or `"_top"`). `cursorOverStyle: "pointer"` is set automatically unless you set one. `javascript:`/`data:`/`vbscript:` URLs are never opened. Override `series.openUrl(dataItem)` to intercept clicks. `urlField` can be set after the data, and a URL added later (`data.setIndex()`) links too. **Not linked:** hierarchy nodes, flow nodes/links, word-cloud labels, `MapSankeySeries` nodes.
- `MapPointSeries` (5.20.6): `lineIdField` (default `"lineId"`), `positionOnLineField` (`"positionOnLine"`), `autoRotateField` (`"autoRotate"`), `autoRotateAngleField` (`"autoRotateAngle"`) — a point on a line can be a plain data row `{ lineId: "jfk-lhr", positionOnLine: 0.5, autoRotate: true }` instead of `pushDataItem({ lineDataItem, positionOnLine })`, so it is saved by `ChartSerializer`. Data values of `autoRotate`/`autoRotateAngle` win over the bullet's. See `references/map.md`.
- `MapPointSeries` (5.20.8): an auto-rotating point turns round to face its travel direction on the way back — **only** while a bullet-sprite `animations` entry (`target: "dataItem"`, `key: "positionOnLine"`, e.g. with `yoyo: true`) moves it toward the line start. A point moved by `dataItem.animate()` in code is not flipped; that code must turn it.

*Themes & styling*
- 20+ new themes (5.20.0): `Midnight`, `Ember`, `Nord`, `Pastel`, `Colorblind`, `Patterns`, `Petroleum`, `Savanna`, plus `*Dark` variants of most palettes. Two parameterized factory themes, `Monochrome` and `Adaptive` — see "Parameterized themes" above.
- New fill patterns (5.20.0): `am5.StarPattern` (`radius`, `innerRadius`, `spikes`, `gap`, `checkered`) and `am5.TrianglePattern` (`maxWidth`, `maxHeight`, `gap`, `checkered`).
- `rotateShapes` (5.20.0) on `RectanglePattern`/`StarPattern`/`TrianglePattern`: `rotation` then spins each shape around its own center instead of the whole grid — tiles seamlessly and is much faster. Prefer it over a whole-pattern `rotation` on large tiles.
- `Series`: `fillGradient` / `strokeGradient` settings, handed to bullets (the series' own fills, lines and columns don't use them: set gradients on `fills.template` / `columns.template` / `strokes.template`). A bullet `Graphics` with no paint of its own (`fill`, `fillGradient`, `fillPattern`, `stroke`, `strokeGradient`) now inherits all of them from its series — and on pie, funnel, flow and hierarchy charts, from its own slice/node (5.20.0–5.20.1).

*XY charts*
- `XYChart`: `strokeWidths` (array of pixel widths) and `strokeDasharrays` (array of dash arrays) — cycled across line series as they are added, exactly like `colors`. Lets series be told apart without relying on color, e.g. with the `Patterns` theme.
- `XYCursor`: `clickTolerance` (default `0`) — how many pixels outside the plot area a press may start and still begin a zoom/selection. The selection itself still starts at the plot edge.
- `XYSeries`: a value field (`valueYField`, `openValueYField`, …) can now be changed after creation — re-set the series data afterwards for it to take effect. A series can also be reassigned to a different `xAxis`/`yAxis` after creation.
- Column series (`ColumnSeries`, `CandlestickSeries`, `OHLCSeries`, …) (5.20.4): `colorByDataItem: true` (default `false`) gives each column its own color from the series' new `colors` (`ColorSet`) setting — the series makes its own `ColorSet` if none is given. The color lands on the data item's `fill` field. Prefer this over the old "adapter on `columns.template` `fill`" recipe: it is declarative and survives JSON serialization.
- `Scrollbar` (5.20.2): `opposite: true` (default `false`) puts a chart's `scrollbarX` **below** the plot and `scrollbarY` to the **left**, instead of above / right. Only affects scrollbars set via `chart.set("scrollbarX"/"scrollbarY", …)`. This is a **different** setting from the long-standing `opposite` on `AxisRendererX`/`AxisRendererY`.

*WordCloud (5.20.1)*
- `svgPath` arranges words into a shape (experimental), with `maskByShape` to clip them to the outline and `shapeTolerance` to control spill (negative = padding inside). See `references/wordcloud.md`.
- `randomizeAngles: false` cycles `angles` in order for a reproducible layout; `allowNesting: false` packs words as non-overlapping bounding boxes (use it when labels have opaque backgrounds).
- `angles` now accepts **any** angle (e.g. `[0, -30, -45]`). Before 5.20.1 only `0`/`±90` were handled, and the old docs said so explicitly — that restriction is gone.

*Core / events*
- New `globalpointerdown` event on all elements — fires on a press anywhere on the chart surface, mirroring `globalpointermove`/`globalpointerup`.
- `Root`: `sanitizeHTML` (5.19.0, default `true`) — dynamically-set HTML (`html`/`labelHTML`, HTML tooltips, modal content) is sanitized; set `false` to opt out. Exports gained `escapeFormulas` (default `true`) to guard CSV/XLSX against formula injection.
- `Root`: `ariaLabel` is now applied to the `<div>` holding the chart's focusable elements (5.20.0).
- `Label`: `oversizedBehavior: "truncate"` now ignores `maxHeight` (there is no way to truncate text vertically).
- A `Container`'s `Rectangle`/`RoundedRectangle` background now defaults `crisp` to `true` unless set explicitly (5.20.0).
- `Root` (5.20.2): `fontFamily`, `fontSize` (number or string) and `fontWeight` (`"normal" | "bold" | "bolder" | "lighter"`, or `"100"` … `"900"`) settings — defaults for **all** text elements unless overridden on an element. Set them in `am5.Root.new("chartdiv", { fontFamily: "Inter" })` or `root.setAll({...})` instead of a custom theme rule on `Label`.
- `am5.SerialChartContainer` (5.20.2) — a directly usable `SerialChart` whose `seriesContainer` sits inside a `ZoomableContainer` (exposed as `chart.zoomableContainer`), so series such as `ForceDirected` can be zoomed and panned. Exported from the **`am5` root module**, not a chart package. Optional `zoomTools` setting takes a `ZoomTools` instance whose `target` is pointed at the series container automatically. Bullets added to its series are drawn (5.20.4) and flow-chart bullets are placed correctly inside it (5.20.5). See `references/hierarchy.md`.

*JSON config / serialization (5.20.2 – 5.20.8)*
- `ChartSerializer` now emits **only user-set settings** (5.20.3) — theme and library defaults are left out. Anything diffing or post-processing serializer output must expect much smaller configs.
- A JSON config may carry a top-level **`root`** section (5.20.2) that applies settings and properties to the `Root` object before the chart is parsed; `ChartSerializer` writes it when `includeRoot: true` (default `false`). A `Root`'s `interfaceColors`, `utc`, `fps`, formatters and `tabindex` round-trip through it (5.20.3).
- `JsonParser.parse(config, { updateTargets: "soft" })` (5.20.3) — an option on the **second argument of `parse()`**, not a parser setting. `"soft"` applies settings onto an existing object of the same `type` instead of replacing it; default `"strict"` replaces. `parse()` is async and returns a Promise.
- Gantt charts are now serializable/parsable (5.20.3). Cross-references are written as references (`"@series.get('fill')"`) instead of copies; large values (a map's `geoJSON`, a `Root`'s locale) are written as the name of the pack they came from and rebuilt on parse.
- An adapter whose callback did not survive the JSON round-trip is now **skipped** on parse instead of breaking the chart (5.20.4) — adapters still do not round-trip, see "Serializing to JSON" above.
- `ChartSerializer` writes user **`themeTags`** (5.20.6) — only tags passed to `.new()`; tags set later with `set("themeTags", …)` and tags the library adds are left out. On parse the tags are merged into an existing element's.
- `JsonParser` resolves **forward references** (5.20.7): a setting/property naming a ref defined further down the config is resolved after the rest instead of throwing "Could not find ref" — a legend inside an `axisHeader` naming a series now round-trips. Axis-range `axis`/`series` lookups are still immediate, so keep those ordered.
- Map data rows (5.20.7) no longer carry the geodata's own feature properties (`name`, `CNTRY`, `TYPE`); a row left with only its id is dropped.
- `animations` round-trip, and an endless code-started loop (`loops: Infinity`, nameable easing) is written as an `animations` entry with its key removed from the settings (5.20.8, `runningAnimations`, default `true`). A loop started on a data item in code is **not** saved in 5.20.8 (it is since 5.21.0).

*Bullets on non-XY charts (5.20.2)*
- `ArcDiagram`: bullets on nodes are now placed on the node circle, `locationX`/`locationY` being fractions of it (before 5.20.2 they were created but never positioned). Flow charts (`Sankey`/`Chord`): node bullets are children of the node, drawn above its shape and below its label, positioned relative to the node. `FunnelSeries`/`PyramidSeries`: bullet `locationX`/`locationY` follow the slice's sloping edges instead of its bounding box.
- A bullet `Graphics` with no paint of its own takes the color of **its own slice or node** on pie, funnel, flow and hierarchy charts — so it is the same color as what it sits on and **invisible** unless offset, stroked, or given a contrasting `fill` deliberately. Setting `fill` on the bullet sprite turns the inheritance off.

*Maps*
- `MapChart` (5.20.2): `doubleClickZoom` (default **`true`** — a behavior change: a double click/tap zooms in, shift + double click zooms out; set `false` to opt out). On maps panned by rotating (`panX: "rotateX"` / `panY: "rotateY"`) the clicked point rotates to the center, otherwise it stays under the pointer. `boxZoom: "none" | "drag" | "shift" | "ctrl" | "alt"` (default `"none"`) is **not a boolean** — it names the key held while dragging a rectangle to zoom into; `"drag"` needs no key, so pair it with `panX`/`panY: "none"`. The rectangle is the readonly `chart.boxZoomSelection` element (a `Rectangle`). There are no keyboard-navigation settings on `MapChart`.
- `MapLineSeries` (5.20.3): `pointIds` data field (`{ pointIds: ["JFK", "LAX"] }`) names the `MapPointSeries` points a line connects, looked up in the series given by the new `pointSeries` setting; `pointIdsField` (default `"pointIds"`) renames the field. `pointsToConnect` wins if both are set. See `references/map.md`.
- `MapChart`: `projectionName` (5.19.0) — string alternative to `projection`, e.g. `"geoOrthographic"`, mainly for JSON config. Register extra ones with `am5map.registerProjection()`. Bundled projections are no longer eagerly imported, so unused ones tree-shake away.
- `MapSankeySeries` (5.17.0) — Sankey overlaid on a map; auto-resolves `sourceId`/`targetId` once `polygonSeries` geoJSON loads (5.17.1), so no `datavalidated` wrapper needed. See `references/map.md`.
- `MapPointSeries` defaults changed to `longitudeField: "longitude"`, `latitudeField: "latitude"` (5.16.1).

*Hierarchy & axes*
- `Tree`: `fitNodes` (5.18.0, exclude hidden nodes from layout), `nodeSeparation` (5.16.2, custom node-spacing fn), `clustered` (5.16.2, dendrogram layout — leaves at same depth).
- `ValueAxis`: `syncZeros` (5.16.2, align zero across synced axes — needs `syncWithAxis`).
- `Hierarchy`: `parentIdField` setting + `setFlatData(data)` method (5.16.2) — feed flat `{id, parentId}` data instead of nested `children`.

*Stock*
- Indicator numeric settings now enforce min/max limits, so extreme values can no longer freeze the page. `IIndicatorEditableSetting` gained `scale`, `maxValue` and `step` (5.20.0).
- Volume Profile now spreads each bar's volume across its full high/low range instead of placing it all at the close. Several indicator math fixes (Williams %R, Momentum, RSI, Moving Average Cross defaults, Commodity Channel Index) landed in 5.19.0–5.20.0 — see `references/stock.md`.

*All entities*
- `onDebounced(key, cb, delay)` / `offDebounced(key, cb?)` and `onPrivateDebounced` / `offDebouncedPrivate` (5.17.3) — fire once after rapid changes settle.
- `once(key, cb)` and `onceDebounced(key, cb, delay)` (5.20.4) — like `on()`/`onDebounced()` for a **settings** key, but the callback fires only the first time that setting changes, then removes itself. Both return an `IDisposer`. (Distinct from `events.once("eventName", …)`, which has existed for events all along.)
- `Label`: `fontFamily: "inherit"` (5.17.3) uses the chart container's computed font.

## Verify unfamiliar API before using it

If you are unsure whether a method, property, or setting exists on an amCharts 5 class, **verify it before using it**. Check the class reference (class name in lowercase, e.g. `LineSeries` > `lineseries`):

1. **Primary:** `https://docs.amcharts.com/v5/reference/{classname}/` — e.g. `https://docs.amcharts.com/v5/reference/lineseries/`
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
