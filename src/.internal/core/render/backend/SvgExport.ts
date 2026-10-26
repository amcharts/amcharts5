import type { Matrix } from "../../util/Matrix";
import type { IBounds } from "../../util/IBounds";
import type { GraphicsPaint, GraphicsData, IPathSink } from "../scene/GraphicsData";
import type { IPoint } from "../../util/IPoint";
import type { Shadow, GraphicsImage } from "../scene/GraphicsData";
import type { ILayer, IDisplayObject } from "./Renderer";
import type { ISceneHost } from "../scene/SceneNode";
import type { Root } from "../../Root";
import type { Sprite } from "../Sprite";
import { SceneNode, SceneContainer, SceneGraphics, SceneText, SceneRadialText, SceneImage } from "../scene/SceneNode";
import { SvgPathSink } from "../scene/SvgPathSink";
import { LinearGradientDef, RadialGradientDef, PatternDef, RasterPatternDef } from "../scene/Paint";
import { getFontStyle, resolveFont, baselineShift } from "../scene/TextLayout";
import { Color } from "../../util/Color";
import { TextFormatter } from "../../util/TextFormatter";
import * as $array from "../../util/Array";
import * as $math from "../../util/Math";


/**
 * Options for [[renderToSVG]].
 *
 * @since 5.21.0
 */
export interface ISvgExportOptions {
	/**
	 * Width of the SVG in pixels. Defaults to the chart's width when a `Root`
	 * or an element of a chart is passed.
	 */
	width?: number;

	/**
	 * Height of the SVG in pixels. Defaults to the chart's height when a
	 * `Root` or an element of a chart is passed.
	 */
	height?: number;

	/**
	 * Decimal places for coordinates.
	 *
	 * @default 3
	 */
	precision?: number;

	/**
	 * Prefix for ids in `<defs>`; needed when several SVGs share a page.
	 *
	 * @default "am5-"
	 */
	idPrefix?: string;

	/**
	 * Name of the image for screen readers, written as the SVG's `<title>`.
	 *
	 * Defaults to the chart's `ariaLabel` (`Root` setting), if it has one.
	 */
	title?: string;

	/**
	 * CSS color to fill the image with, behind the chart.
	 *
	 * Transparent if not set.
	 *
	 * @since 5.21.0
	 */
	background?: string;

	/**
	 * Also write elements marked `exportable: false`, such as scrollbar grips,
	 * as the chart shows them.
	 *
	 * @default false
	 * @since 5.21.5
	 */
	includeNonExportable?: boolean;
}

/**
 * @ignore
 */
