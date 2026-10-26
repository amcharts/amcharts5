import * as am5 from "@amcharts/amcharts5";
import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
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
// https://docs.amcharts.com/v5/charts/hierarchy/tree/
// the top node is at the top, and each level of nesting one row lower, linked to its parent
const series = root.container.children.push(am5hierarchy.Tree.new(root, {
  paddingTop: 40,    // the top node sits on the layout's top edge: room for its circle
  paddingBottom: 40, // the deepest nodes sit on the bottom edge: room for theirs
  valueField: "value",
  categoryField: "name",
  childDataField: "children"
}));


// Make the nodes big enough for their labels
series.circles.template.set("radius", 30);


// Set data
// https://docs.amcharts.com/v5/charts/hierarchy/#setting-data
series.data.setAll([{
  name: "Acme",
  children: [
    {
      name: "Product",
      children: [
        { name: "Web", value: 12 },
        { name: "Mobile", value: 8 },
        {
          name: "Platform",
          children: [
            { name: "Cloud", value: 5 },
            { name: "Data", value: 6 }
          ]
        }
      ]
    },
    {
      name: "Sales",
      children: [
        { name: "Europe", value: 7 },
        { name: "Americas", value: 9 },
        { name: "Asia", value: 4 }
      ]
    },
    {
      name: "Support",
      children: [
        { name: "Helpdesk", value: 10 },
        {
          name: "Training",
          children: [
            { name: "Docs", value: 3 },
            { name: "Courses", value: 4 }
          ]
        }
      ]
    }
  ]
}]);


// Select the root node
// https://docs.amcharts.com/v5/charts/hierarchy/#pre-selected-branch
series.set("selectedDataItem", series.dataItems[0]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);