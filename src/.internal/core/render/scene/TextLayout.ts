/** @ignore *//** */

import type { IBounds } from "../../util/IBounds";
import type { ITextStyle } from "../backend/Renderer";
import type { Color } from "../../util/Color";
import { Percent } from "../../util/Percent";
import { TextFormatter, ITextChunk } from "../../util/TextFormatter";
import * as $utils from "../../util/Utils";
import * as $array from "../../util/Array";
import * as $type from "../../util/Type";


/**
 * What text layout measures with. A canvas 2D context in the chart's DOM is
 * one: it resolves relative font sizes (`em`) against the page like the layer
 * canvases do.
 *
 * @ignore
 */
export interface ITextMeasureContext {
	font: string;
	save(): void;
	restore(): void;
	measureText(text: string): TextMetrics;
}

/**
 * Style fields text layout reads beyond `ITextStyle`.
 *
 * @ignore
 */
export interface ILayoutTextStyle extends ITextStyle {
	fillOpacity?: number;
	ignoreFormatting?: boolean;
}

/**
 * @ignore
 */
export interface ILineChunk {
	style: string | undefined,
	fill: Color | undefined,
	text: string,
	width: number,
	height: number,
	left: number,
	right: number,
	ascent: number,
	offsetX: number,
	offsetY: number,
	textDecoration: string | undefined,
	verticalAlign?: "baseline" | "sub" | "super"
}

/**
 * @ignore
 */
export interface ILine {
	offsetY: number,
	ascent: number,
	width: number,
	height: number,
	left: number,
	right: number,
	textChunks: Array<ILineChunk>,
}

/**
 * Layout results that belong to the text's display object. Layout reads the
 * current values and updates them in place.
 *
 * @ignore
 */
export interface ITextLayoutState {
	lines: Array<ILine>;
	textVisible: boolean;
	truncated?: boolean;
	scale: number;
	originalScale?: number;
}

/**
 * CSS font string for `style`, overridden by `style2` (a rich-text format).
 *
 * @ignore
 */
export function getFontStyle(style: ITextStyle, style2: ITextStyle | undefined, ignoreFontWeight: boolean, inheritedFontFamily: () => string): string {
	let fontStyle: string[] = [];

	if (style2 && style2.fontVariant) {
		fontStyle.push(style2.fontVariant);
	}
	else if (style.fontVariant) {
		fontStyle.push(style.fontVariant);
	}

	if (!ignoreFontWeight) {
		if (style2 && style2.fontWeight) {
			fontStyle.push(style2.fontWeight);
		}
		else if (style.fontWeight) {
			fontStyle.push(style.fontWeight);
		}
	}

	if (style2 && style2.fontStyle) {
		fontStyle.push(style2.fontStyle);
	}
	else if (style.fontStyle) {
		fontStyle.push(style.fontStyle);
	}

	if (style2 && style2.fontSize) {
		style2.fontSize = fontSizeToCSS(style2.fontSize);
		fontStyle.push(style2.fontSize);
	}
	else if (style.fontSize) {
		style.fontSize = fontSizeToCSS(style.fontSize);
		fontStyle.push(style.fontSize);
	}

	if (style.fontFamily == "inherit") {
		fontStyle.push(inheritedFontFamily());
	}
	else if (style2 && style2.fontFamily) {
		fontStyle.push(style2.fontFamily);
	}
	else if (style.fontFamily) {
		fontStyle.push(style.fontFamily);
	}
	else if (fontStyle.length) {
		fontStyle.push("Arial");
	}

	return fontStyle.join(" ");
}

/**
 * A font size as CSS: a plain number, also one in a string (`"8"`), is in
 * pixels.
 *
 * @ignore
 */
export function fontSizeToCSS(fontSize: string | number): string {
	if ($type.isNumber(fontSize) || /^\s*\d*\.?\d+\s*$/.test(fontSize)) {
		return parseFloat(fontSize + "") + "px";
	}
	return fontSize;
}

const RELATIVE_FONT = /[\d.](r?em|%|ex|ch|v[wh])(?![a-z])|\b(smaller|larger|(xx?-)?small|medium|(xx?-)?large)\b/i;

/**
 * `font` with a relative size (em, %) in pixels, as `context` resolves it.
 *
 * @ignore
 */
