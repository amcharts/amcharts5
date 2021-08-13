import { SerialChart, ISerialChartPrivate, ISerialChartSettings } from "../../core/render/SerialChart";
import type { PercentSeries } from "./PercentSeries";

export interface IPercentChartSettings extends ISerialChartSettings {
}

export interface IPercentChartPrivate extends ISerialChartPrivate {
}

export abstract class PercentChart extends SerialChart {
	public static className: string = "PercentChart";
	public static classNames: Array<string> = SerialChart.classNames.concat([PercentChart.className]);

	declare public _settings: IPercentChartSettings;
	declare public _privateSettings: IPercentChartPrivate;
	declare public _seriesType: PercentSeries;

	protected _afterNew() {
		super._afterNew();

		const seriesContainer = this.seriesContainer!;
		this.chartContainer.children.push(seriesContainer);
		seriesContainer.children.push(this.bulletsContainer);
		seriesContainer.setAll({ isMeasured: true, layout: this._root.horizontalLayout });
	}
}
