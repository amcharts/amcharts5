import type { AxisRenderer } from "../xy/axes/AxisRenderer";
import type { GanttDateAxisRenderer } from "./GanttDateAxisRenderer";
import type { Gantt } from "./Gantt";

import { DateAxis, IDateAxisSettings, IDateAxisPrivate, IDateAxisDataItem, IDateAxisEvents } from "../xy/axes/DateAxis";

export interface IGanttDateAxisSettings<R extends AxisRenderer> extends IDateAxisSettings<R> {
}

export interface IGanttDateAxisDataItem extends IDateAxisDataItem {
	/**
	 * Flag is set to active if an axis range is added to this data item.
	 */
	active?: boolean;
}

export interface IGanttDateAxisPrivate extends IDateAxisPrivate {
}

export interface IGanttDateAxisEvents extends IDateAxisEvents {
}


/**
 * A date axis that is used as an X (horizontal) axis for [[Gantt]] charts.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Timeline_horizontal_axis} for more info
 * @since 5.14.0
 * @important
 */
export class GanttDateAxis<R extends GanttDateAxisRenderer> extends DateAxis<R> {
	public static className: string = "GanttDateAxis";
	public static classNames: Array<string> = DateAxis.classNames.concat([GanttDateAxis.className]);

	declare public _settings: IGanttDateAxisSettings<R>;
	declare public _privateSettings: IGanttDateAxisPrivate;
	declare public _dataItemSettings: IGanttDateAxisDataItem;
	declare public _events: IGanttDateAxisEvents;

	/**
	 * A reference to the parent [[Gantt]] chart.
	 */
	public gantt?: Gantt;
}
