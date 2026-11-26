import { ResponsiveBaseTheme, IResponsiveRule } from "./ResponsiveBaseTheme";
import { p100, percent } from "../core/util/Percent";
import type { Root } from "../core/Root";
import type { IDisposer } from "../core/util/Disposer";
import type { Sprite } from "../core/render/Sprite";
import type { Container } from "../core/render/Container";
import { passLater } from "../core/util/Fit";
import * as $array from "../core/util/Array";
import * as $object from "../core/util/Object";

/**
 * A theme that fits charts to small spaces by adapting them, hiding parts
 * only as the last step. It turns on the settings that fit labels and legends
 * to the room they have:
 *
 * * `autoLabels` on axis renderers: labels spaced to fit, and hidden where
 *   they would be cut off or overlap another axis's labels.
 * * `keepInView` on axis labels of a chart 400 px or smaller across the
 *   axis: a category or date period partly in view keeps its label in the
 *   part that is.
 * * `autoLabels` on pie series: the pie moves aside or gets smaller, and its
 *   labels wrap, are shortened or are hidden, smallest slices first.
 * * `autoLabels` on other series: bullet labels that would overlap or be cut
 *   off are hidden. Drawings on a stock chart are left alone.
 * * `autoFit` on legends: smaller, then scrolling, with long names shortened.
 * * `autoFit` on stock toolbars: controls that do not fit in one row fold,
 *   labels that repeat an icon first, then the period buttons.
 * * `autoHide` on chart scrollbars: a vertical one goes on a chart 400 px wide
 *   or narrower, a horizontal one on a chart 300 px tall or lower, or 400 px
 *   wide or narrower (a stock chart is measured whole, not by panel); pinching
 *   zooms instead.
 * * `touchGestures: "auto"` on the root, when the theme is set on the root
 *   and `touchGestures` is not set in code: a vertical swipe on a chart
 *   scrolls the page, one that starts sideways or uses two fingers works
 *   the chart.
 *
 * Below 400 px, text is drawn at 85% of its size, and axis labels, legend
 * items and word cloud words get less padding; scrollbars get smaller margins.
 * Charts keep their padding, except stock charts 400 px wide or narrower:
 * their panels sit 6 px from the chart's edges and from each other. Funnel,
 * pyramid and pictorial labels stay unless the chart is tiny, and radar
 * labels stay outside the circle.
 *
 * Labels added in code with their own font size, such as a title, are drawn
 * smaller on charts under 600 × 450 px instead, down to three quarters of
 * their size; a label in the middle of a donut is fitted to the hole by the
 * pie's `autoLabels`. A label whose own `scale` is set is left alone.
 *
 * Settings set on an element in code win over the theme, as with any theme:
 * `autoLabels: false` on a series or renderer turns that part off.
 *
 * @see {@link https://docs.amcharts.com/v5/concepts/responsive-max/} for more info
 * @since 5.22.0
 */
export class ResponsiveMaxTheme extends ResponsiveBaseTheme {

	protected _labelsDp?: IDisposer;
	// the scale labels added in code were last given, and when
	protected _labelScale: number = 1;
	protected _labelsAt: number = 0;
	protected _labelsRound: number = 0;

	constructor(root: Root, isReal: boolean) {
		super(root, isReal);
		this._labelsDp = root.events.on("frameended", () => {
			this._scaleLabels();
		});
	}

	public dispose(): void {
		if (this._labelsDp) {
			this._labelsDp.dispose();
		}
		super.dispose();
	}

	// Labels added in code with their own font size get smaller under 600 × 450 px, to three quarters at most
	protected _scaleLabels(): void {
		const rootContainer = this._root._rootContainer;
		const used = this._isUsed();
		const w = rootContainer.getPrivate("width", 0);
		const h = rootContainer.getPrivate("height", 0);
		const scale = used && w > 0 && h > 0 ? Math.max(0.75, Math.min(1, 0.6 + 0.4 * Math.min(w / 600, h / 450))) : 1;
		// labels added later are found within half a second
		const now = Date.now();
		const round = this._root._passRound;
		if (Math.abs(scale - this._labelScale) < 0.005 && (scale == 1 || (now - this._labelsAt < 500 && round == this._labelsRound))) {
			// labels added in the meantime are found once the half second is up
			if (scale != 1) {
				passLater(this._root, 500 - (now - this._labelsAt));
			}
			return;
		}
		this._labelsRound = round;
		this._labelScale = scale;
		this._labelsAt = now;
		this._walkLabels(this._root.container, scale, []);
	}

