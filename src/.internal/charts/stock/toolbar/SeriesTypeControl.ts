import { DropdownListControl, IDropdownListControlSettings, IDropdownListControlPrivate, IDropdownListControlEvents } from "./DropdownListControl";

export interface ISeriesTypeControlSettings extends IDropdownListControlSettings {
}

export interface ISeriesTypeControlPrivate extends IDropdownListControlPrivate {
}

export interface ISeriesTypeControlEvents extends IDropdownListControlEvents {
}

/**
 * A dropdown control for picking the type of the main series of a
 * [[StockChart]], such as line or candles. Applying the picked type is up to a
 * `selected` event handler.
 */
export class SeriesTypeControl extends DropdownListControl {
	public static className: string = "SeriesTypeControl";
	public static classNames: Array<string> = DropdownListControl.classNames.concat([SeriesTypeControl.className]);

	declare public _settings: ISeriesTypeControlSettings;
	declare public _privateSettings: ISeriesTypeControlPrivate;
	declare public _events: ISeriesTypeControlEvents;

}