/** @ignore *//** */

import type { IBounds } from "../../util/IBounds";
import type { IPoint } from "../../util/IPoint";
import type { IGradient, IPattern } from "../backend/Renderer";
import { Color } from "../../util/Color";
import * as $array from "../../util/Array";
import * as $math from "../../util/Math";
import arcToBezier from 'svg-arc-to-cubic-bezier';


/**
 * Where path ops trace their geometry. `CanvasRenderingContext2D` is one.
 *
 * @ignore
 */
export interface IPathSink {
	moveTo(x: number, y: number): void;
	lineTo(x: number, y: number): void;
	closePath(): void;
	rect(x: number, y: number, width: number, height: number): void;
	arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
	arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
	ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
	bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): void;
	quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): void;
}

/**
 * A CSS color string, or a gradient/pattern made by the renderer.
 *
 * @ignore
 */
export type GraphicsPaint = string | IGradient | IPattern;

/**
 * @ignore
 */
export function setPoint(bounds: IBounds, point: IPoint): void {
	bounds.left = Math.min(bounds.left, point.x);
	bounds.top = Math.min(bounds.top, point.y);
	bounds.right = Math.max(bounds.right, point.x);
	bounds.bottom = Math.max(bounds.bottom, point.y);
}

/**
 * @ignore
 */
function checkArgs(name: string, actual: number, expected: number) {
	if (actual !== expected) {
		throw new Error("Required " + expected + " arguments for " + name + " but got " + actual);
	}
}

/**
 * @ignore
 */
function checkMinArgs(name: string, actual: number, expected: number) {
	if (actual < expected) {
		throw new Error("Required at least " + expected + " arguments for " + name + " but got " + actual);
	}
}

/**
 * @ignore
 */
function checkEvenArgs(name: string, actual: number, expected: number) {
	checkMinArgs(name, actual, expected);

	if ((actual % expected) !== 0) {
		throw new Error("Arguments for " + name + " must be in pairs of " + expected);
	}
}

/**
 * @ignore
 * This splits the flag so that way 0017 will be processed as 0 0 17
 *
 * This is important for weird paths like `M17 5A1 1 0 0017 30 1 1 0 0017 5`
 */
function splitArcFlags(args: Array<string>) {
	for (let i = 0; i < args.length; i += 7) {
		let index = i + 3;
		let flag = args[index];

		if (flag.length > 1) {
			const a = /^([01])([01])(.*)$/.exec(flag);

			if (a !== null) {
				args.splice(index, 0, a[1]);
				++index;

				args.splice(index, 0, a[2]);
				++index;

				if (a[3].length > 0) {
					args[index] = a[3];

				} else {
					args.splice(index, 1);
				}
			}
		}

		++index;

		flag = args[index];

		if (flag.length > 1) {
			const a = /^([01])(.+)$/.exec(flag);

			if (a !== null) {
				args.splice(index, 0, a[1]);
				++index;

				args[index] = a[2];
			}
		}
	}
}

/**
 * @ignore
 */
function assertBinary(value: number): 0 | 1 {
	if (value === 0 || value === 1) {
		return value;

	} else {
		throw new Error("Flag must be 0 or 1");
	}
}

/**
 * @ignore
 */
abstract class Op {
	public path(_sink: IPathSink): void { }

	public addBounds(_bounds: IBounds): void { }
}

/**
 * @ignore
 */
export class BeginPath extends Op {
	public readonly type = "beginPath";
}

/**
 * @ignore
 */
export class BeginFill extends Op {
	public readonly type = "beginFill";
	constructor(public color: GraphicsPaint) { super(); }
}

/**
 * @ignore
 */
export class EndFill extends Op {
	public readonly type = "endFill";
	constructor(public clearShadow: boolean) { super(); }
}

/**
 * @ignore
 */
export class EndStroke extends Op {
	public readonly type = "endStroke";
}

/**
 * @ignore
 */
