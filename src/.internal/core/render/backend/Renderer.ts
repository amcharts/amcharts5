import type { IDisposer } from "../../util/Disposer";
import type { IPoint } from "../../util/IPoint";
import type { Color } from "../../util/Color";
import type { Percent } from "../../util/Percent";
import type { Matrix } from "../../util/Matrix";
import type { IBounds } from "../../util/IBounds";

export interface IGradient {
	addColorStop(offset: number, color: string): void;
}

/**
 * A color stop in a gradient.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more info
 */
export interface IGradientStop {

	/**
	 * Color.
	 */
	color?: Color;

	/**
	 * Where the color sits along the gradient, from `0` (start) to `1` (end).
	 * Stops without an offset are spaced evenly.
	 */
	offset?: number;

	/**
	 * Opacity of the color, from `0` (transparent) to `1` (opaque).
	 *
	 * @default 1
	 */
	opacity?: number;

	/**
	 * Lightens the color by this amount, from `-1` to `1`: `0.2` moves it 20%
	 * of the way to white. A negative value darkens it.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/#Brightness} for more info
	 */
	lighten?: number;

	/**
	 * Brightens the color by this amount, from `-1` to `1`, adding the same
	 * amount to each channel. A negative value dims it.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/#Brightness} for more info
	 */
	brighten?: number;

	/**
	 * @ignore
	 */
	colorInherited?: boolean;

	/**
	 * @ignore
	 */
	opacityInherited?: boolean;

}

export interface IPattern {
}

export type IPointerEvent = PointerEvent | MouseEvent | Touch;

export type Id = number | null;

export interface IRendererEvent<E> {
	event: E;
	point: IPoint;
	id: Id;
	simulated: boolean;
	native: boolean;
}

export interface IRendererEvents {
	click: IRendererEvent<IPointerEvent>;
	rightclick: IRendererEvent<IPointerEvent>;
	middleclick: IRendererEvent<IPointerEvent>;
	dblclick: IRendererEvent<IPointerEvent>;
	globalpointermove: IRendererEvent<IPointerEvent>,
	globalpointerup: IRendererEvent<IPointerEvent>,
	globalpointerdown: IRendererEvent<IPointerEvent>,
	pointerover: IRendererEvent<IPointerEvent>;
	pointerout: IRendererEvent<IPointerEvent>;
	pointerdown: IRendererEvent<IPointerEvent>;
	pointermove: IRendererEvent<IPointerEvent>;
	pointerup: IRendererEvent<IPointerEvent>;
	wheel: IRendererEvent<WheelEvent>;
}

/**
 * A 2x2 linear transform: `a`, `b` are where the x axis goes, `c`, `d` where
 * the y axis goes.
 *
 * @ignore
 */
export interface IDeform {
	a: number;
	b: number;
	c: number;
	d: number;
}

export interface IDisplayObject extends IDisposer {
	mask: IGraphics | null;
	visible: boolean;
	interactive: boolean;
	inactive: boolean | null;
	wheelable: boolean;
	cancelTouch: boolean;
	isMeasured: boolean;
	buttonMode: boolean;
	alpha: number;
	angle: number;
	scale: number;
	crisp: boolean;
	x: number;
	y: number;
	pivot: IPoint;

	/**
	 * @ignore
	 */
	deform: IDeform | null;
	filter?: string;
	cursorOverStyle?: string;
	exportable?: boolean;

	_setMatrix(): void;
	getLayer(): ILayer;
	setLayer(order: number | undefined, margin: IMargin | undefined): void;
	markDirtyLayer(deep?: boolean): void;
	clear(): void;
	invalidateBounds(): void;
	toLocal(point: IPoint): IPoint;
	toGlobal(point: IPoint): IPoint;
	getLocalBounds(): IBounds;

	/**
	 * Bounds of the object's own content, also when it is not measured.
	 *
	 * @ignore
	 */
	getContentBounds(): IBounds;
	getAdjustedBounds(bounds?: IBounds): IBounds;
	on<C, Key extends keyof IRendererEvents>(key: Key, callback: (this: C, event: IRendererEvents[Key]) => void, context?: C): IDisposer;
	hovering(): boolean;
	getCanvas(): HTMLCanvasElement;

	/**
	 * @ignore
	 */
	getLocalMatrix(): Matrix;
}

export interface IContainer extends IDisplayObject {
	interactiveChildren: boolean;
	_renderer:IRenderer;
	addChild(child: IDisplayObject): void;
	addChildAt(child: IDisplayObject, index: number): void;
	removeChild(child: IDisplayObject): void;
}


/**
 * Blend modes for the `blendMode` setting of a [[Graphics]]. Each value is a
 * canvas composite operation.
 *
 * From https://github.com/pixijs/pixi.js/blob/3dd0ff9a935f0bc13a09aefff9eb2872f02c51b9/packages/canvas/canvas-renderer/src/utils/mapCanvasBlendModesToPixi.ts#L13
 */
export enum BlendMode {
	ADD = "lighter",
	COLOR = "color",
	COLOR_BURN = "color-burn",
	COLOR_DODGE = "color-dodge",
	DARKEN = "darken",
	DIFFERENCE = "difference",
	DST_OVER = "destination-over",
	EXCLUSION = "exclusion",
	HARD_LIGHT = "hard-light",
	HUE = "hue",
	LIGHTEN = "lighten",
	LUMINOSITY = "luminosity",
	MULTIPLY = "multiply",
	NORMAL = "source-over",
	OVERLAY = "overlay",
	SATURATION = "saturation",
	SCREEN = "screen",
	SOFT_LIGHT = "soft-light",
	SRC_ATOP = "source-atop",
	XOR = "xor",
}

