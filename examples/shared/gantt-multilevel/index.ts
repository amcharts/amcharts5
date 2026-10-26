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


// Set category data: parentId puts a task under another one
// https://docs.amcharts.com/v5/charts/gantt/#category-data
gantt.yAxis.data.setAll([
  { id: "kickoff", name: "Kick-off" },
  { id: "design", name: "Design" },
  { id: "wireframes", name: "Wireframes", parentId: "design" },
  { id: "visuals", name: "Visual design", parentId: "design" },
  { id: "development", name: "Development" },
  { id: "frontend", name: "Front end", parentId: "development" },
  { id: "backend", name: "Back end", parentId: "development" },
  { id: "testing", name: "Testing", parentId: "development" },
  { id: "launch", name: "Launch" }
]);


// Set series data: a parent task takes its dates from its subtasks
// https://docs.amcharts.com/v5/charts/gantt/#series-data
// start is a timestamp in ms and duration a number of working days (0 draws a diamond);
// progress is the share done, 0 to 1; linkTo draws an arrow to the task that follows
gantt.series.data.setAll([
  { id: "kickoff", start: 1758142800000, duration: 0, progress: 1, linkTo: ["design"] },
  { id: "design", linkTo: ["development"] },
  { id: "wireframes", start: 1758142800000, duration: 2, progress: 1, linkTo: ["visuals"] },
  { id: "visuals", start: 1758488400000, duration: 4, progress: 0.75 },
  { id: "development", linkTo: ["launch"] },
  { id: "frontend", start: 1758834000000, duration: 4, progress: 0.2, linkTo: ["testing"] },
  { id: "backend", start: 1758834000000, duration: 3, progress: 0, linkTo: ["testing"] },
  { id: "testing", start: 1759352400000, duration: 2, progress: 0 },
  { id: "launch", start: 1759698000000, duration: 0, progress: 0 }
]);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
gantt.appear(1000, 100);