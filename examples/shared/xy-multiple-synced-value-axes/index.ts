import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

/**
 * ---------------------------------------
 * This demo was created using amCharts 5.
 *
 * For more information visit:
 * https://www.amcharts.com/
 *
 * Documentation is available at:
 * https://www.amcharts.com/docs/v5/
 * ---------------------------------------
 */


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
let root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([am5themes_Animated.new(root)]);


// Set global date format
// https://www.amcharts.com/docs/v5/concepts/formatters/formatting-dates/#Global_date_format
root.dateFormatter.setAll({
  dateFormat: "yyyy",
  dateFields: ["valueX"]
});


// Create chart
// https://www.amcharts.com/docs/v5/charts/xy-chart/
let chart = root.container.children.push(am5xy.XYChart.new(root, {
  focusable: true,
  panX: false,
  panY: false,
  wheelX: "panX",
  wheelY: "zoomX"
}));

let easing = am5.ease.linear;
chart.get("colors").set("step", 3);


// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
let xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
  maxDeviation: 0.1,
  groupData: false,
  baseInterval: {
    timeUnit: "day",
    count: 1
  },
  renderer: am5xy.AxisRendererX.new(root, {
    minorGridEnabled: true
  }),
  tooltip: am5.Tooltip.new(root, {
    animationDuration: 300
  })
}));

function createAxisAndSeries(startValue, opposite) {
  let yRenderer = am5xy.AxisRendererY.new(root, {
    opposite: opposite
  });
  let yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      maxDeviation: 1,
      renderer: yRenderer
    })
  );

  // sync each axis with the first one
  if (chart.yAxes.indexOf(yAxis) > 0) {
    yAxis.set("syncWithAxis", chart.yAxes.getIndex(0));
  }

  // Add series
  // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
  let series = chart.series.push(am5xy.LineSeries.new(root, {
    xAxis: xAxis,
    yAxis: yAxis,
    valueYField: "value",
    valueXField: "date",
    tooltip: am5.Tooltip.new(root, {
      labelText: "{valueY}",
      pointerOrientation: "horizontal"
    })
  }));

  //series.fills.template.setAll({ fillOpacity: 0.2, visible: true });
  series.strokes.template.setAll({ strokeWidth: 1 });

  yRenderer.grid.template.set("strokeOpacity", 0.05);
  yRenderer.labels.template.set("fill", series.get("fill"));
  yRenderer.setAll({
    stroke: series.get("fill"),
    strokeOpacity: 1,
    opacity: 1
  });

  // Set up data processor to parse string dates
  // https://www.amcharts.com/docs/v5/concepts/data/#Pre_processing_data
  series.data.processor = am5.DataProcessor.new(root, {
    dateFormat: "yyyy-MM-dd",
    dateFields: ["date"]
  });

  series.data.setAll(generateChartData(startValue));
}


// Add cursor
// https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
let cursor = chart.set(
  "cursor",
  am5xy.XYCursor.new(root, {
    xAxis: xAxis,
    behavior: "zoomX"
  })
);
cursor.lineY.set("visible", false);


// Add scrollbar
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));

createAxisAndSeries(100, false);
createAxisAndSeries(1000, true);
createAxisAndSeries(8000, true);


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
chart.appear(1000, 100);


// Generate some random data, quite different range
function generateChartData(value) {
  let data = [];
  let firstDate = new Date();
  firstDate.setDate(firstDate.getDate() - 100);
  firstDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 200; i++) {
    let newDate = new Date(firstDate);
    newDate.setDate(newDate.getDate() + i);

    value += Math.round(
      ((Math.random() < 0.5 ? 1 : -1) * Math.random() * value) / 20
    );

    data.push({
      date: newDate,
      value: value
    });
  }
  return data;
}
