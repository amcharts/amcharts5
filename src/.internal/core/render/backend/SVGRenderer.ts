/** @ignore *//** */

import type { IMargin, ILayer, ICanvasOptions, IPointerEvent, ITextStyle } from "./Renderer";
import type { ISceneHost } from "../scene/SceneNode";
import type { ISvgItem } from "./SvgExport";
import type { IBounds } from "../../util/IBounds";
import type { IPoint } from "../../util/IPoint";
import { CanvasRenderer, CanvasRendererEvent } from "./CanvasRenderer";
import { SvgDefs, SvgDocument, writeLayer, layerStyle, clipGroup } from "./SvgExport";
import { LinearGradientDef, RadialGradientDef, PatternDef, RasterPatternDef } from "../scene/Paint";
import { measureText, layoutText, layoutCircularText, ignoreFontWeight } from "../scene/TextLayout";
import { InteractionManager } from "../scene/Interaction";
import { GeometricHitTester } from "../scene/HitTest";
import { SceneNode, SceneContainer, SceneGraphics, SceneText, SceneTextStyle, SceneRadialText, SceneImage } from "../scene/SceneNode";
import { ArrayDisposer, Disposer } from "../../util/Disposer";
import * as $utils from "../../util/Utils";
import * as $array from "../../util/Array";


const SVG_NS = "http://www.w3.org/2000/svg";

let rendererIds = 0;

/**
 * A node's elements and the markup they were made from.
 *
 * @ignore
 */
interface ILeafState {
	markup: string;
	elements: Array<Element>;
}

/**
 * @ignore
 */
interface IClipState {
	clip: string;
	element: SVGGElement;
}

/**
 * @ignore
 */
export class SvgLayer implements ILayer {
	public order: number = 0;
	public visible: boolean = true;
	public width: number | undefined;
	public height: number | undefined;
	public dirty: boolean = true;
	public margin: IMargin | undefined;

	// A raster element for code that needs one (see `getCanvas()`)
	public _canvas: HTMLCanvasElement | undefined;

	// Retained content: elements are kept while their markup stays the same
	public _defs: SvgDefs;
	public _defsElement: SVGDefsElement = <SVGDefsElement>document.createElementNS(SVG_NS, "defs");
	public _defElements: Map<string, Element> = new Map();
	public _content: SVGGElement = <SVGGElement>document.createElementNS(SVG_NS, "g");
	public _leaves: Map<SceneNode, ILeafState> = new Map();
	public _clips: Map<SceneNode, IClipState> = new Map();

	/**
	 * `element` is a viewport that clips like the layer's canvas: the chart's
	 * size plus the layer's margin.
	 */
	constructor(public element: SVGSVGElement, idPrefix: string) {
		this._defs = new SvgDefs(idPrefix);
		element.appendChild(this._defsElement);
		element.appendChild(this._content);
	}

	public resize(width: number, height: number): void {
		if (this.width != null) {
			width = this.width;
		}
		if (this.height != null) {
			height = this.height;
		}

		const m = this.margin || { left: 0, right: 0, top: 0, bottom: 0 };
		const w = String(width + m.left + m.right);
		const h = String(height + m.top + m.bottom);
		const element = this.element;
		element.setAttribute("x", String(-m.left));
		element.setAttribute("y", String(-m.top));
		element.setAttribute("width", w);
		element.setAttribute("height", h);
		element.setAttribute("viewBox", -m.left + " " + -m.top + " " + w + " " + h);
	}
}

/**
 * Draws charts as a live SVG document instead of canvases.
 *
 * ```TypeScript
 * const root = am5.Root.new("chartdiv", {
 *   renderer: am5.SVGRenderer
 * });
 * ```
 * ```JavaScript
 * var root = am5.Root.new("chartdiv", {
 *   renderer: am5.SVGRenderer
 * });
 * ```
 *
 * All layers are in one `<svg>` element. Hit testing is geometric (no
 * hidden canvas); text is measured with an in-page canvas, so it wraps and
 * truncates exactly as with `CanvasRenderer`. Image export paints the same
 * scene with an offscreen `CanvasRenderer`.
 *
 * Blend modes `DST_OVER`, `SRC_ATOP` and `XOR` are canvas-only: SVG draws
 * them as `NORMAL`.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/root-element/#renderer} for more information
 * @since 5.21.0
 */
