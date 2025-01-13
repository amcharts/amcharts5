import { Theme } from "../../core/Theme";
import { p100, p50, p0, percent } from "../../core/util/Percent";
import { setColor } from "../../themes/DefaultTheme";
import { Color, color } from "../../core/util/Color";
import { ColorSet } from "../../core/util/ColorSet";
import { StockIcons } from "./toolbar/StockIcons";

import * as $math from "../../core/util/Math";

/**
 * @ignore
 */
export class StockChartDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = this._root.language;
		const r = this.rule.bind(this);
		const verticalLayout = this._root.verticalLayout;
		const ic = this._root.interfaceColors;

		/**
		 * ========================================================================
		 * charts/xy
		 * ========================================================================
		 */

		r("StockChart").setAll({
			paddingLeft: 18,
			paddingRight: 18,
			paddingTop: 5,
			paddingBottom: 15,
			width: p100,
			height: p100,
			layout: verticalLayout,
			percentScaleSeriesSettings: {
				valueYShow: "valueYChangeSelectionPercent",
				openValueYShow: "openValueYChangeSelectionPercent",
				highValueYShow: "highValueYChangeSelectionPercent",
				lowValueYShow: "lowValueYChangeSelectionPercent"
			},
			percentScaleValueAxisSettings: {
				numberFormat: "#.##'%'",
				interpolationDuration: 0,
				extraMax: 0.05,
				strictMinMaxSelection: true
			},
			autoSetPercentScale: true,
			drawingSelectionEnabled: false
		});

		r("StockPanel").setAll({
			panY: true,
			wheelY: "zoomX",
			panX: true,
			minHeight: 1
		});

		r("StockPanel").states.create("hidden", {
			height: p0,
			visible: false
		});

		r("XYChart", ["stock"]).setAll({
			paddingLeft: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingTop: 15,
			minHeight: 80,
			wheelZoomPositionX: 1
		});

		r("XYChart", ["stock", "scrollbar"]).setAll({
			minHeight: 0
		});

		r("StockLegend").setAll({
			clickTarget: "marker"
		});

		r("Label").setAll({
			fontSize: "0.8em"
		});

		r("Legend", ["stocklegend"]).setAll({
			paddingTop: 6,
			paddingLeft: 6
		})

		r("Container", ["itemcontainer", "legend", "stocklegend"]).setAll({
			marginLeft: 2,
			marginRight: 2,
			marginTop: 2,
			marginBottom: 2
		})

		r("Label", ["legend", "value", "label", "stocklegend"]).setAll({
			width: null,
			paddingRight: 5
		})

		r("ColumnSeries").setAll({
			useLastColorForLegendMarker: true
		})

		r("Grid", ["middlegrid"]).setAll({
			forceHidden: false,
			strokeOpacity: .4,
			strokeDasharray: [2, 2]
		})

		{
			const rule = r("RoundedRectangle", ["legend", "itemcontainer", "background", "stocklegend"]);

			rule.setAll({
				fillOpacity: 1,
				cornerRadiusBL: 4,
				cornerRadiusBR: 4,
				cornerRadiusTL: 4,
				cornerRadiusTR: 4,
				shadowOffsetX: 0,
				shadowOffsetY: 0,
				shadowOpacity: 0.3,
				shadowBlur: 5,
				interactive: true
			});
			setColor(rule, "shadowColor", ic, "alternativeBackground");
			setColor(rule, "fill", ic, "background");
		}

		{
			const rule = r("Rectangle", ["panelresizer"]);
			rule.setAll({
				width: p100,
				height: 15,
				centerY: p100,
				fillOpacity: 0,
				fill: ic.get("alternativeBackground"),
				cursorOverStyle: "row-resize",
				interactive: true
			})

			rule.states.create("hover", { fillOpacity: 0.07 });
		}


		r("Grid", ["renderer", "base", "y"]).setAll({
			strokeOpacity: 0.4
		})

		r("Button", ["zoom"]).setAll({
			forceHidden: true
		})

		r("AxisRendererY", ["y"]).setAll({
			opposite: true,
			pan: "zoom"
		})

		r("Container", ["legend", "item"]).setAll({

		})

		{
			const rule = r("Graphics", ["axis", "fill"]);

			rule.setAll({
				visible: true,
				//isMeasured: false,
				position: "absolute",
				fillOpacity: 0.05,
			});

			setColor(rule, "fill", ic, "alternativeBackground");
		}

		/**
		 * ------------------------------------------------------------------------
		 * Panel Controls
		 * ------------------------------------------------------------------------
		 */

		{
			const rule = r("PanelControls");

			rule.setAll({
				x: p100,
				y: 0,
				centerX: p100,
				paddingTop: 10,
				paddingRight: 10,
				layer: 30,
				layout: this._root.horizontalLayout,
				opacity: 0.5
			});

			rule.states.create("hover", { opacity: 1 });
		}




		/**
		 * ------------------------------------------------------------------------
		 * Control Button
		 * ------------------------------------------------------------------------
		 */

		r("Button", ["control", "item"]).setAll({
			paddingTop: 1,
			paddingBottom: 1,
			paddingLeft: 2,
			paddingRight: 2,
			centerX: p50,
			centerY: p50,
			forceHidden: true
		});

		{
			const rule = r("Button", ["control", "item", "settings"])
			rule.setAll({
				forceHidden: false
			});
		}

		{
			const rule = r("RoundedRectangle", ["background", "control", "button"]);

			rule.setAll({
				fillOpacity: 0,
				strokeOpacity: 0
			});
		}


		{
			const rule = r("Graphics", ["control", "button", "icon"]).states.create("hover", {
				fillOpacity: 0.3
			});
			setColor(rule, "fill", ic, "secondaryButtonHover");
		}

		/**
		 * ------------------------------------------------------------------------
		 * PanelControls Button
		 * ------------------------------------------------------------------------
		 */

		r("Button", ["panel"]).setAll({
			scale: 1.2,
			paddingLeft: 0,
			paddingRight: 0,
			marginLeft: 6
		});

		/**
		 * ------------------------------------------------------------------------
		 * Close Button
		 * ------------------------------------------------------------------------
		 */

		{
			const rule = r("Graphics", ["close", "button", "icon"]);

			rule.setAll({
				strokeOpacity: 0.7,
				strokeWidth: 0.5,
				draw: (display: any) => {
					let r = 5;
					display.moveTo(-r, -r);
					display.lineTo(r, r);
					display.moveTo(-r, r);
					display.lineTo(r, -r);
					display.moveTo(0, 0);
					display.drawCircle(0, 0, r * 2);
				}
			});

			setColor(rule, "stroke", ic, "secondaryButtonText");
			setColor(rule, "fill", ic, "background");
		}

		/**
		 * ------------------------------------------------------------------------
		 * Settings Button
		 * ------------------------------------------------------------------------
		 */

		{
			const rule = r("Graphics", ["settings", "button", "icon"]);

			rule.setAll({
				strokeOpacity: 0.7,
				strokeWidth: 0.5,
				draw: (display: any) => {
					const r = 10;
					const ir = 8;
					const spikes = 9;
					const angleStep = 360 / spikes * $math.RADIANS / 2;
					display.moveTo(r, 0)
					let angle = 0;
					let dAngle = 5 * $math.RADIANS;
					for (let i = 0; i < spikes; i++) {
						angle += angleStep;
						display.lineTo(r * Math.cos(angle), r * Math.sin(angle));
						display.lineTo(ir * Math.cos(angle + dAngle), ir * Math.sin(angle + dAngle));
						angle += angleStep;
						display.lineTo(ir * Math.cos(angle - dAngle), ir * Math.sin(angle - dAngle));
						display.lineTo(r * Math.cos(angle), r * Math.sin(angle));
					}

					display.drawCircle(0, 0, 4);
				}
			});

			setColor(rule, "stroke", ic, "secondaryButtonText");
			setColor(rule, "fill", ic, "background");
		}


		/**
		 * ------------------------------------------------------------------------
		 * Up Button
		 * ------------------------------------------------------------------------
		 */

		{
			const rule = r("Graphics", ["up", "button", "icon"]);

			rule.setAll({
				strokeOpacity: 0.7,
				strokeWidth: 0.5,
				draw: (display: any) => {
					let r = 5;
					display.moveTo(0, 5);
					display.lineTo(0, -5);
					display.moveTo(0, -5);
					display.lineTo(-5, 0);
					display.moveTo(0, -5);
					display.lineTo(5, 0);
					display.drawCircle(0, 0, 2 * r);
				}
			});

			setColor(rule, "stroke", ic, "secondaryButtonText");
			setColor(rule, "fill", ic, "background");
		}

		/**
		 * ------------------------------------------------------------------------
		 * Expand Button
		 * ------------------------------------------------------------------------
		 */

		{
			const rule = r("Graphics", ["expand", "button", "icon"]);

			rule.setAll({
				strokeOpacity: 0.7,
				strokeWidth: 0.5,
				draw: (display: any) => {
					let r = 5;
					display.moveTo(-5, -2);
					display.lineTo(-5, -5);
					display.lineTo(5, -5);
					display.lineTo(5, -2);

					display.moveTo(5, 2);
					display.lineTo(5, 5);
					display.lineTo(-5, 5);
					display.lineTo(-5, 2);

					display.drawCircle(0, 0, 2 * r);
				}
			});

			setColor(rule, "stroke", ic, "secondaryButtonText");
			setColor(rule, "fill", ic, "background");
		}

		/**
		 * ------------------------------------------------------------------------
		 * Down Button
		 * ------------------------------------------------------------------------
		 */
		{
			const rule = r("Graphics", ["down", "button", "icon"]);

			rule.setAll({
				strokeOpacity: 0.7,
				strokeWidth: 0.5,
				draw: (display: any) => {
					let r = 5;
					display.moveTo(0, -5);
					display.lineTo(0, 5);
					display.moveTo(0, 5);
					display.lineTo(-5, 0);
					display.moveTo(0, 5);
					display.lineTo(5, 0);
					display.drawCircle(0, 0, 2 * r);
				}
			});

			setColor(rule, "stroke", ic, "secondaryButtonText");
			setColor(rule, "fill", ic, "background");
		}

		// Class: Inicator
		r("Indicator").setAll({
			position: "absolute",
			autoOpenSettings: true
		});

		/**
		 * ------------------------------------------------------------------------
		 * Drawing related
		 * ------------------------------------------------------------------------
		 */

		r("DrawingSeries").setAll({
			field: "value",
			selectorPadding: 10
		})


		// bullet of all drawing series
		{
			const rule = r("Container", ["drawing", "grip"]);
			rule.states.create("hover", {});
		}

		{
			const rule = r("Circle", ["drawing", "grip"]);

			rule.setAll({
				strokeOpacity: 0.7,
				strokeWidth: 1,
				radius: 5
			});

			setColor(rule, "fill", ic, "background");
			setColor(rule, "stroke", ic, "alternativeBackground");

			const stateRule = rule.states.create("hover", { strokeWidth: 2 });
			setColor(stateRule, "stroke", ic, "negative");
		}

		r("Circle", ["drawing", "grip", "outline"]).setAll({
			radius: 8,
			strokeWidth: 4,
			strokeOpacity: 0,
			fillOpacity: 0
		})

		r("Circle", ["drawing", "grip", "outline"]).states.create("hover", {
			radius: 10,
			strokeWidth: 4,
			strokeOpacity: 0.3
		})

		r("Circle", ["drawing", "grip", "outline", "label"]).setAll({
			forceHidden: true
		})

		r("Circle", ["drawing", "grip", "label"]).setAll({
			forceHidden: true
		})

		r("Circle", ["drawing", "grip", "callout"]).setAll({
			fillOpacity: 0,
			forceHidden: true
		})

		r("Circle", ["drawing", "grip", "outline", "callout"]).setAll({
			forceHidden: false
		})

		r("Triangle", ["drawing", "arrow"]).setAll({
			width: 22,
			height: 17
		})

		{
			const rule = r("Graphics", ["series", "fill", "drawing"])

			rule.setAll({
				fillOpacity: 0.2,
				visible: true,
				draggable: true
			});

			rule.states.create("hover", {
				fillOpacity: 0.4
			})
		}

		r("Line", ["drawing"]).setAll({
			strokeDasharray: [2, 2],
			strokeWidth: 1,
			draggable: true
		});

		r("Line", ["drawing", "hit"]).setAll({
			strokeWidth: 22,
			strokeOpacity: 0,
			strokeDasharray: 0,
			draggable: true
		});

		r("Line", ["drawing", "hit", "horizontal"]).setAll({
			strokeWidth: 22
		});

		r("Line", ["drawing", "hit", "vertical"]).setAll({
			strokeWidth: 22
		});

		r("Line", ["drawing", "hit", "ray"]).setAll({
			strokeWidth: 22
		});

		{
			const rule = r("Graphics", ["series", "fill", "drawing", "doodle"])
			rule.setAll({
				fillOpacity: 0
			});

			rule.states.create("hover", { fillOpacity: 0 })
		}

		{
			const rule = r("Graphics", ["series", "stroke", "drawing", "measure"])
			rule.setAll({
				strokeOpacity: 0
			});
		}

		r("Line", ["drawing", "measure"]).setAll({
			strokeDasharray: [],
			strokeWidth: 1,
			crisp: true,
			strokeOpacity: 0.7,
			draggable: false
		});

		{
			const rule = r("Graphics", ["line", "series", "stroke", "drawing"]);
			rule.setAll({
				strokeWidth: 2,
				draggable: true
			});

			const stateRule = rule.states.create("hover", {});
			setColor(stateRule, "stroke", ic, "negative");
		}

		{
			const rule = r("Graphics", ["drawing", "icon"])
			rule.setAll({
				centerX: p50,
				centerY: p100,
				strokeOpacity: 1,
				strokeWidth: 2
			});

			const hoverRule = rule.states.create("hover", {})
			setColor(hoverRule, "stroke", ic, "negative")
		}

		r("Label", ["drawing", "label"]).setAll({
			centerX: p0,
			centerY: p50,
			minHeight: 28,
			minWidth: 28
		});

		r("Label", ["drawing", "measure"]).setAll({
			centerX: p50,
			centerY: p50,
			fill: ic.get("alternativeText"),
			textAlign: "center"
		});

		r("RoundedRectangle", ["background", "drawing", "measure"]).setAll({
			centerX: p50,
			centerY: p50,
			fillOpacity: 0.7
		});

		r("PointedRectangle", ["drawing", "callout"]).setAll({
			fillOpacity: 1,
			strokeOpacity: 0
		});


		{
			const rule = r("Ellipse", ["drawing"]);
			rule.setAll({
				strokeOpacity: 1,
				strokeWidth: 2,
				isMeasured: false,
				position: "absolute",
				draggable: true,
				fillOpacity: 0.25
			})

			const stateRule = rule.states.create("hover", {
				fillOpacity: 0.5
			});

			setColor(stateRule, "stroke", ic, "negative");
		}

		r("FibonacciSeries").setAll({
			sequence: [0, 0.236, 0.382, 0.5, 0.618, 0.768, 1, 1.618, 2.618, 3.618, 4.236],
			colors: [
				color(0x868686),
				color(0xed483c),
				color(0x83c486),
				color(0x4fab53),
				color(0x059183),
				color(0x69b4f1),
				color(0x868686),
				color(0x3065f8),
				color(0xed483c),
				color(0x982bab),
				color(0xe22465)
			]
		})

		r("Graphics", ["line", "series", "stroke", "drawing", "fibonacci"]).setAll({
			strokeWidth: 0.5,
			strokeOpacity: 1
		});

		r("Label", ["fibonacci"]).setAll({
			populateText: true,
			text: "{sequence} ({value.formatNumber('#.00')})",
			centerX: p100,
			centerY: p100,
			paddingBottom: 2,
			fontSize: "0.8em"
		})

		r("Label", ["fibonaccitimezone"]).setAll({
			populateText: true,
			text: "{value.formatNumber('#')}",
			centerX: 0,
			centerY: p100,
			paddingBottom: 2,
			paddingLeft: 3,
			fontSize: "0.8em"
		})

		r("FibonacciTimezoneSeries").setAll({
			sequence: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
			colors: []
		})


		r("Graphics", ["line", "series", "fill", "drawing", "fibonaccitimezone"]).setAll({
			draggable: false,
			fillOpacity: 0.1
		});


		r("Graphics", ["line", "series", "stroke", "drawing", "fibonaccitimezone"]).setAll({
			draggable: false,
			strokeWidth: 0.5,
			strokeOpacity: 1
		});


		r("Grid", ["overbought"]).setAll({
			strokeOpacity: 0.4
		});


		r("Grid", ["oversold"]).setAll({
			strokeOpacity: 0.4,
		});

		// series fill below oversold
		r("Graphics", ["overboughtoversold", "oversold", "fill"]).setAll({
			visible: true,
			fillOpacity: 0.2
		});

		// series fill above oversold
		r("Graphics", ["overboughtoversold", "overbought", "fill"]).setAll({
			visible: true,
			fillOpacity: 0.2
		});

		r("Graphics", ["fill", "bollingerbands", "upper"]).setAll({
			fillOpacity: 0.2
		})

		r("Graphics", ["fill", "movingaverageenvelope", "upper"]).setAll({
			fillOpacity: 0.2
		})

		r("Graphics", ["series", "line", "accumulativeswingindex"]).setAll({
			fillOpacity: 0.2,
			visible: true
		})

		r("XYChart", ["indicator"]).setAll({
			height: percent(30),
			minHeight: 80
		})

		r("AxisLabel", ["x", "indicator"]).setAll({
			forceHidden: true
		})


		r("XYSeries", ["indicator"]).setAll({
			legendLabelText: "{name}"
		})


		/// LEGEND LABELS

		r("LineSeries", ["accumulationdistribution"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({useVolume})"
		})

		r("LineSeries", ["accumulativeswingindex"]).setAll({
			legendValueText: "[{swingColor} bold]{valueY.formatNumber('#.0000')}[/]",
			legendLabelText: "{shortName} ({limitMoveValue})"
		})

		r("LineSeries", ["aroon"]).setAll({
			legendValueText: "[{upColor} bold]{up.formatNumber('#.00')}%[/] [{downColor} bold]{down.formatNumber('#.00')}%[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')})"
		})

		r("ColumnSeries", ["awesomeoscillator"]).setAll({
			legendValueText: "[{oscillatorColor}; bold]{valueY.formatNumber('#.00')}[/]",
		})

		r("CandlestickSeries", ["heikinashi"]).setAll({
			legendValueText: "open: [bold]{openValueY.formatNumber('#.00')}[/] low: [bold]{lowValueY.formatNumber('#.00')}[/] high: [bold]{highValueY.formatNumber('#.00')}[/] close: [bold]{valueY.formatNumber('#.00')}[/]",
			legendRangeValueText: ""
		})

		r("LineSeries", ["indicator", "bollingerbands"]).setAll({
			legendValueText: "[{lowerColor} bold]{lower.formatNumber('#.00')}[/] [{seriesColor} bold]{valueY.formatNumber('#.00')}[/] [{upperColor} bold]{upper.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{field},{standardDeviations.formatNumber('#.')},{type})"
		})

		r("LineSeries", ["indicator", "macross"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/] [{fastColor} bold]{maf.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{fastPeriod.formatNumber('#.')})"
		})

		r("LineSeries", ["indicator", "accelerationbands"]).setAll({
			legendValueText: "[{lowerColor} bold]{lower.formatNumber('#.00')}[/] [{seriesColor} bold]{valueY.formatNumber('#.00')}[/] [{upperColor} bold]{upper.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{factor.formatNumber('#.#####')})"
		})

		r("LineSeries", ["chaikinmoneyflow"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')})"
		})

		r("LineSeries", ["chaikinoscillator"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{slowPeriod.formatNumber('#.')})"
		})

		r("LineSeries", ["bullbearpower"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber()}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')})"
		})

		r("LineSeries", ["commoditychannelindex"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')})"
		})

		r("LineSeries", ["disparityindex"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{field},{movingAverageType})"
		})

		r("LineSeries", ["macd"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/] [{signalColor} bold]{signal.formatNumber('#.00')}[/] [bold {differenceColor}]{difference.formatNumber('#.00')}[/b]",
			legendLabelText: "{shortName} ({fastPeriod.formatNumber('#.')},{slowPeriod.formatNumber('#.')},{signalPeriod.formatNumber('#.')})"
		})

		r("LineSeries", ["medianprice"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')})"
		})

		r("LineSeries", ["momentum"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{field})"
		})

		r("LineSeries", ["movingaverage"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{field},{type},{offset.formatNumber('#.')})"
		})

		r("ColumnSeries", ["movingaveragedeviation"]).setAll({
			legendValueText: "[{deviationColor}; bold]{valueY.formatNumber('#.00')}[/]",
		})

		r("LineSeries", ["indicator", "movingaverageenvelope"]).setAll({
			legendValueText: "[{lowerColor} bold]{lower.formatNumber('#.00')}[/] [{seriesColor} bold]{valueY.formatNumber('#.00')}[/] [{upperColor} bold]{upper.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{field},{shiftType},{shift.formatNumber('#.')},{type})"
		})

		r("LineSeries", ["onbalancevolume"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName}"
		})

		r("LineSeries", ["pvt"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName}"
		})

		r("LineSeries", ["rsi"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/] [{smaColor} bold]{sma.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{smaPeriod.formatNumber('#.')},{field})"
		})

		r("LineSeries", ["standarddeviation"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{field})"
		})


		r("LineSeries", ["stochasticmomentum"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/] [{emaColor} bold]{ema.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{dPeriod.formatNumber('#.')},{emaPeriod.formatNumber('#.')})"
		})

		r("LineSeries", ["stochastic"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/] [{slowColor} bold]{slow.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{kSmoothing.formatNumber('#.')},{dSmoothing.formatNumber('#.')})"
		})

		r("LineSeries", ["trix"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/] [{signalColor} bold]{signal.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')})"
		})

		r("LineSeries", ["typicalprice"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')})"
		})

		r("LineSeries", ["averagetruerange"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')})"
		})

		r("ColumnSeries", ["volume"]).setAll({
			legendValueText: "[{volumeColor}; bold]{valueY.formatNumber('#.000a')}[/]",
		})

		r("ColumnSeries", ["volumeprofile"]).setAll({
			legendLabelText: "{shortName}",
			legendValueText: "[{downColor}; bold]{down.formatNumber('#.000a')}[/] [{upColor}; bold]{up.formatNumber('#.000a')}[/]  [bold]{total.formatNumber('#.000a')}[/]"
		})

		r("LineSeries", ["vwap"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')},{field})"
		})


		r("LineSeries", ["williamsr"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({period.formatNumber('#.')})"
		})


		r("LineSeries", ["zigzag"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.00')}[/]",
			legendLabelText: "{shortName} ({deviation.formatNumber('#.')}, {depth.formatNumber('#.')})"
		})

		// end of legend labels

		r("RoundedRectangle", ["series", "column", "volumeprofile"]).setAll({
			fillOpacity: .3,
			strokeWidth: 2,
			strokeOpacity: 0
		})

		r("RoundedRectangle", ["series", "column", "volumeprofile"]).states.create("hover", {
			strokeOpacity: 1
		})

		r("RoundedRectangle", ["macd", "difference"]).setAll({
			fillOpacity: 0.5,
			strokeOpacity: 0
		})

		r("RoundedRectangle", ["series", "column", "awesomeoscillator"]).setAll({
			fillOpacity: 0.5,
			strokeOpacity: 0
		})

		{
			const rule = r("RoundedRectangle", ["series", "column", "volume"]);
			rule.setAll({
				fillOpacity: 0.5,
				stroke: ic.get("background"),
				strokeOpacity: 0.2
			})

			rule.adapters.add("fill", (fill, target: any) => {
				const dataItem = target.dataItem;
				if (dataItem) {
					const dataContext = dataItem.dataContext as any;
					if (dataContext.volumeColor != null) {
						return dataContext.volumeColor;
					}
				}
				return fill;
			})
		}

		r("RoundedRectangle", ["series", "column", "movingaveragedeviation"]).setAll({
			fillOpacity: 0.5,
			strokeOpacity: 0
		})

		// Y Axis of overbought/oversold indicators
		r("Grid", ["renderer", "y", "overboughtoversold"]).setAll({
			forceHidden: true
		})

		// Y Axis of indicators
		r("Grid", ["renderer", "y", "overboughtoversold"]).setAll({
			forceHidden: true
		})

		r("AxisLabel", ["renderer", "y", "overboughtoversold"]).setAll({
			forceHidden: true
		})

		r("MovingAverage").setAll({
			name: l.translateAny("Moving Average"),
			shortName: l.translateAny("MA"),
			seriesColor: color(0xab82da),
			type: "simple",
			field: "close",
			period: 20,
			offset: 0
		})

		r("MACross").setAll({
			name: l.translateAny("Moving Average Cross"),
			shortName: l.translateAny("MACross"),
			seriesColor: color(0xab82da),
			fastColor: color(0x1772DE),
			field: "close",
			period: 9,
			fastPeriod: 21
		})

		r("ZigZag").setAll({
			name: l.translateAny("ZigZag"),
			shortName: l.translateAny("ZigZag"),
			seriesColor: ic.get("alternativeBackground"),
			deviation: 5,
			depth: 3
		})

		r("MovingAverageEnvelope").setAll({
			name: l.translateAny("Moving Average Envelope"),
			shortName: l.translateAny("MA ENV"),
			seriesColor: color(0xff903f),
			upperColor: color(0xffc948),
			lowerColor: color(0xffaf74),
			type: "simple",
			field: "close",
			period: 20,
			offset: 0,
			shift: 5,
			shiftType: "percent"
		})

		r("MovingAverageDeviation").setAll({
			name: l.translateAny("Moving Average Deviation"),
			shortName: l.translateAny("MA Dev"),
			increasingColor: ic.get("positive"),
			decreasingColor: ic.get("negative"),
			type: "simple",
			field: "close",
			period: 20
		})

		r("StandardDeviation").setAll({
			name: l.translateAny("Standard Deviation"),
			seriesColor: ic.get("alternativeBackground"),
			shortName: l.translateAny("STDEV"),
			field: "close",
			period: 20
		})

		r("TypicalPrice").setAll({
			name: l.translateAny("Typical Price"),
			seriesColor: ic.get("alternativeBackground"),
			shortName: l.translateAny("Typical Price"),
			field: "hlc/3",
			period: 20
		})

		r("AverageTrueRange").setAll({
			name: l.translateAny("Average True Range"),
			seriesColor: color(0xff903f),
			shortName: l.translateAny("ATR"),
			period: 14
		})

		r("Trix").setAll({
			name: l.translateAny("Trix"),
			seriesColor: ic.get("alternativeBackground"),
			signalColor: color(0xff903f),
			shortName: l.translateAny("Trix"),
			field: "close",
			period: 20,
			signalPeriod: 9
		})

		r("MedianPrice").setAll({
			name: l.translateAny("Median Price"),
			seriesColor: ic.get("alternativeBackground"),
			shortName: l.translateAny("Median Price"),
			field: "hl/2",
			period: 20
		})


		r("VWAP").setAll({
			name: l.translateAny("Volume-Weighted Average Price"),
			shortName: l.translateAny("VWAP"),
			seriesColor: color(0xab82da),
			field: "hlc/3",
			period: 30
		})

		r("AccumulationDistribution").setAll({
			name: l.translateAny("Accumulation/Distribution"),
			shortName: l.translateAny("Accum/Dist"),
			seriesColor: color(0x707070),
			useVolume: true
		})

		r("DisparityIndex").setAll({
			name: l.translateAny("Disparity Index"),
			shortName: l.translateAny("Disparity"),
			seriesColor: color(0x707070),
			period: 14,
			field: "close",
			movingAverageType: "simple"
		})


		r("ChaikinMoneyFlow").setAll({
			name: l.translateAny("Chaikin Money Flow"),
			shortName: l.translateAny("Chaikin MF"),
			seriesColor: color(0x707070),
			period: 20
		})

		r("ChaikinOscillator").setAll({
			name: l.translateAny("Chaikin Oscillator"),
			period: 3,
			slowPeriod: 10,
			shortName: l.translateAny("Chaikin Osc"),
			seriesColor: color(0x707070)
		})

		r("BullBearPower").setAll({
			name: l.translateAny("Bull Bear Power"),
			period: 13,
			shortName: l.translateAny("BBP"),
			seriesColor: color(0x707070)
		})

		r("OnBalanceVolume").setAll({
			name: l.translateAny("On Balance Volume"),
			shortName: l.translateAny("On Bal Vol"),
			seriesColor: color(0x707070)
		})

		r("PVT").setAll({
			name: l.translateAny("Price Volume Trend"),
			shortName: l.translateAny("PVT"),
			seriesColor: color(0x707070)
		})

		r("BollingerBands").setAll({
			name: l.translateAny("Bollinger Bands"),
			shortName: l.translateAny("Bollinger"),
			standardDeviations: 2,
			seriesColor: color(0xff903f),
			upperColor: color(0xffc948),
			lowerColor: color(0xffaf74)
		});

		r("AccelerationBands").setAll({
			name: l.translateAny("Acceleration Bands"),
			shortName: l.translateAny("Acceleration"),
			factor: 0.001,
			period: 20,
			seriesColor: color(0xff903f),
			upperColor: color(0xe64c9b),
			lowerColor: color(0xe64c9b)
		});


		r("RelativeStrengthIndex").setAll({
			name: l.translateAny("Relative Strength Index"),
			shortName: l.translateAny("RSI"),
			period: 14,
			smaPeriod: 3,
			field: "close",
			overSold: 20,
			overBought: 80,
			overSoldColor: color(0xe40000),
			overBoughtColor: color(0x67b7dc),
			seriesColor: color(0xab82da),
			smaColor: color(0xff903f)
		})

		r("Momentum").setAll({
			name: l.translateAny("Momentum"),
			shortName: l.translateAny("Mom"),
			period: 14,
			field: "close",
			seriesColor: color(0xab82da)
		})

		r("WilliamsR").setAll({
			name: l.translateAny("Williams %R"),
			shortName: l.translateAny("Williams %R"),
			period: 14,
			field: "close",
			overSold: -80,
			overBought: -20,
			overSoldColor: color(0xe40000),
			overBoughtColor: color(0x67b7dc),
			seriesColor: color(0xab82da)
		})

		r("CommodityChannelIndex").setAll({
			name: l.translateAny("Commodity Channel Index"),
			shortName: l.translateAny("CCI"),
			period: 20,
			field: "close",
			overSold: -100,
			overBought: 100,
			overSoldColor: color(0xe40000),
			overBoughtColor: color(0x67b7dc),
			seriesColor: color(0xab82da)
		})

		r("StochasticOscillator").setAll({
			name: l.translateAny("Stochastic Oscillator"),
			shortName: l.translateAny("Stochastic Osc"),
			period: 14,
			kSmoothing: 1,
			dSmoothing: 3,
			field: "close",
			overSold: 20,
			overBought: 80,
			overSoldColor: color(0xe40000),
			overBoughtColor: color(0x67b7dc),
			seriesColor: color(0xab82da),
			slowColor: color(0xff903f)
		})

		r("StochasticMomentumIndex").setAll({
			name: l.translateAny("Stochastic Momentum Index"),
			shortName: l.translateAny("Stochastic MI"),
			period: 10,
			dPeriod: 3,
			emaPeriod: 3,
			field: "close",
			overSold: -40,
			overBought: 40,
			overSoldColor: color(0xe40000),
			overBoughtColor: color(0x67b7dc),
			seriesColor: color(0xab82da),
			emaColor: color(0xff903f)
		})

		r("AccumulativeSwingIndex").setAll({
			name: l.translateAny("Accumulative Swing Index"),
			shortName: l.translateAny("ACC Swing"),
			limitMoveValue: 1000,
			positiveColor: ic.get("positive"),
			negativeColor: ic.get("negative")
		})

		r("Aroon").setAll({
			name: l.translateAny("Aroon"),
			shortName: l.translateAny("Aroon"),
			period: 14,
			upColor: ic.get("positive"),
			downColor: ic.get("negative")
		})

		r("AwesomeOscillator").setAll({
			name: l.translateAny("Awesome Oscillator"),
			shortName: l.translateAny("Awesome"),
			increasingColor: ic.get("positive"),
			decreasingColor: ic.get("negative")
		});

		r("HeikinAshi").setAll({
			name: l.translateAny("Heikin Ashi"),
			shortName: l.translateAny("Heikin Ashi"),
			increasingColor: ic.get("positive"),
			decreasingColor: ic.get("negative")
		});


		r("Volume").setAll({
			name: l.translateAny("Volume"),
			shortName: l.translateAny("Volume"),
			increasingColor: ic.get("positive"),
			decreasingColor: ic.get("negative")
		});

		r("VolumeProfile").setAll({
			name: l.translateAny("Volume Profile"),
			shortName: l.translateAny("Volume Profile"),
			upColor: Color.fromHex(0xE3B30C),
			downColor: Color.fromHex(0x2E78E3),
			countType: "rows",
			count: 24,
			axisWidth: 40,
			valueArea: 70,
			valueAreaOpacity: 0.7
		});

		r("MACD").setAll({
			name: l.translateAny("MACD"),
			field: "close",
			shortName: l.translateAny("MACD"),
			fastPeriod: 12,
			slowPeriod: 26,
			signalPeriod: 9,
			increasingColor: ic.get("positive"),
			decreasingColor: ic.get("negative"),
			seriesColor: color(0xab82da),
			signalColor: color(0xff903f)
		});

		r("Grid", ["cursor", "y", "indicator"]).set("forceHidden", true);

		/**
		 * ------------------------------------------------------------------------
		 * Toolbar
		 * ------------------------------------------------------------------------
		 */

		r("StockControl").setAll({
			visible: true,
			active: false
		});

		r("IndicatorControl").setAll({
			name: l.translateAny("Indicators"),
			scrollable: true,
			fixedLabel: true,
			searchable: true,
			indicators: ["Acceleration Bands", "Accumulation Distribution", "Accumulative Swing Index", "Aroon", "Average True Range", "Awesome Oscillator", "Bollinger Bands", "Bull Bear Power", "Chaikin Money Flow", "Chaikin Oscillator", "Commodity Channel Index", "Disparity Index", "Heikin Ashi", "MACD", "Median Price", "Momentum", "Moving Average", "Moving Average Cross", "Moving Average Deviation", "Moving Average Envelope", "On Balance Volume", "Price Volume Trend", "Relative Strength Index", "Standard Deviation", "Stochastic Momentum Index", "Stochastic Oscillator", "Trix", "Typical Price", "Volume", "Volume Profile", "VWAP", "Williams R", "ZigZag"]
		});

		r("ComparisonControl").setAll({
			name: l.translateAny("Comparison")
		});

		const drawingIcons = [{
			svgPath: "M 5 35 L 5 15 L 26 15 L 26 5 L 45 25 L 26 45 L 26 35 L 5 35 Z",
			scale: 1,
			centerX: percent(100),
			centerY: percent(50)
		}, {
			svgPath: "M 45 35 L 45 15 L 24 15 L 24 5 L 5 25 L 24 45 L 24 35 L 45 35 Z",
			scale: 1,
			centerX: percent(0),
			centerY: percent(50)
		}, {
			svgPath: "M 35 5 L 15 5 L 15 26 L 5 26 L 25 45 L 45 26 L 35 26 L 35 5 Z",
			scale: 1,
			centerX: percent(50),
			centerY: percent(100)
		}, {
			svgPath: "M 35 45 L 15 45 L 15 24 L 5 24 L 25 5 L 45 24 L 35 24 L 35 45 Z",
			scale: 1,
			centerX: percent(50),
			centerY: percent(0)
		},
		// :)
		{
			svgPath: "M 5 25 A 1 1 0 0 0 45 25 A 1 1 0 0 0 5 25 M 14 19 A 1 1 0 0 0 19 19 A 1 1 0 0 0 14 19 M 36 19 A 1 1 0 0 0 31 19 A 1 1 0 0 0 36 19 M 16 32 C 20 39 30 39 34 32",
			scale: 1,
			centerX: percent(50),
			centerY: percent(50)
		},
		// :(
		{
			svgPath: "M 5 25 A 1 1 0 0 0 45 25 A 1 1 0 0 0 5 25 M 14 19 A 1 1 0 0 0 19 19 A 1 1 0 0 0 14 19 M 36 19 A 1 1 0 0 0 31 19 A 1 1 0 0 0 36 19 M 33 37 C 28 32 21 32 16 37",
			scale: 1,
			centerX: percent(50),
			centerY: percent(50)
		},
		// :|
		{
			svgPath: "M 5 25 A 1 1 0 0 0 45 25 A 1 1 0 0 0 5 25 M 14 19 A 1 1 0 0 0 19 19 A 1 1 0 0 0 14 19 M 36 19 A 1 1 0 0 0 31 19 A 1 1 0 0 0 36 19 M 32 35 L 18 35",
			scale: 1,
			centerX: percent(50),
			centerY: percent(50)
		}, {
			svgPath: "M 25 46 C 25 38 -6 18 10 5 C 16 1 25 3 25 10 C 25 3 34 1 40 5 C 56 18 25 38 25 46",
			scale: 1,
			centerX: percent(50),
			centerY: percent(100)
		},
		// Flag right
		{
			svgPath: "M 2 43 L 2 4 L 26 4 L 17 15 L 26 26 L 2 26 Z",
			scale: 1,
			centerX: percent(0),
			centerY: percent(100)
		},
		// star 5
		{
			svgPath: "M 25,2 L 25,2 L 33,14 L 47,18 L 37,29 L 39,44 L 25,38 L 11,44 L 13,29 L 3,18 L 17,14 L 25,2 Z",
			scale: 1,
			centerX: percent(50),
			centerY: percent(50)
		},
		// star 8
		{
			svgPath: "M 25,2 L 25,2 L 30,13 L 41,9 L 37,20 L 48,25 L 37,30 L 41,41 L 30,37 L 25,48 L 20,37 L 9,41 L 13,30 L 2,25 L 13,20 L 9,9 L 20,13 L 25,2 Z",
			scale: 1,
			centerX: percent(50),
			centerY: percent(50)
		},
		// star 10
		{
			svgPath: "M 25,2 L 25,2 L 30,10 L 39,6 L 38,16 L 47,18 L 41,25 L 47,32 L 38,34 L 39,44 L 30,40 L 25,48 L 20,40 L 11,44 L 12,34 L 3,32 L 9,25 L 3,18 L 12,16 L 11,6 L 20,10 L 25,2 Z",
			scale: 1,
			centerX: percent(50),
			centerY: percent(50),
			style: { fillOpacity: 0 }
		},
		// >>
		{
			svgPath: "M 8 8 L 25 25 L 8 42 M 20 8 L 37 25 L 20 42",
			scale: 1,
			centerX: percent(100),
			centerY: percent(50),
			fillDisabled: true
		},
		// <<
		{
			svgPath: "M 42 8 L 25 25 L 42 42 M 30 8 L 13 25 L 30 42",
			scale: 1,
			centerX: percent(0),
			centerY: percent(50),
			fillDisabled: true
		},
		// ^^
		{
			svgPath: "M 42 42 L 25 25 L 9 42 M 9 29 L 25 13 L 42 30",
			scale: 1,
			centerX: percent(100),
			centerY: percent(50),
			fillDisabled: true
		},
		// vv
		{
			svgPath: "M 42 8 L 25 25 L 8 8 M 8 20 L 25 37 L 42 20",
			scale: 1,
			centerX: percent(100),
			centerY: percent(50),
			fillDisabled: true
		}]



		r("DrawingControl").setAll({
			name: l.translateAny("Draw"),
			tool: "Line",
			tools: ["Arrows &amp; Icons", "Average", "Callout", "Doodle", "Ellipse", "Fibonacci", "Fibonacci Timezone", "Horizontal Line", "Horizontal Ray", "Label", "Line", "Line Arrow", "Measure", "Parallel Channel", "Polyline", "Polyfill", "Quadrant Line", "Rectangle", "Regression", "Trend Line", "Triangle", "Vertical Line"],
			togglable: true,
			strokeColor: color(0x882dff),
			strokeWidth: 2,
			strokeWidths: [1, 2, 4, 8, 16],
			strokeDasharray: [],
			strokeDasharrays: [[], [2, 2], [6, 3], [8, 4, 2, 4]],
			strokeOpacity: 1,
			showExtension: true,
			fillColor: color(0xad6eff),
			fillOpacity: 0.2,
			labelFill: color(0x000000),
			labelFontSize: "12px",
			labelFontSizes: ["8px", "10px", "11px", "12px", "14px", "16px", "20px", "24px", "36px", "48px"],
			labelFontWeight: "normal",
			labelFontStyle: "normal",
			labelFontFamily: "Arial",
			labelFontFamilies: ["Arial", "Courier New", "Garamond", "Georgia", "Times New Roman"],
			drawingIcon: drawingIcons[0],
			drawingIcons: drawingIcons,
			snapToData: false,
			scrollable: true
		});

		r("ColorControl").setAll({
			useOpacity: true
		});

		r("DateRangeSelector").setAll({
			description: l.translateAny("Date Range"),
			minDate: "auto",
			maxDate: "auto"
		});

		r("PeriodSelector").setAll({
			description: l.translateAny("Period selector"),
			togglable: false,
			icon: "none",
			periods: [
				//{ timeUnit: "day", count: 1, name: "1" + l.translateAny("D") },
				{ timeUnit: "day", count: 5, name: "5" + l.translateAny("D") },
				{ timeUnit: "month", count: 1, name: "1" + l.translateAny("M") },
				{ timeUnit: "month", count: 3, name: "3" + l.translateAny("M") },
				{ timeUnit: "month", count: 6, name: "6" + l.translateAny("M") },
				{ timeUnit: "ytd", name: l.translateAny("YTD") },
				{ timeUnit: "year", count: 1, name: "1" + l.translateAny("Y") },
				{ timeUnit: "year", count: 2, name: "2" + l.translateAny("Y") },
				{ timeUnit: "year", count: 5, name: "5" + l.translateAny("Y") },
				{ timeUnit: "max", name: l.translateAny("Max") },
			]
		});

		// r("IconControl").setAll({
		// });

		// r("DrawingToolControl").setAll({
		// 	//name: l.translateAny("Draw"),
		// 	//tools: ["Average", "Callout", "Doodle", "Ellipse", "Fibonacci", "Horizontal Line", "Horizontal Ray", "Arrows &amp; Icons", "Label", "Line", "Polyline", "Quadrant Line", "Rectangle", "Regression", "Trend Line", "Vertical Line"]
		// });

		r("DropdownListControl").setAll({
			fixedLabel: false
		});

		r("DropdownList").setAll({
			searchable: true,
			maxSearchItems: 10,
			items: []
		});

		r("ComparisonControl").setAll({
			fixedLabel: true
		});

		r("SeriesTypeControl").setAll({
			currentItem: "candlestick",
			items: [{
				id: "line",
				label: l.translateAny("Line"),
				icon: StockIcons.getIcon("Line Series")
			}, {
				id: "candlestick",
				label: l.translateAny("Candles"),
				icon: StockIcons.getIcon("Candlestick Series")
			}, {
				id: "procandlestick",
				label: l.translateAny("Hollow Candles"),
				icon: StockIcons.getIcon("Pro Candlestick Series")
			}, {
				id: "ohlc",
				label: l.translateAny("Sticks"),
				icon: StockIcons.getIcon("OHLC Series")
			}]
		});

		r("IntervalControl").setAll({
			currentItem: "1 day",
			items: [
				{ id: "1 minute", label: "1 " + l.translateAny("minute"), interval: { timeUnit: "minute", count: 1 } },
				{ id: "2 minute", label: "2 " + l.translateAny("minutes"), interval: { timeUnit: "minute", count: 2 } },
				{ id: "5 minute", label: "5 " + l.translateAny("minutes"), interval: { timeUnit: "minute", count: 5 } },
				{ id: "15 minute", label: "15 " + l.translateAny("minutes"), interval: { timeUnit: "minute", count: 15 } },
				{ id: "30 minute", label: "30 " + l.translateAny("minutes"), interval: { timeUnit: "minute", count: 30 } },
				{ id: "1 hour", label: "1 " + l.translateAny("hour"), interval: { timeUnit: "hour", count: 1 } },
				{ id: "4 hour", label: "4 " + l.translateAny("hours"), interval: { timeUnit: "hour", count: 4 } },
				{ id: "1 day", label: "1 " + l.translateAny("day"), interval: { timeUnit: "day", count: 1 } },
				{ id: "1 week", label: "1 " + l.translateAny("week"), interval: { timeUnit: "week", count: 1 } },
				{ id: "1 month", label: "1 " + l.translateAny("month"), interval: { timeUnit: "month", count: 1 } },
				{ id: "1 year", label: "1 " + l.translateAny("year"), interval: { timeUnit: "year", count: 1 } }
			]
		});

		r("DropdownColors").setAll({
			colors: ColorSet.new(this._root, {
				colors: [
					color(0x000000), color(0x464e56), color(0x5b636a), color(0x767d84), color(0xb9bdc5), color(0xe0e4e9), color(0xf7f8ff), color(0xffffff),
					color(0x72d3ff), color(0xad6eff), color(0xff80c5), color(0xffbd74), color(0xffe786), color(0x64f1d9), color(0xff8084), color(0x79f4bd),
					color(0x2bbcff), color(0x882dff), color(0xff4aad), color(0xffa33f), color(0xffdb48), color(0x22dbbc), color(0xff333a), color(0x00b061),
					color(0x0780eb), color(0x6500e8), color(0xc70085), color(0xe5632a), color(0xefbb00), color(0x00a19a), color(0xdc142d), color(0x009c56),
					color(0x0061cb), color(0x4300ac), color(0x970064), color(0xc73b0a), color(0xe09c00), color(0x006c84), color(0xae1125), color(0x00894c),
				]
			})
		});

		r("ResetControl").setAll({
			description: l.translateAny("Reset"),
			togglable: false,
			//align: "right"
		});

		r("SettingsControl").setAll({
			description: l.translateAny("Settings"),
			togglable: true,
			fixedLabel: true,
			//align: "right",
			items: [{
				id: "fills",
				label: l.translateAny("X-axis fills"),
				className: "am5stock-list-info am5stock-list-heading"
			}, {
				form: "checkbox",
				id: "fills",
				label: l.translateAny("Fills")
			}, {
				id: "y-scale",
				label: l.translateAny("Y-axis scale"),
				className: "am5stock-list-info am5stock-list-heading"
			}, {
				id: "y-scale",
				form: "radio",
				value: "percent",
				label: l.translateAny("Change percent")
			}, {
				id: "y-scale",
				form: "radio",
				value: "regular",
				label: l.translateAny("Regular")
			}, {
				id: "y-scale",
				form: "radio",
				value: "logarithmic",
				label: l.translateAny("Logarithmic")
			}, {
				id: "autosave",
				label: l.translateAny("Drawings &amp; Indicators"),
				className: "am5stock-list-info am5stock-list-heading"
			}, {
				id: "autosave",
				form: "checkbox",
				label: l.translateAny("Auto-save")
			},]
		});

		r("DataSaveControl").setAll({
			description: l.translateAny("Save drawings and indicators"),
			togglable: true,
			fixedLabel: true,
			autoSave: false,
			items: [{
				id: "autosave",
				form: "checkbox",
				label: l.translateAny("Auto-save drawings and indicators")
			}, {
				id: "save",
				label: l.translateAny("Save drawings &amp; indicators"),
				subLabel: l.translateAny("Saves drawings/indicators to browser local storage")
			}, {
				id: "restore",
				label: l.translateAny("Restore saved data"),
				subLabel: l.translateAny("Restores saved data from browser local storage")
			}, {
				id: "clear",
				label: l.translateAny("Clear"),
				subLabel: l.translateAny("Clears saved data from browser local storage")
			}]
		});

		r("Measure").setAll({
			labelText: "{value} ({percent})\n{count.formatNumber('#,###.')} " + l.translateAny("bars") + " {intervalCount.formatNumber('#,###.')} {intervalUnit}",
			labelVolumeText: "\nVolume: {volume.formatNumber('#.##a')}",
		});

		{
			const rule = r("Rectangle", ["selector"]);
			rule.setAll({
				isMeasured: false,
				strokeDasharray: [2, 2],
				strokeOpacity: 0.5,
				strokeWidth: 1
			});

			setColor(rule, "stroke", ic, "alternativeBackground");
		}

	}

}