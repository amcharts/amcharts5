import { Theme } from "../../core/Theme";
import { percent } from "../../core/util/Percent";
import { setColor } from "../../themes/DefaultTheme";


/**
 * @ignore
 */
export class RadarDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const r = this.rule.bind(this);

		const ic = this._root.interfaceColors;


		/**
		 * ========================================================================
		 * charts/radar
		 * ========================================================================
		 */

		r("RadarChart").setAll({
			radius: percent(80),
			innerRadius: 0,
			startAngle: -90,
			endAngle: 270
		});

		r("RadarColumnSeries").setAll({
			clustered: true
		});

		r("Slice", ["radar", "column", "series"]).setAll({
			width: percent(80),
			height: percent(80)
		});

		r("RadarLineSeries").setAll({
			connectEnds: true
		});

		r("SmoothedRadarLineSeries").setAll({
			tension: 0.5
		});

		r("AxisRendererRadial").setAll({
			minGridDistance: 40,
			axisAngle: -90,
			inversed: false,
			cellStartLocation: 0,
			cellEndLocation: 1
		});

		r("AxisRendererCircular").setAll({
			minGridDistance: 100,
			inversed: false,
			cellStartLocation: 0,
			cellEndLocation: 1
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
			text:"{category}",
			populateText:true
		});			

		r("RadialLabel", ["radial"]).setAll({
			textType: "regular",
			centerX: 0,
			textAlign: "right"
		});

		r("RadarChart", ["gauge"]).setAll({
			startAngle: 180,
			endAngle: 360,
			innerRadius: percent(90)
		});

		r("ClockHand").setAll({
			topWidth: 1,
			bottomWidth: 10,
			radius: percent(90),
			pinRadius: 10
		});

		{
			const rule = r("Graphics", ["clock", "hand"]);

			rule.setAll({
				fillOpacity: 1
			});

			setColor(rule, "fill", ic, "alternativeBackground");
		}

		{
			const rule = r("Graphics", ["clock", "pin"]);

			rule.setAll({
				fillOpacity: 1
			});

			setColor(rule, "fill", ic, "alternativeBackground");
		}

	}
}
