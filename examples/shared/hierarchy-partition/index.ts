import * as am5 from "@amcharts/amcharts5";
import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
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
// https://docs.amcharts.com/v5/charts/hierarchy/partition/
const series = root.container.children.push(am5hierarchy.Partition.new(root, {
  orientation: "horizontal", // one column per level, left to right; "vertical" makes rows
  valueField: "value",
  categoryField: "name",
  childDataField: "children"
}));


// Set data
// https://docs.amcharts.com/v5/charts/hierarchy/#setting-data
// only the leaves have a value; a parent's rectangle spans its children's, so each
// rectangle's height shows its share of the total
series.data.setAll([{
  name: "Budget",
  children: [
    {
      name: "Housing",
      children: [
        { name: "Rent", value: 900 },
        {
          name: "Utilities",
          children: [
            { name: "Electricity", value: 150 },
            { name: "Heating", value: 200 },
            { name: "Internet", value: 120 }
          ]
        }
      ]
    },
    {
      name: "Food",
      children: [
        { name: "Groceries", value: 450 },
        {
          name: "Eating Out",
          children: [
            { name: "Restaurants", value: 220 },
            { name: "Coffee", value: 130 }
          ]
        }
      ]
    },
    {
      name: "Transport",
      children: [
        {
          name: "Car",
          children: [
            { name: "Fuel", value: 200 },
            { name: "Insurance", value: 150 }
          ]
        },
        { name: "Public Transit", value: 130 }
      ]
    }
  ]
}]);


// Select the root node
// https://docs.amcharts.com/v5/charts/hierarchy/#pre-selected-branch
series.set("selectedDataItem", series.dataItems[0]);


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
series.setAll({
  focusable: true, // Tab reaches the chart, and a screen reader names it
  ariaLabel: "Partition chart of a budget of 2,650: housing, food and transport and what each is spent on, one column per level. Tab to the boxes, move between them with the up and down arrow keys, and press Enter to zoom into one or back out"
});
// the boxes: one Tab stop, the up and down arrow keys step through them
series.nodes.template.setAll({
  focusable: true,
  focusableGroup: "nodes",
  hoverOnFocus: true, // the focused box shows its tooltip
  ariaLabel: "{category}: {sum}"
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);