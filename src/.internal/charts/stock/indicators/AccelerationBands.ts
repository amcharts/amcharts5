import type { IIndicatorEditableSetting } from "./Indicator";
import type { Color } from "../../../core/util/Color";

import { Indicator, IIndicatorSettings, IIndicatorPrivate, IIndicatorEvents } from "./Indicator";
import { LineSeries } from "../../xy/series/LineSeries";
import * as $type from "../../../core/util/Type";

import * as $array from "../../../core/util/Array";

export interface IAccelerationBandsSettings extends IIndicatorSettings {
    /**
     * A color for upper section.
     */
    upperColor?: Color;

    /**
     * A color for lower section.
     */
    lowerColor?: Color;


    factor?: number;
}

export interface IAccelerationBandsPrivate extends IIndicatorPrivate {
}

export interface IAccelerationBandsEvents extends IIndicatorEvents {
}


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class AccelerationBands extends Indicator {
    public static className: string = "AccelerationBands";
    public static classNames: Array<string> = Indicator.classNames.concat([AccelerationBands.className]);

    declare public _settings: IAccelerationBandsSettings;
    declare public _privateSettings: IAccelerationBandsPrivate;
    declare public _events: IAccelerationBandsEvents;

    /**
     * Indicator series for the upper band.
     */
    public upperBandSeries!: LineSeries;

    /**
     * Indicator series for the lower band.
     */
    public lowerBandSeries!: LineSeries;

    public _editableSettings: IIndicatorEditableSetting[] = [{
        key: "period",
        name: this.root.language.translateAny("Period"),
        type: "number"
    }, {
        key: "factor",
        name: this.root.language.translateAny("Factor"),
        type: "number"
    }, {
        key: "upperColor",
        name: this.root.language.translateAny("Upper"),
        type: "color"
    }, {
        key: "seriesColor",
        name: this.root.language.translateAny("Average"),
        type: "color"
    }, {
        key: "lowerColor",
        name: this.root.language.translateAny("Lower"),
        type: "color"
    }];

    protected _afterNew() {

        const stockSeries = this.get("stockSeries");
        const chart = stockSeries.chart;

        if (chart) {

            const series = chart.series.push(LineSeries.new(this._root, {
                valueXField: "valueX",
                valueYField: "average",
                groupDataDisabled: true,
                calculateAggregates: true,
                xAxis: stockSeries.get("xAxis"),
                yAxis: stockSeries.get("yAxis"),
                themeTags: ["indicator", "accelerationbands", "average"]
            }))

            series.setPrivate("baseValueSeries", stockSeries);
            this.series = series;

            const upperBandSeries = chart.series.push(LineSeries.new(this._root, {
                valueXField: "valueX",
                valueYField: "upper",
                openValueYField: "lower",
                calculateAggregates: true,
                xAxis: stockSeries.get("xAxis"),
                yAxis: stockSeries.get("yAxis"),
                groupDataDisabled: true,
                themeTags: ["indicator", "accelerationbands", "upper"]
            }))

            upperBandSeries.setPrivate("baseValueSeries", stockSeries);

            this.upperBandSeries = upperBandSeries;

            const lowerBandSeries = chart.series.push(LineSeries.new(this._root, {
                valueXField: "valueX",
                valueYField: "lower",
                calculateAggregates: true,
                xAxis: stockSeries.get("xAxis"),
                yAxis: stockSeries.get("yAxis"),
                groupDataDisabled: true,
                themeTags: ["indicator", "accelerationbands", "lower"]
            }))

            lowerBandSeries.setPrivate("baseValueSeries", stockSeries);
            this.lowerBandSeries = lowerBandSeries;
        }

        this._handleLegend(this.series);

        super._afterNew();
        this.series.addTag("accelerationbands");
        this.series._applyThemes();
    }

    public _prepareChildren() {

        if (this.isDirty("factor")) {
            this.markDataDirty();
            this.setCustomData("factor", this.get("factor"));
        }

        super._prepareChildren();
    }

    public _updateChildren() {
        super._updateChildren();
        const upperColor = "upperColor";
        if (this.isDirty(upperColor)) {
            const color = this.get(upperColor);
            const upperBandSeries = this.upperBandSeries;
            upperBandSeries.set("stroke", color);
            upperBandSeries.set("fill", color);
            upperBandSeries.strokes.template.set("stroke", color);

            this._updateSeriesColor(upperBandSeries, color, upperColor);
        }

        const lowerColor = "lowerColor";
        if (this.isDirty(lowerColor)) {
            const color = this.get(lowerColor);
            const lowerBandSeries = this.lowerBandSeries;
            lowerBandSeries.set("stroke", color);
            lowerBandSeries.strokes.template.set("stroke", color);

            this._updateSeriesColor(lowerBandSeries, color, lowerColor);
        }
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
            let factor = this.get("factor", 0.001);

            let i = 0;

            $array.each(data, (dataItem: any) => {
                let stockDataItem = dataItems[i];

                if (stockDataItem) {
                    let low = stockDataItem.get("lowValueY");
                    let high = stockDataItem.get("highValueY");

                    if ($type.isNumber(low) && $type.isNumber(high) && high + low != 0) {
                        dataItem._lower = (high * (1 + 2 * ((((high - low) / ((high + low) / 2)) * 1000) * factor)));
                        dataItem._upper = (low * (1 - 2 * ((((high - low) / ((high + low) / 2)) * 1000) * factor)));
                        dataItem._average = dataItem._lower + (dataItem._upper - dataItem._lower) / 2;
                    }
                }
                i++;
            })

            this._sma(data, period, "_lower", "lower");
            this._sma(data, period, "_upper", "upper");
            this._sma(data, period, "_average", "average");

            this.upperBandSeries.data.setAll(data);
            this.lowerBandSeries.data.setAll(data);
            this.series.data.setAll(data);
        }
    }

    protected _dispose() {
        this.upperBandSeries.dispose();
        this.lowerBandSeries.dispose();
        super._dispose();
    }

    public async hide(duration?: number): Promise<any> {
        return Promise.all([
            super.hide(duration),
            this.upperBandSeries.hide(duration),
            this.lowerBandSeries.hide(duration)
        ]);
    }

    public async show(duration?: number): Promise<any> {
        return Promise.all([
            super.show(duration),
            this.upperBandSeries.show(duration),
            this.lowerBandSeries.show(duration)
        ]);
    }
}