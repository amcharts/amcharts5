import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * "Nord Dark" — the dark variant of the Nord palette (Arctic Ice Studio): muted
 * Frost/Aurora accents on the deep "Polar Night" `#2e3440` ground. Cool and
 * deliberately low-contrast. Pairs with `Nord`.
 *
 * This is a standalone theme; it does not modify any built-in theme.
 *
 * @see {@link https://www.nordtheme.com/} for the original palette
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class NordDarkTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = Color.lighten;
		const primary = Color.fromHex(0x5e81ac); // nord10
		const secondary = Color.fromHex(0x3b4252); // nord1

		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0x2e3440), // nord0
			fill: Color.fromHex(0x3b4252), // nord1

			primaryButton: primary,
			primaryButtonHover: l(primary, 0.12),
			primaryButtonDown: l(primary, 0.2),
			primaryButtonActive: l(primary, 0.2),
			primaryButtonDisabled: Color.fromHex(0x434c5e), // nord2
			primaryButtonTextDisabled: Color.fromHex(0x7b88a1),
			primaryButtonText: Color.fromHex(0xeceff4), // nord6
			primaryButtonStroke: l(primary, 0.1),

			secondaryButton: secondary,
			secondaryButtonHover: l(secondary, 0.08),
			secondaryButtonDown: l(secondary, 0.13),
			secondaryButtonActive: l(secondary, 0.18),
			secondaryButtonText: Color.fromHex(0xd8dee9), // nord4
			secondaryButtonStroke: l(secondary, -0.2),

			grid: Color.fromHex(0xd8dee9), // nord4 (faint at low opacity)
			background: Color.fromHex(0x2e3440), // nord0
			alternativeBackground: Color.fromHex(0xeceff4), // nord6
			text: Color.fromHex(0xd8dee9), // nord4
			alternativeText: Color.fromHex(0x2e3440), // nord0
			disabled: Color.fromHex(0x4c566a), // nord3
			positive: Color.fromHex(0xa3be8c), // nord14
			negative: Color.fromHex(0xbf616a) // nord11
		});

		// Muted Frost/Aurora accents, bright enough to read on Polar Night.
		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0x88c0d0), // frost cyan
				Color.fromHex(0xbf616a), // aurora red
				Color.fromHex(0xd8dee9), // snow storm
				Color.fromHex(0xd08770), // aurora orange
				Color.fromHex(0xebcb8b), // aurora yellow
				Color.fromHex(0x81a1c1), // frost blue
				Color.fromHex(0xa3be8c), // aurora green
				Color.fromHex(0xb48ead), // aurora purple
				Color.fromHex(0x8fbcbb), // frost teal
				Color.fromHex(0x9ab4d4)  // light frost
			],
			reuse: true
		});
	}
}
