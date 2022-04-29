import { Color, color } from "../../../core/util/Color";

import { ColorSet } from "../../../core/util/ColorSet";
import { Dropdown, IDropdownSettings, IDropdownPrivate, IDropdownEvents } from "./Dropdown"

import * as $array from "../../../core/util/Array";
import * as $utils from "../../../core/util/Utils";

export interface IDropdownColorsSettings extends IDropdownSettings {
	colors?: ColorSet;
	useOpacity?: boolean;
}


export interface IDropdownColorsPrivate extends IDropdownPrivate {
	list?: HTMLUListElement;
	color?: Color;
	opacity?: number;
}

export interface IDropdownColorsEvents extends IDropdownEvents {
	invoked: {
		color: Color;
	};

	invokedOpacity: {
		opacity: number;
	};
}

/**
 * @todo review
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
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("colors") || this.isDirty("useOpacity") || this.isPrivateDirty("color") || this.isPrivateDirty("opacity")) {
			this._initItems();
		}

	}

	protected _dispose(): void {
		super._dispose();
	}

	public addItem(color: Color): void {
		const currentColor = this.getPrivate("color") ? this.getPrivate("color")!.hex : 0;
		const list = this.getPrivate("list")!;
		const item = document.createElement("li");
		item.className = "am5stock-control-color";
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
			list.appendChild(hr);

			for (let opacity = 100; opacity >= 0; opacity -= 25) {
				const fill = color(0x000000);
				const item = document.createElement("li");
				item.innerHTML = opacity + "%";
				item.className = "am5stock-control-opacity am5stock-control-opacity-" + opacity;
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

}