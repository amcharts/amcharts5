import { Theme } from "../core/Theme";
import { percent } from "../core/util/Percent";

/**
 * @ignore
 */
export class MicrochartTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("Chart").setAll({
			paddingTop: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingLeft: 0
		});

		this.rule("XYChart").setAll({
			paddingTop: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingLeft: 0
		});

		this.rule("SlicedChart").setAll({
			paddingTop: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingLeft: 0
		});

		this.rule("Tree").setAll({
			paddingTop: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingLeft: 0
		});

		this.rule("Pack").setAll({
			paddingTop: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingLeft: 0
		});

		this.rule("Flow").setAll({
			paddingTop: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingLeft: 0
		});

		this.rule("Button", ["resize"]).setAll({
			visible: false
		});

		this.rule("Button", ["zoom"]).setAll({
			scale: 0.5
		});

		this.rule("Axis").setAll({
			visible: false
		});

		this.rule("Label", ["axis"]).setAll({
			visible: false
		});

		this.rule("Grid").setAll({
			visible: false
		});

		this.rule("Tooltip", ["axis"]).setAll({
			visible: false
		});

		this.rule("PieChart").setAll({
			radius: percent(99)
		});

		this.rule("Label", ["pie"]).setAll({
			visible: false
		});

		this.rule("Tick", ["pie"]).setAll({
			visible: false
		});
	}
}
