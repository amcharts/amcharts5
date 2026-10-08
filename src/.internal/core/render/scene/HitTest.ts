/** @ignore *//** */

import type { IPoint } from "../../util/IPoint";
import type { IBounds } from "../../util/IBounds";
import type { ILayer } from "../backend/Renderer";
import type { IPathSink } from "./GraphicsData";
import { SceneNode, SceneContainer, SceneGraphics, SceneText, SceneRadialText, SceneImage } from "./SceneNode";
import * as $array from "../../util/Array";


/**
 * @ignore
 */
interface IHitEntry {
	node: SceneNode;

	// Masks that clip the node, outermost first
	clips: Array<SceneGraphics> | undefined;

	// Local bounds of graphics, including strokes (made on first test)
	bounds?: IBounds;
}

/**
 * @ignore
 */
interface IImageAlpha {
	image: HTMLImageElement;
	width: number;
	height: number;

	// `null` when the image cannot be read (CORS)
	data: Uint8ClampedArray | null;
}

/**
 * Conservative bounds of a path: every point the path can reach lies inside.
 *
 * @ignore
 */
class BoundsSink implements IPathSink {
	public bounds: IBounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
	protected _x: number = 0;
	protected _y: number = 0;
	protected _startX: number = 0;
	protected _startY: number = 0;

	protected _add(x: number, y: number): void {
		const b = this.bounds;
		if (x < b.left) { b.left = x; }
		if (x > b.right) { b.right = x; }
		if (y < b.top) { b.top = y; }
		if (y > b.bottom) { b.bottom = y; }
	}

	protected _to(x: number, y: number): void {
		this._add(x, y);
		this._x = x;
		this._y = y;
	}

	moveTo(x: number, y: number): void {
		this._to(x, y);
		this._startX = x;
		this._startY = y;
	}

	lineTo(x: number, y: number): void {
		this._to(x, y);
	}

	closePath(): void {
		this._x = this._startX;
		this._y = this._startY;
	}

	rect(x: number, y: number, width: number, height: number): void {
		this._add(x + width, y + height);
		this.moveTo(x, y);
	}

	arc(cx: number, cy: number, radius: number, _startAngle: number, endAngle: number, _anticlockwise?: boolean): void {
		this._add(cx - radius, cy - radius);
		this._add(cx + radius, cy + radius);
		this._to(cx + radius * Math.cos(endAngle), cy + radius * Math.sin(endAngle));
	}

	arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
		// The arc lies in the triangle of the corner and its tangent points
		const ax = this._x - x1;
		const ay = this._y - y1;
		const bx = x2 - x1;
		const by = y2 - y1;
		const la = Math.sqrt(ax * ax + ay * ay);
		const lb = Math.sqrt(bx * bx + by * by);
		const cross = ax * by - ay * bx;

		if (la === 0 || lb === 0 || cross === 0 || radius === 0) {
			this._to(x1, y1);
			return;
		}

		const cos = (ax * bx + ay * by) / (la * lb);
		const d = radius * Math.sqrt((1 + cos) / (1 - cos));
		this._add(x1, y1);
		this._add(x1 + ax / la * d, y1 + ay / la * d);
		this._to(x1 + bx / lb * d, y1 + by / lb * d);
	}

	ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, _startAngle: number, endAngle: number, _anticlockwise?: boolean): void {
		const r = Math.max(radiusX, radiusY);
		this._add(x - r, y - r);
		this._add(x + r, y + r);
		const ex = radiusX * Math.cos(endAngle);
		const ey = radiusY * Math.sin(endAngle);
		this._to(x + ex * Math.cos(rotation) - ey * Math.sin(rotation), y + ex * Math.sin(rotation) + ey * Math.cos(rotation));
	}

	bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): void {
		this._add(cpX, cpY);
		this._add(cpX2, cpY2);
		this._to(toX, toY);
	}

	quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): void {
		this._add(cpX, cpY);
		this._to(toX, toY);
	}
}

/**
 * Answers "what is under this point" from geometry, the way the canvas
 * renderer's ghost canvas does, without painting one.
 *
 * Nodes are tested top-down in ghost paint order: layer 0 in tree order,
 * then each positive layer in ascending order (negative layers are never on
 * the ghost). A node counts only where the ghost would paint it: graphics
 * when interactive, text only when explicitly interactive (by its layout
 * box rather than glyph pixels), circular text per glyph, pictures by their
 * opaque pixels. Masks clip as they clip the ghost.
 *
 * @ignore
 */
