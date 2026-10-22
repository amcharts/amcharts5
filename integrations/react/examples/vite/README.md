# amCharts 5 with React and Vite

A chart written in code, whose data changes without making the chart again,
and a chart from a JSON config.

```
npm install
npm run dev
```

| File | What it is |
|---|---|
| `src/chart.ts` | The chart in code: `buildChart()` builds it in the root it gets, as in any amCharts example, and returns a function that sets its data. |
| `src/config.ts` | The chart as a JSON config. |
| `src/App.tsx` | `useAmChart()` for the chart in code, `<AmChart>` for the config. |

See the package's [README](../../README.md) for all options.
