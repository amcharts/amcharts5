import type { Color } from "./Color"

import { Entity, IEntitySettings } from "./Entity"


export interface IInterfaceColorsSettings extends IEntitySettings {

	/**
	 * Color for general outlines.
	 */
	stroke?: Color,

	/**
	 * Color for general fills, such as a scrollbar's background.
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
	 * Primary button fill color while pressed.
	 */
	primaryButtonDown?: Color,

	/**
	 * Primary button fill color when active.
	 */
	primaryButtonActive?: Color,

	/**
	 * Primary button fill color when disabled.
	 */
	primaryButtonDisabled?: Color,	

	/**
	 * Primary button text color when disabled.
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
	 * Secondary button fill color while pressed.
	 */
	secondaryButtonDown?: Color,

	/**
	 * Secondary button fill color when active.
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
	 * Color of grid lines.
	 */
	grid?: Color,

	/**
	 * Background color, for elements that should blend with what is behind
	 * the chart, such as legend item backgrounds.
	 */
	background?: Color,

	/**
	 * A color that contrasts with `background`, for elements that should stand
	 * out from it, such as tooltips.
	 */
	alternativeBackground?: Color,

	/**
	 * Label text color.
	 */
	text?: Color,

	/**
	 * Text color over `alternativeBackground`, such as in tooltips.
	 */
	alternativeText?: Color,

	/**
	 * Color for disabled elements.
	 */
	disabled?: Color,

	/**
	 * Color for positive values, such as a rise.
	 */
	positive?: Color,

	/**
	 * Color for negative values, such as a fall.
	 */
	negative?: Color,

	/**
	 * Color between `negative` and `positive`, such as a warning or the middle
	 * of a scale from bad to good.
	 */
	warning?: Color

}


/**
 * Colors of common interface elements: buttons, grid, text and backgrounds.
 * The root's is `root.interfaceColors`.
 */
export class InterfaceColors extends Entity {
	public static className: string = "InterfaceColors";
	public static classNames: Array<string> = Entity.classNames.concat([InterfaceColors.className]);

	declare public _settings: IInterfaceColorsSettings;
}
