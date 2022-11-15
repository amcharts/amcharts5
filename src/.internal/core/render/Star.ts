import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import type { Percent } from "../../core/util/Percent";
import * as $utils from "../../core/util/Utils";

export interface IStarSettings extends IGraphicsSettings {

	/**
	 * Star's radius in pixels.
	 */
	radius?: number;

	/**
	 * Star's inner radius in pixels.
	 */
	innerRadius?: number | Percent;

	/**
	 * Number of spikes
	 */
	spikes?: number;

}

export interface IStarPrivate extends IGraphicsPrivate {
}

/**
 * Draws a Star.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Star extends Graphics {

	declare public _settings: IStarSettings;
	declare public _privateSettings: IStarPrivate;

	public static className: string = "Star";
	public static classNames: Array<string> = Graphics.classNames.concat([Star.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("radius") || this.isDirty("innerRadius") || this.isDirty("spikes")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			const display = this._display;
			const r = this.get("radius", 0);
			const ir = $utils.relativeToValue(this.get("innerRadius", 0), r);
			const spikes = this.get("spikes", 0);
			const step = Math.PI / spikes;
			let angle = Math.PI / 2 * 3;

			display.moveTo(0, - r)

			for (let i = 0; i < spikes; i++) {
				display.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
				angle += step

				display.lineTo(Math.cos(angle) * ir, Math.sin(angle) * ir)
				angle += step
			}
			display.lineTo(0, -r)
			display.closePath();
		}
	}
}
