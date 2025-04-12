import type { IPoint } from "../../core/util/IPoint";
import type { AxisRendererCurveX } from "./AxisRendererCurveX";
import type { Bullet } from "../../core/render/Bullet";
import type { CurveChart } from "./CurveChart";

import { Graphics } from "../../core/render/Graphics";
import { LineSeries, ILineSeriesPrivate, ILineSeriesSettings, ILineSeriesDataItem, ILineSeriesAxisRange } from "../xy/series/LineSeries";


export interface ICurveLineSeriesDataItem extends ILineSeriesDataItem {
}

export interface ICurveLineSeriesSettings extends ILineSeriesSettings {
}

export interface ICurveLineSeriesPrivate extends ILineSeriesPrivate {
}

export interface ICurveLineSeriesAxisRange extends ILineSeriesAxisRange {
}

/**
 * A line series for use in a [[CurveChart]], [[SerpetineChart]], or
 * a [[SpiralChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/timeline/} for more info
 * @since 5.12.0
 * @important
 */
export class CurveLineSeries extends LineSeries {

	declare public _settings: ICurveLineSeriesSettings;
	declare public _privateSettings: ICurveLineSeriesPrivate;
	declare public _dataItemSettings: ICurveLineSeriesDataItem;
	declare public _axisRangeType: ICurveLineSeriesAxisRange;

	/**
	 * A chart series belongs to.
	 */
	declare public chart: CurveChart | undefined;

	public static className: string = "CurveLineSeries";
	public static classNames: Array<string> = LineSeries.classNames.concat([CurveLineSeries.className]);

	protected _afterNew() {
		super._afterNew();
		this.set("maskContent", false);
		this.bulletsContainer.set("maskContent", false);
		this.bulletsContainer.set("mask", Graphics.new(this._root, {}));
	}

	protected _handleMaskBullets() {

	}

	public _updateChildren(): void {
		super._updateChildren();
		if (!this.get("maskBullets")) {
			this.bulletsContainer.remove("mask");
		}
	}

	public getPoint(positionX: number, positionY: number): IPoint {

		const xRenderer = this.get("xAxis").get("renderer") as AxisRendererCurveX;
		return xRenderer.positionToPoint(positionX, positionY);
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
}
