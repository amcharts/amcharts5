import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "./Graphics";
import * as $type from "../util/Type";
import { Percent } from "../util/Percent";
import type { IPoint } from "../util/IPoint";
import { arc } from "d3-shape";
import * as $math from "../util/Math";

export interface ISliceSettings extends IGraphicsSettings {

	/**
	 * Outer radius in pixels.
	 */
	radius?: number;

	/**
	 * Size of the slice in degrees, clockwise from `startAngle`. A negative
	 * value runs counterclockwise.
	 */
	arc?: number;

	/**
	 * Inner radius in pixels. A negative value is measured inwards from
	 * `radius`.
	 */
	innerRadius?: number;

	/**
	 * Start angle in degrees: `0` points right, and angles run clockwise.
	 */
	startAngle?: number;

	/**
	 * Corner radius in pixels.
	 */
	cornerRadius?: number;

	/**
	 * How far in pixels the slice is pulled out from the center, along its
	 * middle angle.
	 *
	 * @default 0
	 */
	shiftRadius?: number;

	/**
	 * Pixels added to `radius`; can be negative.
	 *
	 * @default 0
	 */
	dRadius?: number;

	/**
	 * Pixels added to `innerRadius`; can be negative.
	 *
	 * @default 0
	 */
	dInnerRadius?: number;

}

export interface ISlicePrivate extends IGraphicsPrivate {
}

/**
 * A slice of a circle or ring, as in a pie chart.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/graphics/} for more info
 */
export class Slice extends Graphics {

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

	public _getTooltipPoint(): IPoint {
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
		let innerRadius = this.get("innerRadius", 0);

		let dRadius = this.get("dRadius", 0);
		let dInnerRadius = this.get("dInnerRadius", 0);

		radius += dRadius;
		innerRadius += dInnerRadius;

		if (innerRadius < 0) {
			innerRadius = radius + innerRadius;
		}

		if (tooltipX instanceof Percent) {
			x = this.ix * (innerRadius + (radius - innerRadius) * tooltipX.value)
		}

		if (tooltipY instanceof Percent) {
			y = this.iy * (innerRadius + (radius - innerRadius) * tooltipY.value)
		}

		if (this.get("arc") >= 360 && innerRadius == 0) {
			x = 0;
			y = 0;
		}


		return { x, y };
	}
	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("radius") || this.isDirty("arc") || this.isDirty("innerRadius") || this.isDirty("startAngle") || this.isDirty("dRadius") || this.isDirty("dInnerRadius") || this.isDirty("cornerRadius") || this.isDirty("shiftRadius")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			let startAngle = this.get("startAngle", 0);
			let arc = this.get("arc", 0);
			const generator = this._generator;

			if(arc < 0){
				startAngle = startAngle + arc;
				arc = arc * -1;
			}

			if(arc > 0.1){ // this fixes bug with full circle when arc is very small
				generator.cornerRadius(this.get("cornerRadius", 0));
			}
			generator.context(this._display as any);

			let radius = this.get("radius", 0);
			let innerRadius = this.get("innerRadius", 0);

			let dRadius = this.get("dRadius", 0);
			let dInnerRadius = this.get("dInnerRadius", 0);

			radius += dRadius;
			innerRadius += dInnerRadius;			

			if (innerRadius < 0) {
				innerRadius = radius + innerRadius;
			}

			generator({ innerRadius: innerRadius, outerRadius: radius, startAngle: (startAngle + 90) * $math.RADIANS, endAngle: (startAngle + arc + 90) * $math.RADIANS });

			let middleAngle = startAngle + arc / 2;

			this.ix = $math.cos(middleAngle);
			this.iy = $math.sin(middleAngle);

			const shiftRadius = this.get("shiftRadius", 0);
			// the slice shifting itself out along its own angle
			this._setCRaw("dx", this.ix * shiftRadius);
			this._setCRaw("dy", this.iy * shiftRadius);			
			this.markDirtyPosition();
		}
	}
}
