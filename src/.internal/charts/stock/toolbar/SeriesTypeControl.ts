import { DropdownListControl, IDropdownListControlSettings, IDropdownListControlPrivate, IDropdownListControlEvents } from "./DropdownListControl";

export interface ISeriesTypeControlSettings extends IDropdownListControlSettings {
}

export interface ISeriesTypeControlPrivate extends IDropdownListControlPrivate {
}

export interface ISeriesTypeControlEvents extends IDropdownListControlEvents {
}

/**
 * A control that is used to change type of the main series of the [[StockChart]].
 */
export class SeriesTypeControl extends DropdownListControl {
	public static className: string = "SeriesTypeControl";
	public static classNames: Array<string> = DropdownListControl.classNames.concat([SeriesTypeControl.className]);

	declare public _settings: ISeriesTypeControlSettings;
	declare public _privateSettings: ISeriesTypeControlPrivate;
	declare public _events: ISeriesTypeControlEvents;

}