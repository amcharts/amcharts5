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
			animationEasing: $ease.out($ease.cubic)
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
