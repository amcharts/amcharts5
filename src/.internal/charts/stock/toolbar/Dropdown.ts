import type { StockControl } from "./StockControl";
import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../../core/util/Entity"
//import type { IDisposer } from "../../../core/util/Disposer";

import * as $utils from "../../../core/util/Utils"


export interface IDropdownSettings extends IEntitySettings {
	control: StockControl;
	parent?: HTMLElement;
	scrollable?: boolean;
}

export interface IDropdownPrivate extends IEntityPrivate {
	container?: HTMLDivElement;
	arrow?: HTMLDivElement;
}

export interface IDropdownEvents extends IEntityEvents {
	opened: {};
	closed: {};
}

/**
 * A dropdown control for [[StockToolbar]].
 */
export class Dropdown extends Entity {
	public static className: string = "Dropdown";
	public static classNames: Array<string> = Entity.classNames.concat([Dropdown.className]);

	declare public _settings: IDropdownSettings;
	declare public _privateSettings: IDropdownPrivate;
	declare public _events: IDropdownEvents;

	// private _itemDisposers: Array<IDisposer> = [];

	protected _afterNew() {
		super._afterNew();

		// Inherit default themes from chart
		this._defaultThemes = this.get("control")._defaultThemes;
		super._afterNewApplyThemes();

		this._initElements();
		this._root.addDisposer(this);

		// Close on ESC
		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
				if (this.isOpen() && ev.keyCode == 27) {
					this.hide();
				}
			}));
		}

		this._disposers.push($utils.addEventListener(this.getPrivate("container")!, "click", (ev: PointerEvent) => {
			if (this.isOpen()) {
				ev.preventDefault();
			}
		}));

		this._disposers.push($utils.addEventListener(document, "click", () => {
			if (this.isOpen()) {
				this.hide();
			}
		}));
	}

	protected _initElements(): void {
		// Create container
		const container = document.createElement("div");
		container.className = "am5stock-control-list-container";
		this._disposers.push($utils.addEventListener(container, "click", (ev) => {
			ev.stopPropagation();
		}));

		this.setPrivate("container", container);

		const arrow = document.createElement("div");
		arrow.className = "am5stock-control-list-arrow";
		container.appendChild(arrow);
		this.setPrivate("arrow", arrow);

		const parent = this.get("parent");
		if (parent) {
			parent.appendChild(container);
		}

		if (this.get("scrollable")) {
			this._sizeItems();
			this.root.container.onPrivate("height", () => {
				this._sizeItems();
			});
		}

		this.hide();
	}

	protected _sizeItems(): void {
		const container = this.getPrivate("container")!;
		container.style.maxHeight = (this.root.container.height() - 100) + "px";
		container.style.overflow = "auto";
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("parent")) {
			const parent = this.get("parent");
			const container = this.getPrivate("container");
			if (parent && container) {
				parent.appendChild(container);
			}
		}
	}

	protected _dispose(): void {
		super._dispose();
	}

	/**
	 * Returns `true` if dropdown is currently open.
	 * 
	 * @return  Dropdown open?
	 */
	public isOpen(): boolean {
		return this.getPrivate("container")!.style.display != "none";
	}

	public hide(): void {
		const arrow = this.getPrivate("arrow")!;
		const container = this.getPrivate("container")!;
		container.style.display = "none";
		this.events.dispatch("closed", {
			type: "closed",
			target: this
		});

		container.style.marginLeft = "";
		arrow.style.marginLeft = "";
	}

	public show(): void {
		const arrow = this.getPrivate("arrow")!;
		const container = this.getPrivate("container")!;
		container.style.display = "";

		let offset = 0;
		const toolbar = this.get("control").getPrivate("toolbar");
		if (toolbar) {
			const toolbarContainer = this.get("control").getPrivate("toolbar").get("container");
			offset = Math.round(toolbarContainer.getBoundingClientRect().right - container.getBoundingClientRect().right);
		}

		if (offset < 0) {
			container.style.marginLeft = offset + "px";
			arrow.style.marginLeft = Math.abs(offset) + "px";
		}
		else {
			container.style.marginLeft = "";
			arrow.style.marginLeft = "";
		}

		this.events.dispatch("opened", {
			type: "opened",
			target: this
		});
	}

	public toggle(): void {
		const container = this.getPrivate("container")!;
		if (container.style.display == "none") {
			this.show();
		}
		else {
			this.hide();
		}
	}

	protected _maybeMakeAccessible() {
		if (this.isAccessible()) {
		}
	}

	public isAccessible(): boolean {
		const toolbar = this.get("control").getPrivate("toolbar");
		return toolbar && toolbar.get("focusable") ? true : false;
	}

}