function escapeXML(text: string): string {
	// Control characters XML does not allow would make the whole document unreadable
	return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Data URLs of raster pattern tiles, which do not change once made.
 *
 * @ignore
 */
const rasterURLs: WeakMap<RasterPatternDef, string> = new WeakMap();

/**
 * A canvas as a data URL, or `""` when cross-origin pixels make it
 * unreadable (image export leaves those out too).
 *
 * @ignore
 */
function canvasURL(canvas: HTMLCanvasElement): string {
	try {
		return canvas.toDataURL();
	} catch (e) {
		return "";
	}
}

// Encoded canvases of graphics image ops: a graphics is redrawn whenever the canvas it draws changes
const imageOpURLs: WeakMap<HTMLCanvasElement, { data: GraphicsData, version: number, url: string }> = new WeakMap();

function imageOpURL(g: SceneGraphics, canvas: HTMLCanvasElement): string {
	const data = g._data;
	let entry = imageOpURLs.get(canvas);
	if (!entry || entry.data !== data || entry.version !== data.version) {
		entry = { data, version: data.version, url: canvasURL(canvas) };
		imageOpURLs.set(canvas, entry);
	}
	return entry.url;
}

/**
 * `<defs>` content by markup: the same markup always gets the same id, so
 * the elements that reference it keep the same markup from frame to frame.
 *
 * @ignore
 */
export class SvgDefs {
	// Def markup without its id > id
	protected _ids: Map<string, string> = new Map();
	protected _next: number = 0;

	// Markup used since `begin()`, in first-use order
	public used: Set<string> = new Set();

	constructor(protected _prefix: string) { }

	public begin(): void {
		this.used = new Set();
	}

	/**
	 * The id of a def given as markup without an id attribute.
	 */
	public id(kind: string, markup: string): string {
		let id = this._ids.get(markup);
		if (id === undefined) {
			id = this._prefix + kind + (++this._next);
			this._ids.set(markup, id);
		}
		this.used.add(markup);
		return id;
	}

	/**
	 * The def as it goes into `<defs>`.
	 */
	public withId(markup: string): string {
		const id = this._ids.get(markup)!;
		return markup.replace(/^<(\w+)/, "<$1 id=\"" + id + "\"");
	}

	/**
	 * Forgets defs not used since `begin()`.
	 */
	public sweep(): void {
		const used = this.used;
		this._ids.forEach((_id, markup) => {
			if (!used.has(markup)) {
				this._ids.delete(markup);
			}
		});
	}
}

/**
 * Writes SVG markup and collects the `<defs>` it references.
 *
 * `live` documents are drawn in the browser rather than exported: text is laid
 * out when missing, and content that export leaves out is kept.
 *
 * @ignore
 */
export class SvgDocument {
	// A blend mode was written since this was last reset
	public blend: boolean = false;

	protected _paints: Map<object, string> = new Map();
	protected _p: number;

	// Fonts in pixels, and baseline shifts, by font
	public _fonts: Map<string, string> = new Map();
	public _shifts: Map<string, number> = new Map();

	// Elements marked `exportable: false` are written too
	public nonExportable: boolean = false;

	// An exported file is also read by tools that only know the older attribute
	public href: string;

	constructor(public precision: number, public defs: SvgDefs, public resolution: number = 1, public live: boolean = false) {
		this._p = Math.pow(10, precision);
		this.href = live ? "href" : "xlink:href";
	}

	public n(value: number): string {
		const p = this._p;
		return String(Math.round(value * p) / p);
	}

	/**
	 * `<defs>` content used by this document.
	 */
	public defsMarkup(): string {
		const out: Array<string> = [];
		this.defs.used.forEach((markup) => {
			out.push(this.defs.withId(markup));
		});
		return out.join("");
	}

	public matrix(m: Matrix, crisp: boolean = false): string {
		let tx = m.tx;
		let ty = m.ty;
		if (crisp) {
			// Pixel-aligned as on canvas, which snaps in device pixels
			const r = this.resolution;
			tx = (Math.floor(tx * r) + .5) / r;
			ty = (Math.floor(ty * r) + .5) / r;
		}
		return "matrix(" + this.n(m.a) + " " + this.n(m.b) + " " + this.n(m.c) + " " + this.n(m.d) + " " + this.n(tx) + " " + this.n(ty) + ")";
	}

	/**
	 * `fill="..."` / `stroke="..."` attributes for a paint.
	 */
	public paint(kind: "fill" | "stroke", paint: GraphicsPaint): string {
		if (typeof paint === "string") {
			return this.color(kind, paint);
		}

		let ref = this._paints.get(paint);
		if (ref === undefined) {
			if (paint instanceof LinearGradientDef) {
				ref = this.defs.id("g", "<linearGradient gradientUnits=\"userSpaceOnUse\" x1=\"" + this.n(paint.x1) + "\" y1=\"" + this.n(paint.y1) + "\" x2=\"" + this.n(paint.x2) + "\" y2=\"" + this.n(paint.y2) + "\">" + this._stops(paint.stops) + "</linearGradient>");

			} else if (paint instanceof RadialGradientDef) {
				ref = this.defs.id("g", "<radialGradient gradientUnits=\"userSpaceOnUse\" cx=\"" + this.n(paint.x2) + "\" cy=\"" + this.n(paint.y2) + "\" r=\"" + this.n(paint.radius2) + "\" fx=\"" + this.n(paint.x1) + "\" fy=\"" + this.n(paint.y1) + "\" fr=\"" + this.n(paint.radius1) + "\">" + this._stops(paint.stops) + "</radialGradient>");

			} else if (paint instanceof PatternDef) {
				const tile: Array<string> = [];
				writeDetached(this, <SceneGraphics>paint.background, tile);
				writeDetached(this, <SceneGraphics>paint.graphics, tile);
				ref = this.defs.id("p", "<pattern patternUnits=\"userSpaceOnUse\" width=\"" + this.n(paint.width) + "\" height=\"" + this.n(paint.height) + "\">" + tile.join("") + "</pattern>");

			} else if (paint instanceof RasterPatternDef) {
				const w = paint.source.width;
				const h = paint.source.height;
				let url = rasterURLs.get(paint);
				if (url === undefined) {
					url = canvasURL(paint.source);
					rasterURLs.set(paint, url);
				}
				if (!url || !w || !h) {
					return kind + "=\"none\"";
				}
				ref = this.defs.id("p", "<pattern patternUnits=\"userSpaceOnUse\" width=\"" + w + "\" height=\"" + h + "\"><image width=\"" + w + "\" height=\"" + h + "\" " + this.href + "=\"" + url + "\"/></pattern>");

			} else {
				return kind + "=\"none\"";
			}
			this._paints.set(paint, ref);
		}
		return kind + "=\"url(#" + ref + ")\"";
	}

	/**
	 * A CSS color as a color plus a separate opacity, which more SVG
	 * consumers understand than `rgba()`.
	 */
	public color(kind: string, css: string): string {
		const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(css);
		if (m) {
			const out = kind + "=\"rgb(" + Math.round(+m[1]) + "," + Math.round(+m[2]) + "," + Math.round(+m[3]) + ")\"";
			return (m[4] !== undefined && +m[4] < 1) ? out + " " + kind + "-opacity=\"" + this.n(+m[4]) + "\"" : out;
		}
		return kind + "=\"" + escapeXML(css) + "\"";
	}

	protected _stops(stops: Array<{ offset: number, color: string }>): string {
		return stops.map((stop) => "<stop offset=\"" + this.n(stop.offset) + "\" " + this.color("stop-color", stop.color).replace("stop-color-opacity", "stop-opacity") + "/>").join("");
	}

	/**
	 * A drop shadow with canvas semantics: offsets and blur are in device
	 * pixels, unaffected by the element's transform.
	 */
	public shadow(color: string, blur: number, offsetX: number, offsetY: number, m: Matrix, bounds?: IBounds, extra?: number): string | undefined {
		// Canvas draws no shadow without blur or offset
		if (!blur && !offsetX && !offsetY) {
			return undefined;
		}

		// Canvas measures them in device pixels
		const r = this.resolution;
		blur /= r;
		offsetX /= r;
		offsetY /= r;

		// The filter runs in the element's user space: undo its linear transform
		const det = m.a * m.d - m.b * m.c || 1;
		const dx = (m.d * offsetX - m.c * offsetY) / det;
		const dy = (-m.b * offsetX + m.a * offsetY) / det;
		const scale = Math.sqrt(Math.abs(det)) || 1;
		return this._dropShadow(color, blur / 2 / scale, dx, dy, bounds, extra);
	}

	/**
	 * An `feDropShadow` filter def, in user-space units. `bounds` are the
	 * shape's, and `extra` what it draws beyond them (a stroke).
	 */
	protected _dropShadow(color: string, stdDeviation: number, dx: number, dy: number, bounds?: IBounds, extra: number = 0): string {
		const flood = this.color("flood-color", color).replace("flood-color-opacity", "flood-opacity");

		// Half the shape's size on each side, unless the shadow reaches further: a glow around a small shape
		let region = "x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"";
		if (bounds && bounds.right >= bounds.left && bounds.bottom >= bounds.top) {
			const width = bounds.right - bounds.left;
			const height = bounds.bottom - bounds.top;
			const padX = 3 * stdDeviation + Math.abs(dx) + extra;
			const padY = 3 * stdDeviation + Math.abs(dy) + extra;
			if (padX > width / 2 || padY > height / 2) {
				region = "filterUnits=\"userSpaceOnUse\" x=\"" + this.n(bounds.left - padX) + "\" y=\"" + this.n(bounds.top - padY) + "\" width=\"" + this.n(width + 2 * padX) + "\" height=\"" + this.n(height + 2 * padY) + "\"";
			}
		}
		return this.defs.id("s", "<filter " + region + " color-interpolation-filters=\"sRGB\"><feDropShadow dx=\"" + this.n(dx) + "\" dy=\"" + this.n(dy) + "\" stdDeviation=\"" + this.n(stdDeviation) + "\" " + flood + "/></filter>");
	}

	/**
	 * A CSS filter with canvas semantics: canvas measures filter lengths in
	 * device pixels, unaffected by the element's transform, while SVG
	 * measures them in the element's user space.
	 */
	public cssFilter(filter: string, m: Matrix, bounds?: IBounds): string {
		const r = this.resolution;
		const det = m.a * m.d - m.b * m.c || 1;
		const scale = (Math.sqrt(Math.abs(det)) || 1) * r;

		return filter.replace(/([a-z-]+)\(((?:[^()]|\([^()]*\))*)\)/gi, (all: string, name: string, args: string) => {
			const fn = name.toLowerCase();
			if (fn === "blur") {
				const length = /^\s*(-?[\d.]+)(px)?\s*$/.exec(args);
				return length ? "blur(" + this.n(+length[1] / scale) + "px)" : all;

			} else if (fn === "drop-shadow") {
				const tokens: Array<string> = args.match(/[a-z-]+\([^()]*\)|\S+/gi) || [];
				const lengths: Array<number> = [];
				const colors: Array<string> = [];
				let other = false;
				$array.each(tokens, (token) => {
					const length = /^(-?[\d.]+)(px)?$/.exec(token);
					if (length) {
						lengths.push(+length[1]);
					} else if (/^-?[\d.]+[a-z%]+$/i.test(token)) {
						other = true;
					} else {
						colors.push(token);
					}
				});
				if (other || lengths.length < 2) {
					return all;
				}

				// Offsets undo the element's linear transform, like shadows. An
				// feDropShadow def, because Chrome draws CSS drop-shadow() on SVG
				// elements differently from canvas
				const ox = lengths[0] / r;
				const oy = lengths[1] / r;
				const dx = (m.d * ox - m.c * oy) / det;
				const dy = (-m.b * ox + m.a * oy) / det;
				const blur = lengths.length > 2 ? lengths[2] / scale : 0;
				return "url(#" + this._dropShadow(colors.length ? colors.join(" ") : "#000", blur, dx, dy, bounds) + ")";
			}
			return all;
		});
	}

	public clip(mask: SceneGraphics): string {
		const cache = pathEntry(mask, this.precision);
		if (cache.clip === undefined) {
			const sink = new SvgPathSink(this.precision);
			$array.each(mask._data.ops, (op) => {
				op.path(sink);
			});
			cache.clip = sink.d;
		}
		return this.defs.id("c", "<clipPath" + (this.live ? "" : " data-name=\"Mask\"") + "><path transform=\"" + this.matrix(mask._matrix) + "\" d=\"" + cache.clip + "\"/></clipPath>");
	}
}

/**
 * Attributes every leaf carries: transform, opacity, filter, blend mode.
 *
 * @ignore
 */
function leafAttrs(doc: SvgDocument, node: SceneNode, alpha: number, filter: string | undefined, shadowId?: string): string {
	let attrs = " transform=\"" + doc.matrix(node._matrix, node.crisp && node.deform === null) + "\"";
	if (alpha < 1) {
		attrs += " opacity=\"" + doc.n(alpha) + "\"";
	}
	const filters: Array<string> = [];
	if (shadowId) {
		filters.push("url(#" + shadowId + ")");
	}
	// "none" cannot share the list with a shadow's url()
	if (filter && filter.trim() !== "none") {
		filters.push(doc.cssFilter(filter, node._matrix, node.getLocalBounds()));
	}
	let style = "";
	if (filters.length) {
		style += "filter:" + filters.join(" ") + ";";
	}
	if (node instanceof SceneGraphics && node.blendMode && node.blendMode != "source-over") {
		if (compositeOnly(node.blendMode)) {
			warnCompositeOnly();
		} else {
			style += "mix-blend-mode:" + (node.blendMode == "lighter" ? "plus-lighter" : node.blendMode) + ";";
			doc.blend = true;
		}
	}
	if (style) {
		attrs += " style=\"" + escapeXML(style) + "\"";
	}
	return attrs;
}

/**
 * Porter-Duff modes: canvas compositing that SVG cannot express.
 *
 * @ignore
 */
function compositeOnly(mode: string): boolean {
	return mode == "destination-over" || mode == "source-atop" || mode == "xor";
}

/**
 * @ignore
 */
let warnedCompositeOnly = false;

/**
 * @ignore
 */
function warnCompositeOnly(): void {
	if (!warnedCompositeOnly) {
		warnedCompositeOnly = true;
		console.warn("amCharts SVG: blend modes DST_OVER, SRC_ATOP and XOR are canvas-only; they are drawn as NORMAL.");
	}
}

/**
 * Canvas ignores a fill or stroke it cannot use and keeps the previous one.
 *
 * @ignore
 */
function isPaint(paint: GraphicsPaint): boolean {
	return typeof paint === "string" || paint instanceof LinearGradientDef || paint instanceof RadialGradientDef || paint instanceof PatternDef || paint instanceof RasterPatternDef;
}

/**
 * Path data a graphics painted with, while its ops stay the same.
 *
 * @ignore
 */
interface IPathCache {
	version: number;
	length: number;
	precision: number;

	// `d` of every `endFill` / `endStroke`, in op order
	paths?: Array<string>;

	// All ops as one path, as a mask clips
	clip?: string;
}

/**
 * @ignore
 */
const pathCache: WeakMap<SceneGraphics, IPathCache> = new WeakMap();

/**
 * The cache entry of `g`, emptied when its ops have changed.
 *
 * @ignore
 */
function pathEntry(g: SceneGraphics, precision: number): IPathCache {
	const data = g._data;
	let cache = pathCache.get(g);
	if (!cache || cache.version !== data.version || cache.length !== data.ops.length || cache.precision !== precision) {
		cache = { version: data.version, length: data.ops.length, precision };
		pathCache.set(g, cache);
	}
	return cache;
}

/**
 * Graphics ops as SVG, in canvas order: paths accumulate until `beginPath`,
 * and every `endFill` / `endStroke` paints the path so far.
 *
 * @ignore
 */
function writeGraphics(doc: SvgDocument, g: SceneGraphics, alpha: number, filter: string | undefined, out: Array<string>, tiles?: ITileCopies): void {
	// Path data is reused while the ops are unchanged: moving, fading or
	// restyling a shape does not trace it again. A tile drawn as copies is not
	const cache = tiles ? undefined : pathEntry(g, doc.precision);
	const traced = !cache || !cache.paths;
	const paths = cache ? (cache.paths || (cache.paths = [])) : [];
	let pathIndex = 0;
	let pathOps: Array<IPathOp> = [];
	const nextPath = (kind: "fill" | "stroke"): string => {
		if (traced) {
			paths.push(tiles ? (tiles.clip ? clippedTilesPath(doc, pathOps, tiles, kind, dash, dashOffset) : copiesPath(pathOps, tiles.copies, doc.precision)) : sink.d);
		}
		return paths[pathIndex++];
	};

	let sink = new SvgPathSink(doc.precision);
	let fill: GraphicsPaint = "#000";
	let stroke: GraphicsPaint = "#000";
	let width = 1;
	let join = "miter";
	let cap = "butt";
	let dash: number[] = [];
	let dashOffset = 0;
	let shadow: Shadow | undefined;

	const attrs = (withShadow: boolean) => {
		// Clipped tile copies are already in the shape's space
		if (tiles && tiles.clip) {
			return alpha < 1 ? " opacity=\"" + doc.n(alpha) + "\"" : "";
		}
		const shadowId = (withShadow && shadow) ? doc.shadow(shadow.color, shadow.blur, shadow.offsetX, shadow.offsetY, g._matrix, g.getLocalBounds(), width * 5) : undefined;
		return leafAttrs(doc, g, alpha, filter, shadowId);
	};

	// Where each open group starts in `out`, to drop it if nothing is drawn in it
	const groups: Array<number> = [];

	$array.each(g._data.ops, (op) => {
		switch (op.type) {
			case "beginPath":
				if (traced) {
					sink = new SvgPathSink(doc.precision);
					pathOps = [];
				}
				break;
			case "beginFill":
				if (isPaint(op.color)) {
					fill = op.color;
				}
				break;
			case "beginGroup":
				groups.push(out.length);
				out.push("<g" + groupAttrs(doc, op.id, op.name) + ">");
				break;
			case "endGroup": {
				const start = groups.pop();
				if (start !== undefined) {
					if (out.length == start + 1) {
						out.pop();
					}
					else {
						out.push("</g>");
					}
				}
				break;
			}
			case "endFill": {
				const d = nextPath("fill");
				if (d && !doc.live && fill instanceof PatternDef && !tiles) {
					const plain = attrs(false);
					const shadowed = attrs(true);
					writePatternFill(doc, g, d, fill, plain, shadowed != plain ? shadowed : undefined, out);
				} else if (d && (doc.live || !invisible(fill))) {
					out.push("<path" + attrs(true) + " d=\"" + d + "\" " + doc.paint("fill", fill) + "/>");
				}
				if (op.clearShadow) {
					shadow = undefined;
				}
				break;
			}
			case "lineStyle":
				if (isPaint(op.color)) {
					stroke = op.color;
				}
				// Canvas ignores a width that is not positive and finite
				if (op.width > 0 && isFinite(op.width)) {
					width = op.width;
				}
				if (op.lineJoin) {
					join = op.lineJoin;
				}
				if (op.lineCap) {
					cap = op.lineCap;
				}
				break;
			case "endStroke": {
				const d = nextPath("stroke");
				if (d && (doc.live || !invisible(stroke))) {
					let s = " fill=\"none\" " + doc.paint("stroke", stroke) + " stroke-width=\"" + doc.n(width) + "\" stroke-miterlimit=\"10\"";
					if (join != "miter") {
						s += " stroke-linejoin=\"" + join + "\"";
					}
					if (cap != "butt") {
						s += " stroke-linecap=\"" + cap + "\"";
					}
					// Cut tile copies have their dashes drawn in already
					if (dash.length && !(tiles && tiles.clip)) {
						s += " stroke-dasharray=\"" + dash.map((x) => doc.n(x)).join(" ") + "\"";
						if (dashOffset) {
							s += " stroke-dashoffset=\"" + doc.n(dashOffset) + "\"";
						}
					}
					out.push("<path" + attrs(true) + " d=\"" + d + "\"" + s + "/>");
				}
				break;
			}
			case "lineDash":
				// Canvas ignores a dash list with a negative or non-finite value
				if (!$array.any(op.dash, (x) => !(x >= 0 && isFinite(x)))) {
					dash = op.dash;
				}
				break;
			case "lineDashOffset":
				if (isFinite(op.dashOffset)) {
					dashOffset = op.dashOffset;
				}
				break;
			case "shadow":
				shadow = op;
				break;
			case "image":
				if (tiles) {
					$array.each(tiles.copies, (copy) => {
						writeImageOp(doc, g, <GraphicsImage><any>{ image: op.image, x: op.x + copy.x, y: op.y + copy.y, width: op.width, height: op.height }, alpha, filter, out);
					});
				} else {
					writeImageOp(doc, g, op, alpha, filter, out);
				}
				break;
			default:
				if (traced) {
					if (tiles) {
						pathOps.push(op);
					} else {
						op.path(sink);
					}
				}
		}
	});

	// Groups left open close with the graphics
	while (groups.length) {
		const start = groups.pop()!;
		if (out.length == start + 1) {
			out.pop();
		}
		else {
			out.push("</g>");
		}
	}
}

/**
 * Whether a paint is a fully transparent color, which canvas draws as nothing.
 *
 * @ignore
 */
function invisible(paint: GraphicsPaint): boolean {
	if (typeof paint !== "string") {
		return false;
	}
	const m = /^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)$/.exec(paint);
	return !!m && +m[1] <= 0;
}

