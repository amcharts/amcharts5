import type { IGraphics, IPattern } from "../backend/Renderer";
import type { Color } from "../../util/Color";

import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../util/Entity";

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
	width?: number;

	/**
	 * Width of the pattern tile, in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Sizing_patterns} for more info
	 */
	height?: number;

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
	strokeWidth?: number;

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

export interface IPatternEvents extends IEntityEvents {
}

/**
 * Base class for patterns.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class Pattern extends Entity {
	protected _afterNew() {
		// Applying themes because pattern will not have parent
		super._afterNewApplyThemes();
	}

	declare public _settings: IPatternSettings;
	declare public _privateSettings: IPatternPrivate;

	public static className: string = "Pattern";
	public static classNames: Array<string> = Entity.classNames.concat([Pattern.className]);

	public _display: IGraphics = this._root._renderer.makeGraphics();
	public _backgroundDisplay: IGraphics = this._root._renderer.makeGraphics();

	protected _clear = false;

	protected _pattern: IPattern | undefined | null;

	public get pattern(): IPattern | undefined | null {
		return this._pattern;
	}

	protected _draw(): void { }

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("repetition") || this.isDirty("width") || this.isDirty("height") || this.isDirty("rotation") || this.isDirty("strokeWidth") || this.isDirty("strokeDasharray") || this.isDirty("strokeDashoffset") || this.isDirty("colorOpacity") || this.isDirty("fillOpacity")) {
			this._clear = true;
		}

		this._checkDirtyFill();
	}

	protected _checkDirtyFill() {
		if (this.isDirty("color") || this.isDirty("fill")) {
			this._clear = true;
		}
	}

	public _changed() {
		super._changed();

		if (this._clear) {
			const repetition = this.get("repetition", "");
			const width = this.get("width", 100);
			const height = this.get("height", 100);
			const fill = this.get("fill");
			const fillOpacity = this.get("fillOpacity", 1);

			const backgroundDisplay = this._backgroundDisplay;
			const display = this._display;

			display.clear();
			backgroundDisplay.clear();

			if (fill && (fillOpacity > 0)) {
				backgroundDisplay.beginFill(fill, fillOpacity);
				backgroundDisplay.drawRect(0, 0, width, height);
				backgroundDisplay.endFill();
			}

			display.angle = this.get("rotation", 0);
			//display.pivot = { x: width / 2, y: height / 2 };
			this._draw();

			this._pattern = this._root._renderer.createPattern(display, backgroundDisplay, repetition, width, height);
		}

		this._clear = false;
	}
}
