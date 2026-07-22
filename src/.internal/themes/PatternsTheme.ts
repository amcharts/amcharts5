import { Color } from "../core/util/Color";
import { Theme } from "../core/Theme";
import type { Root } from "../core/Root";
import type { Pattern } from "../core/render/patterns/Pattern";
import { PatternSet } from "../core/util/PatternSet";
import { percent } from "../core/util/Percent";
import { setColor } from "./DefaultTheme";
import { LinePattern } from "../core/render/patterns/LinePattern";
import { CirclePattern } from "../core/render/patterns/CirclePattern";
import { RectanglePattern } from "../core/render/patterns/RectanglePattern";
import { StarPattern } from "../core/render/patterns/StarPattern";
import { TrianglePattern } from "../core/render/patterns/TrianglePattern";

/**
 * Builds a fresh, varied set of patterns. One set is made per theme rule (i.e.
 * per root), shared by all charts of that class — mirroring how the default
 * theme shares a single ColorSet per root.
 *
 * Angled hatches use each pattern's `angle` setting (which tiles seamlessly at a
 * small tile size) rather than rotating the whole pattern, and the set mixes in
 * dots, stars, triangles and grids so consecutive series stay easy to tell
 * apart by shape alone.
 */
export function buildPatterns(root: Root, color: Color): Array<Pattern> {
	return [
		LinePattern.new(root, { width: 40, height: 40, angle: 45, gap: 5, strokeWidth: 1.5, color: color }),
		CirclePattern.new(root, { width: 11, height: 11, radius: 4, gap: 2, checkered: true, color: color }),
		RectanglePattern.new(root, { width: 15, height: 15, maxWidth: 6, maxHeight: 6, gap: 6, color: color }),
		StarPattern.new(root, { width: 16, height: 16, radius: 5, innerRadius: percent(45), spikes: 6, gap: 3, checkered: true, color: color }),
		TrianglePattern.new(root, { width: 16, height: 16, maxWidth: 8, maxHeight: 8, gap: 6, color: color }),
		StarPattern.new(root, { width: 40, height: 40, radius: 7, innerRadius: percent(65), spikes: 8, gap: 0, checkered: true, color: color }),
		LinePattern.new(root, { width: 22, height: 22, angle: 0, gap: 4, strokeWidth: 1, color: color }),
		RectanglePattern.new(root, { width: 14, height: 14, maxWidth: 11, maxHeight: 11, gap: 7, rotation: 45, rotateShapes: true, color: color }),
		RectanglePattern.new(root, { width: 22, height: 22, maxWidth: 1, maxHeight: 1, gap: 2, rotateShapes: true, color: color }),
		TrianglePattern.new(root, { width: 18, height: 18, maxWidth: 8, maxHeight: 8, gap: 2, rotation: 180, rotateShapes: true, checkered: true, color: color }),
		LinePattern.new(root, { width: 40, height: 40, angle: -45, gap: 5, strokeWidth: 1.5, color: color }),
		RectanglePattern.new(root, { width: 14, height: 14, maxWidth: 4, maxHeight: 4, gap: 2, rotation: 45, rotateShapes: true, checkered: true, color: color })
	];
}

/**
 * Stroke widths cycled across line series (which can't carry a fill pattern), so
 * they are told apart by weight as well as tone.
 */
export const PATTERN_STROKE_WIDTHS: Array<number> = [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3];

/**
 * Stroke dash arrays cycled across line series (0 = solid), paired with the
 * widths above for extra separation.
 */
export const PATTERN_STROKE_DASHARRAYS: Array<number | Array<number>> = [
	0, [6, 4], [2, 2], [10, 5, 2, 5], [4, 4], [3, 3],
	[12, 5], [8, 4, 2, 4], [3, 3], [14, 6], [2, 7], [6, 3, 2, 3]
];

/**
 * A ramp of gray fills cycled across series (ordered so neighbours contrast), so
 * series differ by tone as well as by their overlaid white pattern. Kept mid-dark
 * enough that the white texture always reads.
 */
export const PATTERN_GRAYS: Array<Color> = [
	Color.fromHex(0x4a4a4a),
	Color.fromHex(0x818181),
	Color.fromHex(0x606060),
	Color.fromHex(0x939393),
	Color.fromHex(0x545454),
	Color.fromHex(0x727272)
];

/**
 * "Patterns" — a monochrome, texture-driven theme in the spirit of engraved or
 * newspaper charts: every filled series shares one gray fill overlaid with a
 * distinct white pattern (hatch / dot / star / triangle / grid), so series are
 * told apart purely by texture rather than hue.
 *
 * Line series (which have no fill for a pattern to attach to) are all gray too
 * and are told apart by stroke width and dash. Because categories are encoded by
 * shape rather than hue, it prints cleanly and stays legible for all forms of
 * color blindness. It layers on the default (light) look.
 *
 * This is a standalone theme; it does not modify any built-in theme.
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Pattern_sets} for more info
 * @see {@link https://www.amcharts.com/docs/v5/concepts/themes/} for more info
 * @important
 */
