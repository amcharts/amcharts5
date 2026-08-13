import type { DataItem } from "../../core/render/Component";
import type { ColorSet } from "../../core/util/ColorSet";
import type { Percent } from "../../core/util/Percent";
import type { IPoint } from "../../core/util/IPoint";
import type { Time } from "../../core/util/Animation";

import { WordCloudDefaultTheme } from "./WordCloudDefaultTheme";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate } from "../../core/render/Series";
import { Template } from "../../core/util/Template";
import { Label } from "../../core/render/Label";
import { Container } from "../../core/render/Container";
import { Graphics } from "../../core/render/Graphics";
import { ListTemplate } from "../../core/util/List";
import type { Color } from "../../core/util/Color";

import * as $utils from "../../core/util/Utils";
import * as $array from "../../core/util/Array";
import * as $math from "../../core/util/Math";
import * as $type from "../../core/util/Type";

export interface IWordCloudDataItem extends ISeriesDataItem {

	/**
	 * Category.
	 */
	category: string;

	/**
	 * Label.
	 */
	label: Label;

	/**
	 * Fill color used for the slice and related elements, e.g. legend marker.
	 */
	fill: Color;

	/**
	 * @ignore
	 */
	set: number;

	/**
	 * @ignore
	 */
	angle: number;

	/**
	 * @ignore
	 */
	fontSize: number;
}

export interface IWordCloudSettings extends ISeriesSettings {

	/**
	 * Duration of word animation when chart resizes.
	 */
	animationDuration?: number;

	/**
	 * An easing function to use for word animations.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/animations/#Easing_functions} for more info
	 * @default am5.ease.out($ease.cubic)
	 */
	animationEasing?: (t: Time) => Time;

	/**
	 * @default false
	 */
	autoFit?: boolean;

	/**
	 * Progress of current word layout animation. (0-1)
	 *
	 * @readonly
	 */
	progress?: number;

	/**
	 * A [[ColorSet]] to use when asigning colors for slices.
	 */
	colors?: ColorSet;

	/**
	 * A field in data that holds category names.
	 */
	categoryField?: string;

	/**
	 * A field that holds color for label fill.
	 */
	fillField?: string;

	/**
	 * Source text from which words are extracted.
	 */
	text?: string;

	/**
	 * Absolute or relative font size for the smallest words.
	 */
	minFontSize?: number | Percent;

	/**
	 * Absolute or relative font size for the biggest words.
	 */
	maxFontSize?: number | Percent;

	/**
	 * Minimum occurances for a word to be included into cloud.
	 */
	minValue?: number;

	/**
	 * Maximum number of words to show.
	 */
	maxCount?: number;

	/**
	 * Array of words  exclude from cloud.
	 */
	excludeWords?: Array<string>;

	/**
	 * Randomness of word placement (0-1).
	 */
	randomness?: number;

	/**
	 * Minimum number of characters for a word to be included in the cloud.
	 */
	minWordLength?: number;

	/**
	 * An array of possible rotation angles for words.
	 */
	angles?: number[];

	/**
	 * How a word's rotation is chosen from `angles`.
	 *
	 * When `true` (default) each word picks a random angle from `angles`, so the
	 * cloud looks different on every layout. When `false` words cycle through
	 * `angles` in order (word 0 gets `angles[0]`, word 1 `angles[1]`, and so on),
	 * which — together with `randomness: 0` — makes the layout reproducible.
	 *
	 * @since 5.20.1
	 * @default true
	 */
	randomizeAngles?: boolean;

	/**
	 * Whether words may nest into each other's empty space.
	 *
	 * When `true` (default) a word is packed against its neighbors' letters, so
	 * small words tuck into the concavities of bigger ones and the cloud packs
	 * tightly — but bounding boxes may overlap. Set to `false` to pack whole
	 * bounding boxes instead, so they never overlap (useful when labels have an
	 * opaque `background`, whose rectangles would otherwise slide into a
	 * neighbor's gaps).
	 *
	 * @since 5.20.1
	 * @default true
	 */
	allowNesting?: boolean;

	/**
	 * Step for next word placement.
	 */
	step?: number;

	/**
	 * Experimental: if set, words are arranged to fill this shape. The path is
	 * scaled proportionally to fit the plot area.
	 *
	 * NOTE: this is an experimental feature and the fit is approximate. Favor
	 * simple, bold shapes over complex, thin, or highly concave ones, and tune
	 * `shapeTolerance`, `maskByShape`, `angles` (and `minFontSize`/`maxFontSize`)
	 * to get a better fill for a particular shape.
	 *
	 * @since 5.20.1
	 */
	svgPath?: string;

	/**
	 * Extra distance (in pixels) a word may extend past the `svgPath` outline,
	 * on top of the automatic per-word overhang (a fraction of each word's own
	 * size). Words already spill over the edge proportionally to their size so
	 * the outline fills well at `0` (default); increase this to let them spill
	 * further.
	 *
	 * Can also be negative to pull words further inside the outline, creating
	 * visual padding between the words and the shape edge.
	 *
	 * Only affects placement — the drawn `shape` outline is unchanged. Requires
	 * `svgPath`.
	 *
	 * @since 5.20.1
	 * @default 0
	 */
	shapeTolerance?: number;

	/**
	 * If set to `true`, words are clipped to the `svgPath` shape, so the parts
	 * of letters that overhang the outline (see `shapeTolerance`) are cut off at
	 * the edge for a crisp silhouette. Requires `svgPath`.
	 *
	 * @since 5.20.1
	 * @default false
	 */
	maskByShape?: boolean;
}

export interface IWordCloudPrivate extends ISeriesPrivate {

	/**
	 * Indicates whether size of the font was adjusted for better fit.
	 */
	adjustedFontSize: number;

}

/**
 * A bit-packed glyph mask of a single word (32 pixels per int), used by the
 * layout for in-memory collision detection.
 *
 * @ignore
 */
interface IWordSprite {
	bits: Int32Array;
	stride: number;
	bw: number;
	bh: number;
}

/**
 * A computed placement of a single word. No `point` means the word could not
 * be placed (label gets hidden).
 *
 * @ignore
 */
interface IWordPlacement {
	dataItem: DataItem<IWordCloudDataItem>;
	point?: IPoint;
	angle: number;
	fontSize: number;
}

/**
 * Creates a [[WordCloud]] series.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/word-cloud/} for more info
 * @important
 */
export class WordCloud extends Series {

	public static className: string = "WordCloud";
	public static classNames: Array<string> = Series.classNames.concat([WordCloud.className]);

	declare public _settings: IWordCloudSettings;
	declare public _privateSettings: IWordCloudPrivate;
	declare public _dataItemSettings: IWordCloudDataItem;

