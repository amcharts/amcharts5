import { FrozenTheme } from "./FrozenTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Frozen Dark": the icy `Frozen` palette on a dark background, with neutral
 * dark interface colors. Its darkest colors, the deep violet and purple, are
 * lightened to show on the background. Use it in place of `Frozen`.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class FrozenDarkTheme extends FrozenTheme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const colorSet = this.rule("ColorSet");
		const colors = colorSet.get("colors");
		if (colors) {
			colorSet.set("colors", liftDarkColors(colors));
		}

		this.rule("InterfaceColors").setAll(darkInterfaceColors());
	}
}
