import type { Root } from "../../Root";
import type { Template } from "../../util/Template";

import { Pattern, IPatternSettings, IPatternPrivate } from "./Pattern";

export interface ILinePatternSettings extends IPatternSettings {

	/**
	 * Gap between  lines, in pixels.
	 *
	 * @default 6
	 */
	gap?: number;

}

export interface ILinePatternPrivate extends IPatternPrivate {
}

/**
 * Line pattern.
 * 
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
 */
export class LinePattern extends Pattern {
	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: LinePattern["_settings"], template?: Template<LinePattern>): LinePattern {
		const x = new LinePattern(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: ILinePatternSettings;
	declare public _privateSettings: ILinePatternPrivate;

	public static className: string = "LinePattern";
	public static classNames: Array<string> = Pattern.classNames.concat([LinePattern.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("gap")) {
			this._clear = true;
		}
	}

	protected _draw() {
		super._draw();

		const w = this.get("width");
		const h = this.get("height");
		const gap = this.get("gap", 0);
		const strokeWidth = this.get("strokeWidth", 1);

		if (!gap) {
			this._display.moveTo(0, 0);
			this._display.lineTo(w, 0);
		}
		else {
			let step = gap + strokeWidth;
			let count = h / step;

			for (let i = -count; i < count * 2; i++) {
				const y = Math.round(i * step - step / 2) + 0.5;
				this._display.moveTo(-w, y);
				this._display.lineTo(w * 2, y);
			}
		}

		this._display.lineStyle(strokeWidth, this.get("color"), this.get("colorOpacity"));
		this._display.endStroke();
	}
}
