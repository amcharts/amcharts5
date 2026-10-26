import { DatavizTheme } from "./DatavizTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Dataviz Dark": the `Dataviz` palette on a dark background, with neutral
 * dark interface colors. Colors too dark to show on the background are
 * lightened. Use it in place of `Dataviz`.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/themes/} for more info
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
