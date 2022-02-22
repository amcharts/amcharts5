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

	if (!rules) {
		const disposer = new MultiDisposer([

			new StyleRule(element, ".am5-modal", {
				"width": "100%",
				"height": "100%",
				"position": "absolute",
				"z-index": "100000",
				"top": "0",
				"left": "0"
			}),

			new StyleRule(element, ".am5-modal-curtain", {
				"top": "0",
				"left": "0",
				"width": "100%",
				"height": "100%",
				"position": "absolute",
				"background": ic.get("background")!.toCSS(0.5),
				"z-index": "100"
			}),

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
			}),

			new StyleRule(element, ".am5-modal-wrapper:before", {
				"content": "''",
				"display": "inline-block",
				"height": "100%",
				"vertical-align": "middle",
				"margin-right": "-0.25em"
			}),

			new StyleRule(element, ".am5-modal-content", {
				"display": "inline-block",
				"padding": "1em",
				"vertical-align": "middle",
				"background": ic.get("background")!.toCSS(),
				"border": "1px solid " + ic.get("alternativeBackground")!.toCSS()
			}),

		]);

		rules = new CounterDisposer(() => {
			rules = undefined;
			disposer.dispose();
		});
	}

	return rules.increment();
}


export interface IModalSettings extends IEntitySettings {
	content?: string;
}

export interface IModalPrivate extends IEntityPrivate {
	container: HTMLDivElement;
	curtain: HTMLDivElement;
	wrapper: HTMLDivElement;
	content: HTMLDivElement;
}

export interface IModalEvents extends IEntityEvents {
	"opened": {}
	"closed": {}
	"cancelled": {}
}

/**
 * Used to display a modal dialog with HTML content.
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

		$utils.addEventListener(curtain, "click", () => {
			this.cancel();
		});

		const wrapper = document.createElement("div");
		wrapper.className = "am5-modal-wrapper";
		container.appendChild(wrapper);
		this.setPrivate("wrapper", wrapper);

		const content = document.createElement("div");
		content.className = "am5-modal-content";
		wrapper.appendChild(content);
		this.setPrivate("content", content);

		const html = this.get("content");
		if (html) {
			content.innerHTML = html;
		}

		// Close on ESC
		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
				if (this.isOpen() && ev.keyCode == 27) {
					this.cancel();
				}
			}));
		}
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("content")) {
			this.getPrivate("content").innerHTML = this.get("content", "");
		}
	}

	/**
	 * Returns `true` if modal is currently open.
	 * 
	 * @return  Modal open?
	 */
	public isOpen(): boolean {
		return this.getPrivate("container").style.display != "none";
	}

	/**
	 * Opens modal.
	 */
	public open(): void {
		this.getPrivate("container").style.display = "block";
		this.events.dispatch("opened", {
			type: "opened",
			target: this
		});
	}

	/**
	 * Closes modal.
	 */
	public close(): void {
		this.getPrivate("container").style.display = "none";
		this.events.dispatch("closed", {
			type: "closed",
			target: this
		});
	}

	/**
	 * Closes modal and invokes `cancelled` event.
	 */
	public cancel(): void {
		this.getPrivate("container").style.display = "none";
		this.events.dispatch("cancelled", {
			type: "cancelled",
			target: this
		});
	}

	/**
	 * Disposes modal.
	 */
	public dispose() {
		super.dispose();
		this.root.dom.removeChild(this.getPrivate("container"));
	}

}