/** @ignore *//** */

import type { IDeform, IContainer, IDisplayObject, IGraphics, IText, IRadialText, IPicture, IRenderer, IRendererEvents, IMargin, ITextStyle, ILayer, IGradient, IPattern } from "../backend/Renderer";
import type { IBounds } from "../../util/IBounds";
import type { IPoint } from "../../util/IPoint";
import type { ILine, ILineChunk, ITextLayoutState } from "./TextLayout";
import type { InteractionManager } from "./Interaction";
import { BlendMode } from "../backend/Renderer";
import { GraphicsData, setPoint } from "./GraphicsData";
import { getFontStyle } from "./TextLayout";
import { Color } from "../../util/Color";
import { Matrix } from "../../util/Matrix";
import { Percent, percent } from "../../util/Percent";
import { Disposer, DisposerClass, IDisposer } from "../../util/Disposer";
import * as $array from "../../util/Array";
import * as $math from "../../util/Math";


/**
 * What scene nodes need from the renderer that owns them.
 *
 * @ignore
 */
export interface ISceneHost extends IRenderer {
	readonly defaultLayer: ILayer;
	readonly layers: ReadonlyArray<ILayer>;
	readonly _interaction: InteractionManager<SceneNode>;

	/**
	 * The layer for `order`, created if needed, marked dirty and sized.
	 */
	_useLayer(order: number, margin: IMargin | undefined): ILayer;

	/**
	 * The canvas a layer paints on, for code that needs a raster element.
	 */
	_layerCanvas(layer: ILayer): HTMLCanvasElement;

	/**
	 * Lays out `text` and returns its local bounds.
	 */
	_measureText(text: SceneText): IBounds;

	/**
	 * The context `text` is measured with.
	 */
	_textContext(text: SceneText): CanvasRenderingContext2D;

	_removeObject(node: SceneNode): void;
}

/**
 * @ignore
 */
// Whether two deforms are the same (both null counts)
function sameDeform(a: IDeform | null, b: IDeform | null): boolean {
	if (a === null || b === null) {
		return a === b;
	}
	return a.a === b.a && a.b === b.b && a.c === b.c && a.d === b.d;
}

// Applies a deform to a local matrix, around the point (x, y)
function deformMatrix(m: Matrix, x: number, y: number, deform: IDeform): void {
	const a = m.a, b = m.b, c = m.c, d = m.d;
	const dx = m.tx - x;
	const dy = m.ty - y;
	m.a = deform.a * a + deform.c * b;
	m.b = deform.b * a + deform.d * b;
	m.c = deform.a * c + deform.c * d;
	m.d = deform.b * c + deform.d * d;
	m.tx = x + deform.a * dx + deform.c * dy;
	m.ty = y + deform.b * dx + deform.d * dy;
}

export class ScenePivot implements IPoint {
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

/**
 * A renderer-neutral display object: state, place in the tree, transform and
 * bounds. Backends paint it.
 *
 * @ignore
 */
export class SceneNode extends DisposerClass implements IDisplayObject, IDisposer {
	public _layer?: ILayer;

	public mask: SceneGraphics | null = null;
	public visible: boolean = true;
	public exportable?: boolean = true;
	public exportName?: string;
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
	public pivot: ScenePivot = new ScenePivot();

	/**
	 * A 2x2 transform applied around the node's position after its rotation
	 * and scale, e.g. to lay a map bullet onto the projected surface. `null`
	 * (the default) leaves the transform as it was.
	 *
	 * @ignore
	 */
	public deform: IDeform | null = null;

	public filter?: string;

	public cursorOverStyle?: string;
	public _replacedCursorStyle?: string;

	public _localMatrix: Matrix = new Matrix();
	public _matrix: Matrix = new Matrix();
	// TODO can this be replaced with _localMatrix ?
	protected _uMatrix: Matrix = new Matrix();

	// Cached transform inputs for _setMatrix memoization (NaN forces first compute)
	protected _mx: number = NaN;
	protected _my: number = NaN;
	protected _mpx: number = NaN;
	protected _mpy: number = NaN;
	protected _mAngle: number = NaN;
	protected _mScale: number = NaN;
	protected _mDeform: IDeform | null = null;

	public _renderer: ISceneHost;
	public _parent: SceneContainer | undefined;

	public _localBounds: IBounds | undefined;
	protected _bounds: IBounds | undefined;

	// The canvas backend's hit-test color
	public _colorId: string | undefined;

