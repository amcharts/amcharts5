import { AxisRendererX, IAxisRendererXSettings, IAxisRendererXPrivate } from "../xy/axes/AxisRendererX";

export interface IGanttDateAxisRendererSettings extends IAxisRendererXSettings {
}

export interface IGanttDateAxisRendererPrivate extends IAxisRendererXPrivate {
}

/**
 * Renderer for [[GanttDateAxis]] axes.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/gantt/#Category_vertical_axis} for more info
 * @since 5.14.0
 * @important
 */
export class GanttDateAxisRenderer extends AxisRendererX {
	public static className: string = "GanttDateAxisRenderer";
	public static classNames: Array<string> = AxisRendererX.classNames.concat([GanttDateAxisRenderer.className]);

	declare public _settings: IGanttDateAxisRendererSettings;
	declare public _privateSettings: IGanttDateAxisRendererPrivate;
}
