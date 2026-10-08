import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5timeline from "@amcharts/amcharts5/timeline";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create chart: orientation: "horizontal" would lay the timeline out in columns
// https://www.amcharts.com/docs/v5/charts/timeline/
const chart = root.container.children.push(am5timeline.SerpentineChart.new(root, {
  levelCount: 3,     // the timeline winds across the chart in three runs
  startLocation: 0.2 // the first run starts a fifth of the way in: room for the row names
}));


// Create axes: the date axis follows the curve, the category axis runs across it
// https://www.amcharts.com/docs/v5/charts/timeline/
const yRenderer = am5timeline.AxisRendererCurveY.new(root, {
  minGridDistance: 10 // a name for every row, even with rows only 10 px apart
});

yRenderer.labels.template.setAll({
  centerY: am5.p50,  // the row names are centered on their rows...
  centerX: am5.p100, // ...and end where the timeline starts, so they sit left of it
  fontSize: 11
});

yRenderer.grid.template.set("forceHidden", true); // no grid lines between the rows

const xRenderer = am5timeline.AxisRendererCurveX.new(root, {
  yRenderer: yRenderer,
  strokeDasharray: [2, 3], // the axis line along the curve is dotted: 2 px dashes, 3 px gaps
  strokeOpacity: 0.5       // and half see-through (axis lines are hidden by default)
});

xRenderer.labels.template.setAll({
  centerY: am5.p50,  // the date labels are centered on the axis line
  fontSize: 11,
  minPosition: 0.01  // no label right at the start of the curve
});

// Date labels sit on the axis line: a background keeps them readable
xRenderer.labels.template.setup = (label) => {
  label.set("background", am5.Rectangle.new(root, {
    fill: root.interfaceColors.get("background")
  }));
};

const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "category",
  renderer: yRenderer
}));

const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: { // the dates in the data are whole days
    timeUnit: "day",
    count: 1
  },
  renderer: xRenderer
}));

// The empty category leaves the middle of the band to the date labels and the flags
yAxis.data.setAll([
  { category: "Module #1" },
  { category: "Module #2" },
  { category: "" },
  { category: "Module #3" },
  { category: "Module #4" }
]);


// Add series
// https://www.amcharts.com/docs/v5/charts/timeline/
const series = chart.series.push(am5timeline.CurveColumnSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  baseAxis: yAxis, // columns sit in the rows and run along the dates, from start to end
  valueXField: "end",
  openValueXField: "start",
  categoryYField: "category"
}));

series.columns.template.setAll({
  height: am5.percent(10),           // thin bars, a tenth as thick as their row
  strokeOpacity: 0,                  // no outline
  tooltipText: "{category}: {task}", // the module and the task on hover
  templateField: "settings"          // each column's fill comes from "settings" in its data row
});

// A circle at each end of a column, in the column's color
am5.array.each([0, 1], (locationX) => {
  series.bullets.push((root) => {
    return am5.Bullet.new(root, {
      locationX: locationX, // 0 puts the circle at the column's start, 1 at its end
      sprite: am5.Circle.new(root, {
        radius: 4,
        templateField: "settings" // the same "settings" as the column, so the same fill
      })
    });
  });
});

// Add flags: a line series that shows only its bullets
const flagSeries = am5timeline.CurveLineSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  valueXField: "date",
  categoryYField: "category"
});

flagSeries.strokes.template.set("forceHidden", true); // no line between the flags

// each flag is a label with the event's letter, on a pointed background
flagSeries.bullets.push((root) => {
  return am5.Bullet.new(root, {
    sprite: am5.Label.new(root, {
      text: "{letter}",
      populateText: true, // fills in {letter} from the data row
      fontSize: 11,
      textAlign: "center",
      width: 18,          // an 18 x 16 px flag
      height: 16,
      centerX: am5.p50,   // centered on the date...
      centerY: 32,        // ...and lifted 32 px, clear of the axis line it marks
      paddingTop: 1,      // 1 px above and below the letter, none at the sides
      paddingBottom: 1,
      paddingLeft: 0,
      paddingRight: 0,
      background: am5.PointedRectangle.new(root, {
        fill: root.interfaceColors.get("background"), // a flag in the background color...
        stroke: root.interfaceColors.get("text"),     // ...outlined in the text color
        cornerRadius: 0,                              // square corners
        pointerBaseWidth: 6,                          // a pointer 6 px wide at the flag...
        pointerX: 9,                                  // ...below its middle...
        pointerY: 21                                  // ...with its tip 5 px below the flag
      })
    })
  });
});

// chart.series is typed for column series only
chart.series.push(flagSeries as any);


// Set data: the processor turns the date strings into timestamps
// https://www.amcharts.com/docs/v5/concepts/data/#Parsing_dates
const colors = chart.get("colors")!; // the chart's color set: each module picks its fill from it

series.data.processor = am5.DataProcessor.new(root, {
  dateFormat: "yyyy-MM-dd",
  dateFields: ["start", "end"]
});

series.data.setAll([
  { category: "Module #1", start: "2019-01-10", end: "2019-01-13", task: "Gathering requirements", settings: { fill: colors.getIndex(0) } },
  { category: "Module #1", start: "2019-02-05", end: "2019-04-18", task: "Development", settings: { fill: colors.getIndex(0) } },
  { category: "Module #2", start: "2019-01-08", end: "2019-01-10", task: "Gathering requirements", settings: { fill: colors.getIndex(4) } },
  { category: "Module #2", start: "2019-01-12", end: "2019-01-15", task: "Producing specifications", settings: { fill: colors.getIndex(4) } },
  { category: "Module #2", start: "2019-01-16", end: "2019-02-05", task: "Development", settings: { fill: colors.getIndex(4) } },
  { category: "Module #2", start: "2019-02-10", end: "2019-02-18", task: "Testing and QA", settings: { fill: colors.getIndex(4) } },
  { category: "Module #3", start: "2019-01-01", end: "2019-01-19", task: "Gathering requirements", settings: { fill: colors.getIndex(8) } },
  { category: "Module #3", start: "2019-02-01", end: "2019-02-10", task: "Producing specifications", settings: { fill: colors.getIndex(8) } },
  { category: "Module #3", start: "2019-03-10", end: "2019-04-15", task: "Development", settings: { fill: colors.getIndex(8) } },
  { category: "Module #3", start: "2019-04-20", end: "2019-04-30", task: "Testing and QA", settings: { fill: colors.getIndex(8) } },
  { category: "Module #4", start: "2019-01-15", end: "2019-02-12", task: "Gathering requirements", settings: { fill: colors.getIndex(12) } },
  { category: "Module #4", start: "2019-02-25", end: "2019-03-10", task: "Development", settings: { fill: colors.getIndex(12) } },
  { category: "Module #4", start: "2019-03-23", end: "2019-04-29", task: "Testing and QA", settings: { fill: colors.getIndex(12) } }
]);

// the flags go in the empty middle row, so they stand on the axis line
flagSeries.data.processor = am5.DataProcessor.new(root, {
  dateFormat: "yyyy-MM-dd",
  dateFields: ["date"]
});

flagSeries.data.setAll([
  { category: "", date: "2019-01-22", letter: "A" },
  { category: "", date: "2019-01-28", letter: "B" },
  { category: "", date: "2019-02-20", letter: "C" },
  { category: "", date: "2019-02-28", letter: "D" },
  { category: "", date: "2019-03-06", letter: "E" },
  { category: "", date: "2019-03-12", letter: "F" },
  { category: "", date: "2019-04-18", letter: "G" }
]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000);
flagSeries.appear(1000);
chart.appear(1000, 100);