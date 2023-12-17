import type { IIndicatorEditableSetting } from "./Indicator";
import type { IValueAxisDataItem } from "../../xy/axes/ValueAxis";
import type { DataItem } from "../../../core/render/Component";
import type { Color } from "../../../core/util/Color";

import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries, ILineSeriesAxisRange } from "../../xy/series/LineSeries";
import { Button } from "../../../core/render/Button";
import { Graphics } from "../../../core/render/Graphics";
import { AxisBullet } from "../../xy/axes/AxisBullet";
import type { AxisRendererY } from "../../xy/axes/AxisRendererY";
import * as $math from "../../../core/util/Math";
import * as $type from "../../../core/util/Type";


export interface IOverboughtOversoldSettings extends IChartIndicatorSettings {

	/**
	 * A value for "overbought" threshold.
	 */
	overBought?: number;

	/**
	 * A value for "oversold" threshold.
	 */
	overSold?: number;

	/**
	 * A color for "overbought" section.
	 */
	overBoughtColor?: Color;

	/**
	 * A color for "oversold" section.
	 */
	overSoldColor?: Color;
}

export interface IOverboughtOversoldPrivate extends IChartIndicatorPrivate { }

export interface IOverboughtOversoldEvents extends IChartIndicatorEvents { }


/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export class OverboughtOversold extends ChartIndicator {
	public static className: string = "OverboughtOversold";
	public static classNames: Array<string> = ChartIndicator.classNames.concat([OverboughtOversold.className]);

	declare public _settings: IOverboughtOversoldSettings;
	declare public _privateSettings: IOverboughtOversoldPrivate;
	declare public _events: IOverboughtOversoldEvents;

	public overBought!: DataItem<IValueAxisDataItem>;
	public middle!: DataItem<IValueAxisDataItem>;
	public overSold!: DataItem<IValueAxisDataItem>;

	public overSoldRange!: ILineSeriesAxisRange;
	public overBoughtRange!: ILineSeriesAxisRange;

	/**
	 * Indicator series.
	 */
	declare public series: LineSeries;

	public _editableSettings: IIndicatorEditableSetting[] = [{
		key: "overBought",
		name: this.root.language.translateAny("Overbought"),
		type: "number"
	}, {
		key: "overBoughtColor",
		name: this.root.language.translateAny("Overbought"),
		type: "color"
	}, {
		key: "overSold",
		name: this.root.language.translateAny("Oversold"),
		type: "number"
	}, {
		key: "overSoldColor",
		name: this.root.language.translateAny("Oversold"),
		type: "color"
	}];

	protected _afterNew() {
		this._themeTags.push("overboughtoversold");

		super._afterNew();

		const chart = this.panel;
		const yAxis = this.yAxis;
		yAxis.setAll({ strictMinMax: true, autoZoom: false });

		// middle grid
		this.middle = this.yAxis.createAxisRange(this.yAxis.makeDataItem({}));
		const middleGrid = this.middle.get("grid")!;
		middleGrid.setAll({ themeTags: ["middlegrid"] });
		middleGrid._applyThemes();

		const middleLabel = this.middle.get("label")!;
		middleLabel.setAll({ visible: true, forceHidden: false });

		const opposite = (yAxis.get("renderer") as AxisRendererY).get("opposite");
		let side = "left";
		if (opposite) {
			side = "right"
		}

		// overbought range
		const overBought = yAxis.makeDataItem({});
		this.overBought = overBought;
		overBought.set("endValue", 500);

		const overBoughtRB = Button.new(this._root, {
			themeTags: ["rangegrip", "vertical", side],
			icon: Graphics.new(this._root, {
				themeTags: ["rangegrip", "icon"]
			})
		})

		// restrict from being dragged vertically
		overBoughtRB.adapters.add("x", function() {
			return 0;
		});

		// restrict from being dragged outside of plot
		overBoughtRB.adapters.add("y", function(y) {
			if ($type.isNumber(y)) {
				return $math.fitToRange(y, 0, chart.plotContainer.height());
			}
			return y;
		});

		// change range when y changes
		overBoughtRB.events.on("dragged", () => {
			this._updateRange(overBoughtRB, "overBought");
		});

		overBought.set("bullet", AxisBullet.new(this._root, {
			location: 0,
			sprite: overBoughtRB
		}))

		const overBoughtRange = this.series.createAxisRange(overBought);
		this.overBoughtRange = overBoughtRange;
		const overBoughtFills = overBoughtRange.fills;
		if (overBoughtFills) {
			overBoughtFills.template.set("themeTags", ["overbought", "fill"]);
		}

		const overBoughtGrid = overBought.get("grid")!;
		overBoughtGrid.setAll({ themeTags: ["overbought"], visible: true });
		overBoughtGrid._applyThemes();

		const overBoughtLabel = overBought.get("label")!;
		overBoughtLabel.setAll({ visible: true, forceHidden: false, location: 0 });

		// oversold range
		const overSold = yAxis.makeDataItem({});
		this.overSold = overSold;
		overSold.set("endValue", -500);

		const overSoldRB = Button.new(this._root, {
			themeTags: ["rangegrip", "vertical", side],
			icon: Graphics.new(this._root, {
				themeTags: ["rangegrip", "icon"]
			})
		})

		// restrict from being dragged vertically
		overSoldRB.adapters.add("x", function() {
			return 0;
		});

		// restrict from being dragged outside of plot
		overSoldRB.adapters.add("y", function(y) {
			if ($type.isNumber(y)) {
				return $math.fitToRange(y, 0, chart.plotContainer.height());
			}
			return y;
		});

		// change range when y changes
		overSoldRB.events.on("dragged", () => {
			this._updateRange(overSoldRB, "overSold");
		});

		overSold.set("bullet", AxisBullet.new(this._root, {
			location: 0,
			sprite: overSoldRB
		}))


		const overSoldRange = this.series.createAxisRange(overSold);
		this.overSoldRange = overSoldRange;
		const overSoldFills = overSoldRange.fills;
		if (overSoldFills) {
			overSoldFills.template.set("themeTags", ["oversold", "fill"]);
		}

		const overSoldGrid = overSold.get("grid")!;
		overSoldGrid.setAll({ themeTags: ["oversold"], visible: true });
		overSoldGrid._applyThemes();

		const overSoldLabel = overSold.get("label")!;
		overSoldLabel.setAll({ visible: true, forceHidden: false, location: 0 });
	}

	protected _updateRange(button: Button, key: "overBought" | "overSold") {
		const chart = this.yAxis.chart;
		if (chart) {
			const position = this.yAxis.toAxisPosition(button.y() / chart.plotContainer.height());
			this.set(key, Math.round(this.yAxis.positionToValue(position)));
		}

	}

	public _createSeries(): LineSeries {
		return this.panel.series.push(LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "valueS",
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}

	public _prepareChildren() {
		super._prepareChildren();

		const overBoughtLabel = this.overBought.get("label")!;
		const overSoldLabel = this.overSold.get("label")!;
		const middleLabel = this.middle.get("label")!;

		if (this.isDirty("overBought") || this.isDirty("overSold")) {
			const numberFormatter = this.getNumberFormatter();

			const overSoldValue = this.get("overSold", 0);
			const overBoughtValue = this.get("overBought", 0);
			const middleValue = overSoldValue + (overBoughtValue - overSoldValue) / 2;

			overBoughtLabel.set("text", numberFormatter.format(overBoughtValue));
			overSoldLabel.set("text", numberFormatter.format(overSoldValue));
			middleLabel.set("text", numberFormatter.format(middleValue));

			this.overBought.set("value", overBoughtValue);
			this.overSold.set("value", overSoldValue);

			this.middle.set("value", middleValue);
			this.yAxis.set("baseValue", middleValue);
		}

		if (this.isDirty("overSoldColor")) {
			const color = this.get("overSoldColor");
			overSoldLabel.set("fill", color);

			this.overSold.get("grid")!.set("stroke", color);
			this.overSoldRange.fills!.template.set("fill", color);
			this.overSoldRange.strokes!.template.set("stroke", color);
		}

		if (this.isDirty("overBoughtColor")) {
			const color = this.get("overBoughtColor");
			overBoughtLabel.set("fill", color);

			this.overBought.get("grid")!.set("stroke", color);
			this.overBoughtRange.fills!.template.set("fill", color);
			this.overBoughtRange.strokes!.template.set("stroke", color);
		}
	}
}