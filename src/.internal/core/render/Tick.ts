import type { Root } from "../Root";
import { Line, ILineSettings, ILinePrivate } from "./Line";
import type { Template } from "../../core/util/Template";


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

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Tick["_settings"], template?: Template<Tick>): Tick {
		const x = new Tick(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: ITickSettings;
	declare public _privateSettings: ITickPrivate;

	public static className: string = "Tick";
	public static classNames: Array<string> = Line.classNames.concat([Tick.className]);
}
