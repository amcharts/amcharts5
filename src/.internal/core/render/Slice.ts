import type { Root } from "../Root";
import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import * as $type from "../util/Type";
import * as $utils from "../util/Utils";
import { Percent } from "../util/Percent";
import type { IPoint } from "../util/IPoint";
import { arc } from "d3-shape";
import type { Template } from "../../core/util/Template";
import * as $math from "../util/Math";

export interface ISliceSettings extends IGraphicsSettings {

	/**
	 * Radius in pixels.
	 */
	radius?: number;

	/**
	 * Slice "width" in degrees.
	 */
	arc?: number;

	/**
	 * Inner radius of the slice in pixels.
	 */
	innerRadius?: number;

	/**
	 * Start angle in degrees.
	 */
	startAngle?: number;

	/**
	 * Slice corner radius in pixels.
	 */
	cornerRadius?: number;

	/**
	 * Slice "pull out" radius in pixels.
	 */
	shiftRadius?: number;

}

export interface ISlicePrivate extends IGraphicsPrivate {
}

/**
 * Draws a slice shape.
 * 
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 */
export class Slice extends Graphics {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Slice["_settings"], template?: Template<Slice>): Slice {
		const x = new Slice(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: ISliceSettings;
	declare public _privateSettings: ISlicePrivate;

	public static className: string = "Slice";
	public static classNames: Array<string> = Graphics.classNames.concat([Slice.className]);

	/**
	 * @ignore
	 */
	public ix: number = 0;

	/**
	 * @ignore
	 */
	public iy: number = 0;

	protected _generator = arc();

	protected _getTooltipPoint(): IPoint {
		let tooltipX = this.get("tooltipX");
		let tooltipY = this.get("tooltipY");

		let x = 0;
		let y = 0;

		if ($type.isNumber(tooltipX)) {
			x = tooltipX;
		}

		if ($type.isNumber(tooltipY)) {
			y = tooltipY;
		}

		let radius = this.get("radius", 0);
		let innerRadius = $utils.relativeToValue(this.get("innerRadius", 0), radius);

		if (tooltipX instanceof Percent) {
			x = this.ix * (innerRadius + (radius - innerRadius) * tooltipX.value)
		}

		if (tooltipY instanceof Percent) {
			y = this.iy * (innerRadius + (radius - innerRadius) * tooltipY.value)
		}

		return { x, y };
	}
	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("radius") || this.isDirty("arc") || this.isDirty("innerRadius") || this.isDirty("startAngle") || this.isDirty("cornerRadius")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			const startAngle = this.get("startAngle", 0);
			const arc = this.get("arc", 0);
			const generator = this._generator;
			generator.cornerRadius(this.get("cornerRadius", 0));
			generator.context(this._display as any);
			generator({ innerRadius: this.get("innerRadius", 0), outerRadius: this.get("radius", 0), startAngle: (startAngle + 90) * $math.RADIANS, endAngle: (startAngle + arc + 90) * $math.RADIANS });

			let middleAngle = startAngle + arc / 2;

			this.ix = $math.cos(middleAngle);
			this.iy = $math.sin(middleAngle);
		}

		if (this.isDirty("shiftRadius")) {
			const shiftRadius = this.get("shiftRadius", 0);
			this.setRaw("dx", this.ix * shiftRadius);
			this.setRaw("dy", this.iy * shiftRadius);
			this.markDirtyPosition();
		}
	}
}
