import type { IDropdownListItem } from "./DropdownList";
import type { TimeUnit } from "../../../core/util/Time";

import { DropdownListControl, IDropdownListControlSettings, IDropdownListControlPrivate, IDropdownListControlEvents } from "./DropdownListControl";
import { StockIcons } from "./StockIcons";

export interface IIntervalControlItem extends IDropdownListItem {
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
 * A control that is used to change type of the main series of the [[StockChart]].
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