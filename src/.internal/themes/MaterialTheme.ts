import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * @ignore
 */
export class MaterialTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xF44336),
				Color.fromHex(0xE91E63),
				Color.fromHex(0x9C27B0),
				Color.fromHex(0x673AB7),
				Color.fromHex(0x3F51B5),
				Color.fromHex(0x2196F3),
				Color.fromHex(0x03A9F4),
				Color.fromHex(0x00BCD4),
				Color.fromHex(0x009688),
				Color.fromHex(0x4CAF50),
				Color.fromHex(0x8BC34A),
				Color.fromHex(0xCDDC39),
				Color.fromHex(0xFFEB3B),
				Color.fromHex(0xFFC107),
				Color.fromHex(0xFF9800),
				Color.fromHex(0xFF5722),
				Color.fromHex(0x795548),
				Color.fromHex(0x9E9E9E),
				Color.fromHex(0x607D8B)
			],
			reuse: true
		});
	}
}
