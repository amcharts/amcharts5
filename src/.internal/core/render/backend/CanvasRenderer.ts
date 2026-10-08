/** @ignore *//** */

import type {
	IRenderer, IMargin, IRendererEvent, ILayer, ICanvasOptions, IPointerEvent, Id
} from "./Renderer";
import type { GraphicsOp, GraphicsPaint } from "../scene/GraphicsData";
import { LinearGradientDef, RadialGradientDef, PatternDef, RasterPatternDef } from "../scene/Paint";
import { measureText, layoutText, layoutCircularText, ignoreFontWeight } from "../scene/TextLayout";
import { InteractionManager } from "../scene/Interaction";
import { SceneNode, SceneContainer, SceneGraphics, SceneText, SceneTextStyle, SceneRadialText, SceneImage, ScenePivot } from "../scene/SceneNode";
import type { IBounds } from "../../util/IBounds";
import type { IPoint } from "../../util/IPoint";
import { Color } from "../../util/Color";
//import { Throttler } from "../../util/Throttler";
import { ArrayDisposer, Disposer, IDisposer } from "../../util/Disposer";
import { TextFormatter } from "../../util/TextFormatter";
import * as $utils from "../../util/Utils";
import * as $array from "../../util/Array";


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
interface IStatus {
	layer: CanvasLayer;
	inactive: boolean | null;

	// Paints nodes that no canvas renderer owns (another backend's scene)
	renderer: CanvasRenderer;
}

/**
 * Native gradients and patterns of paint descriptors.
 *
 * @ignore
 */
const nativePaints: WeakMap<object, CanvasGradient | CanvasPattern> = new WeakMap();

/**
 * A paint as the canvas takes it: CSS colors as they are, descriptors as
 * their native gradient or pattern.
 *
 * @ignore
 */
function toCanvasPaint(context: CanvasRenderingContext2D, paint: GraphicsPaint): string | CanvasGradient | CanvasPattern {
	if (typeof paint === "string") {
		return paint;
	}

	let native = nativePaints.get(paint);
	if (native === undefined) {
		let gradient: CanvasGradient;
		if (paint instanceof LinearGradientDef) {
			gradient = context.createLinearGradient(paint.x1, paint.y1, paint.x2, paint.y2);

		} else if (paint instanceof RadialGradientDef) {
			gradient = context.createRadialGradient(paint.x1, paint.y1, paint.radius1, paint.x2, paint.y2, paint.radius2);

		} else if (paint instanceof PatternDef || paint instanceof RasterPatternDef) {
			// Made by another backend: rasterize the tile now
			const pattern = createNativePattern(context, paint);
			if (!pattern) {
				return <any>paint;
			}
			nativePaints.set(paint, pattern);
			return pattern;

		} else {
			// Already native
			return <CanvasGradient | CanvasPattern>paint;
		}

		$array.each(paint.stops, (stop) => {
			gradient.addColorStop(stop.offset, stop.color);
		});

		native = gradient;
		nativePaints.set(paint, native);
	}

	return native;
}

/**
 * A canvas pattern for a pattern descriptor.
 *
 * @ignore
 */
function createNativePattern(context: CanvasRenderingContext2D, paint: PatternDef | RasterPatternDef): CanvasPattern | null {
	if (paint instanceof RasterPatternDef) {
		return context.createPattern(paint.source, paint.repetition);
	}

	const canvas = document.createElement("canvas");
	canvas.width = paint.width;
	canvas.height = paint.height;
	if (!canvas.width || !canvas.height) {
		return null;
	}

	const tile = canvas.getContext("2d")!;
	renderDetached(<SceneGraphics>paint.background, tile);
	renderDetached(<SceneGraphics>paint.graphics, tile);
	return context.createPattern(canvas, paint.repetition);
}

/**
 * Traces an op's geometry. Images are drawn here too, in op order.
 *
 * @ignore
 */
function tracePath(context: CanvasRenderingContext2D, op: GraphicsOp, ghostColor?: string): void {
	if (op.type === "image") {
		// The ghost takes the image's area in the object's id color, not its pixels
		if (ghostColor !== undefined) {
			context.fillStyle = ghostColor;
			context.fillRect(op.x, op.y, op.width, op.height);

		} else {
			context.drawImage(op.image, op.x, op.y, op.width, op.height);
		}

	} else {
		op.path(context);
	}
}

/**
 * Applies an op's paint state. The ghost canvas paints with `forceColor` and
 * skips shadows.
 *
 * @ignore
 */
