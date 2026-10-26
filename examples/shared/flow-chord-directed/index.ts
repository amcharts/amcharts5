import * as am5 from "@amcharts/amcharts5";
import * as am5flow from "@amcharts/amcharts5/flow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create series
// https://docs.amcharts.com/v5/charts/flow-charts/
// ChordDirected ends each link in an arrowhead at its target, so every flow shows its direction
const series = root.container.children.push(am5flow.ChordDirected.new(root, {
  sourceIdField: "source",
  targetIdField: "target",
  valueField: "value",
  radius: am5.percent(75), // smaller than the default 90%: room for the labels outside
  startAngle: 80           // the first node starts just before 6 o'clock (0 is 3 o'clock)
}));


// Configure labels and links
series.nodes.labels.template.setAll({
  textType: "radial", // labels point out from the center, like spokes
  centerX: 0,         // each label starts at its node and runs outward
  fontSize: "0.8em"   // a little smaller than the chart's default text
});

series.links.template.set("fillStyle", "source"); // each link takes its source node's color


// Set data
// https://docs.amcharts.com/v5/charts/flow-charts/#setting-data
series.data.setAll([
  { source: "Monica", target: "Rachel", value: 4 },
  { source: "Monica", target: "Chandler", value: 113 },
  { source: "Monica", target: "Ross", value: 16 },
  { source: "Monica", target: "Joey", value: 9 },
  { source: "Monica", target: "Phoebe", value: 3 },
  { source: "Monica", target: "Richard", value: 16 },
  { source: "Monica", target: "Pete", value: 10 },
  { source: "Rachel", target: "Chandler", value: 7 },
  { source: "Rachel", target: "Ross", value: 80 },
  { source: "Rachel", target: "Joey", value: 30 },
  { source: "Rachel", target: "Phoebe", value: 6 },
  { source: "Chandler", target: "Joey", value: 1 },
  { source: "Chandler", target: "Phoebe", value: 7 },
  { source: "Chandler", target: "Janice", value: 11 },
  { source: "Chandler", target: "Kathy", value: 7 },
  { source: "Ross", target: "Joey", value: 3 },
  { source: "Ross", target: "Phoebe", value: 18 },
  { source: "Ross", target: "Carol", value: 10 },
  { source: "Ross", target: "Emily", value: 12 },
  { source: "Ross", target: "Elizabeth", value: 8 },
  { source: "Ross", target: "Mona", value: 11 },
  { source: "Ross", target: "Charlie", value: 10 },
  { source: "Joey", target: "Phoebe", value: 6 },
  { source: "Joey", target: "Janine", value: 9 },
  { source: "Phoebe", target: "David", value: 14 },
  { source: "Phoebe", target: "Gary", value: 7 },
  { source: "Phoebe", target: "Mike", value: 18 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);