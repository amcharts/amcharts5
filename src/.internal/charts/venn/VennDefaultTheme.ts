import { Theme } from "../../core/Theme";
import { p50, p100 } from "../../core/util/Percent";
import { ColorSet } from "../../core/util/ColorSet";


/**
 * @ignore
 */
export class VennDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("Venn").setAll({
			legendLabelText: "{category}",
			legendValueText: "{value}",
			colors: ColorSet.new(this._root, {}),
			width: p100,
			height: p100
		});


		this.rule("Label", ["venn"]).setAll({
			text: "{category}",
			populateText: true,
			centerX: p50,
			centerY: p50
		});

	}
}
