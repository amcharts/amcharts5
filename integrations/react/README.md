# amCharts 5 for React

React components for [amCharts 5](https://www.amcharts.com/docs/v5/): a chart
from a JSON config, and a hook for charts written in code. They create and
dispose the chart with the component, work in strict mode, and render on a
server (Next.js and others) without loading the library there.

```
npm install @amcharts/amcharts5 @amcharts/amcharts5-react
```

It needs amCharts 5.21.4 or later and React 18 or later. With amCharts older than 5.21,
the build fails with "Cannot resolve `@amcharts/amcharts5/element`".


## A chart written in code

`useAmChart` gives `setup` a new root; build the chart in it as in any amCharts
example. Put the returned `ref` on an element with a height.

```tsx
import { useAmChart } from "@amcharts/amcharts5-react";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

function VisitsChart({ data }) {
  const { ref } = useAmChart((root) => {
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

    xAxis.data.setAll(data);
    series.data.setAll(data);

    return series;
  }, [data]);

  return <div ref={ref} style={{ height: 400 }} />;
}
```

- The chart is made again, with `setup` run again, when a value in the second
  argument (`[data]` here) changes. Leave it out to make the chart once.
- `useAmChart` also returns `root`, and `result`: what `setup` returned. To
  change a chart without making it again, keep what you need from `result`,
  e.g. `result.data.setAll(newData)` for the series above.
- `useAmChart(setup, deps, { renderer: "svg" })` draws the chart as SVG.
- The chart is made when the element with `ref` is there, also when it is
  rendered later, e.g. after a loading message, and disposed when it goes.
- If `setup` throws, or the library cannot be loaded, the root is disposed
  and the error goes to the nearest error boundary, as an error in an effect
  does.


## A chart from a JSON config

```tsx
import { AmChart } from "@amcharts/amcharts5-react";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

<AmChart
  config={config}
  themes={[am5themes_Animated]}
  style={{ height: 400 }}
  onReady={({ root, chart }) => { /* the chart is built */ }}
/>
```

| Prop | What it is |
|---|---|
| `config` | The chart as a [JSON config](https://www.amcharts.com/docs/v5/concepts/serializing/): an object or a JSON string. A config with different content makes the chart again; the same content written inline on every render does not. |
| `src` | A URL to load the config from, used when there is no `config`. |
| `themes` | Theme classes, e.g. `[am5themes_Animated]`, or a class with its settings: `[[am5themes_Adaptive, { baseColor: "#4150a0" }]]`. Themes are not part of a config. In a variable of its own, type the list as `Array<ChartElementTheme>` (from `@amcharts/amcharts5/element`). |
| `resources` | Geodata and locales the config names, e.g. `{ am5geodata_worldLow }` for `"geoJSON": "am5geodata_worldLow"`. See below. |
| `renderer` | `"svg"` draws the chart as SVG; the default is canvas. |
| `onReady` | Called with `{ root, chart }` when the chart is built. |
| `onError` | Called when it could not be built. |
| `id`, `className`, `style` | For the chart's element. Give it a height; without one it is 400 pixels high. |

The chart types a config uses are loaded when it is built. `<AmChart>` is the
library's `<am5-chart>` element: a `ref` on it gives that element, with `root`,
`chart` and `whenReady()`, once the element's code has loaded (it is `null`
until then). `onReady` is the simpler way to get the chart.

A map's config names its geodata (`"geoJSON": "am5geodata_worldLow"`), and a
config may name a locale (`"locale": "am5locales_de_DE"`), instead of
carrying them. With script tags they are globals; with npm imports, import
the files the config names and give them in `resources`, under the same
names:

```tsx
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";

<AmChart config={mapConfig} resources={{ am5geodata_worldLow }} style={{ height: 400 }} />
```


## Next.js and other server rendering

Both are client components: they work in a page that is rendered on a server,
and the library is loaded only in the browser.

In the Next.js app router, a server component can render `<AmChart>` with a
`config`, because a config is plain data. Theme classes and `useAmChart` need
a client component (a file that starts with `"use client"`), because classes
and functions cannot be passed from a server component.

Your own imports of `@amcharts/amcharts5` in a component rendered on the
server are fine in Next.js. React Router (and Remix 2) and Astro leave them to
Node on the server, which cannot load the library: add it to the server bundle
in the Vite config (`vite` in `astro.config.mjs`):

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

Put it in the file that starts your app, e.g. `main.tsx`. In Next.js, put it at
the top of a client component's file. Not in the setup function: a chart decides on the
logo when its root is made, before `setup` runs.


## Unit tests

In jsdom (Jest, and Vitest by default) there is no canvas, so a chart cannot be
drawn: an error boundary gets the error. In tests that render a component with a chart, mock the
package.

With Vitest, e.g.:

```ts
vi.mock("@amcharts/amcharts5-react", () => ({
  useAmChart: () => ({ ref: () => {}, root: undefined, result: undefined }),
  AmChart: () => null,
}));
```


## Examples

Each shows a chart in code whose data changes without making it again, and a
chart from a JSON config:

- [Vite](examples/vite/), with a map whose geodata is given in `resources`
- [Next.js](examples/next/), with the config chart in a server component
- [React Router](examples/react-router/), rendered on the server
- [Astro](examples/astro/), in a React island

## More

- [amCharts 5 documentation](https://www.amcharts.com/docs/v5/) and [demos](https://www.amcharts.com/demos/)
- [Using amCharts 5 with React](https://www.amcharts.com/docs/v5/getting-started/integrations/react/)
- License: see [License](#license) above.
