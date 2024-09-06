import { Label, ILabelPrivate, ILabelSettings, ILabelEvents } from "./Label";
import { Container } from "./Container";
import { RoundedRectangle } from "./RoundedRectangle";
import { Percent } from "../util/Percent"
import { color } from "../util/Color";


import * as $utils from "../util/Utils"
import * as $type from "../util/Type"
import * as $array from "../util/Array"

export interface IEditableLabelSettings extends ILabelSettings {

	/**
	 * Start editing on click (`"click"`; default) or double-click ('"dblclick"').
	 *
	 * All available options:
	 *
	 * *`"click"` (default)
	 * *`"dblclick"`
	 * *`"rightclick"`
	 * *`"middleclick"`
	 * *`"none"`
	 *
	 * @default "click"
	 */
	editOn?: "click" | "dblclick" | "rightclick" | "middleclick" | "none";

	/**
	 * Allow multiple lines (`true` - dfault) or no (`false`).
	 *
	 * @default true
	 * @since 5.9.6
	 */
	multiLine?: boolean;

}

export interface IEditableLabelPrivate extends ILabelPrivate {
	input: Container;
	textarea: HTMLTextAreaElement;
}

export interface IEditableLabelEvents extends ILabelEvents {
	inited: {};
}

/**
 * Editable label.
 *
 * @since 5.9.5
 */
export class EditableLabel extends Label {

	declare public _settings: IEditableLabelSettings;
	declare public _privateSettings: IEditableLabelPrivate;
	declare public _events: IEditableLabelEvents;

	public static className: string = "EditableLabel";
	public static classNames: Array<string> = Label.classNames.concat([EditableLabel.className]);

	protected _afterNew() {
		super._afterNew();

		const input = this.children.push(Container.new(this._root, {
			html: "<textarea class=\"am5-editable-label\"></textarea>",
			isMeasured: false
		}));

		input.hide();

		const editOn: any = this.get("editOn", "click");

		if (editOn != "none") {
			input.events.on(editOn, (_ev) => {
				// this is here just to make it interactive
			});

			this.events.on(editOn, (_ev) => {
				this.set("active", true);
			});
		}

		this.setPrivate("input", input);

		// Set background
		let background = this.get("background");

		if (!background) {
			background = this.set("background", RoundedRectangle.new(this._root, {
				themeTags: ["editablelabel", "background"]
			}));
		}
		else {
			background.set("themeTags", ["editablelabel", "background"]);
		}

	}

	public _prepareChildren() {
		super._prepareChildren();
		this._maybeInitTextarea();
	}

	public _updateChildren() {
		super._updateChildren();

		if (this.isDirty("active")) {

			const editing = this.get("active", false);
			if (editing) {
				this._startEditing();
			}
			else {
				this._stopEditing();
			}

			const bg = this.get("background");
			if (bg) {
				bg.set("active", editing);
			}
		};

		this._syncText();
		this._syncStyle();
	}

