# amCharts 5 Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

Please note, that this project, while following numbering syntax, it DOES NOT
adhere to [Semantic Versioning](http://semver.org/spec/v2.0.0.html) rules.

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