	/**
	 * A [[Graphics]] element that draws the `svgPath` shape the words are
	 * arranged into, aligned exactly with the word-constraint region.
	 *
	 * By default it renders as a faint silhouette (the theme's alternative
	 * background color at 10% opacity) behind the words, and only when
	 * `svgPath` is set. Style it via
	 * `series.shape.setAll({ fill: color, fillOpacity: 0.1, ... })`.
	 *
	 * Its geometry (`svgPath`, `scale`, `x`, `y`) and visibility are managed
	 * by the series; `fill`/`stroke` and other styling are yours to set.
	 *
	 * It is added as the first child, so it always renders behind the words.
	 *
	 * @since 5.20.1
	 */
	public readonly shape: Graphics = this.children.push(Graphics.new(this._root, {
		themeTags: ["wordcloud", "shape"]
	}));

	protected _pointSets: Array<Array<IPoint>> = [];
	protected _sets: number = 3;

	// bit-packed occupancy board sized to the plot area (32 pixels per int) and
	// a private scratch canvas used to rasterize word glyph masks
	protected _board: Int32Array = new Int32Array(0);
	protected _boardW: number = 0;
	protected _boardH: number = 0;
	protected _boardStride: number = 0;
	protected _scratchCanvas?: HTMLCanvasElement;
	protected _scratchContext?: CanvasRenderingContext2D;

	// `svgPath` shape support: a bit mask of the fitted shape's EXTERIOR, tested
	// against an eroded word box so words stay (mostly) inside; cached per plot
	// size + path
	protected _shapeMask?: Int32Array;
	protected _shapeMaskKey?: string;
	// candidate points for a shape, ordered thickest-first (by distance to the
	// shape edge) so words fill the shape from its core outward to the edges —
	// replaces the spiral, which only fills an ellipse
	protected _shapeCandidates?: Array<IPoint>;
	// Container holding the word labels. The `maskByShape` clip is applied to
	// THIS container (not the whole series), so the labels actually get clipped —
	// masking the series itself has no effect on the labels.
	protected _labelsContainer = this.children.push(Container.new(this._root, {}));
	// whether the `maskByShape` clip is currently applied to `_labelsContainer`.
	// The mask itself is built fresh on each apply and owned by the container
	// (which disposes it on removal), so we only track the applied state here.
	protected _maskApplied: boolean = false;
	// fitted-shape geometry for the clip mask (kept in sync in `_prepareShapeMask`)
	protected _shapeScale: number = 1;
	protected _shapeTx: number = 0;
	protected _shapeTy: number = 0;
	protected _svgPathWarned: boolean = false;

	protected _afterNew() {
		this._defaultThemes.push(WordCloudDefaultTheme.new(this._root));

		this.fields.push("category", "fill");
		this._setDefault("valueField", "value");
		this._setDefault("categoryField", "category");
		this._setDefault("fillField", "fill");

		super._afterNew();
	}


	/**
	 * A [[ListTemplate]] of all labels in series.
	 *
	 * `labels.template` can also be used to configure labels.
	 */
	public readonly labels: ListTemplate<Label> = this.addDisposer(this._makeLabels());

	/**
	 * @ignore
	 */
	public makeLabel(dataItem: DataItem<this["_dataItemSettings"]>): Label {
		const label = this._labelsContainer.children.push(this.labels.make());
		label._setDataItem(dataItem);
		const fill = dataItem.get("fill");
		if (fill != null) {
			label.set("fill", fill);
		}
		label.set("x", -999999); // do not change!

		dataItem.set("label", label);
		this.labels.push(label);

		return label;
	}