function colorize(context: CanvasRenderingContext2D, op: GraphicsOp, forceColor: string | undefined, ghost: boolean): void {
	switch (op.type) {
		case "beginPath":
			context.beginPath();
			break;

		case "beginFill":
			if (forceColor !== undefined) {
				context.fillStyle = forceColor;

			} else {
				context.fillStyle = toCanvasPaint(context, op.color);
			}
			break;

		case "endFill":
			context.fill();
			if (op.clearShadow) {
				context.shadowColor = "";
				context.shadowBlur = 0;
				context.shadowOffsetX = 0;
				context.shadowOffsetY = 0;
			}
			break;

		case "endStroke":
			context.stroke();
			break;

		case "lineStyle":
			if (forceColor !== undefined) {
				context.strokeStyle = forceColor;

			} else {
				context.strokeStyle = toCanvasPaint(context, op.color);
			}

			context.lineWidth = op.width;
			if (op.lineJoin) {
				context.lineJoin = op.lineJoin;
			}

			if (op.lineCap) {
				context.lineCap = op.lineCap;
			}
			break;

		case "lineDash":
			context.setLineDash(op.dash);
			break;

		case "lineDashOffset":
			context.lineDashOffset = op.dashOffset;
			break;

		case "shadow":
			if (!ghost) {
				if (op.opacity) {
					context.fillStyle = op.color;
				}
				context.shadowColor = op.color;
				context.shadowBlur = op.blur;
				context.shadowOffsetX = op.offsetX;
				context.shadowOffsetY = op.offsetY;
			}
			break;
	}
}

// --- Painting the scene --------------------------------------------------
//
// Nodes are painted with the state of the canvas renderer they were made by,
// as before the scene graph was split out of the canvas renderer. Nodes of
// another backend's scene (exported as an image) use the renderer painting
// them, with their layers matched by order.

/**
 * @ignore
 */
function rendererOf(node: SceneNode, status: IStatus): CanvasRenderer {
	const renderer = node._renderer;
	return renderer instanceof CanvasRenderer ? renderer : status.renderer;
}

/**
 * @ignore
 */
function subStatus(node: SceneNode, status: IStatus): IStatus {
	const layer = node._layer;
	return {
		inactive: (node.inactive == null ? status.inactive : node.inactive),
		layer: layer ? (layer instanceof CanvasLayer ? layer : status.renderer.getLayer(layer.order)) : status.layer,
		renderer: status.renderer,
	};
}

/**
 * @ignore
 */
function colorIdOf(node: SceneNode, status: IStatus): string {
	if (node._colorId === undefined) {
		node._colorId = rendererOf(node, status).paintId(node);
	}

	return node._colorId;
}

/**
 * @ignore
 */
function isInteractive(node: SceneNode, status: IStatus): boolean {
	return !status.inactive && (node.interactive || rendererOf(node, status)._forceInteractive > 0);
}

/**
 * @ignore
 */
function isInteractiveMask(node: SceneNode, status: IStatus): boolean {
	return (node instanceof SceneContainer && node.interactiveChildren) || isInteractive(node, status);
}

/**
 * @ignore
 */
function ghostOnly(targetGhostLayer: number = 0): boolean {
	return targetGhostLayer > 0 ? true : false;
}

/**
 * @ignore
 */
function drawGhost(node: SceneNode, status: IStatus, targetGhostLayer: number = 0): boolean {
	const interactive = isInteractive(node, status);
	const order = status.layer.order || 0;
	return interactive && ((order == 0 && !ghostOnly(targetGhostLayer)) || order == targetGhostLayer) ? true : false;
}

/**
 * A layer with non-exportable content is re-rendered for export.
 *
 * @ignore
 */
function markTainted(node: SceneNode, status: IStatus): void {
	if (node.exportable === false) {
		status.layer.tainted = true;
	}
}

/**
 * @ignore
 */
