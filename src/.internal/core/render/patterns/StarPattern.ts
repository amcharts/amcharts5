import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";

import { percent, Percent } from "../../util/Percent";

import * as $utils from "../../util/Utils";
import * as $math from "../../util/Math";

export interface IStarPatternSettings extends IPatternSettings {

	/**
	 * Gap between stars, in pixels.
	 *
	 * @default 0
	 */
	gap?: number;

	/**
	 * Outer radius of the star, in pixels.
	 *
	 * @default 5
	 */
	radius?: number;

	/**
	 * Inner radius of the star. Either an absolute pixel value or a percent of
	 * `radius`.
	 *
	 * @default 50%
	 */
	innerRadius?: number | Percent;

	/**
	 * Number of spikes.
	 *
	 * @default 5
	 */
	spikes?: number;

	/**
	 * If set to `true`, will place every second star, creating a checkered
	 * pattern.
	 *
	 * @default false
	 */
	checkered?: boolean;

	/**
	 * Center stars in their grid cell.
	 *
	 * @default true
	 */
	centered?: boolean;

	/**
	 * If set to `true`, `rotation` rotates each star around its own center while
	 * the grid/tile stays axis-aligned, instead of rotating the whole pattern.
	 * This tiles seamlessly (a small `width`/`height` is enough) and is much
	 * faster than rotating the whole pattern on large tiles.
	 *
	 * @default false
	 */
	rotateShapes?: boolean;

}

export interface IStarPatternPrivate extends IPatternPrivate {
}

/**
 * Star pattern.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class StarPattern extends Pattern {
	declare public _settings: IStarPatternSettings;
	declare public _privateSettings: IStarPatternPrivate;

	public static className: string = "StarPattern";
	public static classNames: Array<string> = Pattern.classNames.concat([StarPattern.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("gap") || this.isDirty("radius") || this.isDirty("innerRadius") || this.isDirty("spikes") || this.isDirty("checkered") || this.isDirty("rotateShapes")) {
			this._clear = true;
		}

		this._optimizeTileSize();
	}

	/**
	 * A star pattern's tile is only a repeat unit — the grid repeats every cell —
	 * so an oversized `width`/`height` just wastes memory and draw time for an
	 * identical result. Normalise it to a single cell (2x2 cells when
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
		const cell = this.get("radius", 5) * 2 + gap;
		if (cell <= 0) {
			return;
		}

		const n = this.get("checkered", false) ? 2 : 1;
		const optimal = Math.max(1, Math.round(cell * n));

		if (this.get("width", 100) !== optimal) {
			this.setRaw("width", optimal);
		}
		if (this.get("height", 100) !== optimal) {
			this.setRaw("height", optimal);
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
		const radius = this.get("radius", 5);
		const innerRadius = $utils.relativeToValue(this.get("innerRadius", percent(50)), radius);
		const spikes = this.get("spikes", 5);

		const display = this._display;

		let cellW = radius * 2 + gap;
		let cellH = radius * 2 + gap;

		let cols = Math.round(w / cellW);
		let rows = Math.round(h / cellH);

		cellW = w / cols;
		cellH = h / rows;

		// `rotation` either rotates the whole tile (default) or, when
		// `rotateShapes` is set, each star in place while the grid/tile stays
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
			// One extra ring of cells so rotated stars near the tile edge are drawn
			// from both sides and tile seamlessly.
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
						cx += radius;
						cy += radius;
					}
					this._drawStar(cx, cy, radius, innerRadius, spikes, shCos, shSin);
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

	protected _drawStar(cx: number, cy: number, radius: number, innerRadius: number, spikes: number, shCos: number, shSin: number) {
		const display = this._display;
		const step = Math.PI / spikes;
		let angle = Math.PI / 2 * 3;

		// Each star vertex is rotated about the star's centre (shCos/shSin) and
		// then translated to (cx, cy).
		let px = 0;
		let py = -radius;
		display.moveTo(cx + px * shCos - py * shSin, cy + px * shSin + py * shCos);

		for (let i = 0; i < spikes; i++) {
			px = Math.cos(angle) * radius;
			py = Math.sin(angle) * radius;
			display.lineTo(cx + px * shCos - py * shSin, cy + px * shSin + py * shCos);
			angle += step;

			px = Math.cos(angle) * innerRadius;
			py = Math.sin(angle) * innerRadius;
			display.lineTo(cx + px * shCos - py * shSin, cy + px * shSin + py * shCos);
			angle += step;
		}

		px = 0;
		py = -radius;
		display.lineTo(cx + px * shCos - py * shSin, cy + px * shSin + py * shCos);
		display.closePath();
	}
}
