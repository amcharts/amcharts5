import type { DataItem } from "../../core/render/Component";
import type { PieChart } from "./PieChart";

import { PercentSeries, IPercentSeriesSettings, IPercentSeriesDataItem, IPercentSeriesPrivate } from "../percent/PercentSeries";
import { Template } from "../../core/util/Template";
import type { IPoint } from "../../core/util/IPoint";
import { Slice } from "../../core/render/Slice";
import { Tick } from "../../core/render/Tick";
import { RadialLabel } from "../../core/render/RadialLabel";
import { ListTemplate } from "../../core/util/List";
import { p100, Percent } from "../../core/util/Percent";
import { setFit, inside, overlap, lineSizes, fontKey } from "../../core/util/Fit";
import type { Bullet } from "../../core/render/Bullet";
import type { IBounds } from "../../core/util/IBounds";

import * as $array from "../../core/util/Array";
import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";

export interface IPieSeriesDataItem extends IPercentSeriesDataItem {
	/**
	 * The slice element.
	 */
	slice: Slice;
	/**
	 * The slice's label.
	 */
	label: RadialLabel;
}

export interface IPieSeriesSettings extends IPercentSeriesSettings {

	/**
	 * Outer radius of the series, in pixels or percent, measured out from the
	 * chart's `innerRadius`: `100%` reaches the chart's `radius`. When not set,
	 * the chart's series share that space equally as concentric rings.
	 */
	radius?: Percent | number;

	/**
	 * Inner radius of the series, in pixels or percent, measured the same way
	 * as `radius`. A negative number is pixels in from the series' outer
	 * radius, when the chart has no `innerRadius`.
	 */
	innerRadius?: Percent | number;

	/**
	 * Angle where the first slice starts, in degrees: `0` is at the right,
	 * `-90` at the top, and slices follow clockwise. Set the chart's
	 * `startAngle` to match, so the pie is fitted and centered for it.
	 *
	 * @default -90
	 */
	startAngle?: number;

	/**
	 * Angle where the last slice ends, in degrees. Set the chart's `endAngle`
	 * to match.
	 *
	 * @default 270
	 */
	endAngle?: number;

	/**
	 * Fits the labels into the chart, a step at a time as room runs out:
	 *
	 * * The pie moves aside so each side gets the room its widest label needs,
	 *   then gets smaller, down to half the chart's shorter side.
	 * * Then a label too wide for its column wraps onto up to three lines where
	 *   the column has height to spare, and is shortened where it has not.
	 * * Then the labels of the smallest slices are hidden where a column
	 *   cannot hold them all, and a side too narrow for readable labels shows
	 *   none.
	 * * When no label fits, all are hidden and the pie keeps its size and place.
	 *
	 * Labels also get the chart's full height.
	 *
	 * A label put in the middle of a donut, in the series' or the chart's
	 * `seriesContainer` children (a total, say), is made smaller where it would
	 * not fit the hole, unless its own `maxWidth`, `maxHeight` or
	 * `oversizedBehavior` is set.
	 *
	 * With `alignLabels: false`, labels stay next to their slices: the pie
	 * gets smaller for them, down to half the chart's shorter side, then a
	 * label too wide for the room it has wraps onto up to three lines or is
	 * shortened (curved labels are not), and where two still overlap, or one
	 * would be cut off at the chart's edge, the smaller slice's label is hidden.
	 *
	 * A `maxWidth` on the labels template is the most a label may take. With
	 * `oversizedBehavior: "truncate"` there, labels are only shortened; with
	 * `"wrap"`, they are shortened only where wrapping does not fit; with
	 * `"fit"`, `"hide"` or `"none"`, they are not narrowed. A label whose own
	 * `maxWidth` or `oversizedBehavior` is set is not narrowed either.
	 *
	 * Labels in the series' bullets are hidden where they would overlap or be
	 * cut off, as on other series.
	 *
	 * @default false
	 * @since 5.22.0
	 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/pie-series/#labels-that-dont-fit} for more info
	 */
	autoLabels?: boolean;

}

// A label's box for its text, with the text's width on one line and a line's height
interface ILabelBox extends IBounds { text: string, full: number, line: number, font?: string, share?: number }

export interface IPieSeriesPrivate extends IPercentSeriesPrivate {

	/**
	 * Outer radius of the series as drawn, in pixels.
	 */
	radius?: number;

}

/**
 * A series of pie slices for a [[PieChart]]. With `alignLabels: false`, the
 * labels sit around the pie next to their slices instead of in two columns.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/pie-chart/} for more info
 * @important
 */
export class PieSeries extends PercentSeries {

