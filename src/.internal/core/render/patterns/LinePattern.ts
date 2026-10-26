import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";
import * as $type from "../../util//Type";

export interface ILinePatternSettings extends IPatternSettings {

	/**
	 * Gap between lines, in pixels.
	 *
	 * @default 6
	 */
	gap?: number;

	/**
	 * Line drawing angle in degrees. For line patterns it's better than using
	 * rotation of the whole pattern, allowing smaller pattern sizes.
	 *
	 * @default 0
	 * @since 5.14
	 */
	angle?: number;

}

export interface ILinePatternPrivate extends IPatternPrivate {
}

/**
 * Line pattern.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class LinePattern extends Pattern {

	declare public _settings: ILinePatternSettings;
	declare public _privateSettings: ILinePatternPrivate;

	public static className: string = "LinePattern";
	public static classNames: Array<string> = Pattern.classNames.concat([LinePattern.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("gap") || this.isDirty("angle")) {
			this._clear = true;
		}

		this._optimizeTileSize();
	}

	/**
	 * A line pattern's tile is only a repeat unit, so an oversized `width`/
	 * `height` just wastes memory and draw time for an identical result. Shrink
	 * it to a few line periods — the minimal seamless tile. Only applies to a
	 * fully-repeating pattern; a `gap` of 0 (single line) or a non-`repeat`
	 * `repetition` keep the requested size, and the tile is never grown.
	 *
	 * The shrink is only seamless in the tile's own coordinate space, where the
	 * lines are drawn at `angle`. A whole-tile `rotation` transforms the tile
	 * externally, so an asymmetric optimal size (e.g. a 4px-wide sliver for the
	 * default horizontal lines) no longer tiles once rotated — leaving the
	 * requested size intact is what keeps `rotation` seamless. Prefer `angle`.
	 * @ignore
	 */
	protected _optimizeTileSize() {
		const repetition = this.get("repetition");
		if (repetition && repetition !== "repeat") {
			return;
		}

		if (this.get("rotation")) {
			return;
		}

		const gap = this.get("gap", 0);
		if (!gap) {
			return;
		}

		const step = gap + this.get("strokeWidth", 1);
		const rad = this.get("angle", 0) * Math.PI / 180;
		const sinA = Math.abs(Math.sin(rad));
		const cosA = Math.abs(Math.cos(rad));

		// The line period projected onto each axis. A line running (nearly)
		// parallel to an axis needs no period along it, so that dimension can be
		// minimal. A few periods gives a small tile with margin against sub-pixel
		// edge artifacts; the `_draw` spacing-snap then makes it tile exactly.
		const periods = 4;
		const optimalW = Math.max(1, Math.ceil((sinA > 0.000001 ? step / sinA : 1) * periods));
		const optimalH = Math.max(1, Math.ceil((cosA > 0.000001 ? step / cosA : 1) * periods));

		if (this.get("width", 100) > optimalW) {
			this.setRaw("width", optimalW);
		}
		if (this.get("height", 100) > optimalH) {
			this.setRaw("height", optimalH);
		}
	}

	protected _draw() {
		super._draw();

		const w = this.get("width", 100);
		const h = this.get("height", 100);
		const gap = this.get("gap", 0);
		const strokeWidth = this.get("strokeWidth", 1);

		if (!gap) {
			this._display.moveTo(0, 0);
			this._display.lineTo(w, 0);
		}
		else {
			let step = gap + strokeWidth;
			let count = h / step;
			let angle = this.get("angle", 0) * Math.PI / 180;

			if (angle === 0) {
				// Horizontal lines (original behavior)
				for (let i = -count; i < count * 2; i++) {
					const y = Math.round(i * step - step / 2) + 0.5;
					this._display.moveTo(-w, y);
					this._display.lineTo(w * 2, y);
				}
			} else {
				// Angled lines
				const cosA = Math.cos(angle);
				const sinA = Math.sin(angle);

				// Snap the perpendicular spacing so the tile holds a whole number
				// of line periods and therefore tiles seamlessly. The line normal
				// is (sinA, cosA), so a tile shift of (w, 0) moves the line offset
				// by `w * sinA` and (0, h) by `h * cosA` — both must be multiples
				// of the spacing. Nudge the spacing to satisfy the axis with the
				// larger projection (exact for a square tile at 45deg, and the
				// nearest-seamless value otherwise), which keeps the visual gap
				// almost unchanged. Without this the pattern seams, and because a
				// fill pattern is anchored at the shape's origin the seam lands
				// dead-centre (e.g. an X across a circle).
				const proj = Math.max(Math.abs(w * sinA), Math.abs(h * cosA));
				if (proj > 0.000001) {
					step = proj / Math.max(1, Math.round(proj / step));
				}

				const diagonal = Math.sqrt(w * w + h * h) * 2; // Ensure lines cover the entire area even when rotated

				// Calculate how many lines we need based on the gap
				const effectiveStep = step / Math.max(Math.abs(cosA), Math.abs(sinA));
				const lineCount = Math.ceil(diagonal / effectiveStep) * 2;
				
				// Draw lines through the rectangle at the specified angle
				for (let i = -lineCount; i < lineCount; i++) {
					const offset = i * step;
					
					// Calculate endpoints of the line
					// Start far outside the rectangle and clip automatically
					const x1 = offset * sinA - diagonal * cosA;
					const y1 = offset * cosA + diagonal * sinA;
					const x2 = offset * sinA + diagonal * cosA;
					const y2 = offset * cosA - diagonal * sinA;
					
					this._display.moveTo(x1, y1);
					this._display.lineTo(x2, y2);
				}
			}

			/**
			for (let i = -count; i < count * 2; i++) {
				const y = Math.round(i * step - step / 2) + 0.5;
				this._display.moveTo(-w, y);
				this._display.lineTo(w * 2, y);				
			}*/
		}

		this._display.lineStyle(strokeWidth, this.get("color"), this.get("colorOpacity"));

		let strokeDasharray = this.get("strokeDasharray");
		if ($type.isNumber(strokeDasharray)) {
			if (strokeDasharray < 0.5) {
				strokeDasharray = [0];
			}
			else {
				strokeDasharray = [strokeDasharray]
			}
		}
		this._display.setLineDash(strokeDasharray as number[]);

		const strokeDashoffset = this.get("strokeDashoffset");
		if (strokeDashoffset) {
			this._display.setLineDashOffset(strokeDashoffset);
		}

		this._display.endStroke();
	}
}