export function resolveFont(context: CanvasRenderingContext2D, font: string): string {
	if (!RELATIVE_FONT.test(font)) {
		return font;
	}
	context.save();
	// A font the context rejects leaves this one, so it is easy to tell
	context.font = "1px am5-unresolved";
	context.font = font;
	const resolved = context.font;
	context.restore();
	return resolved.indexOf("am5-unresolved") === -1 ? resolved : font;
}

/**
 * How far below `baseline` the alphabetic baseline is in `font`, i.e. how much
 * lower text goes when drawn at the alphabetic baseline instead.
 *
 * @ignore
 */
export function baselineShift(context: CanvasRenderingContext2D, font: string, baseline: CanvasTextBaseline): number {
	context.save();
	context.font = font;
	context.textBaseline = "alphabetic";
	const alphabetic: any = context.measureText("Hg");
	context.textBaseline = baseline;
	const other: any = context.measureText("Hg");
	context.restore();
	// The font's box does not depend on the glyphs, where browsers have it
	if (alphabetic.fontBoundingBoxAscent != null && other.fontBoundingBoxAscent != null) {
		return alphabetic.fontBoundingBoxAscent - other.fontBoundingBoxAscent;
	}
	return alphabetic.actualBoundingBoxAscent - other.actualBoundingBoxAscent;
}

/**
 * Safari measures without the font weight.
 *
 * @ignore
 */
export function ignoreFontWeight(): boolean {
	return /apple/i.test(navigator.vendor);
}

/**
 * Measures `text` in the context's current font. Horizontal extents follow
 * `style.textAlign`.
 *
 * @ignore
 */
export function measureText(text: string, context: ITextMeasureContext, style: ITextStyle): TextMetrics {
	let metrics = context.measureText(text);
	let fakeMetrics: any = {};
	if (metrics.actualBoundingBoxAscent == null) {
		const div = document.createElement("div");
		div.innerText = text;
		div.style.visibility = "hidden";
		div.style.position = "absolute";
		div.style.top = "-1000000px;"
		div.style.fontFamily = style.fontFamily || "";
		div.style.fontSize = style.fontSize + "";
		document.body.appendChild(div);
		const bbox = div.getBoundingClientRect();
		document.body.removeChild(div);
		const h = bbox.height;
		const w = metrics.width;
		let left = 0;
		let right = w;

		fakeMetrics = {
			actualBoundingBoxAscent: h,
			actualBoundingBoxDescent: 0,
			actualBoundingBoxLeft: left,
			actualBoundingBoxRight: right,
			fontBoundingBoxAscent: h,
			fontBoundingBoxDescent: 0,
			width: w
		}
		//return fake;
	}
	else {
		fakeMetrics = {
			actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
			actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
			actualBoundingBoxLeft: metrics.actualBoundingBoxLeft,
			actualBoundingBoxRight: metrics.actualBoundingBoxRight,
			fontBoundingBoxAscent: metrics.actualBoundingBoxAscent,
			fontBoundingBoxDescent: metrics.actualBoundingBoxDescent,
			width: metrics.width
		}
	}

	const w = metrics.width;
	switch (style.textAlign) {
		case "right":
		case "end":
			fakeMetrics.actualBoundingBoxLeft = w;
			fakeMetrics.actualBoundingBoxRight = 0;
			break;
		case "center":
			fakeMetrics.actualBoundingBoxLeft = w / 2;
			fakeMetrics.actualBoundingBoxRight = w / 2;
			break;
		default:
			fakeMetrics.actualBoundingBoxLeft = 0;
			fakeMetrics.actualBoundingBoxRight = w;
	}

	return fakeMetrics;
}

/**
 * @ignore
 */
export function fitRatio(style: ITextStyle, bounds: IBounds, horizontalOnly: boolean = false): number {
	const maxW = style.maxWidth;
	const maxH = horizontalOnly ? undefined : style.maxHeight;
	if (!$type.isNumber(maxW) && !$type.isNumber(maxH)) {
		return 1;
	}
	const w = bounds.right - bounds.left;
	const h = bounds.bottom - bounds.top;
	return Math.min(maxW! / w || 1, maxH! / h || 1);
}

/**
 * @ignore
 */
