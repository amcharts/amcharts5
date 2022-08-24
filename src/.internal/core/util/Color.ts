import { range, Time } from "./Animation";
import * as $utils from "./Utils";
import * as $type from "./Type";

/**
 * @ignore
 */
function string2hex(string: string): number {
	//string = cssColorNames[string.toLowerCase()] || string;

	if (string[0] === "#") {
		string = string.substr(1);
	}
	if (string.length == 3) {
		string = string[0].repeat(2) + string[1].repeat(2) + string[2].repeat(2);
	}

	return parseInt(string, 16);
}

/**
 * @ignore
 */
export function rgba2hex(color: string): number {
	color = color.replace(/[ ]/g, "");

	// Init
	let matches: string[] | null = color.match(/^rgb\(([0-9]*),([0-9]*),([0-9]*)\)/i);

	// Try rgb() format
	if (matches) {
		matches.push("1");

	} else {
		matches = color.match(/^rgba\(([0-9]*),([0-9]*),([0-9]*),([.0-9]*)\)/i);

		if (!matches) {
			return 0x000000;
		}
	}

	let hex = "";
	for (let i = 1; i <= 3; i++) {
		let val = parseInt(matches[i]).toString(16);
		if (val.length == 1) {
			val = "0" + val;
		}
		hex += val;
	}

	return string2hex(hex);

}

/**
 * Returns a new [[Color]] object base on input.
 *
 * Accepts parameters in CSS hex or rgb/rtba strings, or hex numbers.
 *
 * * `"#f00"`
 * * `"#ff0000"`
 * * `"rgb(255, 0, 0)"`
 * * `"rgba(255, 0, 0, 1)"`
 * * `0xff0000`
 * 
 * @param   input  Input color
 * @return         Color
 */
export function color(input: number | string): Color {
	return Color.fromAny(input);
}

/**
 * Wherever color needs to be specified in amCharts 5, `Color` object needs to
 * be used.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/} for more info
 * @important
 */
export class Color {
	protected _hex: number;

	private constructor(hex: number) {
		this._hex = hex | 0;
	}

	/**
	 * Color numeric value.
	 */
	public get hex(): number {
		return this._hex;
	}

	/**
	 * Value of color's R channel.
	 * @return R value
	 */
	public get r(): number {
		return this._hex >>> 16;
	}

	/**
	 * Value of color's G channel.
	 * @return G value
	 */
	public get g(): number {
		return (this._hex >> 8) & 0xFF;
	}

	/**
	 * Value of color's B channel.
	 * @return B value
	 */
	public get b(): number {
		return this._hex & 0xFF;
	}

	/**
	 * Returns color CSS representation in form of `rgba(r, g, b, a)` string.
	 * 
	 * @param   alpha  Opacity
	 * @return         CSS string
	 */
	public toCSS(alpha: number = 1): string {
		return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + alpha + ")";
	}

	/**
	 * Returns color CSS representation in form of `#rgb` string.
	 * 
	 * @return         CSS string
	 */
	public toCSSHex(): string {
		return "#" + $utils.padString(this.r.toString(16), 2) + $utils.padString(this.g.toString(16), 2) + $utils.padString(this.b.toString(16), 2);
	}

	/**
	 * Returns color's HSL info.
	 * @param   alpha Opacity
	 * @return        HSL info
	 */
	public toHSL(alpha: number = 1): $utils.iHSL {
		return $utils.rgbToHsl({
			r: this.r,
			g: this.g,
			b: this.b,
			a: alpha
		})
	}

	/**
	 * Converts HSL values into a new [[Color]] object.
	 *
	 * @param   h H value
	 * @param   s S value
	 * @param   l L value
	 * @return    Color object
	 */
	public static fromHSL(h: number, s: number, l: number): Color {
		const rgb = $utils.hslToRgb({
			h: h,
			s: s,
			l: l
		});
		return this.fromRGB(rgb.r, rgb.g, rgb.b);
	}

	public toString(): string {
		return this.toCSSHex();
	}

	/**
	 * Converts hex number into a new [[Color]] object.
	 *
	 * ```TypeScript
	 * Color.fromHex(0xff0000) // red
	 * ```
	 * ```JavaScript
	 * Color.fromHex(0xff0000) // red
	 * ```
	 *
	 * @param   hex  Hex color
	 * @return       Color
	 */
	public static fromHex(hex: number): Color {
		return new Color(hex);
	}

	/**
	 * Converts RGB values to a new [[Color]] object.
	 *
	 * @param   r  R value
	 * @param   g  G value
	 * @param   b  B value
	 * @return     Color
	 */
	public static fromRGB(r: number, g: number, b: number): Color {
		return new Color((b | 0) + (g << 8) + (r << 16));
	}

