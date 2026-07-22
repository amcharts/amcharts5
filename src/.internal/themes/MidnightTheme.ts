import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * "Midnight" — a dark theme on a deep-navy ground, with a series palette tuned
 * to read well on it.
 *
 * This is a standalone theme; it does not modify the built-in `DarkTheme`.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class MidnightTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = Color.lighten;
		const primary = Color.fromHex(0x3d6b99);
		const secondary = Color.fromHex(0x1a2a3a);

		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0x0d1520),
			fill: Color.fromHex(0x1a2a3a),

			primaryButton: primary,
			primaryButtonHover: l(primary, 0.12),
			primaryButtonDown: l(primary, 0.2),
			primaryButtonActive: l(primary, 0.2),
			primaryButtonDisabled: Color.fromHex(0x2a3d52),
			primaryButtonTextDisabled: Color.fromHex(0x7f92a6),
			primaryButtonText: Color.fromHex(0xffffff),
			primaryButtonStroke: l(primary, 0.1),

			secondaryButton: secondary,
			secondaryButtonHover: l(secondary, 0.08),
			secondaryButtonDown: l(secondary, 0.13),
			secondaryButtonActive: l(secondary, 0.18),
			secondaryButtonText: Color.fromHex(0xc7d4e2),
			secondaryButtonStroke: l(secondary, -0.2),

			// Rendered at low opacity, so a light cool value reads as a faint line.
			grid: Color.fromHex(0xaebfd0),
			background: Color.fromHex(0x0d1520),
			alternativeBackground: Color.fromHex(0xdde6f0),
			// Not pure white — softer to avoid halation on the dark ground.
			text: Color.fromHex(0xdfe8f2),
			alternativeText: Color.fromHex(0x0d1520),
			disabled: Color.fromHex(0x5a6b7d),
			positive: Color.fromHex(0x5cc26e),
			negative: Color.fromHex(0xe0655c)
		});

		// Generated in OKLCH at a constant deep, subdued level (L 0.63, C 0.10)
		// so every series reads equally rich on the navy ground. Hues step by the
		// golden angle (~137.5deg) rather than sequentially, so consecutive colors
		// land far apart on the wheel: touching pie slices and stacked columns
		// contrast clearly, while the full set still covers the wheel evenly (no
		// near-duplicates, nothing dominating). The hues land on midnight's own
		// accents — gold, teal, blue, purple, coral.
		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xa5843b), // gold
				Color.fromHex(0x3396b5), // blue
				Color.fromHex(0xba6f87), // rose
				Color.fromHex(0x6b975a), // green
				Color.fromHex(0x7784c6), // periwinkle
				Color.fromHex(0xb9774e), // terracotta
				Color.fromHex(0x269c96), // teal
				Color.fromHex(0xaa73a8), // mauve
				Color.fromHex(0x928c3f), // olive
				Color.fromHex(0x4e90c1)  // sky blue
			],
			reuse: true
		});
	}
}