export class PatternsTheme extends Theme {
	protected setupDefaultRules() {
		super.setupDefaultRules();

		// White pattern shapes (gaps left transparent) drawn over a gray fill.
		const patternColor = Color.fromHex(0xffffff);

		// Black-and-white interface colors (no default blue).
		this.rule("InterfaceColors").setAll({
			stroke: Color.fromHex(0x666666),
			fill: Color.fromHex(0xffffff),
			primaryButton: Color.fromHex(0x666666),
			primaryButtonHover: Color.fromHex(0x333333),
			primaryButtonDown: Color.fromHex(0x555555),
			primaryButtonActive: Color.fromHex(0x555555),
			primaryButtonDisabled: Color.fromHex(0xcccccc),
			primaryButtonTextDisabled: Color.fromHex(0xffffff),
			primaryButtonText: Color.fromHex(0xffffff),
			primaryButtonStroke: Color.fromHex(0x666666),
			secondaryButton: Color.fromHex(0xeeeeee),
			secondaryButtonHover: Color.fromHex(0xdddddd),
			secondaryButtonDown: Color.fromHex(0xcccccc),
			secondaryButtonActive: Color.fromHex(0xbbbbbb),
			secondaryButtonText: Color.fromHex(0x222222),
			secondaryButtonStroke: Color.fromHex(0x666666),
			grid: Color.fromHex(0x666666),
			background: Color.fromHex(0xffffff),
			alternativeBackground: Color.fromHex(0x666666),
			text: Color.fromHex(0x222222),
			alternativeText: Color.fromHex(0xffffff),
			disabled: Color.fromHex(0x999999),
			positive: Color.fromHex(0x555555),
			negative: Color.fromHex(0x222222)
		});

		// A ramp of grays for the series: line strokes and fills cycle through them,
		// and the white pattern assigned per series reads as a light texture on top,
		// so series differ by both tone and texture.
		this.rule("ColorSet").setAll({
			colors: PATTERN_GRAYS,
			reuse: true
		});

		const ic = this._root.interfaceColors;

		// Columns, pie/funnel/venn slices and line-area fills all receive a distinct
		// white pattern per series from the PatternSet below, layered over their gray
		// fill - no per-shape rules are needed for them.

		// Hierarchy & flow series distribute a distinct white pattern per node from
		// their own PatternSet (assigned below), over the shared gray fill. Here we
		// only give each node shape a white outline to separate neighbours. Tags
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
			["Circle", ["linkedhierarchy", "shape"]],                       // force-directed nodes
			["Graphics", ["voronoitreemap", "node", "shape"]],
			["RoundedRectangle", ["sankey", "node", "shape"]],             // sankey (flow) nodes
			["Slice", ["chord", "node", "shape"]]                          // chord (flow) nodes
		] as Array<[string, Array<string>]>).forEach(function (entry) { patternNode(entry[0], entry[1]); });

		// Map polygons: a fine white rectangle-dot pattern over a gray fill by
		// default, white 45deg lines when active.
		const mapRule = this.rule("MapPolygon");
		mapRule.set("stroke", patternColor);
		mapRule.set("strokeOpacity", 1);
		mapRule.set("strokeWidth", .25);

		setColor(mapRule, "fill", ic, "disabled");
		mapRule.set("fillPattern", RectanglePattern.new(this._root, { maxWidth: 1, maxHeight: 1, gap: 2, color: patternColor }));
		mapRule.states.create("active", { fillPattern: LinePattern.new(this._root, { angle: 45, gap: 2, strokeWidth: 1, color: patternColor }) });

		// Assign a pattern set on the chart/series that support it, so each series
		// is given the next pattern automatically. A fresh set per root mirrors how
		// the default theme assigns a ColorSet.
		this.rule("XYChart").setAll({
			patterns: PatternSet.new(this._root, { patterns: buildPatterns(this._root, patternColor) }),
			// Line series can't take a fill pattern, so vary their stroke instead.
			strokeWidths: PATTERN_STROKE_WIDTHS,
			strokeDasharrays: PATTERN_STROKE_DASHARRAYS
		});
		this.rule("PercentSeries").set("patterns", PatternSet.new(this._root, {
			patterns: buildPatterns(this._root, patternColor)
		}));
		this.rule("Venn").set("patterns", PatternSet.new(this._root, {
			patterns: buildPatterns(this._root, patternColor)
		}));
		// Hierarchy (treemap, sunburst, pack, partition, force-directed) and flow
		// (sankey, chord) distribute a distinct pattern per node from their own set.
		this.rule("Hierarchy").set("patterns", PatternSet.new(this._root, {
			patterns: buildPatterns(this._root, patternColor)
		}));
		this.rule("FlowNodes").set("patterns", PatternSet.new(this._root, {
			patterns: buildPatterns(this._root, patternColor)
		}));
	}
}
