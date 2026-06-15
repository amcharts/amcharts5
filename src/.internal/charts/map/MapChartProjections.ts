/** @ignore *//** */

/**
 * Side-effect-only module that registers the bundled d3-geo projections so they
 * can be referenced by name via `MapChart`'s `projectionName` setting.
 *
 * This is imported lazily by the JSON config loader, so the projections are only
 * pulled into the bundle when JSON (or this module) is actually used — keeping
 * them out of the bundle for code-only consumers that set `projection` directly.
 */

import { projectionRegistry } from "./MapChart";
import { geoMercator, geoOrthographic, geoEquirectangular, geoAlbersUsa, geoEqualEarth, geoNaturalEarth1 } from "./MapProjections";

// Register the same name-tagged factories that `am5map` exports, so there is a
// single tagging path shared between the public exports and the registry.
projectionRegistry["geoMercator"] = geoMercator;
projectionRegistry["geoOrthographic"] = geoOrthographic;
projectionRegistry["geoEquirectangular"] = geoEquirectangular;
projectionRegistry["geoAlbersUsa"] = geoAlbersUsa;
projectionRegistry["geoEqualEarth"] = geoEqualEarth;
projectionRegistry["geoNaturalEarth1"] = geoNaturalEarth1;
