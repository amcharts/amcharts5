import type { Root } from "../Root";
import { Text } from "../render/Text";
import type { Color } from "../util/Color";
import type { Percent } from "../util/Percent";
import { p50, p100 } from "../util/Percent";
import { Container, IContainerPrivate, IContainerSettings } from "./Container";
import type { Template } from "../../core/util/Template";
import * as  $array from "../../core/util/Array";
import type { DataItem } from "./Component";


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
	 * @type {[type]}
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

	// The following migh be supported some day:
	// padding?: number;
	// stroke?: number;
	// strokeThickness?: number;
	// trim?: number;
	// wordWrap?: boolean;
	// dropShadow?: boolean;
	// dropShadowAlpha?: number;
	// dropShadowAngle?: number;
	// dropShadowBlur?: number;
	// dropShadowColor?: number;
	// dropShadowDistance?: number;
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

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Label["_settings"], template?: Template<Label>): Label {
		const x = new Label(root, settings, true, template);
		x._afterNew();
		return x;
	}

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
		// "dropShadow",
		// "dropShadowAlpha",
		// "dropShadowAngle",
		// "dropShadowBlur",
		// "dropShadowColor",
		// "dropShadowDistance",
		"fontVariant",
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
		"role"
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

			this.text.set("x", x);
		}
	}

	protected _setMaxDimentions() {
		const rotation = this.get("rotation");
		const vertical = rotation == 90 || rotation == 270;

		const maxWidth = this.get("maxWidth", Infinity);
		if (maxWidth) {
			this.text.set(vertical ? "maxHeight" : "maxWidth", maxWidth - this.get("paddingLeft", 0) - this.get("paddingRight", 0));
		}
		else {
			this.text.set(vertical ? "maxHeight" : "maxWidth", undefined);
		}

		const maxHeight = this.get("maxHeight", Infinity);
		if (maxHeight) {
			this.text.set(vertical ? "maxWidth" : "maxHeight", maxHeight - this.get("paddingTop", 0) - this.get("paddingBottom", 0));
		}
		else {
			this.text.set(vertical ? "maxWidth" : "maxHeight", undefined);
		}
	}

	public _setDataItem(dataItem: DataItem<unknown>): void {
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
