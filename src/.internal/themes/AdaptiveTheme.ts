import { Color } from "../core/util/Color";
import type { IInterfaceColorsSettings } from "../core/util/InterfaceColors";
import { Theme } from "../core/Theme";
import type { Root } from "../core/Root";
import { colorToOKLCH, oklchToColor, withContrast, fillShade } from "../core/util/OKLCH";
import * as $array from "../core/util/Array";

/**
 * Options for {@link AdaptiveTheme}.
 */
export interface IAdaptiveThemeSettings {

	/**
	 * The color the palette is built from, and its first color, as a hex
	 * number, a CSS string or a [[Color]]. It also colors the primary buttons,
	 * and in dark mode tints all interface colors. If not set, green `#4b8e39`
	 * is used, and `baseColor2` defaults to yellow `#ffdd00`.
	 */
	baseColor?: number | string | Color;

	/**
	 * A second color: the palette then runs as a gradient from `baseColor` to
	 * this one, instead of spreading out over the color wheel.
	 */
	baseColor2?: number | string | Color;

	/**
	 * Number of series colors to make.
	 *
	 * @default 10
	 */
	count?: number;

	/**
	 * Makes a dark theme, with a dark background and interface colors faintly
	 * tinted with the hue of `baseColor`.
	 *
	 * @default false
	 */
	dark?: boolean;

	/**
	 * Takes the colors in an alternating order (1, 4, 2, 5, 3, 6), so series
	 * next to each other differ more. Most useful with `baseColor2`, whose
	 * gradient puts similar colors side by side.
	 *
	 * @default false
	 */
	interleave?: boolean;

	/**
	 * Fills map polygons with a mid shade of `baseColor`, as light as a map's
	 * default land, instead of `baseColor` itself.
	 *
	 * @default false
	 */
	mapShade?: boolean;

	/**
	 * Lightens (in dark mode) or darkens colors that would have too little
	 * contrast with the background, keeping their hue: `true` for at least 3:1,
	 * or a ratio, e.g. `4.5`. Applies to the series colors, `baseColor` and
	 * `baseColor2` included, and the primary buttons.
	 *
	 * @default false
	 */
	keepContrast?: boolean | number;

	/**
	 * Once every color has been used, each new round of colors is this much
	 * lighter (HSL lightness: `0.1` is 10%; a negative value makes it darker)
	 * instead of the same colors again. `true` is `0.1`; `false` or `0`
	 * repeats the colors as they are.
	 *
	 * @default 0.1
	 */
	repeatLightness?: boolean | number;
}

// Golden-angle hue step (degrees) gives a well-spread single-hue-seeded palette.
const GOLDEN_ANGLE = 137.5;

function wrapHue(h: number): number {
	h = h % 360;
	return h < 0 ? h + 360 : h;
}

