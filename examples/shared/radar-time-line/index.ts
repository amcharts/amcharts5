import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import data from "./data.json";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");


// Set themes: the custom one makes labels smaller and the grid fainter
// https://www.amcharts.com/docs/v5/concepts/themes/
const myTheme = am5.Theme.new(root);
myTheme.rule("Label").set("fontSize", 10);
myTheme.rule("Grid").set("strokeOpacity", 0.06);

root.setThemes([
  am5themes_Animated.new(root),
  myTheme
]);

// Set number format: positive, negative and zero values
// https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/
root.numberFormatter.set("numberFormat", "+#.0°C|#.0°C|0.0°C");


// A row of the data has one value per year in "values", the first for startYear
const startYear = 1973;
const endYear = 2016;
let currentYear = 1995;

// Colors of the lowest and the highest value
const minColor = am5.color(0x673ab7);
const maxColor = am5.color(0xf44336);


// Create chart
// https://www.amcharts.com/docs/v5/charts/radar-chart/
const chart = root.container.children.push(am5radar.RadarChart.new(root, {
  panX: false,                  // dragging does not pan: the cursor uses the drag to zoom
  panY: false,
  wheelX: "panX",               // a sideways wheel or trackpad swipe moves along the countries...
  wheelY: "zoomX",              // ...and the vertical wheel zooms in on them
  innerRadius: am5.percent(40), // a hole in the middle for the year label
  radius: am5.percent(65),      // smaller than the default 80%, leaving room for the country names
  startAngle: 270 - 170,        // 170 degrees either side of the top (270)...
  endAngle: 270 + 170           // ...so a gap is left at the bottom for the value axis
}));


// Add cursor
// https://www.amcharts.com/docs/v5/charts/radar-chart/#Cursor
const cursor = chart.set("cursor", am5radar.RadarCursor.new(root, {
  behavior: "zoomX",       // drag around the circle to zoom in on those countries
  radius: am5.percent(40), // the cursor works only in a ring that ends at the plot's inner edge...
  innerRadius: -25         // ...and is 25 px wide
}));
cursor.lineY.set("visible", false); // no circle at the pointer, only the spoke


// Create axes and their renderers
// https://www.amcharts.com/docs/v5/charts/radar-chart/#Adding_axes
const xRenderer = am5radar.AxisRendererCircular.new(root, {
  minGridDistance: 10,   // labels may be 10 px apart (default 100), so most countries get one
  minorGridEnabled: true // fainter grid lines for the countries whose label is skipped
});

xRenderer.labels.template.setAll({
  radius: 10,          // 10 px outside the circle
  textType: "radial",  // the country names point outward, like spokes
  centerY: am5.p50     // each name centered on its column
});

const yRenderer = am5radar.AxisRendererRadial.new(root, {
  axisAngle: 90 // the value axis runs straight down, through the gap at the bottom
});

yRenderer.labels.template.setAll({
  centerX: am5.p50 // the value labels centered on the axis line
});

const categoryAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  maxDeviation: 0, // no scrolling past the first or last country
  categoryField: "country",
  renderer: xRenderer
}));

const valueAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  min: -3,       // a fixed scale, so the columns compare from year to year...
  max: 6,        // ...instead of the axis changing with each year's values
  extraMax: 0.1, // 10% more room above 6, so the tallest columns don't reach the edge
  renderer: yRenderer
}));


// Create series
// https://www.amcharts.com/docs/v5/charts/radar-chart/#Adding_series
const series = chart.series.push(am5radar.RadarColumnSeries.new(root, {
  calculateAggregates: true, // works out the lowest and highest value, which the heat rule needs
  name: "Series",
  xAxis: categoryAxis,
  yAxis: valueAxis,
  valueYField: "value",
  categoryXField: "country",
  tooltip: am5.Tooltip.new(root, {
    labelText: "{categoryX}: {valueY}" // the value uses the number format set above
  })
}));

series.columns.template.set("strokeOpacity", 0); // no outlines on the columns

// Set up heat rules
// https://www.amcharts.com/docs/v5/concepts/settings/heat-rules/
series.set("heatRules", [{
  target: series.columns.template,
  key: "fill",
  min: minColor,
  max: maxColor,
  dataField: "valueY"
}]);


// Add year label
// the radar container's 0, 0 is the center of the circle
const yearLabel = chart.radarContainer.children.push(am5.Label.new(root, {
  fontSize: "2em",
  text: currentYear.toString(),
  centerX: am5.p50, // centered on that point, in the hole
  centerY: am5.p50,
  fill: minColor
}));