export class LineStyle extends Op {
	public readonly type = "lineStyle";
	constructor(public width: number, public color: GraphicsPaint, public lineJoin?: "miter" | "round" | "bevel", public lineCap?: "butt" | "round" | "square") { super(); }
}

/**
 * @ignore
 */
export class LineDash extends Op {
	public readonly type = "lineDash";
	constructor(public dash: number[]) { super(); }
}

/**
 * @ignore
 */
export class LineDashOffset extends Op {
	public readonly type = "lineDashOffset";
	constructor(public dashOffset: number) { super(); }
}

/**
 * @ignore
 */
export class DrawRect extends Op {
	public readonly type = "drawRect";
	constructor(public x: number, public y: number, public width: number, public height: number) { super(); }

	public path(sink: IPathSink): void {
		sink.rect(this.x, this.y, this.width, this.height);
	}

	public addBounds(bounds: IBounds): void {
		const l = this.x;
		const t = this.y;
		const r = l + this.width;
		const b = t + this.height;

		setPoint(bounds, { x: l, y: t });
		setPoint(bounds, { x: r, y: t });
		setPoint(bounds, { x: l, y: b });
		setPoint(bounds, { x: r, y: b });
	}
}

/**
 * @ignore
 */
export class DrawCircle extends Op {
	public readonly type = "drawCircle";
	constructor(public x: number, public y: number, public radius: number) { super(); }

	public path(sink: IPathSink): void {
		sink.moveTo(this.x + this.radius, this.y);
		sink.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
	}

	// TODO handle skewing and rotation
	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.x - this.radius, y: this.y - this.radius });
		setPoint(bounds, { x: this.x + this.radius, y: this.y + this.radius });
	}
}

/**
 * @ignore
 */
export class DrawEllipse extends Op {
	public readonly type = "drawEllipse";
	constructor(public x: number, public y: number, public radiusX: number, public radiusY: number) { super(); }

	// TODO ignores x/y (all callers pass 0, 0); bounds use them
	public path(sink: IPathSink): void {
		sink.ellipse(0, 0, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);
	}

	// TODO handle skewing and rotation
	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.x - this.radiusX, y: this.y - this.radiusY });
		setPoint(bounds, { x: this.x + this.radiusX, y: this.y + this.radiusY });
	}
}

/**
 * @ignore
 */
export class Arc extends Op {
	public readonly type = "arc";
	constructor(
		public cx: number,
		public cy: number,
		public radius: number,
		public startAngle: number,
		public endAngle: number,
		public anticlockwise: boolean,
	) { super(); }

	public path(sink: IPathSink): void {
		if (this.radius > 0) {
			sink.arc(this.cx, this.cy, this.radius, this.startAngle, this.endAngle, this.anticlockwise);
		}
	}

	public addBounds(bounds: IBounds): void {
		let arcBounds = $math.getArcBounds(this.cx, this.cy, this.startAngle * $math.DEGREES, this.endAngle * $math.DEGREES, this.radius);
		setPoint(bounds, { x: arcBounds.left, y: arcBounds.top });
		setPoint(bounds, { x: arcBounds.right, y: arcBounds.bottom });
	}
}

/**
 * @ignore
 */
export class ArcTo extends Op {
	public readonly type = "arcTo";
	constructor(
		public x1: number,
		public y1: number,
		public x2: number,
		public y2: number,
		public radius: number,
	) { super(); }

	public path(sink: IPathSink): void {
		if (this.radius > 0) {
			sink.arcTo(this.x1, this.y1, this.x2, this.y2, this.radius);
		}
	}

	// TODO: add points
}

/**
 * @ignore
 */
export class LineTo extends Op {
	public readonly type = "lineTo";
	constructor(public x: number, public y: number) { super(); }

	public path(sink: IPathSink): void {
		sink.lineTo(this.x, this.y);
	}

	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.x, y: this.y });
	}
}

