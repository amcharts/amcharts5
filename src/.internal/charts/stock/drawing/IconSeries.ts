import type { Percent } from "../../../core/util/Percent";
import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";

import { PolylineSeries, IPolylineSeriesSettings, IPolylineSeriesPrivate, IPolylineSeriesDataItem } from "./PolylineSeries";
import { Bullet } from "../../../core/render/Bullet";
import { Graphics } from "../../../core/render/Graphics";
import { SpriteResizer } from "../../../core/render/SpriteResizer";

export interface IIconSeriesDataItem extends IPolylineSeriesDataItem {
	/**
	 * @todo review
	 */	
	svgPath: string;
	/**
	 * @todo review
	 */	
	snapToData?: boolean;
}

export interface IIconSeriesSettings extends IPolylineSeriesSettings {
	/**
	 * @todo review
	 */	
	iconSvgPath: string;
	/**
	 * @todo review
	 */	
	iconScale?: number;
	/**
	 * @todo review
	 */	
	iconCenterX?: Percent;
	/**
	 * @todo review
	 */	
	iconCenterY?: Percent;
	/**
	 * @todo review
	 */	
	snapToData?: boolean;
}

export interface IIconSeriesPrivate extends IPolylineSeriesPrivate {
}

export class IconSeries extends PolylineSeries {
	public static className: string = "IconSeries";
	public static classNames: Array<string> = PolylineSeries.classNames.concat([IconSeries.className]);

	declare public _settings: IIconSeriesSettings;
	declare public _privateSettings: IIconSeriesPrivate;
	declare public _dataItemSettings: IIconSeriesDataItem;

	public spriteResizer = this.children.push(SpriteResizer.new(this._root, {}));

	protected _tag = "icon";

	protected _afterNew() {
		super._afterNew();

		this.bullets.clear();

		this.strokes.template.set("visible", false);
		this.fills.template.set("visible", false);

		this.bullets.push(() => {
			const color = this.get("fillColor", this.get("fill"));
			const strokeColor = this.get("strokeColor", this.get("stroke"));

			const sprite = Graphics.new(this._root, {
				draggable: true,
				svgPath: this.get("iconSvgPath"),
				scale: this.get("iconScale", 1),
				themeTags: ["icon"],
				fill: color,
				stroke: strokeColor,
				fillOpacity: this.get("fillOpacity", 1),
				strokeOpacity: this.get("strokeOpacity", 1)
			});

			const iconCenterX = this.get("iconCenterX");
			if (iconCenterX != null) {
				sprite.set("centerX", iconCenterX)
			}

			const iconCenterY = this.get("iconCenterY");
			if (iconCenterY != null) {
				sprite.set("centerY", iconCenterY)
			}

			this._addBulletInteraction(sprite);

			sprite.events.on("click", () => {
				this.spriteResizer.set("sprite", sprite);
			})

			sprite.events.on("pointerover", () => {
				this._isHover = true;
			})

			sprite.events.on("pointerout", () => {
				this._isHover = false;
			})

			this.spriteResizer.set("sprite", undefined);

			return Bullet.new(this._root, {
				locationX: undefined,
				sprite: sprite
			})
		})
	}

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (!this._isHover) {
			super._handlePointerClick(event);
			this._index++;
			this._di[this._index] = {};
		}
	}

	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		this.spriteResizer.set("sprite", undefined);
		this._isHover = false;
	}

	protected _hideAllBullets() {

	}

	protected _setXLocation(dataItem: DataItem<this["_dataItemSettings"]>, value: number) {
		if(!this.get("snapToData")){
			this._setXLocationReal(dataItem, value);
		}		
	}
}