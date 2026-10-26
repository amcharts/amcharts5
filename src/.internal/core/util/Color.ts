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
 * Returns a new [[Color]] from a hex number, or a CSS hex, `rgb()` or
 * `rgba()` string (color names such as `"red"` are not accepted):
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
 * A color. Every color setting takes a `Color` object, usually created with
 * `am5.color()`, e.g. `am5.color(0xff0000)`.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/colors-gradients-and-patterns/} for more info
 * @important
 */
export class Color {
	protected _hex: number;

	private constructor(hex: number) {
		this._hex = hex | 0;
	}

	/**
	 * The color as a number, such as `0xff0000`.
	 */
	public get hex(): number {
		return this._hex;
	}

	/**
	 * The red channel, from `0` to `255`.
	 * @return R value
	 */
	public get r(): number {
		return this._hex >>> 16;
	}

	/**
	 * The green channel, from `0` to `255`.
	 * @return G value
	 */
	public get g(): number {
		return (this._hex >> 8) & 0xFF;
	}

	/**
	 * The blue channel, from `0` to `255`.
	 * @return B value
	 */
	public get b(): number {
		return this._hex & 0xFF;
	}

	/**
	 * Returns the color as a CSS `rgba(r, g, b, a)` string.
	 *
	 * @param   alpha  Opacity, from `0` to `1`
	 * @return         CSS string
	 */
	public toCSS(alpha: number = 1): string {
		return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + alpha + ")";
	}

	/**
	 * Returns the color as a CSS hex string, such as `"#ff0000"`.
	 *
	 * @return         CSS string
	 */
	public toCSSHex(): string {
		return "#" + $utils.padString(this.r.toString(16), 2) + $utils.padString(this.g.toString(16), 2) + $utils.padString(this.b.toString(16), 2);
	}

	/**
	 * Returns the color's hue, saturation and lightness, each from `0` to `1`.
	 * @param   alpha Opacity (not used)
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
	 * Returns a new [[Color]] from hue, saturation and lightness.
	 *
	 * @param   h Hue, from `0` to `1`
	 * @param   s Saturation, from `0` to `1`
	 * @param   l Lightness, from `0` to `1`
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
	 * Returns a new [[Color]] from a hex number.
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
	 * Returns a new [[Color]] from red, green and blue channels.
	 *
	 * @param   r  Red, from `0` to `255`
	 * @param   g  Green, from `0` to `255`
	 * @param   b  Blue, from `0` to `255`
	 * @return     Color
	 */
	public static fromRGB(r: number, g: number, b: number): Color {
		return new Color((b | 0) + (g << 8) + (r << 16));
	}

	/**
	 * Returns a new [[Color]] from a hex string, such as `"#ff0000"` or
	 * `"#f00"`.
	 *
	 * ```TypeScript
	 * Color.fromString("#ff0000") // red
	 * ```
	 * ```JavaScript
	 * Color.fromString("#ff0000") // red
	 * ```
	 *
	 * @param   s  Hex string
	 * @return     Color
	 */
	public static fromString(s: string): Color {
		return new Color(string2hex(s));
	}

	/**
	 * Returns a new [[Color]] from a CSS `rgb()` or `rgba()` string. The alpha
	 * part is ignored, and a string it can't read gives black.
	 *
	 * ```TypeScript
	 * Color.fromCSS("rgba(255, 0, 0, 1)") // red
	 * ```
	 * ```JavaScript
	 * Color.fromCSS("rgba(255, 0, 0, 1)") // red
	 * ```
	 *
	 * @param   s  CSS string
	 * @return     Color
	 */
	public static fromCSS(s: string): Color {
		return new Color(rgba2hex(s));
	}

	/**
	 * Returns a new [[Color]] from a hex number, a hex, `rgb()` or `rgba()`
	 * string, or another [[Color]]. Throws an error for anything else.
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
	 * Returns `lightAlternative` or `darkAlternative`, whichever contrasts more
	 * with `color`: the dark one for a light color, the light one for a dark.
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
	 * Returns a color between `from` and `to`.
	 *
	 * @param   diff  Position between the two, from `0` (`from`) to `1` (`to`)
	 * @param   from  Source color
	 * @param   to    Target color
	 * @param   mode  Mix the `"rgb"` channels or the `"hsl"` values
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
	 * Returns a color on a scale through `colors`, spread evenly: with three
	 * colors, `0.5` is the middle one. For example, from bad to good:
	 * `[negative, warning, positive]` from the interface colors.
	 *
	 * @param   position  Position on the scale, from `0` (the first color) to `1` (the last)
	 * @param   colors    Colors, in order
	 * @param   mode      Mix the `"rgb"` channels or the `"hsl"` values
	 * @return            Color
	 */
	public static interpolateColors(position: number, colors: Array<Color>, mode: "rgb" | "hsl" = "rgb"): Color {
		const last = colors.length - 1;
		if (last < 1) {
			return colors[0];
		}
		const at = (position > 0 ? Math.min(1, position) : 0) * last;
		const index = Math.min(Math.floor(at), last - 1);
		return Color.interpolate(at - index, colors[index], colors[index + 1], mode);
	}

	/**
	 * Returns a new [[Color]] lightened by `percent`, from `-1` to `1`: `0.2`
	 * moves each channel 20% of the way to white. A negative value darkens it
	 * toward black.
	 *
	 * @param   color    Source color
	 * @param   percent  Amount, from `-1` to `1`
	 * @return           New color
	 */
	public static lighten(color: Color, percent: number): Color {
		const rgb = $utils.lighten({ r: color.r, g: color.g, b: color.b }, percent);
		return Color.fromRGB(rgb!.r, rgb!.g, rgb!.b);
	}

	/**
	 * Returns a new [[Color]] brightened by `percent`, from `-1` to `1`. Unlike
	 * `lighten()`, it adds the same amount to every channel. A negative value
	 * dims the color.
	 *
	 * @param   color    Source color
	 * @param   percent  Amount, from `-1` to `1`
	 * @return           New color
	 */
	public static brighten(color: Color, percent: number): Color {
		const rgb = $utils.brighten({ r: color.r, g: color.g, b: color.b }, percent);
		return Color.fromRGB(rgb!.r, rgb!.g, rgb!.b);
	}

	/**
	 * Returns a new [[Color]] with its saturation set to `percent`, from `0`
	 * (grey) to `1`. The value replaces the color's saturation rather than
	 * adjusting it; `1` returns the color unchanged.
	 *
	 * @param   color    Source color
	 * @param   percent  Saturation, from `0` to `1`
	 * @return           New color
	 */
	public static saturate(color: Color, percent: number): Color {
		const rgb = $utils.saturate({ r: color.r, g: color.g, b: color.b }, percent);
		return Color.fromRGB(rgb!.r, rgb!.g, rgb!.b);
	}
}
