# Gantt Chart

> **As a JSON config:** see `references/json.md`. The settings below go into each object's `"settings"` there.

Docs: https://www.amcharts.com/docs/v5/charts/gantt/

Gantt is a standalone chart class (not just a simulated XY chart). It auto-creates axes, series, and toolbar — you only provide data. It supports editable tasks, task linking, progress tracking, collapsible groups, weekends/holidays, and a color picker.

## Imports

### ES modules / TypeScript
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5gantt from "@amcharts/amcharts5/gantt";
import am5plugins_colorPicker from "@amcharts/amcharts5/plugins/colorPicker";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN / script tags
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
<script src="https://cdn.amcharts.com/lib/5/plugins/colorPicker.js"></script>
<script src="https://cdn.amcharts.com/lib/5/gantt.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Core setup

```js
var root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

var chart = root.container.children.push(
  am5gantt.Gantt.new(root, {
    editable: true,
    durationUnit: "day"
  })
);
```

**Important:** Gantt auto-creates axes (`chart.xAxis`, `chart.xAxisMinor`, `chart.yAxis`) and series (`chart.series`). Do NOT create them manually.

## Chart settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `editable` | boolean | `true` | Allow user to add, edit, remove, drag tasks |
| `durationUnit` | string | `"day"` | `"year"`, `"month"`, `"week"`, `"day"`, `"hour"`, `"minute"`, `"second"` |
| `weekends` | number[] | `[0, 6]` | Non-working days (0=Sun, 1=Mon, ... 6=Sat) |
| `excludeWeekends` | boolean | `true` | Skips `weekends` and `holidays`: task starts move to the next working day and durations count working days only. Set `false` to count every day |
| `holidays` | Date[] | `[]` | Specific non-working dates |
| `snapThreshold` | number | `0.5` | Drag snap position within a period (0–1) |
| `sidebarWidth` | number \| Percent | `30%` | Sidebar width in pixels or Percent |

## Data structure

**CRITICAL:** Data is set in TWO separate calls — category data on the Y axis, and task data on the series:

```js
// 1. Category data > chart.yAxis.data.setAll()
//    Flat array with parentId for hierarchy (NOT nested children)
chart.yAxis.data.setAll([
  { id: "design", name: "Design Phase", color: am5.color(0x297373) },
  { id: "wireframes", name: "Wireframes", parentId: "design" },
  { id: "mockups", name: "Mockups", parentId: "design" },
  { id: "dev", name: "Development", color: am5.color(0xffc857) },
  { id: "frontend", name: "Frontend", parentId: "dev" },
  { id: "backend", name: "Backend", parentId: "dev" }
]);

// 2. Task/series data > chart.series.data.setAll()
//    Each item's id must match a category id from above
chart.series.data.setAll([
  { id: "design", start: new Date(2024, 0, 1).getTime(), duration: 10, progress: 100 },
  { id: "wireframes", start: new Date(2024, 0, 1).getTime(), duration: 4, progress: 100 },
  { id: "mockups", start: new Date(2024, 0, 7).getTime(), duration: 6, progress: 100 },
  { id: "dev", start: new Date(2024, 0, 15).getTime(), duration: 20, progress: 60 },
  { id: "frontend", start: new Date(2024, 0, 15).getTime(), duration: 15, progress: 80 },
  { id: "backend", start: new Date(2024, 0, 20).getTime(), duration: 15, progress: 40 }
]);
```

### Category data fields (yAxis)

| Field | Default Key | Description |
|-------|------------|-------------|
| `idField` | `"id"` | Unique category identifier |
| `nameField` | `"name"` | Display name in sidebar |
| `parentIdField` | `"parentId"` | Parent category id for hierarchy |
| `collapsedField` | `"collapsed"` | Whether group starts collapsed |
| `colorField` | `"color"` | Task bar color |

Customize field names:
```js
chart.yAxis.setAll({
  nameField: "task",
  colorField: "barColor",
  collapsedField: "closed"
});
```

`nameField` and `colorField` are fully honored since 5.21.0. Before, bar colors were always read from (and color-picker changes written to) `color` whatever `colorField` said — on older versions keep the field named `color`.

### Series data fields

| Field | Default Key | Description |
|-------|------------|-------------|
| `idField` | `"id"` | Must match a category id |
| `openValueXField` | `"start"` | Start timestamp (ms) |
| `durationField` | `"duration"` | Duration in durationUnits |
| `progressField` | `"progress"` | 0–100 completion |
| `linkToField` | `"linkTo"` | Array of ids to link to |

