import type { Root } from "../../../core/Root";
import type { Template } from "../../../core/util/Template";

import { RoundedRectangle, IRoundedRectangleSettings, IRoundedRectanglePrivate } from "../../../core/render/RoundedRectangle";


export interface ICandlestickSettings extends IRoundedRectangleSettings {
	lowX0?: number;
	lowY0?: number;
	lowX1?: number;
	lowY1?: number;

	highX0?: number;
	highY0?: number;
	highX1?: number;
	highY1?: number;

	orientation?: "horizontal" | "vertical"
}

export interface ICandlestickPrivate extends IRoundedRectanglePrivate {
}

/**
 * A candle element used in a [[CandlestickSeries]].
 */
export class Candlestick extends RoundedRectangle {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Candlestick["_settings"], template?: Template<Candlestick>): Candlestick {
		const x = new Candlestick(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: ICandlestickSettings;
	declare public _privateSettings: ICandlestickPrivate;

	public static className: string = "Candlestick";
	public static classNames: Array<string> = RoundedRectangle.classNames.concat([Candlestick.className]);

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("lowX0") || this.isDirty("lowY0") || this.isDirty("lowX1") || this.isDirty("lowY1") || this.isDirty("highX0") || this.isDirty("highX1") || this.isDirty("highY0") || this.isDirty("highY1")) {
			this._clear = true;
		}
	}

	public _draw() {
		super._draw();

		const display = this._display;

		display.moveTo(this.get("lowX0", 0), this.get("lowY0", 0));
		display.lineTo(this.get("lowX1", 0), this.get("lowY1", 0));

		display.moveTo(this.get("highX0", 0), this.get("highY0", 0));
		display.lineTo(this.get("highX1", 0), this.get("highY1", 0));
	}
}
