import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * "Savanna": a warm, editorial light theme on a cream background, with muted
 * natural series colors: amber gold, terracotta, olive, plum, ochre and walnut.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class SavannaTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = Color.lighten;
		const primary = Color.fromHex(0xc8873f); // amber-orange
		const secondary = Color.fromHex(0xe6ddca);

		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0xddd2ba),
			fill: Color.fromHex(0xe6ddca),

			primaryButton: primary,
			primaryButtonHover: l(primary, -0.1),
			primaryButtonDown: l(primary, -0.18),
			primaryButtonActive: l(primary, -0.18),
			primaryButtonDisabled: Color.fromHex(0xd8c8a8),
			primaryButtonTextDisabled: Color.fromHex(0xf7f1e3),
			primaryButtonText: Color.fromHex(0xf7f1e3),
			primaryButtonStroke: l(primary, -0.15),

			secondaryButton: secondary,
			secondaryButtonHover: l(secondary, -0.08),
			secondaryButtonDown: l(secondary, -0.13),
			secondaryButtonActive: l(secondary, -0.18),
			secondaryButtonText: Color.fromHex(0x5a4a38),
			secondaryButtonStroke: l(secondary, -0.1),

			grid: Color.fromHex(0xa89a7c),
			background: Color.fromHex(0xf3ede1), // warm cream
			alternativeBackground: Color.fromHex(0x3a3024),
			text: Color.fromHex(0x5a4a38), // warm dark brown
			alternativeText: Color.fromHex(0xf3ede1),
			disabled: Color.fromHex(0xb3a789),
			positive: Color.fromHex(0x7a8c5a), // olive
			negative: Color.fromHex(0xc0553a) // terracotta
		});

		// Muted natural accents lifted from the DataViz Dojo palette.
		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xd9a441), // amber gold
				Color.fromHex(0xc0553a), // terracotta
				Color.fromHex(0x7a8c5a), // olive
				Color.fromHex(0x7d6a9c), // plum
				Color.fromHex(0xc07f3a), // ochre
				Color.fromHex(0x9a7b52)  // walnut
			],
			reuse: true
		});
	}
}
