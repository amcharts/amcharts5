import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import * as $array from "../../../core/util/Array";

import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";

export interface IHorizontalRaySeriesDataItem extends ISimpleLineSeriesDataItem {
}

export interface IHorizontalRaySeriesSettings extends ISimpleLineSeriesSettings {
}

export interface IHorizontalRaySeriesPrivate extends ISimpleLineSeriesPrivate {
}

export class HorizontalRaySeries extends SimpleLineSeries {
	public static className: string = "HorizontalRaySeries";
	public static classNames: Array<string> = SimpleLineSeries.classNames.concat([HorizontalRaySeries.className]);

	declare public _settings: IHorizontalRaySeriesSettings;
	declare public _privateSettings: IHorizontalRaySeriesPrivate;
	declare public _dataItemSettings: IHorizontalRaySeriesDataItem;

	protected _tag = "ray";


	protected _afterNew() {
		super._afterNew();
		this.lines.template.set("forceHidden", true);
	}

	protected _handleBulletDragged(event: ISpritePointerEvent) {
		super._handleBulletDragged(event);

		const dataItem = event.target.dataItem as DataItem<IHorizontalRaySeriesDataItem>;
		const dataContext = dataItem.dataContext as any;

		if (dataContext) {
			const index = dataContext.index;
			const diP1 = this._di[index]["p1"];
			const diP2 = this._di[index]["p2"];

			const movePoint = this._movePointerPoint;

			if (diP1 && diP2 && movePoint) {
				const yAxis = this.get("yAxis");
				const xAxis = this.get("xAxis");

				const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x)));
				const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)), valueX);

				const min = xAxis.getPrivate("min", 0);
				const max = xAxis.getPrivate("max", 1);

				this._setContext(diP1, "valueY", valueY, true);
				this._setContext(diP2, "valueY", valueY, true);

				this._setContext(diP1, "valueX", valueX);
				this._setContext(diP2, "valueX", max + (max - min));

				this._setXLocation(diP1, diP1.get("valueX", 0));

				this._positionBullets(diP1);
			}
		}
	}

	public _prepareChildren(): void {
		super._prepareChildren();

		const xAxis = this.get("xAxis");

		const min = xAxis.getPrivate("min", 0);
		const max = xAxis.getPrivate("max", 1);

		$array.each(this._di, (di) => {
			if(di){
				this._setContext(di["p2"], "valueX", max + (max - min), true);			
			}
		});
	}

	protected _handlePointerMoveReal() {

	}

	protected _updateSegment(index: number) {
		if (this._di[index]) {
			const diP2 = this._di[index]["p2"];

			if (diP2) {
				const xAxis = this.get("xAxis");
				const min = xAxis.getPrivate("min", 0);
				const max = xAxis.getPrivate("max", 1);


				this._setContext(diP2, "valueX", max + (max - min), true);
			}
		}
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
}