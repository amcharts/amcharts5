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

		let w = width;
		let h = height;

		let wSign = w / Math.abs(width);
		let hSign = h / Math.abs(height);

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
			display.moveTo(crtl * wSign, 0);
			display.lineTo(w - crtr * wSign, 0);
			if (crtr > 0) {
				display.arcTo(w, 0, w, crtr * hSign, crtr);
			}
			display.lineTo(w, h - crbr * hSign);
			if (crbr > 0) {
				display.arcTo(w, h, w - crbr * wSign, h, crbr);
			}
			display.lineTo(crbl * wSign, h);
			if (crbl > 0) {
				display.arcTo(0, h, 0, h - crbl * hSign, crbl);
			}
			display.lineTo(0, crtl * hSign);
			if (crtl > 0) {
				display.arcTo(0, 0, crtl * wSign, 0, crtl);
			}
			display.closePath();
		}
	}
}
