import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
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


// Create chart
// https://docs.amcharts.com/v5/charts/radar-chart/gauge-charts/
const chart = root.container.children.push(am5radar.RadarChart.new(root, {
  panX: false,       // the gauge does not move when dragged
  panY: false,
  startAngle: 180,   // the arc starts on the left...
  endAngle: 360      // ...and runs over the top to the right: a half circle
}));


// Create axis and its renderer
// https://docs.amcharts.com/v5/charts/radar-chart/gauge-charts/#axes
const axisRenderer = am5radar.AxisRendererCircular.new(root, {
  innerRadius: -10,  // grid lines only 10 px long, in from the arc, like tick marks
  strokeOpacity: 0.1 // a faint line along the arc (hidden by default)
});

const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 0,    // the scale can't be zoomed or moved past its ends
  min: 0,             // the scale runs from 0...
  max: 100,           // ...to 100
  strictMinMax: true, // exactly, without rounding the ends to nicer numbers
  renderer: axisRenderer
}));


// Add clock hand: an axis range with a bullet at the value it shows
// https://docs.amcharts.com/v5/charts/radar-chart/gauge-charts/#clock-hands
const axisDataItem = xAxis.makeDataItem({
  value: 65 // the value the hand points at
});

axisDataItem.set("bullet", am5xy.AxisBullet.new(root, {
  sprite: am5radar.ClockHand.new(root, {
    radius: am5.percent(99) // the tip almost reaches the arc
  })
}));

xAxis.createAxisRange(axisDataItem);

// The range's own grid line would show under the hand
const grid = axisDataItem.get("grid");
if (grid) {
  grid.set("visible", false);
}


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
// the gauge has no parts to step through: its name gives the reading
chart.setAll({
  focusable: true, // Tab reaches the chart, and a screen reader names it
  ariaLabel: "Gauge with a hand on a dial from 0 to 100, pointing at 65"
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
chart.appear(1000, 100);