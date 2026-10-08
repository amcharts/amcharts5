import * as am5 from "@amcharts/amcharts5";
import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create series
// https://www.amcharts.com/docs/v5/charts/hierarchy/partition/
const series = root.container.children.push(am5hierarchy.Partition.new(root, {
  orientation: "horizontal", // one column per level, left to right; "vertical" makes rows
  valueField: "value",
  categoryField: "name",
  childDataField: "children"
}));


// Set data
// https://www.amcharts.com/docs/v5/charts/hierarchy/#Setting_data
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
// https://www.amcharts.com/docs/v5/charts/hierarchy/#Pre_selected_branch
series.set("selectedDataItem", series.dataItems[0]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000, 100);