export interface IGraphics extends IDisplayObject {
	blendMode: BlendMode;

	clear(): void;

	beginFill(color?: Color | IGradient | IPattern, alpha?: number): void;
	endFill(): void;
	beginPath(): void;

	lineStyle(width?: number, color?: Color | IGradient | IPattern, alpha?: number, lineJoin?: "miter" | "round" | "bevel", lineCap?: "butt" | "round" | "square"): void;
	setLineDash(dash?: number[]): void;
	setLineDashOffset(dashOffset?: number): void;
	endStroke(): void;

	drawRect(x: number, y: number, width: number, height: number): void;
	drawCircle(x: number, y: number, radius: number): void;
	drawEllipse(x: number, y: number, radiusX: number, radiusY: number): void;
	arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
	arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
	lineTo(x: number, y: number): void;
	moveTo(x: number, y: number): void;
	closePath(): void;
	bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): void;
	quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): void;
	svgPath(path: string): void;
	image(image: HTMLImageElement | HTMLCanvasElement, width: number, height: number, x: number, y: number): void;
	shadow(color: Color, blur?: number, offsetX?: number, offsetY?: number, opacity?: number): void;

	/**
	 * Groups the shapes drawn until [[endGroup]] under an id and a name. Canvas
	 * ignores it; SVG writes a `<g>`.
	 *
	 * @since 5.21.0
	 */
	beginGroup(id?: string, name?: string): void;
	endGroup(): void;
}

/**
 * @ignore
 */
export interface IText extends IDisplayObject {
	resolution: number;
	text: string;
	style: ITextStyle;
	textVisible: boolean;
	truncated?: boolean;
	invalidateVisibility(): void;
}

/**
 * @ignore
 */
export interface IRadialText extends IText {
	textType?: "regular" | "circular" | "radial" | "aligned" | "adjusted";
	radius?: number;
	startAngle?: number;
	relativeAngle?: number;
	inside?: boolean;
	orientation?: "inward" | "outward" | "auto";
	kerning?: number;
}

export interface ITextStyle {
	//wordWrapWidth: number = 100;
	fill?: Color | IGradient | IPattern;
	textAlign?: "start" | "end" | "left" | "right" | "center";
	verticalAlign?: "baseline" | "sub" | "super";
	fontFamily?: string;
	fontSize?: string | number;
	fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
	fontStyle?: 'normal' | 'italic' | 'oblique';
	fontVariant?: "normal" | "small-caps";
	textDecoration?: "underline" | "line-through";
	shadowColor?: Color | null;
	shadowBlur?: number;
	shadowOffsetX?: number;
	shadowOffsetY?: number;
	shadowOpacity?: number;


	// leading?: number;
	// letterSpacing?: number;
	lineHeight?: number | Percent;
	baselineRatio?: number;
	// padding?: number;
	// stroke?: number;
	// strokeThickness?: number;
	// trim?: number;
	// wordWrap?: boolean;
	direction?: "ltr" | "rtl";
	textBaseline?: "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";
	oversizedBehavior?: "none" | "hide" | "fit" | "wrap" | "wrap-no-break" | "truncate";
	breakWords?: boolean;
	ellipsis?: string;
	maxWidth?: number;
	maxHeight?: number;
	minScale?: number;
}

export interface IPicture extends IDisplayObject {
	image: HTMLImageElement | undefined;
	width?: number | undefined;
	height?: number | undefined;
	shadowColor?: Color;
	shadowBlur?: number;
	shadowOffsetX?: number;
	shadowOffsetY?: number;
	shadowOpacity?: number;
}

export interface IRenderer extends IDisposer {
	debugGhostView: boolean;
	tapToActivate: boolean;
	tapToActivateTimeout: number;
	resolution: number;
	removeHovering(graphics:IDisplayObject):void;
	interactionsEnabled: boolean;
	createLinearGradient(x1: number, y1: number, x2: number, y2: number): IGradient;
	createRadialGradient(x1: number, y1: number, radius1: number, x2: number, y2: number, radius2: number): IGradient;
	createPattern(graphics: IGraphics, background: IGraphics, repetition: string, width: number, height: number): IPattern;
	createRasterPattern(source: HTMLCanvasElement, repetition: string): IPattern | null;
	makeContainer(): IContainer;
	makeGraphics(): IGraphics;
	makeText(text: string, style: ITextStyle): IText;
	makeRadialText(text: string, style: ITextStyle): IText;
	makeTextStyle(): ITextStyle;
	makePicture(image: HTMLImageElement | undefined): IPicture;
	resize(canvasWidth: number, canvasHeight: number, domWidth: number, domHeight: number): void;
	render(root: IDisplayObject): void;
	getCanvas(root: IDisplayObject, options?: ICanvasOptions): HTMLCanvasElement;
	view: HTMLElement;
	getEvent<A extends IPointerEvent>(originalEvent: A, adjustPoint?: boolean): IRendererEvent<A>;
	getObjectAtPoint(point: IPoint): IDisplayObject | undefined;	
	resetImageArray():void;
}

/**
 * A renderer class, e.g. `CanvasRenderer`.
 */
export interface IRendererClass {
	new(resolution?: number): IRenderer;
}

export interface ICanvasOptions {
	maintainPixelRatio?: boolean;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
}

export interface IMargin {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

/**
 * @ignore
 */
export interface ILayer {
	visible: boolean;
	order: number;
	width: number | undefined;
	height: number | undefined;
	dirty: boolean;
	margin: IMargin | undefined;
}
