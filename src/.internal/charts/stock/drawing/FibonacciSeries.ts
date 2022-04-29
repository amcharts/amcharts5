import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { Graphics } from "../../../core/render/Graphics";
import type { DataItem } from "../../../core/render/Component";
import type { Color } from "../../../core/util/Color";

import { SimpleLineSeries, ISimpleLineSeriesSettings, ISimpleLineSeriesPrivate, ISimpleLineSeriesDataItem } from "./SimpleLineSeries";
import { Label } from "../../../core/render/Label";
import { ListTemplate } from "../../../core/util/List";
import { Template } from "../../../core/util/Template";
import type { Line } from "../../../core/render/Line";


import * as $array from "../../../core/util/Array";

export interface IFibonacciSeriesDataItem extends ISimpleLineSeriesDataItem {

}

export interface IFibonacciSeriesSettings extends ISimpleLineSeriesSettings {
	/**
	 * @todo review
	 */	
	sequence?: Array<number>;
	/**
	 * @todo review
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
		this.mainContainer.children.push(label);
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
	public readonly labels: ListTemplate<Label> = new ListTemplate(
		Template.new({}),
		() => Label._new(this._root, {}, [this.labels.template])
	);

	protected _updateSegment(index: number) {
		super._updateSegment(index);
		this._updateSegmentReal(index);
	}

	protected _updateSegmentReal(index: number) {
		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];

		const valueX = diP1.get("valueX", 0);
		diP2.set("valueX", valueX);
		this._setXLocation(diP2, valueX);
	}


	public _updateChildren() {

		super._updateChildren();
		this._updateChildrenReal();

	}

	protected _updateChildrenReal() {
		const chart = this.chart;

		if (chart) {
			const yAxis = this.get("yAxis");

			for (let i = 0; i < this._lines.length; i++) {
				const line = this._lines[i];
				if(line){
					const diP1 = this._di[i]["p1"];
					const diP2 = this._di[i]["p2"];

					const p1 = diP1.get("point");
					const p2 = diP2.get("point");

					const valueX = diP1.get("valueX", 0);
					diP2.set("valueX", valueX);
					this._setXLocation(diP2, valueX);

					if (p1 && p2) {
						p2.x = chart.plotContainer.width();
						const sequence = this.get("sequence", []);
						const colors = this.get("colors", []);
						let prevValue = 0;

						const labels = this._labels[i];
						const strokes = this._strokes[i];
						const fills = this._fills[i];

						for (let i = 0; i < sequence.length; i++) {
							const value = sequence[i];

							const color = colors[i];
							const label = labels[i];

							const fill = fills[i];
							const stroke = strokes[i];

							const y1 = p1.y + (p2.y - p1.y) * prevValue;
							const y2 = p1.y + (p2.y - p1.y) * value;

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

							label.setAll({ x: p2.x, y: y2, fill: color });
							label.text.markDirtyText();

							prevValue = value;
						}
					}
				}
			}
		}
	}

	protected _addPoints(event: ISpritePointerEvent, index: number):Line {
		let line = super._addPoints(event, index);

		const labelArr = [];
		const fillsArr = [];
		const strokesArr = [];

		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];

		const userData = [this.dataItems.indexOf(diP1), this.dataItems.indexOf(diP2)];

		const sequence = this.get("sequence", []);
		const colors = this.get("colors", []);

		for (let i = 0; i < sequence.length; i++) {
			const label = this.makeLabel();
			const dataItem = this.makeDataItem({});
			dataItem.set("sequence" as any, sequence[i]);
			label._setDataItem(dataItem);
			labelArr.push(label);

			const fill = this.makeFill(this.fills);
			fillsArr.push(fill);

			const stroke = this.makeStroke(this.strokes);
			strokesArr.push(stroke);

			let fillColor: Color | undefined = colors[i];
			let strokeColor: Color | undefined = colors[i];

			if (!fillColor) {
				fillColor = this.get("fillColor", this.get("fill"));
			}
			if (!strokeColor) {
				strokeColor = this.get("strokeColor", this.get("stroke"));
			}

			fill.setAll({ fill: fillColor, userData: userData });
			stroke.setAll({ stroke: strokeColor, userData: userData });
		}

		this._labels[index] = labelArr;
		this._fills[index] = fillsArr;
		this._strokes[index] = strokesArr;

		return line;
	}

	protected _drawFill() {

	}

	protected _drawStroke() {

	}

	protected _updateLine() {

	}

	protected _clearGraphics() {

	}

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