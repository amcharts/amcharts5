import type { IPoint } from "./IPoint";
import { isNumber } from "./Type";
import type { IBounds } from "./IBounds";

/**
 * ============================================================================
 * CONSTANTS
 * ============================================================================
 * @hidden
 */
export const PI = Math.PI;
export const HALFPI = PI / 2;
export const RADIANS = PI / 180;
export const DEGREES = 180 / PI;

/**
 * Rounds the numeric value to whole number or specific precision of set.
 *
 * @param value      Value
 * @param precision  Precision (number of decimal points)
 * @param floor  In case value ends with 0.5 and precision is 0, we might need to floor the value instead of ceiling it.
 * @return Rounded value
 */
export function round(value: number, precision?: number, floor?: boolean): number {
	if (!isNumber(precision) || precision <= 0) {

		let rounded = Math.round(value);
		if (floor) {
			if (rounded - value == 0.5) {
				rounded--;
			}
		}
		return rounded;
	}
	else {
		let d: number = Math.pow(10, precision);
		return Math.round(value * d) / d;
	}
}


/**
 * Ceils the numeric value to whole number or specific precision of set.
 *
 * @param value      Value
 * @param precision  Precision (number of decimal points)
 * @return Rounded value
 */
export function ceil(value: number, precision: number): number {
	if (!isNumber(precision) || precision <= 0) {
		return Math.ceil(value);
	}
	else {
		let d: number = Math.pow(10, precision);
		return Math.ceil(value * d) / d;
	}
}


/**
 * Returns the first control point for a cubic bezier spline segment
 * interpolating through three consecutive points with the given tension.
 *
 * @ignore
 * @param p0        Previous point
 * @param p1        Current point
 * @param p2        Next point
 * @param tensionX  Horizontal tension (0–1)
 * @param tensionY  Vertical tension (0–1)
 * @return          First control point
 */
export function getCubicControlPointA(p0: IPoint, p1: IPoint, p2: IPoint, tensionX: number, tensionY: number): IPoint {
	return { x: ((-p0.x + p1.x / tensionX + p2.x) * tensionX), y: ((-p0.y + p1.y / tensionY + p2.y) * tensionY) };
}

/**
 * Returns the second control point for a cubic bezier spline segment
 * interpolating through three consecutive points with the given tension.
 *
 * @ignore
 * @param p1        Current point
 * @param p2        Next point
 * @param p3        Point after next
 * @param tensionX  Horizontal tension (0–1)
 * @param tensionY  Vertical tension (0–1)
 * @return          Second control point
 */
export function getCubicControlPointB(p1: IPoint, p2: IPoint, p3: IPoint, tensionX: number, tensionY: number): IPoint {
	return { x: ((p1.x + p2.x / tensionX - p3.x) * tensionX), y: ((p1.y + p2.y / tensionY - p3.y) * tensionY) };
}

/**
 * Clamps a value to the given [min, max] range.
 *
 * @param value  Value to clamp
 * @param min    Minimum
 * @param max    Maximum
 * @return       Clamped value
 */
