/** @ignore *//** */

import type { IPathSink } from "./GraphicsData";


const TWO_PI = Math.PI * 2;

/**
 * Canvas ignores path calls with an infinite or NaN argument.
 *
 * @ignore
 */
function finite(...values: Array<number>): boolean {
	for (let i = 0; i < values.length; i++) {
		if (!isFinite(values[i])) {
			return false;
		}
	}
	return true;
}

/**
 * Traces path ops into SVG path data (`d`), with Canvas2D semantics:
 * arcs of 2pi or more are full circles, an arc starts with a line from the
 * current point, `arcTo` rounds the corner between two tangents, and
 * `lineTo` / curves without a current point start a subpath.
 *
 * Arc angles are normalized the way Chromium does it, so the result matches
 * what `CanvasRenderingContext2D` draws.
 *
 * @ignore
 */
export class SvgPathSink implements IPathSink {
	protected _parts: Array<string> = [];
	protected _x: number = 0;
	protected _y: number = 0;
	protected _startX: number = 0;
	protected _startY: number = 0;
	protected _hasPoint: boolean = false;

	/**
	 * @param precision Decimal places in the output
	 */
	constructor(protected _precision: number = 3) { }

	public get d(): string {
		return this._parts.join("");
	}

	public clear(): void {
		this._parts.length = 0;
		this._hasPoint = false;
	}

	protected _n(value: number): string {
		const p = Math.pow(10, this._precision);
		return String(Math.round(value * p) / p);
	}

	protected _point(x: number, y: number): string {
		return this._n(x) + " " + this._n(y);
	}

	public moveTo(x: number, y: number): void {
		if (!finite(x, y)) {
			return;
		}

		this._parts.push("M" + this._point(x, y));
		this._x = this._startX = x;
		this._y = this._startY = y;
		this._hasPoint = true;
	}

	public lineTo(x: number, y: number): void {
		if (!finite(x, y)) {
			return;
		}

		if (!this._hasPoint) {
			this.moveTo(x, y);
			return;
		}
		this._parts.push("L" + this._point(x, y));
		this._x = x;
		this._y = y;
	}

	public closePath(): void {
		if (this._hasPoint) {
			this._parts.push("Z");
			this._x = this._startX;
			this._y = this._startY;
		}
	}

	public rect(x: number, y: number, width: number, height: number): void {
		if (!finite(x, y, width, height)) {
			return;
		}

		this.moveTo(x, y);
		this._parts.push("L" + this._point(x + width, y) + "L" + this._point(x + width, y + height) + "L" + this._point(x, y + height) + "Z");
		this._x = x;
		this._y = y;
	}

	public bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): void {
		if (!finite(cpX, cpY, cpX2, cpY2, toX, toY)) {
			return;
		}

		if (!this._hasPoint) {
			this.moveTo(cpX, cpY);
		}
		this._parts.push("C" + this._point(cpX, cpY) + " " + this._point(cpX2, cpY2) + " " + this._point(toX, toY));
		this._x = toX;
		this._y = toY;
	}

	public quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): void {
		if (!finite(cpX, cpY, toX, toY)) {
			return;
		}

		if (!this._hasPoint) {
			this.moveTo(cpX, cpY);
		}
		this._parts.push("Q" + this._point(cpX, cpY) + " " + this._point(toX, toY));
		this._x = toX;
		this._y = toY;
	}

	public arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean = false): void {
		this.ellipse(cx, cy, radius, radius, 0, startAngle, endAngle, anticlockwise);
	}

	public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise: boolean = false): void {
		if (!finite(x, y, radiusX, radiusY, rotation, startAngle, endAngle)) {
			return;
		}

		if (radiusX < 0 || radiusY < 0) {
			return;
		}

		// Chromium: canonicalize the start angle into [0, 2pi), shift the end with it
		let start = startAngle % TWO_PI;
		if (start < 0) {
			start += TWO_PI;
		}
		let end = endAngle + (start - startAngle);

		// Chromium: adjust the end angle
		if (!anticlockwise && end - start >= TWO_PI) {
			end = start + TWO_PI;
		}
		else if (anticlockwise && start - end >= TWO_PI) {
			end = start - TWO_PI;
		}
		else if (!anticlockwise && start > end) {
			end = start + (TWO_PI - ((start - end) % TWO_PI));
		}
		else if (anticlockwise && start < end) {
			end = start - (TWO_PI - ((end - start) % TWO_PI));
		}

		const cos = Math.cos(rotation);
		const sin = Math.sin(rotation);
		const pointAt = (angle: number): [number, number] => {
			const px = radiusX * Math.cos(angle);
			const py = radiusY * Math.sin(angle);
			return [x + px * cos - py * sin, y + px * sin + py * cos];
		};

		// The arc starts with a line from the current point
		const [sx, sy] = pointAt(start);
		this.lineTo(sx, sy);

		const sweep = end - start;
		if (sweep === 0 || radiusX === 0 || radiusY === 0) {
			const [ex, ey] = pointAt(end);
			this.lineTo(ex, ey);
			return;
		}

		// SVG cannot draw an arc back to its own start: split into pieces of at most pi
		const pieces = Math.ceil(Math.abs(sweep) / Math.PI - 1e-9);
		const step = sweep / pieces;
		const rotationDeg = this._n(rotation * 180 / Math.PI);
		const sweepFlag = sweep > 0 ? "1" : "0";
		for (let i = 1; i <= pieces; i++) {
			const [px, py] = pointAt(start + step * i);
			this._parts.push("A" + this._n(radiusX) + " " + this._n(radiusY) + " " + rotationDeg + " 0 " + sweepFlag + " " + this._point(px, py));
			this._x = px;
			this._y = py;
		}
	}

	public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
		if (!finite(x1, y1, x2, y2, radius)) {
			return;
		}

		if (!this._hasPoint) {
			this.moveTo(x1, y1);
		}

		const x0 = this._x;
		const y0 = this._y;

		// Degenerate cases draw a straight line to (x1, y1)
		if ((x0 === x1 && y0 === y1) || (x1 === x2 && y1 === y2) || radius === 0) {
			this.lineTo(x1, y1);
			return;
		}

		const ax = x0 - x1, ay = y0 - y1;
		const bx = x2 - x1, by = y2 - y1;
		const la = Math.hypot(ax, ay);
		const lb = Math.hypot(bx, by);
		const cross = ax * by - ay * bx;

		// Collinear points: a straight line to (x1, y1)
		if (Math.abs(cross) < 1e-9 * la * lb) {
			this.lineTo(x1, y1);
			return;
		}

		const cosTheta = (ax * bx + ay * by) / (la * lb);
		const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
		const distance = radius / Math.tan(theta / 2);

		const t1x = x1 + ax / la * distance;
		const t1y = y1 + ay / la * distance;
		const t2x = x1 + bx / lb * distance;
		const t2y = y1 + by / lb * distance;

		this.lineTo(t1x, t1y);
		this._parts.push("A" + this._n(radius) + " " + this._n(radius) + " 0 0 " + (cross < 0 ? "1" : "0") + " " + this._point(t2x, t2y));
		this._x = t2x;
		this._y = t2y;
	}
}
