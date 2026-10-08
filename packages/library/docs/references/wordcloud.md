# Word Cloud

Docs: https://www.amcharts.com/docs/v5/charts/word-cloud/

Word Cloud displays words/tags sized by their value/weight. It's a "container-less" chart — the series is pushed directly to `root.container.children` (no wrapper chart object).

## Imports

### ES modules / TypeScript
```ts
import * as am5 from "@amcharts/amcharts5";
import * as am5wc from "@amcharts/amcharts5/wc";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
```

### CDN / script tags
```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/wc.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
```

## Setup

```js
const root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

// WordCloud is pushed directly — no chart wrapper
const series = root.container.children.push(
  am5wc.WordCloud.new(root, {
    categoryField: "tag",
    valueField: "weight",
    maxFontSize: am5.percent(15),   // relative to container
    minFontSize: am5.percent(3),
  })
);

// Data — LAST
series.data.setAll([
  { tag: "JavaScript", weight: 64 },
  { tag: "Python", weight: 48 },
  { tag: "TypeScript", weight: 35 },
  { tag: "Java", weight: 30 },
  { tag: "React", weight: 28 },
  { tag: "Node.js", weight: 22 },
  { tag: "CSS", weight: 18 },
  { tag: "SQL", weight: 15 }
]);

series.appear(1000);
```

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `categoryField` | string | — | Data field for word text (required) |
| `valueField` | string | — | Data field for word weight/size (required) |
| `maxFontSize` | number \| Percent | `100` | Maximum font size (a `Percent` is relative to the smaller chart dimension) |
| `minFontSize` | number \| Percent | `10` | Minimum font size (a `Percent` is relative to the smaller chart dimension) |
| `angles` | number[] | `[0]` | Allowed rotation angles for words |
| `randomness` | number (0–1) | `0` | Layout randomness (0 = ordered by value, 1 = fully random) |
| `minWordLength` | number | `1` | Skip words shorter than this |
| `maxCount` | number | — | Maximum number of words to display |
| `excludeWords` | string[] | `[]` | Words to exclude |
| `text` | string | — | Raw text to parse — words are extracted and weighted by frequency automatically |
| `colors` | ColorSet | — | Color set for words |

### excludeWords example

```js
am5wc.WordCloud.new(root, {
  categoryField: "word",
  valueField: "count",
  excludeWords: ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "is", "it"]
});
```

**Note:** amCharts WordCloud does not support mask/shape rendering (words constrained to a custom shape). Words are arranged in a rectangular area.

## Customizing labels

```js
series.labels.template.setAll({
  fontFamily: "Courier New",
  fontWeight: "bold",
  paddingTop: 5,
  paddingBottom: 5,
  paddingLeft: 5,
  paddingRight: 5,
  tooltipText: "{category}: {value}",
  cursorOverStyle: "pointer"
});
```

## Click events

```js
series.labels.template.events.on("click", function(ev) {
  var dataItem = ev.target.dataItem;
  console.log("Clicked:", dataItem.get("category"), dataItem.get("value"));
});
```

## Custom colors

```js
// From a fixed list
series.set("colors", am5.ColorSet.new(root, {
  colors: [
    am5.color(0x095256),
    am5.color(0x087f8c),
    am5.color(0x5aaa95),
    am5.color(0x86a873),
    am5.color(0xbb9f06)
  ]
}));

// Or use color from data
series.labels.template.adapters.add("fill", function(fill, target) {
  if (target.dataItem) {
    return am5.color(target.dataItem.dataContext.color);
  }
  return fill;
});
```

## Sentence Cloud

Instead of individual words, you can display phrases by using multi-word category values:

```js
series.data.setAll([
  { tag: "Machine Learning", weight: 40 },
  { tag: "Data Science", weight: 35 },
  { tag: "Web Development", weight: 30 }
]);
```

## Changing data dynamically

```js
// Replace all data
series.data.setAll(newData);

// Add items
series.data.push({ tag: "Rust", weight: 20 });

// Remove by index
series.data.removeIndex(0);
```

---

