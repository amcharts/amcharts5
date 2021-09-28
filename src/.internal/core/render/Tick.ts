import { Line, ILineSettings, ILinePrivate } from "./Line";


export interface ITickSettings extends ILineSettings {

	/**
	 * Length in pixels.
	 */
	length?: number;

	/**
	 * Location within target space. 0 - beginning, 1 - end.
	 */
	location?: number;

}

export interface ITickPrivate extends ILinePrivate {
}

/**
 * Draws a tick element (mostly used on axes).
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 */
export class Tick extends Line {

	declare public _settings: ITickSettings;
	declare public _privateSettings: ITickPrivate;

	public static className: string = "Tick";
	public static classNames: Array<string> = Line.classNames.concat([Tick.className]);
}
