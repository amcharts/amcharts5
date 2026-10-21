import type { IGeoPoint } from "../../core/util/IGeoPoint";
import type { GeoProjection, GeoStream } from "d3-geo";
import { registry } from "../../core/Registry";
import * as $math from "../../core/util/Math";
import { geoCircle, geoCentroid, geoBounds, geoArea, geoPath, geoStream } from "d3-geo";


/**
 * Notes down which call produced a geometry, and with what, so that serializing
 * can write out those few numbers instead of every coordinate they expand to.
 *
 * The note is not enumerable, so it stays out of the geometry itself.
 *
 * @ignore
 */
export function describeGeometry<T extends object>(geometry: T, name: string, args: { [index: string]: any }): T {
	Object.defineProperty(geometry, "__geometry", {
		value: { name: name, args: args },
		enumerable: false,
		configurable: true
	});
	return geometry;
}

/**
 * Returns a circle on the globe as GeoJSON geometry, for the `geometry` of a
 * [[MapPolygon]].
 *
 * @param   geoPoint  Center
 * @param   radius    Radius in degrees of arc along the surface
 * @return            Polygon geometry
 */
export function getGeoCircle(geoPoint: IGeoPoint, radius: number): GeoJSON.Polygon {
	return describeGeometry(
		geoCircle().center([geoPoint.longitude, geoPoint.latitude]).radius(radius)(),
		"GeoCircle",
		{ geoPoint: geoPoint, radius: radius }
	);
}

/**
 * Returns the geographic centroid of a geometry.
 */
export function getGeoCentroid(geometry: GeoJSON.GeometryObject): IGeoPoint {
	const centroid = geoCentroid(geometry);
	return { longitude: centroid[0], latitude: centroid[1] };
}

/**
 * Returns the area of a geometry on a sphere of radius 1, in steradians: the
 * whole globe is 4π.
 */
export function getGeoArea(geometry: GeoJSON.GeometryObject): number {
	return geoArea(geometry);
}

/**
 * Returns the geographic bounds of a geometry, in degrees: longitudes `left`
 * and `right`, latitudes `top` and `bottom`. Bounds across the 180th meridian
 * take all longitudes, `-180` to `180`.
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
 * Returns the area between two latitudes and two longitudes as GeoJSON
 * geometry, for the `geometry` of a [[MapPolygon]]. Its edges follow the
 * parallels and meridians.
 *
 * @param   north  North latitude
 * @param   east   East longitude
 * @param   south  South latitude
 * @param   west   West longitude
 * @return         Polygon geometry
 */
export function getGeoRectangle(north: number, east: number, south: number, west: number): GeoJSON.MultiPolygon {

	// What was asked for, before the clamping below pulls the edges inside the
	// range a projection can draw - so a serialized rectangle reads as the one
	// that was requested
	const asked = { north: north, east: east, south: south, west: west };

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

	return describeGeometry({ type: "MultiPolygon", coordinates: multiPolygon }, "GeoRectangle", asked);
}

/**
 * Brings a point's longitude within `-180` to `180` and its latitude within
 * `-90` to `90`: a latitude past a pole comes back down on the other side.
 * Changes `geoPoint` itself and returns it.
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
 * Returns the point where the sun is directly overhead at a given time, such
 * as for the `sunPosition` of a [[MapRasterSeries]]. Accurate to a fraction
 * of a degree.
 *
 * @param   date  Time (default: now)
 * @return        The point
 * @since 5.21.0
 */
