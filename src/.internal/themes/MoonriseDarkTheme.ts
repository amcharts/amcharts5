import { MoonriseTheme } from "./MoonriseTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Moonrise Dark": the earthy `Moonrise` palette on a dark background, with
 * neutral dark interface colors. Its darkest colors are lightened to show on
 * the background. Use it in place of `Moonrise`.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
 * @important
 */
export class MoonriseDarkTheme extends MoonriseTheme {
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
