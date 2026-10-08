import type { StockChart } from "./StockChart";
import type { StockPanel } from "./StockPanel";

import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Button } from "../../core/render/Button";
import { Graphics } from "../../core/render/Graphics";

export interface IPanelControlsSettings extends IContainerSettings {

	/**
	 * The [[StockChart]] the panel belongs to.
	 */
	stockChart: StockChart;

	/**
	 * The [[StockPanel]] the buttons act on.
	 */
	stockPanel: StockPanel

}

export interface IPanelControlsPrivate extends IContainerPrivate {

}

/**
 * Buttons on a [[StockChart]] panel that move it up or down, expand it and
 * close it.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/panels/#Panel_controls} for more info
 */
export class PanelControls extends Container {

	declare public _settings: IPanelControlsSettings;
	declare public _privateSettings: IPanelControlsPrivate;

	public static className: string = "PanelControls";
	public static classNames: Array<string> = Container.classNames.concat([PanelControls.className]);

	/**
	 * The [[Button]] that moves the panel one place up.
	 */
	public upButton = this.children.push(Button.new(this._root, {
		themeTags: ["up", "control", "panel"],
		icon: Graphics.new(this._root, {
			themeTags: ["icon", "button"]
		})
	}))

	/**
	 * The [[Button]] that moves the panel one place down.
	 */
	public downButton = this.children.push(Button.new(this._root, {
		themeTags: ["down", "control", "panel"],
		icon: Graphics.new(this._root, {
			themeTags: ["icon", "button"]
		})
	}))

	/**
	 * The [[Button]] that expands the panel to fill the chart, or shows the
	 * other panels again.
	 */
	public expandButton = this.children.push(Button.new(this._root, {
		themeTags: ["expand", "control", "panel"],
		icon: Graphics.new(this._root, {
			themeTags: ["icon", "button"]
		})
	}))

	/**
	 * The [[Button]] that closes the panel.
	 */
	public closeButton = this.children.push(Button.new(this._root, {
		themeTags: ["close", "control", "panel"],
		icon: Graphics.new(this._root, {
			themeTags: ["icon", "button"]
		})
	}))

	protected _afterNew() {
		super._afterNew();


		const upButton = this.upButton;
		const downButton = this.downButton;

		downButton.events.on("click", () => {
			const stockPanel = this.get("stockPanel");
			stockPanel.moveDown();
		});

		upButton.events.on("click", () => {
			const stockPanel = this.get("stockPanel");
			stockPanel.moveUp();
		});

		this.closeButton.events.on("click", () => {
			const stockPanel = this.get("stockPanel");
			stockPanel.close();
		});

		this.expandButton.events.on("click", () => {
			const stockPanel = this.get("stockPanel");
			stockPanel.expand();
		});

	}
}
