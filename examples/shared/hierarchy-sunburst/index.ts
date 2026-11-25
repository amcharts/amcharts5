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
// https://docs.amcharts.com/v5/charts/hierarchy/sunburst/
const series = root.container.children.push(am5hierarchy.Sunburst.new(root, {
  radius: am5.percent(95), // a little inside the chart's edge (the default is 100%)
  valueField: "value",
  categoryField: "name",
  childDataField: "children"
}));


// Set data
// https://docs.amcharts.com/v5/charts/hierarchy/#setting-data
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
// https://docs.amcharts.com/v5/charts/hierarchy/#pre-selected-branch
series.set("selectedDataItem", series.dataItems[0]);


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
series.setAll({
  focusable: true, // Tab reaches the chart, and a screen reader names it
  ariaLabel: "Sunburst chart of website visits by where they came from: search, social and direct, then their kinds and sources, one ring per level. Tab to the slices, move between them with the up and down arrow keys, and press Enter to zoom into one; Enter on the middle goes back"
});
// the slices: one Tab stop, the up and down arrow keys step through them
series.nodes.template.setAll({
  focusable: true,
  focusableGroup: "nodes",
  hoverOnFocus: true, // the focused slice shows its tooltip
  ariaLabel: "{category}: {sum}"
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);