import { Theme } from "../../core/Theme";
import { p50 } from "../../core/util/Percent";
import { setColor } from "../../themes/DefaultTheme";

import { geoMercator } from "d3-geo";

import * as $ease from "../../core/util/Ease";


/**
 * @ignore
 */
export class MapChartDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const ic = this._root.interfaceColors;

		/**
		 * ========================================================================
		 * charts/map
		 * ========================================================================
		 */

		this.rule("MapChart").setAll({
			projection: geoMercator(),
			panX: "translateX",
			panY: "translateY",
			pinchZoom: true,
			zoomStep: 2,
			zoomLevel: 1,
			rotationX: 0,
			rotationY: 0,
			rotationZ: 0,
			maxZoomLevel: 32,
			minZoomLevel: 1,
			wheelY: "zoom",
			wheelX: "none",
			animationEasing: $ease.out($ease.cubic),
			wheelEasing: $ease.out($ease.cubic),
			wheelDuration: 0,
			wheelSensitivity: 1,
			maxPanOut: 0.4
		});

		{
			const rule = this.rule("MapLine");

			rule.setAll({
				precision: 0.5,
				role: "figure",
			});

			setColor(rule, "stroke", ic, "grid");
		}

		this.rule("MapPointSeries").setAll({
			clipFront: false,
			clipBack: true
		})

		{
			const rule = this.rule("MapPolygon");

			rule.setAll({
				precision: 0.5,
				isMeasured: false,
				role: "figure",
				fillOpacity: 1,
				position: "absolute",
				strokeWidth: 0.2,
				strokeOpacity: 1,
			});

			setColor(rule, "fill", ic, "primaryButton");
			setColor(rule, "stroke", ic, "background");
		}

		this.rule("Graphics", ["map", "button", "plus", "icon"]).setAll({
			x: p50,
			y: p50,
			draw: (display) => {
				display.moveTo(-4, 0);
				display.lineTo(4, 0);
				display.moveTo(0, -4);
				display.lineTo(0, 4);
			}
		});

		this.rule("Graphics", ["map", "button", "minus", "icon"]).setAll({
			x: p50,
			y: p50,
			draw: (display) => {
				display.moveTo(-4, 0);
				display.lineTo(4, 0);
			}
		});


		/**
		 * ------------------------------------------------------------------------
		 * charts/map: Series
		 * ------------------------------------------------------------------------
		 */

		this.rule("GraticuleSeries").setAll({
			step: 10
		});


	}
}
