import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import type { IPoint } from "../util/IPoint";
import * as $draw from "../util/Draw";

export interface ILineSettings extends IGraphicsSettings {

	/**
	 * Points the line goes through, in pixels from the line's position.
	 */
	points?: Array<IPoint>;

	/**
	 * Separate pieces of the line, used when `points` is not set. Each piece is
	 * a list of point arrays drawn as one continuous stroke.
	 *
	 * @since 5.1.4
	 */
	segments?: Array<Array<Array<IPoint>>>;
}

export interface ILinePrivate extends IGraphicsPrivate {
}

/**
 * Draws a line through `points` or `segments`. With neither, it draws a
 * straight line from its top-left corner to its bottom-right one, at its
 * `width` and `height`.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Line extends Graphics {

	declare public _settings: ILineSettings;
	declare public _privateSettings: ILinePrivate;

	public static className: string = "Line";
	public static classNames: Array<string> = Graphics.classNames.concat([Line.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("points") || this.isDirty("segments") || this._sizeDirty || this.isPrivateDirty("width") || this.isPrivateDirty("height")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {

			const points = this.get("points");
			const segments = this.get("segments");

			if (points && points.length > 0) {
				let point = points[0];

				this._display.moveTo(point.x, point.y);
				$draw.segmentedLine(this._display, [[points]]);
			}
			else if (segments) {
				$draw.segmentedLine(this._display, segments);
			}
			else if (!this.get("draw")) {
				let w = this.width();
				let h = this.height();

				this._display.moveTo(0, 0);
				this._display.lineTo(w, h);
			}
		}
	}
}
