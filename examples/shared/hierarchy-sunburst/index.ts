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
// https://www.amcharts.com/docs/v5/charts/hierarchy/sunburst/
const series = root.container.children.push(am5hierarchy.Sunburst.new(root, {
  radius: am5.percent(95), // a little inside the chart's edge (the default is 100%)
  valueField: "value",
  categoryField: "name",
  childDataField: "children"
}));


// Set data
// https://www.amcharts.com/docs/v5/charts/hierarchy/#Setting_data
// the top node is the circle in the middle and each level below it one ring further out;
// only the leaves have a value, and a slice's angle is its share of the parent's
series.data.setAll([{
  name: "Visits",
  children: [
    {
      name: "Search",
      children: [
        {
          name: "Organic",
          children: [
            { name: "Google", value: 420 },
            { name: "Bing", value: 90 }
          ]
        },
        {
          name: "Paid",
          children: [
            { name: "Text Ads", value: 100 },
            { name: "Banners", value: 70 }
          ]
        }
      ]
    },
    {
      name: "Social",
      children: [
        {
          name: "Video",
          children: [
            { name: "YouTube", value: 110 },
            { name: "TikTok", value: 70 }
          ]
        },
        {
          name: "Networks",
          children: [
            { name: "Facebook", value: 150 },
            { name: "Instagram", value: 120 }
          ]
        }
      ]
    },
    {
      name: "Direct",
      children: [
        {
          name: "Saved",
          children: [
            { name: "Bookmarks", value: 90 },
            { name: "Shortcuts", value: 60 }
          ]
        },
        {
          name: "Email",
          children: [
            { name: "Newsletter", value: 95 },
            { name: "Campaigns", value: 60 }
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