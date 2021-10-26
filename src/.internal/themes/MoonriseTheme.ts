import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * @ignore
 */
export class MoonriseTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0x3a1302),
				Color.fromHex(0x601205),
				Color.fromHex(0x8a2b0d),
				Color.fromHex(0xc75e24),
				Color.fromHex(0xc79f59),
				Color.fromHex(0xa4956a),
				Color.fromHex(0x868569),
				Color.fromHex(0x756f61),
				Color.fromHex(0x586160),
				Color.fromHex(0x617983)
			],
			reuse: true
		});
	}
}
