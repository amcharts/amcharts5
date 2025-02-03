/** @ignore *//** */

import {
	IRenderer, IContainer, IDisplayObject, IGraphics, IRendererEvents, IMargin,
	IText, ITextStyle, IRadialText, IPicture, IRendererEvent, ILayer, ICanvasOptions, BlendMode, IPointerEvent, Id
} from "./Renderer";
import type { IBounds } from "../../util/IBounds";
import type { IPoint } from "../../util/IPoint";
import { Color } from "../../util/Color";
import { Matrix } from "../../util/Matrix";
import { Percent, percent } from "../../util/Percent";
//import { Throttler } from "../../util/Throttler";
import { ArrayDisposer, Disposer, DisposerClass, IDisposer, CounterDisposer, MultiDisposer } from "../../util/Disposer";
import { TextFormatter, ITextChunk } from "../../util/TextFormatter";
import * as $utils from "../../util/Utils";
import * as $array from "../../util/Array";
import * as $object from "../../util/Object";
import * as $type from "../../util/Type";
import * as $math from "../../util/Math";
import arcToBezier from 'svg-arc-to-cubic-bezier';


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

//  1 -> 0xffffff * (2 / 2)
//  2 -> 0xffffff * (1 / 2)
//
//  3 -> 0xffffff * (3 / 4)
//  4 -> 0xffffff * (1 / 4)
//
//  5 -> 0xffffff * (7 / 8)
//  6 -> 0xffffff * (5 / 8)
//  7 -> 0xffffff * (3 / 8)
//  8 -> 0xffffff * (1 / 8)
//
//  9 -> 0xffffff * (15 / 16)
// 10 -> 0xffffff * (13 / 16)
// 11 -> 0xffffff * (11 / 16)
// 12 -> 0xffffff *  (9 / 16)
// 13 -> 0xffffff *  (7 / 16)
// 14 -> 0xffffff *  (5 / 16)
// 15 -> 0xffffff *  (3 / 16)
// 16 -> 0xffffff *  (1 / 16)
// @todo remove this old color distribution algo if the new one pans out
/*function distributeId(id: number): number {
	if (id === 1) {
		return 0x000001;

	} else {
		// Finds the closest power of 2
		const base = Math.pow(2, Math.ceil(Math.log(id) / Math.log(2)));

		// Translates the id into an odd fraction index
		const index = ((base - id) * 2) + 1;

		// TODO is Math.round correct ?
		return Math.round(0xffffff * (index / base));
	}
}*/

/**
 * Function by smeans:
 * https://lowcode.life/generating-unique-contrasting-colors-in-javascript/
 * @ignore
 */
function distributeId(id: number): number {
	const rgb = [0, 0, 0];

	for (let i = 0; i < 24; i++) {
		rgb[i % 3] <<= 1;
		rgb[i % 3] |= id & 0x01;
		id >>= 1;
	}

	return (rgb[0] | 0) + (rgb[1] << 8) + (rgb[2] << 16);
}

/**
 * @ignore
 */
function eachTargets(hitTarget: CanvasDisplayObject, f: (target: CanvasDisplayObject) => boolean): void {
	for (; ;) {
		if (hitTarget.interactive) {
			if (!f(hitTarget)) {
				break;
			}
		}

		if (hitTarget._parent) {
			hitTarget = hitTarget._parent;

		} else {
			break;
		}
	}
}

// TODO feature detection for mouse/touch/pointer
/**
 * @ignore
 */
function onPointerEvent(element: EventTarget, name: string, f: (event: Array<IPointerEvent>, target: Node | null) => void): IDisposer {
	return $utils.addEventListener(element, $utils.getRendererEvent(name), (event: MouseEvent | TouchEvent) => {
		const target = $utils.getEventTarget(event);

		let touches = (<any>event).touches;
		if (touches) {
			if (touches.length == 0) {
				touches = (<any>event).changedTouches;
			}

			f($array.copy(<TouchList>touches), target);

		} else {
			f([<MouseEvent>event], target);
		}
	});
}

/**
 * @ignore
 */
function isTainted(image: HTMLImageElement): boolean {
	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	const context = canvas.getContext("2d", { willReadFrequently: true })! as CanvasRenderingContext2D;
	context.drawImage(image, 0, 0, 1, 1);

	try {
		context.getImageData(0, 0, 1, 1);
		return false;
	}
	catch (err) {
		console.warn("Image \"" + image.src + "\" is loaded from different host and is not covered by CORS policy. For more information about the implications read here: https://www.amcharts.com/docs/v5/concepts/cors");
		return true;
	}
}

/**
 * This is needed to workaround a bug in iOS which causes it to not GC canvas elements.
 *
 * @ignore
 */
function clearCanvas(view: HTMLCanvasElement) {
	view.width = 0;
	view.height = 0;
	view.style.width = "0px";
	view.style.height = "0px";
}


/**
 * Aligns the coordinate to the pixel, so it renders crisp
 *
 * @ignore
 */
function crisp(x: number): number {
	return Math.floor(x) + .5;
}

/**
 * @ignore
 */
export class CanvasPivot implements IPoint {
	protected _x: number = 0;
	protected _y: number = 0;

	get x(): number {
		return this._x;
	}

	get y(): number {
		return this._y;
	}

	set x(value: number) {
		this._x = value;
	}

	set y(value: number) {
		this._y = value;
	}
}


interface IStatus {
	layer: CanvasLayer;
	inactive: boolean | null;
}

/**
 * @ignore
 */
export class CanvasDisplayObject extends DisposerClass implements IDisplayObject, IDisposer {
	public _layer?: CanvasLayer;

	public mask: CanvasGraphics | null = null;
	public visible: boolean = true;
	public exportable?: boolean = true;
	public interactive: boolean = false;
	public inactive: boolean | null = null;
	public wheelable: boolean = false;
	public cancelTouch: boolean = false;
	public isMeasured: boolean = false;
	public buttonMode: boolean = false;
	public alpha: number = 1;
	public compoundAlpha: number = 1;
	public angle: number = 0;
	public scale: number = 1;
	public x: number = 0;
	public y: number = 0;
	public crisp: boolean = false;
	public pivot: CanvasPivot = new CanvasPivot();

	public filter?: string;

	public cursorOverStyle?: string;
	public _replacedCursorStyle?: string;

	public _localMatrix: Matrix = new Matrix();
	public _matrix: Matrix = new Matrix();
	// TODO can this be replaced with _localMatrix ?
	protected _uMatrix: Matrix = new Matrix();

	public _renderer: CanvasRenderer;
	public _parent: CanvasContainer | undefined;

	protected _localBounds: IBounds | undefined;
	protected _bounds: IBounds | undefined;
	public _colorId: string | undefined;

	constructor(renderer: CanvasRenderer) {
		super();
		this._renderer = renderer;
	}

	protected subStatus(status: IStatus): IStatus {
		return {
			inactive: (this.inactive == null ? status.inactive : this.inactive),
			layer: this._layer || status.layer,
		};
	}

	protected _dispose(): void {
		this._renderer._removeObject(this);
		this.getLayer().dirty = true;
	}

	public getCanvas(): HTMLCanvasElement {
		return this.getLayer().view;
	}

	public getLayer(): CanvasLayer {
		let self: CanvasDisplayObject = this;

		for (; ;) {
			if (self._layer) {
				return self._layer;

			} else if (self._parent) {
				self = self._parent;

			} else {
				return this._renderer.defaultLayer;
			}
		}
	}

	public setLayer(order: number | undefined, margin: IMargin | undefined): void {
		if (order == null) {
			this._layer = undefined;

		} else {
			const visible = true;
			this._layer = this._renderer.getLayer(order, visible);
			this._layer.visible = visible;
			this._layer.margin = margin;
			if (margin) {
				$utils.setInteractive(this._layer.view, false);
			}

			this._renderer._ghostLayer.setMargin(this._renderer.layers);

			if (this._parent) {
				this._parent.registerChildLayer(this._layer);
			}

			this._layer.dirty = true;
			this._renderer.resizeLayer(this._layer);
			this._renderer.resizeGhost();
		}
	}

	public markDirtyLayer(): void {
		this.getLayer().dirty = true;
	}

	public clear(): void {
		this.invalidateBounds();
	}

	public invalidateBounds(): void {
		this._localBounds = undefined;
	}

	public _addBounds(_bounds: IBounds): void { }

	protected _getColorId(): string {
		if (this._colorId === undefined) {
			this._colorId = this._renderer.paintId(this);
		}

		return this._colorId;
	}

	protected _isInteractive(status: IStatus): boolean {
		return !status.inactive && (this.interactive || this._renderer._forceInteractive > 0);
	}

	protected _isInteractiveMask(status: IStatus): boolean {
		return this._isInteractive(status);
	}

	public contains(child: CanvasDisplayObject): boolean {
		for (; ;) {
			if (child === this) {
				return true;

			} else if (child._parent) {
				child = child._parent;

			} else {
				return false;
			}
		}
	}

	toGlobal(point: IPoint): IPoint {
		return this._matrix.apply(point);
	}

	toLocal(point: IPoint): IPoint {
		return this._matrix.applyInverse(point);
	}

	public getLocalMatrix(): Matrix {
		this._uMatrix.setTransform(0, 0, this.pivot.x, this.pivot.y, this.angle * Math.PI / 180, this.scale);
		return this._uMatrix;
	}

	getLocalBounds(): IBounds {
		if (!this._localBounds) {

			const bn = 10000000;
			this._localBounds = {
				left: bn,
				top: bn,
				right: -bn,
				bottom: -bn
			};

			this._addBounds(this._localBounds);
		}
		return this._localBounds;
	}

	getAdjustedBounds(bounds: IBounds): IBounds {
		this._setMatrix();

		const matrix = this.getLocalMatrix();

		const p0 = matrix.apply({ x: bounds.left, y: bounds.top });
		const p1 = matrix.apply({ x: bounds.right, y: bounds.top });
		const p2 = matrix.apply({ x: bounds.right, y: bounds.bottom });
		const p3 = matrix.apply({ x: bounds.left, y: bounds.bottom });

		return {
			left: Math.min(p0.x, p1.x, p2.x, p3.x),
			top: Math.min(p0.y, p1.y, p2.y, p3.y),
			right: Math.max(p0.x, p1.x, p2.x, p3.x),
			bottom: Math.max(p0.y, p1.y, p2.y, p3.y)
		}
	}

	on<C, Key extends keyof IRendererEvents>(key: Key, callback: (this: C, event: IRendererEvents[Key]) => void, context?: C): IDisposer {
		if (this.interactive) {
			return this._renderer._addEvent(this, key, callback, context);

		} else {
			return new Disposer(() => { });
		}
	}

	public _setMatrix(): void {
		// TODO only calculate this if it has actually changed
		this._localMatrix.setTransform(
			this.x,
			this.y,
			this.pivot.x,
			this.pivot.y,
			// Converts degrees to radians
			this.angle * Math.PI / 180,
			this.scale
		);

		this._matrix.copyFrom(this._localMatrix);

		if (this._parent) {
			// TODO only calculate this if it has actually changed
			this._matrix.prepend(this._parent._matrix);
		}
	}

	public _transform(context: CanvasRenderingContext2D, resolution: number): void {
		const m = this._matrix;
		let tx = m.tx * resolution;
		let ty = m.ty * resolution;
		if (this.crisp) {
			tx = crisp(tx);
			ty = crisp(ty);
		}

		context.setTransform(
			m.a * resolution,
			m.b * resolution,
			m.c * resolution,
			m.d * resolution,
			tx,
			ty)

	}

	public _transformMargin(context: CanvasRenderingContext2D, resolution: number, margin: IMargin): void {
		const m = this._matrix;
		context.setTransform(
			m.a * resolution,
			m.b * resolution,
			m.c * resolution,
			m.d * resolution,
			(m.tx + margin.left) * resolution,
			(m.ty + margin.top) * resolution
		);
	}

	public _transformLayer(context: CanvasRenderingContext2D, resolution: number, layer: CanvasLayer): void {
		if (layer.margin) {
			this._transformMargin(context, layer.scale || resolution, layer.margin);

		} else {
			this._transform(context, layer.scale || resolution);
		}
	}

	public render(status: IStatus, targetGhostLayer: number = 0): void {
		if (this.visible && (this.exportable !== false || !this._renderer._omitTainted)) {
			this._setMatrix();

			const subStatus = this.subStatus(status);

			const resolution = this._renderer.resolution;

			const layers = this._renderer.layers;
			const ghostLayer = this._renderer._ghostLayer;
			const ghostContext = ghostLayer.context;

			const mask = this.mask;
			if (mask) {
				mask._setMatrix();
			}

			// TODO improve this
			$array.each(layers, (layer) => {
				if (layer) {
					const context = layer.context;
					context.save();

					// We must apply the mask before we transform the element
					if (mask) {
						mask._transformLayer(context, resolution, layer);
						mask._runPath(context);
						context.clip();
					}

					context.globalAlpha = this.compoundAlpha * this.alpha;

					this._transformLayer(context, resolution, layer);

					if (this.filter) {
						context.filter = this.filter;
					}
				}
			});

			ghostContext.save();

			// We must apply the mask before we transform the element
			if (mask && this._isInteractiveMask(subStatus)) {
				mask._transformMargin(ghostContext, resolution, ghostLayer.margin);
				mask._runPath(ghostContext);
				ghostContext.clip();
			}

			this._transformMargin(ghostContext, resolution, ghostLayer.margin);
			if ((subStatus.layer.order > 0) && !targetGhostLayer) {
				$array.move(this._renderer._deferredGhostLayers, subStatus.layer.order);
			}
			this._render(subStatus, targetGhostLayer);

			ghostContext.restore();

			$array.each(layers, (layer) => {
				if (layer) {
					layer.context.restore();
				}
			});
		}
	}

