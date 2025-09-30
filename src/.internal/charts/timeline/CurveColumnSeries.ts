import type { DataItem } from "../../core/render/Component";
import type { IPoint } from "../../core/util/IPoint";
import type { AxisRendererCurveX } from "./AxisRendererCurveX";
import type { Bullet } from "../../core/render/Bullet";
import type { CurveChart } from "./CurveChart";

import { BaseColumnSeries, IBaseColumnSeriesPrivate, IBaseColumnSeriesSettings, IBaseColumnSeriesDataItem, IBaseColumnSeriesAxisRange } from "../xy/series/BaseColumnSeries";
import { Graphics } from "../../core/render/Graphics";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { Polygon } from "../../core/render/Polygon";

import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";


export interface ICurveColumnSeriesDataItem extends IBaseColumnSeriesDataItem {
}

export interface ICurveColumnSeriesSettings extends IBaseColumnSeriesSettings {
}

export interface ICurveColumnSeriesPrivate extends IBaseColumnSeriesPrivate {
}

export interface ICurveColumnSeriesAxisRange extends IBaseColumnSeriesAxisRange {

	/**
	 * List of columns in a range.
	 */
	columns: ListTemplate<Polygon>

}

/**
 * A column series for use in a [[CurveChart]], [[SerpetineChart]], or
 * a [[SpiralChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/timeline/} for more info
 * @since 5.12.0
 * @important
 */
export class CurveColumnSeries extends BaseColumnSeries {

	declare public _settings: ICurveColumnSeriesSettings;
	declare public _privateSettings: ICurveColumnSeriesPrivate;
	declare public _dataItemSettings: ICurveColumnSeriesDataItem;
	declare public _axisRangeType: ICurveColumnSeriesAxisRange;

	/**
	 * @ignore
	 */
	public makeColumn(dataItem: DataItem<this["_dataItemSettings"]>, listTemplate: ListTemplate<Polygon>): Polygon {
		const column = this.mainContainer.children.push(listTemplate.make());
		column._setDataItem(dataItem);
		listTemplate.push(column);
		return column;
	}

	/**
	 * A [[TemplateList]] of all columns in series.
	 *
	 * `columns.template` can be used to set default settings for all columns,
	 * or to change on existing ones.
	 *
	 * @default new ListTemplate<Polygon>
	 */
	public readonly columns: ListTemplate<Polygon> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Polygon._new(this._root, {
			position: "absolute",
			themeTags: $utils.mergeTags(this.columns.template.get("themeTags", []), ["curve", "series", "column"])
		}, [this.columns.template])
	));

	public static className: string = "CurveColumnSeries";
	public static classNames: Array<string> = BaseColumnSeries.classNames.concat([CurveColumnSeries.className]);

	/**
	 * A chart series belongs to.
	 */
	declare public chart: CurveChart | undefined;

	protected _afterNew() {
		super._afterNew();
		this.set("maskContent", false);
		this.bulletsContainer.set("maskContent", false);
		this.bulletsContainer.set("mask", Graphics.new(this._root, {}));
	}

	/**
	 * @ignore
	 */
	public getPoint(positionX: number, positionY: number): IPoint {
		const xAxis = this.get("xAxis");
		const rendererX = xAxis.get("renderer") as AxisRendererCurveX;
		return rendererX.positionToPoint(positionX, positionY);
	}

	protected _updateSeriesGraphics(dataItem: DataItem<this["_dataItemSettings"]>, graphics: Graphics, l: number, r: number, t: number, b: number) {

		graphics.setPrivate("visible", true);

		dataItem.setRaw("left", l);
		dataItem.setRaw("right", r);
		dataItem.setRaw("top", t);
		dataItem.setRaw("bottom", b);

		const xAxis = this.get("xAxis");
		const rendererX = xAxis.get("renderer") as AxisRendererCurveX;

		const yAxis = this.get("yAxis");
		const start = yAxis.get("start", 0);
		const end = yAxis.get("end", 1);

		t = $math.fitToRange(t, start, end);
		b = $math.fitToRange(b, start, end);

		const points = rendererX.getPoints(l, t, r, b);

		const polygon = graphics as Polygon;

		polygon.set("points", points);
	}

	protected _shouldInclude(position: number): boolean {
		const xAxis = this.get("xAxis");
		if (position < xAxis.get("start", 0) || position > xAxis.get("end", 1)) {
			return false;
		}
		return true;
	}

	protected _shouldShowBullet(positionX: number, _positionY: number): boolean {
		const xAxis = this.get("xAxis");
		if (positionX < xAxis.get("start", 0) || positionX > xAxis.get("end", 1)) {
			return false;
		}
		return this._showBullets;
	}

	public _positionBullet(bullet: Bullet) {

		let sprite = bullet.get("sprite");
		if (sprite) {
			const dataItem = sprite.dataItem as any;

			const diLocationX = dataItem.get("locationX", 0.5);
			const diLocationY = dataItem.get("locationY", 0.5);

			const locationX = bullet.get("locationX", diLocationX);
			const locationY = bullet.get("locationY", diLocationY);

			const series = dataItem.component;

			const xAxis = series.get("xAxis");
			const yAxis = series.get("yAxis");

			let positionX = 0;
			let vcx = series.get("vcx", 1);
			let vcy = series.get("vcy", 1);

			if (this.get("openValueXField")) {
				const p0 = xAxis.getDataItemPositionX(dataItem, series._xOpenField, diLocationX, vcx);
				const p1 = xAxis.getDataItemPositionX(dataItem, series._xField, diLocationX, vcx);
				positionX = p0 + (p1 - p0) * locationX;
			}
			else {
				positionX = xAxis.getDataItemPositionX(dataItem, series._xField, locationX, vcx);
			}
			let positionY = 0;
			if (this.get("openValueYField")) {
				const p0 = yAxis.getDataItemPositionY(dataItem, series._yOpenField, diLocationY, vcy);
				const p1 = yAxis.getDataItemPositionY(dataItem, series._yField, diLocationY, vcy);
				positionY = p0 + (p1 - p0) * locationY;
			}
			else {
				positionY = yAxis.getDataItemPositionY(dataItem, series._yField, locationY, vcy);
			}

			if (series._shouldShowBullet(positionX, positionY)) {
				sprite.setPrivate("visible", true);

				const point = series.getPoint(positionX, positionY);

				sprite.setAll({
					x: point.x,
					y: point.y
				})
			}
			else {
				sprite.setPrivate("visible", false);
			}
		}
	}

	protected _handleMaskBullets() {

	}

	public _updateChildren(): void {
		super._updateChildren();
		if (!this.get("maskBullets")) {
			this.bulletsContainer.remove("mask");
		}
	}

	protected _processAxisRange(axisRange: this["_axisRangeType"]) {
		super._processAxisRange(axisRange);
		axisRange.columns = new ListTemplate(
			Template.new({}),
			() => Polygon._new(this._root, {
				position: "absolute",
				themeTags: $utils.mergeTags(axisRange.columns.template.get("themeTags", []), ["curves", "series", "column"]),
			}, [this.columns.template, axisRange.columns.template])
		);
	}
}
