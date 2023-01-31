import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import type { IPoint } from "../../../core/util/IPoint";

import { DrawingSeries, IDrawingSeriesSettings, IDrawingSeriesPrivate, IDrawingSeriesDataItem } from "./DrawingSeries";

import * as $array from "../../../core/util/Array";

export interface IPolylineSeriesDataItem extends IDrawingSeriesDataItem { }

export interface IPolylineSeriesSettings extends IDrawingSeriesSettings { }

export interface IPolylineSeriesPrivate extends IDrawingSeriesPrivate { }

export class PolylineSeries extends DrawingSeries {
	public static className: string = "PolylineSeries";
	public static classNames: Array<string> = DrawingSeries.classNames.concat([PolylineSeries.className]);

	declare public _settings: IPolylineSeriesSettings;
	declare public _privateSettings: IPolylineSeriesPrivate;
	declare public _dataItemSettings: IPolylineSeriesDataItem;

	// point index in segment
	protected _pIndex: number = 0;

	protected _tag = "polyline";

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			super._handlePointerClick(event);

			if (!this._isDragging) {
				this._isDrawing = true;
				// for consistency with other series
				if (this._index == 0) {
					this._index = 1;
				}

				if (this._pIndex == 0) {
					this.data.push({ stroke: this._getStrokeTemplate(), index: this._index, corner:"e" });
				}

				this._addPoint(event);
			}
		}
	}

	protected _handleBulletDragStop(event: ISpritePointerEvent) {
		super._handleBulletDragStop(event);
		this._checkClosing(event);
	}

	protected _afterDataChange() {
		super._afterDataChange();
		const dataItems = this.dataItems;
		if (dataItems.length > 0) {
			const lastDataItem = dataItems[dataItems.length - 1];
			const dataContext = lastDataItem.dataContext as any;
			if (dataContext.closing) {
				this._pIndex = 0;
			}
		}

	}

	protected _addPoint(event: ISpritePointerEvent) {
		const chart = this.chart;
		if (chart) {
			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const point = chart.plotContainer.toLocal(event.point);

			const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(point.x)));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)));

			const dataItems = this.dataItems;
			const len = dataItems.length;

			this.data.push({ valueY: valueY, valueX: valueX, index: this._index, corner: this._pIndex });
			this.setPrivate("startIndex", 0);
			this.setPrivate("endIndex", len);

			const dataItem = dataItems[len];
			this._positionBullets(dataItem);
			this._setXLocation(dataItem, valueX);

			this._pIndex++;
			this._handleClosing(dataItem, point);
		}
	}

	protected _checkClosing(event: ISpritePointerEvent) {
		const dataItem = event.target.dataItem;
		if (dataItem) {
			const sprite = event.target;
			const point = { x: sprite.x(), y: sprite.y() }
			this._handleClosing(dataItem, point);
		}
	}

	protected _handleClosing(dataItem: DataItem<this["_dataItemSettings"]>, point: IPoint) {
		const dataContext = dataItem.dataContext as any;
		if (!dataContext.closing) {
			const index = dataContext.index;
			if (this._di[index]) {
				const firstDataItem = this._di[index][0];

				if (firstDataItem && firstDataItem != dataItem) {
					const dPoint = firstDataItem.get("point");
					if (dPoint) {
						if (Math.hypot(point.x - dPoint.x, point.y - dPoint.y) < 5) {
							dataContext.closing = true;
							this._pIndex = 0;
							this.data.push({ stroke: this._getStrokeTemplate(), index: index + 1, corner: "e" });

						}
					}
				}
			}
		}
	}

	protected _updateElements() {
		$array.each(this.dataItems, (dataItem) => {
			const dataContext = dataItem.dataContext as any;
			if (dataContext) {
				const closing = dataContext.closing;
				if (closing) {
					if (this._di[dataContext.index]) {
						const closingDataItem = this._di[dataContext.index][0];
						const valueX = closingDataItem.get("valueX", 0);
						const valueY = closingDataItem.get("valueY");

						this._setContext(dataItem, "valueX", valueX);
						this._setContext(dataItem, "valueY", valueY, true);

						this._setXLocation(dataItem, valueX);
						this._positionBullets(dataItem);

						const bullets = dataItem.bullets;
						if (bullets) {
							$array.each(bullets, (bullet) => {
								const sprite = bullet.get("sprite");
								if (sprite) {
									sprite.set("forceHidden", true);
								}
							})
						}
					}
				}
			}
		})
	}
}