/**
 * A group's id and name. A document takes them as `id` and `data-name`, as
 * design tools read them; a live chart, which may share the page with other
 * charts, as `data-id` and `data-name`.
 *
 * @ignore
 */
function groupAttrs(doc: SvgDocument, id?: string, name?: string): string {
	let attrs = "";
	if (id != null && id !== "") {
		attrs += (doc.live ? " data-id=\"" : " id=\"") + escapeXML(id) + "\"";
	}
	if (name != null && name !== "") {
		attrs += " data-name=\"" + escapeXML(name) + "\"";
	}
	return attrs;
}

/**
 * @ignore
 */
function writeImageOp(doc: SvgDocument, g: SceneGraphics, op: GraphicsImage, alpha: number, filter: string | undefined, out: Array<string>): void {
	// Canvas draws nothing at a non-finite position or size
	if (!isFinite(op.x) || !isFinite(op.y) || !isFinite(op.width) || !isFinite(op.height)) {
		return;
	}
	const image = op.image;
	const href = image instanceof HTMLCanvasElement ? imageOpURL(g, image) : image.src;
	if (!href) {
		return;
	}
	out.push("<image" + leafAttrs(doc, g, alpha, filter) + " x=\"" + doc.n(op.x) + "\" y=\"" + doc.n(op.y) + "\" width=\"" + doc.n(op.width) + "\" height=\"" + doc.n(op.height) + "\" " + doc.href + "=\"" + escapeXML(href) + "\" preserveAspectRatio=\"none\"/>");
}

