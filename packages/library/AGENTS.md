# amCharts 5: notes for AI coding agents

This folder is the amCharts 5 library in the version this project uses. Use
what is here before what you remember: the API is not the amCharts 4 API, and
this version may be newer than your training data.

## Where to look

| For | Read |
|---|---|
| Rules, the module map, patterns shared by all charts | `docs/index.md` |
| One chart family (xy, pie, map, stock, gantt, hierarchy, flow, radar, timeline, wordcloud, venn, ui-elements) | `docs/references/<family>.md` |
| A chart as a JSON config (for Chart Maker, `<am5-chart>` or the framework packages' `config`) | `docs/references/json.md` |
| Working code to start from | `examples/`, listed with descriptions and tags in `examples/examples.json` |
| What changed, newest first | `CHANGELOG.md` |
| The exact API | the typings (`*.d.ts`); the npm package has them, the script version does not |

In the npm package an example is `examples/<name>/index.ts`, with `config.json`
(the same chart as a JSON config) and `data.json` beside it where they exist.
In the script version (zip, CDN) it is `examples/<name>/index.html` and
`json.html`.

`docs/` is written for a released version and can be behind this one. Where it
and `CHANGELOG.md` disagree, the changelog is right.

## Rules that are most often broken

1. **amCharts 5 only.** No `am4core`, no `am4charts`, no `am5.create()`.
   No amCharts object is made with `new`: each is `ClassName.new(root, { ... })`.
2. **One root per element.** `const root = am5.Root.new("chartdiv");` comes
   first, and the element needs a height. Call `root.dispose()` when the
   element goes away (component unmount), or before making another root in it.
3. **Themes go on the root:**
   `root.setThemes([am5themes_Animated.new(root)]);`
4. **Colors and percents are objects:** `am5.color(0xff0000)` and
   `am5.percent(50)`, not strings.
5. **Every axis needs a renderer**, e.g.
   `renderer: am5xy.AxisRendererX.new(root, {})`.
6. **A category axis needs the data too:** `xAxis.data.setAll(data)` as well as
   `series.data.setAll(data)`.
7. **Date axes take timestamps** (numbers), not `Date` objects or strings, and
   need a `baseInterval`, e.g. `{ timeUnit: "day", count: 1 }`. For date strings,
   give the series a processor before setting its data:
   `series.data.processor = am5.DataProcessor.new(root, { dateFields: ["date"], dateFormat: "yyyy-MM-dd" });`
8. **Set data last**, after the series, axes and templates are configured.
9. **Style through settings and templates**, e.g.
   `series.columns.template.setAll({ ... })`. CSS does not reach inside a chart.
10. **Maps need geodata**, which is a separate package:
    `@amcharts/amcharts5-geodata`.

## Modules

With npm each family is an import; with script tags each file makes a global of
the same name.

| Import | Global | Script file |
|---|---|---|
| `@amcharts/amcharts5` | `am5` | `index.js` |
| `@amcharts/amcharts5/xy` | `am5xy` | `xy.js` |
| `@amcharts/amcharts5/percent` | `am5percent` | `percent.js` |
| `@amcharts/amcharts5/map` | `am5map` | `map.js` |
| `@amcharts/amcharts5/stock` | `am5stock` | `stock.js` (after `xy.js`) |
| `@amcharts/amcharts5/gantt` | `am5gantt` | `gantt.js` (after `xy.js` and `plugins/colorPicker.js`) |
| `@amcharts/amcharts5/hierarchy` | `am5hierarchy` | `hierarchy.js` |
| `@amcharts/amcharts5/flow` | `am5flow` | `flow.js` |
| `@amcharts/amcharts5/radar` | `am5radar` | `radar.js` (after `xy.js`) |
| `@amcharts/amcharts5/timeline` | `am5timeline` | `timeline.js` (after `xy.js`) |
| `@amcharts/amcharts5/wc` | `am5wc` | `wc.js` |
| `@amcharts/amcharts5/venn` | `am5venn` | `venn.js` |
| `@amcharts/amcharts5/themes/Animated` | `am5themes_Animated` | `themes/Animated.js` |
| `@amcharts/amcharts5/plugins/exporting` | `am5plugins_exporting` | `plugins/exporting.js` |
| `@amcharts/amcharts5/plugins/json` | `am5plugins_json` | `plugins/json.js` |
| `@amcharts/amcharts5/element` (defines `<am5-chart>`) | `am5element` | `element.js` (after `plugins/json.js`) |
| `@amcharts/amcharts5/locales/de_DE` | `am5locales_de_DE` | `locales/de_DE.js` |

## A chart that works

```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

root.setThemes([
  am5themes_Animated.new(root)
]);

const chart = root.container.children.push(am5xy.XYChart.new(root, {}));

const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "country",
  renderer: am5xy.AxisRendererX.new(root, {})
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));

const series = chart.series.push(am5xy.ColumnSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  categoryXField: "country",
  valueYField: "visits"
}));

const data = [
  { country: "France", visits: 1114 },
  { country: "Germany", visits: 1322 },
  { country: "Spain", visits: 711 },
  { country: "Italy", visits: 984 }
];

xAxis.data.setAll(data);
series.data.setAll(data);
```

## Three ways a chart can be made

* **In code**, as above.
* **From a JSON config**, with `am5plugins_json.JsonParser.new(root).parse(config, { parent: root.container })`.
  Any example with a `config.json` shows the format. Themes are set in code,
  not in the config. A config cannot call `appear()`: for the opening
  animation, set `"autoAppear": true` (with `appearDuration`, `appearDelay`)
  on the chart and on each series.
* **As an element**, `<am5-chart>`, which takes a JSON config (`config`
  attribute or property, or `src` for a URL) and needs no root or chart code.
  Themes: the `themes` property with theme classes, or with script tags the
  `themes` attribute with names (`themes="Animated"`); a theme with settings is
  a pair, `[am5themes_Adaptive, { baseColor: "#4150a0" }]`. A config names its
  geodata (`"geoJSON": "am5geodata_worldLow"`) and locale; with npm they are not
  globals, so pass them: `element.resources = { am5geodata_worldLow }` (also
  `JsonParser.parse(config, { resources })`). With script tags, every
  chart type the config uses must be loaded first. `element.whenReady()`
  returns a promise of `{ root, chart }`; the events are `ready` and `error`.
  The example `misc-chart-element` shows it.

Charts are drawn on canvas unless the root is created with
`{ renderer: am5.SVGRenderer }`.

## In React, Vue, Angular or Svelte

Use the framework's package instead of writing the mount and dispose code by
hand. Each handles disposal, React's double mount in development, and server
rendering (it loads the library in the browser only):

| Framework | Package | A chart in code | A chart from a JSON config |
|---|---|---|---|
| React | [`@amcharts/amcharts5-react`](https://github.com/amcharts/amcharts5/tree/master/integrations/react) | `useAmChart(setup, deps)` | `<AmChart config={config} />` |
| Vue | [`@amcharts/amcharts5-vue`](https://github.com/amcharts/amcharts5/tree/master/integrations/vue) | `useAmChart(templateRef, setup)` | `<AmChart :config="config" />` |
| Angular | [`@amcharts/amcharts5-angular`](https://github.com/amcharts/amcharts5/tree/master/integrations/angular) | `<div [amChart]="setup">` | `<am5-chart [config]="config">` |
| Svelte | [`@amcharts/amcharts5-svelte`](https://github.com/amcharts/amcharts5/tree/master/integrations/svelte) | `<div {@attach attachAmChart(setup)}>` | `<am5-chart {@attach attachAmChartConfig({ config })}>` |

In a chart written in code, the setup function gets the root: do not call
`am5.Root.new()` or `root.dispose()` yourself. Give the chart's element a
height. The chart is made again only when its dependencies change; to update
data, keep what the setup function returns (`result`) and call
`series.data.setAll()` on it.

- In Svelte 4 and older Svelte 5, use the actions `use:amChart` and
  `use:amChartConfig` instead of the attachments.
- A license key goes in `am5.addLicense()` once when the app starts, before
  any chart is made, not in the setup function.
- React Router, Astro and SvelteKit's dev server need
  `ssr: { noExternal: ["@amcharts/amcharts5"] }` in the Vite config. Nuxt
  needs `vite: { optimizeDeps: { include: ["@amcharts/amcharts5",
  "@amcharts/amcharts5/element"] } }`. Next.js and Angular need nothing.

In React Native, use [`@amcharts/amcharts5-react-native`](https://github.com/amcharts/amcharts5/tree/master/integrations/react-native): the
chart runs in a WebView, so its code is a string written for script tags
(`am5xy.XYChart`, not imports), with `root`, `data` and `post(name, value)`
in scope, and everything passed to it must be JSON (dates as timestamps).
License keys go in its `licenses` prop. A JSON config is the simpler choice
there.

## Before you finish

* If the project has TypeScript, run its type check: the typings catch most
  wrong setting names. They need TypeScript 5.0 or later.
* Do not invent a setting. If it is not in `docs/`, an example or the typings,
  it does not exist.
* Keep the amCharts logo unless the project has a commercial license; removing
  it without one breaks the license (see `LICENSE`).
