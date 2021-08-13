import type { IGradient } from "../backend/Renderer";
import type { Sprite } from "../Sprite";
import type { Root } from "../../Root";
import type { Percent } from "../../util/Percent";
import type { Template } from "../../util/Template";

import { Gradient, IGradientSettings, IGradientPrivate } from "./Gradient";
import { Color } from "../../util/Color";

import * as $array from "../../util/Array";
import * as $type from "../../util/Type";


export interface IRadialGradientSettings extends IGradientSettings {

	/**
	 * Gradient radius in pixels or percent (relative to the `target`).
	 */
	radius?: number | Percent;

	/**
	 * X position.
	 */
	x?: number | Percent;

	/**
	 * Y position.
	 */
	y?: number | Percent;

}

export interface IRadialGradientPrivate extends IGradientPrivate {
}

/**
 * Radial gradient.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more info
 */
export class RadialGradient extends Gradient {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: RadialGradient["_settings"], template?: Template<RadialGradient>): RadialGradient {
		const x = new RadialGradient(root, settings, true, template);
		x._afterNew();
		return x;
	}

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
			x = 0;
			y = 0;
		}
		else {
			radius = Math.min(width, height) / 2;
			x = width / 2;
			y = height / 2;
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
