import { Color } from "../core/util/Color";
import type { IInterfaceColorsSettings } from "../core/util/InterfaceColors";
import { Theme } from "../core/Theme";
import type { Root } from "../core/Root";
import { colorToOKLCH, oklchToColor, IOKLCH } from "../core/util/OKLCH";

/**
 * Options for {@link AdaptiveTheme}.
 */
export interface IAdaptiveThemeSettings {

	/**
	 * Primary base color. The generated palette and (in dark mode) the interface
	 * colors are derived from it. Accepts a hex number, a CSS string, or a
	 * [[Color]].
	 *
	 * If omitted, the theme defaults to a green-to-yellow gradient (`#4b8e39`
	 * first, `#ffdd00` last).
	 */
	baseColor?: number | string | Color;

	/**
	 * Optional second base color. When provided, the palette spans the two
	 * colors (perceptually interpolated in OKLCH) instead of fanning out from a
	 * single hue.
	 */
	baseColor2?: number | string | Color;

	/**
	 * Number of series colors to generate.
	 *
	 * @default 10
	 */
	count?: number;

	/**
	 * Produce a dark variant: a faintly base-tinted dark background and matching
	 * interface colors.
	 *
	 * @default false
	 */
	dark?: boolean;
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
 * "Adaptive" — generates a full palette from one or two base colors, choosing
 * the other colors automatically in OKLCH so they stay perceptually balanced
 * (even lightness/chroma, evenly spread hues).
 *
 * Because a theme cannot take constructor parameters, this ships as a **factory
 * function**:
 *
 * ```TypeScript
 * root.setThemes([
 *   am5themes_Adaptive(root, { baseColor: 0x2c6e91, dark: true })
 * ]);
 * ```
 *
 * The first generated color is the base color itself, so a brand color always
 * appears in the chart. This theme is additive; it does not modify any built-in
 * theme.
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
	const baseColor = hasBaseColor ? Color.fromAny(settings.baseColor!) : Color.fromHex(0x4b8e39);
	const base = colorToOKLCH(baseColor);

	// Moderated lightness/chroma for the generated (non-seed) colors, so the
	// palette stays readable even if the base is very dark or very muted.
	const genL = clamp(base.l, 0.55, 0.78);
	const genC = clamp(base.c, 0.09, 0.17);

	const colors: Array<Color> = [baseColor];

	// Second anchor: an explicit baseColor2, or a yellow default when no base
	// color was given (so an unconfigured theme is a green-to-yellow gradient).
	const base2Input = settings.baseColor2 != null ? settings.baseColor2 : (hasBaseColor ? null : 0xffdd00);

	if (base2Input != null) {
		// Two anchors: perceptually interpolate across the OKLCH arc between them,
		// including both endpoints (needs at least the two endpoints).
		if (count < 2) { count = 2; }
		const base2Color = Color.fromAny(base2Input);
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
				colors.push(oklchToColor(
					lerp(base.l, base2.l, t),
					lerp(base.c, base2.c, t),
					lerpHue(base.h, base2.h, t)
				));
			}
		}
	}
	else {
		// Single anchor: fan out by the golden angle at a constant, readable
		// lightness/chroma.
		for (let i = 1; i < count; i++) {
			colors.push(oklchToColor(genL, genC, wrapHue(base.h + i * GOLDEN_ANGLE)));
		}
	}

	const theme = Theme.new(root);

	theme.rule("ColorSet").setAll({
		colors: colors,
		reuse: true
	});

	if (dark) {
		theme.rule("InterfaceColors").setAll(darkInterface(base, baseColor));
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

	return theme;
}

/**
 * Lets the theme be used exactly like the class-based themes -
 * `am5themes_Adaptive.new(root)` - applying the default green-to-yellow palette
 * when no options are given. For custom colors, call the factory directly:
 * `am5themes_Adaptive(root, { baseColor: 0x2c6e91 })`.
 */
AdaptiveTheme.new = function (root: Root, settings: IAdaptiveThemeSettings = {}): Theme {
	return AdaptiveTheme(root, settings);
};

// Builds a dark interface palette faintly tinted toward the base hue for
// cohesion with the generated series colors.
function darkInterface(base: IOKLCH, baseColor: Color): Partial<IInterfaceColorsSettings> {
	const h = base.h;
	const l = Color.lighten;
	const primary = baseColor;
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
		negative: Color.fromHex(0xe0655c)
	};
}
