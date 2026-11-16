import type { Sprite, ISpritePointerEvent } from "../../../core/render/Sprite";
import type { Axis, IAxisDataItem } from "./Axis";
import type { IPoint } from "../../../core/util/IPoint";
import type { Tooltip } from "../../../core/render/Tooltip";
import type { AxisBullet } from "./AxisBullet";
import type { XYChart } from "../XYChart";
import type { DataItem } from "../../../core/render/Component";
import type { IBounds } from "../../../core/util/IBounds";
import type { IDisposer } from "../../../core/util/Disposer";

import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../../core/render/Graphics";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";
import { AxisTick } from "./AxisTick";
import { Grid } from "./Grid";
import { AxisLabel } from "./AxisLabel";
import { LabelFit, inside, overlap } from "../../../core/util/Fit";
import { Percent } from "../../../core/util/Percent";

import * as $utils from "../../../core/util/Utils";
import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";

export interface IAxisRendererSettings extends IGraphicsSettings {

	/**
	 * The smallest distance between grid lines, in pixels. The axis spaces
	 * its grid, and so its labels, at least this far apart.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#grid-density} for more info
	 */
	minGridDistance?: number;

	/**
	 * Lets the axis arrange its labels to fit the chart:
	 *
	 * * A short axis gets more labels than `minGridDistance` would leave,
	 *   up to about eight before rounding to a step the axis shows, and labels
	 *   never come closer than their own size, so they may end up farther apart
	 *   than `minGridDistance`.
	 * * On a category axis, every label that fits is shown, even closer than
	 *   `minGridDistance`. Labels stacked like lines of text, such as labels
	 *   on a vertical axis or rotated labels on a horizontal one, may come as
	 *   close as lines of text set solid. When only some fit, each stays in the
	 *   middle of its category, and its tick with it. A category with an empty
	 *   label, such as a gap between groups, starts the count again, so every
	 *   group shows the same labels.
	 * * A label that would be cut off at the edge of the chart's drawing area,
	 *   or overlap a label of another axis, is hidden. Where two axes' labels
	 *   meet, a value axis gives way to a category or date axis; between two
	 *   of a kind, the vertical one gives way. An axis with this setting always
	 *   gives way to an axis without it. On a radar chart, labels are not
	 *   hidden for overlapping the other axis's.
	 *
	 * @default false
	 * @since 5.22.0
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#fitting-labels} for more info
	 */
	autoLabels?: boolean;

	/**
	 * Draws a fainter minor grid between the main grid lines. On a
	 * [[CategoryAxis]], it marks the categories that `minGridDistance` left
	 * without grid, so avoid it there with many categories.
	 *
	 * @default false
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#minor-grid} for more info
	 * @since 5.6.0
	 */
	minorGridEnabled?: boolean;

	/**
	 * Shows labels on the minor grid too. Turns the minor grid on, unless
	 * `minorGridEnabled` is set to `false`.
	 *
	 * @default false
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#enabling-minor-grid-labels} for more info
	 * @since 5.6.0
	 */
	minorLabelsEnabled?: boolean;

	/**
	 * Reverses the axis: it runs right to left on X, and top to bottom on Y.
	 *
	 * @default false
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#inversed-axes} for more info
	 */
	inversed?: boolean;

	/**
	 * Where columns start within each cell, from `0` (the cell's start) to
	 * `1` (its end). With `cellEndLocation`, sets how wide columns are and the
	 * gap between them.
	 *
	 * @default 0
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#cell-startend-locations} for more info
	 */
	cellStartLocation?: number;

	/**
	 * Where columns end within each cell, from `0` (the cell's start) to `1`
	 * (its end).
	 *
	 * @default 1
	 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/axes/#cell-startend-locations} for more info
	 */
	cellEndLocation?: number;

