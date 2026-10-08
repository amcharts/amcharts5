import type { Color } from "../util/Color";
import type { Percent } from "../util/Percent";
import type { DataItem, IComponentDataItem } from "./Component";
import type { Gradient } from "../render/gradients/Gradient";

import { Text } from "../render/Text";
import { p50, p100 } from "../util/Percent";
import { Container, IContainerPrivate, IContainerSettings, IContainerEvents } from "./Container";

import * as  $array from "../../core/util/Array";
import * as  $type from "../../core/util/Type";
import * as  $math from "../../core/util/Math";


export interface ILabelSettings extends IContainerSettings {

	/**
	 * The label's text. It can hold in-line formatting and, with
	 * `populateText`, data placeholders.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/text-styling/} for text styling info
	 *
	 */
	text?: string;

	/**
	 * Text color.
	 */
	fill?: Color;

	/**
	 * Text opacity, from `0` (transparent) to `1` (opaque).
	 *
	 * @default 1
	 * @since 5.2.39
	 */
	fillOpacity?: number;

	/**
	 * Fill gradient.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/gradients/} for more information
	 * @since 5.10.1
	 */
	fillGradient?: Gradient;

	/**
	 * Horizontal alignment of the text's lines.
	 */
	textAlign?: "start" | "end" | "left" | "right" | "center";

	/**
	 * Font family, or a comma-separated list of them.
	 *
	 * `"inherit"` uses the font of the chart's container element (since
	 * `5.17.3`).
	 */
	fontFamily?: string;

	/**
	 * Font size: a number in pixels, or any CSS size, such as `"1em"` or
	 * `"12pt"`.
	 */
	fontSize?: string | number;

	/**
	 * Font weight.
	 */
	fontWeight?: "normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

	/**
	 * Font style.
	 */
	fontStyle?: "normal" | "italic" | "oblique";

	/**
	 * Font variant.
	 */
	fontVariant?: "normal" | "small-caps";

	/**
	 * Text decoration: `"underline"` or `"line-through"`.
	 *
	 * @since 5.0.15
	 */
	textDecoration?: "underline" | "line-through";

	/**
	 * Line height as a multiple of the font's line height: a number, such as
	 * `1.5`, or a percent, such as `am5.percent(150)`. If not set, it is `1.2`.
	 */
	lineHeight?: Percent | number;

	/**
	 * Share of the line height that lies below the text's baseline.
	 *
	 * @default 0.19
	 */
	baselineRatio?: number;

	/**
	 * Opacity of the label, from `0` (transparent) to `1` (opaque).
	 */
	opacity?: number;

	/**
	 * Text direction.
	 *
	 * @default "ltr"
	 */
	direction?: "ltr" | "rtl";

	/**
	 * The baseline the text is aligned to vertically, as in the canvas
	 * `textBaseline`.
	 */
	textBaseline?: "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";

	/**
	 * What to do with text that does not fit the label's `maxWidth` (or
	 * `maxHeight`): `"hide"` it, `"fit"` it by scaling it down, `"wrap"` it
	 * onto more lines, wrap it without breaking words (`"wrap-no-break"`), or
	 * `"truncate"` it with an ellipsis.
	 *
	 * LIMITATIONS: on circular labels, the only values supported are `"hide"` and
	 * `"truncate"`. The latter will ignore `breakWords` setting.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/labels/#Oversized_text} for more info
	 */
	oversizedBehavior?: "none" | "hide" | "fit" | "wrap" | "wrap-no-break" | "truncate";

	/**
	 * Lets truncation cut words in the middle. Wrapping does not use it.
	 *
	 * @default false
	 */
	breakWords?: boolean;

	/**
	 * Characters added at the end of truncated text.
	 *
	 * The default Unicode ellipsis (`"…"`) is missing from some fonts. If it
	 * looks broken, use other characters, e.g.:
	 *
	 * ```TypeScript
	 * label.set("ellipsis", "...");
	 * ```
	 * ```JavaScript
	 * label.set("ellipsis", "...");
	 * ```
	 *
	 *
	 * @default "…"
	 */
	ellipsis?: string;

	/**
	 * Smallest scale, from `0` to `1`, that `oversizedBehavior: "fit"` may
	 * shrink the text to. Text that would need to shrink more is hidden.
	 */
	minScale?: number;

