import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../../core/util/Entity"
import { StockIcons } from "./StockIcons";

import type { IPointerEvent } from "../../../core/render/backend/Renderer";
import type { StockToolbar } from "./StockToolbar";
import type { StockChart } from "../StockChart";

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

		// Create icon
		const icon = document.createElement("div");
		icon.appendChild(this._getIcon());
		if (this.get("icon") == "none") {
			icon.style.display = "none";
		}
		button.appendChild(icon);
		this.setPrivate("icon", icon);

		// Create label
		const name = this.get("name", "");
		const label = document.createElement("div");
		label.innerHTML = name;
		if (name == "") {
			label.style.display = "none";
		}
		button.appendChild(label);
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

	protected _applyClassNames(): void {
		this.getPrivate("button")!.className = "am5stock am5stock-control am5stock-control-button";
		this.getPrivate("label")!.className = "am5stock-control-label";
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
		label.innerHTML = name;
		if (name == "") {
			label.style.display = "none";
		}
		else {
			label.style.display = "";
		}

		const button = this.getPrivate("button")!;
		button.setAttribute("title", $utils.htmlToText(this.get("description", this.get("name", ""))));
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
		if (this.isAccessible()) {
			const button = this.getPrivate("button")!;
			button.setAttribute("tabindex", this._root.tabindex.toString());
			button.setAttribute("role", "button");

			if ($utils.supports("keyboardevents")) {
				button.setAttribute("aria-label", button.getAttribute("title") + "; " + this._t("Press ENTER to toggle"));
				this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
					if (document.activeElement == button && (ev.keyCode == 13 || ev.keyCode == 32)) {
						// ENTER or SPACE, as on a native button
						ev.preventDefault();
						if (this.get("togglable")) {
							this._handleClick();
						}
						else {
							(document.activeElement as HTMLElement).click();
						}
					}
				}));
			}
		}
	}

	public isAccessible(): boolean {
		const toolbar = this.getPrivate("toolbar");
		return toolbar && toolbar.get("focusable", true) ? true : false;
	}

}