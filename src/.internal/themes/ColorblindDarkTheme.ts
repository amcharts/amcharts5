import { ColorblindTheme } from "./ColorblindTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Colorblind Dark": the `Colorblind` palette on a dark background, with
 * neutral dark interface colors. Colors too dark to show on the background,
 * such as black, are lightened. Use it in place of `Colorblind`.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
 * @important
 */
export class ColorblindDarkTheme extends ColorblindTheme {
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
