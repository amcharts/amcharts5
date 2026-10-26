import * as am5 from "@amcharts/amcharts5";
import * as am5wc from "@amcharts/amcharts5/wc";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://docs.amcharts.com/v5/getting-started/#root-element
const root = am5.Root.new("chartdiv");


// Set themes
// https://docs.amcharts.com/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Add wrapper container
// https://docs.amcharts.com/v5/charts/word-cloud/#additional-controls
const container = root.container.children.push(am5.Container.new(root, {
  width: am5.percent(100),    // fills the chart div
  height: am5.percent(100),
  layout: root.verticalLayout // the title on top, the cloud below it
}));


// Add chart title
container.children.push(am5.Label.new(root, {
  text: "Most popular languages on Stack Overflow",
  fontSize: 20,            // 20 px, a title size
  x: am5.percent(50),      // centered
  centerX: am5.percent(50)
}));


// Add series
// Angles are taken in turn, not at random, so the cloud is the same on every load
// https://docs.amcharts.com/v5/charts/word-cloud/#setting-words
const series = container.children.push(am5wc.WordCloud.new(root, {
  categoryField: "tag",
  valueField: "weight",
  calculateAggregates: true, // works out the lowest and highest weight for the heat rule
  angles: [0, 0, 0, -90],    // three words in four level, every fourth on its side
  randomizeAngles: false
}));


// Set up heat rules: they need calculateAggregates on the series
// https://docs.amcharts.com/v5/charts/word-cloud/#via-heat-rules
series.set("heatRules", [{
  target: series.labels.template,
  dataField: "value",
  min: am5.color(0xFFD4C2), // pale orange for the lowest weight...
  max: am5.color(0xFF621F), // ...strong orange for the highest
  key: "fill"
}]);


// Configure labels
// https://docs.amcharts.com/v5/charts/word-cloud/#configuring
series.labels.template.setAll({
  paddingTop: 5,           // 5 px of space kept around each word
  paddingBottom: 5,
  paddingLeft: 5,
  paddingRight: 5,
  fontFamily: "Courier New" // a typewriter-style font, every letter the same width
});


// Set data
// From the Stack Overflow developer survey of 2021
// https://insights.stackoverflow.com/survey/2021#section-most-popular-technologies-programming-scripting-and-markup-languages
// one word per row: the bigger its weight, the bigger the word
series.data.setAll([
  { tag: "JavaScript", weight: 64.96 },
  { tag: "HTML/CSS", weight: 56.07 },
  { tag: "Python", weight: 48.24 },
  { tag: "SQL", weight: 47.08 },
  { tag: "Java", weight: 35.35 },
  { tag: "Node.js", weight: 33.91 },
  { tag: "TypeScript", weight: 30.19 },
  { tag: "C#", weight: 27.86 },
  { tag: "Bash/Shell", weight: 27.13 },
  { tag: "C++", weight: 24.31 },
  { tag: "PHP", weight: 21.98 },
  { tag: "C", weight: 21.01 },
  { tag: "PowerShell", weight: 10.75 },
  { tag: "Go", weight: 9.55 },
  { tag: "Kotlin", weight: 8.32 },
  { tag: "Rust", weight: 7.03 },
  { tag: "Ruby", weight: 6.75 },
  { tag: "Dart", weight: 6.02 },
  { tag: "Assembly", weight: 5.61 },
  { tag: "Swift", weight: 5.1 },
  { tag: "R", weight: 5.07 },
  { tag: "VBA", weight: 4.66 },
  { tag: "Matlab", weight: 4.66 },
  { tag: "Groovy", weight: 3.01 },
  { tag: "Objective-C", weight: 2.8 },
  { tag: "Scala", weight: 2.6 },
  { tag: "Perl", weight: 2.46 },
  { tag: "Haskell", weight: 2.12 },
  { tag: "Delphi", weight: 2.1 },
  { tag: "Clojure", weight: 1.88 },
  { tag: "Elixir", weight: 1.74 },
  { tag: "LISP", weight: 1.33 },
  { tag: "Julia", weight: 1.29 },
  { tag: "F#", weight: 0.97 },
  { tag: "Erlang", weight: 0.79 },
  { tag: "APL", weight: 0.65 },
  { tag: "Crystal", weight: 0.56 },
  { tag: "COBOL", weight: 0.53 }
]);


// Play initial series animation
// https://docs.amcharts.com/v5/concepts/animations/#animation-of-series
series.appear(1000, 100);