	constructor(renderer: ISceneHost) {
		super();
		this._renderer = renderer;
	}

	protected _dispose(): void {
		this._renderer._removeObject(this);
		this.getLayer().dirty = true;
	}

	public getCanvas(): HTMLCanvasElement {
		return this._renderer._layerCanvas(this.getLayer());
	}

	public getLayer(): ILayer {
		let self: SceneNode = this;

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
			this._layer = this._renderer._useLayer(order, margin);

			if (this._parent) {
				this._parent.registerChildLayer(this._layer);
			}
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

	public contains(child: SceneNode): boolean {
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
		if (this.deform !== null) {
			deformMatrix(this._uMatrix, 0, 0, this.deform);
		}
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

	getContentBounds(): IBounds {
		if (this.isMeasured) {
			return this.getLocalBounds();
		}

		// An unmeasured node adds nothing to its bounds, so measure it just for this
		const bn = 10000000;
		const bounds = {
			left: bn,
			top: bn,
			right: -bn,
			bottom: -bn
		};

		this.isMeasured = true;
		this._addBounds(bounds);
		this.isMeasured = false;

		if (bounds.left > bounds.right) {
			return { left: 0, top: 0, right: 0, bottom: 0 };
		}
		return bounds;
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
			return this._renderer._interaction.addEvent(this, key, callback, context);

		} else {
			return new Disposer(() => { });
		}
	}

	public _setMatrix(): void {
		const px = this.pivot.x;
		const py = this.pivot.y;

		// Only rebuild the local matrix (the sin/cos cost) when an input changed.
		const deform = this.deform;

		if (this.x !== this._mx || this.y !== this._my ||
			px !== this._mpx || py !== this._mpy ||
			this.angle !== this._mAngle || this.scale !== this._mScale ||
			!sameDeform(deform, this._mDeform)) {

			this._localMatrix.setTransform(
				this.x,
				this.y,
				px,
				py,
				// Converts degrees to radians
				this.angle * Math.PI / 180,
				this.scale
			);

			if (deform !== null) {
				deformMatrix(this._localMatrix, this.x, this.y, deform);
			}

			this._mx = this.x;
			this._my = this.y;
			this._mpx = px;
			this._mpy = py;
			this._mAngle = this.angle;
			this._mScale = this.scale;
			this._mDeform = deform === null ? null : { a: deform.a, b: deform.b, c: deform.c, d: deform.d };
		}

		// Prepend stays unconditional: cheap, and always reflects the parent's
		// current world matrix (render() guarantees the parent was updated first).
		this._matrix.copyFrom(this._localMatrix);

		if (this._parent) {
			this._matrix.prepend(this._parent._matrix);
		}
	}

	hovering(): boolean {
		return this._renderer._interaction._hovering.has(this);
	}

	dragging(): boolean {
		return this._renderer._interaction._dragging.some((x) => x.value === this);
	}

	public shouldCancelTouch(): boolean {
		const interaction = this._renderer._interaction;
		if (interaction.tapToActivate && !interaction._touchActive) {
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
export class SceneContainer extends SceneNode implements IContainer {
	public interactiveChildren: boolean = true;
	private _childLayers?: ILayer[];

	public _children: Array<SceneNode> = [];

	addChild(child: SceneNode): void {
		child._parent = this;
		this._children.push(child);
		if (child._layer) {
			this.registerChildLayer(child._layer);
		}
	}

	addChildAt(child: SceneNode, index: number): void {
		child._parent = this;
		this._children.splice(index, 0, child);
		if (child._layer) {
			this.registerChildLayer(child._layer);
		}
	}

	removeChild(child: SceneNode): void {
		child._parent = undefined;
		$array.removeFirst(this._children, child);
	}

	registerChildLayer(layer: ILayer): void {
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
export class SceneGraphics extends SceneNode implements IGraphics {
	public _data: GraphicsData = new GraphicsData();

	public blendMode: BlendMode = BlendMode.NORMAL;

	// Bounds of an unmeasured shape, measured on demand (for focus) and kept until
	// it is drawn again
	protected _contentBounds: IBounds | undefined;

	clear(): void {
		super.clear();
		this._data.clear();
		this._contentBounds = undefined;
	}

	getContentBounds(): IBounds {
		// Hidden: nothing kept, since showing it again does not redraw it
		if (this.isMeasured || !this.visible) {
			return super.getContentBounds();
		}
		if (!this._contentBounds) {
			this._contentBounds = super.getContentBounds();
		}
		return this._contentBounds;
	}

	beginFill(color?: Color | IGradient | IPattern, alpha: number = 1): void {
		if (color && !(color instanceof Color)) {
			this.isMeasured = true;
		}
		this._data.beginFill(color, alpha);
	}

	endFill(): void {
		this._data.endFill();
	}

	endStroke(): void {
		this._data.endStroke();
	}

	beginPath(): void {
		this._data.beginPath();
	}

	lineStyle(width: number = 0, color?: Color | IGradient | IPattern, alpha: number = 1, lineJoin?: "miter" | "round" | "bevel", lineCap?: "butt" | "round" | "square"): void {
		this._data.lineStyle(width, color, alpha, lineJoin, lineCap);
	}

	setLineDash(dash?: number[]): void {
		this._data.setLineDash(dash);
	}

	setLineDashOffset(dashOffset: number = 0): void {
		this._data.setLineDashOffset(dashOffset);
	}

	drawRect(x: number, y: number, width: number, height: number): void {
		this._data.drawRect(x, y, width, height);
	}

	drawCircle(x: number, y: number, radius: number): void {
		this._data.drawCircle(x, y, radius);
	}

	drawEllipse(x: number, y: number, radiusX: number, radiusY: number): void {
		this._data.drawEllipse(x, y, radiusX, radiusY);
	}

	arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean = false): void {
		this._data.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
	}

	arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
		this._data.arcTo(x1, y1, x2, y2, radius);
	}

	lineTo(x: number, y: number): void {
		this._data.lineTo(x, y);
	}

	moveTo(x: number, y: number): void {
		this._data.moveTo(x, y);
	}

	bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): void {
		this._data.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);
	}

	quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): void {
		this._data.quadraticCurveTo(cpX, cpY, toX, toY);
	}

	closePath(): void {
		this._data.closePath();
	}

	shadow(color: Color, blur: number = 0, offsetX: number = 0, offsetY: number = 0, opacity?: number): void {
		this._data.shadow(color, blur, offsetX, offsetY, opacity);
	}

	image(image: HTMLImageElement | HTMLCanvasElement, width: number, height: number, x: number, y: number): void {
		this._data.image(image, width, height, x, y);
	}

	svgPath(path: string): void {
		this._data.svgPath(path);
	}

	beginGroup(id?: string, name?: string): void {
		this._data.beginGroup(id, name);
	}

	endGroup(): void {
		this._data.endGroup();
	}

	public _addBounds(bounds: IBounds): void {
		if (this.visible && this.isMeasured) {
			this._data.addBounds(bounds);
		}
	}
}

/**
 * @ignore
 */
export class SceneTextStyle implements ITextStyle {
	//public wordWrapWidth: number = 100;
	public fill?: Color | IGradient | IPattern;
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
 * Text and its layout. The backend lays it out (`_measureText`) because
 * measuring needs a text engine.
 *
 * @ignore
 */
export class SceneText extends SceneNode implements IText {
	public text: string;
	public style: SceneTextStyle;
	public resolution: number = 1;
	public textVisible: boolean = true;
	public truncated?: boolean;