function transform(node: SceneNode, context: CanvasRenderingContext2D, resolution: number): void {
	const m = node._matrix;
	let tx = m.tx * resolution;
	let ty = m.ty * resolution;
	if (node.crisp && node.deform === null) {
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

/**
 * @ignore
 */
function transformMargin(node: SceneNode, context: CanvasRenderingContext2D, resolution: number, margin: IMargin): void {
	const m = node._matrix;
	context.setTransform(
		m.a * resolution,
		m.b * resolution,
		m.c * resolution,
		m.d * resolution,
		(m.tx + margin.left) * resolution,
		(m.ty + margin.top) * resolution
	);
}

/**
 * @ignore
 */
function transformLayer(node: SceneNode, context: CanvasRenderingContext2D, resolution: number, layer: CanvasLayer): void {
	if (layer.margin) {
		transformMargin(node, context, layer.scale || resolution, layer.margin);

	} else {
		transform(node, context, layer.scale || resolution);
	}
}

/**
 * Paints a node and its subtree on every dirty layer and the ghost canvas.
 *
 * @ignore
 */
function renderNode(node: SceneNode, status: IStatus, targetGhostLayer: number = 0): void {
	const renderer = rendererOf(node, status);

	if (node.visible && (node.exportable !== false || !renderer._omitTainted)) {
		node._setMatrix();

		const sub = subStatus(node, status);

		const resolution = renderer.resolution;

		// Only layers being redrawn: state calls on idle canvases leak in Chrome 153
		const layers = renderer._dirtyLayers;
		const ghostLayer = renderer._ghostLayer;
		const ghostContext = ghostLayer.context;

		const mask = node.mask;
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
					transformLayer(mask, context, resolution, layer);
					runPath(mask, context);
					context.clip();
				}

				context.globalAlpha = node.compoundAlpha * node.alpha;

				transformLayer(node, context, resolution, layer);

				if (node.filter) {
					context.filter = node.filter;
				}
			}
		});

		ghostContext.save();

		// We must apply the mask before we transform the element
		if (mask && isInteractiveMask(node, sub)) {
			transformMargin(mask, ghostContext, resolution, ghostLayer.margin);
			runPath(mask, ghostContext);
			ghostContext.clip();
		}

		transformMargin(node, ghostContext, resolution, ghostLayer.margin);
		if ((sub.layer.order > 0) && !targetGhostLayer) {
			$array.move(renderer._deferredGhostLayers, sub.layer.order);
		}
		paintNode(node, sub, targetGhostLayer);

		ghostContext.restore();

		$array.each(layers, (layer) => {
			if (layer) {
				layer.context.restore();
			}
		});
	}
}

/**
 * @ignore
 */
function paintNode(node: SceneNode, status: IStatus, targetGhostLayer: number): void {
	if (node instanceof SceneContainer) {
		paintContainer(node, status, targetGhostLayer);

	} else if (node instanceof SceneGraphics) {
		paintGraphics(node, status, targetGhostLayer);

	} else if (node instanceof SceneRadialText) {
		paintRadialText(node, status, targetGhostLayer);

	} else if (node instanceof SceneText) {
		paintText(node, status, targetGhostLayer);

	} else if (node instanceof SceneImage) {
		paintImage(node, status, targetGhostLayer);

	} else {
		markTainted(node, status);
	}
}

/**
 * @ignore
 */
function paintContainer(node: SceneContainer, status: IStatus, targetGhostLayer: number): void {
	markTainted(node, status);

	const renderer = rendererOf(node, status);

	if (node.interactive && node.interactiveChildren) {
		++renderer._forceInteractive;
	}

	$array.each(node._children, (child) => {
		child.compoundAlpha = node.compoundAlpha * node.alpha;
		renderNode(child, status, targetGhostLayer);
	});

	if (node.interactive && node.interactiveChildren) {
		--renderer._forceInteractive;
	}
}

/**
 * Traces a graphics' path, as a mask for example.
 *
 * @ignore
 */
function runPath(graphics: SceneGraphics, context: CanvasRenderingContext2D): void {
	context.beginPath();

	$array.each(graphics._data.ops, (op) => {
		tracePath(context, op);
	});
}

/**
 * @ignore
 */
function paintGraphics(graphics: SceneGraphics, status: IStatus, targetGhostLayer: number = 0): void {
	markTainted(graphics, status);

	const layerDirty = status.layer.dirty;
	const interactive = isInteractive(graphics, status);
	const onlyGhost = ghostOnly(targetGhostLayer);
	const withGhost = drawGhost(graphics, status, targetGhostLayer);

	if (layerDirty || interactive || onlyGhost) {

		const context = status.layer.context;
		const ghostContext = rendererOf(graphics, status)._ghostLayer.context;

		if (layerDirty && !onlyGhost) {
			context.globalCompositeOperation = graphics.blendMode;
			context.beginPath();
		}

		let color: string | undefined;

		if (withGhost) {
			ghostContext.beginPath();
			color = colorIdOf(graphics, status);
		}

		$array.each(graphics._data.ops, (op) => {
			if (layerDirty && !onlyGhost) {
				tracePath(context, op);
				colorize(context, op, undefined, false);
			}

			if (withGhost) {
				tracePath(ghostContext, op, color);
				colorize(ghostContext, op, color, true);
			}
		});
	}
}

/**
 * A pattern tile's transform, scaled per axis to the tile's pixel size.
 *
 * @ignore
 */
function transformDetached(node: SceneNode, context: CanvasRenderingContext2D, scaleX: number, scaleY: number): void {
	if (scaleX === scaleY) {
		transform(node, context, scaleX);

	} else {
		const m = node._matrix;
		let tx = m.tx * scaleX;
		let ty = m.ty * scaleY;
		if (node.crisp && node.deform === null) {
			tx = crisp(tx);
			ty = crisp(ty);
		}
		context.setTransform(m.a * scaleX, m.b * scaleY, m.c * scaleX, m.d * scaleY, tx, ty);
	}
}

/**
 * Paints graphics outside the tree, e.g. a pattern tile.
 *
 * @ignore
 */
