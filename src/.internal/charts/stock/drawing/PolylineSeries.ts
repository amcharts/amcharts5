import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import type { IPoint } from "../../../core/util/IPoint";

import { Line } from "../../../core/render/Line";
import { color } from "../../../core/util/Color";
import { DrawingSeries, IDrawingSeriesSettings, IDrawingSeriesPrivate, IDrawingSeriesDataItem } from "./DrawingSeries";

import * as $array from "../../../core/util/Array";

export interface IPolylineSeriesDataItem extends IDrawingSeriesDataItem {
}

export interface IPolylineSeriesSettings extends IDrawingSeriesSettings {

	/**
	 * Show a closed color-filled shape instead of polyline.
	 * 
	 * @default false
	 * @since 5.9.0
	 */
	fillShape?: boolean;

	/**
	 * Number of pre-defined points in a shape.
	 *
	 * The shape will finish drawing once number is reached.
	 * @since 5.9.0
	 */
	pointCount?: number;
}

export interface IPolylineSeriesPrivate extends IDrawingSeriesPrivate {
}

/**
 * Draws a multi-point line (polyline).
 */
export class PolylineSeries extends DrawingSeries {
	public static className: string = "PolylineSeries";
	public static classNames: Array<string> = DrawingSeries.classNames.concat([PolylineSeries.className]);

	declare public _settings: IPolylineSeriesSettings;
	declare public _privateSettings: IPolylineSeriesPrivate;
	declare public _dataItemSettings: IPolylineSeriesDataItem;

	protected _tag = "polyline";

	protected _drawingLine: Line = this.mainContainer.children.push(Line.new(this._root, { forceInactive: true }));

	public _prepareChildren(): void {
		super._prepareChildren();

		this.strokes.template.setAll({
			fill: color(0xffffff),
			fillOpacity: 0
		})

		if (this.isDirty("fillShape")) {
			if (this.get("fillShape")) {
				this.fills.template.setAll({
					visible: true,
					forceHidden: false,
					fillOpacity: this.get("fillOpacity"),
					fill: this.get("fillColor")
				})
			}
			else {
				this.fills.template.setAll({
					visible: false
				})
			}
		}
	}

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			super._handlePointerClick(event);

			if (event.target.get("userData") == "grip") {
				this._endPolyline(event.target.dataItem as DataItem<this["_dataItemSettings"]>);
			}
			else {
				if (!this._isDragging) {
					this.isDrawing(true);
					this._hideResizer(event.target);
					if (this.unselectAllDrawings() == 0) {
						// for consistency with other series
						if (this._index == 0) {
							this._index = 1;
						}

						if (this._pIndex == 0) {
							this._increaseIndex();
							const context = { stroke: this._getStrokeTemplate(), fill: this._getFillTemplate(), index: this._index, corner: "e", drawingId: this._drawingId };
							this._setContextSprite(context);
							this.data.push(context);
						}
						this._drawingLine.show();
						this._addPoint(event);

						// add one more if fill
						if (this.get("fillShape")) {
							if (this._pIndex == 1) {
								this._addPoint(event, true);
							}
							else if (this._pIndex > 1) {
								this.data.moveValue(this.data.getIndex(this.data.length - 1), this.data.length - 2);
							}
						}

						if (this._pIndex - 1 == this.get("pointCount", 1000)) {
							this._endPolyline();
							return;
						}
					}
				}

				this._drawingLine.set("stroke", this.get("strokeColor"));
			}
		}
	}

	protected _setContextSprite(context: any) {
		context.sprite = this.mainContainer;
	}

	public disableDrawing() {
		super.disableDrawing();
		this._endPolyline();
	}

	public clearDrawings(): void {
		super.clearDrawings();
		this._drawingLine.hide();
	}

	protected _addPoint(event: ISpritePointerEvent, closing?: boolean) {
		const chart = this.chart;
		if (chart) {
			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const point = chart.plotContainer.toLocal(event.point);

			const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(point.x)));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)), valueX);

			const dataItems = this.dataItems;
			const len = dataItems.length;

			this.data.push({ valueY: valueY, valueX: valueX, index: this._index, corner: this._pIndex, drawingId: this._drawingId, closing: closing });
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
				this.data.push({ valueX: dataItem.get("valueX"), valueY: dataItem.get("valueY"), index: index, corner: "c", closing: true, drawingId: this._drawingId })

				const dataItems = this.dataItems;
				const len = dataItems.length - 1;

				this.setPrivate("startIndex", 0);
				this.setPrivate("endIndex", len);

				dataItem = dataItems[len];
				this._positionBullets(dataItem);
				this._setXLocation(dataItem, dataItem.get("valueX", 0));
			}

			this._drawingLine.hide();

			this.isDrawing(false);
			this._dispatchAdded();
		}
	}

	protected _dispatchAdded(): void {
		this._dispatchStockEvent("drawingadded", this._drawingId, this._index);
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
					const points: Array<IPoint> = [];

					const point = lastItem.get("point");
					if (point) {
						points.push(point);
					}

					points.push(movePoint);

					if (this.get("fillShape")) {
						const bLastItem = dataItems[len - 2];
						if (bLastItem) {
							const bPoint = bLastItem.get("point");
							if (bPoint) {
								points.push(bPoint);
							}
						}
					}

					if (points.length > 1) {
						this._drawingLine.set("points", points);
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

	/**
	 * Cancels current drawing
	 *
	 * @since 5.9.0
	 */
	public cancelDrawing() {
		super.cancelDrawing();
		this._drawingLine.hide(0);
	}
}