## Example: Interactive word cloud

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Word Cloud</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/wc.js"></script>
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

    var series = root.container.children.push(
      am5wc.WordCloud.new(root, {
        categoryField: "tag",
        valueField: "weight",
        maxFontSize: am5.percent(15),
        minFontSize: am5.percent(3),
        angles: [0, -45, -90],
        randomness: 0.3
      })
    );

    // Custom colors
    series.set("colors", am5.ColorSet.new(root, {
      colors: [
        am5.color(0x264653),
        am5.color(0x2a9d8f),
        am5.color(0xe9c46a),
        am5.color(0xf4a261),
        am5.color(0xe76f51)
      ]
    }));

    // Label styling
    series.labels.template.setAll({
      fontFamily: "Arial",
      tooltipText: "{category}: [bold]{value}[/]",
      cursorOverStyle: "pointer"
    });

    // Click handler
    series.labels.template.events.on("click", function(ev) {
      var category = ev.target.dataItem.get("category");
      alert("You clicked: " + category);
    });

    series.data.setAll([
      { tag: "JavaScript", weight: 64 },
      { tag: "Python", weight: 48 },
      { tag: "TypeScript", weight: 35 },
      { tag: "Java", weight: 30 },
      { tag: "React", weight: 28 },
      { tag: "Angular", weight: 22 },
      { tag: "Vue", weight: 20 },
      { tag: "Node.js", weight: 22 },
      { tag: "CSS", weight: 18 },
      { tag: "SQL", weight: 15 },
      { tag: "Go", weight: 14 },
      { tag: "Rust", weight: 12 },
      { tag: "PHP", weight: 11 },
      { tag: "Swift", weight: 10 },
      { tag: "Kotlin", weight: 9 },
      { tag: "Ruby", weight: 8 },
      { tag: "C#", weight: 25 },
      { tag: "C++", weight: 20 },
      { tag: "Docker", weight: 16 },
      { tag: "Kubernetes", weight: 14 }
    ]);

    series.appear(1000);
  </script>
</body>
</html>
```

## Example 2: Sentence cloud with excludeWords and dynamic update

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sentence Cloud</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/wc.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    #chartdiv { width: 100%; height: 450px; }
    button { margin: 5px; padding: 8px 16px; cursor: pointer; }
  </style>
</head>
<body>
  <div>
    <button onclick="showTech()">Tech Skills</button>
    <button onclick="showBusiness()">Business Skills</button>
  </div>
  <div id="chartdiv"></div>
  <script>
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var series = root.container.children.push(
      am5wc.WordCloud.new(root, {
        categoryField: "phrase",
        valueField: "weight",
        maxFontSize: am5.percent(12),
        minFontSize: am5.percent(3),
        angles: [0, -45, 45],
        randomness: 0.4,
        minWordLength: 2,
        excludeWords: ["and", "the", "with", "for"]
      })
    );

    // Custom color set
    series.set("colors", am5.ColorSet.new(root, {
      colors: [
        am5.color(0x1a535c),
        am5.color(0x4ecdc4),
        am5.color(0xf7fff7),
        am5.color(0xff6b6b),
        am5.color(0xffe66d)
      ]
    }));

    series.labels.template.setAll({
      fontFamily: "Georgia, serif",
      tooltipText: "{category}: [bold]{value}[/]",
      cursorOverStyle: "pointer"
    });

    var techData = [
      { phrase: "Machine Learning", weight: 50 },
      { phrase: "Cloud Computing", weight: 45 },
      { phrase: "Data Engineering", weight: 40 },
      { phrase: "DevOps", weight: 35 },
      { phrase: "Cybersecurity", weight: 33 },
      { phrase: "API Design", weight: 28 },
      { phrase: "Microservices", weight: 25 },
      { phrase: "Containerization", weight: 22 },
      { phrase: "CI/CD Pipelines", weight: 20 },
      { phrase: "Edge Computing", weight: 18 },
      { phrase: "Serverless", weight: 16 },
      { phrase: "GraphQL", weight: 14 },
      { phrase: "WebAssembly", weight: 12 },
      { phrase: "Blockchain", weight: 10 }
    ];

    var businessData = [
      { phrase: "Product Strategy", weight: 48 },
      { phrase: "User Research", weight: 42 },
      { phrase: "Agile Management", weight: 38 },
      { phrase: "Stakeholder Communication", weight: 35 },
      { phrase: "OKR Planning", weight: 30 },
      { phrase: "Risk Assessment", weight: 27 },
      { phrase: "Customer Journey", weight: 24 },
      { phrase: "Market Analysis", weight: 22 },
      { phrase: "Revenue Modeling", weight: 20 },
      { phrase: "Team Leadership", weight: 18 },
      { phrase: "Design Thinking", weight: 16 },
      { phrase: "Data-Driven Decisions", weight: 14 }
    ];

    // Dynamic data swap functions
    window.showTech = function() { series.data.setAll(techData); };
    window.showBusiness = function() { series.data.setAll(businessData); };

    // Initial data
    series.data.setAll(techData);
    series.appear(1000);
  </script>
</body>
</html>
```
