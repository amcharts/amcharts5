import type { Root } from "../../../core/Root";
import { Graphics, IGraphicsPrivate, IGraphicsSettings } from "../../../core/render/Graphics";
import type { Template } from "../../../core/util/Template";

export interface IGridSettings extends IGraphicsSettings {

	/**
	 * Relative location of the grid line within the cell.
	 *
	 * `0` - beginning, `0.5` - middle, `1` - end.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/#Location_of_axis_elements} for more info
	 */
	location?: number;

}

export interface IGridPrivate extends IGraphicsPrivate {
}

/**
 * Creates an axis grid line.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/#Grid} for more info
 * @important
 */
export class Grid extends Graphics {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Grid["_settings"], template?: Template<Grid>): Grid {
		const x = new Grid(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IGridSettings;
	declare public _privateSettings: IGridPrivate;

	public static className: string = "Grid";
	public static classNames: Array<string> = Graphics.classNames.concat([Grid.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isPrivateDirty("width") || this.isPrivateDirty("height")) {
			this._clear = true;
		}
	}
}
