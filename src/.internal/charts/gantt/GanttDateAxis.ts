import type { AxisRenderer } from "../xy/axes/AxisRenderer";
import type { GanttDateAxisRenderer } from "./GanttDateAxisRenderer";
import type { Gantt } from "./Gantt";
import type { ITimeInterval } from "../../core/util/Time";

import { DateAxis, IDateAxisSettings, IDateAxisPrivate, IDateAxisDataItem, IDateAxisEvents } from "../xy/axes/DateAxis";

import * as $time from "../../core/util/Time";
import * as $type from "../../core/util/Type";
import * as $array from "../../core/util/Array";

export interface IGanttDateAxisSettings<R extends AxisRenderer> extends IDateAxisSettings<R> {
}

export interface IGanttDateAxisDataItem extends IDateAxisDataItem {
	/**
	 * `true` once the user has marked this date by clicking the lower date
	 * axis. Its grid line is then hidden, so only the mark shows.
	 */
	active?: boolean;
}

export interface IGanttDateAxisPrivate extends IDateAxisPrivate {
}

export interface IGanttDateAxisEvents extends IDateAxisEvents {
}


/**
 * A date axis of a [[Gantt]] chart. The Gantt has two, both above the plot
 * area: `xAxis` with the larger time units and `xAxisMinor` below it.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/gantt/#timeline-horizontal-axis} for more info
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

	public _chooseGridInterval(duration: number, gridCount: number, intervals: Array<ITimeInterval>): ITimeInterval {
		const interval = super._chooseGridInterval(duration, gridCount, intervals);
		// a view shorter than a month gets weeks even where they are too narrow for their labels: the top row
		// takes the month, as a label stays in the part of its month in view
		if (this.gantt && this.gantt.xAxis === this && duration / $time.getIntervalDuration(interval) > this._intervalGridCount(interval, gridCount)) {
			const index = $array.findIndex(intervals, (i) => i.timeUnit == interval.timeUnit && i.count == interval.count);
			if (index != -1 && index < intervals.length - 1) {
				return { ...intervals[index + 1] };
			}
		}
		return interval;
	}

	protected _prepareAxisItems() {
		const gantt = this.gantt;
		// the row of days lays out before the main axis, so its intervals, set from the one the main axis chose for
		// the last range, could give it an item for every day of a new, longer one: it takes the one about to be chosen
		if (gantt && gantt.xAxisMinor === this && gantt.xAxis) {
			const main = gantt.xAxis;
			const intervals = gantt.get("gridIntervals");
			const mainIntervals = main.get("gridIntervals");
			const min = this.getPrivate("selectionMin");
			const max = this.getPrivate("selectionMax");
			if (intervals && mainIntervals && $type.isNumber(min) && $type.isNumber(max)) {
				let interval = main._chooseGridInterval(Math.round(max) - Math.round(min), main.get("renderer").gridCount(), mainIntervals);
				if ($time.getIntervalDuration(interval) < main.baseDuration()) {
					interval = main.getPrivate("baseInterval");
				}
				const own = intervals[interval.timeUnit];
				if (own && own !== this.get("gridIntervals")) {
					this._setCRaw("gridIntervals", own);
				}
			}
		}
		super._prepareAxisItems();
	}
}