	protected _render(status: IStatus, _targetGhostLayer: number = 0): void {
		if (this.exportable === false) {
			status.layer.tainted = true;
		}
	}

	protected _ghostOnly(targetGhostLayer: number = 0): boolean {
		return targetGhostLayer > 0 ? true : false;
	}

	protected _drawGhost(status: IStatus, targetGhostLayer: number = 0): boolean {
		const interactive = this._isInteractive(status);
		const order = status.layer.order || 0;
		return interactive && ((order == 0 && !this._ghostOnly(targetGhostLayer)) || order == targetGhostLayer) ? true : false;
	}

	hovering(): boolean {
		return this._renderer._hovering.has(this);
	}

	dragging(): boolean {
		return this._renderer._dragging.some((x) => x.value === this);
	}


	public shouldCancelTouch(): boolean {
		const renderer = this._renderer;
		if (renderer.tapToActivate && !renderer._touchActive) {
			return false;
		}
		if (this.cancelTouch) {
			return true;
		}
		else if (this._parent) {
			return this._parent.shouldCancelTouch();
		}
		return false;
	}

}

/**
 * @ignore
 */
export class CanvasContainer extends CanvasDisplayObject implements IContainer {
	public interactiveChildren: boolean = true;
	private _childLayers?: CanvasLayer[];

	protected _children: Array<CanvasDisplayObject> = [];

	protected _isInteractiveMask(status: IStatus): boolean {
		return this.interactiveChildren || super._isInteractiveMask(status);
	}

	addChild(child: CanvasDisplayObject): void {
		child._parent = this;
		this._children.push(child);
		if (child._layer) {
			this.registerChildLayer(child._layer);
		}
	}

	addChildAt(child: CanvasDisplayObject, index: number): void {
		child._parent = this;
		this._children.splice(index, 0, child);
		if (child._layer) {
			this.registerChildLayer(child._layer);
		}
	}

	removeChild(child: CanvasDisplayObject): void {
		child._parent = undefined;
		$array.removeFirst(this._children, child);
	}

	protected _render(status: IStatus, targetGhostLayer: number): void {
		super._render(status);

		const renderer = this._renderer;

		if (this.interactive && this.interactiveChildren) {
			++renderer._forceInteractive;
		}

		$array.each(this._children, (child) => {
			child.compoundAlpha = this.compoundAlpha * this.alpha;
			child.render(status, targetGhostLayer);
		});

		if (this.interactive && this.interactiveChildren) {
			--renderer._forceInteractive;
		}
	}

	registerChildLayer(layer: CanvasLayer): void {
		if (!this._childLayers) {
			this._childLayers = [];
		}
		$array.pushOne(this._childLayers, layer);
		if (this._parent) {
			this._parent.registerChildLayer(layer);
		}
	}

	public markDirtyLayer(deep: boolean = false): void {
		super.markDirtyLayer();
		if (deep && this._childLayers) {
			$array.each(this._childLayers, (layer) => layer.dirty = true);
		}
	}

	protected _dispose() {
		super._dispose();
		if (this._childLayers) {
			$array.each(this._childLayers, (layer) => {
				layer.dirty = true;
			});
		}
	}
}

/**
 * @ignore
 */
function setPoint(bounds: IBounds, point: IPoint): void {
	bounds.left = Math.min(bounds.left, point.x);
	bounds.top = Math.min(bounds.top, point.y);
	bounds.right = Math.max(bounds.right, point.x);
	bounds.bottom = Math.max(bounds.bottom, point.y);
}

/**
 * @ignore
 */
abstract class Op {
	public colorize(_context: CanvasRenderingContext2D, _forceColor: string | undefined): void { }

	public colorizeGhost(context: CanvasRenderingContext2D, forceColor: string | undefined): void {
		this.colorize(context, forceColor);
	}

	public path(_context: CanvasRenderingContext2D): void { }

	public pathGhost(context: CanvasRenderingContext2D): void {
		this.path(context);
	}

	public addBounds(_bounds: IBounds): void { }
}

/**
 * @ignore
 */
class BeginPath extends Op {
	public colorize(context: CanvasRenderingContext2D, _forceColor: string | undefined): void {
		context.beginPath();
	}
}

/**
 * @ignore
 */
class BeginFill extends Op {
	constructor(public color: string | CanvasGradient | CanvasPattern) { super(); }

	public colorize(context: CanvasRenderingContext2D, forceColor: string | undefined): void {
		if (forceColor !== undefined) {
			context.fillStyle = forceColor;

		} else {
			context.fillStyle = this.color;
		}
	}
}

/**
 * @ignore
 */
class EndFill extends Op {
	constructor(public clearShadow: boolean) { super(); }
	public colorize(context: CanvasRenderingContext2D, _forceColor: string | undefined): void {
		context.fill();
		if (this.clearShadow) {
			context.shadowColor = "";
			context.shadowBlur = 0;
			context.shadowOffsetX = 0;
			context.shadowOffsetY = 0;
		}
	}
}

/**
 * @ignore
 */
class EndStroke extends Op {
	public colorize(context: CanvasRenderingContext2D, _forceColor: string | undefined): void {
		context.stroke();
	}
}

/**
 * @ignore
 */
class LineStyle extends Op {
	constructor(public width: number, public color: string | CanvasGradient | CanvasPattern, public lineJoin?: "miter" | "round" | "bevel", public lineCap?: "butt" | "round" | "square") { super(); }

	public colorize(context: CanvasRenderingContext2D, forceColor: string | undefined): void {
		if (forceColor !== undefined) {
			context.strokeStyle = forceColor;

		} else {
			context.strokeStyle = this.color;
		}

		context.lineWidth = this.width;
		if (this.lineJoin) {
			context.lineJoin = this.lineJoin;
		}

		if (this.lineCap) {
			context.lineCap = this.lineCap;
		}
	}
}

/**
 * @ignore
 */
class LineDash extends Op {
	constructor(public dash: number[]) { super(); }

	public colorize(context: CanvasRenderingContext2D, _forceColor: string | undefined): void {
		context.setLineDash(this.dash);
	}
}

/**
 * @ignore
 */
class LineDashOffset extends Op {
	constructor(public dashOffset: number) { super(); }

	public colorize(context: CanvasRenderingContext2D, _forceColor: string | undefined): void {
		context.lineDashOffset = this.dashOffset;
	}
}

/**
 * @ignore
 */
class DrawRect extends Op {
	constructor(public x: number, public y: number, public width: number, public height: number) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		context.rect(this.x, this.y, this.width, this.height);
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
class DrawCircle extends Op {
	constructor(public x: number, public y: number, public radius: number) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		context.moveTo(this.x + this.radius, this.y);
		context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
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
class DrawEllipse extends Op {
	constructor(public x: number, public y: number, public radiusX: number, public radiusY: number) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		context.ellipse(0, 0, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);
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
class Arc extends Op {
	constructor(
		public cx: number,
		public cy: number,
		public radius: number,
		public startAngle: number,
		public endAngle: number,
		public anticlockwise: boolean,
	) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		if (this.radius > 0) {
			context.arc(this.cx, this.cy, this.radius, this.startAngle, this.endAngle, this.anticlockwise);
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
class ArcTo extends Op {
	constructor(
		public x1: number,
		public y1: number,
		public x2: number,
		public y2: number,
		public radius: number,
	) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		if (this.radius > 0) {
			context.arcTo(this.x1, this.y1, this.x2, this.y2, this.radius);
		}
	}

	// TODO: add points
	public addBounds(_bounds: IBounds): void {
		/*
		// not finished
		https://math.stackexchange.com/questions/1781438/finding-the-center-of-a-circle-given-two-points-and-a-radius-algebraically

		if (prevPoint) {
			let x1 = prevPoint.x;
			let y1 = prevPoint.y;
			let x2 = this.x2;
			let y2 = this.y2;
			let r = this.radius;

			let xa = (x2 - x1) / 2;
			let ya = (y2 - y1) / 2;

			let x0 = x1 + xa;
			let y0 = y1 + ya;

			let a = Math.hypot(xa, ya);
			let b = Math.sqrt(r * r - a * a);

			let cx = x0 + b * ya / a;
			let cy = y0 - b * xa / a;

			console.log(cx, cy);
		}*/
	}
}

/**
 * @ignore
 */
class LineTo extends Op {
	constructor(public x: number, public y: number) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		context.lineTo(this.x, this.y);
	}

	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.x, y: this.y });
	}
}

/**
 * @ignore
 */
class MoveTo extends Op {
	constructor(public x: number, public y: number) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		context.moveTo(this.x, this.y);
	}

	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.x, y: this.y });
	}
}

/**
 * @ignore
 */
class ClosePath extends Op {
	public path(context: CanvasRenderingContext2D): void {
		context.closePath();
	}
}

/**
 * @ignore
 */
class BezierCurveTo extends Op {
	constructor(
		public cpX: number,
		public cpY: number,
		public cpX2: number,
		public cpY2: number,
		public toX: number,
		public toY: number,
	) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		context.bezierCurveTo(this.cpX, this.cpY, this.cpX2, this.cpY2, this.toX, this.toY);
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
class QuadraticCurveTo extends Op {
	constructor(
		public cpX: number,
		public cpY: number,
		public toX: number,
		public toY: number,
	) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		context.quadraticCurveTo(this.cpX, this.cpY, this.toX, this.toY);
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
class Shadow extends Op {
	constructor(
		public color: string,
		public blur: number,
		public offsetX: number,
		public offsetY: number,
		public opacity?: number
	) { super(); }

	public colorize(context: CanvasRenderingContext2D, _forceColor: string | undefined): void {
		if (this.opacity) {
			context.fillStyle = this.color;
		}
		context.shadowColor = this.color;
		context.shadowBlur = this.blur;
		context.shadowOffsetX = this.offsetX;
		context.shadowOffsetY = this.offsetY;
	}

	public colorizeGhost(_context: CanvasRenderingContext2D, _forceColor: string | undefined): void {}
}

/**
 * @ignore
 */
class GraphicsImage extends Op {
	constructor(
		public image: HTMLImageElement | HTMLCanvasElement,
		public width: number,
		public height: number,
		public x: number,
		public y: number
	) { super(); }

	public path(context: CanvasRenderingContext2D): void {
		context.drawImage(this.image, this.x, this.y, this.width, this.height);
	}

	// TODO: OK?
	public addBounds(bounds: IBounds): void {
		setPoint(bounds, { x: this.x, y: this.y });
		setPoint(bounds, { x: this.width, y: this.height });
	}
}

/**
 * @ignore
 */
export class CanvasGraphics extends CanvasDisplayObject implements IGraphics {
	protected _operations: Array<Op> = [];

	public blendMode: BlendMode = BlendMode.NORMAL;

	protected _hasShadows: boolean = false;
	protected _fillAlpha?: number;
	protected _strokeAlpha?: number;

	clear(): void {
		super.clear();
		this._operations.length = 0;
	}

	protected _pushOp(op: Op): void {
		this._operations.push(op);
	}

	beginFill(color?: Color | CanvasGradient | CanvasPattern, alpha: number = 1): void {
		this._fillAlpha = alpha;
		if (color) {
			if (color instanceof Color) {
				this._pushOp(new BeginFill(color.toCSS(alpha)));

			} else {
				this.isMeasured = true;
				this._pushOp(new BeginFill(color));
			}
		} else {
			this._pushOp(new BeginFill("rgba(0, 0, 0, " + alpha + ")"));
		}
	}

	endFill(): void {
		this._pushOp(new EndFill(this._hasShadows));
	}

	endStroke(): void {
		this._pushOp(new EndStroke());
	}

	beginPath(): void {
		this._pushOp(new BeginPath());
	}

	lineStyle(width: number = 0, color?: Color | CanvasGradient | CanvasPattern, alpha: number = 1, lineJoin?: "miter" | "round" | "bevel", lineCap?: "butt" | "round" | "square"): void {
		this._strokeAlpha = alpha;
		if (color) {
			if (color instanceof Color) {
				this._pushOp(new LineStyle(width, color.toCSS(alpha), lineJoin, lineCap));
			} else {
				this._pushOp(new LineStyle(width, color, lineJoin, lineCap));
			}
		} else {
			this._pushOp(new LineStyle(width, "rgba(0, 0, 0, " + alpha + ")", lineJoin, lineCap));
		}
	}

	setLineDash(dash?: number[]): void {
		this._pushOp(new LineDash(dash ? dash : []));
	}

	setLineDashOffset(dashOffset: number = 0): void {
		this._pushOp(new LineDashOffset(dashOffset));
	}

	drawRect(x: number, y: number, width: number, height: number): void {
		this._pushOp(new DrawRect(x, y, width, height));
	}

	drawCircle(x: number, y: number, radius: number): void {
		this._pushOp(new DrawCircle(x, y, radius));
	}

	drawEllipse(x: number, y: number, radiusX: number, radiusY: number): void {
		this._pushOp(new DrawEllipse(x, y, radiusX, radiusY));
	}

	arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean = false): void {
		this._pushOp(new Arc(cx, cy, radius, startAngle, endAngle, anticlockwise));
	}

	arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
		this._pushOp(new ArcTo(x1, y1, x2, y2, radius));
	}

