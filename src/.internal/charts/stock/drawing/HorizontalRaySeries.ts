import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { IPoint } from "../../../core/util/IPoint";
import type { Line } from "../../../core/render/Line";
import type { Template } from "../../../core/util/Template";

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

	protected _updateSegment(index: number) {
		
		if(this._di[index]){

			const diP1 = this._di[index]["p1"];
			const diP2 = this._di[index]["p2"];

			const series = this.get("series");
			if (series && diP1 && diP2) {
				const valueXns = diP2.get("valueX" as any);
				let valueY = diP2.get("valueY" as any)
				const valueX = this._getXValue(valueXns);
				valueY = this._getYValue(valueY, valueXns, true);
				
				this._setContext(diP1, "valueY", valueY, true);
				this._setContext(diP2, "valueY", valueY, true);

				this._setContext(diP2, "valueX", valueX);
				this._setContext(diP1, "valueX", valueX + 1);
				
				this._setXLocation(diP2, valueX);
				this._setXLocation(diP1, valueX + 1);

				this._positionBullets(diP1);
				this._positionBullets(diP2);
			}
		}
		this._updateElements();
	}


	protected _updateLine(index:number, p11: IPoint, _p22: IPoint, p1: IPoint, _p2: IPoint) {
		const line = this._lines[index];
		const hitLine = this._hitLines[index];

		line.set("points", [p1, p11]);
		hitLine.set("points", [p1, p11]);
	}

	protected _handlePointerMoveReal() {

	}

	protected _handlePointerClickReal(event: ISpritePointerEvent) {
		if (!this._isDragging) {
			this._index++;
			this._addPoints(event, this._index);
			this._isDrawing = false;
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
}