import { Candlestick, ICandlestickSettings, ICandlestickPrivate } from "./Candlestick";


export interface IOHLCSettings extends ICandlestickSettings {
}

export interface IOHLCPrivate extends ICandlestickPrivate {
}

export class OHLC extends Candlestick {

	declare public _settings: IOHLCSettings;
	declare public _privateSettings: IOHLCPrivate;

	public static className: string = "OHLC";
	public static classNames: Array<string> = Candlestick.classNames.concat([OHLC.className]);

	public _draw() {

		const display = this._display;

		display.moveTo(this.get("lowX1", 0), this.get("lowY1", 0));
		display.lineTo(this.get("highX1", 0), this.get("highY1", 0));

		let w = this.width();
		let h = this.height();

		if (this.get("orientation") == "vertical") {

			let lY = h;
			let hY = 0;
			display.moveTo(0, lY);
			display.lineTo(w / 2, lY);

			display.moveTo(w / 2, hY);
			display.lineTo(w, hY);
		}
		else {
			let lX = 0;
			let hX = w;

			display.moveTo(lX, 0);
			display.lineTo(lX, h / 2);

			display.moveTo(hX, h / 2);
			display.lineTo(hX, h);
		}
	}
}
