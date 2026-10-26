import * as am5 from "@amcharts/amcharts5";
import * as am5gantt from "@amcharts/amcharts5/gantt";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create Gantt chart
// https://docs.amcharts.com/v5/charts/gantt/
// with no settings, tasks can be edited with the mouse and durations count days, skipping weekends
const gantt = root.container.children.push(am5gantt.Gantt.new(root, {}));


// Set category data
// https://docs.amcharts.com/v5/charts/gantt/#category-data
// one row per task, top to bottom; the series data below finds its row by id
gantt.yAxis.data.setAll([
  { id: "gantt_0", name: "Idea" },
  { id: "gantt_1", name: "Kick-off" },
  { id: "gantt_2", name: "Planning" },
  { id: "gantt_3", name: "Development" },
  { id: "gantt_4", name: "Testing" },
  { id: "gantt_5", name: "Finalization" },
  { id: "gantt_6", name: "Release" }
]);


// Set series data
// https://docs.amcharts.com/v5/charts/gantt/#series-data
// start is a timestamp in ms and duration a number of working days (0 draws a diamond);
// progress is the share done, 0 to 1; linkTo draws an arrow to the task that follows
gantt.series.data.setAll([
  { id: "gantt_0", start: 1758142800000, duration: 0, progress: 0, linkTo: ["gantt_1"] },
  { id: "gantt_1", start: 1758142800000, duration: 2, progress: 0, linkTo: ["gantt_2"] },
  { id: "gantt_2", start: 1758488400000, duration: 2, progress: 0, linkTo: ["gantt_3"] },
  { id: "gantt_3", start: 1758661200000, duration: 1, progress: 0, linkTo: ["gantt_4"] },
  { id: "gantt_4", start: 1758747600000, duration: 3, progress: 0, linkTo: ["gantt_5"] },
  { id: "gantt_5", start: 1759179600000, duration: 0, progress: 0, linkTo: ["gantt_6"] },
  { id: "gantt_6", start: 1759179600000, duration: 4, progress: 0 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
gantt.appear(1000, 100);