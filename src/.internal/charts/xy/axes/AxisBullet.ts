import type { Root } from "../../../core/Root";
import { Container, IContainerSettings, IContainerPrivate } from "../../../core/render/Container";
import type { Template } from "../../../core/util/Template";


export interface IAxisBulletSettings extends IContainerSettings {

	/**
	 * Relative location of the bullet within the cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 */
	location?: number;
}

export interface IAxisBulletPrivate extends IContainerPrivate {
}

/**
 * Draws a bullet on an axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/#Axis_bullets} for more info
 */
export class AxisBullet extends Container {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: AxisBullet["_settings"], template?: Template<AxisBullet>): AxisBullet {
		const x = new AxisBullet(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IAxisBulletSettings;
	declare public _privateSettings: IAxisBulletPrivate;

	public static className: string = "AxisBullet";
	public static classNames: Array<string> = Container.classNames.concat([AxisBullet.className]);
}
