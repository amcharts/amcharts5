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
// ChordNonRibbon draws each link as a thin curve, not a ribbon, and gives every node the same arc
const series = root.container.children.push(am5flow.ChordNonRibbon.new(root, {
  sourceIdField: "source",
  targetIdField: "target",
  valueField: "value"
}));
// every second color of the color set, so neighboring nodes differ more
series.nodes.get("colors")!.set("step", 2);


// Draw each node as a circle with its name inside
// https://docs.amcharts.com/v5/concepts/common-elements/bullets/
series.nodes.bullets.push((_root, _nodes, dataItem) => {
  const circle = am5.Circle.new(root, {
    radius: 24,                // big enough to hold the node's name
    fill: dataItem.get("fill") // the node's own color
  });

  // A node that is clicked off keeps its circle, in gray
  // https://docs.amcharts.com/v5/charts/flow-charts/#node-toggling
  circle.states.create("hidden", {
    fill: root.interfaceColors.get("disabled")
  });

  return am5.Bullet.new(root, {
    sprite: circle
  });
});

series.nodes.labels.template.setAll({
  textType: "regular",                               // straight text, not bent along the circle
  fill: root.interfaceColors.get("alternativeText"), // light text that reads on the colored circle
  radius: -5 // 5 px in from the outer edge: the node's middle, where the circle is
});

// a clicked-off node's label stays light, so it still reads on the gray circle
series.nodes.labels.template.states.create("disabled", {
  fill: root.interfaceColors.get("alternativeText")
});


// Add a circle that travels along each link and back
// https://docs.amcharts.com/v5/concepts/animations/
series.bullets.push((_root, _series, dataItem) => {
  return am5.Bullet.new(root, {
    // from the source end (0) to the target end (1) and back, forever, slowing at each end
    animations: [
      { key: "locationY", from: 0, to: 1, duration: 2000, loops: 0, yoyo: true, easing: "cubic", ease: "inOut" }
    ],
    sprite: am5.Circle.new(root, {
      radius: 5,
      fill: dataItem.get("source").get("fill") // the color of the link's source node
    })
  });
});

// Keep the travelling circles under the nodes
series.children.moveValue(series.bulletsContainer, 0);


// Set data
// https://docs.amcharts.com/v5/charts/flow-charts/#setting-data
series.data.setAll([
  { source: "LHR", target: "JFK", value: 24 },
  { source: "LHR", target: "DXB", value: 18 },
  { source: "LHR", target: "CDG", value: 14 },
  { source: "CDG", target: "JFK", value: 12 },
  { source: "CDG", target: "FRA", value: 10 },
  { source: "FRA", target: "DXB", value: 9 },
  { source: "FRA", target: "SIN", value: 6 },
  { source: "DXB", target: "SIN", value: 11 },
  { source: "JFK", target: "LAX", value: 30 },
  { source: "LAX", target: "SIN", value: 4 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);