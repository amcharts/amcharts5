/**
 * Accessibility setting that can be applied to any visual element.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/} for more info
 */
export interface IAccessibilitySettings {
	
	/**
	 * An internal order by which focusable elements will be selected within the
	 * chart.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Focusing_elements} for more info
	 */
	tabindexOrder?: number;

	/**
	 * Simulate hover on an element when it gains focus, including changing hover
	 * appearance and displaying a tooltip if application.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Focusing_elements} for more info
	 */
	hoverOnFocus?: boolean;

	/**
	 * Can element be focused, i.e. selected using TAB key.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Focusing_elements} for more info
	 */
	focusable?: boolean;

	/**
	 * Element's role.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Roles} for more info
	 */
	role?: Role;

	/**
	 * `aria-live` setting.
	 */
	ariaLive?: AriaLive;

	/**
	 * `aria-checked` setting.
	 */
	ariaChecked?: boolean;

	/**
	 * `aria-hidden` setting.
	 */
	ariaHidden?: boolean;

	/**
	 * Label for the element to use for screen readers.
	 * 
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Screen_reader} for more info
	 */
	ariaLabel?: string;

	/**
	 * `aria-orientation` setting.
	 */
	ariaOrientation?: string;

	/**
	 * `aria-valuenow` setting.
	 */
	ariaValueNow?: string;

	/**
	 * `aria-valuetext` setting.
	 */
	ariaValueText?: string;

	//ariaDescription?: string;
	//readerControls?: string;

}


/**
 * Defines available accessibility roles.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/} for more info
 */
export type Role =
	"alert"
	| "alertdialog"
	| "application"
	| "article"
	| "banner"
	| "button"
	| "checkbox"
	| "columnheader"
	| "combobox"
	| "command"
	| "complementary"
	| "composite"
	| "contentinfo"
	| "definition"
	| "dialog"
	| "directory"
	| "document"
	| "form"
	| "figure"
	| "grid"
	| "gridcell"
	| "group"
	| "heading"
	| "img"
	| "input"
	| "landmark"
	| "link"
	| "list"
	| "listbox"
	| "listitem"
	| "log"
	| "main"
	| "marquee"
	| "math"
	| "menu"
	| "menubar"
	| "menuitem"
	| "menuitemcheckbox"
	| "menuitemradio"
	| "navigation"
	| "none"
	| "note"
	| "option"
	| "presentation"
	| "progressbar"
	| "radio"
	| "radiogroup"
	| "range"
	| "region"
	| "roletype"
	| "row"
	| "rowgroup"
	| "rowheader"
	| "scrollbar"
	| "search"
	| "section"
	| "sectionhead"
	| "select"
	| "separator"
	| "slider"
	| "spinbutton"
	| "status"
	| "structure"
	| "switch"
	| "tab"
	| "tablist"
	| "tabpanel"
	| "textbox"
	| "timer"
	| "toolbar"
	| "tooltip"
	| "tree"
	| "treegrid"
	| "treeitem"
	| "widget"
	| "window";


/**
 * Available options for `aria-live` attribute
 */
export type AriaLive = "off" | "polite" | "assertive";
