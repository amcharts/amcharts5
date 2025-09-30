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

// Default data
let categoryData = [{
  name: "Start",
  id: "gantt_0"
}, {
  name: "Design",
  id: "gantt_1"
}, {
  name: "Review",
  id: "gantt_2",
  parentId: "gantt_1",
}, {
  name: "User tests",
  id: "gantt_3",
  parentId: "gantt_1",
}, {
  name: "Programming",
  id: "gantt_4"
}, {
  name: "Task delegation",
  id: "gantt_5",
  parentId: "gantt_4",
}, {
  name: "Coding",
  id: "gantt_6",
  parentId: "gantt_4",
}, {
  name: "Testing",
  id: "gantt_7",
  parentId: "gantt_4",
}, {
  name: "Deploying",
  id: "gantt_8",
  parentId: "gantt_4",
}, {
  name: "Testing",
  id: "gantt_9"
}, {
  name: "Phase 1",
  id: "gantt_10",
  parentId: "gantt_9",
}, {
  name: "Phase 2",
  id: "gantt_11",
  parentId: "gantt_9",
}, {
  name: "Phase 3",
  id: "gantt_12",
  parentId: "gantt_9",
}, {
  name: "End",
  id: "gantt_15"
}];

let seriesData = [{
  start: 1758229200000,
  duration: 0,
  progress: 0,
  id: "gantt_0",
  linkTo: ["gantt_1"]
}, {
  "category": "gantt_1",
  progress: 0,
  id: "gantt_1",
  linkTo: ["gantt_4"]
}, {
  "category": "gantt_2",
  start: 1758488400000,
  duration: 1,
  progress: 1,
  id: "gantt_2",
  linkTo: ["gantt_3"]
}, {
  "category": "gantt_3",
  start: 1758574800000,
  duration: 1,
  progress: 1,
  id: "gantt_3",
  linkTo: []
}, {
  "category": "gantt_4",
  progress: 0,
  id: "gantt_4",
  linkTo: ["gantt_9"]
}, {
  "category": "gantt_5",
  start: 1758747600000,
  duration: 1,
  progress: 1,
  id: "gantt_5",
  linkTo: ["gantt_6"]
}, {
  "category": "gantt_6",
  start: 1758834000000,
  duration: 2,
  progress: 0.4956235693230202,
  id: "gantt_6",
  linkTo: ["gantt_7"]
}, {
  "category": "gantt_7",
  start: 1759179600000,
  duration: 1,
  progress: 0,
  id: "gantt_7",
  linkTo: ["gantt_8"]
}, {
  "category": "gantt_8",
  start: 1759266000000,
  duration: 2,
  progress: 0,
  id: "gantt_8"
}, {
  "category": "gantt_9",
  progress: 0,
  id: "gantt_9",
  linkTo: ["gantt_15"]
}, {
  "category": "gantt_10",
  start: 1759438800000,
  duration: 1,
  progress: 0,
  id: "gantt_10",
  linkTo: ["gantt_11"]
}, {
  "category": "gantt_11",
  start: 1759698000000,
  duration: 1,
  progress: 0,
  id: "gantt_11",
  linkTo: ["gantt_12"]
}, {
  "category": "gantt_12",
  start: 1759784400000,
  duration: 2,
  progress: 0,
  id: "gantt_12"
}, {
  start: 1760302800000,
  duration: 0,
  progress: 0,
  id: "gantt_15"
}];

let markedDates = [1758661200000, 1759352400000];


// Check if we have user-saved data in local storage
function loadGanttData() {
  if (localStorage.getItem("am_gantt_data")) {
    return JSON.parse(localStorage.getItem("am_gantt_data"));
  }
  return {};
}

function saveGanttData(gantt_data) {
  localStorage.setItem("am_gantt_data", JSON.stringify(gantt_data));
  console.log("Data saved to localStorage");
}

function saveGanttMarkedDates() {
  const gantt_data = loadGanttData();
  gantt_data.markedDates = gantt.xAxisMinor.axisRanges.values.map((range) => {
    return range.get("value");
  });
  saveGanttData(gantt_data);
}

const gantt_data = loadGanttData();

if (gantt_data.categoryData) {
  categoryData = gantt_data.categoryData;
}
if (gantt_data.seriesData) {
  seriesData = gantt_data.seriesData;
}
if (gantt_data.markedDates) {
  markedDates = gantt_data.markedDates;
}

// Create axis ranges for marked dates
am5.array.each(markedDates, (value) => {
  gantt.markDate(value);
});


// Set data on axis and series
// https://www.amcharts.com/docs/v5/charts/gantt/#Category_data
// https://www.amcharts.com/docs/v5/charts/gantt/#Series_data
gantt.yAxis.data.setAll(categoryData);
gantt.series.data.setAll(seriesData);

// Set up saving of data
gantt.events.onDebounced("valueschanged", (ev) => {
  gantt_data.categoryData = gantt.yAxis.data.values;
  gantt_data.seriesData = gantt.series.data.values;
  saveGanttData(gantt_data);
}, 500);

gantt.events.on("datemarked", (ev) => {
  console.log("Date marked: " + ev.date + " (" + new Date(ev.date) + ") in " + ev.dataItem.get(name));
  saveGanttMarkedDates();
});

gantt.events.on("dateunmarked", (ev) => {
  console.log("Date unmarked: " + ev.date + " (" + new Date(ev.date) + ") in " + ev.dataItem.get(name));
  saveGanttMarkedDates();
});

gantt.appear();