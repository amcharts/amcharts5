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
  panX: false,          // dragging the plot does not pan: the cursor uses the drag to zoom
  panY: false,
  wheelX: "panX",       // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX",      // ...and the vertical wheel zooms in on them
  maxTooltipDistance: 0 // only the tooltip of the line nearest the pointer, not all ten
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  behavior: "zoomX" // drag across the plot to zoom in on those days
}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 0,            // no scrolling past the first or last day
  baseInterval: {             // one data point per day
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true    // fainter grid lines between the labelled ones
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's date on the axis
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/
const lineSeries: am5xy.LineSeries[] = [];

// ten lines, each reading its own field (value1 to value10) from the same data
for (let i = 1; i <= 10; i++) {
  const series = chart.series.push(am5xy.LineSeries.new(root, {
    name: "Series " + i,
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: "value" + i,
    valueXField: "date",
    legendValueText: "{valueY}", // the legend shows the value for the day under the cursor
    tooltip: am5.Tooltip.new(root, {
      labelText: "{valueY}",
      pointerOrientation: "horizontal" // sits beside the point, pointing left or right
    })
  }));

  lineSeries.push(series);
}


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
// The dates in the data are strings: the processor turns them into timestamps
// https://docs.amcharts.com/v5/concepts/data/#parsing-dates
const data = [
  { date: "2024-01-01", value1: 1, value2: 3, value3: 2, value4: 5, value5: 4, value6: 1, value7: -2, value8: 2, value9: 3, value10: 0 },
  { date: "2024-01-02", value1: 2, value2: 11, value3: 4, value4: 10, value5: 8, value6: -2, value7: -6, value8: 5, value9: 5, value10: 3 },
  { date: "2024-01-03", value1: 4, value2: 10, value3: 6, value4: 11, value5: 7, value6: 1, value7: -1, value8: 11, value9: 6, value10: 7 },
  { date: "2024-01-04", value1: 2, value2: 10, value3: 9, value4: 16, value5: 6, value6: -3, value7: 1, value8: 11, value9: 8, value10: 10 },
  { date: "2024-01-05", value1: 7, value2: 12, value3: 12, value4: 18, value5: 6, value6: -6, value7: -3, value8: 17, value9: 10, value10: 12 },
  { date: "2024-01-06", value1: 4, value2: 17, value3: 13, value4: 13, value5: 9, value6: -8, value7: -2, value8: 18, value9: 15, value10: 13 },
  { date: "2024-01-07", value1: 5, value2: 19, value3: 8, value4: 17, value5: 9, value6: -3, value7: -3, value8: 20, value9: 13, value10: 17 },
  { date: "2024-01-08", value1: 3, value2: 19, value3: 11, value4: 18, value5: 7, value6: -4, value7: -2, value8: 24, value9: 17, value10: 19 },
  { date: "2024-01-09", value1: 5, value2: 27, value3: 13, value4: 18, value5: 7, value6: -3, value7: -5, value8: 27, value9: 14, value10: 18 },
  { date: "2024-01-10", value1: 3, value2: 25, value3: 15, value4: 19, value5: 10, value6: -7, value7: -2, value8: 27, value9: 19, value10: 23 },
  { date: "2024-01-11", value1: 7, value2: 29, value3: 15, value4: 20, value5: 8, value6: -4, value7: 1, value8: 31, value9: 20, value10: 20 },
  { date: "2024-01-12", value1: 5, value2: 32, value3: 19, value4: 20, value5: 14, value6: -5, value7: 3, value8: 31, value9: 16, value10: 20 },
  { date: "2024-01-13", value1: 9, value2: 33, value3: 18, value4: 19, value5: 15, value6: -6, value7: -1, value8: 31, value9: 16, value10: 20 },
  { date: "2024-01-14", value1: 12, value2: 38, value3: 19, value4: 17, value5: 14, value6: -3, value7: 1, value8: 32, value9: 19, value10: 19 },
  { date: "2024-01-15", value1: 11, value2: 38, value3: 16, value4: 23, value5: 11, value6: -7, value7: 5, value8: 33, value9: 22, value10: 26 },
  { date: "2024-01-16", value1: 14, value2: 42, value3: 13, value4: 22, value5: 13, value6: -7, value7: 3, value8: 34, value9: 18, value10: 24 },
  { date: "2024-01-17", value1: 12, value2: 40, value3: 15, value4: 26, value5: 14, value6: -8, value7: 3, value8: 34, value9: 24, value10: 26 },
  { date: "2024-01-18", value1: 12, value2: 39, value3: 19, value4: 25, value5: 15, value6: -5, value7: -2, value8: 32, value9: 21, value10: 31 },
  { date: "2024-01-19", value1: 9, value2: 44, value3: 17, value4: 28, value5: 18, value6: -4, value7: 3, value8: 32, value9: 19, value10: 34 },
  { date: "2024-01-20", value1: 8, value2: 42, value3: 18, value4: 25, value5: 20, value6: -4, value7: 4, value8: 36, value9: 24, value10: 36 }
];

// every series gets the same rows and its own processor
am5.array.each(lineSeries, (series) => {
  series.data.processor = am5.DataProcessor.new(root, {
    dateFormat: "yyyy-MM-dd",
    dateFields: ["date"]
  });
  series.data.setAll(data);
});


// Add legend
// https://docs.amcharts.com/v5/charts/xy-chart/legend-xy-series/
// in the container right of the plot, so the legend sits beside it
const legend = chart.rightAxesContainer.children.push(am5.Legend.new(root, {
  width: 200,              // a fixed-width column
  paddingLeft: 15,         // a gap between the plot and the legend
  height: am5.percent(100) // as tall as the plot
}));

legend.itemContainers.template.set("width", am5.p100); // each item spans the whole legend
// the values line up at the right edge of the legend
legend.valueLabels.template.setAll({
  width: am5.p100,
  textAlign: "right"
});


// Dim all the other series while a legend item is hovered
// https://docs.amcharts.com/v5/concepts/events/
legend.itemContainers.template.events.on("pointerover", (ev) => {
  const dataItem = ev.target.dataItem;
  if (dataItem) {
    // The data context of a legend item is its series
    const hovered = dataItem.dataContext;

    am5.array.each(lineSeries, (series) => {
      if (series != hovered) {
        series.strokes.template.setAll({
          strokeOpacity: 0.15,                     // the other lines fade...
          stroke: root.interfaceColors.get("text") // ...and take the text color instead of their own
        });
      }
      else {
        series.strokes.template.set("strokeWidth", 3); // the hovered line gets thicker
      }
    });
  }
});

// Put every series back when the pointer leaves
legend.itemContainers.template.events.on("pointerout", () => {
  am5.array.each(lineSeries, (series) => {
    series.strokes.template.setAll({
      strokeOpacity: 1,            // the theme's defaults again
      strokeWidth: 1,
      stroke: series.get("stroke") // the series' own color
    });
  });
});

// It is important to set legend data after the events are added to the
// template, otherwise they are not copied to the legend items
legend.data.setAll(lineSeries);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
am5.array.each(lineSeries, (series) => {
  series.appear(1000);
});
chart.appear(1000, 100);