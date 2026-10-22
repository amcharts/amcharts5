# amCharts 5 for Svelte

[amCharts 5](https://www.amcharts.com/docs/v5/) in Svelte: a chart written in
code, and a chart built from a JSON config, as attachments (Svelte 5.29 or
later) or actions (Svelte 4 and older Svelte 5). They create and dispose the
chart with the element, and render on a server (SvelteKit) without loading the
library there, since attachments and actions run only in the browser.

```
npm install @amcharts/amcharts5 @amcharts/amcharts5-svelte
```

It needs amCharts 5.21.0 or later and Svelte 4 or later. With an older amCharts,
the build fails with "Cannot resolve `@amcharts/amcharts5/element`".


## A chart written in code

`attachAmChart` gives the function a new root in the element; build the chart
in it as in any amCharts example. The element needs a height.

```svelte
<script lang="ts">
  import { attachAmChart } from "@amcharts/amcharts5-svelte";
  import type { Root } from "@amcharts/amcharts5";
  import * as am5xy from "@amcharts/amcharts5/xy";
  import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

  let { data } = $props();

  // What buildChart() gives back: the series, to change its data later
  let series = $state.raw<am5xy.ColumnSeries>();

  function buildChart(root: Root) {
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5xy.XYChart.new(root, {}));

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "country",
      renderer: am5xy.AxisRendererX.new(root, {})
    }));

    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    series = chart.series.push(am5xy.ColumnSeries.new(root, {
      xAxis: xAxis,
      yAxis: yAxis,
      categoryXField: "country",
      valueYField: "visits"
    }));
  }

  // New data changes the chart in place, without making it again
  $effect(() => {
    if (series) {
      const rows = $state.snapshot(data);
      series.get("xAxis").data.setAll(rows);
      series.data.setAll(rows);
    }
  });
</script>

<div {@attach attachAmChart(buildChart)} style="height: 400px"></div>
```

- The chart is made when the element is there, and disposed when it goes.
  Like any attachment, it is made again when state read in its expression
  changes; what `buildChart` reads does not count.
- `attachAmChart(buildChart, { renderer: "svg" })` draws the chart as SVG.
- `attachAmChart(buildChart, { onError })`: called when `buildChart` throws
  or the library cannot be loaded. Without it the error is reported as
  uncaught, for `window.onerror` and error trackers.
- Give amCharts plain data: `$state.snapshot()` turns Svelte state into it.

### As an action

`use:amChart` does the same in Svelte 4 and older Svelte 5:

```svelte
<div use:amChart={{ setup: buildChart, deps: [data] }} style="height: 400px"></div>
```

`use:amChart={buildChart}` makes the chart once. With `deps` it is made again,
with `setup` run again, when a value in `deps` changes. Data is compared by
content, so changing a `$state` array in place counts too. It takes
`renderer` and `onError` as well.


## A chart from a JSON config

Put `attachAmChartConfig` on the library's `<am5-chart>` element:

```svelte
<script lang="ts">
  import { attachAmChartConfig } from "@amcharts/amcharts5-svelte";
  import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
</script>

<am5-chart
  {@attach attachAmChartConfig({ config, themes: [am5themes_Animated] })}
  onready={(event) => console.log(event.detail.chart)}
  style="height: 400px"></am5-chart>
```

| Option | What it is |
|---|---|
| `config` | The chart as a [JSON config](https://www.amcharts.com/docs/v5/concepts/serializing/): an object or a JSON string. |
| `src` | A URL to load the config from, used when there is no `config`. |
| `themes` | Theme classes, e.g. `[am5themes_Animated]`. Themes are not part of a config. |
| `renderer` | `"svg"` draws the chart as SVG; the default is canvas. |

The element dispatches `ready` (`event.detail` has `root` and `chart`) and
`error` (`event.detail` has the error): `onready` and `onerror` in Svelte 5,
`on:ready` and `on:error` in Svelte 4 and in components in legacy mode. Give
it a height; without one it is 400 pixels high. The chart types a config uses
are loaded when it is built.

In Svelte 4 and older Svelte 5, use the action instead:
`<am5-chart use:amChartConfig={{ config }}>`. With the action, a config with
the same content written inline does not make the chart again.

The attachment or action is needed because the element's code is loaded in
the browser only: it waits for it before giving the element its config. The
package also tells `svelte-check` about `<am5-chart>` and its events.


## SvelteKit

Both work in pages that are rendered on a server. The production build needs
nothing, but SvelteKit's dev server leaves amCharts to Node, which cannot load
its files. Add it to the server build in `vite.config.ts`:

```ts
ssr: {
  noExternal: ["@amcharts/amcharts5"]
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

Put it in `src/hooks.client.ts`, which runs when the app starts in the browser. Not in the setup function: a chart decides on the
logo when its root is made, before `setup` runs.


## Unit tests

In jsdom (Jest, and Vitest by default) there is no canvas, so a chart cannot be
drawn: the error is reported as uncaught, unless you give an `onError`. In tests that render a component with a chart, mock the
package.

With Vitest, e.g.:

```ts
vi.mock("@amcharts/amcharts5-svelte", () => ({
  attachAmChart: () => () => () => {},
  attachAmChartConfig: () => () => () => {},
  amChart: () => ({}),
  amChartConfig: () => ({}),
}));
```


## Example

[`examples/sveltekit`](examples/sveltekit/), in Svelte 5: a chart in code
whose data changes without making it again, and a chart from a JSON config.

## More

- [amCharts 5 documentation](https://www.amcharts.com/docs/v5/) and [demos](https://www.amcharts.com/demos/)
- [Using amCharts 5 with SvelteKit](https://www.amcharts.com/docs/v5/getting-started/integrations/using-amcharts-5-with-sveltekit/)
- License: see [License](#license) above.
