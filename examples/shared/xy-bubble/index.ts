import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create chart
// https://docs.amcharts.com/v5/charts/xy-chart/
const chart = root.container.children.push(am5xy.XYChart.new(root, {
  panX: true,      // drag the plot to move around it, sideways...
  panY: true,      // ...and up and down
  wheelY: "zoomXY" // the mouse wheel zooms both axes at once
}));


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
  logarithmic: true, // GDPs range from hundreds to tens of thousands: a log scale fits them
  maxDeviation: 1,   // can be moved or zoomed out up to a whole axis length past the data
  renderer: am5xy.AxisRendererX.new(root, {
    pan: "zoom"      // dragging along the axis labels zooms this axis
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's GDP on the axis
}));

// axis title, added below the axis labels
xAxis.children.push(am5.Label.new(root, {
  text: "GDP per capita, USD",
  x: am5.p50,      // placed at the middle of the axis...
  centerX: am5.p50 // ...by its own middle, so it is centered
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 1, // the same freedom to move and zoom out as on the X axis
  renderer: am5xy.AxisRendererY.new(root, {
    pan: "zoom"    // dragging along the axis labels zooms this axis
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's life expectancy on the axis
}));

// axis title: unshift puts it first, left of the axis labels
yAxis.children.unshift(am5.Label.new(root, {
  rotation: -90,   // reads from bottom to top
  text: "Life expectancy, years",
  y: am5.p50,      // placed halfway up the axis...
  centerX: am5.p50 // ...by its own middle (rotated, its width runs upward)
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/
// The tooltip takes its color from the bubble it points at
const series = chart.series.push(am5xy.LineSeries.new(root, {
  calculateAggregates: true, // works out the lowest and highest population, which the heat rule needs
  xAxis: xAxis,
  yAxis: yAxis,
  valueXField: "gdp",
  valueYField: "lifeExpectancy",
  valueField: "population",
  seriesTooltipTarget: "bullet",
  tooltip: am5.Tooltip.new(root, {
    pointerOrientation: "horizontal", // sits beside the bubble, pointing left or right
    labelText: "[bold]{country}[/]\nLife expectancy: {valueY.formatNumber('#.0')}\nGDP: {valueX.formatNumber('#,###.')}\nPopulation: {value.formatNumber('#,###.')}"
  })
}));

series.strokes.template.set("visible", false); // no line joining the points: only the bubbles show


// Add bullet
// https://docs.amcharts.com/v5/charts/xy-chart/series/#bullets
// Each row colors its own bubble through "bulletSettings"
// one template shared by all the bubbles, which the heat rule below targets
const circleTemplate: am5.Template<am5.Circle> = am5.Template.new({});

// a circle on every data point
series.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 5,        // a starting size: the heat rule sets each bubble's radius
      fillOpacity: 0.8, // a little see-through, so overlapping bubbles show
      templateField: "bulletSettings"
    }, circleTemplate)
  });
});


// Add heat rule: the bubble's size shows the population
// https://docs.amcharts.com/v5/concepts/settings/heat-rules/
series.set("heatRules", [{
  target: circleTemplate,
  min: 3,  // radius in pixels for the least populous country...
  max: 60, // ...and for the most populous one
  dataField: "value",
  key: "radius"
}]);


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
chart.set("cursor", am5xy.XYCursor.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  snapToSeries: [series] // the cursor jumps to the nearest bubble and shows its tooltip
}));


// Add scrollbars
// https://docs.amcharts.com/v5/charts/xy-chart/scrollbars/
// above the plot: drag its ends to zoom, or its middle to move along the GDP axis
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));

// right of the plot: the same for life expectancy
chart.set("scrollbarY", am5.Scrollbar.new(root, {
  orientation: "vertical"
}));


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
// The colors in the data are strings: the processor turns them into colors
// https://docs.amcharts.com/v5/concepts/data/#pre-processing-data
series.data.processor = am5.DataProcessor.new(root, {
  colorFields: ["bulletSettings.fill"]
});

