# amCharts 5 for Angular

An Angular component and directive for [amCharts 5](https://www.amcharts.com/docs/v5/):
a chart from a JSON config, and a chart written in code. They create and
dispose the chart with the element, render on a server (Angular SSR) without
loading the library there, and keep the chart's animation frames out of
Angular's change detection.

```
npm install @amcharts/amcharts5 @amcharts/amcharts5-angular
```

It needs amCharts 5.21.0 or later and Angular 19 or later. With an older amCharts,
the build fails with "Cannot resolve `@amcharts/amcharts5/element`". Both are standalone:
add them to a component's `imports`.


## A chart written in code

`[amChart]` gives the function a new root in the element; build the chart in it
as in any amCharts example. Write the function as an arrow function property,
so that `this` is the component. The element needs a height.

```ts
import { Component, input } from "@angular/core";
import { AmChartDirective } from "@amcharts/amcharts5-angular";
import type { Root } from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

@Component({
  selector: "app-visits",
  imports: [AmChartDirective],
  template: `<div [amChart]="buildChart" [amChartDeps]="[data()]" style="height: 400px"></div>`,
})
export class VisitsComponent {
  data = input.required<Array<{ country: string, visits: number }>>();

  buildChart = (root: Root) => {
    root.setThemes([am5themes_Animated.new(root)]);

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

    xAxis.data.setAll(this.data());
    series.data.setAll(this.data());

    return series;
  };
}
```

| Input or output | What it is |
|---|---|
| `[amChart]` | The function that builds the chart in the root it gets. |
| `[amChartDeps]` | Values that make the chart again, with the function run again, when one of them changes. Leave it out to make the chart once. |
| `[amChartRenderer]` | `"svg"` draws the chart as SVG; the default is canvas. |
| `(amChartReady)` | `{ root, result }` once the chart is built: `result` is what the function returned. To change the chart without making it again, keep what you need from it, e.g. `result.data.setAll(newData)` for the series above. |
| `(amChartError)` | The error, when the function threw or the library could not be loaded. It goes to Angular's `ErrorHandler` too. |


## A chart from a JSON config

`AmChartComponent` is the library's `<am5-chart>` element with inputs Angular
can check:

```ts
import { AmChartComponent } from "@amcharts/amcharts5-angular";
import type { IChartElementReadyEvent } from "@amcharts/amcharts5/element";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

@Component({
  imports: [AmChartComponent],
  template: `<am5-chart [config]="config" [themes]="themes" (amChartReady)="onReady($event)" style="height: 400px"></am5-chart>`,
})
export class DashboardComponent {
  themes = [am5themes_Animated];
  ...
  onReady({ root, chart }: IChartElementReadyEvent) {
    // the chart is built
  }
}
```

| Input or event | What it is |
|---|---|
| `[config]` | The chart as a [JSON config](https://www.amcharts.com/docs/v5/concepts/serializing/): an object or a JSON string. A config with different content makes the chart again; one built in the template with the same content does not. |
| `[src]` | A URL to load the config from, used when there is no `config`. |
| `[themes]` | Theme classes, e.g. `[am5themes_Animated]`. Themes are not part of a config. |
| `[renderer]` | `"svg"` draws the chart as SVG; the default is canvas. |
| `(amChartReady)` | `{ root, chart }` once the chart is built. |
| `(amChartError)` | The error, when the chart could not be built. |

Give the element a height; without one it is 400 pixels high. The chart types
a config uses are loaded when it is built.


## Server-side rendering

Both work with Angular SSR and prerendering: the library is loaded in the
browser only, after the first render. Nothing has to be configured.


## License

Without a commercial amCharts license, the charts show a small amCharts logo:
that is the free license, in the LICENSE file. A commercial license removes
the logo. Add its key once, when the app starts, before any chart is made:

```ts
import * as am5 from "@amcharts/amcharts5";

am5.addLicense("AM5C-...");
```

Put it in `main.ts`, before `bootstrapApplication()`. Not in the setup function: a chart decides on the
logo when its root is made, before `setup` runs.


## Unit tests

In jsdom (Jest, and Vitest by default) there is no canvas, so a chart cannot be
drawn: Angular's `ErrorHandler` gets the error, and `(amChartError)` too. In tests that render a component with a chart, mock the
package.


## Example

[`examples/angular`](examples/angular/), with server-side rendering: a chart
in code whose data changes without making it again, and a chart from a JSON
config.

## More

- [amCharts 5 documentation](https://www.amcharts.com/docs/v5/) and [demos](https://www.amcharts.com/demos/)
- [Using amCharts 5 with Angular](https://www.amcharts.com/docs/v5/getting-started/integrations/angular/)
- License: see [License](#license) above.