	lineTo(x: number, y: number): void {
		this._pushOp(new LineTo(x, y));
	}

	moveTo(x: number, y: number): void {
		this._pushOp(new MoveTo(x, y));
	}

	bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): void {
		this._pushOp(new BezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY));
	}

	quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): void {
		this._pushOp(new QuadraticCurveTo(cpX, cpY, toX, toY));
	}

	closePath(): void {
		this._pushOp(new ClosePath());
	}

	shadow(color: Color, blur: number = 0, offsetX: number = 0, offsetY: number = 0, opacity?: number): void {
		this._hasShadows = true;
		this._pushOp(new Shadow(opacity ? color.toCSS(opacity) : color.toCSS(this._fillAlpha || this._strokeAlpha), blur, offsetX, offsetY));
	}

	image(image: HTMLImageElement | HTMLCanvasElement, width: number, height: number, x: number, y: number): void {
		this._pushOp(new GraphicsImage(image, width, height, x, y));
	}

	// https://svgwg.org/svg2-draft/paths.html#DProperty
	// TODO better error checking
	svgPath(path: string): void {
		let x = 0;
		let y = 0;
		let cpx: number | null = null;
		let cpy: number | null = null;
		let qcpx: number | null = null;
		let qcpy: number | null = null;

		const SEGMENTS_REGEXP = /([MmZzLlHhVvCcSsQqTtAa])([^MmZzLlHhVvCcSsQqTtAa]*)/g;
		const ARGS_REGEXP = /[\u0009\u0020\u000A\u000C\u000D]*([\+\-]?[0-9]*\.?[0-9]+(?:[eE][\+\-]?[0-9]+)?)[\u0009\u0020\u000A\u000C\u000D]*,?/g;

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
	}


	public _runPath(context: CanvasRenderingContext2D): void {
		context.beginPath();

		$array.each(this._operations, (op) => {
			op.path(context);
		});
	}

	protected _render(status: IStatus, targetGhostLayer: number = 0): void {
		super._render(status);

		const layerDirty = status.layer.dirty;
		const interactive = this._isInteractive(status);
		const ghostOnly = this._ghostOnly(targetGhostLayer);
		const drawGhost = this._drawGhost(status, targetGhostLayer);

		if (layerDirty || interactive || ghostOnly) {

			const context = status.layer.context;
			const ghostContext = this._renderer._ghostLayer.context;

			if (layerDirty && !ghostOnly) {
				context.globalCompositeOperation = this.blendMode;
				context.beginPath();
			}

			let color: string | undefined;

			if (drawGhost) {
				ghostContext.beginPath();
				color = this._getColorId();
			}

			$array.each(this._operations, (op) => {
				if (layerDirty && !ghostOnly) {
					op.path(context);
					op.colorize(context, undefined);
				}

				if (drawGhost) {
					op.pathGhost(ghostContext);
					op.colorizeGhost(ghostContext, color);
				}
			});
		}
	}

	public renderDetached(context: CanvasRenderingContext2D): void {
		if (this.visible) {
			this._setMatrix();

			context.save();

			// We must apply the mask before we transform the element
			const mask = this.mask;
			if (mask) {
				mask._setMatrix();
				mask._transform(context, 1);
				mask._runPath(context);
				context.clip();
			}

			// TODO handle compoundAlpha somehow ?
			context.globalAlpha = this.compoundAlpha * this.alpha;

			this._transform(context, 1);

			if (this.filter) {
				context.filter = this.filter;
			}

			context.globalCompositeOperation = this.blendMode;

			context.beginPath();

			$array.each(this._operations, (op) => {
				op.path(context);
				op.colorize(context, undefined);
			});

			context.restore();
		}
	}

	public _addBounds(bounds: IBounds): void {
		if (this.visible && this.isMeasured) {
			$array.each(this._operations, (op) => {
				op.addBounds(bounds);
			});
		}
	}
}

/**
 * @ignore
 */
interface ILineChunk {
	style: string | undefined,
	fill: Color | undefined,
	text: string,
	width: number,
	height: number,
	left: number,
	right: number,
	ascent: number,
	offsetX: number,
	offsetY: number,
	textDecoration: string | undefined,
	verticalAlign?: "baseline" | "sub" | "super"
}

/**
 * @ignore
 */
interface ILine {
	offsetY: number,
	ascent: number,
	width: number,
	height: number,
	left: number,
	right: number,
	textChunks: Array<ILineChunk>,
}

/**
 * @ignore
 */
export class CanvasText extends CanvasDisplayObject implements IText {
	public text: string;
	public style: CanvasTextStyle;
	public resolution: number = 1;
	public textVisible: boolean = true;
	public truncated?: boolean;

	protected _textInfo: Array<ILine> | undefined;
	protected _originalScale?: number = 1;

	constructor(renderer: CanvasRenderer, text: string, style: CanvasTextStyle) {
		super(renderer);
		this.text = text;
		this.style = style;
	}

	public invalidateBounds(): void {
		super.invalidateBounds();
		this._textInfo = undefined;
	}

	private _shared(context: CanvasRenderingContext2D) {
		if (this.style.textAlign) {
			context.textAlign = this.style.textAlign;
		}

		if (this.style.direction) {
			context.direction = this.style.direction;
		}

		if (this.style.textBaseline) {
			context.textBaseline = this.style.textBaseline;
		}

	}

	protected _prerender(status: IStatus, ignoreGhost = false, ignoreFontWeight = false): void {
		super._render(status);

		const context = status.layer.context;
		const ghostContext = this._renderer._ghostLayer.context;

		// Font style

		const style = this.style;
		let fontStyle = this._getFontStyle(undefined, ignoreFontWeight);

		context.font = fontStyle;
		if (this._isInteractive(status) && !ignoreGhost) {
			ghostContext.font = fontStyle;
		}

		// Other parameters
		if (style.fill) {
			if (style.fill instanceof Color) {
				context.fillStyle = style.fill.toCSS(style.fillOpacity != undefined ? style.fillOpacity : 1);
			} else {
				context.fillStyle = style.fill;
			}
		}

		if (style.shadowColor) {
			status.layer.context.shadowColor = style.shadowColor.toCSS(style.shadowOpacity || 1);
		}
		if (style.shadowBlur) {
			status.layer.context.shadowBlur = style.shadowBlur;
		}
		if (style.shadowOffsetX) {
			status.layer.context.shadowOffsetX = style.shadowOffsetX;
		}
		if (style.shadowOffsetY) {
			status.layer.context.shadowOffsetY = style.shadowOffsetY;
		}

		this._shared(context);

		if (this._isInteractive(status) && !ignoreGhost) {
			ghostContext.fillStyle = this._getColorId();
			this._shared(ghostContext);
		}
	}

	protected _getFontStyle(style2?: ITextStyle, ignoreFontWeight = false): string {

		// Process defaults
		const style = this.style;
		let fontStyle: string[] = [];

		if (style2 && style2.fontVariant) {
			fontStyle.push(style2.fontVariant);
		}
		else if (style.fontVariant) {
			fontStyle.push(style.fontVariant);
		}

		if (!ignoreFontWeight) {
			if (style2 && style2.fontWeight) {
				fontStyle.push(style2.fontWeight);
			}
			else if (style.fontWeight) {
				fontStyle.push(style.fontWeight);
			}
		}

		if (style2 && style2.fontStyle) {
			fontStyle.push(style2.fontStyle);
		}
		else if (style.fontStyle) {
			fontStyle.push(style.fontStyle);
		}

		if (style2 && style2.fontSize) {
			if ($type.isNumber(style2.fontSize)) {
				style2.fontSize = style2.fontSize + "px";
			}
			fontStyle.push(style2.fontSize);
		}
		else if (style.fontSize) {
			if ($type.isNumber(style.fontSize)) {
				style.fontSize = style.fontSize + "px";
			}
			fontStyle.push(style.fontSize);
		}

		if (style2 && style2.fontFamily) {
			fontStyle.push(style2.fontFamily);
		}
		else if (style.fontFamily) {
			fontStyle.push(style.fontFamily);
		}
		else if (fontStyle.length) {
			fontStyle.push("Arial");
		}

		return fontStyle.join(" ");
	}

	protected _render(status: IStatus, targetGhostLayer: number = 0): void {
		// We need measurements in order to properly position text for alignment
		if (!this._textInfo) {
			this._measure(status);
		}

		if (this.textVisible) {

			const interactive = this._isInteractive(status);
			const context = status.layer.context;
			const layerDirty = status.layer.dirty;
			const ghostContext = this._renderer._ghostLayer.context;

			const ghostOnly = this._ghostOnly(targetGhostLayer);
			const drawGhost = this._drawGhost(status, targetGhostLayer);

			context.save();
			ghostContext.save();
			this._prerender(status);

			// const lines = this.text.toString().replace(/\r/g, "").split(/\n/);
			// const x = this._localBounds && (this._localBounds.left < 0) ? Math.abs(this._localBounds.left) : 0;

			// Process text info produced by _measure()
			$array.each(this._textInfo!, (line, _index) => {
				$array.each(line.textChunks, (chunk, _index) => {

					// Set style
					if (chunk.style) {
						context.save();
						ghostContext.save();

						if (!ghostOnly) {
							context.font = chunk.style;
						}

						if (this._isInteractive(status)) {
							ghostContext.font = chunk.style;
						}
					}

					if (chunk.fill) {
						context.save();
						if (!ghostOnly) {
							context.fillStyle = chunk.fill.toCSS();
						}
						// Color does not affect ghostContext so we not set it
					}

					// Draw text
					if (layerDirty && !ghostOnly) {
						context.fillText(chunk.text, chunk.offsetX, line.offsetY + chunk.offsetY);
					}

					// Draw underline
					if (chunk.textDecoration == "underline" || chunk.textDecoration == "line-through") {

						let thickness = 1;
						let offset = 1;
						let fontSize = chunk.height;

						const oversizedBehavior = this.style.oversizedBehavior || "";
						if (["truncate", "wrap", "wrap-no-break"].indexOf(oversizedBehavior) > -1) {
							// Measure actual width of the text so the line fits
							const metrics = this._measureText(chunk.text, context);
							chunk.width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
						}

						let offsetX = chunk.offsetX;
						switch (this.style.textAlign) {
							case "right":
							case "end":
								offsetX -= chunk.width;
								break;
							case "center":
								offsetX -= chunk.width / 2;
								break;
						}

						if (chunk.style) {
							const format = TextFormatter.getTextStyle(chunk.style);
							switch (format.fontWeight) {
								case "bolder":
								case "bold":
								case "700":
								case "800":
								case "900":
									thickness = 2;
									break;
							}
						}

						if (fontSize) {
							offset = fontSize / 20;
						}

						let y: number;

						if (chunk.textDecoration == "line-through") {
							y = thickness + line.offsetY + chunk.offsetY - chunk.height / 2;
						}
						else {
							y = thickness + offset * 1.5 + line.offsetY + chunk.offsetY;
						}

						if (!ghostOnly) {
							context.save();
							context.beginPath();
							if (chunk.fill) {
								context.strokeStyle = chunk.fill.toCSS();
							}
							else if (this.style.fill && this.style.fill instanceof Color) {
								context.strokeStyle = this.style.fill.toCSS();
							}
							context.lineWidth = thickness * offset;
							context.moveTo(offsetX, y);
							context.lineTo(offsetX + chunk.width, y);
							context.stroke();
							context.restore();
						}
					}

					if (interactive && this.interactive && drawGhost) {
						// Draw text in ghost canvas ONLY if it is set as interactive
						// explicitly. This way we avoid hit test anomalies caused by anti
						// aliasing of text.
						ghostContext.fillText(chunk.text, chunk.offsetX, line.offsetY + chunk.offsetY);
					}

					if (chunk.fill) {
						context.restore();
						// Color does not affect ghostContext so we not set it
					}

					// Reset style
					if (chunk.style) {
						context.restore();
						ghostContext.restore();
					}

				});
			});

			context.restore();
			ghostContext.restore();
		}
	}

	public _addBounds(bounds: IBounds): void {
		if (this.visible && this.isMeasured) {
			//if (this._textVisible) {
			const x = this._measure({
				inactive: this.inactive,
				layer: this.getLayer(),
			});
			setPoint(bounds, { x: x.left, y: x.top });
			setPoint(bounds, { x: x.right, y: x.bottom });
			//}
		}
	}

	protected _ignoreFontWeight(): boolean {
		return /apple/i.test(navigator.vendor);
	}

