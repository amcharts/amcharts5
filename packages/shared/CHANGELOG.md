# amCharts 5 Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

Please note, that this project, while following numbering syntax, it DOES NOT
adhere to [Semantic Versioning](http://semver.org/spec/v2.0.0.html) rules.

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
