/** @ignore *//** */

import { geoMercator as d3_geoMercator, geoOrthographic as d3_geoOrthographic, geoEquirectangular as d3_geoEquirectangular, geoAlbersUsa as d3_geoAlbersUsa, geoEqualEarth as d3_geoEqualEarth, geoNaturalEarth1 as d3_geoNaturalEarth1 } from "d3-geo";
import { tagProjection } from "./MapChart";

/**
 * The bundled d3-geo projections, name-tagged so charts that use them can be
 * serialized back to a `projectionName`. These are re-exported by the `am5map`
 * entry point (e.g. `am5map.geoOrthographic()`).
 */
export const geoMercator = tagProjection("geoMercator", d3_geoMercator);
export const geoOrthographic = tagProjection("geoOrthographic", d3_geoOrthographic);
export const geoEquirectangular = tagProjection("geoEquirectangular", d3_geoEquirectangular);
export const geoAlbersUsa = tagProjection("geoAlbersUsa", d3_geoAlbersUsa);
export const geoEqualEarth = tagProjection("geoEqualEarth", d3_geoEqualEarth);
export const geoNaturalEarth1 = tagProjection("geoNaturalEarth1", d3_geoNaturalEarth1);
