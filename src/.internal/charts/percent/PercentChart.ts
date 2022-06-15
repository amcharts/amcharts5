import type { PercentSeries } from "./PercentSeries";
import { SerialChart, ISerialChartPrivate, ISerialChartSettings } from "../../core/render/SerialChart";
import { PercentDefaultTheme } from "./PercentDefaultTheme";

export interface IPercentChartSettings extends ISerialChartSettings {
}

export interface IPercentChartPrivate extends ISerialChartPrivate {
}

/**
 * Base class for [[PieChart]].
 *
 * Also used for percent-based series, like [[FunnelSeries]], [[PyramidSeries]], etc.
 *
 * @important
 */
export abstract class PercentChart extends SerialChart {
	public static className: string = "PercentChart";
	public static classNames: Array<string> = SerialChart.classNames.concat([PercentChart.className]);

	declare public _settings: IPercentChartSettings;
	declare public _privateSettings: IPercentChartPrivate;
	declare public _seriesType: PercentSeries;

	protected _afterNew() {
		this._defaultThemes.push(PercentDefaultTheme.new(this._root));

		super._afterNew();

		this.chartContainer.children.push(this.seriesContainer);
		this.seriesContainer.children.push(this.bulletsContainer);
	}

	protected _processSeries(series: this["_seriesType"]) {
		super._processSeries(series);
		this.seriesContainer.children.moveValue(this.bulletsContainer, this.seriesContainer.children.length - 1);	
	}	
}
