import type { Indicator } from "../indicators/Indicator";
import type { StockLegend } from "../StockLegend";

import { AccumulationDistribution } from "../indicators/AccumulationDistribution";
import { AccumulativeSwingIndex } from "../indicators/AccumulativeSwingIndex";
import { Aroon } from "../indicators/Aroon";
import { AwesomeOscillator } from "../indicators/AwesomeOscillator";
import { BollingerBands } from "../indicators/BollingerBands";
import { ChaikinMoneyFlow } from "../indicators/ChaikinMoneyFlow";
import { ChaikinOscillator } from "../indicators/ChaikinOscillator";
import { CommodityChannelIndex } from "../indicators/CommodityChannelIndex";
import { DisparityIndex } from "../indicators/DisparityIndex";
import { MACD } from "../indicators/MACD";
import { MovingAverage } from "../indicators/MovingAverage";
import { MovingAverageDeviation } from "../indicators/MovingAverageDeviation";
import { MovingAverageEnvelope } from "../indicators/MovingAverageEnvelope";
import { OnBalanceVolume } from "../indicators/OnBalanceVolume";
import { RelativeStrengthIndex } from "../indicators/RelativeStrengthIndex";
import { StochasticOscillator } from "../indicators/StochasticOscillator";
import { WilliamsR } from "../indicators/WilliamsR";
import { Volume } from "../indicators/Volume";


//import type { IDisposer } from "../../../core/util/Disposer";
import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { DropdownList, IDropdownListItem } from "./DropdownList";
import { StockIcons } from "./StockIcons";

import * as $array from "../../../core/util/Array";

export type Indicators = "Accumulation Distribution" | "Accumulative Swing Index" | "Aroon" | "Awesome Oscillator" | "Bollinger Bands" | "Chaikin Money Flow" | "Chaikin Oscillator" | "Commodity Channel Index" | "Disparity Index" | "MACD" | "Moving Average" | "Moving Average Deviation" | "Moving Average Envelope" | "On Balance Volume" | "Relative Strength Index" | "Stochastic Oscillator" | "Volume" | "Williams R";

export interface IIndicatorControlSettings extends IStockControlSettings {
	indicators?: Indicators[];
	legend?: StockLegend;
}

export interface IIndicatorControlPrivate extends IStockControlPrivate {
	list?: DropdownList;
}

export interface IIndicatorControlEvents extends IStockControlEvents {
	selected: {
		indicator: Indicators
	}
}

/**
 * A [[StockToolbar]] control for adding indicators to a [[StockChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/indicator-control/} for more info
 */
export class IndicatorControl extends StockControl {
	public static className: string = "IndicatorControl";
	public static classNames: Array<string> = StockControl.classNames.concat([IndicatorControl.className]);

	declare public _settings: IIndicatorControlSettings;
	declare public _privateSettings: IIndicatorControlPrivate;
	declare public _events: IIndicatorControlEvents;

	protected _afterNew() {

		// Do parent stuff
		super._afterNew();

		// Create list of tools
		const list = DropdownList.new(this._root, {
			control: this,
			parent: this.getPrivate("button")
		});
		this.setPrivate("list", list);

		list.events.on("invoked", (ev) => {
			this.addIndicator(<Indicators>ev.item.id);
		});

		list.events.on("closed", (_ev) => {
			this.set("active", false);
		});

		this.on("active", (active) => {
			if (active) {
				this.setTimeout(() => list.show(), 10);
			}
			else {
				list.hide();
			}
		});

		const button = this.getPrivate("button")!;
		button.className = button.className + " am5stock-control-dropdown";

		this._initList();
	}

	protected _initList(): void {
		const list = this.getPrivate("list")!;
		const indicators = this.get("indicators")!;
		const items: IDropdownListItem[] = [];
		$array.each(indicators, (indicator: Indicators) => {
			items.push({
				id: indicator,
				label: this._root.language.translateAny(indicator)
			});
		})
		list.set("items", items);
	}

	protected _getDefaultIcon(): SVGElement {
		return StockIcons.getIcon("Indicator");
	}

	public _afterChanged() {
		super._afterChanged();
		if (this.isDirty("indicators")) {
			this._initList();
		}
	}

	public addIndicator(indicatorId: Indicators): void {
		const stockChart = this.get("stockChart");
		let indicator: Indicator | undefined;
		const stockSeries = stockChart.get("stockSeries")!;
		const volumeSeries = stockChart.get("volumeSeries")!;
		const legend = this.get("legend");

		switch (indicatorId) {
			case "Accumulation Distribution":
				indicator = AccumulationDistribution.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					volumeSeries: volumeSeries,
					legend: legend
				});
				break;
			case "Accumulative Swing Index":
				indicator = AccumulativeSwingIndex.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					legend: legend
				});
				break;
			case "Aroon":
				indicator = Aroon.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					legend: legend
				});
				break;
			case "Awesome Oscillator":
				indicator = AwesomeOscillator.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					legend: legend
				});
				break;
			case "Bollinger Bands":
				indicator = BollingerBands.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					legend: legend
				});
				break;
			case "Chaikin Money Flow":
				indicator = ChaikinMoneyFlow.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					volumeSeries: volumeSeries,
					legend: legend
				});
				break;
			case "Chaikin Oscillator":
				indicator = ChaikinOscillator.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					volumeSeries: volumeSeries,
					legend: legend
				});
				break;
			case "Commodity Channel Index":
				indicator = CommodityChannelIndex.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries
				});
				break;
			case "Disparity Index":
				indicator = DisparityIndex.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries
				});
				break;
			case "MACD":
				indicator = MACD.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					legend: legend
				});
				break;
			case "Moving Average":
				indicator = MovingAverage.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					legend: legend
				});
				break;
			case "Moving Average Deviation":
				indicator = MovingAverageDeviation.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					legend: legend
				});
				break;
			case "Moving Average Envelope":
				indicator = MovingAverageEnvelope.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					legend: legend
				});
				break;
			case "On Balance Volume":
				indicator = OnBalanceVolume.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					volumeSeries: volumeSeries,
					legend: legend
				});
				break;
			case "Relative Strength Index":
				indicator = RelativeStrengthIndex.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries
				});
				break;
			case "Stochastic Oscillator":
				indicator = StochasticOscillator.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries
				});
				break;
			case "Williams R":
				indicator = WilliamsR.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries
				});
				break;
			case "Volume":
				indicator = Volume.new(this.root, {
					stockChart: stockChart,
					stockSeries: stockSeries,
					volumeSeries: volumeSeries,
				});
				break;
		}

		if (indicator) {
			stockChart.indicators.push(indicator);
			if (indicator._editableSettings.length) {
				const modal = stockChart.getPrivate("settingsModal");
				modal.events.once("done", (ev) => {
					if (indicator) {
						if (!ev.settings) {
							indicator.dispose();
						}
					}
				});
				modal.openIndicator(indicator);
			}
		}
	}

}