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
 * Represents an object describing color switching point in a gradiend.
 *F
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more info
 */
export interface IGradientStop {

	/**
	 * Color.
	 */
	color?: Color;

	/**
	 * Offset defines where in the gradient the color should kick in. Values
	 * from 0 to 1 are possible with 0 meaning start, 0.5 half-way through the
	 * gradient, etc.
	 */
	offset?: number;

	/**
	 * Transparency of the color. 0 - completely transparent, 1 - fully opaque.
	 */
	opacity?: number;

	/**
	 * Sets lightness of the color.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/#Brightness} for more info
	 */
	lighten?: number;

	/**
	 * Sets brightness of the color.
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
	pointerover: IRendererEvent<IPointerEvent>;
	pointerout: IRendererEvent<IPointerEvent>;
	pointerdown: IRendererEvent<IPointerEvent>;
	pointermove: IRendererEvent<IPointerEvent>;
	pointerup: IRendererEvent<IPointerEvent>;
	wheel: IRendererEvent<WheelEvent>;
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
