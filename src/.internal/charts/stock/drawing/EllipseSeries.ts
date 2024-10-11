import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";

import { DrawingSeries, IDrawingSeriesSettings, IDrawingSeriesPrivate, IDrawingSeriesDataItem } from "./DrawingSeries";
import { Ellipse } from "../../../core/render/Ellipse";
import { ListTemplate } from "../../../core/util/List";
import { Template } from "../../../core/util/Template";

import * as $array from "../../../core/util/Array";
import * as $object from "../../../core/util/Object";

export interface IEllipseSeriesDataItem extends IDrawingSeriesDataItem {
}

export interface IEllipseSeriesSettings extends IDrawingSeriesSettings {
}

export interface IEllipseSeriesPrivate extends IDrawingSeriesPrivate {
}

export class EllipseSeries extends DrawingSeries {
	public static className: string = "EllipseSeries";
	public static classNames: Array<string> = DrawingSeries.classNames.concat([EllipseSeries.className]);

	declare public _settings: IEllipseSeriesSettings;
	declare public _privateSettings: IEllipseSeriesPrivate;
	declare public _dataItemSettings: IEllipseSeriesDataItem;

	protected _ellipses: Array<Ellipse> = [];

	protected _tag = "ellipse";
	protected _clickPX: number = 0;
	protected _clickVY: number = 0;

	/**
	 * @ignore
	 */
	public makeEllipse(): Ellipse {
		const ellipse = this.ellipses.make();
		this.mainContainer.children.push(ellipse);
		this.ellipses.push(ellipse);
		return ellipse;
	}

	public readonly ellipses: ListTemplate<Ellipse> = this.addDisposer(new ListTemplate(
		Template.new({ radiusX: 0, radiusY: 0 }),
		() => Ellipse._new(this._root, { radiusX: 0, radiusY: 0, templateField: "settings" }, [this.ellipses.template])
	));

	protected _afterNew() {
		super._afterNew();

		this.setPrivate("allowChangeSnap", false);

		this.strokes.template.set("visible", false);
		this.fills.template.set("visible", false);

		const ellipseTemplate = this.ellipses.template;
		ellipseTemplate.events.on("pointerover", (e) => {
			this._showSegmentBullets(e.target.get("userData"));
		})

		/*
		ellipseTemplate.events.on("pointerout", () => {
			this._hideAllBullets();
		})
		*/

		ellipseTemplate.events.on("dragstart", (e) => {
			this.startDragItem(e, e.target.get("userData"));
		})

		ellipseTemplate.events.on("dragstop", (e) => {
			this.stopDragItem(e, e.target.get("userData"));
		})

		ellipseTemplate.events.on("click", (e) => {
			const index = e.target.get("userData");
			if (this._erasingEnabled) {
				this._disposeIndex(index);
			}
			else {
				this._selectDrawing(index, (e.originalEvent as any).ctrlKey);
			}
		})
	}

	protected _applySettings(index: number, settings: { [index: string]: any }) {
		super._applySettings(index, settings);
		let template: Template<any>;
		$array.each(this.dataItems, (dataItem) => {
			const dataContext = dataItem.dataContext as any;
			if (dataContext.index == index) {
				if (dataContext.settings) {
					template = dataContext.settings;
				}
			}
		})

		const ellipse = this._getSprite(this.ellipses, index);
		if (ellipse) {
			const defaultState = ellipse.states.lookup("default")!;
			$object.each(settings, (key, value) => {
				ellipse.set(key as any, value);
				defaultState.set(key as any, value);
				if (template) {
					template.set(key, value);
				}
			})
		}
	}

	protected _handleFillDragStop(event: ISpritePointerEvent, index: number) {
		super._handleFillDragStop(event, index);

		const items = this._di[index];
		const bDI = items["b"];
		const tDI = items["t"];
		const rDI = items["r"];
		const lDI = items["l"];

		const xAxis = this.get("xAxis");

		if (bDI && tDI && rDI && lDI) {
			const positionL = xAxis.valueToPosition(lDI.get("valueX", 0));
			const positionR = xAxis.valueToPosition(rDI.get("valueX", 0));

			let mx = this._getXValue(xAxis.positionToValue(positionL + (positionR - positionL) / 2));
			this._setContext(tDI, "valueX", mx);
			this._setContext(bDI, "valueX", mx);

			this._setXLocation(tDI, mx);
			this._setXLocation(bDI, mx);
		}
	}


