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


// Create chart
// https://www.amcharts.com/docs/v5/charts/timeline/
const chart = root.container.children.push(am5timeline.CurveChart.new(root, {
  wheelY: "zoomX" // the mouse wheel zooms in on part of the day
}));


// The path of the timeline: a straight start, four vertical runs joined by turns, a straight end
function getPoints() {
  const radius = 70;                    // the radius of every turn; the chart scales the path to fit
  const points = [{ x: -300, y: 200 }]; // the start of the straight run in from the left

  // A quarter turn up
  addArc(points, 0, 200 - radius, radius, 90, 0);

  // Half turns at the top, at the bottom and at the top again
  addArc(points, 2 * radius, radius - 200, radius, 180, 360);
  addArc(points, 4 * radius, 200 - radius, radius, 180, 0);
  addArc(points, 6 * radius, radius - 200, radius, 180, 360);

  // A quarter turn to the right
  addArc(points, 8 * radius, -radius, radius, 180, 90);

  points.push({ x: 8 * radius + 300, y: 0 }); // the end of the straight run out to the right
  return points;
}

// Adds the points of an arc; angles are in degrees, clockwise from the right
function addArc(points: am5.IPoint[], x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  for (let i = 0; i <= 30; i++) { // 31 points, enough for the turn to look smooth
    const angle = startAngle + (endAngle - startAngle) * i / 30;
    points.push({
      x: x + radius * am5.math.cos(angle),
      y: y + radius * am5.math.sin(angle)
    });
  }
}


// Create axes: the date axis follows the path, the category axis runs across it
// https://www.amcharts.com/docs/v5/charts/timeline/
const yRenderer = am5timeline.AxisRendererCurveY.new(root, {
  axisLocation: -0.1 // both rows sit on one side of the path, a little off it, not across it
});

yRenderer.labels.template.set("forceHidden", true); // no row names
yRenderer.grid.template.set("forceHidden", true);   // no grid lines between the rows

const xRenderer = am5timeline.AxisRendererCurveX.new(root, {
  points: getPoints(),     // the path the date axis, and so the whole timeline, follows
  yRenderer: yRenderer,
  strokeDasharray: [2, 3], // the axis line along the path is dotted: 2 px dashes, 3 px gaps
  strokeOpacity: 0.5       // and half see-through (axis lines are hidden by default)
});

xRenderer.labels.template.setAll({
  centerY: am5.p50,  // the time labels are centered on the axis line
  fontSize: 11,
  minPosition: 0.01  // no label right at the start of the path
});

// Time labels sit on the axis line: a background keeps them readable
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
  baseInterval: { // the times in the data are to the minute
    timeUnit: "minute",
    count: 1
  },
  renderer: xRenderer
}));

// Two rows: the day itself, and what happens during a longer activity
yAxis.data.setAll([
  { category: "day" },
  { category: "break" }
]);


// Add series
// https://www.amcharts.com/docs/v5/charts/timeline/
const series = chart.series.push(am5timeline.CurveColumnSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  baseAxis: yAxis,          // bars sit in the rows and run along the time, from start to end
  categoryYField: "category",
  valueXField: "end",
  openValueXField: "start",
  maskBullets: false        // the pins stick out of the band along the path without being cut off
}));

series.columns.template.setAll({
  height: am5.percent(20),  // thin bars, a fifth as thick as their row
  strokeOpacity: 0,         // no outline
  templateField: "settings" // each bar's fill comes from "settings" in its data row
});

// Add a pin with an icon to each activity
// https://www.amcharts.com/docs/v5/concepts/common-elements/bullets/
series.bullets.push((root) => {
  const pin = am5.Container.new(root, {});

  pin.children.push(am5.PointedRectangle.new(root, {
    width: 32,                // a 32 px box with rounded corners
    height: 32,
    centerX: am5.p50,         // centered on the activity...
    centerY: 40,              // ...and lifted 40 px, so the pointer's tip is on the bar
    cornerRadius: 5,
    pointerBaseWidth: 16,     // the pointer is 16 px wide where it leaves the box
    pointerX: 16,             // its tip is below the middle of the box...
    pointerY: 40,             // ...40 px down from the box's top
    strokeOpacity: 0,         // no outline
    tooltipText: "{text}",    // the activity's name on hover
    tooltipY: 0,              // the tooltip points at the top of the box
    templateField: "settings" // the box takes the activity's color from its data row
  }));

  // cors: null lets the icon files load when the page is opened from disk
  pin.children.push(am5.Picture.new(root, {
    width: 20,            // a 20 px icon...
    height: 20,
    centerX: am5.p50,
    centerY: 34,          // ...lifted to sit in the middle of the box
    cors: null,
    templateField: "icon" // its src comes from "icon" in the data row
  }));

  return am5.Bullet.new(root, {
    sprite: pin
  });
});


