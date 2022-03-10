import { Label, ILabelSettings, ILabelPrivate } from "../../../core/render/Label";
import type { IPoint } from "../../../core/util/IPoint";

export interface IAxisLabel extends Label {

	/**
	 * Relative location of the label within the cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Location_of_axis_elements} for more info
	 */
	location?: number;

	/**
	 * Relative location of the label within the cell when it spans multiple
	 * intervals.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Multi_location} for more info
	 */
	multiLocation?: number;

	/**
	 * If set to `true` the label will be shown inside plot area.
	 *
	 * @default false
	 */
	inside?: boolean | undefined;

	/**
	 * The minimum relative position within visible axis scope the label can
	 * appear on.
	 *
	 * E.g. `0.1` will mean that label will not be shown if it's closer to the
	 * beginning of the axis than 10%.
	 *
	 * @default 0
	 */
	minPosition?: number;

	/**
	 * The maximum relative position within visible axis scope the label can
	 * appear on.
	 *
	 * E.g. `0.9` will mean that label will not be shown if it's closer to the
	 * end of the axis than 10%.
	 *
	 * @default 0
	 */
	maxPosition?: number;

	_tickPoints: Array<IPoint>;
}


export interface IAxisLabelSettings extends ILabelSettings {

	/**
	 * Relative location of the label within the cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Location_of_axis_elements} for more info
	 */
	location?: number;

	/**
	 * Relative location of the label within the cell when it spans multiple
	 * intervals.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Multi_location} for more info
	 */
	multiLocation?: number;

	/**
	 * If set to `true` the label will be shown inside plot area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Labels_ticks_inside_plot_area} for more info
	 * @default false
	 */
	inside?: boolean | undefined;

	/**
	 * The minimum relative position within visible axis scope the label can
	 * appear on.
	 *
	 * E.g. `0.1` will mean that label will not be shown if it's closer to the
	 * beginning of the axis than 10%.
	 *
	 * @default 0
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Start_end_labels_and_ticks} for more info
	 */
	minPosition?: number;

	/**
	 * The maximum relative position within visible axis scope the label can
	 * appear on.
	 *
	 * E.g. `0.9` will mean that label will not be shown if it's closer to the
	 * end of the axis than 10%.
	 *
	 * @default 1
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Start_end_labels_and_ticks} for more info
	 */
	maxPosition?: number;

}

export interface IAxisLabelPrivate extends ILabelPrivate {
}

/**
 * Draws an axis label.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Labels} for more info
 * @important
 */
export class AxisLabel extends Label implements IAxisLabel {

	declare public _settings: IAxisLabelSettings;
	declare public _privateSettings: IAxisLabelPrivate;

	public _tickPoints: Array<IPoint> = [];

	public static className: string = "AxisLabel";
	public static classNames: Array<string> = Label.classNames.concat([AxisLabel.className]);
}
