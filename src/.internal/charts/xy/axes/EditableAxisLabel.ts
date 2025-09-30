import type { IAxisLabel } from "./AxisLabel";
import type { IPoint } from "../../../core/util/IPoint";

import { EditableLabel, IEditableLabelPrivate, IEditableLabelSettings } from "../../../core/render/EditableLabel";

export interface IEditableAxisLabelSettings extends IEditableLabelSettings {
}

export interface IEditableAxisLabelPrivate extends IEditableLabelPrivate {
}


/**
 * Draws an axis label.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Labels} for more info
 * @important
 */
export class EditableAxisLabel extends EditableLabel implements IAxisLabel {

	declare public _settings: IEditableAxisLabelSettings;
	declare public _privateSettings: IEditableAxisLabelPrivate;
	public static className: string = "EditableAxisLabel";
	public static classNames: Array<string> = EditableLabel.classNames.concat([EditableAxisLabel.className]);

	public _tickPoints: Array<IPoint> = [];

}