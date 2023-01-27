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

			const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x)));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)));

			const vx = "valueX"
			const vy = "valueY"

			this._setContext(dataItem, vx, valueX);
			this._setContext(dataItem, vy, valueY, true);

			this._setXLocation(dataItem, valueX);
			this._positionBullets(dataItem);

			const dataItems = this._di[index];
			if (dataItems) {
				const blDI = dataItems["bl"];
				const brDI = dataItems["br"];
				const tlDI = dataItems["tl"];
				const trDI = dataItems["tr"];
				const tlDI2 = dataItems["tl2"];

				if (blDI && brDI && tlDI && trDI && tlDI2) {
					if (corner == "br") {
						this._setContext(blDI, vy, valueY, true);
						this._setContext(trDI, vx, valueX);
						this._setXLocation(trDI, valueX);
					}

					if (corner == "tr") {
						this._setContext(brDI, vx, valueX);
						this._setXLocation(brDI, valueX);

						this._setContext(tlDI, vy, valueY, true);
						this._setContext(tlDI2, vy, valueY, true);
					}

					if (corner == "bl") {
						this._setContext(brDI, vy, valueY, true);

						this._setContext(tlDI, vx, valueX);
						this._setContext(tlDI2, vx, valueX);

						this._setXLocation(tlDI, valueX);
						this._setXLocation(tlDI2, valueX);
					}

					if (corner == "tl2") {
						this._setContext(blDI, vx, valueX);
						this._setXLocation(blDI, valueX);

						this._setContext(trDI, vy, valueY, true);

						this._setContext(tlDI, vx, valueX);
						this._setXLocation(tlDI, valueX);

						this._setContext(tlDI, vy, valueY, true);
					}
				}
			}
		}
	}


	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			super._handlePointerClick(event);

			if (!this._isDragging) {

				if (!this._isDrawing) {
					this._index++;
					this._isDrawing = true;
					this.bulletsContainer.show();
					this._addPoints(event, this._index);
				}
				else {
					this._isDrawing = false;
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

				const dataItems = this._di[index];
				if (dataItems) {
					const diTR = dataItems["tr"];
					const diBR = dataItems["br"];
					const diBL = dataItems["bl"];

					if (diTR && diBR && diBL) {
						this._setContext(diTR, "valueX", valueX);
						this._setContext(diBR, "valueX", valueX);

						this._setXLocation(diTR, valueX);
						this._setXLocation(diBR, valueX);

						this._setContext(diBR, "valueY", valueY, true);
						this._setContext(diBL, "valueY", valueY, true);
					}
				}
			}
		}
	}

	protected _addPoints(event: ISpritePointerEvent, index: number) {
		const chart = this.chart;
		if (chart) {

			this.data.push({ stroke: this._getStrokeTemplate(), fill: this._getFillTemplate(), index:index, corner:"e" });

			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const point = chart.plotContainer.toLocal(event.point);
			const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(point.x)));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)));

			this._di[index] = {};

			this._addPoint(valueX, valueY, "tl", index);
			this._addPoint(valueX, valueY, "tr", index);
			this._addPoint(valueX, valueY, "br", index);
			this._addPoint(valueX, valueY, "bl", index);
			this._addPoint(valueX, valueY, "tl2", index);
		}
	}

	protected _addPoint(valueX: number | null, valueY: number | null, corner: string, index: number): any {

		this.data.push({ valueY: valueY, valueX: valueX, corner:corner, index:index });
		const len = this.dataItems.length;
		const dataItem = this.dataItems[len - 1];
		if (dataItem) {
			if (valueX != null) {
				this._setXLocation(dataItem, valueX);
			}
			this.setPrivate("startIndex", 0);
			this.setPrivate("endIndex", len);

			return dataItem.dataContext;
		}
	}
}