	public _measure(status: IStatus): IBounds {
		const context = status.layer.context;
		const ghostContext = this._renderer._ghostLayer.context;
		const rtl = this.style.direction == "rtl";

		// Reset text info
		this._textInfo = [];

		// Init
		const oversizedBehavior = this.style.oversizedBehavior;
		const maxWidth = this.style.maxWidth!;

		const truncate = $type.isNumber(maxWidth) && oversizedBehavior == "truncate";
		const wrap = $type.isNumber(maxWidth) && (oversizedBehavior == "wrap" || oversizedBehavior == "wrap-no-break");

		// Pre-render
		context.save();
		ghostContext.save();
		this._prerender(status, true, this._ignoreFontWeight());

		// Get default font metrix
		const refText = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";

		// Split up text into lines
		const lines = this.text.toString().replace(/\r/g, "").split(/\n/);
		let styleRestored = true;
		let minX = 0;
		let maxX = 0;

		// Iterate through the lines
		let offsetY = 0;
		let currentStyle: string | undefined;
		$array.each(lines, (line, _index) => {

			// Split up line into format/value chunks
			let chunks: ITextChunk[];
			if (line == "") {
				chunks = [{
					type: "value",
					text: ""
				}];
			}
			else {
				chunks = TextFormatter.chunk(line, false, this.style.ignoreFormatting);
			}

			while (chunks.length > 0) {

				// Init line object
				let lineInfo: ILine = {
					offsetY: offsetY,
					ascent: 0,
					width: 0,
					height: 0,
					left: 0,
					right: 0,
					textChunks: []
				};

				// Measure reference text
				const metrics = this._measureText(refText, context);

				const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
				lineInfo.height = height;
				lineInfo.ascent = metrics.actualBoundingBoxAscent;

				let currentFormat: string;
				let currentDecoration: string | undefined = this.style.textDecoration;
				let currentFill: Color | undefined;
				let currentChunkWidth: number | undefined;
				let skipFurtherText = false;
				let firstTextChunk = true;
				let leftoverChunks: Array<ITextChunk> = [];
				let currentVerticalAlign: "baseline" | "sub" | "super" | undefined;
				//let offsetX = 0;
				//let chunk;

				//while(chunk = chunks.shift()) {
				$array.eachContinue(chunks, (chunk, index) => {

					// Format chunk
					if (chunk.type == "format") {
						if (chunk.text == "[/]") {
							if (!styleRestored) {
								context.restore();
								ghostContext.restore();
								styleRestored = true;
							}
							currentFill = undefined;
							currentStyle = undefined;
							currentChunkWidth = undefined;
							currentDecoration = this.style.textDecoration;
							currentVerticalAlign = undefined
							currentFormat = chunk.text;
						}
						else {

							if (!styleRestored) {
								context.restore();
								ghostContext.restore();
							}

							let format = TextFormatter.getTextStyle(chunk.text);
							const fontStyle = this._getFontStyle(format);
							context.save();
							ghostContext.save();
							context.font = fontStyle;
							currentStyle = fontStyle;
							currentFormat = chunk.text;
							if (format.textDecoration) {
								currentDecoration = format.textDecoration;
							}
							if (format.fill) {
								currentFill = <Color>format.fill;
							}
							if ((<any>format).width) {
								currentChunkWidth = $type.toNumber((<any>format).width);
							}
							if (format.verticalAlign) {
								currentVerticalAlign = format.verticalAlign;
							}
							styleRestored = false;

							// Measure reference text after change of format
							const metrics = this._measureText(refText, context);
							const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
							if (height > lineInfo.height) {
								lineInfo.height = height;
							}
							if (metrics.actualBoundingBoxAscent > lineInfo.ascent) {
								lineInfo.ascent = metrics.actualBoundingBoxAscent;
							}
						}
					}

					// Text chunk
					else if (chunk.type == "value" && !skipFurtherText) {

						// Measure
						const metrics = this._measureText(chunk.text, context);
						let chunkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;

						// Check for fit
						if (truncate) {

							this.truncated = undefined;

							// Break words?
							let breakWords = firstTextChunk || this.style.breakWords || false;

							// Measure ellipsis and check if it fits
							const ellipsis = this.style.ellipsis || "";
							const ellipsisMetrics = this._measureText(ellipsis, context);
							const ellipsisWidth = ellipsisMetrics.actualBoundingBoxLeft + ellipsisMetrics.actualBoundingBoxRight;

							// Check fit
							if ((lineInfo.width + chunkWidth) > maxWidth) {
								const excessWidth = maxWidth - lineInfo.width - ellipsisWidth;
								chunk.text = this._truncateText(context, chunk.text, excessWidth, breakWords);
								chunk.text += ellipsis;
								skipFurtherText = true;
								this.truncated = true;
							}

						}
						else if (wrap) {
							// Check fit
							if ((lineInfo.width + chunkWidth) > maxWidth) {
								const excessWidth = maxWidth - lineInfo.width;
								const tmpText = this._truncateText(
									context,
									chunk.text,
									excessWidth,
									false,
									(firstTextChunk && this.style.oversizedBehavior != "wrap-no-break")
								);

								if (tmpText == "") {
									// Unable to fit a single letter - hide the whole label
									this.textVisible = true;
									return false;
								}
								//skipFurtherText = true;

								//Add remaining chunks for the next line
								leftoverChunks = chunks.slice(index + 1);

								//Add remaining text of current chunk if it was forced-cut
								if ($utils.trim(tmpText) != $utils.trim(chunk.text)) {
									leftoverChunks.unshift({
										type: "value",
										text: chunk.text.substr(tmpText.length)
									});
									if (currentFormat) {
										leftoverChunks.unshift({
											type: "format",
											text: currentFormat
										});
									}
								}

								// Set current chunk (truncated)
								chunk.text = $utils.trim(tmpText);

								chunks = [];
								skipFurtherText = true;
							}

						}

						// Chunk width?
						let leftBoundMod = 1;
						let rightBoundMod = 1;
						if (currentStyle && currentChunkWidth && (currentChunkWidth > chunkWidth)) {
							// increase horizontal bounding boxes accordingly
							const boundsMod = chunkWidth / currentChunkWidth
							switch (this.style.textAlign) {
								case "right":
								case "end":
									leftBoundMod = boundsMod;
									break;
								case "center":
									leftBoundMod = boundsMod;
									rightBoundMod = boundsMod;
									break;
								default:
									rightBoundMod = boundsMod;
							}
							chunkWidth = currentChunkWidth;
						}

						const chunkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;


						if (chunkHeight > lineInfo.height) {
							lineInfo.height = chunkHeight;
						}
						if (metrics.actualBoundingBoxAscent > lineInfo.ascent) {
							lineInfo.ascent = metrics.actualBoundingBoxAscent;
						}

						lineInfo.width += chunkWidth;
						lineInfo.left += metrics.actualBoundingBoxLeft / leftBoundMod;
						lineInfo.right += metrics.actualBoundingBoxRight / rightBoundMod;
						lineInfo.textChunks.push({
							style: currentStyle,
							fill: currentFill,
							text: chunk.text,
							width: chunkWidth,
							height: chunkHeight,
							left: metrics.actualBoundingBoxLeft,
							right: metrics.actualBoundingBoxRight,
							ascent: metrics.actualBoundingBoxAscent,
							offsetX: 0,
							offsetY: 0,
							textDecoration: currentDecoration,
							verticalAlign: currentVerticalAlign
						});

						//offsetX += chunkWidth;

						firstTextChunk = false;

					}

					if (leftoverChunks) {
						//return false;
					}

					return true;

					//}
				});

				if (this.style.lineHeight instanceof Percent) {
					lineInfo.height *= this.style.lineHeight.value;
					lineInfo.ascent *= this.style.lineHeight.value;
				}
				else {
					lineInfo.height *= this.style.lineHeight || 1.2;
					lineInfo.ascent *= this.style.lineHeight || 1.2;
				}

				if (minX < lineInfo.left) {
					minX = lineInfo.left;
				}

				if (maxX < lineInfo.right) {
					maxX = lineInfo.right;
				}

				this._textInfo!.push(lineInfo);

				//lineInfo.offsetY += lineInfo.ascent;
				offsetY += lineInfo.height;

				// Reset chunks so that it can proceed to the next line
				chunks = leftoverChunks || [];
			}

		});

		if (!styleRestored) {
			context.restore();
			ghostContext.restore();
		}

		// Adjust chunk internal offsets
		$array.each(this._textInfo, (lineInfo, _index: number) => {
			let currentChunkOffset = 0
			$array.each(lineInfo.textChunks, (chunk) => {
				chunk.offsetX = currentChunkOffset + chunk.left - lineInfo.left;
				chunk.offsetY += lineInfo.height - lineInfo.height * (this.style.baselineRatio || 0.19);
				currentChunkOffset += chunk.width;

				if (chunk.verticalAlign) {
					switch (chunk.verticalAlign) {
						case "super":
							chunk.offsetY -= lineInfo.height / 2 - chunk.height / 2;
							break;
						case "sub":
							chunk.offsetY += chunk.height / 2;
							break;
					}
				}
			});
		});

		const bounds = {
			left: rtl ? -maxX : -minX,
			top: 0,
			right: rtl ? minX : maxX,
			bottom: offsetY,
		};


		// We need to fit?
		if (oversizedBehavior !== "none") {
			const ratio = this._fitRatio(bounds);
			if (ratio < 1) {
				if (oversizedBehavior == "fit") {
					if ($type.isNumber(this.style.minScale) && (ratio < this.style.minScale)) {
						this.textVisible = false;
						bounds.left = 0;
						bounds.top = 0;
						bounds.right = 0;
						bounds.bottom = 0;
					}
					else {
						if (!this._originalScale) {
							this._originalScale = this.scale;
						}
						this.scale = ratio;
						this.textVisible = true;
					}
				}
				else if (oversizedBehavior == "hide") {
					this.textVisible = false;
					bounds.left = 0;
					bounds.top = 0;
					bounds.right = 0;
					bounds.bottom = 0;
				}
				else {

					switch (this.style.textAlign) {
						case "right":
						case "end":
							bounds.left = rtl ? maxWidth : -maxWidth;
							bounds.right = 0;
							break;
						case "center":
							bounds.left = -maxWidth / 2;
							bounds.right = maxWidth / 2;
							break;
						default:
							bounds.left = 0;
							bounds.right = rtl ? -maxWidth : maxWidth;
					}

					this.scale = this._originalScale || 1;
					this._originalScale = undefined;
					this.textVisible = true;
				}
			}
			else {
				this.scale = this._originalScale || 1;
				this._originalScale = undefined;
				this.textVisible = true;
			}
		}

		context.restore();
		ghostContext.restore();

		return bounds;
	}

	protected _fitRatio(bounds: IBounds): number {
		const maxW = this.style.maxWidth;
		const maxH = this.style.maxHeight;
		if (!$type.isNumber(maxW) && !$type.isNumber(maxH)) {
			return 1;
		}
		const w = bounds.right - bounds.left;
		const h = bounds.bottom - bounds.top;
		return Math.min(maxW! / w || 1, maxH! / h || 1);
	}

	protected _truncateText(context: CanvasRenderingContext2D, text: string, maxWidth: number, breakWords: boolean = false, fallbackBreakWords: boolean = true): string {
		let width: number;
		do {
			if (breakWords) {
				text = text.slice(0, -1);
			}
			else {
				let tmp = text.replace(/[^,;:!?\\\/\s​]+[,;:!?\\\/\s​]*$/g, "");
				if ((tmp == "" || tmp === text) && fallbackBreakWords) {
					breakWords = true;
				}
				else if (tmp == "") {
					return text;
				}
				else {
					text = tmp;
				}
			}
			const metrics = this._measureText(text, context);
			width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
		} while ((width > maxWidth) && text != "");
		return text;
	}

	protected _measureText(text: string, context: CanvasRenderingContext2D): TextMetrics {
		let metrics = context.measureText(text);
		let fakeMetrics: any = {};
		if (metrics.actualBoundingBoxAscent == null) {
			const div = document.createElement("div");
			div.innerText = text;
			div.style.visibility = "hidden";
			div.style.position = "absolute";
			div.style.top = "-1000000px;"
			div.style.fontFamily = this.style.fontFamily || "";
			div.style.fontSize = this.style.fontSize + "";
			document.body.appendChild(div);
			const bbox = div.getBoundingClientRect();
			document.body.removeChild(div);
			const h = bbox.height;
			const w = metrics.width;
			let left = 0;
			let right = w;

			fakeMetrics = {
				actualBoundingBoxAscent: h,
				actualBoundingBoxDescent: 0,
				actualBoundingBoxLeft: left,
				actualBoundingBoxRight: right,
				fontBoundingBoxAscent: h,
				fontBoundingBoxDescent: 0,
				width: w
			}
			//return fake;
		}
		else {
			fakeMetrics = {
				actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
				actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
				actualBoundingBoxLeft: metrics.actualBoundingBoxLeft,
				actualBoundingBoxRight: metrics.actualBoundingBoxRight,
				fontBoundingBoxAscent: metrics.actualBoundingBoxAscent,
				fontBoundingBoxDescent: metrics.actualBoundingBoxDescent,
				width: metrics.width
			}
		}

		const w = metrics.width;
		switch (this.style.textAlign) {
			case "right":
			case "end":
				fakeMetrics.actualBoundingBoxLeft = w;
				fakeMetrics.actualBoundingBoxRight = 0;
				break;
			case "center":
				fakeMetrics.actualBoundingBoxLeft = w / 2;
				fakeMetrics.actualBoundingBoxRight = w / 2;
				break;
			default:
				fakeMetrics.actualBoundingBoxLeft = 0;
				fakeMetrics.actualBoundingBoxRight = w;
		}

		return fakeMetrics;
	}

}

/**
 * @ignore
 */
export class CanvasTextStyle implements ITextStyle {
	//public wordWrapWidth: number = 100;
	public fill?: Color | CanvasGradient | CanvasPattern;
	public fillOpacity?: number;
	public textAlign?: "start" | "end" | "left" | "right" | "center";
	public fontFamily?: string;
	public fontSize?: string | number;
	public fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
	public fontStyle?: 'normal' | 'italic' | 'oblique';
	public fontVariant?: "normal" | "small-caps";
	public textDecoration?: "underline" | "line-through";
	public shadowColor?: Color | null;
	public shadowBlur?: number;
	public shadowOffsetX?: number;
	public shadowOffsetY?: number;
	public shadowOpacity?: number;
	// leading?: number;
	// letterSpacing?: number;
	public lineHeight?: number | Percent = percent(120);
	public baselineRatio?: number = 0.19;
	// padding?: number;
	// stroke?: number;
	// strokeThickness?: number;
	// trim?: number;
	// wordWrap?: boolean;
	public direction?: "ltr" | "rtl";
	public textBaseline?: "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";
	public oversizedBehavior?: "none" | "hide" | "fit" | "wrap" | "wrap-no-break" | "truncate" = "none";
	public breakWords?: boolean = false;
	public ellipsis?: string = "…";
	public maxWidth?: number;
	public maxHeight?: number;
	public minScale?: number;
	public ignoreFormatting?: boolean = false;
}

