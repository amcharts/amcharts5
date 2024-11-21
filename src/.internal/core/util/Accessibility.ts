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
	 * An identifier by which to group common elements into focusable groups.
	 *
	 * If set, only the first element in he group will be focusable via TAB key.
	 * When it is selected, the rest of the elements in the same group can be
	 * selected using arrow keys.
	 *
	 * It allows users to TAB-through chart elements quickly without the need
	 * to TAB into each and every element.
	 *
	 * It's up to implementer of the charts to provide meaningful `ariaLabel` to
	 * the element, which advertises this capability and provides adequate
	 * instructions.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/#Grouping_focusable_elements} for more info
	 * @since 5.0.6
	 */
	focusableGroup?: string | number;

	/**
	 * If set, the text will be read out (announced) by a screen reader when
	 * focused element is "clicked" (by pressing ENTER or SPACE).
	 * 
	 * @since 5.10.8
	 */
	clickAnnounceText?: string;

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
	 *
	 * This setting is ignored unless `role` is one of the following:
	 * * `"checkbox"`
	 * * `"option"`
	 * * `"radio"`
	 * * `"menuitemcheckbox"`
	 * * `"menuitemradio"`
	 * * `"treeitem"`
	 */
	ariaChecked?: boolean;

	/**
	 * `aria-current` setting.
	 * 
	 * @see {@link https://w3c.github.io/aria/#aria-current} for more info
	 * @since 5.9.8
	 */
	ariaCurrent?: string;

	/**
	 * `aria-selected` setting.
	 * 
	 * @see {@link https://w3c.github.io/aria/#aria-selected} for more info
	 * @since 5.9.8
	 */
	ariaSelected?: boolean;

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
	 * `aria-valuemin` setting.
	 */
	ariaValueMin?: string;

	/**
	 * `aria-valuemax` setting.
	 */
	ariaValueMax?: string;

	/**
	 * `aria-valuetext` setting.
	 */
	ariaValueText?: string;

	/**
	 * `aria-controls` setting.
	 */
	ariaControls?: string;

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
