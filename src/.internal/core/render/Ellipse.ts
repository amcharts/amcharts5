import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";

export interface IEllipseSettings extends IGraphicsSettings {

	/**
	 * Horizontal radius in pixels.
	 */

	radiusX: number

	/**
	 * Vertical radius in pixels.
	 */
	radiusY: number
}

export interface IEllipsePrivate extends IGraphicsPrivate {
}

/**
 * Draws an ellipse centered on its `x` and `y`.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Ellipse extends Graphics {

	declare public _settings: IEllipseSettings;
	declare public _privateSettings: IEllipsePrivate;

	public static className: string = "Ellipse";
	public static classNames: Array<string> = Graphics.classNames.concat([Ellipse.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("radiusX") || this.isDirty("radiusY") || this.isDirty("rotation")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			this._display.drawEllipse(0, 0, Math.abs(this.get("radiusX")), Math.abs(this.get("radiusY")));
		}
	}
}
