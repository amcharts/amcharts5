import type { Root } from "../Root";
import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import type { Template } from "../../core/util/Template";

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

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Rectangle["_settings"], template?: Template<Rectangle>): Rectangle {
		const x = new Rectangle(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IRectangleSettings;
	declare public _privateSettings: IRectanglePrivate;

	public static className: string = "Rectangle";
	public static classNames: Array<string> = Graphics.classNames.concat([Rectangle.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("width") || this.isDirty("height") || this.isPrivateDirty("width") || this.isPrivateDirty("height")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
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
