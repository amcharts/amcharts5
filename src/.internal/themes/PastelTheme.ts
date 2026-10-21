import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * "Pastel": a soft light theme on a warm off-white background, with muted
 * pastel series colors. Calm and editorial. Pairs with `PastelDark`.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class PastelTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = Color.lighten;
		const primary = Color.fromHex(0x8fb0d9);
		const secondary = Color.fromHex(0xe7e0d4);

		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0xe4ded4),
			fill: Color.fromHex(0xefe9df),

			primaryButton: primary,
			primaryButtonHover: l(primary, -0.1),
			primaryButtonDown: l(primary, -0.18),
			primaryButtonActive: l(primary, -0.18),
			primaryButtonDisabled: Color.fromHex(0xd8d0c4),
			primaryButtonTextDisabled: Color.fromHex(0xffffff),
			primaryButtonText: Color.fromHex(0xffffff),
			primaryButtonStroke: l(primary, -0.15),

			secondaryButton: secondary,
			secondaryButtonHover: l(secondary, -0.08),
			secondaryButtonDown: l(secondary, -0.13),
			secondaryButtonActive: l(secondary, -0.18),
			secondaryButtonText: Color.fromHex(0x55525c),
			secondaryButtonStroke: l(secondary, -0.1),

			grid: Color.fromHex(0x55525c),
			background: Color.fromHex(0xf7f4ee),
			alternativeBackground: Color.fromHex(0x2a2730),
			text: Color.fromHex(0x55525c),
			alternativeText: Color.fromHex(0xf7f4ee),
			disabled: Color.fromHex(0xb7b1a8),
			positive: Color.fromHex(0x9fc4a8),
			negative: Color.fromHex(0xe39aa6),
			warning: Color.fromHex(0xecd58f)
		});

		// Medium pastels — soft, but saturated enough to read on the cream ground.
		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xe39aa6), // dusty rose
				Color.fromHex(0xb7d38f), // soft green
				Color.fromHex(0xc0a3dc), // lilac
				Color.fromHex(0xe6c079), // butter
				Color.fromHex(0x90b8e0), // sky
				Color.fromHex(0xeaa588), // coral
				Color.fromHex(0x86ccc0), // mint
				Color.fromHex(0xcf9f86), // clay
				Color.fromHex(0xa6b0e0), // periwinkle
				Color.fromHex(0x9fc4a8)  // sage
			],
			reuse: true,
			repeatLightness: 0.1
		});
	}
}
