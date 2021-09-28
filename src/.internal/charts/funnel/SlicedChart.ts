import { PercentChart, IPercentChartPrivate, IPercentChartSettings } from "../percent/PercentChart";
import type { PercentSeries } from "../percent/PercentSeries";


export interface ISlicedChartSettings extends IPercentChartSettings {
}

export interface ISlicedChartPrivate extends IPercentChartPrivate {
}

/**
 * Creates a sliced chart for use with [[FunnelSeries]], [[PyramidSeries]], or [[PictorialStackedSeries]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/} for more info
 * @important
 */
export class SlicedChart extends PercentChart {
	protected _afterNew() {
		super._afterNew();

		this.seriesContainer.setAll({ isMeasured:true, layout: this._root.horizontalLayout });
	}

	public static className: string = "SlicedChart";
	public static classNames: Array<string> = PercentChart.classNames.concat([SlicedChart.className]);

	declare public _settings: ISlicedChartSettings;
	declare public _privateSettings: ISlicedChartPrivate;
	declare public _seriesType: PercentSeries;
}