export function fitToRange(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Returns sine of an angle specified in degrees.
 *
 * @param value  Value
 * @return Sine
 */
export function sin(angle: number): number {
	return Math.sin(RADIANS * angle);
}

/**
 * Returns tan of an angle specified in degrees.
 *
 * @param value  Value
 * @return Sine
 */
export function tan(angle: number): number {
	return Math.tan(RADIANS * angle);
}

/**
 * Returns cosine of an angle specified in degrees.
 *
 * @param value  Value
 * @return Cosine
 */
export function cos(angle: number): number {
	return Math.cos(RADIANS * angle);
}

/**
 * Normalizes an angle to the 0–360 range.
 *
 * @param value  Angle in degrees
 * @return       Normalized angle (0–360)
 */
export function normalizeAngle(value: number): number {
	value = value % 360;
	if (value < 0) {
		value += 360;
	}
	return value;
}

/**
 * Returns the bounding box of a circular arc.
 *
 * @param cx          Center X
 * @param cy          Center Y
 * @param startAngle  Start angle in degrees
 * @param endAngle    End angle in degrees
 * @param radius      Arc radius
 * @return            Bounding box
 */
export function getArcBounds(cx: number, cy: number, startAngle: number, endAngle: number, radius: number): IBounds {

	let minX = Number.MAX_VALUE;
	let minY = Number.MAX_VALUE;
	let maxX = -Number.MAX_VALUE;
	let maxY = -Number.MAX_VALUE;

	let bpoints = [];

	bpoints.push(getArcPoint(radius, startAngle));
	bpoints.push(getArcPoint(radius, endAngle));

	let fromAngle = Math.min(Math.floor(startAngle / 90) * 90, Math.floor(endAngle / 90) * 90);
	let toAngle = Math.max(Math.ceil(startAngle / 90) * 90, Math.ceil(endAngle / 90) * 90);

	for (let angle = fromAngle; angle <= toAngle; angle += 90) {
		if (angle >= startAngle && angle <= endAngle) {
			bpoints.push(getArcPoint(radius, angle));
		}
	}

	for (let i = 0; i < bpoints.length; i++) {
		let pt = bpoints[i];
		if (pt.x < minX) { minX = pt.x; }
		if (pt.y < minY) { minY = pt.y; }
		if (pt.x > maxX) { maxX = pt.x; }
		if (pt.y > maxY) { maxY = pt.y; }
	}

	return ({ left: cx + minX, top: cy + minY, right: cx + maxX, bottom: cy + maxY });
}

/**
 * Returns a point on a circle at the given angle.
 *
 * @param radius  Circle radius
 * @param arc     Angle in degrees
 * @return        Point on the arc
 */
export function getArcPoint(radius: number, arc: number) {
	return ({ x: radius * cos(arc), y: radius * sin(arc) });
}


/**
 * Merges an array of bounds into a single bounding box that encompasses all of them.
 *
 * @param bounds  Array of bounds to merge
 * @return        Combined bounding box
 */
export function mergeBounds(bounds: IBounds[]): IBounds {
	const len = bounds.length;

	if (len > 0) {
		let bound = bounds[0];
		let left = bound.left;
		let top = bound.top;
		let right = bound.right;
		let bottom = bound.bottom;

		if (len > 1) {
			for (let i = 1; i < len; i++) {
				bound = bounds[i];
				left = Math.min(bound.left, left);
				right = Math.max(bound.right, right);
				top = Math.min(bound.top, top);
				bottom = Math.max(bound.bottom, bottom);
			}
		}

		return { left, right, top, bottom };
	}
	return { left: 0, right: 0, top: 0, bottom: 0 };
}


/**
 * Fits an angle into the given start/end range, snapping to the
 * nearest boundary when the angle falls outside.
 *
 * @param value       Angle in degrees
 * @param startAngle  Range start in degrees
 * @param endAngle    Range end in degrees
 * @return            Angle clamped to the range
 */
export function fitAngleToRange(value: number, startAngle: number, endAngle: number): number {

	if (startAngle > endAngle) {
		let temp: number = startAngle;
		startAngle = endAngle;
		endAngle = temp;
	}

	value = normalizeAngle(value);

	let count = (startAngle - normalizeAngle(startAngle)) / 360;

	if (value < startAngle) {
		value += 360 * (count + 1);
	}

	let maxEnd: number = startAngle + (endAngle - startAngle) / 2 + 180;
	let maxStart: number = startAngle + (endAngle - startAngle) / 2 - 180;

	if (value > endAngle) {

		if (value - 360 > startAngle) {
			value -= 360;
		}
		else {
			if (value < maxEnd) {
				value = endAngle;
			}
			else {
				value = startAngle;
			}
		}
	}

	if (value < startAngle) {
		if (value > maxStart) {
			value = startAngle;
		}
		else {
			value = endAngle;
		}
	}

	return value;
}

/**
 * Returns `true` if a point is inside the given bounds (inclusive).
 *
 * @param point   Point to test
 * @param bounds  Bounding box
 * @return        Whether the point is inside
 */
export function inBounds(point: IPoint, bounds: IBounds) {
	if (point.x >= bounds.left && point.y >= bounds.top && point.x <= bounds.right && point.y <= bounds.bottom) {
		return true;
	}
	return false;
}

/**
 * Returns the angle in degrees from `point1` to `point2`.
 * If `point2` is omitted, uses double of `point1` coordinates.
 *
 * @param point1  Origin point
 * @param point2  Target point (optional)
 * @return        Angle in degrees (0–360)
 */
export function getAngle(point1: IPoint, point2?: IPoint): number {
	if (!point2) {
		point2 = { x: point1.x * 2, y: point1.y * 2 };
	}
	let diffX: number = point2.x - point1.x;
	let diffY: number = point2.y - point1.y;
	let angle: number = Math.atan2(diffY, diffX) * DEGREES;
	if (angle < 0) {
		angle += 360;
	}
	return normalizeAngle(angle);
}

/**
 * Returns a point on a quadratic bezier curve at the given position (0–1).
 *
 * @param pointA        Start point
 * @param pointB        End point
 * @param controlPoint  Control point
 * @param position      Relative position (0 = start, 1 = end)
 * @return              Point on the curve
 */
export function getPointOnQuadraticCurve(pointA: IPoint, pointB: IPoint, controlPoint: IPoint, position: number): IPoint {
	let x: number = (1 - position) * (1 - position) * pointA.x + 2 * (1 - position) * position * controlPoint.x + position * position * pointB.x;
	let y: number = (1 - position) * (1 - position) * pointA.y + 2 * (1 - position) * position * controlPoint.y + position * position * pointB.y;
	return { x: x, y: y };
}

/**
 * Returns a point on a cubic bezier curve at the given position (0–1).
 *
 * @param pointA         Start point
 * @param pointB         End point
 * @param controlPointA  First control point (near start)
 * @param controlPointB  Second control point (near end)
 * @param position       Relative position (0 = start, 1 = end)
 * @return               Point on the curve
 */
export function getPointOnCubicCurve(pointA: IPoint, pointB: IPoint, controlPointA: IPoint, controlPointB: IPoint, position: number): IPoint {
	let s = 1 - position;
	let x = s * s * s * pointA.x + 3 * s * s * position * controlPointA.x + 3 * s * position * position * controlPointB.x + position * position * position * pointB.x;
	let y = s * s * s * pointA.y + 3 * s * s * position * controlPointA.y + 3 * s * position * position * controlPointB.y + position * position * position * pointB.y;
	return { x: x, y: y };
}

/**
 * Returns a point at a relative position along a straight line between two points.
 *
 * @param pointA    Start point
 * @param pointB    End point
 * @param position  Relative position (0 = start, 1 = end)
 * @return          Point on the line
 */
export function getPointOnLine(pointA: IPoint, pointB: IPoint, position: number): IPoint {
	return { x: pointA.x + (pointB.x - pointA.x) * position, y: pointA.y + (pointB.y - pointA.y) * position };
}

/**
 * Given a normalized location (0–1) along a multi-segment path and an array
 * of cumulative segment lengths, returns which segment the location falls in
 * and the local parameter t within that segment.
 *
 * @param location           Relative position along the full path (0–1)
 * @param cumulativeLengths  Cumulative length at the end of each segment
 * @return                   Segment index and local t (0–1)
 */
export function resolveLocationOnPath(location: number, cumulativeLengths: number[]): { index: number; t: number } {
	const n = cumulativeLengths.length;
	if (n > 0) {
		const totalLength = cumulativeLengths[n - 1];
		const targetLength = location * totalLength;

		let index = 0;
		for (let i = 0; i < n; i++) {
			if (cumulativeLengths[i] >= targetLength) {
				index = i;
				break;
			}
		}

		const segStart = index > 0 ? cumulativeLengths[index - 1] : 0;
		const segLength = cumulativeLengths[index] - segStart;
		const t = segLength > 0 ? (targetLength - segStart) / segLength : 0;
		return { index, t };
	}
	return { index: 0, t: 0 };
}


/**
 * Returns the closest value from the array of values to the reference value.
 *
 * @param values  Array of values
 * @param value   Reference value
 * @return Closes value from the array
 */
export function closest(values: number[], referenceValue: number): number {
	return values.reduce(function(prev, curr) {
		return (Math.abs(curr - referenceValue) < Math.abs(prev - referenceValue) ? curr : prev);
	});
}

/**
 * Returns true if bounds overlap
 * @param bounds1 IBounds
 * @param bounds2 IBounds
 * @returns boolean
 */
export function boundsOverlap(bounds1: IBounds, bounds2: IBounds): boolean {
	const horizontalOverlap = bounds1.left < bounds2.right && bounds1.right > bounds2.left;
	const verticalOverlap = bounds1.top < bounds2.bottom && bounds1.bottom > bounds2.top;
	return horizontalOverlap && verticalOverlap;
}

/**
 * Generates points along a spiral path.
 *
 * @param cx           Center X
 * @param cy           Center Y
 * @param radius       Outer radius
 * @param radiusY      Vertical radius (for elliptical spirals)
 * @param innerRadius  Inner radius where the spiral starts
 * @param step         Base step size between points
 * @param radiusStep   Radius increase per full revolution
 * @param startAngle   Start angle in degrees
 * @param endAngle     End angle in degrees
 * @return             Array of points along the spiral
 */
export function spiralPoints(cx: number, cy: number, radius: number, radiusY: number, innerRadius: number, step: number, radiusStep: number, startAngle: number, endAngle: number): IPoint[] {

	let r = innerRadius + 0.01;
	startAngle = normalizeAngle(startAngle);
	endAngle = normalizeAngle(endAngle);
	
	let angle = startAngle * RADIANS;
	
	if(endAngle < startAngle) {
		endAngle += 360;
	}
	let points = [];

	while (r < radius + radiusStep) {

		let stepSize = step;
		if (stepSize / 2 > r) {
			stepSize = 2 * r;
		}

		let c = Math.max(0.01, Math.min(1, r / 200));

		stepSize = stepSize * c;
	
		let degrees = angle * DEGREES;


		let point = { x: cx + r * Math.cos(angle), y: cy + r * radiusY / radius * Math.sin(angle) };
		points.push(point);

		r = innerRadius + 0.01 + (degrees - startAngle) / 360 * radiusStep;

		angle += 2 * Math.asin(stepSize / 2 / r);

		if (angle * DEGREES > endAngle + 360 * Math.ceil((radius - innerRadius) / radiusStep)) {
			break;
		}		
	}

	points.shift();

	return points;
}

/**
 * Returns `true` if two circles overlap or touch.
 *
 * @param circle1  First circle (x, y, radius)
 * @param circle2  Second circle (x, y, radius)
 * @return         Whether the circles overlap
 */
export function circlesOverlap(circle1: { x: number, y: number, radius: number }, circle2: { x: number, y: number, radius: number }): boolean {
	return Math.hypot(circle1.x - circle2.x, circle1.y - circle2.y) <= circle1.radius + circle2.radius;
}