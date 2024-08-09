import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";

export interface ICircleSettings extends IGraphicsSettings {

	/**
	 * Circle radius in pixels.
	 */
	radius?: number;

}

export interface ICirclePrivate extends IGraphicsPrivate {
}

/**
 * Draws a circle.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Circle extends Graphics {

	declare public _settings: ICircleSettings;
	declare public _privateSettings: ICirclePrivate;

	public static className: string = "Circle";
	public static classNames: Array<string> = Graphics.classNames.concat([Circle.className]);

	public _afterNew(){
		super._afterNew();
		this._display.isMeasured = true;
		this.setPrivateRaw("trustBounds", true);
	}	

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("radius")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			this._display.drawCircle(0, 0, Math.abs(this.get("radius", 10)));
		}
	}
}
