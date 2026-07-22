import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";

import * as $math from "../../util/Math";

export interface IRectanglePatternSettings extends IPatternSettings {

	/**
	 * Gap between rectangles, in pixels.
	 *
	 * @default 6
	 */
	gap?: number;

	/**
	 * Maximum width of the rectangle, in pixels.
	 *
	 * @default 5
	 */
	maxWidth?: number;

	/**
	 * Maximum height of the rectangle, in pixels.
	 *
	 * @default 5
	 */
	maxHeight?: number;

	/**
	 * If set to `true`, will place every second rectangle, creating checkered
	 * pattern.
	 *
	 * @default false
	 */
	checkered?: boolean;

	/**
	 * Center rectangles.
	 *
	 * @default true
	 */
	centered?: boolean;

	/**
	 * If set to `true`, `rotation` rotates each rectangle around its own center
	 * while the grid/tile stays axis-aligned, instead of rotating the whole
	 * pattern. This tiles seamlessly (a small `width`/`height` is enough) and is
	 * much faster than rotating the whole pattern on large tiles.
	 *
	 * @default false
	 */
	rotateShapes?: boolean;

}

export interface IRectanglePatternPrivate extends IPatternPrivate {
}

/**
 * Rectangle pattern.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class RectanglePattern extends Pattern {
	declare public _settings: IRectanglePatternSettings;
	declare public _privateSettings: IRectanglePatternPrivate;

	public static className: string = "RectanglePattern";
	public static classNames: Array<string> = Pattern.classNames.concat([RectanglePattern.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("gap") || this.isDirty("rotateShapes") || this.isDirty("maxWidth") || this.isDirty("maxHeight") || this.isDirty("checkered")) {
			this._clear = true;
		}

		this._optimizeTileSize();
	}

	/**
	 * A rectangle pattern's tile is only a repeat unit — the grid repeats every
	 * cell — so an oversized `width`/`height` just wastes memory and draw time
	 * for an identical result. Normalise it to a single cell (2x2 cells when
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
		const cellW = this.get("maxWidth", 5) + gap;
		const cellH = this.get("maxHeight", 5) + gap;
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
		let w = this.get("width", 100);
		let h = this.get("height", 100);
		let rectW = this.get("maxWidth", 5);
		let rectH = this.get("maxHeight", 5);

		const display = this._display;

		let cellW = rectW + gap;
		let cellH = rectH + gap;

		let cols = Math.round(w / cellW);
		let rows = Math.round(h / cellH);

		cellW = w / cols;
		cellH = h / rows;

		// `rotation` either rotates the whole tile (default) or, when
		// `rotateShapes` is set, each rectangle in place while the grid/tile stays
		// axis-aligned. The latter tiles seamlessly, so it needs no over-scan and
		// works with a tiny tile.
		const tileRotation = rotateShapes ? 0 : rotation;
		const shapeRotation = rotateShapes ? rotation : 0;

		// The base (`Pattern._changed`) already set `display.angle` to `rotation`;
		// override it so shape rotation turns only the shapes, not the tile.
		display.angle = tileRotation;
		if (tileRotation != 0) {
			// @todo this is probably not right
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
			// One extra ring of cells so rotated rectangles straddling the tile
			// edge are drawn from both sides and tile seamlessly.
			cMin = -1;
			cMax = cols + 1;
			rMin = -1;
			rMax = rows + 1;
		}
		else if (tileRotation != 0) {
			// Only emit the cells that cover the rotated tile. The grid is drawn in
			// local space and then rotated about the origin (plus the small
			// display.x/display.y offset), so invert that transform for the four
			// tile corners to get the local cell range. This previously scanned a
			// fixed `-2*cols..2*cols` x `-2*rows..2*rows` (a 16x over-draw, almost
			// all of it off-tile and clipped); on a large tile that produced a
			// canvas path big enough to exceed the fill limit and render nothing.
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

			// Two cells of margin cover the centering shift and partial edges.
			cMin = Math.floor(minX / cellW) - 2;
			cMax = Math.ceil(maxX / cellW) + 2;
			rMin = Math.floor(minY / cellH) - 2;
			rMax = Math.ceil(maxY / cellH) + 2;
		}

		// Rotated-rectangle corner basis (used only when rotating shapes).
		const shCos = $math.cos(shapeRotation);
		const shSin = $math.sin(shapeRotation);
		const halfW = rectW / 2;
		const halfH = rectH / 2;
		const wc = halfW * shCos;
		const ws = halfW * shSin;
		const hc = halfH * shCos;
		const hs = halfH * shSin;

		for (let r = rMin; r < rMax; r++) {
			for (let c = cMin; c < cMax; c++) {
				if (!checkered || ((r & 1) != 1 && (c & 1) != 1) || ((r & 1) == 1 && (c & 1) == 1)) {
					let x = c * cellW;
					let y = r * cellH;
					if (centered) {
						x += (cellW - rectW) / 2;
						y += (cellH - rectH) / 2;
					}

					if (shapeRotation != 0) {
						// Draw the rectangle as a quad rotated about its own center.
						const cx = x + halfW;
						const cy = y + halfH;
						display.moveTo(cx - wc + hs, cy - ws - hc);
						display.lineTo(cx + wc + hs, cy + ws - hc);
						display.lineTo(cx + wc - hs, cy + ws + hc);
						display.lineTo(cx - wc - hs, cy - ws + hc);
						display.closePath();
					}
					else {
						display.drawRect(x, y, rectW, rectH);
					}
				}
			}
		}

		const color = this.get("color");
		const colorOpacity = this.get("colorOpacity");
		if (color || colorOpacity) {
			// this._display.lineStyle(strokeWidth, stroke, colorOpacity);
			// this._display.endStroke();
			display.beginFill(color, colorOpacity);
			display.endFill();
		}

	}
}
