import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";
import type { Line } from "../../../core/render/Line";
import type { Template } from "../../../core/util/Template";

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

	protected _updateExtension = true;

	protected _handleBulletDragged(event: ISpritePointerEvent) {
		super._handleBulletDragged(event);

		const dataItem = event.target.dataItem as DataItem<IHorizontalLineSeriesDataItem>;
		const dataContext = dataItem.dataContext as any;

		if (dataContext) {
			const index = dataContext.index;
			const diP1 = this._di[index]["p1"];
			const diP2 = this._di[index]["p2"];
			const di = this._di[index]["e"];

			const movePoint = this._movePointerPoint;

			if (diP1 && diP2 && di && movePoint) {
				const yAxis = this.get("yAxis");
				const xAxis = this.get("xAxis");

				const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x)));
				const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)), valueX);				

				this._setContext(diP1, "valueY", valueY, true);
				this._setContext(diP2, "valueY", valueY, true);

				this._setContext(diP1, "valueX", valueX);
				this._setContext(diP2, "valueX", valueX + 1);

				this._setXLocation(diP1, valueX);
				this._setXLocation(diP2, valueX + 1);

				this._positionBullets(diP1);
				this._positionBullets(diP2);
			}
		}
	}

	protected _updateExtensionLine(line: Line, template: Template<any>) {
		line.setAll({
			stroke: template.get("stroke"),
			strokeWidth: template.get("strokeWidth"),
			strokeDasharray: template.get("strokeDasharray"),
			strokeOpacity: template.get("strokeOpacity")
		})
	}

	protected _handlePointerMoveReal() {

	}

	protected _handlePointerClickReal(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			if (!this._isDragging) {
				this._index++;
				this._addPoints(event, this._index);
				this._isDrawing = false;
			}
		}
	}
}