# amCharts 5 with React and Vite

A chart written in code, whose data changes without making the chart again,
a chart from a JSON config, and a map from a JSON config, with its geodata
given in `resources`.

```
npm install
npm run dev
```

| File | What it is |
|---|---|
| `src/chart.ts` | The chart in code: `buildChart()` builds it in the root it gets, as in any amCharts example, and returns a function that sets its data. |
| `src/config.ts` | The chart as a JSON config. |
| `src/map.ts` | The map as a JSON config. It names its geodata, `am5geodata_worldLow`, instead of carrying it. |
| `src/App.tsx` | `useAmChart()` for the chart in code, `<AmChart>` for the configs. The map's `<AmChart>` gets its geodata, imported from `@amcharts/amcharts5-geodata`, in `resources`. |

See the package's [README](../../README.md) for all options.
