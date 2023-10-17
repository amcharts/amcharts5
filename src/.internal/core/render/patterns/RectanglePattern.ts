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

		if (this.isDirty("gap")) {
			this._clear = true;
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
		let rectW = this.get("maxWidth", 5);
		let rectH = this.get("maxHeight", 5);

		const display = this._display;

		let cellW = rectW + gap;
		let cellH = rectH + gap;

		let cols = Math.round(w / cellW);
		let rows = Math.round(h / cellH);

		cellW = w / cols;
		cellH = h / rows;

		if (rotation != 0) {
			// @todo this is probably not right
			display.x = cellW / 2 * $math.cos(rotation);
			display.y = -cellH / 2 * $math.sin(rotation);
		}

		for (let r = rotation == 0 ? 0 : -rows * 2; r < rows * 2; r++) {
			for (let c = rotation == 0 ? 0 : -cols * 2; c < cols * 2; c++) {
				if (!checkered || ((r & 1) != 1 && (c & 1) != 1) || ((r & 1) == 1 && (c & 1) == 1)) {
					let x = c * cellW;
					let y = r * cellH;
					if (centered) {
						x += (cellW - rectW) / 2;
						y += (cellH - rectH) / 2;
					}
					display.drawRect(x, y, rectW, rectH);
				}
			}
		}

		if (checkered) {
			w = w / 2 - gap * 2;
			h = h / 2 - gap * 2;
		}
		else {
			w -= gap;
			h -= gap;
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
