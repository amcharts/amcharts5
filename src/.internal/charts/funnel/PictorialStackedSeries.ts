import type { IBounds } from "../../core/util/IBounds";

import { PyramidSeries, IPyramidSeriesSettings, IPyramidSeriesDataItem, IPyramidSeriesPrivate } from "./PyramidSeries";
import { Graphics } from "../../core/render/Graphics";
import { p100, p50 } from "../../core/util/Percent"


export interface IPictorialStackedSeriesDataItem extends IPyramidSeriesDataItem {

}

export interface IPictorialStackedSeriesSettings extends IPyramidSeriesSettings {

	/**
	 * An SVG path that will define the shape of the pictorial series.
	 *
	 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/sliced-chart/pictorial-stacked-series/#shape-of-the-series} for more info
	 */
	svgPath?: string;

}

export interface IPictorialStackedSeriesPrivate extends IPyramidSeriesPrivate {
}

/**
 * A series for a [[SlicedChart]] that fills a shape (`svgPath`) with stacked
 * slices, each as tall as its share of the total. It sets `valueIs` to
 * `"height"` and `topWidth` and `bottomWidth` to `100%`.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/sliced-chart/pictorial-stacked-series/} for more info
 * @important
 */
export class PictorialStackedSeries extends PyramidSeries {
	protected _tag = "pictorial";

	public static className: string = "PictorialStackedSeries";
	public static classNames: Array<string> = PyramidSeries.classNames.concat([PictorialStackedSeries.className]);

	declare public _settings: IPictorialStackedSeriesSettings;
	declare public _privateSettings: IPictorialStackedSeriesPrivate;
	declare public _dataItemSettings: IPictorialStackedSeriesDataItem;

	/**
	 * The shape that masks the slices, drawn from `svgPath`. To change it, set
	 * `svgPath` on the series.
	 */
	public readonly seriesMask: Graphics = Graphics.new(this._root, { position: "absolute", x: p50, y: p50, centerX: p50, centerY: p50 });

	/**
	 * The `svgPath` shape drawn behind the slices, as a faint background.
	 */
	public readonly seriesGraphics: Graphics = this.slicesContainer.children.push(Graphics.new(this._root, { themeTags: ["pictorial", "background"], position: "absolute", x: p50, y: p50, centerX: p50, centerY: p50 })._markC("themeTags", "position", "x", "y", "centerX", "centerY"));

	protected _afterNew() {
		super._afterNew();
		this._setC("topWidth", p100);
		this._setC("bottomWidth", p100);
		this._setC("valueIs", "height");
		this.slicesContainer._setC("mask", this.seriesMask);
	}

	protected _updateScale() {
		let slicesContainer = this.slicesContainer;

		let w = slicesContainer.innerWidth();
		let h = slicesContainer.innerHeight();

		let seriesMask = this.seriesMask;
		let seriesGraphics = this.seriesGraphics;
		let scale = seriesMask.get("scale", 1);

		const bounds = seriesMask.localBounds();

		let mw = bounds.right - bounds.left;
		let mh = bounds.bottom - bounds.top;
		// the whole shape fits
		scale = Math.min(w / mw, h / mh);
		if (scale != Infinity && !Number.isNaN(scale)) {
			if (scale != seriesMask.get("scale")) {
				// the slices are laid out in the shape's box
				this.markDirtySize();
			}
			seriesMask.set("scale", scale);
			seriesMask.set("x", w / 2);
			seriesMask.set("y", h / 2);

			seriesGraphics._setC("scale", scale);
			seriesGraphics._setC("x", w / 2);
			seriesGraphics._setC("y", h / 2);
		}
	}

	/**
	 * The shape's box, centered in the slices container: the slices fill it, so
	 * a tick starts on the shape.
	 *
	 * @ignore
	 */
	public _sliceBox(): IBounds {
		const box = super._sliceBox();
		const bounds = this.seriesMask.localBounds();
		const scale = this.seriesMask.get("scale", 1);
		const w = (bounds.right - bounds.left) * scale;
		const h = (bounds.bottom - bounds.top) * scale;
		if (!(w > 0 && h > 0)) {
			return box;
		}
		const x = (box.left + box.right) / 2;
		const y = (box.top + box.bottom) / 2;
		return { left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 };
	}

	public _prepareChildren() {
		super._prepareChildren();
		if (this.isDirty("svgPath")) {
			const svgPath = this.get("svgPath");
			this.seriesMask.set("svgPath", svgPath);
			this.seriesGraphics._setC("svgPath", svgPath);
		}

		this._updateScale();
	}

}
