export { GraticuleSeries, IGraticuleSeriesSettings, IGraticuleSeriesDataItem, IGraticuleSeriesPrivate } from "./.internal/charts/map/GraticuleSeries";
export { MapChart, IMapChartSettings, IMapChartEvents, IMapChartPrivate, projectionRegistry, registerProjection } from "./.internal/charts/map/MapChart";
export { MapLine, IMapLineSettings, IMapLinePrivate } from "./.internal/charts/map/MapLine";
export { MapLineSeries, IMapLineSeriesSettings, IMapLineSeriesDataItem, IMapLineSeriesPrivate } from "./.internal/charts/map/MapLineSeries";
export { MapPointSeries, IMapPointSeriesSettings, IMapPointSeriesDataItem, IMapPointSeriesPrivate } from "./.internal/charts/map/MapPointSeries";
export { MapPolygon, IMapPolygonSettings, IMapPolygonPrivate } from "./.internal/charts/map/MapPolygon";
export { MapPolygonSeries, IMapPolygonSeriesSettings, IMapPolygonSeriesDataItem, IMapPolygonSeriesPrivate } from "./.internal/charts/map/MapPolygonSeries";
export { ClusteredPointSeries, IClusteredPointSeriesSettings, IClusteredPointSeriesDataItem, IClusteredPointSeriesPrivate } from "./.internal/charts/map/ClusteredPointSeries";
export { MapSankeyNodes, IMapSankeyNodesSettings, IMapSankeyNodesDataItem, IMapSankeyNodesPrivate, IMapSankeyNodesEvents } from "./.internal/charts/map/MapSankeyNodes";
export { MapSankeySeries, IMapSankeySeriesSettings, IMapSankeySeriesDataItem, IMapSankeySeriesPrivate, IBezierSegment } from "./.internal/charts/map/MapSankeySeries";
export { MapSeries, IMapSeriesSettings, IMapSeriesDataItem, IMapSeriesEvents, IMapSeriesPrivate } from "./.internal/charts/map/MapSeries";
export { ZoomControl, IZoomControlSettings, IZoomControlPrivate } from "./.internal/charts/map/ZoomControl";
export { getGeoRectangle, getGeoCircle, normalizeGeoPoint, getGeoCentroid, getGeoBounds, getGeoArea } from "./.internal/charts/map/MapUtils";

import { geoMercator as d3_geoMercator, geoOrthographic as d3_geoOrthographic, geoEquirectangular as d3_geoEquirectangular, geoAlbersUsa as d3_geoAlbersUsa, geoEqualEarth as d3_geoEqualEarth, geoNaturalEarth1 as d3_geoNaturalEarth1 } from "d3-geo";
import { registerProjection } from "./.internal/charts/map/MapChart";

// Register the bundled projections (so `projectionName` resolves whenever the map
// code is loaded, including script/CDN builds) and export the name-tagged
// factories (so charts that set `projection` directly still serialize back to a
// `projectionName`). registerProjection both registers and returns the tagged factory.
export const geoMercator = registerProjection("geoMercator", d3_geoMercator);
export const geoOrthographic = registerProjection("geoOrthographic", d3_geoOrthographic);
export const geoEquirectangular = registerProjection("geoEquirectangular", d3_geoEquirectangular);
export const geoAlbersUsa = registerProjection("geoAlbersUsa", d3_geoAlbersUsa);
export const geoEqualEarth = registerProjection("geoEqualEarth", d3_geoEqualEarth);
export const geoNaturalEarth1 = registerProjection("geoNaturalEarth1", d3_geoNaturalEarth1);

import { MapChartDefaultTheme } from "./.internal/charts/map/MapChartDefaultTheme";
export { MapChartDefaultTheme as DefaultTheme };