export function truncateText(context: ITextMeasureContext, style: ITextStyle, text: string, maxWidth: number, breakWords: boolean = false, fallbackBreakWords: boolean = true): string {
	let width: number;
	do {
		if (breakWords) {
			text = text.slice(0, -1);
		}
		else {
			// A comma directly followed by a digit is a numeric separator (e.g.
			// "1,200,300"), not a word boundary - keep such numbers unbroken.
			let tmp = text.replace(/(?:[^,;:!?\\\/\s​]|,(?=\d))+[,;:!?\\\/\s​]*$/g, "");
			if ((tmp == "" || tmp === text) && fallbackBreakWords) {
				breakWords = true;
			}
			else if (tmp == "") {
				return text;
			}
			else {
				text = tmp;
			}
		}
		const metrics = measureText(text, context, style);
		width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
	} while ((width > maxWidth) && text != "");
	return text;
}

/**
 * Lays out regular text: rich-text chunks, wrapping, truncation, line
 * metrics and the oversized behavior. The context must already carry the
 * base font and alignment.
 *
 * @ignore
 */
export function layoutText(context: ITextMeasureContext, text: string, style: ILayoutTextStyle, fontOf: (format: ITextStyle) => string, state: ITextLayoutState): IBounds {
	const rtl = style.direction == "rtl";

	// Reset text info
	state.lines = [];

	// Init
	const oversizedBehavior = style.oversizedBehavior;
	const maxWidth = style.maxWidth!;

	const truncate = $type.isNumber(maxWidth) && oversizedBehavior == "truncate";
	const wrap = $type.isNumber(maxWidth) && (oversizedBehavior == "wrap" || oversizedBehavior == "wrap-no-break");

	// Get default font metrix
	const refText = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";

	// Split up text into lines
	const lines = text.toString().replace(/\r/g, "").split(/\n/);
	let styleRestored = true;
	let minX = 0;
	let maxX = 0;

	// Iterate through the lines
	let offsetY = 0;
	let currentStyle: string | undefined;
	$array.each(lines, (line, _index) => {

		// Split up line into format/value chunks
		let chunks: ITextChunk[];
		if (line == "") {
			chunks = [{
				type: "value",
				text: ""
			}];
		}
		else {
			chunks = TextFormatter.chunk(line, false, style.ignoreFormatting);
		}

		while (chunks.length > 0) {

			// Init line object
			let lineInfo: ILine = {
				offsetY: offsetY,
				ascent: 0,
				width: 0,
				height: 0,
				left: 0,
				right: 0,
				textChunks: []
			};

			// Measure reference text
			const metrics = measureText(refText, context, style);

			const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
			lineInfo.height = height;
			lineInfo.ascent = metrics.actualBoundingBoxAscent;

			let currentFormat: string;
			let currentDecoration: string | undefined = style.textDecoration;
			let currentFill: Color | undefined;
			let currentChunkWidth: number | undefined;
			let skipFurtherText = false;
			let firstTextChunk = true;
			let leftoverChunks: Array<ITextChunk> = [];
			let currentVerticalAlign: "baseline" | "sub" | "super" | undefined;

			$array.eachContinue(chunks, (chunk, index) => {

				// Format chunk
				if (chunk.type == "format") {
					if (chunk.text == "[/]") {
						if (!styleRestored) {
							context.restore();
							styleRestored = true;
						}
						currentFill = undefined;
						currentStyle = undefined;
						currentChunkWidth = undefined;
						currentDecoration = style.textDecoration;
						currentVerticalAlign = undefined
						currentFormat = chunk.text;
					}
					else {

						if (!styleRestored) {
							context.restore();
						}

						let format = TextFormatter.getTextStyle(chunk.text);
						const fontStyle = fontOf(format);
						context.save();
						context.font = fontStyle;
						currentStyle = fontStyle;
						currentFormat = chunk.text;
						if (format.textDecoration) {
							currentDecoration = format.textDecoration;
						}
						if (format.fill) {
							currentFill = <Color>format.fill;
						}
						if ((<any>format).width) {
							currentChunkWidth = $type.toNumber((<any>format).width);
						}
						if (format.verticalAlign) {
							currentVerticalAlign = format.verticalAlign;
						}
						styleRestored = false;

						// Measure reference text after change of format
						const metrics = measureText(refText, context, style);
						const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
						if (height > lineInfo.height) {
							lineInfo.height = height;
						}
						if (metrics.actualBoundingBoxAscent > lineInfo.ascent) {
							lineInfo.ascent = metrics.actualBoundingBoxAscent;
						}
					}
				}

				// Text chunk
				else if (chunk.type == "value" && !skipFurtherText) {

					// Measure
					const metrics = measureText(chunk.text, context, style);
					let chunkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;

					// Check for fit
					if (truncate) {

						state.truncated = undefined;

						// Break words?
						let breakWords = firstTextChunk || style.breakWords || false;

						// Measure ellipsis and check if it fits
						const ellipsis = style.ellipsis || "";
						const ellipsisMetrics = measureText(ellipsis, context, style);
						const ellipsisWidth = ellipsisMetrics.actualBoundingBoxLeft + ellipsisMetrics.actualBoundingBoxRight;

						// Check fit
						if ((lineInfo.width + chunkWidth) > maxWidth) {
							const excessWidth = maxWidth - lineInfo.width - ellipsisWidth;
							chunk.text = truncateText(context, style, chunk.text, excessWidth, breakWords);
							chunk.text += ellipsis;
							skipFurtherText = true;
							state.truncated = true;
						}

					}
					else if (wrap) {
						// Check fit
						if ((lineInfo.width + chunkWidth) > maxWidth) {
							const excessWidth = maxWidth - lineInfo.width;
							const tmpText = truncateText(
								context,
								style,
								chunk.text,
								excessWidth,
								false,
								(firstTextChunk && style.oversizedBehavior != "wrap-no-break")
							);

							if (tmpText == "") {
								// Unable to fit a single letter - hide the whole label
								state.textVisible = true;
								return false;
							}

							// truncateText() may return text that still overflows (a single
							// word wider than the remaining space when word-breaking is not
							// allowed). If the line already has content, move the WHOLE chunk
							// to the next line instead of letting it overflow.
							if (!firstTextChunk) {
								const tmpMetrics = measureText($utils.trim(tmpText), context, style);
								const tmpWidth = tmpMetrics.actualBoundingBoxLeft + tmpMetrics.actualBoundingBoxRight;
								if (tmpWidth > excessWidth) {
									leftoverChunks = chunks.slice(index);
									if (currentFormat) {
										leftoverChunks.unshift({
											type: "format",
											text: currentFormat
										});
									}
									chunks = [];
									return false;
								}
							}
							//skipFurtherText = true;

							//Add remaining chunks for the next line
							leftoverChunks = chunks.slice(index + 1);

							//Add remaining text of current chunk if it was forced-cut
							if ($utils.trim(tmpText) != $utils.trim(chunk.text)) {
								leftoverChunks.unshift({
									type: "value",
									text: chunk.text.substr(tmpText.length)
								});
								if (currentFormat) {
									leftoverChunks.unshift({
										type: "format",
										text: currentFormat
									});
								}
							}

							// Set current chunk (truncated)
							chunk.text = $utils.trim(tmpText);

							chunks = [];
							skipFurtherText = true;
						}

					}

					// Chunk width?
					let leftBoundMod = 1;
					let rightBoundMod = 1;
					if (currentStyle && currentChunkWidth && (currentChunkWidth > chunkWidth)) {
						// increase horizontal bounding boxes accordingly
						const boundsMod = chunkWidth / currentChunkWidth
						switch (style.textAlign) {
							case "right":
							case "end":
								leftBoundMod = boundsMod;
								break;
							case "center":
								leftBoundMod = boundsMod;
								rightBoundMod = boundsMod;
								break;
							default:
								rightBoundMod = boundsMod;
						}
						chunkWidth = currentChunkWidth;
					}

					const chunkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

					if (chunkHeight > lineInfo.height) {
						lineInfo.height = chunkHeight;
					}
					if (metrics.actualBoundingBoxAscent > lineInfo.ascent) {
						lineInfo.ascent = metrics.actualBoundingBoxAscent;
					}

					lineInfo.width += chunkWidth;
					lineInfo.left += metrics.actualBoundingBoxLeft / leftBoundMod;
					lineInfo.right += metrics.actualBoundingBoxRight / rightBoundMod;
					lineInfo.textChunks.push({
						style: currentStyle,
						fill: currentFill,
						text: chunk.text,
						width: chunkWidth,
						height: chunkHeight,
						left: metrics.actualBoundingBoxLeft,
						right: metrics.actualBoundingBoxRight,
						ascent: metrics.actualBoundingBoxAscent,
						offsetX: 0,
						offsetY: 0,
						textDecoration: currentDecoration,
						verticalAlign: currentVerticalAlign
					});

					firstTextChunk = false;

				}

				return true;
			});

			if (style.lineHeight instanceof Percent) {
				lineInfo.height *= style.lineHeight.value;
				lineInfo.ascent *= style.lineHeight.value;
			}
			else {
				lineInfo.height *= style.lineHeight || 1.2;
				lineInfo.ascent *= style.lineHeight || 1.2;
			}

			if (minX < lineInfo.left) {
				minX = lineInfo.left;
			}

			if (maxX < lineInfo.right) {
				maxX = lineInfo.right;
			}

			state.lines.push(lineInfo);

			offsetY += lineInfo.height;

			// Reset chunks so that it can proceed to the next line
			chunks = leftoverChunks || [];
		}

	});

	if (!styleRestored) {
		context.restore();
	}

	// Adjust chunk internal offsets
	$array.each(state.lines, (lineInfo, _index: number) => {
		let currentChunkOffset = 0
		$array.each(lineInfo.textChunks, (chunk) => {
			chunk.offsetX = currentChunkOffset + chunk.left - lineInfo.left;
			chunk.offsetY += lineInfo.height - lineInfo.height * (style.baselineRatio || 0.19);
			currentChunkOffset += chunk.width * (rtl ? -1 : 1);

			if (chunk.verticalAlign) {
				switch (chunk.verticalAlign) {
					case "super":
						chunk.offsetY -= lineInfo.height / 2 - chunk.height / 2;
						break;
					case "sub":
						chunk.offsetY += chunk.height / 2;
						break;
				}
			}
		});
	});

	const bounds = {
		left: rtl ? -maxX : -minX,
		top: 0,
		right: rtl ? minX : maxX,
		bottom: offsetY,
	};


	// We need to fit?
	if (oversizedBehavior !== "none") {
		const ratio = fitRatio(style, bounds, oversizedBehavior == "truncate");
		if (ratio < 1) {
			if (oversizedBehavior == "fit") {
				if ($type.isNumber(style.minScale) && (ratio < style.minScale)) {
					state.textVisible = false;
					bounds.left = 0;
					bounds.top = 0;
					bounds.right = 0;
					bounds.bottom = 0;
				}
				else {
					if (!state.originalScale) {
						state.originalScale = state.scale;
					}
					state.scale = ratio;
					state.textVisible = true;
				}
			}
			else if (oversizedBehavior == "hide") {
				state.textVisible = false;
				bounds.left = 0;
				bounds.top = 0;
				bounds.right = 0;
				bounds.bottom = 0;
			}
			else {
				switch (style.textAlign) {
					case "right":
					case "end":
						bounds.left = rtl ? maxWidth : -maxWidth;
						bounds.right = 0;
						break;
					case "center":
						bounds.left = -maxWidth / 2;
						bounds.right = maxWidth / 2;
						break;
					default:
						bounds.left = 0;
						bounds.right = rtl ? -maxWidth : maxWidth;
				}

				state.scale = state.originalScale || 1;
				state.originalScale = undefined;
				state.textVisible = true;
			}
		}
		else {
			state.scale = state.originalScale || 1;
			state.originalScale = undefined;
			state.textVisible = true;
		}
	}

	return bounds;
}

