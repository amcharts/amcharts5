import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { IPoint } from "../../../core/util/IPoint";
import type { Line } from "../../../core/render/Line";

import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";

import * as $math from "../../../core/util/Math";

export interface IHorizontalRaySeriesDataItem extends ISimpleLineSeriesDataItem {

}

export interface IHorizontalRaySeriesSettings extends ISimpleLineSeriesSettings {
	/**
	 * @todo review
	 */	
	field: "open" | "value" | "low" | "high";
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
		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];

		const series = this.get("series");
		if (series) {

			const xAxis = this.get("xAxis");

			const min = xAxis.getPrivate("min", 0) + 1;
			const max = xAxis.getPrivate("max", 1) - 1;

			let x1 = $math.fitToRange(diP2.get("valueX" as any), min, max);
			const di1 = xAxis.getSeriesItem(series, Math.max(0, xAxis.valueToPosition(x1)));

			const field = this.get("field") + "Y";

			if (di1) {
				let y1 = di1.get(field as any);

				diP1.set("valueY", y1);
				diP1.set("valueYWorking", y1);

				diP2.set("valueY", y1);
				diP2.set("valueYWorking", y1);

				diP1.set("valueX", x1);
				diP2.set("valueX", x1 + 0.01);

				this._positionBullets(diP1);
				this._positionBullets(diP2);
			}
		}
	}

	protected _updateLine(line: Line, hitLine: Line, p11: IPoint, _p22: IPoint, p1: IPoint, _p2: IPoint) {
		line.set("points", [p1, p11]);
		hitLine.set("points", [p1, p11]);
	}

	// need to override so that location would not be set
	protected _setXLocation() {

	}

	protected _handlePointerMoveReal() {

	}

	protected _handlePointerClickReal(event: ISpritePointerEvent) {
		if (!this._isDragging) {
			this._addPoints(event, this._index);
			this._updateSegment(this._index);
			this._index++;
			this._isDrawing = false;
		}
	}

	protected _addPoints(event: ISpritePointerEvent, index: number): Line {
		let line = super._addPoints(event, index);
		this._updateExtentionLine(line);
		const diP2 = this._di[index]["p2"];
		diP2.set("valueX", diP2.get("valueX", 0) + 0.001);
		this._isDrawing = false;
		return line;
	}
}