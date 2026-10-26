import type { Root } from "../Root"

import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "./Entity";
import { StyleRule } from "./Utils"
import { MultiDisposer, IDisposer, CounterDisposer } from "../../core/util/Disposer";

import * as $utils from "./Utils"


/**
 * @ignore
 */
let rules: CounterDisposer | undefined;

/**
 * @ignore
 */
function modalCSS(element: ShadowRoot | null, root: Root, _prefix?: string): IDisposer {
	const ic = root.interfaceColors;
	const active = ic.get("secondaryButton")!.toCSS();
	const text = ic.get("text")!.toCSS();
	const shadow = ic.get("alternativeBackground")!.toCSS(0.45);
	//const altbg = ic.get("alternativeBackground")!.toCSS();

	if (!rules) {
		const disposer = new MultiDisposer([

			new StyleRule(element, ".am5-modal", {
				"width": "100%",
				"height": "100%",
				"position": "absolute",
				"z-index": "100000",
				"top": "0",
				"left": "0"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-curtain", {
				"top": "0",
				"left": "0",
				"width": "100%",
				"height": "100%",
				"position": "absolute",
				"background": ic.get("background")!.toCSS(0.5),
				"z-index": "100"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-wrapper", {
				"top": "0",
				"left": "0",
				"width": "100%",
				"height": "100%",
				"position": "absolute",
				"text-align": "center",
				"white-space": "nowrap",
				"background": ic.get("background")!.toCSS(0.5),
				"z-index": "101"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-wrapper:before", {
				"content": "''",
				"display": "inline-block",
				"height": "100%",
				"vertical-align": "middle",
				"margin-right": "-0.25em"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-content", {
				"display": "inline-block",
				"padding": "1.2em",
				"vertical-align": "middle",
				"text-align": "start",
				"white-space": "normal",
				"background": ic.get("background")!.toCSS(),
				//"border": "1px solid " + ic.get("alternativeBackground")!.toCSS(),
				"border-radius": "4px",
				"-webkit-box-shadow": "0px 0px 36px 0px " + shadow,
				"box-shadow": "0px 0px 36px 0px " + shadow,
				"color": text
			}, root.nonce),

			new StyleRule(element, ".am5-modal-content h1", {
				"font-size": "1em",
				"margin": "0 0 0.5em 0"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-table", {
				"display": "table",
				"margin": "1em 0"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-table-row", {
				"display": "table-row"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-table-heading", {
				"display": "table-heading",
				"padding": "3px 10px 3px 0",
			}, root.nonce),

			new StyleRule(element, ".am5-modal-table-cell", {
				"display": "table-cell",
				"padding": "3px 0 3px 0",
			}, root.nonce),

			new StyleRule(element, ".am5-modal-table-cell > *", {
				"vertical-align": "middle"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-content input[type=text], .am5-modal-content input[type=number], .am5-modal-content select", {
				"border": "1px solid " + active,
				"border-radius": "4px",
				"padding": "3px 5px",
				"margin": "2px"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-input-narrow", {
				"width": "70px"
			}, root.nonce),

			new StyleRule(element, ".am5-modal-button", {
				"font-weight": "400",
				"color": ic.get("secondaryButtonText")!.toCSS(),
				"line-height": "1.5",
				"text-align": "center",
				"text-decoration": "none",
				"vertical-align": "middle",
				"cursor": "pointer",
				"padding": "0.2em 0.8em",
				"font-size": "1em",
				"border-radius": "0.25em",
				"margin": "0 0.25em 0 0",
				"border": "1px solid " + ic.get("secondaryButtonStroke")!.toCSS(),
				"background": ic.get("secondaryButton")!.toCSS()
			}, root.nonce),

			new StyleRule(element, ".am5-modal-button:hover", {
				"background": ic.get("secondaryButtonHover")!.toCSS()
			}, root.nonce),

			new StyleRule(element, ".am5-modal-button.am5-modal-primary", {
				"color": ic.get("primaryButtonText")!.toCSS(),
				"border": "1px solid " + ic.get("primaryButtonStroke")!.toCSS(),
				"background": ic.get("primaryButton")!.toCSS()
			}, root.nonce),

			new StyleRule(element, ".am5-modal-button.am5-modal-primary:hover", {
				"background": ic.get("primaryButtonHover")!.toCSS()
			}, root.nonce),

		]);

		rules = new CounterDisposer(() => {
			rules = undefined;
			disposer.dispose();
		});
	}

	return rules.increment();
}


