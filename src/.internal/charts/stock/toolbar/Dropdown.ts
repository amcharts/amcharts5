import type { StockControl } from "./StockControl";
import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../../core/util/Entity"
//import type { IDisposer } from "../../../core/util/Disposer";

import * as $utils from "../../../core/util/Utils"


export interface IDropdownSettings extends IEntitySettings {
	/**
	 * The control the dropdown belongs to.
	 */
	control: StockControl;
	/**
	 * Element the dropdown is placed in.
	 */
	parent?: HTMLElement;
	/**
	 * Limits the dropdown's height to the chart's height minus 100 pixels,
	 * scrolling the rest.
	 */
	scrollable?: boolean;
}

export interface IDropdownPrivate extends IEntityPrivate {
	container?: HTMLDivElement;
	arrow?: HTMLDivElement;
}

export interface IDropdownEvents extends IEntityEvents {
	/**
	 * The dropdown was opened.
	 */
	opened: {};
	/**
	 * The dropdown was closed.
	 */
	closed: {};
}

/**
 * Base class for the dropdowns of [[StockToolbar]] controls.
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

		const container = this.getPrivate("container")!;

		if ($utils.supports("keyboardevents")) {
			// Close on ESC
			this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
				if (this.isOpen() && ev.keyCode == 27) {
					this.hide();
				}
			}));

			// Arrow keys between the items
			this._disposers.push($utils.addEventListener(container, "keydown", (ev: KeyboardEvent) => {
				if (this.isAccessible()) {
					this._handleKey(ev);
				}
			}));

			// Tabbing out of the dropdown closes it
			this._disposers.push($utils.addEventListener(container, "focusout", (ev: FocusEvent) => {
				const to = ev.relatedTarget as Element | null;
				const button = this.get("control").getPrivate("button");
				if (to && this.isOpen() && button && !$utils.contains(button, to) && !$utils.contains(container, to)) {
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

		this._maybeMakeAccessible();
		this.get("control")._setDropdown(this);
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
	 * Returns `true` while the dropdown is open.
	 *
	 * @return  Dropdown open?
	 */
	public isOpen(): boolean {
		return this.getPrivate("container")!.style.display != "none";
	}

	/**
	 * Closes the dropdown.
	 */
	public hide(): void {
		const arrow = this.getPrivate("arrow")!;
		const container = this.getPrivate("container")!;
		const focused = document.activeElement && $utils.contains(container, document.activeElement);
		container.style.display = "none";
		this.events.dispatch("closed", {
			type: "closed",
			target: this
		});

		container.style.marginLeft = "";
		arrow.style.marginLeft = "";

		// focus does not drop to the page when its element is hidden
		if (focused) {
			this.get("control")._focus();
		}
	}

	/**
	 * Opens the dropdown.
	 */
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

		// opened from its button: focus moves in
		const button = this.get("control").getPrivate("button");
		if (button && document.activeElement && $utils.contains(button, document.activeElement) && !$utils.contains(container, document.activeElement) && this.isAccessible()) {
			this._focusFirst();
		}
	}

	/**
	 * Opens the dropdown, or closes it if it is open.
	 */
	public toggle(): void {
		const container = this.getPrivate("container")!;
		if (container.style.display == "none") {
			this.show();
		}
		else {
			this.hide();
		}
	}

	/**
	 * @ignore
	 */
	public _maybeMakeAccessible(): void {
		const element = this._ariaElement();
		if (element) {
			if (!element.id) {
				element.id = "am5stock-popup-" + this.uid;
			}
			element.setAttribute("role", this._ariaRole());
			const title = this.get("control").getPrivate("button")!.getAttribute("title");
			if (title) {
				element.setAttribute("aria-label", title);
			}
			if (this._ariaRole() == "dialog") {
				element.setAttribute("tabindex", "-1");
			}
		}
	}

	/**
	 * @ignore
	 */
	public _ariaRole(): "menu" | "dialog" {
		return "dialog";
	}

	/**
	 * @ignore
	 */
	public _ariaElement(): HTMLElement | undefined {
		return this.getPrivate("container");
	}

	// Items the arrow keys move between
	protected _getNavItems(): HTMLElement[] {
		return [];
	}

	/**
	 * @ignore
	 */
	public _focusFirst(): void {
		const container = this.getPrivate("container")!;
		const first = container.querySelector<HTMLElement>("input:not([type='hidden']):not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex^='-'])");
		$utils.focus(first || container);
	}

	protected _handleKey(ev: KeyboardEvent): void {
		const items = this._getNavItems();
		if (!items.length) {
			return;
		}
		const key = $utils.getEventKey(ev);
		const active = document.activeElement as HTMLElement;
		const index = items.indexOf(active);
		const inInput = active && (active.tagName == "INPUT" || active.tagName == "SELECT" || active.tagName == "TEXTAREA");
		let next: number | undefined;
		if (key == "ArrowDown" || (key == "ArrowRight" && !inInput)) {
			next = index + 1;
		}
		else if (key == "ArrowUp" || (key == "ArrowLeft" && !inInput)) {
			next = index == -1 ? items.length - 1 : index - 1;
		}
		else if (key == "Home" && !inInput) {
			next = 0;
		}
		else if (key == "End" && !inInput) {
			next = items.length - 1;
		}
		else if ((key == "Enter" || key == " ") && index != -1) {
			ev.preventDefault();
			active.click();
			return;
		}
		if (next !== undefined) {
			ev.preventDefault();
			if (next < 0) {
				next = items.length - 1;
			}
			else if (next >= items.length) {
				next = 0;
			}
			$utils.focus(items[next]);
		}
	}

	public isAccessible(): boolean {
		return this.get("control").isAccessible();
	}

}