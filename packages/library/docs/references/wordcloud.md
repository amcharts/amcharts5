# Word Cloud

> **As a JSON config:** see `references/json.md`. The settings below go into each object's `"settings"` there.

Docs: https://docs.amcharts.com/v5/charts/word-cloud/

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
| `maxFontSize` | number \| Percent | `am5.percent(15)` | Maximum font size (a `Percent` is relative to the smaller chart dimension) |
| `minFontSize` | number \| Percent | `am5.percent(2)` | Minimum font size (a `Percent` is relative to the smaller chart dimension) |
| `angles` | number[] | `[0, -90]` | Allowed rotation angles for words. **Any angle works** as of 5.20.1 (e.g. `[0, -30, -45]`), not just `0`/`±90` as in earlier versions |
| `randomizeAngles` | boolean | `true` | `true` = each word picks a random angle from `angles`. `false` = words cycle through `angles` in order (word 0 > `angles[0]`, …) which, with `randomness: 0`, makes the layout reproducible. *(5.20.1)* |
| `randomness` | number (0–1) | `0` | Layout randomness (0 = ordered by value, 1 = fully random) |
| `allowNesting` | boolean | `true` | `true` = small words tuck into the concavities of bigger ones (tight packing, bounding boxes may overlap). `false` = whole bounding boxes are packed so they never overlap — use this when labels have an opaque `background`. *(5.20.1)* |
| `minWordLength` | number | `1` | Skip words shorter than this |
| `minValue` | number | — | Skip words occurring fewer times than this |
| `maxCount` | number | — | Maximum number of words to display |
| `excludeWords` | string[] | `[]` | Words to exclude |
| `text` | string | — | Raw text to parse — words are extracted and weighted by frequency automatically |
| `colors` | ColorSet | — | Color set for words |
| `fillField` | string | — | Data field holding a per-word label fill color |
| `autoFit` | boolean | `true` | Scale font sizes down so all words fit the available area |
| `step` | number | `15` | Step size used when searching for the next word placement |
| `svgPath` | string | — | Arrange words to fill this SVG path shape (experimental) *(5.20.1)* |
| `maskByShape` | boolean | `false` | Clip words to the `svgPath` outline for a crisp silhouette. Requires `svgPath`. *(5.20.1)* |
| `shapeTolerance` | number | `0` | Extra pixels a word may spill past the `svgPath` outline; negative pulls words inside, creating padding. Requires `svgPath`. *(5.20.1)* |
| `animationDuration` | number | — | Duration of word animation on chart resize |
| `sequencedInterpolation` | boolean | `true` | Stagger the word reveal instead of showing all at once |
| `sequencedDelay` | number | `15` | Milliseconds between words when `sequencedInterpolation` is on |

**Parser settings and `text`:** `minValue`, `maxCount`, `minWordLength` and `excludeWords` are consumed when `text` is parsed. Since **5.20.0** changing any of them on a live series re-parses `text` automatically. On older versions they only took effect on the next `text` assignment — set them **before** `text`, or re-assign `text` after changing them. Before **5.21.0** a word failing more than one of `minValue`, `minWordLength` and `excludeWords` also removed a neighbouring word — if you filtered words out of the data yourself to avoid that, the settings are safe to use now.

### excludeWords example

```js
am5wc.WordCloud.new(root, {
  categoryField: "word",
  valueField: "count",
  excludeWords: ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "is", "it"]
});
```

## Shaped word clouds — `svgPath` (5.20.1)

Words can be arranged to fill an arbitrary shape. The path is scaled proportionally to fit the plot area.

```js
var series = root.container.children.push(
  am5wc.WordCloud.new(root, {
    categoryField: "tag",
    valueField: "weight",
    svgPath: "M10,30 A20,20 0,0,1 50,30 A20,20 0,0,1 90,30 Q90,60 50,90 Q10,60 10,30 z", // heart
    maskByShape: true,     // clip letters that overhang the outline
    shapeTolerance: -4,    // negative = padding inside the shape
    angles: [0],           // simple shapes fill better with fewer angles
    minFontSize: am5.percent(2),
    maxFontSize: am5.percent(12)
  })
);
```

The shape outline itself is drawn behind the words as `series.shape` (a `Graphics`), by default a faint 10%-opacity silhouette. Style or hide it:

```js
series.shape.setAll({ fill: am5.color(0xff3366), fillOpacity: 0.08 });
series.shape.set("fillOpacity", 0);      // no visible silhouette, words only
```

Style `fill`/`stroke` only — the series manages the shape's geometry (`svgPath`, `scale`, `x`, `y`) and its `forceHidden` flag, so setting those is pointless. To hide the silhouette use `fillOpacity: 0`.

**Caveats:** this is an experimental feature and the fit is approximate. Favor simple, bold shapes over thin or highly concave ones, and tune `shapeTolerance`, `maskByShape`, `angles`, `minFontSize`/`maxFontSize` per shape. `shapeTolerance` affects placement only — the drawn outline never moves.

## Diagonal angles (5.20.1)

Before 5.20.1 only `0`, `90` and `-90` were handled. The layout rewrite rasterizes each word and its collision mask at the word's actual angle, so arbitrary angles now work — and neighbors pack into the corners of a rotated word's footprint instead of reserving its full axis-aligned bounding box.

```js
am5wc.WordCloud.new(root, {
  categoryField: "tag",
  valueField: "weight",
  angles: [0, -30, -45, -60, -90]
});
```

One caveat: if a word comes out very wide relative to the available area, the layout flips it to `0` or `±90` for a better fit — but only when that value is present in your `angles` array. Leave them out and your angles are used as given.

## Reproducible layouts

By default word placement is randomized, so the cloud looks different on every render. For a stable layout:

```js
am5wc.WordCloud.new(root, {
  categoryField: "tag",
  valueField: "weight",
  randomness: 0,           // order strictly by value
  randomizeAngles: false   // cycle `angles` in order instead of picking randomly
});
```

## Labels with opaque backgrounds

Nesting lets small words sit inside the gaps of larger ones, which looks wrong once labels have a solid background — the background rectangles slide over neighbors. Turn nesting off so whole bounding boxes are packed:

```js
series.set("allowNesting", false);
series.labels.template.setAll({
  background: am5.RoundedRectangle.new(root, { fill: am5.color(0x1f2933), fillOpacity: 1 })
});
```

## Breaking change in 5.20.1

The layout is now computed synchronously in a single pass instead of one word per animation frame — much faster for large clouds. Consequences for existing code:

- The per-data-item `ghostLabel` no longer exists — `dataItem.get("ghostLabel")` returns `undefined`.
- Labels are held in an internal container, so code walking `series.children` to find labels breaks. Use `series.labels` (the `ListTemplate`) or `dataItem.get("label")`.
- The reveal is staggered via `sequencedInterpolation`/`sequencedDelay` (defaults `true` / `15`ms) rather than by the layout itself.

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