	protected _handleBulletDragged(event: ISpritePointerEvent) {
		const dataItem = event.target.dataItem as DataItem<IEllipseSeriesDataItem>;

		const valueXReal = dataItem.get("valueX");
		const locationXReal = dataItem.get("locationX");
		const valueYReal = dataItem.get("valueY");

		super._handleBulletDragged(event);

		const movePoint = this._movePointerPoint;
		if (dataItem && movePoint) {
			const dataContext = dataItem.dataContext as any;
			const index = dataContext.index;
			const corner = dataContext.corner;

			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x)));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)), valueX);

			const vx = "valueX"
			const vy = "valueY"
			const vwy = "valueYWorking";

			const items = this._di[index];
			const bDI = items["b"];
			const tDI = items["t"];
			const rDI = items["r"];
			const lDI = items["l"];


			if (bDI && tDI && rDI && lDI) {
				if (corner == "b") {
					const valueY0 = tDI.get(vwy, 0)
					this._setContext(bDI, vy, valueY, true);

					let my = valueY0 + (valueY - valueY0) / 2;

					this._setContext(rDI, vy, my, true);
					this._setContext(lDI, vy, my, true);
					this._setContext(bDI, vx, valueXReal);

					bDI.set("locationX", locationXReal);
				}

				if (corner == "t") {
					const valueY0 = bDI.get(vwy, 0)

					this._setContext(tDI, vy, valueY, true);

					let my = valueY0 + (valueY - valueY0) / 2;

					this._setContext(rDI, vy, my, true);
					this._setContext(lDI, vy, my, true);
					this._setContext(tDI, vx, valueXReal);

					tDI.set("locationX", locationXReal);
				}

				if (corner == "l") {
					const valueX0 = rDI.get(vx, 0)
					const positionX0 = xAxis.valueToPosition(valueX0);
					const positionX = xAxis.valueToPosition(valueX);

					this._setContext(lDI, vx, valueX);
					this._setXLocation(lDI, valueX);

					let mpos = positionX0 + (positionX - positionX0) / 2;
					let mx = this._getXValue(xAxis.positionToValue(mpos));
					this._setContext(tDI, vx, mx);
					this._setContext(bDI, vx, mx);

					this._setXLocation(tDI, mx);
					this._setXLocation(bDI, mx);

					this._setContext(lDI, vy, valueYReal, true);
				}
				if (corner == "r") {
					const valueX0 = lDI.get(vx, 0)
					const positionX0 = xAxis.valueToPosition(valueX0);
					const positionX = xAxis.valueToPosition(valueX);

					this._setContext(rDI, vx, valueX);
					this._setXLocation(rDI, valueX);

					let mpos = positionX0 + (positionX - positionX0) / 2;
					let mx = this._getXValue(xAxis.positionToValue(mpos));

					this._setContext(tDI, vx, mx);
					this._setContext(bDI, vx, mx);

					this._setXLocation(tDI, mx);
					this._setXLocation(bDI, mx);

					this._setContext(rDI, vy, valueYReal, true);
				}
			}

			this._positionBullets(dataItem);
		}
	}

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			super._handlePointerClick(event);

			if (!this._isDragging) {
				if (!this._isDrawing) {
					if (this.unselectAllDrawings() == 0) {
						this._increaseIndex();
						this.isDrawing(true);
						this._hideResizer(event.target);
						this.bulletsContainer.show();
						this._addPoints(event, this._index);
					}
				}
				else {
					this.isDrawing(false);
					this._dispatchStockEvent("drawingadded", this._drawingId, this._index);
				}
			}
		}
	}

	protected _createElements(index: number, dataItem?: DataItem<IDrawingSeriesDataItem>) {
		if (!this._ellipses[index]) {
			const ellipse = this.makeEllipse();
			ellipse._setDataItem(dataItem);
			this._ellipses[index] = ellipse;
			ellipse.setAll({ userData: index });
			(dataItem?.dataContext as any).sprite = ellipse;
		}
	}

	protected _handlePointerMove(event: ISpritePointerEvent) {
		super._handlePointerMove(event);
		if (this._isDrawing) {
			const movePoint = this._movePointerPoint;

			if (movePoint) {

				const xAxis = this.get("xAxis");
				const yAxis = this.get("yAxis");

				const index = this._index;
				const dataItems = this._di[index];

				if (dataItems) {
					const diT = this._di[index]["t"];
					const diB = this._di[index]["b"];
					const diL = this._di[index]["l"];
					const diR = this._di[index]["r"];

					const valueY0 = this._clickVY;

					const positionX = xAxis.coordinateToPosition(movePoint.x);
					const positionX0 = this._clickPX;

					const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(movePoint.x)));
					const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(movePoint.y)), valueX);

					if (diB && diL && diR && diT) {
						this._setContext(diB, "valueY", valueY, true);

						const my = valueY0 + (valueY - valueY0) / 2;
						const mx = this._getXValue(xAxis.positionToValue(positionX0 + (positionX - positionX0) / 2))

						this._setContext(diR, "valueY", my, true);
						this._setContext(diL, "valueY", my, true);

						this._setContext(diB, "valueX", mx);
						this._setContext(diT, "valueX", mx);

						this._setXLocation(diB, mx);
						this._setXLocation(diT, mx);

						this._setContext(diR, "valueX", valueX);
						this._setXLocation(diR, valueX);
					}
				}
			}
		}
	}

	protected _addPoints(event: ISpritePointerEvent, index: number) {
		const chart = this.chart;

		if (chart) {
			this.data.push({ settings: this._getEllipseTemplate(), stroke: this._getStrokeTemplate(), index: index, corner: "e", drawingId: this._drawingId });

			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const point = chart.plotContainer.toLocal(event.point);
			this._clickPX = xAxis.coordinateToPosition(point.x);

			const valueX = this._getXValue(xAxis.positionToValue(this._clickPX));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)), valueX);

			this._clickVY = valueY;

			this._di[index] = {};

			this._addPoint(valueX, valueY, "l", index);
			this._addPoint(valueX, valueY, "t", index);
			this._addPoint(valueX, valueY, "b", index);
			this._addPoint(valueX, valueY, "r", index);
		}
	}

	protected _addPoint(valueX: number, valueY: number, corner: string, index: number) {
		this.data.push({ valueY: valueY, valueX: valueX, index: index, corner: corner, drawingId: this._drawingId });
		const len = this.dataItems.length;
		const dataItem = this.dataItems[len - 1];
		if (dataItem) {
			this._setXLocation(dataItem, valueX);
			this.setPrivate("startIndex", 0);
			this.setPrivate("endIndex", len);
		}
	}

	public _updateChildren() {
		super._updateChildren();

		let index = 0;
		$array.each(this._di, (dataItems) => {
			if (dataItems) {
				const diT = dataItems["t"];
				const diB = dataItems["b"];
				const diL = dataItems["l"];
				const diR = dataItems["r"];
				if (diT && diB && diL && diR) {
					const pt = diT.get("point");
					const pb = diB.get("point");
					const pr = diR.get("point");
					const pl = diL.get("point");

					if (pt && pb && pr && pl) {
						const rx = (pr.x - pl.x) / 2;
						const ry = (pb.y - pt.y) / 2;
						const x = pl.x + rx;
						const y = pt.y + ry;
						const ellipse = this._ellipses[index];
						if (ellipse) {
							ellipse.setAll({ x: x, y: y, radiusX: rx, radiusY: ry });
						}
					}
				}
			}
			index++;
		})
	}

	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const dataContext = dataItem.dataContext as any;
		if (dataContext) {
			const index = dataContext.index;
			const ellipse = this._ellipses[index];
			if (ellipse) {
				delete (this._ellipses[index]);
				this.ellipses.removeValue(ellipse);
				ellipse.dispose();
			}
		}
	}

	protected _getEllipseTemplate(): Template<any> {
		const template = this._getStrokeTemplate();

		const fillColor = this.get("fillColor");
		if (fillColor != null) {
			template.set("fill", fillColor);
		}

		const fillOpacity = this.get("fillOpacity");
		if (fillOpacity != null) {
			template.set("fillOpacity", fillOpacity);
		}

		return template;
	}

	public setInteractive(value: boolean) {
		super.setInteractive(value);
		this.ellipses.template.set("forceInactive", !value);
	}

	public enableDrawingSelection(value: boolean) {
		super.enableDrawingSelection(value);
		this.ellipses.template.set("forceInactive", !value);
	}
}
