import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";

import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";

export interface IVerticalLineSeriesDataItem extends ISimpleLineSeriesDataItem {
}

export interface IVerticalLineSeriesSettings extends ISimpleLineSeriesSettings {
}

export interface IVerticalLineSeriesPrivate extends ISimpleLineSeriesPrivate {
}

export class VerticalLineSeries extends SimpleLineSeries {
	public static className: string = "VerticalLineSeries";
	public static classNames: Array<string> = SimpleLineSeries.classNames.concat([VerticalLineSeries.className]);

	declare public _settings: IVerticalLineSeriesSettings;
	declare public _privateSettings: IVerticalLineSeriesPrivate;
	declare public _dataItemSettings: IVerticalLineSeriesDataItem;

	protected _tag = "vertical";

	protected _afterNew() {
		super._afterNew();
		this.lines.template.set("forceHidden", true);
	}

	protected _handleBulletDragged(event: ISpritePointerEvent) {
		super._handleBulletDragged(event);

		const dataItem = event.target.dataItem as DataItem<IVerticalLineSeriesDataItem>;
		const dataContext = dataItem.dataContext as any;

		if (dataContext) {
			const index = dataContext.index;
			const diP1 = this._di[index]["p1"];
			const diP2 = this._di[index]["p2"];
			const diP3 = this._di[index]["p3"];

			const movePoint = this._movePointerPoint;

			if (diP1 && diP2 && diP3 && movePoint) {
				const yAxis = this.get("yAxis");
				const xAxis = this.get("xAxis");

				const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x)));
				const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)), valueX);

				const min = yAxis.getPrivate("min", 0);
				const max = yAxis.getPrivate("max", 1);

				this._setContext(diP1, "valueY", min - (max - min) * 10, true);
				this._setContext(diP2, "valueY", valueY, true);
				this._setContext(diP3, "valueY", max + (max - min) * 10, true);

				this._setContext(diP1, "valueX", valueX);
				this._setContext(diP2, "valueX", valueX);
				this._setContext(diP3, "valueX", valueX);

				this._setXLocation(diP1, valueX);
				this._setXLocation(diP2, valueX);
				this._setXLocation(diP3, valueX);

				this._positionBullets(diP1);
				this._positionBullets(diP2);
				this._positionBullets(diP3);
			}
		}
	}

	protected _updateSegment(index: number) {
		if (this._di[index]) {
			const diP1 = this._di[index]["p1"];
			const diP3 = this._di[index]["p3"];
			if (diP1 && diP3) {
				const yAxis = this.get("yAxis");
				const min = yAxis.getPrivate("min", 0);
				const max = yAxis.getPrivate("max", 1);

				this._setContext(diP1, "valueY", min - (max - min) * 10, true);
				this._setContext(diP3, "valueY", max + (max - min) * 10, true);
			}
		}
	}

	protected _handlePointerMoveReal() {

	}

	protected _handlePointerClickReal(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			if (!this._isDragging) {
				if (this.unselectAllDrawings() == 0) {
					this._increaseIndex();
					this._addPoints(event, this._index);
					this.isDrawing(false);
					this._hideResizer();

					this._updateSegment(this._index);
					this._dispatchStockEvent("drawingadded", this._drawingId, this._index);
				}
			}
		}
	}

	protected _addPointsReal(valueX: number, valueY: number, index: number) {
		super._addPointsReal(valueX, valueY, index);
		this._addPoint(valueX, valueY, "p3", index);
	}
}