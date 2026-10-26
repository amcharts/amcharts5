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
const gantt = root.container.children.push(am5gantt.Gantt.new(root, {}));


// Tasks and marked dates shown until the user changes something
const defaults = {
  categoryData: [
    { id: "gantt_0", name: "Start" },
    { id: "gantt_1", name: "Design" },
    { id: "gantt_2", name: "Review", parentId: "gantt_1" },
    { id: "gantt_3", name: "User tests", parentId: "gantt_1" },
    { id: "gantt_4", name: "Programming" },
    { id: "gantt_5", name: "Task delegation", parentId: "gantt_4" },
    { id: "gantt_6", name: "Coding", parentId: "gantt_4" },
    { id: "gantt_7", name: "Deploying", parentId: "gantt_4" },
    { id: "gantt_8", name: "End" }
  ],
  seriesData: [
    { id: "gantt_0", start: 1758229200000, duration: 0, progress: 0, linkTo: ["gantt_1"] },
    { id: "gantt_1", linkTo: ["gantt_4"] },
    { id: "gantt_2", start: 1758488400000, duration: 1, progress: 1, linkTo: ["gantt_3"] },
    { id: "gantt_3", start: 1758574800000, duration: 1, progress: 1 },
    { id: "gantt_4", linkTo: ["gantt_8"] },
    { id: "gantt_5", start: 1758747600000, duration: 1, progress: 1, linkTo: ["gantt_6"] },
    { id: "gantt_6", start: 1758834000000, duration: 2, progress: 0.5, linkTo: ["gantt_7"] },
    { id: "gantt_7", start: 1759179600000, duration: 2, progress: 0 },
    { id: "gantt_8", start: 1759438800000, duration: 0, progress: 0 }
  ],
  markedDates: [1758661200000, 1759352400000] // timestamps of the dates marked with a dashed line
};


// Load what was saved on an earlier visit
const storageKey = "am5-gantt-save-state";          // the localStorage entry that holds this chart's state
const saved = localStorage.getItem(storageKey);
const state = saved ? JSON.parse(saved) : defaults; // nothing saved yet: start from the defaults


// Mark dates
// each one draws a dashed line down the chart at that date
am5.array.each(state.markedDates, (date: number) => {
  gantt.markDate(date);
});


// Set data
// https://docs.amcharts.com/v5/charts/gantt/#category-data
// https://docs.amcharts.com/v5/charts/gantt/#series-data
gantt.yAxis.data.setAll(state.categoryData);
gantt.series.data.setAll(state.seriesData);


// Save tasks and marked dates to local storage
const saveState = () => {
  localStorage.setItem(storageKey, JSON.stringify({
    categoryData: gantt.yAxis.data.values, // the task rows, with any the user added or renamed
    seriesData: gantt.series.data.values,  // the bars, with their dates, progress and links as edited
    // a marked date is an axis range on the minor date axis: keep its date
    markedDates: gantt.xAxisMinor.axisRanges.values.map((range) => {
      return range.get("value");
    })
  }));
};


// Save when a task is edited, and when a date is marked or unmarked
gantt.events.onDebounced("valueschanged", saveState, 500); // once edits pause for 500 ms
gantt.events.on("datemarked", saveState);
gantt.events.on("dateunmarked", saveState);


// Make stuff animate on load
// https://docs.amcharts.com/v5/concepts/animations/#forcing-appearance-animation
gantt.appear(1000, 100);