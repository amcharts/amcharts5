import type { Label } from "../render/Label";
import type { Graphics } from "../render/Graphics";

import { RoundedRectangle } from "../render/RoundedRectangle";
import { Container, IContainerPrivate, IContainerSettings } from "./Container";

import * as $utils from "../../core/util/Utils";

export interface IButtonSettings extends IContainerSettings {

	/**
	 * A [[Label]] element for the button to show as a label.
	 */
	label?: Label;

	/**
	 * A [[Graphics]] element for the button to show as icon.
	 */
	icon?: Graphics;

}

export interface IButtonPrivate extends IContainerPrivate {
}

/**
 * Draws an interactive button.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/buttons/} for more info
 * @important
 */
export class Button extends Container {
	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["button"]);

		super._afterNew();

		if (!this._settings.background) {
			this.set("background", RoundedRectangle.new(this._root, {
				themeTags: $utils.mergeTags(this._settings.themeTags, ["background"])
			}));
		}

		this.setPrivate("trustBounds", true);
	}

	declare public _settings: IButtonSettings;
	declare public _privateSettings: IButtonPrivate;

	public static className: string = "Button";
	public static classNames: Array<string> = Container.classNames.concat([Button.className]);


	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("icon")) {
			const previous = this._prevSettings.icon;
			const icon = this.get("icon")!;
			if (icon !== previous) {
				this._disposeProperty("icon");

				if (previous) {
					previous.dispose();
				}
				if (icon) {
					this.children.push(icon);
				}

				this._prevSettings.icon = icon;
			}
		}

		if (this.isDirty("label")) {
			const previous = this._prevSettings.label;
			const label = this.get("label")!;
			if (label !== previous) {
				this._disposeProperty("label");
				if (previous) {
					previous.dispose();
				}

				if (label) {
					this.children.push(label);
				}

				this._prevSettings.label = label;
			}
		}
	}
}
