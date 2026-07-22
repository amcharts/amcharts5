import { DatavizTheme } from "./DatavizTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Dataviz Dark" — the `Dataviz` palette on a dark ground. Reuses the Dataviz
 * series colors (lifting any too-dark entries so they read on the dark ground)
 * and applies a neutral dark set of interface colors.
 *
 * This is a standalone theme; it does not modify the built-in `Dataviz` theme.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class DatavizDarkTheme extends DatavizTheme {
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
