import { RoundedRectangle, IRoundedRectangleSettings, IRoundedRectanglePrivate } from "../../../core/render/RoundedRectangle";


export interface ICandlestickSettings extends IRoundedRectangleSettings {

	/**
	 * X0 position of the low value in pixels.
	 */
	lowX0?: number;

	/**
	 * Y0 position of the low value in pixels.
	 */
	lowY0?: number;

	/**
	 * X2 position of the low value in pixels.
	 */
	lowX1?: number;

	/**
	 * Y1 position of the low value in pixels.
	 */
	lowY1?: number;

	/**
	 * X0 position of the high value in pixels.
	 */
	highX0?: number;

	/**
	 * Y0 position of the high value in pixels.
	 */
	highY0?: number;

	/**
	 * Xz position of the high value in pixels.
	 */
	highX1?: number;

	/**
	 * Y1 position of the high value in pixels.
	 */
	highY1?: number;

	/**
	 * Orientation of the cnadlestick.
	 */
	orientation?: "horizontal" | "vertical"

}

export interface ICandlestickPrivate extends IRoundedRectanglePrivate {
}

/**
 * A candle element used in a [[CandlestickSeries]].
 */
export class Candlestick extends RoundedRectangle {

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
