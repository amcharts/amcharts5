import type { GanttDateAxis, IGanttDateAxisDataItem } from "./GanttDateAxis";
import type { GanttDateAxisRenderer } from "./GanttDateAxisRenderer";

import { Theme } from "../../core/Theme";
import { p50, p100, percent } from "../../core/util/Percent";
import { LinePattern } from "../../core/render/patterns/LinePattern";
import { setColor } from "../../themes/DefaultTheme";
import { color, ColorSet, DataItem } from "../../..";

import * as $time from "../../core/util/Time";

/**
 * @ignore
 */
export class GanttDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = this._root.language;
		const ic = this._root.interfaceColors;
		const r = this.rule.bind(this);

		const defaultDateFormat = l.translate("_date_day_full");

		r("Gantt").setAll({
			editable: true,
			layout: this._root.verticalLayout,
			colors: ColorSet.new(this._root, {}),
			snapThreshold: 0.5,
			linkNewTasks: true,
			durationUnit: "day",
			sidebarWidth: percent(30),
			weekends: [0, 6],
			width: p100,
			height: p100,
			gridIntervals: {
				year: [
					{ timeUnit: "week", count: 1 },
					{ timeUnit: "month", count: 1 },
					{ timeUnit: "month", count: 2 },
					{ timeUnit: "month", count: 6 }
				],
				month: [
					{ timeUnit: "week", count: 1 },
					{ timeUnit: "week", count: 2 }
				],
				week: [
					{ timeUnit: "day", count: 1 }
				],
				day: [
					{ timeUnit: "hour", count: 1 },
					{ timeUnit: "hour", count: 3 },
					{ timeUnit: "hour", count: 6 },
					{ timeUnit: "hour", count: 12 }
				],
				hour: [
					{ timeUnit: "minute", count: 1 },
					{ timeUnit: "minute", count: 5 },
					{ timeUnit: "minute", count: 15 },
					{ timeUnit: "minute", count: 30 }
				],
			}
		});

		// Zoom Controls
		r("Container", ["zoomcontrols"]).setAll({
			x: percent(100),
			centerX: percent(100),
			y: 10,
			layout: this._root.verticalLayout,
		});

		r("XYChart", ["gantt"]).setAll({
			panX: true,
			panY: true,
			paddingRight: 0,
			wheelY: "panY"
		})

		// vertical line between axis and plot area, resizable
		{
			const rule = r("Rectangle", ["axisresizer"]);
			rule.setAll({
				width: 12,
				height: p100,
				fillOpacity: 0.05,
				fill: ic.get("alternativeBackground"),
				cursorOverStyle: "col-resize",
				interactive: true
			})

			rule.states.create("hover", { fillOpacity: 0.1 });
		}

		// Editable label
		r("EditableLabel", ["axis"]).setAll({
			paddingBottom: 3,
			paddingTop: 3,
			paddingLeft: 5,
			paddingRight: 5,
			cursorOverStyle: "text"
		});

		// Axes
		// category axis
		r("GanttCategoryAxis").setAll({
			maxDeviation: 0,
			zoomOut: false,
			childShift: 25,
			childCellSize: 0.8,
			minCellHeight: 70
		});

		r("GanttCategoryAxisRenderer").setAll({
			inversed: true,
			minGridDistance: 10
		})

		// date axis
		// upper
		r("GanttDateAxis").setAll({
			maxZoomFactor: 10000000,
			extraMax: 0.03,
			extraMin: 0.02,
			autoZoom: false,
			//strictMinMaxSelection: false,
			//strictMinMax: false,
			markUnitChange: false,
			weekLabelLocation: 0.5,
			cursorOverStyle: "pointer",

			gridIntervals: [
				{ timeUnit: "hour", count: 1 },
				{ timeUnit: "day", count: 1 },
				{ timeUnit: "week", count: 1 },
				{ timeUnit: "month", count: 1 },
				{ timeUnit: "year", count: 1 },
				{ timeUnit: "year", count: 2 },
				{ timeUnit: "year", count: 5 },
				{ timeUnit: "year", count: 10 }
			],

			dateFormats: {
				hour: l.translate("_date_hour_full"),
				day: l.translate("_date_day"),
				week: defaultDateFormat,
				month: l.translate("_date_month_full"),
				year: l.translate("_date_year")
			}
		});

		// minor
		r("GanttDateAxis", ["minor"]).setAll({
			dateFormats: {
				millisecond: "SSS",
				second: "ss",
				minute: "mm",
				hour: l.translate("_date_hour_short"),
				day: "EEEEE",
				week: l.translate("_date_day"),
				month: l.translate("_date_month"),
				year: l.translate("_date_year")
			},
			fillRule: (dataItem: DataItem<IGanttDateAxisDataItem>) => {
				const axisFill = dataItem.get("axisFill");

				if (axisFill) {
					const axis = <GanttDateAxis<GanttDateAxisRenderer>>dataItem.component;
					const value = dataItem.get("value", 0);
					const endValue = dataItem.get("endValue", 0);
					const baseInterval = axis.getPrivate("baseInterval");
					const gridInterval = axis.getPrivate("gridInterval", baseInterval);
					const weekends = axis.gantt?.get("weekends", [0, 6]);
					axisFill.set("visible", false);
					if (gridInterval.timeUnit == "day") {
						let weekDay = new Date(value).getDay();
						const duration = endValue - value;
						const dayDuration = $time.getDuration("day", 1);

						if (weekends && weekends.indexOf(weekDay) != -1 && (duration >= dayDuration * 0.9 && duration <= dayDuration * 1.1)) {
							axisFill.set("visible", true);
						} else {
							axisFill.set("visible", false);
						}
					}
				}
			}
		});

		r("GanttDateAxisRenderer").setAll({
			minGridDistance: 150,
			opposite: true
		});

		r("GanttDateAxisRenderer", ["minor"]).setAll({
			minGridDistance: 50,
			opposite: true
		});

		// Grid
		r("Grid", ["cursor", "x"]).setAll({
			forceHidden: true
		});

		r("Grid", ["cursor", "y"]).setAll({
			forceHidden: true
		});

		r("Grid", ["range"]).setAll({
			stroke: ic.get("negative"),
			strokeOpacity: 1,
			strokeWidth: 2,
			strokeDasharray: [4, 2]
		});

		// Axis labels
		// X axis labels
		r("AxisLabel", ["x"]).setAll({
			paddingBottom: 15,
			multiLocation: 0.5
		});


		// Y axis labels (Tasks, editable)
		r("EditableAxisLabel").setAll({
			y: p50,
			populateText: true,
			text: "{name}",
			centerY: p50,
			oversizedBehavior: "truncate",
			marginRight: 10
		});

		// Ticks
		// X axis
		r("AxisTick", ["gantt", "renderer", "x"]).setAll({
			strokeOpacity: .1,
			visible: true,
			location: 1,
			length: 29
		})
		// hover state
		r("AxisTick", ["gantt", "axis", "y"]).states.create("hover", {
			stroke: ic.get("primaryButton"),
			strokeOpacity: 1,
			strokeWidth: 3
		});


		// Y axis
		r("AxisTick", ["gantt", "renderer", "y"]).setAll({
			strokeOpacity: .1,
			visible: true,
			location: 1
		})

		// Grid
		// X axis
		r("Grid", ["gantt", "renderer", "x"]).setAll({
			forceHidden: true
		})
		// minor X axis
		{
			const rule = r("Grid", ["gantt", "renderer", "x", "minor"]);
			rule.setAll({
				forceHidden: false,
				location: 1
			})

			rule.states.create("hover", {
				stroke: ic.get("primaryButton"),
				strokeOpacity: 1,
				strokeWidth: 2
			});
		}

		// Y axis
		r("Grid", ["gantt", "renderer", "y"]).setAll({
			location: 1
		})


		// Y axis labels
		// container which holds all elements
		r("Container", ["axislabelcontainer"]).setAll({
			minWidth: 150,
			draggable: true
		});

		// main background of the label container
		r("Rectangle", ["axislabelcontainer", "background"]).setAll({
			fill: ic.get("alternativeBackground"),
			fillOpacity: 0,
			interactive: true
		});

		// hover state
		r("Rectangle", ["axislabelcontainer", "background"]).states.create("hover", {
			fillOpacity: 0.05
		});

		// active state
		r("Rectangle", ["axislabelcontainer", "background"]).states.create("active", {
			fillOpacity: 0.07
		});

		// label itself
		r("EditableLabel", ["categorylabel"]).setAll({
			minWidth: 100,
			multiLine: false
		});

		// container which holds numeric stepper, progress pie
		r("Container", ["axislabelcontrols"]).setAll({
			height: p100,
			layout: this._root.horizontalLayout
		})

		// grip for dragging (left to the label)
		r("Rectangle", ["gantt", "grip", "axislabel"]).setAll({
			width: 18,
			height: 25,
			cursorOverStyle: "ns-resize",
			interactive: true,
			centerY: p50,
			y: p50,

			fillPattern: LinePattern.new(this._root, {
				color: ic.get("alternativeBackground"),
				colorOpacity: 0.2,
				rotation: 0,
				gap: 3
			})
		});

		// Progress pie 
		r("ProgressPie").setAll({
			y: p50,
			centerY: 0,
			width: 32,
			height: 32,
			marginLeft: 15,
			cursorOverStyle: "pointer"
		})

		// Numeric stepper for changing duration
		r("NumericStepper").setAll({
			y: p50,
			centerY: p50
		})

		// Series
		r("GanttSeries").setAll({
			linkHorizontalOffset: 25,
			snapCount: 1,
			exactLocationX: true
		})

		// Columns (tasks)
		r("RoundedRectangle", ["series", "column", "gantt"]).setAll({
			maxHeight: 60,
			draggable: true,
			cornerRadiusBL: 5,
			cornerRadiusTL: 5,
			cornerRadiusBR: 5,
			cornerRadiusTR: 5,
			fillOpacity: .8,
			strokeWidth: 2,
			tooltipY: 0,
			tooltipText: "{name}: {openValueX.formatDate('" + defaultDateFormat + "')} - {valueX.formatDate('" + defaultDateFormat + "')}"
		});

		// hover state of the column
		r("RoundedRectangle", ["column", "series", "gantt"]).states.create("hover", {
			strokeWidth: 3,
			cornerRadiusBL: 0,
			cornerRadiusTL: 0,
			cornerRadiusBR: 0,
			cornerRadiusTR: 0,
			fillOpacity: 1
		});

		// disabled state of the column (used to show inactive tasks while drawing new link)
		r("RoundedRectangle", ["column", "series", "gantt"]).states.create("disabled", {
			opacity: 0.2,
			forceInactive: true
		});

		// hidden state of the column
		r("RoundedRectangle", ["series", "column", "gantt"]).states.create("hidden", {
			opacity: 0,
			visible: false,
			strokeOpacity: 0
		})

		// container which holds column and all related elements (grips, bullets)
		r("Container", ["columncontainer"]).states.create("disabled", {
			opacity: 0.2,
			forceInactive: true
		});

		// container which holds grips and progress fill
		r("Container", ["maskedcontainer"]).setAll({
			position: "absolute"
		})

		// zero duration rectangle
		r("RoundedRectangle", ["zerorectangle"]).setAll({
			draggable: true,
			cornerRadiusBL: 2,
			cornerRadiusTL: 2,
			cornerRadiusBR: 2,
			cornerRadiusTR: 2,
			strokeWidth: 2,
			rotation: 45,
			fillOpacity: .8,
			centerX: p50,
			centerY: p50,
			y: p50,
			tooltipText: "{name}: {openValueX.formatDate('" + defaultDateFormat + "')}"
		})

		// hover state of zero duration rectangle
		r("RoundedRectangle", ["zerorectangle"]).states.create("disabled", {
			opacity: 0.5,
			forceInactive: true
		});

		// round bullet at the start of the column
		r("Circle", ["connectorbullet", "start", "gantt"]).setAll({
			strokeWidth: 2,
			strokeOpacity: 1,
			radius: 8,
			y: p50,
			fill: ic.get("background"),
			stroke: ic.get("alternativeBackground"),
			fillOpacity: 1,
			cursorOverStyle: "pointer",
			role: "figure",
			interactive: true,
			visible: false
		});

		// round bullet at the end of the column
		r("Circle", ["connectorbullet", "end", "gantt"]).setAll({
			strokeWidth: 2,
			strokeOpacity: 1,
			radius: 8,
			y: p50,
			fill: ic.get("background"),
			stroke: ic.get("alternativeBackground"),
			fillOpacity: 1,
			cursorOverStyle: "pointer",
			role: "figure",
			interactive: true
		});

		// hover state for end bullet
		r("Circle", ["connectorbullet", "gantt", "end"]).states.create("hover", {
			scale: 1.2
		});

		// active hover state for end bullet
		r("Circle", ["connectorbullet", "gantt", "end"]).states.create("activehover", {
			scale: 1.2,
			strokeWidth: 4
		});

		// progress rectangle (filled with pattern)
		r("Rectangle", ["progressrectangle", "gantt"]).setAll({
			forceInactive: true,
			width: 1,
			fill: ic.get("background"),
			fillOpacity: 0.2,
			strokeOpacity: 0,

			fillPattern: LinePattern.new(this._root, {
				width: 3000,
				height: 100,
				angle: -45,
				gap: 4,
				color: ic.get("background")
			})
		});

		// grip for adjusting progress
		r("Triangle", ["progressgrip", "gantt"]).setAll({
			draggable: true,
			cursorOverStyle: "ew-resize",
			width: 22,
			height: 11,
			fill: ic.get("background"),
			stroke: ic.get("background"),
			strokeOpacity: 0,
			fillOpacity: 1,
			y: p100,
			centerY: p100
		});

		// grip for resizing column - start (the dashed vertical one)
		r("Rectangle", ["resizegrip", "start", "gantt"]).setAll({
			width: 9,
			centerX: 19,
			fill: ic.get("background"),
			stroke: ic.get("alternativeBackground"),

			fillPattern: LinePattern.new(this._root, {
				color: ic.get("alternativeBackground"),
				colorOpacity: 0.2,
				rotation: 90,
				gap: 2
			}),
			draggable: true,
			fillOpacity: 0,
			strokeOpacity: 0,
			cursorOverStyle: "ew-resize"
		});

		// grip for resizing column - end (the dashed vertical one)
		r("Rectangle", ["resizegrip", "end", "gantt"]).setAll({
			width: 9,
			centerX: -10,
			fill: ic.get("background"),
			stroke: ic.get("alternativeBackground"),

			fillPattern: LinePattern.new(this._root, {
				color: ic.get("alternativeBackground"),
				colorOpacity: 0.2,
				rotation: 90,
				gap: 2
			}),

			draggable: true,
			fillOpacity: 0,
			strokeOpacity: 0,
			cursorOverStyle: "ew-resize"
		});


		// Line shown while drawing a new link
		r("Line", ["connectorline", "gantt"]).setAll({
			strokeWidth: 1,
			strokeDasharray: [2, 2],
			strokeOpacity: 1,
			stroke: ic.get("alternativeBackground"),
		});

		// Arrow shown at the end of the link being drawn
		r("Triangle", ["connectorarrow", "gantt"]).setAll({
			width: 10,
			height: 10,
			fill: ic.get("alternativeBackground"),
			stroke: ic.get("alternativeBackground"),
			rotation: 90,
			centerX: p50,
			centerY: p50,
			fillOpacity: 1,
			strokeOpacity: 1
		});

		// hide the arrow at the start of the link
		r("Triangle", ["link", "start"]).setAll({
			forceHidden: true
		});


		// Links		
		r("Link", ["gantt"]).setAll({
			toggleKey: "active",
			cursorOverStyle: "pointer"
		})

		// this is needed for the states to be propagated to the link children
		r("Link", ["gantt"]).states.create("active", {});



		// Buttons
		{
			const rule = r("Button", ["secondary"]);

			rule.setAll({
				height: 35,
				marginLeft: 6,
				tooltipX: percent(90)
			})
		}

		{
			const rule = r("Graphics", ["icon", "button", "fixedwidth"]);

			rule.setAll({
				x: p50,
				centerX: p50
			})
		}

		{
			const rule = r("Button", ["fixedwidth"]);

			rule.setAll({
				width: 35
			})
		}

		{
			const rule = r("Button", ["zoombutton", "secondary"]);

			rule.setAll({
				height: 35,
				width: 35,
				y: undefined,
				marginLeft: 0,
				marginBottom: 6,
				tooltipX: percent(10)
			})
		}

		{
			const rule = r("Graphics", ["icon", "button", "secondary"]);
			rule.setAll({
				centerY: p50,
				y: p50
			});
			setColor(rule, "stroke", ic, "secondaryButtonText");
		}

		{
			const rule = r("Graphics", ["icon", "button", "secondary"]);
			rule.states.create("hover", {
				stroke: ic.get("alternativeBackground")
			});

			rule.states.create("active", {
				stroke: ic.get("alternativeBackground")
			});
		}

		{
			const rule = r("RoundedRectangle", ["background", "secondary", "button"]);
			setColor(rule, "fill", ic, "background");
			setColor(rule, "stroke", ic, "secondaryButton");
		}

		{
			r("RoundedRectangle", ["background", "secondary", "button"]).states.create("hover", {
				strokeOpacity: 1,
				fillOpacity: 0.2,
				fill: ic.get("secondaryButtonHover")
			});
		}

		{
			r("RoundedRectangle", ["background", "secondary", "button"]).states.create("active", {
				strokeOpacity: 1,
				fillOpacity: 0.2,
				fill: ic.get("secondaryButtonActive")
			});
		}

		{
			const rule = r("RoundedRectangle", ["background", "secondary", "button"]).states.create("down", { stateAnimationDuration: 0 });
			setColor(rule, "fill", ic, "secondaryButtonDown");
		}

		{
			const rule = r("Graphics", ["icon", "secondary", "button"]);
			setColor(rule, "stroke", ic, "secondaryButton");
		}


		// Task bullet button - shown at the left side of the task label, either triangle (if has children) or circle (if no children)
		r("Button", ["taskbullet"]).setAll({
			centerX: p50,
			centerY: p50,
			y: p50,
			width: 30,
			height: 30,
			cursorOverStyle: "pointer"
		})

		r("Graphics", ["taskbullet", "icon"]).states.create("default", {
			stateAnimationDuration: 0
		});

		// hover state for task bullet icon
		r("Graphics", ["taskbullet", "icon"]).states.create("hover", {
			fill: ic.get("secondaryButtonHover")
		});

		r("Graphics", ["taskbullet", "icon"]).states.create("active", {
			fill: ic.get("secondaryButton"),
			stateAnimationDuration: 0,
			rotation: 90
		});

		r("Graphics", ["taskbullet", "icon"]).states.create("disabled", {
			// draw circle
			marginLeft: 3,
			stateAnimationDuration: 0,
			fill: ic.get("secondaryButton"),
			draw: (display) => {
				display.moveTo(0, 0);
				display.arc(0, 0, 4, 0, 360, false);
			}
		});

		r("RoundedRectangle", ["button", "taskbullet", "background"]).setAll({
			opacity: 0
		});

		r("RoundedRectangle", ["button", "taskbullet", "background"]).states.create("default", {
			opacity: 0
		});

		r("Button", ["taskbullet"]).states.create("disabled", {
			stateAnimationDuration: 0
		})

		r("Graphics", ["taskbullet", "icon"]).setAll({
			fill: ic.get("secondaryButton"),
			stateAnimationDuration: 0,
			strokeOpacity: 0,
			y: p50,

			// draw triangle that points left
			draw: (display) => {
				display.moveTo(-5, -8);
				display.lineTo(4, 0);
				display.lineTo(-5, 8);
				display.lineTo(-5, -8);
				display.closePath();
			}
		})
		// end of task bullet

		// add button
		r("Button", ["add"]).setAll({
			width: 35,
			height: 35,
			tooltipText: l.translateAny("Add task"),
			tooltipX: percent(90)
		})

		r("RoundedRectangle", ["button", "add", "background"]).setAll({
			stroke: ic.get("primaryButton"),
			strokeWidth: 0,
		});


		// edit button
		r("Button", ["edit"]).setAll({
			visible: false,
			tooltipText: l.translateAny("Edit mode"),
			toggleKey: "active"
		})

		{
			const rule = r("Graphics", ["icon", "edit", "button"]);
			rule.setAll({
				svgPath: "M 10.1 -1.3 L 16.1 5.3 L 7.9 14.4 L 1.9 14.4 L 1.9 7.8 L 10.1 -1.3 M 8.2 0.8 L 14.2 7.4 M 1.9 12.7 L 3.5 14.4 M 6.7 11.6 L 12.3 5.3 M 4.5 9.2 L 10.1 2.9 M 1.9 7.8 L 4.5 9.2 L 5.1 11.3 L 6.7 11.6 L 7.9 14.4 M 8.9 0.1 L 14.9 6.8 M 9.5 -0.6 L 15.5 6 M 1.9 13.4 L 2.9 14.4 M 1.9 12 L 4.1 14.4"
			});			
			setColor(rule, "stroke", ic, "secondaryButton");
		}

		// expand button
		r("Button", ["expand"]).setAll({
			tooltipText: l.translateAny("Expand all")
		})

		{
			const rule = r("Graphics", ["icon", "expand", "button"]);
			rule.setAll({
				svgPath: "M -6 -4 L 0 2 L 6 -4 M -6 2 L 0 8 L 6 2"
			});
			setColor(rule, "stroke", ic, "secondaryButton");
		}

		// collapse button
		r("Button", ["collapse"]).setAll({
			tooltipText: l.translateAny("Collapse all")
		})

		{
			const rule = r("Graphics", ["icon", "collapse", "button"]);
			rule.setAll({
				svgPath: "M -6 6 L 0 0 L 6 6 M -6 0 L 0 -6 L 6 0"
			});
			setColor(rule, "stroke", ic, "secondaryButton");
		}

		// auto-link button
		r("Button", ["link"]).setAll({
			tooltipText: l.translateAny("Link new tasks"),
			toggleKey: "active"
		})

		{
			const rule = r("Graphics", ["icon", "link", "button"]);
			rule.setAll({
				svgPath: "M 5 5 L 13 5 C 17 5 17 11 13 11 L 8 11 C 4 11 4 17 8 17 L 16 17 L 14 15 L 14 19 L 16 17"
			});
			setColor(rule, "stroke", ic, "secondaryButton");
		}

		// clear button
		r("Button", ["clear"]).setAll({
			tooltipText: l.translateAny("Clear all")
		});

		// garbage bin icon
		{
			const rule = r("Graphics", ["icon", "clear", "button"]);
			rule.setAll({
				marginLeft: 1,
				marginRight: 1,
				svgPath: "M 2.4 4 L 4.8 19.2 L 15.2 19.2 L 17.6 4 L 2.4 4 M 5.6 5.6 L 7.2 17.2 M 10 5.6 L 10 17.2 M 14.4 5.6 L 12.8 17.2 M 2.4 3.2 L 17.6 3.2 M 8.4 3.2 L 8.4 1.2 L 12 1.2 L 12 3.2"
			});
			setColor(rule, "stroke", ic, "secondaryButton");
		}

		// fit button
		r("Button", ["fit"]).setAll({
			tooltipText: l.translateAny("Fit to view")
		})

		{
			const rule = r("Graphics", ["icon", "fit", "button"]);
			rule.setAll({
				svgPath: "M 8 0 L 2 0 M 6 -4 L 2 0 L 6 4 M -2 0 L -8 0 M -6 -4 L -2 0 L -6 4"
			});
			setColor(rule, "stroke", ic, "secondaryButton");
		}

		r("Button", ["zoomout"]).setAll({
			tooltipText: l.translateAny("Zoom out")
		})

		{
			const rule = r("Graphics", ["icon", "zoomout", "button"]);
			rule.setAll({
				svgPath: "M 8 0 L 2 0 M 4 -4 L 8 0 L 4 4 M -2 0 L -8 0 M -4 -4 L -8 0 L -4 4"
			});
			setColor(rule, "stroke", ic, "secondaryButton");
		}


		// x button (shown when clicked on a task)		
		r("Button", ["xbutton"]).setAll({
			position: "absolute",
			width: 35,
			height: 35,
			centerX: p50,
			centerY: p50
		})

		r("RoundedRectangle", ["xbutton", "background"]).setAll({
			fillOpacity: 0,
			strokeOpacity: 0
		});

		r("Graphics", ["xbutton", "icon"]).setAll({
			fill: ic.get("negative"),
			isMeasured: false,
			forceInactive: true,
			stroke: color(0xffffff),
			strokeWidth: 2,
			cursorOverStyle: "pointer",
			centerX: p50,
			centerY: p50,
			x: p50,
			y: p50,
			draw: (display) => {
				display.arc(0, 0, 16, 0, Math.PI * 2);

				display.moveTo(-6, -6);
				display.lineTo(6, 6);
				display.moveTo(6, -6);
				display.lineTo(-6, 6);
			}
		})

		// color picker button
		r("ColorPickerButton").setAll({
			width: 35,
			height: 35,
			marginLeft: 6,
			tooltipX: percent(90),
			tooltipText: l.translateAny("Set color")
		});
	}
}