export class SVGRenderer extends ArrayDisposer implements ISceneHost {
	/**
	 * @ignore
	 */
	public view: HTMLElement = document.createElement("div");
	/**
	 * @ignore
	 */
	public _svg: SVGSVGElement = <SVGSVGElement>document.createElementNS(SVG_NS, "svg");

	protected _id: number = ++rendererIds;

	protected _realWidth: number = 0;
	protected _realHeight: number = 0;

	protected _calculatedWidth: number = 0;
	protected _calculatedHeight: number = 0;

	/**
	 * @ignore
	 */
	public layers: Array<SvgLayer> = [];
	/**
	 * @ignore
	 */
	public defaultLayer: SvgLayer = this.getLayer(0);

	/**
	 * @ignore
	 */
	public resolution: number;

	/**
	 * @ignore
	 */
	public _interaction: InteractionManager<SceneNode>;

	protected _hitTester: GeometricHitTester = new GeometricHitTester();
	protected _root: SceneNode | undefined;

	// In the page, so relative font sizes resolve as on the layer canvases
	protected _measureCanvas: HTMLCanvasElement = document.createElement("canvas");
	protected _measureContext: CanvasRenderingContext2D = this._measureCanvas.getContext("2d")!;

	// Detached; parses markup in the SVG namespace
	protected _parser: SVGGElement = <SVGGElement>document.createElementNS(SVG_NS, "g");

	/**
	 * @ignore
	 */
	constructor(resolution?: number) {
		super();

		if (resolution == null) {
			this.resolution = window.devicePixelRatio;
		} else {
			this.resolution = resolution;
		}

		this.view.style.position = "absolute";
		this.view.setAttribute("aria-hidden", "true");

		const svg = this._svg;
		svg.style.position = "absolute";
		svg.style.top = "0px";
		svg.style.left = "0px";
		svg.style.overflow = "visible";

		// A transparent composited layer, like a canvas: text gets grayscale
		// anti-aliasing as on canvas, not LCD
		svg.style.willChange = "transform";

		// Labels are not selectable, as on canvas
		svg.style.setProperty("user-select", "none");
		svg.style.setProperty("-webkit-user-select", "none");
		this.view.appendChild(svg);

		const measure = this._measureCanvas;
		measure.width = 0;
		measure.height = 0;
		measure.style.position = "absolute";
		measure.style.visibility = "hidden";
		this.view.appendChild(measure);

		this._disposers.push(new Disposer(() => {
			$array.each(this.layers, (layer) => {
				if (layer._canvas) {
					layer._canvas.width = 0;
					layer._canvas.height = 0;
				}
			});
			this.view.innerHTML = "";
		}));

		// Monitor for possible pixel ratio changes (when page is zoomed)
		this._disposers.push($utils.onZoom(() => {
			if (resolution == null) {
				this.resolution = window.devicePixelRatio;
			}
		}));

		this._interaction = new InteractionManager<SceneNode>(this);
		this._disposers.push(this._interaction);
	}

	/**
	 * @ignore
	 */
	public get interactionsEnabled(): boolean {
		return this._interaction.interactionsEnabled;
	}

	/**
	 * @ignore
	 */
	public set interactionsEnabled(value: boolean) {
		this._interaction.interactionsEnabled = value;
	}

	/**
	 * @ignore
	 */
	public get tapToActivate(): boolean {
		return this._interaction.tapToActivate;
	}

	/**
	 * @ignore
	 */
	public set tapToActivate(value: boolean) {
		this._interaction.tapToActivate = value;
	}

	/**
	 * @ignore
	 */
	public get tapToActivateTimeout(): number {
		return this._interaction.tapToActivateTimeout;
	}

	/**
	 * @ignore
	 */
	public set tapToActivateTimeout(value: number) {
		this._interaction.tapToActivateTimeout = value;
	}

	/**
	 * There is no ghost canvas: hit testing is geometric.
	 * @ignore
	 */
	public get debugGhostView(): boolean {
		return false;
	}

	/**
	 * @ignore
	 */
	public set debugGhostView(_value: boolean) {
	}

	/**
	 * @ignore
	 */
	createLinearGradient(x1: number, y1: number, x2: number, y2: number): LinearGradientDef {
		return new LinearGradientDef(x1, y1, x2, y2);
	}

