import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5plugins_json from "@amcharts/amcharts5/plugins/json";

const root = am5.Root.new("chartdiv");

new am5plugins_json.JsonParser().parse(root, {
  name: "XYChart",
  settings: {
    panX: false,
    panY: false,
    wheelX: "panX",
    wheelY: "zoomX",
  },
  children: [
  ],
}).then((chart) => {
  root.container.children.push(chart);

  // Add cursor
  // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
  const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
    behavior: "zoomX"
  }));
  cursor.lineY.set("visible", false);

  let date = new Date();
  date.setHours(0, 0, 0, 0);
  let value = 100;

  function generateData() {
    value = Math.round((Math.random() * 10 - 5) + value);
    am5.time.add(date, "day", 1);
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
  const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
    maxDeviation: 0,
    baseInterval: {
      timeUnit: "day",
      count: 1
    },
    renderer: am5xy.AxisRendererX.new(root, {}),
    tooltip: am5.Tooltip.new(root, {})
  }));

  const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
    renderer: am5xy.AxisRendererY.new(root, {})
  }));


  // Add series
  // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
  const series = chart.series.push(am5xy.ColumnSeries.new(root, {
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

  let data = generateDatas(50);
  series.data.setAll(data);


  // Make stuff animate on load
  // https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
  series.appear(1000);
  chart.appear(1000, 100);
});
