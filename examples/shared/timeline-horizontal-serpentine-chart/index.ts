import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5timeline from "@amcharts/amcharts5/timeline";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create chart
const chart = root.container.children.push(am5timeline.SerpentineChart.new(root, {
  orientation: "horizontal",
  levelCount: 6,
  startLocation: 0.2,
  endLocation: 1,
  wheelY: "zoomX"
}));

chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));

const yRenderer = am5timeline.AxisRendererCurveY.new(root, {
  rotateLabels: true
})

yRenderer.labels.template.setAll({
  centerY: am5.p50,
  centerX: am5.p100,
  fontSize: 11
});

yRenderer.grid.template.set("forceHidden", true);

// Create axes and their renderers
const xRenderer = am5timeline.AxisRendererCurveX.new(root, {
  yRenderer: yRenderer,
  strokeDasharray: [2, 3],
  strokeOpacity: 0.5,
  stroke: am5.color(0x000000)
});

xRenderer.labels.template.setAll({
  centerY: am5.p50,
  fontSize: 11,
  minPosition: 0.01
});

xRenderer.labels.template.setup = function(target) {
  target.set("layer", 30);
  target.set("background", am5.Rectangle.new(root, {
    fill: am5.color(0xffffff),
    fillOpacity: 1
  }));
}

const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
  maxDeviation: 0,
  categoryField: "category",
  renderer: yRenderer
}));

const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  baseInterval: { timeUnit: "day", count: 1 },
  renderer: xRenderer,
  tooltip: am5.Tooltip.new(root, {})
}));

// Data
const colorSet = chart.get("colors");

const data = [{
  "category": "Module #1",
  "start": new Date("2019-01-10").getTime(),
  "end": new Date("2019-01-13").getTime(),
  "color": colorSet.getIndex(0),
  "task": "Gathering requirements"
}, {
  "category": "Module #1",
  "start": new Date("2019-02-05").getTime(),
  "end": new Date("2019-04-18").getTime(),
  "color": colorSet.getIndex(0),
  "task": "Development"
}, {
  "category": "Module #2",
  "start": new Date("2019-01-08").getTime(),
  "end": new Date("2019-01-10").getTime(),
  "color": colorSet.getIndex(5),
  "task": "Gathering requirements"
}, {
  "category": "Module #2",
  "start": new Date("2019-01-12").getTime(),
  "end": new Date("2019-01-15").getTime(),
  "color": colorSet.getIndex(5),
  "task": "Producing specifications"
}, {
  "category": "Module #2",
  "start": new Date("2019-01-16").getTime(),
  "end": new Date("2019-02-05").getTime(),
  "color": colorSet.getIndex(5),
  "task": "Development"
}, {
  "category": "Module #2",
  "start": new Date("2019-02-10").getTime(),
  "end": new Date("2019-02-18").getTime(),
  "color": colorSet.getIndex(5),
  "task": "Testing and QA"
}, {
  "category": ""
}, {
  "category": "Module #3",
  "start": new Date("2019-01-01").getTime(),
  "end": new Date("2019-01-19").getTime(),
  "color": colorSet.getIndex(9),
  "task": "Gathering requirements"
}, {
  "category": "Module #3",
  "start": new Date("2019-02-01").getTime(),
  "end": new Date("2019-02-10").getTime(),
  "color": colorSet.getIndex(9),
  "task": "Producing specifications"
}, {
  "category": "Module #3",
  "start": new Date("2019-03-10").getTime(),
  "end": new Date("2019-04-15").getTime(),
  "color": colorSet.getIndex(9),
  "task": "Development"
}, {
  "category": "Module #3",
  "start": new Date("2019-04-20").getTime(),
  "end": new Date("2019-04-30").getTime(),
  "color": colorSet.getIndex(9),
  "task": "Testing and QA",
  "disabled2": false,
  "image2": "/wp-content/uploads/assets/timeline/rachel.jpg",
  "location": 0
}, {
  "category": "Module #4",
  "start": new Date("2019-01-15").getTime(),
  "end": new Date("2019-02-12").getTime(),
  "color": colorSet.getIndex(15),
  "task": "Gathering requirements",
  "disabled1": false,
  "image1": "/wp-content/uploads/assets/timeline/monica.jpg"
}, {
  "category": "Module #4",
  "start": new Date("2019-02-25").getTime(),
  "end": new Date("2019-03-10").getTime(),
  "color": colorSet.getIndex(15),
  "task": "Development"
}, {
  "category": "Module #4",
  "start": new Date("2019-03-23").getTime(),
  "end": new Date("2019-04-29").getTime(),
  "color": colorSet.getIndex(15),
  "task": "Testing and QA"
}];