	/**
	 * @ignore
	 */
	createRadialGradient(x1: number, y1: number, radius1: number, x2: number, y2: number, radius2: number): RadialGradientDef {
		return new RadialGradientDef(x1, y1, radius1, x2, y2, radius2);
	}

	/**
	 * @ignore
	 */
	createPattern(graphics: SceneGraphics, background: SceneGraphics, repetition: string, width: number, height: number): PatternDef {
		// Snapshots, as canvas rasterizes the tile now: the pattern redraws
		// the same graphics for its next tile
		return new PatternDef(this._snapshot(graphics), this._snapshot(background), repetition, width, height);
	}

	/**
	 * A detached copy of graphics as they are now.
	 */
	protected _snapshot(graphics: SceneGraphics): SceneGraphics {
		const copy = new SceneGraphics(this);
		copy._data.ops = graphics._data.ops.slice();
		copy.visible = graphics.visible;
		copy.alpha = graphics.alpha;
		copy.compoundAlpha = graphics.compoundAlpha;
		copy.x = graphics.x;
		copy.y = graphics.y;
		copy.angle = graphics.angle;
		copy.scale = graphics.scale;
		copy.pivot.x = graphics.pivot.x;
		copy.pivot.y = graphics.pivot.y;
		copy.crisp = graphics.crisp;
		copy.filter = graphics.filter;
		copy.blendMode = graphics.blendMode;
		return copy;
	}

	/**
	 * @ignore
	 */
	createRasterPattern(source: HTMLCanvasElement, repetition: string): RasterPatternDef | null {
		if (!source.width || !source.height) {
			return null;
		}

		// Snapshot now: the source canvas may be redrawn later
		const copy = document.createElement("canvas");
		copy.width = source.width;
		copy.height = source.height;
		copy.getContext("2d")!.drawImage(source, 0, 0);
		return new RasterPatternDef(copy, repetition);
	}

	/**
	 * @ignore
	 */
	makeContainer(): SceneContainer {
		return new SceneContainer(this);
	}

	/**
	 * @ignore
	 */
	makeGraphics(): SceneGraphics {
		return new SceneGraphics(this);
	}

	/**
	 * @ignore
	 */
	makeText(text: string, style: SceneTextStyle): SceneText {
		return new SceneText(this, text, style);
	}

	/**
	 * @ignore
	 */
	makeTextStyle(): SceneTextStyle {
		return new SceneTextStyle();
	}

	/**
	 * @ignore
	 */
	makeRadialText(text: string, style: SceneTextStyle): SceneRadialText {
		return new SceneRadialText(this, text, style);
	}

	/**
	 * @ignore
	 */
	makePicture(image: HTMLImageElement | undefined): SceneImage {
		return new SceneImage(this, image);
	}

	/**
	 * @ignore
	 */
	resize(realWidth: number, realHeight: number, calculatedWidth: number, calculatedHeight: number): void {
		this._realWidth = realWidth;
		this._realHeight = realHeight;

		this._calculatedWidth = calculatedWidth;
		this._calculatedHeight = calculatedHeight;

		$array.each(this.layers, (layer) => {
			layer.dirty = true;
			layer.resize(calculatedWidth, calculatedHeight);
			this._resizeCanvas(layer);
		});

		this.view.style.width = calculatedWidth + "px";
		this.view.style.height = calculatedHeight + "px";

		this._svg.setAttribute("width", String(calculatedWidth));
		this._svg.setAttribute("height", String(calculatedHeight));
	}

	/**
	 * @ignore
	 */
	getLayerByOrder(order: number): SvgLayer | undefined {
		const layers = this.layers;
		const length = layers.length;
		for (let i = 0; i < length; i++) {
			const layer = layers[i];
			if (layer.order == order) {
				return layer;
			}
		}
	}

