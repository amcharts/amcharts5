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
  panX: false,
  panY: false,
  wheelX: "panX",
  wheelY: "zoomX"
}));


// Add cursor
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  behavior: "zoomX"
}));
cursor.lineY.set("visible", false);

// Generate random data
let date = new Date();
date.setHours(0, 0, 0, 0);
let value = 1;

function generateData() {
  value = Math.round((Math.random() * 10 - 5) + value);
  if (date.getDay() == 5) {
    am5.time.add(date, "day", 3);
  } else {
    am5.time.add(date, "day", 1);
  }

  return {
    date: date.getTime(),
    value: value
  };
}

function generateDatas(count: number) {
  const data = [];
  for (let i = 0; i < count; ++i) {
    data.push(generateData());
  }
  return data;
}


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/category-date-axis/
const xRenderer = am5xy.AxisRendererX.new(root, {
  pan:"zoom",
  minorGridEnabled: true
});
xRenderer.labels.template.set("minPosition", 0.01);
xRenderer.labels.template.set("maxPosition", 0.99);

const xAxis = chart.xAxes.push(
  am5xy.GaplessDateAxis.new(root, {
    maxDeviation:0.5,
    baseInterval: {
      timeUnit: "day",
      count: 1
    },
    renderer: xRenderer,
    tooltip: am5.Tooltip.new(root, {})
  })
);

const yAxis = chart.yAxes.push(
  am5xy.ValueAxis.new(root, {
    maxDeviation:1,
    renderer: am5xy.AxisRendererY.new(root, {
      pan:"zoom"
    })
  })
);


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
const series = chart.series.push(am5xy.LineSeries.new(root, {
  name: "Series",
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  valueXField: "date",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{valueY}"
  })
}));


// Add scrollbar
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));


// Set data
let data = generateDatas(200);
series.data.setAll(data);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000);
chart.appear(1000, 100);