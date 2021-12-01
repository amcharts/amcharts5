# amCharts 5 Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

Please note, that this project, while following numbering syntax, it DOES NOT
adhere to [Semantic Versioning](http://semver.org/spec/v2.0.0.html) rules.

## [5.0.14] - 2021-12-01

### Changed
- When setting `markerState` on `Annotator` it will now automatically render annotations without the need to open annotation mode.

### Fixed
- Updating data dynamically on series in all-`ValueAxis` setups.
- Rmoving axis range was not working properly.
- Closing annotation mode would not make chart regain its interactivity.


## [5.0.13] - 2021-11-25

### Added
- `clickTarget` (possible vales: `"itemContainer"` (default), `"marker"`, and `"none"`) added to `Legend`. Use `clickTarget: "none"` to disable toggling of legend items.

### Changed
- Setting `wheelX`/`wheelY` on `XYChart` or `MapChart` no longer marks their plot areas as `wheelable`.

### Fixed
- In some cases using `oversizedBehavior = "wrap"` on labels in super small spaces the chart would hang.
- Updating data on a `ForcedDirectedTree` may cause JS errors.
- Hovering legend item of a hidden slice no longer tries to show the tooltip for it.
- Drill-down maps were displaying country in a wrong position after drill-down.


## [5.0.12] - 2021-11-24

### Added
- `latitudeField` and `longitudeField` added to `MapPointSeries` for an easier way to add data.

### Changed
- Tooltip arrangement algorithm with many XY series was improved.

### Fixed
- Axis fill rule of `DateAxis` sometimes skipped an interval or was drawn two fills in a row. Also, with months as interval between grids, the end of the fill was not at exact position where it should have been.
- When setting new data for a series, if new data has less items than series had before, a JS error could occur.


## [5.0.11] - 2021-11-23

### Added
- New `fps` property on `Root` which defines the maximum FPS that it will run at. Set it 30 or lower if performance is an issue.
- `"range"` theme tag is now added to all axis range elements (axisFill, grid, tick and label) so you could target specific theme rules.
- `"range"` and `"series"` theme tag is now added to all series axis range elements (axisFill, grid, tick and label) so you could target specific theme rules. 

### Changed
- A `axisFill` of an axis range will not be shown unless its `visible: true` setting is set.

### Fixed
- Adapter for `text` of a `Label` was not kicking in when data item of its `Tooltip` (or other parent of a Label) was changed.
- Legend marker/label was not returning to a default state when clicked on a disabled item in some cases when Animated theme was not used.
- Axis range fill tooltip was being shown in a wrong position.


## [5.0.10] - 2021-11-22

### Fixed
- `LineSeries`' strokes in an axis range were using wrong template, which could result incorrect colors or other settings (since 5.0.9).
- When data was updated on a live chart and the chart was not fully zoomed-out, some unnecessary Y axis animation used to happen after data update.


## [5.0.9] - 2021-11-22

### Changed
- `maxTooltipDistance` in `XYCursor` now accepts `-1` value, which means that only single tooltip will be shown, even if multiple data items share the same value.

### Fixed
- `GraticuleSeries` was broken.


## [5.0.8] - 2021-11-21

### Changed
- Trying to create a `Root` in a container that already contains a chart will result in a hard error now.
- All `XYSeries` now use both main template and axis range template (the latter has a priority) when decorating columns/lines/etc for the sections covered by axis range.

### Fixed
- Axis fills were not working properly.
- Since 5.0.6: Map was zoomed to incorrect position in some specific cases when `goHome()` method was called.


## [5.0.7] - 2021-11-19

### Added
- New setting `pan` (default: `"none"`) added to `AxisRendererX` and `AxisRendererY`. If set to `"zoom"` will enable zoom of axis scale by dragging in axis label area.

### Changed
- Heat rules will not longer apply setting value if target data item does not have any numeric value.
- Hovering legend item will now simulate hover on related item on some charts (e.g. `PieSeries`, `Hierarchy`, `Venn`).

###
- `HeatLegend` was acting out when its `showValue()` method was called with non-numeric parameter.
- If series was pre-hidden before chart init, its status was not being correctly reflected in related legend item.
- Locales in script version were not working properly.


## [5.0.6] - 2021-11-18

### Added
- Accessibility: new setting on `Sprite`: `focusableGroup`. If set, TAB key will iterate through first elements of each focusable group, allowing user to select within group using arrow keys. [More info](https://www.amcharts.com/docs/v5/concepts/accessibility/#Grouping_focusable_elements).
- New `Root` setting: `autoResize` (default: `true`). If set to `false`, the chart will not automtically resize itself when width/height of its container change. Use `resize()` method to resize manually.
- New `Root` method: `resize()`. Resizes chart to fit container dimensions, if automatic resizing is disabled (`root.autoResize = false`).
- Global `am5.p0` shortcut function added which returns `Percent(0)`.
- All element will now have a read-only property `root` which holds their `Root` object.
- New `Sprite` events: `rightclick` and `middleclick`. Please note that adding `rightclick` event will not disable possible contextual menu on right-mouse click.
- New `XYCursor` setting: `snapToSeriesBy` (default: `"xy"`). Defines in which direction to look when searching for the nearest data item to snap to. Possible values: `"xy"` (default), `"x"`, and `"y"`.

### Changed
- If set `wheel` event will now fire even if `wheelable = false`. This allows capturing wheel events on elements without interfering with scroll of the document.

### Fixed
- `oversizedBehavior` on `Label` (still) was not handling `maxWidth` and `maxHeight` values properly (since `5.0.2`).
- Dynamically updating `geoJSON` on a `MapPolygonSeries` was not working properly in some cases.


## [5.0.5] - 2021-11-15

### Added
- New root element method: `moveDOM()` (accepts element id or reference as a parameter). Can be used to move whole chart to some other container within DOM.

### Fixed
- `ExportingMenu` was interfering with functionality of form elements on the same page (e.g. select).
- Fixed issues with text kerning with styling blocks mid-word.
- Animating values of `width`/`height` settings using percent values was not working properly.


## [5.0.4] - 2021-11-12

### Added
- `panstarted`, `panended`, and `wheelended` events added to `XYChart`.

### Fixed
- Fixed `RadarChart` issues when it was being created in hidden container.
- `XYCursor` and `snapToSeries` problems fixed: was not working with `ColumnSeries`, and was not working properly with stacked axes.
- Adding/changing data on a `DateAxis` with `groupData = true` was not working properly.
- If non-rounded dates were used in data, `XYCursor`'s tooltips were flickering while moving cursor over plot area.


## [5.0.3] - 2021-11-09

### Fixed
- Incorrect sizing of a label in a central `Sunburst` node.


## [5.0.2] - 2021-11-09

### Added
- `radius()` and `baseRadius()` methods added to `RadialLabel`. Return `radius`/`baseRadius` value in pixels, calculated based on all the other settings.
- Global function `am5.ready()` added. Accepts a function as a parameter, which is executed when DOM is ready.

### Changed
- `baseRadius` of `RadialLabel` can now accept Percent values. Previously this property was set internally, now user can set it to a number or percent value.

### Fixed
- Stacking line series with missing data on some series was incorrect.
- `oversizedBehavior` on `Label` was not handling `maxWidth` and `maxHeight` values properly.


## [5.0.1] - 2021-11-05

### Fixed
- `XYChart` with panning enabled an no Animated theme was flickering while panning.
- JS error could occur sometimes if data was updated while cursor was moving over the chart.


## [5.0.0] - 2021-11-02

### Changed
- First public release.


## [5.0.0-beta.44] - 2021-11-02 (release candidate)

### Added
- `Triangle` class added.
- `labelText` setting added to `Tooltip`. If set the text will automatically be applied to tooltip's label.


## [5.0.0-beta.43] - 2021-11-02

### Fixed
- Image resolution could get choppy when resized (since previous version).


## [5.0.0-beta.42] - 2021-11-01

### Added
- If a `Bullet` has `dynamic: true` set, its sprite size will be marked as dirty each time the bullet updates its position.
- Axis name added to `AxisLabel` when created so it could be targeted by axis type in theme rules.

### Changed
- Upgraded to `marker.js` 2.16.2.
- `Annotator` new setting: `markerState`. You can use it to pre-set annotations, or grab annotation data at any time.
- Default text of an `AxisLabel` for `CategoryAxis` set to `"{category}"`.

### Fixed
- `Picture` was not working properly in containers in a non-default layer.
- `locationX` or `locationY` was being ignored on `RadarLineSeries` in some specific cases.
- `Tooltip` as not coloring its text properly with "Dark" theme enabled.


## [5.0.0-beta.41] - 2021-10-31

### Added
- `dRadius` and `dInnerRadius` settings added to `Slice` (default: `0`). Allows tweaking `radius`/`innerRadius` values in charts where these settings are set by the chart (`PieSeries`, circular/radial axis fills, etc.).
- `adjustBulletPosition` added to `BaseColumnSeries` (default: `true`). If set to `false`, bullets will be positioned relatively to whole width/height of the column, rather then the portion that is currently visible.

### Fixed
- `RadarChart` with `RadarLineSeries` could result a JS error when zoomed.


## [5.0.0-beta.40] - 2021-10-30

### Fixed
- `Label` setting `oversizedBehavior` was not working properly when heigh/with was 0.
- `XYSeries` was not calculating `maxWidth`/`maxHeight` properly on data items with negative values.
- Data grouping was not being applied when data was being updated after chart init.


## [5.0.0-beta.39] - 2021-10-29

### Changed
- All `MapChart`-related zoom methods will now return `Animation` object.


## [5.0.0-beta.38] - 2021-10-28

### Added
- `"depthX"` (`depth0`, `depth1`, etc.) tags added to Hierarchy Nodes. This allows targeting node items via theme rules by the level.

### Changed
- A function that returns a Bullet can choose to return nothing, effectively ommitting bullet for the data item.
- `Picture` elements will no inherit interactivity from its parents. If image needs to be interactive it needs to be set so directly via `interactive` setting.
- `Picture` will now use source file's dimensions if neither `width` and `height` is set, and will also maintain aspect ratio if just one from `width` or `height` is set.

### Fixed
- Better color generation and step management in `ColorSet`.


## [5.0.0-beta.37] - 2021-10-26

### Added
- Dataviz, Kelly, Moonrise, Frozen, Material and Spirited themes added.
- `seriesTooltipTarget` setting added to `XYSeries` (possible values: `"series"` (default) and `"bullet"`). If set to `"bullet"`, first bullet of a data item will be used for as a tooltip target, making it inherit bullet's color rather than series.

### Changed
- `Scrollbar` grip buttons will now have `exportable: false` set by default, so that they are not exported to chart snapshots.
- `WordCloud` words are now sorted by value if data was set using `series.data`.

### Fixed
- First label of the `WordCloud` could overlap with other words afer the data update.
- `ColorSet` was ignoring values set in a theme.
- Bullets with `Rectangle` or `RoundedRectangle` as a `sprite` were not being shown on an `XYSeries`.
- `MapChart` was overriding width/height variables to 100%.


## [5.0.0-beta.36] - 2021-10-25

### Added
- New chart type: Venn. [More info](https://www.amcharts.com/docs/v5/charts/venn/).
- New chart type: WordCloud. [More info](https://www.amcharts.com/docs/v5/charts/word-cloud/).

### Changed
- `XYSeries` will now automatically set the first bullet of a data item as the series' `tooltipTarget`. This will make the series tooltip background to change color to
the bullet's fill.

### Fixed
- Code optimizations to reduce size of core package by 10%.
- If data was being set for a `CategoryAxis` not instantly but after some time, the chart was not rendered properly.
- `svgPath` with `A` or `a` commands was not being rendered properly.


## [5.0.0-beta.35] - 2021-10-15

### Added
- New axis type: `DurationAxis`. [More info](https://www.amcharts.com/docs/v5/charts/xy-chart/axes/duration-axis/).
- New formatter type: `DurationFormatter`. [More info](https://www.amcharts.com/docs/v5/concepts/formatters/formatting-durations/).
- New `Root` element property: `durationFormatter`. Holds a global instance of `DurationFormatter` which is used by `DurationAxis`.
- `Annotator` tool added to `Exporting` plugin. [More info](https://www.amcharts.com/docs/v5/concepts/exporting/annotator/).

### Fixed
- Circular labels with `inside = true` where not properly handling line-breaks.


## [5.0.0-beta.34] - 2021-10-13

### Added
- It is now possible to pass a custom draw methods for classes like `Rectangle`, `RoundedRectangle`, `Candlestick`, etc. This allows implementing completely custom look for those elements.

### Changed
- Bullets on a `ColumnSeries` are now positioned vertically relative to visible part of the column, not the whole column.


## [5.0.0-beta.33] - 2021-10-12

### Fixed
- In-line data placeholder formatting functions were not being applied when referring directly to keys in data.
- If settings on a `DataProcessor` were set after it was created, they were being ignored when parsing data.
- In some cases tooltips were losing their background/outline unless Animated theme was enabled.
- In some cases tooltips for a hidden series were still showing.


## [5.0.0-beta.32] - 2021-10-08

### Changed
- `Exporting` plugin now imports minified version of `xlsx` library for XSLX data exports.
- Axis tooltips have now `animationDuration: 200` set automatically by Animated theme, so there's no need to set it in code anymore.

### Fixed
- Charts with `CategoryAxis` + `DateAxis` were zooming incorrectly in some cases.


## [5.0.0-beta.31] - 2021-10-07

### Changed
- Axis will automatically add relative `themeTags` (e.g. `"axis"`, `"y"`, etc.) to a `Tooltip` when it is added. Setting `themeTags` manually is not required anymore.

### Fixed
- An adapter for a setting was not being invoked if source value was `undefined`.
- Tooltips on vertically or horizontally stacked axes were being shown in wrong positions.
- Tooltip background displayed some artifact in some rare cases.


## [5.0.0-beta.30] - 2021-10-05

### Added
- `shadow*` settings are now available on `Label` as well.
- `arrangeTooltips` (default: `true`) setting added to `XYChart`. If set to `false` will disable tooltip overlap check algo.

### Fixed
- Fixed type errors when importing maps (especially in Angular).
- Fixed `templateField` to override `template`.


## [5.0.0-beta.29] - 2021-10-01

### Added
- Wherever date or number format can be set (`DateFormatter`, `NumberFormatter`, `DateAxis`, `ValueAxis`, `Exporting`) it can now be set as `Intl.DateTimeFormatOptions` (for date format) or `Intl.NumberFormatOptions` (for number format) object in additional to string-based format. [More info](https://www.amcharts.com/docs/v5/tutorials/formatting-date-time-and-numbers-using-intl-object/).
- New list type `ListAutoDispose` added.

### Changed
- `XYCursor` will now ignore mouse movement if chart is obstructed by other element, unless zoomin/panning.
- `series`, `xAxes`, and `yAxes` on an `XYChart` are now `ListAutoDispose`, which means that removing items from those lists will automatically dispose them. Set `autoDispose = false` on those lists if you are planning on removing and reusing items.

### Fixed
- `Sunburst` nodes were shown on drill-down when they were not supposed to in some cases.
- `Hierarchy` node elements were ignoring `templateField`.
- It was impossible to move `XYChart` scrollbars to some other container.
- Fixed memory leaking when scrolling `LineSeries`, and when disposing series or other items.
- `XYCursor` was not firing `selectended` event if `behavior` was set to `"selectX"`, `"selectY"`, or `"selectXY"`.
- `XYCursor` was hiding selection when when behavior was set to `"selectX"`, `"selectY"`, or `"selectXY"`.
- `SerialChart.series.clear()` was not working properly.


## [5.0.0-beta.28] - 2021-09-28

### Added
- Two new settings in `Pattern`: `strokeDasharray` and `strokeDashoffset`.
- `Graphics` and `Picture` can now have shadows with additional settings: `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`, and `shadowOpacity`. [More info](https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/).
- New setting in `ListTemplate`: `autoDispose` (default: `true`). If set to `true` will dispose items removed from the list.

### Changed
- `width` and `height` settings in `Pattern` are now optional.

### Fixed
- Fixed the priority of `template` and `templateField`.
- It's now possible for the user to override the `template` of the `ListTemplate`.
- Fixed a memory leak where series' entities were not properly disposed.
- `DataProcessor` was not parsing dates as `Date` objects unless `dateFormat` was also set (which is completely not needed).
- `setRaw` and `setPrivateRaw` no longer trigger events if the value didn't change.


## [5.0.0-beta.27] - 2021-09-27

### Added
- Root element now has publicly-accessible property: `dom`. Holds a reference to chart container (div).

### Fixed
- Gradient/pattern fills were not working on some elements (since 5.0.0-beta.18).


## [5.0.0-beta.26] - 2021-09-24

### Fixed
- `MapLineSeries` with line geometry inside GeoJSON was not working properly.


## [5.0.0-beta.25] - 2021-09-24

### Added
- New `Entity` setting: `userData`. Use it to store any kind of proprietary data with any object in amCharts 5 that extends `Entity`.

### Changed
- Series axis range will now have `visible: false` set for all axis elements (grid, fill, label, tick) by deafult. If you need to enable them, set `visible: true` on a respective range element. [More info](https://www.amcharts.com/docs/v5/charts/xy-chart/axes/axis-ranges/#Elements_on_a_series_range).

### Fixed
- Improperly closed in-line text style blocks could cause label palcement issues.
- Using `\n\n` in text was not resulting in empty line.
- Horizontal `Sankey` bullets were not using their `locationX` as it should.


## [5.0.0-beta.24] - 2021-09-23

### Added
- `autoRotate` and `autoRotateAngle` settings added to `Bullet`. Works on `Flow` and `MapPointSeries` (when `MapPoint` is attached to a `MapLine`).

### Changed
- `Sankey` bullets will now check `locationY` if series is vertical, and `locationX` of its a horizontal series. It was using `positionY` for all orientations previously.

### Fixed
- In some cases labels with `oversizedBehavior: "fit"` were not being resized when available space was changed.
- `autoRotate`


## [5.0.0-beta.23] - 2021-09-23

### Fixed
- Scrollbar was doing some unneeded animations when grip was released while axis was still animating.
- Double-clicking on scrollbar thumb did not always result full zoomout.
- Clicking on Scrollbar background did not always result in animating to the clicked position.
- `stroke` & `fill` set on `ColumnSeries`' `columns.template` was being overriden by series `stroke` and `fill`.
- Not all settings of `columns.template` were copied to `ColumnSeries`' legend marker.


## [5.0.0-beta.22] - 2021-09-22

### Added
- `PercentSeries`, `FlowNodes`, and `Hierarchy` now have `fillField` setting. It can be used to specify slice/node fill color via data. If not set, colors will be assigned automatically from series' `colors` (`ColorSet`).

### Changed
- The way values of nodes in `Hierarchy` is counted updated to be consistent. There are two options now: a) set values on lowest nodes (no children) so that each node's value is a sum of all its descendants; b) set values for **each** node. Using any other approach might produce unpredictangle results.
- `colors` of the `PercentSeries`, `FlowNodes`, and `Hierarchy` will be reset every time new data is set.

### Fixed
- Charts now will update their resolution when zooming. That fixes blurriness when page is zoomed in.
- In some cases, axis' or series' tooltip was showing correct value but was not positioned in the right position.
- If a `templateField` was set on `FlowNodes`' `rectangles`, the `fill` of the rectangle set in the field was ignored.


## [5.0.0-beta.21] - 2021-09-21

### Fixed
- Compared `XYSeries` with `valueYShow: "valueYChangeSelectionPercent"` were redrawn no taking current zoom into account when mouse cursor left plot area when panning chart.


## [5.0.0-beta.20] - 2021-09-21

### Added
- `toFront()` and `toBack()` methods added to `Sprite`.
- `"above"` setting added to `AxisDataItem`. Allows putting `AxisRange` grid and fill elements above the series.
- New setting `ignoreFormatting` for `Label` added. If set to `true`, it will ignore square-bracketed style blocks and will display text as it is.

### Fixed
- Elements in chart will not generate hover events if they are obstructed by some other DOM element anymore.
- `XYSeries` with a vertical axis range was fully visible, even the part covered by an axis range.
- Axis bullets were not being hidden when axis data item was hidden.
- Labels in `BreadcrumbBar` were sometimes misaligned in Safari browser.
- Legend item of an initially-hidden series/slices/columns was being shown as enabled.


## [5.0.0-beta.19] - 2021-09-18

### Fixed
- Removing an axis from `xAxes` or `yAxes` was not working properly in some cases.
- If a `templateField` was set on some child of a bullet's `sprite`, it was being ignored.


## [5.0.0-beta.18] - 2021-09-17

### Added
- `areLinked()` method added to `LinkedHierarchy`.
- `unlinkDataItems()` method added to `LinkedHierarchy`.
- Global function `am5.disposeAllRootElements()` added. Disposes all charts.
- `am5.registry.rootElements` added which holds an array with instances of all active `Root` elements.
- `seriesGraphics` property added to `PictorialStackedSeries`. It's a `Graphics` which shows `svgPath` shape under all slices. Useful when `startLocation`/`endLocation` is used to make slices not occupy whole shape area.

### Changed
- `maxPanOut` of `MapChart` is temporarily disabled until we figure out proper behavior for it.

### Fixed
- Linking nodes with `linkDataItems` of `LinkedHierarchy` was not working if called after the data was set.
- `Micro` theme was not removing padding from charts.
- Adding in `@types/geojson` as a dependency.
- Map could jump to unpredictable position after the chart's container size changed and user zoomed or panned the map.
- In some cases `Label` with `oversizedBehavior = "fit"` could be incorrectly positioned.
- Removing series and axes from a serial chart was not working properly.


## [5.0.0-beta.17] - 2021-09-15

### Changed
- Default for `Treemap` setting `layoutAlgorithm` changed to `"squarify"`.
- Providing value in Hierarchy node's data will override sum of its children (except for `Pack`).

### Fixed
- `ForceDirected` nodes were linked to invisible top node even though `topDepth` was set to `1` meaning top node should not be visible. This was causing issues with the layout of such nodes.


## [5.0.0-beta.16] - 2021-09-14

### Fixed
- Fills for axis ranges could go out of plot area bounds.
- Tooltip of Y axis could be displayed out of bounds in some cases.


## [5.0.0-beta.15] - 2021-09-14

### Added
- `dynamic` setting added to `Bullet`, for the bullets that need their `sprite` element redrawn when related series changes in any way.
- `ClockHand` now supports negative radius value (distance from the target axis outer radius in pixels).
- `syncWithAxis` added to `ValueAxis`. If enabled, will sync grid between the axes.

### Changed
- If legend items container toggle key is set to `"none"`, clicking on the legend item will not do anything now.
- In `MapLineSeries`, if a data item had `pointsToConnect` set, map line now first looks at the point's longitude/latitude setting and then at the geometry.

### Fixed
- Play button was not chaning to default state instantly.
- Change of `curveFactory` of `LineSeries` was not forcing redraw of the series.
- `StepLineSeries` was not drawn properly when both X and Y axes were `ValueAxis`.
- `StepLineSeries` was not showing tooltip when it was set as a `snapToSeries` on chart Cursor.
- Theme rules now have the correct priority no matter where they are defined.


## [5.0.0-beta.14] - 2021-09-10

### Fixed
- `Scrollbar` grips' theme tags modified so that a correct color would be used.
- `XYCursor` with multiple entried in `snapToSeries` was causing multiple tooltips to show at all times.


## [5.0.0-beta.13] - 2021-09-09

### Added
- `Star` now supports inner radius set in percent.

### Fixed
- Tooltips for radar series were not show with `RadarCursor`.
- In some cases, Scrollbars were not being updated when zoomed-in with cursor.
- Clicking on scrollbar's background resulted in scrollbar animation, but the scrollbar did not update its axis.
- Dynamically changing `geoJSON` on a `MapSeries` was not working


## [5.0.0-beta.12] - 2021-09-08

### Added
- `AxisRendererCircular` now supports negative radius values.

### Changed
- When a template state is changed, it now automatically updates related `Entity`'s state as well.

### Fixed
- `LineSeries` was not working properly with `templateField` set on `strokes` or `fills`.
- `LineSeries` could stop drawing line while zooming if there were gaps in the data.


## [5.0.0-beta.11] - 2021-09-08

### Changed
- `fill` and `stroke` settings moved from `XYSeries` to `Series`, so that all series like `MapSeries` could be shown in Legend.
- Text of a tooltip text will now adaptively change color based on current background color.

### Fixed
- `"click"` event is no longer fired on right-click.
- Changing data dynamically on map-related series was not working properly.
- Switching projection on a zoomed-in/translated map was resulting in new map to be in a wrong position.


## [5.0.0-beta.10] - 2021-09-07

### Fixed
- A quick flash of chart position fixed (introduced in `5.0.0-beta.9`).
- MapChart.goHome() method fixed.


## [5.0.0-beta.9] - 2021-09-06

### Added
- `id` setting to all entities. If set, will also appear in `am5.registry.entitiesById`.
- `show()` and `hide()` methods of `DataItem` now accept duration param.

### Fixed
- Stacking of horizontal bars was not working properly.
- Children of a `Container` were not being disposed properly together with the container itself.
- Tooltip for a series close to the top/bottom of a plot area sometimes was not being displayed.
- `PieSeries` was overriding label `textType` setting.
- `XYChart` and `MapChart` were taking over mouse wheel action even when `wheelY` and `wheelX` were set to `"none"`.
- `XYCursor` was not showing series tooltips if Y axis was not a `ValueAxis`.
- `XYCursor` was showing previous data point tooltip if currently hovered position did not have data item or value was null.
- Percent chart could go to SO if there were no values in data.
- Changing `layer` value dynamically was not working properly.


## [5.0.0-beta.8] - 2021-09-02

### Added
- `deltaPosition` added to data item of a `CategoryAxis`. Can be used for sorting series columns without modifying data order.
- `resetExtremes()` method added to `XYSeries`. Resets series extremes to `undefined`. Can be used when values of a series are changed from outside.


## [5.0.0-beta.7] - 2021-08-31

### Added
- New `themeTagsSelf` setting for Entity which is the same as `themeTags` except it doesn't apply to the children.
- `clipBack` setting added to `MapLineSeries`.

### Changed
- Tooltips and Cursor are now `exportable: false` by default (meaning they won't be included in exported images).

### Fixed
- Sometimes plot container of an `XYChart` was not registering pointerout event.
- Accessibility: Not-measured items (e.g. columns) were not being properly outlined when focused.
- Zoom out button only zoomed out axes but not scrollbars.
- If a zoom out button was over columns or other interactive element, it was not working.
- `goHome()` method of `MapChart` was not working properly.
- Fixed fill style for `Scrollbar` grips.


## [5.0.0-beta.6] - 2021-08-29

### Fixed
- Hiding chart container or setting its width/height to zero was resulting in error.
- State setting values set in theme rules/templates were not being applied.
- Improved arrangement of multiple tooltips on a `XYChart`.
- Improved alignment of Legend labels improved.
- Huge numbers in `layer` setting were resulting in severe degration of performance.


## [5.0.0-beta.5] - 2021-08-27

### Fixed
- Fixed `RadarCursor` issues.


## [5.0.0-beta.4] - 2021-08-27

### Fixed
- Initial bugfixes.


## [5.0.0-beta.3] - 2021-08-25

### Fixed
- Initial bugfixes.


## [5.0.0-beta.2] - 2021-08-16

### Fixed
- Initial bugfixes.


## [5.0.0-beta.1] - 2021-08-13

### Added
- Initial preview release
