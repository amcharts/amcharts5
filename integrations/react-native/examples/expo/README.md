# amCharts 5 with React Native and Expo

Three charts, each drawn by amCharts in a WebView:

- a chart written in code, whose data changes without making it again, and
  which tells the app which column was tapped
- a chart from a JSON config, animated again with `run()`
- a map from a JSON config, with its geodata loaded for it

```
npm install
npx expo start
```

Then open it in Expo Go on a phone.

| File | What it is |
|---|---|
| `src/charts.ts` | The chart code, a string that runs in the WebView, and the two configs. |
| `App.tsx` | The three `<AmChart>` components: `data`, `onMessage` and `run()`. |

The library comes from the amCharts CDN, so the phone needs a connection the
first time. See the package's [README](../../README.md) for all options.