	/**
	 * @ignore
	 */
	getLayer(order: number, visible: boolean = true): SvgLayer {
		let existingLayer = this.getLayerByOrder(order);
		if (existingLayer) {
			return existingLayer;
		}

		const element = <SVGSVGElement>document.createElementNS(SVG_NS, "svg");
		element.setAttribute("class", "am5-layer-" + order);
		element.setAttribute("overflow", "hidden");

		// Pointer input is resolved geometrically, over the whole `<svg>`
		element.setAttribute("pointer-events", "none");

		// Ids are unique in the page: several charts can share it
		const layer = new SvgLayer(element, "am5s" + this._id + "l" + String(order).replace(/[^\w]/g, "_") + "-");
		layer.order = order;
		layer.visible = visible;
		layer.resize(this._calculatedWidth, this._calculatedHeight);

		const layers = this.layers;
		layers.push(layer);
		layers.sort((a, b) => a.order - b.order);

		const next = layers[$array.indexOf(layers, layer) + 1];
		if (next === undefined) {
			this._svg.appendChild(element);

		} else {
			this._svg.insertBefore(element, next.element);
		}

		this._applyVisible(layer);
		return layer;
	}

	protected _applyVisible(layer: SvgLayer): void {
		if (layer.visible) {
			layer.element.removeAttribute("display");
		} else {
			layer.element.setAttribute("display", "none");
		}
	}

	/**
	 * @ignore
	 */
	render(root: SceneNode): void {
		this._root = root;

		$array.each(this.layers, (layer) => {
			if (layer.dirty && layer.visible) {
				this._renderLayer(root, layer);
				layer.dirty = false;
			}
		});

		this._hitTester.invalidate();
		this._interaction.afterRender();
	}

	/**
	 * Brings a layer's DOM up to date. Elements whose markup did not change
	 * are kept; changed ones are parsed together and put in place.
	 */
	protected _renderLayer(root: SceneNode, layer: SvgLayer): void {
		const defs = layer._defs;
		defs.begin();

		const doc = new SvgDocument(3, defs, this.resolution, true);
		const items = writeLayer(doc, root, layer, this.defaultLayer);

		const leaves: Map<SceneNode, ILeafState> = new Map();
		const clips: Map<SceneNode, IClipState> = new Map();
		const parse: Array<ILeafState> = [];
		this._match(layer, items, leaves, clips, parse);

		// Out first, so kept elements stay in order and rarely move
		layer._leaves.forEach((state, node) => {
			if (leaves.get(node) !== state) {
				$array.each(state.elements, (element) => {
					element.remove();
				});
			}
		});
		layer._clips.forEach((state, node) => {
			if (clips.get(node) !== state) {
				state.element.remove();
			}
		});

		if (parse.length) {
			const groups = this._parse(parse.map((state) => "<g>" + state.markup + "</g>"));
			$array.each(parse, (state, i) => {
				state.elements = Array.prototype.slice.call(groups[i].children);
			});
		}

		this._place(layer._content, items, leaves, clips);
		layer._leaves = leaves;
		layer._clips = clips;

		this._syncDefs(layer);
		defs.sweep();

		const style = layerStyle(doc.blend);
		if (style) {
			layer.element.setAttribute("style", style);
		} else {
			layer.element.removeAttribute("style");
		}
	}

	/**
	 * Pairs items with last frame's elements: leaves by markup, clip groups
	 * by node. Leaves that need new elements go to `parse`.
	 */
	protected _match(layer: SvgLayer, items: Array<ISvgItem>, leaves: Map<SceneNode, ILeafState>, clips: Map<SceneNode, IClipState>, parse: Array<ILeafState>): void {
		$array.each(items, (item) => {
			if ("items" in item) {
				let state = layer._clips.get(item.node);
				if (!state) {
					state = { clip: "", element: <SVGGElement>document.createElementNS(SVG_NS, "g") };
				}
				if (state.clip !== item.clip) {
					state.clip = item.clip;
					state.element.setAttribute("clip-path", clipGroup(item.clip));
				}
				clips.set(item.node, state);
				this._match(layer, item.items, leaves, clips, parse);

			} else {
				let state = layer._leaves.get(item.node);
				if (!state || state.markup !== item.markup) {
					state = { markup: item.markup, elements: [] };
					parse.push(state);
				}
				leaves.set(item.node, state);
			}
		});
	}