	/**
	 * `"zoom"` lets the user zoom the axis by dragging along its labels.
	 * Works best with the axis's `maxDeviation` at about `1`.
	 *
	 * Only [[AxisRendererX]] and [[AxisRendererY]] support it, and not with
	 * `inside` set to `true`.
	 *
	 * @since 5.0.7
	 * @default "none"
	 */
	pan?: "none" | "zoom"


	/**
	 * How much dragging along the labels zooms the axis when `pan` is
	 * `"zoom"`: higher zooms more.
	 *
	 * @default 1
	 */
	panSensitivity?: number;

}

export interface IAxisRendererPrivate extends IGraphicsPrivate {
	/**
	 * @ignore
	 */
	letter?: "X" | "Y";
}

/**
 * Base class for axis renderers, which draw an axis's line, labels, ticks,
 * grid and fills. Not used on its own.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/xy-chart/#axis-renderer} for more info
 */
export abstract class AxisRenderer extends Graphics {
	public static className: string = "AxisRenderer";
	public static classNames: Array<string> = Graphics.classNames.concat([AxisRenderer.className]);

	// save for quick access
	public _axisLength: number = 100;
	public _start: number = 0;
	public _end: number = 1;
	public _inversed: boolean = false;

	protected _minSize: number = 0;

	/**
	 * The chart the renderer is used in.
	 */
	public chart: XYChart | undefined;

	protected _lc = 1;

	protected _ls = 0;

	protected _thumbDownPoint?: IPoint;

	protected _downStart?: number;
	protected _downEnd?: number;

	// `autoLabels`: the largest label size along the axis, for the length and zoom it was measured at
	protected _labelExtent: number = 0;
	protected _labelExtentKey?: string;
	protected _labelExtentFree: number = 0;
	/**
	 * `autoLabels` on a date axis: the label size each grid interval was drawn
	 * with, by `timeUnit` and `count`.
	 *
	 * @ignore
	 */
	public _intervalExtents: { [key: string]: number } = {};
	// `autoLabels`: the labels hidden for not fitting
	protected _labelFit?: LabelFit;

	/**
	 * @ignore
	 */
	public makeTick(dataItem: DataItem<IAxisDataItem>, themeTags: Array<string>): AxisTick {
		const tick = this.ticks.make();
		tick._setDataItem(dataItem);
		dataItem.setRaw("tick", tick);
		tick.set("themeTags", $utils.mergeTags(tick.get("themeTags"), themeTags));
		this.axis.labelsContainer.children.push(tick);
		this.ticks.push(tick);
		return tick;
	}

