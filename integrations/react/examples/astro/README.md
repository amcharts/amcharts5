# amCharts 5 with Astro

A chart written in code, whose data changes without making the chart again,
and a chart from a JSON config, in a React island. With `client:load` the
island is rendered on the server too; the package loads amCharts in the
browser only.

```
npm install
npm run dev
```

| File | What it is |
|---|---|
| `src/components/chart.ts` | The chart in code: `buildChart()` builds it in the root it gets, as in any amCharts example, and returns a function that sets its data. |
| `src/components/config.ts` | The chart as a JSON config. |
| `src/components/Charts.tsx` | The island: `useAmChart()` for the chart in code, `<AmChart>` for the config. |
| `src/pages/index.astro` | The page, with the island. |
| `astro.config.mjs` | `vite.ssr.noExternal` puts amCharts into the server build. Without it the server fails: Node cannot load amCharts' files on its own. |

See the package's [README](../../README.md) for all options.