	protected _makeLabels(): ListTemplate<Label> {
		return new ListTemplate(
			Template.new({}),
			() => Label._new(this._root, {
				themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), ["wordcloud", "series"])
			}, [this.labels.template]),
		);
	}


	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);


		if (dataItem.get("fill") == null) {
			let colors = this.get("colors");
			if (colors) {
				dataItem.setRaw("fill", colors.next());
			}
		}

		this.makeLabel(dataItem);
	}

	public _prepareChildren() {
		super._prepareChildren();

		// `maxCount`/`minValue`/`minWordLength`/`excludeWords` are word-extraction
		// filters applied in `_getWords`, which only ran on a `text` change — so
		// re-extract when any of them change too (only relevant when using `text`).
		if (this.isDirty("text") || this.isDirty("maxCount") || this.isDirty("minValue") || this.isDirty("minWordLength") || this.isDirty("excludeWords")) {
			const text = this.get("text");
			if (text != null) {
				this.data.setAll(this._getWords(text));
			}
			// Clear these so the `data.setAll` above doesn't re-enter this block and
			// recurse (mirrors the original `text` handling).
			this._dirty["text"] = false;
			this._dirty["maxCount"] = false;
			this._dirty["minValue"] = false;
			this._dirty["minWordLength"] = false;
			this._dirty["excludeWords"] = false;
		}
	}

	public _updateChildren() {
		super._updateChildren();

		// Layout works in an innerWidth/innerHeight box, so the words (and the
		// shape) have to be moved into the padded area, or they sit in the top
		// left corner with all the padding pooled at the bottom right.
		this._labelsContainer.setAll({
			x: this.get("paddingLeft", 0),
			y: this.get("paddingTop", 0)
		});

		let step = this.get("step", 1) * 2;

		// `shapeTolerance` only affects placement when a shape is active, so it
		// shouldn't trigger a relayout with no `svgPath` set. `maskByShape` never
		// relayouts (it only toggles the clip — handled after this block).
		const shapeSet = this.get("svgPath") != null;

		if (this._valuesDirty || this._sizeDirty || this.isPrivateDirty("adjustedFontSize") || this.isDirty("minFontSize") || this.isDirty("maxFontSize") || this.isDirty("step") || this.isDirty("angles") || this.isDirty("randomness") || this.isDirty("randomizeAngles") || this.isDirty("allowNesting") || this.isDirty("svgPath") || (shapeSet && this.isDirty("shapeTolerance"))) {
			// The layout re-fits from full size every pass (`_layoutAll` searches
			// its own `shrink` from 1), so keep `adjustedFontSize` at 1. Otherwise
			// a stale (ratcheted-down) value pre-scales the fonts and the cloud
			// can't grow back when the container is enlarged.
			this.setPrivateRaw("adjustedFontSize", 1);
			const adjustedFontSize = this.getPrivate("adjustedFontSize", 1);

			const w = this.innerWidth();
			const h = this.innerHeight();

			const smaller = Math.min(w, h);
			const bigger = Math.max(w, h);

			if (smaller < 800) {
				step = step / 2;
			}

			this._pointSets = [];

			for (let i = 0; i < this._sets; i++) {
				// bigger step at the beginning
				const setStep = step * (this._sets - i);
				const points = $math.spiralPoints(w / 2, h / 2, w, h, 0, setStep * h / bigger, setStep * w / bigger, 0, 0)

				// generated more points and remove those out of bounds
				// (single compacting pass; per-point splicing was O(n^2))
				let n = 0;
				for (let j = 0; j < points.length; j++) {
					const point = points[j];
					if (point.x >= 0 && point.x <= w && point.y >= 0 && point.y <= h) {
						points[n++] = point;
					}
				}
				points.length = n;

				this._pointSets.push(points);
			}

			let sum = 0;
			let absSum = 0;
			let valueHigh = 0;
			let valueLow = Infinity;
			let count = 0;
			$array.each(this._dataItems, (dataItem) => {
				const valueWorking = dataItem.get("valueWorking", 0);
				sum += valueWorking;
				absSum += Math.abs(valueWorking);
			});

			this._dataItems.sort((a, b) => {
				let aValue = a.get("value", 0);
				let bValue = b.get("value", 0);

				if (aValue > bValue) {
					return -1;
				}
				if (aValue < bValue) {
					return 1;
				}
				return 0;

			})

			$array.each(this._dataItems, (dataItem) => {

				const value = dataItem.get("valueWorking", 0);

				if (value >= absSum) {
					sum = dataItem.get("value", 0);
				}

				if (value > valueHigh) {
					valueHigh = value;
				}

				if (value < valueLow) {
					valueLow = value;
				}

				count++;
			});

			this.setPrivateRaw("valueLow", valueLow);
			this.setPrivateRaw("valueHigh", valueHigh);
			this.setPrivateRaw("valueSum", sum);
			this.setPrivateRaw("valueAverage", sum / count);
			this.setPrivateRaw("valueAbsoluteSum", absSum);

			const smallerSize = Math.min(w, h);
			const minFontSize = $utils.relativeToValue(this.get("minFontSize", 10), smallerSize) * adjustedFontSize;
			const maxFontSize = $utils.relativeToValue(this.get("maxFontSize", 100), smallerSize) * adjustedFontSize;

			const angles = this.get("angles", [0]);
			const randomizeAngles = this.get("randomizeAngles", true);

			$array.each(this._dataItems, (dataItem, index) => {
				const value = dataItem.get("valueWorking", 0);
				let fontSize = minFontSize + (maxFontSize - minFontSize) * (value - valueLow) / (valueHigh - valueLow);
				if ($type.isNaN(fontSize)) {
					fontSize = maxFontSize;
				}

				const set = this._sets - 1 - Math.floor((fontSize - minFontSize) / (maxFontSize - minFontSize) * (this._sets - 1));

				dataItem.setRaw("set", set);
				dataItem.setRaw("fontSize", fontSize);

				// Random angle by default; cycle through `angles` in order when
				// `randomizeAngles` is off (reproducible with `randomness: 0`).
				let angle = randomizeAngles
					? angles[Math.floor(Math.random() * (angles.length))]
					: angles[index % angles.length];

				dataItem.setRaw("angle", angle);
			})

			// the whole layout happens right here, in one synchronous pass
			this._layoutAll();
		}

		// `maskByShape` only applies/removes the shape clip — no relayout needed
		// (which would re-shuffle the words). A no-op when there is no active
		// shape, so it never forces a redraw with `svgPath` unset.
		if (this.isDirty("maskByShape")) {
			this._updateShapeVisibility();
		}
	}

	/**
	 * Measures, rasterizes and places all words in one synchronous pass.
	 * Occupancy is a bit-packed in-memory board tested with bitwise AND — no
	 * canvas readback and no per-frame word processing.
	 */
	protected _layoutAll(): void {
		// reset `progress` (raw, no event) so the `set(…, 1)` at the end fires on
		// every layout, not just the first — listeners can detect each relayout
		this.setRaw("progress", 0);

		// build (or reuse) the `svgPath` shape mask
		this._prepareShapeMask();

		const autoFit = this.get("autoFit", false);
		// autoFit shrinks by 0.9 until everything fits; 32 steps take the font
		// size below 4% of the original, which always fits in practice
		const maxAttempts = autoFit ? 32 : 1;

		let shrink = 1;
		let placements: Array<IWordPlacement> | undefined;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			placements = this._layoutAttempt(shrink);
			if (placements) {
				break;
			}
			shrink *= 0.9;
		}

		if (placements) {
			// expose the applied autoFit scale on the documented private
			// (raw: the gate resets it to 1 before the next pass, so this only
			// reports the result and never feeds back into the font sizing)
			this.setPrivateRaw("adjustedFontSize", shrink);

			const animationDuration = this.get("animationDuration", 0);
			const animationEasing = this.get("animationEasing");

			// The layout is computed in one pass, but the reveal can still be
			// sequenced word by word for a staggered appearance. Only placed
			// words get a reveal slot, in placement (biggest-first) order;
			// skipped words neither reveal nor leave a gap in the cascade.
			const sequenced = this.get("sequencedInterpolation", false);
			const sequencedDelay = this.get("sequencedDelay", 15);
			let revealIndex = 0;

			$array.each(placements, (placement) => {
				const dataItem = placement.dataItem;
				const label = dataItem.get("label");
				const point = placement.point;

				if (point) {
					dataItem.setRaw("angle", placement.angle);

					if (label.get("x") != -999999) {
						label.animate({ key: "x", to: point.x, duration: animationDuration, easing: animationEasing });
						label.animate({ key: "y", to: point.y, duration: animationDuration, easing: animationEasing });
						label.animate({ key: "rotation", to: placement.angle, duration: animationDuration, easing: animationEasing });
						label.animate({ key: "fontSize", to: placement.fontSize, duration: animationDuration, easing: animationEasing });
					}
					else {
						label.setAll({ x: point.x, y: point.y, rotation: placement.angle, fontSize: placement.fontSize });
						if (sequenced) {
							label.appear(undefined, revealIndex * sequencedDelay);
						}
						else {
							label.appear();
						}
					}

					revealIndex++;
				}
				else {
					label.set("x", -999999);
				}
			});
		}

		this.set("progress", 1);
	}

	/**
	 * Runs one full placement pass with all font sizes scaled by `shrink`.
	 * Returns the computed placements, or `undefined` if a word did not fit
	 * and `autoFit` wants a retry at a smaller scale.
	 */
	protected _layoutAttempt(shrink: number): Array<IWordPlacement> | undefined {
		const w = this.innerWidth();
		const h = this.innerHeight();
		const resolution = this._root._renderer.resolution;

		const placements: Array<IWordPlacement> = [];

		if (w <= 0 || h <= 0) {
			return placements;
		}

		// occupancy board, sized to the plot area
		const boardW = Math.ceil(w * resolution);
		const boardH = Math.ceil(h * resolution);
		const boardStride = Math.ceil(boardW / 32);
		const boardLength = boardH * boardStride;

		if (this._board.length == boardLength) {
			this._board.fill(0);
		}
		else {
			this._board = new Int32Array(boardLength);
		}

		this._boardW = boardW;
		this._boardH = boardH;
		this._boardStride = boardStride;

		// The board holds only placed WORDS (used for word-vs-word collision).
		// The shape's exterior is kept separate (`_shapeMask`) and tested against
		// an eroded word box, so words may spill over the shape edge by a bit of
		// their own size but never overlap each other.
		const shapeMask = (this._shapeMask && this._shapeMask.length == boardLength) ? this._shapeMask : undefined;
		// A word may overhang the shape edge by this fraction of its own size,
		// plus any flat `shapeTolerance`. Proportional, so small edge words poke
		// out a little and big words a bit more — filling edges without a crude
		// uniform tolerance.
		const overhangFraction = 0.4;
		const shapeTolerance = this.get("shapeTolerance", 0);

		const autoFit = this.get("autoFit", false);
		const randomness = this.get("randomness", 0);
		const angles = this.get("angles", [0]);
		// when nesting is off, each word occupies its whole bounding box (the
		// box is stamped, not the glyphs), so bounding boxes never overlap
		const stampBox = !this.get("allowNesting", true);

		// candidate points get consumed as words are placed, so work on copies
		// (a shrink retry needs the originals intact)
		const pointSets: Array<Array<IPoint>> = [];
		$array.each(this._pointSets, (points) => {
			pointSets.push(points.slice());
		});

		// With a shape, all words draw from a single distance-ranked list
		// (thickest-first) shared across sizes, so the shape fills core-first
		// out to the edges. Without a shape, the per-size spiral sets are used.
		const shapeCandidates = this._shapeCandidates ? this._shapeCandidates.slice() : undefined;

		for (let i = 0; i < this.dataItems.length; i++) {
			const dataItem = this.dataItems[i];
			const text = dataItem.get("category", "");
			const label = dataItem.get("label");
			const fontSize = dataItem.get("fontSize", 0) * shrink;
			let angle = dataItem.get("angle", 0);

			// `_wordFontStyle` forces a heavy weight so the measured/rasterized
			// mask is fatter than the drawn glyph, keeping natural spacing
			// between words.
			const font = this._wordFontStyle(label, fontSize);
			// vertical advance per line, so multi-line categories (with `\n`)
			// are measured and stamped as the stacked block they render as
			const lineStep = this._lineStep(label, fontSize);
			const size = this._measureWord(text, font, fontSize, lineStep);

			const lw = size.width;
			const lh = size.height;

			if (!(lw > 0 && lh > 0 && fontSize > 0)) {
				placements.push({ dataItem: dataItem, angle: angle, fontSize: fontSize });
				continue;
			}

			// The label's padding inflates the collision box, the bounds checks
			// and the covered-point pruning (in the word's local axes,
			// pre-rotation), so every word keeps a padding-sized moat — while the
			// stamped mask stays glyph-precise so small words still nest into
			// big-letter concavities.
			const padLeft = label.get("paddingLeft", 0);
			const padRight = label.get("paddingRight", 0);
			const padTop = label.get("paddingTop", 0);
			const padBottom = label.get("paddingBottom", 0);

			const plw = lw + padLeft + padRight;
			const plh = lh + padTop + padBottom;

			// turn an overly wide word so it fits better (using its padded width)
			if (w > h && plw >= w / 2) {
				$array.each(angles, (a) => {
					if (a == 0 && angle != 0) {
						angle = 0;
					}
				})
			}
			if (h > w && plw >= w / 2) {
				$array.each(angles, (a) => {
					if (Math.abs(a) == 90 && angle == 0) {
						angle = a;
					}
				})
			}

			// Nesting on (default): stamp only the glyphs, so small words nest
			// into big-letter concavities. Nesting off: stamp the full box below,
			// so bounding boxes never overlap (useful with opaque backgrounds,
			// whose rectangles would otherwise slide into a neighbor's gaps).
			const sprite = stampBox ? undefined : this._rasterizeWord(text, font, lw, lh, angle);

			// Collision mask: a SOLID padded rectangle at the word's actual
			// angle. For 0/90 this degenerates to the axis-aligned box (same
			// result as before), but for diagonal words it hugs the real
			// footprint, so neighbors can pack into the otherwise-empty
			// corners of the axis-aligned bounding box.
			const collisionMask = this._rasterizeBox(plw, plh, angle);

			// For a shape: a smaller box, eroded by the allowed overhang, that
			// must stay INSIDE the shape (tested against `shapeMask`). The word's
			// full box may spill past the shape edge by `maxOverhang`, but the
			// eroded core cannot — so words hug the outline proportionally to
			// their size instead of leaving a fixed margin.
			let shapeCore: IWordSprite | undefined;
			if (shapeMask) {
				const maxOverhang = shapeTolerance + overhangFraction * Math.min(lw, lh);
				const ew = Math.max(1, plw - 2 * maxOverhang);
				const eh = Math.max(1, plh - 2 * maxOverhang);
				shapeCore = this._rasterizeBox(ew, eh, angle);
			}

			// padded footprint extents (rotated AABB) in logical plot pixels,
			// used for the plot-edge checks and the coarse point pruning
			const rad = angle * Math.PI / 180;
			const cosA = Math.abs(Math.cos(rad));
			const sinA = Math.abs(Math.sin(rad));
			const fw = plw * cosA + plh * sinA;
			const fh = plw * sinA + plh * cosA;

			const points = shapeCandidates || pointSets[dataItem.get("set", 0)];

			let pIndex = Math.round(Math.random() * points.length * randomness);
			let placed = false;

			while (true) {
				const p = points[pIndex];
				if (!p) {
					break;
				}

				if (p.x - fw / 2 < 0 || p.x + fw / 2 > w || p.y - fh / 2 < 0 || p.y + fh / 2 > h) {
					pIndex++;
					continue;
				}

				// collision-test the padding-inflated solid oriented box; the
				// stamp is that same box for a backed word, or just its glyphs
				const bx = Math.round(p.x * resolution - collisionMask.bw / 2);
				const by = Math.round(p.y * resolution - collisionMask.bh / 2);

				if (this._collidesAt(collisionMask, bx, by)) {
					pIndex += 2;
					continue;
				}

				// the eroded core must stay inside the shape (allows overhang)
				if (shapeCore && shapeMask) {
					const sbx = Math.round(p.x * resolution - shapeCore.bw / 2);
					const sby = Math.round(p.y * resolution - shapeCore.bh / 2);
					if (this._collidesAt(shapeCore, sbx, sby, shapeMask)) {
						pIndex += 2;
						continue;
					}
				}

				if (stampBox) {
					// mark the whole bounding box occupied (no nesting)
					this._stampSprite(collisionMask, bx, by);
				}
				else {
					const px = Math.round(p.x * resolution - sprite!.bw / 2);
					const py = Math.round(p.y * resolution - sprite!.bh / 2);
					this._stampSprite(sprite!, px, py);
				}

				// remove candidate points covered by the placed word, testing the
				// word's ORIENTED box (not its axis-aligned bounding box). For a
				// diagonal (e.g. 45°) word the AABB is a much larger square, so
				// pruning by it would delete candidates in the empty corners that
				// later words could still use — leaving gaps around slanted words.
				const cosR = Math.cos(rad);
				const sinR = Math.sin(rad);
				const hw = plw / 2;
				const hh = plh / 2;

				let n = 0;
				for (let j = 0; j < points.length; j++) {
					const point = points[j];
					const dx = point.x - p.x;
					const dy = point.y - p.y;
					// rotate the offset into the word's local axes
					const rx = dx * cosR + dy * sinR;
					const ry = -dx * sinR + dy * cosR;
					if (Math.abs(rx) > hw || Math.abs(ry) > hh) {
						points[n++] = point;
					}
				}
				points.length = n;

				placements.push({ dataItem: dataItem, point: { x: p.x, y: p.y }, angle: angle, fontSize: fontSize });
				placed = true;
				break;
			}

			if (!placed) {
				if (autoFit) {
					// signal the caller to retry with smaller font sizes
					return undefined;
				}
				placements.push({ dataItem: dataItem, angle: angle, fontSize: fontSize });
			}
		}

		return placements;
	}

	/**
	 * Builds (or reuses) the `svgPath` shape mask for the current plot size.
	 * The mask marks the fitted shape's EXTERIOR, tested against an eroded word
	 * box so words stay (mostly) inside the shape. Placement is driven by the
	 * distance-ranked `_shapeCandidates` (thickest interior first).
	 */
	protected _prepareShapeMask(): void {
		const svgPath = this.get("svgPath");

		const w = this.innerWidth();
		const h = this.innerHeight();

		if (!svgPath || w <= 0 || h <= 0) {
			this._shapeMask = undefined;
			this._shapeMaskKey = undefined;
			this._shapeCandidates = undefined;
			// hide the silhouette and drop any clip; user styling stays intact
			this._updateShapeVisibility();
			return;
		}

		const resolution = this._root._renderer.resolution;
		const boardW = Math.ceil(w * resolution);
		const boardH = Math.ceil(h * resolution);
		const boardStride = Math.ceil(boardW / 32);

		// the mask is the TRUE shape; `shapeTolerance` no longer dilates it (it
		// feeds the per-word overhang in `_layoutAttempt` instead), so it is not
		// part of the cache key
		const key = boardW + "x" + boardH + "|" + svgPath;

		// the mask only depends on the plot size and the path — reuse it
		// across relayouts and autoFit shrink passes
		if (this._shapeMaskKey != key) {
			this._shapeMaskKey = key;
			this._shapeCandidates = undefined;
			this._shapeMask = undefined;

			try {
				const path = new Path2D(svgPath);
				const bbox = this._svgPathBBox(path);

				if (!bbox || !(bbox.width > 0) || !(bbox.height > 0)) {
					this._warnSvgPath("svgPath produced no drawable shape, ignoring it");
					this._updateShapeVisibility();
					return;
				}

				// proportional fit (no stretching), centered in the plot
				const scale = Math.min(w / bbox.width, h / bbox.height);
				const tx = (w - bbox.width * scale) / 2 - bbox.left * scale;
				const ty = (h - bbox.height * scale) / 2 - bbox.top * scale;

				const context = this._scratchContext || this._makeScratch();
				const canvas = this._scratchCanvas!;

				if (canvas.width < boardW) {
					canvas.width = boardW;
				}
				if (canvas.height < boardH) {
					canvas.height = boardH;
				}

				context.setTransform(1, 0, 0, 1, 0, 0);
				context.clearRect(0, 0, boardW, boardH);
				context.setTransform(scale * resolution, 0, 0, scale * resolution, tx * resolution, ty * resolution);
				context.fillStyle = "#000000";
				context.fill(path);
				context.setTransform(1, 0, 0, 1, 0, 0);

				// pack the EXTERIOR (empty pixels) into the mask; `inkCount`
				// guards against a path that produced no interior at all
				const data = context.getImageData(0, 0, boardW, boardH).data;
				const mask = new Int32Array(boardH * boardStride);

				let inkCount = 0;

				let n = 3;
				for (let r = 0; r < boardH; r++) {
					const rowBase = r * boardStride;
					for (let c = 0; c < boardW; c++) {
						if (data[n] == 0) {
							mask[rowBase + (c >> 5)] |= 1 << (31 - (c & 31));
						}
						else {
							inkCount++;
						}
						n += 4;
					}
				}

				if (inkCount == 0) {
					this._warnSvgPath("svgPath produced no drawable shape, ignoring it");
					this._updateShapeVisibility();
					return;
				}

				this._shapeMask = mask;
				// distance-transform candidate points (thickest-first) so words
				// fill the whole shape, edges included, instead of just an ellipse
				this._shapeCandidates = this._buildShapeCandidates(boardW, boardH, data, resolution);

				// Align the public `shape` Graphics with the fitted region:
				// Graphics renders native path point p at (x + scale * p),
				// which is exactly the mask's logical = scale * native + (tx, ty)
				// mapping, so the silhouette overlays the word-constraint area.
				// Only geometry is managed here — user styling is untouched.
				// shifted by the padding to match the labels container, which is
				// offset the same way (the clip mask lives inside that container,
				// so it follows on its own)
				this.shape.setAll({ svgPath: svgPath, scale: scale, x: tx + this.get("paddingLeft", 0), y: ty + this.get("paddingTop", 0) });
				// remember the fitted geometry; the clip mask (used when
				// `maskByShape`) is built lazily from it in `_applyMaskGraphics`
				this._shapeScale = scale;
				this._shapeTx = tx;
				this._shapeTy = ty;
				// if a clip is already applied, rebuild it against the new
				// geometry/path (e.g. after a resize or a path change); skip when
				// `maskByShape` is being turned off this pass (removed just below)
				if (this._maskApplied && this.get("maskByShape", false)) {
					this._applyMaskGraphics();
				}
			}
			catch (e) {
				this._warnSvgPath("svgPath could not be parsed, ignoring it");
				this._updateShapeVisibility();
				return;
			}
		}

		// with a shape active, `_shapeCandidates` (distance-ranked) drives
		// placement in `_layoutAttempt` instead of the spiral; here we only
		// manage the silhouette's visibility and the optional clip mask (runs on
		// every exit, so removing/invalidating `svgPath` un-clips the labels)
		this._updateShapeVisibility();
	}

	/**
	 * Shows or hides the `shape` silhouette and applies (or removes) the
	 * `maskByShape` clip on the labels container, based on whether a shape is
	 * currently active. Must run on EVERY `_prepareShapeMask` exit — otherwise a
	 * stale clip from a previous shape would keep the labels cut off after the
	 * shape is removed or its path becomes invalid.
	 */
	protected _updateShapeVisibility(): void {
		// covers a cached invalid path as well
		const shapeActive = !!(this._shapeMask && this._shapeCandidates);
		this.shape.set("forceHidden", !shapeActive);

		// clip the words to the shape when `maskByShape` is on (cuts off the
		// letter parts that overhang the outline). Applied to the labels
		// container so the labels themselves are clipped.
		const wantMask = shapeActive && this.get("maskByShape", false);
		if (wantMask && !this._maskApplied) {
			this._applyMaskGraphics();
		}
		else if (!wantMask && this._maskApplied) {
			// removing a mask disposes it (Container); the next apply builds a
			// fresh one
			this._labelsContainer.set("mask", undefined);
			this._maskApplied = false;
		}
	}

	/**
	 * Builds a FRESH clip-mask [[Graphics]] from the fitted-shape geometry and
	 * applies it to the labels container. Rebuilt on every apply because removing
	 * a mask disposes it (see [[Container]]), so a single reused instance would
	 * be dead after the first toggle-off.
	 */
	protected _applyMaskGraphics(): void {
		const svgPath = this.get("svgPath");
		if (svgPath == null) {
			return;
		}
		const mask = Graphics.new(this._root, {});
		mask.setAll({ scale: this._shapeScale, x: this._shapeTx, y: this._shapeTy });
		// not a child, so not in the normal update cycle — use a `draw` callback
		// (replayed at clip time) rather than the `svgPath` setting
		mask.set("draw", (display) => {
			display.svgPath(svgPath);
		});
		this._labelsContainer.set("mask", mask);
		this._maskApplied = true;
	}

	/**
	 * Builds candidate placement points for a shape, ordered by distance to the
	 * shape's edge (thickest interior first). A two-pass chamfer distance
	 * transform measures how much room each interior pixel has; placing words
	 * biggest-first into the roomiest free spots fills the core first and lets
	 * progressively smaller words flow out to the edges — filling the whole
	 * silhouette instead of just an inscribed ellipse.
	 */
	protected _buildShapeCandidates(boardW: number, boardH: number, data: Uint8ClampedArray, resolution: number): Array<IPoint> {
		const size = boardW * boardH;
		const dist = new Float32Array(size);
		const INF = 1e9;

		// exterior (alpha 0) starts at distance 0, interior at infinity
		let a = 3;
		for (let i = 0; i < size; i++) {
			dist[i] = data[a] == 0 ? 0 : INF;
			a += 4;
		}

		const SQ2 = Math.SQRT2;

		// forward pass (top-left -> bottom-right)
		for (let r = 0; r < boardH; r++) {
			const rowBase = r * boardW;
			for (let c = 0; c < boardW; c++) {
				const idx = rowBase + c;
				if (dist[idx] == 0) {
					continue;
				}
				let d = dist[idx];
				if (c > 0) { d = Math.min(d, dist[idx - 1] + 1); }
				if (r > 0) {
					d = Math.min(d, dist[idx - boardW] + 1);
					if (c > 0) { d = Math.min(d, dist[idx - boardW - 1] + SQ2); }
					if (c < boardW - 1) { d = Math.min(d, dist[idx - boardW + 1] + SQ2); }
				}
				dist[idx] = d;
			}
		}

		// backward pass (bottom-right -> top-left)
		for (let r = boardH - 1; r >= 0; r--) {
			const rowBase = r * boardW;
			for (let c = boardW - 1; c >= 0; c--) {
				const idx = rowBase + c;
				if (dist[idx] == 0) {
					continue;
				}
				let d = dist[idx];
				if (c < boardW - 1) { d = Math.min(d, dist[idx + 1] + 1); }
				if (r < boardH - 1) {
					d = Math.min(d, dist[idx + boardW] + 1);
					if (c < boardW - 1) { d = Math.min(d, dist[idx + boardW + 1] + SQ2); }
					if (c > 0) { d = Math.min(d, dist[idx + boardW - 1] + SQ2); }
				}
				dist[idx] = d;
			}
		}

		// sub-sample the interior on a grid and rank by clearance (thickest first)
		const grid = Math.max(2, Math.round(4 * resolution));
		const ranked: Array<{ x: number, y: number, d: number }> = [];
		for (let r = 0; r < boardH; r += grid) {
			const rowBase = r * boardW;
			for (let c = 0; c < boardW; c += grid) {
				const d = dist[rowBase + c];
				if (d > 0 && d < INF) {
					ranked.push({ x: c / resolution, y: r / resolution, d: d });
				}
			}
		}

		ranked.sort((p1, p2) => p2.d - p1.d);

		const points: Array<IPoint> = [];
		if (ranked.length > 0) {
			for (let i = 0; i < ranked.length; i++) {
				points.push({ x: ranked[i].x, y: ranked[i].y });
			}
		}
		else {
			// degenerate: the fitted shape inks the whole board (no exterior), so
			// every pixel stayed at INF and nothing ranked — fall back to a plain
			// grid so the shape still fills instead of rendering blank
			for (let r = 0; r < boardH; r += grid) {
				for (let c = 0; c < boardW; c += grid) {
					points.push({ x: c / resolution, y: r / resolution });
				}
			}
		}
		return points;
	}

	/**
	 * Finds the bounding box of an SVG path (in path units) by rasterizing it
	 * onto the scratch canvas at decreasing probe scales until it fits, then
	 * scanning the ink bounds. Canvas-based, so it works without attaching
	 * any SVG element to the document.
	 */
	protected _svgPathBBox(path: Path2D): { left: number, top: number, width: number, height: number } | undefined {
		const probeSize = 1024;

		const context = this._scratchContext || this._makeScratch();
		const canvas = this._scratchCanvas!;

		if (canvas.width < probeSize) {
			canvas.width = probeSize;
		}
		if (canvas.height < probeSize) {
			canvas.height = probeSize;
		}

		const scales = [1, 0.25, 0.0625, 0.015625, 0.00390625];

		for (let k = 0; k < scales.length; k++) {
			const scale = scales[k];

			context.setTransform(1, 0, 0, 1, 0, 0);
			context.clearRect(0, 0, probeSize, probeSize);
			context.setTransform(scale, 0, 0, scale, probeSize / 2, probeSize / 2);
			context.fillStyle = "#000000";
			context.fill(path);
			context.setTransform(1, 0, 0, 1, 0, 0);

			const data = context.getImageData(0, 0, probeSize, probeSize).data;

			let minX = probeSize;
			let minY = probeSize;
			let maxX = -1;
			let maxY = -1;

			let n = 3;
			for (let r = 0; r < probeSize; r++) {
				for (let c = 0; c < probeSize; c++) {
					if (data[n] != 0) {
						if (c < minX) {
							minX = c;
						}
						if (c > maxX) {
							maxX = c;
						}
						if (r < minY) {
							minY = r;
						}
						if (r > maxY) {
							maxY = r;
						}
					}
					n += 4;
				}
			}

			if (maxX < 0) {
				// no ink at this scale: a path whose coords sit outside the probe
				// window (large or translated) shows nothing at scale 1 but ISN'T
				// degenerate — retry smaller before giving up
				if (k < scales.length - 1) {
					continue;
				}
				return undefined;
			}

			// ink touching the probe border means the path was likely clipped,
			// so retry at a smaller scale (unless this was the last one)
			if ((minX == 0 || minY == 0 || maxX == probeSize - 1 || maxY == probeSize - 1) && k < scales.length - 1) {
				continue;
			}

			return {
				left: (minX - probeSize / 2) / scale,
				top: (minY - probeSize / 2) / scale,
				width: (maxX - minX + 1) / scale,
				height: (maxY - minY + 1) / scale
			};
		}

		return undefined;
	}

	/**
	 * Logs a one-time console warning about an unusable `svgPath` (invalid or
	 * degenerate). Warns once per series to avoid flooding the console.
	 */
	protected _warnSvgPath(message: string): void {
		if (!this._svgPathWarned) {
			this._svgPathWarned = true;
			console.warn("WordCloud: " + message);
		}
	}

	/**
	 * Builds the CSS font shorthand used to measure and rasterize a word's
	 * collision mask, mirroring the renderer's `CanvasText._getFontStyle` (same
	 * part order, same fallbacks) so the scratch-canvas raster lines up with the
	 * drawn glyph. The weight is forced to `900` so the mask is fatter than the
	 * displayed label — that extra thickness is what keeps natural spacing
	 * between words (the label itself is drawn with its own weight).
	 */
	protected _wordFontStyle(label: Label, fontSize: number): string {
		const parts: string[] = [];

		const fontVariant = label.get("fontVariant");
		if (fontVariant) {
			parts.push(fontVariant);
		}

		// forced heavy weight (see doc): fattens the mask for word spacing
		parts.push("900");

		const fontStyle = label.get("fontStyle");
		if (fontStyle) {
			parts.push(fontStyle);
		}

		parts.push(fontSize + "px");

		let fontFamily: string | undefined = label.get("fontFamily");
		if (fontFamily == "inherit") {
			fontFamily = getComputedStyle(this._root.dom).getPropertyValue("font-family");
		}

		if (fontFamily) {
			parts.push(fontFamily);
		}
		else {
			parts.push("Arial");
		}

		return parts.join(" ");
	}

	protected _makeScratch(): CanvasRenderingContext2D {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d", { willReadFrequently: true })! as CanvasRenderingContext2D;
		this._scratchCanvas = canvas;
		this._scratchContext = context;
		return context;
	}

	/**
	 * Vertical advance between lines for a label, honoring its `lineHeight`
	 * setting (the theme default is 100%, i.e. one font size per line). Used to
	 * stack multi-line categories (`\n`) the way the label renders them.
	 */
	protected _lineStep(label: Label, fontSize: number): number {
		const lineHeight = label.get("lineHeight");
		if (lineHeight != null) {
			// like the renderer, a plain number is a multiplier and a `Percent`
			// is relative (theme default 100%). Approximated against the font
			// size rather than the measured glyph height, so the stacked mask
			// runs a touch tall — safe (extra gap, never overlap).
			const step = $type.isNumber(lineHeight)
				? lineHeight * fontSize
				: $utils.relativeToValue(lineHeight, fontSize);
			if (step > 0) {
				return step;
			}
		}
		return fontSize;
	}

	/**
	 * Measures a word synchronously on the scratch canvas. Categories may span
	 * several lines (`\n`); the width is the widest line and the height stacks
	 * the lines by `lineStep`, matching the label's rendered footprint.
	 */
	protected _measureWord(text: string, font: string, fontSize: number, lineStep: number): { width: number, height: number } {
		const context = this._scratchContext || this._makeScratch();

		context.setTransform(1, 0, 0, 1, 0, 0);
		context.font = font;

		const lines = text.split("\n");

		// width is the widest line's advance width
		let width = 0;
		for (let i = 0; i < lines.length; i++) {
			const w = context.measureText(lines[i]).width;
			if (w > width) {
				width = w;
			}
		}

		let height: number;
		if (lines.length > 1) {
			// stacked block: one `lineStep` per line
			height = lines.length * lineStep;
		}
		else {
			// single line: tight glyph height (falls back to the font size)
			const metrics = context.measureText(text);
			height = 0;
			if (metrics.actualBoundingBoxAscent != null && metrics.actualBoundingBoxDescent != null) {
				height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
			}
			if (!(height > 0)) {
				height = fontSize;
			}
		}

		return { width: width, height: height };
	}

	/**
	 * Rasterizes a word (at its final font and rotation) on the scratch canvas
	 * and packs the alpha channel into a bit mask.
	 */
	protected _rasterizeWord(text: string, font: string, lw: number, lh: number, angle: number): IWordSprite {
		const resolution = this._root._renderer.resolution;

		const rad = angle * Math.PI / 180;
		const cos = Math.abs(Math.cos(rad));
		const sin = Math.abs(Math.sin(rad));

		// bounding box of the rotated word, in device pixels
		const bw = Math.max(1, Math.ceil((lw * cos + lh * sin) * resolution));
		const bh = Math.max(1, Math.ceil((lw * sin + lh * cos) * resolution));

		const context = this._scratchContext || this._makeScratch();
		const canvas = this._scratchCanvas!;

		// grow-only, to avoid constant reallocation
		if (canvas.width < bw) {
			canvas.width = bw;
		}
		if (canvas.height < bh) {
			canvas.height = bh;
		}

		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, bw, bh);

		// same scale model as the renderer: draw in logical pixels, transform
		// carries the resolution (translation is in device pixels)
		context.setTransform(resolution, 0, 0, resolution, bw / 2, bh / 2);
		if (rad != 0) {
			context.rotate(rad);
		}

		context.font = font;
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillStyle = "#000000";

		// draw each line centered in its own equal horizontal band, so a
		// multi-line category rasterizes to the same stacked footprint it
		// renders as (single line: one band centered on the origin, unchanged)
		const lines = text.split("\n");
		const slice = lh / lines.length;
		for (let i = 0; i < lines.length; i++) {
			context.fillText(lines[i], 0, (i + 0.5 - lines.length / 2) * slice);
		}

		return this._packScratch(bw, bh);
	}

	/**
	 * Rasterizes a SOLID rectangle of the given (padded) dimensions at the
	 * word's angle, and packs it into a bit mask. Used as the collision
	 * footprint: at 0/90 degrees it equals the axis-aligned box, while for
	 * diagonal words it hugs the real footprint so neighbors can pack into
	 * the empty corners of the axis-aligned bounding box.
	 */
	protected _rasterizeBox(lw: number, lh: number, angle: number): IWordSprite {
		const resolution = this._root._renderer.resolution;

		const rad = angle * Math.PI / 180;
		const cos = Math.abs(Math.cos(rad));
		const sin = Math.abs(Math.sin(rad));

		// bounding box of the rotated rectangle, in device pixels
		const bw = Math.max(1, Math.ceil((lw * cos + lh * sin) * resolution));
		const bh = Math.max(1, Math.ceil((lw * sin + lh * cos) * resolution));

		const context = this._scratchContext || this._makeScratch();
		const canvas = this._scratchCanvas!;

		if (canvas.width < bw) {
			canvas.width = bw;
		}
		if (canvas.height < bh) {
			canvas.height = bh;
		}

		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, bw, bh);

		context.setTransform(resolution, 0, 0, resolution, bw / 2, bh / 2);
		if (rad != 0) {
			context.rotate(rad);
		}

		context.fillStyle = "#000000";
		context.fillRect(-lw / 2, -lh / 2, lw, lh);

		return this._packScratch(bw, bh);
	}

	/**
	 * Packs the alpha channel of the scratch canvas' top-left `bw x bh`
	 * region into a bit mask (32 pixels per int, MSB first).
	 */
	protected _packScratch(bw: number, bh: number): IWordSprite {
		const context = this._scratchContext!;

		const stride = Math.ceil(bw / 32);
		const bits = new Int32Array(bh * stride);
		const data = context.getImageData(0, 0, bw, bh).data;

		let n = 3;
		for (let r = 0; r < bh; r++) {
			const rowBase = r * stride;
			for (let c = 0; c < bw; c++) {
				if (data[n] != 0) {
					bits[rowBase + (c >> 5)] |= 1 << (31 - (c & 31));
				}
				n += 4;
			}
		}

		return { bits: bits, stride: stride, bw: bw, bh: bh };
	}

	/**
	 * Tests a collision mask against the occupancy board at device
	 * coordinates `(px, py)` (top-left corner). Bitwise AND, exact to the
	 * pixel. The glyph-shaped nesting comes from the board containing only
	 * glyph ink; the mask itself is the word's solid oriented (padded) box.
	 */
	protected _collidesAt(sprite: IWordSprite, px: number, py: number, board: Int32Array = this._board): boolean {
		// A box poking past the board (possible by a rounding pixel) is
		// treated as a collision; the word simply tries the next point.
		if (px < 0 || py < 0 || px + sprite.bw > this._boardW || py + sprite.bh > this._boardH) {
			return true;
		}

		const boardStride = this._boardStride;
		const bits = sprite.bits;
		const spriteStride = sprite.stride;

		const shift = px & 31;
		const x0 = px >> 5;
		const spanInts = (sprite.bw + shift + 31) >> 5;

		for (let r = 0; r < sprite.bh; r++) {
			let last = 0;
			const boardOff = (py + r) * boardStride + x0;
			const spriteOff = r * spriteStride;

			for (let i = 0; i < spanInts; i++) {
				const s = i < spriteStride ? bits[spriteOff + i] : 0;
				const chunk = shift == 0 ? s : ((last << (32 - shift)) | (s >>> shift));
				if (chunk != 0 && (chunk & board[boardOff + i]) != 0) {
					return true;
				}
				last = s;
			}
		}

		return false;
	}

	/**
	 * Stamps a sprite into the occupancy board (bitwise OR) at device
	 * coordinates `(px, py)` (top-left corner).
	 */
	protected _stampSprite(sprite: IWordSprite, px: number, py: number): void {
		const board = this._board;
		const boardStride = this._boardStride;
		const bits = sprite.bits;
		const spriteStride = sprite.stride;

		const shift = px & 31;
		const x0 = px >> 5;
		const spanInts = (sprite.bw + shift + 31) >> 5;

		for (let r = 0; r < sprite.bh; r++) {
			let last = 0;
			const boardOff = (py + r) * boardStride + x0;
			const spriteOff = r * spriteStride;

			for (let i = 0; i < spanInts; i++) {
				const s = i < spriteStride ? bits[spriteOff + i] : 0;
				const chunk = shift == 0 ? s : ((last << (32 - shift)) | (s >>> shift));
				if (chunk != 0) {
					board[boardOff + i] |= chunk;
				}
				last = s;
			}
		}
	}

	/**
* @ignore
*/
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const label = dataItem.get("label");
		if (label) {
			this.labels.removeValue(label);
			label.dispose();
		}
	}
	/**
* Extracts words and number of their appearances from a text.
*
* @ignore
* @param  input  Source text
*/
	protected _getWords(input?: string): Array<{ category: string, value: number }> {
		let words: Array<{ category: string, value: number }> = [];

		if (input) {
			const chars = "\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376-\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0621-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4-\u07F5\u07FA\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0972\u097B-\u097F\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58-\u0C59\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D3D\u0D60-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E46\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDD\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8B\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10D0-\u10FA\u10FC\u1100-\u1159\u115F-\u11A2\u11A8-\u11F9\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u1676\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19A9\u19C1-\u19C7\u1A00-\u1A16\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u2094\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2C6F\u2C71-\u2C7D\u2C80-\u2CE4\u2D00-\u2D25\u2D30-\u2D65\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31B7\u31F0-\u31FF\u3400\u4DB5\u4E00\u9FC3\uA000-\uA48C\uA500-\uA60C\uA610-\uA61F\uA62A-\uA62B\uA640-\uA65F\uA662-\uA66E\uA67F-\uA697\uA717-\uA71F\uA722-\uA788\uA78B-\uA78C\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA90A-\uA925\uA930-\uA946\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAC00-\uD7A3\uF900-\uFA2D\uFA30-\uFA6A\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC0-9@+";
			const reg = new RegExp("([" + chars + "]+[\-" + chars + "]*[" + chars + "]+)|([" + chars + "]+)", "ig");
			let res = input.match(reg);
			if (!res) {
				return [];
			}

			// Map keyed by lowercase word for O(1) lookup
			const wordMap = new Map<string, { category: string, value: number }>();

			for (let i = 0; i < res.length; i++) {
				const word = res[i];
				const lower = word.toLowerCase();
				const item = wordMap.get(lower);
				if (item) {
					item.value++;
					if (!this.isCapitalized(word)) {
						item.category = word;
					}
				}
				else {
					const entry = { category: word, value: 1 };
					wordMap.set(lower, entry);
					words.push(entry);
				}
			}

			let excludeWords = this.get("excludeWords");

			const minValue = this.get("minValue", 1);
			const minWordLength = this.get("minWordLength", 1);

			if (minValue > 1 || minWordLength > 1 || (excludeWords && excludeWords.length > 0)) {
				for (let i = words.length - 1; i >= 0; i--) {
					let w = words[i];
					let word = w.category;

					if (w.value < minValue) {
						words.splice(i, 1);
					}
					if (word.length < minWordLength) {
						words.splice(i, 1);
					}
					if (excludeWords && excludeWords.indexOf(word) !== -1) {
						words.splice(i, 1);
					}
				}
			}

			words.sort(function(a, b) {
				if (a.value == b.value) {
					return 0;
				}
				else if (a.value > b.value) {
					return -1;
				}
				else {
					return 1;
				}
			});

			const maxCount = this.get("maxCount", Infinity);
			if (words.length > maxCount) {
				words = words.slice(0, maxCount);
			}
		}

		return words;
	}
	/**
* Checks if word is capitalized (starts with an uppercase) or not.
*
* @ignore
* @param   word  Word
* @return        Capitalized?
*/
	public isCapitalized(word: string): boolean {
		let lword = word.toLowerCase();
		return word[0] != lword[0]
			&& word.substr(1) == lword.substr(1)
			&& word != lword;
	}
}
