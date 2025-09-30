import { Theme } from "../../core/Theme";
import { p50, p100, percent } from "../../core/util/Percent";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";
import { LinearGradient } from "../../core/render/gradients/LinearGradient";
import { color } from "../../core/util/Color";
/**
 * @ignore
 */
export class ColorPickerDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const r = this.rule.bind(this);

		///////////////////////////////////////////////////////
		// ALL RELATED TO COLOR PICKER ////////////////////////
		///////////////////////////////////////////////////////

		// Color picker button (the one that opens color picker)
		r("ColorPickerButton").setAll({
			colorOpacity: 1,
			width: 35,
			height: 35,
			marginRight: 0,
			cursorOverStyle: "pointer"
		})

		r("Graphics", ["colorpickerbutton", "icon"]).setAll({
			svgPath: "M 1 14 L 3 16 L 5 14 L 7 14 L 15 6 A 0.6 0.6 90 0 0 11 2 L 3 10 L 3 12 L 1 14 M 7 4 L 13 10",
			forceInactive: true,
			centerX: p50,
			centerY: p50,
			x: p50,
			y: p50,
			strokeOpacity: 0.5			
		})

		r("Graphics", ["colorpickerbutton", "nocolor"]).setAll({
			x: p50,
			y: p50,
			centerX: p50,
			centerY: p50,
			forceInactive: true,
			svgPath: "M 5 5 L 25 25 M 25 5 L 5 25"
		})

		// end of color picker button

		// COLOR PICKER //////////////////////////////////////////////////////////////////////////////////
		r("ColorPicker").setAll({
			exportable: false,
			paddingBottom: 20,
			paddingTop: 20,
			paddingLeft: 20,
			paddingRight: 20,
			width: 250,
			position: "absolute",
			x: p50,
			y: p50,
			centerX: p50,
			centerY: p50,
			background: RoundedRectangle.new(this._root, {
				strokeOpacity: 1,
				fillOpacity: 1,
				shadowBlur: 8,
				shadowColor: color(0x000000),
				shadowOpacity: 0.3,
				shadowOffsetX: 2,
				shadowOffsetY: 2,
				fill: color(0xffffff),
			})
		})

		r("ColorPicker").states.create("hidden", {
			stateAnimationDuration: 200,
			opacity: 0,
			visible: false
		})

		r("ColorPicker").states.create("default", {
			stateAnimationDuration: 300
		})

		r("Container", ["colorpicker", "lastcolors"]).setAll({
			layout: this._root.horizontalLayout,
			width: p100
		})

		// target circle (the one on color gradient)
		r("Circle", ["colorpicker", "circle", "target"]).setAll({
			radius: 5,
			fill: color(0xffffff),
			stroke: color(0xffffff),
			fillOpacity: 1,
			strokeOpacity: 1,
			strokeWidth: 2,
			shadowColor: color(0x000000),
			shadowOpacity: 1,
			shadowBlur: 5,
			shadowOffsetX: 0,
			shadowOffsetY: 0
		})

		// gradient slider
		r("Slider", ["colorpicker", "gradient"]).setAll({
			marginLeft: 15,
			marginRight: 0
		})

		// gradient slider background (with all the colors as gradient)
		r("RoundedRectangle", ["colorpicker", "gradient", "scrollbar", "main", "background"]).setAll({
			fillGradient: LinearGradient.new(this._root, {
				rotation: 90,
				stops: [
					{ color: color(0xff0000), offset: 0 },
					{ color: color(0xffff00), offset: 0.17 },
					{ color: color(0x00ff00), offset: 0.34 },
					{ color: color(0x00ffff), offset: 0.51 },
					{ color: color(0x0000ff), offset: 0.68 },
					{ color: color(0xff00ff), offset: 0.85 },
					{ color: color(0xff0000), offset: 1 }
				]
			})
		})

		// slider button (smaller than original)
		r("Button", ["colorpicker", "resize"]).setAll({
			tooltipY: 0,
			width: 22,
			height: 22,
			paddingTop: 0,
			paddingBottom: 0,
			paddingLeft: 0,
			paddingRight: 0
		});

		// slider button background
		r("RoundedRectangle", ["colorpicker", "resize", "background"]).setAll({
			fillOpacity: 1,
			strokeOpacity: 1,
			strokeWidth: 2,
			shadowColor: color(0x000000),
			shadowOpacity: 1,
			shadowBlur: 5,
			shadowOffsetX: 0,
			shadowOffsetY: 0
		});

		// slider button icon (hidden)
		r("Graphics", ["colorpicker", "resize", "button", "icon"]).setAll({
			forceHidden: true
		});

		// opacity slider
		r("Slider", ["colorpicker", "opacity"]).setAll({
			centerY: p50,
			y: p50,
			width: p100
		})

		// opacity slider background stroke
		r("RoundedRectangle", ["colorpicker", "main", "opacity", "background"]).setAll({
			strokeWidth: 1,
			strokeOpacity: .5
		});

		/// INPUT FIELDS
		r("EditableLabel", ["colorpicker", "input"]).setAll({
			text: "Text",
			width: p100,
			height: 30,
			marginLeft: 5,
			fontSize: "13px",
			fontFamily: "monospace",
			oversizedBehavior: "none",
			textAlign: "center",
			minWidth: 50
		});

		r("EditableLabel", ["colorpicker", "color", "input"]).setAll({
			maxChars: 7
		});

		r("RoundedRectangle", ["colorpicker", "background", "input"]).setAll({
			strokeWidth: 1,
			cornerRadiusBL: 4,
			cornerRadiusBR: 4,
			cornerRadiusTL: 4,
			cornerRadiusTR: 4,
			strokeOpacity: .25,
			fillOpacity: 0
		});

		// make color picker buttons smaller
		r("Button", ["colorpicker", "pickertool"]).setAll({
			width: 30,
			height: 30,
			marginTop: 0,
			marginBottom: 0,
			marginLeft: 0,
			marginRight: 0,
			tooltipX: percent(90)
		})

		// tooltip text for no color button
		r("Button", ["colorpicker", "pickertool", "nocolor"]).setAll({
			tooltipText: "No color",
			marginLeft: 5
		})

		r("Graphics", ["colorpicker", "icon", "nocolor"]).setAll({
			svgPath: "M 0 0 L 14 14 M 14 0 L 0 14",
			centerX: p50,
			centerY: p50,
			x: p50,
			y: p50,
		})

		// tooltip text for picker button
		r("Button", ["colorpicker", "picker"]).setAll({
			tooltipText: "Pick color from screen"
		})

		// picker icon for picker button
		r("Graphics", ["picker", "icon"]).setAll({
			centerX: p50,
			centerY: p50,
			x: p50,
			y: p50,
			svgPath: "M 1 14 L 3 16 L 5 14 L 7 14 L 15 6 A 0.6 0.6 90 0 0 11 2 L 3 10 L 3 12 L 1 14 M 7 4 L 13 10"
		})

		// cancel and ok buttons for color picker
		r("Button", ["colorpicker", "button"]).setAll({
			height: undefined,
			paddingTop: 1,
			paddingBottom: 1,
			width: p50
		})

		r("Button", ["colorpicker", "button", "ok"]).setAll({
			marginLeft: 5
		})

		r("Label", ["colorpicker", "cancel"]).setAll({
			text: "Cancel",
			x: p50,
			centerX: p50
		})
		// ok button for color picker
		r("Label", ["colorpicker", "ok"]).setAll({
			text: "OK",
			x: p50,
			centerX: p50
		})


		r("Tooltip", ["colorpicker"]).setAll({
			getFillFromSprite: false,
			autoTextColor: false,
			paddingBottom: 5,
			paddingTop: 5,
			paddingLeft: 7,
			paddingRight: 7
		})

		r("PointedRectangle", ["colorpicker", "tooltip", "background"]).setAll({
			fill: color(0x000000),
			fillOpacity: 0.9,
			stroke: color(0xffffff),
			strokeOpacity: 1
		})


		r("Label", ["colorpicker", "tooltip"]).setAll({
			fontSize: "12px",
			fill: color(0xffffff)
		})

		// end of color picker

	}
}
