import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * @ignore
 */
export class KellyTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("ColorSet").setAll({
			colors: [
				Color.fromHex(0xF3C300),
				Color.fromHex(0x875692),
				Color.fromHex(0xF38400),
				Color.fromHex(0xA1CAF1),
				Color.fromHex(0xBE0032),
				Color.fromHex(0xC2B280),
				Color.fromHex(0x848482),
				Color.fromHex(0x008856),
				Color.fromHex(0xE68FAC),
				Color.fromHex(0x0067A5),
				Color.fromHex(0xF99379),
				Color.fromHex(0x604E97),
				Color.fromHex(0xF6A600),
				Color.fromHex(0xB3446C),
				Color.fromHex(0xDCD300),
				Color.fromHex(0x882D17),
				Color.fromHex(0x8DB600),
				Color.fromHex(0x654522),
				Color.fromHex(0xE25822),
				Color.fromHex(0x2B3D26),
				Color.fromHex(0xF2F3F4),
				Color.fromHex(0x222222)
			],
			reuse: true
		});
	}
}
