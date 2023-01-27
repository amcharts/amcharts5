import type { Percent } from "../../../core/util/Percent";
import type { ISpritePointerEvent } from "../../../core/render/Sprite";
import type { DataItem } from "../../../core/render/Component";

import { PolylineSeries, IPolylineSeriesSettings, IPolylineSeriesPrivate, IPolylineSeriesDataItem } from "./PolylineSeries";
import { Bullet } from "../../../core/render/Bullet";
import { Graphics } from "../../../core/render/Graphics";
import { SpriteResizer } from "../../../core/render/SpriteResizer";
import { Template } from "../../../core/util/Template";

export interface IIconSeriesDataItem extends IPolylineSeriesDataItem {

	/**
	 * An SVG path of the icon.
	 */
	svgPath: string;
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
	 * Should icon snap to closest data item?
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

		this.bullets.push((root, _series, dataItem) => {
			const dataContext = dataItem.dataContext as any;
			const template = dataContext.settings;
			const sprite = Graphics.new(root, {
				draggable: true,
				themeTags: ["icon"]
			}, template);

			this._addBulletInteraction(sprite);

			sprite.events.on("click", () => {
				const spriteResizer = this.spriteResizer;
				if (spriteResizer.get("sprite") == sprite) {
					spriteResizer.set("sprite", undefined);
				}
				else {
					spriteResizer.set("sprite", sprite);
				}
			})

			sprite.events.on("pointerover", () => {
				this._isHover = true;
			})

			sprite.events.on("pointerout", () => {
				this._isHover = false;
			})

			this.spriteResizer.set("sprite", undefined);

			sprite.on("scale", (scale) => {
				template.set("scale", scale)
			})

			sprite.on("rotation", (rotation) => {
				template.set("rotation", rotation)
			})

			return Bullet.new(this._root, {
				locationX: undefined,
				sprite: sprite
			})
		})
	}

	protected _handlePointerClick(event: ISpritePointerEvent) {
		if (this._drawingEnabled) {
			if (!this._isHover) {
				super._handlePointerClick(event);

				const dataObject = this.data.getIndex(this.data.length - 1) as any;
				dataObject.settings = this._getIconTemplate();

				this._index++;
				this._di[this._index] = {};
			}
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
		if (!this.get("snapToData")) {
			this._setXLocationReal(dataItem, value);
		}
	}

	protected _getIconTemplate(): Template<any> {
		const template: any = {};

		const iconSvgPath = this.get("iconSvgPath");
		if (iconSvgPath != null) {
			template.svgPath = iconSvgPath;
		}

		const iconScale = this.get("iconScale");
		if (iconScale != null) {
			template.scale = iconScale;
		}

		const iconCenterX = this.get("iconCenterX");
		if (iconCenterX != null) {
			template.centerX = iconCenterX;
		}

		const iconCenterY = this.get("iconCenterY");
		if (iconCenterY != null) {
			template.centerY = iconCenterY;
		}

		const strokeColor = this.get("strokeColor");
		if (strokeColor != null) {
			template.stroke = strokeColor;
		}

		const strokeOpacity = this.get("strokeOpacity");
		if (strokeOpacity != null) {
			template.strokeOpacity = strokeOpacity;
		}

		const fillColor = this.get("fillColor");
		if (fillColor != null) {
			template.fill = fillColor;
		}

		const fillOpacity = this.get("fillOpacity");
		if (fillOpacity != null) {
			template.fillOpacity = fillOpacity;
		}

		return Template.new(template);
	}
}