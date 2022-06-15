import { Color } from "./Color"
import type { ITextStyle } from "../render/backend/Renderer"
import * as $type from "./Type";

/**
 * Defines an interface for an object that holds a chunk of text.
 */
export interface ITextChunk {

	/**
	 * Type of the chunk.
	 */
	"type": "value" | "text" | "format" | "image",

	/**
	 * Text.
	 */
	"text": string

}

export class TextFormatter {

	public static prefix = "__amcharts__";

	/**
	 * Replaces brackets with temporary placeholders.
	 *
	 * @ignore Exclude from docs
	 * @param text  Input text
	 * @return Escaped text
	 */
	public static escape(text: string): string {
		return text.
			replace(/\[\[/g, this.prefix + "1").
			replace(/([^\/\]]{1})\]\]/g, "$1" + this.prefix + "2").
			replace(/\]\]/g, this.prefix + "2").
			replace(/\{\{/g, this.prefix + "3").
			replace(/\}\}/g, this.prefix + "4").
			replace(/\'\'/g, this.prefix + "5");
	}

	/**
	 * Replaces placeholders back to brackets.
	 *
	 * @ignore Exclude from docs
	 * @param text  Escaped text
	 * @return Unescaped text
	 */
	public static unescape(text: string): string {
		return text.
			replace(new RegExp(this.prefix + "1", "g"), "[[").
			replace(new RegExp(this.prefix + "2", "g"), "]]").
			replace(new RegExp(this.prefix + "3", "g"), "{{").
			replace(new RegExp(this.prefix + "4", "g"), "}}").
			replace(new RegExp(this.prefix + "5", "g"), "''");
	}

	/**
	 * Cleans up the text text for leftover double square brackets.
	 *
	 * @ignore Exclude from docs
	 * @param text  Input text
	 * @return Cleaned up text
	 */
	public static cleanUp(text: string): string {
		return text.
			replace(/\[\[/g, "[").
			replace(/\]\]/g, "]").
			replace(/\{\{/g, "{").
			replace(/\}\}/g, "}").
			replace(/\'\'/g, "'");
	}

	/**
	 * Splits string into chunks. (style blocks, quoted blocks, regular blocks)
	 *
	 * If the second parameter `quotedBlocks` is set to `true` this method will
	 * also single out text blocks enclosed within single quotes that no
	 * formatting should be applied to, and they should be displayed as is.
	 *
	 * Default for the above is `false`, so that you can use single quote in text
	 * without escaping it.
	 *
	 * If enabled, single quotes can be escaped by doubling it - adding two
	 * single quotes, which will be replaced by a one single quote in the final
	 * output.
	 *
	 * @ignore Exclude from docs
	 * @param text          Text to chunk
	 * @param quotedBlocks  Use quoted blocks
	 * @param noFormatting  Formatting blocks will be treated as regular text
	 * @return Array of string chunks
	 */
	public static chunk(text: string, quotedBlocks: boolean = false, noFormatting: boolean = false): ITextChunk[] {

		// Init result
		let res: ITextChunk[] = [];

		// Replace double (escaped) square spaces and quotes with temporary codes
		text = this.escape(text);

		// Deal with style blocks
		let chunks = quotedBlocks ? text.split("'") : [text];
		for (let i: number = 0; i < chunks.length; i++) {
			let chunk = chunks[i];

			// Empty?
			if (chunk === "") {
				continue;
			}

			if ((i % 2) === 0) {

				// Text outside quotes
				// Parse for style blocks which are "text" chunks, the rest chunks are
				// "value"

				chunk = chunk.replace(/\]\[/g, "]" + $type.PLACEHOLDER + "[");
				chunk = chunk.replace(/\[\]/g, "[ ]");
				let chunks2 = chunk.split(/[\[\]]+/);
				for (let i2: number = 0; i2 < chunks2.length; i2++) {
					let chunk2 = this.cleanUp(this.unescape(chunks2[i2]));

					// Placeholder?
					if (chunk2 === $type.PLACEHOLDER) {
						continue;
					}

					// Empty?
					if (chunk2 === "") {
						continue;
					}

					// Block or value
					if ((i2 % 2) === 0) {
						res.push({
							"type": "value",
							"text": chunk2
						});
					}
					else {
						res.push({
							"type": noFormatting ? "value" : "format",
							"text": "[" + chunk2 + "]"
						});
					}
				}

			}
			else {

				// A text within doublequotes
				// All chunks are "text"

				let chunks2 = chunk.split(/[\[\]]+/);
				for (let i2: number = 0; i2 < chunks2.length; i2++) {
					let chunk2 = this.cleanUp(this.unescape(chunks2[i2]));

					// Empty?
					if (chunk2 === "") {
						continue;
					}

					// Block or text
					if ((i2 % 2) === 0) {
						res.push({
							"type": "text",
							"text": chunk2
						});
					}
					else if (this.isImage(chunk2)) {
						res.push({
							"type": "image",
							"text": "[" + chunk2 + "]"
						});
					}
					else {
						res.push({
							"type": "format",
							"text": "[" + chunk2 + "]"
						});
					}
				}

			}
		}

		return res;
	}

	/**
	 * Checks if supplied format contains image information and should be
	 * formatted as such.
	 * I.e.: `[img: myImage.png]`
	 *
	 * @ignore
	 * @param  text  Format
	 * @return true if it is an image
	 */
	public static isImage(text: string): boolean {
		return text.match(/img[ ]?:/) ? true : false;
	}

	public static getTextStyle(style: string): ITextStyle {

		// let textStyle: string[] = [];
		// let textFill: string | undefined;
		let format: ITextStyle = {};

		if (style == "" || style == "[ ]") {
			return {};
		}

		// Pre-process quoted text
		const q = style.match(/('[^']*')|("[^"]*")/gi);
		if (q) {
			for (let i: number = 0; i < q.length; i++) {
				style = style.replace(q[i], q[i].replace(/['"]*/g, "").replace(/[ ]+/g, "+"));
			}
		}

		// Get style parts
		let b: string[] | null = style.match(/([\w\-]*:[\s]?[^;\s\]]*)|(\#[\w]{1,6})|([\w\-]+)|(\/)/gi);

		// Empty?
		if (!b) {
			return {};
		}

		// Check each part
		for (let i: number = 0; i < b.length; i++) {

			if (b[i].match(/^(normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900)$/i)) {
				(<any>format).fontWeight = b[i];
			}
			else if (b[i].match(/^(underline|line-through)$/i)) {
				(<any>format).textDecoration = b[i];
			}
			else if (b[i] == "/") {
				// Just closing tag
				// Do nothing
			}
			else if (!b[i].match(/:/)) {
				// Color
				format.fill = Color.fromString(b[i]);
			}
			else {
				const p = b[i].replace("+", " ").split(/:[ ]*/);
				(<any>format)[p[0]] = p[1];
				//textStyle.push(b[i].replace(/^[a-zA-Z]:[ ]*/, ""));
				//b[i] = b[i].replace(/\+/g, " ");
			}

		}

		return format;
	}

}
