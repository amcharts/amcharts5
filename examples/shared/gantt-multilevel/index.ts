import * as am5 from "@amcharts/amcharts5";
import * as am5gantt from "@amcharts/amcharts5/gantt";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_ResponsiveMax from "@amcharts/amcharts5/themes/ResponsiveMax";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root),
  am5themes_ResponsiveMax.new(root) // fits small screens: a narrow chart drops some toolbar buttons, a narrow or short one its scrollbars (drag it instead)
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


// Accessibility: keyboard and screen reader support
// https://docs.amcharts.com/v5/concepts/accessibility/
gantt.setAll({
  focusable: true, // Tab reaches the chart, and a screen reader names it
  ariaLabel: "Gantt chart of a project's tasks and subtasks from September 18 to early October 2025. Tab to the tasks, then move between them with the up and down arrow keys. Left and right arrow keys move a task"
});
// the tasks, bars and milestone diamonds: one Tab stop; up and down arrow keys step through them, left and right move them
// (sliders while the chart is editable, which read their dates as the value, so the names leave them out)
gantt.series.columns.template.setAll({
  focusable: true,
  focusableGroup: "tasks",
  hoverOnFocus: true, // a focused task shows its tooltip
  ariaLabel: "{name}, {progress.formatNumber('#.%')} done"
});
gantt.series.zeroRectangles.template.setAll({
  focusable: true,
  focusableGroup: "tasks",
  hoverOnFocus: true,
  ariaLabel: "{name}, milestone"
});


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
gantt.appear(1000, 100);