function renderDetached(graphics: SceneGraphics, context: CanvasRenderingContext2D, scaleX: number = 1, scaleY: number = scaleX): void {
	if (graphics.visible) {
		graphics._setMatrix();

		context.save();

		// We must apply the mask before we transform the element
		const mask = graphics.mask;
		if (mask) {
			mask._setMatrix();
			transformDetached(mask, context, scaleX, scaleY);
			runPath(mask, context);
			context.clip();
		}

		// TODO handle compoundAlpha somehow ?
		context.globalAlpha = graphics.compoundAlpha * graphics.alpha;

		transformDetached(graphics, context, scaleX, scaleY);

		if (graphics.filter) {
			context.filter = graphics.filter;
		}

		context.globalCompositeOperation = graphics.blendMode;

		context.beginPath();

		$array.each(graphics._data.ops, (op) => {
			tracePath(context, op);
			colorize(context, op, undefined, false);
		});

		context.restore();
	}
}

/**
 * @ignore
 */
function sharedTextState(text: SceneText, context: CanvasRenderingContext2D) {
	if (text.style.textAlign) {
		context.textAlign = text.style.textAlign;
	}

	if (text.style.direction) {
		context.direction = text.style.direction;
	}

	if (text.style.textBaseline) {
		context.textBaseline = text.style.textBaseline;
	}

}

/**
 * Sets the text's font and paint on the layer (and ghost) context.
 *
 * @ignore
 */
function prerenderText(text: SceneText, status: IStatus, ignoreGhost = false, ignoreFontWeight = false, ignoreLayer = false): void {
	markTainted(text, status);

	const context = status.layer.context;
	const ghostContext = rendererOf(text, status)._ghostLayer.context;

	// Font style

	const style = text.style;
	let fontStyle = text._getFontStyle(undefined, ignoreFontWeight);

	if (!ignoreLayer) {
		context.font = fontStyle;

		// Other parameters
		if (style.fill) {
			if (style.fill instanceof Color) {
				context.fillStyle = style.fill.toCSS(style.fillOpacity != undefined ? style.fillOpacity : 1);
			} else {
				context.fillStyle = toCanvasPaint(context, style.fill);
			}
		}

		if (style.shadowColor) {
			context.shadowColor = style.shadowColor.toCSS(style.shadowOpacity != undefined ? style.shadowOpacity : 1);
		}
		if (style.shadowBlur) {
			context.shadowBlur = style.shadowBlur;
		}
		if (style.shadowOffsetX) {
			context.shadowOffsetX = style.shadowOffsetX;
		}
		if (style.shadowOffsetY) {
			context.shadowOffsetY = style.shadowOffsetY;
		}

		sharedTextState(text, context);
	}

	if (isInteractive(text, status) && !ignoreGhost) {
		ghostContext.font = fontStyle;
	}

	if (isInteractive(text, status) && !ignoreGhost) {
		ghostContext.fillStyle = colorIdOf(text, status);
		sharedTextState(text, ghostContext);
	}
}

/**
 * Lays text out with the layer's context, which resolves relative font sizes
 * like the drawing does.
 *
 * @ignore
 */
function measureTextNode(text: SceneText, status: IStatus): IBounds {
	if (text instanceof SceneRadialText && text.textType == "circular") {
		return measureCircularText(text, status);
	}

	const context = status.layer.context;
	const ghostContext = rendererOf(text, status)._ghostLayer.context;

	// Pre-render
	context.save();
	ghostContext.save();
	prerenderText(text, status, true, ignoreFontWeight());

	const state = text._layoutState();
	const bounds = layoutText(context, text.text, text.style, (format) => text._getFontStyle(format), state);
	text._applyLayoutState(state);

	context.restore();
	ghostContext.restore();

	return bounds;
}

/**
 * @ignore
 */
function measureCircularText(text: SceneRadialText, status: IStatus): IBounds {
	const context = status.layer.context;
	const ghostContext = rendererOf(text, status)._ghostLayer.context;

	text._textReversed = false;

	// Pre-render
	context.save();
	ghostContext.save();
	prerenderText(text, status, true);

	const state = text._layoutState();
	const bounds = layoutCircularText(context, text.text, text.style, (format) => text._getFontStyle(format), state);
	text._applyLayoutState(state);

	context.restore();
	ghostContext.restore();

	return bounds;
}

/**
 * @ignore
 */
