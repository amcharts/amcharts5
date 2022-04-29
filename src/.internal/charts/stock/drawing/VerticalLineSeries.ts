import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import type { Line } from "../../../core/render/Line";
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

	protected _handleBulletDragged(event: ISpritePointerEvent) {
		super._handleBulletDragged(event);

		const dataItem = event.target.dataItem as DataItem<IVerticalLineSeriesDataItem>;
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

				diP2.set("valueY", valueY + 0.001);
				diP2.set("valueYWorking", valueY + 0.001);

				diP1.set("valueX", valueX);
				diP2.set("valueX", valueX);

				this._setXLocation(diP1, valueX);
				this._setXLocation(diP2, valueX);

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
		let line = super._addPoints(event, index);
		this._updateExtentionLine(line);
		const diP2 = this._di[index]["p2"];
		const value = diP2.get("valueY", 0) + 0.001;
		diP2.set("valueY", value);
		diP2.set("valueYWorking", value);
		return line;
	}
}