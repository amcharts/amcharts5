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
// The color set skips colors, so the two series are easy to tell apart
const chart = root.container.children.push(am5xy.XYChart.new(root, {
  panX: true,       // drag the plot to move around it, sideways...
  panY: true,       // ...and up and down
  wheelX: "panX",   // a sideways wheel or trackpad swipe moves along the dates...
  wheelY: "zoomX",  // ...and the vertical wheel zooms in on them
  colors: am5.ColorSet.new(root, {
    step: 3
  })
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
cursor.lineY.set("visible", false); // only the vertical line that follows the dates


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 0.3,          // can be dragged 30% of the view past the data, to draw there
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
  maxDeviation: 0.3, // the same up and down, past the highest and lowest values
  renderer: am5xy.AxisRendererY.new(root, {})
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/
const series = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Series",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  valueXField: "date",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{valueY}" // the hovered day's value
  })
}));

// The series the user draws
const drawingSeries = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Drawing",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  valueXField: "date"
}));


// Add bullets
// https://docs.amcharts.com/v5/charts/xy-chart/series/#bullets
// An invisible bullet takes the drag, so the visible one does not flicker
drawingSeries.bullets.push(() => {
  const circle = am5.Circle.new(root, {
    radius: 6,                 // a bit larger than the visible dot, so it is easy to grab
    fillOpacity: 0,            // not seen, but still catches the pointer
    fill: drawingSeries.get("fill"),
    draggable: true,           // can be dragged with the mouse or a finger
    cursorOverStyle: "pointer" // the mouse pointer turns into a hand over a point
  });

  // Move the data item to where the bullet is dragged
  circle.events.on("dragged", (e) => {
    const point = chart.plotContainer.toLocal(e.point); // the pointer's position within the plot
    // the trick: pixels to a position on each axis (0 to 1), then to a date and a value
    const date = xAxis.positionToValue(xAxis.coordinateToPosition(point.x));
    const value = yAxis.positionToValue(yAxis.coordinateToPosition(point.y));

    // the "Working" values are the ones the line and bullets are drawn from
    const dataItem = e.target.dataItem as am5.DataItem<am5xy.ILineSeriesDataItem>;
    dataItem.set("valueX", date);
    dataItem.set("valueXWorking", date);
    dataItem.set("valueY", value);
    dataItem.set("valueYWorking", value);
  });

  return am5.Bullet.new(root, {
    sprite: circle
  });
});

// The bullet that is seen
drawingSeries.bullets.push(() => {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      radius: 5,
      fill: drawingSeries.get("fill") // the color of the drawn line
    })
  });
});


// Add scrollbar
// https://docs.amcharts.com/v5/charts/xy-chart/scrollbars/
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
// The dates in the data are strings: the processor turns them into timestamps
// https://docs.amcharts.com/v5/concepts/data/#parsing-dates
const processor = am5.DataProcessor.new(root, {
  dateFormat: "yyyy-MM-dd",
  dateFields: ["date"]
});

series.data.processor = processor;
series.data.setAll([
  { date: "2024-01-01", value: 100 },
  { date: "2024-01-02", value: 103 },
  { date: "2024-01-03", value: 112 },
  { date: "2024-01-04", value: 100 },
  { date: "2024-01-05", value: 113 },
  { date: "2024-01-06", value: 113 },
  { date: "2024-01-07", value: 123 },
  { date: "2024-01-08", value: 126 },
  { date: "2024-01-09", value: 124 },
  { date: "2024-01-10", value: 130 },
  { date: "2024-01-11", value: 133 },
  { date: "2024-01-12", value: 134 },
  { date: "2024-01-13", value: 143 },
  { date: "2024-01-14", value: 131 },
  { date: "2024-01-15", value: 136 },
  { date: "2024-01-16", value: 140 },
  { date: "2024-01-17", value: 145 },
  { date: "2024-01-18", value: 140 },
  { date: "2024-01-19", value: 132 },
  { date: "2024-01-20", value: 128 },
  { date: "2024-01-21", value: 124 },
  { date: "2024-01-22", value: 115 },
  { date: "2024-01-23", value: 117 },
  { date: "2024-01-24", value: 99 },
  { date: "2024-01-25", value: 99 },
  { date: "2024-01-26", value: 92 },
  { date: "2024-01-27", value: 78 },
  { date: "2024-01-28", value: 81 },
  { date: "2024-01-29", value: 77 },
  { date: "2024-01-30", value: 80 },
  { date: "2024-01-31", value: 86 },
  { date: "2024-02-01", value: 90 },
  { date: "2024-02-02", value: 105 },
  { date: "2024-02-03", value: 102 },
  { date: "2024-02-04", value: 101 },
  { date: "2024-02-05", value: 102 },
  { date: "2024-02-06", value: 113 },
  { date: "2024-02-07", value: 105 },
  { date: "2024-02-08", value: 103 },
  { date: "2024-02-09", value: 114 }
]);

// A few points to start the drawing with
drawingSeries.data.processor = processor;
drawingSeries.data.setAll([
  { date: "2024-01-06", value: 100 },
  { date: "2024-01-20", value: 140 },
  { date: "2024-02-04", value: 80 }
]);


// Add a point where the plot area is clicked
// https://docs.amcharts.com/v5/concepts/events/
const plotBackground = chart.plotContainer.get("background");
if (plotBackground) {
  plotBackground.events.on("click", (e) => {
    const point = chart.plotContainer.toLocal(e.point);
    // the clicked pixels, turned into a date and a value as in the drag handler
    drawingSeries.data.push({
      date: xAxis.positionToValue(xAxis.coordinateToPosition(point.x)),
      value: yAxis.positionToValue(yAxis.coordinateToPosition(point.y))
    });

    // Keep the points in date order, so one clicked between two others
    // joins the line between them
    drawingSeries.dataItems.sort((a, b) => {
      return a.get("valueX", 0) - b.get("valueX", 0);
    });
  });
}


// Add a label that says what to do
chart.plotContainer.children.push(am5.Label.new(root, {
  x: 10,              // 10 pixels in from the left of the plot
  y: am5.p100,        // at the bottom of the plot...
  centerY: am5.p100,  // ...by its own bottom edge, so it sits just inside
  text: "Click the plot area to add a point; drag a point to move it"
}));


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
drawingSeries.appear(1000);
chart.appear(1000, 100);