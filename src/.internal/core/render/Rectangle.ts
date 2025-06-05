import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";

export interface IRectangleSettings extends IGraphicsSettings {
	/**
	 * @todo review
	 * If this is set to `true`, rectangle will be drawn in such a way that its stroke is contained within the rectangle's width and height.
	 */
	containStroke?: boolean;
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

	public _afterNew() {
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
		let w = this.width();
		let h = this.height();
		let x = 0;
		let y = 0;

		let wSign = w / Math.abs(w);
		let hSign = h / Math.abs(h);

		if (this.get("containStroke", false)) {
			const strokeWidth = this.get("strokeWidth", 0);
			w -= strokeWidth * wSign;
			h -= strokeWidth * hSign;
			x += strokeWidth / 2 * wSign;
			y += strokeWidth / 2 * hSign;
		}

		this._display.drawRect(x, y, w, h);
	}

	public _updateSize() {
		this.markDirty()
		this._clear = true;
	}
}