	protected _walkLabels(container: Container, scale: number, middles: Array<Container>): void {
		container.children.each((child: Sprite) => {
			// `isType` narrows the type, which these checks do not want
			const node: any = child;
			// whatever the chart drew for its data, with all its parts (an axis' labels and grid, bullets, columns)
			if (child.isDisposed() || node._dataItem) {
				return;
			}
			if (child.className == "Label") {
				// not one in a pie's middle
				if (!(container as any).isType("PieSeries") && middles.indexOf(container) == -1) {
					this._scaleLabel(child, scale);
				}
				return;
			}
			// parts that fit their own labels, or have none of the author's
			if (node.isType("Legend") || node.isType("HeatLegend") || node.isType("Button") || node.isType("Tooltip") || node.isType("Scrollbar") || node.isType("AxisRenderer")) {
				return;
			}
			if (!node.children) {
				return;
			}
			if (node.isType("PieChart")) {
				middles = middles.concat([node.seriesContainer]);
			}
			// a series: only labels put in it directly
			if (node.isType("Series")) {
				if (!node.isType("PieSeries")) {
					node.children.each((part: Sprite) => {
						if (part.className == "Label" && !(part as any)._dataItem) {
							this._scaleLabel(part, scale);
						}
					});
				}
				return;
			}
			this._walkLabels(node, scale, middles);
		});
	}

	protected _scaleLabel(label: Sprite, scale: number): void {
		if (label.isUserSetting("scale") && !label.isComputedSetting("scale")) {
			return;
		}
		// a label sized by the theme gets smaller through the theme's font size
		const sized = label.isUserSetting("fontSize" as any) || /fontSize/i.test(label.get("text" as any, ""));
		if (scale < 0.995 && sized) {
			if (Math.abs(label.get("scale", 1) - scale) > 0.005) {
				label._setC("scale", scale);
			}
		}
		else if (label.isComputedSetting("scale")) {
			label.remove("scale");
		}
	}

	/**
	 * Adds a responsive rule and returns it. It applies at once if it is
	 * relevant.
	 *
	 * @param   rule  Responsive rule
	 * @return        Responsive rule
	 */
	public addRule(rule: IResponsiveRule): IResponsiveRule {
		if (typeof rule.tags == "string") {
			rule.tags = [rule.tags];
		}
		return super.addRule(rule);
	}

	/**
	 * Removes a responsive rule from the theme, taking back its settings if
	 * it applies.
	 *
	 * @param  rule  Responsive rule
	 */
	public removeRule(rule: IResponsiveRule): void {
		this._unapplyRule(rule);
		super.removeRule(rule);
	}

	// Takes a rule's settings back. Rules for the same class and tags share a
	// template, so the ones that still apply put theirs back.
	protected _unapplyRule(rule: IResponsiveRule): void {
		if (!rule.applied) {
			return;
		}
		rule.applied = false;
		const template = rule.template;
		if (template && rule.settings) {
			$array.each($object.keys(rule.settings), (key) => {
				template.remove(key);
			});
			$array.each(this.responsiveRules, (other) => {
				if (other !== rule && other.applied && other.template === template && other.settings) {
					template.setAll(other.settings);
				}
			});
		}
		if (rule.removing) {
			rule.removing.call(rule);
		}
	}

