import type { Series } from "./Series";

import { Chart, IChartSettings, IChartPrivate, IChartEvents } from "./Chart";
import { Container } from "../../core/render/Container";
import { List } from "../../core/util/List";
import { p100 } from "../../core/util/Percent";

export interface ISerialChartSettings extends IChartSettings {
}

export interface ISerialChartPrivate extends IChartPrivate {
}

export interface ISerialChartEvents extends IChartEvents {
}

/**
 * A base class for all series-based charts.
 */
export abstract class SerialChart extends Chart {
	public static className: string = "SerialChart";
	public static classNames: Array<string> = Chart.classNames.concat([SerialChart.className]);

	declare public _settings: ISerialChartSettings;
	declare public _privateSettings: ISerialChartPrivate;
	declare public _seriesType: Series;
	declare public _events: ISerialChartEvents;

	/**
	 * A [[Container]] where chart will store all series.
	 *
	 * @default Container.new()
	 */
	public readonly seriesContainer: Container = Container.new(this._root, { width: p100, height: p100, isMeasured:false });

	/**
	 * A list of chart's series.
	 */
	public readonly series: List<this["_seriesType"]> = new List();

	protected _afterNew() {
		super._afterNew();

		const seriesContainer = this.seriesContainer;

		this._disposers.push(this.series.events.onAll((change) => {
			if (change.type === "clear") {
				this.series.each((series) => {
					seriesContainer.children.removeValue(series);
				})
			} else if (change.type === "push") {
				seriesContainer.children.moveValue(change.newValue);
				this._processSeries(change.newValue);
			} else if (change.type === "setIndex") {
				seriesContainer.children.setIndex(change.index, change.newValue);
				this._processSeries(change.newValue);
			} else if (change.type === "insertIndex") {
				seriesContainer.children.insertIndex(change.index, change.newValue);
				this._processSeries(change.newValue);
			} else if (change.type === "removeIndex") {
				seriesContainer.children.removeIndex(change.index);
			} else {
				throw new Error("Unknown IListEvent type");
			}
		}));
	}

	protected _processSeries(series: this["_seriesType"]) {
		series.chart = this;
		series._placeBulletsContainer(this);
	}

	protected _removeSeries(series:this["_seriesType"]){
		series._removeBulletsContainer();
	}
}
