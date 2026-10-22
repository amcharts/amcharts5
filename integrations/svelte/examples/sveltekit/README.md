# amCharts 5 with SvelteKit

A chart written in code, whose data changes without making the chart again,
and a chart from a JSON config, in Svelte 5. The page is rendered on the
server; attachments run in the browser only, so nothing has to be configured for
amCharts.

```
npm install
npm run dev
```

| File | What it is |
|---|---|
| `src/lib/chart.ts` | The chart in code: `buildChart()` builds it in the root it gets, as in any amCharts example, and returns a function that sets its data. |
| `src/lib/config.ts` | The chart as a JSON config. |
| `src/routes/+page.svelte` | `attachAmChart` for the chart in code, `attachAmChartConfig` on `<am5-chart>` for the config. In Svelte 4, the actions `use:amChart` and `use:amChartConfig` do the same. |

It uses the Node adapter; any adapter works. See the package's
[README](../../README.md) for all options.