// Add series
// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
const series = chart.series.push(am5timeline.CurveColumnSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  baseAxis: yAxis,
  valueXField: "end",
  openValueXField: "start",
  categoryYField: "category",
  layer: 30
}));

series.columns.template.setAll({
  height: am5.percent(10),
  strokeOpacity: 0
})

series.bullets.push(function(root, series, dataItem) {
  const circle = am5.Circle.new(root, {
    radius: 4,
    fill: chart.get("colors").getIndex(series.dataItems.indexOf(dataItem)),
    strokeWidth: 2,
    strokeOpacity: 0.5,
    layer: 30
  });

  return am5.Bullet.new(root, {
    sprite: circle,
    locationX: 0,
    locationY: 0.5
  })
})

series.bullets.push(function(root, series, dataItem) {
  const circle = am5.Circle.new(root, {
    radius: 4,
    fill: chart.get("colors").getIndex(series.dataItems.indexOf(dataItem)),
    strokeWidth: 2,
    strokeOpacity: 0.5,
    layer: 30
  });

  return am5.Bullet.new(root, {
    sprite: circle, locationX: 1
  })
})

series.columns.template.adapters.add("fill", function(fill, target) {
  return chart.get("colors").getIndex(series.dataItems.indexOf(target.dataItem));
})

// line series for flags
const lineSeries = chart.series.push(am5timeline.CurveLineSeries.new(root, {
  xAxis: xAxis, yAxis: yAxis, categoryYField: "category", valueXField: "date"
}));

lineSeries.strokes.template.set("forceHidden", true);

lineSeries.bullets.push(function(root, series, dataItem) {
  const flag = am5.Tooltip.new(root, {
    centerY: 28,
    paddingBottom: 4, paddingLeft: 7, paddingRight: 7, paddingTop: 4, layer: 30
  })

  flag.get("background")?.setAll({
    stroke: am5.color(0x000000), cornerRadius: 0
  })

  flag.label.setAll({
    fill: am5.color(0x000000),
    text: dataItem.dataContext.letter,
    fontSize: "0.8em"
  });

  flag.show();

  return am5.Bullet.new(root, {
    sprite: flag,
    locationX: 0.5, locationY: 0.5
  })
})

lineSeries.data.setAll([{ category: "", eventDate: "2019-01-15", letter: "A", description: "Something happened here" },
{ category: "", date: new Date("2019-01-23").getTime(), letter: "B", description: "Something happened here" },
{ category: "", date: new Date("2019-02-10").getTime(), letter: "C", description: "Something happened here" },
{ category: "", date: new Date("2019-02-29").getTime(), letter: "D", description: "Something happened here" },
{ category: "", date: new Date("2019-03-06").getTime(), letter: "E", description: "Something happened here" },
{ category: "", date: new Date("2019-03-12").getTime(), letter: "F", description: "Something happened here" },
{ category: "", date: new Date("2019-03-22").getTime(), letter: "G", description: "Something happened here" }])


const cursor = chart.set("cursor", am5timeline.CurveCursor.new(root, {
  behavior: "zoomX",
  xAxis: xAxis,
  yAxis: yAxis
}));

series.data.setAll(data);
yAxis.data.setAll([{ category: "Module #1" }, { category: "Module #2" }, { category: "" }, { category: "Module #3" }, { category: "Module #4" }]);

// Animate chart and series in
// https://www.amcharts.com/docs/v5/concepts/animations/#Initial_animation
series.appear(1000);
chart.appear(1000, 100);