	/**
	 * Fills data placeholders in `text`, such as `{value}`, with values from
	 * the label's data item.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/labels/#Data_placeholders} for more info
	 *
	 * @default false
	 */
	populateText?: boolean;

	/**
	 * Shows `text` exactly as it is, without applying in-line formatting
	 * blocks such as `[bold]`.
	 *
	 * @default false
	 */
	ignoreFormatting?: boolean;

	/**
	 * Color of the text's shadow. It shows only when `shadowBlur`,
	 * `shadowOffsetX` or `shadowOffsetY` is set too.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowColor?: Color | null;

	/**
	 * Blurriness of the shadow: the bigger the number, the blurrier the shadow.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowBlur?: number;

	/**
	 * Horizontal shadow offset in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOffsetX?: number;

	/**
	 * Vertical shadow offset in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOffsetY?: number;

	/**
	 * Opacity of the shadow, from `0` to `1`. If not set, the shadow takes the
	 * opacity of the text.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOpacity?: number;

	/**
	 * Maximum number of characters in the label. A longer `text` is cut, using
	 * the `breakWords` and `ellipsis` settings.
	 *
	 * @since 5.7.2
	 */
	maxChars?: number;

	// The following migh be supported some day:
	// padding?: number;
	// stroke?: number;
	// strokeThickness?: number;
	// trim?: number;
	// wordWrap?: boolean;
	// leading?: number;
	// letterSpacing?: number;
}

export interface ILabelPrivate extends IContainerPrivate {
}

export interface ILabelEvents extends IContainerEvents {
}

/**
 * A text element with padding and an optional background. Its text can hold
 * in-line formatting and data placeholders.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/labels/} for more info
 */
export class Label extends Container {

	declare public _settings: ILabelSettings;
	declare public _privateSettings: ILabelPrivate;
	declare public _events: ILabelEvents;

	protected _text!: Text;

	protected _textKeys: Array<string> = [
		"text",
		"fill",
		"fillGradient",
		"fillOpacity",
		"textAlign",
		"fontFamily",
		"fontSize",
		"fontStyle",
		"fontWeight",
		"fontStyle",
		"fontVariant",
		"textDecoration",
		"shadowColor",
		"shadowBlur",
		"shadowOffsetX",
		"shadowOffsetY",
		"shadowOpacity",
		// "leading",
		// "letterSpacing",
		"lineHeight",
		"baselineRatio",
		//"padding",
		// "stroke",
		// "strokeThickness",
		// "trim",
		// "wordWrap",
		"direction",
		"textBaseline",
		"oversizedBehavior",
		"breakWords",
		"ellipsis",
		"minScale",
		"populateText",
		"role",
		"ignoreFormatting",
		"maxChars",
		"ariaLabel"
	];

	public static className: string = "Label";
	public static classNames: Array<string> = Container.classNames.concat([Label.className]);

	/**
	 * @ignore Text is not to be used directly
	 */
	public get text(): Text {
		return this._text;
	}

	protected _afterNew() {
		super._afterNew();

		this._makeText();

		$array.each(this._textKeys, (property) => {
			const propValue = this._getTextKeyValue(property);
			if (propValue != undefined) {
				this._text.set(property as any, propValue);
			}
		});

		if (this.get("html", "") !== "") {
			this._text.set("text", "");
		}

		this.onPrivate("maxWidth", () => {
			this._setMaxDimentions();
		});

		this.onPrivate("maxHeight", () => {
			this._setMaxDimentions();
		});
	}

	public _makeText() {
		this._text = this.children.push(Text.new(this._root, {}));
	}

	/**
	 * Returns the value to push downstream to the [[Text]] for a given key.
	 *
	 * For the font settings (`fontFamily`/`fontSize`/`fontWeight`) the label's
	 * own value is used only when it was explicitly set on the label
	 * (`isUserSetting`) or when there is no matching `Root` setting. Otherwise a
	 * `Root`-level default takes precedence, so it overrides theme values but
	 * never an explicit per-label value.
	 */
	protected _getTextKeyValue(property: string): any {
		if (property === "fontFamily" || property === "fontSize" || property === "fontWeight") {
			if (!this.isUserSetting(property as any)) {
				const rootValue = (this._root.settings as any)[property];
				if (rootValue != undefined) {
					return rootValue;
				}
			}
		}
		return this.get(property as any);
	}

