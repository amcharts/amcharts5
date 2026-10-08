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
// https://www.amcharts.com/docs/v5/charts/hierarchy/force-directed/
// a force simulation places the circles: linked ones pull together, the rest push apart;
// a click on a circle opens or closes its children
const series = root.container.children.push(am5hierarchy.ForceDirected.new(root, {
  minRadius: 25,   // the node with the smallest total gets a 25 px radius...
  maxRadius: 55,   // ...the biggest (the top node) 55 px, the rest in between
  nodePadding: 10, // 10 px of room around each circle, so they don't touch
  valueField: "value",
  categoryField: "name",
  childDataField: "children"
}));


// Set data
// https://www.amcharts.com/docs/v5/charts/hierarchy/#Setting_data
// only the leaves have a value: each parent's total is the sum of its children
series.data.setAll([{
  name: "Music",
  children: [
    {
      name: "Rock",
      children: [
        { name: "Classic Rock", value: 64 },
        { name: "Punk", value: 28 },
        {
          name: "Metal",
          children: [
            { name: "Heavy Metal", value: 35 },
            { name: "Thrash", value: 17 }
          ]
        }
      ]
    },
    {
      name: "Electronic",
      children: [
        { name: "House", value: 42 },
        { name: "Techno", value: 31 },
        { name: "Ambient", value: 19 }
      ]
    },
    {
      name: "Jazz",
      children: [
        { name: "Swing", value: 24 },
        { name: "Bebop", value: 33 },
        {
          name: "Fusion",
          children: [
            { name: "Jazz Rock", value: 14 },
            { name: "Latin Jazz", value: 21 }
          ]
        }
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