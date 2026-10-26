import type { IAxisLabel } from "./AxisLabel";
import type { IPoint } from "../../../core/util/IPoint";

import { EditableLabel, IEditableLabelPrivate, IEditableLabelSettings } from "../../../core/render/EditableLabel";

export interface IEditableAxisLabelSettings extends IEditableLabelSettings {
}

export interface IEditableAxisLabelPrivate extends IEditableLabelPrivate {
}


/**
 * An axis label whose text the user can edit in place, as on a Gantt chart's
 * task axis.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#labels} for more info
 * @important
 */
export class EditableAxisLabel extends EditableLabel implements IAxisLabel {

	declare public _settings: IEditableAxisLabelSettings;
	declare public _privateSettings: IEditableAxisLabelPrivate;
	public static className: string = "EditableAxisLabel";
	public static classNames: Array<string> = EditableLabel.classNames.concat([EditableAxisLabel.className]);

	public _tickPoints: Array<IPoint> = [];

}