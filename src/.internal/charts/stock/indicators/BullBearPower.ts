import type { IIndicatorEditableSetting } from "./Indicator";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";

import * as $array from "../../../core/util/Array";

export interface IBullBearPowerSettings extends IChartIndicatorSettings {
}

export interface IBullBearPowerPrivate extends IChartIndicatorPrivate {
}

export interface IBullBearPowerEvents extends IChartIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class BullBearPower extends ChartIndicator {
    public static className: string = "BullBearPower";
    public static classNames: Array<string> = ChartIndicator.classNames.concat([BullBearPower.className]);

    declare public _settings: IBullBearPowerSettings;
    declare public _privateSettings: IBullBearPowerPrivate;
    declare public _events: IBullBearPowerEvents;

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
        this._themeTags.push("bullbearpower");
        super._afterNew();
    }

    public _createSeries(): LineSeries {
        return this.panel.series.push(LineSeries.new(this._root, {
            themeTags: ["indicator"],
            xAxis: this.xAxis,
            yAxis: this.yAxis,
            valueXField: "valueX",
            valueYField: "bbp",
            stroke: this.get("seriesColor"),
            fill: undefined
        }))
    }

    /**
     * @ignore
     */
    public prepareData() {
        if (this.series) {

            const dataItems = this.get("stockSeries").dataItems;
            this.setRaw("field", "close");

            let i = 0;
            let data: Array<any> = this._getDataArray(dataItems);
            let period = this.get("period", 3);

            this._ema(data, period, "value_y", "ema");

            $array.each(dataItems, (dataItem) => {
                if (i >= period - 1) {
                    let close = dataItem.get("valueY") as number;
                    if (close != null) {
                        let low = dataItem.get("lowValueY", close) as number;
                        let high = dataItem.get("highValueY", close) as number;

                        let ema = data[i].ema;
                        data[i].bbp = high - ema + low - ema;
                    }
                }

                i++;
            })

            this.series.data.setAll(data);
        }
    }
}