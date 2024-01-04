import type { MapChart } from "./MapChart";

import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Button } from "../../core/render/Button";
import { Graphics } from "../../core/render/Graphics";
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
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Zoom_control} for more information
 * @important
 */
export class ZoomControl extends Container {

	/**
	 * A [[Button]] for home.
	 *
	 * Home button is disabled by default. To enable it set its `visible: true`.
	 *
	 * @see (@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Home_button) for more info
	 * @since 5.7.5
	 */
	public readonly homeButton: Button = this.children.push(Button.new(this._root, { width: 35, height: 35, themeTags: ["home"] }));

	/**
	 * A [[Button]] for zoom in.
	 */
	public readonly plusButton: Button = this.children.push(Button.new(this._root, { width: 35, height: 35, themeTags: ["plus"] }));

	/**
	 * A [[Button]] for zoom out.
	 */
	public readonly minusButton: Button = this.children.push(Button.new(this._root, { width: 35, height: 35, themeTags: ["minus"] }));

	declare public _settings: IZoomControlSettings;
	declare public _privateSettings: IZoomControlPrivate;

	public static className: string = "ZoomControl";
	public static classNames: Array<string> = Container.classNames.concat([ZoomControl.className]);

	protected _disposer: MultiDisposer | undefined;

	protected _afterNew() {
		super._afterNew();

		this.set("position", "absolute");

		this.set("layout", this._root.verticalLayout);
		this.set("themeTags", ["zoomcontrol"]);

		this.plusButton.setAll({
			icon: Graphics.new(this._root, { themeTags: ["icon"] }),
			layout: undefined
		});

		this.minusButton.setAll({
			icon: Graphics.new(this._root, { themeTags: ["icon"] }),
			layout: undefined
		});

		this.homeButton.setAll({
			icon: Graphics.new(this._root, { themeTags: ["icon"] }),
			layout: undefined
		});
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
					}),
					this.homeButton.events.on("click", () => {
						chart.goHome()
					})])
			}

			if (previous && this._disposer) {
				this._disposer.dispose();
			}
		}
	}
}
