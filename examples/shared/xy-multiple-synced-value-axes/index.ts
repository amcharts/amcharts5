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
  panX: false,       // dragging the plot does not pan: the cursor uses the drag to zoom
  panY: false,
  wheelX: "panX",    // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX",   // ...and the vertical wheel zooms in on them
  colors: am5.ColorSet.new(root, {
    step: 3          // every third color of the set, so the three lines differ more
  })
}));


// Add cursor
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  behavior: "zoomX" // drag across the plot to zoom in on those days
}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create X axis
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 0.1,          // the view can go a little past the first and last day
  baseInterval: {             // one data point per day
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true    // fainter grid lines between the labelled ones
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));


// Create a Y axis and its series
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/value-axis/#Syncing_grid
function createAxisAndSeries(name: string, field: string, opposite: boolean, syncWithAxis?: am5xy.ValueAxis<am5xy.AxisRenderer>) {
  const yRenderer = am5xy.AxisRendererY.new(root, {
    opposite: opposite // true puts the axis right of the plot instead of left
  });

  // An axis synced with another one lines its grid up with it
  const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
    syncWithAxis: syncWithAxis,
    renderer: yRenderer
  }));

  const series = chart.series.push(am5xy.LineSeries.new(root, {
    name: name,
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: field,
    valueXField: "date",
    tooltip: am5.Tooltip.new(root, {
      labelText: "{name}: {valueY}",   // the series name and the hovered day's value
      pointerOrientation: "horizontal" // sits beside the point, pointing left or right
    })
  }));

  // Color the axis like its series
  yRenderer.grid.template.set("strokeOpacity", 0.05); // faint: the three axes' synced grids overlap
  yRenderer.labels.template.set("fill", series.get("fill"));
  yRenderer.setAll({
    stroke: series.get("fill"), // the axis line in the series color...
    strokeOpacity: 1            // ...and shown: the theme hides it
  });

  return yAxis;
}

// the first axis on the left; the other two on the right, their grid synced with the first
const firstAxis = createAxisAndSeries("Visits", "value1", false);
createAxisAndSeries("Views", "value2", true, firstAxis);
createAxisAndSeries("Hits", "value3", true, firstAxis);


// Set data
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Setting_data
// The dates in the data are strings: the processor turns them into timestamps
// https://www.amcharts.com/docs/v5/concepts/data/#Parsing_dates
const data = [
  { date: "2024-01-01", value1: 100, value2: 985, value3: 8086 },
  { date: "2024-01-02", value1: 103, value2: 952, value3: 7888 },
  { date: "2024-01-03", value1: 102, value2: 965, value3: 7392 },
  { date: "2024-01-04", value1: 95, value2: 947, value3: 7556 },
  { date: "2024-01-05", value1: 99, value2: 937, value3: 7083 },
  { date: "2024-01-06", value1: 110, value2: 895, value3: 6715 },
  { date: "2024-01-07", value1: 110, value2: 898, value3: 7071 },
  { date: "2024-01-08", value1: 111, value2: 890, value3: 7284 },
  { date: "2024-01-09", value1: 118, value2: 881, value3: 7193 },
  { date: "2024-01-10", value1: 122, value2: 865, value3: 6469 },
  { date: "2024-01-11", value1: 121, value2: 795, value3: 6519 },
  { date: "2024-01-12", value1: 120, value2: 815, value3: 6980 },
  { date: "2024-01-13", value1: 118, value2: 774, value3: 6865 },
  { date: "2024-01-14", value1: 111, value2: 776, value3: 6550 },
  { date: "2024-01-15", value1: 110, value2: 791, value3: 6186 },
  { date: "2024-01-16", value1: 111, value2: 816, value3: 6128 },
  { date: "2024-01-17", value1: 119, value2: 834, value3: 5634 },
  { date: "2024-01-18", value1: 131, value2: 851, value3: 5701 },
  { date: "2024-01-19", value1: 133, value2: 778, value3: 5995 },
  { date: "2024-01-20", value1: 139, value2: 731, value3: 5644 },
  { date: "2024-01-21", value1: 146, value2: 698, value3: 6204 },
  { date: "2024-01-22", value1: 159, value2: 666, value3: 6347 },
  { date: "2024-01-23", value1: 156, value2: 706, value3: 5966 },
  { date: "2024-01-24", value1: 145, value2: 643, value3: 5656 },
  { date: "2024-01-25", value1: 143, value2: 616, value3: 5577 },
  { date: "2024-01-26", value1: 153, value2: 664, value3: 6126 },
  { date: "2024-01-27", value1: 150, value2: 616, value3: 5669 },
  { date: "2024-01-28", value1: 160, value2: 635, value3: 5732 },
  { date: "2024-01-29", value1: 151, value2: 654, value3: 5924 },
  { date: "2024-01-30", value1: 149, value2: 625, value3: 5824 }
];

// every series gets the same rows and its own processor
chart.series.each((series) => {
  series.data.processor = am5.DataProcessor.new(root, {
    dateFormat: "yyyy-MM-dd",
    dateFields: ["date"]
  });
  series.data.setAll(data);
});


// Add scrollbar
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
// above the plot: drag its ends to zoom, or its middle to move along the dates
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.series.each((series) => {
  series.appear(1000);
});
chart.appear(1000, 100);