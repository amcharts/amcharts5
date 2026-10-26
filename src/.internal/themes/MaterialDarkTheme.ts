import { MaterialTheme } from "./MaterialTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Material Dark": the `Material` palette on a dark background, with neutral
 * dark interface colors. Colors too dark to show on the background are
 * lightened. Use it in place of `Material`.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
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
