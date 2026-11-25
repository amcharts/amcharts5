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
// https://docs.amcharts.com/v5/charts/flow-charts/arc-diagram/
// orientation: "vertical" puts the nodes in a column
// paddingBottom leaves room for the labels under the nodes
const series = root.container.children.push(am5flow.ArcDiagram.new(root, {
  sourceIdField: "source",
  targetIdField: "target",
  valueField: "value",
  orientation: "horizontal",
  paddingBottom: 70
}));


// Put each label under its node: half the node's height down is where the
// circle ends. position: "absolute" keeps the label out of that height
// https://docs.amcharts.com/v5/charts/flow-charts/arc-diagram/#labels
series.nodes.labels.template.setAll({
  fontSize: "0.85em", // a little smaller than the chart's default text
  position: "absolute",
  y: am5.percent(50),
  paddingRight: 6     // a small gap between the circle and the turned label
});


// Set data
// https://docs.amcharts.com/v5/charts/flow-charts/#setting-data
// each row is one link, drawn as an arc between two nodes; a node's circle
// grows with the total of all its links, in and out
series.data.setAll([
  { source: "Monica", target: "Rachel", value: 4 },
  { source: "Monica", target: "Chandler", value: 63 },
  { source: "Monica", target: "Ross", value: 16 },
  { source: "Monica", target: "Joey", value: 9 },
  { source: "Monica", target: "Phoebe", value: 3 },
  { source: "Monica", target: "Pete", value: 10 },
  { source: "Rachel", target: "Chandler", value: 7 },
  { source: "Rachel", target: "Ross", value: 80 },
  { source: "Rachel", target: "Joey", value: 30 },
  { source: "Rachel", target: "Phoebe", value: 6 },
  { source: "Rachel", target: "Tag", value: 4 },
  { source: "Chandler", target: "Joey", value: 1 },
  { source: "Chandler", target: "Phoebe", value: 7 },
  { source: "Chandler", target: "Janice", value: 11 },
  { source: "Chandler", target: "Kathy", value: 7 },
  { source: "Ross", target: "Joey", value: 3 },
  { source: "Ross", target: "Phoebe", value: 18 },
  { source: "Ross", target: "Carol", value: 10 },
  { source: "Ross", target: "Emily", value: 12 },
  { source: "Ross", target: "Mona", value: 11 },
  { source: "Ross", target: "Charlie", value: 10 },
  { source: "Joey", target: "Phoebe", value: 6 },
  { source: "Joey", target: "Janine", value: 9 },
  { source: "Joey", target: "Charlie", value: 3 },
  { source: "Phoebe", target: "David", value: 14 },
  { source: "Phoebe", target: "Mike", value: 18 }
]);


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
series.setAll({
  focusable: true, // Tab reaches the diagram, and a screen reader names it
  ariaLabel: "Arc diagram of 26 links between the six Friends characters and the people around them, each circle sized by the total of its links. Tab to the people or the links, then move through them with the up and down arrow keys; Enter on a person hides or shows their links"
});
// the people: one Tab stop, the up and down arrow keys step through them
series.nodes.nodes.template.setAll({
  focusable: true,
  focusableGroup: "nodes",
  ariaLabel: "{name}: {sum} in all"
});
// the links: one Tab stop, after the people
series.links.template.setAll({
  focusable: true,
  focusableGroup: "links",
  tabindexOrder: 5, // focus runs from low to high (0 if not set)
  ariaLabel: "{sourceId} to {targetId}: {value}"
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);