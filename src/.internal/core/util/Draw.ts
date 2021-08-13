/** @ignore *//** */

import type { IPoint } from "./IPoint"
import * as $math from "./Math";
import type { IGraphics } from "../render/backend/Renderer";

/**
 * @ignore
 */
export function segmentedLine(display: IGraphics, segments: Array<Array<Array<IPoint>>>) {
	for (let s = 0, len = segments.length; s < len; s++) {
		const groups = segments[s];
		if (groups.length > 0) {
			let firstGroup = groups[0];
			if (firstGroup.length > 0) {
				let firstPoint = firstGroup[0];
				display.moveTo(firstPoint.x, firstPoint.y);
				for (let g = 0, len = groups.length; g < len; g++) {
					line(display, groups[g]);
				}
			}
		}
	}
}

/**
 * @ignore
 */
export function line(display: IGraphics, points: Array<IPoint>) {
	for (let p = 0, len = points.length; p < len; p++) {
		const point = points[p];
		display.lineTo(point.x, point.y);
	}
}

/**
 * @ignore
 */
export function moveTo(display: IGraphics, point: IPoint) {
	display.moveTo(point.x, point.y);
}

/**
 * @ignore
 */
export function clear(display: IGraphics) {
	display.clear();
}

/**
 * @ignore
 */
export function smoothedSegmentedline(display: IGraphics, segments: Array<Array<Array<IPoint>>>, tensionX: number, tensionY: number) {
	for (let s = 0, len = segments.length; s < len; s++) {
		const groups = segments[s];
		if (groups.length > 0) {
			let firstGroup = groups[0];
			if (firstGroup.length > 0) {
				let firstPoint = firstGroup[0];
				display.moveTo(firstPoint.x, firstPoint.y);
				for (let g = 0, len = groups.length; g < len; g++) {
					const points = groups[g];
					if (points.length > 0) {
						display.lineTo(points[0].x, points[0].y)
					}
					smoothedLine(display, points, tensionX, tensionY);
				}
			}
		}
	}
}

/**
 * @ignore
 */
export function smoothedLine(display: IGraphics, points: Array<IPoint>, tensionX: number, tensionY: number) {

	for (let i = points.length - 1; i > 0; i--) {
		let p0 = points[i];
		let p1 = points[i - 1];

		if (Math.abs(p0.x - p1.x) < 0.1 && Math.abs(p0.y - p1.y) < 0.1) {
			points.splice(i - 1, 1);
		}
	}

	if (points.length < 3 || (tensionX >= 1 && tensionY >= 1)) {
		line(display, points);
		return;
	}

	tensionX = 1 - tensionX + 0.00001;
	tensionY = 1 - tensionY + 0.00001;

	let first = points[0];
	let last = points[points.length - 1];

	let closed: boolean = false;

	if ($math.round(first.x, 3) == $math.round(last.x) && $math.round(first.y) == $math.round(last.y)) {
		closed = true;
	}

	// Can't moveTo here, as it wont be possible to have fill then.
	let path: string = "";

	for (let i = 0, len = points.length - 1; i < len; i++) {
		let p0: IPoint = points[i - 1];

		let p1: IPoint = points[i];

		let p2: IPoint = points[i + 1];

		let p3: IPoint = points[i + 2];

		if (i === 0) {
			if (closed) {
				p0 = points[len - 2];
			}
			else {
				p0 = points[0];
			}
		} else if (i == len - 1) {
			if (closed) {
				p3 = points[1];
			}
			else {
				p3 = p2;
			}
		}


		let controlPointA = $math.getCubicControlPointA(p0, p1, p2, tensionX, tensionY);
		let controlPointB = $math.getCubicControlPointB(p1, p2, p3, tensionX, tensionY);

		display.bezierCurveTo(controlPointA.x, controlPointA.y, controlPointB.x, controlPointB.y, p2.x, p2.y);
	}

	return path;
}
