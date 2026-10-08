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
// https://www.amcharts.com/docs/v5/charts/flow-charts/sankey-diagram/
const series = root.container.children.push(am5flow.Sankey.new(root, {
  sourceIdField: "source",
  targetIdField: "target",
  valueField: "value",
  paddingRight: 50 // room for the labels of the last nodes, which sit right of them
}));
// every second color of the color set, so neighboring nodes differ more
series.nodes.get("colors")!.set("step", 2);


// Set data
// https://www.amcharts.com/docs/v5/charts/flow-charts/#Setting_data
// each row is one link from a source node to a target node, as thick as its value;
// the nodes are created from the ids the links use
series.data.setAll([
  { source: "A", target: "D", value: 10 },
  { source: "B", target: "D", value: 8 },
  { source: "B", target: "E", value: 4 },
  { source: "C", target: "E", value: 3 },
  { source: "D", target: "G", value: 5 },
  { source: "D", target: "I", value: 2 },
  { source: "D", target: "H", value: 3 },
  { source: "E", target: "H", value: 6 },
  { source: "G", target: "J", value: 5 },
  { source: "I", target: "J", value: 1 },
  { source: "H", target: "J", value: 9 }
]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000, 100);