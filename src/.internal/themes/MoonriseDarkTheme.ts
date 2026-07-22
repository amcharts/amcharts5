import { MoonriseTheme } from "./MoonriseTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Moonrise Dark" — the earthy `Moonrise` palette on a dark ground. Reuses the
 * Moonrise series colors (lifting the near-black browns at the dark end so they
 * read on the dark ground) and applies a neutral dark set of interface colors.
 *
 * This is a standalone theme; it does not modify the built-in `Moonrise` theme.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
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
