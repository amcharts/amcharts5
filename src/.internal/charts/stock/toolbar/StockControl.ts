import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../../core/util/Entity"
import { StockIcons } from "./StockIcons";

import type { IPointerEvent } from "../../../core/render/backend/Renderer";
import type { StockToolbar } from "./StockToolbar";
import type { StockChart } from "../StockChart";
import type { Dropdown } from "./Dropdown";

//import * as $array from "../../core/util/Array";
import * as $utils from "../../../core/util/Utils";

export interface IStockControlSettings extends IEntitySettings {

	/**
	 * The [[StockChart]] the control acts on.
	 */
	stockChart: StockChart;

	/**
	 * Shows the control's button; `false` hides it.
	 *
	 * @default true
	 */
	visible?: boolean;

	/**
	 * Keeps the control hidden, even when `show()` is called.
	 *
	 * @since 5.8.5
	 * @default false
	 */
	forceHidden?: boolean;

	/**
	 * Label text of the control's button.
	 */
	name?: string;

	/**
	 * What the control does, shown as the button's tooltip. Falls back to
	 * `name`.
	 */
	description?: string;

	/**
	 * Icon element of the button, or `"none"` for no icon. Each control has
	 * its own default icon.
	 */
	icon?: HTMLElement | SVGElement | "none";

	/**
	 * Turns the control on; its button shows as active.
	 *
	 * @default false
	 */
	active?: boolean;

	/**
	 * A click on the button toggles `active`.
	 *
	 * @default true
	 */
	togglable?: boolean;

	/**
	 * Side of the toolbar the control is placed on.
	 *
	 * @default "left"
	 */
	align?: "left" | "right";

}


export interface IStockControlPrivate extends IEntityPrivate {
	toolbar: StockToolbar;
	button?: HTMLDivElement;
	/**
	 * The focusable part of the button: holds its icon and label, and has
	 * the button's role and name.
	 *
	 * @since 5.24.0
	 */
	trigger?: HTMLDivElement;
	icon?: HTMLElement;
	label?: HTMLDivElement;
}

export interface IStockControlEvents extends IEntityEvents {
	/**
	 * The control's button was clicked.
	 */
	click: {
		originalEvent: IPointerEvent
	}
}

/**
 * Base class for the controls of a [[StockToolbar]].
 */
export class StockControl extends Entity {
	public static className: string = "StockControl";
	public static classNames: Array<string> = Entity.classNames.concat([StockControl.className]);

	declare public _settings: IStockControlSettings;
	declare public _privateSettings: IStockControlPrivate;
	declare public _events: IStockControlEvents;

	// private _itemDisposers: Array<IDisposer> = [];

	public _dropdown?: Dropdown;
	protected _keysAdded: boolean = false;

	protected _afterNew() {
		super._afterNew();

		this.get("stockChart").controls.push(this);

		// Inherit default themes from chart
		this._defaultThemes = this.get("stockChart")._defaultThemes;
		super._afterNewApplyThemes();

		this._initElements();
		this._applyClassNames();
		this._maybeMakeAccessible();

		this._root.addDisposer(this);
	}

	protected _initElements(): void {
		// Create button
		const button = document.createElement("div");
		button.setAttribute("title", $utils.htmlToText(this.get("description", this.get("name", ""))));
		this.setPrivate("button", button);

		// The focusable part, so a dropdown placed in the button is not inside it
		const holder = this._makeTrigger(button) || button;

		// Create icon
		const icon = document.createElement("div");
		icon.setAttribute("aria-hidden", "true");
		icon.appendChild(this._getIcon());
		if (this.get("icon") == "none") {
			icon.style.display = "none";
		}
		holder.appendChild(icon);
		this.setPrivate("icon", icon);

		// Create label
		const name = this.get("name", "");
		const label = document.createElement("div");
		label.innerHTML = this._root._sanitizeHTML(name);
		if (name == "") {
			label.style.display = "none";
		}
		holder.appendChild(label);
		this.setPrivate("label", label);

		// Add click event
		this._disposers.push($utils.addEventListener(button, "click", (ev) => {
			//ev.stopImmediatePropagation();
			if (this.get("togglable") != false) {
				this._handleClick();
			}

			if (this.events.isEnabled("click")) {
				this.events.dispatch("click", {
					type: "click",
					target: this,
					originalEvent: <IPointerEvent>ev
				})
			}
		}));
	}

	protected _makeTrigger(button: HTMLDivElement): HTMLDivElement | undefined {
		const trigger = document.createElement("div");
		button.appendChild(trigger);
		this.setPrivate("trigger", trigger);
		return trigger;
	}

	/**
	 * @ignore
	 */
	public _getFocusElement(): HTMLElement | undefined {
		return this.getPrivate("trigger") || this.getPrivate("button");
	}

	protected _applyClassNames(): void {
		// a class per control, e.g. am5stock-control-PeriodSelector, for CSS that treats controls differently
		this.getPrivate("button")!.className = "am5stock am5stock-control am5stock-control-button am5stock-control-" + this.className;
		this.getPrivate("label")!.className = "am5stock-control-label";
		const trigger = this.getPrivate("trigger");
		if (trigger) {
			trigger.className = "am5stock-control-trigger";
		}
		this.getPrivate("icon")!.className = "am5stock-control-icon";
	}

	protected _getIcon(): HTMLElement | SVGElement {
		const userIcon = this.get("icon");
		if (userIcon && userIcon != "none") {
			return userIcon;
		}
		return this._getDefaultIcon();
	}