/**
 * @ignore
 */
export class CanvasRadialText extends CanvasText implements IRadialText {
	public textType?: "regular" | "circular" | "radial" | "aligned" | "adjusted" = "circular";
	public radius?: number;
	public startAngle?: number;
	public inside?: boolean = false;
	public orientation?: "inward" | "outward" | "auto" = "auto";
	public kerning?: number = 0;

	private _textReversed: boolean = false;

	public _render(status: IStatus, targetGhostLayer: number = 0): void {
		switch (this.textType) {
			case "circular":
				this._renderCircular(status, targetGhostLayer);
				break;
			default:
				super._render(status, targetGhostLayer);
				break;
		}
	}

	public _renderCircular(status: IStatus, targetGhostLayer: number = 0): void {
		if (this.textVisible) {
			this._prerender(status);

			const interactive = this._isInteractive(status);
			const context = status.layer.context;
			const layerDirty = status.layer.dirty;
			const ghostContext = this._renderer._ghostLayer.context;

			// Savepoint
			context.save();
			if (interactive) {
				ghostContext.save();
			}

			// We need measurements in order to properly position text for alignment
			if (!this._textInfo) {
				this._measure(status);
			}

			// Init
			let radius = (this.radius || 0);
			let startAngle = (this.startAngle || 0);
			let deltaAngle = 0;
			let orientation = this.orientation;
			let inward = orientation == "auto" ? "auto" : orientation == "inward";
			const inside = this.inside;
			const align = this.style.textAlign || "left";
			const kerning = this.kerning || 0;
			let clockwise = align == "left" ? 1 : -1;
			const shouldReverse = !this._textReversed;

			const ghostOnly = this._ghostOnly(targetGhostLayer);
			const drawGhost = this._drawGhost(status, targetGhostLayer);

			// Check if we need to invert the whole stuff
			if (inward == "auto") {
				// Calc max angle so we know whether we need to flip it
				let maxAngle = 0;
				let midAngle = 0;
				$array.each(this._textInfo!, (line, _index) => {
					const deltaAngle = startAngle + (line.width / (radius - line.height)) / 2 * -clockwise;
					if (deltaAngle > maxAngle) {
						maxAngle = deltaAngle;
					}
				});
				if (align == "left") {
					midAngle = (maxAngle + deltaAngle / 2) * $math.DEGREES;
				}
				else if (align == "right") {
					midAngle = (maxAngle - deltaAngle / 2) * $math.DEGREES;
				}
				else {
					midAngle = startAngle * $math.DEGREES;
				}
				midAngle = $math.normalizeAngle(midAngle);
				inward = (midAngle >= 270) || (midAngle <= 90);
			}

			if (inward == true && shouldReverse) {
				this._textInfo!.reverse();
				this._textReversed = true;
			}

			// if ((inward == false && align == "left") || (inward == true && align == "right")) {
			// 	clockwise *= -1;
			// }

			// Process text info produced by _measure()
			$array.each(this._textInfo!, (line, _index) => {

				const textHeight = line.height;

				// Adjust radius (for `inside = false`)
				// Radius adjustment for `inside = false` is below the line calculation
				if (!inside) {
					radius += textHeight;
				}

				// Reverse letters if we're painting them counter-clockwise
				if (((clockwise == -1 && inward) || (clockwise == 1 && !inward)) && shouldReverse) {
					line.textChunks.reverse();
				}

				// Init angles
				let lineStartAngle = startAngle;
				deltaAngle = 0;

				// Adjust for center-align
				if (align == "center") {
					lineStartAngle += (line.width / (radius - textHeight)) / 2 * -clockwise;
					deltaAngle = lineStartAngle - startAngle;
				}

				// if (inward == "auto") {
				// 	let midAngle;
				// 	if (align == "left") {
				// 		midAngle = (lineStartAngle + deltaAngle / 2) * $math.DEGREES;
				// 	}
				// 	else if () {
				// 		midAngle = (lineStartAngle - deltaAngle / 2) * $math.DEGREES;
				// 	}
				// 	inward = (midAngle >= 270) || (midAngle <= 90);
				// }

				// Rotate letters if they are facing outward
				lineStartAngle += (Math.PI * (inward ? 0 : 1)); // Rotate 180 if outward

				// Savepoint
				context.save();
				if (interactive) {
					ghostContext.save();
				}

				// Assume starting angle
				if (!ghostOnly) {
					context.rotate(lineStartAngle);
				}
				if (interactive) {
					ghostContext.rotate(lineStartAngle);
				}

				let angleShift = 0;
				$array.each(line.textChunks, (chunk, _index) => {

					// Draw the letter
					const char = chunk.text;
					const charWidth = chunk.width;

					// Rotate half a letter
					angleShift = (charWidth / 2) / (radius - textHeight) * clockwise;
					if (!ghostOnly) {
						context.rotate(angleShift);
					}
					if (interactive) {
						ghostContext.rotate(angleShift);
					}

					// Set style
					if (chunk.style) {
						context.save();
						ghostContext.save();

						if (!ghostOnly) {
							context.font = chunk.style;
						}
						if (interactive) {
							ghostContext.font = chunk.style;
						}
					}

					if (chunk.fill) {
						context.save();
						if (!ghostOnly) {
							context.fillStyle = chunk.fill.toCSS();
						}
						// Color does not affect ghostContext so we not set it
					}

					// Center letters
					if (!ghostOnly) {
						context.textBaseline = "middle";
						context.textAlign = "center";
					}
					if (interactive) {
						ghostContext.textBaseline = "middle";
						ghostContext.textAlign = "center";
					}

					// Plop the letter
					if (layerDirty && !ghostOnly) {
						context.fillText(char, 0, (inward ? 1 : -1) * (0 - radius + textHeight / 2));
					}
					if (interactive && drawGhost) {
						ghostContext.fillText(char, 0, (inward ? 1 : -1) * (0 - radius + textHeight / 2));
					}

					if (chunk.fill) {
						context.restore();
						// Color does not affect ghostContext so we not set it
					}

					// Reset style
					if (chunk.style) {
						context.restore();
						ghostContext.restore();
					}

					// Rotate half a letter and add spacing
					angleShift = (charWidth / 2 + kerning) / (radius - textHeight) * clockwise;
					if (!ghostOnly) {
						context.rotate(angleShift);
					}
					if (interactive) {
						ghostContext.rotate(angleShift);
					}

				});

				// Restore angle
				context.restore();
				if (interactive) {
					ghostContext.restore();
				}

				// Adjust radius (for `inside = true`)
				if (inside) {
					radius -= textHeight;
				}

			});

			// Restore
			context.restore();
			if (interactive) {
				ghostContext.restore();
			}
		}
	}

	public _measure(status: IStatus): IBounds {
		switch (this.textType) {
			case "circular":
				return this._measureCircular(status);
			default:
				return super._measure(status);
		}
	}

	public _measureCircular(status: IStatus): IBounds {
		const context = status.layer.context;
		const ghostContext = this._renderer._ghostLayer.context;
		const rtl = this.style.direction == "rtl";

		const oversizedBehavior = this.style.oversizedBehavior;
		const maxWidth = this.style.maxWidth!;

		const truncate = $type.isNumber(maxWidth) && oversizedBehavior == "truncate";
		const ellipsis = this.style.ellipsis || "";
		let ellipsisMetrics: TextMetrics;
		//const wrap = $type.isNumber(maxWidth) && (oversizedBehavior == "wrap" || oversizedBehavior == "wrap-no-break");


		// Reset text info
		this.textVisible = true;
		this._textInfo = [];
		this._textReversed = false;

		// Pre-render
		context.save();
		ghostContext.save();
		this._prerender(status, true);

		// Split up text into lines
		const lines = this.text.toString().replace(/\r/g, "").split(/\n/);
		let styleRestored = true;
		let totalWidth = 0;

		// Iterate through the lines
		let offsetY = 0;
		$array.each(lines, (line, _index) => {

			// Split up line into format/value chunks
			let chunks = TextFormatter.chunk(line, false, this.style.ignoreFormatting);

			// Init line object
			let lineInfo: ILine = {
				offsetY: offsetY,
				ascent: 0,
				width: 0,
				height: 0,
				left: 0,
				right: 0,
				textChunks: []
			};

			let currentStyle: string | undefined;
			let currentFill: Color | undefined;
			let currentChunkWidth: number | undefined;

			//while(chunk = chunks.shift()) {
			$array.each(chunks, (chunk, _index) => {

				// Format chunk
				if (chunk.type == "format") {
					if (chunk.text == "[/]") {
						if (!styleRestored) {
							context.restore();
							ghostContext.restore();
							styleRestored = true;
						}
						currentFill = undefined;
						currentStyle = undefined;
						currentChunkWidth = undefined;
					}
					else {
						let format = TextFormatter.getTextStyle(chunk.text);
						const fontStyle = this._getFontStyle(format);
						context.save();
						ghostContext.save();
						context.font = fontStyle;
						currentStyle = fontStyle;
						if (format.fill) {
							currentFill = <Color>format.fill;
						}
						if ((<any>format).width) {
							currentChunkWidth = $type.toNumber((<any>format).width);
						}
						styleRestored = false;
					}

					if (truncate) {
						ellipsisMetrics = this._measureText(ellipsis, context);
					}
				}

				// Text format
				else if (chunk.type == "value") {

					// Measure each letter
					let chars = chunk.text.match(/./ug) || [];
					if (rtl) {
						chars = $utils.splitString(chunk.text);
						chars.reverse();
					}

					for (let i = 0; i < chars.length; i++) {

						const char = chars[i];

						// Measure
						const metrics = this._measureText(char, context);
						let chunkWidth = metrics.width;

						// Chunk width?
						if (currentStyle && currentChunkWidth && (currentChunkWidth > chunkWidth)) {
							chunkWidth = currentChunkWidth;
						}

						const chunkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
						if (chunkHeight > lineInfo.height) {
							lineInfo.height = chunkHeight;
						}
						if (metrics.actualBoundingBoxAscent > lineInfo.ascent) {
							lineInfo.ascent = metrics.actualBoundingBoxAscent;
						}

						totalWidth += chunkWidth;

						// Handle oversized behavior
						if (truncate) {
							// Measure ellipsis and check if it fits
							if (!ellipsisMetrics) {
								ellipsisMetrics = this._measureText(ellipsis, context);
							}
							const ellipsisWidth = ellipsisMetrics.actualBoundingBoxLeft + ellipsisMetrics.actualBoundingBoxRight;
							//totalWidth += ellipsisWidth;
							if ((totalWidth + ellipsisWidth) > maxWidth) {
								if (lineInfo.textChunks.length == 1) {
									this.textVisible = false;
								}
								else {
									lineInfo.width += ellipsisWidth;
									lineInfo.left += ellipsisMetrics.actualBoundingBoxLeft;
									lineInfo.right += ellipsisMetrics.actualBoundingBoxRight;
									lineInfo.textChunks.push({
										style: currentStyle,
										fill: currentFill,
										text: ellipsis,
										width: ellipsisWidth,
										height: chunkHeight + ellipsisMetrics.actualBoundingBoxDescent,
										left: ellipsisMetrics.actualBoundingBoxLeft,
										right: ellipsisMetrics.actualBoundingBoxRight,
										ascent: ellipsisMetrics.actualBoundingBoxAscent,
										offsetX: 0,
										offsetY: chunkHeight,
										textDecoration: undefined
									});
								}
								break;
							}
						}

						lineInfo.width += chunkWidth;
						lineInfo.left += metrics.actualBoundingBoxLeft;
						lineInfo.right += metrics.actualBoundingBoxRight;
						lineInfo.textChunks.push({
							style: currentStyle,
							fill: currentFill,
							text: char,
							width: chunkWidth,
							height: chunkHeight + metrics.actualBoundingBoxDescent,
							left: metrics.actualBoundingBoxLeft,
							right: metrics.actualBoundingBoxRight,
							ascent: metrics.actualBoundingBoxAscent,
							offsetX: 0,
							offsetY: chunkHeight,
							textDecoration: undefined
						});

						if (rtl) {
							// @todo still needed?
							//break;
						}

					}

				}
			});

			if (this.style.lineHeight instanceof Percent) {
				lineInfo.height *= this.style.lineHeight.value;
			}
			else {
				lineInfo.height *= this.style.lineHeight || 1.2;
			}

			this._textInfo!.push(lineInfo);

			//lineInfo.offsetY += lineInfo.ascent;
			offsetY += lineInfo.height;


		});

		if (!styleRestored) {
			context.restore();
			ghostContext.restore();
		}


		if (oversizedBehavior == "hide" && (totalWidth > maxWidth)) {
			this.textVisible = false;
		}

		// Adjust chunk internal offsets
		$array.each(this._textInfo, (lineInfo) => {
			$array.each(lineInfo.textChunks, (chunk) => {
				chunk.offsetY += Math.round((lineInfo.height - chunk.height + (lineInfo.ascent - chunk.ascent)) / 2);
			});
		});

		context.restore();
		ghostContext.restore();

		return {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
		};
	}

}

