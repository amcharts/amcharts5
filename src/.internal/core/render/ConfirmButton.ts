import { IButtonSettings, IButtonPrivate, IButtonEvents, Button } from "./Button";

import * as $utils from "../util/Utils";

export interface IConfirmButtonSettings extends IButtonSettings {
}

export interface IConfirmButtonPrivate extends IButtonPrivate {
	ConfirmButton?: Button;
}

export interface IConfirmButtonEvents extends IButtonEvents {
	confirmed: {};
	cancelled: {};
}

/**
 * Draws an interactive button, which displays a confirmation when clicked.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/buttons/} for more info
 * @important
 * @since 5.14.0
 */
export class ConfirmButton extends Button {

	public static className: string = "ConfirmButton";
	public static classNames: Array<string> = Button.classNames.concat([ConfirmButton.className]);

	declare public _settings: IConfirmButtonSettings;
	declare public _privateSettings: IConfirmButtonPrivate;
	declare public _events: IConfirmButtonEvents;

	protected _ignoreClick?: boolean;

	protected _afterNew() {
		super._afterNew();

		this.addTag("confirm");

		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
				const eventKey = $utils.getEventKey(ev);
				if (this.get("active") && eventKey == "Escape") {
					this._cancel();
				}
			}));
		}

		this._disposers.push($utils.addEventListener(document, "click", () => {
			if (!this._ignoreClick) {
				this._cancel();
			}
			this._ignoreClick = false;
		}));

		this.events.on("click", () => {
			if (!this.get("active")) {
				this._ignoreClick = true;
			}
			this._confirm();
		});

	}

	protected _cancel() {
		if (this.get("active")) {
			this.events.dispatch("cancelled", {
				type: "cancelled",
				target: this
			});
			this.set("active", false);
		}
	}

	protected _confirm() {
		if (this.get("active")) {
			this.events.dispatch("confirmed", {
				type: "confirmed",
				target: this
			});
			this.set("active", false);
			if (this.isFocus()) {
				this.setTimeout(() => {
					this.set("active", false);
					$utils.blur();
				}, 10);
			}
		}
	}

	public _prepareChildren() {
		super._prepareChildren();
	}
}
