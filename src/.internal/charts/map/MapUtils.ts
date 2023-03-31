import type { IGeoPoint } from "../../core/util/IGeoPoint";
import * as $math from "../../core/util/Math";
import { geoCircle, geoCentroid, geoBounds, geoArea } from "d3-geo";

/**
 * Returns a GeoJSON representation of a circle, suitable for use as `geometry` value
 * in a [[MapPolygon]] in a [[MapPolygonSeries]].
 * 
 * @param   geoPoint  Coordinates
 * @param   radius    Circle radius in degrees
 * @return            Polygon geometry
 */
export function getGeoCircle(geoPoint: IGeoPoint, radius: number): GeoJSON.Polygon {
	return geoCircle().center([geoPoint.longitude, geoPoint.latitude]).radius(radius)();
}

/**
 * Returns geo centroid of a geometry
 */
export function getGeoCentroid(geometry: GeoJSON.GeometryObject): IGeoPoint {
	const centroid = geoCentroid(geometry);
	return { longitude: centroid[0], latitude: centroid[1] };
}

/**
 * Returns geo area of a geometry
 */
export function getGeoArea(geometry: GeoJSON.GeometryObject): number {
	return geoArea(geometry);
}

/**
 * Returns bounds of a geometry
 */
export function getGeoBounds(geometry: GeoJSON.GeometryObject): { left: number, right: number, top: number, bottom: number } {
	const bounds = geoBounds(geometry);

	if (bounds) {
		const geoBounds = { left: bounds[0][0], right: bounds[1][0], top: bounds[1][1], bottom: bounds[0][1] };
		if (geoBounds.right < geoBounds.left) {
			geoBounds.right = 180;
			geoBounds.left = -180;
		}
		return geoBounds;
	}
	return { left: 0, right: 0, top: 0, bottom: 0 };
}

/**
 * Returns a GeoJSON representation of a rectangle, suitable for use
 * as `geometry` value in a [[MapPolygon]] in a [[MapPolygonSeries]].
 * 
 * @param   north  North latitude
 * @param   east   East longitude
 * @param   south  South latitude
 * @param   west   West longitude
 * @return         polygon geometry
 */
export function getGeoRectangle(north: number, east: number, south: number, west: number): GeoJSON.MultiPolygon {

	let multiPolygon: Array<Array<Array<[number, number]>>> = [];

	if (west <= -180) {
		west = -179.9999;
	}
	if (south <= -90) {
		south = -89.9999;
	}
	if (north >= 90) {
		north = 89.9999;
	}
	if (east >= 180) {
		east = 179.9999;
	}


	let stepLong = Math.min(90, (east - west) / Math.ceil((east - west) / 90));
	let stepLat = (north - south) / Math.ceil((north - south) / 90);

	for (let ln = west; ln < east; ln = ln + stepLong) {
		let surface: Array<[number, number]> = [];
		multiPolygon.push([surface]);

		if (ln + stepLong > east) {
			stepLong = east - ln;
		}

		for (let ll = ln; ll <= ln + stepLong; ll = ll + 5) {
			surface.push([ll, north]);
		}

		for (let lt = north; lt >= south; lt = lt - stepLat) {
			surface.push([ln + stepLong, lt]);
		}

		for (let ll = ln + stepLong; ll >= ln; ll = ll - 5) {
			surface.push([ll, south]);
		}

		for (let lt = south; lt <= north; lt = lt + stepLat) {
			surface.push([ln, lt]);
		}
	}

	return { type: "MultiPolygon", coordinates: multiPolygon };
}

/**
 * Update longitudes and latitudes that wrap around -180/180 and -90/90 values.
 * 
 * @param   geoPoint  Input coordinates
 * @return            Updated coordinates
 */
export function normalizeGeoPoint(geoPoint: IGeoPoint): IGeoPoint {
	let longitude = wrapAngleTo180(geoPoint.longitude);
	let latitude = Math.asin(Math.sin((geoPoint.latitude * $math.RADIANS))) * $math.DEGREES;

	let latitude180 = wrapAngleTo180(geoPoint.latitude);

	if (Math.abs(latitude180) > 90) {
		longitude = wrapAngleTo180(longitude + 180);
	}

	geoPoint.longitude = longitude;
	geoPoint.latitude = latitude;

	return geoPoint;
}

/**
 * @ignore
 */
export function wrapAngleTo180(angle: number): number {
	angle = angle % 360;

	if (angle > 180) {
		angle -= 360;
	}
	if (angle < -180) {
		angle += 360;
	}

	return angle;
}