import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import * as $math from "../util/Math";

export interface IPointedRectangleSettings extends IGraphicsSettings {

	/**
	 * A width of the pinter's (stem's) thick end (base) in pixels.
	 */
	pointerBaseWidth?: number;

	/**
	 * A length of the pinter (stem) in pixels.
	 */
	pointerLength?: number;

	/**
	 * X coordinate the shape is pointing to.
	 */
	pointerX?: number;

	/**
	 * Y coordinate the shape is pointing to.
	 */
	pointerY?: number;

	/**
	 * Corner radius in pixels.
	 */
	cornerRadius?: number;
}

export interface IPointedRectanglePrivate extends IGraphicsPrivate {
}

/**
 * Draws a rectangle with a pointer.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class PointedRectangle extends Graphics {

	declare public _settings: IPointedRectangleSettings;
	declare public _privateSettings: IPointedRectanglePrivate;

	public static className: string = "PointedRectangle";
	public static classNames: Array<string> = Graphics.classNames.concat([PointedRectangle.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("pointerBaseWidth") || this.isDirty("cornerRadius") || this.isDirty("pointerLength") || this.isDirty("pointerX") || this.isDirty("pointerY") || this.isDirty("width") || this.isDirty("height")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {

			this.markDirtyBounds();

			let w = this.width();
			let h = this.height();

			if (w > 0 && h > 0) {
				let cr = this.get("cornerRadius", 8);
				cr = $math.fitToRange(cr, 0, Math.min(w / 2, h / 2));

				let x = this.get("pointerX", 0);
				let y = this.get("pointerY", 0);
				let bwh = this.get("pointerBaseWidth", 15) / 2;

				// corner coordinates
				// top left
				let xtl = 0;
				let ytl = 0;
				// top right
				let xtr = w;
				let ytr = 0;
				// bottom right
				let xbr = w;
				let ybr = h;
				// bottom left
				let xbl = 0;
				let ybl = h;

				// find stem base side: http://$math.stackexchange.com/questions/274712/calculate-on-which-side-of-straign-line-is-dot-located
				// d=(x−x1)(y2−y1)−(y−y1)(x2−x1)
				let d1 = (x - xtl) * (ybr - ytl) - (y - ytl) * (xbr - xtl);
				let d2 = (x - xbl) * (ytr - ybl) - (y - ybl) * (xtr - xbl);

				const display = this._display;
				// top
				display.moveTo(cr, 0);

				if (d1 > 0 && d2 > 0) {
					let stemX = Math.round($math.fitToRange(x, cr + bwh, w - bwh - cr));
					y = $math.fitToRange(y, -Infinity, 0);

					display.lineTo(stemX - bwh, 0);
					display.lineTo(x, y);
					display.lineTo(stemX + bwh, 0);
				}

				display.lineTo(w - cr, 0);
				display.arcTo(w, 0, w, cr, cr);

				// right
				if (d1 > 0 && d2 < 0) {
					let stemY = Math.round($math.fitToRange(y, cr + bwh, h - bwh - cr));
					x = $math.fitToRange(x, w, Infinity);
					display.lineTo(w, cr);
					display.lineTo(w, Math.max(stemY - bwh, cr));
					display.lineTo(x, y);
					display.lineTo(w, stemY + bwh);
				}
				display.lineTo(w, h - cr);
				display.arcTo(w, h, w - cr, h, cr);

				// bottom
				if (d1 < 0 && d2 < 0) {
					let stemX = Math.round($math.fitToRange(x, cr + bwh, w - bwh - cr));
					y = $math.fitToRange(y, h, Infinity);

					display.lineTo(w - cr, h);
					display.lineTo(stemX + bwh, h);
					display.lineTo(x, y);
					display.lineTo(stemX - bwh, h);
				}
				display.lineTo(cr, h)
				display.arcTo(0, h, 0, h - cr, cr);


				// left
				if (d1 < 0 && d2 > 0) {
					let stemY = Math.round($math.fitToRange(y, cr + bwh, h - cr - bwh));
					x = $math.fitToRange(x, -Infinity, 0);
					display.lineTo(0, h - cr);
					display.lineTo(0, stemY + bwh);
					display.lineTo(x, y);
					display.lineTo(0, Math.max(stemY - bwh, cr));
				}
				display.lineTo(0, cr);
				display.arcTo(0, 0, cr, 0, cr);
				display.closePath();
			}
		}
	}
}
