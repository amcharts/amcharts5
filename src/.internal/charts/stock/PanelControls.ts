import type { StockChart } from "./StockChart";
import type { StockPanel } from "./StockPanel";

import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";
import { Button } from "../../core/render/Button";
import { Graphics } from "../../core/render/Graphics";

export interface IPanelControlsSettings extends IContainerSettings {

	/**
	 * A target [[StockChart]].
	 */
	stockChart: StockChart;

	/**
	 * A target [[StockPanel]].
	 */
	stockPanel: StockPanel

}

export interface IPanelControlsPrivate extends IContainerPrivate {

}

/**
 * Creates a button set for [[StockChart]] panels (move up/down, close, etc.)
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/panels/#Panel_controls} for more info
 */
export class PanelControls extends Container {

	declare public _settings: IPanelControlsSettings;
	declare public _privateSettings: IPanelControlsPrivate;

	public static className: string = "PanelControls";
	public static classNames: Array<string> = Container.classNames.concat([PanelControls.className]);

	/**
	 * A [[Button]] which moves panel up.
	 *
	 * @default Button.new()
	 */
	public upButton = this.children.push(Button.new(this._root, {
		themeTags: ["up", "control", "panel"],
		icon: Graphics.new(this._root, {
			themeTags: ["icon", "button"]
		})
	}))

	/**
	 * A [[Button]] which moves panel down.
	 *
	 * @default Button.new()
	 */
	public downButton = this.children.push(Button.new(this._root, {
		themeTags: ["down", "control", "panel"],
		icon: Graphics.new(this._root, {
			themeTags: ["icon", "button"]
		})
	}))

	/**
	 * A [[Button]] which expands/collapses the panel.
	 *
	 * @default Button.new()
	 */
	public expandButton = this.children.push(Button.new(this._root, {
		themeTags: ["expand", "control", "panel"],
		icon: Graphics.new(this._root, {
			themeTags: ["icon", "button"]
		})
	}))

	/**
	 * A [[Button]] which closes the panel.
	 *
	 * @default Button.new()
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
