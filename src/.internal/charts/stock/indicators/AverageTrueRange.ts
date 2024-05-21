import type { IIndicatorEditableSetting } from "./Indicator";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";
import type { DataItem } from "../../../..";

export interface IAverageTrueRangeSettings extends IChartIndicatorSettings {
}

export interface IAverageTrueRangePrivate extends IChartIndicatorPrivate {
}

export interface IAverageTrueRangeEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class AverageTrueRange extends ChartIndicator {
    public static className: string = "AverageTrueRange";
    public static classNames: Array<string> = ChartIndicator.classNames.concat([AverageTrueRange.className]);

    declare public _settings: IAverageTrueRangeSettings;
    declare public _privateSettings: IAverageTrueRangePrivate;
    declare public _events: IAverageTrueRangeEvents;

    /**
     * Indicator series.
     */
    declare public series: LineSeries;

    public _editableSettings: IIndicatorEditableSetting[] = [{
        key: "period",
        name: this.root.language.translateAny("Period"),
        type: "number"
    }, {
        key: "seriesColor",
        name: this.root.language.translateAny("Color"),
        type: "color"
    }];

    public _afterNew() {
        this._themeTags.push("averagetruerange");
        super._afterNew();
    }

    public _createSeries(): LineSeries {
        return this.panel.series.push(LineSeries.new(this._root, {
            themeTags: ["indicator"],
            xAxis: this.xAxis,
            yAxis: this.yAxis,
            valueXField: "valueX",
            valueYField: "atr",
            fill: undefined
        }))
    }

    protected _getDataArray(dataItems: Array<DataItem<any>>): Array<any> {
        const data: Array<any> = [];
        $array.each(dataItems, (dataItem) => {
            data.push({ valueX: dataItem.get("valueX"), value_close: dataItem.get("valueY"), value_high: dataItem.get("highValueY"), value_low: dataItem.get("lowValueY") });
        })
        return data;
    }

    /**
     * @ignore
     */
    public prepareData() {
        super.prepareData();

        if (this.series) {

            let period = this.get("period", 20);
            const stockSeries = this.get("stockSeries");
            const dataItems = stockSeries.dataItems;

            let data = this._getDataArray(dataItems);

            let i = 0;
            let index = 0;
            let tr = 0;
            let prevClose: number | undefined;
            let prevATR: number | undefined;

            $array.each(data, (dataItem) => {

                let valueClose = dataItem.value_close;

                if (valueClose != null && prevClose != null) {
                    i++;
                    tr = Math.max(dataItem.value_high - dataItem.value_low, Math.abs(dataItem.value_high - prevClose), Math.abs(dataItem.value_low - prevClose));
                    dataItem.tr = tr;

                    if (i >= period) {
                        if (i == period) {
                            let sum = 0;
                            let k = 0;
                            for (let j = index; j >= 0; j--) {
                                sum += data[j].tr;
                                k++;
                                if (k == period) {
                                    break;
                                }
                            }
                            dataItem.atr = sum / period;
                        }
                        else {
                            if (prevATR != null) {
                                dataItem.atr = (prevATR * (period - 1) + tr) / period;
                            }
                        }

                        prevATR = dataItem.atr;
                    }
                }
                prevClose = valueClose;
                index++;
            })

            this.series.data.setAll(data);
        }
    }
}