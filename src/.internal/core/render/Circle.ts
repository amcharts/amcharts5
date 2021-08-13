import type { Root } from "../Root";
import type { Template } from "../../core/util/Template";

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

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Circle["_settings"], template?: Template<Circle>): Circle {
		const x = new Circle(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: ICircleSettings;
	declare public _privateSettings: ICirclePrivate;

	public static className: string = "Circle";
	public static classNames: Array<string> = Graphics.classNames.concat([Circle.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("radius")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			this._display.drawCircle(0, 0, this.get("radius", 10));
		}
	}
}
