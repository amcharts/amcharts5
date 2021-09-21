# amCharts 5 Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

Please note, that this project, while following numbering syntax, it DOES NOT
adhere to [Semantic Versioning](http://semver.org/spec/v2.0.0.html) rules.

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
