import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";

export interface ITriangleSettings extends IGraphicsSettings {
}

export interface ITrianglePrivate extends IGraphicsPrivate {
}

/**
 * Draws a triangle.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Triangle extends Graphics {

	declare public _settings: ITriangleSettings;
	declare public _privateSettings: ITrianglePrivate;

	public static className: string = "Triangle";
	public static classNames: Array<string> = Graphics.classNames.concat([Triangle.className]);

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
		const w = this.width();
		const h = this.height();
		const display = this._display;
		display.moveTo(-w / 2, h / 2);
		display.lineTo(0, -h / 2);
		display.lineTo(w / 2, h / 2);
		display.lineTo(-w / 2, h / 2);
		display.closePath();

	}

	public _updateSize() {
		this.markDirty()
		this._clear = true;
	}
}
