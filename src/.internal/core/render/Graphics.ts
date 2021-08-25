import type { Root } from "../Root";
import { ISpriteSettings, ISpritePrivate, ISpriteEvents, Sprite } from "./Sprite";
import { IGraphics, BlendMode } from "./backend/Renderer";
import type { Color } from "../util/Color";
import type { Pattern } from "../render/patterns/Pattern";
import type { Gradient } from "../render/gradients/Gradient";
import type { Template } from "../../core/util/Template";
import * as $type from "../util/Type";
import * as $array from "../util/Array";


export interface IGraphicsSettings extends ISpriteSettings {

	/**
	 * Fill color.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/} for more information
	 */
	fill?: Color;

	/**
	 * Stroke (border or line) color.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/} for more information
	 */
	stroke?: Color;

	/**
	 * Fill pattern.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more information
	 */
	fillPattern?: Pattern;

	/**
	 * Stroke (border or line) pattern.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more information
	 */
	strokePattern?: Pattern;

	/**
	 * Fill gradient.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more information
	 */
	fillGradient?: Gradient;

	/**
	 * Stroke (border or line) gradient.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more information
	 */
	strokeGradient?: Gradient;

	/**
	 * Stroke (border or line) dash settings.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/#Dashed_lines} for more information
	 */
	strokeDasharray?: number[] | number;

	/**
	 * Stroke (border or line) dash offset.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/#Dashed_lines} for more information
	 */
	strokeDashoffset?: number;

	/**
	 * Opacity of the fill. 0 - fully transparent; 1 - fully opaque.
	 */
	fillOpacity?: number;

	/**
	 * Opacity of the stroke (border or line). 0 - fully transparent; 1 - fully opaque.
	 */
	strokeOpacity?: number;

	/**
	 * Width of the stroke (border or line) in pixels.
	 */
	strokeWidth?: number;

	/**
	 * Drawing function.
	 *
	 * Must use renderer (`display` parameter) methods to draw.
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
	 * Draw a shape using an SVG path.
	 * 
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths} for more information
	 */
	svgPath?: string;

}

export interface IGraphicsPrivate extends ISpritePrivate {
}

export interface IGraphicsEvents extends ISpriteEvents {
}

/**
 * Base class used for drawing shapes.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/graphics/} for more info
 * @important
 */
export class Graphics extends Sprite {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Graphics["_settings"], template?: Template<Graphics>): Graphics {
		const x = new Graphics(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IGraphicsSettings;
	declare public _privateSettings: IGraphicsPrivate;
	declare public _events: IGraphicsEvents;

	public _display: IGraphics = this._root._renderer.makeGraphics();

	protected _clear = false;

	public static className: string = "Graphics";
	public static classNames: Array<string> = Sprite.classNames.concat([Graphics.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("draw")) {
			this.markDirtyBounds();
		}

		if (this.isDirty("fill") || this.isDirty("stroke") || this.isDirty("fillGradient") || this.isDirty("strokeGradient") || this.isDirty("fillPattern") || this.isDirty("strokePattern") || this.isDirty("fillOpacity") || this.isDirty("strokeOpacity") || this.isDirty("strokeWidth") || this.isDirty("draw") || this.isDirty("blendMode") || this.isDirty("strokeDasharray") || this.isDirty("strokeDashoffset") || this.isDirty("svgPath")) {
			this._clear = true;
		}

		if (this.isDirty("fillGradient")) {
			const gradient = this.get("fillGradient");
			if (gradient) {
				const gradientTarget = gradient.get("target");
				if (gradientTarget) {
					gradientTarget.events.on("boundschanged", () => {
						this._markDirtyKey("fill");
					})
					gradientTarget.events.on("positionchanged", () => {
						this._markDirtyKey("fill");
					})
				}
			}
		}

		if (this.isDirty("strokeGradient")) {
			const gradient = this.get("strokeGradient");
			if (gradient) {
				const gradientTarget = gradient.get("target");
				if (gradientTarget) {
					gradientTarget.events.on("boundschanged", () => {
						this._markDirtyKey("stroke");
					})
					gradientTarget.events.on("positionchanged", () => {
						this._markDirtyKey("stroke");
					})
				}
			}
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
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
			if (draw) {
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

			//const bounds = this._display.getLocalBounds();

			if (fillPattern) {
				let changed = false;
				if (fill && (!fillPattern.get("fill") || fillPattern.get("fillInherited"))) {
					fillPattern.set("fill", fill);
					fillPattern.set("fillInherited", true)
					changed = true;
				}
				if (stroke && (!fillPattern.get("color") || fillPattern.get("colorInherited"))) {
					fillPattern.set("color", stroke);
					fillPattern.set("colorInherited", true)
					changed = true;
				}
				if (changed) {
					// @todo: is this OK?
					fillPattern._changed();
				}
				const pattern = fillPattern.pattern;
				if (pattern) {
					this._display.beginFill(pattern, fillOpacity);
					this._display.endFill();
				}
			}
			else if (fillGradient) {
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
			else if (fill) {
				this._display.beginFill(fill, fillOpacity);
				this._display.endFill();
			}

			if (stroke || strokeGradient || strokePattern) {
				const strokeOpacity = this.get("strokeOpacity");
				const strokeWidth = this.get("strokeWidth", 1);

				if (strokePattern) {
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
					const pattern = strokePattern.pattern;
					if (pattern) {
						this._display.lineStyle(strokeWidth, pattern, strokeOpacity);
						this._display.endStroke();
					}
				}
				else if (strokeGradient) {

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
						this._display.lineStyle(strokeWidth, gradient, strokeOpacity);
						this._display.endStroke();
					}
				}
				else if (stroke) {
					this._display.lineStyle(strokeWidth, stroke, strokeOpacity);
					this._display.endStroke();
				}

			}
		}
		this._clear = false;
	}

}
