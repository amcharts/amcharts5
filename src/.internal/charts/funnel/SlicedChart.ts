import { PercentChart, IPercentChartPrivate, IPercentChartSettings } from "../percent/PercentChart";
import type { PercentSeries } from "../percent/PercentSeries";
import type { Root } from "../../core/Root";
import type { Template } from "../../core/util/Template";


export interface ISlicedChartSettings extends IPercentChartSettings {
}

export interface ISlicedChartPrivate extends IPercentChartPrivate {
}

/**
 * Creates a sliced chart for use with [[FunnelSeries]], [[PyramidSeries]], or [[PictorialStackedSeries]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/percent-charts/pie-chart/} for more info
 * @important
 */
export class SlicedChart extends PercentChart {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: SlicedChart["_settings"], template?: Template<SlicedChart>): SlicedChart {
		const x = new SlicedChart(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "SlicedChart";
	public static classNames: Array<string> = PercentChart.classNames.concat([SlicedChart.className]);

	declare public _settings: ISlicedChartSettings;
	declare public _privateSettings: ISlicedChartPrivate;
	declare public _seriesType: PercentSeries;
}
