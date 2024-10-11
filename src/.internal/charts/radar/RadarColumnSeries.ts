import type { DataItem } from "../../core/render/Component";
import type { IPoint } from "../../core/util/IPoint";
import type { AxisRendererCircular } from "./AxisRendererCircular";
import type { AxisRendererRadial } from "./AxisRendererRadial";
import type { Bullet } from "../../core/render/Bullet";
import type { RadarChart } from "./RadarChart";

import { BaseColumnSeries, IBaseColumnSeriesPrivate, IBaseColumnSeriesSettings, IBaseColumnSeriesDataItem, IBaseColumnSeriesAxisRange } from "../xy/series/BaseColumnSeries";
import { Slice } from "../../core/render/Slice";
import { Graphics } from "../../core/render/Graphics";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";

import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";


export interface IRadarColumnSeriesDataItem extends IBaseColumnSeriesDataItem {

	/**
	 * Actual radius of the column in pixels.
	 */
	radius?: number;

	/**
	 * Actual inner radius of the column in pixels.
	 */
	innerRadius?: number;

	/**
	 * Actual start angle of the column in degrees.
	 */
	startAngle?: number;

	/**
	 * Actual end angle of the column in degrees.
	 */
	endAngle?: number;

}

export interface IRadarColumnSeriesSettings extends IBaseColumnSeriesSettings {
}

export interface IRadarColumnSeriesPrivate extends IBaseColumnSeriesPrivate {
}

export interface IRadarColumnSeriesAxisRange extends IBaseColumnSeriesAxisRange {

	/**
	 * List of columns in a range.
	 */
	columns: ListTemplate<Slice>

}

/**
 * A column series for use in a [[RadarChart]].
 *
 * @important
 */
export class RadarColumnSeries extends BaseColumnSeries {

	declare public _settings: IRadarColumnSeriesSettings;
	declare public _privateSettings: IRadarColumnSeriesPrivate;
	declare public _dataItemSettings: IRadarColumnSeriesDataItem;
	declare public _axisRangeType: IRadarColumnSeriesAxisRange;

	/**
	 * @ignore
	 */
	public makeColumn(dataItem: DataItem<this["_dataItemSettings"]>, listTemplate: ListTemplate<Slice>): Slice {
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
	 * @default new ListTemplate<Slice>
	 */
	public readonly columns: ListTemplate<Slice> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Slice._new(this._root, {
			position: "absolute",
			themeTags: $utils.mergeTags(this.columns.template.get("themeTags", []), ["radar", "series", "column"])
		}, [this.columns.template])
	));

	public static className: string = "RadarColumnSeries";
	public static classNames: Array<string> = BaseColumnSeries.classNames.concat([RadarColumnSeries.className]);

	/**
	 * A chart series belongs to.
	 */
	declare public chart: RadarChart | undefined;

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

		const yAxis = this.get("yAxis");
		const xAxis = this.get("xAxis");

		const rendererY = xAxis.get("renderer") as AxisRendererRadial;

		const radius = yAxis.get("renderer").positionToCoordinate(positionY) + rendererY.getPrivate("innerRadius", 0);

		const rendererX = xAxis.get("renderer") as AxisRendererCircular;
		const angle = rendererX.positionToAngle(positionX);

		return { x: radius * $math.cos(angle), y: radius * $math.sin(angle) };
	}

	protected _updateSeriesGraphics(dataItem: DataItem<this["_dataItemSettings"]>, graphics: Graphics, l: number, r: number, t: number, b: number) {

		graphics.setPrivate("visible", true);

		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");

		const rendererX = xAxis.get("renderer") as AxisRendererCircular;
		const rendererY = yAxis.get("renderer") as AxisRendererRadial;

		const axisInnerRadius = rendererY.getPrivate("innerRadius", 0);

		const startAngle = rendererX.fitAngle(rendererX.positionToAngle(l));
		const endAngle = rendererX.fitAngle(rendererX.positionToAngle(r));

		let innerRadius = rendererY.positionToCoordinate(b) + axisInnerRadius;
		let radius = rendererY.positionToCoordinate(t) + axisInnerRadius;

		const slice = graphics as Slice;

		dataItem.setRaw("startAngle", startAngle);
		dataItem.setRaw("endAngle", endAngle);
		dataItem.setRaw("innerRadius", innerRadius);
		dataItem.setRaw("radius", radius);

		let axisStartAngle = 0;
		let axisEndAngle = 360;

		if (yAxis == this.get("baseAxis")) {
			axisStartAngle = rendererY.getPrivate("startAngle", 0);
			axisEndAngle = rendererY.getPrivate("endAngle", 360);
		}
		else {
			axisStartAngle = rendererX.getPrivate("startAngle", 0);
			axisEndAngle = rendererX.getPrivate("endAngle", 360);
		}

		if (axisStartAngle > axisEndAngle) {
			[axisStartAngle, axisEndAngle] = [axisEndAngle, axisStartAngle];
		}

		if ((endAngle <= axisStartAngle) || (startAngle >= axisEndAngle) || (radius <= axisInnerRadius && innerRadius <= axisInnerRadius)) {
			slice.setPrivate("visible", false);
		}

		slice.setAll({ innerRadius, radius, startAngle, arc: endAngle - startAngle });
	}

	protected _shouldInclude(position: number): boolean {
		const xAxis = this.get("xAxis");
		if (position < xAxis.get("start") || position > xAxis.get("end")) {
			return false;
		}
		return true;
	}

	protected _shouldShowBullet(positionX: number, _positionY: number): boolean {
		const xAxis = this.get("xAxis");
		if (positionX < xAxis.get("start") || positionX > xAxis.get("end")) {
			return false;
		}
		return this._showBullets;
	}

	public _positionBullet(bullet: Bullet) {

		let sprite = bullet.get("sprite");
		if (sprite) {
			const dataItem = sprite.dataItem as any;

			const locationX = bullet.get("locationX", dataItem.get("locationX", 0.5));
			const locationY = bullet.get("locationY", dataItem.get("locationY", 0.5));

			const series = dataItem.component;

			const xAxis = series.get("xAxis");
			const yAxis = series.get("yAxis");

			const positionX = xAxis.getDataItemPositionX(dataItem, series._xField, locationX, series.get("vcx", 1));
			const positionY = yAxis.getDataItemPositionY(dataItem, series._yField, locationY, series.get("vcy", 1));

			const startAngle = dataItem.get("startAngle", 0);
			const endAngle = dataItem.get("endAngle", 0);

			const radius = dataItem.get("radius", 0);
			const innerRadius = dataItem.get("innerRadius", 0);

			if (series._shouldShowBullet(positionX, positionY)) {
				sprite.setPrivate("visible", true);

				const angle = startAngle + (endAngle - startAngle) * locationX;
				const r = innerRadius + (radius - innerRadius) * locationY;

				sprite.set("x", $math.cos(angle) * r);
				sprite.set("y", $math.sin(angle) * r);
			}
			else {
				sprite.setPrivate("visible", false);
			}
		}
	}

	protected _handleMaskBullets() {

	}

	protected _processAxisRange(axisRange: this["_axisRangeType"]) {
		super._processAxisRange(axisRange);
		axisRange.columns = new ListTemplate(
			Template.new({}),
			() => Slice._new(this._root, {
				position: "absolute",
				themeTags: $utils.mergeTags(axisRange.columns.template.get("themeTags", []), ["radar", "series", "column"]),
			}, [this.columns.template, axisRange.columns.template])
		);
	}
}
