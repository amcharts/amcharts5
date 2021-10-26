import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * @ignore
 */
export class SpiritedTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0x65738e),
				Color.fromHex(0x766c91),
				Color.fromHex(0x78566f),
				Color.fromHex(0x523b58),
				Color.fromHex(0x813b3d),
				Color.fromHex(0xbc5e52),
				Color.fromHex(0xee8b78),
				Color.fromHex(0xf9c885),
				Color.fromHex(0xeba05c),
				Color.fromHex(0x9b5134)
			],
			reuse: true
		});
	}
}
