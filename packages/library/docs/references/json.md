# JSON Configs — Writing a Chart as JSON

A JSON config describes a chart as data. The JSON plugin's `JsonParser` builds the chart from it. Write one when the user asks for a "JSON config" or "amCharts JSON", a `<am5-chart>` element, the `config` prop of an amCharts framework package, or a Chart Maker link. For a chart written in code, use the chart type's reference instead.

What code passes to `.new(root, { … })` goes into `settings` here, unchanged. Only the wrapping differs, and it must be exact: the parser does not guess.

## Where a config goes

| Destination | How |
|---|---|
| HTML page | `<am5-chart config='…'>` or `<am5-chart src="chart.json">` (see "Delivering a config") |
| JavaScript | `am5plugins_json.JsonParser.new(root).parse(config, { parent: root.container })`. It returns a promise of the chart. |
| React, Vue, Angular, Svelte, React Native | the package's `config` prop or input, e.g. `<AmChart config={config} themes={[am5themes_Animated]} />` (index.md "Frameworks") |
| Chart Maker (live.amcharts.com) | a link that carries the config (see "Delivering a config") |

**Themes are not part of a config.** Pass them separately: the element's `themes` attribute, the packages' `themes` prop, `root.setThemes()` in code, or the link's `theme` parameter. Never put `"themes"` in a config.

**Script files.** With script tags, load `index.js`, then `plugins/json.js`, then every chart package the config uses, plus geodata for maps. The parser does not load a missing package from the CDN: without `percent.js`, a pie config fails with "Cannot read properties of undefined (reading 'call')". With npm, the parser imports chart packages itself.

| Family | Files after `index.js` and `plugins/json.js` |
|---|---|
| XY | `xy.js` |
| Pie, donut, funnel, pyramid | `percent.js` |
| Map | `map.js`, plus the geodata, e.g. `geodata/worldLow.js` |
| Sankey, chord, arc | `flow.js` |
| Treemap, sunburst, force-directed, pack | `hierarchy.js` |
| Radar, gauge | `xy.js`, `radar.js` |

All files are at `https://cdn.amcharts.com/lib/5/`. Theme files, e.g. `themes/Animated.js`, go after the chart packages.

## The rules

### 1. Every amCharts object has `"type"`

The value is the class name without a namespace: `"XYChart"`, not `"am5xy.XYChart"` (that fails with "Unknown object type `am5xy.XYChart`"). The top level is the chart itself, e.g. `XYChart`, `PieChart`, `SlicedChart`, `MapChart`, `RadarChart` or `Gantt`. Families with no chart object put the series at the top: `Sankey`, `Chord`, `Treemap`, `ForceDirected`, `WordCloud`, `Venn`, or a `Container` that holds one. A config without a top-level `type` builds no chart.

### 2. `settings` and `properties`

An object has these keys and no others:

| Key | Holds |
|---|---|
| `type` | the class name |
| `settings` | what `.new(root, { … })` takes in code |
| `properties` | the object's parts and lists: `series`, `xAxes`, `yAxes`, `data`, `bullets` (an axis: `bullet`), and templates such as `columns`, `slices`, `mapPolygons`, `nodes` |
| `children` | elements or `"#name"` refs pushed into the object's `children`, e.g. a `Legend` (add `"index": 0` to put one first) |
| `refs` | named objects, used elsewhere as `"#name"` |
| `states` | `[{ "key": "hover", "settings": { … } }]` |

Settings placed next to `type` are silently ignored. `{ "type": "PieSeries", "valueField": "value" }` builds a series whose slices have no values.

An object inside `settings` with a `type` is built, e.g. `"renderer": { "type": "AxisRendererX" }` or `"tooltip": { "type": "Tooltip" }`. An object inside `settings` without one is a plain value, e.g. `"baseInterval": { "timeUnit": "day", "count": 1 }`. In `properties`, a block without `type` configures the part that already exists. A template is reached through `properties.template`:

