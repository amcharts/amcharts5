# amCharts 5 for Svelte Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

Please note, that this project, while following numbering syntax, it DOES NOT
adhere to [Semantic Versioning](http://semver.org/spec/v2.0.0.html) rules.

## [UNRELEASED] - ????-??-??

### Added
- `themes`: a theme can come with its settings, e.g. `[am5themes_Adaptive, { baseColor: "#4150a0" }]`.
- `resources`: the geodata and locales a config names, e.g. `{ am5geodata_worldLow }`, which are not globals with npm imports.

### Changed
- Needs amCharts 5.21.4 or later.


## [5.0.2] - 2026-10-22

### Fixed
- Homepage and README link to the SvelteKit docs page at its new URL.


## [5.0.1] - 2026-10-22

### Fixed
- README: SvelteKit's dev server needs `ssr.noExternal` for amCharts; the production build does not.


## [5.0.0] - 2026-10-22

### Added
- First release: `attachAmChart` for a chart written in code and `attachAmChartConfig` for a chart from a JSON config, as attachments (Svelte 5.29+) and as actions (`use:amChart`, `use:amChartConfig`).