	public _textInfo: Array<ILine> | undefined;
	protected _originalScale?: number = 1;

	// Local bounds from the last layout (set by backends that hit test geometrically)
	public _textBounds: IBounds | undefined;

	constructor(renderer: ISceneHost, text: string, style: SceneTextStyle) {
		super(renderer);
		this.text = text;
		this.style = style;
	}

	public invalidateBounds(): void {
		super.invalidateBounds();
		this._textInfo = undefined;
	}

	public invalidateVisibility(): void {
		this.textVisible = true;
		this.scale = this._originalScale || 1;
	}

	public _getFontStyle(style2?: ITextStyle, ignoreFontWeight = false): string {
		return getFontStyle(this.style, style2, ignoreFontWeight, () => getComputedStyle(this._renderer.view).getPropertyValue("font-family"));
	}

	public _addBounds(bounds: IBounds): void {
		if (this.visible && this.isMeasured) {
			const x = this._renderer._measureText(this);
			setPoint(bounds, { x: x.left, y: x.top });
			setPoint(bounds, { x: x.right, y: x.bottom });
		}
	}

	public _layoutState(): ITextLayoutState {
		return {
			lines: [],
			textVisible: this.textVisible,
			truncated: this.truncated,
			scale: this.scale,
			originalScale: this._originalScale,
		};
	}

