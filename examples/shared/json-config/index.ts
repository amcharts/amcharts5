import * as am5 from "@amcharts/amcharts5";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import * as am5plugins_json from "@amcharts/amcharts5/plugins/json";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Describe the chart as a JSON config
// https://docs.amcharts.com/v5/concepts/serializing/
// refs are named parts, used as "#name"; a block can use the ones before it
const config = {
  refs: [{
    data: [ // the rows for the pie, used below as "#data"
      { country: "France", sales: 100000 },
      { country: "Spain", sales: 160000 },
      { country: "United Kingdom", sales: 80000 }
    ]
  }, {
    series: {             // the series, made here and added to the chart below as "#series"
      type: "PieSeries",  // the class to create, by its name
      settings: {         // what PieSeries.new(root, { ... }) would take
        name: "Series",
        valueField: "sales",
        categoryField: "country",
        autoAppear: true, // the series animates in on load, as series.appear(1000) would
        appearDuration: 1000
      },
      properties: {   // set on the series once it exists
        data: "#data" // the rows from the first ref, as series.data.setAll() would
      }
    }
  }],
  type: "PieChart", // the top level is the chart itself
  settings: {
    layout: "vertical", // root.verticalLayout: the pie above the legend
    // Animate on load: what appear() does in code
    autoAppear: true,
    appearDuration: 1000, // for one second...
    appearDelay: 100      // ...starting after 100 ms
  },
  properties: {
    series: ["#series"] // pushes the series from the refs into chart.series
  },
  children: [{ // added to chart.children after the pie, so the legend is below it
    type: "Legend",
    settings: {
      centerX: { type: "Percent", value: 50 }, // am5.percent(50): the legend's middle...
      x: { type: "Percent", value: 50 },       // ...at the middle of the chart: centered
      layout: "horizontal"                     // all items in one row, not the default wrapping grid
    },
    properties: {
      data: "#series.dataItems" // one legend item per slice, as legend.data.setAll() would
    }
  }]
};


// Build the chart from the config; parse() returns a promise of the chart
// https://docs.amcharts.com/v5/concepts/serializing/
const parser = am5plugins_json.JsonParser.new(root);

parser.parse(config, {
  parent: root.container // the chart goes into the root's container, as children.push() would
});