export class GeometricHitTester {
	protected _entries: Array<IHitEntry> | undefined;
	protected _context: CanvasRenderingContext2D | undefined;
	protected _force: number = 0;
	protected _clipPaths: Map<SceneGraphics, Path2D> = new Map();
	protected _images: WeakMap<SceneImage, IImageAlpha> = new WeakMap();

	/**
	 * Call after every render: the scene may have changed.
	 */
	public invalidate(): void {
		this._entries = undefined;
		this._clipPaths.clear();
	}

	public hit(root: SceneNode, defaultLayer: ILayer, point: IPoint): SceneNode | undefined {
		if (!this._entries) {
			this._entries = this._collect(root, defaultLayer);
		}

		const entries = this._entries;
		for (let i = entries.length - 1; i >= 0; --i) {
			const entry = entries[i];
			// Disposed since the entries were made
			if (entry.node.isDisposed()) {
				continue;
			}
			if (this._hitNode(entry, point) && this._inClips(entry.clips, point)) {
				return entry.node;
			}
		}
	}

	protected _getContext(): CanvasRenderingContext2D {
		if (!this._context) {
			const canvas = document.createElement("canvas");
			canvas.width = 1;
			canvas.height = 1;
			this._context = canvas.getContext("2d")!;
		}
		return this._context;
	}

	protected _collect(root: SceneNode, defaultLayer: ILayer): Array<IHitEntry> {
		const byOrder: { [order: number]: Array<IHitEntry> } = {};
		this._force = 0;
		this._walk(root, null, defaultLayer, undefined, byOrder);

		const orders = Object.keys(byOrder).map(Number).sort((a, b) => a - b);
		const entries: Array<IHitEntry> = [];
		$array.each(orders, (order) => {
			$array.each(byOrder[order], (entry) => {
				entries.push(entry);
			});
		});
		return entries;
	}

	protected _walk(node: SceneNode, inactive: boolean | null, layer: ILayer, clips: Array<SceneGraphics> | undefined, byOrder: { [order: number]: Array<IHitEntry> }): void {
		if (!node.visible) {
			return;
		}

		node._setMatrix();

		const subInactive = (node.inactive == null ? inactive : node.inactive);
		const subLayer = node._layer || layer;
		const interactive = !subInactive && (node.interactive || this._force > 0);

		const mask = node.mask;
		if (mask && ((node instanceof SceneContainer && node.interactiveChildren) || interactive)) {
			mask._setMatrix();
			clips = clips ? clips.concat([mask]) : [mask];
		}

		if (node instanceof SceneContainer) {
			const force = node.interactive && node.interactiveChildren;
			if (force) {
				++this._force;
			}

			$array.each(node._children, (child) => {
				this._walk(child, subInactive, subLayer, clips, byOrder);
			});

			if (force) {
				--this._force;
			}

		} else if (interactive && this._onGhost(node)) {
			const order = subLayer.order || 0;
			if (order >= 0) {
				let list = byOrder[order];
				if (!list) {
					list = byOrder[order] = [];
				}
				list.push({ node, clips });
			}
		}
	}

	/**
	 * Whether an interactive node paints on the ghost at all.
	 */
	protected _onGhost(node: SceneNode): boolean {
		if (node instanceof SceneGraphics) {
			return true;

		} else if (node instanceof SceneRadialText && node.textType == "circular") {
			return true;

		} else if (node instanceof SceneText) {
			// Text is hit only when explicitly interactive, as on the ghost
			return node.interactive;

		} else if (node instanceof SceneImage) {
			return node.interactive && !!node.image;
		}

		return false;
	}

	protected _hitNode(entry: IHitEntry, point: IPoint): boolean {
		const node = entry.node;
		const local = node._matrix.applyInverse(point);
		const x = local.x;
		const y = local.y;

		if (!isFinite(x) || !isFinite(y)) {
			return false;
		}

		if (node instanceof SceneGraphics) {
			return this._hitGraphics(entry, node, x, y);

		} else if (node instanceof SceneRadialText && node.textType == "circular") {
			return this._hitCircularText(node, x, y);

		} else if (node instanceof SceneText) {
			const bounds = node._textBounds;
			return node.textVisible && !!node._textInfo && !!bounds && x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;

		} else if (node instanceof SceneImage) {
			return this._hitImage(node, x, y);
		}

		return false;
	}

