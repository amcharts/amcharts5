/**
 * Accessibility setting that can be applied to any visual element.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/accessibility/} for more info
 * @deprecated Since 5.11.2. Moved to ISpriteSettings
 * @ignore
 */
export interface IAccessibilitySettings {}


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
