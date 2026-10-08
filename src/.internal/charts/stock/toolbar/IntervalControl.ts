import type { IDropdownListItem } from "./DropdownList";
import type { TimeUnit } from "../../../core/util/Time";

import { DropdownListControl, IDropdownListControlSettings, IDropdownListControlPrivate, IDropdownListControlEvents } from "./DropdownListControl";
import { StockIcons } from "./StockIcons";

export interface IIntervalControlItem extends IDropdownListItem {
	/**
	 * Time unit and count of the interval.
	 */
	interval: {
		timeUnit: TimeUnit,
		count?: number
	};
}

export interface IIntervalControlSettings extends IDropdownListControlSettings {
	currentItem?: string | IIntervalControlItem;
	items?: Array<string | IIntervalControlItem>;
}

export interface IIntervalControlPrivate extends IDropdownListControlPrivate {
}

export interface IIntervalControlEvents extends IDropdownListControlEvents {
}

/**
 * A dropdown control for picking the data interval of a [[StockChart]], such
 * as 1 day or 1 week. Applying the picked interval is up to a `selected`
 * event handler.
 */
export class IntervalControl extends DropdownListControl {
	public static className: string = "IntervalControl";
	public static classNames: Array<string> = DropdownListControl.classNames.concat([IntervalControl.className]);

	declare public _settings: IIntervalControlSettings;
	declare public _privateSettings: IIntervalControlPrivate;
	declare public _events: IIntervalControlEvents;

	protected _getDefaultIcon(): SVGElement {
		return StockIcons.getIcon("Interval");
	}

}