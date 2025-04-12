import { Theme } from "../../core/Theme";
import { percent } from "../../core/util/Percent";


/**
 * @ignore
 */
export class CurveDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const r = this.rule.bind(this);


		/**
		 * ========================================================================
		 * charts/timeline
		 * ========================================================================
		 */

		r("SpiralChart").setAll({
			levelCount: 3,
			endAngle: 0,
			startAngle: -90,
			yAxisRadius: percent(60),
			innerRadius: percent(20)
		});

		r("SerpentineChart").setAll({
			levelCount: 3,
			orientation: "vertical",
			startLocation: 0,
			endLocation: 1
		});

		r("CurveColumnSeries").setAll({
			clustered: true
		});

		r("Slice", ["curve", "column", "series"]).setAll({
			width: percent(50),
			height: percent(50)
		});

		r("AxisRendererCurveY").setAll({
			minGridDistance: 20,
			inversed: false,
			cellStartLocation: 0,
			cellEndLocation: 1,
			rotateLabels: false,
			axisLocation: 0.5,
			axisLength: 60
		});

		r("AxisRendererCurveX").setAll({
			minGridDistance: 100,
			inversed: false,
			cellStartLocation: 0,
			cellEndLocation: 1,
			rotateLabels: false
		});

		r("RadialLabel", ["circular"]).setAll({
			textType: "circular",
			paddingTop: 1,
			paddingRight: 0,
			paddingBottom: 1,
			paddingLeft: 0,
			centerX: 0,
			centerY: 0,
			radius: 8
		});


		r("AxisLabelRadial", ["category"]).setAll({
			text: "{category}",
			populateText: true
		});

		r("RadialLabel", ["radial"]).setAll({
			textType: "regular",
			centerX: 0,
			textAlign: "right"
		});
	}
}
