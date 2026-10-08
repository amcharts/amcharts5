import { Graphics, IGraphicsPrivate, IGraphicsSettings } from "../../../core/render/Graphics";

export interface IGridSettings extends IGraphicsSettings {

	/**
	 * Where the grid line sits within its cell, from `0` (start) to `1` (end).
	 * A cell is a category, a date period, or the span of an axis range.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Location_of_axis_elements} for more info
	 * @default 0
	 */
	location?: number;

}

export interface IGridPrivate extends IGraphicsPrivate {
}

/**
 * A grid line of an axis, drawn across the plot area.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Grid} for more info
 * @important
 */
export class Grid extends Graphics {

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
