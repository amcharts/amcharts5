import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";

/**
 * @ignore
 */
export class DarkTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0x000000),
			fill: Color.fromHex(0x2b2b2b),
			primaryButton: Color.lighten(Color.fromHex(0x6794dc), -0.2),
			primaryButtonHover: Color.lighten(Color.fromHex(0x6771dc), -0.2),
			primaryButtonDown: Color.lighten(Color.fromHex(0x68dc75), -0.2),
			primaryButtonActive: Color.lighten(Color.fromHex(0x68dc76), -0.2),
			primaryButtonText: Color.fromHex(0xffffff),
			primaryButtonStroke: Color.lighten(Color.fromHex(0x6794dc), -0.2),

			secondaryButton: Color.fromHex(0x3b3b3b),
			secondaryButtonHover: Color.lighten(Color.fromHex(0x3b3b3b), 0.1),
			secondaryButtonDown: Color.lighten(Color.fromHex(0x3b3b3b), 0.15),
			secondaryButtonActive: Color.lighten(Color.fromHex(0x3b3b3b), 0.2),
			secondaryButtonText: Color.fromHex(0xbbbbbb),
			secondaryButtonStroke: Color.lighten(Color.fromHex(0x3b3b3b), -0.2),

			grid: Color.fromHex(0xbbbbbb),
			background: Color.fromHex(0x000000),
			alternativeBackground: Color.fromHex(0xffffff),
			text: Color.fromHex(0xffffff),
			alternativeText: Color.fromHex(0x000000),
			disabled: Color.fromHex(0xadadad),
			positive: Color.fromHex(0x50b300),
			negative: Color.fromHex(0xb30000)
		});

	}
}
