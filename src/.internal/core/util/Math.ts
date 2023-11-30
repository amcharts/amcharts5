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
 * [getCubicControlPointA description]
 *
 * @ignore Exclude from docs
 * @todo Description
 * @param p0        [description]
 * @param p1        [description]
 * @param p2        [description]
 * @param p3        [description]
 * @param tensionX  [description]
 * @param tensionY  [description]
 * @return [description]
 */
export function getCubicControlPointA(p0: IPoint, p1: IPoint, p2: IPoint, tensionX: number, tensionY: number): IPoint {
	return { x: ((-p0.x + p1.x / tensionX + p2.x) * tensionX), y: ((-p0.y + p1.y / tensionY + p2.y) * tensionY) };
}

/**
 * [getCubicControlPointB description]
 *
 * @ignore Exclude from docs
 * @todo Description
 * @param p0        [description]
 * @param p1        [description]
 * @param p2        [description]
 * @param p3        [description]
 * @param tensionX  [description]
 * @param tensionY  [description]
 * @return [description]
 */
export function getCubicControlPointB(p1: IPoint, p2: IPoint, p3: IPoint, tensionX: number, tensionY: number): IPoint {
	return { x: ((p1.x + p2.x / tensionX - p3.x) * tensionX), y: ((p1.y + p2.y / tensionY - p3.y) * tensionY) };
}


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

// 0 to 360
export function normalizeAngle(value: number): number {
	value = value % 360;
	if (value < 0) {
		value += 360;
	}
	return value;
}

// TODO this doesn't work properly for skewing, and it's probably broken for rotation too
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
 * Returns point on arc
 *
 * @param center point
 * @param radius
 * @param arc
 * @return {boolean}
 */
export function getArcPoint(radius: number, arc: number) {
	return ({ x: radius * cos(arc), y: radius * sin(arc) });
}


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

export function inBounds(point: IPoint, bounds: IBounds) {
	if (point.x >= bounds.left && point.y >= bounds.top && point.x <= bounds.right && point.y <= bounds.bottom) {
		return true;
	}
	return false;
}

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
 * [getPointOnQuadraticCurve description]
 *
 * @ignore Exclude from docs
 * @todo Description
 * @param pointA        [description]
 * @param pointB        [description]
 * @param controlPoint  [description]
 * @param position      [description]
 * @return [description]
 */
export function getPointOnQuadraticCurve(pointA: IPoint, pointB: IPoint, controlPoint: IPoint, position: number): IPoint {
	let x: number = (1 - position) * (1 - position) * pointA.x + 2 * (1 - position) * position * controlPoint.x + position * position * pointB.x;
	let y: number = (1 - position) * (1 - position) * pointA.y + 2 * (1 - position) * position * controlPoint.y + position * position * pointB.y;
	return { x: x, y: y };
}

export function getPointOnLine(pointA: IPoint, pointB: IPoint, position: number): IPoint {
	return { x: pointA.x + (pointB.x - pointA.x) * position, y: pointA.y + (pointB.y - pointA.y) * position };
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
 * Generates points of a spiral
 * @param cx 
 * @param cy 
 * @param radius 
 * @param radiusY 
 * @param innerRadius 
 * @param step 
 * @param radiusStep 
 * @param startAngle 
 * @param endAngle 
 * @returns IPoint[]
 */
export function spiralPoints(cx: number, cy: number, radius: number, radiusY: number, innerRadius: number, step: number, radiusStep: number, startAngle: number, endAngle: number): IPoint[] {

	let r = innerRadius + 0.01;
	let angle = startAngle * RADIANS;
	let points = [];

	while (r < radius + radiusStep) {

		let stepSize = step;
		if (stepSize / 2 > r) {
			stepSize = 2 * r;
		}

		angle += 2 * Math.asin(stepSize / 2 / r);

		if (angle * DEGREES > endAngle + ((radius - innerRadius) / radiusStep) * 360) {
			break;
		}

		let degrees = angle * DEGREES;

		let point = { x: cx + r * Math.cos(angle), y: cy + r * radiusY / radius * Math.sin(angle) };
		points.push(point);

		r = innerRadius + degrees / 360 * radiusStep;
	}

	points.shift();

	return points;
}

/**
 * Returns true if circles overlap
 * @param circle1
 * @param circle2 
 * @returns boolean
 */
export function circlesOverlap(circle1: { x: number, y: number, radius: number }, circle2: { x: number, y: number, radius: number }): boolean {
	return Math.hypot(circle1.x - circle2.x, circle1.y - circle2.y) <= circle1.radius + circle2.radius;
}