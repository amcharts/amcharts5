import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * "Pastel Dark" — the dark counterpart to `Pastel`: a deep, desaturated ground
 * with soft, chalky pastels that glow gently against it.
 *
 * This is a standalone theme; it does not modify any built-in theme.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class PastelDarkTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = Color.lighten;
		const primary = Color.fromHex(0x8a9ad0);
		const secondary = Color.fromHex(0x2f2c37);

		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0x24222b),
			fill: Color.fromHex(0x2f2c37),

			primaryButton: primary,
			primaryButtonHover: l(primary, 0.12),
			primaryButtonDown: l(primary, 0.2),
			primaryButtonActive: l(primary, 0.2),
			primaryButtonDisabled: Color.fromHex(0x3c3947),
			primaryButtonTextDisabled: Color.fromHex(0x8f8a9a),
			primaryButtonText: Color.fromHex(0xffffff),
			primaryButtonStroke: l(primary, 0.1),

			secondaryButton: secondary,
			secondaryButtonHover: l(secondary, 0.08),
			secondaryButtonDown: l(secondary, 0.13),
			secondaryButtonActive: l(secondary, 0.18),
			secondaryButtonText: Color.fromHex(0xcdc8d6),
			secondaryButtonStroke: l(secondary, -0.2),

			grid: Color.fromHex(0xb6b0c0),
			background: Color.fromHex(0x24222b),
			alternativeBackground: Color.fromHex(0xe6e2ec),
			text: Color.fromHex(0xd9d4de),
			alternativeText: Color.fromHex(0x24222b),
			disabled: Color.fromHex(0x6d6878),
			positive: Color.fromHex(0xa8dcc0),
			negative: Color.fromHex(0xe8aab6)
		});

		// Deeper, muted pastels — darker than the light theme's so they read as
		// rich (not chalky) on the dark ground.
		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xc68290), // rose
				Color.fromHex(0x7cb798), // mint
				Color.fromHex(0xa788c9), // lilac
				Color.fromHex(0xc8af5c), // butter
				Color.fromHex(0x9096c6), // lavender blue
				Color.fromHex(0x9ab381), // sage
				Color.fromHex(0xce8379), // coral
				Color.fromHex(0x77b3b3), // aqua
				Color.fromHex(0xcd9e78), // peach
				Color.fromHex(0x7fa2c8)  // sky
			],
			reuse: true
		});
	}
}
