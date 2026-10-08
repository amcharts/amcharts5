# World images for MapRasterSeries

Whole-world images in equirectangular projection (longitude -180 to 180 left to right, latitude 90 to -90 top to bottom), ready for `am5map.MapRasterSeries`:

| File | Size | Shows |
|---|---|---|
| `earthDay2048.jpg` | 2048 x 1024, 302 KB | Earth by day, July |
| `earthDay4096.jpg` | 4096 x 2048, 1020 KB | Earth by day, July |
| `earthNight2048.jpg` | 2048 x 1024, 127 KB | Earth at night (city lights) |
| `earthNight4096.jpg` | 4096 x 2048, 443 KB | Earth at night (city lights) |

Use the 2048 images for phones and small charts, the 4096 ones for large charts and zooming in. 4096 is the largest texture many phones accept, and a 4096 image takes 32 MB of memory once decoded.

## Using them

From the CDN, next to the geodata:

```js
chart.series.push(am5map.MapRasterSeries.new(root, {
  src: "https://cdn.amcharts.com/lib/5/geodata/images/earthDay2048.jpg"
}));
```

With a bundler (webpack 5, Vite and similar turn an image import into its URL):

```ts
import earthDay from "@amcharts/amcharts5-geodata/images/earthDay2048.jpg";

chart.series.push(am5map.MapRasterSeries.new(root, { src: earthDay }));
```

Wherever the images are hosted, the server must allow cross-origin reads (`Access-Control-Allow-Origin`) when the page is on another domain: the series reads the image's pixels, which browsers refuse for a cross-origin image without that header.

## Credit

Both images are from NASA's Earth Observatory. NASA images are generally not subject to copyright in the United States and may be used in commercial products, as long as the use does not suggest that NASA endorses the product. NASA asks to be credited as the source, e.g.:

> Imagery: NASA Earth Observatory

Sources, resized to 2048 and 4096 pixels wide (Lanczos, JPEG quality 85):

- Day: "Blue Marble: Next Generation with Topography and Bathymetry", July 2004, `world.topo.bathy.200407.3x5400x2700.jpg`, NASA Earth Observatory.
  https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry
- Night: "Earth at Night (Black Marble)", 2016 color map, `BlackMarble_2016_3km.jpg` (13500 x 6750), NASA Earth Observatory.
  https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps
- NASA's media usage guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/
