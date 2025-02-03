import type { IDisposer } from "../../../core/util/Disposer";
import type { IPoint } from "../../../core/util/IPoint";
import type { Color } from "../../../core/util/Color";
import type { ValueAxis } from "../../xy/axes/ValueAxis";
import type { DateAxis } from "../../xy/axes/DateAxis";
import type { AxisRenderer } from "../../xy/axes/AxisRenderer";
import type { Sprite } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";
import type { XYSeries } from "../../xy/series/XYSeries";
import type { StockChart } from "../StockChart";
import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { Graphics } from "../../../core/render/Graphics";

import { LineSeries, ILineSeriesSettings, ILineSeriesPrivate, ILineSeriesDataItem } from "../../xy/series/LineSeries";
import { Bullet } from "../../../core/render/Bullet";
import { Circle } from "../../../core/render/Circle";
import { Rectangle } from "../../../core/render/Rectangle";
import { Container } from "../../../core/render/Container";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";


import * as $array from "../../../core/util/Array";
import * as $time from "../../../core/util/Time";
import * as $type from "../../../core/util/Type";
import * as $math from "../../../core/util/Math";
import * as $object from "../../../core/util/Object";



export interface IDrawingSeriesDataItem extends ILineSeriesDataItem {

}

export interface IDrawingSeriesSettings extends ILineSeriesSettings {

	/**
	 * X-Axis.
	 */
	xAxis: DateAxis<AxisRenderer>;

	/**
	 * Y-axis.
	 */
	yAxis: ValueAxis<AxisRenderer>;

	/**
	 * Color of the lines/borders.
	 */
	strokeColor?: Color;

	/**
	 * Color of the fills.
	 */
	fillColor?: Color;

	/**
	 * Opacity of the lines/borders (0-1).
	 */
	strokeOpacity?: number;

	/**
	 * Opacity of the fills (0-1).
	 */
	fillOpacity?: number;

	/**
	 * Width of the lines/borders in pixels.
	 */
	strokeWidth?: number;

	/**
	 * Dash information for lines/borders.
	 */
	strokeDasharray?: Array<number>;

	/**
	 * [[XYSeries]] used for drawing.
	 */
	series?: XYSeries;

	/**
	 * Indicates if drawings should snap to x and y values.
	 * @ignore
	 */
	snapToData?: boolean;

	/**
	 * Value field to use when snapping data or calculating averages/regresions/etc.
	 *
	 * @default "value"
	 */
	field?: "open" | "value" | "low" | "high";

	/**
	 * Padding of a selector rectangle (how many pixels will be added to each side around the drawing when it's selected)
	 * @default 5
	 */
	selectorPadding?: number;
}

export interface IDrawingSeriesPrivate extends ILineSeriesPrivate {
	allowChangeSnap?: boolean;
}


export class DrawingSeries extends LineSeries {
	public static className: string = "DrawingSeries";
	public static classNames: Array<string> = LineSeries.classNames.concat([DrawingSeries.className]);

	declare public _settings: IDrawingSeriesSettings;
	declare public _privateSettings: IDrawingSeriesPrivate;
	declare public _dataItemSettings: IDrawingSeriesDataItem;

	protected _clickDp?: IDisposer;
	protected _moveDp?: IDisposer;
	protected _downDp?: IDisposer;
	protected _upDp?: IDisposer;

	protected _drawingEnabled: boolean = false;

	protected _clickPointerPoint?: IPoint;
	protected _movePointerPoint?: IPoint;

	protected _isDrawing: boolean = false;
	protected _isPointerDown: boolean = false;

	public _index: number = 0;
	public _drawingId?: string;

	protected _di: Array<{ [index: string]: DataItem<IDrawingSeriesDataItem> }> = [];

	protected _dragStartPX: number = 0;
	protected _dragStartY: number = 0;

	protected _dvpX: Array<{ [index: string]: number | undefined }> = [];
	protected _dvY: Array<{ [index: string]: number | undefined }> = [];

	protected _isHover: boolean = false;

	protected _erasingEnabled: boolean = false;

	protected _tag?: string;

	protected _movePoint: IPoint = { x: 0, y: 0 };

	protected selectorContainer: Container = this.children.push(Container.new(this.root, {}));

	protected _selected: Array<number> = [];

	protected _isSelecting: boolean = false;

	// point index in segment
	protected _pIndex: number = 0;