	protected _hitGraphics(entry: IHitEntry, graphics: SceneGraphics, x: number, y: number): boolean {
		const ops = graphics._data.ops;

		let bounds = entry.bounds;
		if (!bounds) {
			const sink = new BoundsSink();
			let pad = 1;
			$array.each(ops, (op) => {
				if (op.type === "lineStyle") {
					// Miter joins reach up to 5 widths (miter limit 10)
					pad = Math.max(pad, op.width * 5);
				}
				op.path(sink);
			});
			bounds = entry.bounds = sink.bounds;
			bounds.left -= pad;
			bounds.top -= pad;
			bounds.right += pad;
			bounds.bottom += pad;
		}

		if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) {
			return false;
		}

		// Replays the ops as the ghost paints them: every fill and stroke
		// counts, in the state (width, dash, join, cap) of its moment
		const context = this._getContext();
		context.save();

		let path = new Path2D();
		let hit = false;

		$array.eachContinue(ops, (op) => {
			switch (op.type) {
				case "beginPath":
					path = new Path2D();
					break;
				case "endFill":
					hit = context.isPointInPath(path, x, y);
					break;
				case "endStroke":
					hit = context.isPointInStroke(path, x, y);
					break;
				case "lineStyle":
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
				default:
					op.path(path);
			}
			return !hit;
		});

		context.restore();
		return hit;
	}

	protected _hitCircularText(text: SceneRadialText, x: number, y: number): boolean {
		if (!text.textVisible || !text._textInfo) {
			return false;
		}

		let hit = false;
		text._eachGlyph(text._inward(), (chunk, angle, gy, height) => {
			if (!hit) {
				const cos = Math.cos(angle);
				const sin = Math.sin(angle);
				const rx = x * cos + y * sin;
				const ry = -x * sin + y * cos;
				hit = Math.abs(rx) <= chunk.width / 2 && Math.abs(ry - gy) <= height / 2;
			}
		});
		return hit;
	}

	protected _hitImage(node: SceneImage, x: number, y: number): boolean {
		const image = node.image;
		if (!image) {
			return false;
		}

		const width = node.width || image.naturalWidth;
		const height = node.height || image.naturalHeight;

		if (x < 0 || y < 0 || x >= width || y >= height) {
			return false;
		}

		let alpha = this._images.get(node);
		if (!alpha || alpha.image !== image || alpha.width !== width || alpha.height !== height) {
			alpha = { image, width, height, data: readAlpha(image, width, height) };
			this._images.set(node, alpha);
		}

		// Unreadable pictures are hit by their rectangle, as on the ghost
		if (!alpha.data) {
			return true;
		}

		// The ghost keeps its id color only where the picture is opaque
		const index = (Math.floor(y) * Math.floor(width) + Math.floor(x)) * 4 + 3;
		return alpha.data[index] === 255;
	}

	protected _inClips(clips: Array<SceneGraphics> | undefined, point: IPoint): boolean {
		if (!clips) {
			return true;
		}

		const context = this._getContext();
		let inside = true;

		$array.eachContinue(clips, (mask) => {
			let path = this._clipPaths.get(mask);
			if (!path) {
				path = new Path2D();
				const p = path;
				$array.each(mask._data.ops, (op) => {
					op.path(p);
				});
				this._clipPaths.set(mask, path);
			}

			const local = mask._matrix.applyInverse(point);
			inside = context.isPointInPath(path, local.x, local.y);
			return inside;
		});

		return inside;
	}
}

/**
 * Pixels of a picture drawn at its display size, or `null` when CORS keeps
 * them unreadable.
 *
 * @ignore
 */
function readAlpha(image: HTMLImageElement, width: number, height: number): Uint8ClampedArray | null {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext("2d", { willReadFrequently: true })! as CanvasRenderingContext2D;
	context.imageSmoothingEnabled = false;
	context.drawImage(image, 0, 0, width, height);

	try {
		return context.getImageData(0, 0, canvas.width, canvas.height).data;

	} catch (err) {
		return null;
	}
}