	// `autoLabels`: whether it was ever on; 0 when off, 1 with labels in columns, 2 with labels next to their slices
	protected _fitOn: boolean = false;
	protected _fitMode: number = 0;
	// `autoLabels`: each label's own box for its text: its size in a column, or its box around its place
	protected _labelBoxes: { [uid: number]: ILabelBox } = {};
	// `autoLabels`: frames left to fit after a change, the chart size fitted for, frames left to lay out again
	protected _fitFrames: number = 0;
	protected _fitSize: string = "";
	protected _relayout: number = 0;

	declare public chart: PieChart | undefined;

	public static className: string = "PieSeries";
	public static classNames: Array<string> = PercentSeries.classNames.concat([PieSeries.className]);

	declare public _settings: IPieSeriesSettings;
	declare public _privateSettings: IPieSeriesPrivate;
	declare public _dataItemSettings: IPieSeriesDataItem;

	declare public _sliceType: Slice;
	declare public _labelType: RadialLabel;

	protected _makeSlices(): ListTemplate<this["_sliceType"]> {
		return new ListTemplate(
			Template.new({}),
			() => Slice._new(this._root, {
				themeTags: $utils.mergeTags(this.slices.template.get("themeTags", []), ["pie", "series"])
			}, [this.slices.template]),
		);
	}

