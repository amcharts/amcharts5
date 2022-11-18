import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";

//import * as $math from "../../util/Math";

export interface IPathPatternSettings extends IPatternSettings {

	// /**
	//  * Gap between Paths, in pixels.
	//  *
	//  * @default 6
	//  */
	// gap?: number;

	// /**
	//  * Maximum width of the Path, in pixels.
	//  *
	//  * @default 5
	//  */
	// maxWidth?: number;

	// /**
	//  * Maximum height of the Path, in pixels.
	//  *
	//  * @default 5
	//  */
	// maxHeight?: number;

	// /**
	//  * If set to `true`, will place every second Path, creating checkered
	//  * pattern.
	//  *
	//  * @default false
	//  */
	// checkered?: boolean;

	// /**
	//  * Center image.
	//  *
	//  * @default true
	//  */
	// centered?: boolean;

	/**
	 * Use an SVG path as pattern.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths} for more information
	 */
	svgPath?: string;

}

export interface IPathPatternPrivate extends IPatternPrivate {
}

/**
 * A pattern that uses an SVG path.
 *
 * @since 5.2.33
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class PathPattern extends Pattern {
	declare public _settings: IPathPatternSettings;
	declare public _privateSettings: IPathPatternPrivate;

	public static className: string = "PathPattern";
	public static classNames: Array<string> = Pattern.classNames.concat([PathPattern.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("svgPath")) {
			this._clear = true;
		}
	}

	protected _draw() {
		super._draw();

		// const checkered = this.get("checkered", false);
		// const centered = this.get("centered", true);
		// const gap = this.get("gap", 0);
		// const rotation = this.get("rotation", 0);
		// let w = this.get("width", 100);
		// let h = this.get("height", 100);
		// let rectW = this.get("maxWidth", 5);
		// let rectH = this.get("maxHeight", 5);


		// let cellW = rectW + gap;
		// let cellH = rectH + gap;

		// let cols = Math.round(w / cellW);
		// let rows = Math.round(h / cellH);

		// cellW = w / cols;
		// cellH = h / rows;

		// if (rotation != 0) {
		// 	// @todo this is probably not right
		// 	this._display.x = cellW / 2 * $math.cos(rotation);
		// 	this._display.y = -cellH / 2 * $math.sin(rotation);
		// }

		// for (let r = rotation == 0 ? 0 : -rows * 2; r < rows * 2; r++) {
		// 	for (let c = rotation == 0 ? 0 : -cols * 2; c < cols * 2; c++) {
		// 		if (!checkered || ((r & 1) != 1 && (c & 1) != 1) || ((r & 1) == 1 && (c & 1) == 1)) {
		// 			let x = c * cellW;
		// 			let y = r * cellH;
		// 			if (centered) {
		// 				x += (cellW - rectW) / 2;
		// 				y += (cellH - rectH) / 2;
		// 			}
		// 			this._display.drawRect(x, y, rectW, rectH);
		// 		}
		// 	}
		// }

		// if (checkered) {
		// 	w = w / 2 - gap * 2;
		// 	h = h / 2 - gap * 2;
		// }
		// else {
		// 	w -= gap;
		// 	h -= gap;
		// }

		const svgPath = this.get("svgPath");
		if (svgPath != null) {
			this._display.svgPath(svgPath!);
		}

		const color = this.get("color");
		const colorOpacity = this.get("colorOpacity");
		if (color || colorOpacity) {
			// this._display.lineStyle(strokeWidth, stroke, colorOpacity);
			// this._display.endStroke();
			this._display.beginFill(color, colorOpacity);
			this._display.endFill();
		}

	}
}
