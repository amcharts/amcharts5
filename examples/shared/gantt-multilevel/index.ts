import * as am5 from "@amcharts/amcharts5";
import * as am5gantt from "@amcharts/amcharts5/gantt";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5plugins_colorPicker from "@amcharts/amcharts5/plugins/colorPicker";

// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");

// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);

// Create Gantt chart
// https://www.amcharts.com/docs/v5/charts/gantt/
const gantt = root.container.children.push(am5gantt.Gantt.new(root, {}));

gantt.yAxis.setAll({
  maxCellHeight: 70
});

// Set category data
// https://www.amcharts.com/docs/v5/charts/gantt/#Category_data
gantt.yAxis.data.setAll([{
  name: "Idea",
  id: "gantt_0"
}, {
  name: "Preparation",
  id: "gantt_1"
}, {
  name: "Kick-off",
  id: "gantt_2",
  parentId: "gantt_1"
}, {
  name: "Planning",
  id: "gantt_3",
  parentId: "gantt_1"
}, {
  name: "Implementation",
  id: "gantt_4"
}, {
  name: "Setup",
  id: "gantt_5",
  parentId: "gantt_4"
}, {
  name: "Development",
  id: "gantt_6",
  parentId: "gantt_4"
}, {
  name: "Finalization",
  id: "gantt_7",
  parentId: "gantt_4"
}, {
  name: "Release",
  id: "gantt_8"
}]);

// Set series data
// https://www.amcharts.com/docs/v5/charts/gantt/#Series_data
gantt.series.data.setAll([{
  start: 1758142800000,
  duration: 0,
  progress: 0,
  id: "gantt_0",
  linkTo: ["gantt_1"]
}, {
  start: 1758142800000,
  id: "gantt_1"
}, {
  start: 1758142800000,
  duration: 2,
  progress: 0,
  id: "gantt_2",
  linkTo: ["gantt_3"]
}, {
  start: 1758488400000,
  duration: 2,
  progress: 0,
  id: "gantt_3",
  linkTo: ["gantt_4"]
}, {
  start: 1758661200000,
  id: "gantt_4"
}, {
  start: 1758661200000,
  duration: 1,
  progress: 0,
  id: "gantt_5",
  linkTo: ["gantt_6"]
}, {
  start: 1758747600000,
  duration: 3,
  progress: 0,
  id: "gantt_6",
  linkTo: ["gantt_7"]
}, {
  start: 1759179600000,
  duration: 1,
  progress: 0,
  id: "gantt_7",
  linkTo: ["gantt_8"]
}, {
  start: 1759179600000,
  duration: 0,
  progress: 0,
  id: "gantt_8"
}]);

gantt.appear();