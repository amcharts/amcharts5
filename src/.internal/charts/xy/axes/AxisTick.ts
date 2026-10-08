import type { IPoint } from "../../../core/util/IPoint";

import { Tick, ITickSettings, ITickPrivate } from "../../../core/render/Tick";


export interface IAxisTickSettings extends ITickSettings {

	/**
	 * Where the tick sits within its cell, from `0` (start) to `1` (end). A
	 * cell is a category, a date period, or the span of an axis range.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Location_of_axis_elements} for more info
	 * @default 0.5
	 */
	location?: number;

	/**
	 * Used instead of `location` when a grid step spans several units, such
	 * as 5 days, or when only every few categories get a tick.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Multi_location} for more info
	 * @default 0
	 */
	multiLocation?: number;

	/**
	 * Draws the tick inside the plot area. If not set, the renderer's `inside`
	 * applies.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Labels_ticks_inside_plot_area} for more info
	 */
	inside?: boolean | undefined;

	/**
	 * Hides the tick when it is closer to the start of the visible part of the
	 * axis than this, from `0` to `1`: `0.1` hides ticks in the first 10%.
	 *
	 * @default 0
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Start_end_labels_and_ticks} for more info
	 */
	minPosition?: number;

	/**
	 * Hides the tick when it is closer to the end of the visible part of the
	 * axis than this, from `0` to `1`: `0.9` hides ticks in the last 10%.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Start_end_labels_and_ticks} for more info
	 * @default 1
	 */
	maxPosition?: number;

}

export interface IAxisTickPrivate extends ITickPrivate {
}

/**
 * A tick mark on an axis. Ticks are hidden by default.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Ticks} for more info
 * @important
 */
export class AxisTick extends Tick {

	declare public _settings: IAxisTickSettings;
	declare public _privateSettings: IAxisTickPrivate;

	protected _tickPoints: Array<IPoint> = [];

	public static className: string = "AxisTick";
	public static classNames: Array<string> = Tick.classNames.concat([AxisTick.className]);
}
