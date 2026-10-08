import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
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
// https://www.amcharts.com/docs/v5/charts/radar-chart/gauge-charts/
const chart = root.container.children.push(am5radar.RadarChart.new(root, {
  panX: false,       // the gauge does not move when dragged
  panY: false,
  startAngle: 160,   // the arc starts a little below the left side...
  endAngle: 380      // ...and runs over the top to a little below the right
}));


// Create axis and its renderer
// https://www.amcharts.com/docs/v5/charts/radar-chart/gauge-charts/#Axes
const axisRenderer = am5radar.AxisRendererCircular.new(root, {
  innerRadius: -40 // the scale is a ring 40 px wide, measured in from the outer edge
});

axisRenderer.grid.template.setAll({
  stroke: root.interfaceColors.get("background"), // in the background color, so grid lines show as gaps
  visible: true,
  strokeOpacity: 0.8,
  strokeWidth: 2,
  crisp: false // no pixel snapping, which can draw lines thinner than set
});

const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
  maxDeviation: 0,    // the scale can't be zoomed or moved past its ends
  min: -40,           // the scale runs from -40...
  max: 100,           // ...to 100
  strictMinMax: true, // exactly, without rounding the ends to nicer numbers
  renderer: axisRenderer
}));


// Create bands: an axis range with a fill and a label for each
// https://www.amcharts.com/docs/v5/charts/radar-chart/gauge-charts/#Bands
const bands = [
  { title: "Unsustainable", color: 0xee1f25, lowScore: -40, highScore: -20 },
  { title: "Volatile", color: 0xf04922, lowScore: -20, highScore: 0 },
  { title: "Foundational", color: 0xfdae19, lowScore: 0, highScore: 20 },
  { title: "Developing", color: 0xf3eb0c, lowScore: 20, highScore: 40 },
  { title: "Maturing", color: 0xb0d136, lowScore: 40, highScore: 60 },
  { title: "Sustainable", color: 0x54b947, lowScore: 60, highScore: 80 },
  { title: "High Performing", color: 0x0f9747, lowScore: 80, highScore: 100 }
];

// one axis range per band, covering the scale from its low to its high score
am5.array.each(bands, (band) => {
  const axisRange = xAxis.createAxisRange(xAxis.makeDataItem({
    above: true,              // its fill and grid line go over the axis's regular grid
    value: band.lowScore,     // the range starts at the band's low score...
    endValue: band.highScore  // ...and ends at its high score
  }));

  const axisFill = axisRange.get("axisFill");
  if (axisFill) {
    axisFill.setAll({
      visible: true, // axis fills are hidden by default
      fill: am5.color(band.color),
      fillOpacity: 0.8
    });
  }

  const label = axisRange.get("label") as am5xy.AxisLabelRadial | undefined;
  if (label) {
    label.setAll({
      text: band.title,
      inside: true,      // inside the ring, not outside the arc
      radius: 15,        // 15 px in from the ring's outer edge
      fontSize: "0.9em",
      fill: root.interfaceColors.get("background") // the background color reads well on the bands
    });
  }
});


// Add clock hand
// https://www.amcharts.com/docs/v5/charts/radar-chart/gauge-charts/#Clock_hands
const axisDataItem = xAxis.makeDataItem({
  value: 50 // where the hand points at the start
});

const clockHand = am5radar.ClockHand.new(root, {
  pinRadius: am5.percent(20), // a big pin, a fifth of the gauge's radius, to hold the value
  radius: am5.percent(100),   // the tip reaches the outer edge of the scale
  bottomWidth: 40             // 40 px wide at the base, narrowing to the tip
});

// the hand is the bullet of an axis data item: it points at the item's value
axisDataItem.set("bullet", am5xy.AxisBullet.new(root, {
  sprite: clockHand
}));

xAxis.createAxisRange(axisDataItem);

// Add label that shows the value, on the hand's pin
const valueLabel = chart.radarContainer.children.push(am5.Label.new(root, {
  fill: root.interfaceColors.get("background"), // in the background color, to read on the colored pin
  centerX: am5.percent(50),                     // centered on the middle of the gauge
  centerY: am5.percent(50),
  textAlign: "center",
  fontSize: "3em"
}));


// When the hand turns, show its value and take the color of the band it is in
clockHand.on("rotation", () => {
  const value = axisDataItem.get("value", 0);
  let fill = clockHand.hand.get("fill");

  am5.array.each(bands, (band) => {
    if (value >= band.lowScore && value <= band.highScore) {
      fill = am5.color(band.color);
    }
  });

  valueLabel.set("text", Math.round(value).toString());

  // fade the pin and the hand to the band's color over half a second
  clockHand.pin.animate({ key: "fill", to: fill, duration: 500, easing: am5.ease.out(am5.ease.cubic) });
  clockHand.hand.animate({ key: "fill", to: fill, duration: 500, easing: am5.ease.out(am5.ease.cubic) });
});

// Move the hand to the next value of a fixed sequence every two seconds
const values = [50, 72, 91, 34, 8, -27, -12, 15];
let index = 0;

setInterval(() => {
  index = (index + 1) % values.length;

  axisDataItem.animate({
    key: "value",
    to: values[index],
    duration: 500,
    easing: am5.ease.out(am5.ease.cubic)
  });
}, 2000);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);