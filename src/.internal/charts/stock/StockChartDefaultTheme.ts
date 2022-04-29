import { Theme } from "../../core/Theme";
import { p100, p50, p0, percent } from "../../core/util/Percent";
import { setColor } from "../../themes/DefaultTheme";
import { color } from "../../core/util/Color";
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
			autoSetPercentScale: true
		});

		r("XYChart", ["stock"]).setAll({
			paddingLeft: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingTop: 15,
			minHeight: 80
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

		r("Grid", ["renderer", "x"]).setAll({
			forceHidden: true
		})

		r("Grid", ["renderer", "y"]).setAll({
			strokeOpacity: 0.05
		})

		r("Grid", ["renderer", "base", "y"]).setAll({
			strokeOpacity: 0.15
		})

		r("Graphics", ["renderer", "x", "fill"]).setAll({
			fillOpacity: 0.03,
			visible: true
		})

		r("Graphics", ["renderer", "x", "fill", "scrollbar"]).setAll({
			visible: false
		})

		r("Button", ["zoom"]).setAll({
			forceHidden: true
		})

		r("AxisRendererY", ["y"]).setAll({
			opposite: true
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
				fillOpacity: 0.5
			});
			setColor(rule, "fill", ic, "secondaryButtonHover");
		}

		{
			const rule = r("Graphics", ["control", "button", "icon"]).states.create("down", {
				fillOpacity: 0.5
			});
			setColor(rule, "fill", ic, "primaryButtonDown");
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

		/**
		 * ------------------------------------------------------------------------
		 * Drawing related
		 * ------------------------------------------------------------------------
		 */


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
		}

		{
			const rule = r("Circle", ["drawing", "grip", "outline"]);

			rule.setAll({
				strokeOpacity: 0,
				fillOpacity: 0,
				strokeWidth: 5,
				radius: 7
			});

			rule.states.create("hover", {
				strokeOpacity: 1,
				fillOpacity: 1
			});
		}

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
			strokeWidth: 20,
			strokeOpacity: 0,
			strokeDasharray: 0,
			draggable: true
		});

		{
			const rule = r("Line", ["drawing", "horizontal"])
			rule.setAll({
				strokeWidth: 2,
				strokeDasharray: 0
			});

			const stateRule = rule.states.create("hover", {});
			setColor(stateRule, "stroke", ic, "negative");
		}
		{
			const rule = r("Line", ["drawing", "vertical"])
			rule.setAll({
				strokeWidth: 2,
				strokeDasharray: 0
			});

			const stateRule = rule.states.create("hover", {});
			setColor(stateRule, "stroke", ic, "negative");
		}

		r("Line", ["drawing", "average"]).setAll({

		});
		{
			const rule = r("Graphics", ["series", "fill", "drawing", "doodle"])
			rule.setAll({
				fillOpacity: 0
			});

			rule.states.create("hover", { fillOpacity: 0 })
		}

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
			centerY: p50
		});

		r("PointedRectangle", ["drawing", "callout"]).setAll({
			fillOpacity: 1,
			strokeOpacity: 0
		});

		// resizer
		{
			const rule = r("RoundedRectangle", ["drawing", "grip"]);

			rule.setAll({
				strokeOpacity: 0.7,
				strokeWidth: 1,
				fillOpacity: 1,
				width: 12,
				height: 12
			});

			setColor(rule, "fill", ic, "background");
			setColor(rule, "stroke", ic, "alternativeBackground");
		}

		{
			const rule = r("RoundedRectangle", ["drawing", "grip", "outline"]);

			rule.setAll({
				strokeOpacity: 0,
				fillOpacity: 0,
				width: 20,
				height: 20
			});

			rule.states.create("hover", {
				fillOpacity: 0.5
			});

			setColor(rule, "fill", ic, "alternativeBackground");
		}

		r("SpriteResizer").setAll({
			rotationStep: 10
		})

		r("RoundedRectangle", ["resizer", "grip", "left"]).setAll({
			cornerRadiusBL: 0,
			cornerRadiusBR: 0,
			cornerRadiusTL: 0,
			cornerRadiusTR: 0
		});

		r("RoundedRectangle", ["resizer", "grip", "right"]).setAll({
			cornerRadiusBL: 0,
			cornerRadiusBR: 0,
			cornerRadiusTL: 0,
			cornerRadiusTR: 0
		});

		{
			const rule = r("Rectangle", ["resizer", "rectangle"]);
			rule.setAll({
				strokeDasharray: [2, 2],
				strokeOpacity: 0.5,
				strokeWidth: 1
			});

			setColor(rule, "stroke", ic, "alternativeBackground");
		}
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

		r("IconSeries").setAll({
			snapToData: true
		})

		r("Graphics", ["line", "series", "stroke", "drawing", "fibonacci"]).setAll({
			forceInactive: true,
			strokeWidth: 0.5,
			strokeOpacity: 1
		});

		r("Graphics", ["line", "series", "fill", "drawing", "fibonacci"]).setAll({
			forceInactive: true,
			draggable: false
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
			text: "{value}",
			centerX: p50,
			centerY: p100,
			paddingBottom: 2,
			fontSize: "0.8em"
		})

		r("FibonacciTimezoneSeries").setAll({
			sequence: [1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
			colors: []
		})


		r("Graphics", ["line", "series", "fill", "drawing", "fibonaccitimezone"]).setAll({
			forceInactive: true,
			draggable: false,
			fillOpacity: 0.1
		});


		r("Graphics", ["line", "series", "stroke", "drawing", "fibonaccitimezone"]).setAll({
			forceInactive: true,
			strokeWidth: 0.5,
			strokeOpacity: 1
		});


		r("Grid", ["overbought"]).setAll({
			strokeOpacity: 0.3
		});


		r("Grid", ["oversold"]).setAll({
			strokeOpacity: 0.3,
		});


		// series fill below oversold
		r("Graphics", ["rsi", "oversold", "fill"]).setAll({
			visible: true,
			fillOpacity: 0.2
		});

		// series fill below oversold
		r("Graphics", ["williamsr", "oversold", "fill"]).setAll({
			visible: true,
			fillOpacity: 0.2
		});

		// series fill below oversold
		r("Graphics", ["commoditychannelindex", "oversold", "fill"]).setAll({
			visible: true,
			fillOpacity: 0.2
		});

		// series fill above oversold
		r("Graphics", ["rsi", "overbought", "fill"]).setAll({
			visible: true,
			fillOpacity: 0.2
		});

		// series fill above oversold
		r("Graphics", ["williamsr", "overbought", "fill"]).setAll({
			visible: true,
			fillOpacity: 0.2
		});

		r("Graphics", ["commoditychannelindex", "overbought", "fill"]).setAll({
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


		r("LineSeries", ["rsi"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period},{field})"
		})

		r("LineSeries", ["williamsr"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period})"
		})

		r("LineSeries", ["commoditychannelindex"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period})"
		})

		r("LineSeries", ["stochastic"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/] [{slowColor} bold]{slow.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period},{field})"
		})

		r("LineSeries", ["indicator", "bollingerbands"]).setAll({
			legendValueText: "[{lowerColor} bold]{lower.formatNumber('#.000a')}[/] [{seriesColor} bold]{valueY.formatNumber('#.000a')}[/] [{upperColor} bold]{upper.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period},{field},{standardDeviations},{type})"
		})

		r("LineSeries", ["movingaverage"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period},{field},{type},{offset})"
		})

		r("LineSeries", ["indicator", "movingaverageenvelope"]).setAll({
			legendValueText: "[{lowerColor} bold]{lower.formatNumber('#.000a')}[/] [{seriesColor} bold]{valueY.formatNumber('#.000a')}[/] [{upperColor} bold]{upper.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period},{field},{shiftType},{shift},{type})"
		})

		r("LineSeries", ["accumulationdistribution"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({useVolume})"
		})

		r("LineSeries", ["disparityindex"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period},{field},{movingAverageType})"
		})

		r("LineSeries", ["chaikinmoneyflow"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period})"
		})

		r("LineSeries", ["chaikinoscillator"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period},{slowPeriod})"
		})

		r("LineSeries", ["onbalancevolume"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName}"
		})

		r("LineSeries", ["accumulativeswingindex"]).setAll({
			legendValueText: "[{swingColor} bold]{valueY.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({limitMoveValue})"
		})

		r("LineSeries", ["aroon"]).setAll({
			legendValueText: "[{upColor} bold]{up.formatNumber('#.000a')}[/] [{downColor} bold]{down.formatNumber('#.000a')}[/]",
			legendLabelText: "{shortName} ({period})"
		})

		r("ColumnSeries", ["awesomeoscillator"]).setAll({
			legendValueText: "[{oscillatorColor}; bold]{valueY.formatNumber('#.000a')}[/]",
		})

		r("ColumnSeries", ["volume"]).setAll({
			legendValueText: "[{volumeColor}; bold]{valueY.formatNumber('#.000a')}[/]",
		})

		r("ColumnSeries", ["movingaveragedeviation"]).setAll({
			legendValueText: "[{deviationColor}; bold]{valueY.formatNumber('#.000a')}[/]",
		})

		r("LineSeries", ["macd"]).setAll({
			legendValueText: "[{seriesColor} bold]{valueY.formatNumber('#.000')}[/] [{signalColor} bold]{signal.formatNumber('#.000')}[/] [bold {differenceColor}]{difference.formatNumber('#.000')}[/b]",
			legendLabelText: "{shortName} ({fastPeriod},{slowPeriod},{signalPeriod})"
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

		// Y Axis of indicators
		r("Grid", ["renderer", "y", "rsi"]).setAll({
			forceHidden: true
		})

		r("AxisLabel", ["renderer", "y", "rsi"]).setAll({
			forceHidden: true
		})

		// Y Axis of indicators
		r("Grid", ["renderer", "y", "williamsr"]).setAll({
			forceHidden: true
		})

		r("AxisLabel", ["renderer", "y", "williamsr"]).setAll({
			forceHidden: true
		})

		r("Grid", ["renderer", "y", "commoditychannelindex"]).setAll({
			forceHidden: true
		})

		r("AxisLabel", ["renderer", "y", "commoditychannelindex"]).setAll({
			forceHidden: true
		})

		r("Grid", ["renderer", "y", "stochastic"]).setAll({
			forceHidden: true
		})

		r("AxisLabel", ["renderer", "y", "stochastic"]).setAll({
			forceHidden: true
		})


		r("MovingAverage").setAll({
			name: "Moving Average",
			shortName: "MA",
			seriesColor: color(0xab82da),
			type: "simple",
			field: "close",
			period: 20,
			offset: 0
		})

		r("MovingAverageEnvelope").setAll({
			name: "Moving Average Envelope",
			shortName: "MA ENV",
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
			name: "Moving Average Deviation",
			shortName: "MA Dev",
			increasingColor: ic.get("positive"),
			decreasingColor: ic.get("negative"),
			type: "simple",
			field: "close",
			period: 20
		})

		r("AccumulationDistribution").setAll({
			name: "Accumulation/Distribution",
			shortName: "Accum/Dist",
			seriesColor: color(0x707070),
			useVolume: true
		})

		r("DisparityIndex").setAll({
			name: "Disparity Index",
			shortName: "Disparity",
			seriesColor: color(0x707070),
			period: 14,
			field: "close",
			movingAverageType: "simple"
		})


		r("ChaikinMoneyFlow").setAll({
			name: "Chaikin Money Flow",
			shortName: "Chaikin MF",
			seriesColor: color(0x707070),
			period: 20
		})

		r("ChaikinOscillator").setAll({
			name: "Chaikin Oscillator",
			period: 3,
			slowPeriod: 10,
			shortName: "Chaikin Osc",
			seriesColor: color(0x707070)
		})

		r("OnBalanceVolume").setAll({
			name: "On Balance Volume",
			shortName: "On Bal Vol",
			seriesColor: color(0x707070)
		})

		r("BollingerBands").setAll({
			name: "Bollinger Bands",
			shortName: "Bollinger",
			standardDeviations: 2,
			seriesColor: color(0xff903f),
			upperColor: color(0xffc948),
			lowerColor: color(0xffaf74)
		});


		r("RelativeStrengthIndex").setAll({
			name: "Relative Strength Index",
			shortName: "RSI",
			period: 14,
			field: "close",
			overSold: 20,
			overBought: 80,
			overSoldColor: color(0xe40000),
			overBoughtColor: color(0x67b7dc),
			seriesColor: color(0xab82da)
		})

		r("WilliamsR").setAll({
			name: "Williams %R",
			shortName: "Williams %R",
			period: 14,
			field: "close",
			overSold: -80,
			overBought: -20,
			overSoldColor: color(0xe40000),
			overBoughtColor: color(0x67b7dc),
			seriesColor: color(0xab82da)
		})

		r("CommodityChannelIndex").setAll({
			name: "Commodity Channel Index",
			shortName: "CCI",
			period: 20,
			field: "close",
			overSold: -100,
			overBought: 100,
			overSoldColor: color(0xe40000),
			overBoughtColor: color(0x67b7dc),
			seriesColor: color(0xab82da)
		})

		r("StochasticOscillator").setAll({
			name: "Stochastic Oscillator",
			shortName: "Stochastic",
			period: 14,
			kSmoothing: 1,
			dSmoothing: 3,
			field: "close",
			overSold: 20,
			overBought: 80,
			seriesColor: color(0x707070),
			slowColor: ic.get("negative")
		})

		r("AccumulativeSwingIndex").setAll({
			name: "Accumulative Swing Index",
			shortName: "ACC Swing",
			limitMoveValue: 1000,
			positiveColor: ic.get("positive"),
			negativeColor: ic.get("negative")
		})

		r("Aroon").setAll({
			name: "Aroon",
			shortName: "Aroon",
			period: 14,
			upColor: ic.get("positive"),
			downColor: ic.get("negative")
		})

		r("AwesomeOscillator").setAll({
			name: "Awesome Oscillator",
			shortName: "Awesome",
			increasingColor: ic.get("positive"),
			decreasingColor: ic.get("negative")
		});

		r("Volume").setAll({
			name: "Volume",
			shortName: "Volume",
			increasingColor: ic.get("positive"),
			decreasingColor: ic.get("negative")
		});

		r("MACD").setAll({
			name: "MACD",
			field: "close",
			shortName: "MACD",
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
			indicators: ["Aroon", "Accumulation Distribution", "Accumulative Swing Index", "Awesome Oscillator", "Bollinger Bands", "Chaikin Money Flow", "Chaikin Oscillator", "Commodity Channel Index", "Disparity Index", "MACD", "Moving Average", "Moving Average Deviation", "Moving Average Envelope", "On Balance Volume", "Relative Strength Index", "Stochastic Oscillator", "Volume", "Williams R"]
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
			tools: ["Average", "Callout", "Doodle", "Ellipse", "Fibonacci", "Fibonacci Timezone", "Horizontal Line", "Horizontal Ray", "Arrows &amp; Icons", "Label", "Line", "Polyline", "Quadrant Line", "Rectangle", "Regression", "Trend Line", "Vertical Line"],
			togglable: true,
			strokeColor: color(0x882dff),
			strokeWidth: 2,
			strokeWidths: [1, 2, 4, 8, 16],
			strokeDasharray: [],
			strokeDasharrays: [[], [2, 2], [6, 3], [8, 4, 2, 4]],
			strokeOpacity: 1,
			showExtension: true,
			fillColor: color(0xad6eff),
			fillOpacity: 0.5,
			labelFill: color(0x000000),
			labelFontSize: "12px",
			labelFontSizes: ["8px", "10px", "11px", "12px", "14px", "16px", "20px", "24px", "36px", "48px"],
			labelFontWeight: "normal",
			labelFontStyle: "normal",
			labelFontFamily: "Arial",
			labelFontFamilies: ["Arial", "Courier New", "Garamond", "Georgia", "Times New Roman"],
			drawingIcon: drawingIcons[0],
			drawingIcons: drawingIcons,
			snapToData: true
		});

		r("ColorControl").setAll({
			useOpacity: true
		});

		r("DateRangeSelector").setAll({
			description: l.translateAny("Date Range")
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
				label: l.translateAny("Pro Candles"),
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
			}]
		});
	}
}