	protected _maybeInitTextarea() {
		if (!this._isInited()) {
			const input = this.getPrivate("input");
			if (input && input.getPrivate("htmlElement")) {
				const el = input.getPrivate("htmlElement")!;
				const textarea = el.querySelector(".am5-editable-label") as HTMLTextAreaElement;
				if (textarea) {
					this.setPrivate("textarea", textarea as HTMLTextAreaElement);

					// Resize textarea on keypress
					textarea.addEventListener("input", _ev => {
						if (this.get("multiLine") === false) {
							// replace line breaks with spaces for single-line labels
							textarea.value = textarea.value.replace(/\n/g, " ");
						}
						this.set("text", textarea.value);
						this._syncStyle();
					});

					// Finish editing on blur
					textarea.addEventListener("blur", _ev => this.set("active", false));

					// Finish editing on ESC press
					if ($utils.supports("keyboardevents")) {
						this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
							if ($utils.getEventKey(ev) == "Escape") {
								this.set("active", false);
							}
						}));
					}

					// Intercept ENTER if necessary
					this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
						if ($utils.getEventKey(ev) == "Enter" && this.get("multiLine") === false) {
							// Single-line label, save instead of breaking into new line
							ev.preventDefault();
							this.set("active", false);
						}
					}));

					this.events.dispatch("inited", {
						type: "inited",
						target: this
					});
				}
			}
		}
	}

	protected _isInited(): boolean {
		return this.getPrivate("textarea") ? true : false;
	}

	protected _startEditing() {
		if (!this._isInited()) {
			this.events.once("inited", () => {
				this._startEditing();
			});
			return;
		}
		this._text.set("opacity", 0);
		const input = this.getPrivate("input");
		const textarea = this.getPrivate("textarea");
		if (textarea) {
			if (this.get("text", "") == "") {
				this.set("text", " ");
			}
			input.show(0);
			this.setTimeout(() => {
				// size textarea to fit its actual content
				this._syncStyle();
				textarea.focus();
			}, 100);
		}
	}

	protected _stopEditing() {
		if (!this._isInited()) {
			this.events.once("inited", () => {
				this._stopEditing();
			});
			return;
		}
		const input = this.getPrivate("input");
		const textarea = this.getPrivate("textarea");
		if (textarea) {
			this.set("text", textarea.value);
			input.hide(0);
			this._text.set("opacity", 1);
		}
	}

	protected _syncStyle() {
		const input = this.getPrivate("input");
		const textarea = this.getPrivate("textarea");
		if (textarea) {
			// Set up HTML
			const el = input.getPrivate("htmlElement")!;

			// Reset all styles
			const computedStyles = window.getComputedStyle(textarea);
			$array.each(computedStyles, (style: any) => {
				textarea.style[style] = "initial";
			});

			// Remove textarea attributes
			textarea.style.color = this.get("fill", color(0x000000)).toCSS(this.get("fillOpacity", 1));
			textarea.style.backgroundColor = "rgba(0, 0, 0, 0)";
			textarea.style.border = "none";
			textarea.style.outline = "none";
			textarea.style.padding = "0";

			// Wrapping
			textarea.wrap = "off";
			textarea.style.resize = "none";

			// Place carret under mouse cursor
			// @todo

			// Size
			textarea.style.overflow = "hidden";
			const maxWidth = this.get("maxWidth", 0) - this.get("paddingLeft", 0) - this.get("paddingRight", 0);
			if (maxWidth > 0) {
				textarea.style.maxWidth = maxWidth + "px";
			}
			else {
				// The actual minWidth will be set on frameend
				textarea.style.minWidth = "";
			}

			textarea.style.height = "auto";
			textarea.style.minHeight = textarea.scrollHeight + "px";

			// If width is explicitly set on a label, use it for textarea
			if (this.get("width")) {
				textarea.style.width = (this.width()  - this.get("paddingLeft", 0) - this.get("paddingRight", 0)) + "px";
				textarea.style.minWidth = "";
			}

			// Line height
			const lineHeight = this.get("lineHeight");
			if (!lineHeight) {
				textarea.style.lineHeight = "1.2";
			}
			else if (lineHeight instanceof Percent) {
				textarea.style.lineHeight = lineHeight.value + "";
			}
			else if ($type.isNumber(lineHeight)) {
				textarea.style.lineHeight = lineHeight + "";
			}

			// Font stuff
			let fontFamily: any = this.get("fontFamily");
			if (!fontFamily) {
				fontFamily = getComputedStyle(input.getPrivate("htmlElement")!, "font-family").getPropertyValue("font-family");
			}
			textarea.style.fontFamily = fontFamily;

			let fontSize: any = this.get("fontSize");
			if (!fontSize) {
				fontSize = getComputedStyle(input.getPrivate("htmlElement")!, "font-size").getPropertyValue("font-size");
			}
			else if ($type.isNumber(fontSize)) {
				fontSize = fontSize + "px";
			}
			else {
				fontSize = fontSize;
			}
			textarea.style.fontSize = fontSize;

			let fontWeight: any = this.get("fontWeight");
			if (!fontWeight) {
				fontWeight = getComputedStyle(input.getPrivate("htmlElement")!, "font-weight").getPropertyValue("font-weight");
			}
			else {
				fontWeight = fontWeight;
			}
			textarea.style.fontWeight = fontWeight;

			let fontStyle: any = this.get("fontStyle");
			if (!fontStyle) {
				fontStyle = getComputedStyle(input.getPrivate("htmlElement")!, "font-style").getPropertyValue("font-style");
			}
			else {
				fontStyle = fontStyle;
			}
			textarea.style.fontStyle = fontStyle;

			const oversizeBehavior = this.get("oversizedBehavior");
			if (oversizeBehavior == "wrap") {
				textarea.style.whiteSpace = "pre-wrap";
			}
			else {
				textarea.style.whiteSpace = "nowrap";
			}

			// Adjust textarea postion based on textAlign setting
			this._root.events.on("frameended", () => {

				if (textarea.style.minWidth == "") {
					textarea.style.minWidth = (textarea.scrollWidth + 20) + "px";
				}

				const textAlign = this.get("textAlign", "start");
				if (textAlign == "center") {
					textarea.style.textAlign = "center";
					if (!el.style.transform.match(/translateX/) && !this.get("width")) {
						el.style.transform += " translateX(-50%)";
					}
				}
				else if (textAlign == "end") {
					textarea.style.textAlign = "right";
					if (!el.style.transform.match(/translateX/) && !this.get("width")) {
						el.style.transform += " translateX(-100%)";
					}
				}
				else {
					textarea.style.textAlign = textAlign;
				}
			});

		}
	}

	protected _syncText() {
		const textarea = this.getPrivate("textarea");
		let text = this.get("text", "");
		if (text == " ") {
			text = "";
		}
		if (textarea) {
			textarea.value = text;
		}
	}

}