import type { ITimeInterval } from "../../core/util/Time";
import type { DataItem } from "../../core/render/Component";
import type { IValueAxisDataItem, ValueAxis } from "./axes/ValueAxis";
import type { AxisRenderer } from "./axes/AxisRenderer";
import type { DateAxis } from "./axes/DateAxis";
import type { ICategoryAxisDataItem } from "./axes/CategoryAxis";

import { Theme } from "../../core/Theme";
import { percent, p50, p100 } from "../../core/util/Percent";
import { ColorSet } from "../../core/util/ColorSet";
import { setColor } from "../../themes/DefaultTheme";

import * as $type from "../../core/util/Type";
import * as $math from "../../core/util/Math";
import * as $object from "../../core/util/Object";
import * as $array from "../../core/util/Array";

/**
 * @ignore
 */
export class XYChartDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const ic = this._root.interfaceColors;
		const language = this._root.language;

		/**
		 * ========================================================================
		 * charts/xy
		 * ========================================================================
		 */

		this.rule("XYChart").setAll({
			colors: ColorSet.new(this._root, {}),
			paddingLeft: 20,
			paddingRight: 20,
			paddingTop: 16,
			paddingBottom: 16,
			panX: false,
			panY: false,
			wheelStep: 0.25,
			arrangeTooltips: true
		});

		/**
		 * ------------------------------------------------------------------------
		 * charts/xy: ZoomOutButton
		 * ------------------------------------------------------------------------
		 */

		this.rule("Button", ["zoom"]).setAll({
			paddingTop: 18,
			paddingBottom: 18,
			paddingLeft: 12,
			paddingRight: 12,
			centerX: 46,
			centerY: -10,
			y: 0,
			x: p100,
			role: "button",
			ariaLabel: language.translate("Zoom Out"),
			layer: 40
		});

		{
			const rule = this.rule("RoundedRectangle", ["background", "button", "zoom"]);

			rule.setAll({
				cornerRadiusBL: 40,
				cornerRadiusBR: 40,
				cornerRadiusTL: 40,
				cornerRadiusTR: 40
			});

			setColor(rule, "fill", ic, "primaryButton");
		}

		{
			const rule = this.rule("RoundedRectangle", ["background", "button", "zoom"]).states.create("hover", {});
			setColor(rule, "fill", ic, "primaryButtonHover");
		}

		{
			const rule = this.rule("RoundedRectangle", ["background", "button", "zoom"]).states.create("down", { stateAnimationDuration: 0 });
			setColor(rule, "fill", ic, "primaryButtonDown");
		}

		{
			const rule = this.rule("Graphics", ["icon", "button", "zoom"]);

			rule.setAll({
				strokeOpacity: 0.7,
				draw: (display: any) => {
					display.moveTo(0, 0);
					display.lineTo(12, 0);
				}
			});

			setColor(rule, "stroke", ic, "primaryButtonText");
		}


		/**
		 * ------------------------------------------------------------------------
		 * charts/xy: XYChartScrollbar
		 * ------------------------------------------------------------------------
		 */

		this.rule("XYChart", ["scrollbar", "chart"]).setAll({
			paddingBottom: 0,
			paddingLeft: 0,
			paddingTop: 0,
			paddingRight: 0,
			colors: ColorSet.new(this._root, {
				saturation: 0
			})
		});

		{
			const rule = this.rule("Graphics", ["scrollbar", "overlay"]);

			rule.setAll({
				fillOpacity: 0.5
			});

			setColor(rule, "fill", ic, "background");
		}

		// Class: RoundedRectangle
		this.rule("RoundedRectangle", ["xy", "scrollbar", "thumb"]).setAll({
			cornerRadiusTR: 0,
			cornerRadiusTL: 0,
			cornerRadiusBR: 0,
			cornerRadiusBL: 0,
			fillOpacity: 0,
			focusable: true
		});

		this.rule("RoundedRectangle", ["xy", "scrollbar", "thumb"]).states.create("hover", { fillOpacity: 0.4 });

		this.rule("RoundedRectangle", ["xy", "scrollbar", "chart", "background"]).setAll({
			cornerRadiusTL: 0,
			cornerRadiusBL: 0,
			cornerRadiusTR: 0,
			cornerRadiusBR: 0
		});

		this.rule("RoundedRectangle", ["xy", "scrollbar", "chart", "background", "resize", "button"]).setAll({
			cornerRadiusBL: 40,
			cornerRadiusBR: 40,
			cornerRadiusTL: 40,
			cornerRadiusTR: 40
		});

		this.rule("AxisRendererX", ["xy", "chart", "scrollbar"]).setAll({
			strokeOpacity: 0,
			inside: true
		});

		this.rule("AxisRendererY", ["xy", "chart", "scrollbar"]).setAll({
			strokeOpacity: 0,
			inside: true,
			minGridDistance: 5
		});

		this.rule("AxisLabel", ["xy", "scrollbar", "x"]).setAll({
			opacity: 0.5,
			centerY: p100,
			minPosition: 0.01,
			maxPosition: 0.99,
			fontSize: "0.8em"
		});

		this.rule("AxisLabel", ["x"]).setAll({
			centerY: 0
		});

		this.rule("AxisLabel", ["x", "inside"]).setAll({
			centerY: p100
		});

		this.rule("AxisLabel", ["x", "inside", "opposite"]).setAll({
			centerY: 0
		});

		this.rule("AxisLabel", ["x", "opposite"]).setAll({
			centerY: p100
		});


		this.rule("AxisLabel", ["y"]).setAll({
			centerX: p100
		});

		this.rule("AxisLabel", ["y", "inside"]).setAll({
			centerX: 0
		});

		this.rule("AxisLabel", ["y", "inside", "opposite"]).setAll({
			centerX: p100
		});

		this.rule("AxisLabel", ["y", "opposite"]).setAll({
			centerX: 0
		});


		this.rule("AxisLabel", ["xy", "scrollbar", "y"]).setAll({
			visible: false
		});

		// Class: Grid
		this.rule("Grid", ["xy", "scrollbar", "y"]).setAll({
			visible: false
		});

		// Class: Grid
		this.rule("Grid", ["xy", "scrollbar", "x"]).setAll({
			opacity: 0.5
		});




		/**
		 * ------------------------------------------------------------------------
		 * charts/xy: Cursor
		 * ------------------------------------------------------------------------
		 */

		this.rule("XYCursor").setAll({
			behavior: "none",
			layer: 20,
			exportable: false
		});

		{
			const rule = this.rule("Grid", ["cursor", "x"]);

			rule.setAll({
				strokeOpacity: 0.8,
				strokeDasharray: [2, 2]
			});

			setColor(rule, "stroke", ic, "alternativeBackground");
		}

		{
			const rule = this.rule("Grid", ["cursor", "y"]);

			rule.setAll({
				strokeOpacity: 0.8,
				strokeDasharray: [2, 2]
			});

			setColor(rule, "stroke", ic, "alternativeBackground");
		}

		{
			const rule = this.rule("Graphics", ["cursor", "selection"]);

			rule.setAll({
				fillOpacity: 0.15,
			});

			setColor(rule, "fill", ic, "alternativeBackground");
		}


		/**
		 * ------------------------------------------------------------------------
		 * charts/xy: Axes
		 * ------------------------------------------------------------------------
		 */

		this.rule("Axis").setAll({
			start: 0,
			end: 1,
			minZoomCount: 1,
			maxZoomCount: Infinity,
			maxZoomFactor: 1000,
			maxDeviation: 0.1,
			snapTooltip: true,
			tooltipLocation: 0.5,
			panX: true,
			panY: true,
			zoomX: true,
			zoomY: true,
			fixAxisSize: true
		});

		this.rule("AxisLabel").setAll({
			location: 0.5,
			multiLocation: 0,
			centerX: p50,
			centerY: p50,
			paddingTop: 3,
			paddingBottom: 3,
			paddingLeft: 5,
			paddingRight: 5
		});

		this.rule("AxisLabel", ["y"]).setAll({
			textAlign: "right"
		});

		this.rule("AxisLabel", ["y", "opposite"]).setAll({
			textAlign: "left"
		});

		this.rule("Container", ["axis", "header"]).setAll({
			layer: 30
		});

		{
			const rule = this.rule("AxisRenderer");

			rule.setAll({
				strokeOpacity: 0
			});

			setColor(rule, "stroke", ic, "grid");
		}

		this.rule("AxisRendererX").setAll({
			minGridDistance: 120,
			opposite: false,
			inversed: false,
			cellStartLocation: 0,
			cellEndLocation: 1,
			width: p100
		});

		this.rule("AxisRendererY").setAll({
			minGridDistance: 40,
			opposite: false,
			inversed: false,
			cellStartLocation: 0,
			cellEndLocation: 1,
			height: p100
		});

		{
			const rule = this.rule("Grid");

			rule.setAll({
				location: 0,
				strokeOpacity: 0.15,
			});

			setColor(rule, "stroke", ic, "grid");
		}

		this.rule("Grid", ["base"]).setAll({
			strokeOpacity: 0.3
		});

		{
			const rule = this.rule("Graphics", ["axis", "fill"]);

			rule.setAll({
				visible: false,
				isMeasured: false,
				position: "absolute",
				fillOpacity: 0.05,
			});

			setColor(rule, "fill", ic, "alternativeBackground");
		}

		{
			const rule = this.rule("AxisTick");

			rule.setAll({
				location: 0.5,
				multiLocation: 0,
				strokeOpacity: 1,
				isMeasured: false,
				position: "absolute",
				visible: false
			});

			setColor(rule, "stroke", ic, "grid");
		}

		this.rule("CategoryAxis").setAll({
			startLocation: 0,
			endLocation: 1,
			fillRule: (dataItem: DataItem<ICategoryAxisDataItem>, index?: number) => {
				const axisFill = dataItem.get("axisFill");
				if (axisFill) {
					if (!$type.isNumber(index) || index % 2 == 0) {
						axisFill.setPrivate("visible", true);
					}
					else {
						axisFill.setPrivate("visible", false);
					}
				}
			}
		});

		const gridIntervals: Array<ITimeInterval> = [
			{ timeUnit: "millisecond", count: 1 },
			{ timeUnit: "millisecond", count: 5 },
			{ timeUnit: "millisecond", count: 10 },
			{ timeUnit: "millisecond", count: 50 },
			{ timeUnit: "millisecond", count: 100 },
			{ timeUnit: "millisecond", count: 500 },
			{ timeUnit: "second", count: 1 },
			{ timeUnit: "second", count: 5 },
			{ timeUnit: "second", count: 10 },
			{ timeUnit: "second", count: 30 },
			{ timeUnit: "minute", count: 1 },
			{ timeUnit: "minute", count: 5 },
			{ timeUnit: "minute", count: 10 },
			{ timeUnit: "minute", count: 15 },
			{ timeUnit: "minute", count: 30 },
			{ timeUnit: "hour", count: 1 },
			{ timeUnit: "hour", count: 3 },
			{ timeUnit: "hour", count: 6 },
			{ timeUnit: "hour", count: 12 },
			{ timeUnit: "day", count: 1 },
			{ timeUnit: "day", count: 2 },
			{ timeUnit: "day", count: 3 },
			{ timeUnit: "day", count: 4 },
			{ timeUnit: "day", count: 5 },
			{ timeUnit: "week", count: 1 },
			{ timeUnit: "month", count: 1 },
			{ timeUnit: "month", count: 2 },
			{ timeUnit: "month", count: 3 },
			{ timeUnit: "month", count: 6 },
			{ timeUnit: "year", count: 1 },
			{ timeUnit: "year", count: 2 },
			{ timeUnit: "year", count: 5 },
			{ timeUnit: "year", count: 10 },
			{ timeUnit: "year", count: 50 },
			{ timeUnit: "year", count: 100 },
			{ timeUnit: "year", count: 200 },
			{ timeUnit: "year", count: 500 },
			{ timeUnit: "year", count: 1000 },
			{ timeUnit: "year", count: 2000 },
			{ timeUnit: "year", count: 5000 },
			{ timeUnit: "year", count: 10000 },
			{ timeUnit: "year", count: 100000 }
		];

		const dateFormats = {
			"millisecond": language.translate("_date_millisecond"),
			"second": language.translate("_date_second"),
			"minute": language.translate("_date_minute"),
			"hour": language.translate("_date_hour"),
			"day": language.translate("_date_day"),
			"week": language.translate("_date_day"),
			"month": language.translate("_date_month"),
			"year": language.translate("_date_year"),
		};

		const periodChangeDateFormats = {
			"millisecond": language.translate("_date_millisecond"),
			"second": language.translate("_date_second"),
			"minute": language.translate("_date_minute"),
			"hour": language.translate("_date_day"),
			"day": language.translate("_date_day"),
			"week": language.translate("_date_day"),
			"month": language.translate("_date_month") + " " + language.translate("_date_year"),
			"year": language.translate("_date_year")
		};

		this.rule("CategoryDateAxis").setAll({
			markUnitChange: true,
			gridIntervals: $array.copy(gridIntervals),
			dateFormats: $object.copy(dateFormats),
			periodChangeDateFormats: $object.copy(periodChangeDateFormats)
		});

		this.rule("DateAxis").setAll({

			strictMinMax: true,
			startLocation: 0,
			endLocation: 1,
			markUnitChange: true,
			groupData: false,
			groupCount: 500,
			gridIntervals: $array.copy(gridIntervals),
			dateFormats: $object.copy(dateFormats),
			periodChangeDateFormats: $object.copy(periodChangeDateFormats),

			groupIntervals: [
				{ timeUnit: "millisecond", count: 1 },
				{ timeUnit: "millisecond", count: 10 },
				{ timeUnit: "millisecond", count: 100 },
				{ timeUnit: "second", count: 1 },
				{ timeUnit: "second", count: 10 },
				{ timeUnit: "minute", count: 1 },
				{ timeUnit: "minute", count: 10 },
				{ timeUnit: "hour", count: 1 },
				{ timeUnit: "day", count: 1 },
				{ timeUnit: "week", count: 1 },
				{ timeUnit: "month", count: 1 },
				{ timeUnit: "year", count: 1 }
			],

			fillRule: (dataItem: DataItem<IValueAxisDataItem>) => {
				const axisFill = dataItem.get("axisFill");
				if (axisFill) {
					const axis = <DateAxis<AxisRenderer>>dataItem.component;
					const value = dataItem.get("value");
					const step = axis.getPrivate("step");
					const min = axis.getPrivate("min", 0);
					const intervalDuration = axis.intervalDuration();

					if ($type.isNumber(value) && $type.isNumber(step)) {
						if (Math.round((value - min) / intervalDuration) / 2 == Math.round(Math.round((value - min) / intervalDuration) / 2)) {
							axisFill.setPrivate("visible", true);
						}
						else {
							axisFill.setPrivate("visible", false);
						}
					}
				}
			}
		});


		this.rule("ValueAxis").setAll({

			baseValue: 0,
			logarithmic: false,
			extraMin: 0,
			extraMax: 0,
			strictMinMax: false,

			fillRule: (dataItem: DataItem<IValueAxisDataItem>) => {
				const axisFill = dataItem.get("axisFill");
				if (axisFill) {
					const axis = <ValueAxis<AxisRenderer>>dataItem.component;
					const value = dataItem.get("value");
					const step = axis.getPrivate("step");

					if ($type.isNumber(value) && $type.isNumber(step)) {
						if ($math.round(value / step / 2, 5) == Math.round(value / step / 2)) {
							axisFill.setPrivate("visible", false);
						}
						else {
							axisFill.setPrivate("visible", true);
						}
					}
				}
			}
		});

		this.rule("DurationAxis").setAll({
			baseUnit: "second"
		})


		/**
		 * ------------------------------------------------------------------------
		 * charts/xy: Series
		 * ------------------------------------------------------------------------
		 */

		this.rule("XYSeries").setAll({
			maskBullets: true,
			stackToNegative: true,

			locationX: 0.5,
			locationY: 0.5,

			snapTooltip: false,

			openValueXGrouped: "open",
			openValueYGrouped: "open",
			valueXGrouped: "close",
			valueYGrouped: "close"
		});

		this.rule("ColumnSeries").setAll({
			clustered: true
		});

		this.rule("RoundedRectangle", ["series", "column"]).setAll({
			position: "absolute",
			isMeasured: false,
			width: percent(70),
			height: percent(70),
			strokeWidth: 1,
			strokeOpacity: 1,
			cornerRadiusBL: 0,
			cornerRadiusTL: 0,
			cornerRadiusBR: 0,
			cornerRadiusTR: 0,
			fillOpacity: 1,
			role: "figure"
		});

		this.rule("LineSeries").setAll({
			connect: true,
			autoGapCount: 1.1,
			stackToNegative: false
		});

		this.rule("Graphics", ["series", "stroke"]).setAll({
			position: "absolute",
			strokeWidth: 1,
			strokeOpacity: 1,
			isMeasured: false
		});

		this.rule("Graphics", ["series", "fill"]).setAll({
			visible: false,
			fillOpacity: 0,
			position: "absolute",
			strokeWidth: 0,
			strokeOpacity: 0,
			isMeasured: false
		});

		this.rule("Graphics", ["line", "series", "legend", "marker", "stroke"]).setAll({
			draw: (display: any, sprite: any) => {
				const parent = sprite.parent;
				if (parent) {
					const h = parent.height();
					const w = parent.width();
					display.moveTo(0, h / 2);
					display.lineTo(w, h / 2);
				}
			}
		});

		{
			const rule = this.rule("Graphics", ["line", "series", "legend", "marker", "stroke"]).states.create("disabled", {});
			setColor(rule, "stroke", ic, "disabled");
		}

		this.rule("Graphics", ["line", "series", "legend", "marker", "fill"]).setAll({
			draw: (display: any, sprite: any) => {
				const parent = sprite.parent;
				if (parent) {
					const h = parent.height();
					const w = parent.width();
					display.moveTo(0, 0);
					display.lineTo(w, 0);
					display.lineTo(w, h);
					display.lineTo(0, h);
					display.lineTo(0, 0);
				}
			}
		});

		{
			const rule = this.rule("Graphics", ["line", "series", "legend", "marker", "fill"]).states.create("disabled", {});
			setColor(rule, "stroke", ic, "disabled");
		}

		this.rule("SmoothedXYLineSeries").setAll({
			tension: 0.5
		});

		this.rule("SmoothedXLineSeries").setAll({
			tension: 0.5
		});

		this.rule("SmoothedYLineSeries").setAll({
			tension: 0.5
		});

		this.rule("Candlestick").setAll({
			position: "absolute",
			isMeasured: false,
			width: percent(50),
			height: percent(50),
			strokeWidth: 1,
			strokeOpacity: 1,
			cornerRadiusBL: 0,
			cornerRadiusTL: 0,
			cornerRadiusBR: 0,
			cornerRadiusTR: 0,
			fillOpacity: 1,
			role: "figure"
		});

		this.rule("OHLC").setAll({
			width: percent(80),
			height: percent(80)
		});

		this.rule("CandlestickSeries").setAll({
			lowValueXGrouped: "low",
			lowValueYGrouped: "low",
			highValueXGrouped: "high",
			highValueYGrouped: "high",
			openValueXGrouped: "open",
			openValueYGrouped: "open",
			valueXGrouped: "close",
			valueYGrouped: "close"
		})

		// These rules can be used for regular columns, too
		{
			const rule = this.rule("Rectangle", ["column", "autocolor"]).states.create("riseFromOpen", {});
			setColor(rule, "fill", ic, "positive");
			setColor(rule, "stroke", ic, "positive");
		}

		{
			const rule = this.rule("Rectangle", ["column", "autocolor"]).states.create("dropFromOpen", {});
			setColor(rule, "fill", ic, "negative");
			setColor(rule, "stroke", ic, "negative");
		}

		this.rule("Rectangle", ["column", "autocolor", "pro"]).states.create("riseFromPrevious", { fillOpacity: 1 });
		this.rule("Rectangle", ["column", "autocolor", "pro"]).states.create("dropFromPrevious", { fillOpacity: 0 });

	}
}