Customize field names:
```js
chart.series.setAll({
  durationField: "days",
  progressField: "completion"
});
```

### Task linking (dependencies)

```js
chart.series.data.setAll([
  { id: "task1", start: timestamp, duration: 5, progress: 100, linkTo: ["task2"] },
  { id: "task2", start: timestamp, duration: 3, progress: 0 }
]);
```

### Zero-duration tasks (milestones)

Set `duration: 0` to create milestone markers.

## Y-axis configuration (categories)

```js
chart.yAxis.setAll({
  minCellHeight: 80,    // row height in pixels (default: 70)
  childCellSize: 1,     // child row size relative to parent (default: 0.8, 1 = same)
  childShift: 0         // child label indent in pixels (default: 25)
});
```

## X-axis (timeline)

Access: `chart.xAxis` (primary) and `chart.xAxisMinor` (secondary).

```js
// Hide the secondary axis
chart.xAxisMinor.hide();
```

## Weekend & holiday configuration

```js
var chart = root.container.children.push(
  am5gantt.Gantt.new(root, {
    durationUnit: "day",
    weekends: [0, 5, 6],
    excludeWeekends: true,
    holidays: [
      new Date(2025, 0, 1),
      new Date(2025, 6, 4),
      new Date(2025, 10, 27)
    ]
  })
);
```

## Read-only mode

```js
am5gantt.Gantt.new(root, {
  editable: false
})
```

## Control buttons

| Property | Description |
|----------|-------------|
| `chart.addButton` | Add new task |
| `chart.colorPickerButton` | Invoke color picker |
| `chart.expandButton` | Expand all categories |
| `chart.collapseButton` | Collapse all categories |
| `chart.linkButton` | Toggle auto-linking |
| `chart.clearButton` | Delete all data (with confirmation) |
| `chart.editButton` | Toggle edit/read-only (hidden by default) |
| `chart.zoomOutButton` | Zoom to full width |
| `chart.fitButton` | Fit tasks to view |
| `chart.controls` | Container holding all controls |

```js
// Hide specific buttons
chart.colorPickerButton.hide(0);
chart.clearButton.hide(0);

// Hide ALL controls
chart.controls.hide(0);

// Show edit toggle
chart.editButton.show(0);
```

**Keyboard (5.21.0):** tasks with subtasks expose `aria-expanded` (`ariaExpanded`), the expand/collapse button of a task without subtasks is no longer a TAB stop, toolbar and task buttons have screen-reader names, scrollbar grips include the category in their name, and an `EditableLabel` (task names) no longer stops ENTER working elsewhere on the page.

## Series customization

```js
chart.series.columns.template.setAll({
  strokeWidth: 2,
  height: am5.percent(90)
});

chart.series.columns.template.adapters.add("stroke", function() {
  return am5.color(0x000000);
});
```

## Color customization

```js
// Set custom color palette
chart.get("colors").set("colors", [
  am5.color(0x095256),
  am5.color(0x087f8c),
  am5.color(0x5aaa95),
  am5.color(0x86a873),
  am5.color(0xbb9f06)
]);

// Single color for all tasks
chart.get("colors").setAll({
  colors: [am5.color(0x095256)],
  step: 0
});
```

## Events and serialization

```js
// Listen for data changes
chart.events.on("valueschanged", function(ev) {
  console.log("Data changed");
});

// Debounced version
chart.events.onDebounced("valueschanged", function(ev) {
  // Fires once after 500ms of last change
}, 500);

// Serialize data for saving
var ganttData = {
  axis: chart.yAxis.data.values,
  series: chart.series.data.values
};
var serialized = JSON.stringify(ganttData);

// Restore saved data
var restored = JSON.parse(serialized);
chart.yAxis.data.setAll(restored.axis);
chart.series.data.setAll(restored.series);
```

---

