# Images of the Earth, the Moon and planets for MapRasterSeries

Whole-body images in equirectangular projection (longitude -180 to 180 left to right, with 0 in the middle and east to the right; latitude 90 to -90 top to bottom), ready for `am5map.MapRasterSeries`:

| File | Size | Shows |
|---|---|---|
| `earthDay1024.jpg` | 1024 x 512, 93 KB | Earth by day, July |
| `earthDay2048.jpg` | 2048 x 1024, 302 KB | Earth by day, July |
| `earthDay4096.jpg` | 4096 x 2048, 1020 KB | Earth by day, July |
| `earthNight1024.jpg` | 1024 x 512, 39 KB | Earth at night (city lights) |
| `earthNight2048.jpg` | 2048 x 1024, 127 KB | Earth at night (city lights) |
| `earthNight4096.jpg` | 4096 x 2048, 443 KB | Earth at night (city lights) |
| `moon1024.jpg` | 1024 x 512, 96 KB | The Moon |
| `moon2048.jpg` | 2048 x 1024, 370 KB | The Moon |
| `moon4096.jpg` | 4096 x 2048, 1400 KB | The Moon |
| `mars1024.jpg` | 1024 x 512, 125 KB | Mars |
| `mars2048.jpg` | 2048 x 1024, 515 KB | Mars |
| `mars4096.jpg` | 4096 x 2048, 1959 KB | Mars |
| `venus1024.jpg` | 1024 x 512, 172 KB | Venus, surface by radar |
| `venus2048.jpg` | 2048 x 1024, 675 KB | Venus, surface by radar |
| `venus4096.jpg` | 4096 x 2048, 2470 KB | Venus, surface by radar |
| `jupiter1024.jpg` | 1024 x 512, 80 KB | Jupiter, December 2000 |
| `jupiter2048.jpg` | 2048 x 1024, 250 KB | Jupiter, December 2000 |
| `io1024.jpg` | 1024 x 512, 92 KB | Io, a moon of Jupiter |
| `io2048.jpg` | 2048 x 1024, 293 KB | Io, a moon of Jupiter |
| `io4096.jpg` | 4096 x 2048, 910 KB | Io, a moon of Jupiter |
| `ganymede1024.jpg` | 1024 x 512, 98 KB | Ganymede, a moon of Jupiter |
| `ganymede2048.jpg` | 2048 x 1024, 380 KB | Ganymede, a moon of Jupiter |
| `ganymede4096.jpg` | 4096 x 2048, 1467 KB | Ganymede, a moon of Jupiter |

Use the 1024 images for small charts, the 2048 ones for most charts and phones, and the 4096 ones for large charts and zooming in. 4096 is the largest texture many phones accept, and a 4096 image takes 32 MB of memory once decoded. Jupiter has no 4096 image: its source is not that detailed.

## Using them

From the CDN, next to the geodata:

```js
chart.series.push(am5map.MapRasterSeries.new(root, {
  src: "https://cdn.amcharts.com/lib/5/geodata/images/earthDay2048.jpg"
}));
```

With a bundler (webpack 5, Vite and similar turn an image import into its URL):

```ts
import moon from "@amcharts/amcharts5-geodata/images/moon2048.jpg";

chart.series.push(am5map.MapRasterSeries.new(root, { src: moon }));
```

Wherever the images are hosted, the server must allow cross-origin reads (`Access-Control-Allow-Origin`) when the page is on another domain: the series reads the image's pixels, which browsers refuse for a cross-origin image without that header.

The images show the surface only. For a body's day and night, add a `NightSeries` with `sunPosition` set to the point where its sun is overhead: `sunDate` works out that point for the Earth only.

## Credit

All the images are works of NASA, JPL or the US Geological Survey (USGS), and are in the public domain: they may be used freely, in commercial products too, as long as the use does not suggest that NASA or USGS endorses the product. Credit is appreciated, not required.

Each was resized to 1024, 2048 and 4096 pixels wide (Lanczos, JPEG quality 85). NASA's media usage guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/

### Earth

The Earth images are from NASA's Earth Observatory. Credit, if you give it:

> Imagery: NASA Earth Observatory

- Day: "Blue Marble: Next Generation with Topography and Bathymetry", July 2004, `world.topo.bathy.200407.3x5400x2700.jpg`, NASA Earth Observatory.
  https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry
- Night: "Earth at Night (Black Marble)", 2016 color map, `BlackMarble_2016_3km.jpg` (13500 x 6750), NASA Earth Observatory.
  https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps

### Moon

"CGI Moon Kit", 2019 color map `lroc_color_poles_8k.tif` (8192 x 4096), from the Lunar Reconnaissance Orbiter's camera. NASA's Scientific Visualization Studio says the map is made to look right, not for science.

> NASA's Scientific Visualization Studio

https://svs.gsfc.nasa.gov/4720

### Mars

"Mars Viking Colorized Global Mosaic" (MDIM 2.1), `mars_viking_mdim21_clrmosaic_1km.jpg` (21339 x 10670). Viking Orbiter images; the colors are approximate.

> USGS Astrogeology Science Center; NASA Ames Research Center

https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m

### Venus

"Venus Magellan Global C3-MDIR Synthetic Color Mosaic", `Venus_Magellan_C3-MDIR_Colorized_Global_Mosaic_4641m.tif` (8192 x 4096). Venus is covered by clouds: this is its surface as Magellan's radar saw it, with colors that simulate the surface. The streaks near the north pole fill gaps in the radar data.

> USGS Astrogeology Science Center; PDS Geosciences Node

https://astrogeology.usgs.gov/search/map/venus_magellan_global_c3_mdir_synthetic_color_mosaic_4641m

### Jupiter

"Cassini's Best Maps of Jupiter", cylindrical map PIA07782 (3601 x 1801), from Cassini images of December 2000. Jupiter's clouds move, so the map shows them as they were then. JPL's image use policy allows any use without permission.

> NASA/JPL/Space Science Institute

https://science.nasa.gov/photojournal/cassinis-best-maps-of-jupiter-cylindrical-map/

### Io

"Io Galileo SSI / Voyager Color Merged Global Mosaic", `Io_GalileoSSI-Voyager_Global_Mosaic_ClrMerge_1km.tif` (11445 x 5723).

> USGS Astrogeology Science Center; NASA Planetary Data System

https://astrogeology.usgs.gov/search/map/io_galileo_ssi_voyager_color_merged_global_mosaic_1km

### Ganymede

"Ganymede Voyager - Galileo SSI Color Global Mosaic", `Ganymede_Voyager_GalileoSSI_Global_ClrMosaic_1435m.tif` (11520 x 5760). The source runs from 0 to 360 degrees; it was turned so 0 is in the middle, and the black areas near the poles, where there is no data, were filled with the average color of their row.

> USGS Astrogeology Science Center

https://astrogeology.usgs.gov/search/map/ganymede_voyager_galileo_ssi_color_global_mosaic_1_4km
