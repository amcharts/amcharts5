import { Theme } from "../core/Theme";

/**
 * @ignore
 */
export class AnimatedTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		this.rule("Component").setAll({
			interpolationDuration: 600
		});

		this.rule("Hierarchy").set("animationDuration", 600);
		this.rule("Scrollbar").set("animationDuration", 600);

		this.rule("Tooltip").set("animationDuration", 300);

		this.rule("MapChart").set("animationDuration", 1000);
		this.rule("MapChart").set("wheelDuration", 300);

		this.rule("Entity").setAll({
			stateAnimationDuration: 600
		});

		this.rule("Sprite").states.create("default", { stateAnimationDuration: 600 });

		this.rule("Tooltip", ["axis"]).setAll({
			animationDuration: 200
		});

		this.rule("WordCloud").set("animationDuration", 500);
		this.rule("Polygon").set("animationDuration", 600);
		this.rule("ArcDiagram").set("animationDuration", 600);
	}
}