	public readonly grips: ListTemplate<Container> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Container._new(this._root, {
			themeTags: ["grip"],
			setStateOnChildren: true,
			draggable: true
		}, [this.grips.template]),
	));

	public readonly circles: ListTemplate<Circle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Circle._new(this._root, {
		}, [this.circles.template]),
	));

	public readonly outerCircles: ListTemplate<Circle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Circle._new(this._root, {
			themeTags: ["outline"]
		}, [this.outerCircles.template]),
	));

	public readonly selectors: ListTemplate<Rectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Rectangle._new(this._root, {
			themeTags: ["selector"]
		}, [this.selectors.template]),
	));

	protected _afterNew() {
		this.addTag("drawing");
		this.setPrivate("allowChangeSnap", true);

		if (this._tag) {
			this.addTag(this._tag);
		}

		this.set("valueYField", "valueY");
		this.set("valueXField", "valueX");

		super._afterNew();

		this.set("connect", false);
		this.set("autoGapCount", Infinity);
		this.set("ignoreMinMax", true);
		this.set("groupDataDisabled", true);

		const strokesTemplate = this.strokes.template;
		strokesTemplate.set("templateField", "stroke");

		const fillsTemplate = this.fills.template;
		fillsTemplate.setAll({ templateField: "fill" });

		fillsTemplate.events.on("pointerdown", (e) => {
			const index = this._getIndex(e.target);
			if (this._erasingEnabled) {
				this._disposeIndex(index);
			}
			else {
				const originalEvent = e.originalEvent as any;
				if (!originalEvent.button && this._drawingEnabled) {
					this._handlePointerDown(e);
				}
			}

			const stroke = this.strokes.getIndex(this._getStrokeIndex(index));
			if (stroke) {
				stroke.dragStart(e);
			}
		})

		fillsTemplate.events.on("dragstart", (e) => {
			this.startDragItem(e, this._getIndex(e.target));
		})

		fillsTemplate.events.on("click", (e) => {
			const index = this._getIndex(e.target);
			const originalEvent = e.originalEvent as any;
			if (!this._isDrawing) {
				this._selectDrawing(index, originalEvent.ctrlKey);
			}
		})

		fillsTemplate.events.on("dragstop", (e) => {
			const index = this._getIndex(e.target);
			this.stopDragItem(e, index);
		})

		fillsTemplate.events.on("pointerover", (e) => {
			const index = this._getIndex(e.target);
			const stroke = this.strokes.getIndex(this._getStrokeIndex(index));
			if (stroke) {
				stroke.hover();
			}
			this._isHover = true;
			this._showSegmentBullets(index);
		})

		fillsTemplate.events.on("pointerout", () => {
			this._isHover = false;
			//this._hideAllBullets();
		})


		strokesTemplate.events.on("pointerdown", (e) => {
			const index = this._getIndex(e.target);

			if (this._erasingEnabled) {
				this._disposeIndex(index);
			}
		})

		strokesTemplate.events.on("click", (e) => {
			const index = this._getIndex(e.target);
			const originalEvent = e.originalEvent as any;
			this._selectDrawing(index, originalEvent.ctrlKey);
		})

		strokesTemplate.events.on("pointerover", (e) => {
			this._isHover = true;
			this._showSegmentBullets(this._getIndex(e.target));
		})

		strokesTemplate.events.on("pointerout", () => {
			this._isHover = false;
			//this._hideAllBullets();
		})

		strokesTemplate.events.on("dragstop", (e) => {
			this.stopDragItem(e, this._getIndex(e.target));
		})

		strokesTemplate.events.on("dragstart", (e) => {
			this.startDragItem(e, this._getIndex(e.target));
		})

		this.bulletsContainer.states.create("hidden", { visible: true, opacity: 0 });

		this.bullets.push((_root, _series, dataItem) => {
			const dataContext = dataItem.dataContext as any;
			const index = dataContext.index;
			const di = this._di[index]["e"] as DataItem<IDrawingSeriesDataItem>;
			let color = this.get("strokeColor", this.get("stroke"));

			if (di) {
				const dc = di.dataContext as any;
				if (dc) {
					const strokeTemplate = dc.stroke;
					if (strokeTemplate) {
						color = strokeTemplate.get("stroke");
					}
				}
			}

			const container = this.grips.make();
			container.setRaw("userData", "grip");
			this.grips.push(container);

			const circle = container.children.push(this.circles.make())
			this.circles.push(circle);
			circle.set("stroke", color);

			const outerCircle = container.children.push(this.outerCircles.make())
			this.outerCircles.push(outerCircle);
			outerCircle.set("stroke", color);

			container.events.on("pointerover", (event) => {
				const dataItem = event.target.dataItem;
				if (dataItem) {
					const dataContext = dataItem.dataContext as any;
					this._showSegmentBullets(dataContext.index);
				}
			})

			//container.events.on("pointerout", () => {
			//	this._hideAllBullets();
			//})

			this._addBulletInteraction(container);
			this._tweakBullet(container, dataItem);

			return Bullet.new(this._root, {
				locationX: undefined,
				sprite: container
			});
		});

		this.events.on("pointerover", () => {
			this._handlePointerOver();
		})

		this.events.on("pointerout", () => {
			this._handlePointerOut();
		})

		this._getStockChart().markDirtyKey("drawingSelectionEnabled");

	}

	/**
	 * Disposes a drawing with the specified index.
	 *
	 * @param  index  Index
	 * @since 5.7.7
	 */
	public disposeIndex(index: number) {
		this._disposeIndex(index);
	}


	/**
	 * Returns index of a drawing with the specific ID, or `null` if not found.
	 *
	 * @param   id  ID
	 * @return      Index
	 * @since 5.8.4
	 */
	public getIndex(id: string): number | null {
		let index = null;
		$array.eachContinue(this.dataItems, (dataItem) => {
			const dataContext = dataItem.dataContext as any;
			if (dataContext.drawingId == id) {
				index = dataContext.index;
				return false;
			}
			else {
				return true;
			}
		})

		return index;
	}

	protected _disposeIndex(index: number) {
		const dataItems = this._di[index];

		if (dataItems) {
			let drawingId!: string;
			let index!: number;

			$object.each(dataItems, (_key, dataItem) => {
				const dataContext = dataItem.dataContext as any;
				this.data.removeValue(dataContext);

				if (dataContext) {
					if (dataContext.drawingId) {
						drawingId = dataContext.drawingId;
					}
					if (dataContext.index) {
						index = dataContext.index;
					}
				}
			})

			for (let i = this.dataItems.length - 1; i >= 0; i--) {
				const dataItem = this.dataItems[i];
				const dataContext = dataItem.dataContext as any;
				if (dataContext.index == index) {
					this.data.removeValue(dataContext);
					this.disposeDataItem(dataItem);
				}
			}

			this._pIndex = 0;
			delete this._di[index];

			this._dispatchStockEvent("drawingremoved", drawingId, index);
		}
		const selector = this._getSprite(this.selectors, index) as Rectangle;
		if (selector) {
			this.selectors.removeValue(selector);
		}

		$array.remove(this._selected, index);
	}

	protected _afterDataChange() {
		$array.each(this.dataItems, (dataItem) => {
			const dataContext = dataItem.dataContext as any;
			const index = dataContext.index;
			const corner = dataContext.corner;

			if (index != undefined) {
				if (this._di[index] == undefined) {
					this._di[index] = {};
				}
				this._createElements(index, dataItem);
				this._di[index][corner] = dataItem;
				this._index = index;
			}
		})
	}

	protected _createElements(_index: number, _dataItem?: DataItem<IDrawingSeriesDataItem>) {

	}

	public _clearDirty(): void {
		super._clearDirty();
		this._isSelecting = false;
	}

	public clearDrawings(): void {
		$array.each(this._di, (_dataItems, index) => {
			this._disposeIndex(index);
		});

		this.data.setAll([]);
		this._index = 0;
		this._selected = [];
	}

	protected _getIndex(sprite: Sprite): number {
		const userData = sprite.get("userData");

		if (userData && userData.length > 0) {
			const dataItem = this.dataItems[userData[0]];

			if (dataItem) {
				const dataContext = dataItem.dataContext as any;

				if (dataContext) {
					return dataContext.index;
				}
			}
		}
		return 0;
	}

	protected _getStrokeIndex(index: number) {
		let i = 0;
		let c = index;
		this.strokes.each((stroke) => {
			const strokeIndex = this._getIndex(stroke);
			if (strokeIndex == index) {
				c = i;
			}
			i++;
		})
		return c;
	}

	public setInteractive(value: boolean) {
		this.strokes.template.set("forceInactive", !value);
		this.fills.template.set("forceInactive", !value);

		//if(value){
		//	this.showAllBullets();
		//}
	}

	public enableDrawingSelection(value: boolean) {
		this._erasingEnabled = false;
		this.strokes.template.set("forceInactive", !value);
		this.fills.template.set("forceInactive", !value);
	}

	protected _showSegmentBullets(index: number) {
		const dataItems = this._di[index];
		if (dataItems) {
			$object.each(dataItems, (_key, dataItem) => {
				const bullets = dataItem.bullets;
				if (bullets) {
					$array.each(bullets, (bullet) => {
						const sprite = bullet.get("sprite");
						if (sprite) {
							sprite.show(0);
						}
					})
				}
			})
		}
	}

	protected _hideResizer(sprite?: Sprite) {
		const spriteResizer = this._getStockChart().spriteResizer;
		if (spriteResizer) {
			const resizerSprite = spriteResizer.get("sprite");
			if (resizerSprite) {
				if (!sprite || sprite.dataItem != resizerSprite.dataItem) {
					spriteResizer.set("sprite", undefined);
				}
			}
		}
	}

	/**
	 * @ignore
	 */
	public startDragItem(event: ISpritePointerEvent, index: number) {
		const stockChart = this._getStockChart();
		if (stockChart) {
			stockChart._dragStartDrawing(event);
		}

		if (this._selected.indexOf(index) == -1) {
			this.unselectAllDrawings();
		}

		this._handleFillDragStart(event, index);
	}

	/**
	 * @ignore
	 */
	public stopDragItem(event: ISpritePointerEvent, index: number) {
		const stockChart = this._getStockChart();
		if (stockChart) {
			stockChart._dragStopDrawing(event);
		}
		this._handleFillDragStop(event, index);
	}

	protected _handleFillDragStart(event: ISpritePointerEvent, index: number) {
		this._hideResizer(event.target);
		this._isPointerDown = false;
		const chart = this.chart;
		if (chart) {
			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const point = chart.plotContainer.toLocal(event.point);

			this._dragStartPX = xAxis.coordinateToPosition(point.x);
			const valueXns = xAxis.positionToValue(this._dragStartPX);
			this._dragStartY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)), valueXns);

			const dataItems = this._di[index];
			this._dvpX[index] = {};
			this._dvY[index] = {};

			if (dataItems) {
				$object.each(dataItems, (key, dataItem) => {
					this._dvpX[index][key] = xAxis.valueToPosition(dataItem.get("valueX", 0));
					this._dvY[index][key] = dataItem.get("valueY");
				})
			}
		}
	}

	public _dragStart(event: ISpritePointerEvent) {
		$array.each(this._selected, (index) => {
			this._handleFillDragStart(event, index);
		})
	}

	public _dragStop(event: ISpritePointerEvent) {
		$array.each(this._selected, (index) => {
			this._handleFillDragStop(event, index);
		})
	}

	protected _handleFillDragStop(event: ISpritePointerEvent, index: number) {
		this._isPointerDown = false;

		const chart = this.chart;
		if (chart) {
			const point = chart.plotContainer.toLocal(event.point);

			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const posX = xAxis.coordinateToPosition(point.x);
			const valueXns = xAxis.positionToValue(xAxis.coordinateToPosition(point.x));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)), valueXns);

			const dpx = posX - this._dragStartPX;
			const dy = valueY - this._dragStartY;

			event.target.setAll({
				x: 0, y: 0
			})

			const dataItems = this._di[index];

			if (dataItems) {
				$object.each(dataItems, (key, dataItem) => {
					const dvpx = this._dvpX[index][key];
					const dvy = this._dvY[index][key];

					if ($type.isNumber(dvpx) && $type.isNumber(dvy)) {
						const vpx = dvpx + dpx;
						const vxns = xAxis.positionToValue(vpx);
						const vx = this._getXValue(vxns);

						let vy = dvy + dy;
						const yAxis = this.get("yAxis");
						const roundTo = yAxis.getPrivate("stepDecimalPlaces", 0) + 1;
						vy = $math.round(vy, roundTo);
						vy = this._getYValue(vy, vxns, true);

						this._setContext(dataItem, "valueX", vx)
						this._setContext(dataItem, "valueY", vy, true);

						this._setXLocation(dataItem, vx);
						this._positionBullets(dataItem);
					}
				})
			}
		}

		const stroke = this.strokes.getIndex(this._getStrokeIndex(index));
		if (stroke) {
			stroke.dragStop(event);
		}

		this.markDirty();
		this._updateSegment(index);
	}

	protected _updateSegment(_index: number) {
		this._updateElements();
	}

	public _updateChildren() {
		this._updateElements();

		if (this.isDirty("strokeColor") || this.isDirty("strokeOpacity") || this.isDirty("strokeDasharray") || this.isDirty("strokeWidth")) {
			$array.each(this._selected, (i) => {

				let settings = {
					stroke: this.get("strokeColor"),
					strokeOpacity: this.get("strokeOpacity"),
					strokeDasharray: this.get("strokeDasharray"),
					strokeWidth: this.get("strokeWidth")
				}

				const stroke = this.strokes.getIndex(this._getStrokeIndex(i));
				if (stroke) {
					let strokeTemplate: Template<any>;
					$array.each(this.dataItems, (dataItem) => {
						const dataContext = dataItem.dataContext as any;
						if (dataContext.index == i) {
							if (dataContext.stroke) {
								strokeTemplate = dataContext.stroke;
							}
						}
					})

					const defaultState = stroke.states.lookup("default")!;
					$object.each(settings, (key, value) => {
						stroke.set(key, value);
						defaultState.set(key, value);
						if (strokeTemplate) {
							strokeTemplate.set(key, value);
						}
					})
				}

				this.circles.each((circle) => {
					const dataItem = circle.dataItem;
					if (dataItem) {
						const dataContext = dataItem.dataContext as any;
						if (dataContext) {
							if (dataContext.index == i) {
								circle.set("stroke", settings.stroke)
								circle.states.lookup("default")!.set("stroke", settings.stroke);
							}
						}
					}
				})

				this.outerCircles.each((circle) => {
					const dataItem = circle.dataItem;
					if (dataItem) {
						const dataContext = dataItem.dataContext as any;
						if (dataContext) {
							if (dataContext.index == i) {
								circle.set("stroke", settings.stroke)
								circle.states.lookup("default")!.set("stroke", settings.stroke);
							}
						}
					}
				})


				this._applySettings(i, settings);
			})
		}

		if (this.isDirty("fillColor") || this.isDirty("fillOpacity")) {
			$array.each(this._selected, (i) => {
				const fill = this.fills.getIndex(this._getStrokeIndex(i));

				let settings = {
					fill: this.get("fillColor"),
					fillOpacity: this.get("fillOpacity")
				}

				if (fill) {
					let fillTemplate: Template<any>;
					$array.each(this.dataItems, (dataItem) => {
						const dataContext = dataItem.dataContext as any;
						if (dataContext.index == i) {
							if (dataContext.fill) {
								fillTemplate = dataContext.fill;
							}
						}
					})

					const defaultState = fill.states.lookup("default")!;
					$object.each(settings, (key, value) => {
						fill.set(key, value);
						defaultState.set(key, value);
						if (fillTemplate) {
							fillTemplate.set(key, value);
						}
					})
				}

				this._applySettings(i, settings);
			})
		}

		if (this._valuesDirty) {
			this.markDirtyDrawings();
		}

		super._updateChildren();
		this._updateSelectors();
	}


	/**
	 * @ignore
	 */
	public isDrawing(value: boolean) {
		this._isDrawing = value;
		const stockChart = this._getStockChart();
		if (stockChart) {
			if (value) {
				stockChart._selectionWasOn = stockChart.get("drawingSelectionEnabled", false);
				stockChart.set("drawingSelectionEnabled", false);
			}
		}
	}

	protected _applySettings(_index: number, _settings?: { [index: string]: any }) {
		this.markDirtyDrawings();
	}

	protected _updateElements() {

	}

	public markDirtyDrawings() {
		const stockChart = this._getStockChart();
		if (stockChart) {
			stockChart.markDirtyDrawings();
		}
	}

	protected _getFillTemplate(): Template<any> {
		const fillTemplate: any = {};

		const fillColor = this.get("fillColor");
		if (fillColor != null) {
			fillTemplate.fill = fillColor;
		}

		const fillOpacity = this.get("fillOpacity");
		if (fillOpacity != null) {
			fillTemplate.fillOpacity = fillOpacity;
		}

		return Template.new(fillTemplate);
	}

	protected _getStrokeTemplate(): Template<any> {
		const strokeTemplate: any = {};

		const strokeColor = this.get("strokeColor");
		if (strokeColor != null) {
			strokeTemplate.stroke = strokeColor;
		}

		const strokeOpacity = this.get("strokeOpacity");
		if (strokeOpacity != null) {
			strokeTemplate.strokeOpacity = strokeOpacity;
		}

		const strokeDasharray = this.get("strokeDasharray");
		if (strokeDasharray != null) {
			strokeTemplate.strokeDasharray = strokeDasharray;
		}

		const strokeWidth = this.get("strokeWidth");
		if (strokeWidth != null) {
			strokeTemplate.strokeWidth = strokeWidth;
		}

		return Template.new(strokeTemplate);
	}

	protected _tweakBullet(_container: Container, _dataItem: DataItem<IDrawingSeriesDataItem>) {

	}

	protected _dispatchStockEvent(type: any, drawingId?: string, index?: number) {
		const stockChart = this._getStockChart();

		if (type == "drawingadded") {
			if (stockChart._selectionWasOn) {
				stockChart.set("drawingSelectionEnabled", true);
			}
		}

		if (stockChart && stockChart.events.isEnabled(type)) {
			stockChart.events.dispatch(type, { drawingId: drawingId, series: this, target: stockChart, index: index });
		}
	}

	protected _addBulletInteraction(sprite: Sprite) {
		sprite.events.on("dragged", (e) => {
			this._handleBulletDragged(e);
			this._isDragging = true;
		})

		sprite.events.on("dragstart", (e) => {
			this._handleBulletDragStart(e);
		})

		sprite.events.on("dragstop", (e) => {
			this._handleBulletDragStop(e);
			this.setTimeout(() => {
				this._isDragging = false;
			}, 100)
		})

		sprite.events.on("click", (e) => {
			const dataItem = e.target.dataItem;
			if (dataItem) {
				const dataContext = dataItem.dataContext as any;
				if (this._erasingEnabled) {
					if (dataContext) {
						this._disposeIndex(dataContext.index);
					}
				}
				else {
					if (!this._isDrawing) {
						this._selectDrawing(dataContext.index, (e.originalEvent as any).ctrlKey);
					}
					else {
						this._handlePointerClick(e);
					}
				}
			}
		})
	}

	public _increaseIndex() {
		this._index++;
		this._drawingId = this._generateId();
	}

	public _generateId(): string {
		return "" + new Date().getTime() + Math.round(Math.random() * 10000 + 10000);
	}

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			const chart = this.chart;
			if (chart) {
				this._clickPointerPoint = chart.plotContainer.toLocal(event.point)
			}
		}
	}

	// need this in order bullets not to be placed to the charts bullets container
	public _placeBulletsContainer() {
		this.children.moveValue(this.bulletsContainer);
		this.enableDrawing();
		this.disableDrawing();
	}

	protected _handleBulletDragged(event: ISpritePointerEvent) {
		const dataItem = event.target.dataItem as DataItem<this["_dataItemSettings"]>;

		const chart = this.chart;
		if (chart) {
			const target = event.target;
			const point = { x: target.x(), y: target.y() };
			this._handleBulletDraggedReal(dataItem, point);
		}

		const dataContext = dataItem.dataContext as any;
		if (dataContext) {
			const index = dataContext.index;
			this._updateSegment(index);
		}
	}

	protected _handleBulletDraggedReal(dataItem: DataItem<this["_dataItemSettings"]>, point: IPoint) {
		const xAxis = this.get("xAxis");
		const yAxis = this.get("yAxis");

		const valueXns = xAxis.positionToValue(xAxis.coordinateToPosition(point.x));
		const valueX = this._getXValue(valueXns);
		const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)), valueXns);

		this._setContext(dataItem, "valueX", valueX);
		this._setContext(dataItem, "valueY", valueY, true);
		this._setXLocation(dataItem, valueX);

		this._positionBullets(dataItem);
	}

	protected _handleBulletDragStart(_event: ISpritePointerEvent) {
		this._hideResizer();
		this.unselectAllDrawings();
	}

	protected _handleBulletDragStop(_event: ISpritePointerEvent) {

	}

	protected _handlePointerOver() {

	}

	protected _handlePointerOut() {

	}

	public enableDrawing() {
		const chart = this.chart;
		this._erasingEnabled = false;
		this._drawingEnabled = true;
		if (chart) {
			if (!this._clickDp) {
				this._clickDp = chart.plotContainer.events.on("click", (e) => {
					const originalEvent = e.originalEvent as any;
					if (!originalEvent.button && !this._erasingEnabled) {
						this._handlePointerClick(e);
					}
				})
			}

			if (!this._downDp) {
				this._downDp = chart.plotContainer.events.on("pointerdown", (e) => {
					const originalEvent = e.originalEvent as any;
					if (!originalEvent.button && !this._erasingEnabled) {
						this._handlePointerDown(e);
					}
				})
			}

			if (!this._upDp) {
				this._upDp = chart.plotContainer.events.on("globalpointerup", (e) => {
					const originalEvent = e.originalEvent as any;
					if (!originalEvent.button && !this._erasingEnabled) {
						this._handlePointerUp(e);
					}
				})
			}

			if (!this._moveDp) {
				this._moveDp = chart.plotContainer.events.on("globalpointermove", (e) => {
					if (!this._erasingEnabled) {
						if (e.point.x != this._movePoint.x || e.point.y != this._movePoint.y) {
							this._handlePointerMove(e);
						}
					}
				})
			}
		}
	}

	public enableErasing() {
		this._erasingEnabled = true;
		this.setInteractive(true);
	}

	public disableErasing() {
		this._erasingEnabled = false;
		if (!this._getStockChart().get("drawingSelectionEnabled")) {
			this.setInteractive(false);
		}
	}

	public disableDrawing() {
		this._erasingEnabled = false;
		this._drawingEnabled = false;
		this.isDrawing(false);

		if (this._clickDp) {
			this._clickDp.dispose();
			this._clickDp = undefined;
		}

		if (this._downDp) {
			this._downDp.dispose();
			this._downDp = undefined;
		}

		if (this._upDp) {
			this._upDp.dispose();
			this._upDp = undefined;
		}
	}

	public toggleDrawing(enabled?: boolean) {
		if(this._getStockChart().get("hideDrawingGrips")){
			this.circles.getIndex(0)?.markDirty();
			this.root.events.once("frameended", () => {
				this.circles.each((circle) => {
					circle.set("forceHidden", !enabled);
				})
				this.grips.each((grip) => {
					grip.set("forceInactive", !enabled);
				})				
			})
		}
	}

	protected _handlePointerMove(event: ISpritePointerEvent) {
		const chart = this.chart;
		if (chart) {
			this._movePointerPoint = chart.plotContainer.toLocal(event.point)
		}
	}

	protected _handlePointerDown(_event: ISpritePointerEvent) {
		this._isPointerDown = true;
	}

	protected _handlePointerUp(_event: ISpritePointerEvent) {
		this._isPointerDown = false;
	}

	public startIndex(): number {
		return 0;
	}

	public endIndex(): number {
		return this.dataItems.length;
	}

	protected _setXLocation(dataItem: DataItem<this["_dataItemSettings"]>, value: number) {
		if (!this.get("snapToData")) {
			this._setXLocationReal(dataItem, value);
		}
		else {
			dataItem.set("locationX", undefined);
		}
	}

	protected _setXLocationReal(dataItem: DataItem<this["_dataItemSettings"]>, value: number) {
		const xAxis = this.get("xAxis");
		const baseInterval = xAxis.getPrivate("baseInterval");
		const root = this._root;
		const firstDayOfWeek = root.locale.firstDayOfWeek;
		const open = $time.round(new Date(value), baseInterval.timeUnit, baseInterval.count, firstDayOfWeek, root.utc, undefined, root.timezone).getTime();
		let close = open + $time.getDuration(baseInterval.timeUnit, baseInterval.count * 1.05);
		close = $time.round(new Date(close), baseInterval.timeUnit, baseInterval.count, firstDayOfWeek, root.utc, undefined, root.timezone).getTime();
		const locationX = (value - open) / (close - open);
		dataItem.set("locationX", locationX);
	}

	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const dataContext = dataItem.dataContext as any;
		if (dataContext) {
			const index = dataContext.index;

			this.markDirtyValues();

			const dataItems = this._di[index];

			if (dataItems) {
				$object.each(dataItems, (_key, dataItem) => {
					super.disposeDataItem(dataItem);
				})
			}
			delete this._di[index];
		}
	}


	protected _getYValue(value: number, valueX: number, doNotConvert?: boolean): number {

		const series = this.get("series");

		if (this.get("snapToData") && series) {
			const field = this.get("field", "value") + "Y";
			return this._snap(valueX, value, field, series);
		}
		else {
			if (!doNotConvert && this.get("valueYShow") == "valueYChangeSelectionPercent") {
				const baseValueSeries = this.getPrivate("baseValueSeries");
				if (baseValueSeries) {
					const baseValue = baseValueSeries._getBase("valueY");
					value = value / 100 * baseValue + baseValue;
				}
			}
			const yAxis = this.get("yAxis");
			const roundTo = yAxis.getPrivate("stepDecimalPlaces", 0) + 1;
			return $math.round(value, roundTo);
		}
	}

	protected _getXValue(value: number): number {
		const series = this.get("series");
		if (this.get("snapToData") && series) {

			const xAxis = this.get("xAxis");

			const min = xAxis.getPrivate("min", 0) + 1;
			const max = xAxis.getPrivate("max", 1) - 1;

			value = $math.fitToRange(value, min, max);
			value = this._snap(value, value, "valueX", series) + 1; // important!
			return value
		}
		else {
			return Math.round(value);
		}
	}

	public _setContext(dataItem: DataItem<IDrawingSeriesDataItem>, key: any, value: any, working?: boolean) {
		dataItem.set(key, value);
		if (working) {
			dataItem.set(key + "Working" as any, value);
		}
		const dataContext = dataItem.dataContext as any;

		const field = this.get(key + "Field" as any);
		if (field) {
			dataContext[field] = value;
		}
	}

	protected _snap(value: number, realValue: number, key: string, series: XYSeries): number {
		const xAxis = this.get("xAxis");
		const dataItem = xAxis.getSeriesItem(series, Math.max(0, xAxis.valueToPosition(value)), 0.5, true);
		if (dataItem) {
			return dataItem.get(key as any)!;
		}
		return realValue;
	}

	protected _getStockChart(): StockChart {
		return (this.get("series") as any).chart.getPrivate("stockChart");
	}


	protected _getSprite(sprites: ListTemplate<any>, index: number): Graphics | undefined {
		for (let i = 0, len = sprites.length; i < len; i++) {
			let sprite = sprites.getIndex(i);
			if (sprite && sprite.get("userData") == index) {
				return sprite;
			}
		}
	}


	public _selectDrawing(index: number, keepSelection?: boolean, force?: boolean) {
		if (this._getStockChart().get("drawingSelectionEnabled") || force) {

			this._isSelecting = true;

			if (this._selected.indexOf(index) != -1) {
				if (!keepSelection) {
					this.unselectAllDrawings();
				}
				else {
					this._unselectDrawing(index);
				}
			}
			else {
				if (!keepSelection) {
					this._hideResizer();
					this.unselectAllDrawings();
				}
				let selector = this._getSprite(this.selectors, index);
				if (!selector) {
					selector = this.selectorContainer.children.push(this.selectors.make() as Rectangle);
					this.selectors.push(selector as Rectangle);
				}

				selector.show(0);

				selector.set("userData", index);
				$array.move(this._selected, index);

				this._dispatchStockEvent("drawingselected", this.indexToDrawingId(index), index);
				this.markDirty();
			}
		}
	}

	protected _unselectDrawing(index: number) {
		const selector = this._getSprite(this.selectors, index);
		if (selector) {
			selector.hide(0);
			$array.remove(this._selected, index);
			this._dispatchStockEvent("drawingunselected", this.indexToDrawingId(index), index);
		}
	}

	protected _updateSelectors() {
		this.selectors.each((selector) => {
			const index = selector.get("userData")
			this._updateSelector(selector, index);
		})
	}

	protected _updateSelector(selector: Graphics, index: number) {
		let l!: number;
		let r!: number;
		let t!: number;
		let b!: number;

		const selectorPadding = this.get("selectorPadding", 5);

		$array.each(this.dataItems, (dataItem) => {
			const dataContext = dataItem.dataContext as any;
			if (dataContext) {
				if (dataContext.index == index) {
					let point = dataItem.get("point");
					if (point) {
						if (l == null) {
							l = point.x;
						}
						l = Math.min(l, point.x);

						if (r == null) {
							r = point.x;
						}
						r = Math.max(r, point.x);

						if (t == null) {
							t = point.y;
						}
						t = Math.min(t, point.y);

						if (b == null) {
							b = point.y;
						}
						b = Math.max(b, point.y);
					}
				}
			}
		})

		if (r != null && l != null && t != null && b != null) {
			selector.setAll({
				width: r - l + selectorPadding * 2,
				height: b - t + selectorPadding * 2,
				x: l - selectorPadding,
				y: t - selectorPadding
			})
		}
	}

	/**
	 *
	 * @param index returns drawingId
	 * @returns
	 */
	public indexToDrawingId(index: number): string | undefined {
		let id: string | undefined;
		$array.eachContinue(this.dataItems, (dataItem) => {
			const dataContext = dataItem.dataContext as any;
			if (dataContext.index == index) {
				id = dataContext.drawingId;
				return false;
			}
			return true;
		})
		return id;
	}

	protected _getContext(index: number): any {
		let context: any;
		$array.eachContinue(this.dataItems, (dataItem) => {
			const dataContext = dataItem.dataContext as any;
			if (dataContext.index == index && dataContext.sprite) {
				context = dataContext;
				return false;
			}
			return true;
		})
		return context;
	}

	public getContext(id: string) {
		const index = this.getIndex(id);
		if (index != null) {
			return this._getContext(index);
		}
	}

	/**
	 * Unselects all currently selected drawings on this series.
	 *
	 * @since 5.9.0
	 */
	public unselectAllDrawings(): number {
		const chart = this._getStockChart();
		if (chart) {
			return chart.unselectDrawings();
		}
		return 0;
	}

	/**
	 * Unselects all currently selected drawings of this series.
	 *
	 * @since 5.9.0
	 */
	public unselectDrawings(): number {
		let count = 0;
		for (let i = this._selected.length - 1; i >= 0; i--) {
			this._unselectDrawing(this._selected[i]);
			count++;
		}
		return count;
	}

	/**
	 * Selects series' drawing by its ID.
	 *
	 * @param  id             Drawing ID
	 * @param  keepSelection  Keep existing selections
	 * @since 5.9.0
	 */
	public selectDrawing(id: string, keepSelection?: boolean) {
		const index = this.getIndex(id);
		if (index != null) {
			this._selectDrawing(index, keepSelection);
		}
	}

	/**
	 * Unselects series' drawing by its ID.
	 *
	 * @param  id  Drawing ID
	 * @since 5.9.0
	 */
	public unselectDrawing(id: string) {
		const index = this.getIndex(id);
		if (index != null) {
			this._unselectDrawing(index);
		}
	}

	/**
	 * Deletes all currently selected drawings on this series.
	 *
	 * @since 5.9.0
	 */
	public deleteSelected() {
		for (let i = this._selected.length - 1; i >= 0; i--) {
			this.disposeIndex(this._selected[i]);
		}
	}

	/**
	 * Deletes a series' drawing by ids ID.
	 *
	 * @param  id  Drawing ID
	 * @since 5.9.0
	 */
	public deleteDrawing(id: string) {
		const index = this.getIndex(id);
		if (index != null) {
			this.disposeIndex(index);
		}
	}

	/**
	 * Cancels current drawing
	 *
	 * @since 5.9.0
	 */
	public cancelDrawing() {
		if (this._isDrawing) {
			this._disposeIndex(this._index);
		}

		this.isDrawing(false);
	}
}
