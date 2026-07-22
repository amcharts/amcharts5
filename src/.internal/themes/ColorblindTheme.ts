import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * "Colorblind" — a color-vision-deficiency-safe qualitative palette based on
 * the Okabe-Ito eight-color set, which stays distinguishable under the common
 * forms of color blindness (protanopia, deuteranopia, tritanopia).
 *
 * Like `Dataviz` and `Kelly`, this theme only sets the series palette; it does
 * not change interface colors, so it layers cleanly on top of the default
 * (light) look. The canonical Okabe-Ito order leads with black; here the eight
 * colors are re-ordered to lead with color so the first series reads as a hue,
 * with black kept in the set for later series.
 *
 * @see {@link https://jfly.uni-koeln.de/color/} for the original palette
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class ColorblindTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xe69f00), // orange
				Color.fromHex(0x56b4e9), // sky blue
				Color.fromHex(0x009e73), // bluish green
				Color.fromHex(0xf0e442), // yellow
				Color.fromHex(0x0072b2), // blue
				Color.fromHex(0xd55e00), // vermillion
				Color.fromHex(0xcc79a7), // reddish purple
				Color.fromHex(0x000000)  // black
			],
			// Loop the safe set rather than generating off-palette colors, which
			// would break the color-blindness guarantee.
			reuse: true
		});
	}
}
