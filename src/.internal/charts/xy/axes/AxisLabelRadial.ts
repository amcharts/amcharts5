import type { IPoint } from "../../../core/util/IPoint";

import { RadialLabel, IRadialLabelSettings, IRadialLabelPrivate } from "../../../core/render/RadialLabel";

export interface IAxisLabelRadialSettings extends IRadialLabelSettings {

	/**
	 * Where the label sits within its cell, from `0` (start) to `1` (end). A
	 * cell is a category, a date period, or the span of an axis range.
	 */
	location?: number;

	/**
	 * Used instead of `location` when a grid step spans several units, such
	 * as 5 days, or when only every few categories get a label.
	 */
	multiLocation?: number;

	/**
	 * Hides the label when it is closer to the start of the visible part of
	 * the axis than this, from `0` to `1`: `0.1` hides labels in the first 10%.
	 *
	 * @default 0
	 */
	minPosition?: number;

	/**
	 * Hides the label when it is closer to the end of the visible part of the
	 * axis than this, from `0` to `1`: `0.9` hides labels in the last 10%.
	 *
	 * @default 1
	 */
	maxPosition?: number;

}

export interface IAxisLabelRadialPrivate extends IRadialLabelPrivate {
}

/**
 * Draws a label on a circular axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Labels} for more info
 */
export class AxisLabelRadial extends RadialLabel {

	declare public _settings: IAxisLabelRadialSettings;
	declare public _privateSettings: IAxisLabelRadialPrivate;

	public static className: string = "AxisLabelRadial";
	public static classNames: Array<string> = RadialLabel.classNames.concat([AxisLabelRadial.className]);

	public _tickPoints: Array<IPoint> = [];

}
