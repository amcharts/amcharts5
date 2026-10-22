# amCharts 5 with Next.js

A chart written in code, whose data changes without making the chart again,
and a chart from a JSON config, in the app router. The page is rendered on the
server; the package loads amCharts in the browser only.

```
npm install
npm run dev
```

| File | What it is |
|---|---|
| `app/chart.ts` | The chart in code: `buildChart()` builds it in the root it gets, as in any amCharts example, and returns a function that sets its data. |
| `app/config.ts` | The chart as a JSON config. |
| `app/CodeChart.tsx` | A client component with `useAmChart()`: it has state, and gives the hook a function. |
| `app/page.tsx` | A server component. It renders `<AmChart>` with the config itself, because a config is plain data. |

Nothing in `next.config` is needed for amCharts. See the package's
[README](../../README.md) for all options.
