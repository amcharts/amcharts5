import { MaterialTheme } from "./MaterialTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Material Dark" — the `Material` palette on a dark ground. Reuses the Material
 * series colors (lifting any too-dark entries so they read on the dark ground)
 * and applies a neutral dark set of interface colors.
 *
 * This is a standalone theme; it does not modify the built-in `Material` theme.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class MaterialDarkTheme extends MaterialTheme {
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