/**
 * @ignore
 */
export class MoveTo extends Op {
	public readonly type = "moveTo";
	constructor(public x: number, public y: number) { super(); }

	public path(sink: IPathSink): void {
		sink.moveTo(this.x, this.y);
	}

	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.x, y: this.y });
	}
}

/**
 * @ignore
 */
export class ClosePath extends Op {
	public readonly type = "closePath";

	public path(sink: IPathSink): void {
		sink.closePath();
	}
}

/**
 * @ignore
 */
export class BezierCurveTo extends Op {
	public readonly type = "bezierCurveTo";
	constructor(
		public cpX: number,
		public cpY: number,
		public cpX2: number,
		public cpY2: number,
		public toX: number,
		public toY: number,
	) { super(); }

	public path(sink: IPathSink): void {
		sink.bezierCurveTo(this.cpX, this.cpY, this.cpX2, this.cpY2, this.toX, this.toY);
	}

	// TODO: OK?
	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.cpX, y: this.cpY });
		setPoint(bounds, { x: this.cpX2, y: this.cpY2 });
		setPoint(bounds, { x: this.toX, y: this.toY });
	}
}

/**
 * @ignore
 */
export class QuadraticCurveTo extends Op {
	public readonly type = "quadraticCurveTo";
	constructor(
		public cpX: number,
		public cpY: number,
		public toX: number,
		public toY: number,
	) { super(); }

	public path(sink: IPathSink): void {
		sink.quadraticCurveTo(this.cpX, this.cpY, this.toX, this.toY);
	}

	// TODO: OK?
	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.cpX, y: this.cpY });
		setPoint(bounds, { x: this.toX, y: this.toY });
	}
}

/**
 * @ignore
 */
export class Shadow extends Op {
	public readonly type = "shadow";
	constructor(
		public color: string,
		public blur: number,
		public offsetX: number,
		public offsetY: number,
		public opacity?: number
	) { super(); }
}

/**
 * Drawn by the backend while tracing, in op order.
 *
 * @ignore
 */
export class GraphicsImage extends Op {
	public readonly type = "image";
	constructor(
		public image: HTMLImageElement | HTMLCanvasElement,
		public width: number,
		public height: number,
		public x: number,
		public y: number
	) { super(); }

	// TODO: OK? (uses width/height as a point, not x + width)
	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.x, y: this.y });
		setPoint(bounds, { x: this.width, y: this.height });
	}
}

/**
 * Opens a named group of the shapes that follow. Draws nothing; SVG writes it
 * as a `<g>`.
 *
 * @ignore
 */
export class BeginGroup extends Op {
	public readonly type = "beginGroup";
	constructor(
		public id?: string,
		public name?: string
	) { super(); }
}

/**
 * @ignore
 */
export class EndGroup extends Op {
	public readonly type = "endGroup";
}

/**
 * @ignore
 */
export type GraphicsOp =
	BeginPath | BeginFill | EndFill | EndStroke | LineStyle | LineDash | LineDashOffset |
	DrawRect | DrawCircle | DrawEllipse | Arc | ArcTo | LineTo | MoveTo | ClosePath |
	BezierCurveTo | QuadraticCurveTo | Shadow | GraphicsImage | BeginGroup | EndGroup;

/**
 * What an `IGraphics` records: geometry and paint ops, in call order.
 *
 * Renderer-neutral: backends replay `ops`.
 *
 * @ignore
 */
export class GraphicsData {
	public ops: Array<GraphicsOp> = [];

	// Changes on `clear()`; with `ops.length` it tells whether ops changed
	public version: number = 0;

	protected _hasShadows: boolean = false;
	protected _fillAlpha?: number;
	protected _strokeAlpha?: number;
	protected _strokeWidth: number = 1;

	public clear(): void {
		this.ops.length = 0;
		this._strokeWidth = 1;
		++this.version;
	}

