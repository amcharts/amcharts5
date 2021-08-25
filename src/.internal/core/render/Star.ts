import type { Root } from "../Root";
import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import type { Template } from "../../core/util/Template";

export interface IStarSettings extends IGraphicsSettings {

	/**
	 * Star's radius in pixels.
	 */
	radius?: number;

	/**
	 * Star's inner radius in pixels.
	 */
	innerRadius?: number;

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

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Star["_settings"], template?: Template<Star>): Star {
		const x = new Star(root, settings, true, template);
		x._afterNew();
		return x;
	}

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
			const ir = this.get("innerRadius", 0);
			const spikes = this.get("spikes", 0);
			const step = Math.PI / spikes;
			let angle = Math.PI / 2 * 3;

			console.log(spikes, step)

			display.moveTo(0, - r)

			for (let i = 0; i < spikes; i++) {
				display.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
				angle += step

				display.lineTo(Math.cos(angle) * ir, Math.sin(angle) * ir)
				angle += step
			}
			display.lineTo(0, -r)
		}
	}
}