```json
{
  "columns": {
    "properties": {
      "template": {
        "settings": { "cornerRadiusTL": 4, "cornerRadiusTR": 4, "tooltipText": "{valueY}" },
        "states": [{ "key": "hover", "settings": { "fillOpacity": 0.7 } }]
      }
    }
  }
}
```

That is `series.columns.template.setAll({ … })` and `series.columns.template.states.create("hover", { … })`, placed in the series' `properties`. Arrays in `properties` push into lists: `"series": [ … ]` is `chart.series.push(…)` for each item.

### 3. Data goes in `properties.data`

Never put data in `settings` or beside `type`: the series gets no data items. `"data"` is either the rows inline or a `"#name"` ref to rows in `refs`. Use a ref when several objects take the same rows. In XY charts, the `CategoryAxis` needs the rows too, as it does in code.

- Rows are plain JSON. Dates are timestamps in milliseconds (`1704067200000`), because JSON has no dates and a config has no data processor.
- The parser does not read inside a row, so strings in rows need no escaping and `Color` objects in rows stay plain objects.
- A row that must hold a color or a ref needs `"__parse": true`, and so does each object nested in it: `{ "country": "Chile", "bulletSettings": { "fill": { "type": "Color", "value": "#86a965" }, "__parse": true }, "__parse": true }`. The strings in such a row are read too, so escape a leading `#` or `@` there (rule 6).
- A row with a column named `type`, at any depth (e.g. in hierarchy `children`), needs `"__parse": false` on the top row. Without it, the parser takes the column for a class name and fails with "Unknown object type".
- Serialized configs also put `"__parse": true` on rows that hold objects or arrays, such as hierarchy `children`. Hand-written rows do not need it.

### 4. `refs` and `"#name"`

`refs` is an array of groups. Each group is an object of `name: value` pairs. A ref can use refs from earlier groups, so put each in dependency order: data, then axes and templates, then series. Use one ref per group, as serialized configs do. `refs` written as a single object, a form the docs also show, is one group: a series in it cannot use the axes beside it, and the chart fails ("Cannot read properties of undefined"). Refer to a ref anywhere with `"#name"`, plus a path if needed: `"#series-0.dataItems"` (a property), `"#series-0.get('fill')"` (a setting).

XY axes live in `refs`. The chart lists them, and each series points at them:

```json
{
  "type": "XYChart",
  "properties": { "xAxes": ["#axis-0"], "yAxes": ["#axis-1"], "series": ["#series-0"] },
  "refs": [
    { "data-0": [{ "month": "Jan", "sales": 120 }, { "month": "Feb", "sales": 145 }] },
    { "axis-0": { "type": "CategoryAxis", "settings": { "categoryField": "month", "renderer": { "type": "AxisRendererX" } }, "properties": { "data": "#data-0" } } },
    { "axis-1": { "type": "ValueAxis", "settings": { "renderer": { "type": "AxisRendererY" } } } },
    { "series-0": { "type": "ColumnSeries", "settings": { "xAxis": "#axis-0", "yAxis": "#axis-1", "categoryXField": "month", "valueYField": "sales" }, "properties": { "data": "#data-0" } } }
  ]
}
```

A legend lists XY series as `"data": ["#series-0", "#series-1"]`, and pie slices as `"data": "#series-0.dataItems"`.

### 5. Colors, percents, layouts

| Code | JSON |
|---|---|
| `am5.color(0xe05a47)` | `{ "type": "Color", "value": "#e05a47" }` |
| `am5.percent(50)` | `{ "type": "Percent", "value": 50 }` |
| `root.verticalLayout` | `"vertical"` (also `"horizontal"`, `"grid"`) |
| `root.interfaceColors.get("background")` | `"@root.interfaceColors.get('background')"` (5.21.0+) |
| `chart.get("colors").getIndex(3)` | `"@colors.getIndex(3)"` (5.21.3+, in settings, not in data rows) |
| `chart.appear(1000, 100)`, `series.appear(1000)` | `"autoAppear": true, "appearDuration": 1000, "appearDelay": 100` in the chart's and series' `settings` (5.21.0+) |