/**
 * Lays out circular text one glyph at a time. The context must already carry
 * the base font.
 *
 * @ignore
 */
export function layoutCircularText(context: ITextMeasureContext, text: string, style: ILayoutTextStyle, fontOf: (format: ITextStyle) => string, state: ITextLayoutState): IBounds {
	const rtl = style.direction == "rtl";

	// Reset text info
	state.textVisible = true;
	state.lines = [];

	const oversizedBehavior = style.oversizedBehavior;
	const maxWidth = style.maxWidth!;

	const truncate = $type.isNumber(maxWidth) && oversizedBehavior == "truncate";
	const ellipsis = style.ellipsis || "";
	let ellipsisMetrics: TextMetrics;

	// Split up text into lines
	const lines = text.toString().replace(/\r/g, "").split(/\n/);
	let styleRestored = true;
	let totalWidth = 0;

	// Iterate through the lines
	let offsetY = 0;
	$array.each(lines, (line, _index) => {

		// Split up line into format/value chunks
		let chunks = TextFormatter.chunk(line, false, style.ignoreFormatting);

		// Init line object
		let lineInfo: ILine = {
			offsetY: offsetY,
			ascent: 0,
			width: 0,
			height: 0,
			left: 0,
			right: 0,
			textChunks: []
		};

		let currentStyle: string | undefined;
		let currentFill: Color | undefined;
		let currentChunkWidth: number | undefined;

		$array.each(chunks, (chunk, _index) => {

			// Format chunk
			if (chunk.type == "format") {
				if (chunk.text == "[/]") {
					if (!styleRestored) {
						context.restore();
						styleRestored = true;
					}
					currentFill = undefined;
					currentStyle = undefined;
					currentChunkWidth = undefined;
				}
				else {
					let format = TextFormatter.getTextStyle(chunk.text);
					const fontStyle = fontOf(format);
					context.save();
					context.font = fontStyle;
					currentStyle = fontStyle;
					if (format.fill) {
						currentFill = <Color>format.fill;
					}
					if ((<any>format).width) {
						currentChunkWidth = $type.toNumber((<any>format).width);
					}
					styleRestored = false;
				}

				if (truncate) {
					ellipsisMetrics = measureText(ellipsis, context, style);
				}
			}

			// Text format
			else if (chunk.type == "value") {

				// Measure each letter
				let chars = chunk.text.match(/./ug) || [];
				if (rtl) {
					chars = $utils.splitString(chunk.text);
					chars.reverse();
				}

				for (let i = 0; i < chars.length; i++) {

					const char = chars[i];

					// Measure
					const metrics = measureText(char, context, style);
					let chunkWidth = metrics.width;

					// Chunk width?
					if (currentStyle && currentChunkWidth && (currentChunkWidth > chunkWidth)) {
						chunkWidth = currentChunkWidth;
					}

					const chunkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
					if (chunkHeight > lineInfo.height) {
						lineInfo.height = chunkHeight;
					}
					if (metrics.actualBoundingBoxAscent > lineInfo.ascent) {
						lineInfo.ascent = metrics.actualBoundingBoxAscent;
					}

					totalWidth += chunkWidth;

					// Handle oversized behavior
					if (truncate) {
						// Measure ellipsis and check if it fits
						if (!ellipsisMetrics) {
							ellipsisMetrics = measureText(ellipsis, context, style);
						}
						const ellipsisWidth = ellipsisMetrics.actualBoundingBoxLeft + ellipsisMetrics.actualBoundingBoxRight;
						if ((totalWidth + ellipsisWidth) > maxWidth) {
							if (lineInfo.textChunks.length == 1) {
								state.textVisible = false;
							}
							else {
								lineInfo.width += ellipsisWidth;
								lineInfo.left += ellipsisMetrics.actualBoundingBoxLeft;
								lineInfo.right += ellipsisMetrics.actualBoundingBoxRight;
								lineInfo.textChunks.push({
									style: currentStyle,
									fill: currentFill,
									text: ellipsis,
									width: ellipsisWidth,
									height: chunkHeight + ellipsisMetrics.actualBoundingBoxDescent,
									left: ellipsisMetrics.actualBoundingBoxLeft,
									right: ellipsisMetrics.actualBoundingBoxRight,
									ascent: ellipsisMetrics.actualBoundingBoxAscent,
									offsetX: 0,
									offsetY: chunkHeight,
									textDecoration: undefined
								});
							}
							break;
						}
					}

					lineInfo.width += chunkWidth;
					lineInfo.left += metrics.actualBoundingBoxLeft;
					lineInfo.right += metrics.actualBoundingBoxRight;
					lineInfo.textChunks.push({
						style: currentStyle,
						fill: currentFill,
						text: char,
						width: chunkWidth,
						height: chunkHeight + metrics.actualBoundingBoxDescent,
						left: metrics.actualBoundingBoxLeft,
						right: metrics.actualBoundingBoxRight,
						ascent: metrics.actualBoundingBoxAscent,
						offsetX: 0,
						offsetY: chunkHeight,
						textDecoration: undefined
					});

				}

			}
		});

		if (style.lineHeight instanceof Percent) {
			lineInfo.height *= style.lineHeight.value;
		}
		else {
			lineInfo.height *= style.lineHeight || 1.2;
		}

		state.lines.push(lineInfo);

		offsetY += lineInfo.height;

	});

	if (!styleRestored) {
		context.restore();
	}


	if (oversizedBehavior == "hide" && (totalWidth > maxWidth)) {
		state.textVisible = false;
	}

	// Adjust chunk internal offsets
	$array.each(state.lines, (lineInfo) => {
		$array.each(lineInfo.textChunks, (chunk) => {
			chunk.offsetY += Math.round((lineInfo.height - chunk.height + (lineInfo.ascent - chunk.ascent)) / 2);
		});
	});

	return {
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
	};
}
