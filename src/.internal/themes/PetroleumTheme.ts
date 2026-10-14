import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * "Petroleum": a restrained, near-monochrome dark theme, with pale gold text on
 * a near-black `#0a0e12` background. Its series colors are golds with one green
 * accent: crude amber `#c8890a`, gas flare `#f5d090`, pipeline green
 * `#6a8a70`, sulfur `#a89050` and bronze `#8b6914`.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class PetroleumTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const l = Color.lighten;
		const deepCrude = Color.fromHex(0x141a1a); // ocean / dark teal-black
		const slick = Color.fromHex(0x1e2824); // land / oil-slick green-black
		const pipeline = Color.fromHex(0x3a5040); // industrial green accent
		const amber = Color.fromHex(0xc8890a); // crude oil
		const flare = Color.fromHex(0xf5d090); // gas flare (text/highlight)
		const background = Color.fromHex(0x0a0e12); // near-black ground

		this.rule("InterfaceColors").setAll({
			stroke: deepCrude,
			fill: slick,

			primaryButton: slick,
			primaryButtonHover: pipeline,
			primaryButtonDown: background,
			primaryButtonActive: amber,
			primaryButtonDisabled: Color.fromHex(0x2a352e),
			primaryButtonTextDisabled: Color.fromHex(0x8a8060),
			primaryButtonText: flare,
			primaryButtonStroke: pipeline,

			secondaryButton: slick,
			secondaryButtonHover: pipeline,
			secondaryButtonDown: deepCrude,
			secondaryButtonActive: l(slick, 0.2),
			secondaryButtonText: flare,
			secondaryButtonStroke: pipeline,

			// Pipeline green, lifted so gridlines read on the near-black ground.
			grid: Color.fromHex(0x5f7a68),
			background: background,
			alternativeBackground: flare,
			text: flare,
			alternativeText: background,
			disabled: Color.fromHex(0x5a6055),
			positive: Color.fromHex(0x6a8a70),
			negative: Color.fromHex(0xb5602a),
			warning: Color.fromHex(0xc9a03a)
		});

		// Tight palette: mostly crude-gold tones plus one green accent.
		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xc8890a), // crude amber
				Color.fromHex(0xf5d090), // gas flare
				Color.fromHex(0x6a8a70), // pipeline green
				Color.fromHex(0xa89050), // sulfur
				Color.fromHex(0x8b6914)  // bronze
			],
			reuse: true
		});
	}
}
