import { Component } from '@angular/core';
import { AmChartComponent, AmChartDirective } from '@amcharts/amcharts5-angular';
import type { AmChartReadyEvent } from '@amcharts/amcharts5-angular';
import type { IChartElementReadyEvent } from '@amcharts/amcharts5/element';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { type Visits, buildChart, randomVisits, visits } from './chart';
import { config } from './config';

// Rendered on the server too, where the charts draw nothing: the package loads
// the library in the browser only, after the first render
@Component({
  imports: [AmChartDirective, AmChartComponent],
  selector: 'app-root',
  template: `
    <main>
      <h1>amCharts 5 with Angular</h1>

      <section>
        <h2>A chart written in code</h2>
        <button id="new-data" (click)="newData()">New data</button>
        <!-- The chart's element needs a height -->
        <div id="code-chart" [amChart]="buildChart" (amChartReady)="onCodeChartReady($event)" style="height: 300px"></div>
      </section>

      <section>
        <h2>A chart from a JSON config</h2>
        <!-- No chart code -->
        <am5-chart id="config-chart" [config]="config" [themes]="themes" (amChartReady)="onConfigChartReady($event)" style="height: 300px"></am5-chart>
        @if (configChartType) {
          <p>Built: {{ configChartType }}</p>
        }
      </section>
    </main>
  `,
})
export class App {
  // [amChart] gives this function a new root, and disposes the root with the
  // element. It runs outside Angular's zone, so the chart's animation frames
  // do not run change detection
  buildChart = buildChart;

  config = config;

  // Themes are not part of a config, so they are given as classes
  themes = [am5themes_Animated];

  configChartType?: string;

  private data = visits;

  private setChartData?: (data: Array<Visits>) => void;

  // `result` is what buildChart() returned: the function that sets the data
  onCodeChartReady(event: AmChartReadyEvent) {
    this.setChartData = event.result as (data: Array<Visits>) => void;
    this.setChartData(this.data);
  }

  // New data changes the chart in place, without making it again
  newData() {
    this.data = randomVisits();
    if (this.setChartData) {
      this.setChartData(this.data);
    }
  }

  onConfigChartReady({ chart }: IChartElementReadyEvent) {
    this.configChartType = chart.className;
  }
}
