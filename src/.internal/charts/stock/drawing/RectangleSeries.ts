import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";

import { DrawingSeries, IDrawingSeriesSettings, IDrawingSeriesPrivate, IDrawingSeriesDataItem } from "./DrawingSeries";

export interface IRectangleSeriesDataItem extends IDrawingSeriesDataItem {
}

export interface IRectangleSeriesSettings extends IDrawingSeriesSettings {
}

export interface IRectangleSeriesPrivate extends IDrawingSeriesPrivate {
}

export class RectangleSeries extends DrawingSeries {
	public static className: string = "RectangleSeries";
	public static classNames: Array<string> = DrawingSeries.classNames.concat([RectangleSeries.className]);

	declare public _settings: IRectangleSeriesSettings;
	declare public _privateSettings: IRectangleSeriesPrivate;
	declare public _dataItemSettings: IRectangleSeriesDataItem;

	protected _index: number = 0;

	protected _di: Array<{ [index: string]: DataItem<IRectangleSeriesDataItem> }> = []

	protected _tag = "rectangle";

	protected _handleBulletDragged(event: ISpritePointerEvent) {
		super._handleBulletDragged(event);

		const dataItem = event.target.dataItem as DataItem<IRectangleSeriesDataItem>;
		const movePoint = this._movePointerPoint;
		if (dataItem && movePoint) {
			const dataContext = dataItem.dataContext as any;
			const index = dataContext.index;
			const corner = dataContext.corner;

			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const valueX = xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)));

			const vx = "valueX"
			const vy = "valueY"
			const vwy = "valueYWorking";

			dataItem.set(vx, valueX);
			dataItem.set(vy, valueY);
			dataItem.set(vwy, valueY);

			this._setXLocation(dataItem, valueX);

			this._positionBullets(dataItem);

			const items = this._di[index];
			const blDI = items["bl"];
			const brDI = items["br"];
			const tlDI = items["tl"];
			const trDI = items["tr"];
			const tlDI2 = items["tl2"];

			if (blDI && brDI && tlDI && trDI && tlDI2) {
				if (corner == "br") {
					blDI.set(vy, valueY);
					blDI.set(vwy, valueY);

					trDI.set(vx, valueX);
					this._setXLocation(trDI, valueX);
				}

				if (corner == "tr") {
					brDI.set(vx, valueX);
					this._setXLocation(brDI, valueX);

					tlDI.set(vy, valueY);
					tlDI.set(vwy, valueY);

					tlDI2.set("valueY", valueY);
					tlDI2.set(vwy, valueY);
				}

				if (corner == "bl") {
					brDI.set(vy, valueY);
					brDI.set(vwy, valueY);

					tlDI.set(vx, valueX);
					tlDI2.set(vx, valueX);

					this._setXLocation(tlDI, valueX);
					this._setXLocation(tlDI2, valueX);
				}

				if (corner == "tl2") {
					blDI.set(vx, valueX);
					this._setXLocation(blDI, valueX);

					trDI.set(vy, valueY);
					trDI.set(vwy, valueY);

					tlDI.set(vx, valueX);
					this._setXLocation(tlDI, valueX);

					tlDI.set(vy, valueY);
					tlDI.set(vwy, valueY);
				}
			}
		}
	}

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			super._handlePointerClick(event);

			if (!this._isDragging) {

				if (!this._isDrawing) {
					this._isDrawing = true;
					this.bulletsContainer.show();
					this._addPoints(event, this._index);
				}
				else {
					this._isDrawing = false;
					this._index++;
				}
			}
		}
	}

	protected _handlePointerMove(event: ISpritePointerEvent) {
		super._handlePointerMove(event);
		if (this._isDrawing) {
			const movePoint = this._movePointerPoint;

			if (movePoint) {

				const xAxis = this.get("xAxis");
				const yAxis = this.get("yAxis");

				const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x)));
				const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)));

				const index = this._index;
				const diTR = this._di[index]["tr"];
				const diBR = this._di[index]["br"];
				const diBL = this._di[index]["bl"];

				if (diTR && diBR && diBL) {
					diTR.set("valueX", valueX);
					diBR.set("valueX", valueX);

					this._setXLocation(diTR, valueX);
					this._setXLocation(diBR, valueX);

					diBR.set("valueY", valueY);
					diBR.set("valueYWorking", valueY);

					diBL.set("valueY", valueY);
					diBL.set("valueYWorking", valueY);
				}
			}
		}
	}

	protected _addPoints(event: ISpritePointerEvent, index: number) {
		const chart = this.chart;
		if (chart) {
			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const point = chart.plotContainer.toLocal(event.point);
			const valueX = xAxis.positionToValue(xAxis.coordinateToPosition(point.x));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)));

			this._di[index] = {};
			this.data.push({ stroke: this._getStrokeTemplate() })
			this._addContextInfo(index, "empty");

			this._addPoint(valueX, valueY, "tl", index);
			this._addPoint(valueX, valueY, "tr", index);
			this._addPoint(valueX, valueY, "br", index);
			this._addPoint(valueX, valueY, "bl", index);
			this._addPoint(valueX, valueY, "tl2", index);
		}
	}

	protected _addPoint(valueX: number | null, valueY: number | null, corner: string, index: number): any {

		this.data.push({ valueY: valueY, valueX: valueX });
		const len = this.dataItems.length;
		const dataItem = this.dataItems[len - 1];
		if (dataItem) {
			if (valueX != null) {
				this._setXLocation(dataItem, valueX);
			}

			this._addContextInfo(index, corner);

			this._di[index][corner] = dataItem;

			this.setPrivate("startIndex", 0);
			this.setPrivate("endIndex", len);

			return dataItem.dataContext;
		}
	}
}