	/**
	 * The axis's ticks. Configure them all through `ticks.template`; they are
	 * hidden by default.
	 */
	public readonly ticks: ListTemplate<AxisTick> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => AxisTick._new(this._root, {
			themeTags: $utils.mergeTags(this.ticks.template.get("themeTags", []), this.get("themeTags", []))
		}, [this.ticks.template])
	));

	/**
	 * @ignore
	 */
	public makeGrid(dataItem: DataItem<IAxisDataItem>, themeTags: Array<string>): Grid {
		const grid = this.grid.make();
		grid._setDataItem(dataItem);
		dataItem.setRaw("grid", grid);
		grid.set("themeTags", $utils.mergeTags(grid.get("themeTags"), themeTags));

		this.axis.gridContainer.children.push(grid);
		this.grid.push(grid);
		return grid;
	}

	/**
	 * The axis's grid lines. Configure them all through `grid.template`.
	 */
	public readonly grid: ListTemplate<Grid> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Grid._new(this._root, {
			themeTags: $utils.mergeTags(this.grid.template.get("themeTags", []), this.get("themeTags", []))
		}, [this.grid.template])
	));

	/**
	 * @ignore
	 */
	public makeAxisFill(dataItem: DataItem<IAxisDataItem>, themeTags: Array<string>): Grid {
		const axisFill = this.axisFills.make();
		axisFill._setDataItem(dataItem);
		axisFill.set("themeTags", $utils.mergeTags(axisFill.get("themeTags"), themeTags));

		this.axis.gridContainer.children.push(axisFill);
		dataItem.setRaw("axisFill", axisFill);
		this.axisFills.push(axisFill);
		return axisFill;
	}

	/**
	 * The axis's fills: bands between grid lines. Configure them all through
	 * `axisFills.template`; they are hidden by default.
	 */
	public readonly axisFills: ListTemplate<Graphics> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Graphics._new(this._root, {
			themeTags: $utils.mergeTags(this.axisFills.template.get("themeTags", ["axis", "fill"]), this.get("themeTags", []))
		}, [this.axisFills.template])
	));

	/**
	 * @ignore
	 */
	public makeLabel(dataItem: DataItem<IAxisDataItem>, themeTags: Array<string>): AxisLabel {

		const label = this.labels.make();

		label.set("themeTags", $utils.mergeTags(label.get("themeTags"), themeTags));
		if (dataItem.get("isRange")) {
			this.axis.labelsContainer.children.push(label);
		} else {
			this.axis.labelsContainer.children.moveValue(label, 0);
		}

		label._setDataItem(dataItem);
		dataItem.setRaw("label", label);
		this.labels.push(label);
		return label;
	}

	/**
	 * The axis's labels. Configure them all through `labels.template`.
	 */
	public readonly labels: ListTemplate<AxisLabel> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => AxisLabel._new(this._root, {
			themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), this.get("themeTags", []))
		}, [this.labels.template])
	));


	declare public _settings: IAxisRendererSettings;
	declare public _privateSettings: IAxisRendererPrivate;

	/**
	 * The axis this renderer draws.
	 */
	public axis!: Axis<this>;

	/**
	 * Returns the length of the axis in pixels.
	 */
	public axisLength(): number {
		return 0;
	}

	/**
	 * @ignore
	 */
	public gridCount(): number {
		return this.axisLength() / this.gridDistance();
	}

	/**
	 * How many grid steps fit the axis with `autoLabels` for labels `extent` pixels long.
	 *
	 * @ignore
	 */
	public _gridCountAt(extent: number): number {
		const length = this.axisLength();
		return length / Math.max(Math.min(this.get("minGridDistance", 50), length / 8), extent, 1);
	}

	/**
	 * The distance between grid lines the axis works with: `minGridDistance`,
	 * adapted to the axis length and label size if `autoLabels` is on.
	 *
	 * @ignore
	 */
	public gridDistance(): number {
		const minGridDistance = this.get("minGridDistance", 50);
		if (this.get("autoLabels")) {
			const axis: any = this.axis;
			if (this._labelExtent > 0 && axis && axis.isType("CategoryAxis")) {
				// every category label that fits, even closer than minGridDistance
				return Math.max(this._labelExtent, 1);
			}
			// a short axis aims for about eight intervals, which a date or value axis rounds to a
			// step it can show, labels no closer than their size
			const distance = Math.max(Math.min(minGridDistance, this.axisLength() / 8), this._labelExtent);
			return Math.max(distance, 1);
		}
		return minGridDistance;
	}

	// The largest label size along the axis, measured once a frame is drawn
	protected _measureLabels(axis: Axis<AxisRenderer>) {
		const category = axis.isType("CategoryAxis");
		let most = 0;
		// minor labels sit between the axis' own and don't space it, unless the renderer itself is tagged "minor"
		// (a Gantt's row of days), when every label has the tag
		const minorRow = $array.indexOf(this.get("themeTags", []), "minor") != -1;
		this.labels.each((label) => {
			const tags = label.get("themeTags");
			if (!this._labelDrawn(label, axis) || (!minorRow && tags && tags.indexOf("minor") != -1)) {
				return;
			}
			const html = label.get("html", "") !== "";
			const radial: any = label;
			const arc: { length: number, height: number } | undefined = radial._arcSize && radial.get("textType") == "circular" ? radial._arcSize() : undefined;
			let size: number;
			let h: number;
			let stacked: boolean;
			if (arc) {
				size = this._arcExtent(label, arc);
				h = arc.height;
				stacked = category && size <= h + 0.5;
			}
			else {
				// as drawn: `width()` stops at maxWidth, which a word that can't wrap runs past
				const drawn = label.text._display.getAdjustedBounds(label.text._drawnBounds());
				const w = html ? label.width() : drawn.right - drawn.left;
				h = html ? label.height() : drawn.bottom - drawn.top;
				const turn = this._labelTurn(label) * Math.PI / 180;
				const cos = Math.abs(Math.cos(turn));
				const sin = Math.abs(Math.sin(turn));
				// the label's box along the axis, or for slanted labels the spacing parallel lines need
				const box = w * cos + h * sin;
				size = sin > 0.01 ? Math.min(box, h / sin) : box;
				stacked = category && sin > 0.01 && h / sin <= box + 0.5;
			}
			if (stacked && !html) {
				// category labels stacked like lines of text: as close as lines set solid
				const lineHeight: any = label.text.get("lineHeight");
				size /= Math.max(1, lineHeight instanceof Percent ? lineHeight.value : typeof lineHeight == "number" ? lineHeight : 1.2);
			}
			// others a gap of half a line, unless the author sized the label to its cell
			const fitted = label.get("maxWidth") != null && label.get("oversizedBehavior", "none") != "none";
			most = Math.max(most, size + (fitted || stacked ? 0 : Math.max(4, h / 2)));
		});

		const before = this.gridDistance();
		const length = Math.round(this.axisLength());
		most = Math.min(most, Math.max(length, 1));
		// inputs only: the range before the grid rounds it, and no zoom a synced axis gets from its grid
		const value: any = axis;
		const synced = axis.get("syncWithAxis" as any) != null;
		const key = [length, synced || Math.round(axis.get("start", 0) * 1e4), synced || Math.round(axis.get("end", 1) * 1e4), value._minReal, value._maxReal].join("|");
		if (key !== this._labelExtentKey) {
			// a new length, zoom or range: follow what is drawn for two frames, as label sizes update a frame late
			this._labelExtentKey = key;
			this._labelExtentFree = 2;
		}
		const free = this._labelExtentFree > 0;
		if (free) {
			this._labelExtentFree--;
			// with every label hidden there is nothing to follow
			if (most > 0) {
				this._labelExtent = most;
			}
		}
		else if (most > this._labelExtent) {
			// only grows otherwise, so the grid can't flip back and forth
			this._labelExtent = most;
		}

		// a date axis keeps each grid interval's own label size: judged by the labels drawn now, a
		// longer interval with shorter labels would make room for the shorter one and back, every frame
		const interval = value.getPrivate("gridInterval");
		if (interval && most > 0) {
			const intervalKey = interval.timeUnit + interval.count;
			if (free || !(this._intervalExtents[intervalKey] >= most)) {
				this._intervalExtents[intervalKey] = most;
			}
		}

		if (Math.abs(this.gridDistance() - before) > 0.5) {
			axis.markDirtySize();
		}
	}

	// How far a label's text turns from the axis' direction where it is, in degrees
	public _labelTurn(label: AxisLabel): number {
		const rotation = label.get("rotation", 0);
		return this.getPrivate("letter") == "Y" ? rotation - 90 : rotation;
	}

	// A curved label's size along the axis
	public _arcExtent(_label: AxisLabel, size: { length: number, height: number }): number {
		return size.length;
	}

	// A label's text box: a curved label's arc, or the label's own box for radial and HTML labels
	public _labelBox(label: AxisLabel): IBounds {
		const radial: any = label;
		const box: IBounds | undefined = radial._arcGlobalBounds ? radial._arcGlobalBounds() : undefined;
		if (box) {
			return box;
		}
		const text = label.text._drawnGlobalBounds();
		return text.right - text.left > 0 ? text : label.globalBounds();
	}

	// A label that is drawn and the axis' own, not an axis range's or the ghost label
	public _labelDrawn(label: AxisLabel, axis: Axis<AxisRenderer>): boolean {
		const dataItem = label.dataItem as DataItem<IAxisDataItem> | undefined;
		return label !== axis.ghostLabel && !label.isDisposed() && label.isVisible() && !label.isHidden() && !(dataItem && dataItem.get("isRange")) && (label.get("html", "") !== "" || !!label.text.get("text"));
	}

	// Where two axes' labels meet: a value axis gives way to a category or date
	// axis; between two of a kind, the vertical one gives way
	protected _givesWayTo(other: AxisRenderer): boolean {
		if (!other.get("autoLabels")) {
			return true;
		}
		const kind = (renderer: AxisRenderer) => {
			const axis: any = renderer.axis;
			return axis.isType("CategoryAxis") || axis.isType("DateAxis") ? 1 : 0;
		};
		const mine = kind(this);
		const theirs = kind(other);
		if (mine != theirs) {
			return mine < theirs;
		}
		const vertical = this.getPrivate("letter") == "Y";
		if (vertical != (other.getPrivate("letter") == "Y")) {
			return vertical;
		}
		return this.uid > other.uid;
	}

	// Hides labels cut off at the edge of the drawing area or overlapping labels
	// of an axis this one gives way to; a hidden one comes back once its box would fit
	protected _fitLabels(axis: Axis<AxisRenderer>, fit: LabelFit) {
		const chart = this.chart;
		// while the chart is hidden nothing is drawn, and the labels' places on the page are out of date
		if (!chart || !axis.labelsContainer.isVisibleDeep()) {
			return;
		}

		// the root's area is what cuts labels off; the chart's own box does not
		const area = this._root.container.globalBounds();
		const others: Array<IBounds> = [];
		$array.each(chart.xAxes.values.concat(chart.yAxes.values), (other) => {
			const renderer = other.get("renderer");
			if (other !== axis && !other.isDisposed() && other.isVisibleDeep() && !other.isHidden() && renderer && this._givesWayTo(renderer)) {
				renderer.labels.each((label) => {
					if (renderer._labelDrawn(label, other)) {
						others.push(renderer._labelBox(label));
					}
				});
			}
		});
		const fits = (box: IBounds) => inside(box, area) && !$array.any(others, (other) => overlap(box, other));

		let changed = false;
		this.labels.each((label) => {
			if (!label.isDisposed() && label !== axis.ghostLabel) {
				const result = fit.check(label, !fit.out[label.uid] && this._labelDrawn(label, axis) ? this._labelBox(label) : undefined, fits, true);
				if (result > 0) {
					label.setPrivate("visible", false);
				}
				if (result) {
					changed = true;
				}
			}
		});
		const pending = fit.end();
		if (changed) {
			axis.markDirtySize();
		}
		else if (pending) {
			// one more frame to check again
			this.markDirty();
		}
	}

	public _updatePositions() {

	}

	/**
	 * @ignore
	 */
	public abstract updateLabel(_label?: AxisLabel, _position?: number, _endPosition?: number, _count?: number): void;

	/**
	 * @ignore
	 */
	public abstract updateGrid(_grid?: Grid, _position?: number, _endPosition?: number): void;

	/**
	 * @ignore
	 */
	public abstract updateTick(_grid?: AxisTick, _position?: number, _endPosition?: number, _count?: number): void;

	/**
	 * @ignore
	 */
	public abstract updateFill(_fill?: Graphics, _position?: number, _endPosition?: number): void;

	/**
	 * @ignore
	 */
	public abstract updateBullet(_bullet?: AxisBullet, _position?: number, _endPosition?: number): void;

	/**
	 * @ignore
	 */
	public abstract positionToPoint(_position: number): IPoint;


	/**
	 * The area over the labels that the user drags to zoom the axis when `pan`
	 * is `"zoom"`. It shows on hover.
	 */
	public readonly thumb?: Graphics;

	protected _afterNew() {
		super._afterNew();
		this._setC("isMeasured", false);

		const thumb = this.thumb;
		if (thumb) {
			this._disposers.push(thumb.events.on("pointerdown", (event) => {
				this._handleThumbDown(event);
			}));

			this._disposers.push(thumb.events.on("globalpointerup", (event) => {
				this._handleThumbUp(event);
			}));

			this._disposers.push(thumb.events.on("globalpointermove", (event) => {
				this._handleThumbMove(event);
			}));
		}
	}

	public _beforeChanged() {
		super._beforeChanged();
		if (this.isDirty("minGridDistance") || this.isDirty("autoLabels")) {
			this.root.events.once("frameended", () => {
				if (this.axis && !this.isDisposed()) {
					this.axis.markDirtySize();
				}
			})
		}

		if (this.isDirty("autoLabels")) {
			if (!this.get("autoLabels")) {
				this._labelExtent = 0;
				this._labelExtentKey = undefined;
				this._intervalExtents = {};
				if (this._labelFit) {
					this._labelFit.out = {};
				}
			}
			else if (!this._labelFit) {
				const fit = this._labelFit = new LabelFit();
				let data: IDisposer | undefined;
				this._disposers.push(this.root.events.on("frameended", () => {
					const axis = this.axis;
					if (axis && !axis.isDisposed() && this.get("autoLabels")) {
						if (!data) {
							// new data starts over
							data = axis.events.on("datavalidated", () => {
								this._labelExtentKey = undefined;
							});
							this._disposers.push(data);
						}
						this._measureLabels(axis);
						this._fitLabels(axis, fit);
					}
				}));
			}
		}
	}


	public _changed() {
		super._changed();

		if (this.isDirty("pan")) {
			const thumb = this.thumb;
			if (thumb) {
				const labelsContainer = this.axis.labelsContainer;
				const pan = this.get("pan");
				if (pan == "zoom") {
					labelsContainer.children.push(thumb);
				}
				else if (pan == "none") {
					labelsContainer.children.removeValue(thumb);
				}
			}
		}
	}

	protected _handleThumbDown(event: ISpritePointerEvent) {
		this._thumbDownPoint = this.toLocal(event.point);
		const axis = this.axis;
		this._downStart = axis.get("start");
		this._downEnd = axis.get("end");
	}

	protected _handleThumbUp(_event: ISpritePointerEvent) {
		this._thumbDownPoint = undefined;
	}

	protected _handleThumbMove(event: ISpritePointerEvent) {
		const downPoint = this._thumbDownPoint;
		if (downPoint) {
			const point = this.toLocal(event.point);

			const downStart = this._downStart!;
			const downEnd = this._downEnd!;
			const extra = this._getPan(point, downPoint) * Math.min(1, (downEnd - downStart)) / 2 * this.get("panSensitivity", 1);
			this.axis.zoom(downStart - extra, downEnd + extra, 0);
		}
	}

	protected _getPan(_point1: IPoint, _point2: IPoint): number {
		return 0;
	}

	/**
	 * Converts a position on the axis (`0` to `1`) to a pixel coordinate along
	 * it, taking zoom into account. On an X axis, it is measured from the left
	 * edge.
	 *
	 * @param position  Position (0-1)
	 * @return Coordinate (px)
	 */
	public positionToCoordinate(position: number): number {
		if (this._inversed) {
			return (this._end - position) * this._axisLength;
		}
		else {
			return (position - this._start) * this._axisLength;
		}
	}

	/**
	 * @ignore
	 */
	public abstract positionTooltip(_tooltip: Tooltip, _position: number): void;

	/**
	 * @ignore
	 */
	public updateTooltipBounds(_tooltip: Tooltip) { }

	public _updateSize() {
		this.markDirty()
		this._clear = true;
	}

	/**
	 * @ignore
	 */
	public toAxisPosition(position: number): number {
		const start = this._start || 0;
		const end = this._end || 1;

		position = position * (end - start);
		if (!this.get("inversed")) {
			position = start + position;
		}
		else {
			position = end - position;
		}

		return position;
	}

	/**
	 * @ignore
	 */
	public toGlobalPosition(position: number): number {
		const start = this._start || 0;
		const end = this._end || 1;

		if (!this.get("inversed")) {
			position = position - start;
		}
		else {
			position = end - position;
		}

		position = position / (end - start);

		return position;
	}

	/**
	 * @ignore
	 */
	public fixPosition(position: number) {
		if (this.get("inversed")) {
			return 1 - position;
		}
		return position;
	}

	/**
	 * @ignore
	 */
	public _updateLC() {

	}

	protected toggleVisibility(sprite: Sprite, position: number, minPosition: number, maxPosition: number): void {
		let axis = this.axis;

		const start = axis.get("start", 0);
		const end = axis.get("end", 1);

		let updatedStart = start + (end - start) * (minPosition - 0.0001);
		let updatedEnd = start + (end - start) * (maxPosition + 0.0001);

		if (position < updatedStart || position > updatedEnd || (this._labelFit && this._labelFit.out[sprite.uid])) {
			sprite.setPrivate("visible", false);
		}
		else {
			sprite.setPrivate("visible", true);
		}
	}

	protected _keepAgain = () => {
		const axis = this.axis;
		if (axis && !axis.isDisposed()) {
			axis.markDirtySize();
		}
	};

	protected _keepWatched: { [uid: number]: boolean } = {};

	/**
	 * `keepInView`: where a label's cell (`start` to `end`) is only partly in
	 * view, the position along the axis that keeps the label inside the part
	 * in view, or `undefined` when it doesn't fit there. `null` leaves the
	 * label where `position` puts it.
	 *
	 * @ignore
	 */
	protected _keepInView(label: AxisLabel, position: number, start: number, end: number, location: number): number | null | undefined {
		if (label._keepInView) {
			label._keepInView = undefined;
		}
		if (!label.get("keepInView") || location <= 0 || location >= 1 || label.get("rotation", 0) != 0) {
			return null;
		}

		let a = this.positionToCoordinate(start);
		let b = this.positionToCoordinate(end);
		if (a > b) {
			[a, b] = [b, a];
		}
		const length = this.axisLength();
		if ((a > -0.5 && b < length + 0.5) || b <= 0 || a >= length) {
			return null;
		}

		// placed by its text, which is measured while the label is hidden too; when that changes size, placed again
		const text = label.text;
		if (!this._keepWatched[label.uid]) {
			this._keepWatched[label.uid] = true;
			label.addDisposer(text.events.on("boundschanged", () => {
				if (label._keepInView) {
					label._keepInView();
				}
			}));
		}
		label._keepInView = this._keepAgain;
		const vertical = this.getPrivate("letter") == "Y";
		let size = label.get(vertical ? "height" : "width") as number | undefined;
		if (!$type.isNumber(size)) {
			size = vertical ? text.height() + label.get("paddingTop", 0) + label.get("paddingBottom", 0) : text.width() + label.get("paddingLeft", 0) + label.get("paddingRight", 0);
		}
		if (!(size > 0)) {
			return null;
		}
		const center = label.get(vertical ? "centerY" : "centerX");
		const before = center instanceof Percent ? size * center.value : $type.isNumber(center) ? center : 0;

		a = Math.max(a, 0);
		b = Math.min(b, length);
		if (b - a < size) {
			return undefined;
		}
		const coordinate = this.positionToCoordinate(position);
		const kept = Math.min(Math.max(coordinate, a + before), b - size + before);
		if (kept == coordinate) {
			return position;
		}
		const startCoordinate = this.positionToCoordinate(start);
		return start + (kept - startCoordinate) / (this.positionToCoordinate(end) - startCoordinate) * (end - start);
	}

	protected _positionTooltip(tooltip: Tooltip, point: IPoint) {
		const chart = this.chart;
		if (chart) {
			tooltip.set("pointTo", this._display.toGlobal(point));
			if (!chart.inPlot(point)) {
				tooltip.hide();
			}
		}
	}

	public processAxis() { }
}
