import { Theme } from "../../core/Theme";
import { percent, p100, p50 } from "../../core/util/Percent";
import { Rectangle } from "../../core/render/Rectangle";

import * as $ease from "../../core/util/Ease";


/**
 * @ignore
 */
export class WordCloudDefaultTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		const ic = this._root.interfaceColors;
		const r = this.rule.bind(this);

		r("WordCloud").setAll({
			width: p100,
			height: p100,
			minFontSize: percent(2),
			maxFontSize: percent(15),
			excludeWords: [],
			angles: [0, -90],
			minWordLength: 1,
			step: 15,
			randomness: 0,
			autoFit: true,
			// the whole layout is computed in one pass; sequencing the reveal
			// gives a staggered word-by-word appearance (15ms per word)
			sequencedInterpolation: true,
			sequencedDelay: 15,
			animationEasing: $ease.out($ease.cubic)
		});

		// the `svgPath` shape silhouette rendered behind the words: a faint
		// fill by default, user-styleable via `series.shape`
		r("Graphics", ["wordcloud", "shape"]).setAll({
			fill: ic.get("alternativeBackground"),
			fillOpacity: 0.1
		});

		{
			const rule = r("Label", ["wordcloud"]);

			rule.setAll({
				text: "{category}",
				centerX: p50,
				centerY: p50,
				position: "absolute",
				lineHeight: p100,
				populateText: true
			});

			rule.setup = (target) => {
				target.set("background", Rectangle.new(this._root, {
					fill: ic.get("background"),
					fillOpacity: 0
				}));
			}
		}

	}
}
