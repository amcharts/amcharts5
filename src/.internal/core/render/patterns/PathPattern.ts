import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";

export interface IPathPatternSettings extends IPatternSettings {

	/**
	 * An SVG path to use as the pattern's motif.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths} for more information
	 */
	svgPath?: string;

	/**
	 * Gap between motifs, in pixels.
	 *
	 * @default 0
	 */
	gap?: number;

	/**
	 * The path is scaled (keeping its aspect ratio) to fit within
	 * `maxWidth` x `maxHeight` pixels. Without either, it keeps its own size.
	 */
	maxWidth?: number;

	/**
	 * The path is scaled (keeping its aspect ratio) to fit within
	 * `maxWidth` x `maxHeight` pixels. Without either, it keeps its own size.
	 */
	maxHeight?: number;

	/**
	 * If set to `true`, will place every second motif, creating a checkered
	 * pattern.
	 *
	 * @default false
	 */
	checkered?: boolean;

	/**
	 * Center motifs in their grid cell.
	 *
	 * @default true
	 */
	centered?: boolean;

}

export interface IPathPatternPrivate extends IPatternPrivate {
}

/**
 * A pattern that repeats an SVG path as a motif on a grid.
 *
 * Note: `rotation` rotates each motif around its own centre (the grid stays
 * axis-aligned), so the pattern tiles seamlessly at any angle.
 *
 * The tile is one grid cell, unless `width` and `height` are set: then that
 * is the tile, as before 5.20.0.
 *
 * @since 5.2.33
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class PathPattern extends Pattern {
	declare public _settings: IPathPatternSettings;
	declare public _privateSettings: IPathPatternPrivate;

	public static className: string = "PathPattern";
	public static classNames: Array<string> = Pattern.classNames.concat([PathPattern.className]);

	public canvas: HTMLCanvasElement = document.createElement("canvas");
	public context: CanvasRenderingContext2D = this.canvas.getContext("2d")!;

	protected _clearPath: boolean = false;
	protected _bbox: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 1, h: 1 };
	protected _bboxPath: string | undefined;

	public _beforeChanged() {
		this._optimizeTileSize();

		super._beforeChanged();

		// Assigning canvas.width/height clears and reallocates the backing store,
		// so only do it when the dimensions actually change.
		const width = this.get("width", 100);
		const height = this.get("height", 100);
		if (this.canvas.width !== width) {
			this.canvas.width = width;
		}
		if (this.canvas.height !== height) {
			this.canvas.height = height;
		}

		if (this._clear || this.isDirty("svgPath") || this.isDirty("gap") || this.isDirty("maxWidth") || this.isDirty("maxHeight") || this.isDirty("checkered") || this.isDirty("centered")) {
			this._clearPath = true;
		}
	}

	/**
	 * The tile is only a repeat unit (the grid repeats every cell), so shrink an
	 * oversized `width`/`height` to a single cell (2x2 when `checkered`). Skipped
	 * for non-`repeat` repetitions, and when the chart set the tile's size.
	 * @ignore
	 */
	protected _optimizeTileSize() {
		const repetition = this.get("repetition");
		if (repetition && repetition !== "repeat") {
			return;
		}

		if (this._authored("width") || this._authored("height")) {
			return;
		}

		const motif = this._motif();
		const gap = this.get("gap", 0);
		const cellW = motif.w + gap;
		const cellH = motif.h + gap;
		if (cellW <= 0 || cellH <= 0) {
			return;
		}

		const n = this.get("checkered", false) ? 2 : 1;
		const optimalW = Math.max(1, Math.round(cellW * n));
		const optimalH = Math.max(1, Math.round(cellH * n));

		if (this.get("width", 100) !== optimalW) {
			this._setCRaw("width", optimalW);
		}
		if (this.get("height", 100) !== optimalH) {
			this._setCRaw("height", optimalH);
		}
	}

	protected _authored(key: "width" | "height"): boolean {
		return this.isUserSetting(key) && !this.isComputedSetting(key);
	}

	/**
	 * The motif's scale and the box it takes: `maxWidth` x `maxHeight`, or the
	 * path's own size when neither is set.
	 * @ignore
	 */
	protected _motif(): { scale: number; w: number; h: number } {
		const svgPath = this.get("svgPath");
		if (svgPath != null && svgPath !== this._bboxPath) {
			this._bbox = this._getPathBounds(svgPath);
			this._bboxPath = svgPath;
		}
		const bbox = this._bbox;
		const maxWidth: number | undefined = this.get("maxWidth");
		const maxHeight: number | undefined = this.get("maxHeight");

		if (maxWidth == null && maxHeight == null) {
			return { scale: 1, w: bbox.w, h: bbox.h };
		}

		const scale = Math.min(maxWidth != null ? maxWidth / bbox.w : Infinity, maxHeight != null ? maxHeight / bbox.h : Infinity);
		return { scale: scale, w: maxWidth != null ? maxWidth : bbox.w * scale, h: maxHeight != null ? maxHeight : bbox.h * scale };
	}

	public _changed() {
		super._changed();

		if (this._clearPath) {
			const svgPath = this.get("svgPath");
			if (svgPath != null) {
				this._renderPattern(svgPath);
			}
		}

		this._clearPath = false;
	}

	protected _renderPattern(svgPath: string) {
		const motif = this._motif();

		const width = this.get("width", 100);
		const height = this.get("height", 100);
		const gap = this.get("gap", 0);
		const maxWidth = motif.w;
		const maxHeight = motif.h;
		const checkered = this.get("checkered", false);
		const centered = this.get("centered", true);
		const rotation = this.get("rotation", 0) * Math.PI / 180;

		const ctx = this.context;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, width, height);

		// Background (gap colour)
		const fill = this.get("fill");
		const fillOpacity = this.get("fillOpacity", 1);
		if (fill && fillOpacity > 0) {
			ctx.fillStyle = fill.toCSS(fillOpacity);
			ctx.fillRect(0, 0, width, height);
		}

		// Motif colour
		const color = this.get("color");
		ctx.fillStyle = color ? color.toCSS(this.get("colorOpacity", 1)) : "#000000";

		const path = new Path2D(svgPath);
		const bbox = this._bbox;
		// Uniform scale so the motif fits into its box
		const scale = motif.scale;
		const bcx = bbox.x + bbox.w / 2;
		const bcy = bbox.y + bbox.h / 2;

		let cellW = maxWidth + gap;
		let cellH = maxHeight + gap;
		let cols = Math.max(1, Math.round(width / cellW));
		let rows = Math.max(1, Math.round(height / cellH));

		// A tile the chart sized, with no motif size: one motif per tile, as before 5.20.0
		if (this.get("maxWidth") == null && this.get("maxHeight") == null && (this._authored("width") || this._authored("height"))) {
			cols = 1;
			rows = 1;
		}
		cellW = width / cols;
		cellH = height / rows;

		// One extra ring of cells so a (rotated) motif straddling the tile edge is
		// drawn from both sides and the tile stays seamless.
		for (let r = -1; r <= rows; r++) {
			for (let c = -1; c <= cols; c++) {
				if (checkered && ((r & 1) !== (c & 1))) {
					continue;
				}

				const cx = centered ? c * cellW + cellW / 2 : c * cellW + gap / 2 + maxWidth / 2;
				const cy = centered ? r * cellH + cellH / 2 : r * cellH + gap / 2 + maxHeight / 2;

				ctx.save();
				ctx.translate(cx, cy);
				if (rotation !== 0) {
					ctx.rotate(rotation);
				}
				ctx.scale(scale, scale);
				ctx.translate(-bcx, -bcy);
				ctx.fill(path);
				ctx.restore();
			}
		}

		this._pattern = this._root._renderer.createRasterPattern(this.canvas, this.get("repetition", "repeat"));
	}

	/**
	 * Native geometry bounding box of an SVG path, via a throwaway `<path>`.
	 * @ignore
	 */
	protected _getPathBounds(svgPath: string): { x: number; y: number; w: number; h: number } {
		const svgNS = "http://www.w3.org/2000/svg";
		const svg = document.createElementNS(svgNS, "svg");
		svg.style.cssText = "position:absolute;left:-10000px;top:-10000px;width:0;height:0;overflow:hidden;";
		const path = document.createElementNS(svgNS, "path");
		path.setAttribute("d", svgPath);
		svg.appendChild(path);
		document.body.appendChild(svg);

		let x = 0;
		let y = 0;
		let w = 1;
		let h = 1;
		try {
			const box = path.getBBox();
			x = box.x;
			y = box.y;
			w = box.width || 1;
			h = box.height || 1;
		}
		catch (e) {
			// getBBox can throw for an empty/invalid path; fall back to a unit box.
		}

		document.body.removeChild(svg);
		return { x, y, w, h };
	}
}
