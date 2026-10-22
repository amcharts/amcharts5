# amCharts 5 for Svelte Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

Please note, that this project, while following numbering syntax, it DOES NOT
adhere to [Semantic Versioning](http://semver.org/spec/v2.0.0.html) rules.

## [UNRELEASED] - ????-??-??


## [5.0.1] - 2026-10-22

### Fixed
- README: SvelteKit's dev server needs `ssr.noExternal` for amCharts; the production build does not.


## [5.0.0] - 2026-10-22

### Added
- First release: `attachAmChart` for a chart written in code and `attachAmChartConfig` for a chart from a JSON config, as attachments (Svelte 5.29+) and as actions (`use:amChart`, `use:amChartConfig`).