	/**
	 * Puts the elements of `items` into `parent` in order, moving only those
	 * that are out of place.
	 */
	protected _place(parent: Element, items: Array<ISvgItem>, leaves: Map<SceneNode, ILeafState>, clips: Map<SceneNode, IClipState>): void {
		let cursor = parent.firstChild;

		const put = (element: Element) => {
			if (element === cursor) {
				cursor = cursor.nextSibling;
			} else {
				parent.insertBefore(element, cursor);
			}
		};

		$array.each(items, (item) => {
			if ("items" in item) {
				const state = clips.get(item.node)!;
				this._place(state.element, item.items, leaves, clips);
				put(state.element);

			} else {
				$array.each(leaves.get(item.node)!.elements, put);
			}
		});

		while (cursor) {
			const next: ChildNode | null = cursor.nextSibling;
			parent.removeChild(cursor);
			cursor = next;
		}
	}

	/**
	 * Adds defs used this frame, removes the rest.
	 */
	protected _syncDefs(layer: SvgLayer): void {
		const defs = layer._defs;
		const used = defs.used;
		const elements = layer._defElements;

		elements.forEach((element, markup) => {
			if (!used.has(markup)) {
				element.remove();
				elements.delete(markup);
			}
		});

		const added: Array<string> = [];
		used.forEach((markup) => {
			if (!elements.has(markup)) {
				added.push(markup);
			}
		});

		if (added.length) {
			const parsed = this._parse(added.map((markup) => defs.withId(markup)));
			$array.each(added, (markup, i) => {
				const element = parsed[i];
				layer._defsElement.appendChild(element);
				elements.set(markup, element);
			});
		}
	}

	/**
	 * Parses markup snippets, one top-level element each, in one go.
	 */
	protected _parse(snippets: Array<string>): Array<Element> {
		const parser = this._parser;
		parser.innerHTML = snippets.join("");
		const elements: Array<Element> = Array.prototype.slice.call(parser.children);
		parser.innerHTML = "";
		return elements;
	}

	/**
	 * @ignore
	 */
	_removeObject(_node: SceneNode): void {
		// Not hit until the next frame rebuilds the hit list
		this._hitTester.invalidate();
	}

	/**
	 * @ignore
	 */
	_useLayer(order: number, margin: IMargin | undefined): SvgLayer {
		const visible = true;
		const layer = this.getLayer(order, visible);
		layer.visible = visible;
		layer.margin = margin;
		layer.dirty = true;
		layer.resize(this._calculatedWidth, this._calculatedHeight);
		this._applyVisible(layer);
		return layer;
	}

	/**
	 * A transparent canvas over the layer, for code that needs a raster
	 * element to position against (the annotator). It holds no pixels of
	 * the chart.
	 * @ignore
	 */
	_layerCanvas(layer: ILayer): HTMLCanvasElement {
		const svgLayer = <SvgLayer>layer;
		if (!svgLayer._canvas) {
			const canvas = document.createElement("canvas");
			canvas.style.position = "absolute";
			canvas.style.top = "0px";
			canvas.style.left = "0px";
			canvas.style.pointerEvents = "none";
			svgLayer._canvas = canvas;
			this._resizeCanvas(svgLayer);
			this.view.appendChild(canvas);
		}
		return svgLayer._canvas;
	}

	protected _resizeCanvas(layer: SvgLayer): void {
		const canvas = layer._canvas;
		if (canvas) {
			canvas.width = Math.floor(this._calculatedWidth * this.resolution);
			canvas.height = Math.floor(this._calculatedHeight * this.resolution);
			canvas.style.width = this._calculatedWidth + "px";
			canvas.style.height = this._calculatedHeight + "px";
		}
	}

	/**
	 * Lays text out with the in-page measuring canvas, in the state the canvas
	 * renderer measures with.
	 * @ignore
	 */
	_measureText(text: SceneText): IBounds {
		const context = this._measureContext;
		const style = text.style;
		const circular = text instanceof SceneRadialText && text.textType == "circular";

		if (circular) {
			(<SceneRadialText>text)._textReversed = false;
		}

		context.save();
		context.font = text._getFontStyle(undefined, circular ? false : ignoreFontWeight());
		if (style.textAlign) {
			context.textAlign = style.textAlign;
		}
		if (style.direction) {
			context.direction = style.direction;
		}
		if (style.textBaseline) {
			context.textBaseline = style.textBaseline;
		}

		const state = text._layoutState();
		const fontOf = (format: ITextStyle) => text._getFontStyle(format);
		const bounds = circular
			? layoutCircularText(context, text.text, style, fontOf, state)
			: layoutText(context, text.text, style, fontOf, state);
		text._applyLayoutState(state);

		// Decorations of wrapped or truncated text span the glyphs actually
		// drawn; the canvas painter measures these when it draws
		if (!circular && ["truncate", "wrap", "wrap-no-break"].indexOf(style.oversizedBehavior || "") > -1) {
			const baseFont = text._getFontStyle();
			$array.each(state.lines, (line) => {
				$array.each(line.textChunks, (chunk) => {
					if (chunk.textDecoration == "underline" || chunk.textDecoration == "line-through") {
						context.font = chunk.style || baseFont;
						const metrics = measureText(chunk.text, context, style);
						chunk.width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
					}
				});
			});
		}

		context.restore();

		text._textBounds = bounds;
		return bounds;
	}

