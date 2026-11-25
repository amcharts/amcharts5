import * as am5 from "@amcharts/amcharts5";
import * as am5flow from "@amcharts/amcharts5/flow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_ResponsiveMax from "@amcharts/amcharts5/themes/ResponsiveMax";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root),
  am5themes_ResponsiveMax.new(root) // fits the chart to small screens
]);


// Create series
// https://docs.amcharts.com/v5/charts/flow-charts/sankey-diagram/
const series = root.container.children.push(am5flow.Sankey.new(root, {
  sourceIdField: "source",
  targetIdField: "target",
  valueField: "value",
  paddingRight: 50 // room for the labels of the last nodes, which sit right of them
}));
// every second color of the color set, so neighboring nodes differ more
series.nodes.get("colors")!.set("step", 2);


// Set data
// https://docs.amcharts.com/v5/charts/flow-charts/#setting-data
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


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
series.setAll({
  focusable: true, // Tab reaches the diagram, and a screen reader names it
  ariaLabel: "Sankey diagram of 11 flows between nine nodes, lettered A to J, from left to right. Tab to the nodes or the flows, then move through them with the up and down arrow keys; Enter on a node hides or shows its flows"
});
// the nodes: one Tab stop, the up and down arrow keys step through them
series.nodes.nodes.template.setAll({
  focusable: true,
  focusableGroup: "nodes",
  ariaLabel: "{name}: {sumIncoming} in, {sumOutgoing} out"
});
// the flows: one Tab stop, after the nodes
series.links.template.setAll({
  focusable: true,
  focusableGroup: "links",
  tabindexOrder: 5,   // focus runs from low to high (0 if not set)
  hoverOnFocus: true, // the focused flow shows its tooltip
  ariaLabel: "{sourceId} to {targetId}: {value}"
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);