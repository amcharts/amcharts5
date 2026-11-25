import { Scrollbar, IScrollbarPrivate, IScrollbarSettings, IScrollbarEvents } from "./Scrollbar";

export interface ISliderSettings extends IScrollbarSettings {
}

export interface ISliderPrivate extends IScrollbarPrivate {
}

export interface ISliderEvents extends IScrollbarEvents {
}

/**
 * A slider with a single grip, for picking one value from `0` to `1`, which
 * it keeps in `start`.
 */
export class Slider extends Scrollbar {

	declare public _settings: ISliderSettings;
	declare public _privateSettings: ISliderPrivate;
	declare public _events: ISliderEvents;

	public static className: string = "Slider";
	public static classNames: Array<string> = Scrollbar.classNames.concat([Slider.className]);


	protected _afterNew() {
		this._addOrientationClass();
		super._afterNew();

		this.endGrip.setPrivate("visible", false);
		this.thumb.setPrivate("visible", false);
	}

	/**
	 * @ignore
	 */
	public updateGrips() {
		super.updateGrips();
		const startGrip = this.startGrip;
		this.endGrip.setAll({ x: startGrip.x(), y: startGrip.y() });
		this.setRaw("end", this.get("start"));

		// One grip: it reads its value, not the start of a range
		const readout = this._readout();
		const text = readout.reversed ? readout.toText : readout.fromText;
		const label = this.get("ariaLabel");
		if (label) {
			// the slider's name, and the value
			this._setAria(startGrip, "ariaLabel", label);
			this._setAria(startGrip, "ariaValueText", text);
		}
		else {
			this._setAria(startGrip, "ariaLabel", text);
		}
	}
}
