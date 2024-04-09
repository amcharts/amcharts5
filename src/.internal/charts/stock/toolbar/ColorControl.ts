import type { ColorSet } from "../../../core/util/ColorSet";
import type { Color } from "../../../core/util/Color";

import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { DropdownColors } from "./DropdownColors";
import { StockIcons } from "./StockIcons";

import * as $utils from "../../../core/util/Utils";
import StockToolbarCSS from "./StockToolbarCSS";

export interface IColorControlSettings extends IStockControlSettings {
	colors?: ColorSet;
	useOpacity?: boolean;
}

export interface IColorControlPrivate extends IStockControlPrivate {
	dropdown?: DropdownColors;
	color?: Color;
	opacity?: number;
}

export interface IColorControlEvents extends IStockControlEvents {
	selected: {
		color: Color
	}
	selectedOpacity: {
		opacity: number
	}
}

/**
 * Color picker control.
 */
export class ColorControl extends StockControl {
	public static className: string = "ColorControl";
	public static classNames: Array<string> = StockControl.classNames.concat([ColorControl.className]);

	declare public _settings: IColorControlSettings;
	declare public _privateSettings: IColorControlPrivate;
	declare public _events: IColorControlEvents;

	protected _afterNew() {

		// Do parent stuff
		super._afterNew();

		// Control
		const button = this.getPrivate("button")!;
		button.className = button.className + " am5stock-control-color";

		// Create list of tools
		const dropdownSettings: any = {
			control: this,
			parent: this.getPrivate("button"),
			useOpacity: this.get("useOpacity")
		}
		if (this.get("colors")) {
			dropdownSettings.colors = this.get("colors");
		}
		const dropdown = DropdownColors.new(this._root, dropdownSettings);
		this.setPrivate("dropdown", dropdown);

		dropdown.events.on("closed", (_ev) => {
			this.set("active", false);
		});

		dropdown.events.on("invoked", (ev) => {
			this.setPrivate("color", ev.color);
			this.events.dispatch("selected", {
				type: "selected",
				color: ev.color,
				target: this
			});
		});

		dropdown.events.on("invokedOpacity", (ev) => {
			this.setPrivate("opacity", ev.opacity);
			this.events.dispatch("selectedOpacity", {
				type: "selectedOpacity",
				opacity: ev.opacity,
				target: this
			});
		});

		this.on("active", (active) => {
			if (active) {
				dropdown.setPrivate("color", this.getPrivate("color"));
				dropdown.setPrivate("opacity", this.getPrivate("opacity"));
				this.setTimeout(() => dropdown.show(), 10);
			}
			else {
				dropdown.hide();
			}
		});

		this.onPrivate("color", () => {
			const color = this.getPrivate("color");
			this.getPrivate("icon")!.style.backgroundColor = color ? color.toCSS(this.getPrivate("opacity", 1)) : "";
		});

		this.onPrivate("opacity", () => {
			const color = this.getPrivate("color");
			this.getPrivate("icon")!.style.backgroundColor = color ? color.toCSS(this.getPrivate("opacity", 1)) : "";
		});

		// Add checkered background for showing opacity
		const bg = document.createElement("div");
		bg.className = "am5stock-control-icon-color-bg";
		this.getPrivate("icon")!.appendChild(bg);

		this.loadDefaultCSS();

	}

	/**
	 * Sets color.
	 * 
	 * @param  color  Color
	 * @since 5.9.0
	 */
	public setColor(color: Color) {
		this.setPrivate("color", color);
		this.events.dispatch("selected", {
			type: "selected",
			color: color,
			target: this
		});
	}

	/**
	 * Sets opacity.
	 * 
	 * @param  opacity  Opacity
	 * @since 5.9.0
	 */
	public setOpacity(opacity: number) {
		this.setPrivate("opacity", opacity);
		this.events.dispatch("selectedOpacity", {
			type: "selectedOpacity",
			opacity: opacity,
			target: this
		});
	}

	protected _getDefaultIcon(): SVGElement {
		const icon = StockIcons.getIcon("Color");
		$utils.addClass(icon, "am5stock-control-icon-color");
		return icon;
	}

	/**
	 * Loads the default CSS.
	 *
	 * @ignore Exclude from docs
	 */
	public loadDefaultCSS(): void {
		const disposer = StockToolbarCSS($utils.getShadowRoot(this._root.dom), this._root);
		this._disposers.push(disposer);
	}

	public hide(): void {
		super.hide();
	}

	protected _maybeMakeAccessible(): void {
		super._maybeMakeAccessible();
		if (this.isAccessible()) {
			const button = this.getPrivate("button")!;
			button.setAttribute("aria-label", button.getAttribute("title") + "; " + this._t("Press ENTER or use arrow keys to navigate"));

			if ($utils.supports("keyboardevents")) {
				this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
					if (document.activeElement == button) {
						if (ev.keyCode == 38 || ev.keyCode == 40) {
							// Open on arrows
							if (!this.get("active")) {
								this._handleClick();
							}
						}
					}
				}));
			}
		}
	}

}