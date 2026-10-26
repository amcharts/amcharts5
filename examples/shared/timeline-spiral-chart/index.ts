import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5timeline from "@amcharts/amcharts5/timeline";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create chart: the band of columns takes half of the distance between two turns
// https://docs.amcharts.com/v5/charts/timeline/
const chart = root.container.children.push(am5timeline.SpiralChart.new(root, {
  levelCount: 3,                // the date axis winds around three times
  innerRadius: am5.percent(35), // the spiral starts at 35% of the radius, leaving the middle empty
  yAxisRadius: am5.percent(50)
}));


// Create axes: the date axis follows the spiral, the value axis runs across it.
// axisLocation: 1.5 puts the date axis and its labels between two turns
// https://docs.amcharts.com/v5/charts/timeline/
const yRenderer = am5timeline.AxisRendererCurveY.new(root, {
  axisLocation: 1.5
});

yRenderer.labels.template.set("forceHidden", true); // no value labels across the band

const xRenderer = am5timeline.AxisRendererCurveX.new(root, {
  yRenderer: yRenderer
});

xRenderer.labels.template.setAll({
  centerX: am5.p50, // each date label is centered on its spot on the axis
  centerY: am5.p50,
  fontSize: 11
});

const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: { // one data point per month
    timeUnit: "month",
    count: 1
  },
  gridIntervals: [ // grid lines and labels only once a year
    { timeUnit: "year", count: 1 }
  ],
  renderer: xRenderer
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  renderer: yRenderer
}));


// Add series
// https://docs.amcharts.com/v5/charts/timeline/
const series = chart.series.push(am5timeline.CurveColumnSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  valueXField: "date",
  valueYField: "value"
}));

series.columns.template.setAll({
  width: am5.percent(80),                                  // 80% of the month, leaving small gaps
  tooltipText: "{valueX.formatDate('MMM yyyy')}: {valueY}" // the month, as "Jan 2023", and its value
});


// Set data: one value per month, 2022 to 2024
// https://docs.amcharts.com/v5/charts/xy-chart/series/#setting-data
series.data.setAll([
  { date: 1642248000000, value: 29 },
  { date: 1644926400000, value: 19 },
  { date: 1647345600000, value: 28 },
  { date: 1650024000000, value: 34 },
  { date: 1652616000000, value: 52 },
  { date: 1655294400000, value: 55 },
  { date: 1657886400000, value: 69 },
  { date: 1660564800000, value: 71 },
  { date: 1663243200000, value: 63 },
  { date: 1665835200000, value: 53 },
  { date: 1668513600000, value: 53 },
  { date: 1671105600000, value: 37 },
  { date: 1673784000000, value: 31 },
  { date: 1676462400000, value: 27 },
  { date: 1678881600000, value: 35 },
  { date: 1681560000000, value: 49 },
  { date: 1684152000000, value: 51 },
  { date: 1686830400000, value: 59 },
  { date: 1689422400000, value: 76 },
  { date: 1692100800000, value: 73 },
  { date: 1694779200000, value: 72 },
  { date: 1697371200000, value: 72 },
  { date: 1700049600000, value: 53 },
  { date: 1702641600000, value: 45 },
  { date: 1705320000000, value: 37 },
  { date: 1707998400000, value: 43 },
  { date: 1710504000000, value: 44 },
  { date: 1713182400000, value: 54 },
  { date: 1715774400000, value: 61 },
  { date: 1718452800000, value: 75 },
  { date: 1721044800000, value: 80 },
  { date: 1723723200000, value: 77 },
  { date: 1726401600000, value: 81 },
  { date: 1728993600000, value: 73 },
  { date: 1731672000000, value: 61 },
  { date: 1734264000000, value: 57 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
series.appear(1000);
chart.appear(1000, 100);