	public beginFill(color?: Color | IGradient | IPattern, alpha: number = 1): void {
		this._fillAlpha = alpha;
		if (color) {
			if (color instanceof Color) {
				this.ops.push(new BeginFill(color.toCSS(alpha)));

			} else {
				this.ops.push(new BeginFill(color));
			}
		} else {
			this.ops.push(new BeginFill("rgba(0, 0, 0, " + alpha + ")"));
		}
	}

	public endFill(): void {
		this.ops.push(new EndFill(this._hasShadows));
	}

	public endStroke(): void {
		// A width of 0 draws no line (canvas would keep the previous width)
		if (this._strokeWidth > 0 && isFinite(this._strokeWidth)) {
			this.ops.push(new EndStroke());
		}
	}

	public beginPath(): void {
		this.ops.push(new BeginPath());
	}

	public lineStyle(width: number = 0, color?: Color | IGradient | IPattern, alpha: number = 1, lineJoin?: "miter" | "round" | "bevel", lineCap?: "butt" | "round" | "square"): void {
		this._strokeAlpha = alpha;
		this._strokeWidth = width;
		if (color) {
			if (color instanceof Color) {
				this.ops.push(new LineStyle(width, color.toCSS(alpha), lineJoin, lineCap));
			} else {
				this.ops.push(new LineStyle(width, color, lineJoin, lineCap));
			}
		} else {
			this.ops.push(new LineStyle(width, "rgba(0, 0, 0, " + alpha + ")", lineJoin, lineCap));
		}
	}

	public setLineDash(dash?: number[]): void {
		this.ops.push(new LineDash(dash ? dash : []));
	}

	public setLineDashOffset(dashOffset: number = 0): void {
		this.ops.push(new LineDashOffset(dashOffset));
	}

	public drawRect(x: number, y: number, width: number, height: number): void {
		this.ops.push(new DrawRect(x, y, width, height));
	}

	public drawCircle(x: number, y: number, radius: number): void {
		this.ops.push(new DrawCircle(x, y, radius));
	}

	public drawEllipse(x: number, y: number, radiusX: number, radiusY: number): void {
		this.ops.push(new DrawEllipse(x, y, radiusX, radiusY));
	}

