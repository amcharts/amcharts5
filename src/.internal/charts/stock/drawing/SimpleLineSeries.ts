import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import type { IPoint } from "../../../core/util/IPoint";

import { DrawingSeries, IDrawingSeriesSettings, IDrawingSeriesPrivate, IDrawingSeriesDataItem } from "./DrawingSeries";
import { Line } from "../../../core/render/Line";
import { ListTemplate } from "../../../core/util/List";
import { Template } from "../../../core/util/Template";

import * as $math from "../../../core/util/Math";


export interface ISimpleLineSeriesDataItem extends IDrawingSeriesDataItem {
}

export interface ISimpleLineSeriesSettings extends IDrawingSeriesSettings {

	/**
	 * Show a dotted line extending from both ends of the drawn line.
	 *
	 * @default true
	 */
	showExtension?: boolean;
}

export interface ISimpleLineSeriesPrivate extends IDrawingSeriesPrivate {
}

export class SimpleLineSeries extends DrawingSeries {
	public static className: string = "SimpleLineSeries";
	public static classNames: Array<string> = DrawingSeries.classNames.concat([SimpleLineSeries.className]);

	declare public _settings: ISimpleLineSeriesSettings;
	declare public _privateSettings: ISimpleLineSeriesPrivate;
	declare public _dataItemSettings: ISimpleLineSeriesDataItem;

	protected _tag = "line";
	protected _updateExtension = false;

	/**
	 * @ignore
	 */
	public makeLine(): Line {
		const line = this.lines.make();
		this.mainContainer.children.push(line);
		this.lines.push(line);
		return line;
	}

