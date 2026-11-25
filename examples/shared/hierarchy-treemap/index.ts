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


// Create a container that stacks the breadcrumbs above the chart
const container = root.container.children.push(am5.Container.new(root, {
  width: am5.percent(100),  // fills the chart div; the treemap gets
  height: am5.percent(100), // the height the breadcrumbs leave
  layout: root.verticalLayout
}));


// Create series
// https://docs.amcharts.com/v5/charts/hierarchy/treemap/
// a click on a tile zooms into it; the breadcrumbs lead back up
const series = container.children.push(am5hierarchy.Treemap.new(root, {
  downDepth: 1,    // a click shows one level inside the clicked tile
  upDepth: 1,      // levels more than one above the opened tile are hidden
  initialDepth: 2, // two levels under the top node at first: Audio and Kitchen stay closed
  valueField: "value",
  categoryField: "name",
  childDataField: "children"
}));


// Add breadcrumbs above the chart
// https://docs.amcharts.com/v5/charts/hierarchy/breadcrumbs/
container.children.unshift(am5hierarchy.BreadcrumbBar.new(root, {
  series: series
}));


// Set data
// https://docs.amcharts.com/v5/charts/hierarchy/#setting-data
series.data.setAll([{
  name: "Sales",
  children: [
    {
      name: "Electronics",
      children: [
        { name: "Phones", value: 86 },
        { name: "Laptops", value: 64 },
        {
          name: "Audio",
          children: [
            { name: "Headphones", value: 31 },
            { name: "Speakers", value: 18 }
          ]
        }
      ]
    },
    {
      name: "Home",
      children: [
        { name: "Furniture", value: 52 },
        { name: "Lighting", value: 15 },
        {
          name: "Kitchen",
          children: [
            { name: "Cookware", value: 22 },
            { name: "Appliances", value: 37 }
          ]
        }
      ]
    },
    {
      name: "Sports",
      children: [
        { name: "Cycling", value: 41 },
        { name: "Fitness", value: 28 },
        { name: "Outdoor", value: 23 }
      ]
    }
  ]
}]);


// Select the root node
// https://docs.amcharts.com/v5/charts/hierarchy/#pre-selected-branch
series.set("selectedDataItem", series.dataItems[0]);


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
container.setAll({
  focusable: true, // Tab reaches the chart, and a screen reader names it
  ariaLabel: "Treemap of sales in three departments, Electronics, Home and Sports, and their products, each tile sized by its sales. Tab to the tiles, move between them with the up and down arrow keys, and press Enter to open one; the breadcrumbs above lead back up"
});
// the tiles: one Tab stop, the up and down arrow keys step through them
series.nodes.template.setAll({
  focusable: true,
  focusableGroup: "nodes",
  hoverOnFocus: true, // the focused tile shows its tooltip
  ariaLabel: "{category}: {sum}"
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);