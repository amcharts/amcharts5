import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * "Nord": the light side of the Nord palette by Arctic Ice Studio, with muted
 * Frost and Aurora colors on the off-white "Snow Storm" `#eceff4` background.
 * Cool and deliberately low in contrast. Pairs with `NordDark`.
 *
 * @see {@link https://www.nordtheme.com/} for the original palette
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class NordTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = Color.lighten;
		const primary = Color.fromHex(0x5e81ac); // nord10
		const secondary = Color.fromHex(0xe5e9f0); // nord5

		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0xd8dee9), // nord4
			fill: Color.fromHex(0xe5e9f0), // nord5

			primaryButton: primary,
			primaryButtonHover: l(primary, -0.1),
			primaryButtonDown: l(primary, -0.18),
			primaryButtonActive: l(primary, -0.18),
			primaryButtonDisabled: Color.fromHex(0xd8dee9),
			primaryButtonTextDisabled: Color.fromHex(0xeceff4),
			primaryButtonText: Color.fromHex(0xeceff4), // nord6
			primaryButtonStroke: l(primary, -0.15),

			secondaryButton: secondary,
			secondaryButtonHover: l(secondary, -0.08),
			secondaryButtonDown: l(secondary, -0.13),
			secondaryButtonActive: l(secondary, -0.18),
			secondaryButtonText: Color.fromHex(0x2e3440), // nord0
			secondaryButtonStroke: l(secondary, -0.1),

			grid: Color.fromHex(0x4c566a), // nord3
			background: Color.fromHex(0xeceff4), // nord6
			alternativeBackground: Color.fromHex(0x2e3440), // nord0
			text: Color.fromHex(0x2e3440), // nord0
			alternativeText: Color.fromHex(0xeceff4), // nord6
			disabled: Color.fromHex(0x9aa3b2),
			positive: Color.fromHex(0xa3be8c), // nord14
			negative: Color.fromHex(0xbf616a), // nord11
			warning: Color.fromHex(0xebcb8b) // nord13
		});

		// Deeper Nord hues first so they read on the light ground; the palest
		// (yellow) sits later.
		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0x5e81ac), // frost dark blue
				Color.fromHex(0xebcb8b), // aurora yellow
				Color.fromHex(0xbf616a), // aurora red
				Color.fromHex(0x88c0d0), // frost cyan
				Color.fromHex(0xb56f9b), // muted magenta
				Color.fromHex(0xa3be8c), // aurora green
				Color.fromHex(0xb48ead), // aurora purple
				Color.fromHex(0x8fbcbb), // frost teal
				Color.fromHex(0xd08770), // aurora orange
				Color.fromHex(0x81a1c1)  // frost blue
			],
			reuse: true
		});
	}
}
