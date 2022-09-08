import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../../core/util/Entity"
import { StockIcons } from "./StockIcons";

import type { IPointerEvent } from "../../../core/render/backend/Renderer";
import type { StockToolbar } from "./StockToolbar";
import type { StockChart } from "../StockChart";

//import * as $array from "../../core/util/Array";
import * as $utils from "../../../core/util/Utils";

export interface IStockControlSettings extends IEntitySettings {

	/**
	 * A [[StockChart]] the toolbar is for.
	 */
	stockChart: StockChart;

	/**
	 * Is control visible?
	 * 
	 * @default true
	 */
	visible?: boolean;

	/**
	 * Name of the control. Used for the label.
	 */
	name?: string;

	/**
	 * Description of what the button does.
	 */
	description?: string;

	/**
	 * An element with control icon. If not set, each control will aytomatically
	 * create an icon.
	 */
	icon?: HTMLElement | SVGElement | "none";

	/**
	 * Indicates if control is active.
	 * 
	 * @default false
	 */
	active?: boolean;

	/**
	 * If set to `true`, control can be toggle on and off by clicking on it.
	 * 
	 * @default true
	 */
	togglable?: boolean;

	/**
	 * Alignment of the control in a toolbar.
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
	click: {
		originalEvent: IPointerEvent
	}
}

/**
 * @todo revview
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

		// Inherit default themes from chart
		this._defaultThemes = this.get("stockChart")._defaultThemes;
		super._afterNewApplyThemes();

		this._initElements();
		this._applyClassNames();

		this._root.addDisposer(this);
	}

	protected _initElements(): void {
		// Create button
		const button = document.createElement("div");
		button.setAttribute("title", this.get("description", this.get("name", "")));
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

		// todo icon
	}

	protected _dispose(): void {
		super._dispose();

		// $array.each(this._itemDisposers, (x) => {
		// 	x.dispose();
		// });
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
		button.setAttribute("title", this.get("description", this.get("name", "")));
	}

	public hide(): void {
		this.getPrivate("button")!.style.display = "none";
	}

	public show(): void {
		this.getPrivate("button")!.style.display = "";
	}

	protected _handleClick(): void {
		this.set("active", !this.get("active"));
	}

}