/**
 * @ignore
 */
export class CanvasImage extends CanvasDisplayObject implements IPicture {
	public width: number | undefined;
	public height: number | undefined;
	public image: HTMLImageElement | undefined;
	public tainted?: boolean;

	public shadowColor?: Color;
	public shadowBlur?: number;
	public shadowOffsetX?: number;
	public shadowOffsetY?: number;
	public shadowOpacity?: number;

	protected _imageMask: HTMLCanvasElement | undefined;

	constructor(renderer: CanvasRenderer, image: HTMLImageElement | undefined) {
		super(renderer);
		this.image = image;
	}

	protected _dispose(): void {
		super._dispose();

		if (this._imageMask) {
			clearCanvas(this._imageMask);
		}
	}

	getLocalBounds(): IBounds {
		if (!this._localBounds) {


			let w = 0;
			let h = 0;

			if (this.width) {
				w = this.width;
			}
			if (this.height) {
				h = this.height;
			}

			this._localBounds = {
				left: 0,
				top: 0,
				right: w,
				bottom: h
			};

			this._addBounds(this._localBounds);
		}
		return this._localBounds;
	}

	protected _render(status: IStatus, targetGhostLayer: number = 0): void {
		super._render(status);

		if (this.image) {
			if (this.tainted === undefined) {
				this.tainted = isTainted(this.image);
				status.layer.tainted = true;
			}

			if (this.tainted && this._renderer._omitTainted) {
				return;
			}

			const ghostOnly = this._ghostOnly(targetGhostLayer);
			const drawGhost = this._drawGhost(status, targetGhostLayer);

			if (status.layer.dirty && !ghostOnly) {

				if (this.shadowColor) {
					status.layer.context.shadowColor = this.shadowColor.toCSS(this.shadowOpacity || 1);
				}
				if (this.shadowBlur) {
					status.layer.context.shadowBlur = this.shadowBlur;
				}
				if (this.shadowOffsetX) {
					status.layer.context.shadowOffsetX = this.shadowOffsetX;
				}
				if (this.shadowOffsetY) {
					status.layer.context.shadowOffsetY = this.shadowOffsetY;
				}

				// TODO should this round ?
				const width = this.width || this.image.naturalWidth;
				const height = this.height || this.image.naturalHeight;

				status.layer.context.drawImage(this.image, 0, 0, width, height);
			}

			if (this.interactive && this._isInteractive(status) && drawGhost) {
				const mask = this._getMask(this.image);

				this._renderer._ghostLayer.context.drawImage(mask, 0, 0);
			}
		}
	}

	public clear(): void {
		super.clear();
		this.image = undefined;
		this._imageMask = undefined;
	}

	protected _getMask(image: HTMLImageElement): HTMLCanvasElement {
		if (this._imageMask === undefined) {
			// TODO should this round ?
			const width = this.width || image.naturalWidth;
			const height = this.height || image.naturalHeight;

			// We need to create a second canvas because destination-in clears out the entire canvas
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			const context = canvas.getContext("2d")!;

			context.imageSmoothingEnabled = false;

			context.fillStyle = this._getColorId();
			context.fillRect(0, 0, width, height);

			if (!isTainted(image)) {
				context.globalCompositeOperation = "destination-in";
				context.drawImage(image, 0, 0, width, height);
			}

			this._imageMask = canvas;
		}

		return this._imageMask;
	}

}

/**
 * @ignore
 */
export class CanvasRendererEvent<A> implements IRendererEvent<A> {
	public id: Id;
	public simulated: boolean = false;
	public native: boolean = true;

	constructor(public event: A, public originalPoint: IPoint, public point: IPoint, public bbox: DOMRect) {
		if ($utils.supports("touchevents") && event instanceof Touch) {
			this.id = event.identifier;

		} else {
			this.id = null;
		}
	}
}

/**
 * @ignore
 */
interface IEvent<Key extends keyof IRendererEvents> {
	object: CanvasDisplayObject;
	context: unknown;
	callback: (event: IRendererEvents[Key]) => void;
	disposed: boolean;
}

/**
 * @ignore
 */
interface IEvents<Key extends keyof IRendererEvents> {
	disposer: IDisposer;
	callbacks: Array<IEvent<Key>>;
	dispatching: boolean;
	cleanup: boolean;
}

/**
 * @ignore
 */
export class CanvasRenderer extends ArrayDisposer implements IRenderer, IDisposer {
	public view: HTMLElement = document.createElement("div");
	protected _layerDom: HTMLElement = document.createElement("div");

	public layers: Array<CanvasLayer> = [];
	public _dirtyLayers: Array<CanvasLayer> = [];
	public defaultLayer: CanvasLayer = this.getLayer(0);

	public _ghostLayer: GhostLayer = new GhostLayer();

	public _deferredGhostLayers: Array<number> = [];

	protected _patternCanvas: HTMLCanvasElement = document.createElement("canvas");
	protected _patternContext: CanvasRenderingContext2D = this._patternCanvas.getContext("2d")!;

	protected _realWidth: number = 0;
	protected _realHeight: number = 0;

	protected _calculatedWidth: number = 0;
	protected _calculatedHeight: number = 0;

	public resolution: number;
	public interactionsEnabled: boolean = true;

	protected _listeners: { [key: string]: CounterDisposer } = {};
	protected _events: { [Key in keyof IRendererEvents]?: IEvents<Key> } = {};

	protected _colorId: number = 0;
	protected _colorMap: { [color: string]: CanvasDisplayObject } = {};

	public _forceInteractive: number = 0;
	public _omitTainted: boolean = false;

	// TODO this should store the Id as well
	public _hovering: Set<CanvasDisplayObject> = new Set();
	public _dragging: Array<{ id: Id, value: CanvasDisplayObject }> = [];
	public _mousedown: Array<{ id: Id, value: CanvasDisplayObject }> = [];

	protected _lastPointerMoveEvent: { events: Array<IPointerEvent>, target: Node | null, native: boolean } | undefined;

	public tapToActivate: boolean = false;
	public tapToActivateTimeout: number = 3000;
	public _touchActive: boolean = false;
	protected _touchActiveTimeout?: number;

	/*protected _mouseMoveThrottler: Throttler = new Throttler(() => {
		this._dispatchGlobalMousemove(this._lastPointerMoveEvent.event, this._lastPointerMoveEvent.native);
	});
	*/

	public resetImageArray() {
		this._ghostLayer.imageArray = undefined;
	}

	constructor(resolution?: number) {
		super();

		if (resolution == null) {
			this.resolution = window.devicePixelRatio;
		} else {
			this.resolution = resolution;
		}

		this.view.style.position = "absolute";
		this.view.setAttribute("aria-hidden", "true");
		this.view.appendChild(this._layerDom);

		this._disposers.push(new Disposer(() => {
			$object.each(this._events, (_key, events) => {
				events.disposer.dispose();
			});

			$array.each(this.layers, (layer) => {
				clearCanvas(layer.view);

				if (layer.exportableView) {
					clearCanvas(layer.exportableView);
				}
			});

			clearCanvas(this._ghostLayer.view);
			clearCanvas(this._patternCanvas);
		}));

		/*
		this._disposers.push($utils.addEventListener(this._ghostLayer.view, "click", (originalEvent: MouseEvent) => {
			const event = this.getEvent(originalEvent);
			const target = this._getHitTarget(event.originalPoint, event.bbox);
			console.debug(target);
		}));
		*/

		// Monitor for possible pixel ratio changes (when page is zoomed)
		this._disposers.push($utils.onZoom(() => {
			if (resolution == null) {
				this.resolution = window.devicePixelRatio;
			}
		}));

		// We need this in order top prevent default touch gestures when dragging
		// draggable elements
		if ($utils.supports("touchevents")) {
			const listener = (ev: any) => {
				if (this._dragging.length !== 0) {
					$array.eachContinue(this._dragging, (item) => {
						if (item.value.shouldCancelTouch()) {
							ev.preventDefault();
							return false;
						}
						return true;
					});
				}

				// If touch down happends, delay touch out
				if (this._touchActiveTimeout) {
					this._delayTouchDeactivate();
				}
			};

			this._disposers.push($utils.addEventListener(window, "touchstart", listener, { passive: false }));
			this._disposers.push($utils.addEventListener(this.view, "touchstart", listener, { passive: false }));

			this._disposers.push($utils.addEventListener(this.view, "touchmove", () => {
				// If touch is moving, delay touch out
				if (this._touchActiveTimeout) {
					this._delayTouchDeactivate();
				}
			}, { passive: true }));

			this._disposers.push($utils.addEventListener(window, "click", (_ev: any) => {
				this._touchActive = false;
			}, { passive: true }));

			this._disposers.push($utils.addEventListener(this.view, "click", (_ev: any) => {
				window.setTimeout(() => {
					this._touchActive = true;
					this._delayTouchDeactivate();
				}, 100);
			}, { passive: true }));

		}

		// Prevent scrolling of the window when hovering on "wheelable" object
		if ($utils.supports("wheelevents")) {
			this._disposers.push($utils.addEventListener(this.view, "wheel", (ev) => {
				let prevent = false;
				this._hovering.forEach((obj) => {
					if (obj.wheelable) {
						prevent = true;
						return false;
					}
				});
				if (prevent) {
					ev.preventDefault();
				}
			}, { passive: false }));
		}

	}

	protected _delayTouchDeactivate(): void {
		if (this._touchActiveTimeout) {
			clearTimeout(this._touchActiveTimeout);
		}
		if (this.tapToActivateTimeout > 0) {
			this._touchActiveTimeout = window.setTimeout(() => {
				this._touchActive = false;
			}, this.tapToActivateTimeout);
		}
	}

	public get debugGhostView(): boolean {
		return !!this._ghostLayer.view.parentNode;
	}

	public set debugGhostView(value: boolean) {
		if (value) {
			if (!this._ghostLayer.view.parentNode) {
				this.view.appendChild(this._ghostLayer.view);
			}

		} else {
			if (this._ghostLayer.view.parentNode) {
				this._ghostLayer.view.parentNode.removeChild(this._ghostLayer.view);
			}
		}
	}

	createLinearGradient(x1: number, y1: number, x2: number, y2: number): CanvasGradient {
		return this.defaultLayer.context.createLinearGradient(x1, y1, x2, y2);
	}

	createRadialGradient(x1: number, y1: number, radius1: number, x2: number, y2: number, radius2: number): CanvasGradient {
		return this.defaultLayer.context.createRadialGradient(x1, y1, radius1, x2, y2, radius2);
	}

	createPattern(graphics: CanvasGraphics, background: CanvasGraphics, repetition: string, width: number, height: number): CanvasPattern {
		// const patternCanvas = document.createElement("canvas");
		// const patternContext = patternCanvas.getContext("2d")!;
		// patternCanvas.width = width;
		// patternCanvas.height = height;
		// if (fill) {
		// 	patternContext.fillStyle = fill.toCSS();
		// 	patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
		// }

		// const layer = {
		// 	view: patternCanvas,
		// 	context: patternContext,
		// 	visible: true,
		// 	order: 0,
		// 	width: width,
		// 	height: height,
		// 	dirty: true
		// };

		// // patternContext.arc(0, 0, 50, 0, .5 * Math.PI);
		// // patternContext.stroke();

		// image.targetLayer = layer;
		// image.render(layer);

		//this._layerDom.appendChild(patternCanvas);

		this._patternCanvas.width = width;
		this._patternCanvas.height = height;

		this._patternContext.clearRect(0, 0, width, height);

		// patternCanvas.style.width = width * this.resolution + "px";
		// patternCanvas.style.height = height * this.resolution + "px";

		background.renderDetached(this._patternContext);
		graphics.renderDetached(this._patternContext);

		return this._patternContext.createPattern(this._patternCanvas, repetition)!;
	}



	makeContainer(): CanvasContainer {
		return new CanvasContainer(this);
	}

	makeGraphics(): CanvasGraphics {
		return new CanvasGraphics(this);
	}

	makeText(text: string, style: CanvasTextStyle): CanvasText {
		return new CanvasText(this, text, style);
	}

	makeTextStyle(): CanvasTextStyle {
		return new CanvasTextStyle();
	}

	makeRadialText(text: string, style: CanvasTextStyle): CanvasRadialText {
		return new CanvasRadialText(this, text, style);
	}

	makePicture(image: HTMLImageElement | undefined): CanvasImage {
		return new CanvasImage(this, image);
	}

	resizeLayer(layer: CanvasLayer) {
		layer.resize(this._calculatedWidth, this._calculatedHeight, this._calculatedWidth, this._calculatedHeight, this.resolution);
	}

	resizeGhost() {
		this._ghostLayer.resize(this._calculatedWidth, this._calculatedHeight, this._calculatedWidth, this._calculatedHeight, this.resolution);
	}

	resize(realWidth: number, realHeight: number, calculatedWidth: number, calculatedHeight: number): void {
		this._realWidth = realWidth;
		this._realHeight = realHeight;

		this._calculatedWidth = calculatedWidth;
		this._calculatedHeight = calculatedHeight;

		$array.each(this.layers, (layer) => {
			if (layer) {
				layer.dirty = true;
				this.resizeLayer(layer);
			}
		});

		this.resizeGhost();

		this.view.style.width = calculatedWidth + "px";
		this.view.style.height = calculatedHeight + "px";
	}

