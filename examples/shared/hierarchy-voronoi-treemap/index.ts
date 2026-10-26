import * as am5 from "@amcharts/amcharts5";
import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import data from "./data.json";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Create a theme that styles nodes and labels by their level
const myTheme = am5.Theme.new(root);

// Root node: invisible
myTheme.rule("Polygon", ["hierarchy", "node", "shape", "depth0"]).setAll({
  strokeOpacity: 0,
  fillOpacity: 0
});

// Continents: filled, with a thick outline
myTheme.rule("Polygon", ["hierarchy", "node", "shape", "depth1"]).setAll({
  strokeWidth: 5,
  fillOpacity: 1
});

// Countries: a thin outline over their continent
myTheme.rule("Polygon", ["hierarchy", "node", "shape", "depth2"]).setAll({
  strokeWidth: 1,
  fillOpacity: 0
});

// Countries are the last level, which is not clickable by default
myTheme.rule("HierarchyNode", ["last"]).setAll({
  cursorOverStyle: "pointer"
});

// Labels: small, and only on countries
myTheme.rule("Label", ["node"]).setAll({
  fontSize: 11,
  minScale: 0.7 // a label shrinks to fit its polygon, but below 70% it is hidden
});

myTheme.rule("Label", ["node", "depth0"]).setAll({
  forceHidden: true
});

myTheme.rule("Label", ["node", "depth1"]).setAll({
  forceHidden: true
});


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root),
  myTheme
]);


// Create series
// https://docs.amcharts.com/v5/charts/hierarchy/voronoi-treemap/
// population sets each polygon's area: a country's own, a continent's the sum of its countries
const series = root.container.children.push(am5hierarchy.VoronoiTreemap.new(root, {
  paddingLeft: 5,         // a 5 px margin, so the thick continent outlines aren't cut off
  paddingRight: 5,
  paddingTop: 5,
  paddingBottom: 5,
  singleBranchOnly: true, // opening one continent closes the others
  downDepth: 2,           // selecting a node shows two levels inside it
  upDepth: 0,             // and hides the levels above it
  initialDepth: 2,        // continents and their countries from the start
  valueField: "population",
  categoryField: "name",
  idField: "id",
  childDataField: "children"
}));


// Show the country's name where its polygon is wide enough, its code where it is not
series.labels.template.adapters.add("x", (x, target) => {
  const dataItem = target.dataItem as am5.DataItem<am5hierarchy.IVoronoiTreemapDataItem>;
  if (dataItem) {
    const polygon = dataItem.get("polygon");
    if (polygon) {
      const name = dataItem.get("category", "");
      const width = polygon.getPrivate("maxX", 0) - polygon.getPrivate("minX", 0);
      // the name needs about 7 px a letter, and at least 60 px; the code is the id from the data
      target.set("text", width > Math.max(60, name.length * 7) ? name : dataItem.get("id", ""));
    }
  }
  return x;
});


// When a country is clicked, zoom to its continent
series.nodes.template.events.on("click", (ev) => {
  const dataItem = ev.target.dataItem as am5.DataItem<am5hierarchy.IVoronoiTreemapDataItem>;
  if (dataItem && !dataItem.get("children")) { // only countries, which have no children
    series.selectDataItem(dataItem.get("parent"));
  }
});


// Set data
// https://docs.amcharts.com/v5/charts/hierarchy/#setting-data
series.data.setAll([data]);


// Select the root node
// https://docs.amcharts.com/v5/charts/hierarchy/#pre-selected-branch
series.set("selectedDataItem", series.dataItems[0]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);