	protected _makeLabels(): ListTemplate<this["_labelType"]> {
		return new ListTemplate(
			Template.new({}),
			() => RadialLabel._new(this._root, {
				themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), ["pie", "series"])
			}, [this.labels.template]),
		);
	}

	protected _makeTicks(): ListTemplate<this["_tickType"]> {
		return new ListTemplate(
			Template.new({}),
			() => Tick._new(this._root, {
				themeTags: $utils.mergeTags(this.ticks.template.get("themeTags", []), ["pie", "series"])
			}, [this.ticks.template]),
		);
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		const slice = this.makeSlice(dataItem);

		slice.on("scale", () => {
			this._updateTick(dataItem);
		})
		slice.on("shiftRadius", () => {
			this._updateTick(dataItem);
		})
		slice.events.on("positionchanged", () => {
			this._updateTick(dataItem);
		})

		const label = this.makeLabel(dataItem);

		label.events.on("positionchanged", () => {
			this._updateTick(dataItem);
		})

		this.makeTick(dataItem);

		slice.events.on("positionchanged", () => {
			label.markDirty();
		})
	}

	protected _getNextUp() {
		const chart = this.chart;
		if (chart) {
			if (this._fitMode) {
				return chart.chartContainer.innerHeight() / 2 - chart.seriesContainer.get("dy", 0);
			}
			return chart._maxRadius;
		}
		return this.labelsContainer.maxHeight() / 2;
	}

	protected _getNextDown() {
		const chart = this.chart;
		if (chart) {
			if (this._fitMode) {
				return -chart.chartContainer.innerHeight() / 2 - chart.seriesContainer.get("dy", 0);
			}
			return -chart._maxRadius;
		}
		return -this.labelsContainer.maxHeight() / 2;

	}

	public _beforeChanged() {
		super._beforeChanged();
		if (this.get("autoLabels") && !this._fitOn) {
			this._fitOn = true;
			this._disposers.push(this._root.events.on("frameended", () => {
				this._autoFit();
			}));
		}
	}

	protected _dispose() {
		const chart = this.chart;
		if (chart && !chart.isDisposed()) {
			chart._fitPie(this);
		}
		super._dispose();
	}

	// `autoLabels`: where the last slice ends once the pie is shown. Labels are placed there while
	// the pie appears or goes, so they are fitted before it opens, at its fitted size
	protected _labelEndAngle(endAngle: number): number {
		if (this.get("autoLabels") && (this.isHidden() || this.isShowing() || this.isHiding())) {
			const shown = this.states.lookup("default");
			const value = shown ? shown.get("endAngle") : undefined;
			if (value != null) {
				return value;
			}
		}
		return endAngle;
	}

	// `autoLabels`: fits the labels once a frame is drawn, as settings written while it is prepared can get lost
	protected _autoFit() {
		const chart = this.chart;
		if (!chart || chart.isDisposed() || this.isDisposed()) {
			return;
		}
		const mode = !this.get("autoLabels") || chart.series.indexOf(this) < 0 ? 0 : this.get("alignLabels") ? 1 : 2;
		if (mode != this._fitMode) {
			// what was fitted the other way is given back first
			this._fitMode = mode;
			this._releaseLabels(chart);
			return;
		}
		if (!mode) {
			return;
		}
		this._fitHoleLabels(chart);
		// a slice appearing or going: fitted once it is in place, in a frame asked for here (the
		// pie's own labels are where they end up, see `_labelEndAngle`)
		if ($array.any(this._dataItems, (dataItem) => {
			const slice = dataItem.get("slice");
			return slice != null && (slice.isShowing() || slice.isHiding());
		})) {
			this._fitFrames = 3;
			this.markDirty();
			return;
		}
		const container = chart.chartContainer;
		const w = container.innerWidth();
		const h = container.innerHeight();
		if (!(w > 0 && h > 0 && chart.radius() > 0)) {
			return;
		}
		// only when the series or the chart's size changed, or a change is being laid out
		const size = [w, h, this._root._fontLoads].join();
		if (this._fitFrames <= 0 && this._relayout <= 0 && size == this._fitSize) {
			return;
		}
		this._fitSize = size;
		this._fitFrames--;
		// after a change, the labels are laid out again, also once their new sizes are known
		if (this._relayout > 0) {
			this._relayout--;
			this.markDirtyKey("radius");
		}
		if (mode == 1 ? this._fitAligned(chart, w, h) : this._fitAround(chart, w, h)) {
			this._relayout = 2;
		}
	}

	// Undoes what `autoLabels` changed
	protected _releaseLabels(chart: PieChart) {
		chart._fitPie(this);
		$array.each(this._dataItems, (dataItem) => {
			const label = dataItem.get("label");
			if (label) {
				this._showLabel(dataItem, true);
				this._fitLabel(label);
			}
		});
		this._fitHoleLabels(chart, true);
		this._labelBoxes = {};
		this.markDirtyKey("radius");
	}

	// `autoLabels`: makes a label in the middle of a donut fit the hole; `release` gives it back its own
	protected _fitHoleLabels(chart: PieChart, release?: boolean): void {
		let hole = chart.innerRadius(this) * chart.getPrivate("irModifyer", 1);
		if (hole < 0) {
			hole = chart.radius(this) + hole;
		}
		const keys = ["maxWidth", "maxHeight", "oversizedBehavior"];
		// the chart's middle is the innermost series' hole
		$array.each(chart.series.indexOf(this) == 0 ? [this, chart.seriesContainer] : [this], (container) => {
			container.children.each((child) => {
				const label: any = child;
				if (child.className != "Label" || child.isDisposed() || $array.any(keys, (key) => label.isUserSetting(key) && !label.isComputedSetting(key))) {
					return;
				}
				// its text as laid out, before any fitting
				const size = lineSizes(label.text);
				const w = size.widest;
				const h = size.height;
				// smaller until its corners are inside the hole, with a little room
				const scale = !release && hole > 0 && w > 0 ? 1.8 * hole / Math.sqrt(w * w + h * h) : 1;
				const fit = scale < 0.999;
				setFit(label, keys[0], fit ? w * scale + label.get("paddingLeft", 0) + label.get("paddingRight", 0) : undefined, 0.5);
				setFit(label, keys[1], fit ? h * scale + label.get("paddingTop", 0) + label.get("paddingBottom", 0) : undefined, 0.5);
				setFit(label, keys[2], fit ? "fit" : undefined);
			});
		});
	}

	// Hides or shows a label and its tick for `autoLabels`, without touching what the author set
	protected _showLabel(dataItem: DataItem<IPieSeriesDataItem>, show: boolean): boolean {
		const value = show ? undefined : true;
		const tick = dataItem.get("tick");
		const changed = setFit(dataItem.get("label"), "forceHidden", value);
		return (tick != null && setFit(tick, "forceHidden", value)) || changed;
	}

	// Whether a label is hidden with its slice, or by the author
	protected _labelGone(dataItem: DataItem<IPieSeriesDataItem>, label: RadialLabel): boolean {
		return dataItem.isHidden() || label.isHidden() || label.isHiding() || (label.get("forceHidden", false) && !label.isComputedSetting("forceHidden"));
	}

	// A value the author put on the series' label template, or on the label's own template
	protected _templateValue<Key extends "maxWidth" | "oversizedBehavior">(label: RadialLabel, key: Key): RadialLabel["_settings"][Key] | undefined {
		const template = label.template;
		const value = template ? template.get(key) : undefined;
		return value != null ? value : this.labels.template.get(key);
	}

	// How the author's settings let a label be narrowed: 0 not at all, 1 shortened only, 2 wrapped or shortened
	protected _fitWays(label: RadialLabel): number {
		const own = (key: "maxWidth" | "oversizedBehavior") => label.isUserSetting(key) && !label.isComputedSetting(key);
		const behavior = this._templateValue(label, "oversizedBehavior");
		if (own("maxWidth") || own("oversizedBehavior")) {
			return 0;
		}
		return behavior == "truncate" ? 1 : behavior == null || behavior == "wrap" || behavior == "wrap-no-break" ? 2 : 0;
	}

	// A label's text on one line, from how it was laid out: its width and a line's height, or zeros
	protected _oneLine(label: RadialLabel): { full: number, line: number } {
		const size = lineSizes(label.text);
		// and the spaces where it was wrapped
		return { full: size.width && size.width + (size.count - 1) * size.tallest * 0.3, line: size.tallest };
	}

	// Narrows a label to a width, wrapping or shortening it, or gives it back its own with no width
	protected _fitLabel(label: RadialLabel, width?: number, wrap?: boolean): boolean {
		let behavior: "wrap" | "truncate" | undefined;
		if (width != null) {
			// a width on the label template is the most the label may take
			width = Math.min(width, this._templateValue(label, "maxWidth") || Infinity);
			// the label template's way of wrapping, or of shortening, is kept
			const authored = this._templateValue(label, "oversizedBehavior");
			if (authored != "truncate" && !(authored && wrap)) {
				behavior = wrap ? "wrap" : "truncate";
			}
		}
		const changed = setFit(label, "maxWidth", width, 0.5);
		return setFit(label, "oversizedBehavior", behavior) || changed;
	}

	// Lines a text of a known width takes when wrapped into a room; `Infinity` when a word would be broken
	protected _countLines(text: string, width: number, room: number): number {
		const total = this._textWeight(text);
		if (room <= 0 || total <= 0) {
			return Infinity;
		}
		const unit = width / total;
		const space = unit / 2;
		const line = room * 0.95;
		let lines = 1;
		let used = 0;
		$array.each(text.replace(/\[[^\[\]]*\]/g, "").split(/\s/), (word) => {
			const length = this._textWeight(word) * unit;
			if (length > line) {
				lines = Infinity;
			}
			if (used > 0 && used + space + length > line) {
				lines++;
				used = 0;
			}
			used += (used > 0 ? space : 0) + length;
		});
		return lines;
	}

	// A text's width in average letters, without its formatting, with narrow and wide letters weighed as such
	protected _textWeight(text: string): number {
		text = text.replace(/\[[^\[\]]*\]/g, "");
		let weight = 0;
		for (let i = 0; i < text.length; i++) {
			const char = text.charAt(i);
			weight += " ijl.,:;'!|\n".indexOf(char) != -1 ? 0.5 : "frtI()[]-/".indexOf(char) != -1 ? 0.65 : "mwMW%@".indexOf(char) != -1 ? 1.5 : char >= "A" && char <= "Z" ? 1.2 : 1;
		}
		return weight;
	}

	// `autoLabels`: a label's box, measured when drawn as it is, else the one from before, scaled to its text
	protected _labelBox(label: RadialLabel, text: string, share: number, measure: () => ILabelBox | undefined): ILabelBox | undefined {
		// one measured in another font, or on another side of its point, is measured again
		const font = fontKey(label);
		let known: ILabelBox | undefined = this._labelBoxes[label.uid];
		if (known && (known.font !== font || Math.abs((known.share == null ? share : known.share) - share) > 0.1)) {
			known = undefined;
		}
		let box = label.isComputedSetting("maxWidth") || label.isComputedSetting("forceHidden") ? undefined : measure();
		if (box) {
			box.font = font;
			box.share = share;
		}
		else if (known) {
			box = known;
			if (known.text != text) {
				const before = this._textWeight(known.text);
				const ratio = before > 0 ? this._textWeight(text) / before : 1;
				const delta = (known.right - known.left) * (ratio - 1);
				box = { text: text, left: known.left - delta * share, right: known.right + delta * (1 - share), top: known.top, bottom: known.bottom, full: known.full * ratio, line: known.line, font: font, share: known.share };
			}
		}
		return box;
	}

	// `autoLabels` with labels in columns, see the setting; returns whether anything changed
	protected _fitAligned(chart: PieChart, w: number, h: number): boolean {
		const full = chart._fullRadius();
		const minRadius = Math.min(full, Math.min(w, h) / 4);
		const labelsContainer = this.labelsContainer;
		// the narrowest a label may be
		const readable = 40;

		type Entry = { dataItem: DataItem<IPieSeriesDataItem>, label: RadialLabel, box: ILabelBox, value: number, pad: number, padV: number, show: boolean };
		const columns: Array<Array<Entry>> = [[], []];
		const boxes: { [uid: number]: ILabelBox } = {};
		// what each side needs beside the pie, and how far its labels are from it
		const need = [0, 0];
		const off = [0, 0];
		let changed = false;
		$array.each(this._dataItems, (dataItem) => {
			const label = dataItem.get("label");
			if (!label || label.isDisposed()) {
				return;
			}
			const text = label.text._getText();
			const pad = label.get("paddingLeft", 0) + label.get("paddingRight", 0);
			const padV = label.get("paddingTop", 0) + label.get("paddingBottom", 0);
			const gone = this._labelGone(dataItem, label);
			const box = this._labelBox(label, text, 0, () => {
				const width = label.width();
				if (gone || !(width > 0)) {
					return undefined;
				}
				const bounds = label.adjustedLocalBounds();
				const height = bounds.bottom - bounds.top;
				const one = this._oneLine(label);
				return { text: text, left: 0, right: width, top: 0, bottom: height, full: one.full || width - pad, line: one.line || height - padV };
			});
			if (box) {
				boxes[label.uid] = box;
			}
			if (gone) {
				return;
			}
			if (!box) {
				// fitted or hidden here and its size not known: given back, to be measured
				this._showLabel(dataItem, true);
				this._fitLabel(label);
				changed = true;
				return;
			}
			const side = label.getPrivate("left") ? 0 : 1;
			const offset = label.get("radius", 0) + labelsContainer.get(side ? "paddingRight" : "paddingLeft", 0);
			need[side] = Math.max(need[side], box.right + offset);
			off[side] = Math.max(off[side], offset);
			columns[side].push({ dataItem: dataItem, label: label, box: box, value: Math.abs(dataItem.get("value", 0)), pad: pad, padV: padV, show: false });
		});
		this._labelBoxes = boxes;

		// each side gets the room its widest label needs: the pie moves aside, then gets smaller
		const arc = chart._arcBounds;
		let radius = full;
		// the pie's center, and where the chart would put it
		let center = w / 2;
		let own = center;
		const room = [0, 0];
		for (let pass = 0; pass < 3; pass++) {
			const both = need[0] + need[1];
			// how far it reaches each way for a radius of 1: to its labels, or else to its arc's edge
			const reach = [need[0] > 0 ? 1 : -arc.left, need[1] > 0 ? 1 : arc.right];
			radius = Math.max(minRadius, Math.min(full, (w - both) / (reach[0] + reach[1])));
			const left = radius * reach[0];
			const core = left + radius * reach[1];
			own = w / 2 - radius * (arc.left + arc.right) / 2;
			// room left over is shared as the sides need it
			center = both + core > w ? left + (w - core) * need[0] / both : Math.min(Math.max(own, need[0] + left), w - need[1] - radius * reach[1]);
			room[0] = center - radius - off[0];
			room[1] = w - center - radius - off[1];
			// a side too narrow for readable labels shows none, and the other side gets its room
			let again = false;
			$array.each(room, (space, side) => {
				if (need[side] > 0 && space < readable) {
					need[side] = 0;
					again = true;
				}
			});
			if (!again) {
				break;
			}
		}

		let shown = 0;
		$array.each(columns, (column, side) => {
			// a column keeps what fits in the chart's height, the largest slices first
			column.sort((a, b) => b.value - a.value);
			let used = 0;
			$array.each(column, (entry) => {
				entry.show = need[side] > 0 && used + entry.box.bottom <= h + 0.5;
				if (entry.show) {
					used += entry.box.bottom;
				}
			});
			// a label too wide wraps where the column has height to spare, or is shortened
			$array.each(column, (entry) => {
				const label = entry.label;
				const box = entry.box;
				let width: number | undefined;
				let wrap = false;
				if (entry.show && box.right > room[side]) {
					const ways = this._fitWays(label);
					width = room[side];
					const lines = ways > 1 ? this._countLines(box.text, box.full, width - entry.pad) : Infinity;
					const extra = Math.max(0, lines * box.line + entry.padV - box.bottom);
					if (lines <= 3 && used + extra <= h + 0.5) {
						wrap = true;
						used += extra;
					}
					if (!ways) {
						entry.show = false;
						used -= box.bottom;
					}
				}
				if (entry.show) {
					shown++;
				}
				if (this._showLabel(entry.dataItem, entry.show)) {
					changed = true;
				}
				if (this._fitLabel(label, entry.show ? width : undefined, wrap)) {
					changed = true;
				}
			});
		});

		// when no label fits, none is shown, and the pie keeps its size and place
		const dx = shown ? center - own : 0;
		chart._fitPie(this, shown && (radius < full - 0.5 || Math.abs(dx) > 0.5) ? radius : undefined, dx);
		return changed;
	}

	// `autoLabels` with labels next to their slices, see the setting; returns whether a label waits to be measured
	protected _fitAround(chart: PieChart, w: number, h: number): boolean {
		const now = chart.radius();
		const full = chart._fullRadius();
		const minRadius = Math.min(full, Math.min(w, h) / 4);
		// labels stay in the chart's own area, clear of its legend and of other charts
		const area = chart.chartContainer.globalBounds();
		const parent = this.labelsContainer;
		const origin = parent.toGlobal({ x: 0, y: 0 });
		const scale = parent.toGlobal({ x: 1, y: 0 }).x - origin.x;
		const arc = chart._arcBounds;
		const middle = { x: (arc.left + arc.right) / 2, y: (arc.top + arc.bottom) / 2 };
		const readable = 40;
		// the widest a label beside its point may be to stay in the chart's area
		const space = (x: number, cos: number) => Math.min(1 + cos > 0.01 ? 2 * (area.right - x) / (1 + cos) : Infinity, 1 - cos > 0.01 ? 2 * (x - area.left) / (1 - cos) : Infinity);

		// a label's box and place on the page, and how far they move as the pie's radius grows by one
		type Entry = { dataItem: DataItem<IPieSeriesDataItem>, label: RadialLabel, value: number, box: IBounds, own: ILabelBox, x: number, y: number, vx: number, vy: number, grow: number, cos: number, sin: number, ways: number };
		const entries: Array<Entry> = [];
		const boxes: { [uid: number]: ILabelBox } = {};
		let pending = false;
		let radius = full;
		$array.each(this._dataItems, (dataItem) => {
			const label = dataItem.get("label");
			if (!label || label.isDisposed()) {
				return;
			}
			const text = label.text._getText();
			const gone = this._labelGone(dataItem, label);
			const angle = label.get("labelAngle", 0);
			const cos = $math.cos(angle);
			const sin = $math.sin(angle);
			// where the label is placed; one with no base radius sits in the center
			const base = label.baseRadius();
			const distance = base == 0 ? 0 : label.radius();
			const x = origin.x + scale * distance * cos;
			const y = origin.y + scale * distance * sin;
			const textType = label.get("textType");
			const beside = textType == "adjusted" && !label.get("inside");
			const centerX = label.get("centerX");
			const own = this._labelBox(label, text, beside ? (1 - cos) / 2 : centerX instanceof Percent ? centerX.value : 0, () => {
				const drawn = gone ? undefined : label._arcGlobalBounds() || label.text.globalBounds();
				if (!drawn || !(drawn.right > drawn.left)) {
					return undefined;
				}
				const one = this._oneLine(label);
				return { text: text, left: drawn.left - x, right: drawn.right - x, top: drawn.top - y, bottom: drawn.bottom - y, full: one.full * scale || drawn.right - drawn.left, line: one.line * scale || drawn.bottom - drawn.top };
			});
			if (own) {
				boxes[label.uid] = own;
			}
			if (gone) {
				return;
			}
			if (!own) {
				// not measured yet: shown, to be measured
				this._showLabel(dataItem, true);
				this._fitLabel(label);
				pending = true;
				return;
			}
			const box = { left: x + own.left, right: x + own.right, top: y + own.top, bottom: y + own.bottom };
			// a pie that is not a full circle is moved with its radius to stay centered
			const grow = base / now;
			const vx = scale * (grow * cos - middle.x);
			const vy = scale * (grow * sin - middle.y);
			// the largest radius at which a box stays in the chart's area; a curved label's box grows to all sides
			const most = (left: number, right: number) => {
				let max = Infinity;
				$array.each([[area.right - right, vx], [left - area.left, -vx], [area.bottom - box.bottom, vy], [box.top - area.top, -vy]], (side) => {
					const speed = textType == "circular" ? scale * grow : side[1];
					if (speed > 0.01) {
						max = Math.min(max, now + side[0] / speed);
					}
				});
				return max;
			};
			const narrowed = (width: number) => most(x - width * (1 - cos) / 2, x + width * (1 + cos) / 2);
			// a label beside its point, on one line, may be narrowed, as far as its author's settings let it
			const ways = beside && text.indexOf("\n") == -1 ? this._fitWays(label) : 0;
			// the pie gets smaller until the label fits, or has half its width when it has to be narrowed
			let max = most(box.left, box.right);
			if (max < minRadius - 0.5 && ways) {
				max = narrowed(Math.max(readable, (box.right - box.left) / 2));
				if (max < minRadius && narrowed(readable) >= minRadius) {
					max = minRadius;
				}
			}
			if (max >= minRadius - 0.5) {
				radius = Math.min(radius, max);
			}
			entries.push({ dataItem: dataItem, label: label, value: Math.abs(dataItem.get("value", 0)), box: box, own: own, x: x, y: y, vx: vx, vy: vy, grow: grow, cos: cos, sin: sin, ways: ways });
		});
		this._labelBoxes = boxes;

		radius = Math.max(radius, minRadius);
		if (pending) {
			// a label not measured yet may need room: the pie does not grow until it is
			radius = Math.min(radius, now);
		}
		chart._fitPie(this, radius < full - 0.5 ? radius : undefined);

		type Arc = { start: number, end: number, inner: number, outer: number };
		// curved labels on the same ring overlap where their angles do, about a space apart
		const arcsOverlap = (p: Arc, q: Arc) => {
			if (p.inner >= q.outer - 0.5 || q.inner >= p.outer - 0.5) {
				return false;
			}
			const gap = Math.max(2, Math.min(p.outer - p.inner, q.outer - q.inner) * 0.3) / Math.max(1, Math.min(p.inner, q.inner)) * $math.DEGREES;
			const turn = (a: Arc, b: Arc) => ((b.start - a.start) % 360 + 360) % 360 < a.end - a.start + gap;
			return turn(p, q) || turn(q, p);
		};
		const kept: Array<{ box: IBounds, arc?: Arc }> = [];
		// the pie is drawn at the smallest radius any series asks for, which may be another series'
		const by = chart.radius() - now;
		entries.sort((a, b) => b.value - a.value);
		$array.each(entries, (entry) => {
			const label = entry.label;
			const own = entry.own;
			const x = entry.x + by * entry.vx;
			const y = entry.y + by * entry.vy;
			const size = label._arcSize();
			const arc = size ? label._arc(size, label.radius() + by * entry.grow) : undefined;
			const fits = (box: IBounds) => inside(box, area) && !$array.any(kept, (other) => arc && other.arc ? arcsOverlap(arc, other.arc) : overlap(box, other.box));
			let box: IBounds | undefined = { left: x + own.left, right: x + own.right, top: y + own.top, bottom: y + own.bottom };
			let width: number | undefined;
			let wrap = false;
			if (entry.ways && !inside(box, area)) {
				// narrowed to the room it has: wrapped onto three lines at most, or shortened
				const room = space(x, entry.cos);
				const pad = (label.get("paddingLeft", 0) + label.get("paddingRight", 0)) * scale;
				const padV = (label.get("paddingTop", 0) + label.get("paddingBottom", 0)) * scale;
				// it sits beside its point, so a taller label moves out with its height
				const narrowed = (height: number): IBounds => {
					const cx = x + room / 2 * entry.cos;
					const cy = y + height / 2 * entry.sin;
					return { left: cx - room / 2, right: cx + room / 2, top: cy - height / 2, bottom: cy + height / 2 };
				};
				box = undefined;
				if (room >= readable && room < own.right - own.left + pad) {
					width = room / scale;
					box = narrowed((entry.ways > 1 ? this._countLines(own.text, own.full, room - pad) : Infinity) * own.line + padV);
					wrap = box.bottom - box.top <= 3 * own.line + padV + 0.5 && fits(box);
					if (!wrap) {
						box = narrowed(own.bottom - own.top);
					}
				}
			}
			const show = box != null && fits(box);
			if (show) {
				kept.push({ box: box!, arc: arc });
			}
			this._showLabel(entry.dataItem, show);
			this._fitLabel(label, show ? width : undefined, wrap);
		});
		return pending;
	}

	public _prepareChildren() {
		super._prepareChildren();
		if (this._fitMode) {
			this._fitFrames = 3;
		}
		const chart = this.chart;
		if (chart) {

			if (this.isDirty("alignLabels")) {
				let labelsTemplate = this.labels.template;

				if (this.get("alignLabels")) {
					labelsTemplate._setC("textType", "aligned");
				}
				else {
					let textType = labelsTemplate.get("textType");
					if (textType == null || textType == "aligned") {
						labelsTemplate._setC("textType", "adjusted");
					}
				}
			}


			if (this._valuesDirty || this.isDirty("radius") || this.isDirty("innerRadius") || this.isDirty("startAngle") || this.isDirty("endAngle") || this.isDirty("alignLabels")) {
				this.markDirtyBounds();
				const startAngle = this.get("startAngle", chart.get("startAngle", -90));
				const endAngle = this.get("endAngle", chart.get("endAngle", 270));
				const arc = endAngle - startAngle;
				let currentAngle = startAngle;
				const labelArc = this._labelEndAngle(endAngle) - startAngle;
				let labelAngle = startAngle;

				const radius = chart.radius(this);
				this.setPrivateRaw("radius", radius);
				let innerRadius = chart.innerRadius(this) * chart.getPrivate("irModifyer", 1);

				if (innerRadius < 0) {
					innerRadius = radius + innerRadius;
				}

				//if (radius > 0) {
				$array.each(this._dataItems, (dataItem) => {

					this.updateLegendValue(dataItem);

					let currentArc = arc * dataItem.get("valuePercentTotal") / 100;
					const slice = dataItem.get("slice");
					if (slice) {
						slice.set("radius", radius);
						slice.set("innerRadius", innerRadius);
						slice.set("startAngle", currentAngle);

						slice.set("arc", currentArc);

						const color = dataItem.get("fill");
						slice._setDefault("fill", color);
						slice._setDefault("stroke", color);

						const fillPattern = dataItem.get("fillPattern");
						slice._setDefault("fillPattern", fillPattern);						
					}

					const labelSpan = labelArc * dataItem.get("valuePercentTotal") / 100;
					let middleAngle = $math.normalizeAngle(labelAngle + labelSpan / 2);
					labelAngle += labelSpan;

					const label = dataItem.get("label");
					if (label) {
						label.setPrivate("radius", radius);
						label.setPrivate("innerRadius", innerRadius);
						label.set("labelAngle", middleAngle);

						if (label.get("textType") == "aligned") {
							let labelRadius = radius + label.get("radius", 0);
							let y = radius * $math.sin(middleAngle);

							if (middleAngle > 90 && middleAngle <= 270) {
								if (!label.isHidden() && !label.isHiding() && !label.get("forceHidden")) {
									this._lLabels.push({ label: label, y: y });
								}
								labelRadius *= -1;
								labelRadius -= this.labelsContainer.get("paddingLeft", 0);
								label.set("centerX", p100);
								label.setPrivateRaw("left", true);
							}
							else {
								if (!label.isHidden() && !label.isHiding() && !label.get("forceHidden")) {
									this._rLabels.push({ label: label, y: y });
								}
								labelRadius += this.labelsContainer.get("paddingRight", 0);
								label.set("centerX", 0);
								label.setPrivateRaw("left", false);
							}
							label.set("x", labelRadius);
							label.set("y", radius * $math.sin(middleAngle));
						}
					}
					currentAngle += currentArc;
					this._updateTick(dataItem);
				})
				//}
			}
		}
	}

	protected _updateTick(dataItem: DataItem<this["_dataItemSettings"]>) {
		const tick = dataItem.get("tick");
		const label = dataItem.get("label");
		const slice = dataItem.get("slice");
		const location = tick.get("location", 1);
		if (tick && label && slice) {
			const radius = (slice.get("shiftRadius", 0) + slice.get("radius", 0)) * slice.get("scale", 1) * location;
			const labelAngle = label.get("labelAngle", 0);
			const cos = $math.cos(labelAngle);
			const sin = $math.sin(labelAngle);

			const labelsContainer = this.labelsContainer;
			const pl = labelsContainer.get("paddingLeft", 0);
			const pr = labelsContainer.get("paddingRight", 0);

			let x = 0;
			let y = 0;

			x = label.x();
			y = label.y();
			let points:Array<IPoint> = [];

			if(x != 0 || y != 0){
				if (label.get("textType") == "circular") {
					const labelRadius = label.radius() - label.get("paddingBottom", 0);
					const labelAngle = label.get("labelAngle", 0);
					x = labelRadius * $math.cos(labelAngle);
					y = labelRadius * $math.sin(labelAngle);
				}

				let dx = -pr;
				if (label.getPrivate("left")) {
					dx = pl;
				}
				points = [{ x: slice.x() + radius * cos, y: slice.y() + radius * sin }, { x: x + dx, y: y }, { x: x, y: y }];				
			}

			tick.set("points", points);
		}
	}

	public _positionBullet(bullet: Bullet) {

		const sprite = bullet.get("sprite");
		if (sprite) {
			const dataItem = sprite.dataItem as DataItem<this["_dataItemSettings"]>;
			const slice = dataItem.get("slice");

			if (slice) {
				const innerRadius = slice.get("innerRadius", 0);
				const radius = slice.get("radius", 0);
				const startAngle = slice.get("startAngle", 0);
				const arc = slice.get("arc", 0);
				const locationX = bullet.get("locationX", 0.5);
				const locationY = bullet.get("locationY", 0.5);

				const angle = startAngle + arc * locationX;
				const r = innerRadius + (radius - innerRadius) * locationY;

				sprite.setAll({ x: $math.cos(angle) * r, y: $math.sin(angle) * r });
			}
		}
	}
}
