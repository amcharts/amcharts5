import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

let id = 0;

function createDiv() {
  id++;
  let div = document.getElementById("chartdiv");
  let container = document.createElement("div");
  container.id = "chart" + id;
  container.style.width = "300px";
  container.style.height = "300px";
  container.style.float = "left";
  container.style.margin = "10px";
  container.style.border = "1px solid #eee";
  div.appendChild(container);
  return container;
}


function createXY(column: boolean = true) {
  let root = am5.Root.new(createDiv());

  root.setThemes([
    am5themes_Animated.new(root)
  ]);

  let chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX"
    })
  );

  let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
    behavior: "zoomX"
  }));
  cursor.lineY.set("visible", false);

  let date = new Date();
  date.setHours(0, 0, 0, 0);
  let value = 100;

  function generateData() {
    value = Math.round((Math.random() * 10 - 5) + value);
    am5.time.add(date, "day", 1);
    return { date: date.getTime(), value: value };
  }

  function generateDatas(count) {
    let data = [];
    for (let i = 0; i < count; ++i) {
      data.push(generateData());
    }
    return data;
  }

  let xAxis = chart.xAxes.push(
    am5xy.DateAxis.new(root, {
      maxDeviation: 0,
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 30
      })
    })
  );

  xAxis.get("periodChangeDateFormats")["day"] = "MMM";
  xAxis.get("dateFormats")["day"] = "dd";

  let yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    })
  );

  xAxis.set("tooltip", am5.Tooltip.new(root, {}))

  let series;

  if (column) {
    series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Series",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        valueXField: "date"
      })
    );
  }
  else {
    series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Series",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        valueXField: "date"
      })
    );

    series.strokes.template.setAll({
      strokeWidth: 2
    });
  }

  let tooltip = series.set("tooltip", am5.Tooltip.new(root, {}));
  tooltip.label.set("text", "{valueY}");

  let data = generateDatas(30);
  series.data.setAll(data);

  series.appear();
  chart.appear();
}

function createPie() {
  let root = am5.Root.new(createDiv());

  root.setThemes([
    am5themes_Animated.new(root)
  ]);

  let chart = root.container.children.push(
    am5percent.PieChart.new(root, {
      layout: root.verticalLayout,
      innerRadius: am5.percent(50)
    })
  );

  let series = chart.series.push(am5percent.PieSeries.new(root, {
    valueField: "value",
    categoryField: "category",
    alignLabels: false
  }));

  series.labels.template.setAll({
    forceHidden: true
  });

  series.ticks.template.setAll({
    forceHidden: true
  });

  series.data.setAll([
    { value: 10, category: "One" },
    { value: 9, category: "Two" },
    { value: 6, category: "Three" },
    { value: 5, category: "Four" },
    { value: 4, category: "Five" },
    { value: 3, category: "Six" },
    { value: 1, category: "Seven" },
  ]);

}

for (let i = 0; i < 10; i++) {
  createXY(true);
  createPie();
  createXY(false);
  createPie();
}