	/**
	 * Converts RGB string to a new [[Color]] object.
	 *
	 * ```TypeScript
	 * Color.fromString("#ff0000") // red
	 * ```
	 * ```JavaScript
	 * Color.fromString("#ff0000") // red
	 * ```
	 *
	 * @param   s  RGB string
	 * @return     Color
	 */
	public static fromString(s: string): Color {
		return new Color(string2hex(s));
	}

	/**
	 * Converts CSS rgba() syntax to a new [[Color]] object.
	 *
	 * ```TypeScript
	 * Color.fromCSS("rgba(255, 0, 0, 1)") // red
	 * ```
	 * ```JavaScript
	 * Color.fromCSS("rgba(255, 0, 0, 1)") // red
	 * ```
	 *
	 * @param  {string} s [description]
	 * @return {Color}    [description]
	 */
	public static fromCSS(s: string): Color {
		return new Color(rgba2hex(s));
	}

	/**
	 * Convert to color from virtually anything.
	 *
	 * Will throw an exception if unable to resolve the color.
	 *
	 * @param   s  Source
	 * @return     Color
	 */
	public static fromAny(s: string | number | Color): Color {
		if ($type.isString(s)) {
			if (s[0] == "#") {
				return Color.fromString(s);
			}
			else if (s.substr(0, 3) == "rgb") {
				return Color.fromCSS(s);
			}
		}
		else if ($type.isNumber(s)) {
			return Color.fromHex(s);
		}
		else if (s instanceof Color) {
			return Color.fromHex(s.hex);
		}

		throw new Error("Unknown color syntax: " + s);
	}

	/**
	 * Returns a new [[Color]] object based on either `lightAlternative` or
	 * `darkAlternative` depending on which one is more contrasting with
	 * the `color`.
	 *
	 * @param   color             Reference color
	 * @param   lightAlternative  Light color
	 * @param   darkAlternative   Dark color
	 * @return                    Alternative color
	 */
	public static alternative(color: Color, lightAlternative?: Color, darkAlternative?: Color): Color {
		const rgb = $utils.alternativeColor(
			{ r: color.r, g: color.g, b: color.b },
			lightAlternative ? { r: lightAlternative.r, g: lightAlternative.g, b: lightAlternative.b } : undefined,
			darkAlternative ? { r: darkAlternative.r, g: darkAlternative.g, b: darkAlternative.b } : undefined
		);
		return this.fromRGB(rgb.r, rgb.g, rgb.b);
	}

	/**
	 * Returns an intermediate Color between two reference colors depending on
	 * the progress (`diff`) between the two.
	 *
	 * @param   diff  Progress
	 * @param   from  Source color
	 * @param   to    Target color
	 * @param   mode  Interpolation mode
	 * @return        Color
	 */
	public static interpolate(diff: Time, from: Color, to: Color, mode: "rgb" | "hsl" = "rgb"): Color {
		if (mode == "hsl") {
			const fromHSL = from.toHSL();
			const toHSL = to.toHSL();
			return Color.fromHSL(
				range(diff, fromHSL.h, toHSL.h),
				range(diff, fromHSL.s, toHSL.s),
				range(diff, fromHSL.l, toHSL.l)
			);
		}
		else {
			return Color.fromRGB(
				range(diff, from.r, to.r),
				range(diff, from.g, to.g),
				range(diff, from.b, to.b)
			);
		}
	}

	/**
	 * Returns a new [[Color]] lightened by `percent` value.
	 *
	 * Use negative value to darken the color.
	 *
	 * @param   color    Source color
	 * @param   percent  Percent
	 * @return           New color
	 */
	public static lighten(color: Color, percent: number): Color {
		const rgb = $utils.lighten({ r: color.r, g: color.g, b: color.b }, percent);
		return Color.fromRGB(rgb!.r, rgb!.g, rgb!.b);
	}

	/**
	 * Returns a new [[Color]] brightened by `percent` value.
	 *
	 * Use negative value to dim the color.
	 *
	 * @param   color    Source color
	 * @param   percent  Percent
	 * @return           New color
	 */
	public static brighten(color: Color, percent: number): Color {
		const rgb = $utils.brighten({ r: color.r, g: color.g, b: color.b }, percent);
		return Color.fromRGB(rgb!.r, rgb!.g, rgb!.b);
	}

	/**
	 * Returns a new [[Color]] saturated by `percent` value.
	 *
	 * Value range is between `0` (fully desaturated), to `1` (full color).
	 *
	 * @param   color    Source color
	 * @param   percent  Percent
	 * @return           New color
	 */
	public static saturate(color: Color, percent: number): Color {
		const rgb = $utils.saturate({ r: color.r, g: color.g, b: color.b }, percent);
		return Color.fromRGB(rgb!.r, rgb!.g, rgb!.b);
	}
}