// A path moved by `dx`, `dy`
function offsetSink(sink: IPathSink, dx: number, dy: number): IPathSink {
	return {
		moveTo: (x, y) => sink.moveTo(x + dx, y + dy),
		lineTo: (x, y) => sink.lineTo(x + dx, y + dy),
		closePath: () => sink.closePath(),
		rect: (x, y, w, h) => sink.rect(x + dx, y + dy, w, h),
		arc: (cx, cy, r, a0, a1, ccw) => sink.arc(cx + dx, cy + dy, r, a0, a1, ccw),
		arcTo: (x1, y1, x2, y2, r) => sink.arcTo(x1 + dx, y1 + dy, x2 + dx, y2 + dy, r),
		ellipse: (x, y, rx, ry, rotation, a0, a1, ccw) => sink.ellipse(x + dx, y + dy, rx, ry, rotation, a0, a1, ccw),
		bezierCurveTo: (x1, y1, x2, y2, x, y) => sink.bezierCurveTo(x1 + dx, y1 + dy, x2 + dx, y2 + dy, x + dx, y + dy),
		quadraticCurveTo: (x1, y1, x, y) => sink.quadraticCurveTo(x1 + dx, y1 + dy, x + dx, y + dy)
	};
}

// Path ops drawn once at each offset, each copy starting its own subpaths
function copiesPath(ops: Array<IPathOp>, copies: Array<IPoint>, precision: number): string {
	let d = "";
	$array.each(copies, (copy) => {
		const sink = new SvgPathSink(precision);
		const moved = offsetSink(sink, copy.x, copy.y);
		$array.each(ops, (op) => {
			op.path(moved);
		});
		d += sink.d;
	});
	return d;
}

/**
 * A pattern fill as shapes, for design tools, which ignore `<pattern>`: the
 * tile's paths, repeated over the shape and clipped to it. Within one path the
 * copies' overlaps (lines drawn past the tile's edge) do not show twice.
 *
 * @ignore
 */
function writePatternFill(doc: SvgDocument, g: SceneGraphics, d: string, pattern: PatternDef, attrs: string, shadowAttrs: string | undefined, out: Array<string>): void {
	const w = pattern.width;
	const h = pattern.height;
	const bounds = g.getLocalBounds();
	const left = Math.floor(bounds.left / w);
	const top = Math.floor(bounds.top / h);
	const cols = Math.ceil(bounds.right / w) - left;
	const rows = Math.ceil(bounds.bottom / h) - top;

	// Too many tiles to draw one by one, or a tile not repeated both ways: the
	// pattern stays a definition
	if (!(w > 0 && h > 0 && cols > 0 && rows > 0) || cols * rows > 2500 || (pattern.repetition && pattern.repetition != "repeat")) {
		out.push("<path" + (shadowAttrs || attrs) + " d=\"" + d + "\" " + doc.paint("fill", pattern) + "/>");
		return;
	}

	const copies: Array<IPoint> = [];
	for (let i = 0; i < cols; i++) {
		for (let j = 0; j < rows; j++) {
			copies.push({ x: (left + i) * w, y: (top + j) * h });
		}
	}

	const parts: Array<string> = [];
	writeTile(doc, <SceneGraphics>pattern.background, copies, w, h, bounds, parts);
	writeTile(doc, <SceneGraphics>pattern.graphics, copies, w, h, bounds, parts);
	if (parts.length) {
		const clip = doc.defs.id("c", "<clipPath data-name=\"Mask\"><path d=\"" + d + "\"/></clipPath>");
		// A shadow goes outside the clip, which would cut it off
		if (shadowAttrs) {
			out.push("<g" + shadowAttrs + "><g clip-path=\"url(#" + clip + ")\" data-name=\"Pattern\">" + parts.join("") + "</g></g>");
		} else {
			out.push("<g" + attrs + " clip-path=\"url(#" + clip + ")\" data-name=\"Pattern\">" + parts.join("") + "</g>");
		}
	}
}

/**
 * Where a pattern tile is drawn.
 *
 * @ignore
 */
interface ITileCopies {
	// Offsets in the tile's own space, so its transform stays as it is
	copies: Array<IPoint>;

	// Copies cut where they reach past the tile's edges, as canvas does, or past
	// the shape: offsets in the shape's space, the tile's size and transform,
	// and the shape's bounds
	clip?: { copies: Array<IPoint>, width: number, height: number, matrix: Matrix, bounds: IBounds };
}

type IPathOp = { path(sink: IPathSink): void };

