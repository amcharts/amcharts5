import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import { DrawingSeries, IDrawingSeriesSettings, IDrawingSeriesPrivate, IDrawingSeriesDataItem } from "./DrawingSeries";
import { color } from "../../../core/util/Color";

export interface IDoodleSeriesDataItem extends IDrawingSeriesDataItem {
}

export interface IDoodleSeriesSettings extends IDrawingSeriesSettings {
}

export interface IDoodleSeriesPrivate extends IDrawingSeriesPrivate {
}

export class DoodleSeries extends DrawingSeries {
	public static className: string = "DoodleSeries";
	public static classNames: Array<string> = DrawingSeries.classNames.concat([DoodleSeries.className]);

	declare public _settings: IDoodleSeriesSettings;
	declare public _privateSettings: IDoodleSeriesPrivate;
	declare public _dataItemSettings: IDoodleSeriesDataItem;

	protected _panX?: boolean;
	protected _panY?: boolean;

	// point index in segment
	protected _pIndex: number = 0;

	protected _tag = "doodle";

	protected _down: boolean = false;

	protected _afterNew() {
		super._afterNew();
		this.setPrivate("allowChangeSnap", false);
		this.bullets.clear();

		this.strokes.template.setAll({
			fill: color(0xffffff),
			fillOpacity: 0
		})
	}

	protected _handlePointerMove(event: ISpritePointerEvent) {
		super._handlePointerMove(event);

		if (this._drawingEnabled && this._isPointerDown) {
			this._handleBulletPosition(event);
		}
	}

	protected _handleBulletPosition(event: ISpritePointerEvent) {
		const chart = this.chart;
		if (chart) {
			const xAxis = this.get("xAxis");
			const yAxis = this.get("yAxis");

			const point = chart.plotContainer.toLocal(event.point);

			const valueX = this._getXValue(xAxis.positionToValue(xAxis.coordinateToPosition(point.x)));
			const valueY = this._getYValue(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)), valueX);

			const index = this._index;
			this.data.push({ valueY: valueY, valueX: valueX, index: index, corner: this._pIndex, drawingId: this._drawingId });
			const len = this.dataItems.length;

			const dataItem = this.dataItems[len - 1];
			this._setXLocation(dataItem, valueX);

			this._pIndex++;

			this.setPrivate("startIndex", 0);
			this.setPrivate("endIndex", len);
		}
	}

	protected _handlePointerDown(event: ISpritePointerEvent) {
		
		const chart = this.chart;
		if (chart) {			
			if (this.unselectAllDrawings() == 0) {
				super._handlePointerDown(event);
				this._increaseIndex();
				this._pIndex = 0;

				this._panX = chart.get("panX");
				this._panY = chart.get("panY");

				chart.set("panX", false);
				chart.set("panY", false);

				const cursor = chart.get("cursor");
				if (cursor) {
					cursor.setPrivate("visible", false);
				}

				this._down = true;

				this.data.push({ stroke: this._getStrokeTemplate(), sprite: this.mainContainer, index: this._index, corner: this._pIndex, drawingId: this._drawingId });
			}
		}
	}

	protected _handlePointerUp(event: ISpritePointerEvent) {
		super._handlePointerUp(event);
		const chart = this.chart;
		if (chart && this._down) {
			this._down = false;
			this.setTimeout(() => {
				chart.set("panX", this._panX);
				chart.set("panY", this._panY);
				const cursor = chart.get("cursor");
				if (cursor) {
					cursor.setPrivate("visible", true);
				}
			}, 100)

			this._dispatchStockEvent("drawingadded", this._drawingId, this._index);
		}
	}
}