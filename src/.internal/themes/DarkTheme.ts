import { Theme } from "../core/Theme";
import { Color } from "../core/util/Color";

/**
 * @ignore
 */
export class DarkTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("Slice").set("innerRadius", 20);
		this.rule("Label").set("fontSize", 7);
		this.rule("Tick", ["pie"]).set("strokeOpacity", 0.5);

		this.rule("Slice", ["pie"]).setAll({
			strokeOpacity: 1,
			strokeWidth: 1,
			stroke: Color.fromHex(0xffffff),
			fillOpacity: 0.7,
		});
	}
}