// Shortest-path interpolation between two hues.
function lerpHue(a: number, b: number, t: number): number {
	let d = b - a;
	if (d > 180) {
		d -= 360;
	}
	else if (d < -180) {
		d += 360;
	}
	return wrapHue(a + d * t);
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function clamp(x: number, lo: number, hi: number): number {
	return x < lo ? lo : (x > hi ? hi : x);
}

/**
 * "Adaptive": makes a whole series palette from one or two colors. With one,
 * the other colors share an even lightness and spread out over the color
 * wheel; with two, they run as a gradient between them. The first color is
 * `baseColor` itself, so a brand color appears in the chart (unless
 * `keepContrast` has to change it).
 *
 * It is a function rather than a class, so that it can take settings:
 *
 * ```TypeScript
 * root.setThemes([
 *   am5themes_Adaptive(root, { baseColor: 0x2c6e91, dark: true })
 * ]);
 * ```
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export function AdaptiveTheme(root: Root, settings: IAdaptiveThemeSettings = {}): Theme {
	const dark = settings.dark === true;
	// A whole number >= 1 (>= 2 when two anchors are given, so both endpoints show).
	let count = settings.count && settings.count > 0 ? Math.round(settings.count) : 10;
	if (count < 1) { count = 1; }

	// With no base color set, default to a green-to-yellow gradient.
	const hasBaseColor = settings.baseColor != null;
	let baseColor = hasBaseColor ? Color.fromAny(settings.baseColor!) : Color.fromHex(0x4b8e39);
	const original = colorToOKLCH(baseColor);
	const hue = original.h;

	// With keepContrast, colors too close to the background move away from it
	const background = dark ? oklchToColor(0.16, 0.02, hue) : Color.fromHex(0xffffff);
	const ratio = settings.keepContrast === true ? 3 : Number(settings.keepContrast);
	const fit = (color: Color) => ratio > 1 ? withContrast(color, background, ratio) : color;
	baseColor = fit(baseColor);
	const base = colorToOKLCH(baseColor);

	// Moderated lightness/chroma for the generated (non-seed) colors, so the
	// palette stays readable even if the base is very dark or very muted.
	const genL = clamp(base.l, 0.55, 0.78);
	const genC = clamp(base.c, 0.09, 0.17);

	let colors: Array<Color> = [baseColor];

	// Second anchor: an explicit baseColor2, or a yellow default when no base
	// color was given (so an unconfigured theme is a green-to-yellow gradient).
	const base2Input = settings.baseColor2 != null ? settings.baseColor2 : (hasBaseColor ? null : 0xffdd00);

	if (base2Input != null) {
		// Two anchors: perceptually interpolate across the OKLCH arc between them,
		// including both endpoints (needs at least the two endpoints).
		if (count < 2) { count = 2; }
		const base2Color = fit(Color.fromAny(base2Input));
		const base2 = colorToOKLCH(base2Color);
		colors.length = 0;
		for (let i = 0; i < count; i++) {
			const t = count === 1 ? 0 : i / (count - 1);
			if (i === 0) {
				colors.push(baseColor);
			}
			else if (i === count - 1) {
				colors.push(base2Color);
			}
			else {
				colors.push(fit(oklchToColor(
					lerp(base.l, base2.l, t),
					lerp(base.c, base2.c, t),
					lerpHue(base.h, base2.h, t)
				)));
			}
		}
	}
	else {
		// Single anchor: fan out by the golden angle at a constant, readable
		// lightness/chroma.
		for (let i = 1; i < count; i++) {
			colors.push(fit(oklchToColor(genL, genC, wrapHue(base.h + i * GOLDEN_ANGLE))));
		}
	}

	if (settings.interleave) {
		colors = $array.interleave(colors);
	}

	const theme = Theme.new(root);

	theme.rule("ColorSet").setAll({
		colors: colors,
		reuse: true,
		repeatLightness: settings.repeatLightness == null || settings.repeatLightness === true ? 0.1 : (Number(settings.repeatLightness) || 0)
	});

	if (dark) {
		theme.rule("InterfaceColors").setAll(darkInterface(hue, baseColor));
	}
	else {
		// Light variant: keep the default look but let the base drive the primary
		// button so the UI adopts the brand hue.
		theme.rule("InterfaceColors").setAll({
			primaryButton: baseColor,
			primaryButtonHover: Color.lighten(baseColor, 0.1),
			primaryButtonDown: Color.lighten(baseColor, -0.1),
			primaryButtonActive: Color.lighten(baseColor, -0.1),
			primaryButtonStroke: Color.lighten(baseColor, -0.15)
		});
	}

	if (settings.mapShade) {
		theme.rule("MapPolygon").setAll({ fill: fillShade(original, dark) });
	}

	return theme;
}

/**
 * Same as calling the function, so the theme can be used like the class-based
 * themes: `am5themes_Adaptive.new(root)`, or with settings,
 * `am5themes_Adaptive.new(root, { baseColor: 0x2c6e91 })`.
 */
AdaptiveTheme.new = function (root: Root, settings: IAdaptiveThemeSettings = {}): Theme {
	return AdaptiveTheme(root, settings);
};

// Builds a dark interface palette faintly tinted toward the base hue for
// cohesion with the generated series colors.
function darkInterface(h: number, primary: Color): Partial<IInterfaceColorsSettings> {
	const l = Color.lighten;
	const secondary = oklchToColor(0.26, 0.02, h);

	return {
		stroke: oklchToColor(0.18, 0.02, h),
		fill: secondary,

		primaryButton: primary,
		primaryButtonHover: l(primary, 0.12),
		primaryButtonDown: l(primary, 0.2),
		primaryButtonActive: l(primary, 0.2),
		primaryButtonDisabled: oklchToColor(0.4, 0.03, h),
		primaryButtonTextDisabled: oklchToColor(0.68, 0.02, h),
		primaryButtonText: Color.fromHex(0xffffff),
		primaryButtonStroke: l(primary, 0.1),

		secondaryButton: secondary,
		secondaryButtonHover: l(secondary, 0.08),
		secondaryButtonDown: l(secondary, 0.13),
		secondaryButtonActive: l(secondary, 0.18),
		secondaryButtonText: oklchToColor(0.85, 0.02, h),
		secondaryButtonStroke: l(secondary, -0.2),

		grid: oklchToColor(0.8, 0.015, h),
		background: oklchToColor(0.16, 0.02, h),
		alternativeBackground: oklchToColor(0.92, 0.02, h),
		text: oklchToColor(0.92, 0.015, h),
		alternativeText: oklchToColor(0.16, 0.02, h),
		disabled: oklchToColor(0.5, 0.02, h),
		positive: Color.fromHex(0x5cc26e),
		negative: Color.fromHex(0xe0655c),
		warning: Color.fromHex(0xf2c94c)
	};
}
