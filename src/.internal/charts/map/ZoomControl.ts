import type { MapChart } from "./MapChart";

import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Button } from "../../core/render/Button";
import { Graphics } from "../../core/render/Graphics";
import { p100 } from "../../core/util/Percent";
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
	 * A [[Button]] for zoom in.
	 *
	 * @default Button.new()
	 */
	public readonly plusButton: Button = this.children.push(Button.new(this._root, { width: 36, height: 36, themeTags: ["plus"] }));

	/**
	 * A [[Button]] for zoom out.
	 *
	 * @default Button.new()
	 */
	public readonly minusButton: Button = this.children.push(Button.new(this._root, { width: 36, height: 36, themeTags: ["minus"] }));

	declare public _settings: IZoomControlSettings;
	declare public _privateSettings: IZoomControlPrivate;

	public static className: string = "ZoomControl";
	public static classNames: Array<string> = Container.classNames.concat([ZoomControl.className]);

	protected _disposer: MultiDisposer | undefined;

	protected _afterNew() {
		super._afterNew();

		this._setSoft("position", "absolute");

		this._setSoft("layout", this._root.verticalLayout);
		this._setSoft("x", p100);
		this._setSoft("centerX", p100);

		this._setSoft("y", p100);
		this._setSoft("centerY", p100);

		this._setSoft("paddingRight", 10);
		this._setSoft("paddingBottom", 10);

		this.plusButton.setAll({
			icon: Graphics.new(this._root, { themeTags: ["icon"] }),
			layout: undefined
		});

		this.minusButton.setAll({
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
					})])
			}

			if (previous && this._disposer) {
				this._disposer.dispose();
			}
		}
	}
}