export function getSunPosition(date: Date = new Date()): IGeoPoint {
	const dayOfYear = (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000;
	const angle = 2 * Math.PI / 365;

	// Over a year the sun moves between the Tropic of Cancer and the Tropic of Capricorn
	const latitude = -Math.asin(0.39779 * Math.cos(angle * (dayOfYear + 10) + 0.0334 * Math.sin(angle * (dayOfYear - 2)))) * $math.DEGREES;

	// 15 degrees west every hour; the equation of time (minutes) corrects for Earth's tilted, elliptical orbit
	const b = angle * (dayOfYear - 81);
	const equationOfTime = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
	const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600 + equationOfTime / 60;

	return normalizeGeoPoint({ longitude: -15 * (hours - 12), latitude: latitude });
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

/**
 * Earth's mean radius in metres, which altitudes in metres are measured
 * against when drawn.
 *
 * @ignore
 */
export const EARTH_RADIUS = 6371008.8;

/**
 * Whether a projection shows a globe: clipped at 90 degrees, which amCharts
 * sets at a hair over 90, or less.
 *
 * @ignore
 */
export function isGlobe(projection: GeoProjection): boolean {
	const clipAngle = projection.clipAngle ? projection.clipAngle() : 0;
	return !!clipAngle && clipAngle < 90.5 && !!projection.rotate;
}

const noopStream: GeoStream = {
	point() { },
	lineStart() { },
	lineEnd() { },
	polygonStart() { },
	polygonEnd() { },
	sphere() { }
};

/**
 * Whether a projection draws an outline of its own, as HEALPix, Armadillo,
 * Berghaus and the interrupted and polyhedral projections of
 * d3-geo-projection do. d3 does not cut shapes to such an outline, so parts
 * of them land outside it.
 *
 * Composite projections such as `geoAlbersUsa` already clip their insets.
 *
 * @ignore
 */
export function hasOwnOutline(projection: GeoProjection): boolean {
	if (!projection.rotate) {
		return false;
	}
	return Object.prototype.hasOwnProperty.call(projection.stream(noopStream), "sphere");
}

/**
 * Whether the projection draws `point` rather than clipping it away, as a
 * globe does with its far side.
 *
 * @ignore
 */
export function isPointVisible(projection: GeoProjection, point: [number, number]): boolean {
	if (!isFinite(point[0]) || !isFinite(point[1])) {
		return false;
	}
	let visible = false;
	const sink: GeoStream = Object.create(noopStream);
	sink.point = () => { visible = true; };
	geoStream({ type: "Point", coordinates: point }, projection.stream(sink));
	return visible;
}

/**
 * `bounds` cut to the projection's own outline, if it has one: nothing outside
 * it is drawn.
 *
 * @ignore
 */
export function boundsInOutline(projection: GeoProjection, bounds: [[number, number], [number, number]]): [[number, number], [number, number]] {
	if (hasOwnOutline(projection)) {
		const outline = geoPath(projection).bounds({ type: "Sphere" });
		const x0 = Math.max(bounds[0][0], outline[0][0]);
		const y0 = Math.max(bounds[0][1], outline[0][1]);
		const x1 = Math.min(bounds[1][0], outline[1][0]);
		const y1 = Math.min(bounds[1][1], outline[1][1]);
		if (x0 < x1 && y0 < y1) {
			return [[x0, y0], [x1, y1]];
		}
	}
	return bounds;
}

/**
 * `projection.fitSize()`, but on a projection with an outline of its own it
 * fits only the part of `object` inside that outline.
 *
 * @ignore
 */
export function fitProjection(projection: GeoProjection, size: [number, number], object: GeoJSON.GeometryCollection): void {
	projection.fitSize(size, object);
	if (hasOwnOutline(projection)) {
		const b = boundsInOutline(projection, geoPath(projection).bounds(object));
		const k = Math.min(size[0] / (b[1][0] - b[0][0]), size[1] / (b[1][1] - b[0][1]));
		if (isFinite(k) && k > 0) {
			const translate = projection.translate();
			projection.scale(projection.scale() * k);
			projection.translate([
				size[0] / 2 - k * ((b[0][0] + b[1][0]) / 2 - translate[0]),
				size[1] / 2 - k * ((b[0][1] + b[1][1]) / 2 - translate[1])
			]);
		}
	}
}

/**
 * Where a point raised above the surface appears on screen.
 *
 * `altitude` is in metres above the ground. On a globe (a projection
 * clipped at 90 degrees or less) the point rises away from the globe's center:
 * `far` says it is on the far side, and `hidden` that the globe also covers it,
 * which a far point high enough to show past the edge is not. On flat maps it
 * rises up the screen by the same measure.
 *
 * @ignore
 */
export function projectAltitude(projection: GeoProjection, longitude: number, latitude: number, altitude: number): { x: number, y: number, far: boolean, hidden: boolean } | undefined {
	return altitudeProjector(projection)(longitude, latitude, altitude);
}

/**
 * [[projectAltitude]] for many points in the same view: the projection is
 * read once, not for every point. With `skipHidden`, points the globe covers
 * come back `undefined` without being projected.
 *
 * @ignore
 */
export function altitudeProjector(projection: GeoProjection, skipHidden: boolean = false): (longitude: number, latitude: number, altitude: number) => { x: number, y: number, far: boolean, hidden: boolean } | undefined {
	const scale = projection.scale();

	if (!isGlobe(projection)) {
		return (longitude, latitude, altitude) => {
			const xy = projection([longitude, latitude]);
			if (!xy || !isFinite(xy[0]) || !isFinite(xy[1])) {
				return;
			}
			return { x: xy[0], y: xy[1] - altitude / EARTH_RADIUS * scale, far: false, hidden: false };
		};
	}

	const clipAngle = projection.clipAngle ? projection.clipAngle() : 0;
	const translate = projection.translate();
	const tx = translate[0];
	const ty = translate[1];
	const rotation = projection.rotate();
	const centerLon = -rotation[0] * $math.RADIANS;
	const centerLat = -rotation[1] * $math.RADIANS;
	const sinCenterLat = Math.sin(centerLat);
	const cosCenterLat = Math.cos(centerLat);
	const limit = Math.cos((clipAngle || 90) * $math.RADIANS);

	// The point's direction against the view's center
	const facingOf = (lon: number, lat: number) => Math.cos(lat) * cosCenterLat * Math.cos(lon - centerLon) + Math.sin(lat) * sinCenterLat;

	// Skipping relies on an orthographic globe, where a point at angle a from
	// the center shows at scale * sin(a): checked on a point 60 degrees east of it
	let skip = false;
	if (skipHidden) {
		const probeLon = centerLon + 60 * $math.RADIANS;
		const facing = facingOf(probeLon, centerLat);
		const xy = projection([probeLon / $math.RADIANS, centerLat / $math.RADIANS]);
		if (xy) {
			const r = Math.sqrt((xy[0] - tx) * (xy[0] - tx) + (xy[1] - ty) * (xy[1] - ty));
			skip = Math.abs(r - scale * Math.sqrt(1 - facing * facing)) < 0.001 * scale;
		}
	}

	return (longitude, latitude, altitude) => {
		const lift = altitude / EARTH_RADIUS;
		const facing = facingOf(longitude * $math.RADIANS, latitude * $math.RADIANS);
		const far = facing < limit;

		// Behind the globe and too low to show past its edge
		if (skip && far && (1 - facing * facing) * (1 + lift) * (1 + lift) < 1) {
			return;
		}

		const xy = projection([longitude, latitude]);
		if (!xy || !isFinite(xy[0]) || !isFinite(xy[1])) {
			return;
		}
		const x = tx + (xy[0] - tx) * (1 + lift);
		const y = ty + (xy[1] - ty) * (1 + lift);
		const dx = x - tx;
		const dy = y - ty;
		return { x, y, far, hidden: far && dx * dx + dy * dy < scale * scale };
	};
}

// Lets a config store a shape as the call that made it - the JSON plugin looks
// these up by name rather than importing the map module
registry.geometryFunctions["GeoRectangle"] = (args: any) => getGeoRectangle(args.north, args.east, args.south, args.west);
registry.geometryFunctions["GeoCircle"] = (args: any) => getGeoCircle(args.geoPoint, args.radius);
