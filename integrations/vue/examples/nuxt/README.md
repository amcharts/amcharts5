# amCharts 5 with Nuxt

A chart written in code, whose data changes without making the chart again,
and a chart from a JSON config. The page is rendered on the server; the
package loads amCharts in the browser only, so there is no `<ClientOnly>`.

```
npm install
npm run dev
```

| File | What it is |
|---|---|
| `app/chart.ts` | The chart in code: `buildChart()` builds it in the root it gets, as in any amCharts example, and returns a function that sets its data. |
| `app/config.ts` | The chart as a JSON config. |
| `app/app.vue` | `useAmChart()` for the chart in code, `<AmChart>` for the config. |
| `nuxt.config.ts` | `vite.optimizeDeps.include` has the dev server prepare amCharts before the first page. Without it, the charts fail to load the first time it starts. |

See the package's [README](../../README.md) for all options.
