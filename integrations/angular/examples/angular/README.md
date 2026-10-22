# amCharts 5 with Angular

A chart written in code, whose data changes without making the chart again,
and a chart from a JSON config, with server-side rendering. The package loads
amCharts in the browser only, after the first render, and runs the charts
outside Angular's zone.

```
npm install
npm run dev
```

`npm run build` and then `npm start` serve the server-rendered build.

| File | What it is |
|---|---|
| `src/app/chart.ts` | The chart in code: `buildChart()` builds it in the root it gets, as in any amCharts example, and returns a function that sets its data. |
| `src/app/config.ts` | The chart as a JSON config. |
| `src/app/app.ts` | The `[amChart]` directive for the chart in code, the `<am5-chart>` component for the config. |
| `src/server.ts` | Angular's server. `allowedHosts` lists the hosts it answers: add yours when you deploy. |

The rest is what `ng new --ssr` makes. See the package's
[README](../../README.md) for all options.
