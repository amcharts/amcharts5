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
		super._handlePointerClick(event);

		if (!this._isDragging) {
			this._isDrawing = true;

			if (this._pIndex == 0) {
				this.data.push({ stroke: this._getStrokeTemplate() });
				this._addContextInfo(this._index);
			}

			this._addPoint(event);
		}
	}

	protected _handleBulletDragStop(event: ISpritePointerEvent) {
		super._handleBulletDragStop(event);
		this._checkClosing(event);
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

			this.data.push({ valueY: valueY, valueX: valueX });
			this.setPrivate("startIndex", 0);
			this.setPrivate("endIndex", len);

			this._addContextInfo(this._index, this._pIndex);

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
			const firstDataItem = this._di[index][0];

			if (firstDataItem && firstDataItem != dataItem) {
				const dPoint = firstDataItem.get("point");
				if (dPoint) {
					if (Math.hypot(point.x - dPoint.x, point.y - dPoint.y) < 5) {
						dataContext.closing = firstDataItem;

						this._pIndex = 0;
						this._index++;

						this.data.push({ stroke: this._getStrokeTemplate() });
						this._addContextInfo(this._index, "e");
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
					const valueX = closing.get("valueX", 0);
					const valueY = closing.get("valueY");
					dataItem.set("valueX", valueX);
					this._setXLocation(dataItem, valueX);
					dataItem.set("valueY", valueY);
					dataItem.set("valueYWorking", valueY);
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
		})
	}
}