import { FrozenTheme } from "./FrozenTheme";
import { darkInterfaceColors, liftDarkColors } from "./DarkVariant";

/**
 * "Frozen Dark" — the icy `Frozen` palette on a dark ground. Its pastels are
 * already bright, so the palette comes through essentially unchanged; only a
 * neutral dark set of interface colors is applied.
 *
 * This is a standalone theme; it does not modify the built-in `Frozen` theme.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class FrozenDarkTheme extends FrozenTheme {
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