	public _updateChildren() {
		super._updateChildren();

		const text = this._text;

		$array.each(this._textKeys, (property) => {
			this._text.set(property as any, this._getTextKeyValue(property));
		})

		if (this.isDirty("maxWidth") || this.isDirty("maxHeight") || this.isDirty("rotation") || this.isDirty("paddingLeft") || this.isDirty("paddingRight") || this.isDirty("paddingTop") || this.isDirty("paddingBottom")) {
			this._setMaxDimentions();
		}

		// Do not show regular text if HTML is used
		if (this.get("html", "") !== "") {
			text.set("text", "");
		}
		else {
			text.set("text", this.get("text"));
			this._maybeUpdateHTMLColor();
		}

		if (this.isDirty("fill") || this.isDirty("fillGradient")) {
			this._maybeUpdateHTMLColor();
		}

		if (this.isDirty("textAlign") || this.isDirty("width")) {
			const textAlign = this.get("textAlign");
			let x: number | Percent | undefined;
			if (this.get("width") != null) {
				if (textAlign == "right") {
					x = p100;
				}
				else if (textAlign == "center") {
					x = p50;
				}
				else {
					x = 0;
				}
			}
			else {
				if (textAlign == "left" || textAlign == "start") {
					x = this.get("paddingLeft", 0);
				}
				else if (textAlign == "right" || textAlign == "end") {
					x = -this.get("paddingRight", 0);
				}
			}

			text.set("x", x);
		}

		const background = this.get("background");
		if (background) {
			background.setPrivate("visible", text._display.textVisible);
		}
	}

	protected _maybeUpdateHTMLColor() {
		const htmlElement = this.getPrivate("htmlElement");
		if (htmlElement && this.get("fill")) {
			htmlElement.style.color = this.get("fill")!.toCSSHex();
			//@todo support gradient
		}
	}

	protected _setMaxDimentions() {
		const rotation = $math.normalizeAngle(this.get("rotation", 0));
		const vertical = rotation == 90 || rotation == 270;
		const text = this._text;

		// Padding is in the label's own frame: its width is padded left and right,
		// its height top and bottom. Turned upright, its width runs up the screen
		const paddingAcross = this.get("paddingLeft", 0) + this.get("paddingRight", 0);
		const paddingUp = this.get("paddingTop", 0) + this.get("paddingBottom", 0);

		const maxWidth = this.get("maxWidth", this.getPrivate("maxWidth", Infinity));
		if ($type.isNumber(maxWidth)) {
			text.set(vertical ? "maxHeight" : "maxWidth", maxWidth - (vertical ? paddingUp : paddingAcross));
		}
		else {
			text.set(vertical ? "maxHeight" : "maxWidth", undefined);
		}

		const maxHeight = this.get("maxHeight", this.getPrivate("maxHeight", Infinity));
		if ($type.isNumber(maxHeight)) {
			text.set(vertical ? "maxWidth" : "maxHeight", maxHeight - (vertical ? paddingAcross : paddingUp));
		}
		else {
			text.set(vertical ? "maxWidth" : "maxHeight", undefined);
		}

		this.root.events.once("frameended", () => {
			text.markDirtyBounds();
		});
	}

	public _setDataItem(dataItem?: DataItem<IComponentDataItem>): void {
		super._setDataItem(dataItem);
		this._markDirtyKey("text");
		this._markDirtyKey("html");
		const text = this._text;
		if (text.get("populateText")) {
			text.markDirtyText();
		}
		const html = this.get("html");
		if (html && html !== "") {
			this._updateHTMLContent();
		}
	}

	/**
	 * Returns the label's text, with data placeholders filled in when
	 * `populateText` is `true`.
	 *
	 * @return Populated text
	 */
	public getText(): string {
		return this._text._getText();
	}

	/**
	 * Returns "aria-label" text with populated placeholders and formatting
	 * if `populateText` is set to `true`.
	 *
	 * @return Populated text
	 */
	public getAccessibleText(): string {
		return this._text._getAccessibleText();
	}
}
