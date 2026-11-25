import { Color, color } from "../../../core/util/Color";

import { ColorSet } from "../../../core/util/ColorSet";
import { Dropdown, IDropdownSettings, IDropdownPrivate, IDropdownEvents } from "./Dropdown"

import * as $array from "../../../core/util/Array";
import * as $utils from "../../../core/util/Utils";

export interface IDropdownColorsSettings extends IDropdownSettings {
	/**
	 * Colors to pick from.
	 */
	colors?: ColorSet;
	/**
	 * Adds opacity choices, from `100%` to `0%`, below the colors.
	 */
	useOpacity?: boolean;
}


export interface IDropdownColorsPrivate extends IDropdownPrivate {
	list?: HTMLUListElement;
	color?: Color;
	opacity?: number;
}

export interface IDropdownColorsEvents extends IDropdownEvents {
	/**
	 * A color was clicked.
	 */
	invoked: {
		color: Color;
	};

	/**
	 * An opacity was clicked.
	 */
	invokedOpacity: {
		opacity: number;
	};
}

/**
 * The dropdown of a [[ColorControl]]. Not meant to be used on its own.
 */
export class DropdownColors extends Dropdown {
	public static className: string = "DropdownColors";
	public static classNames: Array<string> = Dropdown.classNames.concat([DropdownColors.className]);

	declare public _settings: IDropdownColorsSettings;
	declare public _privateSettings: IDropdownColorsPrivate;
	declare public _events: IDropdownColorsEvents;

	// private _itemDisposers: Array<IDisposer> = [];

	protected _afterNew() {
		super._afterNew();
		this._root.addDisposer(this);
	}

	protected _initElements(): void {
		super._initElements();

		// Create container
		const container = this.getPrivate("container")!;

		// Create list
		const list = document.createElement("ul");
		list.className = "am5stock-control-colors";
		container.appendChild(list);
		this.setPrivate("list", list);

		this._initItems();
	}

	protected _initItems(): void {
		const list = this.getPrivate("list")!;
		const focused = document.activeElement && $utils.contains(list, document.activeElement);
		list.innerHTML = "";

		let cs = this.get("colors");
		if (!cs) {
			cs = ColorSet.new(this._root, {});
		}
		const colors = cs.get("colors", []);
		$array.each(colors, (item) => {
			this.addItem(item);
		});
		this._initOpacity();
		this._maybeMakeAccessible();
		if (focused) {
			this._focusFirst();
		}
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("colors") || this.isDirty("useOpacity") || this.isPrivateDirty("color") || this.isPrivateDirty("opacity")) {
			this._initItems();
		}

		if (this.isDirty("control")) {
			this._maybeMakeAccessible();
		}

	}

	protected _dispose(): void {
		super._dispose();
	}

	/**
	 * Adds a color to the end of the list as shown.
	 *
	 * @param  color  Color
	 */
	public addItem(color: Color): void {
		const currentColor = this.getPrivate("color") ? this.getPrivate("color")!.hex : 0;
		const list = this.getPrivate("list")!;
		const item = document.createElement("li");
		item.className = "am5stock-control-color";
		item.setAttribute("role", "menuitemradio");
		item.setAttribute("aria-checked", currentColor == color.hex ? "true" : "false");
		item.setAttribute("aria-label", this.root.language.translateAny("Selection") + " #" + (list.getElementsByClassName("am5stock-control-color").length + 1));
		if (currentColor == color.hex) {
			item.className += " am5stock-control-active";
		}
		item.style.background = color.toCSS();
		list.appendChild(item);

		// Add click event
		this._disposers.push($utils.addEventListener(item, "click", (_ev) => {
			this.hide();
			this.events.dispatch("invoked", {
				type: "invoked",
				color: color,
				target: this
			});
		}));
	}

	protected _initOpacity(): void {
		if (this.get("useOpacity")) {
			const currentOpacity = this.getPrivate("opacity", 1);
			const list = this.getPrivate("list")!;
			const hr = document.createElement("hr");
			hr.setAttribute("role", "separator");
			list.appendChild(hr);

			for (let opacity = 100; opacity >= 0; opacity -= 25) {
				const fill = color(0x000000);
				const item = document.createElement("li");
				item.innerHTML = opacity + "%";
				item.className = "am5stock-control-opacity am5stock-control-opacity-" + opacity;
				item.setAttribute("role", "menuitemradio");
				item.setAttribute("aria-checked", currentOpacity * 100 == opacity ? "true" : "false");
				if (currentOpacity * 100 == opacity) {
					item.className += " am5stock-control-active";
				}
				item.style.background = fill.toCSS(opacity / 100);
				list.appendChild(item);

				// Add click event
				this._disposers.push($utils.addEventListener(item, "click", (_ev) => {
					this.hide();
					this.events.dispatch("invokedOpacity", {
						type: "invokedOpacity",
						opacity: opacity / 100,
						target: this
					});
				}));
			}
		}
	}

	/**
	 * @ignore
	 */
	public _ariaRole(): "menu" | "dialog" {
		return "menu";
	}

	/**
	 * @ignore
	 */
	public _ariaElement(): HTMLElement | undefined {
		return this.getPrivate("list");
	}

	protected _getNavItems(): HTMLElement[] {
		const items: HTMLElement[] = [];
		this._getActiveItems().forEach((item) => {
			items.push(item as HTMLElement);
		});
		return items;
	}

	/**
	 * @ignore
	 */
	public _focusFirst(): void {
		const items = this._getNavItems();
		let first = items[0];
		$array.each(items, (item) => {
			if (item.getAttribute("aria-checked") == "true" && item.className.indexOf("am5stock-control-color") != -1) {
				first = item;
			}
		});
		if (first) {
			$utils.focus(first);
		}
	}

	/**
	 * @ignore
	 */
	public _maybeMakeAccessible(): void {
		super._maybeMakeAccessible();
		if (this.isAccessible() && this.getPrivate("list")) {
			this._getActiveItems().forEach((item) => {
				(item as HTMLElement).setAttribute("tabindex", "-1");
			});
		}
	}

	protected _getActiveItems(): NodeList {
		return this.getPrivate("list")!.querySelectorAll(".am5stock-control-color, .am5stock-control-opacity");
	}

}