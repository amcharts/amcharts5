# amCharts 5 integrations

Packages that put amCharts 5 into a framework. Each creates the chart with the
component and disposes it with it, and takes a chart written in code or a
JSON config. The web packages work with server rendering, because they load
the library in the browser only.

| Folder | Package | Needs |
|---|---|---|
| [`react/`](react/) | `@amcharts/amcharts5-react` | React 18 or later |
| [`vue/`](vue/) | `@amcharts/amcharts5-vue` | Vue 3.5 or later |
| [`angular/`](angular/) | `@amcharts/amcharts5-angular` | Angular 19 or later |
| [`svelte/`](svelte/) | `@amcharts/amcharts5-svelte` | Svelte 4 or later |
| [`react-native/`](react-native/) | `@amcharts/amcharts5-react-native` | React Native 0.72 and react-native-webview 13 or later |

The web packages need amCharts 5.21.4 or later: their JSON config components
are built on its `<am5-chart>` element. The React Native package draws the
chart in a WebView, which loads the library's script files, by default from
the amCharts CDN.

Each package has its own version and CHANGELOG, and examples in
`examples/`: small apps for each framework setup, each with its README. They
install the packages from npm.

## Building

Build the library first (`yarn build` in the parent folder): the web packages
take its typings from `../dist/es2015`. Then, in a package's folder:

```
npm ci --legacy-peer-deps
npm run build
```

`--legacy-peer-deps` keeps npm from installing `@amcharts/amcharts5` from
npm: the packages are built against this one. `npm pack` builds and packs
React, Vue, Svelte and React Native. Angular is built with ng-packagr into
`dist/`, which is the package: `npm run pack` there. The React Native build
also writes `src/generated.ts`: the page the chart is drawn in, with the
library's list of classes.
