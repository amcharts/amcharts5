import type { IGraphics, IPattern } from "../backend/Renderer";
import type { Color } from "../../util/Color";
import type { Template } from "../../util/Template";
import type { Root } from "../../Root";

import { Entity, IEntitySettings, IEntityPrivate } from "../../util/Entity";

export interface IPatternSettings extends IEntitySettings {

	/**
	 * Rotation of patterm in degrees. Supported values: -90 to 90.
	 *
	 * @default 0
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Rotation} for more info
	 */
	rotation?: number;

	/**
	 * How pattern tiles are repeated when filling the area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Repetition} for more info
	 */
	repetition?: "repeat" | "repeat-x" | "repeat-y" | "no-repeat";

	/**
	 * Width of the pattern tile, in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Sizing_patterns} for more info
	 */
	width: number;

	/**
	 * Width of the pattern tile, in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Sizing_patterns} for more info
	 */
	height: number;

	/**
	 * Color of the pattern shape.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Colors} for more info
	 */
	color?: Color;

	/**
	 * Opacity of the pattern shape.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Colors} for more info
	 */
	colorOpacity?: number;

	/**
	 * Width of the pattern's line elements.
	 *
	 * @default 1
	 */
	strokeWidth: number;

	/**
	 * Color to fill gaps between pattern shapes.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Colors} for more info
	 */
	fill?: Color;

	/**
	 * Opacity of the fill for gaps between pattern shapes.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Colors} for more info
	 */
	fillOpacity?: number;

	/**
	 * @ignore
	 */
	colorInherited?: boolean;

	/**
	 * @ignore
	 */
	fillInherited?: boolean;
}

export interface IPatternPrivate extends IEntityPrivate {
}

/**
 * Base class for patterns.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class Pattern extends Entity {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Pattern["_settings"], template?: Template<Pattern>): Pattern {
		const x = new Pattern(root, settings, true, template);
		x._afterNew();
		return x;
	}

	protected _afterNew() {
		super._afterNew();

		// Applying themes because pattern will not have parent
		this._applyThemes();
	}

	declare public _settings: IPatternSettings;
	declare public _privateSettings: IPatternPrivate;

	public static className: string = "Pattern";
	public static classNames: Array<string> = Entity.classNames.concat([Pattern.className]);

	public _display: IGraphics = this._root._renderer.makeGraphics();
	public _backgroundDisplay: IGraphics = this._root._renderer.makeGraphics();

	protected _clear = false;

	protected _pattern: IPattern | undefined;

	public get pattern(): IPattern | undefined {
		return this._pattern;
	}

	protected _draw(): void { }

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("repetition") || this.isDirty("width") || this.isDirty("height") || this.isDirty("rotation") || this.isDirty("color") || this.isDirty("strokeWidth") || this.isDirty("colorOpacity") || this.isDirty("fill") || this.isDirty("fillOpacity")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			const repetition = this.get("repetition", "");
			const width = this.get("width");
			const height = this.get("height");
			const fill = this.get("fill");
			const fillOpacity = this.get("fillOpacity", 1);

			this._display.clear();
			this._backgroundDisplay.clear();

			if (fill && (fillOpacity > 0)) {
				this._backgroundDisplay.beginFill(fill, fillOpacity);
				this._backgroundDisplay.drawRect(0, 0, width, height);
				this._backgroundDisplay.endFill();
			}

			this._display.angle = this.get("rotation", 0);
			//this._display.pivot = { x: width / 2, y: height / 2 };
			this._draw();

			this._pattern = this._root._renderer.createPattern(this._display, this._backgroundDisplay, repetition, width, height);
		}
	}
}
