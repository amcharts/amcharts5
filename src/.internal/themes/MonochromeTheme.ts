import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";
import type { Root } from "../core/Root";
import { colorToOKLCH, oklchToColor } from "../core/util/OKLCH";

/**
 * Options for {@link MonochromeTheme}.
 */
export interface IMonochromeThemeSettings {

	/**
	 * Color whose hue the series ramp is made of, as a hex number, a CSS string
	 * or a [[Color]]. It also colors the primary buttons. If not set, a blue
	 * `#2e7c9e` is used.
	 */
	color?: number | string | Color;

	/**
	 * A color put before the ramp, so that the first series stands out. Accepts
	 * a hex number, a CSS string or a [[Color]]. With more series than colors,
	 * the colors repeat, accent included.
	 */
	accent?: number | string | Color;

	/**
	 * Makes a dark theme: dark interface colors, and a ramp from light to mid
	 * shades that shows on the dark background.
	 *
	 * @default false
	 */
	dark?: boolean;

	/**
	 * Number of shades in the series ramp.
	 *
	 * @default 7
	 */
	count?: number;
}

/**
 * "Monochrome": a single-hue theme. Its series colors are an even ramp of
 * shades of one color, from lighter to darker, with an optional `accent`
 * first.
 *
 * It is a function rather than a class, so that it can take settings:
 *
 * ```TypeScript
 * root.setThemes([
 *   am5themes_Monochrome(root, { color: 0x2c6e91, dark: true })
 * ]);
 * ```
 *
 * With nothing set, the ramp is blue (`#2e7c9e`).
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export function MonochromeTheme(root: Root, settings: IMonochromeThemeSettings = {}): Theme {
	const dark = settings.dark === true;
	const count = settings.count && settings.count > 0 ? Math.max(1, Math.round(settings.count)) : 7;

	// With no color set, default to a blue base.
	const hasColor = settings.color != null;
	const baseColor = hasColor ? Color.fromAny(settings.color!) : Color.fromHex(0x2e7c9e);

	const base = colorToOKLCH(baseColor);

	// Even lightness ramp holding the base color's hue and chroma. On light
	// grounds the ramp runs mid-to-dark; on dark grounds it runs light-to-mid so
	// every step keeps contrast with the background.
	const lHi = dark ? 0.86 : 0.74;
	const lLo = dark ? 0.46 : 0.30;

	const colors: Array<Color> = [];
	for (let i = 0; i < count; i++) {
		const t = count === 1 ? 0 : i / (count - 1);
		colors.push(oklchToColor(lHi + (lLo - lHi) * t, base.c, base.h));
	}

	// Optional accent: a distinct first color so one series pops off the ramp.
	if (settings.accent != null) {
		colors.unshift(Color.fromAny(settings.accent));
	}

	const theme = Theme.new(root);

	theme.rule("ColorSet").setAll({
		colors: colors,
		reuse: true
	});

	if (dark) {
		const l = Color.lighten;
		const primary = baseColor;
		const secondary = Color.fromHex(0x2b2b2b);

		theme.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0x121212),
			fill: Color.fromHex(0x2b2b2b),

			primaryButton: primary,
			primaryButtonHover: l(primary, 0.12),
			primaryButtonDown: l(primary, 0.2),
			primaryButtonActive: l(primary, 0.2),
			primaryButtonDisabled: Color.fromHex(0x3a3a3a),
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
			negative: Color.fromHex(0xe0655c)
		});
	}
	else {
		// Light variant: keep the default look, but let the base color drive the
		// primary button so the UI picks up the chosen hue.
		theme.rule("InterfaceColors").setAll({
			primaryButton: baseColor,
			primaryButtonHover: Color.lighten(baseColor, 0.1),
			primaryButtonDown: Color.lighten(baseColor, -0.1),
			primaryButtonActive: Color.lighten(baseColor, -0.1),
			primaryButtonStroke: Color.lighten(baseColor, -0.15)
		});
	}

	return theme;
}

/**
 * Same as calling the function, so the theme can be used like the class-based
 * themes: `am5themes_Monochrome.new(root)`, or with settings,
 * `am5themes_Monochrome.new(root, { color: 0x2c6e91 })`.
 */
MonochromeTheme.new = function (root: Root, settings: IMonochromeThemeSettings = {}): Theme {
	return MonochromeTheme(root, settings);
};
