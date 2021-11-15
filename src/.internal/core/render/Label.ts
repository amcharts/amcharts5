import type { Color } from "../util/Color";
import type { Percent } from "../util/Percent";
import type { DataItem, IComponentDataItem } from "./Component";

import { Text } from "../render/Text";
import { p50, p100 } from "../util/Percent";
import { Container, IContainerPrivate, IContainerSettings } from "./Container";

import * as  $array from "../../core/util/Array";
import * as  $type from "../../core/util/Type";


export interface ILabelSettings extends IContainerSettings {

	/**
	 * Labels' text.
	 */
	text?: string;

	/**
	 * Text color.
	 */
	fill?: Color;

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
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/labels/#Oversized_text} for more info
	 */
	oversizedBehavior?: "none" | "hide" | "fit" | "wrap" | "truncate";

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

/**
 * Creates a label with support for in-line styling and data bindings.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/common-elements/labels/} for more info
 */
export class Label extends Container {

	declare public _settings: ILabelSettings;
	declare public _privateSettings: ILabelPrivate;

	protected _text!: Text;

	protected _textKeys: Array<string> = [
		"text",
		"fill",
		"textAlign",
		"fontFamily",
		"fontSize",
		"fontStyle",
		"fontWeight",
		"fontStyle",
		"fontVariant",
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
		"ignoreFormatting"
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
		})
	}

	public _makeText() {
		this._text = this.children.push(Text.new(this._root, {}));
	}

	public _updateChildren() {
		super._updateChildren();

		$array.each(this._textKeys, (property) => {
			this._text.set(property as any, this.get(property as any));
		})

		if (this.isDirty("maxWidth")) {
			this._setMaxDimentions();
		}

		if (this.isDirty("maxHeight")) {
			this._setMaxDimentions();
		}

		if (this.isDirty("rotation")) {
			this._setMaxDimentions();
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
					x = this.get("paddingLeft");
				}
				else if (textAlign == "right" || textAlign == "end") {
					x = -this.get("paddingRight");
				}
			}

			this.text.set("x", x);
		}
	}

	protected _setMaxDimentions() {
		const rotation = this.get("rotation");
		const vertical = rotation == 90 || rotation == 270;

		const maxWidth = this.get("maxWidth", Infinity);
		if ($type.isNumber(maxWidth)) {
			this.text.set(vertical ? "maxWidth" : "maxHeight", maxWidth - this.get("paddingLeft", 0) - this.get("paddingRight", 0));
		}
		else {
			this.text.set(vertical ? "maxWidth" : "maxHeight", undefined);
		}

		const maxHeight = this.get("maxHeight", Infinity);
		if ($type.isNumber(maxHeight)) {
			this.text.set(vertical ? "maxHeight" : "maxWidth", maxHeight - this.get("paddingTop", 0) - this.get("paddingBottom", 0));
		}
		else {
			this.text.set(vertical ? "maxHeight" : "maxWidth", undefined);
		}
	}

	public _setDataItem(dataItem: DataItem<IComponentDataItem>): void {
		super._setDataItem(dataItem);
		if (this.text.get("populateText")) {
			this.text.markDirtyText();
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
}
