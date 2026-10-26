import "@amcharts/amcharts5/element";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// The <am5-chart> element builds a chart from a JSON config, with no root and
// no chart code. Importing "@amcharts/amcharts5/element" (element.js, with
// script tags) defines it.
// With npm, the chart types a config uses are loaded when it is built. With
// script tags their files have to be on the page first, after plugins/json.js
// and element.js: here, percent.js.
// https://docs.amcharts.com/v5/concepts/serializing/
const element = document.createElement("am5-chart");


// Themes are not part of a config: give the element theme classes. With script
// tags, the attribute themes="Animated" does the same.
element.themes = [am5themes_Animated];


// The chart as a JSON config. It can also be an attribute
// (<am5-chart config='{ ... }'>) or come from a file (<am5-chart src="chart.json">).
element.config = {
  type: "PieChart", // the class to create, by its name
  settings: {
    layout: { type: "VerticalLayout" },         // as root.verticalLayout: parts stacked top to bottom
    innerRadius: { type: "Percent", value: 50 } // am5.percent(50): a hole half the pie's radius, a donut
  },
  properties: {
    series: [{ // created, then pushed into chart.series
      type: "PieSeries",
      // autoAppear animates the series in on load, as series.appear(1000, 100) would in code
      settings: { valueField: "value", categoryField: "category", autoAppear: true, appearDuration: 1000, appearDelay: 100 },
      properties: {
        data: [ // the slices, as series.data.setAll() would set them
          { value: 10, category: "One" },
          { value: 9, category: "Two" },
          { value: 6, category: "Three" },
          { value: 5, category: "Four" },
          { value: 4, category: "Five" },
          { value: 3, category: "Six" },
          { value: 1, category: "Seven" }
        ]
      }
    }]
  }
};


// Once the chart is built, the element dispatches "ready", and element.chart
// and element.root hold it; element.whenReady() is a promise of both.


// Put it on the page: it fills its box, which needs a height
element.style.height = "100%";
document.getElementById("chartdiv")!.appendChild(element);
