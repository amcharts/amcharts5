import * as am5 from "@amcharts/amcharts5";
import * as am5venn from "@amcharts/amcharts5/venn";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create wrapper container
// https://docs.amcharts.com/v5/charts/venn/#additional-controls
const container = root.container.children.push(am5.Container.new(root, {
  width: am5.p100,            // fills the chart div
  height: am5.p100,
  layout: root.verticalLayout // the diagram on top, the legend below it
}));


// Create series
// https://docs.amcharts.com/v5/charts/venn/#venn-series
const series = container.children.push(am5venn.Venn.new(root, {
  categoryField: "name",
  valueField: "value",
  intersectionsField: "sets",
  paddingTop: 40,   // 40 px of room around the circles on every side
  paddingBottom: 40,
  paddingLeft: 40,
  paddingRight: 40
}));

// Set tooltip content
// https://docs.amcharts.com/v5/charts/venn/#tooltips
series.slices.template.set("tooltipText", "{category}: {value}");

// Set up hover appearance
// https://docs.amcharts.com/v5/charts/venn/#hovers
// hoverGraphics is drawn over the hovered circle or overlap, outlining its exact shape
series.hoverGraphics.setAll({
  strokeDasharray: [3, 3],                        // dashed: 3 px dash, 3 px gap
  stroke: root.interfaceColors.get("background"), // the page color, so it shows on the fills
  strokeWidth: 2
});


// Set data: an item with sets is the intersection of those circles
// https://docs.amcharts.com/v5/charts/venn/#setting-data
// the values set the circles' areas and, as near as the layout can, the overlaps'
series.data.setAll([
  { name: "A", value: 10 },
  { name: "B", value: 10 },
  { name: "C", value: 5 },
  { name: "X", value: 4, sets: ["A", "B"] },
  { name: "Y", value: 2, sets: ["A", "C"] },
  { name: "Z", value: 2, sets: ["B", "C"] },
  { name: "Q", value: 1, sets: ["A", "B", "C"] }
]);


// Add legend
// https://docs.amcharts.com/v5/charts/venn/#legend
const legend = container.children.push(am5.Legend.new(root, {
  centerX: am5.p50, // centered under the diagram
  x: am5.p50
}));

legend.data.setAll(series.dataItems);


// Play initial series animation
// https://docs.amcharts.com/v5/concepts/animations/#animation-of-series
series.appear(1000, 100);