import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create chart
// https://www.amcharts.com/docs/v5/charts/xy-chart/
const chart = root.container.children.push(am5xy.XYChart.new(root, {
  panX: true,        // drag the plot sideways to move along the countries...
  panY: true,        // ...or up and down to move along the values
  wheelX: "none",    // the mouse wheel does nothing on the chart...
  wheelY: "none"     // ...so it still scrolls the page
}));

// Hide the zoom-out button, so it does not appear while columns animate
chart.zoomOutButton.set("forceHidden", true);


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
const xRenderer = am5xy.AxisRendererX.new(root, {
  minGridDistance: 30 // labels as close as 30 pixels (not 120), so every country gets one
});

// upright labels, so the country names fit side by side
xRenderer.labels.template.setAll({
  rotation: -90,     // turned to read from bottom to top
  centerY: am5.p50,  // each label centered on its column
  centerX: 0,
  paddingRight: 15
});

xRenderer.grid.template.set("visible", false); // no grid lines between the columns

const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  maxDeviation: 0.3,  // panning can go up to 30% of a view past the first or last country
  categoryField: "country",
  renderer: xRenderer
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 0.3,  // panning can go up to 30% of a view past the highest value
  min: 0,             // start at zero, so the column heights compare fairly
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
const series = chart.series.push(am5xy.ColumnSeries.new(root, {
  name: "Series 1",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  categoryXField: "country",
  colorByDataItem: true // each column gets a color of its own, not one for the whole series
}));

// rounded top corners
series.columns.template.setAll({
  cornerRadiusTL: 5, // top left, in pixels
  cornerRadiusTR: 5  // top right
});

// Show the value at the top of each column
series.bullets.push(() => {
  return am5.Bullet.new(root, {
    locationY: 1, // at the column's top end
    sprite: am5.Label.new(root, {
      text: "{valueYWorking.formatNumber('#.')}",       // the animated value, as a whole number
      fill: root.interfaceColors.get("alternativeText"), // white in this theme, to read on the column
      centerY: 0,                                         // the label hangs down from the top, inside the column
      centerX: am5.p50,                                   // centered across the column
      populateText: true                                  // fills in the {placeholder} from the data
    })
  });
});


// Set data
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Setting_data
const data = [
  { country: "USA", value: 2025 },
  { country: "China", value: 1882 },
  { country: "Japan", value: 1809 },
  { country: "Germany", value: 1322 },
  { country: "UK", value: 1122 },
  { country: "France", value: 1114 },
  { country: "India", value: 984 },
  { country: "Spain", value: 711 },
  { country: "Netherlands", value: 665 },
  { country: "Russia", value: 580 },
  { country: "South Korea", value: 443 },
  { country: "Canada", value: 441 }
];

xAxis.data.setAll(data);
series.data.setAll(data);


// Sort the categories by value and animate them to their new places
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/category-axis/
function sortCategoryAxis() {
  // Sort series items by value, descending
  series.dataItems.sort((x, y) => {
    return y.get("valueY", 0) - x.get("valueY", 0);
  });

  am5.array.each(xAxis.dataItems, (dataItem) => {
    // The new place of a category is the index of its series item
    const index = am5.array.findIndex(series.dataItems, (seriesDataItem) => {
      return seriesDataItem.get("categoryX") == dataItem.get("category");
    });

    if (index != -1) {
      // Offset by the distance moved, so the column stays where it is now
      const deltaPosition = (index - dataItem.get("index", 0)) / series.dataItems.length;
      dataItem.set("index", index);
      dataItem.set("deltaPosition", -deltaPosition);

      // Then animate the offset away
      dataItem.animate({
        key: "deltaPosition",
        to: 0,
        duration: 1000,                      // one second, in milliseconds
        easing: am5.ease.out(am5.ease.cubic) // fast at first, slowing down into place
      });
    }
  });

  // Put axis items in the new order
  xAxis.dataItems.sort((x, y) => {
    return x.get("index", 0) - y.get("index", 0);
  });
}


// Change every value by a random amount
function updateData() {
  am5.array.each(series.dataItems, (dataItem) => {
    let value = dataItem.get("valueY", 0) + Math.round(Math.random() * 300 - 150); // up to 150 either way
    if (value < 0) { // no negative columns: a value below zero becomes 10
      value = 10;
    }

    // Set the value at once, and animate the displayed one to it
    dataItem.set("valueY", value);
    dataItem.animate({
      key: "valueYWorking",
      to: value,
      duration: 600,                       // milliseconds, well before the next update
      easing: am5.ease.out(am5.ease.cubic) // fast at first, slowing down into place
    });
  });

  sortCategoryAxis();
}

// Update data every 1.5 seconds
setInterval(() => {
  updateData();
}, 1500);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000);
chart.appear(1000, 100);