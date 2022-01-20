import { Scrollbar, IScrollbarPrivate, IScrollbarSettings, IScrollbarEvents } from "./Scrollbar";

export interface ISliderSettings extends IScrollbarSettings {
}

export interface ISliderPrivate extends IScrollbarPrivate {
}

export interface ISliderEvents extends IScrollbarEvents {
}

/**
 * A control that allows zooming chart's axes, or other uses requiring range
 * selection.
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
	}
}
