import type { Color } from "../util/Color";
import type { Percent } from "../util/Percent";
import type { DataItem, IComponentDataItem } from "./Component";
import type { Gradient } from "../render/gradients/Gradient";

import { Text } from "../render/Text";
import { p50, p100 } from "../util/Percent";
import { Container, IContainerPrivate, IContainerSettings, IContainerEvents } from "./Container";

import * as  $array from "../../core/util/Array";
import * as  $type from "../../core/util/Type";


export interface ILabelSettings extends IContainerSettings {

	/**
	 * Labels' text.
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/formatters/text-styling/} for text styling info
	 * 
	 */
	text?: string;

	/**
	 * Text color.
	 */
	fill?: Color;

	/**
	 * Text opacity.
	 *
	 * @default 1
	 * @ince 5.2.39
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
	 * Alignment.
	 */
	textAlign?: "start" | "end" | "left" | "right" | "center";

	/**
	 * Font family to use for the label.
	 *
	 * Multiple fonts can be separated by commas.
	 */
	fontFamily?: string;

	/**
	 * Font size in misc any supported CSS format (pixel, point, em, etc.).
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
	 * Text decoration.
	 *
	 * Supported options `"underline"`, `"line-through"`.
	 *
	 * @since 5.0.15
	 */
	textDecoration?: "underline" | "line-through";

	/**
	 * Line height in percent or absolute pixels.
	 */
	lineHeight?: Percent | number;

	/**
	 * How mouch of the height should be considered to go below baseline.
	 *
	 * @default 0.19
	 */
	baselineRatio?: number;

	/**
	 * Opacity of the label.
	 *
	 * 0 - fully transparent; 1 - fully opaque.
	 */
	opacity?: number;

	/**
	 * Text direction.
	 *
	 * @default "ltr"
	 */
	direction?: "ltr" | "rtl";

	/**
	 * A base line to use when aligning text chunks vertically.
	 */
	textBaseline?: "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";

	/**
	 * How to handle labels that do not fit into its designated space.
	 *
	 * LIMITATIONS: on circular labels, the only values supported are `"hide"` and
	 * `"truncate"`. The latter will ignore `breakWords` setting.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/labels/#Oversized_text} for more info
	 */
	oversizedBehavior?: "none" | "hide" | "fit" | "wrap" | "wrap-no-break" | "truncate";

	/**
	 * Whether words can be broken when truncating or wrapping text.
	 *
	 * @default false
	 */
	breakWords?: boolean;

	/**
	 * Ellipsis characters to use when truncating text.
	 *
	 * Will use Unicode ellipsis symbol (`"…"`) by default, which might not be
	 * available in all fonts. If ellipsis looks broken, use different
	 * characters. E.g.:
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
	 * Minimum relative scale allowed for label when scaling down
	 * when `oversizedBehavior` is set to `"fit"`.
	 *
	 * If fitting the label would require it to scale beyond `minScale` it would
	 * be hidden instead.
	 */
	minScale?: number;

	/**
	 * If set to `true` the label will parse `text` for data placeholders and
	 * will try to populate them with actual data.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/labels/#Data_placeholders} for more info
	 */
	populateText?: boolean;

	/**
	 * If set to `true`, will ignore in-line formatting blocks and will display
	 * text exactly as it is.
	 *
	 * @default false
	 */
	ignoreFormatting?: boolean;

	/**
	 * Color of the element's shadow.
	 *
	 * For this to work at least one of the following needs to be set as well:
	 * `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowColor?: Color | null;

	/**
	 * Blurriness of the the shadow.
	 *
	 * The bigger the number, the more blurry shadow will be.
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
	 * Opacity of the shadow (0-1).
	 *
	 * If not set, will use the same as `fillOpacity` of the element.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/shadows/} for more info
	 */
	shadowOpacity?: number;

	/**
	 * Maximum number of characters to allow in label.
	 *
	 * If the `text` is longer than `maxChars`, the text will be truncated
	 * using the `breakWords` and `ellipsis` settings.
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
 * Creates a label with support for in-line styling and data bindings.
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
			const propValue = this.get(property as any);
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

	public _updateChildren() {
		super._updateChildren();

		const text = this._text;

		$array.each(this._textKeys, (property) => {
			this._text.set(property as any, this.get(property as any));
		})

		if (this.isDirty("maxWidth") || this.isDirty("maxHeight") || this.isDirty("rotation")) {
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
		const rotation = this.get("rotation");
		const vertical = rotation == 90 || rotation == 270 || rotation == -90;
		const text = this._text;

		const maxWidth = this.get("maxWidth", this.getPrivate("maxWidth", Infinity));
		if ($type.isNumber(maxWidth)) {
			text.set(vertical ? "maxHeight" : "maxWidth", maxWidth - this.get("paddingTop", 0) - this.get("paddingBottom", 0));
		}
		else {
			text.set(vertical ? "maxHeight" : "maxWidth", undefined);
		}

		const maxHeight = this.get("maxHeight", this.getPrivate("maxHeight", Infinity));
		if ($type.isNumber(maxHeight)) {
			text.set(vertical ? "maxWidth" : "maxHeight", maxHeight - this.get("paddingLeft", 0) - this.get("paddingRight", 0));
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
	 * Returns text with populated placeholders and formatting if `populateText` is
	 * set to `true`.
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
