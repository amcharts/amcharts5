import { KellyTheme } from "./KellyTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Kelly Dark" — the `Kelly` maximum-contrast palette on a dark ground. Reuses
 * the Kelly series colors (lifting the few near-black entries so they read on
 * the dark ground) and applies a neutral dark set of interface colors.
 *
 * This is a standalone theme; it does not modify the built-in `Kelly` theme.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class KellyDarkTheme extends KellyTheme {
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