// A tile's graphics at each copy's offset. Nothing reaches past the shape, not
// even hidden by its mask: a design tool would still select it there
function writeTile(doc: SvgDocument, tile: SceneGraphics, copies: Array<IPoint>, width: number, height: number, bounds: IBounds, out: Array<string>): void {
	if (!tile.visible) {
		return;
	}
	tile._setMatrix();
	const m = tile._matrix;
	const det = m.a * m.d - m.b * m.c;
	if (!det) {
		return;
	}
	const local = (list: Array<IPoint>) => list.map((copy) => ({ x: (m.d * copy.x - m.c * copy.y) / det, y: (m.a * copy.y - m.b * copy.x) / det }));

	// The tile's graphics in its own box
	const b = tile.getContentBounds();
	let left = Infinity;
	let top = Infinity;
	let right = -Infinity;
	let bottom = -Infinity;
	$array.each([{ x: b.left, y: b.top }, { x: b.right, y: b.top }, { x: b.right, y: b.bottom }, { x: b.left, y: b.bottom }], (p) => {
		const x = m.a * p.x + m.c * p.y + m.tx;
		const y = m.b * p.x + m.d * p.y + m.ty;
		left = Math.min(left, x);
		top = Math.min(top, y);
		right = Math.max(right, x);
		bottom = Math.max(bottom, y);
	});
	const e = 0.01;

	// Graphics past the tile's edges (lines drawn long, a rotation) are cut in
	// every copy; others only in copies at the shape's edges. Copies inside keep
	// their exact curves
	const bleeds = left < -e || top < -e || right > width + e || bottom > height + e;
	const inner: Array<IPoint> = [];
	const edge: Array<IPoint> = [];
	$array.each(copies, (copy) => {
		const inside = !bleeds && copy.x + left >= bounds.left - e && copy.y + top >= bounds.top - e && copy.x + right <= bounds.right + e && copy.y + bottom <= bounds.bottom + e;
		(inside ? inner : edge).push(copy);
	});

	const alpha = tile.compoundAlpha * tile.alpha;
	if (inner.length) {
		writeGraphics(doc, tile, alpha, tile.filter, out, { copies: local(inner) });
	}
	if (edge.length) {
		writeGraphics(doc, tile, alpha, tile.filter, out, { copies: local(edge), clip: { copies: edge, width, height, matrix: m, bounds } });
	}
}

// Path ops as points, curves in short segments, for cutting
class PolySink implements IPathSink {
	public paths: Array<{ points: Array<IPoint>, closed: boolean }> = [];
	protected _path: { points: Array<IPoint>, closed: boolean } | undefined;
	protected _x = 0;
	protected _y = 0;
	protected _restart: IPoint | undefined;

	public moveTo(x: number, y: number): void {
		if (!isFinite(x) || !isFinite(y)) {
			return;
		}
		this._path = { points: [{ x, y }], closed: false };
		this.paths.push(this._path);
		this._x = x;
		this._y = y;
		this._restart = undefined;
	}

	public lineTo(x: number, y: number): void {
		if (!isFinite(x) || !isFinite(y)) {
			return;
		}
		if (!this._path) {
			// After closePath a path goes on from the closed one's start
			const start = this._restart || { x, y };
			this.moveTo(start.x, start.y);
		}
		this._path!.points.push({ x, y });
		this._x = x;
		this._y = y;
	}

	public closePath(): void {
		if (this._path) {
			this._path.closed = true;
			this._restart = this._path.points[0];
			this._path = undefined;
		}
	}

	public rect(x: number, y: number, width: number, height: number): void {
		this.moveTo(x, y);
		this.lineTo(x + width, y);
		this.lineTo(x + width, y + height);
		this.lineTo(x, y + height);
		this.closePath();
	}

	public arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
		this.ellipse(cx, cy, radius, radius, 0, startAngle, endAngle, anticlockwise);
	}

	public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
		// The sweep as canvas takes it
		const full = Math.PI * 2;
		let sweep = endAngle - startAngle;
		if (!anticlockwise) {
			sweep = sweep >= full ? full : ((sweep % full) + full) % full;
		} else {
			sweep = sweep <= -full ? -full : -((((-sweep) % full) + full) % full);
		}
		const steps = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 16)));
		const cos = Math.cos(rotation);
		const sin = Math.sin(rotation);
		for (let i = 0; i <= steps; i++) {
			const a = startAngle + sweep * i / steps;
			const px = radiusX * Math.cos(a);
			const py = radiusY * Math.sin(a);
			const pointX = x + px * cos - py * sin;
			const pointY = y + px * sin + py * cos;
			if (i == 0 && !this._path && !this._restart) {
				this.moveTo(pointX, pointY);
			} else {
				this.lineTo(pointX, pointY);
			}
		}
	}

	public arcTo(x1: number, y1: number, _x2: number, _y2: number, _radius: number): void {
		// Not used by patterns: the corner without its rounding
		this.lineTo(x1, y1);
	}

	public bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): void {
		const x0 = this._x;
		const y0 = this._y;
		for (let i = 1; i <= 16; i++) {
			const t = i / 16;
			const u = 1 - t;
			this.lineTo(u * u * u * x0 + 3 * u * u * t * cpX + 3 * u * t * t * cpX2 + t * t * t * toX, u * u * u * y0 + 3 * u * u * t * cpY + 3 * u * t * t * cpY2 + t * t * t * toY);
		}
	}

	public quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): void {
		const x0 = this._x;
		const y0 = this._y;
		for (let i = 1; i <= 12; i++) {
			const t = i / 12;
			const u = 1 - t;
			this.lineTo(u * u * x0 + 2 * u * t * cpX + t * t * toX, u * u * y0 + 2 * u * t * cpY + t * t * toY);
		}
	}
}

type IClipEdge = [(p: IPoint) => boolean, (a: IPoint, b: IPoint) => IPoint];

// A polygon cut to a rectangle (Sutherland-Hodgman)
function clipPolygon(points: Array<IPoint>, left: number, top: number, right: number, bottom: number): Array<IPoint> {
	const edges: Array<IClipEdge> = [
		[(p) => p.x >= left, (a, b) => ({ x: left, y: a.y + (b.y - a.y) * (left - a.x) / (b.x - a.x) })],
		[(p) => p.x <= right, (a, b) => ({ x: right, y: a.y + (b.y - a.y) * (right - a.x) / (b.x - a.x) })],
		[(p) => p.y >= top, (a, b) => ({ x: a.x + (b.x - a.x) * (top - a.y) / (b.y - a.y), y: top })],
		[(p) => p.y <= bottom, (a, b) => ({ x: a.x + (b.x - a.x) * (bottom - a.y) / (b.y - a.y), y: bottom })]
	];
	let result = points;
	$array.each(edges, (edge) => {
		const inside = edge[0];
		const cross = edge[1];
		const input = result;
		result = [];
		$array.each(input, (current, i) => {
			const previous = input[(i + input.length - 1) % input.length];
			if (inside(current)) {
				if (!inside(previous)) {
					result.push(cross(previous, current));
				}
				result.push(current);
			} else if (inside(previous)) {
				result.push(cross(previous, current));
			}
		});
	});
	return result;
}

// The parts of a polyline inside a rectangle (Liang-Barsky), as polylines
function clipPolyline(points: Array<IPoint>, left: number, top: number, right: number, bottom: number): Array<Array<IPoint>> {
	const lines: Array<Array<IPoint>> = [];
	let line: Array<IPoint> | undefined;
	for (let i = 1; i < points.length; i++) {
		const a = points[i - 1];
		const b = points[i];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		let t0 = 0;
		let t1 = 1;
		let visible = true;
		$array.each([[-dx, a.x - left], [dx, right - a.x], [-dy, a.y - top], [dy, bottom - a.y]], (edge) => {
			const p = edge[0];
			const q = edge[1];
			if (p == 0) {
				if (q < 0) {
					visible = false;
				}
			} else {
				const t = q / p;
				if (p < 0) {
					t0 = Math.max(t0, t);
				} else {
					t1 = Math.min(t1, t);
				}
			}
		});
		if (!visible || t0 > t1) {
			line = undefined;
			continue;
		}
		const start = { x: a.x + dx * t0, y: a.y + dy * t0 };
		const end = { x: a.x + dx * t1, y: a.y + dy * t1 };
		if (!line || t0 > 0) {
			line = [start];
			lines.push(line);
		}
		line.push(end);
		if (t1 < 1) {
			line = undefined;
		}
	}
	// A piece of no length would show as a dot with round caps
	return lines.filter((points) => $array.any(points, (p) => p.x != points[0].x || p.y != points[0].y));
}

