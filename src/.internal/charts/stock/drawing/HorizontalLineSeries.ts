import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import type { Line } from "../../../core/render/Line";
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

	protected _handleBulletDragged(event: ISpritePointerEvent) {
		super._handleBulletDragged(event);

		const dataItem = event.target.dataItem as DataItem<IHorizontalLineSeriesDataItem>;
		const dataContext = dataItem.dataContext as any;

		if (dataContext) {
			const index = dataContext.index;
			const diP1 = this._di[index]["p1"];
			const diP2 = this._di[index]["p2"];

			const movePoint = this._movePointerPoint;

			if (diP1 && diP2 && movePoint) {
				const yAxis = this.get("yAxis");
				const xAxis = this.get("xAxis");

				const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)));
				const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x)));

				diP1.set("valueY", valueY);
				diP1.set("valueYWorking", valueY);

				diP2.set("valueY", valueY);
				diP2.set("valueYWorking", valueY);

				diP1.set("valueX", valueX);
				diP2.set("valueX", valueX + 0.01);

				this._setXLocation(diP1, valueX);
				this._setXLocation(diP2, valueX + 0.01);

				this._positionBullets(diP1);
				this._positionBullets(diP2);
			}
		}
	}

	protected _handlePointerMoveReal() {

	}

	protected _handlePointerClickReal(event: ISpritePointerEvent) {
		if (!this._isDragging) {
			this._addPoints(event, this._index);
			this._index++;
			this._isDrawing = false;
		}
	}

	protected _addPoints(event: ISpritePointerEvent, index: number):Line {
		const line = super._addPoints(event, index);
		this._updateExtentionLine(line);
		const diP2 = this._di[index]["p2"];
		diP2.set("valueX", diP2.get("valueX", 0) + 0.001);
		this._isDrawing = false;
		return line;
	}
}