function paintText(text: SceneText, status: IStatus, targetGhostLayer: number = 0): void {
	// We need measurements in order to properly position text for alignment
	if (!text._textInfo) {
		measureTextNode(text, status);
	}

	if (text.textVisible) {

		const interactive = isInteractive(text, status);
		const context = status.layer.context;
		const layerDirty = status.layer.dirty;
		const ghostContext = rendererOf(text, status)._ghostLayer.context;

		const onlyGhost = ghostOnly(targetGhostLayer);
		const withGhost = drawGhost(text, status, targetGhostLayer);

		// Layer context is touched only when it is redrawn: state calls on idle canvases leak in Chrome 153
		const drawLayer = layerDirty && !onlyGhost;

		// Nothing to draw
		if (!drawLayer && !(text.interactive && withGhost)) {
			return;
		}

		if (drawLayer) {
			context.save();
		}
		ghostContext.save();
		prerenderText(text, status, false, false, !drawLayer);

		// Process text info produced by the layout
		$array.each(text._textInfo!, (line, _index) => {
			$array.each(line.textChunks, (chunk, _index) => {

				// Set style
				if (chunk.style) {
					if (drawLayer) {
						context.save();
						context.font = chunk.style;
					}

					ghostContext.save();
					if (isInteractive(text, status)) {
						ghostContext.font = chunk.style;
					}
				}

				if (chunk.fill && drawLayer) {
					context.save();
					context.fillStyle = chunk.fill.toCSS();
					// Color does not affect ghostContext so we not set it
				}

				// Draw text
				if (drawLayer) {
					context.fillText(chunk.text, chunk.offsetX, line.offsetY + chunk.offsetY);
				}

				// Draw underline
				if (drawLayer && (chunk.textDecoration == "underline" || chunk.textDecoration == "line-through")) {

					let thickness = 1;
					let offset = 1;
					let fontSize = chunk.height;

					const oversizedBehavior = text.style.oversizedBehavior || "";
					if (["truncate", "wrap", "wrap-no-break"].indexOf(oversizedBehavior) > -1) {
						// Measure actual width of the text so the line fits
						const metrics = measureText(chunk.text, context, text.style);
						chunk.width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
					}

					let offsetX = chunk.offsetX;
					switch (text.style.textAlign) {
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

					y = crisp(y);

					context.save();
					context.beginPath();
					if (chunk.fill) {
						context.strokeStyle = chunk.fill.toCSS();
					}
					else if (text.style.fill && text.style.fill instanceof Color) {
						context.strokeStyle = text.style.fill.toCSS();
					}
					context.lineWidth = thickness * offset;
					context.moveTo(offsetX, y);
					context.lineTo(offsetX + chunk.width, y);
					context.stroke();
					context.restore();
				}

				if (interactive && text.interactive && withGhost) {
					// Draw text in ghost canvas ONLY if it is set as interactive
					// explicitly. This way we avoid hit test anomalies caused by anti
					// aliasing of text.
					ghostContext.fillText(chunk.text, chunk.offsetX, line.offsetY + chunk.offsetY);
				}

				if (chunk.fill && drawLayer) {
					context.restore();
					// Color does not affect ghostContext so we not set it
				}

				// Reset style
				if (chunk.style) {
					if (drawLayer) {
						context.restore();
					}
					ghostContext.restore();
				}

			});
		});

		if (drawLayer) {
			context.restore();
		}
		ghostContext.restore();
	}
}

/**
 * @ignore
 */
function paintRadialText(text: SceneRadialText, status: IStatus, targetGhostLayer: number = 0): void {
	switch (text.textType) {
		case "circular":
			paintCircularText(text, status, targetGhostLayer);
			break;
		default:
			paintText(text, status, targetGhostLayer);
			break;
	}
}

/**
 * @ignore
 */
function paintCircularText(text: SceneRadialText, status: IStatus, targetGhostLayer: number = 0): void {
	if (text.textVisible) {
		const interactive = isInteractive(text, status);
		const context = status.layer.context;
		const layerDirty = status.layer.dirty;
		const ghostContext = rendererOf(text, status)._ghostLayer.context;

		const onlyGhost = ghostOnly(targetGhostLayer);
		const withGhost = drawGhost(text, status, targetGhostLayer);

		// Layer context is touched only when it is redrawn: state calls on idle canvases leak in Chrome 153
		const drawLayer = layerDirty && !onlyGhost;

		// Nothing to draw
		if (!drawLayer && !withGhost) {
			return;
		}

		// Savepoint
		if (drawLayer) {
			context.save();
		}
		if (interactive) {
			ghostContext.save();
		}

		prerenderText(text, status, false, false, !drawLayer);

		// We need measurements in order to properly position text for alignment
		if (!text._textInfo) {
			measureTextNode(text, status);
		}

		// Init
		let radius = (text.radius || 0);
		let startAngle = (text.startAngle || 0);
		const inside = text.inside;
		const align = text.style.textAlign || "left";
		const kerning = text.kerning || 0;
		let clockwise = align == "left" ? 1 : -1;

		// Lines and letters in drawing order
		const inward = text._orient();

		// Process text info produced by the layout
		$array.each(text._textInfo!, (line, _index) => {

			const textHeight = line.height;

			// Adjust radius (for `inside = false`)
			// Radius adjustment for `inside = false` is below the line calculation
			if (!inside) {
				radius += textHeight;
			}

			// Init angles
			let lineStartAngle = startAngle;

			// Adjust for center-align
			if (align == "center") {
				lineStartAngle += (line.width / (radius - textHeight)) / 2 * -clockwise;
			}

			// Rotate letters if they are facing outward
			lineStartAngle += (Math.PI * (inward ? 0 : 1)); // Rotate 180 if outward

			// Savepoint
			if (drawLayer) {
				context.save();
				context.rotate(lineStartAngle);
			}
			if (interactive) {
				ghostContext.save();
				ghostContext.rotate(lineStartAngle);
			}

			let angleShift = 0;
			$array.each(line.textChunks, (chunk, _index) => {

				// Draw the letter
				const char = chunk.text;
				const charWidth = chunk.width;

				// Rotate half a letter
				angleShift = (charWidth / 2) / (radius - textHeight) * clockwise;
				if (drawLayer) {
					context.rotate(angleShift);
				}
				if (interactive) {
					ghostContext.rotate(angleShift);
				}

				// Set style
				if (chunk.style) {
					if (drawLayer) {
						context.save();
						context.font = chunk.style;
					}
					ghostContext.save();
					if (interactive) {
						ghostContext.font = chunk.style;
					}
				}

				if (chunk.fill && drawLayer) {
					context.save();
					context.fillStyle = chunk.fill.toCSS();
					// Color does not affect ghostContext so we not set it
				}

				// Center letters
				if (drawLayer) {
					context.textBaseline = "middle";
					context.textAlign = "center";
				}
				if (interactive) {
					ghostContext.textBaseline = "middle";
					ghostContext.textAlign = "center";
				}

				// Plop the letter
				if (drawLayer) {
					context.fillText(char, 0, (inward ? 1 : -1) * (0 - radius + textHeight / 2));
				}
				if (interactive && withGhost) {
					ghostContext.fillText(char, 0, (inward ? 1 : -1) * (0 - radius + textHeight / 2));
				}

				if (chunk.fill && drawLayer) {
					context.restore();
					// Color does not affect ghostContext so we not set it
				}

				// Reset style
				if (chunk.style) {
					if (drawLayer) {
						context.restore();
					}
					ghostContext.restore();
				}

				// Rotate half a letter and add spacing
				angleShift = (charWidth / 2 + kerning) / (radius - textHeight) * clockwise;
				if (drawLayer) {
					context.rotate(angleShift);
				}
				if (interactive) {
					ghostContext.rotate(angleShift);
				}

			});

			// Restore angle
			if (drawLayer) {
				context.restore();
			}
			if (interactive) {
				ghostContext.restore();
			}

			// Adjust radius (for `inside = true`)
			if (inside) {
				radius -= textHeight;
			}

		});

		// Restore
		if (drawLayer) {
			context.restore();
		}
		if (interactive) {
			ghostContext.restore();
		}
	}
}

/**
 * The picture's hit mask: its color id, cut to the image's opaque pixels.
 *
 * @ignore
 */
function imageHitMask(node: SceneImage, image: HTMLImageElement, status: IStatus): HTMLCanvasElement {
	if (node._imageMask === undefined) {
		// TODO should this round ?
		const width = node.width || image.naturalWidth;
		const height = node.height || image.naturalHeight;

		// We need to create a second canvas because destination-in clears out the entire canvas
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext("2d")!;

		context.imageSmoothingEnabled = false;

		context.fillStyle = colorIdOf(node, status);
		context.fillRect(0, 0, width, height);

		if (!isTainted(image)) {
			context.globalCompositeOperation = "destination-in";
			context.drawImage(image, 0, 0, width, height);
		}

		node._imageMask = canvas;
	}

	return node._imageMask;
}

/**
 * @ignore
 */
function paintImage(node: SceneImage, status: IStatus, targetGhostLayer: number = 0): void {
	markTainted(node, status);

	if (node.image) {
		if (node.tainted === undefined) {
			node.tainted = isTainted(node.image);
			status.layer.tainted = true;
		}

		if (node.tainted && rendererOf(node, status)._omitTainted) {
			return;
		}

		const onlyGhost = ghostOnly(targetGhostLayer);
		const withGhost = drawGhost(node, status, targetGhostLayer);

		if (status.layer.dirty && !onlyGhost) {

			if (node.shadowColor) {
				status.layer.context.shadowColor = node.shadowColor.toCSS(node.shadowOpacity != undefined ? node.shadowOpacity : 1);
			}
			if (node.shadowBlur) {
				status.layer.context.shadowBlur = node.shadowBlur;
			}
			if (node.shadowOffsetX) {
				status.layer.context.shadowOffsetX = node.shadowOffsetX;
			}
			if (node.shadowOffsetY) {
				status.layer.context.shadowOffsetY = node.shadowOffsetY;
			}

			// TODO should this round ?
			const width = node.width || node.image.naturalWidth;
			const height = node.height || node.image.naturalHeight;

			status.layer.context.drawImage(node.image, 0, 0, width, height);
		}

		if (node.interactive && isInteractive(node, status) && withGhost) {
			const mask = imageHitMask(node, node.image, status);

			rendererOf(node, status)._ghostLayer.context.drawImage(mask, 0, 0);
		}
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
export class CanvasRenderer extends ArrayDisposer implements IRenderer, IDisposer {
	public view: HTMLElement = document.createElement("div");
	public _layerDom: HTMLElement = document.createElement("div");

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

	public _interaction: InteractionManager<SceneNode>;

	protected _colorId: number = 0;
	protected _colorMap: { [color: string]: SceneNode } = {};

	public _forceInteractive: number = 0;
	public _omitTainted: boolean = false;

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

		this._interaction = new InteractionManager<SceneNode>(this);
		this._disposers.push(this._interaction);

	}

	public get interactionsEnabled(): boolean {
		return this._interaction.interactionsEnabled;
	}

	public set interactionsEnabled(value: boolean) {
		this._interaction.interactionsEnabled = value;
	}

	public get tapToActivate(): boolean {
		return this._interaction.tapToActivate;
	}

	public set tapToActivate(value: boolean) {
		this._interaction.tapToActivate = value;
	}

	public get tapToActivateTimeout(): number {
		return this._interaction.tapToActivateTimeout;
	}

	public set tapToActivateTimeout(value: number) {
		this._interaction.tapToActivateTimeout = value;
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

	createLinearGradient(x1: number, y1: number, x2: number, y2: number): LinearGradientDef {
		return new LinearGradientDef(x1, y1, x2, y2);
	}

	createRadialGradient(x1: number, y1: number, radius1: number, x2: number, y2: number, radius2: number): RadialGradientDef {
		return new RadialGradientDef(x1, y1, radius1, x2, y2, radius2);
	}

	createPattern(graphics: SceneGraphics, background: SceneGraphics, repetition: string, width: number, height: number): PatternDef {
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

		// Tiles are drawn at the screen's pixel density, so patterns are sharp
		// on high-resolution screens. The pattern transform maps whole tile
		// pixels back to the tile size, so it repeats at exactly that size
		const resolution = this.resolution;
		const hiDPI = resolution !== 1 && width > 0 && height > 0;
		const tileWidth = hiDPI ? Math.max(1, Math.round(width * resolution)) : width;
		const tileHeight = hiDPI ? Math.max(1, Math.round(height * resolution)) : height;

		this._patternCanvas.width = tileWidth;
		this._patternCanvas.height = tileHeight;

		this._patternContext.clearRect(0, 0, tileWidth, tileHeight);

		const scaleX = hiDPI ? tileWidth / width : 1;
		const scaleY = hiDPI ? tileHeight / height : 1;
		renderDetached(background, this._patternContext, scaleX, scaleY);
		renderDetached(graphics, this._patternContext, scaleX, scaleY);

		// Rasterized now: the pattern canvas is reused by the next pattern
		const def = new PatternDef(graphics, background, repetition, width, height);
		const native = this._patternContext.createPattern(this._patternCanvas, repetition)!;
		if (native && hiDPI) {
			native.setTransform(new DOMMatrix([1 / scaleX, 0, 0, 1 / scaleY, 0, 0]));
		}
		nativePaints.set(def, native);
		return def;
	}

	createRasterPattern(source: HTMLCanvasElement, repetition: string): RasterPatternDef | null {
		// Snapshot now: the source canvas may be redrawn later
		const native = this._patternContext.createPattern(source, repetition);
		if (!native) {
			return null;
		}
		const def = new RasterPatternDef(source, repetition);
		nativePaints.set(def, native);
		return def;
	}



	makeContainer(): SceneContainer {
		return new SceneContainer(this);
	}

	makeGraphics(): SceneGraphics {
		return new SceneGraphics(this);
	}

	makeText(text: string, style: SceneTextStyle): SceneText {
		return new SceneText(this, text, style);
	}

	makeTextStyle(): SceneTextStyle {
		return new SceneTextStyle();
	}

	makeRadialText(text: string, style: SceneTextStyle): SceneRadialText {
		return new SceneRadialText(this, text, style);
	}

	makePicture(image: HTMLImageElement | undefined): SceneImage {
		return new SceneImage(this, image);
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

	render(root: SceneNode): void {

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

		renderNode(root, {
			inactive: null,
			layer: this.defaultLayer,
			renderer: this,
		});

		const deferredGhostLayers = this._deferredGhostLayers;
		if (deferredGhostLayers.length) {
			deferredGhostLayers.sort((a, b) => a - b);
			$array.each(deferredGhostLayers, (layerx) => {
				renderNode(root, {
					inactive: null,
					layer: this.defaultLayer,
					renderer: this,
				}, layerx);
			});
		}

		this._ghostLayer.context.restore();

		$array.each(this._dirtyLayers, (layer) => {
			layer.context.restore();
			layer.dirty = false;
		});

		this._interaction.afterRender();
	}

	paintId(obj: SceneNode): string {
		const id = distributeId(++this._colorId);
		const color = Color.fromHex(id).toCSS();
		this._colorMap[color] = obj;
		return color;
	}

	_removeObject(obj: SceneNode): void {
		if (obj._colorId !== undefined) {
			delete this._colorMap[obj._colorId];
		}

		if (obj instanceof SceneImage && obj._imageMask) {
			clearCanvas(obj._imageMask);
		}
	}

	_useLayer(order: number, margin: IMargin | undefined): CanvasLayer {
		const visible = true;
		const layer = this.getLayer(order, visible);
		layer.visible = visible;
		layer.margin = margin;
		if (margin) {
			$utils.setInteractive(layer.view, false);
		}

		this._ghostLayer.setMargin(this.layers);

		layer.dirty = true;
		this.resizeLayer(layer);
		this.resizeGhost();
		return layer;
	}

	_layerCanvas(layer: ILayer): HTMLCanvasElement {
		return (<CanvasLayer>layer).view;
	}

	_measureText(text: SceneText): IBounds {
		return measureTextNode(text, {
			inactive: text.inactive,
			layer: <CanvasLayer>text.getLayer(),
			renderer: this,
		});
	}

	// protected _identifyObjectByColor(colorId: number): SceneNode | undefined {
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

	_getHitTarget(point: IPoint, bbox: DOMRect, target: Node | null): SceneNode | undefined | false {
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

	getObjectAtPoint(point: IPoint): SceneNode | undefined {
		const data = this._ghostLayer.getImageArray(point);

		if (data[0] === 0 && data[1] === 0 && data[2] === 0) {
			return undefined;
		}
		const colorId = Color.fromRGB(data[0], data[1], data[2]).toCSS();
		const hit = this._colorMap[colorId];

		return hit;
	}

	removeHovering(graphics: SceneNode) {
		this._interaction.removeHovering(graphics);
	}

	public getCanvas(root: SceneNode, options?: ICanvasOptions): HTMLCanvasElement {

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
			if (minScale * this.resolution > scale) {
				scale = minScale * this.resolution;
			}
		}

		if (options.minHeight && (options.minHeight > canvasHeight)) {
			let minScale = options.minHeight / canvasHeight;
			if (minScale * this.resolution > scale) {
				scale = minScale * this.resolution;
			}
		}

		if (options.maxWidth && (options.maxWidth < canvasWidth)) {
			let maxScale = options.maxWidth / canvasWidth;
			if (maxScale * this.resolution < scale) {
				scale = maxScale * this.resolution;
			}
		}

		if (options.maxHeight && (options.maxHeight < canvasHeight)) {
			let maxScale = options.maxHeight / canvasHeight;
			if (maxScale * this.resolution < scale) {
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

// Former names of the display classes, which are renderer-neutral scene nodes now

/**
 * @deprecated Renamed to `ScenePivot`.
 * @ignore
 */
export const CanvasPivot = ScenePivot;
/** @ignore */
export type CanvasPivot = ScenePivot;

/**
 * @deprecated Renamed to `SceneNode`.
 * @ignore
 */
export const CanvasDisplayObject = SceneNode;
/** @ignore */
export type CanvasDisplayObject = SceneNode;

/**
 * @deprecated Renamed to `SceneContainer`.
 * @ignore
 */
export const CanvasContainer = SceneContainer;
/** @ignore */
export type CanvasContainer = SceneContainer;

/**
 * @deprecated Renamed to `SceneGraphics`.
 * @ignore
 */
export const CanvasGraphics = SceneGraphics;
/** @ignore */
export type CanvasGraphics = SceneGraphics;

/**
 * @deprecated Renamed to `SceneText`.
 * @ignore
 */
export const CanvasText = SceneText;
/** @ignore */
export type CanvasText = SceneText;

/**
 * @deprecated Renamed to `SceneRadialText`.
 * @ignore
 */
export const CanvasRadialText = SceneRadialText;
/** @ignore */
export type CanvasRadialText = SceneRadialText;

/**
 * @deprecated Renamed to `SceneTextStyle`.
 * @ignore
 */
export const CanvasTextStyle = SceneTextStyle;
/** @ignore */
export type CanvasTextStyle = SceneTextStyle;

/**
 * @deprecated Renamed to `SceneImage`.
 * @ignore
 */
export const CanvasImage = SceneImage;
/** @ignore */
export type CanvasImage = SceneImage;
