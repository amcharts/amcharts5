import { Theme } from "../../core/Theme";
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
		const r = this.rule.bind(this);

		/**
		 * ========================================================================
		 * charts/map
		 * ========================================================================
		 */

		r("MapChart").setAll({
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
			maxPanOut: 0.4,
			centerMapOnZoomOut: true
		});

		{
			const rule = r("MapLine");

			rule.setAll({
				precision: 0.5,
				role: "figure",
			});

			setColor(rule, "stroke", ic, "grid");
		}

		r("MapPolygonSeries").setAll({
			affectsBounds: true
		})


		r("MapPointSeries").setAll({
			affectsBounds: false,
			clipFront: false,
			clipBack: true,
			autoScale: false
		})

		r("ClusteredPointSeries").setAll({
			minDistance: 20,
			scatterDistance: 3,
			scatterRadius: 8,
			stopClusterZoom: 0.95
		})

		r("MapLineSeries").setAll({
			affectsBounds: false
		})

		{
			const rule = r("MapPolygon");

			rule.setAll({
				precision: 0.5,
				isMeasured: false,
				role: "figure",
				fillOpacity: 1,
				position: "absolute",
				strokeWidth: 0.2,
				strokeOpacity: 1
			});

			setColor(rule, "fill", ic, "primaryButton");
			setColor(rule, "stroke", ic, "background");
		}


		r("Button", ["zoomtools", "home"]).setAll({
			visible: false
		});

		/**
		 * ------------------------------------------------------------------------
		 * charts/map: Series
		 * ------------------------------------------------------------------------
		 */

		r("GraticuleSeries").setAll({
			step: 10
		});
	}
}