	public arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean = false): void {
		this.ops.push(new Arc(cx, cy, radius, startAngle, endAngle, anticlockwise));
	}

	public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
		this.ops.push(new ArcTo(x1, y1, x2, y2, radius));
	}

	public lineTo(x: number, y: number): void {
		this.ops.push(new LineTo(x, y));
	}

	public moveTo(x: number, y: number): void {
		this.ops.push(new MoveTo(x, y));
	}

	public bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): void {
		this.ops.push(new BezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY));
	}

	public quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): void {
		this.ops.push(new QuadraticCurveTo(cpX, cpY, toX, toY));
	}

	public closePath(): void {
		this.ops.push(new ClosePath());
	}

	public shadow(color: Color, blur: number = 0, offsetX: number = 0, offsetY: number = 0, opacity?: number): void {
		this._hasShadows = true;
		this.ops.push(new Shadow(opacity != undefined ? color.toCSS(opacity) : color.toCSS(this._fillAlpha || this._strokeAlpha), blur, offsetX, offsetY));
	}

	public image(image: HTMLImageElement | HTMLCanvasElement, width: number, height: number, x: number, y: number): void {
		this.ops.push(new GraphicsImage(image, width, height, x, y));
	}

	public beginGroup(id?: string, name?: string): void {
		this.ops.push(new BeginGroup(id, name));
	}

	public endGroup(): void {
		this.ops.push(new EndGroup());
	}

	// https://svgwg.org/svg2-draft/paths.html#DProperty
	// TODO better error checking
	public svgPath(path: string): void {
		let x = 0;
		let y = 0;
		let cpx: number | null = null;
		let cpy: number | null = null;
		let qcpx: number | null = null;
		let qcpy: number | null = null;

		const SEGMENTS_REGEXP = /([MmZzLlHhVvCcSsQqTtAa])([^MmZzLlHhVvCcSsQqTtAa]*)/g;
		const ARGS_REGEXP = /[\u0009 \u000A\u000C\u000D]*([\+\-]?[0-9]*\.?[0-9]+(?:[eE][\+\-]?[0-9]+)?)[\u0009 \u000A\u000C\u000D]*,?/g;

		// Hack needed to undo any operations if the SVG parsing fails
		const length = this.ops.length;

		try {
			let match;

			while ((match = SEGMENTS_REGEXP.exec(path)) !== null) {
				const name = match[1];
				const rest = match[2];

				const args: Array<string> = [];

				while ((match = ARGS_REGEXP.exec(rest)) !== null) {
					args.push(match[1]);
				}

				// Reset control point
				if (name !== "S" && name !== "s" && name !== "C" && name !== "c") {
					cpx = null;
					cpy = null;
				}

				// Reset control point
				if (name !== "Q" && name !== "q" && name !== "T" && name !== "t") {
					qcpx = null;
					qcpy = null;
				}

				switch (name) {
					case "M":
						checkEvenArgs(name, args.length, 2);
						x = +args[0];
						y = +args[1];
						this.moveTo(x, y);

						for (let i = 2; i < args.length; i += 2) {
							x = +args[i];
							y = +args[i + 1];
							this.lineTo(x, y);
						}
						break;
					case "m":
						checkEvenArgs(name, args.length, 2);
						x += +args[0];
						y += +args[1];
						this.moveTo(x, y);

						for (let i = 2; i < args.length; i += 2) {
							x += +args[i];
							y += +args[i + 1];
							this.lineTo(x, y);
						}
						break;

					case "L":
						checkEvenArgs(name, args.length, 2);
						for (let i = 0; i < args.length; i += 2) {
							x = +args[i];
							y = +args[i + 1];
							this.lineTo(x, y);
						}
						break;
					case "l":
						checkEvenArgs(name, args.length, 2);
						for (let i = 0; i < args.length; i += 2) {
							x += +args[i];
							y += +args[i + 1];
							this.lineTo(x, y);
						}
						break;

					case "H":
						checkMinArgs(name, args.length, 1);
						for (let i = 0; i < args.length; ++i) {
							x = +args[i];
							this.lineTo(x, y);
						}
						break;
					case "h":
						checkMinArgs(name, args.length, 1);
						for (let i = 0; i < args.length; ++i) {
							x += +args[i];
							this.lineTo(x, y);
						}
						break;

					case "V":
						checkMinArgs(name, args.length, 1);
						for (let i = 0; i < args.length; ++i) {
							y = +args[i];
							this.lineTo(x, y);
						}
						break;
					case "v":
						checkMinArgs(name, args.length, 1);
						for (let i = 0; i < args.length; ++i) {
							y += +args[i];
							this.lineTo(x, y);
						}
						break;

					case "C":
						checkEvenArgs(name, args.length, 6);
						for (let i = 0; i < args.length; i += 6) {
							const x1 = +args[i];
							const y1 = +args[i + 1];
							cpx = +args[i + 2];
							cpy = +args[i + 3];
							x = +args[i + 4];
							y = +args[i + 5];
							this.bezierCurveTo(x1, y1, cpx, cpy, x, y);
						}
						break;
					case "c":
						checkEvenArgs(name, args.length, 6);
						for (let i = 0; i < args.length; i += 6) {
							const x1 = +args[i] + x;
							const y1 = +args[i + 1] + y;
							cpx = +args[i + 2] + x;
							cpy = +args[i + 3] + y;
							x += +args[i + 4];
							y += +args[i + 5];
							this.bezierCurveTo(x1, y1, cpx, cpy, x, y);
						}
						break;

					case "S":
						checkEvenArgs(name, args.length, 4);
						if (cpx === null || cpy === null) {
							cpx = x;
							cpy = y;
						}
						for (let i = 0; i < args.length; i += 4) {
							const x1 = 2 * x - cpx;
							const y1 = 2 * y - cpy;
							cpx = +args[i];
							cpy = +args[i + 1];
							x = +args[i + 2];
							y = +args[i + 3];
							this.bezierCurveTo(x1, y1, cpx, cpy, x, y);
						}
						break;
					case "s":
						checkEvenArgs(name, args.length, 4);
						if (cpx === null || cpy === null) {
							cpx = x;
							cpy = y;
						}
						for (let i = 0; i < args.length; i += 4) {
							const x1 = 2 * x - cpx;
							const y1 = 2 * y - cpy;
							cpx = +args[i] + x;
							cpy = +args[i + 1] + y;
							x += +args[i + 2];
							y += +args[i + 3];
							this.bezierCurveTo(x1, y1, cpx, cpy, x, y);
						}
						break;

					case "Q":
						checkEvenArgs(name, args.length, 4);
						for (let i = 0; i < args.length; i += 4) {
							qcpx = +args[i];
							qcpy = +args[i + 1];
							x = +args[i + 2];
							y = +args[i + 3];
							this.quadraticCurveTo(qcpx, qcpy, x, y);
						}
						break;
					case "q":
						checkEvenArgs(name, args.length, 4);
						for (let i = 0; i < args.length; i += 4) {
							qcpx = +args[i] + x;
							qcpy = +args[i + 1] + y;
							x += +args[i + 2];
							y += +args[i + 3];
							this.quadraticCurveTo(qcpx, qcpy, x, y);
						}
						break;

					case "T":
						checkEvenArgs(name, args.length, 2);
						if (qcpx === null || qcpy === null) {
							qcpx = x;
							qcpy = y;
						}
						for (let i = 0; i < args.length; i += 2) {
							qcpx = 2 * x - qcpx;
							qcpy = 2 * y - qcpy;
							x = +args[i];
							y = +args[i + 1];
							this.quadraticCurveTo(qcpx, qcpy, x, y);
						}
						break;
					case "t":
						checkEvenArgs(name, args.length, 2);
						if (qcpx === null || qcpy === null) {
							qcpx = x;
							qcpy = y;
						}
						for (let i = 0; i < args.length; i += 2) {
							qcpx = 2 * x - qcpx;
							qcpy = 2 * y - qcpy;
							x += +args[i];
							y += +args[i + 1];
							this.quadraticCurveTo(qcpx, qcpy, x, y);
						}
						break;

					case "A":
					case "a":
						const relative = (name === "a");

						splitArcFlags(args);
						checkEvenArgs(name, args.length, 7);

						for (let i = 0; i < args.length; i += 7) {
							let cx = +args[i + 5];
							let cy = +args[i + 6];

							if (relative) {
								cx += x;
								cy += y;
							}

							const bs = arcToBezier({
								px: x,
								py: y,
								rx: +args[i],
								ry: +args[i + 1],
								xAxisRotation: +args[i + 2],
								largeArcFlag: assertBinary(+args[i + 3]),
								sweepFlag: assertBinary(+args[i + 4]),
								cx,
								cy,
							});

							$array.each(bs, (b) => {
								this.bezierCurveTo(b.x1, b.y1, b.x2, b.y2, b.x, b.y);
								x = b.x;
								y = b.y;
							});
						}
						break;
					case "Z":
					case "z":
						checkArgs(name, args.length, 0);
						this.closePath();
						break;
				}
			}

		} catch (e) {
			// Undo any operations back to before `svgPath` was called
			this.ops.length = length;

			console.warn("Error when parsing svgPath:\n  " + (e as Error).message + "\n" + path);
		}
	}

	public addBounds(bounds: IBounds): void {
		$array.each(this.ops, (op) => {
			op.addBounds(bounds);
		});
	}
}