// Add scrollbar
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
// drag its ends to zoom in on part of the day, or its middle to move along it
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));


// Set data: the processor turns the date strings into timestamps
// https://www.amcharts.com/docs/v5/concepts/data/#Parsing_dates
const colors = chart.get("colors")!; // the chart's color set: each row picks its fill from it

series.data.processor = am5.DataProcessor.new(root, {
  dateFormat: "yyyy-MM-dd HH:mm",
  dateFields: ["start", "end"]
});

series.data.setAll([
  { category: "day", start: "2019-01-10 06:00", end: "2019-01-10 06:40", text: "Wake up!", icon: { src: "icons/alarm.svg" }, settings: { fill: colors.getIndex(15) } },
  { category: "day", start: "2019-01-10 06:40", end: "2019-01-10 07:20", text: "Drink water", icon: { src: "icons/water.svg" }, settings: { fill: colors.getIndex(14) } },
  { category: "day", start: "2019-01-10 07:20", end: "2019-01-10 08:00", text: "Exercise", icon: { src: "icons/exercise.svg" }, settings: { fill: colors.getIndex(13) } },
  { category: "day", start: "2019-01-10 08:00", end: "2019-01-10 08:40", text: "Have breakfast", icon: { src: "icons/breakfast.svg" }, settings: { fill: colors.getIndex(12) } },
  { category: "day", start: "2019-01-10 08:40", end: "2019-01-10 09:20", text: "Drive to work", icon: { src: "icons/car.svg" }, settings: { fill: colors.getIndex(11) } },
  { category: "day", start: "2019-01-10 09:20", end: "2019-01-10 17:30", text: "Work", icon: { src: "icons/work.svg" }, settings: { fill: colors.getIndex(10) } },
  { category: "day", start: "2019-01-10 17:30", end: "2019-01-10 18:10", text: "Drive home", icon: { src: "icons/car.svg" }, settings: { fill: colors.getIndex(8) } },
  { category: "day", start: "2019-01-10 18:10", end: "2019-01-10 21:00", text: "Home!", icon: { src: "icons/home.svg" }, settings: { fill: colors.getIndex(7) } },
  { category: "day", start: "2019-01-10 21:00", end: "2019-01-10 22:00", text: "Have a beer", icon: { src: "icons/beer.svg" }, settings: { fill: colors.getIndex(6) } },
  { category: "day", start: "2019-01-10 22:00", end: "2019-01-10 23:00", text: "Dance!", icon: { src: "icons/dance.svg" }, settings: { fill: colors.getIndex(5) } },
  { category: "day", start: "2019-01-10 23:00", end: "2019-01-11 00:00", text: "Martini!", icon: { src: "icons/drink.svg" }, settings: { fill: colors.getIndex(4) } },
  { category: "day", start: "2019-01-11 00:00", end: "2019-01-11 01:00", text: "Damn...", icon: { src: "icons/drunk.svg" }, settings: { fill: colors.getIndex(2) } },
  { category: "day", start: "2019-01-11 01:00", end: "2019-01-11 02:00", text: "Bye bye", icon: { src: "icons/bed.svg" }, settings: { fill: colors.getIndex(1) } },
  { category: "break", start: "2019-01-10 10:30", end: "2019-01-10 10:45", text: "Coffee", icon: { src: "icons/coffee.svg" }, settings: { fill: colors.getIndex(10) } },
  { category: "break", start: "2019-01-10 12:00", end: "2019-01-10 13:00", text: "Lunch", icon: { src: "icons/dinner.svg" }, settings: { fill: colors.getIndex(10) } },
  { category: "break", start: "2019-01-10 15:00", end: "2019-01-10 15:15", text: "Coffee", icon: { src: "icons/coffee.svg" }, settings: { fill: colors.getIndex(10) } },
  { category: "break", start: "2019-01-10 20:15", end: "2019-01-10 21:00", text: "Read a bit", icon: { src: "icons/book.svg" }, settings: { fill: colors.getIndex(7) } }
]);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000);
chart.appear(1000, 100);