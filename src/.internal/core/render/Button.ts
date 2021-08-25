import type { Root } from "../Root";
import type { Label } from "../render/Label";
import { RoundedRectangle } from "../render/RoundedRectangle";
import type { Graphics } from "../render/Graphics";
import type { Template } from "../../core/util/Template";
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

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Button["_settings"], template?: Template<Button>): Button {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["button"]);
		const x = new Button(root, settings, true, template);
		x._afterNew();
		if(!settings.background){
			x.set("background", RoundedRectangle.new(root, {
				themeTags: $utils.mergeTags(settings.themeTags, ["background"])
			}));
		}
		return x;
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
					if (previous.get("autoDispose")) {
						previous.dispose();
					}
					else {
						this.children.removeValue(previous);
					}
				}
				if (icon) {
					this.children.push(icon);
				}

				this.setRaw("icon", icon);
			}
		}

		if (this.isDirty("label")) {
			const previous = this._prevSettings.label;
			const label = this.get("label")!;
			if (label !== previous) {
				this._disposeProperty("label");
				if (previous) {
					if (previous.get("autoDispose")) {
						previous.dispose();
					}
					else {
						this.children.removeValue(previous);
					}
				}

				if (label) {
					this.children.push(label);
				}

				this.setRaw("label", label);
			}
		}
	}
}