// A polyline as its dashes, as canvas strokes it: the dash list starts at the
// polyline's start, moved by `offset`, and an odd list is used twice
function dashPolyline(points: Array<IPoint>, dash: Array<number>, offset: number): Array<Array<IPoint>> {
	const pattern = dash.length % 2 ? dash.concat(dash) : dash;
	let total = 0;
	$array.each(pattern, (x) => {
		total += x;
	});
	if (!(total > 0) || points.length < 2) {
		return [points];
	}

	let index = 0;
	let into = ((offset % total) + total) % total;
	while (into >= pattern[index]) {
		into -= pattern[index];
		index = (index + 1) % pattern.length;
	}
	let remaining = pattern[index] - into;
	let on = index % 2 == 0;

	const pieces: Array<Array<IPoint>> = [];
	let piece: Array<IPoint> | undefined = on ? [points[0]] : undefined;
	for (let i = 1; i < points.length; i++) {
		const a = points[i - 1];
		const b = points[i];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const length = Math.sqrt(dx * dx + dy * dy);
		let t = 0;
		while (length - t > remaining) {
			t += remaining;
			const p = { x: a.x + dx * t / length, y: a.y + dy * t / length };
			if (on) {
				piece!.push(p);
				pieces.push(piece!);
				piece = undefined;
			} else {
				piece = [p];
			}
			on = !on;
			index = (index + 1) % pattern.length;
			remaining = pattern[index];
		}
		remaining -= length - t;
		if (on) {
			piece!.push(b);
		}
	}
	if (on && piece && piece.length > 1) {
		pieces.push(piece);
	}
	return pieces;
}

// Path data of tile copies cut at the tile's edges, in the shape's space
function clippedTilesPath(doc: SvgDocument, ops: Array<IPathOp>, tiles: ITileCopies, kind: "fill" | "stroke", dash: Array<number>, dashOffset: number): string {
	const clip = tiles.clip!;
	const m = clip.matrix;
	const sink = new PolySink();
	$array.each(ops, (op) => {
		op.path(sink);
	});

	// A stroke's dashes, in the tile's own space, as canvas draws them before the tile cuts them
	const strokes = kind == "stroke" ? sink.paths.map((path) => {
		const points = path.closed && path.points.length > 1 ? path.points.concat([path.points[0]]) : path.points;
		return dash.length ? dashPolyline(points, dash, dashOffset) : [points];
	}) : [];
	let d = "";
	$array.each(clip.copies, (copy) => {
		// The copy's tile, within the shape
		const left = Math.max(copy.x, clip.bounds.left);
		const top = Math.max(copy.y, clip.bounds.top);
		const right = Math.min(copy.x + clip.width, clip.bounds.right);
		const bottom = Math.min(copy.y + clip.height, clip.bounds.bottom);
		if (right <= left || bottom <= top) {
			return;
		}
		const place = (points: Array<IPoint>) => points.map((p) => ({ x: m.a * p.x + m.c * p.y + m.tx + copy.x, y: m.b * p.x + m.d * p.y + m.ty + copy.y }));
		if (kind == "fill") {
			$array.each(sink.paths, (path) => {
				const polygon = clipPolygon(place(path.points), left, top, right, bottom);
				// A shape cut down to a line along the edge has no area left
				let area = 0;
				$array.each(polygon, (p, i) => {
					const q = polygon[(i + 1) % polygon.length];
					area += p.x * q.y - q.x * p.y;
				});
				if (polygon.length > 2 && Math.abs(area) > 1e-6) {
					d += "M" + polygon.map((p) => doc.n(p.x) + " " + doc.n(p.y)).join("L") + "Z";
				}
			});
		} else {
			$array.each(strokes, (pieces) => {
				$array.each(pieces, (piece) => {
					$array.each(clipPolyline(place(piece), left, top, right, bottom), (line) => {
						d += "M" + line.map((p) => doc.n(p.x) + " " + doc.n(p.y)).join("L");
					});
				});
			});
		}
	});
	return d;
}

/**
 * A pattern tile's graphics: not in the tree, drawn with their own transform.
 *
 * @ignore
 */
function writeDetached(doc: SvgDocument, g: SceneGraphics, out: Array<string>): void {
	if (g.visible) {
		g._setMatrix();
		writeGraphics(doc, g, g.compoundAlpha * g.alpha, g.filter, out);
	}
}

/**
 * @ignore
 */
function textAnchor(align: string | undefined, rtl: boolean): string | undefined {
	switch (align) {
		case "center":
			return "middle";
		case "end":
			return "end";
		case "left":
			return rtl ? "end" : undefined;
		case "right":
			return rtl ? undefined : "end";
	}
	return undefined;
}

/**
 * @ignore
 */
function dominantBaseline(baseline: string | undefined): string | undefined {
	switch (baseline) {
		case "top":
			return "text-before-edge";
		case "hanging":
			return "hanging";
		case "middle":
			return "central";
		case "ideographic":
			return "ideographic";
		case "bottom":
			return "text-after-edge";
	}
	return undefined;
}

/**
 * @ignore
 */