A bare hex string is wrong: `"fill": "#e05a47"` is read as a ref and fails with "Could not find ref #e05a47". `"50%"` stays a string, not a percent. As in code, use the theme's colors unless the user asks for specific ones. Serialized configs write layouts as `{ "type": "VerticalLayout" }`, which also works.

### 6. Strings that start with `#` or `@`

The parser reads every string in `settings`, `properties`, `states` and arrays. A string there that starts with `#` or `@` is a ref. A label text `"#1 product"` fails with "Could not find ref #1 product". Double the first character to mean the text itself: `"##1 product"`, `"@@team"`. Strings in data rows without `"__parse": true` are not read, so they need no escaping.

Built-in `@` refs: `@root` (the Root), `@colors` (the theme's palette), `@series` (inside a series' `properties.bullets`), `@axis` (inside an axis's `properties.bullet`), and `@self`, the object being configured, e.g. `"selectedDataItem": "@self.dataItems.0"` on a hierarchy series.

### 7. Bullets

`properties.bullets` is an array of `Bullet` objects. The parser turns each into the bullet function:

```json
{
  "bullets": [{
    "type": "Bullet",
    "settings": {
      "sprite": { "type": "Circle", "settings": { "radius": 5, "fill": "@series.get('fill')" } }
    }
  }]
}
```

### 8. Maps

- `"geoJSON": "am5geodata_worldLow"` (a string) names the geodata. The name is `am5geodata_` plus the path under `geodata/`, with `/` written as `_` (`geodata/region/usa/caLow.js` > `am5geodata_region_usa_caLow`; see `references/map.md`).
  - With script tags, load the geodata's script (`geodata/worldLow.js`) first; it defines a global of that name.
  - With npm, import it and pass it in `resources` (5.21.4+): `JsonParser.new(root).parse(config, { parent: root.container, resources: { am5geodata_worldLow } })`, `element.resources = { am5geodata_worldLow }` on an `<am5-chart>`, or the framework packages' `resources` prop (react 5.0.1, vue 5.0.2, angular 5.0.1, svelte 5.0.3). Before 5.21.4, set `window.am5geodata_worldLow = am5geodata_worldLow` after importing it.
  - If the geodata isn't found, the map is blank. Since 5.21.4 the parser logs a warning; before that, no error appears.
- The projection is a name in `settings`: `"projectionName": "geoNaturalEarth1"` for `am5map.geoNaturalEarth1()`. Next to `type` it is ignored.
- Heat rules are plain objects, not amCharts objects, so each one needs `"__parse": true`. Without it, `target` and the colors stay unread and the chart throws. The series also needs `"calculateAggregates": true` unless the rule sets `minValue` and `maxValue`. Without either, every country gets the middle color. The `target` is a `Template` in `refs`, which the series also uses as its `mapPolygons` template (see "Countries colored by value" under "Maps").
- Complete map configs (countries colored by value, a few countries highlighted) are in "Maps" below.

### 9. Root settings and locales

An optional top-level `"root": { "settings": { … }, "properties": { … } }` applies to the Root before the chart is built. `"properties": { "locale": "am5locales_de_DE" }` names the locale, found the same way as geodata (rule 8):
- with script tags, load `locales/de_DE.js` first; it defines a global of that name;
- with npm, import it and pass it in `resources` (5.21.4+), e.g. `resources: { am5locales_de_DE }`. Before 5.21.4, set `window.am5locales_de_DE = am5locales_de_DE` after importing it.

Since 5.21.4 a locale that isn't found logs a warning.

### 10. What a config cannot hold

No functions (adapters, event handlers, bullet functions with logic, heat-rule `customFunction`, a `projection` object, the data processor), no themes, no method calls (`setAll`, `appear`, `am5.color`) and no `Date` objects. Use the declarative forms above instead: `autoAppear`, `projectionName`, `Bullet` objects, `heatRules`, `templateField` with per-row settings, and timestamps. Code that is still needed runs after `parse()` resolves, on the built chart:

```js
parser.parse(config, { parent: root.container }).then(function (chart) {
  chart.series.getIndex(0).slices.template.events.on("click", function (ev) { /* … */ });
});
```

## Common mistakes

| Wrong | Right |
|---|---|
| `{ "chart": { "type": "PieChart" }, "series": [ … ] }`: no top-level `type`. The parser rejects it ("When using the parent setting, the entity must be a Sprite"); Chart Maker says "That configuration has no chart type". | `{ "type": "PieChart", "properties": { "series": [ … ] } }` |
| `{ "type": "PieSeries", "valueField": "value", "categoryField": "category" }` | `{ "type": "PieSeries", "settings": { "valueField": "value", "categoryField": "category" } }` |
| `"data": [ … ]` beside `type` or in `settings` | `"properties": { "data": [ … ] }` |
| A series or axis without `type` | `"type": "ColumnSeries"`, `"type": "ValueAxis"`, and `"type": "AxisRendererY"` on the renderer |
| `"type": "am5xy.LineSeries"` | `"type": "LineSeries"` |
| `"fill": "#ff0000"`, `"width": "50%"` | `{ "type": "Color", "value": "#ff0000" }`, `{ "type": "Percent", "value": 50 }` |
| `"geoJSON": am5geodata_worldLow` (not JSON) or the GeoJSON pasted in | `"geoJSON": "am5geodata_worldLow"`, with the geodata loaded |
| A CategoryAxis with no data | `"properties": { "data": "#data-0" }` on the axis too |
| A series in the same `refs` group as the axes it uses | Axes in an earlier group |
| `"themes": [ … ]` in the config | Themes passed beside the config |

## Complete configs

Each config below was parsed with amCharts 5.21.3 and checked to build its chart. Copy the structure, then change the data and settings.

### XY: column chart with a category axis, legend and cursor

Needs `index.js`, `plugins/json.js`, `xy.js`.

```json
{
  "type": "XYChart",
  "settings": {
    "layout": "vertical",
    "cursor": { "type": "XYCursor" },
    "autoAppear": true, "appearDuration": 1000, "appearDelay": 100
  },
  "properties": { "xAxes": ["#axis-0"], "yAxes": ["#axis-1"], "series": ["#series-0", "#series-1"] },
  "children": [{
    "type": "Legend",
    "settings": { "centerX": { "type": "Percent", "value": 50 }, "x": { "type": "Percent", "value": 50 } },
    "properties": { "data": ["#series-0", "#series-1"] }
  }],
  "refs": [
    { "data-0": [
      { "quarter": "Q1", "y2024": 120, "y2025": 145 },
      { "quarter": "Q2", "y2024": 135, "y2025": 160 },
      { "quarter": "Q3", "y2024": 128, "y2025": 172 },
      { "quarter": "Q4", "y2024": 150, "y2025": 190 }
    ] },
    { "axis-0": {
      "type": "CategoryAxis",
      "settings": {
        "categoryField": "quarter",
        "renderer": { "type": "AxisRendererX", "settings": { "cellStartLocation": 0.1, "cellEndLocation": 0.9 } }
      },
      "properties": { "data": "#data-0" }
    } },
    { "axis-1": {
      "type": "ValueAxis",
      "settings": { "min": 0, "renderer": { "type": "AxisRendererY" } }
    } },
    { "series-0": {
      "type": "ColumnSeries",
      "settings": {
        "name": "2024", "xAxis": "#axis-0", "yAxis": "#axis-1",
        "categoryXField": "quarter", "valueYField": "y2024",
        "tooltip": { "type": "Tooltip", "settings": { "labelText": "{name}: {valueY}" } },
        "autoAppear": true, "appearDuration": 1000
      },
      "properties": {
        "data": "#data-0",
        "columns": { "properties": { "template": { "settings": { "cornerRadiusTL": 4, "cornerRadiusTR": 4 } } } }
      }
    } },
    { "series-1": {
      "type": "ColumnSeries",
      "settings": {
        "name": "2025", "xAxis": "#axis-0", "yAxis": "#axis-1",
        "categoryXField": "quarter", "valueYField": "y2025",
        "tooltip": { "type": "Tooltip", "settings": { "labelText": "{name}: {valueY}" } },
        "autoAppear": true, "appearDuration": 1000
      },
      "properties": {
        "data": "#data-0",
        "columns": { "properties": { "template": { "settings": { "cornerRadiusTL": 4, "cornerRadiusTR": 4 } } } }
      }
    } }
  ]
}
```

For a line chart over time, use a `DateAxis` with `"baseInterval": { "timeUnit": "day", "count": 1 }`, `LineSeries` with `"valueXField": "date"`, and timestamps in the rows. A `DateAxis` takes no `data`.

### Pie with a legend

Needs `index.js`, `plugins/json.js`, `percent.js`. For a donut, add `"innerRadius": { "type": "Percent", "value": 50 }` to the chart's `settings`.

```json
{
  "type": "PieChart",
  "settings": { "layout": "vertical" },
  "properties": { "series": ["#series-0"] },
  "children": [{
    "type": "Legend",
    "settings": { "centerX": { "type": "Percent", "value": 50 }, "x": { "type": "Percent", "value": 50 } },
    "properties": { "data": "#series-0.dataItems" }
  }],
  "refs": [
    { "data-0": [
      { "category": "Search", "value": 4200 },
      { "category": "Social", "value": 2600 },
      { "category": "Email", "value": 1400 },
      { "category": "Direct", "value": 1100 },
      { "category": "Referral", "value": 700 }
    ] },
    { "series-0": {
      "type": "PieSeries",
      "settings": {
        "valueField": "value", "categoryField": "category",
        "autoAppear": true, "appearDuration": 1000, "appearDelay": 100
      },
      "properties": { "data": "#data-0" }
    } }
  ]
}
```

Map configs are in "Maps" below.

### Flow: Sankey

Needs `index.js`, `plugins/json.js`, `flow.js`. The Sankey is the top-level object, and its data is the links. Nodes come from the link ends.

```json
{
  "type": "Sankey",
  "settings": {
    "sourceIdField": "from", "targetIdField": "to", "valueField": "value",
    "paddingRight": 70,
    "autoAppear": true, "appearDuration": 1000, "appearDelay": 100
  },
  "properties": {
    "data": [
      { "from": "Solar", "to": "Electricity", "value": 30 },
      { "from": "Wind", "to": "Electricity", "value": 25 },
      { "from": "Gas", "to": "Electricity", "value": 40 },
      { "from": "Gas", "to": "Heating", "value": 35 },
      { "from": "Electricity", "to": "Homes", "value": 45 },
      { "from": "Electricity", "to": "Industry", "value": 50 },
      { "from": "Heating", "to": "Homes", "value": 35 }
    ]
  }
}
```

### Hierarchy: treemap

Needs `index.js`, `plugins/json.js`, `hierarchy.js`. The Treemap is the top-level object. `children` is the default `childDataField`. A `ForceDirected`, `Sunburst` or `Pack` takes the same shape.

```json
{
  "type": "Treemap",
  "settings": {
    "valueField": "value", "categoryField": "name",
    "autoAppear": true, "appearDuration": 1000, "appearDelay": 100
  },
  "properties": {
    "data": [{
      "name": "Sales",
      "children": [
        { "name": "Electronics", "children": [
          { "name": "Phones", "value": 86 }, { "name": "Laptops", "value": 64 }, { "name": "Audio", "value": 31 }
        ] },
        { "name": "Home", "children": [
          { "name": "Furniture", "value": 52 }, { "name": "Kitchen", "value": 37 }
        ] },
        { "name": "Sports", "children": [
          { "name": "Cycling", "value": 41 }, { "name": "Fitness", "value": 28 }
        ] }
      ]
    }]
  }
}
```

## Maps

A map config needs `index.js`, `plugins/json.js`, `map.js` and the geodata, e.g. `geodata/worldLow.js` (rule 8). Rows and `include`/`exclude` match countries by `id`, the ISO 3166-1 alpha-2 code. Each config below was parsed with amCharts 5.21.3, built through `<am5-chart>`, and opened in Chart Maker.

### Countries colored by value

Countries without a value get the theme's `disabled` color.

```json
{
  "type": "MapChart",
  "settings": {
    "projectionName": "geoNaturalEarth1",
    "autoAppear": true, "appearDuration": 1000, "appearDelay": 100
  },
  "properties": { "series": ["#series-0"] },
  "refs": [
    { "data-0": [
      { "id": "CN", "value": 1410 }, { "id": "IN", "value": 1430 },
      { "id": "US", "value": 335 }, { "id": "ID", "value": 278 },
      { "id": "BR", "value": 216 }, { "id": "NG", "value": 224 },
      { "id": "DE", "value": 84 }, { "id": "AU", "value": 27 }
    ] },
    { "template-0": {
      "type": "Template",
      "settings": { "tooltipText": "{name}: {value}", "fill": "@root.interfaceColors.get('disabled')" }
    } },
    { "series-0": {
      "type": "MapPolygonSeries",
      "settings": {
        "geoJSON": "am5geodata_worldLow",
        "valueField": "value",
        "calculateAggregates": true,
        "heatRules": [{
          "target": "#template-0", "dataField": "value", "key": "fill",
          "min": { "type": "Color", "value": "#9ecae1" },
          "max": { "type": "Color", "value": "#08519c" },
          "__parse": true
        }]
      },
      "properties": {
        "data": "#data-0",
        "mapPolygons": { "properties": { "template": "#template-0" } }
      }
    } }
  ]
}
```

For a map without values, drop `data-0`, `template-0`, `heatRules`, `valueField` and `calculateAggregates`. Then give the series `"properties": { "mapPolygons": { "properties": { "template": { "settings": { "tooltipText": "{name}" } } } } }`.

### A few countries highlighted, through their data rows

One series. Each highlighted country's row carries the polygon's settings, which the template picks up through `templateField`. A row that holds a color needs `"__parse": true`, and so does the settings object in it (rule 3). In Chart Maker the map stays one series, so this form is the easier one to edit there.

```json
{
  "type": "MapChart",
  "settings": {
    "projectionName": "geoNaturalEarth1",
    "autoAppear": true, "appearDuration": 1000, "appearDelay": 100
  },
  "properties": {
    "series": [{
      "type": "MapPolygonSeries",
      "settings": { "geoJSON": "am5geodata_worldLow", "exclude": ["AQ"] },
      "properties": {
        "mapPolygons": { "properties": { "template": {
          "settings": { "tooltipText": "{name}", "templateField": "polygonSettings" }
        } } },
        "data": [
          { "id": "CA", "polygonSettings": { "fill": { "type": "Color", "value": "#e8590c" }, "__parse": true }, "__parse": true },
          { "id": "IN", "polygonSettings": { "fill": { "type": "Color", "value": "#e8590c" }, "__parse": true }, "__parse": true },
          { "id": "AU", "polygonSettings": { "fill": { "type": "Color", "value": "#e8590c" }, "__parse": true }, "__parse": true }
        ]
      }
    }]
  }
}
```

### A few countries highlighted, with a second series on top

The world series draws every country. A second series with `include` draws only the highlighted ones, in their own color, over it. Later series draw on top. The second series still holds a data item for every country, but it draws only the ones in `include`.

```json
{
  "type": "MapChart",
  "settings": {
    "projectionName": "geoNaturalEarth1",
    "autoAppear": true, "appearDuration": 1000, "appearDelay": 100
  },
  "properties": {
    "series": [{
      "type": "MapPolygonSeries",
      "settings": { "geoJSON": "am5geodata_worldLow", "exclude": ["AQ"] },
      "properties": {
        "mapPolygons": { "properties": { "template": { "settings": { "tooltipText": "{name}" } } } }
      }
    }, {
      "type": "MapPolygonSeries",
      "settings": { "geoJSON": "am5geodata_worldLow", "include": ["CA", "IN", "AU"] },
      "properties": {
        "mapPolygons": { "properties": { "template": {
          "settings": { "tooltipText": "{name}", "fill": { "type": "Color", "value": "#e8590c" } }
        } } }
      }
    }]
  }
}
```

In an `<am5-chart>` element, any of these configs goes in the `config` attribute. Load `element.js` after `plugins/json.js`, then `map.js` and the geodata (see "`<am5-chart>` element" below).

## Delivering a config

### `<am5-chart>` element (5.21.0+)

Load the scripts, then put the config in the `config` attribute:

```html
<script src="https://cdn.amcharts.com/lib/5/index.js"></script>
<script src="https://cdn.amcharts.com/lib/5/plugins/json.js"></script>
<script src="https://cdn.amcharts.com/lib/5/element.js"></script>
<script src="https://cdn.amcharts.com/lib/5/percent.js"></script>
<script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>

<am5-chart themes="Animated" style="height: 400px" config='{
  "type": "PieChart",
  "properties": { "series": [{ "type": "PieSeries",
    "settings": { "valueField": "value", "categoryField": "category", "autoAppear": true },
    "properties": { "data": [{ "category": "Search", "value": 4200 }, { "category": "Social", "value": 2600 }] } }] }
}'></am5-chart>
```

- Load the files each family needs (see "Where a config goes").
- The attribute is single-quoted, so write a `'` inside the config as `&#39;`, e.g. `get(&#39;background&#39;)`.
- For a long config, use `src="chart.json"` or set the element's `config` property from a script: `document.querySelector("am5-chart").config = { … }`.
- A theme with its settings (5.21.4) goes in the attribute as JSON: `themes='["Animated", ["Adaptive", { "baseColor": "#4150a0" }]]'`.
- With npm, import `defineChartElement` from `@amcharts/amcharts5/element` and call it (esbuild drops a bare `import "@amcharts/amcharts5/element"`). Then set the properties: `element.themes = [am5themes_Animated]`, `element.resources = { am5geodata_worldLow }` for a map (5.21.4, rule 8), and `element.config = config`.
- See index.md "Serializing to JSON" for `renderer="svg"`, `whenReady()` and the `ready`/`error` events.

### Chart Maker link

Chart Maker (live.amcharts.com) opens a config from a link, ready to edit:

```js
const url = "https://live.amcharts.com/open#config=" + encodeURIComponent(JSON.stringify(config))
  + "&title=" + encodeURIComponent("Traffic sources");
```

- The parameters are in the `#` hash, not a query string. Optional ones: `title`; `theme`, a theme name such as `Kelly` or `Material`; `dark=1` for the dark version (on its own, the Dark theme); `responsive=1` for the Responsive theme.
- Chart Maker loads chart packages and `am5geodata_*` geodata by itself.
- For a big config, gzip the JSON, base64url-encode it without `=` padding, and use `#config=gz.` followed by that string. This typically makes it 5–10× smaller. Configs over 2 MB are refused.
- Build the link in code when you can: a hand-encoded link breaks on a single wrong character.

### Framework packages

`@amcharts/amcharts5-react`, `-vue`, `-angular`, `-svelte` and `-react-native` each take a config as a prop or input, plus themes beside it. See index.md "Frameworks".

- For a map in React, Vue, Angular or Svelte, give the chart its geodata as in rule 8: the `resources` prop (5.21.4+), or a global set before the chart is built.
- React Native loads the geodata a config names by itself, but not a locale: give it `modules={["locales/de_DE"]}`.