	private createDetachedLayer(willReadFrequently: boolean = false): CanvasLayer {
		const view = document.createElement("canvas");
		const context = view.getContext("2d", { willReadFrequently: willReadFrequently })! as CanvasRenderingContext2D;

		const layer = new CanvasLayer(view, context);

		view.style.position = "absolute";
		view.style.top = "0px";
		view.style.left = "0px";

		return layer;
	}

	getLayerByOrder(order: number): CanvasLayer | undefined {
		const layers = this.layers;
		const length = layers.length;
		for (let i = 0; i < length; i++) {
			const layer = layers[i];
			if (layer.order == order) {
				return layer;
			}
		}
	}

	getLayer(order: number, visible: boolean = true): CanvasLayer {
		let existingLayer = this.getLayerByOrder(order);
		if (existingLayer) {
			return existingLayer;
		}

		const layer = this.createDetachedLayer(order == 99);
		layer.order = order;
		layer.visible = visible;

		layer.view.className = "am5-layer-" + order;

		if (layer.visible) {
			this.resizeLayer(layer);
		}

		const layers = this.layers;

		layers.push(layer);

		layers.sort((a, b) => {
			if (a.order > b.order) {
				return 1;
			}
			else if (a.order < b.order) {
				return -1;
			}
			else {
				return 0;
			}
		});

		const length = layers.length;
		const layerIndex = $array.indexOf(layers, layer);
		let next;

		for (let i = layerIndex + 1; i < length; i++) {
			if (layers[i].visible) {
				next = layers[i];
				break;
			}
		}

		if (layer.visible) {
			if (next === undefined) {
				this._layerDom.appendChild(layer.view);

			} else {
				this._layerDom.insertBefore(layer.view, next.view);
			}
		}

		return layer;
	}

	render(root: CanvasDisplayObject): void {

		this._dirtyLayers.length = 0;
		this._deferredGhostLayers = [];

		$array.each(this.layers, (layer) => {
			if (layer) {
				if (layer.dirty && layer.visible) {
					this._dirtyLayers.push(layer);
					layer.clear();
				}
			}
		});

		this._ghostLayer.clear();

		root.render({
			inactive: null,
			layer: this.defaultLayer,
		});

		const deferredGhostLayers = this._deferredGhostLayers;
		if (deferredGhostLayers.length) {
			deferredGhostLayers.sort((a, b) => a - b);
			$array.each(deferredGhostLayers, (layerx) => {
				root.render({
					inactive: null,
					layer: this.defaultLayer
				}, layerx);
			});
		}

		this._ghostLayer.context.restore();

		//setTimeout(() => {

		// Remove this after the Chrome bug is fixed:
		// https://bugs.chromium.org/p/chromium/issues/detail?id=1279394
		$array.each(this.layers, (layer) => {
			if (layer) {
				const context = layer.context;
				context.beginPath();
				context.moveTo(0, 0);
				context.stroke();
			}
		});

		$array.each(this._dirtyLayers, (layer) => {
			layer.context.restore();
			layer.dirty = false;
		});
		//}, 100)

		if (this._hovering.size && this._lastPointerMoveEvent) {
			const { events, target, native } = this._lastPointerMoveEvent;

			//this._mouseMoveThrottler.run();

			$array.each(events, (event) => {
				this._dispatchGlobalMousemove(event, target, native);
			});
		}
	}

	paintId(obj: CanvasDisplayObject): string {
		const id = distributeId(++this._colorId);
		const color = Color.fromHex(id).toCSS();
		this._colorMap[color] = obj;
		return color;
	}

	_removeObject(obj: CanvasDisplayObject): void {
		if (obj._colorId !== undefined) {
			delete this._colorMap[obj._colorId];
		}
	}

	// protected _identifyObjectByColor(colorId: number): CanvasDisplayObject | undefined {
	// 	return this._colorMap[colorId];
	// }

	protected _adjustBoundingBox(bbox: DOMRect): DOMRect {
		const margin = this._ghostLayer.margin;

		return new DOMRect(
			-margin.left,
			-margin.top,
			bbox.width + margin.left + margin.right,
			bbox.height + margin.top + margin.bottom,
		);
	}

	public getEvent<A extends IPointerEvent>(originalEvent: A, adjustPoint: boolean = true): CanvasRendererEvent<A> {
		const bbox = this.view.getBoundingClientRect();

		const x = originalEvent.clientX || 0;
		const y = originalEvent.clientY || 0;

		const widthScale = this._calculatedWidth / this._realWidth;
		const heightScale = this._calculatedHeight / this._realHeight;

		const originalPoint: IPoint = {
			x: x - bbox.left,
			y: y - bbox.top,
		};

		const point: IPoint = {
			x: (x - (adjustPoint ? bbox.left : 0)) * widthScale,
			y: (y - (adjustPoint ? bbox.top : 0)) * heightScale,
		};

		return new CanvasRendererEvent(
			originalEvent,
			originalPoint,
			point,
			this._adjustBoundingBox(bbox),
		);
	}

	_getHitTarget(point: IPoint, bbox: DOMRect, target: Node | null): CanvasDisplayObject | undefined | false {
		if (bbox.width === 0 || bbox.height === 0 || point.x < bbox.left || point.x > bbox.right || point.y < bbox.top || point.y > bbox.bottom) {
			return;
		}

		if (!target || !this._layerDom.contains(target)) {
			return;
		}

		const pixel = this._ghostLayer.getImageData(point, bbox);

		if (pixel.data[0] === 0 && pixel.data[1] === 0 && pixel.data[2] === 0) {
			return false;
		}
		const colorId = Color.fromRGB(pixel.data[0], pixel.data[1], pixel.data[2]).toCSS();
		const hit = this._colorMap[colorId];

		return hit;
	}

	getObjectAtPoint(point: IPoint): CanvasDisplayObject | undefined {
		const data = this._ghostLayer.getImageArray(point);

		if (data[0] === 0 && data[1] === 0 && data[2] === 0) {
			return undefined;
		}
		const colorId = Color.fromRGB(data[0], data[1], data[2]).toCSS();
		const hit = this._colorMap[colorId];

		return hit;
	}

	_withEvents<Key extends keyof IRendererEvents>(key: Key, f: (events: IEvents<Key>) => void): void {
		const events = this._events[key] as IEvents<Key> | undefined;

		if (events !== undefined) {
			events.dispatching = true;

			try {
				f(events);

			} finally {
				events.dispatching = false;

				if (events.cleanup) {
					events.cleanup = false;

					$array.keepIf(events.callbacks, (callback) => {
						return !callback.disposed;
					});

					if (events.callbacks.length === 0) {
						events.disposer.dispose();
						delete this._events[key];
					}
				}
			}
		}
	}

	_dispatchEventAll<Key extends keyof IRendererEvents>(key: Key, event: IRendererEvents[Key]): void {
		if (!this.interactionsEnabled) {
			return;
		}

		this._withEvents(key, (events) => {
			$array.each(events.callbacks, (callback) => {
				if (!callback.disposed) {
					callback.callback.call(callback.context, event);
				}
			});
		});
	}

	_dispatchEvent<Key extends keyof IRendererEvents>(key: Key, target: CanvasDisplayObject, event: IRendererEvents[Key]): boolean {
		if (!this.interactionsEnabled) {
			return false;
		}

		let dispatched = false;

		this._withEvents(key, (events) => {
			$array.each(events.callbacks, (callback) => {
				if (!callback.disposed && callback.object === target) {
					callback.callback.call(callback.context, event);
					dispatched = true;
				}
			});
		});

		return dispatched;
	}

	_dispatchMousedown(originalEvent: IPointerEvent, originalTarget: Node | null): void {
		const button = (<PointerEvent>originalEvent).button;
		if (button != 0 && button != 2 && button != 1 && button !== undefined) {
			// Ignore non-primary mouse buttons
			return;
		}

		const event = this.getEvent(originalEvent);
		const target = this._getHitTarget(event.originalPoint, event.bbox, originalTarget);


		if (target) {
			const id = event.id;

			let dragged = false;

			eachTargets(target, (obj) => {
				const info = { id: id, value: obj };

				this._mousedown.push(info);

				if (!dragged && this._dispatchEvent("pointerdown", obj, event)) {
					// Only dispatch the first element which matches
					dragged = true;

					const has = this._dragging.some((x) => {
						return x.value === obj && x.id === id;
					});

					if (!has) {
						this._dragging.push(info);
					}

				}

				return true;
			});
		}
	}

	_dispatchGlobalMousemove(originalEvent: IPointerEvent, originalTarget: Node | null, native: boolean): void {
		const event = this.getEvent(originalEvent);

		const target = this._getHitTarget(event.originalPoint, event.bbox, originalTarget);
		event.native = native;

		if (target) {
			this._hovering.forEach((obj) => {
				if (!obj.contains(target)) {
					this._hovering.delete(obj);
					if (obj.cursorOverStyle) {
						$utils.setStyle(document.body, "cursor", obj._replacedCursorStyle!);
					}
					this._dispatchEvent("pointerout", obj, event);
				}
			});

			if (event.native) {
				eachTargets(target, (obj) => {
					if (!this._hovering.has(obj)) {
						this._hovering.add(obj);
						if (obj.cursorOverStyle) {
							obj._replacedCursorStyle = $utils.getStyle(document.body, "cursor");
							$utils.setStyle(document.body, "cursor", obj.cursorOverStyle);
						}
						this._dispatchEvent("pointerover", obj, event);
					}

					return true;
				});
			}

			//} else if (target === false) {
		} else {
			this._hovering.forEach((obj) => {
				if (obj.cursorOverStyle) {
					$utils.setStyle(document.body, "cursor", obj._replacedCursorStyle!);
				}
				this._dispatchEvent("pointerout", obj, event);
			});

			this._hovering.clear();
		}
		this._dispatchEventAll("globalpointermove", event);
	}

	removeHovering(graphics: CanvasGraphics) {
		this._hovering.delete(graphics);
		if (graphics.cursorOverStyle) {
			$utils.setStyle(document.body, "cursor", graphics._replacedCursorStyle!);
		}
	}

	_dispatchGlobalMouseup(originalEvent: IPointerEvent, native: boolean): void {
		const event = this.getEvent(originalEvent);
		event.native = native;
		//const target = this._getHitTarget(event.originalPoint);
		this._dispatchEventAll("globalpointerup", event);
	}

	_dispatchDragMove(originalEvent: IPointerEvent): void {
		if (this._dragging.length !== 0) {
			const event = this.getEvent(originalEvent);
			const id = event.id;

			this._dragging.forEach((obj) => {
				if (obj.id === id) {
					this._dispatchEvent("pointermove", obj.value, event);
				}
			});
		}
	}

	_dispatchDragEnd(originalEvent: IPointerEvent, originalTarget: Node | null): void {
		const button = (<PointerEvent>originalEvent).button;
		let clickevent: "click" | "rightclick" | "middleclick";
		if (button == 0 || button === undefined) {
			clickevent = "click";
		}
		else if (button == 2) {
			clickevent = "rightclick";
		}
		else if (button == 1) {
			clickevent = "middleclick";
		}
		else {
			// Ignore non-primary mouse buttons
			return;
		}

		const event = this.getEvent(originalEvent);
		const id = event.id;

		if (this._mousedown.length !== 0) {
			const target = this._getHitTarget(event.originalPoint, event.bbox, originalTarget);

			if (target) {
				this._mousedown.forEach((obj) => {
					if (obj.id === id && obj.value.contains(target)) {
						this._dispatchEvent(clickevent, obj.value, event);
					}
				});
			}

			this._mousedown.length = 0;
		}

		if (this._dragging.length !== 0) {
			this._dragging.forEach((obj) => {
				if (obj.id === id) {
					this._dispatchEvent("pointerup", obj.value, event);
				}
			});

			this._dragging.length = 0;
		}
	}

	_dispatchDoubleClick(originalEvent: IPointerEvent, originalTarget: Node | null): void {
		const event = this.getEvent(originalEvent);
		const target = this._getHitTarget(event.originalPoint, event.bbox, originalTarget);

		if (target) {
			eachTargets(target, (obj) => {
				if (this._dispatchEvent("dblclick", obj, event)) {
					return false;
				} else {
					return true;
				}
			});
		}
	}

	_dispatchWheel(originalEvent: WheelEvent, originalTarget: Node | null): void {
		const event = this.getEvent(originalEvent);
		const target = this._getHitTarget(event.originalPoint, event.bbox, originalTarget);

		if (target) {
			eachTargets(target, (obj) => {
				if (this._dispatchEvent("wheel", obj, event)) {
					return false;
				} else {
					return true;
				}
			});
		}
	}

	_makeSharedEvent(key: string, f: () => IDisposer): IDisposer {
		if (this._listeners[key] === undefined) {
			const listener = f();

			this._listeners[key] = new CounterDisposer(() => {
				delete this._listeners[key];
				listener.dispose();
			});
		}

		return this._listeners[key].increment();
	}

	_onPointerEvent(name: string, f: (event: Array<IPointerEvent>, target: Node | null, native: boolean) => void): IDisposer {
		let native = false;
		let timer: number | null = null;

		function clear() {
			timer = null;
			native = false;
		}

		return new MultiDisposer([
			new Disposer(() => {
				if (timer !== null) {
					clearTimeout(timer);
				}

				clear();
			}),

			$utils.addEventListener(this.view, $utils.getRendererEvent(name), (_) => {
				native = true;

				if (timer !== null) {
					clearTimeout(timer);
				}

				timer = window.setTimeout(clear, 0);
			}),

			onPointerEvent(window, name, (ev, target) => {
				if (timer !== null) {
					clearTimeout(timer);
					timer = null;
				}

				f(ev, target, native);

				native = false;
			}),
		]);
	}

