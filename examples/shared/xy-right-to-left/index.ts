import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_ResponsiveMax from "@amcharts/amcharts5/themes/ResponsiveMax";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
// https://docs.amcharts.com/v5/concepts/locales/right-to-left-support/
const root = am5.Root.new("chartdiv", {
  direction: "rtl" // text reads right to left, legends lay out from the right
});


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root),
  am5themes_ResponsiveMax.new(root) // fits the chart to small screens
]);


// Create chart
// https://docs.amcharts.com/v5/charts/xy-chart/
const chart = root.container.children.push(am5xy.XYChart.new(root, {
  panX: false,
  panY: false,
  wheelX: "none",
  wheelY: "none",
  layout: root.verticalLayout
}));

chart.children.unshift(am5.Label.new(root, {
  text: "מכירות לפי סניף, 2026", // Sales by branch, 2026
  fontSize: 20,
  fontWeight: "500",
  x: am5.p50,
  centerX: am5.p50,
  paddingBottom: 10
}));


// Add cursor
// https://docs.amcharts.com/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  behavior: "none"
}));
cursor.lineY.set("visible", false);


// Create axes
// https://docs.amcharts.com/v5/charts/xy-chart/axes/
const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "month",
  renderer: am5xy.AxisRendererX.new(root, {
    minGridDistance: 40
  }),
  tooltip: am5.Tooltip.new(root, {}) // shows the cursor's month on the axis
}));

xAxis.children.push(am5.Label.new(root, {
  text: "חודש", // Month
  x: am5.p50,
  centerX: am5.p50
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  min: 0,
  renderer: am5xy.AxisRendererY.new(root, {})
}));

yAxis.children.unshift(am5.Label.new(root, {
  text: "מכירות (אלפי ₪)", // Sales (thousands of shekels)
  rotation: -90,
  y: am5.p50,
  centerX: am5.p50
}));


// Add series
// https://docs.amcharts.com/v5/charts/xy-chart/series/
// one line per branch; the last two names mix Hebrew with numbers and Latin
const branches = [
  { name: "תל אביב", field: "telAviv" },
  { name: "ירושלים", field: "jerusalem" },
  { name: "חיפה", field: "haifa" },
  { name: "באר שבע", field: "beersheba" },
  { name: "ראשון לציון", field: "rishon" },
  { name: "פתח תקווה", field: "petahTikva" },
  { name: "אשדוד", field: "ashdod" },
  { name: "נתניה", field: "netanya" },
  { name: "הרצליה", field: "herzliya" },
  { name: "אילת", field: "eilat" },
  { name: "חנות 24/7", field: "store247" },
  { name: "קפה Wi-Fi", field: "wifiCafe" }
];

const data = [
  { month: "ינואר", telAviv: 15, jerusalem: 26, haifa: 26, beersheba: 28, rishon: 41, petahTikva: 49, ashdod: 48, netanya: 54, herzliya: 67, eilat: 71, store247: 70, wifiCafe: 80 },
  { month: "פברואר", telAviv: 19, jerusalem: 24, haifa: 22, beersheba: 32, rishon: 44, petahTikva: 45, ashdod: 46, netanya: 58, herzliya: 68, eilat: 67, store247: 71, wifiCafe: 84 },
  { month: "מרץ", telAviv: 20, jerusalem: 19, haifa: 23, beersheba: 36, rishon: 43, petahTikva: 41, ashdod: 48, netanya: 62, herzliya: 65, eilat: 64, store247: 75, wifiCafe: 86 },
  { month: "אפריל", telAviv: 17, jerusalem: 16, haifa: 26, beersheba: 38, rishon: 39, petahTikva: 40, ashdod: 53, netanya: 61, herzliya: 60, eilat: 65, store247: 79, wifiCafe: 84 },
  { month: "מאי", telAviv: 13, jerusalem: 17, haifa: 30, beersheba: 36, rishon: 35, petahTikva: 43, ashdod: 56, netanya: 58, herzliya: 58, eilat: 69, store247: 80, wifiCafe: 79 },
  { month: "יוני", telAviv: 10, jerusalem: 21, haifa: 32, beersheba: 32, rishon: 34, petahTikva: 47, ashdod: 55, netanya: 54, herzliya: 60, eilat: 73, store247: 77, wifiCafe: 76 }
];

branches.forEach((branch) => {
  const series = chart.series.push(am5xy.LineSeries.new(root, {
    name: branch.name,
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: branch.field,
    categoryXField: "month",
    legendValueText: "[bold]{valueY}[/]", // the month under the cursor
    legendRangeValueText: "{valueYSum}",  // the half-year total otherwise
    calculateAggregates: true             // needed for {valueYSum}
  }));

  series.strokes.template.set("strokeWidth", 2);

  series.bullets.push(() => {
    return am5.Bullet.new(root, {
      sprite: am5.Circle.new(root, {
        radius: 4,
        fill: series.get("fill"),
        // keyboard: 12 lines, so one Tab stop for all the points; the up and down arrow keys step through them
        focusable: true,
        focusableGroup: "points",
        ariaLabel: "{name}, {categoryX}: {valueY} אלפי ₪" // thousands of shekels
      })
    });
  });

  series.data.setAll(data);
});


// Set data
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
xAxis.data.setAll(data);


// Add legend
// https://docs.amcharts.com/v5/concepts/legend/
// 12 items wrap over several rows; with rtl, rows fill from the right and each
// marker is on the right of its name
const legend = chart.children.push(am5.Legend.new(root, {
  x: am5.p50,
  centerX: am5.p50,
  paddingTop: 15
}));

legend.data.setAll(chart.series.values);


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
chart.setAll({
  focusable: true, // Tab reaches the chart, and a screen reader names it
  // Line chart of monthly sales in 12 branches, January to June 2026. Tab to the points, then move between them
  // with the up and down arrow keys
  ariaLabel: "תרשים קווים של מכירות חודשיות ב-12 סניפים, ינואר עד יוני 2026. הקישו Tab כדי להגיע לנקודות, ועברו ביניהן בעזרת מקשי החצים למעלה ולמטה"
});
// the points: set up in their bullet function above
// the legend: one Tab stop, after the points
legend.itemContainers.template.setAll({
  focusableGroup: "legend",
  tabindexOrder: 10 // focus runs from low to high (0 if not set)
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
chart.series.each((series) => {
  series.appear(1000);
});
chart.appear(1000, 100);