export interface IModalSettings extends IEntitySettings {

	/**
	 * HTML content of the modal.
	 */
	content?: string;

	/**
	 * Disables interaction with the chart while the modal is open.
	 *
	 * @default true
	 * @since 5.2.11
	 */
	deactivateRoot?: boolean;

	/**
	 * Name of the dialog for screen readers.
	 *
	 * If not set, the first heading (`<h1>` - `<h6>`) in the content is used.
	 *
	 * @since 5.21.0
	 */
	ariaLabel?: string;

}

export interface IModalPrivate extends IEntityPrivate {
	container: HTMLDivElement;
	curtain: HTMLDivElement;
	wrapper: HTMLDivElement;
	content: HTMLDivElement;
}

export interface IModalEvents extends IEntityEvents {
	/**
	 * The modal was opened.
	 */
	"opened": {}
	/**
	 * The modal was closed with `close()`.
	 */
	"closed": {}
	/**
	 * The modal was cancelled: closed with `cancel()`, a click outside its
	 * content, or the Escape key.
	 */
	"cancelled": {}
}

/**
 * A modal dialog with HTML content, shown over the chart.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/common-elements/modal-popups/} for more info
 */
export class Modal extends Entity {
	public static className: string = "Modal";
	public static classNames: Array<string> = Entity.classNames.concat([Modal.className]);

	declare public _settings: IModalSettings;
	declare public _privateSettings: IModalPrivate;
	declare public _events: IModalEvents;

	//protected _currentPass: number = 0;

