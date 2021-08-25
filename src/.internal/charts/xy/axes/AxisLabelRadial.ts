import type { Root } from "../../../core/Root";
import { RadialLabel, IRadialLabelSettings, IRadialLabelPrivate } from "../../../core/render/RadialLabel";
import type { Template } from "../../../core/util/Template";
import type { IPoint } from "../../../core/util/IPoint";

export interface IAxisLabelRadialSettings extends IRadialLabelSettings {

	/**
	 * Relative location of the label within the cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 */
	location?: number;

	/**
	 * Relative location of the label within the cell when it spans multiple
	 * intervals.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 */
	multiLocation?: number;

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

}

export interface IAxisLabelRadialPrivate extends IRadialLabelPrivate {
}

/**
 * Draws a label on a circular axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Labels} for more info
 */
export class AxisLabelRadial extends RadialLabel {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: AxisLabelRadial["_settings"], template?: Template<AxisLabelRadial>): AxisLabelRadial {
		const x = new AxisLabelRadial(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IAxisLabelRadialSettings;
	declare public _privateSettings: IAxisLabelRadialPrivate;

	public static className: string = "AxisLabelRadial";
	public static classNames: Array<string> = RadialLabel.classNames.concat([AxisLabelRadial.className]);

	public _tickPoints: Array<IPoint> = [];

}
