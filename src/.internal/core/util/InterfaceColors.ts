import { Entity, IEntitySettings } from "./Entity"
import type { Root } from "../Root"
import type { Template } from "./Template";
import type { Color } from "./Color"


export interface IInterfaceColorsSettings extends IEntitySettings {
	stroke?: Color,
	fill?: Color,

	primaryButton?: Color,
	primaryButtonHover?: Color,
	primaryButtonDown?: Color,
	primaryButtonActive?: Color,
	primaryButtonText?: Color,
	primaryButtonStroke?: Color,

	secondaryButton?: Color,
	secondaryButtonHover?: Color,
	secondaryButtonDown?: Color,
	secondaryButtonActive?: Color,
	secondaryButtonText?: Color,
	secondaryButtonStroke?: Color,

	grid?: Color,
	background?: Color,
	alternativeBackground?: Color,
	text?: Color,
	alternativeText?: Color,
	disabled?: Color,

	positive?: Color,
	negative?: Color
}


export class InterfaceColors extends Entity {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: InterfaceColors["_settings"], template?: Template<InterfaceColors>): InterfaceColors {
		const x = new InterfaceColors(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IInterfaceColorsSettings;
}
