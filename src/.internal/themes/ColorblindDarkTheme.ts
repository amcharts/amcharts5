import { ColorblindTheme } from "./ColorblindTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Colorblind Dark" — the color-vision-deficiency-safe Okabe-Ito palette on a
 * dark ground. Reuses the light theme's palette (lifting its black entry so it
 * reads on the dark ground) and applies a neutral dark set of interface colors.
 *
 * This is a standalone theme; it does not modify the built-in `Colorblind`
 * theme.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
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
