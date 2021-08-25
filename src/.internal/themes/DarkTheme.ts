import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * @ignore
 */
export class DarkTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("InterfaceColors").setAll({
			text: Color.fromHex(0xffffff),
			grid: Color.fromHex(0xffffff)
		});

	}
}