	protected _getDefaultIcon(): SVGElement {
		return StockIcons.getIcon("Default");
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("visible") && !this.get("visible")) {
			this.getPrivate("button")!.style.display = "none";
		}

		if (this.isDirty("forceHidden") && this.get("forceHidden")) {
			this.getPrivate("button")!.style.display = "none";
		}

		if (this.isDirty("name")) {
			this._setLabel(this.get("name", ""));
		}

		if (this.isDirty("active")) {
			const button = this.getPrivate("button")!;
			if (this.get("active")) {
				$utils.addClass(button, "am5stock-control-button-active");
			}
			else {
				$utils.removeClass(button, "am5stock-control-button-active");
			}
			this._updateAria();
		}

		if (this.isDirty("align")) {
			if (this.get("align") == "right") {
				$utils.addClass(this.getPrivate("button")!, "am5stock-align-right");
			}
			else {
				$utils.removeClass(this.getPrivate("button")!, "am5stock-align-right");
			}
		}

		if (this.isPrivateDirty("toolbar")) {
			this._maybeMakeAccessible();
		}

		// todo icon
	}

	protected _dispose(): void {
		super._dispose();
		$utils.removeElement(this.getPrivate("button")!);
	}

	protected _setLabel(name: string): void {
		const label = this.getPrivate("label")!;
		label.innerHTML = this._root._sanitizeHTML(name);
		if (name == "") {
			label.style.display = "none";
		}
		else {
			label.style.display = "";
		}

		const button = this.getPrivate("button")!;
		button.setAttribute("title", $utils.htmlToText(this.get("description", this.get("name", ""))));
		this._updateAria();
	}

	/**
	 * Hides the control's button.
	 */
	public hide(): void {
		this.getPrivate("button")!.style.display = "none";
	}

	/**
	 * Shows the control's button, unless `forceHidden` is set.
	 */
	public show(): void {
		if (this.get("forceHidden") !== true) {
			this.getPrivate("button")!.style.display = "";
		}
	}

	protected _handleClick(): void {
		this.set("active", !this.get("active"));
	}

	protected _maybeMakeAccessible() {
		const target = this._getFocusElement();
		if (!target) {
			return;
		}
		if (this.isAccessible()) {
			target.setAttribute("tabindex", this._root.tabindex.toString());
			target.setAttribute("role", "button");

			if (!this._keysAdded && $utils.supports("keyboardevents")) {
				this._keysAdded = true;
				this._disposers.push($utils.addEventListener(target, "keydown", (ev: KeyboardEvent) => {
					if (ev.target !== target || !this.isAccessible()) {
						return;
					}
					const key = $utils.getEventKey(ev);
					const dropdown = this._dropdown;
					if (key == "Enter" || key == " ") {
						// as on a native button
						ev.preventDefault();
						if (this.get("togglable")) {
							this._handleClick();
						}
						else {
							target.click();
						}
					}
					else if ((key == "ArrowDown" || key == "ArrowUp") && dropdown && dropdown._ariaRole() == "menu") {
						// arrows open a menu, or move into an open one
						ev.preventDefault();
						if (dropdown.isOpen()) {
							dropdown._focusFirst();
						}
						else {
							this.set("active", true);
						}
					}
				}));
			}
		}
		else {
			target.removeAttribute("tabindex");
			target.removeAttribute("role");
		}
		this._updateAria();
		if (this._dropdown) {
			this._dropdown._maybeMakeAccessible();
		}
	}

	/**
	 * @ignore
	 */
	public _setDropdown(dropdown: Dropdown): void {
		this._dropdown = dropdown;
		dropdown.events.on("opened", () => this._updateAria());
		dropdown.events.on("closed", () => this._updateAria());
		this._updateAria();
	}

	/**
	 * @ignore
	 */
	public _focus(): void {
		const target = this._getFocusElement();
		if (target) {
			$utils.focus(target);
		}
	}

	// The button's name, containing its visible text, and its state
	protected _updateAria(): void {
		const target = this._getFocusElement();
		const button = this.getPrivate("button");
		const label = this.getPrivate("label");
		if (!target || !button || !label) {
			return;
		}

		const title = button.getAttribute("title") || "";
		const text = label.style.display == "none" ? "" : ($utils.htmlToText(label.innerHTML) || "").trim();
		let name = title;
		if (text && title.toLowerCase().indexOf(text.toLowerCase()) == -1) {
			name = text.toLowerCase().indexOf(title.toLowerCase()) != -1 ? text : title + ": " + text;
		}
		if (name) {
			target.setAttribute("aria-label", name);
		}
		else {
			target.removeAttribute("aria-label");
		}

		const dropdown = this._dropdown;
		if (dropdown) {
			const popup = dropdown._ariaElement();
			target.setAttribute("aria-haspopup", dropdown._ariaRole());
			target.setAttribute("aria-expanded", dropdown.isOpen() ? "true" : "false");
			if (popup && popup.id) {
				target.setAttribute("aria-controls", popup.id);
			}
			target.removeAttribute("aria-pressed");
		}
		else if (this.get("togglable") !== false) {
			target.setAttribute("aria-pressed", this.get("active") ? "true" : "false");
		}
		else {
			target.removeAttribute("aria-pressed");
		}
	}

	/**
	 * Returns `true` if the control can be used with a keyboard: it is not in
	 * a toolbar, or its toolbar is `focusable`.
	 *
	 * @return Accessible?
	 */
	public isAccessible(): boolean {
		const toolbar = this.getPrivate("toolbar");
		return !toolbar || toolbar.get("focusable", true) ? true : false;
	}

}