import type { IPoint } from "../../../core/util/IPoint";

import { Label, ILabelSettings, ILabelPrivate } from "../../../core/render/Label";

export interface IAxisLabel extends Label {

	/**
	 * Where the label sits within its cell, from `0` (start) to `1` (end). A
	 * cell is a category, a date period, or the span of an axis range.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#location-of-axis-elements} for more info
	 */
	location?: number;

	/**
	 * Used instead of `location` when a grid step spans several units, such
	 * as 5 days, or when only every few categories get a label.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#multi-location} for more info
	 */
	multiLocation?: number;

	/**
	 * Shows the label inside the plot area. If not set, the renderer's
	 * `inside` applies.
	 */
	inside?: boolean | undefined;

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

	_tickPoints: Array<IPoint>;
}


export interface IAxisLabelSettings extends ILabelSettings {

	/**
	 * Where the label sits within its cell, from `0` (start) to `1` (end). A
	 * cell is a category, a date period, or the span of an axis range.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#location-of-axis-elements} for more info
	 * @default 0.5
	 */
	location?: number;

	/**
	 * Used instead of `location` when a grid step spans several units, such
	 * as 5 days, or when only every few categories get a label.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#multi-location} for more info
	 * @default 0
	 */
	multiLocation?: number;

	/**
	 * Shows the label inside the plot area. If not set, the renderer's
	 * `inside` applies.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#labelsticks-inside-plot-area} for more info
	 */
	inside?: boolean | undefined;

	/**
	 * Hides the label when it is closer to the start of the visible part of
	 * the axis than this, from `0` to `1`: `0.1` hides labels in the first 10%.
	 *
	 * @default 0
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#startend-labels-and-ticks} for more info
	 */
	minPosition?: number;

	/**
	 * Hides the label when it is closer to the end of the visible part of the
	 * axis than this, from `0` to `1`: `0.9` hides labels in the last 10%.
	 *
	 * @default 1
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#startend-labels-and-ticks} for more info
	 */
	maxPosition?: number;

}

export interface IAxisLabelPrivate extends ILabelPrivate {
}

/**
 * A label on an axis, such as a category name or a value.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#labels} for more info
 * @important
 */
export class AxisLabel extends Label implements IAxisLabel {

	declare public _settings: IAxisLabelSettings;
	declare public _privateSettings: IAxisLabelPrivate;

	public _tickPoints: Array<IPoint> = [];

	public static className: string = "AxisLabel";
	public static classNames: Array<string> = Label.classNames.concat([AxisLabel.className]);
}
