import type { PercentSeries } from "../percent/PercentSeries";

import { PercentChart, IPercentChartPrivate, IPercentChartSettings } from "../percent/PercentChart";


export interface ISlicedChartSettings extends IPercentChartSettings {
}

export interface ISlicedChartPrivate extends IPercentChartPrivate {
}

/**
 * A chart for [[FunnelSeries]], [[PyramidSeries]] and
 * [[PictorialStackedSeries]]. Several series in it sit side by side.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/percent-charts/sliced-chart/} for more info
 * @important
 */
export class SlicedChart extends PercentChart {
	protected _afterNew() {
		super._afterNew();

		this.seriesContainer.setAll({ isMeasured: true, layout: this._root.horizontalLayout });
	}

	public static className: string = "SlicedChart";
	public static classNames: Array<string> = PercentChart.classNames.concat([SlicedChart.className]);

	declare public _settings: ISlicedChartSettings;
	declare public _privateSettings: ISlicedChartPrivate;
	declare public _seriesType: PercentSeries;
}
