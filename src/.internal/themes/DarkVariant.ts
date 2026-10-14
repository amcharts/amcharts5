import { Color } from "../core/util/Color";
import type { IInterfaceColorsSettings } from "../core/util/InterfaceColors";
import { colorToOKLCH, oklchToColor } from "../core/util/OKLCH";

/**
 * Shared building blocks for the "… Dark" variants of the palette themes
 * (Colorblind, Dataviz, Frozen, Kelly, Material, Moonrise, Patterns, Spirited).
 *
 * A dark variant reuses its light counterpart's series palette and only swaps in
 * a dark set of interface colors — except that any palette entry too dark to be
 * seen on the dark ground is lifted perceptually (in OKLCH) so it stays visible
 * while keeping its hue. Colors already bright enough are left untouched.
 */

const l = Color.lighten;
const primary = Color.fromHex(0x5a7fa8);
const secondary = Color.fromHex(0x2b2b2b);

/**
 * A neutral dark set of interface colors, shared by every dark palette variant
 * so they differ only by their series palette.
 */
export function darkInterfaceColors(): Partial<IInterfaceColorsSettings> {
	return {
		stroke: Color.fromHex(0x121212),
		fill: Color.fromHex(0x2b2b2b),

		primaryButton: primary,
		primaryButtonHover: l(primary, 0.12),
		primaryButtonDown: l(primary, 0.2),
		primaryButtonActive: l(primary, 0.2),
		primaryButtonDisabled: Color.fromHex(0x37424d),
		primaryButtonTextDisabled: Color.fromHex(0x8a8a8a),
		primaryButtonText: Color.fromHex(0xffffff),
		primaryButtonStroke: l(primary, 0.1),

		secondaryButton: secondary,
		secondaryButtonHover: l(secondary, 0.08),
		secondaryButtonDown: l(secondary, 0.13),
		secondaryButtonActive: l(secondary, 0.18),
		secondaryButtonText: Color.fromHex(0xc4c4c4),
		secondaryButtonStroke: l(secondary, -0.2),

		grid: Color.fromHex(0xbbbbbb),
		background: Color.fromHex(0x121212),
		alternativeBackground: Color.fromHex(0xe6e6e6),
		text: Color.fromHex(0xe4e4e4),
		alternativeText: Color.fromHex(0x121212),
		disabled: Color.fromHex(0x6b6b6b),
		positive: Color.fromHex(0x5cc26e),
		negative: Color.fromHex(0xe0655c),
		warning: Color.fromHex(0xf2c94c)
	};
}

/**
 * Raises the lightness of any color darker than `minL` (OKLCH lightness, 0..1)
 * up to `minL`, holding hue and chroma, so it reads on a dark ground. Colors at
 * or above `minL` are returned unchanged.
 *
 * @param   colors  Source palette
 * @param   minL    Minimum OKLCH lightness (default 0.52)
 * @return          Adjusted palette
 */
export function liftDarkColors(colors: Array<Color>, minL: number = 0.52): Array<Color> {
	return colors.map((col) => {
		const oklch = colorToOKLCH(col);
		if (oklch.l >= minL) {
			return col;
		}
		return oklchToColor(minL, oklch.c, oklch.h);
	});
}
