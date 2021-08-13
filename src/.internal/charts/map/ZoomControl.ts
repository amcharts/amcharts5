import type { Root } from "../../core/Root";
import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Button } from "../../core/render/Button";
import type { Template } from "../../core/util/Template";
import { Graphics } from "../../core/render/Graphics";
import { p50, p100 } from "../../core/util/Percent";
import type { MapChart } from "./MapChart";
import { MultiDisposer } from "../../core/util/Disposer";

export interface IZoomControlSettings extends IContainerSettings {

}

export interface IZoomControlPrivate extends IContainerPrivate {

	/**
	 * @ignore
	 */
	chart?: MapChart;

}

/**
 * A control that displays button for zooming [[MapChart]] in and out.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/map-chart/map-pan-zoom/#Zoom_control} for more information
 * @important
 */
export class ZoomControl extends Container {

	/**
	 * A [[Button]] for zoom in.
	 */
	public readonly plusButton: Button = this.children.push(Button.new(this._root, { width: 36, height: 36 }));

	/**
	 * A [[Button]] for zoom out.
	 */
	public readonly minusButton: Button = this.children.push(Button.new(this._root, { width: 36, height: 36 }));

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: ZoomControl["_settings"], template?: Template<ZoomControl>): ZoomControl {
		const x = new ZoomControl(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IZoomControlSettings;
	declare public _privateSettings: IZoomControlPrivate;

	public static className: string = "ZoomControl";
	public static classNames: Array<string> = Container.classNames.concat([ZoomControl.className]);

	protected _disposer: MultiDisposer | undefined;

	protected _afterNew() {
		super._afterNew();

		this.set("position", "absolute");

		this.set("layout", this._root.verticalLayout);
		this.set("x", p100);
		this.set("centerX", p100);

		this.set("y", p100);
		this.set("centerY", p100);

		this.set("paddingRight", 10);
		this.set("paddingBottom", 10);

		const l = 4;

		const plusButton = this.plusButton;
		const plusIcon = plusButton.set("icon", Graphics.new(this._root, {
			themeTags: ["icon"],
			x: p50,
			y: p50
		}));
		plusIcon.set("draw", (display) => {
			display.moveTo(-l, 0);
			display.lineTo(l, 0);
			display.moveTo(0, -l);
			display.lineTo(0, l);
		})
		plusButton.set("layout", undefined);

		const minusButton = this.minusButton;
		const minusIcon = minusButton.set("icon", Graphics.new(this._root, {
			themeTags: ["icon"],
			x: p50,
			y: p50
		}));
		minusIcon.set("draw", (display) => {
			display.moveTo(-l, 0);
			display.lineTo(l, 0);
		})
		minusButton.set("layout", undefined);
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isPrivateDirty("chart")) {
			const chart = this.getPrivate("chart");
			const previous = this._prevPrivateSettings.chart;
			if (chart) {
				this._disposer = new MultiDisposer([
					this.plusButton.events.on("click", () => {
						chart.zoomIn()
					}),
					this.minusButton.events.on("click", () => {
						chart.zoomOut()
					})])
			}

			if (previous && this._disposer) {
				this._disposer.dispose();
			}
		}
	}
}