	public readonly lines: ListTemplate<Line> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Line._new(this._root, {}, [this.lines.template])
	));

	/**
	 * @ignore
	 */
	public makeHitLine(): Line {
		const line = this.hitLines.make();
		line.addTag("hit");
		this.mainContainer.children.push(line);
		this.hitLines.push(line);
		return line;
	}

	public readonly hitLines: ListTemplate<Line> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Line._new(this._root, {}, [this.hitLines.template])
	));

	protected _di: Array<{ [index: string]: DataItem<ISimpleLineSeriesDataItem> }> = [];
	protected _lines: Array<Line> = [];
	protected _hitLines: Array<Line> = [];

	protected _afterNew() {
		super._afterNew();
		const lineTemplate = this.lines.template;
		lineTemplate.events.on("pointerover", (e) => {
			this._showSegmentBullets(e.target.get("userData"));
		})

		this.strokes.template.set("forceInactive", true);

		lineTemplate.events.on("pointerout", (e) => {
			//this._hideAllBullets();

			const index = e.target.get("userData");

			const line = this._lines[index];
			if (line) {
				line.unhover();
			}

			const strokeIndex = this._getStrokeIndex(index);
			const stroke = this.strokes.getIndex(strokeIndex);
			if (stroke) {
				stroke.unhover();
			}
		})

		const hitTemplate = this.hitLines.template;
		hitTemplate.events.on("pointerover", (e) => {
			const index = e.target.get("userData");
			this._showSegmentBullets(index);

			const line = this._lines[index];

			if (line) {
				line.hover();
			}

			const strokeIndex = this._getStrokeIndex(index);
			const stroke = this.strokes.getIndex(strokeIndex);
			if (stroke) {
				stroke.hover();
			}
		})

		hitTemplate.events.on("click", (e) => {
			const index = e.target.get("userData");
			if (this._erasingEnabled) {
				this._disposeIndex(index);
			}
			else {
				this._selectDrawing(index, (e.originalEvent as any).ctrlKey);
			}
		})

		hitTemplate.events.on("dragstart", (e) => {
			const index = e.target.get("userData");
			const line = this._lines[index];

			if (line) {
				line.dragStart(e);
			}

			const strokeIndex = this._getStrokeIndex(index);
			const stroke = this.strokes.getIndex(strokeIndex);

			if (stroke) {
				stroke.dragStart(e);
			}
		})

		hitTemplate.events.on("dragstop", (e) => {
			const index = e.target.get("userData");

			this.markDirtyValues();
			e.target.setAll({ x: 0, y: 0 });
			const line = this._lines[index];

			if (line) {
				line.dragStop(e);
				line.setAll({ x: 0, y: 0 });
			}

			const strokeIndex = this._getStrokeIndex(index);
			const stroke = this.strokes.getIndex(strokeIndex);
			if (stroke) {
				stroke.dragStop(e);
				stroke.setAll({ x: 0, y: 0 });
			}
		})

		hitTemplate.events.on("pointerout", (e) => {
			const index = e.target.get("userData");
			//this._hideAllBullets();

			const line = this._lines[index];

			if (line) {
				line.unhover();
			}

			const strokeIndex = this._getStrokeIndex(index);
			const stroke = this.strokes.getIndex(strokeIndex);
			if (stroke) {
				stroke.unhover();
			}
		})
	}


	protected _updateElements() {
		const chart = this.chart;
		if (chart) {
			const s = Math.max(chart.plotContainer.width(), chart.plotContainer.height()) * 2;
			for (let i = 0; i < this._lines.length; i++) {
				const line = this._lines[i];
				if (line) {
					const diP1 = this._di[i]["p1"];
					const diP2 = this._di[i]["p2"];

					if (diP1 && diP2) {

						const p1 = diP1.get("point");
						const p2 = diP2.get("point");

						if (p1 && p2) {
							const len = Math.max(Math.abs(s - p1.x), Math.abs(s - p2.x), Math.abs(s - p1.y), Math.abs(s - p2.y), Math.abs(p1.x), Math.abs(p2.x), Math.abs(p1.y), Math.abs(p2.y))
							let angle = $math.getAngle(p2, p1);

							const p11 = { x: p1.x + len * $math.cos(angle), y: p1.y + len * $math.sin(angle) };
							const p22 = { x: p2.x - len * $math.cos(angle), y: p2.y - len * $math.sin(angle) };

							this._updateLine(i, p11, p22, p1, p2);
						}
					}
				}
			}
		}
	}

	protected _updateLine(index: number, p11: IPoint, p22: IPoint, p1: IPoint, p2: IPoint) {
		const line = this._lines[index];
		const hitLine = this._hitLines[index];

		let segments = [[[p11, p1]], [[p2, p22]]];
		let hitSegments = [[[p11, p22]]];

		line.set("segments", segments);
		hitLine.set("segments", hitSegments);
	}

	protected _handlePointerClickReal(event: ISpritePointerEvent) {
		if (!this._isDragging && !this._isSelecting) {

			if (!this._isDrawing) {
				if (this.unselectAllDrawings() == 0) {
					this.isDrawing(true);
					this._increaseIndex();
					this._addPoints(event, this._index);
				}
				this._hideResizer(event.target);
			}
			else {
				this.isDrawing(false);
				this._dispatchStockEvent("drawingadded", this._drawingId, this._index);
			}
		}
	}

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			super._handlePointerClick(event);
			this._handlePointerClickReal(event);
		}
	}

	protected _handlePointerMove(event: ISpritePointerEvent) {
		super._handlePointerMove(event);
		this._handlePointerMoveReal(event);
	}


	protected _handlePointerMoveReal(_event: ISpritePointerEvent) {
		if (this._isDrawing) {
			const movePoint = this._movePointerPoint;
			const index = this._index;
			const dataItems = this._di[index];

			if (movePoint && dataItems) {
				const xAxis = this.get("xAxis");
				const yAxis = this.get("yAxis");

				const valueXns = xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x)); // not snapped

				const valueX = this._getXValue(valueXns);
				const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)), valueXns);

				const diP1 = dataItems["p1"];
				const diP2 = dataItems["p2"];

				if (diP1 && diP2) {
					this._setContext(diP2, "valueX", valueX, true);
					this._setContext(diP2, "valueY", valueY, true);
					this._setXLocation(diP1, diP1.get("valueX", 0));
					this._setXLocation(diP2, valueX);
					this._updateSegment(index);
				}
			}
		}
	}

	protected _createElements(index: number) {
		if (!this._lines[index]) {
			const line = this.makeLine();
			this._lines[index] = line;

			const hitLine = this.makeHitLine();
			this._hitLines[index] = hitLine;

			const dataContext = this.dataItems[this.dataItems.length - 1].dataContext as any;
			dataContext.sprite = line;

			let showExtension = this.get("showExtension", true);

			let color = this.get("strokeColor", this.get("stroke"));

			const strokeTemplate = dataContext.stroke;
			if (strokeTemplate) {
				color = strokeTemplate.get("stroke");
			}

			if (dataContext) {
				showExtension = dataContext.showExtension;
			}

			line.setPrivate("visible", showExtension);

			const settings = { stroke: color, userData: index };
			line.setAll(settings);
			hitLine.setAll(settings);

			this._updateSegment(index);
		}
	}

	protected _addTemplates(index: number) {
		this.data.push({ stroke: this._getStrokeTemplate(), fill: this._getFillTemplate(), index: index, showExtension: this.get("showExtension", true), corner: "e", drawingId: this._drawingId });
	}

	public addPoints(point: IPoint, index: number) {
		const chart = this.chart!;
		this._addTemplates(index);
		point = chart.plotContainer.toLocal(point);

		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");

		const valueYns = xAxis.positionToValue(xAxis.coordinateToPosition(point.x));
		const valueX = this._getXValue(valueYns);
		const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)), valueYns);

		this._addPointsReal(valueX, valueY, index);
	}

	protected _addPoints(event: ISpritePointerEvent, index: number) {
		this.addPoints(event.point, index);
	}

	protected _addPointsReal(valueX: number, valueY: number, index: number) {
		this._addPoint(valueX, valueY, "p1", index);
		this._addPoint(valueX, valueY, "p2", index);
	}

	protected _addPoint(valueX: number, valueY: number, corner: string, index: number) {
		this.data.push({ valueY: valueY, valueX: valueX, corner: corner, index: index, drawingId: this._drawingId });
	}

	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const dataContext = dataItem.dataContext as any;
		if (dataContext) {

			const index = dataContext.index;
			const line = this._lines[index];
			if (line) {
				this.lines.removeValue(line);
				delete (this._lines[index]);
				line.dispose();
			}
			const hitLine = this._hitLines[index];
			if (hitLine) {
				this.hitLines.removeValue(hitLine);
				delete (this._hitLines[index]);
				hitLine.dispose();
			}
		}
	}

	public setInteractive(value: boolean) {
		super.setInteractive(value);
		this.hitLines.template.set("forceInactive", !value);
		this.lines.template.set("forceInactive", !value);
	}

	public enableDrawingSelection(value: boolean) {
		super.enableDrawingSelection(value);
		this.hitLines.template.set("forceInactive", !value);
		this.lines.template.set("forceInactive", !value);
		this.strokes.template.set("forceInactive", true);
	}

	protected _applySettings(index: number, settings?: { [index: string]: any }) {
		super._applySettings(index, settings);
		let context = this._getContext(index);

		if (context) {
			let line = context.sprite;

			if (line && settings && settings.stroke) {
				line.set("stroke", settings.stroke)
			}
		}
	}

	/**
	 * Adds a line drawing.
	 *
	 * Supported tools: `"Horizontal Line"`, `"Horizontal Ray"`, `"Vertical Line"`.
	 *
	 * @param  point Point
	 * @since 5.10.2
	 */
	public addLine(point: IPoint): void {
		this._increaseIndex();
		this.addPoints(point, this._index);
		this._updateSegment(this._index);
		this._dispatchStockEvent("drawingadded", this._drawingId, this._index);
	}
}
