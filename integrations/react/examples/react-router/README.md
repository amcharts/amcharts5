# amCharts 5 with React Router

A chart written in code, whose data changes without making the chart again,
and a chart from a JSON config, in React Router's framework mode (what Remix 2
became). The page is rendered on the server; the package loads amCharts in the
browser only, so there is no `.client.tsx` file and no `ClientOnly`.

```
npm install
npm run dev
```

| File | What it is |
|---|---|
| `app/chart.ts` | The chart in code: `buildChart()` builds it in the root it gets, as in any amCharts example, and returns a function that sets its data. |
| `app/config.ts` | The chart as a JSON config. |
| `app/Charts.tsx` | `useAmChart()` for the chart in code, `<AmChart>` for the config. |
| `vite.config.ts` | `ssr.noExternal` puts amCharts into the server build. Without it the server fails: Node cannot load amCharts' files on its own. |

See the package's [README](../../README.md) for all options.
