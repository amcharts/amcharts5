import * as $type from "../util/Type";
import * as $math from "../util/Math";
import * as $utils from "../util/Utils";
import { Rectangle, IRectangleSettings, IRectanglePrivate } from "./Rectangle";


export interface IRoundedRectangleSettings extends IRectangleSettings {

	/**
	 * Radius of the top-left corner in pixels.
	 */
	cornerRadiusTL?: number;

	/**
	 * Radius of the top-right corner in pixels.
	 */
	cornerRadiusTR?: number;

	/**
	 * Radius of the botttom-right corner in pixels.
	 */
	cornerRadiusBR?: number;

	/**
	 * Radius of the bottom-left corner in pixels.
	 */
	cornerRadiusBL?: number;

}

export interface IRoundedRectanglePrivate extends IRectanglePrivate {
}

/**
 * Draws a rectangle with rounded corners.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class RoundedRectangle extends Rectangle {

	declare public _settings: IRoundedRectangleSettings;
	declare public _privateSettings: IRoundedRectanglePrivate;

	public static className: string = "RoundedRectangle";
	public static classNames: Array<string> = Rectangle.classNames.concat([RoundedRectangle.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("cornerRadiusTL") || this.isDirty("cornerRadiusTR") || this.isDirty("cornerRadiusBR") || this.isDirty("cornerRadiusBL")) {
			this._clear = true;
		}
	}

	public _draw() {
		let width = this.width();
		let height = this.height();

		let wSign = width / Math.abs(width);
		let hSign = height / Math.abs(height);

		let x = 0;
		let y = 0;

		const strokeWidth = this.get("strokeWidth", 0);

		if (this.get("containStroke", false)) {
			width -= wSign * strokeWidth;
			height -= hSign * strokeWidth;
			x += wSign * strokeWidth / 2;
			y += hSign * strokeWidth / 2;
		}

		let w = width;
		let h = height;

		if ($type.isNumber(w) && $type.isNumber(h)) {

			let minSide = Math.min(w, h) / 2;

			let crtl = $utils.relativeToValue(this.get("cornerRadiusTL", 8), minSide);
			let crtr = $utils.relativeToValue(this.get("cornerRadiusTR", 8), minSide);
			let crbr = $utils.relativeToValue(this.get("cornerRadiusBR", 8), minSide);
			let crbl = $utils.relativeToValue(this.get("cornerRadiusBL", 8), minSide);

			let maxcr = Math.min(Math.abs(w / 2), Math.abs(h / 2));

			crtl = $math.fitToRange(crtl, 0, maxcr);
			crtr = $math.fitToRange(crtr, 0, maxcr);
			crbr = $math.fitToRange(crbr, 0, maxcr);
			crbl = $math.fitToRange(crbl, 0, maxcr);

			const display = this._display;
			display.moveTo(x + crtl * wSign, y);
			display.lineTo(x + w - crtr * wSign, y);
			if (crtr > 0) {
				display.arcTo(x + w, y, x + w, y + crtr * hSign, crtr);
			}
			display.lineTo(x + w, y + h - crbr * hSign);
			if (crbr > 0) {
				display.arcTo(x + w, y + h, x + w - crbr * wSign, y + h, crbr);
			}
			display.lineTo(x + crbl * wSign, y + h);
			if (crbl > 0) {
				display.arcTo(x, y + h, x, y + h - crbl * hSign, crbl);
			}
			display.lineTo(x, y + crtl * hSign);
			if (crtl > 0) {
				display.arcTo(x, y, x + crtl * wSign, y, crtl);
			}
			display.closePath();
		}
	}
}
