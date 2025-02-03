import type { Graphics } from "../../../core/render/Graphics";
import type { DataItem } from "../../../core/render/Component";
import type { Color } from "../../../core/util/Color";
import type { Sprite } from "../../../core/render/Sprite";

import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";
import { Label } from "../../../core/render/Label";
import { ListTemplate } from "../../../core/util/List";
import { Template } from "../../../core/util/Template";

import * as $array from "../../../core/util/Array";

export interface IFibonacciSeriesDataItem extends ISimpleLineSeriesDataItem {
}

export interface IFibonacciSeriesSettings extends ISimpleLineSeriesSettings {

	/**
	 * Sequence.
	 */
	sequence?: Array<number>;

	/**
	 * Array of colors to use for bands.
	 */
	colors?: Array<Color>

}

export interface IFibonacciSeriesPrivate extends ISimpleLineSeriesPrivate {
}

export class FibonacciSeries extends SimpleLineSeries {
	public static className: string = "FibonacciSeries";
	public static classNames: Array<string> = SimpleLineSeries.classNames.concat([FibonacciSeries.className]);

	declare public _settings: IFibonacciSeriesSettings;
	declare public _privateSettings: IFibonacciSeriesPrivate;
	declare public _dataItemSettings: IFibonacciSeriesDataItem;

	protected _tag = "fibonacci";
	protected _labels: Array<Array<Label>> = [];
	protected _fills: Array<Array<Graphics>> = [];
	protected _strokes: Array<Array<Graphics>> = [];

	/**
	 * @ignore
	 */
	public makeLabel(): Label {
		const label = this.labels.make();
		this.bulletsContainer.children.push(label);
		this.labels.push(label);
		return label;
	}

	/**
	 * A list of labels.
	 *
	 * `labels.template` can be used to configure axis labels.
	 *
	 * @default new ListTemplate<Label>
	 */
	public readonly labels: ListTemplate<Label> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Label._new(this._root, {}, [this.labels.template])
	));

	public _updateChildren() {
		super._updateChildren();
		this._updateChildrenReal();
	}

	protected _getIndex(sprite: Sprite): number {
		return sprite.get("userData");
	}

	protected _updateChildrenReal() {
		const chart = this.chart;

		if (chart) {
			const yAxis = this.get("yAxis");

			for (let i = 0; i < this._lines.length; i++) {
				const line = this._lines[i];
				if (line) {
					const diP1 = this._di[i]["p1"];
					const diP2 = this._di[i]["p2"];
					const di = this._di[i]["e"];
					const dataContext = di.dataContext as any;
					const strokeTemplate = dataContext.stroke;					

					if (diP1 && diP2) {

						const p1 = diP1.get("point");
						const p2 = diP2.get("point");

						if (p1 && p2) {
							const sequence = this.get("sequence", []);
							let prevValue = 0;

							const labels = this._labels[i];
							const strokes = this._strokes[i];
							const fills = this._fills[i];

							for (let i = 0; i < sequence.length; i++) {
								const value = sequence[i] - 1;

								const label = labels[i];

								const fill = fills[i];
								const stroke = strokes[i];

								let fillColor = this.get("colors", [])[i];
								let strokeColor = fillColor;

								fill.set("fill", fillColor);
								stroke.set("stroke", strokeColor);

								let strokeOpacity;								
								if(strokeTemplate){
									strokeOpacity = strokeTemplate.get("strokeOpacity");
								}

								if(strokeOpacity == undefined){
									strokeOpacity = this.get("strokeOpacity", 0);
								}

								stroke.set("strokeOpacity", strokeOpacity);

								const y1 = p1.y + (p2.y - p1.y) * prevValue;
								const y2 = p1.y + (p2.y - p1.y) * -value;

								const realValue = yAxis.positionToValue(yAxis.coordinateToPosition(y2));

								fill.setPrivate("visible", true);
								stroke.setPrivate("visible", true);

								fill.set("draw", (display) => {
									display.moveTo(p1.x, y1);
									display.lineTo(p2.x, y1);

									display.lineTo(p2.x, y2);
									display.lineTo(p1.x, y2);
									display.lineTo(p1.x, y1);
								})

								stroke.set("draw", (display) => {
									display.moveTo(p1.x, y2);
									display.lineTo(p2.x, y2);
								})

								const dataItem = label.dataItem;
								if (dataItem) {
									dataItem.set("value" as any, realValue);
								}

								label.setAll({ x: p2.x, y: y2, fill: fillColor });
								label.text.markDirtyText();

								prevValue = -value;
							}
						}
					}
				}
			}
		}
	}

	protected _createElements(index: number) {
		super._createElements(index);

		if (!this._fills[index]) {

			const labelArr = [];
			const fillsArr = [];
			const strokesArr = [];

			const sequence = this.get("sequence", []);

			for (let i = 0; i < sequence.length; i++) {
				const label = this.makeLabel();
				const dataItem = this.makeDataItem({});
				dataItem.set("sequence" as any, sequence[i]);
				label._setDataItem(dataItem);
				labelArr.push(label);

				const fill = this.makeFill(this.fills);
				fillsArr.push(fill);
				fill.set("userData", index);
				fill.states.remove("hover");

				const stroke = this.makeStroke(this.strokes);
				stroke.set("userData", index);
				strokesArr.push(stroke);
			}

			this._labels[index] = labelArr;
			this._fills[index] = fillsArr;
			this._strokes[index] = strokesArr;
		}
	}

	protected _drawFill() {

	}

	protected _drawStroke() {

	}

	protected _updateLine() {

	}

	protected _clearGraphics() {

	}

	/*
	public enableDrawing() {
		super.enableDrawing();
		this.showAllBullets();
	}

	public enableErasing() {
		super.enableErasing();
		this.showAllBullets();
	}

	protected _hideAllBullets() {
		if (this._drawingEnabled || this._erasingEnabled) {

		}
		else {
			super._hideAllBullets();
		}
	}*/

	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const dataContext = dataItem.dataContext as any;
		if (dataContext) {
			const index = dataContext.index;
			const labels = this._labels[index];
			const fills = this._fills[index];
			const strokes = this._strokes[index];

			if (labels) {
				$array.each(labels, (item) => {
					item.dispose();
					this.labels.removeValue(item);
				})

				delete (this._labels[index]);
			}
			if (fills) {
				$array.each(fills, (item) => {
					this.fills.removeValue(item);
					item.dispose();
				})
				delete (this._fills[index]);
			}
			if (strokes) {
				$array.each(strokes, (item) => {
					this.strokes.removeValue(item);
					item.dispose();
				})
				delete (this._strokes[index]);
			}
		}
	}
}
