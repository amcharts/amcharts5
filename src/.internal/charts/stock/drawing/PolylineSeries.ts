import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import { Line } from "../../../core/render/Line";

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

	protected _drawingLine: Line = this.mainContainer.children.push(Line.new(this._root, { forceInactive: true }));

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			super._handlePointerClick(event);

			if (event.target.get("userData") == "grip") {
				this._endPolyline(event.target.dataItem as DataItem<this["_dataItemSettings"]>);
			}
			else {
				if (!this._isDragging) {
					this._isDrawing = true;
					// for consistency with other series
					if (this._index == 0) {
						this._index = 1;
					}
					
					if (this._pIndex == 0) {
						this._increaseIndex();
						this.data.push({ stroke: this._getStrokeTemplate(), index: this._index, corner: "e", drawingId: this._drawingId });
					}
					this._drawingLine.show();
					this._addPoint(event);
				}

				this._drawingLine.set("stroke", this.get("strokeColor"));
			}
		}
	}

	protected _handleBulletDragStop(event: ISpritePointerEvent) {
		super._handleBulletDragStop(event);
	}

	public disableDrawing() {
		super.disableDrawing();
		this._endPolyline();
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

	public clearDrawings(): void {
		super.clearDrawings();
		this._drawingLine.hide();
	}

	protected _addPoint(event: ISpritePointerEvent) {
		const chart = this.chart;
		if (chart) {
			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const point = chart.plotContainer.toLocal(event.point);

			const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(point.x)));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)), valueX);

			const dataItems = this.dataItems;
			const len = dataItems.length;

			this.data.push({ valueY: valueY, valueX: valueX, index: this._index, corner: this._pIndex, drawingId: this._drawingId });
			this.setPrivate("startIndex", 0);
			this.setPrivate("endIndex", len);

			const dataItem = dataItems[len];
			this._positionBullets(dataItem);
			this._setXLocation(dataItem, valueX);

			this._pIndex++;
		}
	}

	protected _endPolyline(dataItem?: DataItem<this["_dataItemSettings"]>) {
		if (!dataItem) {
			dataItem = this.dataItems[this.dataItems.length - 1];
		}

		if (dataItem) {
			this._pIndex = 0;
			const dataContext = dataItem.dataContext as any;

			const index = dataContext.index;

			if (dataContext.corner == 0) {
				this.data.push({ valueX: dataItem.get("valueX"), valueY: dataItem.get("valueY"), index: index, corner: this._pIndex + 1, closing: true, drawingId: this._drawingId })

				const dataItems = this.dataItems;
				const len = dataItems.length - 1;

				this.setPrivate("startIndex", 0);
				this.setPrivate("endIndex", len);

				dataItem = dataItems[len];
				this._positionBullets(dataItem);
				this._setXLocation(dataItem, dataItem.get("valueX", 0));
			}
			this.data.push({ stroke: this._getStrokeTemplate(), index: index + 1, corner: "e", drawingId: this._drawingId });
			this._drawingLine.hide();
		}
	}

	protected _handlePointerMove(event: ISpritePointerEvent) {
		super._handlePointerMove(event);
		if (this._isDrawing) {
			const movePoint = this._movePointerPoint;

			if (movePoint) {
				const dataItems = this.dataItems;
				const len = dataItems.length;
				if (len > 0) {
					const lastItem = dataItems[len - 1];

					const point = lastItem.get("point");
					if (point) {
						this._drawingLine.set("points", [point, movePoint]);
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