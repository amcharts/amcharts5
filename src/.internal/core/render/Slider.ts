import type { Root } from "../Root";
import { Scrollbar, IScrollbarPrivate, IScrollbarSettings, IScrollbarEvents } from "./Scrollbar";
import type { Template } from "../../core/util/Template";

export interface ISliderSettings extends IScrollbarSettings {
}

export interface ISliderPrivate extends IScrollbarPrivate {
}

export interface ISliderEvents extends IScrollbarEvents {
}

/**
 * A control that allows zooming chart's axes, or other uses requiring range
 * selection.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/Sliders/} for more info
 */
export class Slider extends Scrollbar {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Slider["_settings"], template?: Template<Slider>): Slider {
		this._addOrientationClass(root, settings);
		const x = new Slider(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: ISliderSettings;
	declare public _privateSettings: ISliderPrivate;
	declare public _events: ISliderEvents;

	public static className: string = "Slider";
	public static classNames: Array<string> = Scrollbar.classNames.concat([Slider.className]);


	protected _afterNew() {
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
	}
}
