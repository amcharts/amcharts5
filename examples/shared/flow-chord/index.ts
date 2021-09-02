import * as am5 from "@amcharts/amcharts5";
import * as am5flow from "@amcharts/amcharts5/flow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create series
// https://www.amcharts.com/docs/v5/charts/flow-charts/
const series = root.container.children.push(am5flow.Chord.new(root, {
  sourceIdField: "source",
  targetIdField: "target",
  valueField: "value"
}));
series.nodes.get("colors")!.set("step", 2);


// Set data
// https://www.amcharts.com/docs/v5/charts/flow-charts/#Setting_data
series.data.setAll([
  { source: "Berlin", target: "Amsterdam", value: 14 },
  { source: "Berlin", target: "London", value: 33 },
  { source: "Berlin", target: "Paris", value: 13 },
  { source: "Berlin", target: "Madrid", value: 36 },

  { source: "Amsterdam", target: "Berlin", value: 42 },
  { source: "Amsterdam", target: "London", value: 20 },
  { source: "Amsterdam", target: "Paris", value: 19 },
  { source: "Amsterdam", target: "Madrid", value: 11 },

  { source: "London", target: "Amsterdam", value: 9 },
  { source: "London", target: "Berlin", value: 38 },
  { source: "London", target: "Paris", value: 41 },
  { source: "London", target: "Madrid", value: 16 },

  { source: "Paris", target: "Amsterdam", value: 12 },
  { source: "Paris", target: "London", value: 16 },
  { source: "Paris", target: "Berlin", value: 21 },
  { source: "Paris", target: "Madrid", value: 8 },

  { source: "Madrid", target: "Amsterdam", value: 22 },
  { source: "Madrid", target: "London", value: 25 },
  { source: "Madrid", target: "Paris", value: 19 },
  { source: "Madrid", target: "Berlin", value: 7 }
]);


// Make stuff animate on load
series.appear(1000, 100);