function writeText(doc: SvgDocument, text: SceneText, alpha: number, filter: string | undefined, out: Array<string>): void {
	if (doc.live && !text._textInfo) {
		text._renderer._measureText(text);
	}

	const lines = text._textInfo;
	if (!text.textVisible || !lines) {
		return;
	}

	const style = text.style;
	const baseFont = getFontStyle(style, undefined, false, () => getComputedStyle(text._renderer.view).getPropertyValue("font-family"));
	const rtl = style.direction == "rtl";

	let baseFill: string;
	if (style.fill instanceof Color) {
		baseFill = doc.color("fill", style.fill.toCSS(style.fillOpacity != undefined ? style.fillOpacity : 1));
	} else if (style.fill && isPaint(style.fill)) {
		baseFill = doc.paint("fill", style.fill);
	} else {
		// Canvas ignores a paint it cannot use and keeps black
		baseFill = "fill=\"#000\"";
	}

	let shadowId: string | undefined;
	if (style.shadowColor) {
		shadowId = doc.shadow(style.shadowColor.toCSS(style.shadowOpacity != undefined ? style.shadowOpacity : 1), style.shadowBlur || 0, style.shadowOffsetX || 0, style.shadowOffsetY || 0, text._matrix, text.getLocalBounds());
	}

	if (text instanceof SceneRadialText && text.textType == "circular") {
		// Exported text was put in drawing order when the canvas painted it
		const inward = doc.live ? text._orient() : text._inward();
		writeCircularText(doc, text, inward, baseFont, baseFill, alpha, filter, shadowId, out);
		return;
	}

	let attrs = leafAttrs(doc, text, alpha, filter, shadowId);
	const anchor = textAnchor(style.textAlign, rtl);
	if (anchor) {
		attrs += " text-anchor=\"" + anchor + "\"";
	}
	const baseline = dominantBaseline(style.textBaseline);
	if (baseline && doc.live) {
		attrs += " dominant-baseline=\"" + baseline + "\"";
	}
	if (rtl) {
		attrs += " direction=\"rtl\"";
	}

	const parts: Array<string> = [];
	$array.each(lines, (line) => {
		$array.each(line.textChunks, (chunk) => {
			const font = textFont(doc, text, chunk.style || baseFont);
			const fill = chunk.fill ? doc.color("fill", chunk.fill.toCSS()) : baseFill;
			const x = chunk.offsetX;
			const y = line.offsetY + chunk.offsetY;

			// Canvas draws nothing at a non-finite position
			if (!isFinite(x) || !isFinite(y)) {
				return;
			}
			if (chunk.text !== "") {
				const textY = baseline && !doc.live ? y + textShift(doc, text, font, style.textBaseline!) : y;
				parts.push("<text x=\"" + doc.n(x) + "\" y=\"" + doc.n(textY) + "\" " + fill + " " + fontAttrs(doc, font) + ">" + escapeXML(chunk.text) + "</text>");
			}

			// Decorations are drawn as lines, like the canvas renderer does
			if (chunk.textDecoration == "underline" || chunk.textDecoration == "line-through") {
				let thickness = 1;
				let offset = 1;
				const fontSize = chunk.height;

				let offsetX = chunk.offsetX;
				switch (style.textAlign) {
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

				let ly: number;
				if (chunk.textDecoration == "line-through") {
					ly = thickness + line.offsetY + chunk.offsetY - chunk.height / 2;
				}
				else {
					ly = thickness + offset * 1.5 + line.offsetY + chunk.offsetY;
				}
				ly = Math.floor(ly) + .5;
				if (!isFinite(ly) || !isFinite(offsetX) || !isFinite(chunk.width)) {
					return;
				}

				let lineColor = "stroke=\"#000\"";
				if (chunk.fill) {
					lineColor = doc.color("stroke", chunk.fill.toCSS());
				} else if (style.fill instanceof Color) {
					lineColor = doc.color("stroke", style.fill.toCSS());
				}
				parts.push("<path d=\"M" + doc.n(offsetX) + " " + doc.n(ly) + "L" + doc.n(offsetX + chunk.width) + " " + doc.n(ly) + "\" fill=\"none\" " + lineColor + " stroke-width=\"" + doc.n(thickness * offset) + "\"/>");
			}
		});
	});

	// One text takes the attributes itself: a group around it is one more layer in a design tool
	if (parts.length == 1 && !doc.live && /^<text /.test(parts[0]) && attrs.indexOf(" style=") == -1) {
		out.push("<text" + attrs + parts[0].slice(5));
	} else if (parts.length) {
		out.push("<g" + attrs + ">" + parts.join("") + "</g>");
	}
}

// A standalone document has no page to resolve relative font sizes against
function textFont(doc: SvgDocument, text: SceneText, font: string): string {
	if (doc.live) {
		return font;
	}
	let resolved = doc._fonts.get(font);
	if (resolved === undefined) {
		resolved = resolveFont(text._renderer._textContext(text), font);
		doc._fonts.set(font, resolved);
	}
	return resolved;
}

// Design tools ignore dominant-baseline, so a document moves the text instead
function textShift(doc: SvgDocument, text: SceneText, font: string, baseline: CanvasTextBaseline): number {
	const key = baseline + " " + font;
	let shift = doc._shifts.get(key);
	if (shift === undefined) {
		shift = baselineShift(text._renderer._textContext(text), font, baseline);
		doc._shifts.set(key, shift);
	}
	return shift;
}

const FONT_SIZE = /^(.*?)\s*(\d*\.?\d+(?:px|pt|pc|in|cm|mm|q|r?em|%|ex|ch|v[wh]))(?:\/\S+)?\s+(.+)$/i;

// A live chart writes the font as CSS; a document as attributes, the only form design tools read
function fontAttrs(doc: SvgDocument, font: string): string {
	const match = doc.live ? null : FONT_SIZE.exec(font.trim());
	if (!match) {
		return "style=\"font:" + escapeXML(font) + ";white-space:pre\"";
	}
	let attrs = "font-family=\"" + escapeXML(match[3]) + "\" font-size=\"" + escapeXML(match[2]) + "\"";
	$array.each(match[1].split(/\s+/), (token) => {
		if (/^(bold|bolder|lighter|\d{3})$/i.test(token)) {
			attrs += " font-weight=\"" + token + "\"";
		} else if (/^(italic|oblique)$/i.test(token)) {
			attrs += " font-style=\"" + token + "\"";
		} else if (/^small-caps$/i.test(token)) {
			attrs += " font-variant=\"" + token + "\"";
		}
	});
	return attrs + " style=\"white-space:pre\"";
}

/**
 * Circular text, glyph by glyph, with the angles the canvas renderer uses.
 * Lines and glyphs are drawn in their stored order, which `_orient()` has
 * already reversed where needed.
 *
 * @ignore
 */
function writeCircularText(doc: SvgDocument, text: SceneRadialText, inward: boolean, baseFont: string, baseFill: string, alpha: number, filter: string | undefined, shadowId: string | undefined, out: Array<string>): void {
	const parts: Array<string> = [];
	text._eachGlyph(inward, (chunk, angle, y) => {
		// Canvas draws nothing at a non-finite position
		if (!isFinite(y)) {
			return;
		}
		const font = textFont(doc, text, chunk.style || baseFont);
		const fill = chunk.fill ? doc.color("fill", chunk.fill.toCSS()) : baseFill;
		const baseline = doc.live ? " dominant-baseline=\"central\"" : "";
		const glyphY = doc.live ? y : y + textShift(doc, text, font, "middle");
		parts.push("<text transform=\"rotate(" + doc.n(angle * $math.DEGREES) + ")\" x=\"0\" y=\"" + doc.n(glyphY) + "\" text-anchor=\"middle\"" + baseline + " " + fill + " " + fontAttrs(doc, font) + ">" + escapeXML(chunk.text) + "</text>");
	});

	if (parts.length) {
		out.push("<g" + leafAttrs(doc, text, alpha, filter, shadowId) + ">" + parts.join("") + "</g>");
	}
}

/**
 * @ignore
 */
function writeImage(doc: SvgDocument, image: SceneImage, alpha: number, filter: string | undefined, out: Array<string>): void {
	const img = image.image;
	if (!img || (image.tainted && !doc.live)) {
		return;
	}
	const width = image.width || img.naturalWidth;
	const height = image.height || img.naturalHeight;
	if (!isFinite(width) || !isFinite(height)) {
		return;
	}
	let shadowId: string | undefined;
	if (image.shadowColor) {
		shadowId = doc.shadow(image.shadowColor.toCSS(image.shadowOpacity != undefined ? image.shadowOpacity : 1), image.shadowBlur || 0, image.shadowOffsetX || 0, image.shadowOffsetY || 0, image._matrix, { left: 0, top: 0, right: width, bottom: height });
	}
	out.push("<image" + leafAttrs(doc, image, alpha, filter, shadowId) + " width=\"" + doc.n(width) + "\" height=\"" + doc.n(height) + "\" " + doc.href + "=\"" + escapeXML(img.src) + "\" preserveAspectRatio=\"none\"/>");
}

/**
 * A node's own markup.
 *
 * @ignore
 */
export interface ISvgLeaf {
	node: SceneNode;
	markup: string;
}

/**
 * What a node's mask clips: `<g clip-path>` around `items`.
 *
 * @ignore
 */
export interface ISvgClip {
	node: SceneNode;
	clip: string;
	items: Array<ISvgItem>;
}

/**
 * @ignore
 */
export type ISvgItem = ISvgLeaf | ISvgClip;

/**
 * Writes the part of the tree that belongs to `layer`, with masks as clip
 * paths around it. Mirrors the canvas renderer: alpha multiplies down the
 * tree, a filter applies until a descendant sets its own.
 *
 * @ignore
 */
function writeNode(doc: SvgDocument, node: SceneNode, layer: ILayer, nodeLayer: ILayer, alpha: number, filter: string | undefined, out: Array<ISvgItem>): void {
	if (!node.visible || (node.exportable === false && !doc.live && !doc.nonExportable)) {
		return;
	}

	node._setMatrix();

	if (node._layer) {
		nodeLayer = node._layer;
	}

	// Canvas ignores a globalAlpha outside 0-1, keeping the parent's
	const nodeAlpha = alpha * node.alpha;
	if (nodeAlpha >= 0 && nodeAlpha <= 1) {
		alpha = nodeAlpha;
	}

	// Fully transparent, it draws nothing; a live chart keeps it, as it may fade in
	if (alpha <= 0 && !doc.live) {
		return;
	}
	if (node.filter) {
		filter = node.filter;
	}

	const inner: Array<ISvgItem> = [];

	if (node instanceof SceneContainer) {
		$array.each(node._children, (child) => {
			writeNode(doc, child, layer, nodeLayer, alpha, filter, inner);
		});

	} else if (nodeLayer === layer && isFinite(node._matrix.tx) && isFinite(node._matrix.ty) && isFinite(node._matrix.a)) {
		const parts: Array<string> = [];

		if (node instanceof SceneGraphics) {
			writeGraphics(doc, node, alpha, filter, parts);

		} else if (node instanceof SceneText) {
			writeText(doc, node, alpha, filter, parts);

		} else if (node instanceof SceneImage) {
			writeImage(doc, node, alpha, filter, parts);
		}

		if (parts.length) {
			inner.push({ node, markup: parts.join("") });
		}
	}

	// A document names the layers it can, for design tools
	const name = doc.live ? undefined : node.exportName;
	if (name && inner.length) {
		let items = inner;
		if (node.mask) {
			node.mask._setMatrix();
			items = [{ node, clip: doc.clip(node.mask), items: inner }];
		}
		out.push({ node, markup: namedMarkup(itemsMarkup(items), name) });
		return;
	}

	if (inner.length) {
		const mask = node.mask;
		if (mask) {
			mask._setMatrix();
			out.push({ node, clip: doc.clip(mask), items: inner });

		} else {
			$array.each(inner, (item) => {
				out.push(item);
			});
		}
	}
}

// The name on `markup`'s one element, or a group named `name` around it
function namedMarkup(markup: string, name: string): string {
	const attr = " data-name=\"" + escapeXML(name) + "\"";
	let depth = 0;
	let elements = 0;
	const tag = /<(\/?)[a-zA-Z][^>]*?(\/?)>/g;
	let match: RegExpExecArray | null;
	while ((match = tag.exec(markup))) {
		if (match[1]) {
			depth--;
		} else if (match[2]) {
			if (depth == 0) {
				elements++;
			}
		} else {
			if (depth == 0) {
				elements++;
			}
			depth++;
		}
	}
	// An element with a name of its own keeps it, inside a group
	if (elements == 1 && !/^<[^>]* data-name="/.test(markup)) {
		return markup.replace(/^<([a-zA-Z][\w:-]*)/, (_all: string, tag: string) => "<" + tag + attr);
	}
	return "<g" + attr + ">" + markup + "</g>";
}

/**
 * The part of the tree that paints on `layer`: node markup, grouped by the
 * masks that clip it. Defs it references are marked used in `doc.defs`.
 *
 * @ignore
 */
export function writeLayer(doc: SvgDocument, root: SceneNode, layer: ILayer, defaultLayer: ILayer, alpha: number = 1): Array<ISvgItem> {
	const out: Array<ISvgItem> = [];
	writeNode(doc, root, layer, defaultLayer, alpha, undefined, out);
	return out;
}

/**
 * @ignore
 */
export function clipGroup(clip: string): string {
	return "url(#" + clip + ")";
}

/**
 * Layer items as markup.
 *
 * @ignore
 */
export function itemsMarkup(items: Array<ISvgItem>): string {
	return items.map((item) => {
		return "items" in item
			? "<g clip-path=\"" + clipGroup(item.clip) + "\">" + itemsMarkup(item.items) + "</g>"
			: item.markup;
	}).join("");
}

/**
 * Attributes of a layer's group. Blend modes mix within their own layer, as
 * on a separate canvas.
 *
 * @ignore
 */
export function layerStyle(blend: boolean): string {
	return blend ? "isolation:isolate" : "";
}

/**
 * A chart as an SVG document, whichever renderer draws it. Leaves out what
 * image export leaves out: elements with `exportable: false` and pictures
 * from other domains without CORS. Fully transparent elements, such as hit
 * areas and a hidden logo, are left out too.
 *
 * It is the chart as last drawn: changes made in the same tick appear once
 * the chart has drawn them (e.g. call it from the Root's `frameended` event).
 * Drawing the chart first may fire hover events for the pointer's position.
 *
 * Pass an element, such as a series, to export just that element, where it
 * sits on the chart.
 *
 * ```TypeScript
 * const svg = am5.renderToSVG(root);
 * const pixels = am5.renderToSVG(pixelSeries.pixels);
 * ```
 * ```JavaScript
 * var svg = am5.renderToSVG(root);
 * var pixels = am5.renderToSVG(pixelSeries.pixels);
 * ```
 *
 * @param  target   A `Root`, an element of a chart, or a display object (then `width` and `height` are needed)
 * @param  options  Size, precision, id prefix, title and background
 * @return          SVG markup
 * @see {@link https://docs.amcharts.com/v5/concepts/exporting/exporting-svg/} for more information
 * @since 5.21.0
 */
export function renderToSVG(target: Root | Sprite | IDisplayObject, options: ISvgExportOptions = {}): string {
	let root: SceneNode;
	let width = options.width;
	let height = options.height;
	let title = options.title;

	if (target instanceof SceneNode) {
		root = target;

	} else {
		const chart = "_rootContainer" in target ? <Root>target : (<Sprite>target)._root;
		if (title == null) {
			title = chart.settings.ariaLabel;
		}
		const top = <SceneNode><unknown>chart._rootContainer._display;
		root = "_rootContainer" in target ? top : <SceneNode><unknown>(<Sprite>target)._display;

		// Up to date, including text laid out since the last frame
		chart._renderer.render(top);

		// Layer names for design tools
		("_rootContainer" in target ? (<Root>target)._rootContainer : <Sprite>target)._nameForExport();

		// A hidden chart has no size in the page: keep the one it was laid out at
		if (width == null) {
			width = chart.width() || chart._rootContainer.width();
		}
		if (height == null) {
			height = chart.height() || chart._rootContainer.height();
		}
	}

	const defs = new SvgDefs(options.idPrefix != null ? options.idPrefix : "am5-");
	const doc = new SvgDocument(options.precision != null ? options.precision : 3, defs);
	doc.nonExportable = !!options.includeNonExportable;
	const renderer = <ISceneHost>root._renderer;
	const body: Array<string> = [];

	// An element takes the layer and opacity it inherits on the chart
	const rootLayer = root.getLayer();
	let rootAlpha = 1;
	for (let node = root._parent; node; node = node._parent) {
		if (node.alpha >= 0 && node.alpha <= 1) {
			rootAlpha *= node.alpha;
		}
	}

	// Layers in order, in one group: a layer is a group of its own only where
	// its blend modes have to stay within it
	$array.each(renderer.layers, (layer) => {
		if (layer.visible) {
			doc.blend = false;
			const content = itemsMarkup(writeLayer(doc, root, layer, rootLayer, rootAlpha));
			if (content) {
				body.push(doc.blend ? "<g class=\"am5-layer-" + layer.order + "\" style=\"" + layerStyle(true) + "\">" + content + "</g>" : content);
			}
		}
	});

	const w = doc.n(width || 0);
	const h = doc.n(height || 0);
	const defsMarkup = doc.defsMarkup();
	// One image to screen readers, named by its title, rather than every text in it
	return "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"" + w + "\" height=\"" + h + "\" viewBox=\"0 0 " + w + " " + h + "\" role=\"img\">" +
		(title ? "<title>" + escapeXML(title) + "</title>" : "") +
		(defsMarkup ? "<defs>" + defsMarkup + "</defs>" : "") +
		(options.background ? "<rect width=\"" + w + "\" height=\"" + h + "\" " + doc.color("fill", options.background) + " aria-hidden=\"true\"/>" : "") +
		// Hidden from screen readers: the SVG is read as one image, by its title
		(body.length ? "<g data-name=\"Chart\" aria-hidden=\"true\">" + body.join("") + "</g>" : "") +
		"</svg>";
}
