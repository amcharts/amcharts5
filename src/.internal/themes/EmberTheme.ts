import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * "Ember" — a warm dark theme on a warm near-black ground, with a series
 * palette biased toward ambers, oranges and reds (plus a few cool hues for
 * categorical separation).
 *
 * This is a standalone theme; it does not modify the built-in `DarkTheme`.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class EmberTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = Color.lighten;
		const primary = Color.fromHex(0xc06a3a);
		const secondary = Color.fromHex(0x2a231b);

		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0x17140f),
			fill: Color.fromHex(0x2a231b),

			primaryButton: primary,
			primaryButtonHover: l(primary, 0.12),
			primaryButtonDown: l(primary, 0.2),
			primaryButtonActive: l(primary, 0.2),
			primaryButtonDisabled: Color.fromHex(0x4a3d30),
			primaryButtonTextDisabled: Color.fromHex(0x9a8a78),
			primaryButtonText: Color.fromHex(0xffffff),
			primaryButtonStroke: l(primary, 0.1),

			secondaryButton: secondary,
			secondaryButtonHover: l(secondary, 0.08),
			secondaryButtonDown: l(secondary, 0.13),
			secondaryButtonActive: l(secondary, 0.18),
			secondaryButtonText: Color.fromHex(0xd8c9b8),
			secondaryButtonStroke: l(secondary, -0.2),

			// Rendered at low opacity, so a warm light value reads as a faint line.
			grid: Color.fromHex(0xd0b79a),
			background: Color.fromHex(0x17140f),
			alternativeBackground: Color.fromHex(0xf0e6d6),
			// Warm off-white to sit comfortably on the warm ground.
			text: Color.fromHex(0xf0e4d4),
			alternativeText: Color.fromHex(0x17140f),
			disabled: Color.fromHex(0x7d6f5f),
			positive: Color.fromHex(0x8fb96b),
			negative: Color.fromHex(0xe0655c)
		});

		// Warm-biased palette with a few cool hues for categorical separation.
		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xe9ca80), // gold
				Color.fromHex(0x9e4454), // maroon
				Color.fromHex(0x52b0ab), // teal
				Color.fromHex(0xd2615b), // red
				Color.fromHex(0x588fbc), // steel blue
				Color.fromHex(0xdda151), // amber
				Color.fromHex(0xaf5d40), // rust
				Color.fromHex(0xd192ca), // pink
				Color.fromHex(0xd07940), // orange
				Color.fromHex(0xcf7ea2)  // rose
			],
			reuse: true
		});
	}
}