series.data.setAll([
  { country: "Afghanistan", gdp: 1350, lifeExpectancy: 60.5, population: 33397058, bulletSettings: { fill: "#eea638" } },
  { country: "Argentina", gdp: 15714, lifeExpectancy: 76.1, population: 41118986, bulletSettings: { fill: "#86a965" } },
  { country: "Australia", gdp: 36065, lifeExpectancy: 82.4, population: 22918688, bulletSettings: { fill: "#8aabb0" } },
  { country: "Bangladesh", gdp: 1793, lifeExpectancy: 70.3, population: 152408774, bulletSettings: { fill: "#eea638" } },
  { country: "Brazil", gdp: 10384, lifeExpectancy: 73.7, population: 198360943, bulletSettings: { fill: "#86a965" } },
  { country: "Canada", gdp: 35993, lifeExpectancy: 81.3, population: 34674708, bulletSettings: { fill: "#a7a737" } },
  { country: "Chile", gdp: 15404, lifeExpectancy: 79.7, population: 17423214, bulletSettings: { fill: "#86a965" } },
  { country: "China", gdp: 9502, lifeExpectancy: 75.2, population: 1353600687, bulletSettings: { fill: "#eea638" } },
  { country: "Colombia", gdp: 8036, lifeExpectancy: 73.8, population: 47550708, bulletSettings: { fill: "#86a965" } },
  { country: "Congo, Dem. Rep.", gdp: 403, lifeExpectancy: 49.6, population: 69575394, bulletSettings: { fill: "#de4c4f" } },
  { country: "Cuba", gdp: 10197, lifeExpectancy: 79.1, population: 11249266, bulletSettings: { fill: "#a7a737" } },
  { country: "Egypt", gdp: 6014, lifeExpectancy: 70.9, population: 83958369, bulletSettings: { fill: "#de4c4f" } },
  { country: "Ethiopia", gdp: 959, lifeExpectancy: 63, population: 86538534, bulletSettings: { fill: "#de4c4f" } },
  { country: "France", gdp: 29896, lifeExpectancy: 81.7, population: 63457777, bulletSettings: { fill: "#d8854f" } },
  { country: "Germany", gdp: 34132, lifeExpectancy: 80.6, population: 81990837, bulletSettings: { fill: "#d8854f" } },
  { country: "Haiti", gdp: 1180, lifeExpectancy: 62.7, population: 10255644, bulletSettings: { fill: "#a7a737" } },
  { country: "India", gdp: 3229, lifeExpectancy: 66.2, population: 1258350971, bulletSettings: { fill: "#eea638" } },
  { country: "Indonesia", gdp: 4380, lifeExpectancy: 70.6, population: 244769110, bulletSettings: { fill: "#eea638" } },
  { country: "Iran", gdp: 12325, lifeExpectancy: 73.7, population: 75611798, bulletSettings: { fill: "#eea638" } },
  { country: "Italy", gdp: 25812, lifeExpectancy: 82.2, population: 60964145, bulletSettings: { fill: "#d8854f" } },
  { country: "Japan", gdp: 31274, lifeExpectancy: 83.4, population: 126434653, bulletSettings: { fill: "#eea638" } },
  { country: "Kenya", gdp: 1518, lifeExpectancy: 61.1, population: 42749418, bulletSettings: { fill: "#de4c4f" } },
  { country: "Korea, Rep.", gdp: 26199, lifeExpectancy: 81.3, population: 48588326, bulletSettings: { fill: "#eea638" } },
  { country: "Mexico", gdp: 12030, lifeExpectancy: 77.3, population: 116146768, bulletSettings: { fill: "#a7a737" } },
  { country: "Morocco", gdp: 4515, lifeExpectancy: 70.7, population: 32598536, bulletSettings: { fill: "#de4c4f" } },
  { country: "Mozambique", gdp: 1058, lifeExpectancy: 49.9, population: 24475186, bulletSettings: { fill: "#de4c4f" } },
  { country: "Nigeria", gdp: 2484, lifeExpectancy: 52.1, population: 166629383, bulletSettings: { fill: "#de4c4f" } },
  { country: "Pakistan", gdp: 2681, lifeExpectancy: 66.4, population: 179951140, bulletSettings: { fill: "#eea638" } },
  { country: "Papua New Guinea", gdp: 2392, lifeExpectancy: 62.3, population: 7170112, bulletSettings: { fill: "#8aabb0" } },
  { country: "Peru", gdp: 9278, lifeExpectancy: 74.5, population: 29733829, bulletSettings: { fill: "#86a965" } },
  { country: "Philippines", gdp: 3677, lifeExpectancy: 68.5, population: 96471461, bulletSettings: { fill: "#eea638" } },
  { country: "Poland", gdp: 17852, lifeExpectancy: 76.2, population: 38317090, bulletSettings: { fill: "#d8854f" } },
  { country: "Russia", gdp: 15428, lifeExpectancy: 67.9, population: 142703181, bulletSettings: { fill: "#d8854f" } },
  { country: "South Africa", gdp: 9657, lifeExpectancy: 56.3, population: 50738255, bulletSettings: { fill: "#de4c4f" } },
  { country: "Spain", gdp: 26458, lifeExpectancy: 82, population: 46771596, bulletSettings: { fill: "#d8854f" } },
  { country: "Tanzania", gdp: 1330, lifeExpectancy: 60.9, population: 47656367, bulletSettings: { fill: "#de4c4f" } },
  { country: "Ukraine", gdp: 6390, lifeExpectancy: 68.4, population: 44940268, bulletSettings: { fill: "#d8854f" } },
  { country: "United Kingdom", gdp: 31295, lifeExpectancy: 80.4, population: 62798099, bulletSettings: { fill: "#d8854f" } },
  { country: "United States", gdp: 42296, lifeExpectancy: 78.8, population: 315791284, bulletSettings: { fill: "#a7a737" } },
  { country: "Vietnam", gdp: 3074, lifeExpectancy: 75.8, population: 89730274, bulletSettings: { fill: "#eea638" } }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);