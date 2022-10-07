import type { Color } from "../util/Color";
import type { Percent } from "../util/Percent";
import type { IText } from "./backend/Renderer";
import type { IBounds } from "../util/IBounds";
import type { DataItem, IComponentDataItem } from "./Component";

import { Sprite, ISpriteSettings, ISpritePrivate } from "./Sprite";
import { populateString } from "../util/PopulateString";

import * as $array from "../util/Array";

/**
 * @ignore Text is an internal class. Use Label instead.
 */
export interface ITextSettings extends ISpriteSettings {
	text?: string;
	fill?: Color;
	textAlign?: "start" | "end" | "left" | "right" | "center";
	fontFamily?: string;
	fontSize?: string | number;
	fontWeight?: "normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
	fontStyle?: "normal" | "italic" | "oblique";
	fontVariant?: "normal" | "small-caps";
	textDecoration?: "underline" | "line-through";
	shadowColor?: Color | null;
	shadowBlur?: number;
	shadowOffsetX?: number;
	shadowOffsetY?: number;
	shadowOpacity?: number;
	// leading?: number;
	// letterSpacing?: number;
	lineHeight?: Percent | number;
	baselineRatio?: number;
	// stroke?: number;
	// strokeThickness?: number;
	// trim?: number;
	// wordWrap?: boolean;
	opacity?: number;
	direction?: "ltr" | "rtl";
	textBaseline?: "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";
	oversizedBehavior?: "none" | "hide" | "fit" | "wrap" | "wrap-no-break" | "truncate";
	breakWords?: boolean;
	ellipsis?: string;
	minScale?: number;
	populateText?: boolean;
	ignoreFormatting?: boolean;
}

/**
 * @ignore
 */
export interface ITextPrivate extends ISpritePrivate {

	/**
	 * @ignore
	 */
	tooltipElement?: HTMLDivElement;

}

/**
 * @ignore Text is an internal class. Use Label instead.
 */
export class Text extends Sprite {

	declare public _settings: ITextSettings;
	declare public _privateSettings: ITextPrivate;

	public textStyle = this._root._renderer.makeTextStyle();

	public _display: IText = this._root._renderer.makeText("", this.textStyle);

	protected _textStyles: Array<keyof ITextSettings> = [
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
		"minScale"
	];

	protected _originalScale: number | undefined;

	public static className: string = "Text";
	public static classNames: Array<string> = Sprite.classNames.concat([Text.className]);

	public _updateBounds(): void {
		if (!this.get("text")) {

			let newBounds: IBounds = {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
			};
			this._adjustedLocalBounds = newBounds;
		}
		else {
			super._updateBounds();
		}
	}

	public _changed() {
		super._changed();

		this._display.clear();

		let textStyle = <any>this.textStyle;

		if (this.isDirty("opacity")) {
			let opacity = this.get("opacity", 1);
			this._display.alpha = opacity;
		}

		if (this.isDirty("text") || this.isDirty("populateText")) {
			this._display.text = this._getText();

			this.markDirtyBounds();
			if (this.get("role") == "tooltip") {
				this._root.updateTooltip(this);
			}
		}

		if (this.isDirty("width")) {
			textStyle.wordWrapWidth = this.width();
			this.markDirtyBounds();
		}

		if (this.isDirty("oversizedBehavior")) {
			textStyle.oversizedBehavior = this.get("oversizedBehavior", "none");
			this.markDirtyBounds();
		}

		if (this.isDirty("breakWords")) {
			textStyle.breakWords = this.get("breakWords", false);
			this.markDirtyBounds();
		}

		if (this.isDirty("ellipsis")) {
			textStyle.ellipsis = this.get("ellipsis");
			this.markDirtyBounds();
		}

		if (this.isDirty("ignoreFormatting")) {
			textStyle.ignoreFormatting = this.get("ignoreFormatting", false);
			this.markDirtyBounds();
		}

		if (this.isDirty("minScale")) {
			textStyle.minScale = this.get("minScale", 0);
			this.markDirtyBounds();
		}

		if (this.isDirty("fill")) {
			let fill = this.get("fill");
			if (fill) {
				textStyle.fill = fill;
			}
		}

		if (this.isDirty("maxWidth") || this.isPrivateDirty("maxWidth")) {
			textStyle.maxWidth = this.get("maxWidth", this.getPrivate("maxWidth"));
			this.markDirtyBounds();
		}

		if (this.isDirty("maxHeight") || this.isPrivateDirty("maxHeight")) {
			textStyle.maxHeight = this.get("maxHeight", this.getPrivate("maxHeight"));
			this.markDirtyBounds();
		}

		$array.each(this._textStyles, (styleName) => {
			if (this._dirty[styleName]) {
				textStyle[styleName] = this.get(styleName);
				this.markDirtyBounds();
			}
		})

		textStyle["fontSize"] = this.get("fontSize");
		textStyle["fontFamily"] = this.get("fontFamily");
		this._display.style = textStyle;

		if (this.isDirty("role") && this.get("role") == "tooltip") {
			this._root.updateTooltip(this);
		}
	}

	public _getText(): string {
		const text = this.get("text", "");
		return this.get("populateText") ? populateString(this, text) : text;
	}

	public markDirtyText(): void {
		this._display.text = this._getText();
		if (this.get("role") == "tooltip") {
			this._root.updateTooltip(this);
		}
		this.markDirtyBounds();
		this.markDirty();
	}

	public _setDataItem(dataItem?: DataItem<IComponentDataItem>): void {
		super._setDataItem(dataItem);
		if (this.get("populateText")) {
			this.markDirtyText();
		}
	}
}
