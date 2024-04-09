import type { DataItem } from "../../../core/render/Component";
import type { Graphics } from "../../../core/render/Graphics";
import type { IPoint } from "../../../core/util/IPoint";

import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";

export interface IRectangleSeriesDataItem extends ISimpleLineSeriesDataItem {
}

export interface IRectangleSeriesSettings extends ISimpleLineSeriesSettings {
}

export interface IRectangleSeriesPrivate extends ISimpleLineSeriesPrivate {
}

export class RectangleSeries extends SimpleLineSeries {
	public static className: string = "RectangleSeries";
	public static classNames: Array<string> = SimpleLineSeries.classNames.concat([RectangleSeries.className]);

	declare public _settings: IRectangleSeriesSettings;
	declare public _privateSettings: IRectangleSeriesPrivate;
	declare public _dataItemSettings: IRectangleSeriesDataItem;

	protected _di: Array<{ [index: string]: DataItem<IRectangleSeriesDataItem> }> = []

	protected _tag = "rectangle";

	protected _updateSegment(index: number) {
		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];

		const series = this.get("series");

		if (series && diP1 && diP2) {
			const field = this.get("field") + "Y";

			let y1 = diP1.get(field as any);
			let y2 = diP2.get(field as any);

			this._setContext(diP1, "valueY", y1, true);
			this._setContext(diP2, "valueY", y2, true);

			this._positionBullets(diP1);
			this._positionBullets(diP2);
		}
	}

	protected _setXLocation(dataItem: DataItem<this["_dataItemSettings"]>, value: number) {
		if (!this.get("snapToData")) {
			this._setXLocationReal(dataItem, value);
		}
		else {
			dataItem.set("locationX", 0);
		}
	}

	public _updateChildren() {
		super._updateChildren();
		const chart = this.chart;
		this.fills.clear();
		if (chart) {
			for (let i = 0; i < this._lines.length; i++) {
				const line = this._lines[i];
				if (line) {
					const diP1 = this._di[i]["p1"];
					const diP2 = this._di[i]["p2"];
					const di = this._di[i]["e"];

					const dataContext = di.dataContext as any;
					const fillGraphics = this.makeFill(this.fills);

					const index = this.dataItems.indexOf(diP1);
					for (let j = index; j >= 0; j--) {
						const dataContext = this.dataItems[j].dataContext as any;
						const template = dataContext.fill;
						if (template) {
							fillGraphics.template = template;
						}
					}

					const userData = [this.dataItems.indexOf(diP1), this.dataItems.indexOf(diP2)];

					let fillColor = this.get("fillColor", this.get("fill"));

					const fillTemplate = dataContext.fill;

					if (fillTemplate) {
						fillColor = fillTemplate.get("fill");
					}

					const settings = { userData: userData, fill: fillColor };
					fillGraphics.setAll(settings);

					const p1 = diP1.get("point");
					const p2 = diP2.get("point");

					if (p1 && p2) {
						fillGraphics.set("draw", (display) => {
							display.moveTo(p1.x, p1.y);
							display.lineTo(p2.x, p1.y);
							display.lineTo(p2.x, p2.y);
							display.lineTo(p1.x, p2.y);
							display.lineTo(p1.x, p1.y);
						})

						const strokeGraphics = this.strokes.getIndex(this._getStrokeIndex(i));

						if (strokeGraphics) {
							strokeGraphics.set("draw", (display) => {
								display.moveTo(p1.x, p1.y);
								display.lineTo(p2.x, p1.y);
								display.lineTo(p2.x, p2.y);
								display.lineTo(p1.x, p2.y);
								display.lineTo(p1.x, p1.y);
							})
						}
						this._updateOthers(i, fillGraphics, p1, p2);
					}
				}
			}
		}
	}

	protected _updateOthers(_index: number, _fillGraphics: Graphics, _p1: IPoint, _p2: IPoint) {

	}

	protected _drawFill() {

	}

	protected _updateLine() {

	}
}