# UI Elements — Buttons, Sliders, Steppers, and More

Docs: https://www.amcharts.com/docs/v5/concepts/common-elements/

amCharts 5 provides built-in interactive UI widgets in the core package. **Prefer these over HTML elements** when building interactive controls, unless the user instructs otherwise.

## Imports

All UI elements are in the core package (`am5`) except ColorPicker.

### CDN / script tags
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<!-- ColorPicker only: -->
<script src="https://cdn.amcharts.com/lib/5/plugins/colorPicker.js"></script>
```

### ES modules
```ts
import * as am5 from "@amcharts/amcharts5";
// ColorPicker only:
import * as am5plugins_colorPicker from "@amcharts/amcharts5/plugins/colorPicker";
```

---

## Button

A clickable button with label, icon, and background. Supports hover, down, and active states.

```js
var button = container.children.push(am5.Button.new(root, {
  label: am5.Label.new(root, {
    text: "Click me",
    fontSize: 14,
    paddingTop: 5,
    paddingRight: 10,
    paddingBottom: 5,
    paddingLeft: 10
  })
}));

button.events.on("click", function(ev) {
  console.log("Button clicked!");
});
```

### Button with icon

```js
var button = container.children.push(am5.Button.new(root, {
  icon: am5.Graphics.new(root, {
    fill: am5.color(0xffffff),
    svgPath: "M11,5 L9,5 L9,9 L5,9 L5,11 L9,11 L9,15 L11,15 L11,11 L15,11 L15,9 L11,9 Z"
  }),
  label: am5.Label.new(root, { text: "Add" })
}));
```

### Button background styling

```js
button.get("background").setAll({
  fill: am5.color(0x297373),
  fillOpacity: 0.9,
  cornerRadiusTL: 5,
  cornerRadiusTR: 5,
  cornerRadiusBR: 5,
  cornerRadiusBL: 5
});

button.get("background").states.create("hover", {
  fill: am5.color(0x3a9a9a)
});

button.get("background").states.create("down", {
  fill: am5.color(0x1a5555)
});
```

### Togglable button

```js
// There is no `togglable` setting on Button. Make it a toggle by setting
// `toggleKey: "active"` (a Sprite setting) — clicks then flip the `active` boolean.
var button = container.children.push(am5.Button.new(root, {
  toggleKey: "active",
  label: am5.Label.new(root, { text: "Toggle" })
}));

// Check active state via the `active` setting (there is no isActive() method)
button.events.on("click", function(ev) {
  var isActive = ev.target.get("active");
  console.log("Active:", isActive);
});
```

---

## Slider

A single-value slider control. Values range from 0 to 1 (relative positions).

```js
var slider = container.children.push(am5.Slider.new(root, {
  orientation: "horizontal",  // or "vertical"
  start: 0.5,                // initial position (0-1)
  width: am5.percent(80),
  centerX: am5.percent(50),
  x: am5.percent(50)
}));

slider.events.on("rangechanged", function(ev) {
  // ev.start = current position (0-1)
  var value = ev.start;
  console.log("Slider value:", value);
});
```

### Converting slider 0-1 to a custom range

```js
// Map 0-1 to 0-100
slider.events.on("rangechanged", function(ev) {
  var mappedValue = Math.round(ev.start * 100);
  label.set("text", mappedValue + "%");
});

// Map 0-1 to 20-200
slider.events.on("rangechanged", function(ev) {
  var min = 20, max = 200;
  var mappedValue = min + ev.start * (max - min);
});
```

### Styling the slider

```js
// Style the thumb (draggable part)
slider.thumb.setAll({
  fill: am5.color(0x297373),
  width: 20,
  height: 20
});

// Style the start grip
slider.startGrip.setAll({
  visible: false  // hide if not needed
});
```

---

## Scrollbar

A two-grip range selector for selecting a range within data.

```js
// Standalone scrollbar
var scrollbar = container.children.push(am5.Scrollbar.new(root, {
  orientation: "horizontal",
  start: 0.2,   // initial range start
  end: 0.8      // initial range end
}));

scrollbar.events.on("rangechanged", function(ev) {
  console.log("Range:", ev.start, "-", ev.end);
});
```

### On XY charts

```js
// Add scrollbar to chart
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal"
}));

