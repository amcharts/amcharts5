import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";

import * as $math from "../../util/Math";

export interface ICirclePatternSettings extends IPatternSettings {

	/**
	 * Gap between circles, in pixels.
	 *
	 * @default 5
	 */
	gap?: number;

	/**
	 * Radius of the circles, in pixels.
	 *
	 * @default 3
	 */
	radius?: number;

	/**
	 * If set to `true`, will place every second circle, creating checkered
	 * pattern.
	 *
	 * @default false
	 */
	checkered?: boolean;

	/**
	 * Center circles.
	 *
	 * @default false
	 */
	centered?: boolean;

}

export interface ICirclePatternPrivate extends IPatternPrivate {
}

/**
 * Circle pattern.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class CirclePattern extends Pattern {

	declare public _settings: ICirclePatternSettings;
	declare public _privateSettings: ICirclePatternPrivate;

	public static className: string = "CirclePattern";
	public static classNames: Array<string> = Pattern.classNames.concat([CirclePattern.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("gap") || this.isDirty("radius") || this.isDirty("checkered")) {
			this._clear = true;
		}

		this._optimizeTileSize();
	}

	/**
	 * A circle pattern's tile is only a repeat unit — the grid repeats every
	 * cell — so an oversized `width`/`height` just wastes memory and draw time
	 * for an identical result. Normalise it to a single cell (2x2 cells when
	 * `checkered`). Skipped for a `rotation` (not periodic on an axis-aligned
	 * tile) and for non-`repeat` repetitions.
	 * @ignore
	 */
	protected _optimizeTileSize() {
		const repetition = this.get("repetition");
		if (repetition && repetition !== "repeat") {
			return;
		}
		if (this.get("rotation", 0) !== 0) {
			return;
		}

		const gap = this.get("gap", 0);
		const cell = this.get("radius", 3) * 2 + gap;
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
		let w = this.get("width", 100);
		let h = this.get("height", 100);
		let radius = this.get("radius", 3);

		let cellW = radius * 2 + gap;
		let cellH = radius * 2 + gap;

		let cols = Math.round(w / cellW);
		let rows = Math.round(h / cellH);

		cellW = w / cols;
		cellH = h / rows;

		if (rotation != 0) {
			// @todo this is probably not right
			this._display.x = cellW * $math.cos(rotation);
			this._display.y = cellH * $math.sin(rotation);
		}

		// Only emit the cells that actually cover the tile (see RectanglePattern for
		// the rationale). The grid is drawn in local space and then rotated about
		// the origin (plus the display.x/display.y offset), so invert that transform
		// for the four tile corners to get the local cell range — instead of a fixed
		// `-2*cols..2*cols` x `-2*rows..2*rows` 16x over-draw that could exceed the
		// canvas fill limit on a large tile and render nothing.
		// A couple of cells of margin so circles straddling the tile edge (the
		// centring offset can push them across) are drawn from both sides, keeping
		// the tile seamless — needed once the tile is shrunk to a single cell.
		let cMin = -2;
		let cMax = cols + 2;
		let rMin = -2;
		let rMax = rows + 2;

		if (rotation != 0) {
			const cos = $math.cos(rotation);
			const sin = $math.sin(rotation);
			const dx = this._display.x;
			const dy = this._display.y;

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

		const color = this.get("color");
		const colorOpacity = this.get("colorOpacity");
		if (color || colorOpacity) {
			this._display.beginFill(color, colorOpacity);
		}

		for (let r = rMin; r < rMax; r++) {
			for (let c = cMin; c < cMax; c++) {
				if (!checkered || ((r & 1) != 1 && (c & 1) != 1) || ((r & 1) == 1 && (c & 1) == 1)) {
					let x = c * cellW;
					let y = r * cellH;
					if (centered) {
						x += cellW + gap / 2;
						y += cellH + gap / 2;
					}
					this._display.drawCircle(x - radius, y - radius, radius);
				}
			}
		}

		if (color || colorOpacity) {
			this._display.endFill();
		}

	}
}
