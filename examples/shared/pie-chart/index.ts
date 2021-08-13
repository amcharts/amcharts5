import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

root.setThemes([
    am5themes_Animated.new(root)
]);

const chart = root.container.children.push(am5percent.PieChart.new(root, { layout: root.verticalLayout }));

const series = chart.series.push(am5percent.PieSeries.new(root, {
    valueField: "value",
    categoryField: "category"
}));

series.data.setAll([
    { value: 10, category: "One" },
    { value: 9, category: "Two" },
    { value: 6, category: "Three" },
    { value: 5, category: "Four" },
    { value: 4, category: "Five" },
    { value: 3, category: "Six" },
    { value: 1, category: "Seven" },
]);

const legend = chart.children.push(am5.Legend.new(root, {
    centerX: am5.percent(50),
    x: am5.percent(50),
    marginTop: 15,
    marginBottom: 15,
}));

legend.data.setAll(series.dataItems);
