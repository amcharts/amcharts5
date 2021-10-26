import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * @ignore
 */
export class FrozenTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xbec4f8),
				Color.fromHex(0xa5abee),
				Color.fromHex(0x6a6dde),
				Color.fromHex(0x4d42cf),
				Color.fromHex(0x713e8d),
				Color.fromHex(0xa160a0),
				Color.fromHex(0xeb6eb0),
				Color.fromHex(0xf597bb),
				Color.fromHex(0xfbb8c9),
				Color.fromHex(0xf8d4d8)
			],
			reuse: true
		});
	}
}
