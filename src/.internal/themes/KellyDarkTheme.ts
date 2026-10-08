import { KellyTheme } from "./KellyTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Kelly Dark": the high-contrast `Kelly` palette on a dark background, with
 * neutral dark interface colors. Its darker colors are lightened to show on
 * the background. Use it in place of `Kelly`.
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
