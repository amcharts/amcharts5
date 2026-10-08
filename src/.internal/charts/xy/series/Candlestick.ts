import { RoundedRectangle, IRoundedRectangleSettings, IRoundedRectanglePrivate } from "../../../core/render/RoundedRectangle";


export interface ICandlestickSettings extends IRoundedRectangleSettings {

	/**
	 * X where the low wick starts, at the body, in pixels relative to the
	 * candle. Set by the series.
	 */
	lowX0?: number;

	/**
	 * Y where the low wick starts, at the body, in pixels relative to the
	 * candle. Set by the series.
	 */
	lowY0?: number;

	/**
	 * X where the low wick ends, at the low value, in pixels relative to the
	 * candle. Set by the series.
	 */
	lowX1?: number;

	/**
	 * Y where the low wick ends, at the low value, in pixels relative to the
	 * candle. Set by the series.
	 */
	lowY1?: number;

	/**
	 * X where the high wick starts, at the body, in pixels relative to the
	 * candle. Set by the series.
	 */
	highX0?: number;

	/**
	 * Y where the high wick starts, at the body, in pixels relative to the
	 * candle. Set by the series.
	 */
	highY0?: number;

	/**
	 * X where the high wick ends, at the high value, in pixels relative to the
	 * candle. Set by the series.
	 */
	highX1?: number;

	/**
	 * Y where the high wick ends, at the high value, in pixels relative to the
	 * candle. Set by the series.
	 */
	highY1?: number;

	/**
	 * Which way the candle runs: `"vertical"` when the values are on the Y
	 * axis, `"horizontal"` when they are on the X axis. Set by the series.
	 */
	orientation?: "horizontal" | "vertical"

}

export interface ICandlestickPrivate extends IRoundedRectanglePrivate {
}

/**
 * A candle of a [[CandlestickSeries]]: a body from the open to the close
 * value, with wicks out to the low and high values.
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
