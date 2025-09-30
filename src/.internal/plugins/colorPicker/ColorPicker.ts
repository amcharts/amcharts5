import type { ColorPickerButton } from "./ColorPickerButton";
import type { CanvasLayer } from "../../core/render/backend/CanvasRenderer";
import type { ISpritePointerEvent } from "../../core/render/Sprite";

import { ColorPickerDefaultTheme } from "./ColorPickerDefaultTheme";
import { color, Color } from "../../core/util/Color";
import { ListTemplate } from "../../core/util/List";
import { p100 } from "../../core/util/Percent";
import { Template } from "../../core/util/Template";
import { Button } from "../../core/render/Button";
import { Circle } from "../../core/render/Circle";
import { Container, IContainerEvents, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { EditableLabel } from "../../core/render/EditableLabel";
import { Graphics } from "../../core/render/Graphics";
import { Label } from "../../core/render/Label";
import { Rectangle } from "../../core/render/Rectangle";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";
import { Slider } from "../../core/render/Slider";
import { LinearGradient } from "../../core/render/gradients/LinearGradient";

import * as $utils from "../../core/util/Utils";
import * as $type from "../../core/util/Type";

export interface IColorPickerSettings extends IContainerSettings {
	/**
	 * Color picker button to use.
	 */
	colorButton?: ColorPickerButton;

	/*
	* Hue of the color picker.
	 */
	hue?: number;

	/**
	 * Color of the color picker.
	 */
	color?: Color;

	/**
	 * Opacity of the color.
	 */
	colorOpacity?: number;

	/**
	 * Background color of the color picker.
	 */
	backgroundColor?: Color;
}

export interface IColorPickerPrivate extends IContainerPrivate {

}

export interface IColorPickerEvents extends IContainerEvents {
	colorchanged: {
		color?: Color;
		colorOpacity?: number;
	}
}

export class ColorPicker extends Container {
	public static className: string = "ColorPicker";
	public static classNames: Array<string> = Container.classNames.concat([ColorPicker.className]);

	declare public _settings: IColorPickerSettings;
	declare public _privateSettings: IColorPickerPrivate;
	declare public _events: IColorPickerEvents;

	protected _currentRectangle: RoundedRectangle | undefined;

	public _clickOverlay = this.children.push(Rectangle.new(this._root, {
		position: "absolute",
		fillOpacity: 0,
		interactive: true,
		isMeasured: false,
		fill: color(0x000000),
		forceHidden: true
	}))

	public readonly rectangles: ListTemplate<RoundedRectangle> = new ListTemplate(
		Template.new({}),
		() => RoundedRectangle._new(this._root, {
		}, [this.rectangles.template])
	);


	/**
	 * Container for color gradients.
	 */
	public gradientsContainer: Container = this.children.push(Container.new(this._root, {

		themeTagsSelf: ["gradientscontainer"],
		width: p100,
		layout: this._root.horizontalLayout
	}))


	/**
	 * Container for color gradients.
	 * @ignore
	 */
	public colorGradientsContainer: Container = this.gradientsContainer.children.push(Container.new(this._root, {
		width: p100,
		layer: 0
	}));

	/**
	 * Rectangle that displays the color gradient.
	 * @ignore
	 */
	public colorRectangle: Rectangle = this.colorGradientsContainer.children.push(Rectangle.new(this._root, {
		crisp: true,
		themeTags: ["colorrectangle"],
		width: p100,
		height: p100,
		strokeWidth: 1
	}));

	/**
	 * Rectangle that displays the white overlay.
	 * @ignore* 
	 */
	public colorRectangleWhiteOverlay: Rectangle = this.colorGradientsContainer.children.push(Rectangle.new(this._root, {
		crisp: true,
		forceInactive: true,
		width: p100,
		height: p100
	}));

	/**
	 * Rectangle that displays the black overlay.
	 * @ignore 
	 */
	public colorRectangleBlackOverlay: Rectangle = this.colorGradientsContainer.children.push(Rectangle.new(this._root, {
		crisp: true,
		forceInactive: true,
		width: p100,
		height: p100
	}));

	/**
	 * Slider that displays the hue of the color.
	 */
	public slider = this.gradientsContainer.children.push(Slider.new(this._root, {
		orientation: "vertical",
		themeTags: ["gradient"]
	}));

	/**
	 * @ignore 
	 */
	public inputContainer = this.children.push(Container.new(this._root, {
		marginTop: 10,
		layout: this._root.horizontalLayout,
		width: p100
	}));

	/**
	 * Button that shows color picker button.
	 */
	public pickerButton = this.inputContainer.children.push(Button.new(this._root, {
		themeTags: ["picker", "pickertool"],
		toggleKey: "active",
		icon: Graphics.new(this._root, {
			themeTags: ["icon"]
		})
	}));

	/**
	 * Button that allows to remove color.
	 */
	public noColorButton = this.inputContainer.children.push(Button.new(this._root, {
		themeTags: ["nocolor", "pickertool"],
		icon: Graphics.new(this._root, {
			themeTags: ["icon"]
		})
	}));

	/**
	 * Editable label that allows to input color in hex format.
	 */
	public colorInput = this.inputContainer.children.push(EditableLabel.new(this._root, {
		themeTags: ["input", "color"]
	}));

	/**
	 * @ignore
	 */
	public opacityContainer = this.children.push(Container.new(this._root, {
		width: p100,
		marginTop: 10,
		layout: this._root.horizontalLayout
	}));

	/**
	 * Slider that allows to change opacity of the color.
	 */
	public opacitySlider = this.opacityContainer.children.push(Slider.new(this._root, {
		themeTags: ["opacity"],
		orientation: "horizontal"
	}));

	/**
	 * Circle that indicates the target color.
	 */
	public targetCircle = this.colorGradientsContainer.children.push(Circle.new(this._root, {
		themeTags: ["circle", "target"],
		isMeasured: false,
		forceInactive: true,
		position: "absolute",
		layer: 30
	}));

	/**
	 * @ignore
	 */
	public buttonsContainer = this.children.push(Container.new(this._root, {
		marginTop: 10,
		layout: this._root.horizontalLayout,
		width: p100
	}));

	/**
	 * Button that allows to cancel color selection.
	 */
	public cancelButton = this.buttonsContainer.children.push(Button.new(this._root, {
		themeTags: ["cancel"],
		label: Label.new(this._root, {})
	}));

	/**
	 * Button that allows to confirm color selection.
	 */
	public okButton = this.buttonsContainer.children.push(Button.new(this._root, {
		themeTags: ["ok"],
		label: Label.new(this._root, {})
	}));


	protected _isColorDown: boolean = false;
	protected _isPicking: boolean = false;
	protected _isEditing: boolean = false;
	protected _previousColor: Color | undefined;
	protected _previousOpacity: number | undefined;
	protected _prevColor: Color | undefined;

	/**
	 * @ignore
	 */
	protected _afterNew(): void {
		this._defaultThemes.push(ColorPickerDefaultTheme.new(this._root));

		this.addTag("colorpicker");
		super._afterNew();

		this.set("tooltip", this._root.systemTooltip);

		this.cancelButton.events.on("click", () => {
			this.cancel();
		});

		this.okButton.events.on("click", () => {
			this.set("colorButton", undefined);
			// dispatch event
			this.events.dispatch("colorchanged", {
				type: "colorchanged",
				target: this,
				color: this.get("color"),
				colorOpacity: this.get("colorOpacity")
			});
		});

		const container = this.root.container;
		container.events.on("boundschanged", () => {
			const w = container.width();
			const h = container.height();

			this._clickOverlay.setAll({
				width: w,
				height: h,
				x: 0,
				y: 0
			});
		})

		this._clickOverlay.events.on("click", () => {
			if (!this._isPicking && !this._isEditing) {
				this.cancel();
			}
			else {
				this.pickerButton.set("active", false);
			}
		})

		this.set("layout", this._root.verticalLayout);

		// remove text color input when nocolor button is pressed
		this.noColorButton.events.on("click", () => {
			this.set("color", undefined);

			const colorButton = this.get("colorButton");
			if (colorButton) {
				colorButton.setAll({
					color: undefined,
					colorOpacity: 1
				});
			}

			// dispatch event
			this.events.dispatch("colorchanged", {
				type: "colorchanged",
				target: this,
				color: undefined,
				colorOpacity: 1
			});

			this.set("colorButton", undefined);
		})

		this.colorInput.on("text", (text) => {
			if (text) {
				text = text.replace(/[^abcdef0-9#]/ig, "");

				if (text.substring(0, 1) !== "#") {
					text = "#" + text;
				}

				try {
					this.set("color", color(text));
				}
				catch (e) {
					return;
				}

				this.colorInput.set("text", text);
			}
		})

		this.pickerButton.on("active", (active) => {
			this._isPicking = Boolean(active);
			this.set("forceInactive", active);
		})

		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(document, "keyup", (e: KeyboardEvent) => {
				if (e.key === "Escape") {
					this.set("colorButton", undefined);
				}
			}));
		}

		this.gradientsContainer.events.on("boundschanged", () => {
			const w = Math.floor(this.colorGradientsContainer.width());
			this.colorGradientsContainer.setAll({ width: w, height: w });

			this.slider.set("height", w);
		})

		this.targetCircle.setAll({
			x: this.colorRectangle.width(),
			y: 0
		})

		// limit target circle to the bounds of the color gradient
		this.targetCircle.adapters.add("x", (x) => {
			if ($type.isNumber(x)) {
				const w = this.colorRectangle.width();
				return Math.min(w, Math.max(0, x));
			}
		})

		this.targetCircle.adapters.add("y", (y) => {
			if ($type.isNumber(y)) {
				const h = this.colorRectangle.height();
				return Math.min(h, Math.max(0, y));
			}
		})

		this.slider.on("start", () => {
			this.set("hue", this.slider.get("start", 0));
		})

		const sliderBg = this.slider.get("background");
		if (sliderBg) {
			sliderBg.set("layer", 0);
		}

		// handle opacity slider changes
		this.opacitySlider.on("start", () => {
			this.set("colorOpacity", this.opacitySlider.get("start", 1));
		})

		const opacitySliderBg = this.opacitySlider.get("background");
		if (opacitySliderBg) {
			opacitySliderBg.set("layer", 0);
		}

		// big rectangle events
		this.colorRectangle.events.on("pointerdown", (e) => {
			this._isColorDown = true;
			this._handleTargetMove(e);
			this.set("draggable", false);
			this.dragStop(e);
		})

		this.colorRectangle.events.on("globalpointermove", (e) => {
			if (this._isColorDown) {
				this._handleTargetMove(e);
			}
			if (this._isPicking) {
				const display = this._root.container._display;
				const context = (display.getLayer() as CanvasLayer).context;
				const resolution = display._renderer.resolution;
				const imageData = context.getImageData(Math.floor(e.point.x * resolution), Math.floor(e.point.y * resolution), 1, 1).data;
				const fill = Color.fromRGB(imageData[0], imageData[1], imageData[2]);

				this.set("color", fill);
			}
		})

		this.colorRectangle.events.on("globalpointerup", (e) => {
			this.set("draggable", true);

			this.dragStop(e);
			this._isColorDown = false;
		})

		this.colorInput.on("active", (active) => {
			this._isEditing = Boolean(active);
		});
	}


	/**
	 * @ignore
	 */
	public _updateChildren(): void {
		super._updateChildren();

		if (this.isDirty("colorButton")) {
			this.pickerButton.set("active", false);
			const colorButton = this.get("colorButton");
			let hidden = true;

			if (colorButton) {
				this.opacityContainer.set("forceHidden", colorButton.get("disableOpacity"));

				this._previousColor = colorButton.get("color", colorButton.getPrivate("color"));
				this._previousOpacity = colorButton.get("colorOpacity");

				const parent = this.parent;
				if (parent) {
					parent.children.moveValue(this._clickOverlay);
					parent.children.moveValue(this);
				}
				hidden = false;
				this.show();

				this.set("color", colorButton.get("color", colorButton.getPrivate("color")));
				this.set("colorOpacity", colorButton.get("colorOpacity") || 1);
			}
			else {
				this.hide();
			}

			this._clickOverlay.set("forceHidden", hidden);
		}

		if (this.isDirty("hue")) {
			this._handleDirtyHue();
			this._updateColor();
		}

		if (this.isDirty("colorOpacity")) {
			const opacitySlider = this.opacitySlider;
			const opacity = this.get("colorOpacity", 1);

			opacitySlider.startGrip.set("tooltipText", "opacity:" + Math.round(opacity * 100) + "%");

			if (!opacitySlider.startGrip.isDragging()) {
				opacitySlider.set("start", opacity)
				opacitySlider.markDirtyKey("start");
			}
			else {
				opacitySlider.startGrip.hover();
			}

			const colorButton = this.get("colorButton");
			if (colorButton) {
				colorButton.set("colorOpacity", opacity);
			}
			this._updateOpacitySliderGrip();
		}

		if (this.isDirty("color")) {
			const fill = this.get("color");
			const prevColor = this._prevColor;

			let same = false;
			if (fill && prevColor && fill.toCSSHex() === prevColor.toCSSHex()) {
				same = true;
				// void
			}

			if (!same) {
				if (fill) {
					this.targetCircle.show();
					if (!this._isColorDown) {
						const hsv = $utils.hslToHsv(fill.toHSL());

						this.setRaw("hue", hsv.h);
						if (!this.slider.startGrip.isDragging()) {
							this.slider.set("start", hsv.h);
						}

						this.targetCircle.setAll({
							x: this.colorRectangle.width() * hsv.s,
							y: this.colorRectangle.height() * (1 - hsv.v)
						})
					}


					this.targetCircle.set("fill", fill)
					this._handleDirtyHue();

					this.colorInput.set("text", fill.toCSSHex().substring(1, 7));
				}
				else {
					this.targetCircle.hide();
					this.colorInput.set("text", "");
				}

				this._prevColor = fill;

				const opacitySliderBg = this.opacitySlider.get("background");

				if (opacitySliderBg) {
					opacitySliderBg.set("fillGradient", LinearGradient.new(this._root, {
						rotation: 0,
						stops: [
							{ color: fill, opacity: 0 },
							{ color: fill, opacity: 1 }
						]
					}));
				}

				const colorButton = this.get("colorButton");
				if (colorButton) {
					colorButton.set("color", fill);
				}
				this._updateOpacitySliderGrip();
			}
		}

		if (this.isDirty("backgroundColor")) {
			const bgColor = this.get("backgroundColor", color(0xffffff));

			this.colorRectangle.setAll({
				stroke: bgColor
			});

			this.colorRectangleBlackOverlay.setAll({
				stroke: bgColor
			});

			this.colorRectangleWhiteOverlay.setAll({
				stroke: bgColor
			});

			this.pickerButton.get("background")?.states.applyAnimate("default", 0);
			this.noColorButton.get("background")?.states.applyAnimate("default", 0);
			this.cancelButton.get("background")?.states.applyAnimate("default", 0);
			this.okButton.get("background")?.states.applyAnimate("default", 0);
		}
	}

	/**
	 * @ignore
	 */
	protected _handleDirtyHue(): void {
		const start = this.slider.get("start", 0);
		const fill = Color.fromHSL(start, 1, .5);
		const grip = this.slider.startGrip;

		this.colorRectangle.setAll({
			fill: fill,
			stroke: this.get("backgroundColor", color(0xffffff))
		});

		const gripBg = grip.get("background");
		if (gripBg) {
			gripBg.set("fill", fill);
			gripBg.states.lookup("default")?.set("fill", fill);
			gripBg.states.lookup("hover")?.set("fill", fill);
			gripBg.states.lookup("down")?.set("fill", fill);
		}

		this.colorRectangleWhiteOverlay.setAll({
			fillGradient: LinearGradient.new(this._root, {
				rotation: 0,

				stops: [
					{ color: color(0xffffff), opacity: 1, offset: 0 },
					{ color: color(0xffffff), opacity: 0, offset: 1 }
				]
			})
		});


		this.colorRectangleBlackOverlay.setAll({
			fillGradient: LinearGradient.new(this._root, {
				stops: [
					{ color: color(0x000000), opacity: 0, offset: 0 },
					{ color: color(0x000000), opacity: 1, offset: 1 }
				]
			})
		});
	}

	/**
	 * @ignore
	 */
	protected _handleTargetMove(e: ISpritePointerEvent) {
		const point = this.colorGradientsContainer.toLocal({ x: e.point.x, y: e.point.y });
		this.targetCircle.setAll({
			x: point.x,
			y: point.y
		})

		this._updateColor();
	}

	/**
	 * @ignore
	 */
	protected _updateColor() {
		const x = this.targetCircle.x();
		const y = this.targetCircle.y();
		const h = this.colorRectangle.height();
		const w = this.colorRectangle.width();

		const start = this.slider.get("start", 0);
		let hsl = $utils.hsvToHsl({ h: start, s: x / w, v: 1 - y / h });

		this.set("color", Color.fromHSL(hsl.h, hsl.s, hsl.l));
	}

	/**
	 * @ignore
	 */
	protected _updateOpacitySliderGrip() {
		const opacityBg = this.opacitySlider.startGrip.get("background");
		if (opacityBg) {
			const fill = Color.interpolate(this.get("colorOpacity", 1), this.get("backgroundColor", color(0xffffff)), this.get("color", color(0xffffff)))
			opacityBg.set("fill", fill);
			opacityBg.states.lookup("default")?.set("fill", fill);
			opacityBg.states.lookup("hover")?.set("fill", fill);
			opacityBg.states.lookup("down")?.set("fill", fill);
		}
	}

	/**
	 * Cancels color selection and restores previous color.
	 */
	public cancel() {
		this.get("colorButton")?.setAll({
			color: this._previousColor,
			colorOpacity: this._previousOpacity
		});
		this._isEditing = false;
		this._isPicking = false;
		this.set("color", this._previousColor);
		this.set("colorButton", undefined);
	}
}
