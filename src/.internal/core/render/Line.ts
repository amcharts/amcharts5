import type { Root } from "../Root";
import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import type { IPoint } from "../util/IPoint";
import type { Template } from "../../core/util/Template";
import * as $draw from "../util/Draw";

export interface ILineSettings extends IGraphicsSettings {

	/**
	 * A list of [[IPoint]] (x/y coordinates) points for the line.
	 */
	points?: Array<IPoint>;

}

export interface ILinePrivate extends IGraphicsPrivate {
}

/**
 * Draws a line.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Line extends Graphics {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Line["_settings"], template?: Template<Line>): Line {
		const x = new Line(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: ILineSettings;
	declare public _privateSettings: ILinePrivate;

	public static className: string = "Line";
	public static classNames: Array<string> = Graphics.classNames.concat([Line.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("points") || this._sizeDirty || this.isPrivateDirty("width") || this.isPrivateDirty("height")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {

			const points = this.get("points")!;

			if (points && points.length > 0) {
				let point = points[0];

				this._display.moveTo(point.x, point.y);
				$draw.segmentedLine(this._display, [[points]]);
			}
			else {
				let w = this.width();
				let h = this.height();

				this._display.moveTo(0, 0);
				this._display.lineTo(w, h);
			}
		}
	}
}
