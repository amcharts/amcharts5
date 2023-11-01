import { Indicator, IIndicatorSettings, IIndicatorPrivate, IIndicatorEvents, IIndicatorEditableSetting } from "./Indicator";
import { LineSeries } from "../../xy/series/LineSeries";


export interface IZigZagSettings extends IIndicatorSettings {
	/**
	 * Percentage of price movement you want to set as your threshold
	 */
	deviation?: number;

	/**
	 * The minimum number of price bars required where there is no secondary high or low.
	 */
	depth?: number;
}

export interface IZigZagPrivate extends IIndicatorPrivate {
}

export interface IZigZagEvents extends IIndicatorEvents {
}

/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class ZigZag extends Indicator {
	public static className: string = "ZigZag";
	public static classNames: Array<string> = Indicator.classNames.concat([ZigZag.className]);

	declare public _settings: IZigZagSettings;
	declare public _privateSettings: IZigZagPrivate;
	declare public _events: IZigZagEvents;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "deviation",
		name: this.root.language.translateAny("Deviation"),
		type: "number"
	}, {
		key: "depth",
		name: this.root.language.translateAny("Depth"),
		type: "number"
	}, {
		key: "seriesColor",
		name: this.root.language.translateAny("Color"),
		type: "color"
	}];

	public _prepareChildren() {

		if (this.isDirty("deviation") || this.isDirty("depth")) {
			this._dataDirty = true;
			this.setCustomData("deviation", this.get("deviation"));
			this.setCustomData("depth", this.get("depth"));
		}

		super._prepareChildren();
	}

	protected _afterNew() {
		super._afterNew();

		const stockSeries = this.get("stockSeries");
		const chart = stockSeries.chart;

		if (chart) {
			const series = chart.series.push(LineSeries.new(this._root, {
				valueXField: "time",
				valueYField: "zigzag",
				groupDataDisabled: true,
				calculateAggregates: true,
				xAxis: stockSeries.get("xAxis"),
				yAxis: stockSeries.get("yAxis"),
				themeTags: ["indicator", "zigzag"],
				name: "ZigZag",
				snapTooltip: true
			}))
			series.setPrivate("baseValueSeries", stockSeries);
			this.series = series;

			this._handleLegend(series);
		}
	}


	/**
	 * @ignore
	 */
	public prepareData() {
		if (this.series) {
			const deviation = this.get("deviation", 5) / 100;
			const stockSeries = this.get("stockSeries");
			const data: Array<any> = [];
			if (stockSeries) {
				const dataItems = stockSeries.dataItems;
				if (dataItems.length > 1) {
					let firstDataItem = dataItems[0];

					let goesUp = false;
					let firstTime = firstDataItem.get("valueX", 0);
					let firstValue = firstDataItem.get("valueY");
					let firstHigh = firstDataItem.get("highValueY", firstValue);
					let firstLow = firstDataItem.get("lowValueY", firstValue);

					let zigZagTime: number | undefined;
					let zigZagValue: number | undefined;

					let j = 1;
					for (let i = 1, len = dataItems.length; i < len; i++) {
						let dataItem = dataItems[i];
						let value = dataItem.get("value", 0);
						let low = dataItem.get("lowValueY", value);
						let high = dataItem.get("highValueY", value);
						let time = dataItem.get("valueX", 0);

						if (low <= Number(firstHigh) * (1 - deviation)) {
							data.push({ time: firstTime, zigzag: firstHigh });
							zigZagTime = time;
							zigZagValue = low;
							goesUp = true;
							j = i;
							break;
						}
						else if (high >= Number(firstLow) * (1 + deviation)) {
							data.push({ time: firstTime, zigzag: firstLow });
							zigZagTime = time;
							zigZagValue = high;
							goesUp = false;
							j = i;
							break;
						}
					}
					if (zigZagValue != null) {
						let depth = this.get("depth", 3);
						for (let i = j - 1, len = dataItems.length; i < len; i++) {
							let dataItem = dataItems[i];
							let value = dataItem.get("value", 0);
							let low = dataItem.get("lowValueY", value);
							let high = dataItem.get("highValueY", value);
							let time = dataItem.get("valueX", 0);

							if (goesUp) {
								if (low <= zigZagValue) {
									zigZagValue = low;
									zigZagTime = time;
								}
								else if (high >= zigZagValue * (1 + deviation)) {
									let b = Math.max(0, i - depth);
									let skip = false;
									for (let k = i; k > b; k--) {
										if (high < dataItems[k].get("highValueY")) {
											skip = true;
											break;
										}
									}
									if (!skip) {
										data.push({ time: zigZagTime, zigzag: zigZagValue });
										zigZagValue = high;
										zigZagTime = time;
										goesUp = false;
									}
								}
							}
							else {
								if (high >= zigZagValue) {
									zigZagValue = high;
									zigZagTime = time;
								}
								else if (low <= zigZagValue * (1 - deviation)) {
									let b = Math.max(0, i - depth);
									let skip = false;
									for (let k = i; k > b; k--) {
										if (low > dataItems[k].get("lowValueY")) {
											skip = true;
											break;
										}
									}
									if (!skip) {
										data.push({ time: zigZagTime, zigzag: zigZagValue });
										zigZagValue = low;
										zigZagTime = time;
										goesUp = true;
									}
								}
							}
						}

						const lastDataItem = dataItems[dataItems.length - 1];
						let lastTime = lastDataItem.get("valueX", 0);
						let lastValue = lastDataItem.get("valueY");
						let lastHigh = lastDataItem.get("highValueY", lastValue);
						let lastLow = lastDataItem.get("lowValueY", lastValue);

						if (zigZagValue < lastHigh) {
							data.push({ time: lastTime, zigzag: lastLow });
						}
						else {
							data.push({ time: lastTime, zigzag: lastHigh });
						}
					}
				}
				this.series.data.setAll(data);
			}
		}
	}
}