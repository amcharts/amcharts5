import type { Color } from "../util/Color";
import type { Pattern } from "../render/patterns/Pattern";
import type { Gradient } from "../render/gradients/Gradient";

import { PicturePattern } from "../render/patterns/PicturePattern";
import { ISpriteSettings, ISpritePrivate, ISpriteEvents, Sprite } from "./Sprite";
import { IGraphics, BlendMode } from "./backend/Renderer";

import * as $type from "../util/Type";
import * as $array from "../util/Array";


export const visualSettings = ["fill", "fillOpacity", "stroke", "strokeWidth", "strokeOpacity", "fillPattern", "strokePattern", "fillGradient", "strokeGradient", "strokeDasharray", "strokeDashoffset", "shadowBlur", "shadowColor", "shadowOpacity", "shadowOffsetX", "shadowOffsetY", "blur", "sepia", "invert", "brightness", "hue", "contrast", "saturate"];

export interface IGraphicsSettings extends ISpriteSettings {

	/**
	 * Fill color.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/} for more information
	 */
	fill?: Color;

	/**
	 * Stroke (border or line) color.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/} for more information
	 */
	stroke?: Color;

	/**
	 * Fill pattern.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/} for more information
	 */
	fillPattern?: Pattern;

	/**
	 * Stroke (border or line) pattern.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/patterns/} for more information
	 */
	strokePattern?: Pattern;

	/**
	 * Fill gradient.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/gradients/} for more information
	 */
	fillGradient?: Gradient;

	/**
	 * Stroke (border or line) gradient.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/gradients/} for more information
	 */
	strokeGradient?: Gradient;

	/**
	 * Dash pattern of the stroke (border or line): lengths in pixels of dashes
	 * and gaps, e.g. `[4, 2]`. A single number makes dashes and gaps of that
	 * length.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/#dashed-lines} for more information
	 */
	strokeDasharray?: number[] | number;

	/**
	 * Stroke (border or line) dash offset.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/#dashed-lines} for more information
	 */
	strokeDashoffset?: number;

	/**
	 * Opacity of the fill, from `0` (transparent) to `1` (opaque).
	 */
	fillOpacity?: number;

	/**
	 * Opacity of the stroke (border or line), from `0` (transparent) to `1`
	 * (opaque).
	 */
	strokeOpacity?: number;

	/**
	 * Width of the stroke (border or line) in pixels.
	 *
	 * @default 1
	 */
	strokeWidth?: number;

	/**
	 * Keeps the stroke width the same when the element's `scale` changes. A
	 * parent's scale still affects it.
	 *
	 * @default false
	 */
	nonScalingStroke?: boolean;

	/**
	 * Drawing function.
	 *
	 * Must use renderer (`display` parameter) methods to draw.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/graphics/#custom-draw-functions} for more info
	 */
	draw?: (display: IGraphics, graphics: Graphics) => void;

	/**
	 * Rendering mode.
	 *
	 * @default BlendMode.NORMAL ("source-over")
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation} for more information
	 * @ignore
	 */
	blendMode?: BlendMode;

	/**
	 * SVG path data (as in the `d` attribute of a `<path>`) to draw the shape
	 * from.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths} for more information
	 */
	svgPath?: string;

	/**
	 * Color of the element's shadow. It shows only when `shadowBlur`,
	 * `shadowOffsetX` or `shadowOffsetY` is set too.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowColor?: Color | null;

	/**
	 * Blurriness of the shadow: the bigger the number, the blurrier the shadow.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowBlur?: number;

	/**
	 * Horizontal shadow offset in pixels.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOffsetX?: number;

	/**
	 * Vertical shadow offset in pixels.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOffsetY?: number;

	/**
	 * Opacity of the shadow, from `0` to `1`. If not set, the shadow takes the
	 * opacity of the element's fill.
	 *
	 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOpacity?: number;

	/**
	 * Shape of the joints of a multi-point line.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin} for more info
	 * @default "miter"
	 * @since 5.2.10
	 */
	lineJoin?: "miter" | "round" | "bevel";

	/**
	 * Shape of the end points of lines.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineCap} for more info
	 * @default "butt"
	 * @since 5.10.8
	 */
	lineCap?: "butt" | "round" | "square";
}