## Example 1: Full Gantt chart with am5gantt.Gantt

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Gantt Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/gantt.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/plugins/colorPicker.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    #chartdiv { width: 100%; height: 500px; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(
      am5gantt.Gantt.new(root, {
        editable: true,
        durationUnit: "day",
        weekends: [0, 6],
        excludeWeekends: true
      })
    );

    // Category data (yAxis) — flat with parentId for hierarchy
    chart.yAxis.data.setAll([
      { id: "planning", name: "Planning", color: am5.color(0x297373) },
      { id: "requirements", name: "Requirements", parentId: "planning" },
      { id: "architecture", name: "Architecture", parentId: "planning" },
      { id: "design", name: "Design", color: am5.color(0xe9724c) },
      { id: "wireframes", name: "Wireframes", parentId: "design" },
      { id: "visual", name: "Visual Design", parentId: "design" },
      { id: "dev", name: "Development", color: am5.color(0xffc857) },
      { id: "frontend", name: "Frontend", parentId: "dev" },
      { id: "backend", name: "Backend API", parentId: "dev" },
      { id: "integration", name: "Integration", parentId: "dev" },
      { id: "launch", name: "Launch" }
    ]);

    // Task data (series) — ids must match category ids
    chart.series.data.setAll([
      { id: "planning", start: new Date(2024, 0, 1).getTime(), duration: 5, progress: 100 },
      { id: "requirements", start: new Date(2024, 0, 1).getTime(), duration: 3, progress: 100 },
      { id: "architecture", start: new Date(2024, 0, 4).getTime(), duration: 2, progress: 100, linkTo: ["design"] },
      { id: "design", start: new Date(2024, 0, 8).getTime(), duration: 10, progress: 80 },
      { id: "wireframes", start: new Date(2024, 0, 8).getTime(), duration: 4, progress: 100 },
      { id: "visual", start: new Date(2024, 0, 14).getTime(), duration: 6, progress: 60, linkTo: ["dev"] },
      { id: "dev", start: new Date(2024, 0, 22).getTime(), duration: 25, progress: 40 },
      { id: "frontend", start: new Date(2024, 0, 22).getTime(), duration: 20, progress: 50 },
      { id: "backend", start: new Date(2024, 0, 22).getTime(), duration: 18, progress: 45 },
      { id: "integration", start: new Date(2024, 1, 15).getTime(), duration: 7, progress: 10, linkTo: ["launch"] },
      { id: "launch", start: new Date(2024, 2, 1).getTime(), duration: 0, progress: 0 }
    ]);

    chart.appear(1000, 100);
  </script>
</body>
</html>
```

## Example 2: Simulated Gantt with XY chart (no Gantt license needed)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Simulated Gantt (XY)</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    #chartdiv { width: 100%; height: 400px; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      layout: root.verticalLayout
    }));

    var data = [
      { task: "Research",     start: new Date(2024, 0, 1).getTime(),  end: new Date(2024, 0, 12).getTime(), progress: 1 },
      { task: "Design",       start: new Date(2024, 0, 8).getTime(),  end: new Date(2024, 0, 22).getTime(), progress: 1 },
      { task: "Frontend",     start: new Date(2024, 0, 15).getTime(), end: new Date(2024, 1, 10).getTime(), progress: 0.7 },
      { task: "Backend",      start: new Date(2024, 0, 20).getTime(), end: new Date(2024, 1, 15).getTime(), progress: 0.5 },
      { task: "Testing",      start: new Date(2024, 1, 5).getTime(),  end: new Date(2024, 1, 20).getTime(), progress: 0.2 },
      { task: "Deployment",   start: new Date(2024, 1, 18).getTime(), end: new Date(2024, 1, 25).getTime(), progress: 0 }
    ];

    var yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "task",
      renderer: am5xy.AxisRendererY.new(root, { inversed: true, minGridDistance: 20 })
    }));

    var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {})
    }));

    var series = chart.series.push(am5xy.ColumnSeries.new(root, {
      xAxis: xAxis,
      yAxis: yAxis,
      openValueXField: "start",
      valueXField: "end",
      categoryYField: "task",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{task}\n{openValueX.formatDate('MMM dd')} – {valueX.formatDate('MMM dd')}"
      })
    }));

    series.columns.template.setAll({
      height: am5.percent(60),
      cornerRadiusBR: 4, cornerRadiusTR: 4,
      cornerRadiusBL: 4, cornerRadiusTL: 4,
      strokeOpacity: 0
    });

    series.columns.template.adapters.add("fill", function(fill, target) {
      var p = target.dataItem.dataContext.progress;
      if (p >= 1) return am5.color(0x4caf50);
      if (p > 0)  return am5.color(0xff9800);
      return am5.color(0x2196f3);
    });

    yAxis.data.setAll(data);
    series.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);
  </script>
</body>
</html>
```
