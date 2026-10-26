import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";

import * as $math from "../../util/Math";

export interface ITrianglePatternSettings extends IPatternSettings {

	/**
	 * Gap between triangles, in pixels.
	 *
	 * @default 0
	 */
	gap?: number;

	/**
	 * Width of the triangle, in pixels.
	 *
	 * @default 8
	 */
	maxWidth?: number;

	/**
	 * Height of the triangle, in pixels.
	 *
	 * @default 8
	 */
	maxHeight?: number;

	/**
	 * If set to `true`, will place every second triangle, creating a checkered
	 * pattern.
	 *
	 * @default false
	 */
	checkered?: boolean;

	/**
	 * Center triangles in their grid cell.
	 *
	 * @default true
	 */
	centered?: boolean;

	/**
	 * If set to `true`, `rotation` rotates each triangle around its own center
	 * while the grid/tile stays axis-aligned, instead of rotating the whole
	 * pattern. This tiles seamlessly (a small `width`/`height` is enough) and is
	 * much faster than rotating the whole pattern on large tiles.
	 *
	 * @default false
	 */
	rotateShapes?: boolean;

}

export interface ITrianglePatternPrivate extends IPatternPrivate {
}

/**
 * Triangle pattern.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class TrianglePattern extends Pattern {
	declare public _settings: ITrianglePatternSettings;
	declare public _privateSettings: ITrianglePatternPrivate;

	public static className: string = "TrianglePattern";
	public static classNames: Array<string> = Pattern.classNames.concat([TrianglePattern.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("gap") || this.isDirty("maxWidth") || this.isDirty("maxHeight") || this.isDirty("checkered") || this.isDirty("rotateShapes")) {
			this._clear = true;
		}

		this._optimizeTileSize();
	}

	/**
	 * A triangle pattern's tile is only a repeat unit — the grid repeats every
	 * cell — so an oversized `width`/`height` just wastes memory and draw time for
	 * an identical result. Normalise it to a single cell (2x2 cells when
	 * `checkered`). Skipped for a whole-pattern `rotation` (which isn't periodic
	 * on an axis-aligned tile — use `rotateShapes` for that) and for non-`repeat`
	 * repetitions.
	 * @ignore
	 */
	protected _optimizeTileSize() {
		const repetition = this.get("repetition");
		if (repetition && repetition !== "repeat") {
			return;
		}
		if (this.get("rotation", 0) !== 0 && !this.get("rotateShapes", false)) {
			return;
		}

		const gap = this.get("gap", 0);
		const cellW = this.get("maxWidth", 8) + gap;
		const cellH = this.get("maxHeight", 8) + gap;
		if (cellW <= 0 || cellH <= 0) {
			return;
		}

		const n = this.get("checkered", false) ? 2 : 1;
		const optimalW = Math.max(1, Math.round(cellW * n));
		const optimalH = Math.max(1, Math.round(cellH * n));

		if (this.get("width", 100) !== optimalW) {
			this.setRaw("width", optimalW);
		}
		if (this.get("height", 100) !== optimalH) {
			this.setRaw("height", optimalH);
		}
	}

	protected _draw() {
		super._draw();

		const checkered = this.get("checkered", false);
		const centered = this.get("centered", true);
		const gap = this.get("gap", 0);
		const rotation = this.get("rotation", 0);
		const rotateShapes = this.get("rotateShapes", false);
		const w = this.get("width", 100);
		const h = this.get("height", 100);
		const triW = this.get("maxWidth", 8);
		const triH = this.get("maxHeight", 8);

		const display = this._display;

		let cellW = triW + gap;
		let cellH = triH + gap;

		let cols = Math.round(w / cellW);
		let rows = Math.round(h / cellH);

		cellW = w / cols;
		cellH = h / rows;

		// `rotation` either rotates the whole tile (default) or, when
		// `rotateShapes` is set, each triangle in place while the grid/tile stays
		// axis-aligned. The latter tiles seamlessly and works with a tiny tile.
		const tileRotation = rotateShapes ? 0 : rotation;
		const shapeRotation = rotateShapes ? rotation : 0;

		display.angle = tileRotation;
		if (tileRotation != 0) {
			display.x = cellW / 2 * $math.cos(tileRotation);
			display.y = -cellH / 2 * $math.sin(tileRotation);
		}
		else {
			display.x = 0;
			display.y = 0;
		}

		let cMin = 0;
		let cMax = cols;
		let rMin = 0;
		let rMax = rows;

		if (shapeRotation != 0) {
			// One extra ring of cells so rotated triangles straddling the tile edge
			// are drawn from both sides and tile seamlessly.
			cMin = -1;
			cMax = cols + 1;
			rMin = -1;
			rMax = rows + 1;
		}
		else if (tileRotation != 0) {
			// Only emit the cells that cover the rotated tile (see RectanglePattern
			// for the rationale) instead of a fixed 16x over-draw.
			const cos = $math.cos(tileRotation);
			const sin = $math.sin(tileRotation);
			const dx = display.x;
			const dy = display.y;

			let minX = Infinity;
			let maxX = -Infinity;
			let minY = Infinity;
			let maxY = -Infinity;

			const corners = [[0, 0], [w, 0], [0, h], [w, h]];
			for (let i = 0; i < corners.length; i++) {
				const ox = corners[i][0] - dx;
				const oy = corners[i][1] - dy;
				const lx = cos * ox + sin * oy;
				const ly = -sin * ox + cos * oy;
				if (lx < minX) { minX = lx; }
				if (lx > maxX) { maxX = lx; }
				if (ly < minY) { minY = ly; }
				if (ly > maxY) { maxY = ly; }
			}

			cMin = Math.floor(minX / cellW) - 2;
			cMax = Math.ceil(maxX / cellW) + 2;
			rMin = Math.floor(minY / cellH) - 2;
			rMax = Math.ceil(maxY / cellH) + 2;
		}

		const shCos = $math.cos(shapeRotation);
		const shSin = $math.sin(shapeRotation);
		const halfW = triW / 2;
		const halfH = triH / 2;

		for (let r = rMin; r < rMax; r++) {
			for (let c = cMin; c < cMax; c++) {
				if (!checkered || ((r & 1) != 1 && (c & 1) != 1) || ((r & 1) == 1 && (c & 1) == 1)) {
					let cx = c * cellW;
					let cy = r * cellH;
					if (centered) {
						cx += cellW / 2;
						cy += cellH / 2;
					}
					else {
						cx += halfW;
						cy += halfH;
					}

					// Triangle vertices about its centre, rotated (shCos/shSin) then
					// translated to (cx, cy).
					this._point(cx, cy, -halfW, halfH, shCos, shSin, true);
					this._point(cx, cy, 0, -halfH, shCos, shSin, false);
					this._point(cx, cy, halfW, halfH, shCos, shSin, false);
					display.closePath();
				}
			}
		}

		const color = this.get("color");
		const colorOpacity = this.get("colorOpacity");
		if (color || colorOpacity) {
			display.beginFill(color, colorOpacity);
			display.endFill();
		}
	}

	private _point(cx: number, cy: number, px: number, py: number, shCos: number, shSin: number, move: boolean) {
		const x = cx + px * shCos - py * shSin;
		const y = cy + px * shSin + py * shCos;
		if (move) {
			this._display.moveTo(x, y);
		}
		else {
			this._display.lineTo(x, y);
		}
	}
}
