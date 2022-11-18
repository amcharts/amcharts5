import { Theme } from "../../core/Theme";
import { percent, p50, p100 } from "../../core/util/Percent";
import { ColorSet } from "../../core/util/ColorSet";
import { setColor } from "../../themes/DefaultTheme";


/**
 * @ignore
 */
export class PercentDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const ic = this._root.interfaceColors;
		const r = this.rule.bind(this);

		/**
		 * ========================================================================
		 * charts/percent
		 * ========================================================================
		 */

		r("PercentSeries").setAll({
			legendLabelText: "{category}",
			legendValueText: "{valuePercentTotal.formatNumber('0.00p')}",
			colors: ColorSet.new(this._root, {}),
			width: p100,
			height: p100
		});

		/**
		 * ========================================================================
		 * charts/pie
		 * ========================================================================
		 */

		r("PieChart").setAll({
			radius: percent(80),
			startAngle: -90,
			endAngle: 270
		})

		r("PieSeries").setAll({
			alignLabels: true,
			startAngle: -90,
			endAngle: 270
		});

		r("PieSeries").states.create("hidden", { endAngle: -90, opacity: 0 });

		r("Slice", ["pie"]).setAll({
			position: "absolute",
			isMeasured: false,
			x: 0,
			y: 0,
			toggleKey: "active",
			tooltipText: "{category}: {valuePercentTotal.formatNumber('0.00p')}",
			strokeWidth: 1,
			strokeOpacity: 1,
			role: "figure",
			lineJoin:"round"
		});

		r("Slice", ["pie"]).states.create("active", { shiftRadius: 20, scale: 1 });
		r("Slice", ["pie"]).states.create("hoverActive", { scale: 1.04 });
		r("Slice", ["pie"]).states.create("hover", { scale: 1.04 });

		r("RadialLabel", ["pie"]).setAll({
			textType: "aligned",
			radius: 10,
			text: "{category}: {valuePercentTotal.formatNumber('0.00p')}",
			paddingTop: 5,
			paddingBottom: 5,
			populateText: true
		});

		r("Tick", ["pie"]).setAll({
			location: 1
		});


		/**
		 * ========================================================================
		 * charts/funnel
		 * ========================================================================
		 */

		r("SlicedChart").setAll({
			paddingLeft: 10,
			paddingRight: 10,
			paddingTop: 10,
			paddingBottom: 10
		});

		/**
		 * ------------------------------------------------------------------------
		 * charts/funnel: Funnel
		 * ------------------------------------------------------------------------
		 */

		r("FunnelSeries").setAll({
			startLocation: 0,
			endLocation: 1,
			orientation: "vertical",
			alignLabels: true,
			sequencedInterpolation: true
		});

		r("FunnelSlice").setAll({
			interactive: true,
			expandDistance: 0,
			//tooltipText: "{category}: {valuePercentTotal.formatNumber('0.00p')}"
		});

		r("FunnelSlice").states.create("hover", { expandDistance: 0.15 })

		r("Label", ["funnel"]).setAll({
			populateText: true,
			text: "{category}: {valuePercentTotal.formatNumber('0.00p')}",
			centerY: p50
		});

		r("Label", ["funnel", "horizontal"]).setAll({
			centerX: 0,
			centerY: p50,
			rotation: -90
		});

		// Class: Label
		r("Label", ["funnel", "vertical"]).setAll({
			centerY: p50,
			centerX: 0
		});

		r("Tick", ["funnel"]).setAll({
			location: 1
		});

		r("FunnelSlice", ["funnel", "link"]).setAll({
			fillOpacity: 0.5,
			strokeOpacity: 0,
			expandDistance: -0.1
		});

		r("FunnelSlice", ["funnel", "link", "vertical"]).setAll({
			height: 10,
		});

		r("FunnelSlice", ["funnel", "link", "horizontal"]).setAll({
			width: 10
		});


		/**
		 * ------------------------------------------------------------------------
		 * charts/funnel: Pyramid
		 * ------------------------------------------------------------------------
		 */

		r("PyramidSeries").setAll({
			valueIs: "area"
		});

		r("FunnelSlice", ["pyramid", "link"]).setAll({
			fillOpacity: 0.5
		});

		r("FunnelSlice", ["pyramid", "link", "vertical"]).setAll({
			height: 0
		});

		r("FunnelSlice", ["pyramid", "link", "horizontal"]).setAll({
			width: 0
		});

		r("FunnelSlice", ["pyramid"]).setAll({
			interactive: true,
			expandDistance: 0
		});

		r("FunnelSlice", ["pyramid"]).states.create("hover", { expandDistance: 0.15 });

		r("Label", ["pyramid"]).setAll({
			populateText: true,
			text: "{category}: {valuePercentTotal.formatNumber('0.00p')}",
			centerY: p50
		});

		r("Label", ["pyramid", "horizontal"]).setAll({
			centerX: 0,
			centerY: p50,
			rotation: -90
		});

		r("Label", ["pyramid", "vertical"]).setAll({
			centerY: p50,
			centerX: 0
		});

		r("Tick", ["pyramid"]).setAll({
			location: 1
		});


		/**
		 * ------------------------------------------------------------------------
		 * charts/funnel: Pictorial
		 * ------------------------------------------------------------------------
		 */

		// Class: FunnelSlice
		r("FunnelSlice", ["pictorial"]).setAll({
			interactive: true,
			tooltipText: "{category}: {valuePercentTotal.formatNumber('0.00p')}"
		});

		r("Label", ["pictorial"]).setAll({
			populateText: true,
			text: "{category}: {valuePercentTotal.formatNumber('0.00p')}",
			centerY: p50
		});

		r("Label", ["pictorial", "horizontal"]).setAll({
			centerX: 0,
			centerY: p50,
			rotation: -90
		});

		r("Label", ["pictorial", "vertical"]).setAll({
			centerY: p50,
			centerX: 0
		});

		r("FunnelSlice", ["pictorial", "link"]).setAll({
			fillOpacity: 0.5,
			width: 0,
			height: 0
		});

		r("Tick", ["pictorial"]).setAll({
			location: 0.5
		});

		{
			const rule = r("Graphics", ["pictorial", "background"]);

			rule.setAll({
				fillOpacity: 0.2
			});

			setColor(rule, "fill", ic, "alternativeBackground");
		}

	}
}
