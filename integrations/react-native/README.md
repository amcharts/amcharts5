# amCharts 5 for React Native

A React Native component for [amCharts 5](https://www.amcharts.com/docs/v5/).
The chart is drawn by the library itself, in a WebView, so every chart type,
theme and feature works as it does on the web, on canvas or as SVG.

```
npm install @amcharts/amcharts5-react-native react-native-webview
```

With Expo, `npx expo install react-native-webview`, then install this package.
It works in Expo Go.

It needs React Native 0.72 or later and react-native-webview 13 or later.
`@amcharts/amcharts5` does not have to be installed: the WebView loads the
library's script files, by default from the amCharts CDN. Each release of
this package loads the latest library version at the time, listed in its
CHANGELOG.


## A chart from a JSON config

```tsx
import { AmChart } from "@amcharts/amcharts5-react-native";

<AmChart config={config} themes={["Animated"]} style={{ height: 300 }} />
```

The config is a [JSON config](https://www.amcharts.com/docs/v5/concepts/serializing/),
as an object or a string. The chart types it uses are loaded for it, and so
is map geodata it names by its global name (`"geoJSON": "am5geodata_worldLow"`).
A config with different content makes the chart again; the same content
written inline on every render does not.


## A chart written in code

The code is a string, because it runs in the WebView, where the library is: a
function cannot be passed into a WebView. Write it as in any amCharts example
for script tags.

```tsx
const code = `
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

// New data, without making the chart again
return (newData) => {
  xAxis.data.setAll(newData);
  series.data.setAll(newData);
};
`;

<AmChart code={code} data={visits} themes={["Animated"]} style={{ height: 300 }} />
```

- The code gets `root`, `data` and `post`, and the library's globals: `am5`,
  `am5xy`, `am5themes_Animated` and so on. The files it uses are loaded for it.
  It may declare its own `data`, as many examples do.
- When `data` changes, by content, the function the code returned gets it.
  Without one, the chart is made again. If the code returns a promise,
  `onReady` waits for it.
- A different `code` makes the chart again.


## Events from the chart

`post(name, value)` in the chart's code calls `onMessage` in the app. The value
must be JSON.

```tsx
const code = `
...
series.columns.template.events.on("click", (event) => {
  post("tap", event.target.dataItem.dataContext.country);
});
`;

<AmChart code={code} data={visits} onMessage={(name, value) => {
  if (name === "tap") {
    navigation.navigate("Country", { country: value });
  }
}} />
```

A ref gives `run(code)`, which runs code in the chart's page with `root`,
`chart` (the chart a config made), `result` (what the code returned), `data`
and `post`. Called before the chart is ready, it waits for it.

```tsx
const chartView = useRef<AmChartHandle>(null);
...
<AmChart ref={chartView} config={config} />
...
// Hide the first series of the chart the config made
chartView.current?.run("chart.series.getIndex(0).hide()");
```


## Props

| Prop | What it is |
|---|---|
| `config` | The chart as a JSON config: an object or a JSON string. |
| `code` | The chart as code, used when there is no `config`. |
| `data` | Data for `code`, as `data`. It must be JSON. With a `config`, it is only there for `run()`. |
| `themes` | Theme names, e.g. `["Animated", "Dark"]`: the files in the library's `themes/` folder. A theme with settings is a pair: `["Adaptive", { baseColor: "#4150a0" }]`. |
| `renderer` | `"svg"` draws the chart as SVG; the default is canvas. SVG needs amCharts 5.21.0 or later. |
| `licenses` | amCharts license keys, which remove the logo: see [License](#license). |
| `modules` | More script files to load before the chart is built, e.g. `"locales/de_DE"` for a locale named only in a config, or full URLs. Chart types, themes, plugins, locales, fonts and geodata named by their global (`am5fonts_notosans_jp`) are loaded without this. |
| `libraryUrl` | Where the library's script files are. The default is the amCharts CDN's folder for the library version this package was released with. |
| `geodataUrl` | Where the geodata files are. The default is `https://cdn.amcharts.com/lib/5/geodata/`, or the `geodata/` folder of a `libraryUrl` that is not on the amCharts CDN. Fonts come from the same place. |
| `onReady` | Called when the chart is built. |
| `onError` | Called with a message when the chart could not be built or its code failed. Without it, the message goes to `console.warn`. |
| `onMessage` | Called with `(name, value)` when the chart's code calls `post`. |
| `style` | For the view the chart is in. Give it a height, or `flex: 1`; without one it is 400 high. |
| `webViewProps` | Props for the WebView, e.g. `{ androidLayerType: "hardware" }`, except the ones the chart needs: `source`, `onMessage`, `onShouldStartLoadWithRequest`, `onContentProcessDidTerminate`, `onRenderProcessGone`. |


## Where the library comes from

By default the WebView loads the library from the amCharts CDN, in the
version this package was released with, so updating the package updates the
library. The device
needs a connection the first time; after that the WebView caches the files
as a browser does.

To serve the files yourself, point `libraryUrl` at a folder with the
library's script files: the contents of the amCharts download, the same files
that are on the CDN. Shipping them inside the app, so that charts work
offline, needs a `file://` address the WebView is allowed to read. That
differs between iOS and Android, and is not covered here yet.


## Good to know

- Each chart is a WebView. A screen with many charts uses more memory, and a
  chart takes a moment to appear while its page loads.
- Chart code is a string, so your editor does not check it. Errors in it come
  to `onError`.
- What goes between the app and the chart (`config`, `data`, `post`) is JSON.
  A `Date` arrives as a string: give dates as timestamps (`date.getTime()`).
- `code` runs as code in the chart's page. Never build it from text a user
  typed or a server sent; pass such values in `data`.
- Links in the chart, such as the amCharts logo or a data item's `url`, open
  in the browser, not over the chart.
- Android's font size setting does not change the chart's text (`textZoom` is
  100); set `webViewProps={{ textZoom: ... }}` to change that.
- If the system ends the WebView's process, the chart's page is loaded again
  and the chart made again.


## License

Without a commercial amCharts license, the charts show a small amCharts logo:
that is the free license, in the LICENSE file. A commercial license removes
the logo. Give its keys with `licenses`, on each chart:

```tsx
<AmChart licenses={["AM5C-..."]} config={config} />
```

They are added before the chart is made. Calling `am5.addLicense()` in `code`
would be too late: a chart decides on the logo when its root is made.


## Example

[`examples/expo`](examples/expo/), for Expo Go: a chart in code whose data
changes without making it again and that sends taps to the app, a chart from a
JSON config with `run()`, and a map.

## More

- [amCharts 5 documentation](https://www.amcharts.com/docs/v5/) and [demos](https://www.amcharts.com/demos/)
- License: see [License](#license) above.
