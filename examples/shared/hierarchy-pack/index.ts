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


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);