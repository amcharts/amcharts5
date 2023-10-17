import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";

export interface IRectangleSettings extends IGraphicsSettings {
}

export interface IRectanglePrivate extends IGraphicsPrivate {
}

/**
 * Draws a rectangle.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Rectangle extends Graphics {

	declare public _settings: IRectangleSettings;
	declare public _privateSettings: IRectanglePrivate;

	public static className: string = "Rectangle";
	public static classNames: Array<string> = Graphics.classNames.concat([Rectangle.className]);

	public _afterNew(){
		super._afterNew();
		this._display.isMeasured = true;
		this.setPrivateRaw("trustBounds", true);
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("width") || this.isDirty("height") || this.isPrivateDirty("width") || this.isPrivateDirty("height")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear && !this.get("draw")) {
			this._draw();
		}
	}

	protected _draw() {
		this._display.drawRect(0, 0, this.width(), this.height());
	}

	public _updateSize() {
		this.markDirty()
		this._clear = true;
	}
}