	// This ensures that only a single DOM event is added (e.g. only a single mousemove event listener)
	_initEvent(key: keyof IRendererEvents): IDisposer | undefined {
		switch (key) {
			case "globalpointermove":
			case "pointerover":
			case "pointerout":
				return this._makeSharedEvent("pointermove", () => {
					const listener = (events: Array<IPointerEvent>, target: Node | null, native: boolean) => {
						this._lastPointerMoveEvent = { events, target, native };

						$array.each(events, (event) => {
							this._dispatchGlobalMousemove(event, target, native);
						});
					};

					return new MultiDisposer([
						this._onPointerEvent("pointerdown", listener),
						this._onPointerEvent("pointermove", listener),
					]);
				});
			case "globalpointerup":
				return this._makeSharedEvent("pointerup", () => {
					const mouseup = this._onPointerEvent("pointerup", (events, target, native) => {
						$array.each(events, (event) => {
							this._dispatchGlobalMouseup(event, native);
						});
						this._lastPointerMoveEvent = { events, target, native };
					});

					const pointercancel = this._onPointerEvent("pointercancel", (events, target, native) => {
						$array.each(events, (event) => {
							this._dispatchGlobalMouseup(event, native);
						});
						this._lastPointerMoveEvent = { events, target, native };
					});

					return new Disposer(() => {
						mouseup.dispose();
						pointercancel.dispose();
					});
				});
			case "click":
			case "rightclick":
			case "middleclick":
			case "pointerdown":
			/*
				return this._makeSharedEvent("pointerdown", () => {
					return this._onPointerEvent("pointerdown", (event, target, native) => {
						this._lastPointerMoveEvent = { event, target, native };
						this._dispatchMousedown(event)
					});
				});
			*/
			case "pointermove":
			case "pointerup":
				return this._makeSharedEvent("pointerdown", () => {
					//const throttler = new Throttler();

					const mousedown = this._onPointerEvent("pointerdown", (events, target) => {
						$array.each(events, (ev) => {
							this._dispatchMousedown(ev, target);
						});
					});

					// TODO handle throttling properly for multitouch
					const mousemove = this._onPointerEvent("pointermove", (ev: Array<IPointerEvent>) => {
						//throttler.throttle(() => {
						$array.each(ev, (ev) => {
							this._dispatchDragMove(ev);
						});
						//});
					});

					const mouseup = this._onPointerEvent("pointerup", (ev: Array<IPointerEvent>, target) => {
						$array.each(ev, (ev) => {
							this._dispatchDragEnd(ev, target);
						});
					});

					const pointercancel = this._onPointerEvent("pointercancel", (ev: Array<IPointerEvent>, target) => {
						$array.each(ev, (ev) => {
							this._dispatchDragEnd(ev, target);
						});
					});

					return new Disposer(() => {
						mousedown.dispose();
						mousemove.dispose();
						mouseup.dispose();
						pointercancel.dispose();
					});
				});
			case "dblclick":
				return this._makeSharedEvent("dblclick", () => {
					return this._onPointerEvent("dblclick", (ev, target) => {
						$array.each(ev, (ev) => {
							this._dispatchDoubleClick(ev, target);
						});
					});
				});
			case "wheel":
				return this._makeSharedEvent("wheel", () => {
					return $utils.addEventListener(this.view, $utils.getRendererEvent("wheel"), (event: WheelEvent) => {
						this._dispatchWheel(event, $utils.getEventTarget(event));
					}, { passive: false });
				});
		}
	}

	_addEvent<C, Key extends keyof IRendererEvents>(object: CanvasDisplayObject, key: Key, callback: (this: C, event: IRendererEvents[Key]) => void, context?: C): IDisposer {
		let events: IEvents<Key> | undefined = this._events[key] as any;

		if (events === undefined) {
			events = this._events[key] = {
				disposer: this._initEvent(key)!,
				callbacks: [],
				dispatching: false,
				cleanup: false,
			};
		}

		const listener = { object, context, callback, disposed: false };

		events!.callbacks.push(listener);

		return new Disposer(() => {
			listener.disposed = true;

			if (events!.dispatching) {
				events!.cleanup = true;

			} else {
				$array.removeFirst(events!.callbacks, listener);

				if (events!.callbacks.length === 0) {
					events!.disposer.dispose();
					delete this._events[key];
				}
			}
		});
	}

	public getCanvas(root: CanvasDisplayObject, options?: ICanvasOptions): HTMLCanvasElement {

		// Make sure everything is rendered
		this.render(root);

		if (!options) {
			options = {};
		}

		let scale: number = this.resolution;

		let canvasWidth = Math.floor(this._calculatedWidth * this.resolution);
		let canvasHeight = Math.floor(this._calculatedHeight * this.resolution);

		// Check if we need to scale
		if (options.minWidth && (options.minWidth > canvasWidth)) {
			let minScale = options.minWidth / canvasWidth;
			if (minScale > scale) {
				scale = minScale * this.resolution;
			}
		}

		if (options.minHeight && (options.minHeight > canvasHeight)) {
			let minScale = options.minHeight / canvasHeight;
			if (minScale > scale) {
				scale = minScale * this.resolution;
			}
		}

		if (options.maxWidth && (options.maxWidth < canvasWidth)) {
			let maxScale = options.maxWidth / canvasWidth;
			if (maxScale < scale) {
				scale = maxScale * this.resolution;
			}
		}

		if (options.maxHeight && (options.maxHeight > canvasHeight)) {
			let maxScale = options.maxHeight / canvasHeight;
			if (maxScale < scale) {
				scale = maxScale * this.resolution;
			}
		}

		// Check if we need to compensate for pixel ratio
		if (options.maintainPixelRatio) {
			scale /= this.resolution;
		}

		// Init list canvases to remove from DOM after export
		const canvases: HTMLCanvasElement[] = [];

		// Set up new canvas for export
		let forceRender = false;
		const canvas = document.createElement("canvas");
		if (scale != this.resolution) {
			forceRender = true;
			canvasWidth = canvasWidth * scale / this.resolution;
			canvasHeight = canvasHeight * scale / this.resolution;
		}

		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		// Add to DOM so it inherits CSS
		canvas.style.position = "fixed";
		canvas.style.top = "-10000px";
		this.view.appendChild(canvas);
		canvases.push(canvas);

		// Context
		const context = canvas.getContext("2d")!;

		let width = 0;
		let height = 0;
		let needRerender = false;

		$array.each(this.layers, (layer) => {
			if (layer && layer.visible) {
				if (layer.tainted || forceRender) {
					needRerender = true;

					layer.exportableView = layer.view;
					layer.exportableContext = layer.context;

					layer.view = document.createElement("canvas");

					// Add to DOM so it inherits CSS
					layer.view.style.position = "fixed";
					layer.view.style.top = "-10000px";
					this.view.appendChild(layer.view);
					canvases.push(layer.view);

					let extraX = 0;
					let extraY = 0;
					if (layer.margin) {
						extraX += layer.margin.left || 0 + layer.margin.right || 0;
						extraY += layer.margin.top || 0 + layer.margin.bottom || 0;
					}

					layer.view.width = canvasWidth + extraX;
					layer.view.height = canvasHeight + extraY;

					layer.context = layer.view.getContext("2d")!;

					layer.dirty = true;
					layer.scale = scale;

				}
			}
		});

		if (needRerender) {
			this._omitTainted = true;
			this.render(root);
			this._omitTainted = false;
		}

		$array.each(this.layers, (layer) => {
			if (layer && layer.visible) {

				// Layer is fine. Just plop it into our target canvas
				let x = 0;
				let y = 0;
				if (layer.margin) {
					x = -(layer.margin.left || 0) * this.resolution;
					y = -(layer.margin.top || 0) * this.resolution;
				}
				context.drawImage(layer.view, x, y);

				// Restore layer original canvas
				if (layer.exportableView) {
					layer.view = layer.exportableView;
					layer.exportableView = undefined;
				}

				if (layer.exportableContext) {
					layer.context = layer.exportableContext;
					layer.exportableContext = undefined;
				}

				if (width < layer.view.clientWidth) {
					width = layer.view.clientWidth;
				}
				if (height < layer.view.clientHeight) {
					height = layer.view.clientHeight;
				}

				layer.scale = undefined;
			}
		});

		canvas.style.width = width + "px";
		canvas.style.height = height + "px";

		$array.each(canvases, (canvas) => {
			canvas.style.position = "";
			canvas.style.top = "";
			this.view.removeChild(canvas);
		})
		return canvas;
	}
}


class GhostLayer {
	public view: HTMLCanvasElement;
	public context: CanvasRenderingContext2D;
	public margin: IMargin = {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
	};

	private _resolution: number = 1;
	private _width: number = 0;
	private _height: number = 0;

	public imageArray?: Uint8ClampedArray;

	constructor() {
		this.view = document.createElement("canvas");
		this.context = this.view.getContext("2d", { alpha: false, willReadFrequently: true })! as CanvasRenderingContext2D;
		this.context.imageSmoothingEnabled = false;

		this.view.style.position = "absolute";
		this.view.style.top = "0px";
		this.view.style.left = "0px";
	}

	resize(canvasWidth: number, canvasHeight: number, domWidth: number, domHeight: number, resolution: number) {
		this._resolution = resolution;

		canvasWidth += (this.margin.left + this.margin.right);
		canvasHeight += (this.margin.top + this.margin.bottom);

		// TODO this should take into account calculateSize
		domWidth += (this.margin.left + this.margin.right);
		domHeight += (this.margin.top + this.margin.bottom);

		this.view.style.left = -this.margin.left + "px";
		this.view.style.top = -this.margin.top + "px";

		this._width = Math.floor(canvasWidth * resolution);
		this._height = Math.floor(canvasHeight * resolution);

		this.view.width = this._width;
		this.view.style.width = domWidth + "px";

		this.view.height = this._height;
		this.view.style.height = domHeight + "px";
	}

	getImageData(point: IPoint, bbox: DOMRect): ImageData {
		return this.context.getImageData(
			// TODO should this round ?
			Math.round(((point.x - bbox.left) / bbox.width) * this._width),
			Math.round(((point.y - bbox.top) / bbox.height) * this._height),
			1,
			1,
		);
	}

	getImageArray(point: IPoint): Array<number> {

		if (!this.imageArray) {
			this.imageArray = this.context.getImageData(0, 0, this._width, this._height).data;
		}

		const data = this.imageArray;

		const x = Math.round(point.x * this._resolution);
		const y = Math.round(point.y * this._resolution);

		const i = (y * this._width + x) * 4;
		return [data[i], data[i + 1], data[i + 2], data[i + 3]];
	}

	setMargin(layers: Array<CanvasLayer>): void {
		this.margin.left = 0;
		this.margin.right = 0;
		this.margin.top = 0;
		this.margin.bottom = 0;

		$array.each(layers, (layer) => {
			if (layer.margin) {
				this.margin.left = Math.max(this.margin.left, layer.margin.left);
				this.margin.right = Math.max(this.margin.right, layer.margin.right);
				this.margin.top = Math.max(this.margin.top, layer.margin.top);
				this.margin.bottom = Math.max(this.margin.bottom, layer.margin.bottom);
			}
		});
	}

	clear() {
		this.context.save();
		this.context.fillStyle = '#000';
		this.context.fillRect(0, 0, this._width, this._height);
	}
}


/**
 * @ignore
 */
export class CanvasLayer implements ILayer {
	public view: HTMLCanvasElement;
	public context: CanvasRenderingContext2D;
	public tainted: boolean = true;
	public margin: IMargin | undefined;
	public order: number = 0;
	public visible: boolean = true;
	public width: number | undefined;
	public height: number | undefined;
	public scale: number | undefined;
	public dirty: boolean = true;
	public exportableView: HTMLCanvasElement | undefined;
	public exportableContext: CanvasRenderingContext2D | undefined;

	private _width: number = 0;
	private _height: number = 0;

	constructor(view: HTMLCanvasElement, context: CanvasRenderingContext2D) {
		this.view = view;
		this.context = context;
	}

	resize(canvasWidth: number, canvasHeight: number, domWidth: number, domHeight: number, resolution: number) {
		// TODO should this take into account calculateSize ?
		if (this.width != null) {
			canvasWidth = this.width;
			domWidth = this.width;
		}

		// TODO should this take into account calculateSize ?
		if (this.height != null) {
			canvasHeight = this.height;
			domHeight = this.height;
		}

		if (this.margin) {
			canvasWidth += (this.margin.left + this.margin.right);
			canvasHeight += (this.margin.top + this.margin.bottom);

			// TODO this should take into account calculateSize
			domWidth += (this.margin.left + this.margin.right);
			domHeight += (this.margin.top + this.margin.bottom);

			this.view.style.left = -this.margin.left + "px";
			this.view.style.top = -this.margin.top + "px";

		} else {
			this.view.style.left = "0px";
			this.view.style.top = "0px";
		}

		this._width = Math.floor(canvasWidth * resolution);
		this._height = Math.floor(canvasHeight * resolution);

		this.view.width = this._width;
		this.view.style.width = domWidth + "px";

		this.view.height = this._height;
		this.view.style.height = domHeight + "px";
	}

	clear() {
		this.context.save();
		this.context.clearRect(0, 0, this._width, this._height);
	}
}
