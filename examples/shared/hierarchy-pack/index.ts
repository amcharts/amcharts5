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
// https://docs.amcharts.com/v5/charts/hierarchy/#adding
// initialDepth: 2 shows two levels at first; a click opens the next
const series = root.container.children.push(am5hierarchy.Pack.new(root, {
  initialDepth: 2,
  valueField: "value",
  categoryField: "name",
  childDataField: "children"
}));


// Set data
// https://docs.amcharts.com/v5/charts/hierarchy/#setting-data
// only the leaves have a value, and a leaf circle's area follows it;
// a parent's circle is just big enough to hold its children's
series.data.setAll([{
  name: "Food",
  children: [
    {
      name: "Fruit",
      children: [
        { name: "Apples", value: 40 },
        { name: "Bananas", value: 36 },
        {
          name: "Berries",
          children: [
            { name: "Strawberries", value: 18 },
            { name: "Blueberries", value: 14 },
            { name: "Raspberries", value: 12 }
          ]
        }
      ]
    },
    {
      name: "Drinks",
      children: [
        { name: "Coffee", value: 42 },
        { name: "Tea", value: 36 },
        { name: "Juice", value: 39 }
      ]
    },
    {
      name: "Dairy",
      children: [
        { name: "Milk", value: 46 },
        { name: "Yogurt", value: 38 },
        {
          name: "Cheese",
          children: [
            { name: "Cheddar", value: 16 },
            { name: "Gouda", value: 14 },
            { name: "Brie", value: 12 }
          ]
        }
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
  ariaLabel: "Circle pack of food: fruit, drinks and dairy and the items in each, each circle sized by its value. Tab to the circles, move between them with the up and down arrow keys, and press Enter to open the next level"
});
// the circles: one Tab stop, the up and down arrow keys step through them
series.nodes.template.setAll({
  focusable: true,
  focusableGroup: "nodes",
  hoverOnFocus: true, // the focused circle shows its tooltip
  ariaLabel: "{category}: {sum}"
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);