// Scrollbar with miniature chart preview
chart.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
  orientation: "horizontal",
  height: 50
}));
```

### Position

`opposite` puts a chart's scrollbar on the other side: a horizontal one below the plot, a vertical one on the left. `outsideAxes` sets whether it sits beyond the axes on that side (`true`) or between them and the plot (`false`); unset, the chart decides. Both can be changed at any time and are saved in JSON.

```js
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal",
  opposite: true,      // below the plot
  outsideAxes: true    // below the X axis labels too
}));
```

### Styling

```js
var scrollbar = chart.get("scrollbarX");
scrollbar.thumb.setAll({ fill: am5.color(0x550000), fillOpacity: 0.1 });
scrollbar.startGrip.set("scale", 0.7);
scrollbar.endGrip.set("scale", 0.7);
```

---

## NumericStepper

An interactive number input with increment/decrement buttons.

```js
var stepper = container.children.push(am5.NumericStepper.new(root, {
  value: 10
}));

// Read value
var val = stepper.get("value");

// Set value programmatically
stepper.set("value", 25);

// Listen for changes
stepper.on("value", function(value) {
  console.log("New value:", value);
});
```

---

## ProgressPie

A circular progress indicator shaped as a pie/donut.

```js
var progress = container.children.push(am5.ProgressPie.new(root, {
  radius: am5.percent(80),
  innerRadius: am5.percent(60),
  value: 65,
  numberFormat: "#'%'"
}));

// Animate value change
progress.animate({
  key: "value",
  to: 100,
  duration: 2000
});

// Customize appearance
progress.slice.setAll({ fill: am5.color(0x297373) });
progress.backgroundSlice.setAll({ fill: am5.color(0xdddddd) });
```

---

## SpriteResizer

Adds drag-to-resize handles to any sprite.

```js
var targetSprite = container.children.push(am5.Graphics.new(root, {
  fill: am5.color(0x297373),
  draw: function(display) {
    display.drawRect(0, 0, 200, 100);
  }
}));

var resizer = container.children.push(am5.SpriteResizer.new(root, {
  sprite: targetSprite
}));
```

---

## EditableLabel

A label that becomes an editable text field when clicked.

```js
var label = container.children.push(am5.EditableLabel.new(root, {
  text: "Click to edit",
  editOn: "click",       // "click" | "dblclick" | "rightclick" | "none"
  multiLine: false,
  fontSize: 16,
  fill: am5.color(0x000000)
}));
```

---

## Modal

An HTML overlay dialog.

```js
var modal = am5.Modal.new(root, {
  content: "<h2>Notice</h2><p>Chart data is loading...</p>"
});

modal.open();

modal.events.on("closed", function() {
  console.log("Modal closed");
});

// Close programmatically
modal.close();
```

---

## ColorPicker

**Requires** `plugins/colorPicker.js` loaded before use.

```js
var picker = container.children.push(
  am5plugins_colorPicker.ColorPicker.new(root, {
    color: am5.color(0xff0000),
    colorOpacity: 1
  })
);

picker.events.on("colorchanged", function(ev) {
  console.log("New color:", ev.color);
  console.log("Opacity:", ev.colorOpacity);
});
```

---

## Layout examples

### Vertical layout — chart with controls below

```js
var outerContainer = root.container.children.push(am5.Container.new(root, {
  width: am5.percent(100),
  height: am5.percent(100),
  layout: root.verticalLayout
}));

// Chart takes most space
var chart = outerContainer.children.push(am5xy.XYChart.new(root, {
  width: am5.percent(100),
  height: am5.percent(80)
}));

// Controls row below
var controlsRow = outerContainer.children.push(am5.Container.new(root, {
  width: am5.percent(100),
  height: am5.percent(20),
  layout: root.horizontalLayout,
  paddingTop: 10
}));

controlsRow.children.push(am5.Slider.new(root, {
  orientation: "horizontal",
  width: am5.percent(60)
}));

controlsRow.children.push(am5.Button.new(root, {
  label: am5.Label.new(root, { text: "Reset" })
}));
```

### Grid layout — dashboard with multiple charts

```js
var grid = root.container.children.push(am5.Container.new(root, {
  width: am5.percent(100),
  height: am5.percent(100),
  layout: am5.GridLayout.new(root, { maxColumns: 2, fixedWidthGrid: true })
}));

// Each child fills one grid cell
var chart1Container = grid.children.push(am5.Container.new(root, {
  width: am5.percent(100),
  height: 300
}));
var chart2Container = grid.children.push(am5.Container.new(root, {
  width: am5.percent(100),
  height: 300
}));
```

### Horizontal layout — legend + chart side by side

```js
var row = root.container.children.push(am5.Container.new(root, {
  width: am5.percent(100),
  height: am5.percent(100),
  layout: root.horizontalLayout
}));

var legend = row.children.push(am5.Legend.new(root, {
  width: 200,
  layout: root.verticalLayout
}));

var chart = row.children.push(am5xy.XYChart.new(root, {
  width: am5.percent(100),
  height: am5.percent(100)
}));
```
