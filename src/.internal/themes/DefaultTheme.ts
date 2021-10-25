import type { InterfaceColors, IInterfaceColorsSettings } from "../core/util/InterfaceColors";

import { Theme } from "../core/Theme";
import { p100, p50 } from "../core/util/Percent";
import { Color } from "../core/util/Color";
import { GridLayout } from "../core/render/GridLayout"

import * as $ease from "../core/util/Ease";


interface Settable<A> {
	_settings: A;
	set<K extends keyof A>(key: K, value: A[K]): void;
}

/**
 * @ignore
 */
export function setColor<A, K extends keyof A>(rule: Settable<A>, key: K, ic: InterfaceColors, name: keyof IInterfaceColorsSettings) {
	// TODO this shouldn't use get, figure out a better way
	rule.set(key, ic.get(name) as any);

	ic.on(name, (value) => {
		rule.set(key, value as any);
	});
}

/**
 * @ignore
 */
export class DefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const language = this._root.language;

		const ic = this._root.interfaceColors;

		const horizontalLayout = this._root.horizontalLayout;
		const verticalLayout = this._root.verticalLayout;


		/**
		 * ========================================================================
		 * core
		 * ========================================================================
		 */

		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0xe5e5e5),
			fill: Color.fromHex(0xf3f3f3),
			primaryButton: Color.fromHex(0x6794dc),
			primaryButtonHover: Color.fromHex(0x6771dc),
			primaryButtonDown: Color.fromHex(0x68dc76),
			primaryButtonActive: Color.fromHex(0x68dc76),
			primaryButtonText: Color.fromHex(0xffffff),
			primaryButtonStroke: Color.fromHex(0xffffff),
			secondaryButton: Color.fromHex(0xd9d9d9),
			secondaryButtonHover: Color.fromHex(0xa3a3a3),
			secondaryButtonDown: Color.fromHex(0x8d8d8d),
			secondaryButtonActive: Color.fromHex(0xe6e6e6),
			secondaryButtonText: Color.fromHex(0x000000),
			secondaryButtonStroke: Color.fromHex(0xffffff),
			grid: Color.fromHex(0x000000),
			background: Color.fromHex(0xffffff),
			alternativeBackground: Color.fromHex(0x000000),
			text: Color.fromHex(0x000000),
			alternativeText: Color.fromHex(0xffffff),
			disabled: Color.fromHex(0xadadad),
			positive: Color.fromHex(0x50b300),
			negative: Color.fromHex(0xb30000)
		});

		this.rule("Entity").setAll({
			stateAnimationDuration: 0,
			stateAnimationEasing: $ease.out($ease.cubic)
		});

		this.rule("Component").setAll({
			interpolationDuration: 0,
			interpolationEasing: $ease.out($ease.cubic)
		});

		this.rule("Sprite").setAll({
			visible: true,
			scale: 1,
			opacity: 1,
			rotation: 0,
			position: "relative",
			tooltipX: p50,
			tooltipY: p50,
			tooltipPosition: "fixed",
			isMeasured: true
		});

		this.rule("Sprite").states.create("default", { "visible": true, opacity: 1 });

		this.rule("Container").setAll({
			interactiveChildren: true,
			setStateOnChildren: false
		});

		this.rule("Graphics").setAll({
			strokeWidth: 1
		});


		this.rule("Chart").setAll({
			width: p100,
			height: p100
		});


		/**
		 * ------------------------------------------------------------------------
		 * core: alignment
		 * ------------------------------------------------------------------------
		 */

		this.rule("Sprite", ["horizontal", "center"]).setAll({
			centerX: p50,
			x: p50
		});

		this.rule("Sprite", ["vertical", "center"]).setAll({
			centerY: p50,
			y: p50
		});

		this.rule("Container", ["horizontal", "layout"]).setAll({
			layout: horizontalLayout
		});

		this.rule("Container", ["vertical", "layout"]).setAll({
			layout: verticalLayout
		});

		/**
		 * ------------------------------------------------------------------------
		 * core: patterns
		 * ------------------------------------------------------------------------
		 */

		this.rule("Pattern").setAll({
			repetition: "repeat",
			width: 50,
			height: 50,
			rotation: 0,
			fillOpacity: 1
		});

		this.rule("LinePattern").setAll({
			gap: 6,
			colorOpacity: 1,
			width: 49,
			height: 49
		});

		this.rule("RectanglePattern").setAll({
			gap: 6,
			checkered: false,
			centered: true,
			maxWidth: 5,
			maxHeight: 5,
			width: 48,
			height: 48,
			strokeWidth: 0
		});

		this.rule("CirclePattern").setAll({
			gap: 5,
			checkered: false,
			centered: false,
			radius: 3,
			strokeWidth: 0,
			width: 45,
			height: 45
		});

		/**
		 * ------------------------------------------------------------------------
		 * core: gradients
		 * ------------------------------------------------------------------------
		 */

		this.rule("LinearGradient").setAll({
			rotation: 90
		});


		/**
		 * ------------------------------------------------------------------------
		 * core: Legend
		 * ------------------------------------------------------------------------
		 */

		this.rule("Legend").setAll({
			fillField: "fill",
			strokeField: "stroke",
			nameField: "name",
			layout: GridLayout.new(this._root, {}),
			layer: 30
		});

		// Class: Container
		this.rule("Container", ["legend", "item", "itemcontainer"]).setAll({
			toggleKey: "disabled",
			paddingLeft: 5,
			paddingRight: 5,
			paddingBottom: 5,
			paddingTop: 5,
			layout: horizontalLayout,
			setStateOnChildren: true,
			interactiveChildren: false,
			ariaChecked: true,
			focusable: true,
			cursorOverStyle: "pointer",
			ariaLabel: language.translate("Press ENTER to toggle")
		});

		{
			const rule = this.rule("Rectangle", ["legend", "item", "background"]);

			rule.setAll({
				fillOpacity: 0,
			});

			setColor(rule, "fill", ic, "background");
		}

		this.rule("Container", ["legend", "marker"]).setAll({
			setStateOnChildren: true,
			centerY: p50,
			paddingLeft: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingTop: 0,
			width: 18,
			height: 18
		});

		this.rule("RoundedRectangle", ["legend", "marker", "rectangle"]).setAll({
			width: p100,
			height: p100,
			cornerRadiusBL: 3,
			cornerRadiusTL: 3,
			cornerRadiusBR: 3,
			cornerRadiusTR: 3
		});

		{
			const rule = this.rule("RoundedRectangle", ["legend", "marker", "rectangle"]).states.create("disabled", {});
			setColor(rule, "fill", ic, "disabled");
			setColor(rule, "stroke", ic, "disabled");
		}

		this.rule("Label", ["legend", "label"]).setAll({
			centerY: p50,
			marginLeft: 5,
			paddingRight: 0,
			paddingLeft: 0,
			paddingTop: 0,
			paddingBottom: 0,
			populateText: true
		});

		{
			const rule = this.rule("Label", ["legend", "label"]).states.create("disabled", {});
			setColor(rule, "fill", ic, "disabled");
		}

		this.rule("Label", ["legend", "value", "label"]).setAll({
			centerY: p50,
			marginLeft: 5,
			paddingRight: 0,
			paddingLeft: 0,
			paddingTop: 0,
			paddingBottom: 0,
			width: 50,
			centerX: p100,
			populateText: true
		});

		{
			const rule = this.rule("Label", ["legend", "value", "label"]).states.create("disabled", {});
			setColor(rule, "fill", ic, "disabled");
		}



		/**
		 * ------------------------------------------------------------------------
		 * core: HeatLegend
		 * ------------------------------------------------------------------------
		 */

		this.rule("HeatLegend").setAll({
			stepCount: 1
		});

		this.rule("RoundedRectangle", ["heatlegend", "marker"]).setAll({
			cornerRadiusTR: 0,
			cornerRadiusBR: 0,
			cornerRadiusTL: 0,
			cornerRadiusBL: 0
		});

		this.rule("RoundedRectangle", ["vertical", "heatlegend", "marker"]).setAll({
			height: p100,
			width: 15
		});

		this.rule("RoundedRectangle", ["horizontal", "heatlegend", "marker"]).setAll({
			width: p100,
			height: 15
		});

		this.rule("HeatLegend", ["vertical"]).setAll({
			height: p100
		});

		this.rule("HeatLegend", ["horizontal"]).setAll({
			width: p100
		});

		this.rule("Label", ["heatlegend", "start"]).setAll({
			paddingLeft: 5,
			paddingRight: 5,
			paddingTop: 5,
			paddingBottom: 5
		});

		this.rule("Label", ["heatlegend", "end"]).setAll({
			paddingLeft: 5,
			paddingRight: 5,
			paddingTop: 5,
			paddingBottom: 5
		});


		/**
		 * ------------------------------------------------------------------------
		 * core: Labels
		 * ------------------------------------------------------------------------
		 */

		{
			const rule = this.rule("Label");

			rule.setAll({
				paddingTop: 8,
				paddingBottom: 8,
				paddingLeft: 10,
				paddingRight: 10,
				fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\"",
				fontSize: "1em",
				populateText: false
			});

			setColor(rule, "fill", ic, "text");
		}

		this.rule("RadialLabel").setAll({
			textType: "regular",
			centerY: p50,
			centerX: p50,
			inside: false,
			radius: 0,
			orientation: "auto",
			textAlign: "center"
		});


		/**
		 * ------------------------------------------------------------------------
		 * core: Elements and shapes
		 * ------------------------------------------------------------------------
		 */

		this.rule("RoundedRectangle").setAll({
			cornerRadiusTL: 8,
			cornerRadiusBL: 8,
			cornerRadiusTR: 8,
			cornerRadiusBR: 8
		});

		this.rule("PointedRectangle").setAll({
			pointerBaseWidth: 15,
			pointerLength: 10,
			cornerRadius: 8
		});

		this.rule("Slice").setAll({
			shiftRadius: 0
		});

		{
			const rule = this.rule("Tick");

			rule.setAll({
				strokeOpacity: .15,
				isMeasured: false,
				length: 5,
				position: "absolute"
			});

			setColor(rule, "stroke", ic, "grid");
		}

		this.rule("Bullet").setAll({
			locationX: 0.5,
			locationY: 0.5
		});


		/**
		 * ------------------------------------------------------------------------
		 * core: Tooltip
		 * ------------------------------------------------------------------------
		 */

		this.rule("Tooltip").setAll({
			position: "absolute",
			getFillFromSprite: true,
			getStrokeFromSprite: false,
			autoTextColor: true,
			paddingTop: 9,
			paddingBottom: 8,
			paddingLeft: 10,
			paddingRight: 10,
			marginBottom: 5,
			pointerOrientation: "vertical",
			centerX: p50,
			centerY: p50,
			animationEasing: $ease.out($ease.cubic),
			exportable: false
			//layer: 100
		});

		{
			const rule = this.rule("PointedRectangle", ["tooltip", "background"]);

			rule.setAll({
				strokeOpacity: 0.9,
				cornerRadius: 4,
				pointerLength: 4,
				pointerBaseWidth: 8,
				fillOpacity: 0.9,
				stroke: Color.fromHex(0xffffff)
			});
		}

		{
			const rule = this.rule("Label", ["tooltip"]);

			rule.setAll({
				role: "tooltip",
				populateText: true,
				paddingRight: 0,
				paddingTop: 0,
				paddingLeft: 0,
				paddingBottom: 0
			});

			setColor(rule, "fill", ic, "alternativeText");
		}


		/**
		 * ------------------------------------------------------------------------
		 * core: Button
		 * ------------------------------------------------------------------------
		 */

		this.rule("Button").setAll({
			paddingTop: 8,
			paddingBottom: 8,
			paddingLeft: 10,
			paddingRight: 10,
			interactive: true,
			layout: horizontalLayout,
			interactiveChildren: false,
			setStateOnChildren: true,
			focusable: true
		});

		this.rule("Button").states.create("hover", {});
		this.rule("Button").states.create("down", { stateAnimationDuration: 0 });
		this.rule("Button").states.create("active", {});

		{
			const rule = this.rule("RoundedRectangle", ["button", "background"]);
			setColor(rule, "fill", ic, "primaryButton");
			setColor(rule, "stroke", ic, "primaryButtonStroke");
		}

		{
			const rule = this.rule("RoundedRectangle", ["button", "background"]).states.create("hover", {});
			setColor(rule, "fill", ic, "primaryButtonHover");
		}

		{
			const rule = this.rule("RoundedRectangle", ["button", "background"]).states.create("down", { stateAnimationDuration: 0 });
			setColor(rule, "fill", ic, "primaryButtonDown");
		}

		{
			const rule = this.rule("RoundedRectangle", ["button", "background"]).states.create("active", {});
			setColor(rule, "fill", ic, "primaryButtonActive");
		}

		{
			const rule = this.rule("Graphics", ["button", "icon"]);
			setColor(rule, "stroke", ic, "primaryButtonText");
		}

		{
			const rule = this.rule("Label", ["button"]);
			setColor(rule, "fill", ic, "primaryButtonText");
		}


		/**
		 * ------------------------------------------------------------------------
		 * core: ResizeButton
		 * ------------------------------------------------------------------------
		 */

		this.rule("Button", ["resize"]).setAll({
			paddingTop: 9,
			paddingBottom: 9,
			paddingLeft: 13,
			paddingRight: 13,
			draggable: true,
			centerX: p50,
			centerY: p50,
			position: "absolute",
			role: "slider",
			ariaLabel: language.translate("Use up and down arrows to move selection")
		});

		{
			const rule = this.rule("RoundedRectangle", ["background", "resize", "button"]);

			rule.setAll({
				cornerRadiusBL: 40,
				cornerRadiusBR: 40,
				cornerRadiusTL: 40,
				cornerRadiusTR: 40
			});

			setColor(rule, "fill", ic, "secondaryButton");
		}

		{
			const rule = this.rule("RoundedRectangle", ["background", "resize", "button"]).states.create("hover", {});
			setColor(rule, "fill", ic, "secondaryButtonHover");
		}

		{
			const rule = this.rule("RoundedRectangle", ["background", "resize", "button"]).states.create("down", { stateAnimationDuration: 0 });
			setColor(rule, "fill", ic, "secondaryButtonDown");
		}

		{
			const rule = this.rule("Graphics", ["resize", "button", "icon"]);

			rule.setAll({
				strokeOpacity: 0.7,
				draw: (display: any) => {
					display.moveTo(0, 0);
					display.lineTo(0, 12);
					display.moveTo(4, 0);
					display.lineTo(4, 12);
				}
			});

			setColor(rule, "stroke", ic, "secondaryButtonText");
		}

		this.rule("Button", ["resize", "vertical"]).setAll({
			rotation: 90,
			cursorOverStyle: "ns-resize"
		});

		this.rule("Button", ["resize", "horizontal"]).setAll({
			cursorOverStyle: "ew-resize"
		});



		/**
		 * ------------------------------------------------------------------------
		 * core: PlayButton
		 * ------------------------------------------------------------------------
		 */

		this.rule("Button", ["play"]).setAll({
			paddingTop: 13,
			paddingBottom: 13,
			paddingLeft: 14,
			paddingRight: 14,
			ariaLabel: language.translate("Play"),
			toggleKey: "active"
		});

		{
			const rule = this.rule("RoundedRectangle", ["play", "background"]);

			rule.setAll({
				strokeOpacity: 0.5,
				cornerRadiusBL: 100,
				cornerRadiusBR: 100,
				cornerRadiusTL: 100,
				cornerRadiusTR: 100
			});

			setColor(rule, "fill", ic, "primaryButton");
		}

		{
			const rule = this.rule("Graphics", ["play", "icon"]);

			rule.setAll({
				stateAnimationDuration: 0,
				dx: 1,
				draw: (display: any) => {
					display.moveTo(0, -5);
					display.lineTo(8, 0);
					display.lineTo(0, 5);
					display.lineTo(0, -5);
				}
			});

			setColor(rule, "fill", ic, "primaryButtonText");
		}

		this.rule("Graphics", ["play", "icon"]).states.create("default", {
			stateAnimationDuration: 0
		})

		this.rule("Graphics", ["play", "icon"]).states.create("active", {
			stateAnimationDuration: 0,
			draw: (display: any) => {
				display.moveTo(-4, -5);
				display.lineTo(-1, -5);
				display.lineTo(-1, 5);
				display.lineTo(-4, 5);
				display.lineTo(-4, -5);

				display.moveTo(4, -5);
				display.lineTo(1, -5);
				display.lineTo(1, 5);
				display.lineTo(4, 5);
				display.lineTo(4, -5);
			}
		})


		/**
		 * ------------------------------------------------------------------------
		 * core: SwitchButton
		 * ------------------------------------------------------------------------
		 */

		this.rule("Button", ["switch"]).setAll({
			paddingTop: 4,
			paddingBottom: 4,
			paddingLeft: 4,
			paddingRight: 4,
			ariaLabel: language.translate("Press ENTER to toggle"),
			toggleKey: "active",
			width: 40,
			height: 24,
			layout: null
		});

		{
			const rule = this.rule("RoundedRectangle", ["switch", "background"]);

			rule.setAll({
				strokeOpacity: 0.5,
				cornerRadiusBL: 100,
				cornerRadiusBR: 100,
				cornerRadiusTL: 100,
				cornerRadiusTR: 100
			});

			setColor(rule, "fill", ic, "primaryButton");
		}

		{
			const rule = this.rule("Circle", ["switch", "icon"]);

			rule.setAll({
				radius: 8,
				centerY: 0,
				centerX: 0,
				dx: 0
			});

			setColor(rule, "fill", ic, "primaryButtonText");
		}

		this.rule("Graphics", ["switch", "icon"]).states.create("active", {
			dx: 16
		});


		/**
		 * ------------------------------------------------------------------------
		 * core: Scrollbar
		 * ------------------------------------------------------------------------
		 */

		this.rule("Scrollbar").setAll({
			start: 0,
			end: 1,
			layer: 40,
			animationEasing: $ease.out($ease.cubic)
		});

		this.rule("Scrollbar", ["vertical"]).setAll({
			marginRight: 13,
			marginLeft: 13,
			minWidth: 12,
			height: p100
		});

		this.rule("Scrollbar", ["horizontal"]).setAll({
			marginTop: 13,
			marginBottom: 13,
			minHeight: 12,
			width: p100
		});

		{
			const rule = this.rule("RoundedRectangle", ["scrollbar", "main", "background"]);

			rule.setAll({
				cornerRadiusTL: 8,
				cornerRadiusBL: 8,
				cornerRadiusTR: 8,
				cornerRadiusBR: 8,
				fillOpacity: 0.8,
			});

			setColor(rule, "fill", ic, "fill");
		}

		{
			const rule = this.rule("RoundedRectangle", ["scrollbar", "thumb"]);

			rule.setAll({
				role: "slider",
				ariaLive: "polite",
				position: "absolute",
				draggable: true
			});

			setColor(rule, "fill", ic, "secondaryButton");
		}

		{
			const rule = this.rule("RoundedRectangle", ["scrollbar", "thumb"]).states.create("hover", {});
			setColor(rule, "fill", ic, "secondaryButtonHover");
		}

		{
			const rule = this.rule("RoundedRectangle", ["scrollbar", "thumb"]).states.create("down", { stateAnimationDuration: 0 });
			setColor(rule, "fill", ic, "secondaryButtonDown");
		}

		this.rule("RoundedRectangle", ["scrollbar", "thumb", "vertical"]).setAll({
			x: p50,
			width: p100,
			centerX: p50,
			ariaLabel: language.translate("Use up and down arrows to move selection")
		});

		this.rule("RoundedRectangle", ["scrollbar", "thumb", "horizontal"]).setAll({
			y: p50,
			centerY: p50,
			height: p100,
			ariaLabel: language.translate("Use left and right arrows to move selection")
		});

		// @todo: is this needed? used to be "ContentScrollbar"
		// this.rule("Scrollbar", ["content?"]).setAll({
		// 	marginRight: 0,
		// 	marginLeft: 5,
		// 	layer: 5
		// });

		/**
		 * ========================================================================
		 * charts/xy
		 * ========================================================================
		 * 
		 * This needs to be in DefaultTheme because it's the only theme that is
		 * automatically applied to Root, and tooltips different ancestors
		 * than actual charts using them.
		 */

		{
			const rule = this.rule("PointedRectangle", ["axis", "tooltip", "background"]);

			rule.setAll({
				cornerRadius: 0
			});

			setColor(rule, "fill", ic, "alternativeBackground");
		}

		this.rule("Label", ["axis", "tooltip"]).setAll({
			role: undefined
		});

		this.rule("Label", ["axis", "tooltip", "y"]).setAll({
			textAlign: "right"
		});

		this.rule("Label", ["axis", "tooltip", "y", "opposite"]).setAll({
			textAlign: "left"
		});

		this.rule("Label", ["axis", "tooltip", "x"]).setAll({
			textAlign: "center"
		});


		/**
		 * ------------------------------------------------------------------------
		 * Shapes
		 * ------------------------------------------------------------------------
		 */

		// Class: Graphics
		this.rule("Star").setAll({
			spikes: 5,
			innerRadius: 5,
			radius: 10
		})
	}
}
