import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";
import { PatternSet } from "../core/util/PatternSet";
import { RectanglePattern } from "../core/render/patterns/RectanglePattern";
import { LinePattern } from "../core/render/patterns/LinePattern";
import { darkInterfaceColors } from "./DarkVariant";
import { buildPatterns, PATTERN_STROKE_WIDTHS, PATTERN_STROKE_DASHARRAYS, PATTERN_GRAYS } from "./PatternsTheme";
import { setColor } from "./DefaultTheme";

/**
 * "Patterns Dark" - the dark counterpart to `Patterns`: every filled series
 * shares the same gray ramp overlaid with a distinct black pattern (hatch / dot /
 * star / triangle / grid) - the opposite pattern color to the light `Patterns`,
 * so the texture reads as dark cuts into the gray on the dark ground. Line series
 * are gray, told apart by stroke width and dash.
 *
 * Like `Patterns`, categories are encoded by shape rather than hue, so it stays
 * legible for all forms of color blindness.
 *
 * This is a standalone theme; it does not modify any built-in theme.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Pattern_sets} for more info
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class PatternsDarkTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		// Black pattern shapes (gaps left transparent) drawn over a gray fill - the
		// opposite pattern color to the light Patterns theme.
		const patternColor = Color.fromHex(0x000000);

		// Dark interface colors (no default blue - the dark variant is neutral).
		this.rule("InterfaceColors").setAll(darkInterfaceColors());
		// The theme is deliberately hue-free (its point is colorblind-safe, shape-
		// based separation), so override the dark variant's blue buttons and its
		// green/red positive/negative with grays.
		this.rule("InterfaceColors").setAll({
			primaryButton: Color.fromHex(0xbbbbbb),
			primaryButtonHover: Color.fromHex(0xcccccc),
			primaryButtonDown: Color.fromHex(0x999999),
			primaryButtonActive: Color.fromHex(0x999999),
			primaryButtonStroke: Color.fromHex(0xdddddd),
			primaryButtonText: Color.fromHex(0x111111),
			positive: Color.fromHex(0xcccccc),
			negative: Color.fromHex(0x777777)
		});

		// A ramp of grays for the series: line strokes and fills cycle through them,
		// and the black pattern assigned per series reads as a dark texture on top,
		// so series differ by both tone and texture.
		this.rule("ColorSet").setAll({
			colors: PATTERN_GRAYS,
			reuse: true
		});

		const ic = this._root.interfaceColors;

		// Columns, pie/funnel/venn slices and line-area fills all receive a distinct
		// black pattern per series from the PatternSet below, layered over their gray
		// fill - no per-shape rules are needed for them.

		// Hierarchy & flow series distribute a distinct black pattern per node from
		// their own PatternSet (assigned below), over the shared gray fill. Here we
		// only give each node shape a black outline to separate neighbours. Tags
		// mirror each default theme's node-shape rule exactly.
		const self = this;
		function patternNode(className: string, tags: Array<string>) {
			const rule: any = self.rule(className as any, tags);
			rule.setAll({ stroke: patternColor, strokeOpacity: 1 });
		}
		([
			["RoundedRectangle", ["treemap", "node", "shape"]],
			["RoundedRectangle", ["partition", "node", "shape"]],
			["Slice", ["sunburst", "node", "shape"]],
			["Circle", ["pack", "node", "shape"]],
			["Circle", ["linkedhierarchy", "shape"]],
			["Graphics", ["voronoitreemap", "node", "shape"]],
			["RoundedRectangle", ["sankey", "node", "shape"]],
			["Slice", ["chord", "node", "shape"]]
		] as Array<[string, Array<string>]>).forEach(function (entry) { patternNode(entry[0], entry[1]); });

		// Map polygons: a fine black rectangle-dot pattern over a gray fill by
		// default, black 45deg lines when active.
		const mapRule = this.rule("MapPolygon");
		mapRule.set("stroke", patternColor);
		mapRule.set("strokeOpacity", 1);
		mapRule.set("strokeWidth", .25);

		setColor(mapRule, "fill", ic, "disabled");
		mapRule.set("fillPattern", RectanglePattern.new(this._root, { maxWidth: 1, maxHeight: 1, gap: 2, color: patternColor }));
		mapRule.states.create("active", { fillPattern: LinePattern.new(this._root, { angle: 45, gap: 2, strokeWidth: 1, color: patternColor }) });

		// Assign a pattern set on the chart/series that support it.
		this.rule("XYChart").setAll({
			patterns: PatternSet.new(this._root, { patterns: buildPatterns(this._root, patternColor) }),
			strokeWidths: PATTERN_STROKE_WIDTHS,
			strokeDasharrays: PATTERN_STROKE_DASHARRAYS
		});
		this.rule("PercentSeries").set("patterns", PatternSet.new(this._root, {
			patterns: buildPatterns(this._root, patternColor)
		}));
		this.rule("Venn").set("patterns", PatternSet.new(this._root, {
			patterns: buildPatterns(this._root, patternColor)
		}));
		this.rule("Hierarchy").set("patterns", PatternSet.new(this._root, {
			patterns: buildPatterns(this._root, patternColor)
		}));
		this.rule("FlowNodes").set("patterns", PatternSet.new(this._root, {
			patterns: buildPatterns(this._root, patternColor)
		}));
	}
}
