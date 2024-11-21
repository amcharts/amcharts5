import type { Root } from "../../core/Root"

import { StyleRule } from "../../core/util/Utils"
import { MultiDisposer, IDisposer, CounterDisposer } from "../../core/util/Disposer";

function makeStyles(element: ShadowRoot | null, root: Root): IDisposer {
	//const newPrefix = (prefix ? prefix : "am5");

	//let colorSet = new InterfaceColorSet();
	const ic = root.interfaceColors;

	return new MultiDisposer([
		new StyleRule(element, ".am5exporting-menu", {
			"color": ic.get("secondaryButtonText")!.toCSS(),
			"font-size": "0.8em"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu *", {
			"box-sizing": "border-box",
			"transition": "all 100ms ease-in-out",
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu a", {
			"display": "block",
			"cursor": "pointer"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-type-separator", {
			"color": ic.get("disabled")!.toCSS(),
			"border-bottom": "1px solid " + ic.get("secondaryButtonDown")!.toCSS(),
		}, root.nonce),

		new StyleRule(element, ".am5exporting-label-alt", {
			"color": ic.get("disabled")!.toCSS(),
			"font-size": "0.8em"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu .am5exporting-type-separator a", {
			"cursor": "default"
		}, root.nonce),
		new StyleRule(element, ".am5exporting-menu .am5exporting-type-separator a:hover", {
			"background": "initial"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu", {
			"position": "absolute",
			"z-index": "10"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-icon", {
			"width": "30px",
			"height": "26px",
			"position": "absolute",
			"margin": "5px",
			"padding": "3px 5px",
			"border-radius": "3px",
			"opacity": "0.5",
			"background": "rgba(255, 255, 255, 0.001)",
			"background-opacity": "0"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-icon:focus, .am5exporting-icon:hover, .am5exporting-menu-open .am5exporting-icon", {
			"background": ic.get("secondaryButtonHover")!.toCSS(),
			"opacity": "1"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu path", {
			"fill": ic.get("secondaryButtonText")!.toCSS()
		}, root.nonce),

		new StyleRule(element, ".am5exporting-list", {
			"display": "none",
			"list-style": "none",
			"list-style-type": "none",
			"margin": "5px",
			"background": ic.get("secondaryButton")!.toCSS(),
			"padding": "5px 0",
			"border": "1px solid " + ic.get("secondaryButtonStroke")!.toCSS(),
			"border-radius": "3px"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu-open .am5exporting-list", {
			"display": "block"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-item", {
		}, root.nonce),

		new StyleRule(element, ".am5exporting-item a", {
			"padding": "3px 15px",
		}, root.nonce),

		new StyleRule(element, ".am5exporting-item a:hover, .am5exporting-item a.am5exporting-item-active", {
			"background": ic.get("secondaryButtonHover")!.toCSS(),
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu.am5exporting-align-left, .am5exporting-icon.am5exporting-align-left, .am5exporting-list.am5exporting-align-left", {
			"left": "0"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu.am5exporting-align-right, .am5exporting-icon.am5exporting-align-right, .am5exporting-list.am5exporting-align-right", {
			"right": "0"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu.am5exporting-valign-top, .am5exporting-icon.am5exporting-valign-top, .am5exporting-list.am5exporting-align-top", {
			"top": "0"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-menu.am5exporting-valign-bottom, .am5exporting-icon.am5exporting-valign-bottom, .am5exporting-list.am5exporting-align-bottom", {
			"bottom": "0"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-list.am5exporting-align-left", {
			"margin-left": "40px"
		}, root.nonce),

		new StyleRule(element, ".am5exporting-list.am5exporting-align-right", {
			"margin-right": "40px"
		}, root.nonce),

		// new StyleRule(element, ".${newPrefix}-menu-level-0", {
		// 	"position": "absolute",
		// 	"top": "5px",
		// 	"right": "5px",
		// })
	]);
}

/**
 * @ignore
 */
let rules: CounterDisposer | undefined;

/**
 * @ignore
 */
export default function(element: ShadowRoot | null, root: Root, _prefix?: string): IDisposer {
	if (element == null) {
		if (!rules) {
			const disposer = makeStyles(element, root);

			rules = new CounterDisposer(() => {
				rules = undefined;
				disposer.dispose();
			});
		}

		return rules.increment();

	} else {
		return makeStyles(element, root);
	}
}
