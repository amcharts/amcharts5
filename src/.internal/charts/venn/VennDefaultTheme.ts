import { Theme } from "../../core/Theme";
import { p50, p100 } from "../../core/util/Percent";
import { ColorSet } from "../../core/util/ColorSet";


/**
 * @ignore
 */
export class VennDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();
		const r = this.rule.bind(this);

		r("Venn").setAll({
			legendLabelText: "{category}",
			legendValueText: "{value}",
			colors: ColorSet.new(this._root, {}),
			width: p100,
			height: p100
		});


		r("Label", ["venn"]).setAll({
			text: "{category}",
			populateText: true,
			centerX: p50,
			centerY: p50
		});

	}
}
