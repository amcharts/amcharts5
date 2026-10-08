import type { IDropdownListItem } from "./DropdownList";

import { DropdownListControl, IDropdownListControlSettings, IDropdownListControlPrivate, IDropdownListControlEvents } from "./DropdownListControl";
import { StockIcons } from "./StockIcons";

export interface IComparisonControlSettings extends IDropdownListControlSettings {
	items?: Array<string | IDropdownListItem>;
}

export interface IComparisonControlPrivate extends IDropdownListControlPrivate {
}

export interface IComparisonControlEvents extends IDropdownListControlEvents {
}

/**
 * A dropdown control for picking series to compare with the main series of a
 * [[StockChart]]. Adding the picked series is up to a `selected` event
 * handler, usually with `addComparingSeries()`.
 */
export class ComparisonControl extends DropdownListControl {
	public static className: string = "ComparisonControl";
	public static classNames: Array<string> = DropdownListControl.classNames.concat([ComparisonControl.className]);

	declare public _settings: IComparisonControlSettings;
	declare public _privateSettings: IComparisonControlPrivate;
	declare public _events: IComparisonControlEvents;

	protected _getDefaultIcon(): SVGElement {
		return StockIcons.getIcon("Comparison");
	}

}