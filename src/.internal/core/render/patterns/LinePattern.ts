import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";
import * as $type from "../../util//Type";

export interface ILinePatternSettings extends IPatternSettings {

	/**
	 * Gap between  lines, in pixels.
	 *
	 * @default 6
	 */
	gap?: number;

	/**
	 * Line drawing angle in degrees. For line patterns it's better than using
	 * rotation of the whole pattern, allowing smaller pattern sized.
	 * 
	 * @default 0
	 * @since 5.14.
	 */
	angle?: number;

}

export interface ILinePatternPrivate extends IPatternPrivate {
}

/**
 * Line pattern.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class LinePattern extends Pattern {

	declare public _settings: ILinePatternSettings;
	declare public _privateSettings: ILinePatternPrivate;

	public static className: string = "LinePattern";
	public static classNames: Array<string> = Pattern.classNames.concat([LinePattern.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("gap")) {
			this._clear = true;
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
