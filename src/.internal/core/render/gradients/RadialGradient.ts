import type { IGradient } from "../backend/Renderer";
import type { Sprite } from "../Sprite";
import type { Percent } from "../../util/Percent";

import { Gradient, IGradientSettings, IGradientPrivate } from "./Gradient";
import { Color } from "../../util/Color";

import * as $array from "../../util/Array";
import * as $type from "../../util/Type";
import * as $utils from "../../util/Utils";


export interface IRadialGradientSettings extends IGradientSettings {

	/**
	 * Gradient radius in pixels or percent (relative to the `target`).
	 */
	radius?: number | Percent;

	/**
	 * Horizontal position of the gradient's center, in pixels or as a percent
	 * of the element's width.
	 */
	x?: number | Percent;

	/**
	 * Vertical position of the gradient's center, in pixels or as a percent of
	 * the element's height.
	 */
	y?: number | Percent;

}

export interface IRadialGradientPrivate extends IGradientPrivate {
}

/**
 * A gradient that changes color outward from a center point.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more info
 */
export class RadialGradient extends Gradient {

	declare public _settings: IRadialGradientSettings;
	declare public _privateSettings: IRadialGradientPrivate;

	public static className: string = "RadialGradient";
	public static classNames: Array<string> = Gradient.classNames.concat([RadialGradient.className]);

	/**
	 * @ignore
	 */
	public getFill(target: Sprite): IGradient {
		const bounds = this.getBounds(target);

		let x = 0;
		let y = 0;

		let l = bounds.left || 0;
		let r = bounds.right || 0;
		let t = bounds.top || 0;
		let b = bounds.bottom || 0;

		const width = r - l;
		const height = b - t;

		let radius = target.get("radius" as any);
		if ($type.isNumber(radius)) {
			// Drawn around its origin
			l = 0;
			t = 0;
		}
		else {
			radius = Math.min(width, height) / 2;
			x = l + width / 2;
			y = t + height / 2;
		}

		// Pixels are in the element's own space; a percent is across its bounds
		let ux = this.get("x");
		let uy = this.get("y");
		if (ux != null) {
			x = $type.isNumber(ux) ? ux : l + $utils.relativeToValue(ux, width);
		}

		if (uy != null) {
			y = $type.isNumber(uy) ? uy : t + $utils.relativeToValue(uy, height);
		}

		const gradient = this._root._renderer.createRadialGradient(x, y, 0, x, y, radius);
		const stops = this.get("stops")!;
		if (stops) {
			let i = 0;
			$array.each(stops, (stop) => {

				let offset = stop.offset;

				if (!$type.isNumber(offset)) {
					offset = i / (stops.length - 1);
				}

				let opacity = stop.opacity;

				if (!$type.isNumber(opacity)) {
					opacity = 1;
				}

				let color = stop.color;

				if (color) {

					const lighten = stop.lighten;
					if (lighten) {
						color = Color.lighten(color, lighten)
					}

					const brighten = stop.brighten;
					if (brighten) {
						color = Color.brighten(color, brighten)
					}

					gradient.addColorStop(offset, 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + opacity + ')');
				}
				i++;
			})
		}

		return gradient
	}
}
