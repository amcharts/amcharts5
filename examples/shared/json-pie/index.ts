import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import * as am5plugins_json from "@amcharts/amcharts5/plugins/json";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");

// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);

// Parse chart config
// https://www.amcharts.com/docs/v5/concepts/serializing/
am5plugins_json.JsonParser.new(root).parse({
  refs: [{
    data: [{
      country: "France",
      sales: 100000
    }, {
      country: "Spain",
      sales: 160000
    }, {
      country: "United Kingdom",
      sales: 80000
    }],
  }, {
    series: {
      type: "PieSeries",
      settings: {
        name: "Series",
        valueField: "sales",
        categoryField: "country"
      },
      properties: {
        data: "#data"
      }
    },
  }],
  type: "PieChart",
  settings: {
    layout: "vertical",
  },
  properties: {
    series: [
      "#series"
    ]
  },
  children: [{
    type: "Legend",
    settings: {
      centerX: {
        type: "Percent",
        value: 50
      },
      x: {
        type: "Percent",
        value: 50
      },
      layout: "horizontal"
    },
    properties: {
      data: "#series.dataItems"
    }
  }]
}, {
  parent: root.container
}).then(function (chart) {
  // Make stuff animate on load
  // https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
  chart.series.getIndex(0).appear(1000);
  chart.appear(1000, 100);
});