	public _applyLayoutState(state: ITextLayoutState): void {
		this._textInfo = state.lines;
		this.textVisible = state.textVisible;
		this.truncated = state.truncated;
		this.scale = state.scale;
		this._originalScale = state.originalScale;
	}
}

/**
 * @ignore
 */
export class SceneRadialText extends SceneText implements IRadialText {
	public textType?: "regular" | "circular" | "radial" | "aligned" | "adjusted" = "circular";
	public radius?: number;
	public startAngle?: number;
	public inside?: boolean = false;
	public orientation?: "inward" | "outward" | "auto" = "auto";
	public kerning?: number = 0;

	// Lines were reversed for inward drawing (set by the painter)
	public _textReversed: boolean = false;

	/**
	 * Whether laid-out circular text reads inward. Does not depend on line
	 * order, so it holds before and after `_orient()`.
	 */
	public _inward(): boolean {
		const orientation = this.orientation;
		if (orientation != "auto") {
			return orientation == "inward";
		}

		const radius = this.radius || 0;
		const startAngle = this.startAngle || 0;
		const deltaAngle = 0;
		const align = this.style.textAlign || "left";
		const clockwise = align == "left" ? 1 : -1;

		// Calc max angle so we know whether we need to flip it
		let maxAngle = 0;
		let midAngle = 0;
		$array.each(this._textInfo!, (line) => {
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
		return (midAngle >= 270) || (midAngle <= 90);
	}

	/**
	 * Puts lines and glyphs in drawing order, once per layout, and returns
	 * whether the text reads inward. Painters call it before drawing.
	 */
	public _orient(): boolean {
		const lines = this._textInfo!;
		const clockwise = (this.style.textAlign || "left") == "left" ? 1 : -1;
		const shouldReverse = !this._textReversed;
		const inward = this._inward();

		if (inward && shouldReverse) {
			lines.reverse();
		}

		// Reverse letters if we're painting them counter-clockwise
		if (((clockwise == -1 && inward) || (clockwise == 1 && !inward)) && shouldReverse) {
			$array.each(lines, (line) => {
				line.textChunks.reverse();
			});
		}

		// Once per layout: v5 reversed outward letters again on every repaint
		this._textReversed = true;

		return inward;
	}

	/**
	 * Calls `f` for every glyph with its rotation and baseline offset, as the
	 * canvas painter places them.
	 */
	public _eachGlyph(inward: boolean, f: (chunk: ILineChunk, angle: number, y: number, height: number) => void): void {
		let radius = this.radius || 0;
		const startAngle = this.startAngle || 0;
		const inside = this.inside;
		const align = this.style.textAlign || "left";
		const kerning = this.kerning || 0;
		const clockwise = align == "left" ? 1 : -1;

		$array.each(this._textInfo!, (line) => {
			const textHeight = line.height;

			if (!inside) {
				radius += textHeight;
			}

			let lineStartAngle = startAngle;
			if (align == "center") {
				lineStartAngle += (line.width / (radius - textHeight)) / 2 * -clockwise;
			}

			// Rotate 180 if outward
			lineStartAngle += (Math.PI * (inward ? 0 : 1));

			// Canvas ignores a non-finite rotate(), keeping the angle it had
			let angle = isFinite(lineStartAngle) ? lineStartAngle : 0;
			const turn = (delta: number) => {
				if (isFinite(delta)) {
					angle += delta;
				}
			};
			const y = (inward ? 1 : -1) * (0 - radius + textHeight / 2);

			$array.each(line.textChunks, (chunk) => {
				turn((chunk.width / 2) / (radius - textHeight) * clockwise);
				f(chunk, angle, y, textHeight);
				turn((chunk.width / 2 + kerning) / (radius - textHeight) * clockwise);
			});

			if (inside) {
				radius -= textHeight;
			}
		});
	}
}

/**
 * @ignore
 */
export class SceneImage extends SceneNode implements IPicture {
	public width: number | undefined;
	public height: number | undefined;
	public image: HTMLImageElement | undefined;
	public tainted?: boolean;

	public shadowColor?: Color;
	public shadowBlur?: number;
	public shadowOffsetX?: number;
	public shadowOffsetY?: number;
	public shadowOpacity?: number;

	// The canvas backend's hit mask
	public _imageMask: HTMLCanvasElement | undefined;

	constructor(renderer: ISceneHost, image: HTMLImageElement | undefined) {
		super(renderer);
		this.image = image;
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

	public clear(): void {
		super.clear();
		this.image = undefined;
		this._imageMask = undefined;
	}
}
