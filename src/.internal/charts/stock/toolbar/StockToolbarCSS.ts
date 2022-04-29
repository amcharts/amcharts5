import type { Root } from "../../../core/Root"

import { StyleRule } from "../../../core/util/Utils"
import { MultiDisposer, IDisposer, CounterDisposer } from "../../../core/util/Disposer";

/**
 * @ignore
 */
let rules: CounterDisposer | undefined;

/**
 * @ignore
 */
export default function(element: ShadowRoot | null, root: Root, _prefix?: string): IDisposer {
	const ic = root.interfaceColors;
	const active = ic.get("secondaryButton")!.toCSS();
	const hover = ic.get("secondaryButtonHover")!.toCSS();
	//const text = ic.get("secondaryButtonText")!.toCSS();
	const bg = ic.get("background")!.toCSS();

	if (!rules) {
		const disposer = new MultiDisposer([

			new StyleRule(element, ".am5stock-control-button", {
				"display": "inline-block",
				"position": "relative",
				"border": "1px solid " + active,
				"border-radius": "4px",
				"padding": "3px 0 3px 5px",
				"margin": "2px",
				"z-index": "100000",
				"cursor": "default",
				"line-height": "1.5em"
			}),

			new StyleRule(element, ".am5stock-control-button:hover", {
				"background": active
			}),

			new StyleRule(element, ".am5stock-control-button.am5stock-no-hover:hover", {
				"background": "initial"
			}),

			new StyleRule(element, ".am5-modal-content .am5stock-control-button", {
				"padding": "0",
				"border": "none",
				//"margin-top": "3px"
			}),

			new StyleRule(element, ".am5stock-control-button.am5stock-align-right", {
				"float": "right"
			}),

			new StyleRule(element, ".am5stock-control-button.am5stock-control-button-active", {
				"background": active,
				"z-index": "100001",
			}),

			// new StyleRule(element, ".am5stock-control-button.am5stock-control-dropdown::after", {
			// 	"position": "relative",
			// 	"content": "\"\"",
			// 	"display": "inline-block",
			// 	"width": "0.3em",
			// 	"height": "0.3em",
			// 	"border-right": "0.1em solid " + text,
			// 	"border-top": "0.1em solid " + text,
			// 	"transform": "rotate(135deg)",
			// 	"margin-left": "0.2em",
			// 	"margin-right": "0.5em",
			// 	"vertical-align": "middle"
			// }),

			new StyleRule(element, ".am5-modal-content .am5stock-control-button.am5stock-control-button-active, .am5-modal-content .am5stock-control-button:hover", {
				"background": "none"
			}),

			new StyleRule(element, ".am5stock-control-icon", {
				"min-width": "1.2em",
				"min-height": "1.2em",
				//"margin-right": "4px",
				"display": "inline-block",
				"position": "relative",
				"margin": "0 5px 0 0",
			}),

			new StyleRule(element, ".am5stock-control-icon > *", {
				"vertical-align": "sub",
				// "max-width": "18px",
				// "max-height": "18px",
				//"margin-right": "5px"
			}),

			new StyleRule(element, ".am5stock-control-icon > .am5stock-control-icon-color", {
				"max-width": "20px",
				//"max-height": "20px",
				"width": "20px",
				//"height": "20px",
				//"margin-right": "5px"
			}),

			new StyleRule(element, ".am5stock-control-icon > .am5stock-control-icon-color-bg", {
				"width": "100%",
				"height": "100%",
				"display": "block",
				"position": "absolute",
				"left": "0",
				"top": "0",
				"z-index": "-1",
				"background-image": "linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)",
				"background-size": "10px 10px",
				"background-position": "0 0, 0 5px, 5px -5px, -5px 0px",
			}),

			new StyleRule(element, ".am5stock-control-button path", {
				//fill: ic.get("secondaryButtonText")!.toCSS(),
				"stroke-width": "0.5",
				"stroke": ic.get("secondaryButtonText")!.toCSS(),
				"fill": "none",
				"vector-effect": "non-scaling-stroke"
			}),

			new StyleRule(element, ".am5stock-control-label", {
				"display": "inline-block",
				"margin": "0 5px 0 0"
			}),

			new StyleRule(element, ".am5stock-control-list-container", {
				"position": "absolute",
				"left": "0",
				"top": "100%",
				"margin-top": "10px",
				"background": ic.get("background")!.toCSS(),
				"border": "1px solid " + active,
				"border-radius": "3px"
			}),

			new StyleRule(element, ".am5stock-align-right .am5stock-control-list-container", {
				"left": "auto",
				"right": "0"
			}),

			new StyleRule(element, ".am5stock-control-list-arrow", {
				"position": "absolute",
				"left": "5px",
				"top": "-5px",
				"border": "solid " + active,
				"border-width": "0 1px 1px 0",
				"background": ic.get("background")!.toCSS(),
				"display": "inline-block",
				"padding": "5px",
				"transform": "rotate(-135deg)"
			}),

			new StyleRule(element, ".am5stock-align-right .am5stock-control-list-arrow", {
				"right": "5px",
				"left": "auto"
			}),

			new StyleRule(element, ".am5stock-control-list", {
				"list-style": "none",
				"margin": "5px",
				"padding": "2px",
				"white-space": "nowrap"
			}),

			new StyleRule(element, ".am5stock-control-list li", {
				"padding": "2px 6px 2px 6px",
				"position": "relative"
			}),

			new StyleRule(element, ".am5stock-control-list li:hover", {
				"background": active
			}),

			new StyleRule(element, ".am5stock-control-list li.am5stock-list-info", {
				"font-style": "italic",
				"color": hover
			}),

			new StyleRule(element, ".am5stock-control-list .am5stock-list-sub", {
				"font-size": "0.7em",
				"color": hover,
				"display": "block"
			}),

			new StyleRule(element, ".am5stock-control-list li.am5stock-list-info:hover", {
				"background": "none"
			}),

			new StyleRule(element, ".am5stock-control-list li.am5stock-list-heading", {
				"font-style": "normal",
				"font-weight": "bold",
				"color": "initial",
				"margin-top": "0.3em"
			}),

			new StyleRule(element, ".am5stock-control-list li svg", {
				"max-width": "1em",
				"max-height": "1em",
				"margin-right": "0.8em",
				//"position": "absolute",
				"left": "0px",
				"top": "2px",
				"display": "inline-block"
			}),

			new StyleRule(element, ".am5stock-control-list li svg.am5stock-icon-wide, .am5stock-control-icon > *.am5stock-icon-wide", {
				"width": "60px",
				"max-width": "60px",
				"margin-right": "0"
			}),

			new StyleRule(element, ".am5stock-control-list li div, .am5stock-control-list li label", {
				"display": "inline-block",
				"margin-right": "1em"
			}),

			new StyleRule(element, ".am5stock-control-list li input", {
				"margin-right": "1em"
			}),

			new StyleRule(element, ".am5stock-list-search", {
				//"display": "inline-block",
				"margin": "0.5em 0.7em",
				"padding-bottom": "0.25em",
				//"padding-left": "30px",
				//"border-bottom": "1px solid " + active,
				"position": "relative",
				//"background": "url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgZmlsbD0ibm9uZSIgaGVpZ2h0PSIyNCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAuNSIgY3k9IjEwLjUiIHI9IjcuNSIvPjxsaW5lIHgxPSIyMSIgeDI9IjE1LjgiIHkxPSIyMSIgeTI9IjE1LjgiLz48L3N2Zz4=) left / 20px 20px no-repeat",
			}),

			new StyleRule(element, ".am5stock-list-search input", {
				"border": "1px solid " +  active,
				"padding": "6px 10px 6px 30px",
				"margin-top": "5px",
				"background": "url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgZmlsbD0ibm9uZSIgaGVpZ2h0PSIyNCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAuNSIgY3k9IjEwLjUiIHI9IjcuNSIvPjxsaW5lIHgxPSIyMSIgeDI9IjE1LjgiIHkxPSIyMSIgeTI9IjE1LjgiLz48L3N2Zz4=) 5px / 20px 20px no-repeat",
			}),

			new StyleRule(element, ".am5stock-control-colors, .am5stock-control-icons", {
				"list-style": "none",
				"margin": "5px",
				"padding": "2px",
				//"white-space": "nowrap",
				"width": "240px"
			}),

			new StyleRule(element, ".am5stock-control-colors li, .am5stock-control-icons li", {
				"display": "inline-block",
				"padding": "0",
				"margin": "0",
				"border": "3px solid " + bg,
				"width": "24px",
				"height": "24px",
				"position": "relative"
			}),

			new StyleRule(element, ".am5stock-control-colors li:hover, .am5stock-control-colors li.am5stock-control-active, .am5stock-control-icons li:hover, .am5stock-control-icons li.am5stock-control-active", {
				"border-color": "rgba(200, 200, 200, 1)"
			}),

			new StyleRule(element, ".am5stock-control-colors li.am5stock-control-opacity", {
				"width": "42px",
				"text-align": "center"
			}),

			new StyleRule(element, ".am5stock-control-colors li.am5stock-control-opacity", {
				"width": "42px",
				"text-align": "center",
				"font-size": "12px",
				"line-height": "24px"
			}),

			new StyleRule(element, ".am5stock-control-opacity-100, .am5stock-control-opacity-75, .am5stock-control-opacity-50", {
				"color": "#fff"
			}),

			new StyleRule(element, ".am5stock-row", {
				"display": "flex",
				"flex-direction": "row"
			}),

			new StyleRule(element, ".am5stock-column", {
				"width": "200px",
				"display": "inline-block",
				"padding": "1em"
			}),

			new StyleRule(element, ".am5stock-group", {
				"white-space": "nowrap",
				//"margin": "0.5em 1em",
				"padding-bottom": "0.25em",
				"border-bottom": "1px solid " + active,
				"position": "relative",
			}),

			new StyleRule(element, ".am5stock-group input", {
				"border": "none",
				"padding": "3px 5px",
				"margin-top": "5px"
			}),

			new StyleRule(element, ".am5stock-link", {
				"display": "inline-block",
				"margin": "0 0.15em",
				"padding": "0 3px",
				"border-radius": "3px"
			}),

			new StyleRule(element, ".am5stock-link.am5stock-active, .am5stock-link:hover", {
				//"font-weight": "bold"
				"background": active
			}),

			new StyleRule(element, ".am5stock-drawing-label-wrapper", {
				//"font-weight": "bold"
				"background-color": bg,
				"bakcground-opacity": "0.5",
				"padding": "0.5em",
				"border-radius": "4px",
				"-webkit-box-shadow": "0px 0px 36px 0px rgba(0,0,0,0.45)",
				"box-shadow": "0px 0px 36px 0px rgba(0,0,0,0.45)"
			}),

			new StyleRule(element, ".am5stock-drawing-label-input", {
				"width": "250px",
				"min-height": "50px",
			}),

		]);

		rules = new CounterDisposer(() => {
			rules = undefined;
			disposer.dispose();
		});
	}

	return rules.increment();
}