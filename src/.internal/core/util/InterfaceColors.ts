import type { Color } from "./Color"

import { Entity, IEntitySettings } from "./Entity"


export interface IInterfaceColorsSettings extends IEntitySettings {

	/**
	 * Used for generic outlines.
	 */
	stroke?: Color,

	/**
	 * Used for generic fills.
	 */
	fill?: Color,

	/**
	 * Primary button fill color.
	 */
	primaryButton?: Color,

	/**
	 * Primary button fill color on hover.
	 */
	primaryButtonHover?: Color,

	/**
	 * Primary button fill color when pressing down on it.
	 */
	primaryButtonDown?: Color,

	/**
	 * Primary button fill color when it is set as active.
	 */
	primaryButtonActive?: Color,

	/**
	 * Primary button fill color when it is set as disabled.
	 */
	primaryButtonDisabled?: Color,	

	/**
	 * Primary button text color when it is set as disabled.
	 */
	primaryButtonTextDisabled?: Color,

	/**
	 * Primary button text color.
	 */
	primaryButtonText?: Color,	

	/**
	 * Primary button stroke (outline) color.
	 */
	primaryButtonStroke?: Color,

	/**
	 * Secondary button fill color.
	 */
	secondaryButton?: Color,

	/**
	 * Secondary button fill color on hover.
	 */
	secondaryButtonHover?: Color,

	/**
	 * Secondary button fill color when pressing down on it.
	 */
	secondaryButtonDown?: Color,

	/**
	 * Secondary button fill color when it is set as active.
	 */
	secondaryButtonActive?: Color,

	/**
	 * Secondary button text color.
	 */
	secondaryButtonText?: Color,

	/**
	 * Secondary button stroke (outline) color.
	 */
	secondaryButtonStroke?: Color,

	/**
	 * Grid color.
	 */
	grid?: Color,

	/**
	 * Chart background color.
	 */
	background?: Color,

	/**
	 * Alternative background, for elements that need to contrast with primary
	 * background.
	 */
	alternativeBackground?: Color,

	/**
	 * Label text color.
	 */
	text?: Color,

	/**
	 * Alternative text color, used for inverted (dark) backgrounds.
	 * @type {[type]}
	 */
	alternativeText?: Color,

	/**
	 * Color for disabled elements.
	 */
	disabled?: Color,

	/**
	 * Color to indicate positive value.
	 */
	positive?: Color,

	/**
	 * Color to indicate negative value.
	 */
	negative?: Color

}


/**
 * Presets for common UI elements.
 */
export class InterfaceColors extends Entity {
	public static className: string = "InterfaceColors";
	public static classNames: Array<string> = Entity.classNames.concat([InterfaceColors.className]);

	declare public _settings: IInterfaceColorsSettings;
}