	protected _afterNew() {
		// Applying themes because this will not have parents
		super._afterNewApplyThemes();

		// Defaults
		this._setRawDefault("deactivateRoot", true);

		// Load CSS
		modalCSS($utils.getShadowRoot(this._root.dom), this._root);

		// Create elements
		const container = document.createElement("div");
		container.className = "am5-modal";
		container.style.display = "none";
		this.root._inner.appendChild(container);
		this.setPrivate("container", container);

		const curtain = document.createElement("div");
		curtain.className = "am5-modal-curtain";
		container.appendChild(curtain);
		this.setPrivate("curtain", curtain);

		this._disposers.push($utils.addEventListener(curtain, "click", () => {
			this.cancel();
		}));

		const wrapper = document.createElement("div");
		wrapper.className = "am5-modal-wrapper";
		wrapper.setAttribute("role", "dialog");
		wrapper.setAttribute("aria-modal", "true");
		// Takes focus itself when the content has nothing focusable
		wrapper.tabIndex = -1;
		container.appendChild(wrapper);
		this.setPrivate("wrapper", wrapper);

		const content = document.createElement("div");
		content.className = "am5-modal-content";
		wrapper.appendChild(content);
		this.setPrivate("content", content);

		const html = this.get("content");
		if (html) {
			content.innerHTML = this._root._sanitizeHTML(html);
		}

		// Close on ESC
		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
				if (this.isOpen() && $utils.getEventKey(ev) == "Escape") {
					this.cancel();
				}
			}));

			// Keep TAB inside the open modal
			this._disposers.push($utils.addEventListener(wrapper, "keydown", (ev: KeyboardEvent) => {
				if ($utils.getEventKey(ev) == "Tab") {
					const focusables = this._getFocusables();
					if (focusables.length == 0) {
						ev.preventDefault();
						return;
					}
					const first = focusables[0];
					const last = focusables[focusables.length - 1];
					const active = document.activeElement;
					if (ev.shiftKey && (active === first || active === wrapper)) {
						ev.preventDefault();
						last.focus();
					}
					else if (!ev.shiftKey && active === last) {
						ev.preventDefault();
						first.focus();
					}
				}
			}));
		}
	}

	// Element that had focus before the modal opened, to give it back on close
	protected _opener?: Element | null;

	protected _getFocusables(): Array<HTMLElement> {
		const elements = this.getPrivate("content").querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex^='-'])");
		return Array.prototype.filter.call(elements, (el: HTMLElement) => el.offsetWidth > 0 || el.offsetHeight > 0);
	}

	// Names the dialog: `ariaLabel`, or else the content's first heading
	protected _updateLabel(): void {
		const wrapper = this.getPrivate("wrapper");
		const label = this.get("ariaLabel");
		wrapper.removeAttribute("aria-label");
		wrapper.removeAttribute("aria-labelledby");
		if (label) {
			wrapper.setAttribute("aria-label", label);
		}
		else {
			const heading = this.getPrivate("content").querySelector("h1, h2, h3, h4, h5, h6");
			if (heading) {
				if (!heading.id) {
					heading.id = "am5-modal-title-" + this.uid;
				}
				wrapper.setAttribute("aria-labelledby", heading.id);
			}
		}
	}

	// Gives focus back to the element that had it before the modal opened
	protected _restoreFocus(): void {
		const opener = this._opener as HTMLElement | null | undefined;
		this._opener = undefined;
		const active = document.activeElement;
		if (opener && opener.focus && document.contains(opener) && (!active || active === document.body || $utils.contains(this.getPrivate("container"), active))) {
			opener.focus();
		}
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("content")) {
			this.getPrivate("content").innerHTML = this._root._sanitizeHTML(this.get("content", ""));
		}

		if (this.isDirty("content") || this.isDirty("ariaLabel")) {
			this._updateLabel();
		}
	}

	/**
	 * Returns `true` if the modal is open.
	 *
	 * @return  Modal open?
	 */
	public isOpen(): boolean {
		return this.getPrivate("container").style.display != "none";
	}

	/**
	 * Opens the modal.
	 */
	public open(): void {
		if (!this.isOpen()) {
			this._opener = document.activeElement;
		}
		this.getPrivate("container").style.display = "block";
		this._updateLabel();

		// Focus goes into the modal
		const focusables = this._getFocusables();
		(focusables.length ? focusables[0] : this.getPrivate("wrapper")).focus();

		if (this.get("deactivateRoot")) {
			this.setTimeout(() => {
				this._root._renderer.interactionsEnabled = false;
			}, 10);
		}
		this.events.dispatch("opened", {
			type: "opened",
			target: this
		});
	}

	/**
	 * Closes the modal and dispatches `"closed"`.
	 */
	public close(): void {
		this.getPrivate("container").style.display = "none";
		this._restoreFocus();
		if (this.get("deactivateRoot")) {
			this._root._renderer.interactionsEnabled = true;
		}
		this.events.dispatch("closed", {
			type: "closed",
			target: this
		});
	}

	/**
	 * Closes the modal and dispatches `"cancelled"` instead of `"closed"`.
	 */
	public cancel(): void {
		this.getPrivate("container").style.display = "none";
		this._restoreFocus();
		if (this.get("deactivateRoot")) {
			this._root._renderer.interactionsEnabled = true;
		}
		this.events.dispatch("cancelled", {
			type: "cancelled",
			target: this
		});
	}

	/**
	 * Disposes modal.
	 */
	protected _dispose() {
		super._dispose();

		const container = this.getPrivate("container");
		if (container.parentElement) {
			container.parentElement.removeChild(container);
		}
	}
}
