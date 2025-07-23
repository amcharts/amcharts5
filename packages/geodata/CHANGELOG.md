# amCharts 5 Geo Data Changelog

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

Please note, that this project, while following numbering syntax, it DOES NOT
adhere to [Semantic Versioning](http://semver.org/spec/v2.0.0.html) rules.

## [5.1.5] - 2025-07-10

### Added
- New map of India: `india2023*`. Contains most recent updates.
- Congressional map set for US 119th Congress: `region/usa/congressional2025/*`.

### Changed
- Updated the name of North Macedonia in transaltion files.
- Updated Shannon county (South Dakota) name/FIPS to Oglala Lakota (FIPS 46102).
- Updated faulty code for Azores in `portugalRegions` map data.


## [5.1.4] - 2024-07-03

### Fixed
- Fixed names/ids in a new map of Algeria.


## [5.1.3] - 2024-06-03

### Added
- New map of Nepal: `nepal2020*`. Contains updated borders as per Nepal's guidance.

### Changed
- Map of Algeria updated for the most recent changes.

### Fixed
- Updated province names in the maps for Nepal (`nepalLow` and `nepalHigh`).


## [5.1.2] - 2023-12-07

### Added
- New map of Kazakhstan: `kazahkstan2023*`.
- New USA county maps to reflect changes in Alaska: `region/usa/ak2023*` and `region/usa/usaCounties2023*`.

### Changed
- Updated Hormozgan province name in the maps of Iran.

### Fixed
- Fixed the ID of the Dādra and Nagar Haveli and Damān and Diu province in India 2020 maps.


## [5.1.1] - 2023-06-01

### Added
- `spain2*` maps added. Same as `spain*`, except with off-shore islands misplaced so they show up close to the mainland.

### Changed
- Map of the Pakistan was updated to adhere to local requirements.

### Fixed
- Fixed IDs of lands in the map of Denmark.
- County maps of Mexico did not have their `name` property set properly.
- County maps of Canada did not have their `name` property set properly.


## [5.1.0] - 2022-12-07

### Changed
- Internal reorganization. No user-facing changes.


## [5.0.6] - 2022-10-19

### Fixed
- Fixed wrong ID for Wyoming's at large district in U.S. Congressional District maps.


## [5.0.5] - 2022-10-18

### Fixed
- Fixed duplicate IDs in U.S. Congressional District maps.


## [5.0.4] - 2022-10-18

### Added
- New maps: Mauritius.
- 2022 version of U.S. Congressional District maps (/region/usa/congressional2022).

### Changed
- Renamed "Turkey" to "Türkiye" in all maps.
- Saint Kitts and Nevis is now specified as belonging North America in `countries2` data file.

### Fixed
- Västernorrland and Västmanland had their places switched in the maps of Sweden.


## [5.0.3] - 2022-03-31

### Added
- New map: `regions/world/africaMorocco*` (Moroccan version of the map of Africa).
- New map: `latvia2021*` (updated in 2021 region map for Latvia).
- New map: Taiwan.
- New map: `spainProvinces2*` (same as `spainProvinces*` except with overseas territories moved close to mainland).
- New map: `franceDepartments2*` (mainland + overseas departments).

### Fixed
- Fixed area IDs in map of Slovenia.
- Fixed JSON syntax error in `ugandaLow.json`.
- Added some missing maps to `countries` and `countries2` data files.
- Fixed some name typos in the map of Hungary.
- Fixed names in the map of Chad.
- Fixed Morelos (Mexico) county map.


## [5.0.2] - 2021-09-24

### Added
- JSON versions of the geodata can now be found in the `json` folder.

### Changed
- Updated province IDs to recent changes in ISO in a map of South Africa.

### Fixed
- Fixed Svalbard map.
- Fixed Nigeria map.
- Fixed US Congressional maps: Alabama, Florida, Maine, Maryland, Massachusetts, New Jersey, Michigan, Rhode Island, Virginia, Washington.
- Fixed type errors with `GeoJSON`.


## [5.0.1] - 2021-08-25

### Changed
- Version bump.


## [5.0.0] - 2021-08-20

### Added
- Initial release.
