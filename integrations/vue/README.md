# amCharts 5 for Vue

Vue components for [amCharts 5](https://www.amcharts.com/docs/v5/): a chart
from a JSON config, and a composable for charts written in code. They create
and dispose the chart with the component, and render on a server (Nuxt and
others) without loading the library there.

```
npm install @amcharts/amcharts5 @amcharts/amcharts5-vue
```

It needs amCharts 5.21.4 or later and Vue 3.5.2 or later. With amCharts older than 5.21,
the build fails with "Cannot resolve `@amcharts/amcharts5/element`".


## A chart written in code

`useAmChart` takes the template ref of the chart's element and gives `setup` a
new root; build the chart in it as in any amCharts example. The element needs
a height.

```vue
<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useAmChart } from "@amcharts/amcharts5-vue";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const props = defineProps<{ data: Array<{ country: string, visits: number }> }>();

useAmChart(useTemplateRef("chart"), (root) => {
  root.setThemes([am5themes_Animated.new(root)]);

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

  xAxis.data.setAll(props.data);
  series.data.setAll(props.data);

  return series;
}, { watch: () => props.data });
</script>

<template>
  <div ref="chart" style="height: 400px"></div>
</template>
```

- `watch` makes the chart again, with `setup` run again, when it changes. It
  takes what Vue's `watch()` takes: a getter, a ref, a reactive object or an
  array of them. Leave it out to make the chart once. Add `deep: true` to
  make the chart again when what is inside changes, e.g. `props.data.push()`.
- `useAmChart` returns `root`, and `result`: what `setup` returned, as shallow
  refs. To change a chart without making it again, keep what you need from
  `result`, e.g. `result.value.data.setAll(newData)` for the series above.
- `{ renderer: "svg" }` in the options draws the chart as SVG.
- The chart is made when the element is there, also when it is rendered
  later (`v-if`), and disposed when it goes.
- If `setup` throws, or the library cannot be loaded, the root is disposed
  and the error goes to `app.config.errorHandler`.
- Give amCharts plain data, not Vue's reactive copies: keep it in a
  `shallowRef`, or pass `toRaw(data)`.


## A chart from a JSON config

```vue
<script setup lang="ts">
import { AmChart } from "@amcharts/amcharts5-vue";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
</script>

<template>
  <AmChart :config="config" :themes="[am5themes_Animated]" style="height: 400px" @ready="onReady" />
</template>
```

| Prop or event | What it is |
|---|---|
| `config` | The chart as a [JSON config](https://www.amcharts.com/docs/v5/concepts/serializing/): an object or a JSON string. A config with different content makes the chart again; the same content written inline does not. |
| `src` | A URL to load the config from, used when there is no `config`. |
| `themes` | Theme classes, e.g. `[am5themes_Animated]`, or a class with its settings: `[[am5themes_Adaptive, { baseColor: "#4150a0" }]]`. Themes are not part of a config. In a variable of its own, type the list as `Array<ChartElementTheme>` (from `@amcharts/amcharts5/element`). |
| `resources` | Geodata and locales the config names, e.g. `{ am5geodata_worldLow }` for `"geoJSON": "am5geodata_worldLow"`. See below. |
| `renderer` | `"svg"` draws the chart as SVG; the default is canvas. |
| `@ready` | `{ root, chart }`, when the chart is built. |
| `@error` | When it could not be built. |

Give the component a height with `style` or a class; without one it is 400
pixels high. The chart types a config uses are loaded when it is built.
`<AmChart>` is the library's `<am5-chart>` element; the component exposes it
as `element`, with `root`, `chart` and `whenReady()`, once the element's code
has loaded (`null` until then). For a typed template ref:
`useTemplateRef<AmChartExposed>("chart")`. `@ready` is the simpler way to get
the chart.

A map's config names its geodata (`"geoJSON": "am5geodata_worldLow"`), and a
config may name a locale (`"locale": "am5locales_de_DE"`), instead of
carrying them. With script tags they are globals; with npm imports, import
the files the config names and give them in `resources`, under the same
names:

```vue
<script setup lang="ts">
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
</script>

<template>
  <AmChart :config="mapConfig" :resources="{ am5geodata_worldLow }" style="height: 400px" />
</template>
```


## Nuxt and other server rendering

Both work in pages that are rendered on a server: the library is loaded only
in the browser, once the component is mounted.

In Nuxt, add this to `nuxt.config.ts`. Without it, the dev server prepares
amCharts while the first page loads, and the charts fail to load until it is
started again:

```ts
vite: {
  optimizeDeps: {
    include: ["@amcharts/amcharts5", "@amcharts/amcharts5/element"]
  }
}
```


## License

Without a commercial amCharts license, the charts show a small amCharts logo:
that is the free license, in the LICENSE file. A commercial license removes
the logo. Add its key once, when the app starts, before any chart is made:

```ts
import * as am5 from "@amcharts/amcharts5";

am5.addLicense("AM5C-...");
```

Put it in `main.ts`, before `createApp()`. In Nuxt, put it in a client plugin,
e.g. `plugins/amcharts.client.ts`. Not in the setup function: a chart decides on the
logo when its root is made, before `setup` runs.


## Unit tests

In jsdom (Jest, and Vitest by default) there is no canvas, so a chart cannot be
drawn: `app.config.errorHandler` gets the error. In tests that render a component with a chart, mock the
package.

With Vitest, e.g.:

```ts
vi.mock("@amcharts/amcharts5-vue", () => ({
  useAmChart: () => ({ root: { value: undefined }, result: { value: undefined } }),
  AmChart: { render: () => null },
}));
```


## Examples

Each shows a chart in code whose data changes without making it again, and a
chart from a JSON config:

- [Vite](examples/vite/)
- [Nuxt](examples/nuxt/), rendered on the server

## More

- [amCharts 5 documentation](https://www.amcharts.com/docs/v5/) and [demos](https://www.amcharts.com/demos/)
- [Using amCharts 5 with Vue](https://www.amcharts.com/docs/v5/getting-started/integrations/vue/)
- License: see [License](#license) above.
