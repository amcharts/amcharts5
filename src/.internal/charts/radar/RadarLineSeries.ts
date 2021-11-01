import { LineSeries, ILineSeriesPrivate, ILineSeriesSettings, ILineSeriesDataItem, ILineSeriesAxisRange } from "../xy/series/LineSeries";
import type { IPoint } from "../../core/util/IPoint";
import type { AxisRendererCircular } from "./AxisRendererCircular";
import type { AxisRendererRadial } from "./AxisRendererRadial";
import type { Bullet } from "../../core/render/Bullet";
import { Graphics } from "../../core/render/Graphics";
import type { RadarChart } from "./RadarChart";
import type { DataItem } from "../../core/render/Component";
import * as $math from "../../core/util/Math";

export interface IRadarLineSeriesDataItem extends ILineSeriesDataItem {
}

export interface IRadarLineSeriesSettings extends ILineSeriesSettings {

	/**
	 * If set to `true` (default), series will connect its last data point to the
	 * first one with a line, thus completing full circle.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/radar-series/#Connecting_ends} for more info
	 * @default @true
	 */
	connectEnds?: boolean;

}

export interface IRadarLineSeriesPrivate extends ILineSeriesPrivate {
}

export interface IRadarLineSeriesAxisRange extends ILineSeriesAxisRange {
}

/**
 * Draws a line series for use in a [[RadarChart]].
 *
 * @important
 */
export class RadarLineSeries extends LineSeries {

	declare public _settings: IRadarLineSeriesSettings;
	declare public _privateSettings: IRadarLineSeriesPrivate;
	declare public _dataItemSettings: IRadarLineSeriesDataItem;
	declare public _axisRangeType: IRadarLineSeriesAxisRange;

	/**
	 * A chart series belongs to.
	 */
	declare public chart: RadarChart | undefined;

	public static className: string = "RadarLineSeries";
	public static classNames: Array<string> = LineSeries.classNames.concat([RadarLineSeries.className]);

	protected _afterNew() {
		super._afterNew();
		this.set("maskContent", false);
		this.bulletsContainer.set("maskContent", false);
		this.bulletsContainer.set("mask", Graphics.new(this._root, {}));
	}

	protected _handleMaskBullets() {

	}

	public getPoint(positionX: number, positionY: number): IPoint {

		const yAxis = this.get("yAxis");
		const xAxis = this.get("xAxis");

		const rendererY = yAxis.get("renderer") as AxisRendererRadial;

		const radius = rendererY.positionToCoordinate(positionY) + rendererY.getPrivate("innerRadius", 0);

		const rendererX = xAxis.get("renderer") as AxisRendererCircular;
		const angle = rendererX.positionToAngle(positionX);

		return { x: radius * $math.cos(angle), y: radius * $math.sin(angle) };
	}

	protected _endLine(points: Array<Array<number>>, firstPoint: Array<number>) {
		if (this.get("connectEnds") && firstPoint) {
			points.push(firstPoint);
		}
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
			let dataItem = sprite.dataItem as DataItem<this["_dataItemSettings"]>;

			let locationX = bullet.get("locationX", dataItem.get("locationX", 0.5));
			let locationY = bullet.get("locationY", dataItem.get("locationY", 0.5));

			let xAxis = this.get("xAxis");
			let yAxis = this.get("yAxis");
			//let baseAxis = this.get("baseAxis");

			//if(xAxis == baseAxis){
			//locationY = 1;
			//}
			//else if(yAxis == baseAxis){
			//locationX = 1;
			//}

			const positionX = xAxis.getDataItemPositionX(dataItem, this._xField, locationX, this.get("vcx", 1));
			const positionY = yAxis.getDataItemPositionY(dataItem, this._yField, locationY, this.get("vcy", 1))

			let point = this.getPoint(positionX, positionY);

			if (this._shouldShowBullet(positionX, positionY)) {
				sprite.setPrivate("visible", true);

				sprite.set("x", point.x);
				sprite.set("y", point.y);
			}
			else {
				sprite.setPrivate("visible", false);
			}
		}
	}
}