	protected _margin(): IMargin {
		const margin = { left: 0, right: 0, top: 0, bottom: 0 };
		$array.each(this.layers, (layer) => {
			if (layer.margin) {
				margin.left = Math.max(margin.left, layer.margin.left);
				margin.right = Math.max(margin.right, layer.margin.right);
				margin.top = Math.max(margin.top, layer.margin.top);
				margin.bottom = Math.max(margin.bottom, layer.margin.bottom);
			}
		});
		return margin;
	}

	/**
	 * @ignore
	 */
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

		const margin = this._margin();

		return new CanvasRendererEvent(
			originalEvent,
			originalPoint,
			point,
			new DOMRect(
				-margin.left,
				-margin.top,
				bbox.width + margin.left + margin.right,
				bbox.height + margin.top + margin.bottom,
			),
		);
	}

	/**
	 * @ignore
	 */
	_getHitTarget(point: IPoint, bbox: DOMRect, target: Node | null): SceneNode | undefined | false {
		if (bbox.width === 0 || bbox.height === 0 || point.x < bbox.left || point.x > bbox.right || point.y < bbox.top || point.y > bbox.bottom) {
			return;
		}

		if (!target || !this.view.contains(target)) {
			return;
		}

		// The pixel the ghost canvas would sample, tested at its center
		const margin = this._margin();
		const resolution = this.resolution;
		const width = Math.floor((this._calculatedWidth + margin.left + margin.right) * resolution);
		const height = Math.floor((this._calculatedHeight + margin.top + margin.bottom) * resolution);
		const px = Math.round(((point.x - bbox.left) / bbox.width) * width);
		const py = Math.round(((point.y - bbox.top) / bbox.height) * height);

		return this._hitTest({
			x: (px + .5) / resolution - margin.left,
			y: (py + .5) / resolution - margin.top,
		}) || false;
	}

	protected _hitTest(point: IPoint): SceneNode | undefined {
		if (this._root) {
			return this._hitTester.hit(this._root, this.defaultLayer, point);
		}
	}

	/**
	 * @ignore
	 */
	getObjectAtPoint(point: IPoint): SceneNode | undefined {
		const resolution = this.resolution;
		return this._hitTest({
			x: (Math.round(point.x * resolution) + .5) / resolution,
			y: (Math.round(point.y * resolution) + .5) / resolution,
		});
	}

	/**
	 * @ignore
	 */
	removeHovering(graphics: SceneNode) {
		this._interaction.removeHovering(graphics);
	}

	/**
	 * @ignore
	 */
	public resetImageArray() {
	}

	/**
	 * The chart as an image: the same scene painted by an offscreen
	 * `CanvasRenderer`, so image export looks as it does with canvas.
	 * @ignore
	 */
	public getCanvas(root: SceneNode, options?: ICanvasOptions): HTMLCanvasElement {
		const painter = new CanvasRenderer(this.resolution);
		const view = painter.view;

		// In the page, so relative font sizes resolve as for the chart
		view.style.visibility = "hidden";
		this.view.appendChild(view);

		try {
			painter.resize(this._realWidth, this._realHeight, this._calculatedWidth, this._calculatedHeight);
			$array.each(this.layers, (layer) => {
				if (layer.visible) {
					painter._useLayer(layer.order, layer.margin);
				}
			});
			return painter.getCanvas(root, options);

		} finally {
			this.view.removeChild(view);
			painter.dispose();
		}
	}
}