	/**
	 * Adds the theme's settings and its rules for small charts. Where two
	 * rules set the same setting, the later one wins while both apply.
	 */
	protected setupDefaultRules(): void {
		// Not the Responsive theme's rules: the settings below do the work of
		// most of them, which hid labels and legends outright.

		this._touchGestures = "auto";

		this.rule("AxisRenderer").set("autoLabels", true);
		this.rule("Series").set("autoLabels", true);
		this.rule("DrawingSeries").set("autoLabels", false);
		this.rule("Legend").set("autoFit", true);
		this.rule("StockToolbar").set("autoFit", true);
		// a desktop chart is often 300-400 px tall but seldom 400 px wide, and a mouse can't pinch
		this.rule("Scrollbar", ["chart", "vertical"]).set("autoHide", 400);
		this.rule("Scrollbar", ["chart", "horizontal"]).set("autoHide", 300);

		const add = (name: string, tags: Array<string>, relevant: (width: number, height: number) => boolean, settings: { [key: string]: any }) => {
			this.addRule({ name: name, tags: tags, relevant: relevant, settings: settings });
		};
		const none: Array<string> = [];
		const forceHidden = { forceHidden: true };


		/**
		 * ========================================================================
		 * Room for the plot
		 * ========================================================================
		 */

		// Charts keep their padding: scrollbar grips and the labels at the ends
		// of the axes reach into it. Text gets smaller below 400 px instead, all
		// of it alike, so an axis tooltip matches the axis labels.
		add("Label", none, ResponsiveBaseTheme.maybeM, { fontSize: "0.85em" });

		add("AxisLabel", none, ResponsiveBaseTheme.maybeM, { paddingTop: 2, paddingBottom: 2, paddingLeft: 3, paddingRight: 3 });

		add("Container", ["legend", "item", "itemcontainer"], ResponsiveBaseTheme.maybeM, { paddingTop: 2, paddingBottom: 2, paddingLeft: 3, paddingRight: 3 });

		// a word cloud keeps a label's padding clear around each word: less of it packs the words closer
		add("Label", ["wordcloud"], ResponsiveBaseTheme.maybeM, { paddingTop: 2, paddingBottom: 2, paddingLeft: 2, paddingRight: 2 });

		add("Scrollbar", ["horizontal"], ResponsiveBaseTheme.heightM, { marginTop: 6, marginBottom: 6 });

		add("Scrollbar", ["vertical"], ResponsiveBaseTheme.widthM, { marginLeft: 6, marginRight: 6 });

		// on a phone-wide chart a horizontal scrollbar costs label room and is hard to hit: pinching zooms instead
		// (tags of its own, as taking the rule back clears its template)
		add("Scrollbar", ["chart", "horizontal", "scrollbar"], ResponsiveBaseTheme.widthM, { autoHide: Infinity });

		// a stock chart on a phone: its padding and the gap above each panel take a lot of a small screen
		add("StockChart", none, ResponsiveBaseTheme.widthM, { paddingLeft: 6, paddingRight: 6, paddingTop: 0, paddingBottom: 6 });
		add("XYChart", ["stock"], ResponsiveBaseTheme.widthM, { paddingTop: 6 });


		/**
		 * ========================================================================
		 * Tiny charts
		 * ========================================================================
		 */

		add("HeatLegend", ["vertical"], ResponsiveBaseTheme.widthXS, forceHidden);
		add("HeatLegend", ["horizontal"], ResponsiveBaseTheme.heightXS, forceHidden);
		add("Label", ["heatlegend", "start"], ResponsiveBaseTheme.maybeXS, forceHidden);
		add("Label", ["heatlegend", "end"], ResponsiveBaseTheme.maybeXS, forceHidden);
		add("Button", ["resize"], ResponsiveBaseTheme.maybeXS, forceHidden);


		/**
		 * ========================================================================
		 * XY
		 * ========================================================================
		 */

		// At 200 px or less, axis labels go inside the plot, as with the
		// Responsive theme
		add("AxisRendererX", none, ResponsiveBaseTheme.heightXS, { inside: true });
		add("AxisRendererY", none, ResponsiveBaseTheme.widthXS, { inside: true });
		add("AxisLabel", ["x"], ResponsiveBaseTheme.heightXS, { minPosition: 0.1, maxPosition: 0.9 });
		add("AxisLabel", ["y"], ResponsiveBaseTheme.widthXS, { centerY: p100, maxPosition: 0.9 });
		add("AxisTick", ["x"], ResponsiveBaseTheme.heightXS, { inside: true, minPosition: 0.1, maxPosition: 0.9 });
		add("AxisTick", ["y"], ResponsiveBaseTheme.widthXXS, { inside: true, minPosition: 0.1, maxPosition: 0.9 });

		// A short axis shows few categories or periods: one running out of view keeps its label in the
		// part still in view. A long one has labels enough, which stay evenly spaced
		add("AxisLabel", ["x"], ResponsiveBaseTheme.widthM, { keepInView: true });
		add("AxisLabel", ["y"], ResponsiveBaseTheme.heightM, { keepInView: true });

		// Minor labels only with room to spare; at 100 px or less no labels or grid
		add("AxisLabel", ["x", "minor"], ResponsiveBaseTheme.widthL, forceHidden);
		// except a Gantt chart's row of days, an axis of its own whose letters fit
		add("AxisLabel", ["x", "minor", "gantt"], (w, h) => ResponsiveBaseTheme.widthL(w, h) && !ResponsiveBaseTheme.heightXXS(w, h), { forceHidden: false });
		// A narrow Gantt chart keeps the add, link and delete buttons and drops expand, collapse and color,
		// which would run into the date header. Its plot is dragged to move through time and tasks, so
		// at 500 px wide it drops both scrollbars, and at 400 px tall the horizontal one
		add("Button", ["gantt", "controls", "expand"], ResponsiveBaseTheme.widthL, forceHidden);
		add("Button", ["gantt", "controls", "collapse"], ResponsiveBaseTheme.widthL, forceHidden);
		add("ColorPickerButton", ["gantt", "controls"], ResponsiveBaseTheme.widthL, forceHidden);
		// Its task names get more room: no grip (the whole row drags), no up/down buttons by the duration
		// (it can still be typed in, or the bar resized), a narrower triangle and a smaller indent for subtasks
		add("Rectangle", ["gantt", "grip", "axislabel"], ResponsiveBaseTheme.widthL, forceHidden);
		add("Container", ["durationstepper", "buttons"], ResponsiveBaseTheme.widthL, forceHidden);
		add("EditableLabel", ["axis"], ResponsiveBaseTheme.widthL, { paddingLeft: 2, paddingRight: 2 });
		add("Button", ["taskbullet"], ResponsiveBaseTheme.widthL, { width: 20, paddingLeft: 2, paddingRight: 2 });
		add("GanttCategoryAxis", none, ResponsiveBaseTheme.widthL, { childShift: 12 });
		add("Scrollbar", ["gantt", "horizontal"], (w, h) => w <= 500 || ResponsiveBaseTheme.heightM(w, h), forceHidden);
		add("Scrollbar", ["gantt", "vertical"], (w) => w <= 500, forceHidden);
		add("AxisLabel", ["y", "minor"], ResponsiveBaseTheme.heightL, forceHidden);
		add("AxisLabel", ["x"], ResponsiveBaseTheme.heightXXS, forceHidden);
		add("AxisLabel", ["y"], ResponsiveBaseTheme.widthXXS, forceHidden);
		add("Grid", none, ResponsiveBaseTheme.maybeXXS, forceHidden);


		/**
		 * ========================================================================
		 * Pie
		 * ========================================================================
		 */

		// Labels are fitted by `autoLabels`; a tiny pie drops them and takes the room
		add("PieChart", none, ResponsiveBaseTheme.isXS, { radius: percent(99) });
		add("RadialLabel", ["pie"], ResponsiveBaseTheme.isXS, forceHidden);
		add("Tick", ["pie"], ResponsiveBaseTheme.isXS, forceHidden);


		/**
		 * ========================================================================
		 * Funnel, pyramid, pictorial
		 * ========================================================================
		 */

		// Labels move into the slices at 400 px or less, and go only at 200 px or less
		const sliced: Array<[string, string]> = [["FunnelSeries", "funnel"], ["PyramidSeries", "pyramid"], ["PictorialStackedSeries", "pictorial"]];
		$array.each(sliced, ([name, tag]) => {
			add(name, none, ResponsiveBaseTheme.widthM, { alignLabels: false });
			add("Label", [tag, "vertical"], ResponsiveBaseTheme.widthXS, forceHidden);
			add("Tick", [tag, "vertical"], ResponsiveBaseTheme.widthXS, forceHidden);
			add("Label", [tag, "horizontal"], ResponsiveBaseTheme.heightXS, forceHidden);
			add("Tick", [tag, "horizontal"], ResponsiveBaseTheme.heightXS, forceHidden);
		});


		/**
		 * ========================================================================
		 * Flow (Sankey, Chord) and hierarchy
		 * ========================================================================
		 */

		add("Label", ["flow", "horizontal"], ResponsiveBaseTheme.widthS, forceHidden);
		add("Label", ["flow", "vertical"], ResponsiveBaseTheme.heightS, forceHidden);
		add("Chord", none, ResponsiveBaseTheme.maybeXS, { radius: percent(99) });
		add("Label", ["hierarchy", "node"], ResponsiveBaseTheme.maybeXS, forceHidden);
	}
}
