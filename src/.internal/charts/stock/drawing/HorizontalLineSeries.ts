import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import * as $array from "../../../core/util/Array";

import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";

export interface IHorizontalLineSeriesDataItem extends ISimpleLineSeriesDataItem {
}

export interface IHorizontalLineSeriesSettings extends ISimpleLineSeriesSettings {
}

export interface IHorizontalLineSeriesPrivate extends ISimpleLineSeriesPrivate {
}

export class HorizontalLineSeries extends SimpleLineSeries {
	public static className: string = "HorizontalLineSeries";
	public static classNames: Array<string> = SimpleLineSeries.classNames.concat([HorizontalLineSeries.className]);

	declare public _settings: IHorizontalLineSeriesSettings;
	declare public _privateSettings: IHorizontalLineSeriesPrivate;
	declare public _dataItemSettings: IHorizontalLineSeriesDataItem;

	protected _tag = "horizontal";

	protected _afterNew() {
		super._afterNew();
		this.lines.template.set("forceHidden", true);
	}

	protected _handleBulletDragged(event: ISpritePointerEvent) {
		super._handleBulletDragged(event);

		const dataItem = event.target.dataItem as DataItem<IHorizontalLineSeriesDataItem>;
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

				const min = xAxis.getPrivate("min", 0);
				const max = xAxis.getPrivate("max", 1);

				this._setContext(diP1, "valueY", valueY, true);
				this._setContext(diP2, "valueY", valueY, true);
				this._setContext(diP3, "valueY", valueY, true);

				this._setContext(diP1, "valueX", min - (max - min));
				this._setContext(diP2, "valueX", valueX);
				this._setContext(diP3, "valueX", max + (max - min));

				this._setXLocation(diP2, diP2.get("valueX", 0));

				this._positionBullets(diP2);
			}
		}
	}

	protected _handlePointerMoveReal() {

	}

	public _prepareChildren(): void {
		super._prepareChildren();

		const xAxis = this.get("xAxis");

		const min = xAxis.getPrivate("min", 0);
		const max = xAxis.getPrivate("max", 1);

		$array.each(this._di, (di) => {
			if(di){
				this._setContext(di["p1"], "valueX", min - (max - min), true);
				this._setContext(di["p3"], "valueX", max + (max - min), true);			
			}
		});
	}

	protected _updateSegment(index: number) {
		if (this._di[index]) {
			const diP1 = this._di[index]["p1"];
			const diP3 = this._di[index]["p3"];

			if (diP1 && diP3) {
				const xAxis = this.get("xAxis");
				const min = xAxis.getPrivate("min", 0);
				const max = xAxis.getPrivate("max", 1);

				this._setContext(diP1, "valueX", min - (max - min), true);
				this._setContext(diP3, "valueX", max + (max - min), true);
			}
		}
	}

	protected _handlePointerClickReal(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			if (!this._isDragging) {
				if(this.unselectAllDrawings() == 0){
					this._increaseIndex();
					this._addPoints(event, this._index);
					this.isDrawing(false);
					
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