// Set data: the series starts with the values of the current year
// https://www.amcharts.com/docs/v5/charts/radar-chart/#Setting_data
const yearData = am5.array.map(data, (row) => {
  return {
    country: row.country,
    value: row.values[currentYear - startYear]
  };
});

series.data.setAll(yearData);
categoryAxis.data.setAll(yearData);


// Find the continents, in the order they come in the data
const continents: Array<string> = [];

am5.array.each(data, (row) => {
  if (continents.indexOf(row.continent) == -1) {
    continents.push(row.continent);
  }
});

// Create an axis range for each continent, from its first country to its last
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-ranges/
const colors = am5.ColorSet.new(root, {});

am5.array.each(continents, (continent, index) => {
  const countries = data.filter((row) => {
    return row.continent == continent;
  });
  const first = countries[0].country;
  const last = countries[countries.length - 1].country;

  const axisRange = categoryAxis.createAxisRange(categoryAxis.makeDataItem({
    category: first,
    endCategory: last
  }));

  // Every third color of the set, for more contrast
  const axisFill = axisRange.get("axisFill") as am5.Slice;
  axisFill.setAll({
    toggleKey: "active",        // each click switches it between active and not, read below
    cursorOverStyle: "pointer", // a hand cursor shows it can be clicked
    fill: colors.getIndex(index * 3),
    visible: true,              // axis fills are hidden by default
    innerRadius: -25            // a 25 px band along the outer edge of the circle
  });

  const label = axisRange.get("label") as am5xy.AxisLabelRadial;
  label.setAll({
    text: continent.toUpperCase(),
    fill: root.interfaceColors.get("background"), // the background color, to stand out on the band
    textType: "circular",                         // curved along the band
    radius: -16                                   // 16 px inside the outer edge, within the band
  });

  // no grid line where a continent starts
  const grid = axisRange.get("grid");
  if (grid) {
    grid.set("visible", false);
  }

  // Zoom to the continent on click, and back out on the next click
  axisFill.events.on("click", () => {
    if (axisFill.get("active")) {
      categoryAxis.zoom(0, 1);
    }
    else {
      categoryAxis.zoomToCategories(first, last);
    }
  });
});


// Create controls: a play button and a slider that sets the year
// https://www.amcharts.com/docs/v5/concepts/common-elements/containers/
const container = chart.children.push(am5.Container.new(root, {
  y: am5.p100,                  // at the bottom of the chart...
  centerY: am5.p100,
  centerX: am5.p50,             // ...and centered across it
  x: am5.p50,
  width: am5.percent(80),
  layout: root.horizontalLayout // the button and the slider side by side
}));

const playButton = container.children.push(am5.Button.new(root, {
  themeTags: ["play"], // a round toggle button: a play triangle, pause bars while playing
  centerY: am5.p50,
  marginRight: 15,
  icon: am5.Graphics.new(root, {
    themeTags: ["icon"] // the theme draws the icon
  })
}));

const slider = container.children.push(am5.Slider.new(root, {
  orientation: "horizontal",
  start: 0.5, // the grip starts halfway, at 1995
  centerY: am5.p50
}));


// Play: animate the slider to its end. Pause: setting a value stops the animation
playButton.events.on("click", () => {
  if (playButton.get("active")) {
    slider.set("start", slider.get("start", 0) + 0.0001);
  }
  else {
    slider.animate({
      key: "start",
      to: 1,
      duration: 15000 * (1 - slider.get("start", 0)) // 15 seconds for the whole range, less from midway
    });
  }
});

// Switch the button back when the slider reaches the end
slider.on("start", (start) => {
  if (start === 1) {
    playButton.set("active", false);
  }
});

// Show the year the slider is at
slider.events.on("rangechanged", () => {
  showYear(startYear + Math.round(slider.get("start", 0) * (endYear - startYear)));
});

// Data items are in the order of the data, so they find their rows by index
function showYear(year: number) {
  if (currentYear != year) {
    currentYear = year;
    yearLabel.set("text", year.toString());

    // the timeline: every column takes that year's value, which the slider and play button drive
    am5.array.each(series.dataItems, (dataItem, index) => {
      const value = data[index].values[year - startYear];
      dataItem.set("valueY", value);
      dataItem.animate({ key: "valueYWorking", to: value, duration: 500 }); // grows or shrinks in 0.5 s
    });
  }
}


// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/#Forcing_appearance_animation
series.appear(1000);
chart.appear(1000, 100);