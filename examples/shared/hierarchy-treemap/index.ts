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


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000, 100);