export interface IGraphicsPrivate extends ISpritePrivate {

}

export interface IGraphicsEvents extends ISpriteEvents {

}

/**
 * An element that draws a shape; the base class of all shapes.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Graphics extends Sprite {

	declare public _settings: IGraphicsSettings;
	declare public _privateSettings: IGraphicsPrivate;
	declare public _events: IGraphicsEvents;

	public _display: IGraphics = this._root._renderer.makeGraphics();

	protected _clear = false;

	public static className: string = "Graphics";
	public static classNames: Array<string> = Sprite.classNames.concat([Graphics.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("draw") || this.isDirty("svgPath")) {
			this.markDirtyBounds();
		}

		if (this.isDirty("fill") || this.isDirty("stroke") || this.isDirty("visible") || this.isDirty("forceHidden") || this.isDirty("scale") || this.isDirty("fillGradient") || this.isDirty("strokeGradient") || this.isDirty("fillPattern") || this.isDirty("strokePattern") || this.isDirty("fillOpacity") || this.isDirty("strokeOpacity") || this.isDirty("strokeWidth") || this.isDirty("draw") || this.isDirty("blendMode") || this.isDirty("strokeDasharray") || this.isDirty("strokeDashoffset") || this.isDirty("svgPath") || this.isDirty("lineJoin") || this.isDirty("lineCap") || this.isDirty("shadowColor") || this.isDirty("shadowBlur") || this.isDirty("shadowOffsetX") || this.isDirty("shadowOffsetY") || this.isDirty("shadowOpacity")) {
			this._clear = true;
		}

		this._display.crisp = this.get("crisp", false);

		if (this.isDirty("fillGradient")) {
			const gradient = this.get("fillGradient");
			if (gradient) {
				this._display.isMeasured = true;
				const gradientTarget = gradient.get("target");
				if (gradientTarget) {
					this._disposers.push(gradientTarget.events.on("boundschanged", () => {
						this._markDirtyKey("fill");
					}))
					this._disposers.push(
						gradientTarget.events.on("positionchanged", () => {
							this._markDirtyKey("fill");
						}))
				}
			}
		}

		if (this.isDirty("strokeGradient")) {
			const gradient = this.get("strokeGradient");
			if (gradient) {
				this._display.isMeasured = true;
				const gradientTarget = gradient.get("target");
				if (gradientTarget) {
					this._disposers.push(
						gradientTarget.events.on("boundschanged", () => {
							this._markDirtyKey("stroke");
						}))
					this._disposers.push(
						gradientTarget.events.on("positionchanged", () => {
							this._markDirtyKey("stroke");
						}))
				}
			}
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			this.markDirtyBounds();
			this.markDirtyLayer();
			this._display.clear();

			let strokeDasharray = this.get("strokeDasharray");
			if ($type.isNumber(strokeDasharray)) {
				if (strokeDasharray < 0.5) {
					strokeDasharray = [0];
				}
				else {
					strokeDasharray = [strokeDasharray]
				}
			}
			this._display.setLineDash(strokeDasharray as number[]);

			const strokeDashoffset = this.get("strokeDashoffset");
			if (strokeDashoffset) {
				this._display.setLineDashOffset(strokeDashoffset);
			}

			const blendMode = this.get("blendMode", BlendMode.NORMAL);
			this._display.blendMode = blendMode;

			const draw = this.get("draw");

			if (draw && typeof draw === "function") {
				draw(this._display, this);
			}

			const svgPath = this.get("svgPath");
			if (svgPath != null) {
				this._display.svgPath(svgPath!);
			}
		}
	}

	public _afterChanged() {
		super._afterChanged();

		if (this._clear) {
			const fill = this.get("fill");
			const fillGradient = this.get("fillGradient");
			const fillPattern = this.get("fillPattern");
			const fillOpacity = this.get("fillOpacity");

			const stroke = this.get("stroke");
			const strokeGradient = this.get("strokeGradient");
			const strokePattern = this.get("strokePattern");

			const shadowColor = this.get("shadowColor");
			const shadowBlur = this.get("shadowBlur");
			const shadowOffsetX = this.get("shadowOffsetX");
			const shadowOffsetY = this.get("shadowOffsetY");
			const shadowOpacity = this.get("shadowOpacity");

			if (shadowColor && (shadowBlur || shadowOffsetX || shadowOffsetY)) {
				this._display.shadow(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, shadowOpacity);
			}

			if (fill && !fillGradient) {
				this._display.beginFill(fill, fillOpacity);
				this._display.endFill();
			}

			if (fillGradient) {
				if (fill) {
					const stops = fillGradient.get("stops", []);
					if (stops.length) {
						$array.each(stops, (stop: any) => {
							if ((!stop.color || stop.colorInherited) && fill) {
								stop.color = fill;
								stop.colorInherited = true;
							}

							if (stop.opacity == null || stop.opacityInherited) {
								stop.opacity = fillOpacity;
								stop.opacityInherited = true;
							}
						})
					}
				}
				const gradient = fillGradient.getFill(this);
				if (gradient) {
					this._display.beginFill(gradient, fillOpacity);
					this._display.endFill();
				}
			}

			if (fillPattern) {
				const pattern = fillPattern.pattern;
				if (pattern) {
					this._display.beginFill(pattern, fillOpacity);
					this._display.endFill();

					if (fillPattern instanceof PicturePattern) {
						fillPattern.events.once("loaded", () => {
							this._clear = true;
							this.markDirty();
						});
					}
				}
			}

			if (stroke || strokeGradient || strokePattern) {
				const strokeOpacity = this.get("strokeOpacity");
				let strokeWidth = this.get("strokeWidth", 1);

				if (this.get("nonScalingStroke")) {
					strokeWidth = strokeWidth / this.get("scale", 1)
				}

				if (this.get("crisp")) {
					strokeWidth /= this._root._renderer.resolution;
				}

				const lineJoin = this.get("lineJoin");
				const lineCap = this.get("lineCap");

				if (stroke && !strokeGradient) {
					this._display.lineStyle(strokeWidth, stroke, strokeOpacity, lineJoin, lineCap);
					this._display.endStroke();
				}


				if (strokeGradient) {
					const stops = strokeGradient.get("stops", []);
					if (stops.length) {
						$array.each(stops, (stop: any) => {
							if ((!stop.color || stop.colorInherited) && stroke) {
								stop.color = stroke;
								stop.colorInherited = true;
							}

							if (stop.opacity == null || stop.opacityInherited) {
								stop.opacity = strokeOpacity;
								stop.opacityInherited = true;
							}
						})
					}

					const gradient = strokeGradient.getFill(this);
					if (gradient) {
						this._display.lineStyle(strokeWidth, gradient, strokeOpacity, lineJoin, lineCap);
						this._display.endStroke();
					}
				}

				if (strokePattern) {
					/*
					let changed = false;
					
					if (stroke && (!strokePattern.get("color") || strokePattern.get("colorInherited"))) {
						strokePattern.set("color", stroke);
						strokePattern.set("colorInherited", true);
						changed = true;
					}
					if (changed) {
						// @todo: is this OK?
						strokePattern._changed();
					}
					*/
					let pattern = strokePattern.pattern;

					if (pattern) {
						this._display.lineStyle(strokeWidth, pattern, strokeOpacity, lineJoin, lineCap);
						this._display.endStroke();

						if (strokePattern instanceof PicturePattern) {
							strokePattern.events.once("loaded", () => {
								this._clear = true;
								this.markDirty();
							});
						}
					}
				}
			}

			if (this.getPrivate("showingTooltip")) {
				this.showTooltip();
			}

			// An unmeasured shape gets no bounds updates, so once it is drawn its
			// focus element is updated if it gained or lost size (e.g. a map
			// polygon turning to the far side of a globe), or moved if it has focus
			if (this.get("focusable") && !this.get("isMeasured")) {
				const focusElement = this.getPrivate("focusElement");
				if (focusElement && (this._root.focused(this) || (focusElement.dom.getAttribute("aria-hidden") == "true") == this._root._hasFocusSize(this))) {
					this.markDirtyAccessibility();
				}
			}
		}

		this._clear = false;
	}

}
